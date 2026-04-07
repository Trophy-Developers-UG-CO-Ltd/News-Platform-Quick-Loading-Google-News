/**
 * Shared SEO type definitions (JSDoc).
 * These are used for documentation and IDE autocomplete across server and client.
 * @module shared/types/seo
 */

/**
 * @typedef {Object} SeoMeta
 * @property {string} pageSlug - Unique page identifier
 * @property {string} pageType - 'product'|'article'|'category'|'home'|'job'|'event'|'location'|'page'|'other'
 * @property {string} [title] - Meta title (30–60 chars)
 * @property {string} [metaDescription] - Meta description (120–160 chars)
 * @property {string} [canonical] - Canonical URL
 * @property {{ noindex: boolean, nofollow: boolean, noarchive: boolean, nosnippet: boolean }} robots
 * @property {string[]} focusKeywords
 * @property {string[]} secondaryKeywords
 * @property {OpenGraphMeta} openGraph
 * @property {TwitterMeta} twitter
 * @property {number} [seoScore]
 * @property {number} [readabilityScore]
 * @property {boolean} includeInSitemap
 * @property {string} changeFrequency
 * @property {number} sitemapPriority
 * @property {string} [indexingStatus]
 */

/**
 * @typedef {Object} OpenGraphMeta
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [image]
 * @property {string} [type]
 * @property {string} [url]
 */

/**
 * @typedef {Object} TwitterMeta
 * @property {string} [card]
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [image]
 * @property {string} [site]
 */

/**
 * @typedef {Object} SeoAnalysisResult
 * @property {number} seoScore
 * @property {number} readabilityScore
 * @property {string} grade
 * @property {number} wordCount
 * @property {SeoIssue[]} issues
 * @property {SeoIssue[]} recommendations
 * @property {KeywordResult[]} keywords
 * @property {Object} headings
 * @property {Object} links
 * @property {Object} images
 * @property {ReadabilityDetails} readability
 */

/**
 * @typedef {Object} SeoIssue
 * @property {string} message
 * @property {'error'|'warning'|'success'|'info'} type
 * @property {number} [score]
 */

/**
 * @typedef {Object} KeywordResult
 * @property {string} keyword
 * @property {number} count
 * @property {number} density
 * @property {boolean} inTitle
 * @property {boolean} inDescription
 * @property {boolean} inHeadings
 */

/**
 * @typedef {Object} ReadabilityDetails
 * @property {number} readabilityScore
 * @property {number} fleschScore
 * @property {string} fleschLabel
 * @property {number} avgSentenceLength
 * @property {number} passiveVoicePercent
 * @property {number} transitionWordPercent
 * @property {string} grade
 * @property {SeoIssue[]} issues
 */

/**
 * @typedef {'Product'|'Article'|'Organization'|'LocalBusiness'|'FAQPage'|'VideoObject'|
 *   'NewsArticle'|'BreadcrumbList'|'CollectionPage'|'JobPosting'|'Event'|'WebPage'|
 *   'WebSite'|'Person'|'Review'|'AggregateRating'|'HowTo'|'Recipe'|
 *   'SoftwareApplication'|'Course'|'Service'} SchemaType
 */

/**
 * @typedef {Object} SchemaDocument
 * @property {string} pageSlug
 * @property {SchemaType} schemaType
 * @property {Object} schemaJSON
 * @property {boolean} isActive
 */

module.exports = {};

// MukonoTalks

