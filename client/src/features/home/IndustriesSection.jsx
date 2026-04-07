/**
 * Industries Section — dynamic, admin-driven
 * @module features/home/IndustriesSection
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getLucideIcon } from "../../utils/getLucideIcon";
import api from '../../app/axios';

/* ── Default copy (fallback when API is unavailable) ── */
const DEFAULT = {
  heading: {
    eyebrow: "Sectors We Serve",
    title: "Industries & Applications",
    description:
      "From coatings lines to water treatment plants, our chemical materials are specified by engineers and procurement teams across Africa and beyond.",
  },
  items: [
    { icon: "PaintBucket", title: "Coatings Manufacturing",  description: "High-performance pigments and resin systems for decorative, protective, and industrial coating formulations." },
    { icon: "Factory",     title: "Plastics Manufacturing",  description: "Masterbatch pigments and specialty additives optimised for polyolefin, PVC, and engineering polymer production." },
    { icon: "Building2",   title: "Construction Materials",  description: "Durable resins and functional additives used in composite panels, sealants, and protective construction materials." },
    { icon: "Droplets",    title: "Water Treatment",         description: "Industrial-grade ion exchange resins for municipal and process water purification systems." },
  ],
};

const fetchSection = async () => {
  const { data } = await api.get('/homepage-sections/industries');
  return data;
};

const IndustriesSection = () => {
  const { data } = useQuery({
    queryKey: ["homepageSection", "industries"],
    queryFn: fetchSection,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const section = data || DEFAULT;
  if (data?.isActive === false) return null;

  const { eyebrow, title, description } = section.heading || DEFAULT.heading;
  const items = section.items?.length ? section.items : DEFAULT.items;

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          {eyebrow && (
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary-600 mb-3">
              {eyebrow}
            </span>
          )}
          {title && (
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          )}
          {description && (
            <p className="text-gray-500 max-w-xl mx-auto">{description}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item, index) => {
            const Icon = getLucideIcon(item.icon);
            return (
              <div
                key={item._id || index}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-shadow group border border-transparent hover:border-primary-100"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary-50 mb-5 group-hover:bg-primary-100 transition-colors">
                  <Icon className="text-primary-600" size={28} />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {item.description || item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default IndustriesSection;

// MukonoTalks

