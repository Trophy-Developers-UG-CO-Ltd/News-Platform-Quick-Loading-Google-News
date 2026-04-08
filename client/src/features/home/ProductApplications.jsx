/**
 * Product Applications Section — dynamic, admin-driven
 * @module features/home/ProductApplications
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getLucideIcon } from "../../utils/getLucideIcon";
import LocalizedLink from "../../components/i18n/LocalizedLink";
import api from '../../app/axios';
import SafeRichText from "../../components/ui/SafeRichText";

/* ── Default copy (fallback when API is unavailable) ── */
const DEFAULT = {
  heading: {
    eyebrow: "Our Product Range",
    title: "Product Applications",
    description: "Specification-grade materials trusted by formulation chemists and procurement managers across Africa.",
  },
  items: [
    { icon: "Palette",   title: "Industrial Pigments",  description: "Inorganic and organic pigments formulated for high heat stability, lightfastness, and compatibility with solvent-borne and waterborne systems.",  link: "/products?category=pigments"      },
    { icon: "Layers",    title: "Resin Systems",         description: "Alkyd, epoxy, and polyester resin solutions engineered for industrial coatings, adhesives, and composite material manufacturers.",             link: "/products?category=resins"        },
    { icon: "Zap",       title: "Fluorescent Pigments",  description: "Daylight fluorescent and effect pigments used in safety marking, packaging, and high-visibility industrial coatings.",                        link: "/products?category=fluorescent"   },
    { icon: "Droplets",  title: "Ion Exchange Resins",   description: "Cation and anion exchange resins for water softening, demineralisation, and process water treatment applications.",                            link: "/products?category=ion-exchange"  },
  ],
  bottomCtaText: "View Full Product Catalogue",
  bottomCtaLink: "/products",
};

const fetchSection = async () => {
  const { data } = await api.get('/homepage-sections/products');
  return data;
};

const ProductApplications = () => {
  const { data } = useQuery({
    queryKey: ["homepageSection", "products"],
    queryFn: fetchSection,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const section = data || DEFAULT;
  if (data?.isActive === false) return null;

  const { eyebrow, title, description } = section.heading || DEFAULT.heading;
  const items = section.items?.length ? section.items : DEFAULT.items;
  const ctaText = section.bottomCtaText || DEFAULT.bottomCtaText;
  const ctaLink = section.bottomCtaLink || DEFAULT.bottomCtaLink;

  return (
    <section className="py-20 bg-white">
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
            <SafeRichText className="prose mx-auto max-w-xl text-gray-500" html={description} />
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item, index) => {
            const Icon = getLucideIcon(item.icon);
            const linkTarget = item.link;
            const Card = (
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary-50 mb-5 group-hover:bg-primary-100 transition-colors">
                <Icon className="text-primary-600" size={28} />
              </div>
            );
            if (linkTarget) {
              return (
                <LocalizedLink
                  key={item._id || index}
                  to={linkTarget}
                  className="group block border border-gray-100 rounded-xl p-8 hover:shadow-lg hover:border-primary-200 transition-all"
                >
                  {Card}
                  <h3 className="font-semibold text-gray-800 text-lg mb-2 group-hover:text-primary-700 transition-colors">
                    {item.title || item.name}
                  </h3>
                  <SafeRichText className="prose prose-sm max-w-none text-gray-500" html={item.description || item.desc} />
                </LocalizedLink>
              );
            }
            return (
              <div
                key={item._id || index}
                className="group block border border-gray-100 rounded-xl p-8 hover:shadow-lg hover:border-primary-200 transition-all"
              >
                {Card}
                <h3 className="font-semibold text-gray-800 text-lg mb-2">
                  {item.title || item.name}
                </h3>
                <SafeRichText className="prose prose-sm max-w-none text-gray-500" html={item.description || item.desc} />
              </div>
            );
          })}
        </div>

        {ctaText && ctaLink && (
          <div className="text-center mt-12">
            <LocalizedLink
              to={ctaLink}
              className="inline-block bg-primary-600 text-white px-10 py-3 font-semibold hover:bg-primary-700 transition"
            >
              {ctaText}
            </LocalizedLink>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductApplications;

// MukonoTalks

