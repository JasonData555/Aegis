/**
 * Step 10 validation — Prospective and Compare modes in headless Chrome.
 * Usage: node scripts/validate-compare.js /path/to/curl-cookie-jar.txt
 */
const fs = require('fs');
const { chromium } = require('playwright-core');

const BASE = 'http://localhost:3001';
let failures = 0;
function check(name, cond, detail) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail !== undefined ? '  →  ' + detail : ''}`);
  if (!cond) failures++;
}

function sessionFromCurlJar(p) {
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const parts = line.trim().split('\t');
    if (parts.length >= 7 && parts[5] === 'aegis_session') return parts[6];
  }
  throw new Error('aegis_session not found');
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addCookies([
    { name: 'aegis_session', value: sessionFromCurlJar(process.argv[2]), url: BASE },
  ]);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // --- Prospective mode ---
  await page.goto(`${BASE}/scorecard`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Prospective Role' }).click();
  check('prospective: form appears', await page.getByRole('heading', { name: 'Prospective role' }).isVisible());
  check('prospective: hint before inputs', await page.locator('text=Enter at least a role level').isVisible());

  // Fill: CISO (prefilled) + Enterprise + base 500k
  await page.selectOption('select:near(:text("Company Size"))', 'Enterprise');
  await page.fill('#prospective_base', '500000');
  // Debounced query (300ms) + response render
  await page.waitForSelector('text=verified peers', { timeout: 8000 });
  check('prospective: scorecard cards render after debounce',
    await page.getByRole('heading', { name: 'Compensation', exact: true }).isVisible());
  const compText = await page.locator('section', { hasText: 'Compensation' }).first().innerText();
  check('prospective: card reflects prospective comp ($500,000)', compText.includes('$500,000'), compText.split('\n').slice(0, 6).join(' | '));

  // Live update: change base → cards update
  await page.fill('#prospective_base', '900000');
  await page.waitForTimeout(900);
  const compText2 = await page.locator('section', { hasText: 'Compensation' }).first().innerText();
  check('prospective: cards update dynamically on field change', compText2.includes('$900,000'));

  // --- Compare mode ---
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await page.waitForSelector('[data-testid="compare-view"]', { timeout: 8000 });
  check('compare: two-column view renders', await page.locator('[data-testid="compare-view"]').isVisible());
  check('compare: current column', await page.locator('[data-testid="compare-column-current"]').isVisible());
  check('compare: prospective column', await page.locator('[data-testid="compare-column-prospective"]').isVisible());
  const currentCol = await page.locator('[data-testid="compare-column-current"]').innerText();
  const prospectiveCol = await page.locator('[data-testid="compare-column-prospective"]').innerText();
  check('compare: current column shows current TC ($460k)', currentCol.includes('$460k'), currentCol.replace(/\n/g, ' | ').slice(0, 120));
  check('compare: prospective column shows prospective TC ($900k)', prospectiveCol.includes('$900k'));
  check('compare: both columns show traction + protections',
    currentCol.includes('of 4') && prospectiveCol.includes('of 4') &&
    /FSS [\d.]+ · SI \d+/.test(currentCol) && /FSS [\d.]+ · SI \d+/.test(prospectiveCol));

  // --- /compare standalone route opens in compare mode ---
  await page.goto(`${BASE}/compare`, { waitUntil: 'networkidle' });
  check('/compare route opens with prospective form visible',
    await page.getByRole('heading', { name: 'Prospective role' }).isVisible());

  check('no browser console errors', consoleErrors.length === 0, consoleErrors.join(' | ') || 'none');

  await page.screenshot({ path: '/tmp/aegis-compare.png', fullPage: true });
  await browser.close();
  console.log(failures === 0 ? '\nCOMPARE MODE: ALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures ? 1 : 0);
})().catch(e => {
  console.error('SCRIPT ERROR:', e.message);
  process.exit(1);
});
