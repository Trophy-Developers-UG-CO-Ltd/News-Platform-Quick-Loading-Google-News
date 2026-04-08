/**
 * CTA Section — dynamic, admin-driven
 * @module features/home/CTASection
 */

import React from "react";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import LocalizedLink from "../../components/i18n/LocalizedLink";
import { getLucideIcon } from "../../utils/getLucideIcon";
import api from '../../app/axios';
import SafeRichText from "../../components/ui/SafeRichText";

/* ── Default copy (fallback when API is unavailable) ── */
const DEFAULT = {
  heading: {
    eyebrow: "Ready to Start?",
    title: "Work With MukonoTalks",
    description: "Register your business account to access technical documentation, product specifications, SDS files, and industrial supply support tailored for manufacturers and procurement teams.",
  },
  items: [
    { icon: "FileText",   label: "Technical Documentation" },
    { icon: "Package",    label: "Bulk Pricing Access"      },
    { icon: "Headphones", label: "Dedicated Account Support" },
  ],
  ctaButtons: [
    { text: "Create Business Account", link: "/register", variant: "primary"  },
    { text: "Contact Sales Team",       link: "/contact",  variant: "outline" },
  ],
};

const fetchSection = async () => {
  const { data } = await api.get('/homepage-sections/cta');
  return data;
};

const CTASection = () => {
  const { data } = useQuery({
    queryKey: ["homepageSection", "cta"],
    queryFn: fetchSection,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const section = data || DEFAULT;
  if (data?.isActive === false) return null;

  const { eyebrow, title, description } = section.heading || DEFAULT.heading;
  const perks = section.items?.length ? section.items : DEFAULT.items;
  const buttons = section.ctaButtons?.length ? section.ctaButtons : DEFAULT.ctaButtons;

  return (
    <section className="bg-primary-700 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        {eyebrow && (
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary-200 mb-4">
            {eyebrow}
          </span>
        )}
        {title && (
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
        )}
        {description && (
          <SafeRichText className="prose mx-auto mb-8 max-w-xl text-primary-100" html={description} />
        )}

        {/* Perk icons */}
        {perks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            {perks.map((perk, i) => {
              const Icon = getLucideIcon(perk.icon);
              return (
                <div key={perk._id || i} className="flex items-center gap-2 text-primary-200 text-sm font-medium">
                  <Icon size={16} />
                  <SafeRichText className="prose prose-sm max-w-none text-primary-200" html={perk.label || perk.title} />
                </div>
              );
            })}
          </div>
        )}

        {/* Action buttons */}
        {buttons.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {buttons.map((btn, i) =>
              btn.variant === "outline" ? (
                <LocalizedLink
                  key={btn._id || i}
                  to={btn.link}
                  className="inline-flex items-center justify-center gap-2 border border-white/40 text-white px-8 py-3 font-semibold hover:bg-white/10 transition-all"
                >
                  {btn.text}
                </LocalizedLink>
              ) : (
                <LocalizedLink
                  key={btn._id || i}
                  to={btn.link}
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-8 py-3 font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
                >
                  {btn.text}
                  <ArrowRight size={18} />
                </LocalizedLink>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CTASection;

// MukonoTalks

