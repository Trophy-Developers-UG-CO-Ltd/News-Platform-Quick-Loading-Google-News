/**
 * Category-only seeder — MukonoTalks
 * Upserts editorial categories used across homepage, admin editor, and ticker surfaces.
 *
 * Usage (from /server):
 *   node seeds/seedCategories.js
 *   npm run seed:categories
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const slugify = require('slugify');
const Category = require('../src/modules/categories/category.model');

const categories = [
  {
    name: 'News',
    description: 'Breaking and daily news stories from Mukono and surrounding communities.',
    sortOrder: 1,
    seoTitle: 'News | MukonoTalks',
    seoDescription: 'Latest news stories from Mukono and surrounding communities.',
    seoKeywords: ['news', 'mukono news', 'uganda news'],
  },
  {
    name: 'Music',
    description: 'New releases, artist stories, and entertainment updates from the local music scene.',
    sortOrder: 2,
    seoTitle: 'Music | MukonoTalks',
    seoDescription: 'Music stories, artist updates, and entertainment highlights.',
    seoKeywords: ['music', 'uganda music', 'entertainment'],
  },
  {
    name: 'Lifestyle',
    description: 'Culture, fashion, people, and day-to-day lifestyle stories.',
    sortOrder: 3,
    seoTitle: 'Lifestyle | MukonoTalks',
    seoDescription: 'Lifestyle coverage including culture, people, and trends.',
    seoKeywords: ['lifestyle', 'culture', 'trends'],
  },
  {
    name: 'Videos',
    description: 'Video stories, interviews, and visual reports from MukonoTalks.',
    sortOrder: 4,
    seoTitle: 'Videos | MukonoTalks',
    seoDescription: 'Watch MukonoTalks videos from editorial and community coverage.',
    seoKeywords: ['videos', 'video news', 'mukono videos'],
  },
  {
    name: 'Entertainment',
    description: 'Entertainment stories, creator culture, and community spotlight updates.',
    sortOrder: 5,
    seoTitle: 'Entertainment | MukonoTalks',
    seoDescription: 'Entertainment stories and creator culture from Mukono.',
    seoKeywords: ['entertainment', 'celebrities', 'events'],
  },
  {
    name: 'Politics',
    description: 'Local and national political stories, civic developments, and public affairs.',
    sortOrder: 6,
    seoTitle: 'Politics | MukonoTalks',
    seoDescription: 'Political stories, governance updates, and civic reporting.',
    seoKeywords: ['politics', 'governance', 'public affairs'],
  },
  {
    name: 'Opportunities',
    description: 'Jobs, scholarships, calls, and opportunities for local communities.',
    sortOrder: 7,
    seoTitle: 'Opportunities | MukonoTalks',
    seoDescription: 'Jobs, scholarships, and opportunity listings for readers.',
    seoKeywords: ['opportunities', 'jobs', 'open calls'],
  },
  {
    name: 'Knowledge Base',
    description: 'Reference and evergreen explainers, guides, and educational content.',
    sortOrder: 8,
    seoTitle: 'Knowledge Base | MukonoTalks',
    seoDescription: 'Reference guides and evergreen educational content.',
    seoKeywords: ['knowledge base', 'guides', 'explainers'],
  },
  {
    name: 'Trending',
    description: 'Top trending stories and fast-moving conversations.',
    sortOrder: 9,
    seoTitle: 'Trending | MukonoTalks',
    seoDescription: 'Trending stories and fast-moving conversations.',
    seoKeywords: ['trending', 'viral', 'top stories'],
  },
  {
    name: 'Politics Update',
    description: 'Quick political updates and policy developments.',
    sortOrder: 10,
    seoTitle: 'Politics Update | MukonoTalks',
    seoDescription: 'Quick political updates and policy developments.',
    seoKeywords: ['politics update', 'policy', 'government'],
  },
  {
    name: 'Celebrity News',
    description: 'Celebrity profiles, interviews, and entertainment buzz.',
    sortOrder: 11,
    seoTitle: 'Celebrity News | MukonoTalks',
    seoDescription: 'Celebrity stories, interviews, and entertainment buzz.',
    seoKeywords: ['celebrity news', 'stars', 'showbiz'],
  },
  {
    name: 'Jobs Released',
    description: 'Freshly released job opportunities and related announcements.',
    sortOrder: 12,
    seoTitle: 'Jobs Released | MukonoTalks',
    seoDescription: 'Recently released jobs and career opportunities.',
    seoKeywords: ['jobs released', 'career', 'vacancies'],
  },
  {
    name: 'Campus Trends',
    description: 'Student culture, campus stories, and youth trends.',
    sortOrder: 13,
    seoTitle: 'Campus Trends | MukonoTalks',
    seoDescription: 'Campus stories, youth culture, and student trends.',
    seoKeywords: ['campus trends', 'students', 'youth'],
  },
  {
    name: 'Business Stories',
    description: 'Business coverage, markets, entrepreneurship, and economic updates.',
    sortOrder: 14,
    seoTitle: 'Business Stories | MukonoTalks',
    seoDescription: 'Business stories, markets, and entrepreneurship updates.',
    seoKeywords: ['business', 'markets', 'entrepreneurship'],
  },
  {
    name: 'City News',
    description: 'Urban development, transport, and city-level local updates.',
    sortOrder: 15,
    seoTitle: 'City News | MukonoTalks',
    seoDescription: 'City-level updates on development, transport, and services.',
    seoKeywords: ['city news', 'urban', 'development'],
  },
  {
    name: 'Sports',
    description: 'Community sports, match updates, and athlete coverage.',
    sortOrder: 16,
    seoTitle: 'Sports | MukonoTalks',
    seoDescription: 'Sports updates, match reports, and athlete stories.',
    seoKeywords: ['sports', 'football', 'athletes'],
  },
  {
    name: 'Blog',
    description: 'General blog stories, analysis, and editorial coverage.',
    sortOrder: 17,
    seoTitle: 'Blog | MukonoTalks',
    seoDescription: 'Editorial blog stories and analysis.',
    seoKeywords: ['blog', 'editorial', 'analysis'],
  },
  {
    name: 'Insight',
    description: 'Deep-dive analysis and expert editorial insights.',
    sortOrder: 18,
    seoTitle: 'Insight | MukonoTalks',
    seoDescription: 'In-depth analysis and editorial insight stories.',
    seoKeywords: ['insight', 'analysis', 'deep dive'],
  },
  {
    name: 'Case Study',
    description: 'Evidence-based stories and case-driven reports.',
    sortOrder: 19,
    seoTitle: 'Case Study | MukonoTalks',
    seoDescription: 'Case studies and evidence-based editorial reports.',
    seoKeywords: ['case study', 'report', 'evidence'],
  },
  {
    name: 'Announcement',
    description: 'Official announcements, notices, and platform updates.',
    sortOrder: 20,
    seoTitle: 'Announcements | MukonoTalks',
    seoDescription: 'Official announcements and updates from MukonoTalks.',
    seoKeywords: ['announcement', 'notice', 'updates'],
  },
];

const toPayload = (item) => {
  const slug = slugify(item.name, { lower: true, strict: true, trim: true });

  return {
    name: item.name,
    slug,
    description: item.description,
    localizedName: { en: item.name, zh: null, sw: null },
    localizedDescription: { en: item.description, zh: null, sw: null },
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    seoKeywords: item.seoKeywords || [],
    ogTitle: item.seoTitle,
    ogDescription: item.seoDescription,
    sortOrder: item.sortOrder,
    isActive: true,
  };
};

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌  MONGO_URI is not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`✅  Connected: ${mongoose.connection.host}`);

  let created = 0;
  let updated = 0;

  for (const item of categories) {
    const payload = toPayload(item);

    const existing = await Category.findOne({
      $or: [{ slug: payload.slug }, { name: payload.name }],
    });

    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      updated += 1;
      continue;
    }

    await Category.create(payload);
    created += 1;
  }

  console.log('─────────────────────────────────────────────────────');
  console.log(`✅  Categories seeded: ${categories.length}`);
  console.log(`    Created: ${created}`);
  console.log(`    Updated: ${updated}`);
  categories.forEach((item) => {
    const slug = slugify(item.name, { lower: true, strict: true, trim: true });
    console.log(`    [${item.sortOrder}] ${item.name} -> ${slug}`);
  });
  console.log('─────────────────────────────────────────────────────');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌  seedCategories error:', err.message);
  process.exit(1);
});
