/**
 * Step 9 validations — drives /scorecard in headless Chrome:
 *   1. All four cards render
 *   2. Sticky strip remains fixed during scroll
 *   3. TractionMatrix shows all four colored zones
 *   4. Traction Score breakdown is visible and arithmetically correct
 *   5. Car traction metaphor explanation appears in TractionCard
 *
 * Usage: node scripts/validate-scorecard.js /path/to/curl-cookie-jar.txt
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
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addCookies([
    { name: 'aegis_session', value: sessionFromCurlJar(process.argv[2]), url: BASE },
  ]);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto(`${BASE}/scorecard`, { waitUntil: 'networkidle' });
  check('scorecard loads (not redirected)', page.url().endsWith('/scorecard'), page.url());

  // --- 1. All four cards render ---
  for (const heading of ['Compensation', 'Role Structure', 'Employment Protections', 'Traction Score']) {
    const visible = await page.getByRole('heading', { name: heading, exact: true }).isVisible();
    check(`card renders: "${heading}"`, visible);
  }

  // --- 2. Sticky strip remains fixed during scroll ---
  const strip = page.locator('[data-testid="sticky-strip"]');
  const before = await strip.boundingBox();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  const scrollY = await page.evaluate(() => window.scrollY);
  const after = await strip.boundingBox();
  check('page actually scrolled', scrollY > 500, `scrollY=${scrollY}`);
  check(
    'sticky strip pinned to viewport top while scrolled',
    after !== null && Math.abs(after.y) < 1,
    `y before=${before && Math.round(before.y)}, y after scroll=${after && Math.round(after.y)}`,
  );
  check('strip shows comp / zone / protections',
    (await strip.innerText()).includes('TOTAL COMP') &&
    (await strip.innerText()).includes('TRACTION ZONE') &&
    (await strip.innerText()).includes('PROTECTIONS'));
  await page.evaluate(() => window.scrollTo(0, 0));

  // --- 3. TractionMatrix shows all four colored zones ---
  const matrix = page.locator('[data-testid="traction-matrix"]').first();
  const zoneColors = await matrix.evaluate(el => {
    const colors = [];
    for (const div of el.querySelectorAll('div')) {
      const bg = div.style.backgroundColor;
      if (bg) colors.push(bg);
    }
    return colors;
  });
  const expectedFills = [
    'rgb(232, 245, 242)', // Paragon Leader — aegis-brand-soft
    'rgb(238, 242, 255)', // Specialist Surgeon
    'rgb(250, 240, 232)', // Utility Player — aegis-accent-soft
    'rgb(244, 241, 236)', // Generalist — aegis-bg-subtle
  ];
  for (let i = 0; i < 4; i++) {
    check(`matrix zone fill ${i + 1} present (${expectedFills[i]})`, zoneColors.includes(expectedFills[i]));
  }
  const matrixText = await matrix.innerText();
  for (const zone of ['Paragon Leader', 'Specialist Surgeon', 'Utility Player', 'Generalist']) {
    check(`matrix zone label: ${zone}`, matrixText.toLowerCase().includes(zone.toLowerCase()));
  }
  check('matrix shows contributor dot + crosshair medians',
    matrixText.includes('Peer median FSS') && matrixText.includes('Peer median SI'));

  // --- 4. Traction Score breakdown visible and correct ---
  const breakdown = page.locator('[data-testid="traction-breakdown"]');
  check('breakdown row visible', await breakdown.isVisible());
  const text = (await breakdown.innerText()).replace(/\s+/g, ' ');
  const m = text.match(/FSS ([\d.]+) × ([\d.]+)x surface multiplier = Traction Score ([\d.]+)/);
  check('breakdown format "FSS X × Yx surface multiplier = Traction Score Z"', m !== null, text);
  if (m) {
    const [fss, mult, score] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const computed = fss * mult;
    check(
      `breakdown arithmetic: ${fss} × ${mult} = ${computed.toFixed(2)} ≈ ${score}`,
      Math.abs(computed - score) <= 0.06,
    );
  }

  // --- 5. Car traction metaphor in TractionCard ---
  const explanation = page.locator('[data-testid="traction-explanation"]');
  check('traction explanation visible', await explanation.isVisible());
  const expText = await explanation.innerText();
  check('metaphor: "tires and the road surface"',
    expText.includes('Traction is the relationship between your tires and the road surface'));
  check('metaphor: tire = Scope Score', expText.includes('Your Scope Score is the tire'));
  check('metaphor: road = Surface Index', expText.includes('Your Surface Index is the road'));
  check('metaphor: slippage and grip', expText.includes('slippage') && expText.includes('grip'));

  check('no browser console errors', consoleErrors.length === 0, consoleErrors.join(' | ') || 'none');

  await page.screenshot({ path: '/tmp/aegis-scorecard.png', fullPage: true });
  await browser.close();
  console.log(failures === 0 ? '\nSCORECARD: ALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures ? 1 : 0);
})().catch(e => {
  console.error('SCRIPT ERROR:', e.message);
  process.exit(1);
});
