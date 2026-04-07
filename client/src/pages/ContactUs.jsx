/**
 * Contact Us page
 * Public contact form with company info and enquiry submission
 * @module pages/ContactUs
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiSend,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../app/axios';
import useDocTitle from '../hooks/useDocTitle';
import LocalizedLink from '../components/i18n/LocalizedLink';
import Reveal from '../components/ui/Reveal';

/* ── Info Card ──────────────────────────────────────────────────────────── */
const InfoCard = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-4 p-5 bg-white rounded-xl shadow-sm">
      <div className="flex-shrink-0 h-10 w-10 rounded-none bg-primary-50 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary-600" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-gray-800 font-medium text-sm leading-relaxed">{value}</p>
      </div>
    </div>
  );
};

/* ── Page ───────────────────────────────────────────────────────────────── */
const ContactUs = () => {
  const { t } = useTranslation();
  useDocTitle(t('contact.title', 'Contact Us'));

  const { settings: footerSettings } = useSelector((state) => state.footer);
  const { contactEmail, contactPhone, contactAddress } = footerSettings || {};

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required.';
    if (!form.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!form.subject.trim()) newErrors.subject = 'Subject is required.';
    if (!form.message.trim()) newErrors.message = 'Message is required.';
    else if (form.message.trim().length < 10) newErrors.message = 'Message must be at least 10 characters.';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        'Failed to send your message. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full border border-gray-300 rounded-[48px] px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all';
  const textareaClass =
    'w-full border border-gray-300 rounded-[48px] px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';
  const errorClass = 'mt-1 text-xs text-red-500';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className="bg-primary-600 text-white py-16">
        <div className="container mx-auto px-4">
          <Reveal variant="fade-up">
          <p className="text-primary-200 text-sm font-semibold uppercase tracking-widest mb-2">
            {t('contact.heroLabel', 'Get In Touch')}
          </p>
          <h1 className="text-4xl font-bold mb-3">
            {t('contact.title', 'Contact Us')}
          </h1>
          <p className="text-primary-100 max-w-xl text-base leading-relaxed">
            {t(
              'contact.subtitle',
              'Have a question or need assistance? Our team is ready to help. Reach out and we\'ll respond within 1–2 business days.'
            )}
          </p>
          </Reveal>
        </div>
      </div>

      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ── Left: Contact Info ──────────────────────────────────────── */}
          <Reveal variant="fade-right">
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">
              {t('contact.infoTitle', 'How to Reach Us')}
            </h2>

            <InfoCard
              icon={FiMail}
              label={t('contact.emailLabel', 'Email')}
              value={contactEmail || 'info@mukonotalks.ug'}
            />
            <InfoCard
              icon={FiPhone}
              label={t('contact.phoneLabel', 'Phone')}
              value={contactPhone || '+000 000 000 000'}
            />
            <InfoCard
              icon={FiMapPin}
              label={t('contact.addressLabel', 'Office Address')}
              value={contactAddress || 'Uganda, Kenya, Tanzania'}
            />
            <InfoCard
              icon={FiClock}
              label={t('contact.hoursLabel', 'Business Hours')}
              value={t('contact.hoursValue', 'Monday – Friday, 08:00 – 17:00 (SAST)')}
            />

            {/* CTA block */}
            <div className="mt-8 bg-primary-600 text-white rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2">
                {t('contact.ctaTitle', 'Need a Quote?')}
              </h3>
              <p className="text-primary-100 text-sm mb-4 leading-relaxed">
                {t(
                  'contact.ctaDesc',
                  'Looking to source industrial chemicals or coatings? Browse our product catalogue or request a tailored quote.'
                )}
              </p>
              <div className="flex flex-col gap-2">
                <LocalizedLink
                  to="/products"
                  className="block text-center bg-white text-primary-600 font-semibold text-sm px-4 py-2.5 rounded-none hover:bg-primary-50 transition-colors"
                >
                  {t('contact.ctaProducts', 'Browse Products')}
                </LocalizedLink>
                <LocalizedLink
                  to="/get-quote"
                  className="block text-center border border-white text-white font-semibold text-sm px-4 py-2.5 rounded-none hover:bg-primary-700 transition-colors"
                >
                  {t('contact.ctaQuote', 'Get a Quote')}
                </LocalizedLink>
              </div>
            </div>
          </div>
          </Reveal>

          {/* ── Right: Form ─────────────────────────────────────────────── */}
          <Reveal variant="fade-left" delay={150}>
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-8 md:p-10">
            {submitted ? (
              /* Success state */
              <div className="flex flex-col items-center justify-center text-center py-12">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <FiCheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  {t('contact.successTitle', 'Message Sent!')}
                </h2>
                <p className="text-gray-500 max-w-md mb-8">
                  {t(
                    'contact.successMessage',
                    'Thank you for reaching out. We have received your message and will respond within 1–2 business days.'
                  )}
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: '', email: '', phone: '', company: '', subject: '', message: '' });
                  }}
                  className="inline-flex items-center gap-2 bg-primary-600 text-white px-7 py-3 rounded-none font-semibold hover:bg-primary-700 active:scale-95 transition-all duration-200"
                >
                  {t('contact.sendAnother', 'Send Another Message')}
                </button>
              </div>
            ) : (
              /* Form */
              <>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  {t('contact.formTitle', 'Send Us a Message')}
                </h2>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className={labelClass}>
                        {t('contact.name', 'Full Name')}{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder={t('contact.namePlaceholder', 'Your full name')}
                        className={inputClass}
                        autoComplete="name"
                        maxLength={100}
                      />
                      {errors.name && <p className={errorClass}>{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className={labelClass}>
                        {t('contact.email', 'Email Address')}{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder={t('contact.emailPlaceholder', 'your@email.com')}
                        className={inputClass}
                        autoComplete="email"
                        maxLength={200}
                      />
                      {errors.email && <p className={errorClass}>{errors.email}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="phone" className={labelClass}>
                        {t('contact.phone', 'Phone Number (optional)')}
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder={t('contact.phonePlaceholder', '+000 000 000 000')}
                        className={inputClass}
                        autoComplete="tel"
                        maxLength={30}
                      />
                    </div>

                    {/* Company */}
                    <div>
                      <label htmlFor="company" className={labelClass}>
                        {t('contact.company', 'Company Name (optional)')}
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={form.company}
                        onChange={handleChange}
                        placeholder={t('contact.companyPlaceholder', 'Your company or organisation')}
                        className={inputClass}
                        autoComplete="organization"
                        maxLength={200}
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="mb-5">
                    <label htmlFor="subject" className={labelClass}>
                      {t('contact.subject', 'Subject')}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      placeholder={t(
                        'contact.subjectPlaceholder',
                        'What is your enquiry about?'
                      )}
                      className={inputClass}
                      maxLength={200}
                    />
                    {errors.subject && (
                      <p className={errorClass}>{errors.subject}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="mb-7">
                    <label htmlFor="message" className={labelClass}>
                      {t('contact.message', 'Message')}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={6}
                      placeholder={t(
                        'contact.messagePlaceholder',
                        'Write your message here...'
                      )}
                      className={textareaClass}
                      maxLength={5000}
                    />
                    {errors.message && (
                      <p className={errorClass}>{errors.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-none font-semibold hover:bg-primary-700 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      t('contact.sending', 'Sending...')
                    ) : (
                      <>
                        <FiSend className="h-4 w-4" />
                        {t('contact.send', 'Send Message')}
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
