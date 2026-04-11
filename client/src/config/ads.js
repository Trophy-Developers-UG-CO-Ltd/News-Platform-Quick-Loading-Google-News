export const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID || '';

export const AD_SLOTS = {
  homeHero: {
    label: 'Home hero banner',
    backendSlot: 'hero',
    slotId: import.meta.env.VITE_AD_SLOT_HOME_HERO || '',
    enabled: import.meta.env.VITE_AD_SLOT_HOME_HERO_ENABLED !== 'false',
  },
  newsTop: {
    label: 'News top leaderboard',
    backendSlot: 'news_top',
    slotId: import.meta.env.VITE_AD_SLOT_NEWS_TOP || '',
    enabled: import.meta.env.VITE_AD_SLOT_NEWS_TOP_ENABLED !== 'false',
  },
  newsInFeed: {
    label: 'News in-feed rectangle',
    backendSlot: 'news_in_feed',
    slotId: import.meta.env.VITE_AD_SLOT_NEWS_INFEED || '',
    enabled: import.meta.env.VITE_AD_SLOT_NEWS_INFEED_ENABLED !== 'false',
  },
  articleInline: {
    label: 'Article inline banner',
    backendSlot: 'article_inline',
    slotId: import.meta.env.VITE_AD_SLOT_ARTICLE_INLINE || '',
    enabled: import.meta.env.VITE_AD_SLOT_ARTICLE_INLINE_ENABLED !== 'false',
  },
  articleFooter: {
    label: 'Article footer banner',
    backendSlot: 'article_footer',
    slotId: import.meta.env.VITE_AD_SLOT_ARTICLE_FOOTER || '',
    enabled: import.meta.env.VITE_AD_SLOT_ARTICLE_FOOTER_ENABLED !== 'false',
  },
};
