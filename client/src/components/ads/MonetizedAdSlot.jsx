import React, { useEffect, useRef, useState } from 'react';
import api from '../../app/axios';
import { AD_SLOTS } from '../../config/ads';
import resolveImageUrl from '../../utils/resolveImageUrl';
import BannerAdSlot from './BannerAdSlot';

const campaignCache = new Map();
const campaignRequestCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

const fetchCampaign = async (backendSlot) => {
  if (!backendSlot) return null;

  const cachedEntry = campaignCache.get(backendSlot);
  if (cachedEntry && Date.now() - cachedEntry.fetchedAt < CACHE_TTL_MS) {
    return cachedEntry.campaign;
  }

  if (campaignRequestCache.has(backendSlot)) {
    return campaignRequestCache.get(backendSlot);
  }

  const request = api
    .get('/v1/ad-orders/ads', { params: { slot: backendSlot } })
    .then(({ data }) => {
      const activeCampaign = Array.isArray(data?.data) ? data.data[0] || null : null;
      campaignCache.set(backendSlot, {
        campaign: activeCampaign,
        fetchedAt: Date.now(),
      });
      return activeCampaign;
    })
    .catch(() => {
      campaignCache.set(backendSlot, {
        campaign: null,
        fetchedAt: Date.now(),
      });
      return null;
    })
    .finally(() => {
      campaignRequestCache.delete(backendSlot);
    });

  campaignRequestCache.set(backendSlot, request);
  return request;
};

const MonetizedAdSlot = ({ slotKey, className = '' }) => {
  const slot = AD_SLOTS[slotKey];
  const [campaign, setCampaign] = useState(null);
  const impressionTrackedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const loadCampaign = async () => {
      if (!slot?.backendSlot) {
        if (isMounted) setCampaign(null);
        return;
      }

      try {
        const activeCampaign = await fetchCampaign(slot.backendSlot);
        if (isMounted) {
          setCampaign(activeCampaign);
          impressionTrackedRef.current = false;
        }
      } catch {
        if (isMounted) {
          setCampaign(null);
          impressionTrackedRef.current = false;
        }
      }
    };

    loadCampaign();

    return () => {
      isMounted = false;
    };
  }, [slot?.backendSlot]);

  useEffect(() => {
    if (!campaign?._id || impressionTrackedRef.current) return;
    impressionTrackedRef.current = true;
    api.post(`/v1/ad-orders/ads/${campaign._id}/impression`).catch(() => {});
  }, [campaign]);

  const trackClick = () => {
    if (!campaign?._id) return;
    api.post(`/v1/ad-orders/ads/${campaign._id}/click`).catch(() => {});
  };

  if (!campaign) {
    return <BannerAdSlot slotKey={slotKey} className={className} />;
  }

  return (
    <aside className={`rounded-2xl border border-slate-200 bg-slate-50/95 p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
          Sponsored
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
          {slot?.label || 'Advertisement'}
        </span>
      </div>

      <a
        href={campaign.targetUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={trackClick}
        className="block overflow-hidden rounded-2xl bg-white transition hover:shadow-md"
      >
        {campaign.adImage ? (
          <img
            src={resolveImageUrl(campaign.adImage)}
            alt={campaign.headline || campaign.businessName || 'Sponsored content'}
            className="h-48 w-full object-cover"
            loading="lazy"
          />
        ) : null}

        <div className="space-y-2 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {campaign.businessName || campaign.clientName}
          </p>
          <h3 className="text-lg font-semibold leading-tight text-slate-900">
            {campaign.headline || campaign.businessName || 'Discover more'}
          </h3>
          {campaign.description ? (
            <p className="text-sm leading-6 text-slate-600">
              {campaign.description}
            </p>
          ) : null}
          <span className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            {campaign.ctaLabel || 'Learn more'}
          </span>
        </div>
      </a>
    </aside>
  );
};

export default MonetizedAdSlot;
