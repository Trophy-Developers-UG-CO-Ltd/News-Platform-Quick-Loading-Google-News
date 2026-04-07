/**
 * Inquiry Service
 * Business logic for quote requests and inquiry management
 * Includes email notifications for inquiry lifecycle
 * @module modules/inquiries/inquiry.service
 */

const Inquiry = require('./inquiry.model');
const AuditService = require('../audit/audit.service');
const { ApiError } = require('../../middlewares/error.middleware');
const { paginate, paginationMeta, buildSort } = require('../../utils/helpers');
const { sendInquiryConfirmation, sendInquiryNotificationToAdmin, sendInquiryStatusUpdate } = require('../../utils/email');

class InquiryService {
  /**
   * Create a new inquiry / quote request
   */
  static async createInquiry(userId, userData, inquiryData, req) {
    const inquiry = await Inquiry.create({
      user: userId,
      companyName: userData.companyName || 'Individual',
      contactName: userData.name,
      contactEmail: userData.email,
      contactPhone: inquiryData.contactPhone || userData.phone,
      items: inquiryData.items,
      message: inquiryData.message || '',
      industry: inquiryData.industry || null,
      deliveryDestination: inquiryData.deliveryDestination || null,
      requiredByDate: inquiryData.requiredByDate || null,
      paymentTerms: inquiryData.paymentTerms || null,
      budgetRange: inquiryData.budgetRange || null,
      statusHistory: [
        {
          status: 'new',
          changedBy: userId,
          note: 'Inquiry submitted',
        },
      ],
    });

    // Audit
    AuditService.log({
      action: 'INQUIRY_CREATE',
      req,
      targetModel: 'Inquiry',
      targetId: inquiry._id,
      targetIdentifier: inquiry.inquiryNumber,
      metadata: { itemCount: inquiry.items.length, companyName: inquiry.companyName },
    });

    // Fire-and-forget email notifications
    sendInquiryConfirmation(inquiry).catch(() => {});
    sendInquiryNotificationToAdmin(inquiry).catch(() => {});

    return inquiry;
  }

  /**
   * Get user's own inquiries
   */
  static async getUserInquiries(userId, query = {}) {
    const { page, limit, skip } = paginate(query.page, query.limit);
    const sort = query.sort ? buildSort(query.sort, []) : { createdAt: -1 };

    const filter = { user: userId };
    if (query.status) filter.status = query.status;

    const [inquiries, total] = await Promise.all([
      Inquiry.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Inquiry.countDocuments(filter),
    ]);

    return { inquiries, pagination: paginationMeta(total, page, limit) };
  }

  /**
   * Get all inquiries (admin)
   */
  static async getAllInquiries(query = {}) {
    const { page, limit, skip } = paginate(query.page, query.limit);
    const sort = query.sort ? buildSort(query.sort, []) : { createdAt: -1 };

    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.companyName) {
      filter.companyName = { $regex: query.companyName, $options: 'i' };
    }

    const [inquiries, total] = await Promise.all([
      Inquiry.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email companyName')
        .populate('items.product', 'title slug')
        .populate('assignedTo', 'name email')
        .lean(),
      Inquiry.countDocuments(filter),
    ]);

    return { inquiries, pagination: paginationMeta(total, page, limit) };
  }

  /**
   * Get single inquiry by ID
   */
  static async getInquiryById(inquiryId, userId = null, isAdmin = false) {
    const filter = { _id: inquiryId };
    if (!isAdmin) filter.user = userId;

    const inquiry = await Inquiry.findOne(filter)
      .populate('user', 'name email companyName companyType phone')
      .populate('items.product', 'title slug price images')
      .populate('assignedTo', 'name email')
      .populate('statusHistory.changedBy', 'name email')
      .lean();

    if (!inquiry) {
      throw new ApiError('Inquiry not found', 404);
    }

    return inquiry;
  }

  /**
   * Update inquiry status (admin)
   */
  static async updateInquiryStatus(inquiryId, updateData, adminUser, req) {
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) throw new ApiError('Inquiry not found', 404);

    const previousStatus = inquiry.status;

    // Enforce allowed status transitions
    const ALLOWED_TRANSITIONS = {
      new: ['reviewing', 'rejected'],
      reviewing: ['quoted', 'rejected'],
      quoted: ['accepted', 'rejected', 'expired'],
      accepted: [],
      rejected: [],
      expired: [],
    };
    const allowed = ALLOWED_TRANSITIONS[previousStatus] || [];
    if (!allowed.includes(updateData.status)) {
      throw new ApiError(
        `Cannot transition from '${previousStatus}' to '${updateData.status}'. Allowed: [${allowed.join(', ') || 'none'}]`,
        422,
      );
    }

    inquiry.status = updateData.status;

    if (updateData.adminNotes) inquiry.adminNotes = updateData.adminNotes;
    if (updateData.quotedAmount !== undefined) inquiry.quotedAmount = updateData.quotedAmount;
    if (updateData.validUntil) inquiry.validUntil = updateData.validUntil;

    if (updateData.status === 'quoted' && !inquiry.quotedAt) {
      inquiry.quotedAt = new Date();
    }

    inquiry.statusHistory.push({
      status: updateData.status,
      changedBy: adminUser._id,
      note: updateData.note || `Status changed from ${previousStatus} to ${updateData.status}`,
    });

    await inquiry.save();

    // Audit
    AuditService.log({
      action: 'INQUIRY_UPDATE',
      req,
      targetModel: 'Inquiry',
      targetId: inquiry._id,
      targetIdentifier: inquiry.inquiryNumber,
      changes: { before: { status: previousStatus }, after: { status: updateData.status } },
      metadata: { quotedAmount: updateData.quotedAmount },
    });

    // Notify customer of status change via email
    sendInquiryStatusUpdate(inquiry, updateData.status, updateData.note || '').catch(() => {});

    return inquiry;
  }

  /**
   * Get inquiry statistics
   */
  static async getInquiryStats() {
    const stats = await Inquiry.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalQuotedAmount: {
            $sum: { $cond: [{ $ne: ['$quotedAmount', null] }, '$quotedAmount', 0] },
          },
        },
      },
    ]);

    const totalInquiries = await Inquiry.countDocuments();
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const thisMonthCount = await Inquiry.countDocuments({ createdAt: { $gte: thisMonth } });

    return { byStatus: stats, totalInquiries, thisMonthCount };
  }

  /**
   * Export inquiries as CSV data
   */
  static async exportInquiriesCSV(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    const inquiries = await Inquiry.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .lean();

    // Build CSV
    const headers = [
      'Inquiry Number',
      'Date',
      'Company',
      'Contact Name',
      'Contact Email',
      'Phone',
      'Status',
      'Items Count',
      'Quoted Amount',
      'Industry',
      'Message',
    ];

    const rows = inquiries.map((inq) => [
      inq.inquiryNumber,
      new Date(inq.createdAt).toISOString().split('T')[0],
      inq.companyName,
      inq.contactName,
      inq.contactEmail,
      inq.contactPhone || '',
      inq.status,
      inq.items.length,
      inq.quotedAmount || '',
      inq.industry || '',
      `"${(inq.message || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csv;
  }
}

module.exports = InquiryService;

// MukonoTalks

