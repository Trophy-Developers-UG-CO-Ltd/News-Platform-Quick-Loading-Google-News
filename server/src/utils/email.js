/**
 * Enterprise Email Service
 * Transactional email delivery with templates
 * Uses nodemailer with SMTP transport
 * @module utils/email
 */

const nodemailer = require('nodemailer');
const { env } = require('../config/env');
const logger = require('./logger');

// ─── Transport Configuration ────────────────────────────────────
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn('Email service not configured — SMTP_HOST/SMTP_USER/SMTP_PASS missing');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT, 10) || 587,
    secure: parseInt(env.SMTP_PORT, 10) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 10, // 10 messages per second max
  });

  transporter.verify((error) => {
    if (error) {
      logger.error('Email transport verification failed:', error.message);
    } else {
      logger.info('Email service ready');
    }
  });

  return transporter;
};

// ─── Email Templates ────────────────────────────────────────────

const brandHeader = `
  <div style="background-color:#1a1a2e;padding:24px;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:24px;">
      Mukono<span style="color:#f59e0b;">Talks</span>
    </h1>
    <p style="color:#94a3b8;margin:4px 0 0;font-size:13px;">Local News, Entertainment & Community Updates</p>
  </div>
`;

const brandFooter = `
  <div style="background-color:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#64748b;font-size:12px;margin:0;">
      &copy; ${new Date().getFullYear()} MukonoTalks. All rights reserved.<br/>
      Uganda, Kenya, Tanzania<br/>
      <a href="mailto:info@mukonotalks.ug" style="color:#2563eb;">info@mukonotalks.ug</a>
    </p>
  </div>
`;

const wrapTemplate = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f1f5f9;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    ${brandHeader}
    <div style="padding:32px 24px;">${content}</div>
    ${brandFooter}
  </div>
</body>
</html>
`;

// ─── Send Generic Email ─────────────────────────────────────────

/**
 * Send an email (fire-and-forget safe)
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} [options.text] - Plain text fallback
 * @param {string} [options.replyTo] - Reply-to address
 */
const sendEmail = async ({ to, subject, html, text, replyTo }) => {
  try {
    const transport = getTransporter();
    if (!transport) {
      logger.warn(`Email skipped (no transport): ${subject} → ${to}`);
      return { success: false, reason: 'transport_not_configured' };
    }

    const fromEmail = env.FROM_EMAIL || env.SMTP_USER;

    const mailOptions = {
      from: `"${env.FROM_NAME}" <${fromEmail}>`,
      to,
      subject,
      html: wrapTemplate(html),
      text: text || subject,
    };

    if (replyTo) mailOptions.replyTo = replyTo;

    const info = await transport.sendMail(mailOptions);
    logger.info(`Email sent: ${subject} → ${to} [${info.messageId}]`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Email failed: ${subject} → ${to}: ${error.message}`);
    return { success: false, reason: error.message };
  }
};

// ─── Specific Email Functions ───────────────────────────────────

/**
 * Send inquiry/RFQ confirmation to customer
 */
const sendInquiryConfirmation = async (inquiry) => {
  const itemRows = inquiry.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${item.title}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${item.notes || '—'}</td>
        </tr>`
    )
    .join('');

  const html = `
    <h2 style="color:#1e293b;margin:0 0 16px;">Quote Request Received</h2>
    <p style="color:#475569;">Dear ${inquiry.contactName},</p>
    <p style="color:#475569;">Thank you for your inquiry. Your quote request <strong>${inquiry.inquiryNumber}</strong> has been received and our team will review it shortly.</p>
    
    <div style="background-color:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;">
      <h3 style="color:#1e293b;margin:0 0 12px;">Request Details</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background-color:#e2e8f0;">
            <th style="padding:8px;text-align:left;">Product</th>
            <th style="padding:8px;text-align:center;">Qty</th>
            <th style="padding:8px;text-align:left;">Notes</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>
    
    ${inquiry.message ? `<p style="color:#475569;"><strong>Your Message:</strong> ${inquiry.message}</p>` : ''}
    
    <p style="color:#475569;">We typically respond within 24-48 business hours. For urgent inquiries, please contact us directly.</p>
    
    <div style="text-align:center;margin:24px 0;">
      <a href="${env.CLIENT_URL}/en/dashboard" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;">Track Your Inquiry</a>
    </div>
  `;

  return sendEmail({
    to: inquiry.contactEmail,
    subject: `Quote Request ${inquiry.inquiryNumber} — MukonoTalks`,
    html,
  });
};

/**
 * Send inquiry notification to admin/sales team
 */
const sendInquiryNotificationToAdmin = async (inquiry) => {
  const adminEmail = env.CONTACT_EMAIL || env.SALES_EMAIL || env.FROM_EMAIL;

  const html = `
    <h2 style="color:#1e293b;margin:0 0 16px;">New Quote Request</h2>
    <p style="color:#475569;">A new inquiry has been submitted and requires review.</p>
    
    <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0;">
      <strong>Inquiry:</strong> ${inquiry.inquiryNumber}<br/>
      <strong>Company:</strong> ${inquiry.companyName}<br/>
      <strong>Contact:</strong> ${inquiry.contactName} (${inquiry.contactEmail})<br/>
      <strong>Phone:</strong> ${inquiry.contactPhone || 'Not provided'}<br/>
      <strong>Industry:</strong> ${inquiry.industry || 'Not specified'}<br/>
      <strong>Items:</strong> ${inquiry.items.length} product(s)
    </div>
    
    ${inquiry.message ? `<p style="color:#475569;"><strong>Message:</strong> ${inquiry.message}</p>` : ''}
    
    <div style="text-align:center;margin:24px 0;">
      <a href="${env.CLIENT_URL}/admin/inquiries" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;">Review in Admin</a>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `[NEW RFQ] ${inquiry.inquiryNumber} — ${inquiry.companyName}`,
    html,
    replyTo: inquiry.contactEmail,
  });
};

/**
 * Send inquiry status update to customer
 */
const sendInquiryStatusUpdate = async (inquiry, newStatus, note) => {
  const statusLabels = {
    reviewing: 'Under Review',
    quoted: 'Quote Ready',
    accepted: 'Accepted',
    rejected: 'Declined',
    expired: 'Expired',
  };

  const statusColors = {
    reviewing: '#3b82f6',
    quoted: '#10b981',
    accepted: '#059669',
    rejected: '#ef4444',
    expired: '#6b7280',
  };

  const html = `
    <h2 style="color:#1e293b;margin:0 0 16px;">Inquiry Status Update</h2>
    <p style="color:#475569;">Dear ${inquiry.contactName},</p>
    <p style="color:#475569;">Your inquiry <strong>${inquiry.inquiryNumber}</strong> has been updated.</p>
    
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;background-color:${statusColors[newStatus] || '#6b7280'};color:#ffffff;padding:8px 24px;border-radius:20px;font-weight:600;font-size:16px;">
        ${statusLabels[newStatus] || newStatus}
      </span>
    </div>
    
    ${inquiry.quotedAmount ? `
      <div style="background-color:#ecfdf5;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
        <p style="color:#065f46;margin:0;font-size:14px;">Quoted Amount</p>
        <p style="color:#059669;margin:4px 0 0;font-size:28px;font-weight:700;">$${inquiry.quotedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        ${inquiry.validUntil ? `<p style="color:#065f46;margin:4px 0 0;font-size:12px;">Valid until ${new Date(inquiry.validUntil).toLocaleDateString('en-ZA')}</p>` : ''}
      </div>
    ` : ''}
    
    ${note ? `<p style="color:#475569;"><strong>Note:</strong> ${note}</p>` : ''}
    
    <div style="text-align:center;margin:24px 0;">
      <a href="${env.CLIENT_URL}/en/dashboard" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;">View Details</a>
    </div>
  `;

  return sendEmail({
    to: inquiry.contactEmail,
    subject: `Inquiry ${inquiry.inquiryNumber} — ${statusLabels[newStatus] || 'Updated'}`,
    html,
  });
};

/**
 * Send order confirmation email
 */
const sendOrderConfirmation = async (order, user) => {
  const itemRows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${item.title}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">$${item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        </tr>`
    )
    .join('');

  const html = `
    <h2 style="color:#1e293b;margin:0 0 16px;">Order Confirmation</h2>
    <p style="color:#475569;">Dear ${user.name},</p>
    <p style="color:#475569;">Thank you for your order! Here's your confirmation:</p>
    
    <div style="background-color:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
      <p style="margin:4px 0 0;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-ZA')}</p>
    </div>
    
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
      <thead>
        <tr style="background-color:#e2e8f0;">
          <th style="padding:8px;text-align:left;">Product</th>
          <th style="padding:8px;text-align:center;">Qty</th>
          <th style="padding:8px;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:12px 8px;text-align:right;font-weight:700;">Order Total:</td>
          <td style="padding:12px 8px;text-align:right;font-weight:700;color:#059669;">$${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tfoot>
    </table>
    
    <div style="text-align:center;margin:24px 0;">
      <a href="${env.CLIENT_URL}/en/orders/${order._id}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;">View Order</a>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `Order Confirmed: ${order.orderNumber} — MukonoTalks`,
    html,
  });
};

/**
 * Send welcome email after registration
 */
const sendWelcomeEmail = async (user) => {
  const html = `
    <h2 style="color:#1e293b;margin:0 0 16px;">Welcome to MukonoTalks!</h2>
    <p style="color:#475569;">Dear ${user.name},</p>
    <p style="color:#475569;">Thank you for creating an account. You now have access to:</p>
    
    <ul style="color:#475569;line-height:1.8;">
      <li>Browse our full catalogue of industrial chemicals and coatings</li>
      <li>Request competitive B2B quotes</li>
      <li>Track your orders and inquiries</li>
      <li>Access technical data sheets and safety documents</li>
    </ul>
    
    <div style="text-align:center;margin:24px 0;">
      <a href="${env.CLIENT_URL}/en/products" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;">Browse Products</a>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to MukonoTalks',
    html,
  });
};

module.exports = {
  sendEmail,
  sendInquiryConfirmation,
  sendInquiryNotificationToAdmin,
  sendInquiryStatusUpdate,
  sendOrderConfirmation,
  sendWelcomeEmail,
};

// MukonoTalks

