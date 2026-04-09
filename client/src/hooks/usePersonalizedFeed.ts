import { useEffect, useState } from "react";

export function usePersonalizedFeed(profile: { categories?: string[]; tags?: string[] }) {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/personalized-feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    })
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.articles || []);
        setError(data.success ? null : data.message || "Failed to load");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(profile)]);

  return { articles, loading, error };
}
