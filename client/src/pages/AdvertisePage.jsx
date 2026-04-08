import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { MessageCircle } from 'lucide-react';
import api from '../app/axios';
import useDocTitle from '../hooks/useDocTitle';

const initialForm = {
  name: '',
  phone: '',
  business: '',
  budgetRange: '',
  message: '',
};

const AdvertisePage = () => {
  useDocTitle('Advertise on MukonoTalks');

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim() || undefined,
      phone: form.phone.trim(),
      business: form.business.trim() || undefined,
      budgetRange: form.budgetRange.trim() || undefined,
      message: form.message.trim(),
    };

    if (!payload.phone || !payload.message) {
      toast.error('Phone and message are required.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/advertise', payload);
      toast.success(response?.data?.message || 'Inquiry sent successfully.');
      setForm(initialForm);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-body dark:bg-dark-charcoal px-6 py-16">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-black text-text-light-primary dark:text-text-dark-primary">
          Advertise on MukonoTalks
        </h1>

        <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          Reach a highly engaged audience. Send your request and we will respond quickly.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your Name"
            className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl"
            maxLength={100}
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            placeholder="Phone Number"
            className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl"
            maxLength={30}
          />

          <input
            name="business"
            value={form.business}
            onChange={handleChange}
            placeholder="Business / Brand"
            className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl"
            maxLength={200}
          />

          <input
            name="budgetRange"
            value={form.budgetRange}
            onChange={handleChange}
            placeholder="Budget Range (optional)"
            className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl"
            maxLength={100}
          />

          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            required
            placeholder="Tell us about your advertising needs"
            className="w-full p-3 h-32 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl"
            maxLength={5000}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Inquiry'}
          </button>
        </form>

        <a
          href="https://wa.me/256755303076?text=Hi%2C%20I%20want%20to%20advertise%20on%20MukonoTalks"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 text-center mt-6 border border-black dark:border-white py-3 rounded-xl font-semibold"
        >
          <MessageCircle className="w-4 h-4" />
          Or Chat on WhatsApp
        </a>
      </div>
    </div>
  );
};

export default AdvertisePage;
