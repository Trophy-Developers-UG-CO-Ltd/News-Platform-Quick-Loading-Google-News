const { chromium } = require('playwright');

const targets = [
  { label: 'dev', baseUrl: 'http://127.0.0.1:4173' },
  { label: 'preview', baseUrl: 'http://127.0.0.1:4174' },
];

(async () => {
  const results = [];
  const browser = await chromium.launch({ headless: true });

  try {
    for (const target of targets) {
      const context = await browser.newContext();
      const page = await context.newPage();
      const checks = [];

      await page.goto(`${target.baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1000);
      const homeMarker = await page.locator('text=MUKONO TALKS').first().isVisible().catch(() => false);
      checks.push({
        route: '/',
        pass: homeMarker,
        detail: homeMarker ? 'Home shell rendered.' : 'Home branding marker not visible.',
      });

      await page.goto(`${target.baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1000);
      const loginMarker = await page.locator('text=Welcome Back').first().isVisible().catch(() => false);
      checks.push({
        route: '/login',
        pass: loginMarker,
        detail: loginMarker ? 'Login page rendered.' : 'Login heading not visible.',
      });

      await page.goto(`${target.baseUrl}/news/smoke-test-slug`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);
      const notFoundMarker = await page.locator('text=Story not found').first().isVisible().catch(() => false);
      const articleH1 = await page.locator('main h1, article h1, h1').first().textContent().catch(() => null);
      const newsPass = notFoundMarker || (articleH1 && articleH1.trim().length > 0);
      checks.push({
        route: '/news/:slug',
        pass: !!newsPass,
        detail: notFoundMarker
          ? 'News route resolved with not-found state.'
          : `News route rendered heading: ${articleH1?.trim() || 'none'}`,
      });

      await page.goto(`${target.baseUrl}/admin`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);
      const finalUrl = page.url();
      const redirectedToLogin = finalUrl.includes('/login');
      checks.push({
        route: '/admin',
        pass: redirectedToLogin,
        detail: redirectedToLogin
          ? `Redirected to login (${finalUrl}).`
          : `Did not redirect to login (${finalUrl}).`,
      });

      results.push({
        target: target.label,
        baseUrl: target.baseUrl,
        passCount: checks.filter((check) => check.pass).length,
        total: checks.length,
        checks,
      });

      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(results, null, 2));
})();
