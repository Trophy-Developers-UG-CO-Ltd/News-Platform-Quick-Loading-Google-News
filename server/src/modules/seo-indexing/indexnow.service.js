/**
 * IndexNow Service
 * Submits URLs to IndexNow (Bing, Yandex, DuckDuckGo).
 * @module modules/indexing/indexnow.service
 */

'use strict';

const https = require('https');
const seoConfig = require('../../config/seo.config');
const logger    = require('../../utils/logger');

const INDEXNOW_HOSTS = ['api.indexnow.org', 'www.bing.com', 'yandex.com'];

/**
 * Submit one or more URLs to IndexNow.
 * @param {string|string[]} urls
 */
async function submitUrls(urls) {
  const key     = seoConfig.indexing.indexNowKey;
  const keyLoc  = `${seoConfig.siteUrl}/${key}.txt`;
  const host    = new URL(seoConfig.siteUrl).hostname;

  if (!key) {
    logger.warn('[IndexNow] INDEXNOW_KEY not configured; skipping submission.');
    return { submitted: false, reason: 'no_key' };
  }

  const urlList = Array.isArray(urls) ? urls : [urls];
  const fullUrls = urlList.map(u => u.startsWith('http') ? u : `${seoConfig.siteUrl}${u}`);

  const body = JSON.stringify({
    host,
    key,
    keyLocation: keyLoc,
    urlList: fullUrls,
  });

  const results = [];
  for (const endpoint of INDEXNOW_HOSTS) {
    try {
      const statusCode = await postJson(`https://${endpoint}/indexnow`, body);
      results.push({ host: endpoint, status: statusCode });
      logger.info(`[IndexNow] Submitted ${fullUrls.length} URLs to ${endpoint} — status ${statusCode}`);
    } catch (err) {
      logger.error(`[IndexNow] Error submitting to ${endpoint}: ${err.message}`);
      results.push({ host: endpoint, error: err.message });
    }
  }

  return { submitted: true, urls: fullUrls, results };
}

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path:     parsed.pathname,
      method:   'POST',
      headers: {
        'Content-Type':   'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => resolve(res.statusCode));
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

module.exports = { submitUrls };

// MukonoTalks

