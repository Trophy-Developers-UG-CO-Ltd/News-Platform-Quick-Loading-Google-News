/**
 * Admin Dashboard page
 * Overview stats, recent orders, pending approvals
 * @module pages/admin/AdminDashboard
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '../../features/admin/adminSlice';
import adminService from '../../features/admin/adminService';
import { FiUsers, FiPackage, FiShoppingCart, FiDollarSign, FiClock, FiArrowRight, FiShield, FiBarChart2, FiMessageSquare, FiLayout, FiEdit, FiImage, FiHome, FiNavigation, FiDatabase, FiRefreshCw } from 'react-icons/fi';
import { Globe, ArrowRight } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { stats, isLoading, error } = useSelector((state) => state.admin);
  const [cacheStats, setCacheStats] = useState(null);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);


  useEffect(() => {
    dispatch(fetchDashboardStats());
    loadCacheStats();
    loadAnalytics();
  }, [dispatch]);

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await adminService.getAnalyticsDashboard();
      setAnalytics(res.data);
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadCacheStats = async () => {
    setCacheLoading(true);
    try {
      const data = await adminService.getCacheStats();
      setCacheStats(data.data);
    } catch {
      // silently ignore if unavailable
    } finally {
      setCacheLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Clear all cached responses? This will cause the next requests to be slower while the cache warms up again.')) return;
    setClearing(true);
    try {
      const result = await adminService.clearCache();
      toast.success(result.message || 'Cache cleared');
      await loadCacheStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear cache');
    } finally {
      setClearing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="mt-3 text-sm">
            Dashboard data could not be loaded.
          </p>
          <p className="mt-2 text-sm">
            {error || 'The admin API returned an unexpected response.'}
          </p>
          <button
            type="button"
            onClick={() => dispatch(fetchDashboardStats())}
            className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: FiUsers, color: 'bg-blue-100 text-blue-600' },
    analytics && {
      label: 'Article Views',
      value: analytics.totalPageViews?.toLocaleString() ?? '--',
      icon: FiBarChart2,
      color: 'bg-green-100 text-green-600',
    },
  ].filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <span className="text-sm text-gray-500">MukonoTalks CMS</span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
        {analyticsLoading && (
          <div className="card p-5 flex items-center justify-center text-gray-400">Loading analytics…</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              <FiClock className="inline mr-2 text-yellow-500" />
              Pending Orders ({stats.pendingOrders || 0})
            </h2>
            <Link to="/admin/orders" className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1">
              View All <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {stats.recentOrders?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentOrders.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm text-gray-800">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-ZA')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary-700">
                    ${order.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent orders.</p>
          )}
        </div>

        {/* Pending Approvals */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              <FiUsers className="inline mr-2 text-orange-500" />
              Pending Approvals ({stats.pendingApprovals || 0})
            </h2>
            <Link to="/admin/users" className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1">
              Manage <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            {stats.pendingApprovals > 0
              ? `${stats.pendingApprovals} user(s) awaiting account approval.`
              : 'No pending approvals.'}
          </p>
        </div>
      </div>

      {/* Cache Management */}
      <div className="card p-6 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            <FiDatabase className="inline mr-2 text-indigo-500" />
            Server Cache
          </h2>
          <button
            onClick={loadCacheStats}
            disabled={cacheLoading}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Refresh stats"
          >
            <FiRefreshCw className={`h-4 w-4 ${cacheLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {cacheStats ? (
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex gap-6 flex-wrap">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Entries</p>
                <p className="text-2xl font-bold text-gray-800">{cacheStats.size}<span className="text-sm text-gray-400 font-normal"> / {cacheStats.maxSize}</span></p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Hit Rate</p>
                <p className="text-2xl font-bold text-green-600">{cacheStats.hitRate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Hits</p>
                <p className="text-2xl font-bold text-gray-800">{cacheStats.hits.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Misses</p>
                <p className="text-2xl font-bold text-gray-800">{cacheStats.misses.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Evictions</p>
                <p className="text-2xl font-bold text-gray-800">{cacheStats.evictions.toLocaleString()}</p>
              </div>
            </div>
            <button
              onClick={handleClearCache}
              disabled={clearing || cacheStats.size === 0}
              className="ml-auto btn-secondary flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-40"
            >
              <FiRefreshCw className={`h-4 w-4 ${clearing ? 'animate-spin' : ''}`} />
              {clearing ? 'Clearing…' : 'Clear Cache'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">{cacheLoading ? 'Loading…' : 'Cache stats unavailable.'}</p>
        )}
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
        {/* Removed Manage Products and Manage Orders quick nav cards */}
        <Link to="/admin/users" className="card p-5 text-center hover:shadow-md transition-shadow">
          <FiUsers className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <p className="font-semibold">Manage Users</p>
        </Link>
        <Link to="/admin/audit" className="card p-5 text-center hover:shadow-md transition-shadow">
          <FiShield className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <p className="font-semibold">Audit Logs</p>
        </Link>
        <Link to="/admin/analytics" className="card p-5 text-center hover:shadow-md transition-shadow">
          <FiBarChart2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="font-semibold">Analytics</p>
        </Link>
        <Link to="/admin/advertise-inquiries" className="card p-5 text-center hover:shadow-md transition-shadow">
          <FiMessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="font-semibold">Advertise Inquiries</p>
        </Link>
        <Link to="/admin/pages" className="card p-5 text-center hover:shadow-md transition-shadow">
          <FiLayout className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
          <p className="font-semibold">CMS Pages</p>
        </Link>
        <Link to="/admin/articles" className="card p-5 text-center hover:shadow-md transition-shadow">
          <FiEdit className="h-8 w-8 text-teal-600 mx-auto mb-2" />
          <p className="font-semibold">Articles</p>
        </Link>
        <Link to="/admin/hero" className="card p-5 text-center hover:shadow-md transition-shadow">
          <FiImage className="h-8 w-8 text-pink-600 mx-auto mb-2" />
          <p className="font-semibold">Hero Slider</p>
        </Link>
        <Link to="/admin/home-sections" className="card p-5 text-center hover:shadow-md transition-shadow">
          <FiHome className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <p className="font-semibold">Homepage Sections</p>
        </Link>
        <Link to="/admin/navigation" className="card p-5 text-center hover:shadow-md transition-shadow">
          <FiNavigation className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <p className="font-semibold">Navigation Menu</p>
        </Link>
        <Link to="/admin/footer" className="card p-5 text-center hover:shadow-md transition-shadow">
          <FiLayout className="h-8 w-8 text-teal-500 mx-auto mb-2" />
          <p className="font-semibold">Footer Settings</p>
        </Link>
        <Link to="/admin/seo" className="card p-5 text-center hover:shadow-md transition-shadow">
          <Globe className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <p className="font-semibold">SEO Schemas</p>
        </Link>
        <Link to="/admin/redirects" className="card p-5 text-center hover:shadow-md transition-shadow">
          <ArrowRight className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <p className="font-semibold">URL Redirects</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;

// MukonoTalks
