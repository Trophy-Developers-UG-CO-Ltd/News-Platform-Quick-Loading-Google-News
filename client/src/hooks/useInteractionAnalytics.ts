import { useEffect, useState } from "react";

export function useInteractionAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/analytics/interactions/summary")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setError(d.success ? null : d.message || "Failed to load");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
