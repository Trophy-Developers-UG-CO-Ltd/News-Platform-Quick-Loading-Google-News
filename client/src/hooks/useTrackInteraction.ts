// Usage: useTrackInteraction()({ type: 'view', articleId, meta: { ... } })
export function useTrackInteraction() {
  return (payload: { type: string; articleId?: string; meta?: any }) => {
    fetch("/api/track-interaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  };
}
