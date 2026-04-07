/**
 * Hero Block
 * Premium animated hero carousel - static slides, no API dependency
 * Mobile: alternating image-top/text-bottom (even) vs text-top/image-bottom (odd)
 * Desktop: alternating text-left/image-right vs image-left/text-right
 * @module features/pages/blocks/HeroBlock
 */

import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from '@tanstack/react-query';
import LocalizedLink from '../../../components/i18n/LocalizedLink';
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from '../../../app/axios';

const SLIDE_DURATION = 7;

const fetchHeroSlides = async () => {
  const { data } = await api.get('/hero/active');
  return data;
};

// Slide wrapper: slides in from the direction of travel
const wrapVariants = {
  enter:  (d) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
};

// Stagger text lines
const textContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.18 } },
};
const textItemVariants = {
  hidden:   { opacity: 0, y: 32, filter: "blur(4px)" },
  visible:  { opacity: 1, y: 0,  filter: "blur(0px)", transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// Ken-Burns scale on image
const imageKenBurns = {
  initial: { scale: 1.12 },
  animate: { scale: 1, transition: { duration: SLIDE_DURATION + 1, ease: "linear" } },
};

// Decorative animated shape behind text
const shapeVariants = {
  hidden:  { scale: 0.6, opacity: 0, rotate: -15 },
  visible: { scale: 1,   opacity: 0.08, rotate: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const HeroBlock = () => {
  const [index, setIndex]     = useState(0);
  const [direction, setDir]   = useState(1);
  const [isPaused, setPaused] = useState(false);

  const { data: slides = [], isLoading, isError } = useQuery({
    queryKey: ['heroSlides'],
    queryFn: fetchHeroSlides,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const total = slides.length;
  const isEven = index % 2 === 0; // drives alternating layout

  const goTo = useCallback((next) => {
    setDir(next > index ? 1 : -1);
    setIndex(next);
  }, [index]);

  const next = useCallback(() => goTo((index + 1) % total), [goTo, index, total]);
  const prev = useCallback(() => goTo((index - 1 + total) % total), [goTo, index, total]);

  useEffect(() => {
    if (isPaused || !total) return;
    const t = setTimeout(next, SLIDE_DURATION * 1000);
    return () => clearTimeout(t);
  }, [index, isPaused, next]);

  if (isLoading) {
    return <div className="w-full bg-gray-200 animate-pulse" style={{ height: '520px' }} />;
  }

  if (isError || !total) {
    return null;
  }

  const slide = slides[index];

  // Text block
  const TextPane = (
    <div
      className={`relative flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-10 md:px-12 lg:px-20 text-white overflow-hidden
        order-1 ${isEven ? "lg:order-1" : "lg:order-2"}
        ${slide.textAlign === 'center' ? 'items-center' : ''}`}
      style={{ backgroundColor: slide.textBgColor || '#1E3A8A' }}
    >
      {/* Decorative circle */}
      <motion.div
        key={`shape-${index}`}
        variants={shapeVariants}
        initial="hidden"
        animate="visible"
        className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white pointer-events-none"
      />
      <motion.div
        key={`shape2-${index}`}
        variants={shapeVariants}
        initial="hidden"
        animate="visible"
        className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-white pointer-events-none"
        style={{ transitionDelay: "0.1s" }}
      />

      <motion.div
        key={`text-${index}`}
        variants={textContainerVariants}
        initial="hidden"
        animate="visible"
        className={`relative z-10 ${slide.textAlign === 'center' ? 'flex flex-col items-center text-center' : ''}`}
      >
        {/* Eyebrow label */}
        {slide.showEyebrow !== false && (
          <motion.span
            variants={textItemVariants}
            className="inline-block text-xs font-bold tracking-[0.2em] uppercase mb-3 mt-1 opacity-70"
          >
            {slide.eyebrow || `MukonoTalks · Slide ${index + 1}`}
          </motion.span>
        )}

        {slide.showTitle !== false && (() => {
          const TitleTag = motion[slide.titleTag === 'h2' ? 'h2' : 'h1'];
          return (
            <TitleTag
              variants={textItemVariants}
              className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mt-1 mb-1"
            >
              {slide.title}
            </TitleTag>
          );
        })()}

        <motion.div variants={textItemVariants} className="mt-3 mb-1 w-16 h-1 rounded-full bg-white/50" />

        {slide.showDescription !== false && (
          <motion.p
            variants={textItemVariants}
            className="mt-3 mb-2 text-sm sm:text-base md:text-lg max-w-lg opacity-85 leading-relaxed"
          >
            {slide.description}
          </motion.p>
        )}
      </motion.div>
    </div>
  );

  // Image block
  const ImagePane = (
    <div
      className={`relative overflow-hidden
        order-2 ${isEven ? "lg:order-2" : "lg:order-1"}`}
      style={{ backgroundColor: slide.textBgColor || '#1E3A8A' }}
    >
      <motion.img
        key={`img-${index}`}
        src={slide.largeImage}
        alt={slide.title}
        className="absolute inset-0 w-full h-full object-cover hidden lg:block"
        variants={imageKenBurns}
        initial="initial"
        animate="animate"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      <motion.img
        key={`img-m-${index}`}
        src={slide.mobileImage || slide.largeImage}
        alt={slide.title}
        className="absolute inset-0 w-full h-full object-cover block lg:hidden"
        variants={imageKenBurns}
        initial="initial"
        animate="animate"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      {/* Gradient overlay - dynamic opacity */}
      <div
        className="absolute inset-0"
        style={{
          background: isEven
            ? `linear-gradient(to right, transparent, rgba(0,0,0,${(slide.overlayOpacity ?? 30) / 100}))`
            : `linear-gradient(to left, transparent, rgba(0,0,0,${(slide.overlayOpacity ?? 30) / 100}))`,
        }}
      />
      {/* Shimmer bar */}
      <motion.div
        key={`shimmer-${index}`}
        initial={{ x: "-100%", opacity: 0.6 }}
        animate={{ x: "200%", opacity: 0 }}
        transition={{ duration: 1.2, delay: 0.1, ease: "easeInOut" }}
        className="absolute inset-y-0 w-1/3 bg-white/10 skew-x-12 pointer-events-none"
      />
    </div>
  );

  return (
    <section
      className="relative w-full overflow-hidden select-none"
      style={{ height: "520px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          variants={wrapVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
          className="absolute inset-0 grid grid-rows-[1fr_1fr] lg:grid-rows-none lg:grid-cols-[3fr_2fr] gap-0"
        >
          {TextPane}
          {ImagePane}
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      {!isPaused && (
        <motion.div
          key={`progress-${index}`}
          className="absolute top-0 left-0 h-[3px] bg-white/60 z-50"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: SLIDE_DURATION, ease: "linear" }}
        />
      )}

      {/* CTA Button */}
      {slide.showCta !== false && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-14 sm:bottom-5 left-5 lg:left-20 z-40"
        >
          <LocalizedLink
            to={slide.ctaLink || '/get-quote'}
            className="px-7 py-2.5 bg-accent-500 text-white text-sm font-bold uppercase tracking-wider hover:bg-accent-600 transition-all shadow-xl hover:shadow-accent-500/40 hover:scale-105 inline-block"
          >
            {slide.ctaText || 'Get a Quote'}
          </LocalizedLink>
        </div>
      )}

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2 items-center">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`rounded-none transition-all duration-300 ${
              i === index ? "w-7 h-2 bg-white shadow-lg" : "w-2 h-2 bg-white/35 hover:bg-white/65"
            }`}
          />
        ))}
      </div>

      {/* Counter */}
      <div className="absolute top-4 right-4 z-50 text-white/60 text-xs font-semibold tracking-widest tabular-nums">
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>

      {/* Prev / Next */}
      <div className="absolute bottom-5 right-5 flex gap-2 z-50">
        <button
          type="button"
          onClick={prev}
          className="group bg-white/15 backdrop-blur-md p-2.5 rounded-none border border-white/40 hover:bg-white/35 transition-all hover:scale-110"
        >
          <ChevronLeft className="text-white w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <button
          type="button"
          onClick={next}
          className="group bg-white/15 backdrop-blur-md p-2.5 rounded-none border border-white/40 hover:bg-white/35 transition-all hover:scale-110"
        >
          <ChevronRight className="text-white w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </section>
  );
};

export default HeroBlock;

// MukonoTalks

