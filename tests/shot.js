/* 화면 점검 : node tests/shot.js [dist/option7.html]
   - 사례 A · B · C 재현값 (49.86 · 42.00 · 28.74) — B 는 지하 v2.8 사슬 기본 끔 (adv.bChain ON 일 때만) 으로 42.79 → 42.00
   - 사례 C 1F 층고 9.8 → 6.0 → 9.8 즉시 재계산 (28.74 → 28.32 → 28.74)
   - 사례 B 지하 층수 2 → 4 → 2 (42.00 → 51.96 → 42.00) · 형틀팀 3 → 1 변화 1개월 이하
   - 사례 A 타설 순서 (주요 가정사항 칸) 자동 → 코어후행 → 자동 (49.86 → 49.58 → 49.86, 입력 시트 칸도 같은 값)
   - 1440 · 390px 가로 스크롤 없음 · 콘솔 오류 0
   - 스크린샷 : tests/out/ */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const FILE = path.resolve(process.argv[2] || 'dist/option7.html');
const OUT = path.join(__dirname, 'out');
const EXPECT = { refA: 49.86, refB: 42.00, refC: 28.74 };
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

      /* 사례 B 지하 층수 2 → 4 → 2 (입력 시트 in-nB change) : 화면 = node 엔진 실측 42.00 → 51.96 → 42.00 */
      await page.evaluate(() => window.__agent.loadPreset('refB'));
      await wait(250);
      const setNB = async (v) => {
        await page.evaluate((v) => {
          const el = document.querySelector('#in-nB');
          el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
        }, v);
        await wait(600);
        return r2(await page.evaluate(() => window.__agent.R.total));
      };
      const nb0 = r2(await page.evaluate(() => window.__agent.R.total));
      const nb4 = await setNB('4');
      const nb2 = await setNB('2');
      res.nB = { ok: nb0 === 42 && nb4 === 51.96 && nb2 === 42, before: nb0, nB4: nb4, back: nb2 };
      if (!res.nB.ok) fail = true;

      /* 사례 B 지상 형틀팀 (uTeams) 3 → 1 (조닝 지상 판 팀 칸 −) : v2.8 은 팀 = 꼬리 · 하루 1 Zone 하한만 → 변화 1개월 이하 (실측 42.00 → 42.33, +0.33) */
      await page.evaluate(() => window.__agent.loadPreset('refB'));
      await wait(250);
      const tq = '[data-team="uTeams"]';
      const u0 = r2(await page.evaluate(() => window.__agent.R.total));
      let uN = await page.evaluate((q) => { const e = document.querySelector(q); return e ? +e.querySelector('.tm-v').textContent : null; }, tq);
      for (let i = 0; i < 8 && uN > 1; i++) {
        await page.click(tq + ' [data-tstep="-1"]');
        await wait(500);
        uN = await page.evaluate((q) => +document.querySelector(q).querySelector('.tm-v').textContent, tq);
      }
      const u1 = r2(await page.evaluate(() => window.__agent.R.total));
      const uS = await page.evaluate(() => window.__agent.state.adv.uTeams);
      res.uTeams = { ok: uN === 1 && uS === 1 && Math.abs(u1 - u0) <= 1, before: u0, teams1: u1, d: r2(u1 - u0) };
      if (!res.uTeams.ok) fail = true;

      /* 사례 A 타설 순서 : 주요 가정사항 '타설 순서' 칸 → 코어후행 → 자동 (화면 = node 엔진 49.58 · 49.86) */
      await page.evaluate(() => window.__agent.loadPreset('refA'));
      await wait(250);
      const pour = async (v) => {
        await page.click('#kf [data-kf="pour"] button'); await wait(200);
        await page.selectOption('#kf [data-kf="pour"] select', v); await wait(600);
        return { t: r2(await page.evaluate(() => window.__agent.R.total)), sheet: await page.evaluate(() => document.getElementById('in-pourSeq').value) };
      };
      const ps0 = r2(await page.evaluate(() => window.__agent.R.total)), psP = await pour('POST'), psA = await pour('AUTO');
      res.pour = { ok: ps0 === 49.86 && psP.t === 49.58 && psP.sheet === 'POST' && psA.t === 49.86 && psA.sheet === '', before: ps0, post: psP, auto: psA };
      if (!res.pour.ok) fail = true;
    }
    await page.close();
  }
  await browser.close();
  if (res.errors.length) fail = true;
  console.log(JSON.stringify(res));
  console.log(fail ? 'FAIL' : 'OK');
  process.exit(fail ? 1 : 0);
})();
