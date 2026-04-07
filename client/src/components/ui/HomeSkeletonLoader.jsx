/**
 * Homepage Skeleton Loader
 * Pixel-accurate animated placeholders matching every homepage section
 * @module components/ui/HomeSkeletonLoader
 */

import React from 'react';

// ─── Base shimmer block ────────────────────────────────────────────────────────
const Shimmer = ({ className = '' }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

// ─── Hero (520 px, split pane) ─────────────────────────────────────────────────
const HeroSkeleton = () => (
  <div className="w-full overflow-hidden" style={{ height: '520px' }}>
    <div className="h-full grid grid-rows-[1fr_1fr] lg:grid-rows-none lg:grid-cols-[3fr_2fr]">
      {/* Text pane */}
      <div className="bg-gray-300 flex flex-col justify-center px-6 py-8 sm:px-8 md:px-12 lg:px-20 gap-4">
        <Shimmer className="h-3 w-24 rounded-full" />
        <Shimmer className="h-10 w-4/5 rounded-lg" />
        <Shimmer className="h-10 w-3/5 rounded-lg" />
        <Shimmer className="w-16 h-1 rounded-full mt-1" />
        <Shimmer className="h-4 w-full rounded" />
        <Shimmer className="h-4 w-5/6 rounded" />
        <Shimmer className="h-4 w-3/4 rounded" />
        <div className="mt-2">
          <Shimmer className="h-10 w-36 rounded" />
        </div>
      </div>
      {/* Image pane */}
      <div className="bg-gray-300 relative overflow-hidden">
        {/* subtle diagonal shimmer sweep */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200/60 via-gray-300 to-gray-200/60 animate-pulse" />
      </div>
    </div>
  </div>
);

// ─── Sub-headline (dark bg) ────────────────────────────────────────────────────
const SubHeadlineSkeleton = () => (
  <section className="bg-primary-900/30 py-14">
    <div className="container mx-auto px-4 max-w-4xl text-center space-y-4">
      <Shimmer className="h-8 w-3/4 mx-auto rounded-lg" />
      <Shimmer className="h-8 w-2/3 mx-auto rounded-lg" />
      <Shimmer className="h-4 w-full max-w-2xl mx-auto rounded mt-4" />
      <Shimmer className="h-4 w-5/6 max-w-2xl mx-auto rounded" />
    </div>
  </section>
);

// ─── Value Propositions (4 cards) ─────────────────────────────────────────────
const ValuePropsSkeleton = () => (
  <section className="py-20 bg-gray-50">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-8 text-center space-y-4">
            <Shimmer className="h-10 w-10 rounded-full mx-auto" />
            <Shimmer className="h-5 w-3/4 mx-auto rounded" />
            <Shimmer className="h-3.5 w-full rounded" />
            <Shimmer className="h-3.5 w-5/6 mx-auto rounded" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Categories (3-column) ────────────────────────────────────────────────────
const CategoriesSkeleton = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      {/* heading */}
      <div className="text-center mb-14 space-y-3">
        <Shimmer className="h-7 w-52 mx-auto rounded-lg" />
        <Shimmer className="h-4 w-80 mx-auto rounded" />
        <Shimmer className="h-4 w-64 mx-auto rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 flex items-center space-x-4">
            <Shimmer className="h-16 w-16 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-4 w-3/4 rounded" />
              <Shimmer className="h-3 w-full rounded" />
              <Shimmer className="h-3 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>
      {/* button */}
      <div className="text-center mt-12">
        <Shimmer className="h-11 w-40 rounded mx-auto" />
      </div>
    </div>
  </section>
);

// ─── Industries strip ──────────────────────────────────────────────────────────
const IndustriesSkeleton = () => (
  <section className="py-16 bg-gray-50">
    <div className="container mx-auto px-4 space-y-8">
      <div className="text-center space-y-3">
        <Shimmer className="h-7 w-48 mx-auto rounded-lg" />
        <Shimmer className="h-4 w-72 mx-auto rounded" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 flex flex-col items-center gap-3 shadow-sm">
            <Shimmer className="h-10 w-10 rounded-full" />
            <Shimmer className="h-3.5 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Product Applications (card grid) ─────────────────────────────────────────
const ApplicationsSkeleton = () => (
  <section className="py-20">
    <div className="container mx-auto px-4 space-y-10">
      <div className="text-center space-y-3">
        <Shimmer className="h-7 w-64 mx-auto rounded-lg" />
        <Shimmer className="h-4 w-80 mx-auto rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
            <Shimmer className="h-44 w-full rounded-none" />
            <div className="p-5 space-y-2">
              <Shimmer className="h-5 w-1/2 rounded" />
              <Shimmer className="h-3.5 w-full rounded" />
              <Shimmer className="h-3.5 w-3/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Technical Advantage (split) ──────────────────────────────────────────────
const TechnicalAdvantageSkeleton = () => (
  <section className="py-20 bg-gray-50">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-4">
          <Shimmer className="h-6 w-24 rounded-full" />
          <Shimmer className="h-8 w-3/4 rounded-lg" />
          <Shimmer className="h-8 w-2/3 rounded-lg" />
          <Shimmer className="h-4 w-full rounded mt-2" />
          <Shimmer className="h-4 w-5/6 rounded" />
          <div className="space-y-3 mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Shimmer className="h-5 w-5 rounded-full flex-shrink-0" />
                <Shimmer className="h-4 flex-1 rounded" />
              </div>
            ))}
          </div>
        </div>
        <Shimmer className="h-72 w-full rounded-xl" />
      </div>
    </div>
  </section>
);

// ─── Video section ─────────────────────────────────────────────────────────────
const VideoSkeleton = () => (
  <section className="py-16">
    <div className="container mx-auto px-4 space-y-6">
      <div className="text-center space-y-3">
        <Shimmer className="h-7 w-52 mx-auto rounded-lg" />
        <Shimmer className="h-4 w-72 mx-auto rounded" />
      </div>
      <Shimmer className="h-64 sm:h-80 lg:h-96 w-full rounded-xl max-w-4xl mx-auto" />
    </div>
  </section>
);

// ─── FAQ accordion ────────────────────────────────────────────────────────────
const FAQSkeleton = () => (
  <section className="py-16 bg-gray-50">
    <div className="container mx-auto px-4 max-w-3xl space-y-8">
      <div className="text-center space-y-3">
        <Shimmer className="h-7 w-40 mx-auto rounded-lg" />
        <Shimmer className="h-4 w-64 mx-auto rounded" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 flex items-center justify-between shadow-sm">
            <Shimmer className={`h-4 rounded w-${i % 2 === 0 ? '3/5' : '4/5'}`} />
            <Shimmer className="h-5 w-5 rounded flex-shrink-0 ml-4" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── CTA banner ───────────────────────────────────────────────────────────────
const CTASkeleton = () => (
  <section className="py-16 bg-gray-200">
    <div className="container mx-auto px-4 text-center space-y-5 max-w-2xl">
      <Shimmer className="h-8 w-2/3 mx-auto rounded-lg" />
      <Shimmer className="h-4 w-full mx-auto rounded" />
      <Shimmer className="h-4 w-4/5 mx-auto rounded" />
      <div className="flex justify-center gap-4 mt-4">
        <Shimmer className="h-11 w-36 rounded" />
        <Shimmer className="h-11 w-36 rounded" />
      </div>
    </div>
  </section>
);

// ─── Full homepage skeleton ────────────────────────────────────────────────────
const HomeSkeletonLoader = () => (
  <div aria-hidden="true">
    <HeroSkeleton />
    <SubHeadlineSkeleton />
    <ValuePropsSkeleton />
    <CategoriesSkeleton />
    <IndustriesSkeleton />
    <ApplicationsSkeleton />
    <TechnicalAdvantageSkeleton />
    <VideoSkeleton />
    <FAQSkeleton />
    <CTASkeleton />
  </div>
);

export default HomeSkeletonLoader;

// MukonoTalks

