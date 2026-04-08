/**
 * Intro Section — dynamic, admin-driven
 * Displays the top intro heading + description below the hero.
 * @module features/home/IntroSection
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../app/axios";
import Reveal from "../../components/ui/Reveal";
import SafeRichText from "../../components/ui/SafeRichText";

const DEFAULT = {
  heading: {
    title: "Industrial Pigments, Resin Systems, and Specialty Chemical Materials",
    description:
      "MukonoTalks supplies specification-grade pigments, resin systems, and specialty materials used in coatings manufacturing, plastics production, water treatment, and industrial processing.",
  },
};

const fetchSection = async () => {
  const { data } = await api.get("/homepage-sections/intro");
  return data;
};

const IntroSection = () => {
  const { data } = useQuery({
    queryKey: ["homepageSection", "intro"],
    queryFn: fetchSection,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const section = data || DEFAULT;
  if (data?.isActive === false) return null;

  const { title, description } = section.heading || DEFAULT.heading;

  return (
    <section className="py-20 border-b border-gray-100">
      <div className="container mx-auto px-4 max-w-5xl text-center">
        <Reveal variant="fade-up">
          {title && (
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-6">
              {title}
            </h1>
          )}
          {description && (
            <SafeRichText className="prose prose-lg mx-auto max-w-none text-gray-600" html={description} />
          )}
        </Reveal>
      </div>
    </section>
  );
};

export default IntroSection;

// MukonoTalks

