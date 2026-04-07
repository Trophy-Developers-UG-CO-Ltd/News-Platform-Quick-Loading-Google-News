/**
 * Contact Controller
 * Handles public contact form submissions
 * Saves messages to DB and optionally notifies admin via email
 * @module modules/contact/contact.controller
 */

const ContactMessage = require('./contact.model');
const { sendEmail } = require('../../utils/email');
const { env } = require('../../config/env');
const logger = require('../../utils/logger');
const { paginate, paginationMeta } = require('../../utils/helpers');

const CONTACT_STATUSES = ['new', 'read', 'replied', 'finished', 'trashed'];

/**
 * POST /api/contact
 * Public — no authentication required
 */
const submitContactMessage = async (req, res) => {
  try {
    const { name, email, phone, company, subject, message } = req.body;
    const adminRecipient = env.CONTACT_EMAIL || env.SALES_EMAIL || env.FROM_EMAIL;

    // Save to database
    const contact = await ContactMessage.create({
      name,
      email,
      phone: phone || null,
      company: company || null,
      subject,
      message,
      ipAddress: req.ip || null,
    });

    // Fire-and-forget admin notification email
    if (adminRecipient) {
      sendEmail({
        to: adminRecipient,
        subject: `New Contact Message: ${subject}`,
        replyTo: email,
        html: `
          <h2 style="color:#1e293b;margin:0 0 16px;">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
            <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;width:30%;">Name</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${name}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;">Email</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;"><a href="mailto:${email}" style="color:#2563eb;">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;">Phone</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${phone}</td></tr>` : ''}
            ${company ? `<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;">Company</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${company}</td></tr>` : ''}
            <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:600;">Subject</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${subject}</td></tr>
          </table>
          <div style="background-color:#f8fafc;border-radius:8px;padding:16px;">
            <h3 style="color:#1e293b;margin:0 0 8px;font-size:14px;">Message</h3>
            <p style="color:#475569;font-size:14px;white-space:pre-wrap;margin:0;">${message}</p>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin-top:16px;">Reference ID: ${contact._id}</p>
        `,
      }).catch(() => {}); // swallow email errors — DB record is the source of truth
    }

    // Confirmation email to sender
    sendEmail({
      to: email,
      subject: 'We received your message — MukonoTalks',
      html: `
        <h2 style="color:#1e293b;margin:0 0 16px;">Thank You, ${name}!</h2>
        <p style="color:#475569;">We have received your message and will get back to you within 1–2 business days.</p>
        <div style="background-color:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="color:#64748b;font-size:13px;margin:0;"><strong>Your subject:</strong> ${subject}</p>
        </div>
        <p style="color:#475569;">If your enquiry is urgent, please call us directly or use the live chat on our website.</p>
      `,
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Your message has been received. We will be in touch shortly.',
    });
  } catch (error) {
    logger.error('Contact form submission error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit your message. Please try again.',
    });
  }
};

/**
 * GET /api/contact/admin/all
 * Admin — list contact form submissions
 */
const getAllContactMessages = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    } else {
      filter.status = { $ne: 'trashed' };
    }

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { subject: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [messages, total] = await Promise.all([
      ContactMessage.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ContactMessage.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        messages,
        pagination: paginationMeta(total, page, limit),
      },
    });
  } catch (error) {
    logger.error('Contact messages fetch error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch contact messages.',
    });
  }
};

/**
 * PATCH /api/contact/admin/:id/status
 * Admin — update contact message workflow status
 */
const updateContactMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!CONTACT_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact message status.',
      });
    }

    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).lean();

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found.',
      });
    }

    return res.json({
      success: true,
      message: 'Contact message updated successfully.',
      data: message,
    });
  } catch (error) {
    logger.error('Contact message status update error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update contact message.',
    });
  }
};

/**
 * DELETE /api/contact/admin/:id
 * Admin — soft delete contact message to trash
 */
const trashContactMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status: 'trashed' },
      { new: true }
    ).lean();

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found.',
      });
    }

    return res.json({
      success: true,
      message: 'Contact message moved to trash.',
      data: message,
    });
  } catch (error) {
    logger.error('Contact message trash error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to move contact message to trash.',
    });
  }
};

/**
 * DELETE /api/contact/admin/:id/permanent
 * Admin — permanently delete a trashed contact message
 */
const permanentlyDeleteContactMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id).lean();

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found.',
      });
    }

    if (message.status !== 'trashed') {
      return res.status(400).json({
        success: false,
        message: 'Only trashed contact messages can be permanently deleted.',
      });
    }

    await ContactMessage.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'Contact message permanently deleted.',
    });
  } catch (error) {
    logger.error('Contact message permanent delete error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to permanently delete contact message.',
    });
  }
};

module.exports = {
  submitContactMessage,
  getAllContactMessages,
  updateContactMessageStatus,
  trashContactMessage,
  permanentlyDeleteContactMessage,
};

// MukonoTalks

