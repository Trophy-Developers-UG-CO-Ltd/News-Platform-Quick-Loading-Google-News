/**
 * Admin Navigation Menu Editor
 * Drag-to-reorder, inline edit, add/delete nav items — WordPress-style
 * @module pages/admin/AdminNavMenu
 */

import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  GripVertical,
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  ArrowLeft,
  Globe,
  Navigation,
  CheckCircle,
} from 'lucide-react';
import {
  fetchAdminNavItems,
  saveNavItems,
  setItems,
} from '../../features/nav/navSlice';
import useDocTitle from '../../hooks/useDocTitle';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

/* ─── New item template ──────────────────────────────────────── */
const newItem = (order) => ({
  _id: `new-${Date.now()}-${order}`,
  label: 'New Link',
  href: '/',
  isVisible: true,
  openInNewTab: false,
  isExternal: false,
  icon: '',
  order,
  _isNew: true,
});

/* ════════════════════════════════════════════════════════════════
   SORTABLE ITEM ROW
   ════════════════════════════════════════════════════════════════ */
const NavItemRow = ({
  item,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  dragHandleProps,
}) => {
  const [expanded, setExpanded] = useState(item._isNew || false);

  const handleField = (field, value) => onChange(index, { ...item, [field]: value });

  return (
    <div
      className={`bg-white border rounded-xl shadow-sm transition-shadow ${
        expanded ? 'border-primary-300 shadow-md' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* ── Row header ── */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 touch-none"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Expand / collapse */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex-1 flex items-center gap-3 text-left min-w-0"
        >
          <div className="min-w-0">
            <span className="font-semibold text-gray-800 text-sm">{item.label || 'Untitled'}</span>
            <span className="ml-2 text-xs text-gray-400 font-mono truncate">{item.href}</span>
          </div>
          {!item.isVisible && (
            <span className="flex-shrink-0 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              Hidden
            </span>
          )}
          {item.openInNewTab && (
            <ExternalLink className="flex-shrink-0 w-3.5 h-3.5 text-gray-400" />
          )}
        </button>

        {/* Quick actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => handleField('isVisible', !item.isVisible)}
            title={item.isVisible ? 'Hide item' : 'Show item'}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-none transition-colors"
          >
            {item.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="p-1.5 text-gray-300 hover:text-gray-600 disabled:opacity-30 rounded-none transition-colors text-xs font-bold"
          >
            ↑
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={index === total - 1}
            className="p-1.5 text-gray-300 hover:text-gray-600 disabled:opacity-30 rounded-none transition-colors text-xs font-bold"
          >
            ↓
          </button>
          <button
            onClick={() => onDelete(index)}
            className="p-1.5 text-red-400 hover:text-red-600 rounded-none transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Expanded editor ── */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Label *</label>
            <input
              className="w-full border border-gray-200 rounded-[48px] px-3 py-2 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-200"
              value={item.label}
              onChange={(e) => handleField('label', e.target.value)}
              placeholder="e.g. About Us"
              maxLength={60}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Link / URL *</label>
            <input
              className="w-full border border-gray-200 rounded-[48px] px-3 py-2 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-200 font-mono"
              value={item.href}
              onChange={(e) => handleField('href', e.target.value)}
              placeholder="e.g. /about or https://..."
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Icon name <span className="font-normal text-gray-400">(Lucide icon — optional)</span>
            </label>
            <input
              className="w-full border border-gray-200 rounded-[48px] px-3 py-2 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-200"
              value={item.icon || ''}
              onChange={(e) => handleField('icon', e.target.value)}
              placeholder="e.g. Home, Package, Info"
            />
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-400"
                checked={item.isVisible}
                onChange={(e) => handleField('isVisible', e.target.checked)}
              />
              <span className="text-sm text-gray-700">Visible in navigation</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-400"
                checked={item.openInNewTab}
                onChange={(e) => handleField('openInNewTab', e.target.checked)}
              />
              <span className="text-sm text-gray-700">Open in new tab</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-400"
                checked={item.isExternal}
                onChange={(e) => handleField('isExternal', e.target.checked)}
              />
              <span className="text-sm text-gray-700">External link (skip language prefix)</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════ */
const AdminNavMenu = () => {
  useDocTitle('Navigation Menu — Admin');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: storeItems, isLoading, isSaving } = useSelector((state) => state.nav);

  // Local editable copy
  const [localItems, setLocalItems] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  // Track original hrefs at load time to detect URL changes
  const originalHrefsRef = useRef({});

  // Drag state
  const dragIndex = useRef(null);
  const dragOverIndex = useRef(null);

  /* ── Bootstrap ──────────────────────────────────────────────── */
  useEffect(() => {
    dispatch(fetchAdminNavItems());
  }, [dispatch]);

  useEffect(() => {
    if (storeItems.length > 0 && !isDirty) {
      setLocalItems([...storeItems]);
      // Record original hrefs keyed by _id for change detection
      const hrefs = {};
      storeItems.forEach((item) => { hrefs[item._id] = item.href; });
      originalHrefsRef.current = hrefs;
    }
  }, [storeItems, isDirty]);

  /* ── Helpers ────────────────────────────────────────────────── */
  const markDirty = (updated) => {
    setLocalItems(updated);
    setIsDirty(true);
  };

  const handleChange = (index, updated) => {
    const copy = [...localItems];
    copy[index] = updated;
    markDirty(copy);
  };

  const handleDelete = (index) => {
    const copy = localItems.filter((_, i) => i !== index);
    markDirty(copy);
  };

  const handleAdd = () => {
    const added = [...localItems, newItem(localItems.length)];
    markDirty(added);
  };

  const moveItem = (from, to) => {
    if (to < 0 || to >= localItems.length) return;
    const copy = [...localItems];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    markDirty(copy);
  };

  const handleMoveUp   = (i) => moveItem(i, i - 1);
  const handleMoveDown = (i) => moveItem(i, i + 1);

  /* ── Drag & Drop (HTML5) ────────────────────────────────────── */
  const onDragStart  = (i) => { dragIndex.current = i; };
  const onDragEnter  = (i) => { dragOverIndex.current = i; };
  const onDragEnd    = () => {
    const from = dragIndex.current;
    const to   = dragOverIndex.current;
    if (from === null || to === null || from === to) return;
    moveItem(from, to);
    dragIndex.current     = null;
    dragOverIndex.current = null;
  };

  /* ── Save ───────────────────────────────────────────────────── */
  const handleSave = async () => {
    const invalid = localItems.some((i) => !i.label.trim() || !i.href.trim());
    if (invalid) {
      toast.error('All items must have a label and a URL.');
      return;
    }

    try {
      await dispatch(saveNavItems(localItems)).unwrap();
      dispatch(setItems(localItems));
      setIsDirty(false);
      toast.success('Navigation menu saved!');
      // Detect href changes on existing (non-new) items and suggest redirects
      const changedItems = localItems.filter(
        (item) =>
          !item._isNew &&
          originalHrefsRef.current[item._id] &&
          originalHrefsRef.current[item._id] !== item.href
      );

      if (changedItems.length > 0) {
        toast(
          (t) => (
            <span className="text-sm">
              {changedItems.length} nav item URL{changedItems.length > 1 ? 's' : ''} changed.
              {' '}
              <button
                className="text-primary-600 underline font-semibold"
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate('/admin/redirects');
                }}
              >
                Create Redirects
              </button>
            </span>
          ),
          { duration: 8000, icon: '⚠️' }
        );
        // Update baseline after notification
        changedItems.forEach((item) => {
          originalHrefsRef.current[item._id] = item.href;
        });
      }    } catch (err) {
      toast.error(err || 'Save failed');
    }
  };

  /* ── Render ─────────────────────────────────────────────────── */
  if (isLoading && localItems.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 text-gray-500 hover:text-gray-700 rounded-none hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Navigation Menu</h1>
            <p className="text-sm text-gray-500 mt-0.5">Drag items to reorder • Click to expand and edit</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 px-3 py-2 rounded-lg transition-colors"
          >
            <Globe className="w-4 h-4" /> Preview Site
          </a>

          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-none transition-colors"
          >
            {isSaving ? (
              <>
                <Spinner size="sm" /> Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isDirty ? 'Save Changes' : 'Saved'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save alert */}
      {isDirty && (
        <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <Save className="w-4 h-4 flex-shrink-0" />
          You have unsaved changes. Click <strong>Save Changes</strong> to publish them.
        </div>
      )}
      {!isDirty && localItems.length > 0 && (
        <div className="mb-5 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Navigation menu is up to date.
        </div>
      )}

      {/* Item list */}
      <div className="space-y-3">
        {localItems.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Navigation className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No navigation items yet.</p>
            <p className="text-gray-400 text-sm mt-1">Click "Add Item" below to get started.</p>
          </div>
        )}

        {localItems.map((item, index) => (
          <div
            key={item._id || index}
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnter={() => onDragEnter(index)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
          >
            <NavItemRow
              item={item}
              index={index}
              total={localItems.length}
              onChange={handleChange}
              onDelete={handleDelete}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              dragHandleProps={{
                onMouseDown: (e) => e.currentTarget.closest('[draggable]')?.setAttribute('draggable', true),
              }}
            />
          </div>
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={handleAdd}
        className="mt-5 w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-primary-400 text-gray-500 hover:text-primary-600 font-semibold text-sm py-3.5 rounded-none transition-colors"
      >
        <Plus className="w-5 h-5" /> Add Navigation Item
      </button>

      {/* Help */}
      <div className="mt-8 bg-gray-50 rounded-xl p-5 text-sm text-gray-500 space-y-1.5">
        <p className="font-semibold text-gray-700 mb-2">Tips</p>
        <p>• <strong>Drag</strong> the <GripVertical className="w-3.5 h-3.5 inline" /> handle to reorder items, or use the ↑↓ buttons.</p>
        <p>• Use <strong>relative paths</strong> (e.g. <code className="bg-gray-200 px-1 rounded">/about</code>) for internal pages — they will automatically receive the language prefix.</p>
        <p>• Enable <strong>"External link"</strong> for full URLs like <code className="bg-gray-200 px-1 rounded">https://...</code></p>
        <p>• Toggle the <Eye className="w-3.5 h-3.5 inline" /> eye icon to hide an item without deleting it.</p>
      </div>
    </div>
  );
};

export default AdminNavMenu;

// MukonoTalks

