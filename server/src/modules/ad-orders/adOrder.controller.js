const AdOrder = require('./adOrder.model');
const { getStripe } = require('../../config/stripe');
const { env } = require('../../config/env');
const {
  createFlutterwavePayment,
  chargeUgandaMobileMoney,
  verifyFlutterwaveTransaction,
  generateTxRef,
  isValidFlutterwaveWebhook,
} = require('../../services/flutterwave.service');

const SLOT_CONFIG = {
  news_top: {
    label: 'News Top Feature',
    cpmUsd: 14,
    minBudgetUsd: 35,
    defaultCta: 'Read more',
  },
  news_in_feed: {
    label: 'News Feed Sponsored Card',
    cpmUsd: 12,
    minBudgetUsd: 25,
    defaultCta: 'Discover',
  },
  article_inline: {
    label: 'Article Inline Spotlight',
    cpmUsd: 16,
    minBudgetUsd: 40,
    defaultCta: 'Visit sponsor',
  },
  article_footer: {
    label: 'Article Footer Follow-up',
    cpmUsd: 10,
    minBudgetUsd: 25,
    defaultCta: 'Learn more',
  },
  hero: {
    label: 'Hero Spotlight',
    cpmUsd: 20,
    minBudgetUsd: 60,
    defaultCta: 'Explore',
  },
  sidebar: {
    label: 'Sidebar Sponsored Card',
    cpmUsd: 9,
    minBudgetUsd: 20,
    defaultCta: 'Learn more',
  },
  inline: {
    label: 'Inline Sponsored Card',
    cpmUsd: 12,
    minBudgetUsd: 25,
    defaultCta: 'Learn more',
  },
};

const PAYMENT_METHODS = {
  mtn_momo: {
    label: 'MTN Mobile Money',
    provider: 'flutterwave',
    currency: 'UGX',
    requiresPhone: true,
    description: 'Collect payment from an MTN MoMo line in Uganda.',
    network: 'MTN',
    kind: 'mobile_money',
  },
  airtel_money: {
    label: 'Airtel Mobile Money',
    provider: 'flutterwave',
    currency: 'UGX',
    requiresPhone: true,
    description: 'Collect payment from an Airtel Money line in Uganda.',
    network: 'AIRTEL',
    kind: 'mobile_money',
  },
  flutterwave: {
    label: 'Flutterwave',
    provider: 'flutterwave',
    currency: 'UGX',
    requiresPhone: false,
    description: 'Hosted checkout with card, bank transfer, and Uganda mobile money options.',
    paymentOptions: 'card,mobilemoneyuganda,banktransfer',
    kind: 'hosted_checkout',
  },
  stripe: {
    label: 'Stripe',
    provider: 'stripe',
    currency: 'USD',
    requiresPhone: false,
    description: 'Hosted card checkout through Stripe.',
    kind: 'hosted_checkout',
  },
};
const PAYMENT_METHOD_ORDER = ['mtn_momo', 'airtel_money', 'stripe', 'flutterwave'];

const ACTIVE_STATUSES = ['active', 'approved'];
const DEFAULT_USD_TO_UGX_RATE = Number.isFinite(env.ADS_USD_TO_UGX_RATE) && env.ADS_USD_TO_UGX_RATE > 0
  ? env.ADS_USD_TO_UGX_RATE
  : 3800;

const normalizeSlot = (slot = '') => String(slot).trim().toLowerCase();
const normalizePaymentMethod = (value = '') => String(value).trim().toLowerCase();
const normalizePhone = (value = '') => String(value).replace(/[^\d+]/g, '');
const getSlotConfig = (slot) => SLOT_CONFIG[normalizeSlot(slot)] || null;
const getPaymentMethodConfig = (paymentMethod) => PAYMENT_METHODS[normalizePaymentMethod(paymentMethod)] || null;

const isValidAbsoluteUrl = (value = '') => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const toDisplayBudget = (budgetUsd, paymentConfig) =>
  paymentConfig?.currency === 'UGX'
    ? Math.ceil(Number(budgetUsd) * DEFAULT_USD_TO_UGX_RATE)
    : Number(budgetUsd);

const toBudgetUsd = (displayBudget, paymentConfig) =>
  paymentConfig?.currency === 'UGX'
    ? Number(displayBudget) / DEFAULT_USD_TO_UGX_RATE
    : Number(displayBudget);

const calculatePurchasedImpressions = (budgetUsd, slotConfig) => {
  const cpm = slotConfig?.cpmUsd || 10;
  const impressions = Math.floor((Number(budgetUsd) / cpm) * 1000);
  return Math.max(1000, impressions);
};

const serializePublicAd = (order) => ({
  _id: order._id,
  businessName: order.businessName,
  clientName: order.clientName,
  headline: order.headline || order.businessName || order.clientName,
  description: order.description || '',
  ctaLabel: order.ctaLabel || 'Learn more',
  adImage: order.adImage,
  targetUrl: order.targetUrl,
  slot: order.slot,
});

const baseClientUrl = () => (env.CLIENT_URL || 'https://mukonotalks.ug').replace(/\/+$/, '');

const verifyAmountAndCurrency = (order, payment) => {
  const amount = Number(payment?.amount);
  const currency = String(payment?.currency || '').toUpperCase();

  return (
    Number.isFinite(amount) &&
    currency === String(order.currency || '').toUpperCase() &&
    amount + 0.01 >= Number(order.budget || 0)
  );
};

const markOrderActiveIfPaid = async (session) => {
  const orderId = session?.metadata?.adOrderId;
  if (!orderId) return null;

  const order = await AdOrder.findById(orderId);
  if (!order) return null;

  order.checkoutSessionId = session.id || order.checkoutSessionId;

  if (session.payment_status === 'paid') {
    order.paymentStatus = 'paid';
    if (order.status !== 'completed') {
      order.status = 'active';
    }
    if (!order.paidAt) order.paidAt = new Date();
    if (!order.startAt) order.startAt = new Date();
    order.stripePaymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || order.stripePaymentIntentId;
  } else if (order.paymentStatus !== 'paid') {
    order.paymentStatus = 'pending';
  }

  await order.save();
  return order;
};

const markOrderPaymentPending = async (session) => {
  const orderId = session?.metadata?.adOrderId;
  if (!orderId) return null;

  return AdOrder.findByIdAndUpdate(
    orderId,
    {
      checkoutSessionId: session.id || '',
      status: 'pending_payment',
      paymentStatus: 'pending',
    },
    { new: true }
  );
};

const markOrderPaymentFailed = async (session) => {
  const orderId = session?.metadata?.adOrderId;
  if (!orderId) return null;

  return AdOrder.findByIdAndUpdate(
    orderId,
    {
      checkoutSessionId: session.id || '',
      status: 'paused',
      paymentStatus: 'failed',
    },
    { new: true }
  );
};

const markOrderActiveFromFlutterwave = async (verificationPayload) => {
  const payment = verificationPayload?.data || {};
  const txRef = payment.tx_ref || payment.txRef;
  if (!txRef) return null;

  const order = await AdOrder.findOne({ paymentReference: txRef });
  if (!order) return null;

  const successful = payment.status === 'successful' && verifyAmountAndCurrency(order, payment);

  if (!successful) {
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = payment.status === 'failed' ? 'failed' : 'pending';
      order.status = payment.status === 'failed' ? 'paused' : 'pending_payment';
      await order.save();
    }
    return order;
  }

  order.paymentStatus = 'paid';
  if (order.status !== 'completed') {
    order.status = 'active';
  }
  if (!order.paidAt) order.paidAt = new Date();
  if (!order.startAt) order.startAt = new Date();
  order.providerTransactionId = String(payment.id || order.providerTransactionId || '');
  await order.save();
  return order;
};

const buildCheckoutResponse = (order, checkoutUrl, extra = {}) => ({
  success: true,
  data: {
    orderId: order._id,
    checkoutUrl,
    paymentMethod: order.paymentMethod,
    paymentProvider: order.paymentProvider,
    currency: order.currency,
    budget: order.budget,
    impressionsPurchased: order.impressionsPurchased,
    ...extra,
  },
});

// POST /api/v1/ad-orders/checkout
exports.createCheckoutSession = async (req, res) => {
  try {
    const {
      clientName,
      businessName,
      email,
      phone,
      headline,
      description,
      ctaLabel,
      adImage,
      targetUrl,
      slot,
      budget,
      notes,
      paymentMethod = 'stripe',
    } = req.body;

    const normalizedSlot = normalizeSlot(slot);
    const slotConfig = getSlotConfig(normalizedSlot);
    const paymentConfig = getPaymentMethodConfig(paymentMethod);
    const numericBudget = Number(budget);
    const normalizedPhone = normalizePhone(phone);

    if (
      !clientName || !email || !adImage || !targetUrl || !slotConfig || !paymentConfig ||
      !Number.isFinite(numericBudget)
    ) {
      return res.status(400).json({ success: false, message: 'Missing or invalid campaign fields.' });
    }

    if (!isValidAbsoluteUrl(adImage) || !isValidAbsoluteUrl(targetUrl)) {
      return res.status(400).json({ success: false, message: 'Ad image and target URL must be valid absolute URLs.' });
    }

    if (paymentConfig.requiresPhone && !normalizedPhone) {
      return res.status(400).json({ success: false, message: 'A valid phone number is required for mobile money payments.' });
    }

    const minimumDisplayBudget = toDisplayBudget(slotConfig.minBudgetUsd, paymentConfig);
    if (numericBudget < minimumDisplayBudget) {
      return res.status(400).json({
        success: false,
        message: `Minimum budget for ${slotConfig.label} via ${paymentConfig.label} is ${paymentConfig.currency} ${minimumDisplayBudget.toLocaleString()}.`,
      });
    }

    const budgetUsd = toBudgetUsd(numericBudget, paymentConfig);
    const impressionsPurchased = calculatePurchasedImpressions(budgetUsd, slotConfig);
    const txRef = generateTxRef('ad-order');

    const adOrder = await AdOrder.create({
      clientName: clientName.trim(),
      businessName: businessName?.trim() || '',
      email: email.trim(),
      phone: normalizedPhone || '',
      headline: headline?.trim() || '',
      description: description?.trim() || '',
      ctaLabel: ctaLabel?.trim() || slotConfig.defaultCta,
      adImage: adImage.trim(),
      targetUrl: targetUrl.trim(),
      slot: normalizedSlot,
      budget: numericBudget,
      budgetUsd,
      currency: paymentConfig.currency.toLowerCase(),
      paymentMethod: normalizePaymentMethod(paymentMethod),
      paymentProvider: paymentConfig.provider,
      paymentReference: paymentConfig.provider === 'flutterwave' ? txRef : '',
      status: 'pending_payment',
      paymentStatus: 'pending',
      impressionsPurchased,
      notes: notes?.trim() || '',
    });

    if (paymentConfig.provider === 'stripe') {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: adOrder.email,
        success_url: `${baseClientUrl()}/advertise?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseClientUrl()}/advertise?checkout=cancelled&order_id=${adOrder._id}`,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: Math.round(numericBudget * 100),
              product_data: {
                name: `${slotConfig.label} Campaign`,
                description: `${impressionsPurchased.toLocaleString()} sponsored impressions on MukonoTalks`,
              },
            },
          },
        ],
        metadata: {
          kind: 'ad_order',
          adOrderId: String(adOrder._id),
          slot: normalizedSlot,
          paymentMethod: 'stripe',
        },
        payment_intent_data: {
          metadata: {
            kind: 'ad_order',
            adOrderId: String(adOrder._id),
            slot: normalizedSlot,
            paymentMethod: 'stripe',
          },
        },
      });

      adOrder.checkoutSessionId = session.id;
      await adOrder.save();

      return res.status(201).json(
        buildCheckoutResponse(adOrder, session.url, { sessionId: session.id })
      );
    }

    if (paymentConfig.kind === 'mobile_money') {
      const charge = await chargeUgandaMobileMoney({
        txRef,
        amount: numericBudget,
        currency: paymentConfig.currency,
        email: adOrder.email,
        phoneNumber: normalizedPhone,
        fullname: adOrder.businessName || adOrder.clientName,
        network: paymentConfig.network,
        meta: {
          adOrderId: String(adOrder._id),
          slot: normalizedSlot,
          paymentMethod: adOrder.paymentMethod,
        },
      });

      const checkoutUrl = charge?.meta?.authorization?.redirect || charge?.data?.meta?.authorization?.redirect;
      if (!checkoutUrl) {
        throw new Error('Payment confirmation URL was not returned by the gateway.');
      }

      return res.status(201).json(
        buildCheckoutResponse(adOrder, checkoutUrl, { txRef })
      );
    }

    const payment = await createFlutterwavePayment({
      txRef,
      amount: numericBudget,
      currency: paymentConfig.currency,
      redirectUrl: `${baseClientUrl()}/advertise?checkout=flutterwave`,
      customer: {
        email: adOrder.email,
        phonenumber: normalizedPhone || undefined,
        name: adOrder.businessName || adOrder.clientName,
      },
      title: `${slotConfig.label} Campaign`,
      description: `${impressionsPurchased.toLocaleString()} sponsored impressions on MukonoTalks`,
      paymentOptions: paymentConfig.paymentOptions,
      meta: {
        adOrderId: String(adOrder._id),
        slot: normalizedSlot,
        paymentMethod: adOrder.paymentMethod,
      },
    });

    const checkoutUrl = payment?.data?.link;
    if (!checkoutUrl) {
      throw new Error('Checkout URL not returned by Flutterwave.');
    }

    return res.status(201).json(
      buildCheckoutResponse(adOrder, checkoutUrl, { txRef })
    );
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/ad-orders/checkout/verify
exports.verifyCheckoutSession = async (req, res) => {
  try {
    const provider = normalizePaymentMethod(req.query.provider) || '';
    const sessionId = String(req.query.session_id || '').trim();
    const transactionId = String(req.query.transaction_id || '').trim();
    const txRef = String(req.query.tx_ref || '').trim();

    if (sessionId) {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const order = await markOrderActiveIfPaid(session);

      if (!order) {
        return res.status(404).json({ success: false, message: 'Campaign order not found for checkout session.' });
      }

      if (session.payment_status !== 'paid') {
        return res.status(409).json({
          success: false,
          message: 'Payment is not completed yet.',
          data: { paymentStatus: session.payment_status, order },
        });
      }

      return res.json({
        success: true,
        data: {
          order,
          paymentStatus: session.payment_status,
        },
      });
    }

    if (provider === 'flutterwave' || transactionId || txRef) {
      const verification = await verifyFlutterwaveTransaction({ transactionId, txRef });
      const order = await markOrderActiveFromFlutterwave(verification);

      if (!order) {
        return res.status(404).json({ success: false, message: 'Campaign order not found for Flutterwave transaction.' });
      }

      if (verification?.data?.status !== 'successful') {
        return res.status(409).json({
          success: false,
          message: 'Payment is not completed yet.',
          data: { paymentStatus: verification?.data?.status || 'pending', order },
        });
      }

      return res.json({
        success: true,
        data: {
          order,
          paymentStatus: verification?.data?.status,
        },
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Provide a Stripe session_id or a Flutterwave transaction_id / tx_ref to verify payment.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/ad-orders/stripe/webhook
exports.handleStripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing Stripe signature.' });
    }

    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await markOrderActiveIfPaid(event.data.object);
        break;

      case 'checkout.session.expired':
        await markOrderPaymentPending(event.data.object);
        break;

      case 'checkout.session.async_payment_failed':
        await markOrderPaymentFailed(event.data.object);
        break;

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    const statusCode = err?.type === 'StripeSignatureVerificationError' ? 400 : 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
};

// POST /api/v1/ad-orders/flutterwave/webhook
exports.handleFlutterwaveWebhook = async (req, res) => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    if (!isValidFlutterwaveWebhook(rawBody, req.headers)) {
      return res.status(401).json({ success: false, message: 'Invalid Flutterwave webhook signature.' });
    }

    const payload = JSON.parse(rawBody.toString('utf8'));
    const eventData = payload?.data || {};
    const transactionId = String(eventData?.id || eventData?.transaction_id || '').trim();
    const txRef = String(eventData?.tx_ref || eventData?.txRef || '').trim();

    if (!transactionId && !txRef) {
      return res.status(200).json({ received: true });
    }

    const verification = await verifyFlutterwaveTransaction({ transactionId, txRef });
    await markOrderActiveFromFlutterwave(verification);

    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/ad-orders (admin)
exports.listAdOrders = async (req, res) => {
  try {
    const orders = await AdOrder.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/v1/ad-orders/:id (admin)
exports.updateAdOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus, notes, endAt } = req.body;
    const update = {};

    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (typeof notes === 'string') update.notes = notes.trim();
    if (endAt) update.endAt = new Date(endAt);

    if (status === 'active' && !update.startAt) {
      update.startAt = new Date();
    }
    if (paymentStatus === 'paid' && !update.paidAt) {
      update.paidAt = new Date();
    }

    const order = await AdOrder.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/ad-orders/ads?slot=article_inline
exports.getActiveAds = async (req, res) => {
  try {
    const slot = normalizeSlot(req.query.slot);
    if (!slot) {
      return res.status(400).json({ success: false, message: 'slot is required.' });
    }

    const ads = await AdOrder.find({
      slot,
      status: { $in: ACTIVE_STATUSES },
      paymentStatus: 'paid',
      $expr: { $lt: ['$impressionsUsed', '$impressionsPurchased'] },
      $or: [
        { endAt: null },
        { endAt: { $gte: new Date() } },
      ],
    })
      .sort({ lastServedAt: 1, impressionsUsed: 1, createdAt: 1 })
      .limit(3)
      .lean();

    if (!ads.length) {
      return res.json({ success: true, data: [] });
    }

    const ranked = [...ads].sort((left, right) => {
      const leftRatio = left.impressionsPurchased ? left.impressionsUsed / left.impressionsPurchased : 1;
      const rightRatio = right.impressionsPurchased ? right.impressionsUsed / right.impressionsPurchased : 1;
      return leftRatio - rightRatio;
    });

    return res.json({ success: true, data: ranked.slice(0, 1).map(serializePublicAd) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/ad-orders/ads/:id/impression
exports.trackAdImpression = async (req, res) => {
  try {
    const order = await AdOrder.findOneAndUpdate(
      {
        _id: req.params.id,
        status: { $in: ACTIVE_STATUSES },
        paymentStatus: 'paid',
        $expr: { $lt: ['$impressionsUsed', '$impressionsPurchased'] },
      },
      {
        $inc: { impressionsUsed: 1 },
        $set: { lastServedAt: new Date() },
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Ad campaign not available.' });
    }

    if (order.impressionsUsed >= order.impressionsPurchased) {
      order.status = 'completed';
      order.endAt = order.endAt || new Date();
      await order.save();
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/ad-orders/ads/:id/click
exports.trackAdClick = async (req, res) => {
  try {
    await AdOrder.findByIdAndUpdate(req.params.id, {
      $inc: { clicks: 1 },
      $set: { lastServedAt: new Date() },
    });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/ad-orders/config
exports.getAdOrderConfig = async (_req, res) => {
  const paymentMethods = PAYMENT_METHOD_ORDER
    .map((key) => [key, PAYMENT_METHODS[key]])
    .filter(([, value]) => value)
    .map(([key, value]) => ({
      key,
      label: value.label,
      provider: value.provider,
      currency: value.currency,
      requiresPhone: value.requiresPhone,
      description: value.description,
    }));

  const slots = Object.entries(SLOT_CONFIG).map(([key, value]) => ({
    key,
    label: value.label,
    cpmUsd: value.cpmUsd,
    minBudgetUsd: value.minBudgetUsd,
    defaultCta: value.defaultCta,
  }));

  res.json({
    success: true,
    data: {
      exchangeRates: {
        USD_UGX: DEFAULT_USD_TO_UGX_RATE,
      },
      paymentMethods,
      slots,
    },
  });
};
