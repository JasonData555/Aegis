// Screenshot the redesigned landing page in headless system Chrome.
// Usage: node scripts/screenshot-landing.js
const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });

  for (const [name, width, height] of [
    ['desktop', 1280, 900],
    ['mobile', 390, 844],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500); // let hero entrance finish

    await page.screenshot({ path: `/tmp/aegis-landing-${name}-hero.png` });

    // Scroll through so IntersectionObserver reveals + count-up fire
    await page.evaluate(async () => {
      for (let y = 0; y <= document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: `/tmp/aegis-landing-${name}-full.png`,
      fullPage: true,
    });
    await page.close();
  }

  await browser.close();
  console.log('done');
})();
