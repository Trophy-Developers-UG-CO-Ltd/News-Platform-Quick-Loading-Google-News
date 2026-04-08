/**
 * Advertise inquiry notification service
 * Sends optional webhook notifications for newly created advertise inquiries
 * @module services/advertiseNotification.service
 */

const { env } = require('../config/env');
const logger = require('../utils/logger');

const normalizePhone = (value) => String(value || '').replace(/\D/g, '');

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');

const buildLeadReplyText = (inquiry) => {
  const recipient = inquiry?.name ? `Hi ${inquiry.name},` : 'Hi,';
  return `${recipient} thanks for your interest in advertising on MukonoTalks. We received your inquiry and will follow up shortly.`;
};

const buildAdminSummary = (inquiry, adminUrl) => {
  const parts = [
    'New MukonoTalks advertise inquiry received.',
    `Phone: ${inquiry.phone}`,
    `Business: ${inquiry.business || 'Not provided'}`,
    `Budget: ${inquiry.budgetRange || 'Not provided'}`,
    `Message: ${inquiry.message}`,
    `Review: ${adminUrl}`,
  ];

  return parts.join(' | ');
};

const sendAdvertiseInquiryNotification = async (inquiry) => {
  const webhookUrl = env.ADVERTISE_INQUIRY_WEBHOOK_URL;

  if (!webhookUrl) {
    return false;
  }

  const clientBaseUrl = trimTrailingSlash(env.CLIENT_URL || 'https://www.mukonotalks.ug');
  const adminReviewUrl = `${clientBaseUrl}/admin/advertise-inquiries`;
  const normalizedLeadPhone = normalizePhone(inquiry.phone);
  const leadReplyText = buildLeadReplyText(inquiry);
  const leadWhatsAppUrl = normalizedLeadPhone
    ? `https://wa.me/${normalizedLeadPhone}?text=${encodeURIComponent(leadReplyText)}`
    : null;

  const payload = {
    event: 'advertise_inquiry.created',
    source: 'mukonotalks',
    sentAt: new Date().toISOString(),
    inquiry: {
      id: String(inquiry._id),
      name: inquiry.name || null,
      phone: inquiry.phone,
      business: inquiry.business || null,
      budgetRange: inquiry.budgetRange || null,
      message: inquiry.message,
      status: inquiry.status,
      createdAt: inquiry.createdAt,
    },
    delivery: {
      channel: 'webhook',
      adminNotificationPhone: env.ADVERTISE_INQUIRY_NOTIFICATION_PHONE || null,
    },
    links: {
      adminReviewUrl,
      leadWhatsAppUrl,
    },
    messages: {
      adminSummary: buildAdminSummary(inquiry, adminReviewUrl),
      leadReplyDraft: leadReplyText,
    },
  };

  const headers = {
    'Content-Type': 'application/json',
  };

  if (env.ADVERTISE_INQUIRY_WEBHOOK_TOKEN) {
    headers.Authorization = `Bearer ${env.ADVERTISE_INQUIRY_WEBHOOK_TOKEN}`;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => '');
      logger.warn(`Advertise inquiry webhook failed: ${response.status} ${response.statusText} ${responseText}`);
      return false;
    }

    logger.info(`Advertise inquiry webhook delivered for inquiry ${String(inquiry._id)}`);
    return true;
  } catch (error) {
    logger.warn(`Advertise inquiry webhook error: ${error.message}`);
    return false;
  }
};

module.exports = {
  sendAdvertiseInquiryNotification,
};

// MukonoTalks