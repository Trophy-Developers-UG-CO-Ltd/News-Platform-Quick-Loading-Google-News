const TRACK_ENDPOINT = '/api/v1/track-view';
const SESSION_STORAGE_KEY = 'mukonoTalksSessionId';
const VIEW_GUARD_PREFIX = 'mukonoTalksArticleView:';
const VIEW_GUARD_WINDOW_MS = 10_000;

const getSessionId = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  let sessionId = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }

  return sessionId;
};

const shouldSkipTrack = (articleId) => {
  if (typeof window === 'undefined' || !articleId) {
    return true;
  }

  const key = `${VIEW_GUARD_PREFIX}${articleId}`;
  const previous = Number(window.sessionStorage.getItem(key) || 0);
  const now = Date.now();

  if (previous && now - previous < VIEW_GUARD_WINDOW_MS) {
    return true;
  }

  window.sessionStorage.setItem(key, String(now));
  return false;
};

export const trackArticleView = async (articleId) => {
  if (!articleId || shouldSkipTrack(articleId)) {
    return;
  }

  try {
    await fetch(TRACK_ENDPOINT, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': getSessionId() || '',
      },
      body: JSON.stringify({ articleId }),
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Article tracking failed', error);
    }
  }
};
