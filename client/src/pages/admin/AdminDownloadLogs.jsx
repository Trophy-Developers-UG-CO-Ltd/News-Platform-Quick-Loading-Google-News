/**
 * Admin Download Logs page
 * View document download history and analytics for compliance tracking
 * @module pages/admin/AdminDownloadLogs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiDownload,
  FiRefreshCw,
  FiFilter,
  FiUser,
  FiFileText,
  FiCalendar,
  FiTrendingUp,
  FiAlertCircle,
} from 'react-icons/fi';
import adminService from '../../features/admin/adminService';
import useDocTitle from '../../hooks/useDocTitle';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  success: 'bg-green-100 text-green-800',
  denied: 'bg-red-100 text-red-800',
  error: 'bg-yellow-100 text-yellow-800',
};

const AdminDownloadLogs = () => {
  useDocTitle('Download Logs | Admin');
  const { t } = useTranslation();

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filters, setFilters] = useState({
    companyName: '',
    startDate: '',
    endDate: '',
    page: 1,
  });
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState(30);

  // Fetch download logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const data = await adminService.getDownloadHistory(params);
      setLogs(data.data?.logs || data.logs || []);
      setPagination(data.data?.pagination || data.pagination || {});
    } catch {
      toast.error('Failed to fetch download logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch download statistics
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await adminService.getDownloadStats({ days: statsPeriod });
      setStats(data.data || data);
    } catch {
      toast.error('Failed to fetch download statistics');
    } finally {
      setStatsLoading(false);
    }
  }, [statsPeriod]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString();
  const formatDateShort = (dateStr) => new Date(dateStr).toLocaleDateString();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FiDownload className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Download Logs</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-1.5 border ${
              showFilters ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-gray-300 text-gray-600'
            }`}
          >
            <FiFilter className="h-4 w-4" />
            <span className="text-sm">Filters</span>
          </button>
          <button
            onClick={() => { fetchLogs(); fetchStats(); }}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary-600"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Period</span>
            <select
              value={statsPeriod}
              onChange={(e) => setStatsPeriod(parseInt(e.target.value))}
              className="text-xs border border-gray-200 rounded-[48px] px-2 py-1"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
          {statsLoading ? (
            <div className="h-12 flex items-center justify-center">
              <Spinner size="sm" />
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiTrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalDownloads || 0}</p>
                <p className="text-xs text-gray-500">Downloads</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Denied Attempts</p>
          {statsLoading ? (
            <div className="h-12 flex items-center justify-center">
              <Spinner size="sm" />
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FiAlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.deniedAttempts || 0}</p>
                <p className="text-xs text-gray-500">Blocked</p>
              </div>
            </div>
          )}
        </div>

        {/* Top Documents */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Top Documents</p>
          {statsLoading ? (
            <Spinner size="sm" />
          ) : (
            <ul className="space-y-1">
              {stats?.topDocuments?.slice(0, 3).map((doc, idx) => (
                <li key={idx} className="flex items-center justify-between text-xs">
                  <span className="truncate max-w-[120px] text-gray-700">{doc.documentTitle || 'Unknown'}</span>
                  <span className="font-medium text-primary-600">{doc.downloads}</span>
                </li>
              )) || <li className="text-xs text-gray-400">No data</li>}
            </ul>
          )}
        </div>

        {/* Top Companies */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Top Companies</p>
          {statsLoading ? (
            <Spinner size="sm" />
          ) : (
            <ul className="space-y-1">
              {stats?.topCompanies?.slice(0, 3).map((company, idx) => (
                <li key={idx} className="flex items-center justify-between text-xs">
                  <span className="truncate max-w-[120px] text-gray-700">{company._id || 'Unknown'}</span>
                  <span className="font-medium text-primary-600">{company.downloads}</span>
                </li>
              )) || <li className="text-xs text-gray-400">No data</li>}
            </ul>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Company Name</label>
              <input
                type="text"
                value={filters.companyName}
                onChange={(e) => setFilters((f) => ({ ...f, companyName: e.target.value, page: 1 }))}
                placeholder="Search by company..."
                className="w-full border border-gray-300 rounded-[48px] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value, page: 1 }))}
                className="w-full border border-gray-300 rounded-[48px] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value, page: 1 }))}
                className="w-full border border-gray-300 rounded-[48px] px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ companyName: '', startDate: '', endDate: '', page: 1 })}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      {loading ? (
        <Spinner />
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FiDownload className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No download logs found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-gray-100 rounded-full">
                            <FiUser className="h-3 w-3 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{log.userName}</p>
                            <p className="text-xs text-gray-500">{log.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <FiFileText className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-900">{log.documentTitle}</p>
                            {log.documentCategory && (
                              <p className="text-xs text-gray-500 capitalize">{log.documentCategory}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.companyName || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[log.status]}`}>
                          {log.status}
                        </span>
                        {log.denialReason && (
                          <p className="text-xs text-red-500 mt-1">{log.denialReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <FiCalendar className="h-3 w-3" />
                          <span>{formatDate(log.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {log.ipAddress || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages} ({pagination.total} logs)
              </p>
              <div className="flex space-x-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                  className="px-3 py-1 border text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                  className="px-3 py-1 border text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDownloadLogs;

// MukonoTalks

