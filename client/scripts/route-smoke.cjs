const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const targets = [
  { label: 'dev', baseUrl: 'http://127.0.0.1:4173' },
  { label: 'preview', baseUrl: 'http://127.0.0.1:4174' },
];

const waitForServer = async (url, timeoutMs = 60000) => {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return;
    } catch (_error) {
      // keep retrying until timeout
    }

    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  throw new Error(`Timed out waiting for ${url}`);
};

const startServer = (command, args, label) => {
  const processRef = spawn(command, args, {
    shell: true,
    stdio: 'pipe',
    windowsHide: true,
  });

  processRef.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    process.stdout.write(`[${label}] ${text}`);
  });

  processRef.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    process.stderr.write(`[${label}] ${text}`);
  });

  return processRef;
};

const stopServer = (processRef) => {
  if (!processRef || processRef.killed) return;
  processRef.kill('SIGTERM');
};

(async () => {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const devServer = startServer(npmCmd, ['run', 'dev', '--prefix', 'client', '--', '--host', '127.0.0.1', '--port', '4173'], 'dev');
  const previewServer = startServer(npmCmd, ['run', 'preview', '--prefix', 'client', '--', '--host', '127.0.0.1', '--port', '4174'], 'preview');

  let browser;

  try {
    await Promise.all(targets.map((target) => waitForServer(target.baseUrl)));

    const results = [];
    browser = await chromium.launch({ headless: true });

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
      const loginVisible = await page.locator('text=Welcome Back').first().isVisible().catch(() => false);
      const loginUrl = page.url();
      const loginPass = loginVisible || loginUrl === `${target.baseUrl}/`;
      checks.push({
        route: '/login',
        pass: loginPass,
        detail: loginVisible
          ? 'Login page rendered.'
          : `Login redirected to ${loginUrl} (active session behavior).`,
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
      const redirectedToExpected = finalUrl.includes('/login') || finalUrl === `${target.baseUrl}/`;
      checks.push({
        route: '/admin',
        pass: redirectedToExpected,
        detail: redirectedToExpected
          ? `Admin route redirected to ${finalUrl}.`
          : `Admin route stayed on unexpected URL ${finalUrl}.`,
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

    const allPass = results.every((result) => result.passCount === result.total);
    console.log(JSON.stringify(results, null, 2));
    process.exitCode = allPass ? 0 : 1;
  } catch (error) {
    console.error(`Route smoke test failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    stopServer(devServer);
    stopServer(previewServer);
  }
})();
