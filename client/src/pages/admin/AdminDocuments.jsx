/**
 * Admin Documents management page
 * Upload, manage, and track technical documents (SDS, TDS, certificates)
 * @module pages/admin/AdminDocuments
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiFileText,
  FiRefreshCw,
  FiUpload,
  FiTrash2,
  FiDownload,
  FiSearch,
  FiX,
  FiLock,
  FiUnlock,
  FiEye,
  FiLoader,
} from 'react-icons/fi';
import adminService from '../../features/admin/adminService';
import useDocTitle from '../../hooks/useDocTitle';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const CATEGORY_LABELS = {
  datasheet: 'Data Sheet',
  sds: 'Safety Data Sheet (SDS)',
  tds: 'Technical Data Sheet (TDS)',
  certificate: 'Certificate',
  manual: 'Manual',
  other: 'Other',
};

const CATEGORY_COLORS = {
  datasheet: 'bg-blue-100 text-blue-800',
  sds: 'bg-red-100 text-red-800',
  tds: 'bg-purple-100 text-purple-800',
  certificate: 'bg-green-100 text-green-800',
  manual: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800',
};

const FILE_TYPES = ['pdf', 'docx', 'xlsx', 'image', 'other'];

const AdminDocuments = () => {
  useDocTitle('Documents | Admin');
  const { t } = useTranslation();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', search: '', page: 1 });
  const [pagination, setPagination] = useState({});
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Upload form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    product: '',
    fileUrl: '',
    fileType: 'pdf',
    fileSize: '',
    category: 'datasheet',
    isRestricted: true,
    requiresAdminApproval: false,
  });

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const data = await adminService.getAllDocuments(params);
      setDocuments(data.documents || []);
      setPagination(data.pagination || {});
    } catch {
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.fileUrl) {
      toast.error('Title and file URL are required');
      return;
    }
    setUploading(true);
    try {
      const payload = { ...formData };
      if (!payload.product) delete payload.product;
      if (payload.fileSize) payload.fileSize = parseInt(payload.fileSize);
      await adminService.createDocument(payload);
      toast.success('Document created successfully');
      setShowUpload(false);
      setFormData({
        title: '',
        description: '',
        product: '',
        fileUrl: '',
        fileType: 'pdf',
        fileSize: '',
        category: 'datasheet',
        isRestricted: true,
        requiresAdminApproval: false,
      });
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId, title) => {
    if (!window.confirm(`Deactivate document "${title}"? This will hide it from users.`)) return;
    setDeleting(docId);
    try {
      await adminService.deleteDocument(docId);
      toast.success('Document deactivated');
      fetchDocuments();
    } catch {
      toast.error('Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();
  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FiFileText className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDocuments}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary-600"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span className="text-sm">Refresh</span>
          </button>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 transition-colors"
          >
            <FiUpload className="h-4 w-4" />
            <span className="text-sm font-medium">Add Document</span>
          </button>
        </div>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Add New Document</h2>
            <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600">
              <FiX className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-[48px] px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g. Sodium Hydroxide SDS"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File URL *</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-[48px] px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Paste URL or upload a file →"
                  required
                />
                <label
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary-50 text-primary-700 border border-primary-200 rounded-[48px] cursor-pointer hover:bg-primary-100 shrink-0"
                  title="Upload PDF / Word / Excel to R2"
                >
                  {uploadingFile
                    ? <FiLoader className="h-4 w-4 animate-spin" />
                    : <FiUpload className="h-4 w-4" />}
                  <span>{uploadingFile ? 'Uploading…' : 'Upload'}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                    className="hidden"
                    disabled={uploadingFile}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingFile(true);
                      try {
                        const result = await adminService.uploadDocument(file, 'documents');
                        if (result.url) {
                          setFormData((f) => ({
                            ...f,
                            fileUrl: result.url,
                            fileSize: Math.round(result.size / 1024),
                          }));
                          toast.success('File uploaded to R2');
                        }
                      } catch {
                        toast.error('File upload failed');
                      } finally {
                        setUploadingFile(false);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-[48px] px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                rows={2}
                placeholder="Brief description of the document"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 rounded-[48px] px-3 py-2 text-sm"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
              <select
                value={formData.fileType}
                onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                className="w-full border border-gray-300 rounded-[48px] px-3 py-2 text-sm"
              >
                {FILE_TYPES.map((ft) => (
                  <option key={ft} value={ft}>{ft.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product ID (optional)</label>
              <input
                type="text"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                className="w-full border border-gray-300 rounded-[48px] px-3 py-2 text-sm"
                placeholder="MongoDB ObjectId of linked product"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Size (bytes)</label>
              <input
                type="number"
                value={formData.fileSize}
                onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                className="w-full border border-gray-300 rounded-[48px] px-3 py-2 text-sm"
                placeholder="e.g. 1048576"
              />
            </div>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRestricted}
                  onChange={(e) => setFormData({ ...formData, isRestricted: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Restricted (login required)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiresAdminApproval}
                  onChange={(e) => setFormData({ ...formData, requiresAdminApproval: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Admin approval required</span>
              </label>
            </div>
            <div className="md:col-span-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {uploading ? 'Creating...' : 'Create Document'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            placeholder="Search documents..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-[48px] text-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))}
          className="border border-gray-300 rounded-[48px] px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Documents Table */}
      {loading ? (
        <Spinner />
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FiFileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No documents found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Access
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Downloads
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc._id} className={!doc.isActive ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                          {doc.description && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{doc.description}</p>
                          )}
                          <span className="text-xs text-gray-400 uppercase">{doc.fileType}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.other}`}>
                          {CATEGORY_LABELS[doc.category] || doc.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {doc.product?.title || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1">
                          {doc.isRestricted ? (
                            <span className="flex items-center text-xs text-orange-600">
                              <FiLock className="h-3 w-3 mr-1" /> Restricted
                            </span>
                          ) : (
                            <span className="flex items-center text-xs text-green-600">
                              <FiUnlock className="h-3 w-3 mr-1" /> Public
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center space-x-1 text-sm font-medium text-gray-700">
                          <FiDownload className="h-3 w-3" />
                          <span>{doc.downloadCount || 0}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatSize(doc.fileSize)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {doc.isActive && (
                            <button
                              onClick={() => handleDelete(doc._id, doc.title)}
                              disabled={deleting === doc._id}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-none transition-colors disabled:opacity-50"
                              title="Deactivate document"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
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
                Page {pagination.page} of {pagination.pages} ({pagination.total} documents)
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

export default AdminDocuments;

// MukonoTalks

