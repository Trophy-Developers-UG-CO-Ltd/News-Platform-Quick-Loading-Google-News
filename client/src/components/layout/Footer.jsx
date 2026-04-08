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
    <footer className="bg-dark-black text-text-secondary">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
              <img src="/mukonotalks.png" alt="MukonoTalks" className="h-12 w-auto" />
            </div>
            <p className="mb-4 text-sm text-text-muted">
                {tagline || t('footer.tagline', 'MukonoTalks publishes local news, entertainment, community updates, and video stories for Mukono audiences.')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold text-text-primary">{t('footer.quickLinks', 'Quick Links')}</h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.length > 0
                ? quickLinks.map((link) => (
                    <li key={link.href + link.label}>
                      <LocalizedLink
                        to={link.href}
                        className="transition-colors hover:text-text-primary"
                        {...(link.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        {link.label}
                      </LocalizedLink>
                    </li>
                  ))
                : (
                  <>
                    <li><LocalizedLink to="/" className="transition-colors hover:text-text-primary">{t('nav.home', 'Home')}</LocalizedLink></li>
                    <li><LocalizedLink to="/news" className="transition-colors hover:text-text-primary">News</LocalizedLink></li>
                    <li><LocalizedLink to="/local" className="transition-colors hover:text-text-primary">Local Updates</LocalizedLink></li>
                    <li><LocalizedLink to="/entertainment" className="transition-colors hover:text-text-primary">Entertainment</LocalizedLink></li>
                    <li><LocalizedLink to="/videos" className="transition-colors hover:text-text-primary">Videos</LocalizedLink></li>
                    <li><LocalizedLink to="/privacy" className="transition-colors hover:text-text-primary">{t('footer.privacyPolicy', 'Privacy Policy')}</LocalizedLink></li>
                    <li><LocalizedLink to="/terms" className="transition-colors hover:text-text-primary">{t('footer.termsConditions', 'Terms & Conditions')}</LocalizedLink></li>
                  </>
                )
              }
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="mb-4 font-semibold text-text-primary">{t('footer.customerService', 'Customer Service')}</h3>
            <ul className="space-y-2 text-sm">
              {serviceLinks.length > 0
                ? serviceLinks.map((link) => (
                    <li key={link.href + link.label}>
                      <LocalizedLink
                        to={link.href}
                        className="transition-colors hover:text-text-primary"
                        {...(link.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        {link.label}
                      </LocalizedLink>
                    </li>
                  ))
                : (
                  <>
                    <li><LocalizedLink to="/editor" className="transition-colors hover:text-text-primary">Editorial CMS</LocalizedLink></li>
                    <li><LocalizedLink to="/contact" className="transition-colors hover:text-text-primary">{t('footer.contactUs', 'Contact Us')}</LocalizedLink></li>
                  </>
                )
              }
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-semibold text-text-primary">{t('footer.contactUs', 'Contact Us')}</h3>
            <ul className="space-y-3 text-sm">
              {contactEmail && (
                <li className="flex items-center space-x-2">
                  <FiMail className="h-4 w-4 shrink-0 text-accent-orange" />
                  <span>{contactEmail}</span>
                </li>
              )}
              {contactPhone && (
                <li className="flex items-center space-x-2">
                  <FiPhone className="h-4 w-4 shrink-0 text-accent-orange" />
                  <span>{contactPhone}</span>
                </li>
              )}
              {contactAddress && (
                <li className="flex items-start space-x-2">
                  <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-orange" />
                  <span>{contactAddress}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
       <div className="mt-10 flex flex-col items-center justify-between border-t border-dark-border pt-6 text-sm md:flex-row">
  <p>&copy; {currentYear} {copyrightName || 'MukonoTalks'}. {t('footer.allRights', 'All rights reserved.')}</p>
  <p className="mt-2 text-text-muted md:mt-0">
    Developed and Designed by{' '}
      <span className="font-medium text-accent-orange" title="TrophyDevelopers">
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

