/* 화면 점검 : node tests/shot.js [dist/option7.html]
   - 사례 A · B · C 재현값 (49.86 · 42.79 · 28.74)
   - 사례 C 1F 층고 9.8 → 6.0 → 9.8 즉시 재계산 (28.74 → 28.32 → 28.74)
   - 1440 · 390px 가로 스크롤 없음 · 콘솔 오류 0
   - 스크린샷 : tests/out/ */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const FILE = path.resolve(process.argv[2] || 'dist/option7.html');
const OUT = path.join(__dirname, 'out');
const EXPECT = { refA: 49.86, refB: 42.79, refC: 28.74 };
const r2 = (v) => Math.round(v * 100) / 100;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const res = { totals: {}, edit: null, noH: {}, errors: [] };
  let fail = false;

  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on('pageerror', (e) => res.errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error' && !/ERR_|net::|fonts/.test(m.text())) res.errors.push(m.text()); });
    await page.goto('file://' + FILE);
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await page.reload();
    await wait(400);

    for (const k of Object.keys(EXPECT)) {
      await page.evaluate((k) => window.__agent.loadPreset(k), k);
      await wait(250);
      const t = await page.evaluate(() => window.__agent.R && window.__agent.R.total);
      if (w === 1440) { res.totals[k] = r2(t); if (r2(t) !== EXPECT[k]) fail = true; }
      await page.screenshot({ path: path.join(OUT, `w${w}_${k}_fold.png`) });
      if (w === 1440) await page.screenshot({ path: path.join(OUT, `w${w}_${k}_full.png`), fullPage: true });
    }
    res.noH[w] = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    if (!res.noH[w]) fail = true;

    if (w === 1440) {
      await page.evaluate(() => window.__agent.loadPreset('refC'));
      await wait(250);
      const set = async (v) => {
        await page.evaluate((v) => {
          const el = document.querySelector('input[data-floor-h="1F"]');
          el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
        }, v);
        await wait(600);
        return r2(await page.evaluate(() => window.__agent.R.total));
      };
      const hasInput = await page.evaluate(() => !!document.querySelector('input[data-floor-h="1F"]'));
      if (hasInput) {
        const before = r2(await page.evaluate(() => window.__agent.R.total));
        const after = await set('6.0');
        const back = await set('9.8');
        res.edit = { ok: before === 28.74 && after === 28.32 && back === 28.74, before, after, back };
      } else res.edit = { ok: false, reason: '1F 층고 칸 없음' };
      if (!res.edit.ok) fail = true;
    }
    await page.close();
  }
  await browser.close();
  if (res.errors.length) fail = true;
  console.log(JSON.stringify(res));
  console.log(fail ? 'FAIL' : 'OK');
  process.exit(fail ? 1 : 0);
})();
