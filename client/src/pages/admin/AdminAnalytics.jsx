/**
 * Admin Analytics Dashboard
 * Recharts-powered BI widgets + shadcn/ui cards + Google Analytics link
 * @module pages/admin/AdminAnalytics
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BarChart2, TrendingUp, Eye, Search, ShoppingCart, Users, AlertTriangle, ExternalLink, RefreshCw, Save } from 'lucide-react';
import adminService from '../../features/admin/adminService';
import useDocTitle from '../../hooks/useDocTitle';
import Spinner from '../../components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#1a56db', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const DAYS_OPTIONS = [7, 14, 30, 90];
const GA4_PATTERN = /^G-[A-Z0-9]+$/;

// ─── Stat KPI Card ───────────────────────────────────────────────────────────
const KpiCard = ({ label, value, icon: Icon, color }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ─── Merge time-series arrays by date ─────────────────────────────────────────
function mergeTimeSeries(seriesMap) {
  const dateMap = {};
  for (const [key, arr] of Object.entries(seriesMap)) {
    (arr || []).forEach(({ _id, count }) => {
      if (!dateMap[_id]) dateMap[_id] = { date: _id };
      dateMap[_id][key] = count;
    });
  }
  return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
}

const GA_ENV_ID = import.meta.env.VITE_GA4_ID || '';

// ─── Main Component ───────────────────────────────────────────────────────────────────────
const AdminAnalytics = () => {
  useDocTitle('Analytics | Admin');

  const [days, setDays] = useState(30);
  const [dashboard, setDashboard] = useState(null);
  const [traffic, setTraffic] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topSearches, setTopSearches] = useState([]);
  const [zeroResults, setZeroResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // GA4 Measurement ID (DB-driven)
  const [ga4Id, setGa4Id] = useState(GA_ENV_ID);
  const [ga4Input, setGa4Input] = useState('');
  const [ga4Saving, setGa4Saving] = useState(false);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [dashData, trafficData, productsData, searchesData, zeroData] = await Promise.all([
        adminService.getAnalyticsDashboard(),
        adminService.getTrafficOverview({ days }),
        adminService.getTopProducts({ limit: 10, days }),
        adminService.getTopSearches({ limit: 15, days }),
        adminService.getZeroResultSearches({ limit: 10, days }).catch(() => ({ data: [] })),
      ]);
      setDashboard(dashData?.data || dashData);
      setTraffic(mergeTimeSeries({
        'Product Views': trafficData?.data?.productViews || [],
        'Page Views':    trafficData?.data?.pageViews    || [],
        'Searches':      trafficData?.data?.searches     || [],
      }));
      setTopProducts(productsData?.data || productsData?.products || []);
      setTopSearches(searchesData?.data || searchesData?.searches || []);
      setZeroResults(Array.isArray(zeroData?.data) ? zeroData.data : []);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Fetch GA4 Measurement ID from site settings
  useEffect(() => {
    adminService.getSiteSettings()
      .then((res) => {
        const dbId = res?.settings?.ga4MeasurementId || '';
        setGa4Input(dbId || GA_ENV_ID);
        setGa4Id(dbId || GA_ENV_ID);
      })
      .catch(() => {
        setGa4Input(GA_ENV_ID);
      });
  }, []);

  const handleSaveGa4 = async () => {
    const trimmed = ga4Input.trim();
    if (trimmed && !GA4_PATTERN.test(trimmed)) {
      toast.error('Invalid format. GA4 Measurement ID must start with G- (e.g. G-XXXXXXXXXX)');
      return;
    }
    setGa4Saving(true);
    try {
      await adminService.updateSiteSettings({ ga4MeasurementId: trimmed });
      setGa4Id(trimmed);
      toast.success(trimmed ? 'GA4 Measurement ID saved' : 'GA4 Measurement ID cleared');
    } catch {
      toast.error('Failed to save GA4 Measurement ID');
    } finally {
      setGa4Saving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const kpis = [
    { label: 'Product Views', value: (dashboard?.totalProductViews || 0).toLocaleString(), icon: Eye,          color: 'bg-blue-100 text-blue-600' },
    { label: 'Searches',      value: (dashboard?.totalSearches     || 0).toLocaleString(), icon: Search,        color: 'bg-green-100 text-green-600' },
    { label: 'Page Views',    value: (dashboard?.totalPageViews    || 0).toLocaleString(), icon: TrendingUp,    color: 'bg-purple-100 text-purple-600' },
    { label: 'Zero-result',  value: zeroResults.length,                                    icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
  ];

  const pieData = topProducts.slice(0, 5).map((p, i) => ({
    name: p.productTitle || p._id || `Product ${i + 1}`,
    value: p.totalViews || p.count || 0,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart2 className="h-7 w-7 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500">Business intelligence — internal traffic &amp; behaviour data</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-[48px]">
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 text-sm rounded-[48px] transition-colors ${
                  days === d ? 'bg-white shadow text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-white border border-gray-200 rounded-none hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Traffic Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Trend — Last {days} Days</CardTitle>
          <CardDescription>Daily product views, page views, and search activity</CardDescription>
        </CardHeader>
        <CardContent>
          {traffic.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No traffic data for this period yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={traffic} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Product Views" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Page Views"    stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Searches"      stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bar + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              Top Viewed Products
            </CardTitle>
            <CardDescription>Most viewed products in the last {days} days</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No product view data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topProducts.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="productTitle"
                    tick={{ fontSize: 10 }}
                    width={120}
                    tickFormatter={(v) => v ? (v.length > 18 ? v.slice(0, 18) + '…' : v) : '—'}
                  />
                  <Tooltip />
                  <Bar dataKey="totalViews" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} name="Views" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Views Share</CardTitle>
            <CardDescription>Top 5 products by view count</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {pieData.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No data yet</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} views`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {pieData.map((p, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs text-gray-600">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name}
                    </span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Searches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-4 w-4 text-green-500" />
              Top Search Terms
            </CardTitle>
            <CardDescription>Most frequent searches in the last {days} days</CardDescription>
          </CardHeader>
          <CardContent>
            {topSearches.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No search data yet</p>
            ) : (
              <div className="space-y-2.5">
                {topSearches.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-300 w-5">{idx + 1}</span>
                      <span className="text-sm text-gray-800 font-mono">"{item._id}"</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{item.count} times</span>
                      {item.avgResultCount === 0 && <Badge variant="destructive">No results</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Zero-Result Searches
            </CardTitle>
            <CardDescription>Content gaps — searches returning no results</CardDescription>
          </CardHeader>
          <CardContent>
            {zeroResults.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No zero-result searches — great!</p>
            ) : (
              <div className="space-y-2.5">
                {zeroResults.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-300 w-5">{idx + 1}</span>
                      <span className="text-sm text-gray-800 font-mono">"{item._id || item.term}"</span>
                    </div>
                    <Badge variant="destructive">{item.count || item.searches} searches</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Google Analytics 4 Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            Google Analytics 4
            {ga4Id ? (
              <Badge variant="success">Connected — {ga4Id}</Badge>
            ) : (
              <Badge variant="warning">Not configured</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Enter your GA4 Measurement ID to activate page-view tracking on every route change. Events tracked: page_view, view_item, add_to_cart, begin_checkout, purchase, search, generate_lead, sign_up, login.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Measurement ID Input */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="flex-1 w-full">
              <label htmlFor="ga4-id" className="block text-sm font-medium text-gray-700 mb-1">Measurement ID</label>
              <input
                id="ga4-id"
                type="text"
                value={ga4Input}
                onChange={(e) => setGa4Input(e.target.value.toUpperCase())}
                placeholder="G-XXXXXXXXXX"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-[48px] text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <button
              onClick={handleSaveGa4}
              disabled={ga4Saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-none hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {ga4Saving ? 'Saving…' : 'Save'}
            </button>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="https://analytics.google.com/analytics/web/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-none hover:bg-gray-50 transition-colors group"
            >
              <BarChart2 className="h-8 w-8 text-orange-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600">GA4 Dashboard</p>
                <p className="text-xs text-gray-500">Open in Google Analytics</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto shrink-0" />
            </a>
            <a
              href="https://analytics.google.com/analytics/web/#/realtime"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-none hover:bg-gray-50 transition-colors group"
            >
              <Users className="h-8 w-8 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600">Realtime Report</p>
                <p className="text-xs text-gray-500">Live users on site</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto shrink-0" />
            </a>
            <a
              href="https://analytics.google.com/analytics/web/#/ecommerce"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-none hover:bg-gray-50 transition-colors group"
            >
              <ShoppingCart className="h-8 w-8 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600">E-commerce Report</p>
                <p className="text-xs text-gray-500">Purchases &amp; revenue</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto shrink-0" />
            </a>
          </div>
          {!ga4Id && (
            <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-none px-4 py-3">
              Enter your GA4 Measurement ID above (e.g. <code className="font-mono font-bold">G-XXXXXXXXXX</code>) and click Save to activate tracking. You can find it in your GA4 property settings under Data Streams.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;

// MukonoTalks

