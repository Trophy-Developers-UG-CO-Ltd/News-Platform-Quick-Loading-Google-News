/**
 * Advertise Inquiry Controller
 * Handles public advertising lead capture and admin management
 * @module modules/advertise-inquiries/advertiseInquiry.controller
 */

const AdvertiseInquiry = require('./advertiseInquiry.model');
const logger = require('../../utils/logger');
const { paginate, paginationMeta } = require('../../utils/helpers');
const { sendAdvertiseInquiryNotification } = require('../../services/advertiseNotification.service');

const ALLOWED_STATUSES = ['new', 'contacted', 'closed'];

/**
 * POST /api/advertise
 * Public endpoint for ad inquiry submission
 */
const submitAdvertiseInquiry = async (req, res) => {
  try {
    const {
      name,
      phone,
      business,
      budgetRange,
      message,
    } = req.body || {};

    if (!phone || !String(phone).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required.',
      });
    }

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required.',
      });
    }

    const inquiry = await AdvertiseInquiry.create({
      name: name ? String(name).trim() : null,
      phone: String(phone).trim(),
      business: business ? String(business).trim() : null,
      budgetRange: budgetRange ? String(budgetRange).trim() : null,
      message: String(message).trim(),
      ipAddress: req.ip || null,
    });

    sendAdvertiseInquiryNotification(inquiry).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Inquiry sent successfully.',
      data: {
        id: inquiry._id,
        status: inquiry.status,
        createdAt: inquiry.createdAt,
      },
    });
  } catch (error) {
    logger.error('Advertise inquiry submission error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit inquiry. Please try again.',
    });
  }
};

/**
 * GET /api/advertise/admin/all
 * Admin endpoint for listing ad inquiries
 */
const getAllAdvertiseInquiries = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);

    const filter = {};

    if (req.query.status && ALLOWED_STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }

    if (req.query.search) {
      const value = String(req.query.search).trim();
      filter.$or = [
        { name: { $regex: value, $options: 'i' } },
        { phone: { $regex: value, $options: 'i' } },
        { business: { $regex: value, $options: 'i' } },
        { message: { $regex: value, $options: 'i' } },
      ];
    }

    const [inquiries, total] = await Promise.all([
      AdvertiseInquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AdvertiseInquiry.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        inquiries,
        pagination: paginationMeta(total, page, limit),
      },
    });
  } catch (error) {
    logger.error('Advertise inquiries fetch error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiries.',
    });
  }
};

/**
 * GET /api/advertise/admin/:id
 * Admin endpoint for inquiry details
 */
const getAdvertiseInquiryById = async (req, res) => {
  try {
    const inquiry = await AdvertiseInquiry.findById(req.params.id).lean();

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found.',
      });
    }

    return res.json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    logger.error('Advertise inquiry details fetch error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiry details.',
    });
  }
};

/**
 * PATCH /api/advertise/admin/:id/status
 * Admin endpoint for workflow status updates
 */
const updateAdvertiseInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body || {};

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inquiry status.',
      });
    }

    const inquiry = await AdvertiseInquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).lean();

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found.',
      });
    }

    return res.json({
      success: true,
      message: 'Inquiry status updated successfully.',
      data: inquiry,
    });
  } catch (error) {
    logger.error('Advertise inquiry status update error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update inquiry status.',
    });
  }
};

module.exports = {
  submitAdvertiseInquiry,
  getAllAdvertiseInquiries,
  getAdvertiseInquiryById,
  updateAdvertiseInquiryStatus,
};

// MukonoTalks
