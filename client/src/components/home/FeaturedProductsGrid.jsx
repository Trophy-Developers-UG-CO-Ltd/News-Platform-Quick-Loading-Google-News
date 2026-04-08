/**
 * FeaturedProductsGrid
 * Displays a limited product grid on the homepage with expand/collapse behaviour.
 * @module components/home/FeaturedProductsGrid
 */

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { FiArrowRight, FiChevronDown, FiChevronUp } from "react-icons/fi";
import LocalizedLink from "../i18n/LocalizedLink";
import Spinner from "../ui/Spinner";
import ProductImagePlaceholder from "../ui/ProductImagePlaceholder";
import resolveImageUrl from "../../utils/resolveImageUrl";

const INITIAL_VISIBLE = 6;

/**
 * Pick `count` products with category diversity.
 * Uses round-robin across categories so the initial grid shows a mix of
 * 3-4 categories instead of only the most recently added items.
 */
const pickDiverseProducts = (allProducts, count = INITIAL_VISIBLE) => {
  if (!Array.isArray(allProducts) || allProducts.length <= count) {
    return Array.isArray(allProducts) ? allProducts : [];
  }

  const byCategory = {};

  allProducts.forEach((product) => {
    const catKey =
      typeof product.category === "object"
        ? product.category?._id || product.category?.name || "__none__"
        : product.category || "__none__";

    if (!byCategory[catKey]) {
      byCategory[catKey] = [];
    }

    byCategory[catKey].push(product);
  });

  const buckets = Object.values(byCategory);

  if (buckets.length === 1) {
    return allProducts.slice(0, count);
  }

  const result = [];
  let round = 0;

  while (result.length < count) {
    let added = false;

    for (const bucket of buckets) {
      if (result.length >= count) break;

      if (bucket[round]) {
        result.push(bucket[round]);
        added = true;
      }
    }

    if (!added) break;
    round++;
  }

  return result;
};

/* ── Individual product card ─────────────────────────────────────────────── */
const ProductCard = ({ product }) => {
  const productHref = `/products/${product.slug}`;

  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : null;

  const categorySlug =
    typeof product.category === "object"
      ? product.category?.slug
      : null;

  const categoryId =
    typeof product.category === "object"
      ? product.category?._id
      : null;

  const categoryHref = categorySlug
    ? `/categories/${categorySlug}`
    : categoryId
      ? `/products?category=${categoryId}`
      : null;

  const imageSrc = product.images?.[0]
    ? resolveImageUrl(product.images[0]?.url || product.images[0])
    : null;

  return (
    <article className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden flex items-center justify-center">
        <LocalizedLink
          to={productHref}
          className="block h-full w-full"
          aria-label={product.title}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <ProductImagePlaceholder title={product.title} />
          )}
        </LocalizedLink>

        {/* Category badge */}
        {categoryName && categoryHref ? (
          <div className="absolute top-3 left-3 z-10">
            <LocalizedLink
              to={categoryHref}
              className="inline-flex bg-primary-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-primary-700 transition-colors"
            >
              {categoryName}
            </LocalizedLink>
          </div>
        ) : null}

        {categoryName && !categoryHref ? (
          <span className="absolute top-3 left-3 z-10 bg-primary-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {categoryName}
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <LocalizedLink to={productHref} className="block">
          <h3 className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors line-clamp-1 mb-2">
            {product.title}
          </h3>
        </LocalizedLink>

        {product.description ? (
          <p className="text-sm text-gray-500 line-clamp-2 flex-1">
            {product.description}
          </p>
        ) : (
          <div className="flex-1" />
        )}

        <div className="mt-4">
          <LocalizedLink
            to={productHref}
            className="inline-flex items-center text-primary-600 text-sm font-medium"
          >
            <span>View Product</span>
            <FiArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </LocalizedLink>
        </div>
      </div>
    </article>
  );
};

/* ── Grid section ────────────────────────────────────────────────────────── */
const FeaturedProductsGrid = ({ headingless = false }) => {
  const { products = [], isLoading } = useSelector((state) => state.products);
  const [isExpanded, setIsExpanded] = useState(false);

  const featuredSix = pickDiverseProducts(products, INITIAL_VISIBLE);
  const visibleProducts = isExpanded ? products : featuredSix;
  const hasMore = products.length > INITIAL_VISIBLE;

  const toggleVisible = () => {
    setIsExpanded((prev) => !prev);
  };

  const content = (
    <>
      {/* Loading state */}
      {isLoading && products.length === 0 ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : null}

      {/* Empty state */}
      {!isLoading && products.length === 0 ? (
        <p className="text-center text-gray-400 py-12">
          No products available yet.
        </p>
      ) : null}

      {/* Grid */}
      {visibleProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300">
            {visibleProducts.map((product) => (
              <ProductCard key={product._id || product.slug} product={product} />
            ))}
          </div>

          {/* Expand / collapse */}
          {hasMore ? (
            <div className="text-center mt-10">
              <button
                type="button"
                onClick={toggleVisible}
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-none font-semibold hover:bg-primary-700 active:scale-95 transition-all duration-200"
              >
                {isExpanded ? (
                  <>
                    Show Less <FiChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    More Products <FiChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );

  // When used inside FeaturedProductsSection, skip the outer section wrapper
  if (headingless) return content;

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {content}
      </div>
    </section>
  );
};

export default FeaturedProductsGrid;
// MukonoTalks:  //  Designed by Trophy Developers Uganda : https://www.trophydevelopers.com/uganda-web-designers/