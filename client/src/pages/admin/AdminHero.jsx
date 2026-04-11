/**
 * Admin Hero Slider Management
 * CRUD operations for hero carousel slides
 * @module pages/admin/AdminHero
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  FiPlus, FiEdit2, FiTrash2, FiImage, FiEye, FiEyeOff,
  FiArrowUp, FiArrowDown, FiX, FiSave, FiAlertTriangle,
} from 'react-icons/fi';
import {
  Monitor, Smartphone, Type, Link2, AlignLeft, AlignCenter,
  Layers, Palette, Hash, SlidersHorizontal, FileText, MousePointer2,
} from 'lucide-react';
import api from '../../app/axios';
import Spinner from '../../components/ui/Spinner';
import useDocTitle from '../../hooks/useDocTitle';
import MediaUploadField from '../../components/admin/MediaUploadField';

const AdminHero = () => {
  useDocTitle('Manage Hero Slider | Admin');

  const { user } = useSelector((state) => state.auth); // token lives in HTTP-only cookie

  // State
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    eyebrow: '',
    description: '',
    ctaText: '',
    ctaLink: '',
    largeImage: '',
    mobileImage: '',
    textBgColor: '#1E40AF',
    order: 0,
    isActive: true,
    showEyebrow: true,
    showTitle: true,
    showDescription: true,
    showCta: true,
    overlayOpacity: 30,
    textAlign: 'left',
    titleTag: 'h1',
  });

  // Fetch all slides — cookie auth handled by axios withCredentials
  const fetchSlides = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/hero');
      setSlides(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load slides');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  // Open modal for create/edit
  const openModal = (slide = null) => {
    if (slide) {
      setEditingSlide(slide);
      setForm({
        title: slide.title,
        eyebrow: slide.eyebrow || '',
        description: slide.description,
        ctaText: slide.ctaText,
        ctaLink: slide.ctaLink || '',
        largeImage: slide.largeImage,
        mobileImage: slide.mobileImage,
        textBgColor: slide.textBgColor || '#1E40AF',
        order: slide.order,
        isActive: slide.isActive,
        showEyebrow:     slide.showEyebrow     !== false,
        showTitle:       slide.showTitle       !== false,
        showDescription: slide.showDescription !== false,
        showCta:         slide.showCta         !== false,
        overlayOpacity:  slide.overlayOpacity  ?? 30,
        textAlign:       slide.textAlign       || 'left',
        titleTag:        slide.titleTag        || 'h1',
      });
    } else {
      setEditingSlide(null);
      setForm({
        title: '',
        eyebrow: '',
        description: '',
        ctaText: '',
        ctaLink: '',
        largeImage: '',
        mobileImage: '',
        textBgColor: '#1E40AF',
        order: slides.length,
        isActive: true,
        showEyebrow: true,
        showTitle: true,
        showDescription: true,
        showCta: true,
        overlayOpacity: 30,
        textAlign: 'left',
        titleTag: 'h1',
      });
    }
    setShowModal(true);
    setError('');
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!form.ctaText.trim()) {
      setError('CTA text is required');
      return;
    }
    if (!form.ctaLink.trim()) {
      setError('CTA link is required');
      return;
    }
    if (!form.largeImage) {
      setError('Desktop image is required');
      return;
    }
    if (!form.mobileImage) {
      setError('Mobile image is required');
      return;
    }

    try {
      setSaving(true);

      if (editingSlide) {
        // Update existing
        await api.put(`/hero/${editingSlide._id}`, form);
      } else {
        // Create new
        await api.post('/hero', form);
      }

      setShowModal(false);
      fetchSlides();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save slide');
    } finally {
      setSaving(false);
    }
  };

  // Toggle active status
  const toggleActive = async (slide) => {
    try {
      await api.put(`/hero/${slide._id}`, { isActive: !slide.isActive });
      fetchSlides();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update slide');
    }
  };

  // Reorder slide
  const reorderSlide = async (slide, direction) => {
    const currentIndex = slides.findIndex((s) => s._id === slide._id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= slides.length) return;

    const otherSlide = slides[newIndex];

    try {
      // Swap order values
      await Promise.all([
        api.put(`/hero/${slide._id}`,     { order: otherSlide.order }),
        api.put(`/hero/${otherSlide._id}`, { order: slide.order }),
      ]);
      fetchSlides();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reorder slides');
    }
  };

  // Delete slide
  const handleDelete = async (id) => {
    try {
      await api.delete(`/hero/${id}`);
      setDeleteConfirm(null);
      fetchSlides();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete slide');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero Slider</h1>
          <p className="text-gray-600 mt-1">
            Manage homepage carousel slides
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="w-5 h-5" />
          Add Slide
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <FiAlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Slides Grid */}
      {slides.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <FiImage className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No slides yet
          </h3>
          <p className="text-gray-600 mb-6">
            Add your first hero slide to get started
          </p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
          >
            <FiPlus className="w-5 h-5" />
            Add First Slide
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {slides.map((slide, index) => (
            <div
              key={slide._id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                !slide.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex flex-col lg:flex-row">
                {/* Image Preview */}
                <div className="relative w-full lg:w-80 h-48 bg-gray-100 flex-shrink-0">
                  <img
                    src={slide.largeImage}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  {!slide.isActive && (
                    <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                      <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
                        Inactive
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-sm font-medium">
                          #{index + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {slide.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {slide.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-sm mt-1">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded"
                          style={{ backgroundColor: slide.textBgColor + '20', color: slide.textBgColor }}
                        >
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: slide.textBgColor }} />
                          {slide.textBgColor}
                        </span>
                        <span className="text-gray-500">CTA: "{slide.ctaText}"</span>
                        {slide.textAlign === 'center' && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">centered</span>
                        )}
                        {slide.overlayOpacity > 0 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">overlay {slide.overlayOpacity}%</span>
                        )}
                        {slide.showEyebrow === false && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">eyebrow off</span>}
                        {slide.showTitle === false && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">title off</span>}
                        {slide.showDescription === false && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">desc off</span>}
                        {slide.showCta === false && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">CTA off</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Reorder */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => reorderSlide(slide, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <FiArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => reorderSlide(slide, 'down')}
                          disabled={index === slides.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <FiArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Toggle Active */}
                      <button
                        onClick={() => toggleActive(slide)}
                        className={`p-2 transition-colors ${
                          slide.isActive
                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={slide.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {slide.isActive ? (
                          <FiEye className="w-5 h-5" />
                        ) : (
                          <FiEyeOff className="w-5 h-5" />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => openModal(slide)}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteConfirm(slide)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingSlide ? 'Edit Slide' : 'Add New Slide'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-none hover:bg-gray-100"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Error in modal */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                  <Type className="w-3.5 h-3.5 text-gray-400" /> Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Industrial Grade Chemicals"
                />
              </div>

              {/* Eyebrow */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-gray-400" /> Eyebrow Label
                  <span className="ml-1.5 font-normal text-xs text-gray-400">small text above the title</span>
                </label>
                <input
                  type="text"
                  value={form.eyebrow}
                  onChange={(e) => setForm((prev) => ({ ...prev, eyebrow: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="MukonoTalks · Your tagline"
                />
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-400" /> Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Premium quality chemicals for your manufacturing needs..."
                />
              </div>

              {/* CTA Text */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                  <MousePointer2 className="w-3.5 h-3.5 text-gray-400" /> Button Text <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.ctaText}
                  onChange={(e) => setForm((prev) => ({ ...prev, ctaText: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Read Latest News"
                />
              </div>

              {/* CTA Link */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                  <Link2 className="w-3.5 h-3.5 text-gray-400" /> Button Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.ctaLink}
                  onChange={(e) => setForm((prev) => ({ ...prev, ctaLink: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="/news"
                />
              </div>

              {/* Images */}
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-3">
                  <Layers className="w-3.5 h-3.5 text-gray-400" /> Slide Images
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <MediaUploadField
                    label="Desktop Image"
                    hint="shown on screens ≥ 768 px"
                    required
                    folder="hero"
                    recommendedSize="1920×1080"
                    value={form.largeImage}
                    onChange={(url) => setForm((prev) => ({ ...prev, largeImage: url }))}
                  />
                  <MediaUploadField
                    label="Mobile Image"
                    hint="shown on screens < 768 px"
                    required
                    folder="hero"
                    recommendedSize="800×600"
                    value={form.mobileImage}
                    onChange={(url) => setForm((prev) => ({ ...prev, mobileImage: url }))}
                  />
                </div>
              </div>

              {/* Color & Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                    <Palette className="w-3.5 h-3.5 text-gray-400" /> Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.textBgColor}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, textBgColor: e.target.value }))
                      }
                      className="w-12 h-10 rounded-[48px] cursor-pointer border"
                    />
                    <input
                      type="text"
                      value={form.textBgColor}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, textBgColor: e.target.value }))
                      }
                      className="flex-1 px-3 py-2 border rounded-[48px] focus:ring-2 focus:ring-blue-500"
                      placeholder="#1E40AF"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                    <Hash className="w-3.5 h-3.5 text-gray-400" /> Display Order
                  </label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        order: parseInt(e.target.value) || 0,
                      }))
                    }
                    min={0}
                    className="w-full px-3 py-2 border rounded-[48px] focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className="text-sm text-gray-700">
                  Published (visible on homepage)
                </span>
              </div>

              {/* Visibility & Layout */}
              <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" /> Visibility &amp; Layout
                </p>

                {/* Element visibility toggles */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    { field: 'showEyebrow',     label: 'Show Eyebrow Label' },
                    { field: 'showTitle',       label: 'Show Title'         },
                    { field: 'showDescription', label: 'Show Description'   },
                    { field: 'showCta',         label: 'Show CTA Button'    },
                  ].map(({ field, label }) => (
                    <label key={field} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form[field]}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, [field]: e.target.checked }))
                        }
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>

                {/* Text Alignment */}
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 w-28 shrink-0">
                    <AlignLeft className="w-3.5 h-3.5 text-gray-400" /> Text Align
                  </span>
                  <div className="flex gap-2">
                    {['left', 'center'].map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, textAlign: a }))}
                        className={`px-4 py-1.5 text-sm rounded-none border transition-colors capitalize ${
                          form.textAlign === a
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 text-gray-600 hover:border-blue-400'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title Tag */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-24 shrink-0">Title Tag</span>
                  <div className="flex gap-2">
                    {['h1', 'h2'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, titleTag: tag }))}
                        className={`px-4 py-1.5 text-sm rounded-none border font-mono transition-colors ${
                          form.titleTag === tag
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 text-gray-600 hover:border-blue-400'
                        }`}
                      >
                        &lt;{tag}&gt;
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">use h2 if another h1 exists above</span>
                </div>

                {/* Overlay Opacity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image Overlay Darkness
                    <span className="ml-2 text-xs text-gray-400 font-normal">{form.overlayOpacity}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    value={form.overlayOpacity}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, overlayOpacity: Number(e.target.value) }))
                    }
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>0% — no overlay</span>
                    <span>80% — very dark</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <Spinner size="sm" />
                  ) : (
                    <FiSave className="w-5 h-5" />
                  )}
                  {editingSlide ? 'Update Slide' : 'Create Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <FiAlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">Delete Slide?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deleteConfirm.title}"? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm._id)}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHero;

// MukonoTalks

