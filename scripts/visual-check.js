import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

(async () => {
  const url = process.env.VISUAL_CHECK_URL || 'http://localhost:4173';
  const outDir = path.resolve(process.cwd(), 'visual-reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const viewports = [
    { name: 'desktop-1024x768', width: 1024, height: 768 },
    { name: 'desktop-1440x900', width: 1440, height: 900 },
    { name: 'desktop-1920x1080', width: 1920, height: 1080 },
    { name: 'mobile-375x667', width: 375, height: 667 },
    { name: 'mobile-390x844', width: 390, height: 844 },
    { name: 'mobile-414x896', width: 414, height: 896 }
  ];

  const browser = await chromium.launch({ headless: true });
  try {
    for (const vp of viewports) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      console.log(`Navigating to ${url} at ${vp.name}`);
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      } catch (e) {
        console.warn('Navigation timeout, trying again after short wait...');
        await new Promise(r => setTimeout(r, 1000));
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      }
      // Wait a bit for animations/ad loading
      await page.waitForTimeout(1200);

      // Capture screenshot of the app root
      const file = path.join(outDir, `${vp.name}.png`);
      // Prefer capturing main content area if present
      const main = await page.$('main');
      if (main) {
        await main.screenshot({ path: file });
      } else {
        await page.screenshot({ path: file, fullPage: false });
      }
      console.log(`Saved screenshot: ${file}`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log('Visual checks complete.');
})();
