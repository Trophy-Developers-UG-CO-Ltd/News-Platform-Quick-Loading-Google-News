/**
 * Admin Advertise Inquiries
 * Manage ad lead submissions and workflow statuses
 * @module pages/admin/AdminAdvertiseInquiries
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  FiMessageSquare,
  FiSearch,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import adminService from '../../features/admin/adminService';
import Spinner from '../../components/ui/Spinner';
import useDocTitle from '../../hooks/useDocTitle';

const STATUS_OPTIONS = ['new', 'contacted', 'closed'];

const STATUS_CLASSES = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-green-100 text-green-700',
};

const toWhatsappLink = (phone) => {
  const normalized = String(phone || '').replace(/\D/g, '');
  if (!normalized) return null;
  return `https://wa.me/${normalized}`;
};

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleString('en-UG');
  } catch {
    return value;
  }
};

const AdminAdvertiseInquiries = () => {
  useDocTitle('Advertise Inquiries | Admin');

  const [inquiries, setInquiries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const page = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;

  const fetchInquiries = useCallback(async (nextPage = page) => {
    setLoading(true);
    try {
      const response = await adminService.getAdvertiseInquiries({
        page: nextPage,
        limit: 20,
        search: search || undefined,
        status: status || undefined,
      });

      const data = response?.data || {};
      setInquiries(data.inquiries || []);
      setPagination(data.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchInquiries(1);
  }, [search, status, fetchInquiries]);

  const handleStatusChange = async (id, nextStatus) => {
    setUpdatingId(id);
    try {
      await adminService.updateAdvertiseInquiryStatus(id, { status: nextStatus });
      setInquiries((prev) => prev.map((item) => (
        item._id === id ? { ...item, status: nextStatus } : item
      )));
      toast.success('Inquiry status updated.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Status update failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <FiMessageSquare className="h-7 w-7 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-800">Advertise Inquiries</h1>
        </div>

        <button
          onClick={() => fetchInquiries(page)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600"
        >
          <FiRefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="md:col-span-2 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by phone, business, name or message"
            className="input-field pl-10"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input-field"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No advertise inquiries found.</div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name / Business</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Budget</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Message</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {inquiries.map((item) => {
                  const whatsapp = toWhatsappLink(item.phone);

                  return (
                    <tr key={item._id} className="hover:bg-gray-50 align-top">
                      <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>

                      <td className="px-4 py-4 text-sm font-medium text-gray-800 whitespace-nowrap">
                        {item.phone}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        <p className="font-medium">{item.name || 'No name'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.business || 'No business provided'}</p>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {item.budgetRange || '—'}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700 max-w-md">
                        <p className="line-clamp-3 whitespace-pre-wrap">{item.message}</p>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_CLASSES[item.status] || 'bg-gray-100 text-gray-700'}`}>
                            {item.status}
                          </span>

                          <select
                            value={item.status}
                            disabled={updatingId === item._id}
                            onChange={(e) => handleStatusChange(item._id, e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-xs"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        {whatsapp ? (
                          <a
                            href={whatsapp}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-green-700 hover:text-green-800 text-sm font-medium"
                          >
                            WhatsApp
                            <FiExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">No action</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => fetchInquiries(page - 1)}
                className="p-2 border border-gray-300 disabled:opacity-40"
              >
                <FiChevronLeft />
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => fetchInquiries(page + 1)}
                className="p-2 border border-gray-300 disabled:opacity-40"
              >
                <FiChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminAdvertiseInquiries;

// MukonoTalks
