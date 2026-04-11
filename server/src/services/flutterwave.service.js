const crypto = require('crypto');
const { env } = require('../config/env');

const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

const ensureFlutterwaveKey = () => {
  if (!env.FLUTTERWAVE_SECRET_KEY) {
    throw new Error('FLUTTERWAVE_SECRET_KEY is not configured');
  }
};

const flutterwaveRequest = async (path, options = {}) => {
  ensureFlutterwaveKey();

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.status === 'error') {
    throw new Error(payload?.message || 'Flutterwave request failed');
  }

  return payload;
};

const createFlutterwavePayment = async ({
  txRef,
  amount,
  currency,
  redirectUrl,
  customer,
  title,
  description,
  paymentOptions,
  meta = {},
}) =>
  flutterwaveRequest('/payments', {
    method: 'POST',
    body: JSON.stringify({
      tx_ref: txRef,
      amount,
      currency,
      redirect_url: redirectUrl,
      payment_options: paymentOptions,
      customer,
      customizations: {
        title,
        description,
      },
      meta,
    }),
  });

const chargeUgandaMobileMoney = async ({
  txRef,
  amount,
  currency,
  email,
  phoneNumber,
  fullname,
  network,
  meta = {},
}) =>
  flutterwaveRequest('/charges?type=mobile_money_uganda', {
    method: 'POST',
    body: JSON.stringify({
      tx_ref: txRef,
      amount,
      currency,
      email,
      phone_number: phoneNumber,
      fullname,
      network,
      meta,
    }),
  });

const verifyFlutterwaveTransaction = async ({ transactionId, txRef }) => {
  if (transactionId) {
    return flutterwaveRequest(`/transactions/${transactionId}/verify`, {
      method: 'GET',
    });
  }

  if (txRef) {
    return flutterwaveRequest(`/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`, {
      method: 'GET',
    });
  }

  throw new Error('Flutterwave verification requires transactionId or txRef');
};

const generateTxRef = (prefix = 'ad-order') =>
  `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

const isValidFlutterwaveWebhook = (rawBody, headers = {}) => {
  const secret = env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;
  if (!secret) return true;

  const verifHash = headers['verif-hash'] || headers['Verif-Hash'];
  if (verifHash && verifHash === secret) return true;

  const signature = headers['flutterwave-signature'];
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return signature === expectedSignature;
};

module.exports = {
  createFlutterwavePayment,
  chargeUgandaMobileMoney,
  verifyFlutterwaveTransaction,
  generateTxRef,
  isValidFlutterwaveWebhook,
};
