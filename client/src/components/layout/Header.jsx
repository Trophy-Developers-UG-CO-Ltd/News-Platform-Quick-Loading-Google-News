/**
 * Header component
 * Main navigation bar with responsive mobile menu
 * Language-aware navigation using LocalizedLink
 * @module components/layout/Header
 */

import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { logout } from '../../features/auth/authSlice';
import { FiUser, FiMenu, FiX, FiLogOut, FiGrid, FiEdit3, FiMapPin, FiFilm, FiPlayCircle } from 'react-icons/fi';
// import LanguageSwitcher from '../ui/LanguageSwitcher'; // on hold — using GoogleTranslate instead
import GoogleTranslate from '../ui/GoogleTranslate';
import LocalizedLink from '../i18n/LocalizedLink';
import toast from 'react-hot-toast';
import { DEFAULT_LANGUAGE } from '../../i18n';

// Fallback nav items shown when API data is not yet loaded
const FALLBACK_NAV = [
  { _id: 'home',     label: 'Home',     href: '/',         isExternal: false },
  { _id: 'news',     label: 'News',     href: '/news',     isExternal: false },
  { _id: 'local',    label: 'Local Updates', href: '/local', isExternal: false },
  { _id: 'entertainment', label: 'Entertainment', href: '/entertainment', isExternal: false },
  { _id: 'videos',   label: 'Videos',   href: '/videos',   isExternal: false },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { lang } = useParams();
  const currentLang = lang || DEFAULT_LANGUAGE;
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { items: navItems } = useSelector((state) => state.nav);

  // Use API-driven items once loaded; fall back to static list in the meantime
  const navLinks = navItems && navItems.length > 0 ? navItems : FALLBACK_NAV;

  const navLinkClass =
    'text-gray-700 hover:text-primary-600 font-medium text-[15px] tracking-wide transition-colors relative ' +
    'after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-primary-600 ' +
    'hover:after:w-full after:transition-all after:duration-300';

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate(`/${currentLang}`);
    setMenuOpen(false);
  };

  return (
    <header className="bg-white sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="mx-auto px-4 lg:px-20">
        <div className="flex items-center justify-between h-16 lg:h-24">
          {/* Logo */}
          <LocalizedLink to="/" className="flex items-center flex-shrink-0">
            <img src="/mukonoTalksLogo.svg" alt="MukonoTalks" className="h-12 lg:h-16" />
          </LocalizedLink>

          {/* Desktop Navigation — centered */}
          <nav className="hidden md:flex items-center justify-center flex-1 space-x-10 px-8">
            {navLinks.map((item) =>
              item.isExternal ? (
                <a
                  key={item._id}
                  href={item.href}
                  target={item.openInNewTab ? '_blank' : '_self'}
                  rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                  className={navLinkClass}
                >
                  {item.label}
                </a>
              ) : (
                <LocalizedLink key={item._id} to={item.href} className={navLinkClass}>
                  {item.label}
                </LocalizedLink>
              )
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-5 flex-shrink-0">
            {/* <LanguageSwitcher /> — on hold, using Google Translate */}
            <GoogleTranslate />
            {isAuthenticated ? (
              <>
                <div className="relative group">
                  <button className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors">
                    <FiUser className="h-5 w-5" />
                    <span className="font-medium text-sm">{user?.name?.split(' ')[0]}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <LocalizedLink to="/dashboard" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <FiGrid className="mr-2 h-4 w-4" /> {t('nav.dashboard')}
                    </LocalizedLink>
                    <LocalizedLink to="/editor" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <FiEdit3 className="mr-2 h-4 w-4" /> Editorial CMS
                    </LocalizedLink>
                    {(user?.role === 'admin' || user?.role === 'developer') && (
                      <Link to="/admin" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <FiGrid className="mr-2 h-4 w-4" /> {t('nav.admin')}
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <FiLogOut className="mr-2 h-4 w-4" /> {t('nav.logout')}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <LocalizedLink to="/login" className="text-gray-700 hover:text-primary-600 font-medium text-sm transition-colors">
                  {t('nav.signin', 'Sign in')}
                </LocalizedLink>
                <LocalizedLink to="/register" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm px-4 py-2 rounded-none transition-colors">
                  {t('nav.signup', 'Sign up')}
                </LocalizedLink>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-2 pt-4">
              {/* <div className="px-2 py-2"><LanguageSwitcher /></div> — on hold, using Google Translate */}
              <div className="px-2 py-2">
                <GoogleTranslate />
              </div>
              {navLinks.map((item) =>
                item.isExternal ? (
                  <a
                    key={item._id}
                    href={item.href}
                    target={item.openInNewTab ? '_blank' : '_self'}
                    rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                    className="px-2 py-2 text-gray-700 hover:text-primary-600"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <LocalizedLink
                    key={item._id}
                    to={item.href}
                    className="px-2 py-2 text-gray-700 hover:text-primary-600"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </LocalizedLink>
                )
              )}
              {isAuthenticated ? (
                <>
                  <LocalizedLink to="/editor" className="px-2 py-2 text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>
                    Editorial CMS
                  </LocalizedLink>
                  <LocalizedLink to="/dashboard" className="px-2 py-2 text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>
                    {t('nav.dashboard')}
                  </LocalizedLink>
                  {(user?.role === 'admin' || user?.role === 'developer') && (
                    <Link to="/admin" className="px-2 py-2 text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>
                      {t('nav.admin')}
                    </Link>
                  )}
                  <button onClick={handleLogout} className="text-left px-2 py-2 text-red-600 hover:text-red-700">
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <LocalizedLink to="/login" className="px-2 py-2 text-gray-700 hover:text-primary-600 font-medium" onClick={() => setMenuOpen(false)}>
                    {t('nav.signin', 'Sign in')}
                  </LocalizedLink>
                  <LocalizedLink to="/register" className="px-2 py-2 text-primary-600 hover:text-primary-700 font-semibold" onClick={() => setMenuOpen(false)}>
                    {t('nav.signup', 'Sign up')}
                  </LocalizedLink>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

// MukonoTalks

