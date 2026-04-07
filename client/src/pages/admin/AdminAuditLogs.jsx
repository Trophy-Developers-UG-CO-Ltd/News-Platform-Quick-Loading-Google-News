/**
 * Admin Audit Logs page
 * Enterprise audit trail viewer with filtering
 * @module pages/admin/AdminAuditLogs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FiShield, FiAlertTriangle, FiFilter, FiRefreshCw } from 'react-icons/fi';
import adminService from '../../features/admin/adminService';
import useDocTitle from '../../hooks/useDocTitle';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const SEVERITY_COLORS = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  critical: 'bg-red-100 text-red-800',
};

const AdminAuditLogs = () => {
  useDocTitle('Audit Logs | Admin');
  const { t } = useTranslation();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    severity: '',
    page: 1,
  });
  const [pagination, setPagination] = useState({});
  const [activeTab, setActiveTab] = useState('all'); // all | security

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);

      let data;
      if (activeTab === 'security') {
        data = await adminService.getSecurityEvents(params);
      } else {
        data = await adminService.getAuditLogs(params);
      }
      setLogs(data.logs || []);
      setPagination(data.pagination || {});
    } catch {
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters, activeTab]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FiShield className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.auditLogs')}</h1>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary-600"
        >
          <FiRefreshCw className="h-4 w-4" />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          className={`pb-2 px-1 text-sm font-medium ${
            activeTab === 'all'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => { setActiveTab('all'); setFilters((f) => ({ ...f, page: 1 })); }}
        >
          All Logs
        </button>
        <button
          className={`pb-2 px-1 text-sm font-medium flex items-center space-x-1 ${
            activeTab === 'security'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => { setActiveTab('security'); setFilters((f) => ({ ...f, page: 1 })); }}
        >
          <FiAlertTriangle className="h-4 w-4" />
          <span>Security Events</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center space-x-2">
          <FiFilter className="h-4 w-4 text-gray-400" />
          <select
            value={filters.severity}
            onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value, page: 1 }))}
            className="border border-gray-300 rounded-[48px] px-3 py-1.5 text-sm"
          >
            <option value="">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <select
          value={filters.action}
          onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value, page: 1 }))}
          className="border border-gray-300 rounded-[48px] px-3 py-1.5 text-sm"
        >
          <option value="">All Actions</option>
          <option value="USER_LOGIN">User Login</option>
          <option value="USER_LOGIN_FAILED">Login Failed</option>
          <option value="USER_REGISTER">User Register</option>
          <option value="PRODUCT_CREATE">Product Create</option>
          <option value="PRODUCT_UPDATE">Product Update</option>
          <option value="PRODUCT_DELETE">Product Delete</option>
          <option value="ORDER_STATUS_CHANGE">Order Status Change</option>
          <option value="USER_ROLE_CHANGE">Role Change</option>
          <option value="PASSWORD_CHANGE">Password Change</option>
          <option value="DOCUMENT_DOWNLOAD">Document Download</option>
          <option value="WEBHOOK_RECEIVED">Webhook Received</option>
          <option value="WEBHOOK_FAILED">Webhook Failed</option>
        </select>
      </div>

      {/* Logs Table */}
      {loading ? (
        <Spinner />
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FiShield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No audit logs found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-800">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.performedByEmail || 'System'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.targetIdentifier || log.targetModel || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.info}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                      {log.ipAddress || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex space-x-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                  className="px-3 py-1 border rounded-none text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                  className="px-3 py-1 border rounded-none text-sm disabled:opacity-50"
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

export default AdminAuditLogs;

// MukonoTalks

