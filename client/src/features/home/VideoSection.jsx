/**
 * Video Section — dynamic, admin-driven
 * @module features/home/VideoSection
 */

import React, { useState } from "react";
import { PlayCircle, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from '../../app/axios';
import SafeRichText from "../../components/ui/SafeRichText";

/* ── Default copy (fallback when API is unavailable) ── */
const DEFAULT = {
  heading: {
    eyebrow: "How We Work",
    title: "Industrial Chemical Manufacturing",
    description: "See how industrial pigments, resins, and specialty chemical materials are sourced, quality-tested, and supplied to manufacturers across Africa.",
  },
  videoUrl:     "https://www.youtube.com/watch?v=ETOSTwqrFyU",
  thumbnailUrl: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1280&q=80",
  videoCaption: "MukonoTalks · Manufacturing Process Overview",
};

const withAutoplay = (url) => {
  if (!url) return '';
  return `${url}${url.includes('?') ? '&' : '?'}autoplay=1`;
};

const fetchSection = async () => {
  const { data } = await api.get('/homepage-sections/video');
  return data;
};

const VideoSection = () => {
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["homepageSection", "video"],
    queryFn: fetchSection,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const section = data || DEFAULT;
  if (data?.isActive === false) return null;

  const { eyebrow, title, description } = section.heading || DEFAULT.heading;
  const videoUrl     = section.videoUrl     || DEFAULT.videoUrl;
  const thumbnailUrl = section.thumbnailUrl || DEFAULT.thumbnailUrl;
  const caption      = section.videoCaption || DEFAULT.videoCaption;

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
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
            <SafeRichText className="prose mx-auto max-w-2xl text-gray-500" html={description} />
          )}
        </div>

        {/* Thumbnail with play button */}
        <div
          className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl cursor-pointer group"
          onClick={() => setOpen(true)}
        >
          <img
            src={thumbnailUrl}
            alt={title || "Industrial chemical manufacturing process"}
            className="w-full object-cover aspect-video group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/60 group-hover:scale-110 transition-transform">
              <PlayCircle size={48} className="text-white ml-0.5" />
            </div>
          </div>
          {caption && (
            <div className="absolute bottom-6 left-6 right-6">
              <SafeRichText className="prose prose-sm max-w-none text-white" html={caption} />
            </div>
          )}
        </div>

        {/* Lightbox modal */}
        {open && (
          <div
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="relative w-full max-w-4xl aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={withAutoplay(videoUrl)}
                title={title || "Video"}
                className="w-full h-full rounded-xl"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
              <button
                onClick={() => setOpen(false)}
                className="absolute -top-10 right-0 text-white/70 hover:text-white transition"
                aria-label="Close video"
              >
                <X size={28} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default VideoSection;

// MukonoTalks

