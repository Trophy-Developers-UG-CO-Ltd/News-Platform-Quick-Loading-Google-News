/**
 * Analytics Service
 * Business intelligence data collection and reporting
 * @module modules/analytics/analytics.service
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const { ProductView, SearchTerm, PageView, ArticleViewEvent } = require('./analytics.model');
const Article = require('../articles/article.model');
const { redis } = require('../../config/redis');
const logger = require('../../utils/logger');

const VIEW_DEDUP_TTL_SECONDS = 60 * 15;
const BURST_WINDOW_SECONDS = 10;
const BURST_LIMIT = 20;
const FIFTEEN_MINUTES_SECONDS = 60 * 15;
const ONE_HOUR_SECONDS = 60 * 60;
const SIX_HOURS_SECONDS = 60 * 60 * 6;
const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /slurp/i,
  /curl/i,
  /wget/i,
  /headless/i,
  /lighthouse/i,
  /pagespeed/i,
  /googlebot/i,
  /bingbot/i,
  /duckduckbot/i,
  /baiduspider/i,
  /semrush/i,
  /ahrefs/i,
  /mj12bot/i,
  /python-requests/i,
  /axios/i,
  /node-fetch/i,
  /postmanruntime/i,
  /insomnia/i,
  /telegrambot/i,
  /discordbot/i,
];

const hasRedisClient = () => redis && typeof redis.get === 'function';

const getTimeBucketKey = (bucketSeconds = 300) => {
  const now = Math.floor(Date.now() / 1000);
  return Math.floor(now / bucketSeconds) * bucketSeconds;
};

const hashValue = (value) =>
  crypto.createHash('sha256').update(String(value || '')).digest('hex');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }

  return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
};

const buildVisitorFingerprint = ({ sessionId, fingerprint, ip, userAgent }) => {
  if (fingerprint) {
    return `fp:${fingerprint}`;
  }

  if (sessionId) {
    return `sid:${sessionId}`;
  }

  return `anon:${hashValue(`${ip || ''}|${userAgent || ''}`)}`;
};

const isBotUserAgent = (userAgent = '') => {
  if (!userAgent || typeof userAgent !== 'string') {
    return true;
  }

  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
};

const buildArticleKeys = (articleId, visitorKey) => ({
  pendingViews: `article:${articleId}:views:pending`,
  pendingUniqueViews: `article:${articleId}:uniqueViews:pending`,
  dedupe: `article:${articleId}:viewer:${visitorKey}`,
  lastViewedAt: `article:${articleId}:lastViewedAt`,
  burst: `viewer:${visitorKey}:burst`,
  trend15mViews: `article:${articleId}:trend:15m:${getTimeBucketKey(300)}`,
  trend15mUnique: `article:${articleId}:trend:15m:unique:${getTimeBucketKey(300)}`,
  trend1hViews: `article:${articleId}:trend:1h:${getTimeBucketKey(3600)}`,
  trend1hUnique: `article:${articleId}:trend:1h:unique:${getTimeBucketKey(3600)}`,
  trend6hViews: `article:${articleId}:trend:6h:${getTimeBucketKey(3600)}`,
});

const redisGet = async (key) => {
  if (!hasRedisClient()) return null;
  return redis.get(key);
};

const redisMGet = async (keys) => {
  if (!hasRedisClient() || !keys.length) return [];
  if (typeof redis.mGet === 'function') {
    return redis.mGet(keys);
  }
  if (typeof redis.mget === 'function') {
    return redis.mget(keys);
  }
  return Promise.all(keys.map((key) => redisGet(key)));
};

const redisDel = async (key) => {
  if (!hasRedisClient()) return null;
  return redis.del(key);
};

const redisExpire = async (key, seconds) => {
  if (!hasRedisClient()) return null;
  return redis.expire(key, seconds);
};

const redisIncr = async (key) => {
  if (!hasRedisClient()) return null;
  return redis.incr(key);
};

const redisSetWithTtl = async (key, value, seconds) => {
  if (!hasRedisClient()) return null;
  try {
    return await redis.set(key, value, { EX: seconds });
  } catch (error) {
    return redis.set(key, value, { ex: seconds });
  }
};

const redisSetWithTtlNx = async (key, value, seconds) => {
  if (!hasRedisClient()) return null;
  try {
    return await redis.set(key, value, { EX: seconds, NX: true });
  } catch (error) {
    return redis.set(key, value, { ex: seconds, nx: true });
  }
};

const computeTrendingScore = ({
  views15m = 0,
  views1h = 0,
  views6h = 0,
  unique15m = 0,
  unique1h = 0,
  articleAgeHours = 0,
}) => {
  const freshnessBoost = Math.max(0, 20 - articleAgeHours * 0.75);
  const agePenalty = Math.max(0, articleAgeHours - 24) * 0.15;

  return Number(
    Math.max(
      0,
      views15m * 2.5 +
        views1h * 2.0 +
        views6h * 0.5 +
        unique15m * 4.0 +
        unique1h * 3.0 +
        freshnessBoost -
        agePenalty
    ).toFixed(4)
  );
};

class AnalyticsService {
  static async trackProductView(productId, { user = null, sessionId = null, ip = null } = {}) {
    try {
      await ProductView.create({
        product: productId,
        user: user?._id || null,
        sessionId,
        ipAddress: ip,
      });
    } catch (error) {
      logger.error('Failed to track product view:', error.message);
    }
  }

  static async trackSearch(term, { resultsCount = 0, user = null, filters = {}, language = 'en' } = {}) {
    try {
      await SearchTerm.create({
        term,
        normalizedTerm: term.toLowerCase().trim(),
        resultsCount,
        user: user?._id || null,
        filters,
        language,
      });
    } catch (error) {
      logger.error('Failed to track search:', error.message);
    }
  }

  static async trackPageView(path, { user = null, sessionId = null, referrer = null, language = 'en' } = {}) {
    try {
      await PageView.create({
        path,
        user: user?._id || null,
        sessionId,
        referrer,
        language,
      });
    } catch (error) {
      logger.error('Failed to track page view:', error.message);
    }
  }

  static async trackArticleView(articleId, req, { sessionId = null, fingerprint = null } = {}) {
    if (!articleId || !mongoose.Types.ObjectId.isValid(articleId)) {
      const error = new Error('Valid articleId is required');
      error.statusCode = 400;
      throw error;
    }

    const article = await Article.findOne({
      _id: articleId,
      publishStatus: 'published',
    })
      .select('_id publishedAt createdAt')
      .lean();

    if (!article) {
      const error = new Error('Article not found');
      error.statusCode = 404;
      throw error;
    }

    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers.referer || req.headers.referrer || '';
    const language = req.headers['accept-language']?.split(',')[0]?.trim() || 'en';
    const resolvedSessionId = sessionId || req.headers['x-session-id'] || null;
    const ip = getClientIp(req);
    const ipHash = hashValue(ip || 'unknown');
    const visitorKey = buildVisitorFingerprint({
      sessionId: resolvedSessionId,
      fingerprint,
      ip,
      userAgent,
    });
    const bot = isBotUserAgent(userAgent);

    if (bot) {
      await ArticleViewEvent.create({
        article: article._id,
        sessionId: resolvedSessionId,
        fingerprint,
        ipHash,
        userAgent,
        referrer,
        language,
        isBot: true,
        counted: false,
        viewedAt: new Date(),
      });

      return {
        success: true,
        counted: false,
        unique: false,
        reason: 'bot_filtered',
      };
    }

    const keys = buildArticleKeys(String(article._id), visitorKey);
    let uniqueView = true;

    try {
      if (hasRedisClient()) {
        const burst = Number(await redisIncr(keys.burst));
        if (burst === 1) {
          await redisExpire(keys.burst, BURST_WINDOW_SECONDS);
        }

        if (burst > BURST_LIMIT) {
          await ArticleViewEvent.create({
            article: article._id,
            sessionId: resolvedSessionId,
            fingerprint,
            ipHash,
            userAgent,
            referrer,
            language,
            isBot: false,
            counted: false,
            viewedAt: new Date(),
          });

          return {
            success: true,
            counted: false,
            unique: false,
            reason: 'burst_filtered',
          };
        }

        const dedupeResult = await redisSetWithTtlNx(keys.dedupe, '1', VIEW_DEDUP_TTL_SECONDS);
        uniqueView = Boolean(dedupeResult);

        await redisIncr(keys.pendingViews);
        await redisIncr(keys.trend15mViews);
        await redisExpire(keys.trend15mViews, FIFTEEN_MINUTES_SECONDS + 300);
        await redisIncr(keys.trend1hViews);
        await redisExpire(keys.trend1hViews, ONE_HOUR_SECONDS + 600);
        await redisIncr(keys.trend6hViews);
        await redisExpire(keys.trend6hViews, SIX_HOURS_SECONDS + 1200);

        if (uniqueView) {
          await redisIncr(keys.pendingUniqueViews);
          await redisIncr(keys.trend15mUnique);
          await redisExpire(keys.trend15mUnique, FIFTEEN_MINUTES_SECONDS + 300);
          await redisIncr(keys.trend1hUnique);
          await redisExpire(keys.trend1hUnique, ONE_HOUR_SECONDS + 600);
        }

        await redisSetWithTtl(keys.lastViewedAt, new Date().toISOString(), SIX_HOURS_SECONDS);
      } else {
        await Article.updateOne(
          { _id: article._id },
          {
            $inc: { viewCount: 1, uniqueViewCount: 1 },
            $set: { lastViewedAt: new Date() },
          }
        );
      }
    } catch (error) {
      logger.warn(`Article tracking Redis fallback used: ${error.message}`);
      uniqueView = true;
      await Article.updateOne(
        { _id: article._id },
        {
          $inc: { viewCount: 1, uniqueViewCount: 1 },
          $set: { lastViewedAt: new Date() },
        }
      );
    }

    await ArticleViewEvent.create({
      article: article._id,
      sessionId: resolvedSessionId,
      fingerprint,
      ipHash,
      userAgent,
      referrer,
      language,
      isBot: false,
      counted: true,
      viewedAt: new Date(),
    });

    return {
      success: true,
      counted: true,
      unique: uniqueView,
    };
  }

  static async getRollingWindowSum(articleId, prefix, bucketSeconds, windowSeconds) {
    if (!hasRedisClient()) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    const currentBucket = Math.floor(now / bucketSeconds) * bucketSeconds;
    const bucketCount = Math.ceil(windowSeconds / bucketSeconds);
    const keys = [];

    for (let index = 0; index < bucketCount; index += 1) {
      keys.push(`article:${articleId}:${prefix}:${currentBucket - index * bucketSeconds}`);
    }

    const values = await redisMGet(keys);
    return values.reduce((sum, value) => sum + Number(value || 0), 0);
  }

  static async recomputeArticleTrendingScore(articleId) {
    const article = await Article.findById(articleId)
      .select('_id publishedAt createdAt')
      .lean();

    if (!article) {
      return null;
    }

    const [views15m, views1h, views6h, unique15m, unique1h] = await Promise.all([
      AnalyticsService.getRollingWindowSum(articleId, 'trend:15m', 300, FIFTEEN_MINUTES_SECONDS),
      AnalyticsService.getRollingWindowSum(articleId, 'trend:1h', 3600, ONE_HOUR_SECONDS),
      AnalyticsService.getRollingWindowSum(articleId, 'trend:6h', 3600, SIX_HOURS_SECONDS),
      AnalyticsService.getRollingWindowSum(articleId, 'trend:15m:unique', 300, FIFTEEN_MINUTES_SECONDS),
      AnalyticsService.getRollingWindowSum(articleId, 'trend:1h:unique', 3600, ONE_HOUR_SECONDS),
    ]);

    const publishedBase = article.publishedAt || article.createdAt || new Date();
    const articleAgeHours = Math.max(
      0,
      (Date.now() - new Date(publishedBase).getTime()) / (1000 * 60 * 60)
    );

    const trendingScore = computeTrendingScore({
      views15m,
      views1h,
      views6h,
      unique15m,
      unique1h,
      articleAgeHours,
    });

    await Article.updateOne({ _id: articleId }, { $set: { trendingScore } });
    return trendingScore;
  }

  static async flushArticleViewCountersToMongo(limit = 500) {
    const cursor = Article.find({ publishStatus: 'published' }).select('_id').cursor();
    let processed = 0;

    for await (const article of cursor) {
      if (processed >= limit) {
        break;
      }

      const articleId = String(article._id);
      const [pendingViews, pendingUniqueViews, lastViewedAt] = await redisMGet([
        `article:${articleId}:views:pending`,
        `article:${articleId}:uniqueViews:pending`,
        `article:${articleId}:lastViewedAt`,
      ]);

      const viewsToAdd = Number(pendingViews || 0);
      const uniqueToAdd = Number(pendingUniqueViews || 0);

      if (!viewsToAdd && !uniqueToAdd && !lastViewedAt) {
        continue;
      }

      const update = {};
      if (viewsToAdd) {
        update.$inc = { ...(update.$inc || {}), viewCount: viewsToAdd };
      }
      if (uniqueToAdd) {
        update.$inc = { ...(update.$inc || {}), uniqueViewCount: uniqueToAdd };
      }
      if (lastViewedAt) {
        update.$set = { ...(update.$set || {}), lastViewedAt: new Date(lastViewedAt) };
      }

      if (Object.keys(update).length) {
        await Article.updateOne({ _id: articleId }, update);
      }

      await redisDel(`article:${articleId}:views:pending`);
      await redisDel(`article:${articleId}:uniqueViews:pending`);
      await AnalyticsService.recomputeArticleTrendingScore(articleId);
      processed += 1;
    }

    return { processed };
  }

  static async getTrendingArticles(limit = 10) {
    return Article.find({ publishStatus: 'published' })
      .sort({ trendingScore: -1, lastViewedAt: -1, publishedAt: -1 })
      .limit(limit)
      .select('title localizedSlug excerpt category featuredImage publishedAt viewCount uniqueViewCount trendingScore lastViewedAt')
      .lean();
  }

  static async getTopViewedProducts(days = 30, limit = 20) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return ProductView.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$product', views: { $sum: 1 }, uniqueUsers: { $addToSet: '$user' } } },
      { $addFields: { uniqueViews: { $size: '$uniqueUsers' } } },
      { $sort: { views: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 1,
          views: 1,
          uniqueViews: 1,
          'product.title': 1,
          'product.slug': 1,
          'product.category': 1,
        },
      },
    ]);
  }

  static async getTopSearchTerms(days = 30, limit = 50) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return SearchTerm.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$normalizedTerm',
          count: { $sum: 1 },
          avgResults: { $avg: '$resultsCount' },
          zeroResultCount: {
            $sum: { $cond: [{ $eq: ['$resultsCount', 0] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);
  }

  static async getZeroResultSearches(days = 30, limit = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return SearchTerm.aggregate([
      { $match: { createdAt: { $gte: since }, resultsCount: 0 } },
      { $group: { _id: '$normalizedTerm', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);
  }

  static async getTrafficOverview(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [productViews, pageViews, searches] = await Promise.all([
      ProductView.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      PageView.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      SearchTerm.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return { productViews, pageViews, searches };
  }

  static async getDashboardSummary(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [totalProductViews, totalSearches, totalPageViews, topProducts, topSearches] =
      await Promise.all([
        ProductView.countDocuments({ createdAt: { $gte: since } }),
        SearchTerm.countDocuments({ createdAt: { $gte: since } }),
        PageView.countDocuments({ createdAt: { $gte: since } }),
        AnalyticsService.getTopViewedProducts(days, 5),
        AnalyticsService.getTopSearchTerms(days, 10),
      ]);

    return {
      period: `${days} days`,
      totalProductViews,
      totalSearches,
      totalPageViews,
      topProducts,
      topSearches,
    };
  }
}

module.exports = AnalyticsService;
