/**
 * SEO Types
 * Shared TypeScript types for the SEO engine.
 * @module types/seo.types
 */

export interface RobotsMeta {
  index?: boolean;
  follow?: boolean;
  nosnippet?: boolean;
  noarchive?: boolean;
  noimageindex?: boolean;
  maxSnippet?: number;
  maxImagePreview?: 'none' | 'standard' | 'large';
  maxVideoPreview?: number;
}

export interface OpenGraphMeta {
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  type?: string;
  url?: string;
}

export interface TwitterMeta {
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  site?: string;
  creator?: string;
}

export interface SeoMeta {
  pageSlug: string;
  pageLabel?: string;
  pageType?: string;
  title?: string;
  metaDescription?: string;
  canonical?: string;
  robots?: RobotsMeta;
  focusKeywords?: string[];
  secondaryKeywords?: string[];
  openGraph?: OpenGraphMeta;
  twitter?: TwitterMeta;
  seoScore?: number | null;
  readabilityScore?: number | null;
  includeInSitemap?: boolean;
  changeFrequency?: string;
  sitemapPriority?: number;
  hreflang?: Record<string, string>;
  customHeadTags?: string;
  indexingStatus?: 'not_submitted' | 'submitted' | 'indexed' | 'error';
  lastIndexedAt?: string | null;
  lastAnalyzedAt?: string | null;
  updatedAt?: string;
}

export interface SeoAnalysisResult {
  seoScore: number;
  readabilityScore: number;
  grade: 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor';
  readabilityGrade: 'Good' | 'OK' | 'Needs Improvement' | 'Poor';
  issues: SeoIssue[];
  recommendations: string[];
  keywords: KeywordResult[];
  wordCount: number;
  headings: HeadingCounts;
  links: LinkCounts;
  images: ImageCounts;
  readability: ReadabilityDetails;
}

export interface SeoIssue {
  type: string;
  severity: 'error' | 'warning' | 'improvement';
  message: string;
}

export interface KeywordResult {
  keyword: string;
  type: 'focus' | 'secondary';
  count: number;
  density: number;
  densityStatus: 'good' | 'too_low' | 'too_high';
  inTitle: boolean;
  inMetaDescription: boolean;
  inFirstSentence: boolean;
  inHeadings: boolean;
  inImageAlt: boolean;
}

export interface HeadingCounts {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  h5: number;
  h6: number;
}

export interface LinkCounts {
  internal: number;
  external: number;
}

export interface ImageCounts {
  total: number;
  withoutAlt: number;
}

export interface ReadabilityDetails {
  fleschScore: number;
  fleschLabel: string;
  avgSentenceLength: number;
  passiveVoicePercent: number;
  transitionWordPercent: number;
  paragraphs: { count: number; longParagraphs: number };
}

export interface SerpPreview {
  url: string;
  displayUrl: string;
  title: string;
  description: string;
  robots: string;
  titleLength: number;
  descLength: number;
  titleStatus: 'good' | 'too_short' | 'too_long';
  descStatus: 'good' | 'too_short' | 'too_long';
}

export interface SeoMetadataStats {
  total: number;
  indexed: number;
  noTitle: number;
  noDescription: number;
  poorScore: number;
  goodScore: number;
  averageScore: number;
  byType: Array<{ _id: string; count: number; avgScore: number }>;
  scoreDistribution: Array<{ _id: number | string; count: number }>;
}

// MukonoTalks

