import React, { useEffect } from 'react';
import { AD_SLOTS, ADSENSE_CLIENT_ID } from '../../config/ads';

const BannerAdSlot = ({ slotKey, className = '' }) => {
  const slot = AD_SLOTS[slotKey];

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
      <div className={`rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 ${className}`}>
        Ad Placeholder: {slot.label}
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot.slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default BannerAdSlot;
