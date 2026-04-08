/**
 * FAQ Section — dynamic, admin-driven
 * @module features/home/FAQSection
 */

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from '../../app/axios';
import SafeRichText from "../../components/ui/SafeRichText";

/* ── Default copy (fallback when API is unavailable) ── */
const DEFAULT = {
  heading: {
    eyebrow: "Common Questions",
    title: "Frequently Asked Questions",
    description: "Answers to common questions from procurement managers and technical buyers.",
  },
  items: [
    { title: "Who are your products designed for?",                    description: "Our products support manufacturers, formulation chemists, laboratory buyers, bulk distributors, and industrial processors across Africa. We operate exclusively on a B2B basis." },
    { title: "Do you provide technical documentation?",                description: "Yes. Registered business accounts have full access to Technical Data Sheets (TDS), Safety Data Sheets (SDS), and compliance certificates for all products in our catalogue." },
    { title: "What are your minimum order quantities?",                description: "MOQs vary by product line. Many pigments and resins are available from 25 kg. Ion exchange resins and bulk chemical materials have higher MOQs — contact our sales team for specific requirements." },
    { title: "Can you assist with formulation or application challenges?", description: "Yes. Our technical support team offers formulation guidance, compatibility advice, and process integration assistance. Reach out via your account dashboard or contact us directly." },
    { title: "What countries do you supply to?",                        description: "We supply across Southern Africa, East Africa, and West Africa, with an established logistics network for both LTL and full-container shipments. International supply enquiries are welcome." },
  ],
};

const fetchSection = async () => {
  const { data } = await api.get('/homepage-sections/faq');
  return data;
};

const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-semibold text-gray-800">{question}</span>
        <ChevronDown
          size={20}
          className={`text-primary-600 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 bg-white text-gray-500 text-sm leading-relaxed border-t border-gray-100">
          <SafeRichText className="prose prose-sm max-w-none text-gray-500" html={answer} />
        </div>
      )}
    </div>
  );
};

const FAQSection = () => {
  const { data } = useQuery({
    queryKey: ["homepageSection", "faq"],
    queryFn: fetchSection,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const section = data || DEFAULT;
  if (data?.isActive === false) return null;

  const { eyebrow, title, description } = section.heading || DEFAULT.heading;
  const items = section.items?.length ? section.items : DEFAULT.items;

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          {eyebrow && (
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary-600 mb-3">
              {eyebrow}
            </span>
          )}
          {title && (
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          )}
          {description && (
            <SafeRichText className="prose mx-auto max-w-none text-gray-500" html={description} />
          )}
        </div>

        <div className="space-y-3">
          {items.map((faq, index) => (
            <FAQItem
              key={faq._id || index}
              question={faq.title}
              answer={faq.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

// MukonoTalks

