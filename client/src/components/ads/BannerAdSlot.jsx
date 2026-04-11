import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AD_SLOTS, ADSENSE_CLIENT_ID } from '../../config/ads';

const SLOT_STYLES = {
  homeHero: {
    shell: 'rounded-[2rem]',
    body: 'min-h-[180px] md:min-h-[220px]',
    fallbackTone: 'from-slate-950 via-slate-900 to-slate-800 text-white',
  },
  newsTop: {
    shell: 'rounded-[1.75rem]',
    body: 'min-h-[120px] md:min-h-[150px]',
    fallbackTone: 'from-slate-900 via-slate-800 to-slate-700 text-white',
  },
  newsInFeed: {
    shell: 'rounded-[1.5rem]',
    body: 'min-h-[140px] md:min-h-[170px]',
    fallbackTone: 'from-stone-900 via-slate-800 to-stone-700 text-white',
  },
  articleInline: {
    shell: 'rounded-[1.5rem]',
    body: 'min-h-[150px] md:min-h-[180px]',
    fallbackTone: 'from-slate-900 via-slate-800 to-amber-900 text-white',
  },
  articleFooter: {
    shell: 'rounded-[1.5rem]',
    body: 'min-h-[130px] md:min-h-[160px]',
    fallbackTone: 'from-slate-900 via-slate-800 to-emerald-900 text-white',
  },
};

const BannerAdSlot = ({ slotKey, className = '' }) => {
  const slot = AD_SLOTS[slotKey];
  const styles = SLOT_STYLES[slotKey] || SLOT_STYLES.newsInFeed;

  useEffect(() => {
    if (!ADSENSE_CLIENT_ID || !slot?.enabled || !slot?.slotId) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (_) {
      // AdSense can fail silently in development or ad-blocked environments.
    }
  }, [slot?.enabled, slot?.slotId]);

  if (!slot) return null;

  if (!ADSENSE_CLIENT_ID || !slot.enabled || !slot.slotId) {
    return (
      <Link
        to="/advertise"
        className={`group block overflow-hidden border border-slate-200 bg-gradient-to-br ${styles.fallbackTone} p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${styles.shell} ${className}`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80">
            Advertisement
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-white/60">
            {slot.label}
          </span>
        </div>

        <div className={`mt-4 flex flex-col justify-between gap-4 ${styles.body}`}>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold leading-tight">
              Your brand could appear here.
            </h3>
            <p className="max-w-xl text-sm leading-6 text-white/75">
              Run a self-serve sponsored campaign on MukonoTalks and go live as soon as payment is confirmed.
            </p>
          </div>

          <span className="inline-flex w-fit items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition group-hover:bg-slate-100">
            Advertise on MukonoTalks
          </span>
        </div>
      </Link>
    );
  }

  return (
    <aside className={`overflow-hidden border border-slate-200 bg-slate-50/90 shadow-sm ${styles.shell} ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <span className="inline-flex rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white">
          Advertisement
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
          {slot.label}
        </span>
      </div>

      <div className={`bg-white px-2 py-3 md:px-4 ${styles.body}`}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={slot.slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
};

export default BannerAdSlot;
