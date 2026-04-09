/**
 * AdminLayout — Premium Admin Shell
 * Fixed left sidebar with collapsible navigation + mobile overlay drawer
 * @module components/layout/AdminLayout
 */

import React, { useState, useCallback } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  ImageIcon,
  LayoutTemplate,
  Users,
  Navigation,
  PanelBottom,
  FolderOpen,
  Globe,
  Languages,
  Code2,
  ArrowLeftRight,
  Workflow,
  Settings2,
  Map,
  DatabaseZap,
  TrendingUp,
  ScanLine,
  BarChart2,
  ShieldCheck,
  Download,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  LogOut,
  User,
  Palette,
  Tag,
  Layers,
  FileCode2,
  Wrench,
  Shapes,
  MessageSquare,
} from 'lucide-react';

/* ── Nav data ──────────────────────────────────────────────────── */
const NAV = [
  {
    label: 'MAIN',
    items: [
      { to: '/admin', exact: true, icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { to: '/admin/pages',              icon: FileText,       label: 'CMS Pages' },
      { to: '/admin/articles',           icon: BookOpen,       label: 'Articles' },
      { to: '/admin/hero',               icon: ImageIcon,      label: 'Hero Slider' },
      { to: '/admin/home-sections',      icon: LayoutTemplate, label: 'Home Sections' },
    ],
  },
  {
    label: 'EDITORIAL',
    items: [
      { to: '/admin/users',      icon: Users,       label: 'Users' },
      { to: '/admin/categories', icon: Shapes,      label: 'Categories' },
      { to: '/admin/advertise-inquiries', icon: MessageSquare, label: 'Advertise Inquiries' },
    ],
  },
  {
    label: 'SITE STRUCTURE',
    items: [
      { to: '/admin/navigation', icon: Navigation,  label: 'Nav Menu' },
      { to: '/admin/footer',     icon: PanelBottom, label: 'Footer' },
      { to: '/admin/documents',  icon: FolderOpen,  label: 'Documents' },
    ],
  },
  {
    label: 'SEO ENGINE',
    items: [
      { to: '/admin/seo/overview',  icon: Globe,          label: 'Overview' },
      { to: '/admin/seo/metadata',  icon: Tag,            label: 'Metadata' },
      { to: '/admin/seo/schema',    icon: Code2,          label: 'Schema' },
      { to: '/admin/redirects',     icon: ArrowLeftRight, label: 'URL Redirects' },
      { to: '/admin/seo/links',     icon: Workflow,       label: 'Internal Links' },
      { to: '/admin/seo/technical', icon: Settings2,      label: 'Technical SEO' },
      { to: '/admin/seo/sitemap',   icon: Map,            label: 'Sitemap' },
      { to: '/admin/seo/indexing',  icon: DatabaseZap,    label: 'Indexing' },
      { to: '/admin/seo/analytics', icon: TrendingUp,     label: 'SEO Analytics' },
      { to: '/admin/seo/analyzer',  icon: ScanLine,       label: 'Content Analyzer' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/admin/translation-dashboard', icon: Languages, label: 'Translation Dashboard' },
      { to: '/admin/analytics',    icon: BarChart2,   label: 'Analytics' },
      { to: '/admin/audit',        icon: ShieldCheck, label: 'Audit Logs' },
      { to: '/admin/download-logs',icon: Download,    label: 'Download Logs' },
    ],
  },
];

/* ── Single nav item ────────────────────────────────────────────── */
const SidebarItem = ({ item, collapsed, onClick }) => {
  const location = useLocation();
  const active = item.exact
    ? location.pathname === item.to
    : location.pathname === item.to || location.pathname.startsWith(item.to + '/');

  const Icon = item.icon;

  return (
    <div className="relative group">
      <NavLink
        to={item.to}
        end={!!item.exact}
        onClick={onClick}
        className={[
          'flex items-center gap-3 px-3 py-2 rounded-lg mx-2 text-sm font-medium transition-colors',
          active
            ? 'bg-accent-blue text-white'
            : 'text-slate-300 hover:bg-slate-800 hover:text-text-primary',
        ].join(' ')}
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </NavLink>

      {/* Tooltip shown in collapsed mode */}
      {collapsed && (
        <div
          className="
            pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3
            py-1 px-2.5 bg-slate-700 text-text-primary text-xs rounded-md shadow-lg
            opacity-0 group-hover:opacity-100 transition-opacity z-[60]
            whitespace-nowrap
          "
        >
          {item.label}
        </div>
      )}
    </div>
  );
};

/* ── Sidebar content (shared between desktop and mobile drawer) ── */
const SidebarContent = ({ collapsed, onNavClick }) => {
  const { user } = useSelector((s) => s.auth);
  const { settings: branding } = useSelector((s) => s.branding);
  const isAdminOrDev = user?.role === 'admin' || user?.role === 'developer';

  const platformName = branding?.platformName || 'MukonoTalks';
  const platformTagline = branding?.platformTagline || 'Admin Panel';
  const accentColor = branding?.primaryColor || '#4f46e5';
  const logoUrl = branding?.logoUrl || null;
  const initial = platformName[0]?.toUpperCase() || 'T';

  // Platform config nav section (admin & developer)
  const platformNav = isAdminOrDev
    ? [{
        label: 'PLATFORM',
        items: [
          { to: '/admin/branding', icon: Palette, label: 'Branding & White Label' },
          ...(user?.role === 'developer'
            ? [{ to: '/admin/maintenance', icon: Wrench, label: 'Maintenance Mode' }]
            : []),
        ],
      }]
    : [];

  const allNav = [...NAV, ...platformNav];

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Brand */}
      <div className={[
        'flex items-center gap-3 px-4 py-4 border-b border-slate-700/60',
        collapsed ? 'justify-center' : '',
      ].join(' ')}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          {logoUrl
            ? <img src={logoUrl} alt="logo" className="w-6 h-6 object-contain" />
            : <span className="font-bold text-sm text-text-primary">{initial}</span>
          }
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-text-primary font-bold text-sm truncate leading-tight">{platformName}</p>
            <p className="text-slate-400 text-xs truncate">{platformTagline}</p>
          </div>
        )}
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
        {allNav.map((section) => (
          <div key={section.label} className="mb-1">
            {!collapsed && (
              <p className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {section.label}
              </p>
            )}
            {section.items.map((item) => (
              <SidebarItem
                key={item.to}
                item={item}
                collapsed={collapsed}
                onClick={onNavClick}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700/60 py-3 px-2 space-y-1">
        {/* Visit site */}
        <div className="relative group">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-text-primary"
          >
            <ExternalLink className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span>View Site</span>}
          </a>
          {collapsed && (
            <div className="pointer-events-none absolute left-full top-1/2 z-[60] ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-700 px-2.5 py-1 text-xs text-text-primary opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              View Site
            </div>
          )}
        </div>

        {/* Social media icons */}
        <div className="flex items-center justify-center gap-3 mt-2">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-slate-400 hover:text-blue-500 transition-colors">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 2.07A10 10 0 1 0 12 22V14.89h-2V12h2v-1.5c0-2.07 1.23-3.22 3.13-3.22.91 0 1.87.16 1.87.16v2.06h-1.06c-1.04 0-1.37.65-1.37 1.32V12h2.34l-.37 2.89h-1.97V22A10 10 0 0 0 17 2.07z"/></svg>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-slate-400 hover:text-blue-400 transition-colors">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.43.36a9.09 9.09 0 0 1-2.88 1.1A4.52 4.52 0 0 0 16.11 0c-2.5 0-4.52 2.02-4.52 4.52 0 .35.04.7.11 1.03C7.69 5.4 4.07 3.67 1.64.9c-.38.65-.6 1.4-.6 2.2 0 1.52.77 2.86 1.94 3.65A4.48 4.48 0 0 1 .96 6v.06c0 2.13 1.52 3.9 3.54 4.3-.37.1-.76.16-1.16.16-.28 0-.55-.03-.81-.08.55 1.7 2.16 2.94 4.07 2.97A9.06 9.06 0 0 1 0 19.54 12.8 12.8 0 0 0 6.95 21.99c8.32 0 12.88-6.89 12.88-12.88 0-.2 0-.39-.01-.58A9.22 9.22 0 0 0 23 3z"/></svg>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-slate-400 hover:text-pink-500 transition-colors">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-slate-400 hover:text-blue-700 transition-colors">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M8 11v5h2v-5H8zm1-2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 2v5h2v-2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V16h2v-2.5c0-2.21-1.79-4-4-4s-4 1.79-4 4z"/></svg>
          </a>
        </div>

        {/* User */}
        {user && (
          <div
            className={[
              'flex items-center gap-2.5 px-3 py-2 rounded-lg',
              collapsed ? 'justify-center' : '',
            ].join(' ')}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              <User className="h-3.5 w-3.5 text-text-primary" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-text-primary">{user.name}</p>
                <p className={`text-[10px] truncate font-medium ${user.role === 'developer' ? 'text-purple-400' : 'text-slate-400'}`}> 
                  {user.role}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main Layout ───────────────────────────────────────────────── */
const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('adminSidebarCollapsed') === 'true'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem('adminSidebarCollapsed', next); } catch {}
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden bg-dark-charcoal">

      {/* ── Desktop sidebar ──────────────────────────────────────── */}
      <aside
        className={[
          'hidden md:flex flex-col flex-shrink-0 relative transition-all duration-250',
          collapsed ? 'w-16' : 'w-64',
        ].join(' ')}
      >
        <SidebarContent collapsed={collapsed} onNavClick={undefined} />

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="
            absolute -right-3 top-[72px]
            w-6 h-6 rounded-none bg-slate-700 border-2 border-slate-900
            flex items-center justify-center
            text-slate-300 hover:text-text-primary hover:bg-accent-blue
            transition-colors z-10 shadow-md
          "
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="w-3 h-3" />
            : <ChevronLeft className="w-3 h-3" />
          }
        </button>
      </aside>

      {/* ── Mobile drawer ────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Drawer */}
          <aside className="w-72 flex-shrink-0 flex flex-col shadow-2xl">
            <SidebarContent collapsed={false} onNavClick={closeMobile} />
          </aside>
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={closeMobile}
          />
        </div>
      )}

      {/* ── Content area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile top bar */}
        <div className="flex-shrink-0 items-center gap-3 border-b border-dark-border bg-dark-black px-4 py-3 md:hidden flex">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-text-secondary transition-colors hover:bg-dark-hover hover:text-text-primary rounded-none"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-blue">
              <span className="text-xs font-bold text-text-primary">A</span>
            </div>
            <span className="text-sm font-semibold text-text-primary">Admin Panel</span>
          </div>
        </div>

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

// MukonoTalks

