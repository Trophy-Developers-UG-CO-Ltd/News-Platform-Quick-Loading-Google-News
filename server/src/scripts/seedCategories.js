
const mongoose = require("mongoose");
const Category = require("../models/category.model");
const { slugify } = require("../utils/slugify");

const categories = [
  "Videos",
  "News",
  "Entertainment",
  "Politics",
  "Lifestyle",
  "Trending",
  "Politics Update",
  "Celebrity News",
  "Jobs Released",
  "Campus Trends",
  "Business Stories",
  "City News",
  "Sports",
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  for (const name of [...new Set(categories)]) {
    const slug = slugify(name);
    await Category.updateOne(
      { slug },
      { $setOnInsert: { name, slug } },
      { upsert: true }
    );
  }
  console.log("Categories seeded.");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
