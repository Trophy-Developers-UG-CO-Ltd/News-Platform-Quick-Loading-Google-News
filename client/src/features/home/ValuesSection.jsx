/**
 * Values Section — dynamic, admin-driven
 * "Why Work With MukonoTalks" — value proposition cards.
 * @module features/home/ValuesSection
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getLucideIcon } from "../../utils/getLucideIcon";
import api from "../../app/axios";
import Reveal, { StaggerReveal } from "../../components/ui/Reveal";

const DEFAULT = {
  heading: {
    title: "Why Work With MukonoTalks",
    description:
      "We combine supply reliability with technical depth to support industrial manufacturing operations.",
  },
  items: [
    { icon: "ShieldCheck", title: "Certified Quality",     description: "All products meet international safety and performance standards." },
    { icon: "Truck",       title: "Reliable Distribution", description: "Consistent supply and logistics across industrial networks." },
    { icon: "Award",       title: "Technical Expertise",   description: "Application-driven support for manufacturing environments." },
    { icon: "Users",       title: "B2B Partnerships",      description: "Dedicated account support for procurement teams." },
  ],
};

const fetchSection = async () => {
  const { data } = await api.get("/homepage-sections/values");
  return data;
};

const ValuesSection = () => {
  const { data } = useQuery({
    queryKey: ["homepageSection", "values"],
    queryFn: fetchSection,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const section = data || DEFAULT;
  if (data?.isActive === false) return null;

  const { title, description } = section.heading || DEFAULT.heading;
  const items = section.items?.length ? section.items : DEFAULT.items;

  return (
    <section className="py-20 bg-gray-50 border-y border-gray-100">
      <div className="container mx-auto px-4">
        <Reveal variant="fade-up">
          <div className="mb-12 text-center max-w-3xl mx-auto">
            {title && (
              <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            )}
            {description && (
              <p className="text-gray-500 mt-3">{description}</p>
            )}
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StaggerReveal stagger={100}>
            {items.map((item, idx) => {
              const Icon = getLucideIcon(item.icon);
              return (
                <div
                  key={item._id || idx}
                  className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition"
                >
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-gray-50 mb-4">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {item.description || item.desc}
                  </p>
                </div>
              );
            })}
          </StaggerReveal>
        </div>
      </div>
    </section>
  );
};

export default ValuesSection;

// MukonoTalks

