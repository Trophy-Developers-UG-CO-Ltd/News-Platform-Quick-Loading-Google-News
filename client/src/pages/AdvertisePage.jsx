import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MessageCircle, CreditCard, Sparkles, Target } from 'lucide-react';
import api from '../app/axios';
import useDocTitle from '../hooks/useDocTitle';

const DEFAULT_USD_TO_UGX_RATE = 3800;
const DEFAULT_SLOTS = [
  { key: 'news_top', label: 'News Top Feature', cpmUsd: 14, minBudgetUsd: 35, defaultCta: 'Read more' },
  { key: 'news_in_feed', label: 'News Feed Sponsored Card', cpmUsd: 12, minBudgetUsd: 25, defaultCta: 'Discover' },
  { key: 'article_inline', label: 'Article Inline Spotlight', cpmUsd: 16, minBudgetUsd: 40, defaultCta: 'Visit sponsor' },
  { key: 'article_footer', label: 'Article Footer Follow-up', cpmUsd: 10, minBudgetUsd: 25, defaultCta: 'Learn more' },
  { key: 'hero', label: 'Hero Spotlight', cpmUsd: 20, minBudgetUsd: 60, defaultCta: 'Explore' },
  { key: 'sidebar', label: 'Sidebar Sponsored Card', cpmUsd: 9, minBudgetUsd: 20, defaultCta: 'Learn more' },
  { key: 'inline', label: 'Inline Sponsored Card', cpmUsd: 12, minBudgetUsd: 25, defaultCta: 'Learn more' },
];
const DEFAULT_PAYMENT_METHODS = [
  {
    key: 'mtn_momo',
    label: 'MTN Mobile Money',
    provider: 'flutterwave',
    currency: 'UGX',
    requiresPhone: true,
    description: 'Collect payment from an MTN MoMo line in Uganda.',
  },
  {
    key: 'airtel_money',
    label: 'Airtel Mobile Money',
    provider: 'flutterwave',
    currency: 'UGX',
    requiresPhone: true,
    description: 'Collect payment from an Airtel Money line in Uganda.',
  },
  {
    key: 'stripe',
    label: 'Stripe',
    provider: 'stripe',
    currency: 'USD',
    requiresPhone: false,
    description: 'Hosted card checkout through Stripe.',
  },
  {
    key: 'flutterwave',
    label: 'Flutterwave',
    provider: 'flutterwave',
    currency: 'UGX',
    requiresPhone: false,
    description: 'Hosted checkout with card, bank transfer, and Uganda mobile money options.',
  },
];

const initialForm = {
  clientName: '',
  businessName: '',
  email: '',
  phone: '',
  headline: '',
  description: '',
  ctaLabel: '',
  adImage: '',
  targetUrl: '',
  slot: 'news_in_feed',
  paymentMethod: 'mtn_momo',
  budget: '',
};

const formatCurrency = (amount, currency) => {
  if (!Number.isFinite(Number(amount))) return '--';

  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: currency || 'UGX',
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  }).format(Number(amount));
};

const AdvertisePage = () => {
  useDocTitle('Advertise on MukonoTalks');

  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(initialForm);
  const [slotConfig, setSlotConfig] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [usdToUgxRate, setUsdToUgxRate] = useState(DEFAULT_USD_TO_UGX_RATE);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activatedOrder, setActivatedOrder] = useState(null);
  const processedVerificationRef = useRef('');
  const processedCheckoutNoticeRef = useRef('');

  const selectedSlot = useMemo(
    () => slotConfig.find((slot) => slot.key === form.slot) || null,
    [form.slot, slotConfig]
  );

  const selectedPaymentMethod = useMemo(
    () => paymentMethods.find((method) => method.key === form.paymentMethod) || null,
    [form.paymentMethod, paymentMethods]
  );

  const minimumBudget = useMemo(() => {
    if (!selectedSlot || !selectedPaymentMethod) return 0;
    return selectedPaymentMethod.currency === 'UGX'
      ? Math.ceil(selectedSlot.minBudgetUsd * usdToUgxRate)
      : selectedSlot.minBudgetUsd;
  }, [selectedPaymentMethod, selectedSlot, usdToUgxRate]);

  const estimatedImpressions = useMemo(() => {
    const budget = Number(form.budget);
    if (!selectedSlot || !selectedPaymentMethod || !Number.isFinite(budget) || budget <= 0) return 0;

    const budgetUsd = selectedPaymentMethod.currency === 'UGX'
      ? budget / usdToUgxRate
      : budget;

    return Math.max(1000, Math.floor((budgetUsd / selectedSlot.cpmUsd) * 1000));
  }, [form.budget, selectedPaymentMethod, selectedSlot, usdToUgxRate]);

  useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      try {
        const { data } = await api.get('/v1/ad-orders/config');
        if (!mounted) return;

        const slots = Array.isArray(data?.data?.slots) ? data.data.slots : [];
        const methods = Array.isArray(data?.data?.paymentMethods) ? data.data.paymentMethods : [];
        const exchangeRate = Number(data?.data?.exchangeRates?.USD_UGX) || DEFAULT_USD_TO_UGX_RATE;

        setSlotConfig(slots);
        setPaymentMethods(methods);
        setUsdToUgxRate(exchangeRate);

        setForm((prev) => ({
          ...prev,
          slot: slots.some((slot) => slot.key === prev.slot) ? prev.slot : slots[0]?.key || prev.slot,
          paymentMethod: methods.some((method) => method.key === prev.paymentMethod)
            ? prev.paymentMethod
            : methods[0]?.key || prev.paymentMethod,
        }));
      } catch (err) {
        if (!mounted) return;
        const fallbackSlots = DEFAULT_SLOTS;
        const fallbackMethods = DEFAULT_PAYMENT_METHODS;
        setSlotConfig(fallbackSlots);
        setPaymentMethods(fallbackMethods);
        setUsdToUgxRate(DEFAULT_USD_TO_UGX_RATE);
        setForm((prev) => ({
          ...prev,
          slot: fallbackSlots.some((slot) => slot.key === prev.slot) ? prev.slot : fallbackSlots[0].key,
          paymentMethod: fallbackMethods.some((method) => method.key === prev.paymentMethod)
            ? prev.paymentMethod
            : fallbackMethods[0].key,
        }));

        const status = err?.response?.status;
        const reason = err?.response?.data?.message || err?.message || 'Network error';
        toast.error(
          `Could not load live ad plans${status ? ` (${status})` : ''}. Using fallback pricing.`
        );
        // Keep a concise but useful trace in the console for diagnosis.
        // eslint-disable-next-line no-console
        console.error('[AdvertisePage] Config load failed:', reason);
      } finally {
        if (mounted) setLoadingConfig(false);
      }
    };

    loadConfig();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    const sessionId = searchParams.get('session_id');
    const orderId = searchParams.get('order_id');
    const transactionId = searchParams.get('transaction_id');
    const txRef = searchParams.get('tx_ref');
    const flutterwaveStatus = searchParams.get('status');

    if (
      checkoutStatus === 'cancelled' &&
      orderId &&
      processedCheckoutNoticeRef.current !== `cancelled:${orderId}`
    ) {
      processedCheckoutNoticeRef.current = `cancelled:${orderId}`;
      toast.error('Checkout was cancelled. Your campaign can be paid again later.');
      return;
    }

    const isStripeReturn = checkoutStatus === 'success' && sessionId;
    const isFlutterwaveReturn =
      (checkoutStatus === 'flutterwave' && (transactionId || txRef)) ||
      Boolean(transactionId) ||
      Boolean(txRef && flutterwaveStatus);

    if (!isStripeReturn && !isFlutterwaveReturn) return;

    const verificationKey = isStripeReturn
      ? `stripe:${sessionId}`
      : `flutterwave:${transactionId || txRef}`;

    if (processedVerificationRef.current === verificationKey) return;
    processedVerificationRef.current = verificationKey;

    let mounted = true;

    const verifyPayment = async () => {
      setVerifying(true);
      try {
        const { data } = await api.get('/v1/ad-orders/checkout/verify', {
          params: isStripeReturn
            ? { session_id: sessionId }
            : {
                provider: 'flutterwave',
                transaction_id: transactionId || undefined,
                tx_ref: txRef || undefined,
              },
        });

        if (!mounted) return;
        setActivatedOrder(data?.data?.order || null);
        toast.success('Campaign paid successfully. Your sponsored placement is now active.');
      } catch (err) {
        if (mounted) {
          processedVerificationRef.current = '';
          toast.error(err?.response?.data?.message || 'Payment verification failed.');
        }
      } finally {
        if (mounted) setVerifying(false);
      }
    };

    verifyPayment();

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSlot || !selectedPaymentMethod) {
      toast.error('Please wait for advertising plans to load.');
      return;
    }

    const payload = {
      clientName: form.clientName.trim(),
      businessName: form.businessName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      headline: form.headline.trim(),
      description: form.description.trim(),
      ctaLabel: form.ctaLabel.trim(),
      adImage: form.adImage.trim(),
      targetUrl: form.targetUrl.trim(),
      slot: form.slot,
      paymentMethod: form.paymentMethod,
      budget: Number(form.budget),
    };

    if (!payload.clientName || !payload.email || !payload.adImage || !payload.targetUrl || !payload.budget) {
      toast.error('Please complete all required campaign fields.');
      return;
    }

    if (selectedPaymentMethod.requiresPhone && !payload.phone) {
      toast.error('This payment method requires a mobile money phone number.');
      return;
    }

    if (payload.budget < minimumBudget) {
      toast.error(
        `Minimum budget for this placement is ${formatCurrency(minimumBudget, selectedPaymentMethod.currency)}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/v1/ad-orders/checkout', payload);
      const checkoutUrl = response?.data?.data?.checkoutUrl;
      if (!checkoutUrl) {
        throw new Error('Checkout URL not returned.');
      }
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to start ad checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  const paymentActionLabel = selectedPaymentMethod?.label
    ? `Pay with ${selectedPaymentMethod.label}`
    : 'Pay and activate campaign';

  return (
    <div className="min-h-screen bg-light-body px-6 py-16 dark:bg-dark-charcoal">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section>
          <div className="rounded-[2rem] bg-black px-8 py-10 text-white shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Advertise</p>
            <h1 className="mt-4 text-4xl font-black leading-tight">Launch a sponsored campaign and go live automatically.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
              Buy a MukonoTalks placement directly and pay with MTN Mobile Money, Airtel Money, Stripe, or Flutterwave.
            </p>
          </div>

          {activatedOrder ? (
            <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Campaign active</h2>
              </div>
              <p className="mt-3 text-sm leading-6">
                {activatedOrder.headline || activatedOrder.businessName || activatedOrder.clientName} is now eligible to serve in the selected slot.
              </p>
              <p className="mt-2 text-sm">
                Purchased impressions: {Number(activatedOrder.impressionsPurchased || 0).toLocaleString()}
              </p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-[2rem] border border-light-border bg-light-surface p-8 shadow-card dark:border-dark-border dark:bg-dark-surface">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                placeholder="Contact name *"
                className="w-full rounded-xl border border-light-border bg-white p-3 dark:border-dark-border dark:bg-dark-charcoal"
                maxLength={100}
                required
              />
              <input
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                placeholder="Business / brand"
                className="w-full rounded-xl border border-light-border bg-white p-3 dark:border-dark-border dark:bg-dark-charcoal"
                maxLength={140}
              />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email address *"
                className="w-full rounded-xl border border-light-border bg-white p-3 dark:border-dark-border dark:bg-dark-charcoal"
                maxLength={120}
                required
              />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder={selectedPaymentMethod?.requiresPhone ? 'Mobile money number *' : 'Phone / WhatsApp'}
                className="w-full rounded-xl border border-light-border bg-white p-3 dark:border-dark-border dark:bg-dark-charcoal"
                maxLength={40}
                required={selectedPaymentMethod?.requiresPhone}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <select
                name="slot"
                value={form.slot}
                onChange={handleChange}
                className="w-full rounded-xl border border-light-border bg-white p-3 dark:border-dark-border dark:bg-dark-charcoal"
                disabled={loadingConfig}
              >
                {slotConfig.map((slot) => (
                  <option key={slot.key} value={slot.key}>
                    {slot.label}
                  </option>
                ))}
              </select>

              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="w-full rounded-xl border border-light-border bg-white p-3 dark:border-dark-border dark:bg-dark-charcoal"
                disabled={loadingConfig}
              >
                {paymentMethods.map((method) => (
                  <option key={method.key} value={method.key}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedPaymentMethod?.description ? (
              <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700">
                {selectedPaymentMethod.description}
              </p>
            ) : null}

            <input
              name="budget"
              type="number"
              min={minimumBudget || 0}
              value={form.budget}
              onChange={handleChange}
              placeholder={`Budget in ${selectedPaymentMethod?.currency || 'UGX'} *`}
              className="w-full rounded-xl border border-light-border bg-white p-3 dark:border-dark-border dark:bg-dark-charcoal"
              required
            />

            <input
              name="headline"
              value={form.headline}
              onChange={handleChange}
              placeholder="Campaign headline"
              className="w-full rounded-xl border border-light-border bg-white p-3 dark:border-dark-border dark:bg-dark-charcoal"
              maxLength={90}
            />

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Short sponsor copy"
              className="h-28 w-full rounded-xl border border-light-border bg-white p-3 dark:border-dark-border dark:bg-dark-charcoal"
              maxLength={220}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="adImage"
                value={form.adImage}
                onChange={handleChange}
                placeholder="Creative image URL *"
                className="w-full rounded-xl border border-light-border bg-white p-3 dark:border-dark-border dark:bg-dark-charcoal"
                required
              />
              <input
                name="targetUrl"
                value={form.targetUrl}
                onChange={handleChange}
                placeholder="Landing page URL *"
                className="w-full rounded-xl border border-light-border bg-white p-3 dark:border-dark-border dark:bg-dark-charcoal"
                required
              />
            </div>

            <input
              name="ctaLabel"
              value={form.ctaLabel}
              onChange={handleChange}
              placeholder="CTA label (optional)"
              className="w-full rounded-xl border border-light-border bg-white p-3 dark:border-dark-border dark:bg-dark-charcoal"
              maxLength={40}
            />

            <button
              type="submit"
              disabled={submitting || verifying || loadingConfig}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 font-semibold text-white transition hover:bg-black/90 disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              {submitting ? 'Redirecting to checkout...' : paymentActionLabel}
            </button>

            {selectedPaymentMethod?.key === 'mtn_momo' || selectedPaymentMethod?.key === 'airtel_money' ? (
              <p className="text-sm leading-6 text-text-light-secondary dark:text-text-dark-secondary">
                You’ll confirm the charge on your phone, and the campaign will activate automatically once the gateway confirms payment.
              </p>
            ) : null}
          </form>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-light-border bg-light-surface p-7 shadow-card dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-text-light-secondary dark:text-text-dark-secondary">
              <Target className="h-4 w-4" />
              Campaign summary
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <div className="rounded-2xl bg-white p-4 dark:bg-dark-charcoal">
                <p className="text-xs uppercase tracking-[0.18em] text-text-light-secondary dark:text-text-dark-secondary">Placement</p>
                <p className="mt-2 text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                  {selectedSlot?.label || 'Loading...'}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 dark:bg-dark-charcoal">
                <p className="text-xs uppercase tracking-[0.18em] text-text-light-secondary dark:text-text-dark-secondary">Payment gateway</p>
                <p className="mt-2 text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                  {selectedPaymentMethod?.label || 'Loading...'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl bg-white p-4 dark:bg-dark-charcoal">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-light-secondary dark:text-text-dark-secondary">Minimum budget</p>
                  <p className="mt-2 text-2xl font-black text-text-light-primary dark:text-text-dark-primary">
                    {minimumBudget ? formatCurrency(minimumBudget, selectedPaymentMethod?.currency) : '--'}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 dark:bg-dark-charcoal">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-light-secondary dark:text-text-dark-secondary">Estimated impressions</p>
                  <p className="mt-2 text-2xl font-black text-text-light-primary dark:text-text-dark-primary">
                    {estimatedImpressions ? estimatedImpressions.toLocaleString() : '--'}
                  </p>
                </div>
              </div>

              {selectedPaymentMethod?.currency === 'UGX' ? (
                <p className="text-xs leading-5 text-text-light-secondary dark:text-text-dark-secondary">
                  UGX pricing is converted from the CMS slot CPM using the configured USD to UGX rate.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-light-border bg-light-surface p-7 shadow-card dark:border-dark-border dark:bg-dark-surface">
            <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">Need help with creatives or bulk campaigns?</h2>
            <p className="mt-3 text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
              We still support managed placements for advertisers who want a custom package, creative support, or longer-term sponsorships.
            </p>

            <a
              href="https://wa.me/256755303076?text=Hi%2C%20I%20want%20to%20advertise%20on%20MukonoTalks"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black py-3 font-semibold dark:border-white"
            >
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdvertisePage;
