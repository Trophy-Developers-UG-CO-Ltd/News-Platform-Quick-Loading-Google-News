/**
 * Hero Block
 * Enterprise animated hero carousel with admin-driven slides
 * Improvements:
 * - Next slide image preloading (removes flicker)
 * - GPU optimized parallax motion
 * - Mobile CTA margin adjustment
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from '../../app/axios';

const SLIDE_DURATION = 8; // seconds

const fetchHeroSlides = async () => {
  const { data } = await api.get('/hero/active');
  return data;
};

const HeroBlock = () => {
  const [index, setIndex] = useState(0);

  const { data: slides = [], isLoading, isError } = useQuery({
    queryKey: ["heroSlides"],
    queryFn: fetchHeroSlides,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const nextSlide = () =>
    setIndex((prev) => (prev + 1) % slides.length);

  const prevSlide = () =>
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);

  /* -----------------------------
     AUTO ROTATE
  ------------------------------ */

  useEffect(() => {
    if (!slides.length) return;

    const timer = setTimeout(nextSlide, SLIDE_DURATION * 1000);

    return () => clearTimeout(timer);
  }, [index, slides.length]);

  /* -----------------------------
     PRELOAD NEXT IMAGE
  ------------------------------ */

  useEffect(() => {
    if (!slides.length) return;

    const nextIndex = (index + 1) % slides.length;
    const nextSlide = slides[nextIndex];

    const imgLarge = new Image();
    imgLarge.src = nextSlide.largeImage;

    const imgMobile = new Image();
    imgMobile.src = nextSlide.mobileImage;
  }, [index, slides]);

  if (isLoading) {
    return <div className="h-[85vh] bg-gray-200 animate-pulse" />;
  }

  if (isError || !slides.length) {
    return null;
  }

  const slide = slides[index];
  const isEven = index % 2 === 0;

  return (
    <section className="relative w-full min-h-[85vh] overflow-hidden">

      <AnimatePresence mode="wait">
        <motion.div
          key={slide._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.x < -100) nextSlide();
            if (info.offset.x > 100) prevSlide();
          }}
          className="grid grid-cols-1 lg:grid-cols-2 min-h-[85vh]"
        >

          {/* TEXT SIDE — always on top on mobile, left/right swaps on desktop */}

          <div
            className={`flex flex-col justify-center px-6 md:px-4 lg:px-20 py-14 md:py-16 lg:py-0 text-white order-1 ${isEven ? "lg:order-1" : "lg:order-2"}`}
            style={{ backgroundColor: slide.textBgColor || "#1E3A8A" }}
          >

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.03 } },
              }}
              className="text-4xl md:text-4xl lg:text-6xl font-bold leading-tight"
            >
              {slide.title.split("").map((char, i) => (
                <motion.span
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.h1>

            {slide.description && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 sm:mt-3 text-lg md:text-xl max-w-xl"
              >
                {slide.description}
              </motion.p>
            )}

            {slide.ctaText && slide.ctaLink && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 md:mt-8"   /* Mobile spacing */
                /* Stop drag gesture from swallowing the CTA click */
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Link
                  to={slide.ctaLink}
                  className="inline-block px-8 py-3 md:mt-8 sm:mt-12 rounded-xl backdrop-blur-lg bg-white/20 border border-white/30 text-white hover:bg-white/30 transition"
                >
                  {slide.ctaText}
                </Link>
              </motion.div>
            )}

          </div>

          {/* IMAGE SIDE — always on bottom on mobile, left/right swaps on desktop */}

          <div className={`relative overflow-hidden order-2 ${isEven ? "lg:order-2" : "lg:order-1"}`}>

            {/* GPU PARALLAX */}

            <motion.div
              initial={{ scale: 1.1 }}
              animate={{
                scale: 1,
                transform: "translate3d(0,0,0)"
              }}
              transition={{ duration: SLIDE_DURATION, ease: "linear" }}
              className="absolute inset-0 will-change-transform"
            >

              {/* Desktop Image */}

              <img
                src={slide.largeImage}
                alt={slide.title}
                loading="eager"
                className="hidden lg:block w-full h-full object-cover"
              />

              {/* Mobile Image */}

              <img
                src={slide.mobileImage}
                alt={slide.title}
                loading="eager"
                className="block lg:hidden w-full h-full object-cover"
              />

            </motion.div>

            {/* Overlay */}

            <div className="absolute inset-0 bg-black/30" />

          </div>

        </motion.div>
      </AnimatePresence>

      {/* CONTROLS */}

      <div className="absolute bottom-8 right-8 flex gap-4 z-40">

        <button
          onClick={prevSlide}
          className="bg-white/20 backdrop-blur-lg p-3 rounded-none border border-white/30 hover:bg-white/30 transition"
        >
          <ChevronLeft className="text-white" />
        </button>

        <button
          onClick={nextSlide}
          className="bg-white/20 backdrop-blur-lg p-3 rounded-none border border-white/30 hover:bg-white/30 transition"
        >
          <ChevronRight className="text-white" />
        </button>

      </div>

    </section>
  );
};

export default HeroBlock;

// MukonoTalks
