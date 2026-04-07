/**
 * Technical Advantage Section — dynamic, admin-driven
 * @module features/home/TechnicalAdvantage
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getLucideIcon } from "../../utils/getLucideIcon";
import api from '../../app/axios';

/* ── Default copy (fallback when API is unavailable) ── */
const DEFAULT = {
  heading: {
    eyebrow: "Why Specify With Us",
    title: "Technical Advantage",
    description: "Beyond supply — we are a technical partner for manufacturers, engineers, and procurement professionals.",
  },
  items: [
    { icon: "ShieldCheck",  title: "ISO-Certified Quality",            description: "Every batch is tested against international technical standards before dispatch. COA documentation provided on request." },
    { icon: "FlaskConical", title: "Application Engineering Support",  description: "Our technical team assists with formulation optimisation, compatibility testing, and process integration challenges." },
    { icon: "Globe",        title: "Pan-African Distribution",         description: "Established logistics network across Southern, East, and West Africa with reliable lead times for bulk and LTL shipments." },
    { icon: "FileText",     title: "Full Technical Documentation",     description: "Safety Data Sheets, Technical Data Sheets, and compliance certificates available to registered business accounts." },
    { icon: "Microscope",   title: "R&D-Backed Formulations",          description: "Products developed in partnership with global chemical manufacturers — not repackaged commodity stock." },
    { icon: "Headphones",   title: "Dedicated B2B Account Management", description: "Named account managers for procurement teams, with direct lines for urgent supply or specification queries." },
  ],
};

const fetchSection = async () => {
  const { data } = await api.get('/homepage-sections/advantages');
  return data;
};

const TechnicalAdvantage = () => {
  const { data } = useQuery({
    queryKey: ["homepageSection", "advantages"],
    queryFn: fetchSection,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const section = data || DEFAULT;
  if (data?.isActive === false) return null;

  const { eyebrow, title, description } = section.heading || DEFAULT.heading;
  const items = section.items?.length ? section.items : DEFAULT.items;

  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          {eyebrow && (
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-accent-400 mb-3">
              {eyebrow}
            </span>
          )}
          {title && (
            <h2 className="text-3xl font-bold mb-4">{title}</h2>
          )}
          {description && (
            <p className="text-gray-400 max-w-xl mx-auto">{description}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, index) => {
            const Icon = getLucideIcon(item.icon);
            return (
              <div
                key={item._id || index}
                className="flex gap-5 p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-900/60 border border-primary-700/40">
                  <Icon className="text-primary-400" size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {item.description || item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TechnicalAdvantage;

// MukonoTalks

