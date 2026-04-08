/**
 * Featured Products Section — dynamic heading, admin-driven
 * Wraps FeaturedProductsGrid with an editable heading from the CMS.
 * @module features/home/FeaturedProductsSection
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../app/axios";
import Reveal from "../../components/ui/Reveal";
import FeaturedProductsGrid from "../../components/home/FeaturedProductsGrid";
import SafeRichText from "../../components/ui/SafeRichText";

const DEFAULT = {
  heading: {
    title: "Featured Products",
    description: "Selected materials used across industrial applications",
  },
};

const fetchSection = async () => {
  const { data } = await api.get("/homepage-sections/featured-products");
  return data;
};

const FeaturedProductsSection = () => {
  const { data } = useQuery({
    queryKey: ["homepageSection", "featured-products"],
    queryFn: fetchSection,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const section = data || DEFAULT;
  if (data?.isActive === false) return null;

  const { eyebrow, title, description } = section.heading || DEFAULT.heading;

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <Reveal variant="fade-up">
          <div className="mb-10">
            {eyebrow && (
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary-600 mb-3">
                {eyebrow}
              </span>
            )}
            {title && (
              <h2 className="text-2xl font-semibold text-gray-900">
                {title}
              </h2>
            )}
            {description && (
              <SafeRichText className="prose prose-sm mt-2 max-w-none text-gray-500" html={description} />
            )}
          </div>
        </Reveal>

        <FeaturedProductsGrid headingless />
      </div>
    </section>
  );
};

export default FeaturedProductsSection;

// MukonoTalks

