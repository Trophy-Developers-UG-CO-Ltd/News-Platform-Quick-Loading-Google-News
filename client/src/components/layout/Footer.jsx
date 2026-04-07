/**
 * Footer component
 * Site-wide footer with localized links and branding
 * @module components/layout/Footer
 */

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import LocalizedLink from '../i18n/LocalizedLink';
import { fetchFooter } from '../../features/footer/footerSlice';

const Footer = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { settings } = useSelector((state) => state.footer);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    dispatch(fetchFooter());
  }, [dispatch]);

  const {
    tagline,
    quickLinks   = [],
    serviceLinks = [],
    contactEmail,
    contactPhone,
    contactAddress,
    copyrightName,
  } = settings || {};

  return (
    <footer className="text-gray-300" style={{ backgroundColor: '#283B8F' }}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
              <img src="/mukonotalks.png" alt="MukonoTalks" className="h-12 w-auto" />
            </div>
            <p className="text-sm text-gray-400 mb-4">
                {tagline || t('footer.tagline', 'MukonoTalks publishes local news, entertainment, community updates, and video stories for Mukono audiences.')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.quickLinks', 'Quick Links')}</h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.length > 0
                ? quickLinks.map((link) => (
                    <li key={link.href + link.label}>
                      <LocalizedLink
                        to={link.href}
                        className="hover:text-white transition-colors"
                        {...(link.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        {link.label}
                      </LocalizedLink>
                    </li>
                  ))
                : (
                  <>
                    <li><LocalizedLink to="/" className="hover:text-white transition-colors">{t('nav.home', 'Home')}</LocalizedLink></li>
                    <li><LocalizedLink to="/news" className="hover:text-white transition-colors">News</LocalizedLink></li>
                    <li><LocalizedLink to="/local" className="hover:text-white transition-colors">Local Updates</LocalizedLink></li>
                    <li><LocalizedLink to="/entertainment" className="hover:text-white transition-colors">Entertainment</LocalizedLink></li>
                    <li><LocalizedLink to="/videos" className="hover:text-white transition-colors">Videos</LocalizedLink></li>
                    <li><LocalizedLink to="/privacy" className="hover:text-white transition-colors">{t('footer.privacyPolicy', 'Privacy Policy')}</LocalizedLink></li>
                    <li><LocalizedLink to="/terms" className="hover:text-white transition-colors">{t('footer.termsConditions', 'Terms & Conditions')}</LocalizedLink></li>
                  </>
                )
              }
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.customerService', 'Customer Service')}</h3>
            <ul className="space-y-2 text-sm">
              {serviceLinks.length > 0
                ? serviceLinks.map((link) => (
                    <li key={link.href + link.label}>
                      <LocalizedLink
                        to={link.href}
                        className="hover:text-white transition-colors"
                        {...(link.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        {link.label}
                      </LocalizedLink>
                    </li>
                  ))
                : (
                  <>
                    <li><LocalizedLink to="/editor" className="hover:text-white transition-colors">Editorial CMS</LocalizedLink></li>
                    <li><LocalizedLink to="/contact" className="hover:text-white transition-colors">{t('footer.contactUs', 'Contact Us')}</LocalizedLink></li>
                  </>
                )
              }
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.contactUs', 'Contact Us')}</h3>
            <ul className="space-y-3 text-sm">
              {contactEmail && (
                <li className="flex items-center space-x-2">
                  <FiMail className="h-4 w-4 text-accent-400 shrink-0" />
                  <span>{contactEmail}</span>
                </li>
              )}
              {contactPhone && (
                <li className="flex items-center space-x-2">
                  <FiPhone className="h-4 w-4 text-accent-400 shrink-0" />
                  <span>{contactPhone}</span>
                </li>
              )}
              {contactAddress && (
                <li className="flex items-start space-x-2">
                  <FiMapPin className="h-4 w-4 text-accent-400 mt-0.5 shrink-0" />
                  <span>{contactAddress}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
       <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-sm">
  <p>&copy; {currentYear} {copyrightName || 'MukonoTalks'}. {t('footer.allRights', 'All rights reserved.')}</p>
  <p className="mt-2 md:mt-0 text-gray-500">
    Developed and Designed by{' '}
      <span className="text-accent-400 font-medium" title="TrophyDevelopers">
        Trophy Developers
      </span>
  </p>
</div>
      </div>
    </footer>
  );
};

export default Footer;

// MukonoTalks

