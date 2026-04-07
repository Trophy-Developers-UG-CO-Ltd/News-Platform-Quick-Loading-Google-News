/**
 * LocalizedLink - Language-aware Link component
 * Automatically prepends current language prefix to paths
 * @module components/i18n/LocalizedLink
 */

import React from "react";
import { Link, useParams } from "react-router-dom";
import { DEFAULT_LANGUAGE } from "../../i18n";

const LocalizedLink = ({ to, children, ...props }) => {
  const { lang } = useParams();
  const currentLang = lang || DEFAULT_LANGUAGE;

  // External URLs should use a normal anchor tag
  if (typeof to === "string" && /^(https?:)?\/\//.test(to)) {
    return (
      <a href={to} {...props}>
        {children}
      </a>
    );
  }

  // Don't prefix anchor links or admin routes
  if (
    typeof to === "string" &&
    (to.startsWith("#") || to.startsWith("/admin"))
  ) {
    return (
      <Link to={to} {...props}>
        {children}
      </Link>
    );
  }

  // Support object-based `to`
  if (typeof to === "object" && to !== null) {
    return <Link to={to} {...props}>{children}</Link>;
  }

  const cleanPath =
    typeof to === "string"
      ? to.startsWith("/")
        ? to
        : `/${to}`
      : "/";

  return (
    <Link to={`/${currentLang}${cleanPath}`} {...props}>
      {children}
    </Link>
  );
};

export default LocalizedLink;

// MukonoTalks
