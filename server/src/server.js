const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");

const { env, validateEnv } = require("./config/env");
const connectDB = require("./config/db");
const logger = require("./utils/logger");
const { errorHandler, notFound } = require("./middlewares/error.middleware");
const { globalLimiter } = require("./middlewares/rateLimit.middleware");
const {
  blockDirectFileAccess,
  additionalSecurityHeaders,
  requestId,
} = require("./middlewares/security.middleware");
const {
  staticCacheHeaders,
  apiNoCacheHeaders,
  responseTime,
} = require("./middlewares/performance.middleware");
const { languageMiddleware } = require("./middlewares/language.middleware");
const { maintenanceMiddleware } = require("./middlewares/maintenance.middleware");

const routes = require("./routes");
const authRoutes = require("./modules/auth/auth.routes");
const analyticsRoutes = require("./routes/analytics.routes");

// Validate environment variables
validateEnv();

const app = express();

const PORT = env.PORT || 5000;

// New category/article system (CommonJS)
const categoryRoutes = require("./routes/category.routes");
const articleRoutes = require("./routes/article.routes");

// ─────────────────────────────────────────
// Trust Proxy
// ─────────────────────────────────────────
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// ─────────────────────────────────────────
// Security Middleware
// ─────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://www.youtube.com",
          "https://www.youtube-nocookie.com",
          "https://www.tiktok.com",
          "https://pagead2.googlesyndication.com",
          "https://www.googletagservices.com",
          "https://www.googletagmanager.com",
          "https://www.google-analytics.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: [
          "'self'",
          "https://pagead2.googlesyndication.com",
          "https://googleads.g.doubleclick.net",
          "https://www.google-analytics.com",
          env.CLIENT_URL,
          "https://mukonotalks.ug",
          "https://www.mukonotalks.ug",
          "https://*.app.github.dev",
        ].filter(Boolean),
        frameSrc: [
          "'self'",
          "https://www.youtube.com",
          "https://www.youtube-nocookie.com",
          "https://www.tiktok.com",
          "https://googleads.g.doubleclick.net",
          "https://tpc.googlesyndication.com",
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ─────────────────────────────────────────
// Compression
// ─────────────────────────────────────────
app.use(compression());

// ─────────────────────────────────────────
// CORS Configuration
// ─────────────────────────────────────────
const allowedOrigins = new Set(
  [
    env.CLIENT_URL,
    "https://mukonotalks.ug",
    "https://www.mukonotalks.ug",
    "http://localhost:3000",
    "http://localhost:5173",
  ].filter(Boolean)
);

const isGithubDevOrigin = (origin) => {
  return (
    typeof origin === "string" &&
    /^https:\/\/[a-zA-Z0-9-]+\-(3000|5000)\.app\.github\.dev$/.test(origin)
  );
};

app.use((req, res, next) => {
  const origin = req.headers.origin || null;

  logger.info(
    `[CORS] Origin received: ${origin || "NO_ORIGIN"} | ${req.method} ${req.originalUrl}`
  );

  const isAllowed =
    !origin || allowedOrigins.has(origin) || isGithubDevOrigin(origin);

  if (!isAllowed) {
    logger.warn(
      `[CORS] Blocked origin: ${origin} | ${req.method} ${req.originalUrl}`
    );

    return res.status(403).json({
      success: false,
      message: `Not allowed by CORS: ${origin}`,
    });
  }

  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

  // Allow browser-requested custom headers like x-session-id
  const requestHeaders = req.headers["access-control-request-headers"];
  res.header(
    "Access-Control-Allow-Headers",
    requestHeaders ||
      "Content-Type, Authorization, X-Requested-With, Accept, Origin, x-session-id"
  );

  if (req.method === "OPTIONS") {
    logger.info(
      `[CORS] Preflight accepted for ${origin || "NO_ORIGIN"} | ${req.originalUrl}`
    );
    return res.sendStatus(204);
  }

  next();
});

// ─────────────────────────────────────────
// Body Parsers
// ─────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─────────────────────────────────────────
// Security Protections
// ─────────────────────────────────────────
app.use(mongoSanitize());
app.use(
  hpp({
    whitelist: ["category", "industriesServed", "tags"],
  })
);

// ─────────────────────────────────────────
// Logging
// ─────────────────────────────────────────
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}

// ─────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────
app.use(globalLimiter);

// ─────────────────────────────────────────
// Additional Security
// ─────────────────────────────────────────
app.use(additionalSecurityHeaders);
app.use(requestId);
app.use(blockDirectFileAccess);

// ─────────────────────────────────────────
// Performance
// ─────────────────────────────────────────
app.use(responseTime);
app.use(staticCacheHeaders);
app.use(apiNoCacheHeaders);

// ─────────────────────────────────────────
// Static Uploads
// ─────────────────────────────────────────
if (env.FILE_STORAGE === "local") {
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
}

// ─────────────────────────────────────────
// Hero Routes
// ─────────────────────────────────────────
const heroRoutes = require("./modules/hero");
app.use("/api/hero", heroRoutes);

// ─────────────────────────────────────────
// Sitemap Routes
// ─────────────────────────────────────────
const sitemapRoutes = require("./modules/seo-sitemap/sitemap.routes");
app.use("/", sitemapRoutes);

// ─────────────────────────────────────────
// SEO Redirect Middleware
// Must run AFTER sitemap routes, BEFORE API routes
// ─────────────────────────────────────────
const { redirectMiddleware } = require("./modules/seo-redirects/redirect.middleware");
app.use(redirectMiddleware);

// ─────────────────────────────────────────
// LLM.txt — AI crawler site description
// ─────────────────────────────────────────
const Page = require("./modules/pages/page.model");
app.get("/llm.txt", async (req, res) => {
  try {
    const pages = await Page.find({ publishStatus: "published" })
      .select("pageKey localizedSlug title seo")
      .lean();

    const BASE = env.CLIENT_URL || "https://mukonotalks.ug";
    const lines = [
      "# MukonoTalks — LLM Site Description",
      "# Auto-generated. Do not edit manually.",
      "",
      "## About this site",
      "MukonoTalks is a digital publishing platform focused on Mukono district stories.",
      "Content includes news articles, entertainment, local updates, and embedded video.",
      "",
      "## Site purpose",
      "Fast, SEO-first publishing for local readership growth and ad monetization.",
      "",
      "## Languages",
      "English (en), Chinese Simplified (zh), Kiswahili (sw)",
      "",
      "## Published CMS Pages",
    ];

    for (const pg of pages) {
      const slug = pg.localizedSlug?.en || pg.pageKey;
      const title = pg.title?.en || pg.pageKey;
      const desc = pg.seo?.en?.description || "";
      lines.push(`- ${title}: ${BASE}/page/en/${slug}${desc ? " - " + desc : ""}`);
    }

    lines.push("");
    lines.push("## Key static URLs");
    lines.push(`- Home: ${BASE}/en`);
    lines.push(`- News: ${BASE}/en/blog`);
    lines.push(`- Local Updates: ${BASE}/local`);
    lines.push(`- Entertainment: ${BASE}/entertainment`);
    lines.push(`- Blog: ${BASE}/en/blog`);
    lines.push(`- Videos: ${BASE}/videos`);
    lines.push("");
    lines.push("## Sitemap");
    lines.push(`${BASE}/sitemap.xml`);

    res.set("Content-Type", "text/plain; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(lines.join("\n"));
  } catch (err) {
    res.status(500).send("# Error generating llm.txt");
  }
});

// ─────────────────────────────────────────
// Maintenance Mode
// ─────────────────────────────────────────
app.use(maintenanceMiddleware);

// ─────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────
app.use(languageMiddleware);
app.use("/api", routes);
app.use("/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);

// ─────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "MukonoTalks API",
    timestamp: new Date(),
  });
});

// ─────────────────────────────────────────
// Serve React Production Build
// ─────────────────────────────────────────
if (env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../client/build")));

  app.get("*", (req, res) => {
    res.sendFile(
      path.resolve(__dirname, "../../client/build", "index.html")
    );
  });
}

// ─────────────────────────────────────────
// Error Handling
// ─────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────
const startServer = async () => {
  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(
      `MukonoTalks API running in ${env.NODE_ENV} mode on port ${PORT}`
    );
  });

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down.`);

    server.close(async () => {
      const mongoose = require("mongoose");
      const { shutdownQueue } = require("./queues/translation.queue");

      await shutdownQueue().catch(() => {});

      mongoose.connection.close(false).then(() => {
        logger.info("MongoDB closed");
        process.exit(0);
      });
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  process.on("unhandledRejection", (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    shutdown("UNHANDLED_REJECTION");
  });

  process.on("uncaughtException", (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    shutdown("UNCAUGHT_EXCEPTION");
  });

  try {
    await connectDB();

    const { initTranslationQueue } = require("./queues/translation.queue");
    await initTranslationQueue();
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
  }
};

startServer();

module.exports = app;