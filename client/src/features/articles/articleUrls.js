const normalizePathSegment = (value, fallback = 'general') => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
};

export const getArticleSlug = (article) =>
  article?.localizedSlug?.en ||
  article?.localizedSlug ||
  article?.slug ||
  '';

export const getArticleCategorySlug = (article) =>
  normalizePathSegment(article?.category, 'general');

export const buildArticlePath = (article) => {
  const slug = getArticleSlug(article);
  const category = getArticleCategorySlug(article);
  return slug ? `/${category}/${slug}` : '/blog';
};

export const buildArticlePathFromParts = ({ category, slug }) => {
  const normalizedSlug = normalizePathSegment(slug, '');
  const normalizedCategory = normalizePathSegment(category, 'general');
  return normalizedSlug ? `/${normalizedCategory}/${normalizedSlug}` : '/blog';
};
