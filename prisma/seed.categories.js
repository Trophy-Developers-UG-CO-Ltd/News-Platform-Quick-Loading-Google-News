// Seed script for categories
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  'Videos',
  'News',
  'Entertainment',
  'Politics',
  'Lifestyle',
  'Trending',
  'Politics Update',
  'Celebrity News',
  'Jobs Released',
  'Campus Trends',
  'Business Stories',
  'City News',
  'Sports',
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

async function main() {
  for (const name of [...new Set(categories)]) {
    const slug = slugify(name);
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, slug },
    });
  }
  console.log('Categories seeded.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
