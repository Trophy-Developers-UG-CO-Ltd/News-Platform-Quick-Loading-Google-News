import React, { useEffect, useState } from "react";

const API = "/api/seo/technical/seo";

function Badge({ status, children }) {
  const color = status === "ok" ? "bg-green-100 text-green-700" : status === "warn" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  return <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${color}`}>{children}</span>;
}

export default function SeoTechnical() {
  const [loading, setLoading] = useState(true);
  const [indexing, setIndexing] = useState(null);
  const [schema, setSchema] = useState(null);
  const [webVitals, setWebVitals] = useState(null);
  const [error, setError] = useState(null);
  const [lhLoading, setLhLoading] = useState(false);
  const [lhResult, setLhResult] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [indexingRes, schemaRes, vitalsRes] = await Promise.all([
        fetch(`${API}/indexing-status`).then(r => r.json()),
        fetch(`${API}/schema-validation`).then(r => r.json()),
        fetch(`${API}/core-web-vitals`).then(r => r.json()),
      ]);
      setIndexing(indexingRes);
      setSchema(schemaRes);
      setWebVitals(vitalsRes);
    } catch (e) {
      setError("Failed to load technical SEO data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, []);

  const runLighthouse = async () => {
    setLhLoading(true);
    setLhResult(null);
    try {
      const res = await fetch(`${API}/lighthouse-audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: window.location.origin })
      });
      const data = await res.json();
      setLhResult(data);
    } catch (e) {
      setLhResult({ error: "Failed to run Lighthouse audit." });
    } finally {
      setLhLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Technical SEO</h1>
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <a
          href="/sitemap.xml"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline mr-4"
        >
          View Sitemap.xml
        </a>
        <a
          href="/robots.txt"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          View Robots.txt
        </a>
        <button
          className="ml-auto px-3 py-1 bg-gray-100 rounded border text-sm hover:bg-gray-200"
          onClick={fetchAll}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading technical SEO data...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-2 flex items-center gap-2">Indexing Status {indexing?.source && <Badge status="ok">GSC</Badge>}</h2>
            <div>
              <div>Indexed Pages: <b>{indexing?.indexedPages ?? "-"}</b></div>
              <div>Last Indexed: <b>{indexing?.lastIndexed ? new Date(indexing.lastIndexed).toLocaleString() : "-"}</b></div>
              <div className="mt-2 text-xs text-gray-500">Source: {indexing?.source || "-"}</div>
            </div>
          </div>
          <div className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-2 flex items-center gap-2">Schema Validation {schema?.valid ? <Badge status="ok">Valid</Badge> : <Badge status="error">Invalid</Badge>}</h2>
            <div>
              <div>Valid: <b>{schema?.valid ? "Yes" : "No"}</b></div>
              {schema?.errors?.length > 0 && (
                <ul className="text-red-600 mt-2 text-sm list-disc ml-5">
                  {schema.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-2 flex items-center gap-2">Core Web Vitals <Badge status="ok">Live</Badge></h2>
            <div>
              <div>LCP: <b>{webVitals?.LCP ?? "-"}s</b></div>
              <div>FID: <b>{webVitals?.FID ?? "-"}ms</b></div>
              <div>CLS: <b>{webVitals?.CLS ?? "-"}</b></div>
            </div>
            <div className="mt-4">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                onClick={runLighthouse}
                disabled={lhLoading}
              >
                {lhLoading ? "Running Lighthouse..." : "Run Lighthouse Audit"}
              </button>
              {lhResult && (
                <div className="mt-2 text-xs bg-gray-50 rounded p-2 border">
                  {lhResult.error ? (
                    <span className="text-red-600">{lhResult.error}</span>
                  ) : (
                    <>
                      <div><b>Score:</b> {lhResult.score}</div>
                      <div className="mt-1">Metrics:</div>
                      <ul className="ml-4 list-disc">
                        <li>Performance: {lhResult.metrics?.performance}</li>
                        <li>Accessibility: {lhResult.metrics?.accessibility}</li>
                        <li>Best Practices: {lhResult.metrics?.bestPractices}</li>
                        <li>SEO: {lhResult.metrics?.seo}</li>
                        <li>PWA: {lhResult.metrics?.pwa}</li>
                      </ul>
                      <div className="mt-1 text-gray-500">{lhResult.timestamp}</div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
