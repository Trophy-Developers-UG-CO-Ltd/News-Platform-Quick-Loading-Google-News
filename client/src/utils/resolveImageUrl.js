// client/src/utils/resolveImageUrl.js

const API_ORIGIN =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  import.meta.env.VITE_SERVER_URL ||
  "";

const CDN_ORIGIN = import.meta.env.VITE_CDN_URL || "https://cdn.mukonotalks.ug";

const resolveImageUrl = (input) => {
  if (!input) return "";

  const url = String(input).trim();

  // Already absolute
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // Old local uploads path
  if (url.startsWith("/uploads/")) {
    return `${API_ORIGIN}${url}`;
  }

  // CDN-relative product path like /products/x.jpg
  if (url.startsWith("/products/")) {
    return `${CDN_ORIGIN}${url}`;
  }

  // Bare filename fallback
  if (!url.startsWith("/")) {
    return `${CDN_ORIGIN}/products/${url}`;
  }

  return url;
};

export default resolveImageUrl;