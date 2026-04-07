# MukonoTalks

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

## Next Cleanup Targets

- Remove unused commerce models and routes from repository
- Remove commerce-only packages and scripts
- Backfill publishing tests (news feed, article page, sitemap, redirects)

