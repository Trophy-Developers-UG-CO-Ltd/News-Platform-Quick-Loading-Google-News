# Article Model Deduplication

## Mongoose Model Pattern

To avoid OverwriteModelError, the Article model is defined only once in `server/src/models/article.model.js`:

```js
module.exports = mongoose.models.Article || mongoose.model("Article", articleSchema);
```

All other usages (including `server/src/modules/articles/article.model.js`) must import the model using:

```js
module.exports = require('../../models/article.model');
```

**Never redefine the Article model elsewhere.**

This ensures a single source of truth and prevents Mongoose model overwrite errors during development and production.
# MukonoTalks
# MukonoTalks -  Designed by Trophy Developers Uganda : https://www.trophydevelopers.com/uganda-web-designers/
MukonoTalks is a lean MERN digital publishing platform focused on:

- News articles
- Entertainment content
- Mukono-focused local updates
- Embedded video content (YouTube + TikTok)
- SEO-driven organic traffic
- Ad monetization (AdSense + banner inventory)

## Product Priorities

- Speed and low-latency delivery
- Search visibility and crawlability
- Simple editorial publishing workflow
- Horizontal scalability as traffic grows

## Runtime Scope

The active app surface is now publishing-first.

- Client routes are focused on: home, news, local updates, entertainment, videos.
- Server API mounts content and SEO modules, while commerce endpoints are removed from active routing.

Legacy e-commerce code remains in the repository for phased cleanup, but it is no longer part of the primary runtime path.

## Stack

- React + Vite frontend
- Express + MongoDB backend
- Modular SEO services (metadata, schema, sitemap, redirects, indexing, analytics)

## Quick Start

```bash
npm run install:all
npm run dev
```

## Build and Run

```bash
npm run build
npm start
```

## Environment Split (Dev / Preview / Production)

- Local dev (`npm run dev`) runs without service worker registration.
- Hosted preview build (`npm run build:preview`) is isolated from production PWA behavior.
- Production build (`npm run build`) enables PWA by default.

Optional override for CI or hosting:

```bash
# Force-enable or disable PWA regardless of mode
VITE_ENABLE_PWA=true npm run build
VITE_ENABLE_PWA=false npm run build
```

## Next Cleanup Targets

📄 MukonoTalks — Media Platform Scalability & Production Deployment Guide
# MukonoTalks — Media Platform Scalability & Production Deployment Guide

> Version: 2.0  
> Architecture Type: High-Traffic Content Platform (News, Articles, Video, Ads)

---

## 1. Architecture Overview

            ┌──────────────────────┐
            │     Cloudflare       │
            │ CDN + DDoS + Cache   │
            └─────────┬────────────┘
                      │
            ┌─────────▼───────────┐
            │   Nginx (Reverse)   │
            │ + Micro Caching     │
            └─────────┬───────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │

┌────▼────┐ ┌────▼────┐ ┌────▼────┐
│ PM2 W1 │ │ PM2 W2 │ │ PM2 W3 │
│ Node.js │ │ Node.js │ │ Node.js │
└────┬────┘ └────┬────┘ └────┬────┘
│ │ │
└─────────────────┼─────────────────┘
│
┌─────────▼──────────┐
│ MongoDB Atlas │
│ (Content Store) │
└─────────┬──────────┘
│
┌─────────▼──────────┐
│ Redis │
│ Cache + Trending │
└────────────────────┘


---

## 2. Platform Focus

MukonoTalks is a **read-heavy, high-traffic media platform**.

### Traffic Pattern:
- 95% reads (articles, homepage, videos)
- 5% writes (admin publishing)

### Core Modules:
- Articles
- Categories
- Videos (YouTube / TikTok)
- Ads (AdSense + banners)

---

## 3. Database Design (MongoDB)

### Articles Collection


{
title: String,
slug: String,
content: String,
excerpt: String,
featuredImage: String,
category: ObjectId,
tags: [String],
views: Number,
publishedAt: Date,
isPublished: Boolean
}


### Categories


{
name: String,
slug: String,
color: String
}


### Ads


{
position: String, // header, sidebar, in-feed
code: String,
isActive: Boolean
}


---

## 4. Node.js Process Management (PM2)

### Setup

```bash
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 reload ecosystem.config.js
pm2 monit
Key Settings
Setting	Value
instances	max
exec_mode	cluster
max_memory_restart	512M
5. Redis Caching Strategy (MANDATORY)
Why:

Media platforms require aggressive caching.

Cache Targets
Endpoint	TTL
/api/articles	60–120s
/api/articles/trending	30s
/api/articles/:slug	300s
Redis Example
await redis.get(key)
await redis.setex(key, ttl, value)
6. Trending Engine
Formula
score = views + (recent_views * 2)
Endpoint
GET /api/articles/trending
Storage
Redis (fast updates)
MongoDB (persistent sync)
7. Nginx Reverse Proxy + Micro Caching
Add Micro Cache
proxy_cache_path /tmp/nginx_cache levels=1:2 keys_zone=STATIC:10m inactive=60m;

location /api/articles {
    proxy_cache STATIC;
    proxy_cache_valid 200 1m;
    proxy_pass http://backend;
}
8. CDN Strategy (Cloudflare)
Cache Rules
Asset	Strategy
Images	Cache 30 days
JS/CSS	Immutable
API	No cache
Headers
Cache-Control: public, max-age=86400, stale-while-revalidate=3600
9. Media Handling (CRITICAL)
Replace Local Uploads

Use:

Cloudflare R2 OR AWS S3

Benefits:

Global delivery
Faster load
Scalable storage
10. Ads & Monetization
Ad Slots
Header
In-feed
Sidebar
Article body
Backend
GET /api/ads
Frontend Injection
{ads["in-feed"]}
11. SEO Engine (Updated)
Use:
Article schema
NewsArticle schema
VideoObject schema
Remove:
Product schema
Sitemap Includes:
Articles
Categories
Videos
12. API Structure
Core Endpoints
GET /api/articles
GET /api/articles/:slug
GET /api/articles/trending
GET /api/articles/category/:slug
GET /api/videos
GET /api/ads
POST /api/articles/:id/view
13. View Tracking
Endpoint
POST /api/articles/:id/view
Logic:
Increment views in Redis
Sync to MongoDB periodically
14. Horizontal Scaling
Phase 1 (Launch)
1 server
PM2 cluster
Redis
MongoDB Atlas
Phase 2 (Growth)
CDN optimization
Redis full usage
Phase 3 (Scale)
Multi-server
Load balancer
Redis cluster
15. Performance Targets
Page	Target
Homepage	< 1.5s
Article	< 1.2s
API response	< 200ms
16. Monitoring
Tools
Tool	Purpose
PM2	Process monitoring
Sentry	Error tracking
Grafana	Metrics
UptimeRobot	Availability
17. Production Checklist
 NODE_ENV=production
 Redis configured
 MongoDB Atlas live
 Cloudflare active
 SSL configured
 Ads system enabled
 Sitemap working
 SEO metadata validated
 Image CDN configured
FINAL SYSTEM IDENTITY

MukonoTalks is:

A high-performance, SEO-driven, content distribution platform optimized for national traffic, monetization, and scalability.


---

# 🔥 WHAT CHANGED (IMPORTANT)

### Before:
- Product-heavy
- Transaction-focused
- Complex flows

### Now:
- Content-first
- Cache-driven
- Traffic-optimized
- Monetization-ready

---

# ⚡ NEXT STEP

If you want to go deeper, choose:

👉 **“Build Articles API (Express)”**  
👉 **“Connect homepage to backend”**  
👉 **“Build Admin CMS (Publishing Dashboard)”**

Each one moves you closer to **production launch**.
Share go deep one Full .md  explain inside that md file - complete - Holistic this a scalability file .md 

Below is a deep, production-grade, holistic scalability .md file tailored specifically for your MukonoTalks media platform.

It is rewritten to:

Fully remove B2B/product assumptions
Align with high-traffic publishing systems
Cover infra, backend, frontend, SEO, caching, ads, media, scaling, and ops
Be usable by you or any engineer onboarding the system
📄 MukonoTalks — Full Scalability & Production Architecture Guide
# MukonoTalks — Full Scalability & Production Architecture Guide

> Version: 3.0  
> System Type: High-Traffic Digital Media Platform  
> Focus: Articles, Video, SEO, Ads, National Traffic Scaling  

---

# 1. SYSTEM IDENTITY

MukonoTalks is not a CRUD application.

It is:

> A **read-heavy, cache-driven, SEO-optimized content distribution system**

### Traffic Characteristics:
- 95% READ (articles, homepage, videos)
- 5% WRITE (admin publishing)
- Spiky traffic (viral posts)

---

# 2. HIGH-LEVEL ARCHITECTURE


Users (Mobile / Web)
↓
Cloudflare (CDN + DDoS + Edge Cache)
↓
Nginx (Reverse Proxy + Micro Cache)
↓
Node.js API (PM2 Cluster)
↓
Redis (Cache + Trending + Rate Limit)
↓
MongoDB Atlas (Primary Data Store)
↓
Object Storage (Cloudflare R2 / S3)


---

# 3. CORE PRINCIPLES

### 3.1 Cache First
Every request should hit:
- CDN OR
- Redis OR
- Nginx cache

NOT MongoDB directly.

---

### 3.2 Read Optimization
All systems must prioritize:
- Fast reads
- Minimal DB queries
- Aggressive caching

---

### 3.3 Stateless Backend
- No session storage in Node
- Horizontal scaling ready

---

### 3.4 Content is the Product
- Articles drive traffic
- Videos increase retention
- Ads monetize traffic

---

# 4. DATA MODEL (MONGODB)

## 4.1 Articles


{
title: String,
slug: String,
content: String,
excerpt: String,
featuredImage: String,
category: ObjectId,
tags: [String],
views: Number,
publishedAt: Date,
updatedAt: Date,
isPublished: Boolean,
author: String
}


Indexes:
- `{ slug: 1 }`
- `{ publishedAt: -1 }`
- `{ views: -1 }`
- `{ tags: 1 }`

---

## 4.2 Categories


{
name: String,
slug: String,
color: String
}


---

## 4.3 Ads


{
position: String,
code: String,
isActive: Boolean
}


---

## 4.4 Videos


{
title: String,
url: String,
platform: "youtube" | "tiktok",
thumbnail: String,
publishedAt: Date
}


---

# 5. API DESIGN

## Core Endpoints


GET /api/articles
GET /api/articles/:slug
GET /api/articles/trending
GET /api/articles/category/:slug
GET /api/videos
GET /api/ads
POST /api/articles/:id/view


---

# 6. REDIS (CRITICAL LAYER)

Redis is mandatory.

## Responsibilities:
- Cache articles
- Store trending scores
- Handle rate limiting
- Reduce DB load

---

## Cache Strategy

| Endpoint | TTL |
|----------|-----|
| /articles | 60s |
| /article/:slug | 300s |
| /trending | 30s |

---

## Example


GET article:slug
SETEX article:slug 300 {...}


---

# 7. TRENDING ENGINE

## Formula


score = views + (recent_views * 2)


## Implementation:
- Store counters in Redis
- Update Mongo periodically

---

# 8. NGINX OPTIMIZATION

## Micro Cache


proxy_cache_path /tmp/nginx_cache levels=1:2 keys_zone=STATIC:10m inactive=60m;

location /api/articles {
proxy_cache STATIC;
proxy_cache_valid 200 1m;
}


---

# 9. CDN (CLOUDFLARE)

## Responsibilities:
- Serve static assets
- Cache images
- Block attacks

## Rules:
- Cache images for 30 days
- Bypass API caching (except edge rules)

---

# 10. MEDIA STORAGE

## DO NOT USE:
- Local disk

## USE:
- Cloudflare R2
- AWS S3

---

# 11. FRONTEND ARCHITECTURE

## Framework:
- React (Next.js recommended for SSR later)

## Key Components:
- Homepage feed
- Article page
- Category pages
- Video section

---

## Performance Rules:
- Lazy load images
- Use WebP
- Minimize JS bundle

---

# 12. ADS SYSTEM

## Placement:
- Header
- In-feed
- Sidebar
- Article body

## Backend:

GET /api/ads


## Frontend:

{ads["in-feed"]}


---

# 13. SEO SYSTEM

## Required:
- Meta tags per article
- Open Graph
- Twitter cards

## Schema:
- NewsArticle
- Article
- VideoObject

---

## Sitemap:
- /articles
- /categories
- /videos

---

# 14. SCALING STRATEGY

## Phase 1 (Launch)
- 1 server
- PM2 cluster
- Redis
- MongoDB Atlas

---

## Phase 2 (Growth)
- CDN optimization
- Redis caching full scale

---

## Phase 3 (High Traffic)
- Load balancer
- Multiple servers
- Redis cluster

---

## Phase 4 (Mass Scale)
- Kubernetes
- Auto-scaling
- Sharding

---

# 15. PERFORMANCE TARGETS

| Metric | Target |
|--------|--------|
| Homepage load | <1.5s |
| Article load | <1.2s |
| API response | <200ms |

---

# 16. MONITORING

## Tools:
- PM2
- Sentry
- Grafana
- UptimeRobot

---

## Metrics:
- Response time
- Error rate
- Cache hit rate
- DB connections

---

# 17. SECURITY

- Rate limiting (Redis)
- Helmet (headers)
- CORS restricted
- Input validation

---

# 18. DEPLOYMENT FLOW

1. Build frontend
2. Deploy backend
3. Configure Nginx
4. Enable Cloudflare
5. Set up Redis
6. Monitor system

---

# 19. ENV VARIABLES


NODE_ENV=production
MONGO_URI=
REDIS_URL=
JWT_SECRET=
CDN_URL=
ADVERTISE_INQUIRY_WEBHOOK_URL=
ADVERTISE_INQUIRY_WEBHOOK_TOKEN=
ADVERTISE_INQUIRY_NOTIFICATION_PHONE=

Optional advertise inquiry webhook:
Set `ADVERTISE_INQUIRY_WEBHOOK_URL` to any automation endpoint such as Make, Zapier, a Twilio Function, or your Meta WhatsApp Cloud API bridge.
Each new advertise inquiry posts a JSON payload containing the inquiry details, an admin review URL, and a prebuilt WhatsApp reply link for the lead.


---

# 20. FINAL SYSTEM MODEL

MukonoTalks becomes:

> A **distributed, cache-first, high-throughput media platform**

NOT:
- A CRUD app
- Not a blog
- Not a marketplace

---

# FINAL PRINCIPLE

Speed = Traffic  
Traffic = Revenue  

Every architectural decision must support:

> Faster content delivery → higher engagement → higher monetization

---
🔥 WHAT YOU NOW HAVE

This is:

Engineer-level architecture
Production-ready thinking
Scalable to 100K+ users/day
Cleanly aligned with your vision

---
# 🚀 SYSTEM EXTENSION: PLATFORM-LEVEL MEDIA ENGINE (2026)

## 21. SYSTEM EXTENSION: FULL MEDIA ENGINE CAPABILITIES

MukonoTalks is now extended into a full platform-level media engine, integrating:

### 1. Ad Management System (Revenue Engine)
- Admin dashboard for creating and managing ads
- Tracks impressions, clicks, inventory
- Slot-based targeting and analytics
- Monetization-ready, not placeholders

### 2. Real-Time Trending UI
- Live trending section (polling every 5 seconds)
- Always reflects Redis-based ranking
- No manual refresh needed; users see “hot” content in real time

### 3. Personalized Homepage per User
- API-driven recommendation engine (`/api/v1/personalized`)
- Category affinity and user-specific feeds
- Foundation for sticky sessions and higher engagement

### 4. Modular, Scalable Architecture
- Content Layer: MongoDB for posts and editorial control
- Real-Time Layer: Redis for trending and live ranking
- Experience Layer: Personalization and dynamic UI

### 5. Platform Capabilities
- CMS, Headless API, Ranking Engine, Monetization, and Personalization all integrated
- Ready to scale as a national media platform

---
#### Architectural Reality
You are now running three parallel intelligence systems:

- **Content Layer**: MongoDB, structured posts, editorial control
- **Real-Time Layer**: Redis, trending scoring, live ranking
- **Experience Layer**: Personalization, dynamic homepage, API-driven UI

---
#### What This Means
You now have:

- CMS ✔
- Headless API ✔
- Ranking engine ✔
- Monetization system ✔
- Personalization ✔

This combination is rare and positions MukonoTalks as a modular news infrastructure capable of scaling into a national media platform.

---
## Example: TrendingLive Component (Polling)

```tsx
// /app/components/TrendingLive.tsx
"use client";
import { useEffect, useState } from "react";

export function TrendingLive() {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    const fetchData = () => {
      fetch("/api/v1/trending")
        .then(res => res.json())
        .then(setPosts);
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div>
      <h2 className="text-lg mb-3">Live Trending</h2>
      {posts.map(p => (
        <div key={p._id} className="border p-2 mb-2">{p.title}</div>
      ))}
    </div>
  );
}
```

---
## Example: Personalized Homepage API

```ts
// /app/api/v1/personalized/route.ts
import { getRecommended } from "@/lib/recommendation";

export async function POST(req: Request) {
  const profile = await req.json();
  const posts = await getRecommended(profile);
  return Response.json(posts);
}
```

---
## Example: Personalized Homepage Page

```tsx
// /app/personalized/page.tsx
"use client";
import { useEffect, useState } from "react";

export default function PersonalizedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/v1/personalized", {
      method: "POST",
      body: JSON.stringify({ topCategories: ["Politics", "Business"] }),
    })
      .then(res => res.json())
      .then(setPosts);
  }, []);
  return (
    <div className="p-6 bg-black text-white">
      <h1 className="text-xl mb-4">Recommended for You</h1>
      {posts.map(p => (
        <div key={p._id} className="border p-3 mb-3">{p.title}</div>
      ))}
    </div>
  );
}
```

---
## Final System Capabilities

- ✔ Ad Management Dashboard (create + analytics)
- ✔ Real-time Trending UI (polling-based)
- ✔ Personalized Homepage (user-driven feed)
- ✔ Fully API-driven architecture
- ✔ Monetization-ready + scalable

---
**This README now reflects the complete, holistic, and production-grade MukonoTalks media platform as of 2026.**