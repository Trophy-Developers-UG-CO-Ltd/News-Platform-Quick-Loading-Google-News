/**
 * Privacy Policy page
 * POPIA-compliant privacy policy for B2B industrial chemicals
 * @module pages/PrivacyPolicy
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiShield, FiLock, FiMail, FiDatabase, FiTrash2 } from 'react-icons/fi';
import useDocTitle from '../hooks/useDocTitle';
import LocalizedLink from '../components/i18n/LocalizedLink';

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  useDocTitle(t('privacy.title', 'Privacy Policy'));

  const lastUpdated = 'January 15, 2026';

  return (
    <div className="min-h-screen bg-dark-charcoal">
      {/* Header */}
      <div className="bg-dark-black py-12 text-text-primary">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-3 mb-4">
            <FiShield className="h-8 w-8 text-accent-blue" />
            <h1 className="font-display text-3xl font-bold">{t('privacy.title', 'Privacy Policy')}</h1>
          </div>
          <p className="text-text-secondary">
            {t('privacy.lastUpdated', 'Last updated')}: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl rounded-lg border border-dark-border bg-dark-slate p-8 shadow-card md:p-12">
          {/* Introduction */}
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-text-primary">
              {t('privacy.intro.title', 'Introduction')}
            </h2>
            <p className="mb-4 leading-relaxed text-text-secondary">
              {t('privacy.intro.p1', 'MukonoTalks Ltd ("we", "us", or "our") is committed to protecting the privacy and security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our B2B e-commerce platform.')}
            </p>
            <p className="leading-relaxed text-text-secondary">
              {t('privacy.intro.p2', 'This policy complies with applicable data protection regulations including GDPR and other relevant privacy laws.')}
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-10">
            <div className="flex items-center space-x-2 mb-4">
              <FiDatabase className="h-5 w-5 text-accent-blue" />
              <h2 className="text-xl font-semibold text-text-primary">
                {t('privacy.collect.title', 'Information We Collect')}
              </h2>
            </div>
            <div className="space-y-4 text-text-secondary">
              <div>
                <h3 className="mb-2 font-medium text-text-primary">
                  {t('privacy.collect.businessInfo', 'Business Information')}
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('privacy.collect.item1', 'Company name, registration number, and VAT number')}</li>
                  <li>{t('privacy.collect.item2', 'Business contact person name, email, and phone number')}</li>
                  <li>{t('privacy.collect.item3', 'Delivery and billing addresses')}</li>
                  <li>{t('privacy.collect.item4', 'Industry sector and business type')}</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-text-primary">
                  {t('privacy.collect.transactional', 'Transactional Information')}
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('privacy.collect.item5', 'Order history and purchase records')}</li>
                  <li>{t('privacy.collect.item6', 'Quote requests and inquiries')}</li>
                  <li>{t('privacy.collect.item7', 'Payment information (processed securely through Stripe)')}</li>
                  <li>{t('privacy.collect.item8', 'Document downloads (technical data sheets, SDS)')}</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-text-primary">
                  {t('privacy.collect.technical', 'Technical Information')}
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('privacy.collect.item9', 'IP address and browser information')}</li>
                  <li>{t('privacy.collect.item10', 'Device type and operating system')}</li>
                  <li>{t('privacy.collect.item11', 'Website usage patterns and analytics')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-text-primary">
              {t('privacy.use.title', 'How We Use Your Information')}
            </h2>
            <ul className="space-y-2 text-text-secondary">
              <li className="flex items-start space-x-2">
                <span className="mt-1 text-accent-blue">•</span>
                <span>{t('privacy.use.item1', 'Processing and fulfilling your orders')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="mt-1 text-accent-blue">•</span>
                <span>{t('privacy.use.item2', 'Providing customer support and responding to inquiries')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="mt-1 text-accent-blue">•</span>
                <span>{t('privacy.use.item3', 'Generating quotes and managing B2B relationships')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="mt-1 text-accent-blue">•</span>
                <span>{t('privacy.use.item4', 'Sending transactional emails (order confirmations, shipping updates)')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="mt-1 text-accent-blue">•</span>
                <span>{t('privacy.use.item5', 'Improving our website and services')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="mt-1 text-accent-blue">•</span>
                <span>{t('privacy.use.item6', 'Complying with legal obligations and regulatory requirements')}</span>
              </li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="mb-10">
            <div className="flex items-center space-x-2 mb-4">
              <FiLock className="h-5 w-5 text-accent-blue" />
              <h2 className="text-xl font-semibold text-text-primary">
                {t('privacy.security.title', 'Data Security')}
              </h2>
            </div>
            <p className="mb-4 leading-relaxed text-text-secondary">
              {t('privacy.security.p1', 'We implement appropriate technical and organizational measures to protect your personal information, including:')}
            </p>
            <ul className="ml-4 space-y-2 text-text-secondary">
              <li>• {t('privacy.security.item1', 'SSL/TLS encryption for all data transmission')}</li>
              <li>• {t('privacy.security.item2', 'Secure password hashing using bcrypt')}</li>
              <li>• {t('privacy.security.item3', 'HTTP-only cookies for authentication')}</li>
              <li>• {t('privacy.security.item4', 'Regular security audits and penetration testing')}</li>
              <li>• {t('privacy.security.item5', 'Access controls and employee training')}</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section className="mb-10">
            <div className="flex items-center space-x-2 mb-4">
              <FiTrash2 className="h-5 w-5 text-accent-blue" />
              <h2 className="text-xl font-semibold text-text-primary">
                {t('privacy.retention.title', 'Data Retention')}
              </h2>
            </div>
            <p className="mb-4 leading-relaxed text-text-secondary">
              {t('privacy.retention.p1', 'We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy:')}
            </p>
            <ul className="ml-4 space-y-2 text-text-secondary">
              <li>• {t('privacy.retention.item1', 'Account information: Until account deletion or 2 years of inactivity')}</li>
              <li>• {t('privacy.retention.item2', 'Order records: 7 years for tax and legal compliance')}</li>
              <li>• {t('privacy.retention.item3', 'Download logs: 3 years for audit compliance')}</li>
              <li>• {t('privacy.retention.item4', 'Analytics data: 26 months (anonymized)')}</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-text-primary">
              {t('privacy.rights.title', 'Your Data Protection Rights')}
            </h2>
            <p className="mb-4 leading-relaxed text-text-secondary">
              {t('privacy.rights.intro', 'Under applicable data protection law, you have the right to:')}
            </p>
            <ul className="ml-4 space-y-2 text-text-secondary">
              <li>• {t('privacy.rights.item1', 'Access your personal information we hold')}</li>
              <li>• {t('privacy.rights.item2', 'Request correction of inaccurate information')}</li>
              <li>• {t('privacy.rights.item3', 'Request deletion of your personal information')}</li>
              <li>• {t('privacy.rights.item4', 'Object to processing of your personal information')}</li>
              <li>• {t('privacy.rights.item5', 'Withdraw consent where processing is based on consent')}</li>
              <li>• {t('privacy.rights.item6', 'Lodge a complaint with the Information Regulator')}</li>
            </ul>
          </section>

          {/* Cookies */}
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-text-primary">
              {t('privacy.cookies.title', 'Cookies and Tracking')}
            </h2>
            <p className="mb-4 leading-relaxed text-text-secondary">
              {t('privacy.cookies.p1', 'We use cookies and similar technologies to improve your experience. You can manage your cookie preferences at any time. We use:')}
            </p>
            <ul className="ml-4 space-y-2 text-text-secondary">
              <li>• <strong>{t('privacy.cookies.essential', 'Essential cookies')}:</strong> {t('privacy.cookies.essentialDesc', 'Required for basic site functionality (authentication)')}</li>
              <li>• <strong>{t('privacy.cookies.analytics', 'Analytics cookies')}:</strong> {t('privacy.cookies.analyticsDesc', 'Help us understand how visitors use our site (Google Analytics)')}</li>
              <li>• <strong>{t('privacy.cookies.preferences', 'Preference cookies')}:</strong> {t('privacy.cookies.preferencesDesc', 'Remember your language and other settings')}</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <div className="flex items-center space-x-2 mb-4">
              <FiMail className="h-5 w-5 text-accent-blue" />
              <h2 className="text-xl font-semibold text-text-primary">
                {t('privacy.contact.title', 'Contact Us')}
              </h2>
            </div>
            <p className="mb-4 leading-relaxed text-text-secondary">
              {t('privacy.contact.p1', 'For any privacy-related questions or to exercise your rights, please contact our Information Officer:')}
            </p>
            <div className="rounded-lg bg-dark-charcoal p-4 text-text-secondary">
              <p><strong>Data Protection Officer</strong></p>
              <p>MukonoTalks Ltd</p>
              <p>Email: privacy@mukonotalks.ug</p>
              <p>Phone: +000 000 000 000</p>
              <p>Address: Uganda, Kenya, Tanzania</p>
            </div>
          </section>

          {/* Footer Navigation */}
          <div className="flex flex-wrap gap-4 border-t border-dark-border pt-6 text-sm">
            <LocalizedLink to="/terms" className="font-medium text-accent-blue transition-colors hover:text-category-news">
              {t('footer.termsConditions', 'Terms & Conditions')} →
            </LocalizedLink>
            <LocalizedLink to="/" className="text-text-muted transition-colors hover:text-text-primary">
              {t('nav.home', 'Home')}
            </LocalizedLink>
            <LocalizedLink to="/products" className="text-text-muted transition-colors hover:text-text-primary">
              {t('nav.products', 'Products')}
            </LocalizedLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

// MukonoTalks

