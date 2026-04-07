/**
 * Schema Builder Utility
 * Generates valid JSON-LD schema objects for all supported schema types.
 * @module utils/schema-builder
 */

'use strict';

const seoConfig = require('../config/seo.config');

const SITE_URL  = seoConfig.siteUrl;
const SITE_NAME = seoConfig.siteName;

const SchemaBuilder = {

  organization(data = {}) {
    return {
      '@context': 'https://schema.org',
      '@type':    'Organization',
      name:       data.name        || SITE_NAME,
      url:        data.url         || SITE_URL,
      logo:       data.logo        || `${SITE_URL}/logo.png`,
      description: data.description || '',
      contactPoint: data.phone ? [{
        '@type':       'ContactPoint',
        telephone:     data.phone,
        contactType:   'customer service',
      }] : undefined,
      sameAs: data.sameAs || [],
    };
  },

  webSite(data = {}) {
    return {
      '@context': 'https://schema.org',
      '@type':    'WebSite',
      name:       data.name || SITE_NAME,
      url:        data.url  || SITE_URL,
      potentialAction: {
        '@type':       'SearchAction',
        target:        `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };
  },

  breadcrumb(items = []) {
    return {
      '@context':        'https://schema.org',
      '@type':           'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type':   'ListItem',
        position:  i + 1,
        name:      item.name,
        item:      item.url?.startsWith('http') ? item.url : `${SITE_URL}${item.url || ''}`,
      })),
    };
  },

  product(data = {}) {
    const schema = {
      '@context':   'https://schema.org',
      '@type':      'Product',
      name:         data.name || '',
      description:  data.description || '',
      sku:          data.sku  || '',
      brand: data.brand ? {
        '@type': 'Brand',
        name:    data.brand,
      } : undefined,
      image:        data.images || [],
      url:          data.url ? `${SITE_URL}${data.url}` : undefined,
      category:     data.category || undefined,
    };

    if (data.price !== undefined) {
      schema.offers = {
        '@type':         'Offer',
        priceCurrency:   data.currency || 'USD',
        price:           data.price,
        availability:    data.inStock !== false
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name:    SITE_NAME,
        },
        url: data.url ? `${SITE_URL}${data.url}` : SITE_URL,
      };
    }

    if (data.ratingValue && data.reviewCount) {
      schema.aggregateRating = {
        '@type':       'AggregateRating',
        ratingValue:   data.ratingValue,
        reviewCount:   data.reviewCount,
        bestRating:    data.bestRating  || 5,
        worstRating:   data.worstRating || 1,
      };
    }

    return schema;
  },

  article(data = {}) {
    return {
      '@context':          'https://schema.org',
      '@type':             data.isNews ? 'NewsArticle' : 'Article',
      headline:            data.title       || '',
      description:         data.description || '',
      image:               data.image       || [],
      author: {
        '@type': 'Person',
        name:    data.author || SITE_NAME,
      },
      publisher: {
        '@type': 'Organization',
        name:    SITE_NAME,
        logo: {
          '@type': 'ImageObject',
          url:     `${SITE_URL}/logo.png`,
        },
      },
      datePublished: data.publishedAt  || new Date().toISOString(),
      dateModified:  data.updatedAt    || new Date().toISOString(),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id':   data.url ? `${SITE_URL}${data.url}` : SITE_URL,
      },
      keywords: Array.isArray(data.keywords) ? data.keywords.join(', ') : (data.keywords || ''),
    };
  },

  faqPage(faqs = []) {
    return {
      '@context': 'https://schema.org',
      '@type':    'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type':           'Question',
        name:              faq.question || faq.q || '',
        acceptedAnswer: {
          '@type': 'Answer',
          text:    faq.answer   || faq.a || '',
        },
      })),
    };
  },

  localBusiness(data = {}) {
    const schema = {
      '@context':   'https://schema.org',
      '@type':      data.type || 'LocalBusiness',
      name:         data.name        || SITE_NAME,
      description:  data.description || '',
      url:          data.url         || SITE_URL,
      telephone:    data.phone       || '',
      email:        data.email       || '',
    };

    if (data.address) {
      schema.address = {
        '@type':           'PostalAddress',
        streetAddress:     data.address.street      || '',
        addressLocality:   data.address.city        || '',
        addressRegion:     data.address.region      || '',
        postalCode:        data.address.postalCode  || '',
        addressCountry:    data.address.country     || 'ZA',
      };
    }

    if (data.geo) {
      schema.geo = {
        '@type':    'GeoCoordinates',
        latitude:   data.geo.lat,
        longitude:  data.geo.lng,
      };
    }

    if (data.openingHours) {
      schema.openingHoursSpecification = data.openingHours;
    }

    if (data.image) schema.image = data.image;

    return schema;
  },

  event(data = {}) {
    return {
      '@context':     'https://schema.org',
      '@type':        'Event',
      name:           data.name        || '',
      description:    data.description || '',
      startDate:      data.startDate   || '',
      endDate:        data.endDate     || '',
      location: data.location ? {
        '@type':  data.location.type || 'Place',
        name:     data.location.name || '',
        address:  data.location.address || '',
      } : undefined,
      organizer: {
        '@type': 'Organization',
        name:    data.organizer || SITE_NAME,
        url:     SITE_URL,
      },
      image:          data.image  || [],
      eventStatus:    data.status || 'https://schema.org/EventScheduled',
      eventAttendanceMode: data.online
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode',
    };
  },

  jobPosting(data = {}) {
    return {
      '@context':         'https://schema.org',
      '@type':            'JobPosting',
      title:              data.title           || '',
      description:        data.description     || '',
      datePosted:         data.datePosted      || new Date().toISOString(),
      validThrough:       data.validThrough    || '',
      employmentType:     data.employmentType  || 'FULL_TIME',
      hiringOrganization: {
        '@type': 'Organization',
        name:    data.company || SITE_NAME,
        sameAs:  SITE_URL,
      },
      jobLocation: data.location ? {
        '@type':  'Place',
        address: {
          '@type':         'PostalAddress',
          addressLocality: data.location.city    || '',
          addressRegion:   data.location.region  || '',
          addressCountry:  data.location.country || 'ZA',
        },
      } : undefined,
      baseSalary: data.salary ? {
        '@type':    'MonetaryAmount',
        currency:   data.salary.currency || 'USD',
        value: {
          '@type':    'QuantitativeValue',
          minValue:   data.salary.min,
          maxValue:   data.salary.max,
          unitText:   data.salary.period || 'MONTH',
        },
      } : undefined,
    };
  },

  videoObject(data = {}) {
    return {
      '@context':     'https://schema.org',
      '@type':        'VideoObject',
      name:           data.name        || '',
      description:    data.description || '',
      thumbnailUrl:   data.thumbnail   || '',
      uploadDate:     data.uploadDate  || new Date().toISOString(),
      duration:       data.duration    || '',
      contentUrl:     data.url         || '',
      embedUrl:       data.embedUrl    || '',
      publisher: {
        '@type': 'Organization',
        name:    SITE_NAME,
        logo: {
          '@type': 'ImageObject',
          url:     `${SITE_URL}/logo.png`,
        },
      },
    };
  },

  collectionPage(data = {}) {
    return {
      '@context':   'https://schema.org',
      '@type':      'CollectionPage',
      name:         data.name        || '',
      description:  data.description || '',
      url:          data.url ? `${SITE_URL}${data.url}` : SITE_URL,
    };
  },

  howTo(data = {}) {
    return {
      '@context':   'https://schema.org',
      '@type':      'HowTo',
      name:         data.name        || '',
      description:  data.description || '',
      step: (data.steps || []).map((step, i) => ({
        '@type':   'HowToStep',
        position:  i + 1,
        name:      step.name || `Step ${i + 1}`,
        text:      step.text || '',
        image:     step.image || undefined,
      })),
      totalTime:    data.totalTime || undefined,
    };
  },
};

module.exports = SchemaBuilder;

// MukonoTalks

