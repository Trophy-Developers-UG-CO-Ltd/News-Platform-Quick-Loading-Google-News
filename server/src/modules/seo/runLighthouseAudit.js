// runLighthouseAudit.js
// Node.js function to run Lighthouse programmatically (headless, for API use)
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runLighthouseAudit(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = { logLevel: 'info', output: 'json', onlyCategories: ['performance','accessibility','best-practices','seo','pwa'], port: chrome.port };
  const runnerResult = await lighthouse(url, options);
  await chrome.kill();
  const lhr = runnerResult.lhr;
  return {
    url: lhr.finalUrl,
    score: lhr.categories.performance.score,
    metrics: {
      performance: lhr.categories.performance.score,
      accessibility: lhr.categories.accessibility.score,
      bestPractices: lhr.categories['best-practices'].score,
      seo: lhr.categories.seo.score,
      pwa: lhr.categories.pwa.score
    },
    timestamp: lhr.fetchTime,
    source: 'Lighthouse'
  };
}

module.exports = runLighthouseAudit;
