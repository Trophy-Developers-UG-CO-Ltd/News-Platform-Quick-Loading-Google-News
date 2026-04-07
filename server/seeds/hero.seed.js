/**
 * Hero Slides Seed Script
 * Run with: node server/seeds/hero.seed.js
 *
 * Reads MONGO_URI from server/.env — works with both local MongoDB and Atlas.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Hero = require("../src/modules/hero/hero.model");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mukonotalks";

async function seedHero() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  await Hero.deleteMany({});
  console.log("Cleared existing hero slides");

  const slides = [
  {
    title: "Premium Industrial Chemical Solutions",
    description: "High-performance pigments, resins and specialty materials engineered for modern industry.",
    ctaText: "Browse Products",
    ctaLink: "/products",
    largeImage: "/hero/slide1-lg.jpg",
    mobileImage: "/hero/slide1-sm.jpg",
    textBgColor: "#1E3A8A",
    order: 1,
    isActive: true,
  },
  {
    title: "Advanced Pigment Technology",
    description: "Durable, vibrant pigments designed for coatings and plastics.",
    ctaText: "Explore Pigments",
    ctaLink: "/products",
    largeImage: "/hero/slide2-lg.jpg",
    mobileImage: "/hero/slide2-sm.jpg",
    textBgColor: "#7C3AED",
    order: 2,
    isActive: true,
  },
  {
    title: "High-Performance Resin Systems",
    description: "Industrial-grade resins optimized for durability and chemical resistance.",
    ctaText: "View Resins",
    ctaLink: "/products",
    largeImage: "/hero/slide3-lg.jpg",
    mobileImage: "/hero/slide3-sm.jpg",
    textBgColor: "#06B6D4",
    order: 3,
    isActive: true,
  },
  {
    title: "Fluorescent & Specialty Pigments",
    description: "Bright, reliable pigment systems for demanding environments.",
    ctaText: "Discover More",
    ctaLink: "/products",
    largeImage: "/hero/slide4-lg.jpg",
    mobileImage: "/hero/slide4-sm.jpg",
    textBgColor: "#10B981",
    order: 4,
    isActive: true,
  },
  {
    title: "Industrial Coatings & Additives",
    description: "Enhance product performance with precision-engineered additives.",
    ctaText: "See Solutions",
    ctaLink: "/products",
    largeImage: "/hero/slide5-lg.jpg",
    mobileImage: "/hero/slide5-sm.jpg",
    textBgColor: "#F59E0B",
    order: 5,
    isActive: true,
  },
  {
    title: "Sustainable Chemical Innovation",
    description: "Environment-conscious formulations supporting industrial growth.",
    ctaText: "Learn More",
    ctaLink: "/about",
    largeImage: "/hero/slide6-lg.jpg",
    mobileImage: "/hero/slide6-sm.jpg",
    textBgColor: "#EC4899",
    order: 6,
    isActive: true,
  },
  {
    title: "Global Supply Network",
    description: "Reliable sourcing and distribution across Africa and beyond.",
    ctaText: "Our Distribution",
    ctaLink: "/about",
    largeImage: "/hero/slide7-lg.jpg",
    mobileImage: "/hero/slide7-sm.jpg",
    textBgColor: "#4F46E5",
    order: 7,
    isActive: true,
  },
  {
    title: "Technical Documentation Access",
    description: "Secure SDS sheets and product specifications for registered clients.",
    ctaText: "Create Account",
    ctaLink: "/register",
    largeImage: "/hero/slide8-lg.jpg",
    mobileImage: "/hero/slide8-sm.jpg",
    textBgColor: "#14B8A6",
    order: 8,
    isActive: true,
  },
  {
    title: "Customized Industrial Formulations",
    description: "Tailored chemical solutions designed for your operations.",
    ctaText: "Request Consultation",
    ctaLink: "/contact",
    largeImage: "/hero/slide9-lg.jpg",
    mobileImage: "/hero/slide9-sm.jpg",
    textBgColor: "#F97316",
    order: 9,
    isActive: true,
  },
  {
    title: "Partner With MukonoTalks",
    description: "Delivering performance, color and industrial reliability.",
    ctaText: "Become a Partner",
    ctaLink: "/register",
    largeImage: "/hero/slide10-lg.jpg",
    mobileImage: "/hero/slide10-sm.jpg",
    textBgColor: "#8B5CF6",
    order: 10,
    isActive: true,
  },
  ];

  await Hero.insertMany(slides);
  console.log(`Seeded ${slides.length} hero slides`);

  await mongoose.disconnect();
  console.log("Done");
}

seedHero().catch((err) => {
  console.error(err);
  process.exit(1);
});
