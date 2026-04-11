/**
 * AdminLayout — Premium Admin Shell
 * Fixed sidebar with responsive top action bar
 * @module components/layout/AdminLayout
 */

import React, { useCallback, useMemo, useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
  ExternalLink,
  LogOut,
  User,
  Palette,
  Tag,
  Wrench,
  Shapes,
  MessageSquare,
} from 'lucide-react';
import SafeImage from '../common/SafeImage';
import ThemeToggle from '../ui/ThemeToggle';
import useThemeMode from '../../hooks/useThemeMode';
import { logout } from '../../features/auth/authSlice';

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
      { to: '/admin/pages', icon: FileText, label: 'CMS Pages' },
      { to: '/admin/articles', icon: BookOpen, label: 'Articles' },
      { to: '/admin/hero', icon: ImageIcon, label: 'Hero Slider' },
      { to: '/admin/home-sections', icon: LayoutTemplate, label: 'Home Sections' },
    ],
  },
  {
    label: 'EDITORIAL',
    items: [
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/admin/categories', icon: Shapes, label: 'Categories' },
      { to: '/admin/advertise-inquiries', icon: MessageSquare, label: 'Advertise Inquiries' },
    ],
  },
  {
    label: 'SITE STRUCTURE',
    items: [
      { to: '/admin/navigation', icon: Navigation, label: 'Nav Menu' },
      { to: '/admin/footer', icon: PanelBottom, label: 'Footer' },
      { to: '/admin/documents', icon: FolderOpen, label: 'Documents' },
    ],
  },
  {
    label: 'SEO ENGINE',
    items: [
      { to: '/admin/seo/overview', icon: Globe, label: 'Overview' },
      { to: '/admin/seo/metadata', icon: Tag, label: 'Metadata' },
      { to: '/admin/seo/schema', icon: Code2, label: 'Schema' },
      { to: '/admin/redirects', icon: ArrowLeftRight, label: 'URL Redirects' },
      { to: '/admin/seo/links', icon: Workflow, label: 'Internal Links' },
      { to: '/admin/seo/technical', icon: Settings2, label: 'Technical SEO' },
      { to: '/admin/seo/sitemap', icon: Map, label: 'Sitemap' },
      { to: '/admin/seo/indexing', icon: DatabaseZap, label: 'Indexing' },
      { to: '/admin/seo/analytics', icon: TrendingUp, label: 'SEO Analytics' },
      { to: '/admin/seo/analyzer', icon: ScanLine, label: 'Content Analyzer' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/admin/translation-dashboard', icon: Languages, label: 'Translation Dashboard' },
      { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
      { to: '/admin/audit', icon: ShieldCheck, label: 'Audit Logs' },
      { to: '/admin/download-logs', icon: Download, label: 'Download Logs' },
    ],
  },
];

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/articles/new': 'Create a Post',
  '/admin/seo/overview': 'SEO Overview',
  '/admin/seo/metadata': 'Metadata Manager',
  '/admin/seo/schema': 'Schema Engine',
  '/admin/seo/links': 'Internal Links',
  '/admin/seo/technical': 'Technical SEO',
  '/admin/seo/sitemap': 'Sitemap Manager',
  '/admin/seo/indexing': 'Indexing',
  '/admin/seo/analytics': 'SEO Analytics',
  '/admin/seo/analyzer': 'Content Analyzer',
};

const getPageTitle = (pathname) => {
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }

  const navMatch = NAV
    .flatMap((section) => section.items)
    .find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));

  return navMatch?.label || 'Admin Panel';
};

const actionButtonClass = (tone = 'primary') => {
  if (tone === 'ghost') {
    return 'inline-flex items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:border-black hover:bg-black hover:text-white dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-black';
  }

  return 'inline-flex items-center justify-center gap-2 rounded-full border border-black bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90 dark:border-white dark:bg-white dark:text-black dark:hover:bg-neutral-100';
};

const SidebarItem = ({ item, collapsed, onClick }) => {
  const location = useLocation();
  const active = item.exact
    ? location.pathname === item.to
    : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

  const Icon = item.icon;

  return (
    <div className="relative group">
      <NavLink
        to={item.to}
        end={Boolean(item.exact)}
        onClick={onClick}
        className={[
          'mx-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-accent-blue text-white'
            : 'text-slate-300 hover:bg-slate-800 hover:text-text-primary',
        ].join(' ')}
      >
        <Icon className="h-[18px] w-[18px] flex-shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </NavLink>

      {collapsed && (
        <div className="pointer-events-none absolute left-full top-1/2 z-[60] ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-700 px-2.5 py-1 text-xs text-text-primary opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          {item.label}
        </div>
      )}
    </div>
  );
};

const SidebarContent = ({ collapsed, onNavClick }) => {
  const { user } = useSelector((state) => state.auth);
  const { settings: branding } = useSelector((state) => state.branding);
  const isAdminOrDev = user?.role === 'admin' || user?.role === 'developer';

  const platformName = branding?.platformName || 'MukonoTalks';
  const platformTagline = branding?.platformTagline || 'Admin Panel';
  const accentColor = branding?.primaryColor || '#4f46e5';
  const logoUrl = branding?.logoUrl || null;
  const initial = platformName[0]?.toUpperCase() || 'T';

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
    <div className="flex h-full flex-col bg-slate-900">
      <div className={['flex items-center gap-3 border-b border-slate-700/60 px-4 py-4', collapsed ? 'justify-center' : ''].join(' ')}>
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: accentColor }}
        >
          {logoUrl
            ? <SafeImage src={logoUrl} alt="logo" className="h-6 w-6 object-contain" />
            : <span className="text-sm font-bold text-text-primary">{initial}</span>}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-text-primary">{platformName}</p>
            <p className="truncate text-xs text-slate-400">{platformTagline}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
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

      <div className="space-y-1 border-t border-slate-700/60 px-2 py-3">
        <div className="relative group">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-text-primary"
          >
            <ExternalLink className="h-[18px] w-[18px] flex-shrink-0" />
            {!collapsed && <span>View Site</span>}
          </a>
          {collapsed && (
            <div className="pointer-events-none absolute left-full top-1/2 z-[60] ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-700 px-2.5 py-1 text-xs text-text-primary opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              View Site
            </div>
          )}
        </div>

        {user && (
          <div className={['flex items-center gap-2.5 rounded-lg px-3 py-2', collapsed ? 'justify-center' : ''].join(' ')}>
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: accentColor }}
            >
              <User className="h-3.5 w-3.5 text-text-primary" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-text-primary">{user.name}</p>
                <p className={`truncate text-[10px] font-medium ${user.role === 'developer' ? 'text-purple-400' : 'text-slate-400'}`}>
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

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('adminSidebarCollapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useThemeMode();

  const pageTitle = useMemo(() => getPageTitle(location.pathname), [location.pathname]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem('adminSidebarCollapsed', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const handleLogout = useCallback(async () => {
    await dispatch(logout());
    navigate('/');
  }, [dispatch, navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-dark-charcoal">
      <aside
        className={[
          'relative hidden flex-shrink-0 transition-all duration-200 md:flex',
          collapsed ? 'w-16' : 'w-64',
        ].join(' ')}
      >
        <SidebarContent collapsed={collapsed} onNavClick={undefined} />

        <button
          type="button"
          onClick={toggleCollapsed}
          className="absolute -right-3 top-[72px] flex h-6 w-6 items-center justify-center border-2 border-slate-900 bg-slate-700 text-slate-300 shadow-md transition-colors hover:bg-accent-blue hover:text-text-primary"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <aside className="w-72 flex-shrink-0 shadow-2xl">
            <SidebarContent collapsed={false} onNavClick={closeMobile} />
          </aside>
          <button
            type="button"
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={closeMobile}
            aria-label="Close admin navigation"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-black/10 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#0f0f10]/95">
          <div className="flex flex-col gap-3 px-4 py-4 lg:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 bg-white text-black transition hover:border-black hover:bg-black hover:text-white md:hidden dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
                  aria-label="Open admin navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/45 dark:text-white/45">
                    Admin Workspace
                  </p>
                  <h1 className="truncate text-xl font-bold text-black dark:text-white">{pageTitle}</h1>
                </div>
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <Link to="/admin/articles/new" className={actionButtonClass()}>
                  <FileText className="h-4 w-4" />
                  Create a Post
                </Link>
                <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} variant="admin" />
                <button type="button" onClick={handleLogout} className={actionButtonClass('ghost')}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:hidden">
              <Link to="/admin/articles/new" className={actionButtonClass()}>
                <FileText className="h-4 w-4" />
                Create a Post
              </Link>
              <ThemeToggle
                isDarkMode={isDarkMode}
                onToggle={toggleTheme}
                compactOnMobile
                variant="admin"
              />
              <button type="button" onClick={handleLogout} className={actionButtonClass('ghost')}>
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#111111]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
