/**
 * AdminHomeSections
 * Tabbed editor for all six editable homepage sections.
 * Follows the same pattern as AdminHero (direct API calls, modal-free inline editing).
 * @module pages/admin/AdminHomeSections
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Factory,
  Package,
  ShieldCheck,
  HelpCircle,
  Megaphone,
  Video,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  GripVertical,
  Pencil,
  X,
  Type,
  ShoppingBag,
  Heart,
} from 'lucide-react';
import api from '../../app/axios';
import Spinner from '../../components/ui/Spinner';
import useDocTitle from '../../hooks/useDocTitle';
import { getLucideIcon, ICON_GROUPS } from '../../utils/getLucideIcon';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */

const SECTION_TABS = [
  { key: 'intro',              label: 'Intro',               icon: Type,           color: 'text-indigo-600'  },
  { key: 'featured-products',  label: 'Featured Products',   icon: ShoppingBag,    color: 'text-amber-600'   },
  { key: 'values',             label: 'Value Propositions',  icon: Heart,          color: 'text-rose-600'    },
  { key: 'industries',         label: 'Industries',          icon: Factory,        color: 'text-blue-600'    },
  { key: 'products',           label: 'Products',            icon: Package,        color: 'text-green-600'   },
  { key: 'advantages',         label: 'Advantages',          icon: ShieldCheck,    color: 'text-purple-600'  },
  { key: 'faq',                label: 'FAQ',                 icon: HelpCircle,     color: 'text-orange-600'  },
  { key: 'cta',                label: 'CTA Banner',          icon: Megaphone,      color: 'text-pink-600'    },
  { key: 'video',              label: 'Video',               icon: Video,          color: 'text-teal-600'    },
];

const SECTION_CONFIG = {
  intro: {
    itemFields:  [],
    itemLabel:   '',
    hasItems:    false,
    hasHeading:  true,
    hasCtaBtns:  false,
    hasVideo:    false,
    hasBottomCta: false,
  },
  'featured-products': {
    itemFields:  [],
    itemLabel:   '',
    hasItems:    false,
    hasHeading:  true,
    hasCtaBtns:  false,
    hasVideo:    false,
    hasBottomCta: false,
  },
  values: {
    itemFields:  ['icon', 'title', 'description'],
    itemLabel:   'Value Card',
    hasItems:    true,
    hasHeading:  true,
    hasCtaBtns:  false,
    hasVideo:    false,
    hasBottomCta: false,
  },
  industries: {
    itemFields:  ['icon', 'title', 'description'],
    itemLabel:   'Industry Card',
    hasItems:    true,
    hasHeading:  true,
    hasCtaBtns:  false,
    hasVideo:    false,
    hasBottomCta: false,
  },
  products: {
    itemFields:  ['icon', 'title', 'description', 'link'],
    itemLabel:   'Product Card',
    hasItems:    true,
    hasHeading:  true,
    hasCtaBtns:  false,
    hasVideo:    false,
    hasBottomCta: true,
  },
  advantages: {
    itemFields:  ['icon', 'title', 'description'],
    itemLabel:   'Advantage Card',
    hasItems:    true,
    hasHeading:  true,
    hasCtaBtns:  false,
    hasVideo:    false,
    hasBottomCta: false,
  },
  faq: {
    itemFields:  ['title', 'description'],         // title = question, description = answer
    itemLabel:   'FAQ Item',
    hasItems:    true,
    hasHeading:  true,
    hasCtaBtns:  false,
    hasVideo:    false,
    hasBottomCta: false,
    itemTitleLabel: 'Question',
    itemDescLabel:  'Answer',
  },
  cta: {
    itemFields:  ['icon', 'label'],
    itemLabel:   'Perk',
    hasItems:    true,
    hasHeading:  true,
    hasCtaBtns:  true,
    hasVideo:    false,
    hasBottomCta: false,
  },
  video: {
    itemFields:  [],
    itemLabel:   '',
    hasItems:    false,
    hasHeading:  true,
    hasCtaBtns:  false,
    hasVideo:    true,
    hasBottomCta: false,
  },
};

/* ═══════════════════════════════════════════════════════════
   ICON PICKER
═══════════════════════════════════════════════════════════ */

const IconPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? ICON_GROUPS.map((g) => ({
        ...g,
        icons: g.icons.filter((n) => n.toLowerCase().includes(search.toLowerCase())),
      })).filter((g) => g.icons.length > 0)
    : ICON_GROUPS;

  const SelectedIcon = getLucideIcon(value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 border rounded-none bg-white hover:bg-gray-50 transition-colors w-full text-left"
      >
        <SelectedIcon size={18} className="text-gray-600 flex-shrink-0" />
        <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">{value || 'Select icon…'}</span>
        <Pencil size={14} className="text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 top-full left-0 w-72 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search icons…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="p-2 max-h-64 overflow-y-auto space-y-3">
            {filtered.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1 px-1">
                  {group.label}
                </p>
                <div className="grid grid-cols-8 gap-1">
                  {group.icons.map((name) => {
                    const Icon = getLucideIcon(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        title={name}
                        onClick={() => { onChange(name); setOpen(false); setSearch(''); }}
                        className={`p-1.5 rounded-none hover:bg-blue-50 transition-colors flex items-center justify-center ${value === name ? 'bg-blue-100 ring-2 ring-blue-500' : ''}`}
                      >
                        <Icon size={16} className={value === name ? 'text-blue-600' : 'text-gray-600'} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 border-t bg-gray-50">
            <button type="button" onClick={() => { setOpen(false); setSearch(''); }} className="w-full text-xs text-gray-500 hover:text-gray-700 py-1">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   HEADING EDITOR
═══════════════════════════════════════════════════════════ */

const HeadingEditor = ({ heading, onChange }) => (
  <div className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
      <LayoutDashboard size={16} className="text-gray-500" />
      Section Heading
    </h3>
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
        Eyebrow Label
        <span className="ml-1.5 font-normal normal-case text-gray-400">(small text above title)</span>
      </label>
      <input
        type="text"
        value={heading.eyebrow || ''}
        onChange={(e) => onChange({ ...heading, eyebrow: e.target.value })}
        className="w-full px-3 py-2 text-sm border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder="E.g. Sectors We Serve"
      />
    </div>
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
        Title
      </label>
      <input
        type="text"
        value={heading.title || ''}
        onChange={(e) => onChange({ ...heading, title: e.target.value })}
        className="w-full px-3 py-2 text-sm border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder="Section title"
      />
    </div>
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
        Description
      </label>
      <textarea
        rows={3}
        value={heading.description || ''}
        onChange={(e) => onChange({ ...heading, description: e.target.value })}
        className="w-full px-3 py-2 text-sm border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
        placeholder="Short paragraph below the title"
      />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   SINGLE ITEM EDITOR
═══════════════════════════════════════════════════════════ */

const ItemEditor = ({ item, index, config, total, onChange, onDelete, onMove }) => {
  const { itemFields, itemTitleLabel = 'Title', itemDescLabel = 'Description' } = config;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Item header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <GripVertical size={14} className="text-gray-400" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-1">
          {config.itemLabel} #{index + 1}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(index, 'up')}
            disabled={index === 0}
            className="p-1 rounded-none hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 'down')}
            disabled={index === total - 1}
            className="p-1 rounded-none hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
          >
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(index)}
            className="p-1 rounded-none hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Item fields */}
      <div className="p-4 space-y-3">
        {itemFields.includes('icon') && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Icon</label>
            <IconPicker value={item.icon || ''} onChange={(v) => onChange(index, { ...item, icon: v })} />
          </div>
        )}
        {itemFields.includes('title') && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{itemTitleLabel}</label>
            <input
              type="text"
              value={item.title || ''}
              onChange={(e) => onChange(index, { ...item, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}
        {itemFields.includes('label') && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Label</label>
            <input
              type="text"
              value={item.label || ''}
              onChange={(e) => onChange(index, { ...item, label: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}
        {itemFields.includes('description') && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{itemDescLabel}</label>
            <textarea
              rows={3}
              value={item.description || ''}
              onChange={(e) => onChange(index, { ...item, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>
        )}
        {itemFields.includes('link') && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Link URL</label>
            <input
              type="text"
              value={item.link || ''}
              onChange={(e) => onChange(index, { ...item, link: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="/products?category=..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   CTA BUTTONS EDITOR
═══════════════════════════════════════════════════════════ */

const CtaButtonsEditor = ({ buttons, onChange }) => {
  const addButton = () =>
    onChange([...buttons, { text: '', link: '', variant: 'primary' }]);

  const removeButton = (i) =>
    onChange(buttons.filter((_, idx) => idx !== i));

  const updateButton = (i, field, value) =>
    onChange(buttons.map((b, idx) => (idx === i ? { ...b, [field]: value } : b)));

  return (
    <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Megaphone size={16} className="text-gray-500" />
          Action Buttons
        </h3>
        <button
          type="button"
          onClick={addButton}
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded-none hover:bg-blue-50 transition-colors"
        >
          <Plus size={14} /> Add Button
        </button>
      </div>
      {buttons.map((btn, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Button {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeButton(i)}
              className="text-red-400 hover:text-red-600 p-1 rounded-none hover:bg-red-50"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Button Text</label>
              <input
                type="text"
                value={btn.text}
                onChange={(e) => updateButton(i, 'text', e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Create Business Account"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Link URL</label>
              <input
                type="text"
                value={btn.link}
                onChange={(e) => updateButton(i, 'link', e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="/register"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Style</label>
            <div className="flex gap-3">
              {['primary', 'outline'].map((v) => (
                <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name={`btn-variant-${i}`}
                    value={v}
                    checked={btn.variant === v}
                    onChange={() => updateButton(i, 'variant', v)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700 capitalize">{v}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ))}
      {buttons.length === 0 && (
        <p className="text-sm text-gray-400 italic">No buttons yet — add one above.</p>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   VIDEO EDITOR
═══════════════════════════════════════════════════════════ */

const VideoEditor = ({ form, onChange }) => (
  <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
      <Video size={16} className="text-gray-500" />
      Video Settings
    </h3>
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">
        YouTube Embed URL
        <span className="ml-1.5 font-normal normal-case text-gray-400">(use /embed/ format)</span>
      </label>
      <input
        type="url"
        value={form.videoUrl || ''}
        onChange={(e) => onChange({ ...form, videoUrl: e.target.value })}
        className="w-full px-3 py-2 text-sm border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder="https://www.youtube.com/embed/VIDEO_ID"
      />
    </div>
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">
        Thumbnail Image URL
        <span className="ml-1.5 font-normal normal-case text-gray-400">(shown before video plays)</span>
      </label>
      <input
        type="url"
        value={form.thumbnailUrl || ''}
        onChange={(e) => onChange({ ...form, thumbnailUrl: e.target.value })}
        className="w-full px-3 py-2 text-sm border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder="https://..."
      />
      {form.thumbnailUrl && (
        <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 aspect-video max-w-xs">
          <img
            src={form.thumbnailUrl}
            alt="Thumbnail preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">Video Caption</label>
      <input
        type="text"
        value={form.videoCaption || ''}
        onChange={(e) => onChange({ ...form, videoCaption: e.target.value })}
        className="w-full px-3 py-2 text-sm border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder="MukonoTalks · Manufacturing Process Overview"
      />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   BOTTOM CTA EDITOR (Products section)
═══════════════════════════════════════════════════════════ */

const BottomCtaEditor = ({ form, onChange }) => (
  <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
      <Megaphone size={16} className="text-gray-500" />
      Bottom CTA Button
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Button Text</label>
        <input
          type="text"
          value={form.bottomCtaText || ''}
          onChange={(e) => onChange({ ...form, bottomCtaText: e.target.value })}
          className="w-full px-3 py-2 text-sm border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="View Full Product Catalogue"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Button Link</label>
        <input
          type="text"
          value={form.bottomCtaLink || ''}
          onChange={(e) => onChange({ ...form, bottomCtaLink: e.target.value })}
          className="w-full px-3 py-2 text-sm border rounded-[48px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="/products"
        />
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   SECTION EDITOR (composes all sub-editors)
═══════════════════════════════════════════════════════════ */

const SectionEditor = ({ sectionKey, data, onSave, saving }) => {
  const config = SECTION_CONFIG[sectionKey];
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);

  // Sync form when data changes (tab switch / initial load)
  useEffect(() => {
    if (data) {
      setForm(JSON.parse(JSON.stringify(data))); // deep clone
      setDirty(false);
    }
  }, [data]);

  if (!form) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const update = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  /* Items helpers */
  const addItem = () => {
    const newItem = { icon: '', title: '', description: '', link: '', label: '', order: form.items.length };
    update({ items: [...form.items, newItem] });
  };

  const updateItem = (idx, updated) => {
    const next = form.items.map((it, i) => (i === idx ? updated : it));
    update({ items: next });
  };

  const deleteItem = (idx) => {
    update({ items: form.items.filter((_, i) => i !== idx) });
  };

  const moveItem = (idx, dir) => {
    const next = [...form.items];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    update({ items: next });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(sectionKey, form);
    setDirty(false);
  };

  const handleReset = () => {
    if (data) {
      setForm(JSON.parse(JSON.stringify(data)));
      setDirty(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Active toggle */}
      <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
        <div className="flex items-center gap-3">
          {form.isActive ? (
            <Eye size={18} className="text-green-600" />
          ) : (
            <EyeOff size={18} className="text-gray-400" />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {form.isActive ? 'Section is visible on homepage' : 'Section is hidden from homepage'}
            </p>
            <p className="text-xs text-gray-500">Toggle to show or hide this section</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => update({ isActive: !form.isActive })}
          className={`relative inline-flex h-6 w-11 items-center rounded-none transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            form.isActive ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              form.isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Heading */}
      {config.hasHeading && (
        <HeadingEditor
          heading={form.heading || {}}
          onChange={(h) => update({ heading: h })}
        />
      )}

      {/* Items */}
      {config.hasItems && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              {config.itemLabel}s
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({form.items?.length ?? 0} items)
              </span>
            </h3>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-none hover:bg-blue-50 border border-blue-200 transition-colors"
            >
              <Plus size={15} /> Add {config.itemLabel}
            </button>
          </div>

          {(form.items || []).map((item, idx) => (
            <ItemEditor
              key={idx}
              item={item}
              index={idx}
              config={config}
              total={form.items.length}
              onChange={updateItem}
              onDelete={deleteItem}
              onMove={moveItem}
            />
          ))}

          {(!form.items || form.items.length === 0) && (
            <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-400 text-sm">
              No items yet — add one above.
            </div>
          )}
        </div>
      )}

      {/* CTA Buttons (CTA section) */}
      {config.hasCtaBtns && (
        <CtaButtonsEditor
          buttons={form.ctaButtons || []}
          onChange={(btns) => update({ ctaButtons: btns })}
        />
      )}

      {/* Bottom CTA (Products section) */}
      {config.hasBottomCta && (
        <BottomCtaEditor form={form} onChange={(patch) => update(patch)} />
      )}

      {/* Video settings */}
      {config.hasVideo && (
        <VideoEditor form={form} onChange={(patch) => update(patch)} />
      )}

      {/* Save / Reset */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving || !dirty}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2.5 rounded-none font-semibold text-sm transition-colors"
        >
          {saving ? <Spinner size="sm" /> : <Save size={16} />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={!dirty}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 disabled:text-gray-300 px-4 py-2.5 rounded-none font-semibold text-sm border border-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw size={15} /> Discard Changes
        </button>
        {dirty && (
          <span className="text-xs text-amber-600 flex items-center gap-1">
            <AlertTriangle size={13} /> Unsaved changes
          </span>
        )}
      </div>
    </form>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */

const AdminHomeSections = () => {
  useDocTitle('Homepage Sections | Admin');

  const [activeTab, setActiveTab]     = useState('intro');
  const [sectionData, setSectionData] = useState({});  // keyed by sectionKey
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState(null); // { type: 'success'|'error', msg }

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  /* Fetch all sections on mount */
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/homepage-sections');
      const byKey = {};
      data.forEach((s) => { byKey[s.sectionKey] = s; });
      setSectionData(byKey);
    } catch {
      showToast('error', 'Failed to load homepage sections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* Save a single section */
  const handleSave = async (sectionKey, formData) => {
    try {
      setSaving(true);
      const { data } = await api.put(`/homepage-sections/${sectionKey}`, formData);
      setSectionData((prev) => ({ ...prev, [sectionKey]: data }));
      showToast('success', `"${SECTION_TABS.find((t) => t.key === sectionKey)?.label}" saved successfully.`);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const activeSection = SECTION_TABS.find((t) => t.key === activeTab);
  const ActiveIcon = activeSection?.icon || LayoutDashboard;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <LayoutDashboard size={24} className="text-blue-600" />
          Homepage Sections
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Edit content for all homepage sections. Changes are saved per section and reflect immediately.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
          ) : (
            <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
          )}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* ─── Sidebar tabs ─── */}
        <aside className="w-56 flex-shrink-0">
          <nav className="space-y-1 sticky top-6">
            {SECTION_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.key;
              const isEmpty = !sectionData[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-none text-sm font-medium transition-all text-left ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <TabIcon size={17} className={isActive ? 'text-white' : tab.color} />
                  <span className="flex-1">{tab.label}</span>
                  {isEmpty && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                      Not seeded
                    </span>
                  )}
                  {!isEmpty && sectionData[tab.key]?.isActive === false && (
                    <EyeOff size={13} className={isActive ? 'text-white/70' : 'text-gray-400'} />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ─── Editor panel ─── */}
        <main className="flex-1 min-w-0">
          {/* Panel header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="p-2.5 rounded-xl bg-gray-100">
              <ActiveIcon size={20} className={activeSection?.color} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{activeSection?.label}</h2>
              <p className="text-xs text-gray-500 capitalize">{activeTab} section</p>
            </div>
          </div>

          {sectionData[activeTab] ? (
            <SectionEditor
              key={activeTab}
              sectionKey={activeTab}
              data={sectionData[activeTab]}
              onSave={handleSave}
              saving={saving}
            />
          ) : (
            /* Not seeded yet — show a seed prompt */
            <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <AlertTriangle size={40} className="mx-auto text-amber-400 mb-4" />
              <h3 className="font-semibold text-gray-800 mb-2">Section not seeded</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
                Run <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">npm run seed:home</code>{' '}
                from the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">/server</code> directory
                to populate default content, then refresh this page.
              </p>
              <button
                type="button"
                onClick={fetchAll}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2"
              >
                <RotateCcw size={14} /> Refresh
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminHomeSections;

// MukonoTalks

