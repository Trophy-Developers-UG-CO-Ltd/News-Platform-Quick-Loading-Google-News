/**
 * Terms & Conditions page
 * B2B terms of service for industrial chemicals e-commerce
 * @module pages/TermsConditions
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiFileText, FiAlertTriangle, FiTruck, FiDollarSign, FiPackage } from 'react-icons/fi';
import useDocTitle from '../hooks/useDocTitle';
import LocalizedLink from '../components/i18n/LocalizedLink';

const TermsConditions = () => {
  const { t } = useTranslation();
  useDocTitle(t('terms.title', 'Terms & Conditions'));

  const lastUpdated = 'January 15, 2026';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-3 mb-4">
            <FiFileText className="h-8 w-8" />
            <h1 className="text-3xl font-bold">{t('terms.title', 'Terms & Conditions')}</h1>
          </div>
          <p className="text-primary-100">
            {t('terms.lastUpdated', 'Last updated')}: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8 md:p-12">
          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-10 flex items-start space-x-3">
            <FiAlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-800 font-medium">{t('terms.notice.title', 'Important Notice')}</p>
              <p className="text-amber-700 text-sm">
                {t('terms.notice.text', 'By creating an account or placing an order, you agree to be bound by these Terms & Conditions. Please read them carefully before proceeding.')}
              </p>
            </div>
          </div>

          {/* Definitions */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              1. {t('terms.definitions.title', 'Definitions')}
            </h2>
            <div className="text-gray-600 space-y-2">
              <p>• <strong>"Company", "We", "Us"</strong>: {t('terms.definitions.company', 'MukonoTalks Ltd, a registered company.')}</p>
              <p>• <strong>"Customer", "You"</strong>: {t('terms.definitions.customer', 'The business entity or authorized representative creating an account or placing orders.')}</p>
              <p>• <strong>"Products"</strong>: {t('terms.definitions.products', 'Industrial chemicals, coatings, pigments, resins, and related materials offered for sale.')}</p>
              <p>• <strong>"Platform"</strong>: {t('terms.definitions.platform', 'The MukonoTalks website and e-commerce system.')}</p>
            </div>
          </section>

          {/* Account Registration */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. {t('terms.account.title', 'Account Registration')}
            </h2>
            <div className="text-gray-600 space-y-4">
              <p>{t('terms.account.p1', 'This platform is intended for business-to-business (B2B) transactions only. By registering an account, you represent and warrant that:')}</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>{t('terms.account.item1', 'You are authorized to act on behalf of a registered business entity')}</li>
                <li>{t('terms.account.item2', 'The business information provided is accurate and current')}</li>
                <li>{t('terms.account.item3', 'You will maintain the confidentiality of your account credentials')}</li>
                <li>{t('terms.account.item4', 'You will notify us immediately of any unauthorized account access')}</li>
              </ul>
              <p>{t('terms.account.p2', 'We reserve the right to verify your business credentials and may request additional documentation before approving certain orders or granting access to restricted products.')}</p>
            </div>
          </section>

          {/* Products & Pricing */}
          <section className="mb-10">
            <div className="flex items-center space-x-2 mb-4">
              <FiDollarSign className="h-5 w-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                3. {t('terms.pricing.title', 'Products & Pricing')}
              </h2>
            </div>
            <div className="text-gray-600 space-y-4">
              <p>{t('terms.pricing.p1', 'All prices are quoted in US Dollars (USD) and are exclusive of VAT unless otherwise stated. The applicable 15% VAT will be added at checkout.')}</p>
              <p>{t('terms.pricing.p2', 'We reserve the right to:')}</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>{t('terms.pricing.item1', 'Modify prices without prior notice')}</li>
                <li>{t('terms.pricing.item2', 'Correct pricing errors, even after order placement')}</li>
                <li>{t('terms.pricing.item3', 'Set minimum order quantities for certain products')}</li>
                <li>{t('terms.pricing.item4', 'Offer volume-based or negotiated pricing to qualifying customers')}</li>
              </ul>
              <p>{t('terms.pricing.p3', 'Product specifications and availability are subject to change. Contact us for current stock levels on bulk orders.')}</p>
            </div>
          </section>

          {/* Orders & Payment */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              4. {t('terms.orders.title', 'Orders & Payment')}
            </h2>
            <div className="text-gray-600 space-y-4">
              <p>{t('terms.orders.p1', 'Order placement constitutes an offer to purchase. We reserve the right to accept or decline any order. An order is confirmed only when:')}</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>{t('terms.orders.item1', 'You receive an order confirmation email')}</li>
                <li>{t('terms.orders.item2', 'Payment has been successfully processed')}</li>
              </ul>
              <p>{t('terms.orders.p2', 'Payment is processed securely through Stripe. We accept credit cards, debit cards, and EFT for approved accounts.')}</p>
              <p>{t('terms.orders.p3', 'For large orders or new customers, we may require prepayment or credit approval before processing.')}</p>
            </div>
          </section>

          {/* Delivery */}
          <section className="mb-10">
            <div className="flex items-center space-x-2 mb-4">
              <FiTruck className="h-5 w-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                5. {t('terms.delivery.title', 'Delivery & Shipping')}
              </h2>
            </div>
            <div className="text-gray-600 space-y-4">
              <p>{t('terms.delivery.p1', 'Delivery times are estimates and not guaranteed. Risk of loss passes to the customer upon delivery to the shipping carrier.')}</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>{t('terms.delivery.item1', 'Delivery within Gauteng: 1-3 business days')}</li>
                <li>{t('terms.delivery.item2', 'Delivery to other provinces: 3-7 business days')}</li>
                <li>{t('terms.delivery.item3', 'Hazardous materials may require special handling and extended lead times')}</li>
              </ul>
              <p>{t('terms.delivery.p2', 'Customer is responsible for ensuring adequate receiving facilities and compliance with local handling regulations.')}</p>
            </div>
          </section>

          {/* Product Safety */}
          <section className="mb-10">
            <div className="flex items-center space-x-2 mb-4">
              <FiPackage className="h-5 w-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                6. {t('terms.safety.title', 'Product Safety & Compliance')}
              </h2>
            </div>
            <div className="text-gray-600 space-y-4">
              <p>{t('terms.safety.p1', 'Industrial chemicals require proper handling, storage, and disposal. By purchasing from us, you acknowledge and agree that:')}</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>{t('terms.safety.item1', 'You have reviewed the Safety Data Sheet (SDS) for all products')}</li>
                <li>{t('terms.safety.item2', 'Your personnel are trained in proper handling procedures')}</li>
                <li>{t('terms.safety.item3', 'You have appropriate storage facilities and personal protective equipment')}</li>
                <li>{t('terms.safety.item4', 'You will comply with all applicable environmental and safety regulations')}</li>
                <li>{t('terms.safety.item5', 'Products will not be resold for consumer use without proper repackaging and labeling')}</li>
              </ul>
              <p className="font-medium">{t('terms.safety.p2', 'We are not responsible for injuries, damages, or regulatory violations resulting from improper handling, storage, or use of products.')}</p>
            </div>
          </section>

          {/* Returns & Claims */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              7. {t('terms.returns.title', 'Returns, Refunds & Claims')}
            </h2>
            <div className="text-gray-600 space-y-4">
              <p>{t('terms.returns.p1', 'Due to the nature of chemical products, returns are subject to strict conditions:')}</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>{t('terms.returns.item1', 'Damaged or incorrect shipments must be reported within 48 hours of delivery')}</li>
                <li>{t('terms.returns.item2', 'Products must be in original, unopened packaging')}</li>
                <li>{t('terms.returns.item3', 'Returns require prior authorization (RMA number)')}</li>
                <li>{t('terms.returns.item4', 'Custom-mixed products and opened containers are non-returnable')}</li>
                <li>{t('terms.returns.item5', 'Restocking fees may apply')}</li>
              </ul>
              <p>{t('terms.returns.p2', 'To initiate a return or report an issue, contact our customer service team with your order number and detailed description of the problem.')}</p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              8. {t('terms.liability.title', 'Limitation of Liability')}
            </h2>
            <div className="text-gray-600 space-y-4">
              <p>{t('terms.liability.p1', 'To the maximum extent permitted by law:')}</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>{t('terms.liability.item1', 'Our total liability shall not exceed the purchase price of the products in question')}</li>
                <li>{t('terms.liability.item2', 'We are not liable for indirect, incidental, or consequential damages')}</li>
                <li>{t('terms.liability.item3', 'Product information is provided "as is" without warranties of merchantability or fitness for a particular purpose')}</li>
              </ul>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              9. {t('terms.ip.title', 'Intellectual Property')}
            </h2>
            <p className="text-gray-600">
              {t('terms.ip.p1', 'All content on this platform, including logos, product descriptions, images, and technical documentation, is the property of MukonoTalks or its licensors. You may not reproduce, distribute, or create derivative works without written permission.')}
            </p>
          </section>

          {/* Governing Law */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              10. {t('terms.law.title', 'Governing Law')}
            </h2>
            <p className="text-gray-600">
              {t('terms.law.p1', 'These terms are governed by applicable law. Any disputes shall be subject to the exclusive jurisdiction of the competent courts.')}
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              11. {t('terms.changes.title', 'Changes to Terms')}
            </h2>
            <p className="text-gray-600">
              {t('terms.changes.p1', 'We may modify these terms at any time. Material changes will be communicated via email to registered customers. Continued use of the platform after changes constitutes acceptance of the modified terms.')}
            </p>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              12. {t('terms.contact.title', 'Contact Information')}
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
              <p><strong>MukonoTalks Ltd</strong></p>
              <p>Email: legal@mukonotalks.ug</p>
              <p>Phone: +000 000 000 000</p>
              <p>Address: Uganda, Kenya, Tanzania</p>
              <p className="mt-2 text-sm">Company Registration: [Registration Number]</p>
              <p className="text-sm">VAT Number: [VAT Number]</p>
            </div>
          </section>

          {/* Footer Navigation */}
          <div className="pt-6 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
            <LocalizedLink to="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
              ← {t('footer.privacyPolicy', 'Privacy Policy')}
            </LocalizedLink>
            <LocalizedLink to="/" className="text-gray-500 hover:text-gray-700">
              {t('nav.home', 'Home')}
            </LocalizedLink>
            <LocalizedLink to="/products" className="text-gray-500 hover:text-gray-700">
              {t('nav.products', 'Products')}
            </LocalizedLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;

// MukonoTalks

