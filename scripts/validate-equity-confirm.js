/**
 * Step 8 validation 2 — drives the real contribution form in headless Chrome
 * (playwright-core + system Chrome, no browser download) and confirms the
 * equity confirmation card appears when annual_equity > annual_base × 3 with
 * size_bucket Small, blocks progression, and unblocks after confirmation.
 *
 * Usage: node scripts/validate-equity-confirm.js /path/to/curl-cookie-jar.txt
 */
const fs = require('fs');
const { chromium } = require('playwright-core');

const BASE = 'http://localhost:3001';
let failures = 0;
function check(name, cond, detail) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail !== undefined ? '  →  ' + detail : ''}`);
  if (!cond) failures++;
}

function sessionFromCurlJar(path) {
  const jar = fs.readFileSync(path, 'utf8');
  for (const line of jar.split('\n')) {
    const parts = line.trim().split('\t');
    if (parts.length >= 7 && parts[5] === 'aegis_session') return parts[6];
  }
  throw new Error('aegis_session not found in cookie jar');
}

(async () => {
  const sessionValue = sessionFromCurlJar(process.argv[2]);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  await context.addCookies([
    { name: 'aegis_session', value: sessionValue, url: BASE },
  ]);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto(`${BASE}/onboarding/contribute`, { waitUntil: 'networkidle' });
  check('contribute page loads (not redirected)', page.url().includes('/onboarding/contribute'), page.url());

  // --- Step 1: Your Role ---
  await page.fill('#role_title', 'CISO');
  await page.getByRole('button', { name: 'CISO', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // --- Step 2: Your Organization (size = Small) ---
  await page.click('#industry');
  await page.fill('#industry', 'FinTech');
  await page.getByRole('button', { name: 'FinTech', exact: true }).click();
  await page.getByRole('button', { name: 'Small (<250)', exact: true }).click();
  await page.getByRole('button', { name: 'Privately Held', exact: true }).click();
  await page.selectOption('#reporting_line', 'CEO');
  await page.getByRole('button', { name: 'At least quarterly', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // --- Step 3: Your Compensation ---
  await page.waitForSelector('#annual_base');
  await page.fill('#annual_base', '100000');

  const card = page.locator('[data-testid="equity-confirm-card"]');
  const nextBtn = page.getByRole('button', { name: 'Next', exact: true });

  // Below threshold: 2x base at Small — no confirmation card
  await page.fill('#annual_equity', '200000');
  check('equity 2.0x base (Small): card NOT shown', (await card.count()) === 0);
  check('equity 2.0x base (Small): Next enabled', await nextBtn.isEnabled());

  // Trigger condition: > base × 3 at Small — 4x
  await page.fill('#annual_equity', '400000');
  await card.waitFor({ state: 'visible', timeout: 3000 });
  check('equity 4.0x base (Small): confirmation card APPEARS', await card.isVisible());
  const cardText = await card.innerText();
  check('card heading present', cardText.includes('Please confirm your equity entry'));
  check('card states entered value and multiple', cardText.includes('$400,000') && cardText.includes('4.0x'));
  check('card blocks progression: Next disabled', await nextBtn.isDisabled());

  await page.screenshot({ path: '/tmp/aegis-equity-confirm.png', fullPage: true });

  // Resolve via "Yes — this is my annual vesting value"
  await page.getByText('Yes — this is my annual vesting value, not my total grant').click();
  check('after confirming: Next enabled', await nextBtn.isEnabled());

  // "I need to correct this" clears the field and re-blocks
  await page.fill('#annual_equity', '400000'); // editing resets confirmation
  await card.waitFor({ state: 'visible', timeout: 3000 });
  check('editing equity resets confirmation: Next disabled again', await nextBtn.isDisabled());
  await page.getByText('I need to correct this — let me recalculate').click();
  check('"correct this" clears the equity field', (await page.inputValue('#annual_equity')) === '');
  check('"correct this" hides the card', (await card.count()) === 0);
  check('"correct this" returns focus to equity input',
    await page.evaluate(() => document.activeElement && document.activeElement.id === 'annual_equity'));

  check('no browser console errors', consoleErrors.length === 0, consoleErrors.join(' | ') || 'none');

  await browser.close();
  console.log(failures === 0 ? '\nEQUITY CONFIRMATION: ALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures ? 1 : 0);
})().catch(e => {
  console.error('SCRIPT ERROR:', e.message);
  process.exit(1);
});
