/**
 * Admin Users page
 * User management with approval and role assignment
 * @module pages/admin/AdminUsers
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUsers } from '../../features/admin/adminSlice';
import adminService from '../../features/admin/adminService';
import { FiSearch, FiChevronLeft, FiChevronRight, FiCheckCircle, FiTrash2, FiUserPlus, FiX } from 'react-icons/fi';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

const ROLE_BADGE = {
  customer: 'bg-blue-100 text-blue-700',
  admin: 'bg-amber-100 text-amber-700',
  developer: 'bg-purple-100 text-purple-700',
};

const CreateUserModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer', companyName: '', isApproved: true });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.createUser(form);
      toast.success('User created successfully');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FiX /></button>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Create New User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field w-full" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field w-full" placeholder="user@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input required type="password" minLength={8} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-field w-full" placeholder="Min. 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input-field w-full">
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company (optional)</label>
            <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} className="input-field w-full" placeholder="Acme Corp" />
          </div>
          <div className="flex items-center gap-2">
            <input id="approved" type="checkbox" checked={form.isApproved} onChange={e => setForm(f => ({ ...f, isApproved: e.target.checked }))} className="rounded" />
            <label htmlFor="approved" className="text-sm text-gray-700">Mark as approved</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Creating...' : 'Create User'}</button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const dispatch = useDispatch();
  const { users, pagination, isLoading } = useSelector((state) => state.admin);
  const { isDeveloper } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    dispatch(fetchAllUsers({ page, search: search || undefined }));
  }, [dispatch, page, search]);

  const reload = () => dispatch(fetchAllUsers({ page, search: search || undefined }));

  const handleApprove = async (userId) => {
    try {
      await adminService.updateUser(userId, { isApproved: true });
      toast.success('User approved');
      dispatch(fetchAllUsers({ page, search: search || undefined }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await adminService.updateUser(userId, { role });
      toast.success('Role updated');
      dispatch(fetchAllUsers({ page, search: search || undefined }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await adminService.deleteUser(userId);
      toast.success('User deleted');
      dispatch(fetchAllUsers({ page, search: search || undefined }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        {isDeveloper && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <FiUserPlus className="h-4 w-4" />
            Create User
          </button>
        )}
      </div>

      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onCreated={reload} />
      )}

      <div className="relative mb-6 max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input-field pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No users found.</div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Company</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Role</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Approved</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Registered</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {u.companyName || '-'}
                      {u.companyType && (
                        <span className="text-xs text-gray-400 block">{u.companyType}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="input-field text-xs py-1 w-28"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                        {isDeveloper && <option value="developer">Developer</option>}
                      </select>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {u.isApproved ? (
                        <FiCheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <button onClick={() => handleApprove(u._id)} className="btn-secondary text-xs py-1 px-3">
                          Approve
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {new Date(u.createdAt).toLocaleDateString('en-ZA')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(u._id, u.name)} className="text-red-500 hover:text-red-600 p-1">
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2 border disabled:opacity-40">
                <FiChevronLeft />
              </button>
              <span className="text-sm text-gray-600">Page {page} of {pagination.totalPages}</span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="p-2 border disabled:opacity-40">
                <FiChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminUsers;

// MukonoTalks

