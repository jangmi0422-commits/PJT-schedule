/* 디자인 옵션 7 · 벤토 · 입체 — 상태 객체 (S) 하나를 빠른 입력 타일 · 입력 시트 · 단면 층고 칸이 함께 고친다
   렌더 : 히어로 (총 공기 · 범위 · C.P 구성) · 마일스톤 · Master Schedule · 가정 단면 (입면 일러스트) · 조닝 (아이소메트릭 적층) · C.P 구간 · 주요 판단 · 확인 사항 */
(function () {
  'use strict';
  var GE = window.GE, GK = window.GK, r1 = GE.r1, r2 = GE.r2, fmt = GE.fmt, esc = GK.esc, m1 = GK.m1, m2 = GK.m2;
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  var LIB = GE.defaultLib(), ST = GK.store('gonggi-agent-o7'), PRESETS = GK.PRESETS;
  var S = null, lastR = null, current = 'refA', timer = null, secG = null, lastGround = 'AUTO', downloads = null, widths = {}, zoneBig = false, zoneFW = 0;
  var TEAMC = ['var(--t1)', 'var(--t2)', 'var(--t3)', 'var(--t4)', 'var(--t5)', 'var(--t6)', 'var(--slate)', 'var(--hrock)'];
  var LKS = ['soil', 'wsoil', 'wrock', 'srock', 'hrock'], LNM = ['토사', '풍화토', '풍화암', '연암', '경암'];

  /* ───────── SVG 조각 */
  function T(x, y, s, o) {
    o = o || {};
    return '<text x="' + r1(x) + '" y="' + r1(y) + '"' + (o.a ? ' text-anchor="' + o.a + '"' : '') + ' font-size="' + (o.fs || 12) + '"' + (o.w ? ' font-weight="' + o.w + '"' : '') +
      ' fill="' + (o.c || 'var(--ink-2)') + '"' + (o.cls ? ' class="' + o.cls + '"' : '') + (o.tr ? ' transform="' + o.tr + '"' : '') +
      (o.halo ? ' stroke="' + (o.halo === true ? '#fff' : o.halo) + '" stroke-width="3.4" paint-order="stroke" stroke-linejoin="round"' : '') + (o.op ? ' opacity="' + o.op + '"' : '') + '>' + esc(s) + '</text>';
  }
  function Ln(x1, y1, x2, y2, st, w, da, ex) { return '<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '" stroke="' + st + '" stroke-width="' + (w || 1) + '"' + (da ? ' stroke-dasharray="' + da + '"' : '') + (ex || '') + '/>'; }
  function Rc(x, y, w, h, fill, ex) { return '<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(Math.max(0, w)) + '" height="' + r1(Math.max(0, h)) + '" fill="' + fill + '"' + (ex || '') + '/>'; }
  function Pg(pts, ex) { return '<polygon points="' + pts.map(function (p) { return r1(p[0]) + ',' + r1(p[1]); }).join(' ') + '"' + (ex || '') + '/>'; }
  function svgEl(w, h, inner, label) { return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(label) + '" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>'; }
  function pat(id, n, inner, bg) { return '<pattern id="' + id + '" width="' + n + '" height="' + n + '" patternUnits="userSpaceOnUse">' + (bg ? '<rect width="' + n + '" height="' + n + '" fill="' + bg + '"/>' : '') + inner + '</pattern>'; }
  /* 글자 폭 근사 (한글 ≈ 1em · 숫자 · 영문 ≈ .58em) */
  function tw(t, fs) { var w = 0; t = String(t); for (var i = 0; i < t.length; i++) { var c = t[i]; w += /[ㄱ-힝]/.test(c) ? fs * 0.98 : (c === ' ' ? fs * 0.3 : /[·~×]/.test(c) ? fs * 0.5 : fs * 0.58); } return w; }

  /* ───────── 상태 */
  function norm(p) {
    var s = GK.normInp(p || GK.BLANK), d = { wall: 'CIP', support: 'ANCHOR', found: 'AUTO', struct: 'RC', coreSys: 'AUTO', seq: 'BU', start: '' };
    Object.keys(d).forEach(function (k) { if (s[k] == null || s[k] === '') s[k] = d[k]; });
    if (s.name == null) s.name = '';
    s.adv = s.adv || {}; if (!s.adv.dcCycle) s.adv.dcCycle = 'AUTO'; if (!s.adv.dcFlow) s.adv.dcFlow = 'ZONE';
    ['scw', 'pt', 'link'].forEach(function (k) { s[k] = !!s[k]; });
    if (s.seq === 'TD') s.support = 'SLAB'; else if (s.support === 'SLAB') s.support = 'ANCHOR';
    return s;
  }
  function toInp() {
    var i = GK.clone(S);
    i.name = S.name || '프로젝트';
    if ((i.bldg == null || i.bldg === '') && i.site > 0 && i.cov > 0) i.bldg = i.site * i.cov / 100;
    i.geo = i.geo || 0; i.tdBase = i.tdBase || 0;
    delete i.cov;
    return i;
  }
  function markPreset(k) { current = k; $$('[data-p]').forEach(function (b) { var on = b.getAttribute('data-p') === k; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
  function syncUI() {
    var td = S.seq === 'TD';
    $$('.td-only').forEach(function (el) { el.hidden = !td; });
    $$('[data-k="support"]').forEach(function (el) { el.disabled = td; });
    $$('[data-k="coreSys"]').forEach(function (el) { el.disabled = !(S.struct === 'SC' || S.struct === 'COMP'); });
    $('#scw-wrap').hidden = !(!td && S.support === 'OPEN');
    $('#strata-in').hidden = S.ground !== 'CUSTOM';
  }
  function onField(k, val) {
    if (k === 'ground') {
      if (val === 'CUSTOM' && [0, 1, 2, 3].every(function (i) { return S.strata[i] == null; })) { var st = (GE.GROUND[lastGround] || GE.GROUND.AUTO).st; S.strata = st.slice(); }
      lastGround = val;
    }
    if (k === 'seq') { if (val === 'TD') S.support = 'SLAB'; else if (S.support === 'SLAB') S.support = 'ANCHOR'; }
    if (k === 'use') { var dc = val === 'dc'; if (S.fin === (dc ? 8 : 6) && S.tc === (dc ? 2 : 3)) { S.fin = dc ? 6 : 8; S.tc = dc ? 3 : 2; } }
    if (k === 'cov') { if (S.site > 0 && S.cov > 0) S.bldg = r2(S.site * S.cov / 100); }
    if (k === 'bldg') S.cov = null;
    if (current) markPreset('');
    GK.fill(document, S); syncUI(); schedule();
  }

  /* ───────── 기준 라이브러리 (생산성) 표 — V1 과 같은 항목 */
  var LIBROWS = [
    ['굴착 · 순타 (㎥/WD, 5,000㎡ 기준)', [['exc', 'BU', 'soil'], ['exc', 'BU', 'wsoil'], ['exc', 'BU', 'wrock'], ['exc', 'BU', 'srock'], ['exc', 'BU', 'hrock']]],
    ['굴착 · 역타 슬래브 하부 (㎥/WD)', [['exc', 'TD', 'soil'], ['exc', 'TD', 'wsoil'], ['exc', 'TD', 'wrock'], ['exc', 'TD', 'srock'], ['exc', 'TD', 'hrock']]],
    ['CIP 천공 (m/일·조)', [['wall', 'CIP', 'rate', 'soil'], ['wall', 'CIP', 'rate', 'wsoil'], ['wall', 'CIP', 'rate', 'wrock'], ['wall', 'CIP', 'rate', 'srock'], ['wall', 'CIP', 'rate', 'hrock']]]
  ];
  var LIBONE = [
    ['바닥 Zone당 WD · RC', ['frame', 'd', 'RC']], ['바닥 Zone당 WD · SRC', ['frame', 'd', 'SRC']], ['바닥 Zone당 WD · 철골 + 코어', ['frame', 'd', 'SC']], ['바닥 Zone당 WD · 강합성', ['frame', 'd', 'COMP']],
    ['코어 Zone당 WD · ACS', ['frame', 'core', 'ACS']], ['코어 Zone당 WD · 갱폼 · 알폼', ['frame', 'core', 'GANG']], ['층고 보정 (1m당)', ['frame', 'hK']], ['기초 철근 t/인·일', ['found', 'tPerMD']],
    ['PHC 본/일·팀', ['pile', 'PHC', 'rate']], ['지열 공/일·대', ['geo', 'rate']], ['앵커 단당 지보 WD', ['support', 'ANCHOR', 'pen']], ['지하 바닥 Zone당 WD', ['base', 'slabD']],
    ['역타 기초 전 허용 (지하 + 지상)', ['td', 'limTot1']], ['역타 수직재 전 허용 (지하 + 지상)', ['td', 'limTot2']]
  ];
  function getP(o, path) { return path.reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setP(o, path, val) { var last = path[path.length - 1], p = path.slice(0, -1).reduce(function (a, k) { return a == null ? a : a[k]; }, o); if (p) p[last] = val; }
  function buildLib() {
    var tb = $('#libtbl'); if (!tb) return;
    var h = '<thead><tr><th scope="col">항목</th><th scope="col">토사</th><th scope="col">풍화토</th><th scope="col">풍화암</th><th scope="col">연암</th><th scope="col">경암</th></tr></thead><tbody>';
    LIBROWS.forEach(function (row) { h += '<tr><td>' + esc(row[0]) + '</td>' + row[1].map(function (p, i) { return '<td><input id="lib_' + p.join('_') + '" data-path="' + p.join('.') + '" type="number" step="any" inputmode="decimal" aria-label="' + esc(row[0] + ' · ' + LNM[i]) + '"></td>'; }).join('') + '</tr>'; });
    LIBONE.forEach(function (row) { h += '<tr><td colspan="5">' + esc(row[0]) + '</td><td><input id="lib_' + row[1].join('_') + '" data-path="' + row[1].join('.') + '" type="number" step="any" inputmode="decimal" aria-label="' + esc(row[0]) + '"></td></tr>'; });
    tb.innerHTML = h + '</tbody>';
    fillLib();
  }
  function fillLib() { $$('#libtbl input').forEach(function (el) { var v = getP(LIB, el.getAttribute('data-path').split('.')); el.value = v == null ? '' : v; }); }
  function readLib() { $$('#libtbl input').forEach(function (el) { var x = parseFloat(el.value); if (isFinite(x) && x > 0) setP(LIB, el.getAttribute('data-path').split('.'), x); }); }

  /* ───────── 계산 */
  function schedule() { clearTimeout(timer); timer = setTimeout(recompute, 120); }
  function recompute() {
    clearTimeout(timer);
    readLib();
    var inp = toInp(), R;
    try { R = GE.compute(inp, LIB); } catch (e) { $('#warns').innerHTML = '<li>계산 오류 : ' + esc(e.message) + '</li>'; return; }
    try { R.sens = GE.sensitivity(inp, LIB); } catch (e) { R.sens = { lo: R.total, hi: R.total }; }
    lastR = R;
    if (S.seq === 'TD' && R.tdBase && R.tdBase.off !== (S.tdBase || 0)) S.tdBase = R.tdBase.off;
    ST.save({ inp: S, preset: current });
    render(R);
  }
  function render(R) {
    var steps = [renderHead, renderHero, renderMs, renderGantt, renderSection, renderZone, renderCpb, renderKf, renderWarns, renderHints];
    steps.forEach(function (fn) { try { fn(R); } catch (e) { if (window.console) console.error(e); } });
    widths.ms = $('#ms-flow').clientWidth;
    try { fitSection(R); } catch (e) { if (window.console) console.error(e); }
    GK.fill(document, S);
  }

  /* ───────── 머리 · 히어로 · 마일스톤 */
  function renderHead(R) {
    /* 프로젝트명에 이미 있는 용도 · 공사 순서는 부제에서 뺀다 */
    var nm = R.inp.name || '프로젝트', t = GK.title(R), un = GE.USE_H[R.basic.use].name, sn = GK.SEQ_N[R.basic.seq];
    if (nm.indexOf(un) >= 0) t = t.replace(un + ' · ', '');
    if (sn && nm.indexOf(sn) >= 0) t = t.replace(' · ' + sn + ' · ', ' · ');
    $('#pj').textContent = nm + ' · ' + t;
    $('#mini-total').textContent = m1(R.total); $('#sh-total').textContent = m2(R.total);
  }
  function renderHero(R) {
    var parts = GK.cpParts(R);
    $('#h-total').textContent = m1(R.total);
    $('#h-exact').innerHTML = '<span>산출 <b class="num">' + m2(R.total) + '</b>개월</span><i class="sep"></i><span>' + esc(GK.ymText(R.total)) + '</span><i class="sep"></i><span>C.P ' + parts.length + '개 공종</span>';
    var lo = R.sens.lo, hi = R.sens.hi, t = R.total, a = Math.min(lo, t), b = Math.max(hi, t), pad = Math.max(1, (b - a) * 0.3), x0 = a - pad, x1 = b + pad;
    var P = function (v) { return (v - x0) / (x1 - x0) * 100; };
    var near = Math.min(Math.abs(P(t) - P(lo)), Math.abs(P(hi) - P(t))) < 12;
    $('#h-range').innerHTML = '<div class="rg-k"><span>범위</span><b class="num">' + m1(lo) + ' ~ ' + m1(hi) + '</b><span>개월 · 생산성 ±15% 민감도</span></div>' +
      '<div class="rg-track" aria-hidden="true"><i class="rg-band" style="left:' + P(lo).toFixed(2) + '%;width:' + (P(hi) - P(lo)).toFixed(2) + '%"></i><i class="rg-dot" style="left:' + P(t).toFixed(2) + '%"></i></div>' +
      '<div class="rg-lab" aria-hidden="true"><span class="num" style="left:' + P(lo).toFixed(2) + '%">' + m1(lo) + '</span>' + (near ? '' : '<span class="num now" style="left:' + P(t).toFixed(2) + '%">' + m1(t) + '</span>') + '<span class="num" style="left:' + P(hi).toFixed(2) + '%">' + m1(hi) + '</span></div>';
    /* 왜 이 공기인가 : 가장 긴 C.P 공종 한 줄 */
    var top = parts.slice().sort(function (a, c) { return c.d - a.d; })[0];
    $('#h-why').innerHTML = top ? '<span class="k">공기를 지배하는 C.P</span><b>' + esc(top.label) + ' <span class="num">' + m1(top.d) + '</span>개월</b><span class="pc">' + Math.round(top.d / Math.max(0.01, R.total) * 100) + '%</span>' +
      (whyCtx(top, R) ? '<span class="ctx">' + esc(whyCtx(top, R)) + '</span>' : '') : '';
    $('#h-why').hidden = !top;
    var st = R.inp.start, ds = GK.addM(st, 0), de = GK.addM(st, R.total), w = GK.warns(R).length;
    $('#h-foot').innerHTML = (ds ? '<span class="dt">착공<b>' + GK.ym(ds) + '</b></span><span class="dt">준공<b>' + GK.ym(de) + '</b></span>' : '<button class="link" type="button" data-open="in-start">착공월을 넣으면 날짜로 표시</button>') +
      '<a class="wchip' + (w ? '' : ' ok') + '" href="#sec-warn">' + (w ? '확인 사항 ' + w + '건' : '확인 사항 없음') + '</a>';
  }
  function whyCtx(p, R) {
    var g = R.geo, f = R.found, b = R.basic;
    switch (p.id) {
      case 'frame': return '기준층 ' + m1(GK.tactOf(R)) + ' WD/층 × 지상 ' + b.nUp + '개층' + (R.frame.typ.dc ? ' · DC 사이클' : ' · 바닥 ' + R.frame.typ.slab.Z + ' Zone ÷ ' + R.frame.typ.slab.T + '팀');
      case 'exc': return '굴착 ' + fmt(R.exc.Vtot || g.Vtot) + '㎥ · GL−' + r1(g.H) + 'm' + (R.exc.ns ? ' · ' + GE.SUP_N[b.sup] + ' ' + R.exc.ns + '단' : '');
      case 'found': return f.nZ + ' Zone · 철근 ' + f.teams + '팀 · Zone당 ' + r1(f.cyc) + ' WD';
      case 'base': return '지하 ' + b.nB + '개층 골조';
      case 'fin': return '마감 기본값 (사양에 따라 조정)';
      case 'wall': return R.wall ? R.wall.qty + ' · ' + R.wall.sets + '조' : '';
      case 'pile': return R.pile ? fmt(R.pile.n) + '본' : '';
    }
    return '';
  }
  var GRP = { mob: '준비', wall: '토목', scw: '토목', prd: '토목', geo: '토목', pile: '토목', exc1: '토목', f1: '토목', exc: '토목', fin: '마감', tc: '마감' };
  var GCOL = { 준비: ['var(--g-prep)', 'var(--ink)'], 토목: ['var(--g-civ)', 'var(--ink)'], 골조: ['var(--g-frame)', '#fff'], 마감: ['var(--g-fin)', '#fff'] };
  function renderMs(R) {
    var ms = GK.milestones(R), tot = Math.max(0.01, R.total), st = R.inp.start;
    $('#ms-sub').textContent = st ? '착공월 기준 날짜' : 'M+ = 착공 후 개월';
    var prev = 0;
    $('#ms-list').innerHTML = ms.map(function (x) {
      var end = x.k === '준공', d = x.m - prev, h = '<div class="ms-item' + (end ? ' end' : '') + '"><i class="d" aria-hidden="true"></i><div><div class="k">' + esc(x.k) + '</div><div class="s">' +
        (st ? GK.ym(GK.addM(st, x.m)) + ' · ' : '') + '전체의 ' + Math.round(x.m / tot * 100) + '% · 앞 단계 후 +' + m1(d) + '</div></div><div class="v"><small>M+</small>' + m1(x.m) + '</div>' +
        '<div class="bar" aria-hidden="true"><i class="done" style="width:' + (prev / tot * 100).toFixed(2) + '%"></i><i style="left:' + (prev / tot * 100).toFixed(2) + '%;width:' + (Math.max(0, d) / tot * 100).toFixed(2) + '%;background:' + (end ? 'var(--cp)' : 'var(--navy)') + '"></i></div></div>';
      prev = x.m; return h;
    }).join('');
    /* C.P 흐름 : C.P 공종을 순서대로 (대공종 색) + 마일스톤 눈금 + 대공종별 합계 */
    var box = $('#ms-flow'), Wf = Math.max(200, (box.clientWidth || 380)), parts = GK.cpParts(R), G = GK.cpGroups(R), keys = ['준비', '토목', '골조', '마감'];
    var avail = Wf - 2 * Math.max(0, parts.length - 1);
    var strip = parts.map(function (p) {
      var gk = GRP[p.id] || '골조', c = GCOL[gk], px = p.d / tot * avail, full = p.label + ' ' + m1(p.d), inner = '';
      if (px >= tw(full, 12) + 14) inner = esc(p.label) + '<span class="n">' + m1(p.d) + '</span>';
      else if (px >= tw(m1(p.d), 12) + 10) inner = '<span class="n" style="margin:0">' + m1(p.d) + '</span>';
      return '<i style="flex:' + p.d.toFixed(3) + ' 1 0;background:' + c[0] + ';color:' + c[1] + '" title="' + esc(full + '개월 · ' + gk) + '">' + inner + '</i>';
    }).join('');
    var ticks = ms.filter(function (x) { return x.k !== '준공' && x.m > 0.05 && x.m < tot - 0.05; }).map(function (x) { return '<b class="fl-t" style="left:' + (x.m / tot * 100).toFixed(2) + '%" title="' + esc(x.k) + '"></b>'; }).join('');
    var ax = '<span>' + (st ? GK.ym(GK.addM(st, 0)) : 'M+0') + '</span>' + ms.filter(function (x) { return x.k !== '준공'; }).map(function (x) { var p = x.m / tot * 100; return p > 12 && p < 88 ? '<span style="left:' + p.toFixed(2) + '%">' + esc(x.k.replace(' 완료', '')) + '</span>' : ''; }).join('') +
      '<span style="left:100%">' + (st ? GK.ym(GK.addM(st, R.total)) : 'M+' + m1(R.total)) + '</span>';
    box.innerHTML = '<div class="comp-k"><span>C.P 흐름 · 착공 → 준공</span><span>대공종별 개월</span></div><div class="fl-wrap"><div class="fl-strip">' + strip + '</div>' + ticks + '</div><div class="fl-ax" aria-hidden="true">' + ax + '</div>' +
      '<div class="comp-leg">' + keys.map(function (k) { return '<div><span class="sw" style="background:' + GCOL[k][0] + '"></span>' + k + '<b>' + m1(G[k]) + '<small>' + Math.round(G[k] / tot * 100) + '%</small></b></div>'; }).join('') + '</div>';
  }

  /* ───────── Master Schedule (C.P = 빨강 · C.P 연결선 · 개월 축 · 마일스톤) */
  function gantt(R, Wc) {
    var W = Math.max(680, Math.floor(Wc)), nar = Wc < 760;
    var acts = GK.ganttActs(R), n = acts.length, st = R.inp.start;
    var LW = nar ? 132 : 206, PR = 54, top = 60, rh = nar ? 31 : 35, bh = nar ? 13 : 15;
    var Mmax = Math.ceil(R.total + 0.4), span = W - LW - PR, X = function (m) { return LW + m / Mmax * span; };
    var rowsH = n * rh, bg = '', s = '', fg = '';
    var defs = '<defs>' + pat('o7g-pre', 6, '<path d="M-1 7L7 -1" stroke="var(--cp)" stroke-width="1.1" opacity=".38"/>', '#FCEDEA') + '</defs>';
    for (var yr = 0; yr * 12 < Mmax; yr++) {
      var ya = X(yr * 12), yb = X(Math.min(Mmax, yr * 12 + 12));
      if (yr % 2 === 1) bg += Rc(ya, top - 6, yb - ya, rowsH + 6, 'var(--band)', ' rx="6"');
      if (yb - ya > 40) bg += T(ya + 8, top - 38, (yr + 1) + '년차', { fs: 12.5, w: 700, c: 'var(--ink-2)' });
    }
    var pxM = span / Mmax, step = pxM > 26 ? 3 : pxM > 13 ? 6 : 12;
    for (var m = 0; m <= Mmax; m++) {
      var x = X(m), maj = m % step === 0;
      if (pxM > 7 || maj) bg += Ln(x, top - (maj ? 9 : 3), x, top + rowsH, maj ? 'var(--rule)' : 'var(--rule-2)', maj ? 1 : 0.7);
      if (maj) bg += T(x, top - 15, st ? GK.yy(GK.addM(st, m)) : 'M+' + m, { a: 'middle', fs: 11.5, c: 'var(--ink-3)', cls: 'n' });
    }
    var cpMap = {}, cpS = {}, rowOf = {};
    R.cpLine.forEach(function (c, i) { cpMap[c.id] = c; cpS[c.id] = i ? R.cpLine[i - 1].e : 0; });
    acts.forEach(function (a, i) {
      rowOf[a.id] = i;
      var y = top + i * rh, mid = y + rh / 2, cp = !!(a.cp && cpMap[a.id]), x0 = X(a.s), x1 = Math.max(X(a.e), x0 + 2);
      bg += Ln(0, y + rh, W - PR + 34, y + rh, 'var(--rule-2)', 1);
      var nm = GK.shortName(a, R), fs = nar ? 12.5 : 14;
      while (fs > 10.5 && tw(nm, fs) > LW - 24) fs -= 0.5;
      s += T(LW - 14, mid + fs * 0.36, nm, { a: 'end', fs: fs, w: cp ? 600 : 400, c: cp ? 'var(--ink)' : 'var(--ink-3)' });
      if (cp) s += Rc(0, mid - 8, 3, 16, 'var(--cp)', ' rx="1.5"');
      var cs = cp ? Math.max(a.s, Math.min(a.e, cpS[a.id])) : a.s, xc = X(cs), d = cp ? cpMap[a.id].d : a.e - a.s;
      s += '<g><title>' + esc(a.name + ' · M+' + m1(a.s) + ' ~ M+' + m1(a.e) + (cp ? ' · C.P ' + m1(d) + '개월' + (cs > a.s + 0.01 ? ' (앞 ' + m1(cs - a.s) + '개월은 앞 공종과 병행)' : '') : ' · Non-C.P (병행)') + (a.basis ? '\n' + a.basis : '')) + '</title>';
      if (cp) {
        if (cs > a.s + 0.01) s += Rc(x0, mid - bh / 2, xc - x0, bh, 'url(#o7g-pre)', ' rx="4" stroke="var(--cp)" stroke-opacity=".5" stroke-width=".9" stroke-dasharray="3 2"');
        if (x1 - xc > 0.6) s += Rc(xc, mid - bh / 2, x1 - xc, bh, 'var(--cp)', ' rx="4"');
        if (d >= 0.05) s += (x1 - xc > 38) ? T(xc + (x1 - xc) / 2, mid + 4.2, m1(d), { a: 'middle', fs: 12, w: 600, c: '#fff', cls: 'n' }) : T(x1 + 6, mid + 4.2, m1(d), { fs: 12, w: 600, c: 'var(--cp-deep)', cls: 'n' });
      } else {
        s += Rc(x0, mid - bh / 2, x1 - x0, bh, 'var(--slate-2)', ' rx="4"');
        s += (x1 - x0 > 38) ? T((x0 + x1) / 2, mid + 4.2, m1(d), { a: 'middle', fs: 11.5, c: 'var(--ink-2)', cls: 'n' }) : T(x1 + 6, mid + 4.2, m1(d), { fs: 11.5, c: 'var(--ink-3)', cls: 'n' });
      }
      s += '</g>';
    });
    /* C.P 연결선 : 한 C.P 공종이 끝나는 지점에서 다음 C.P 공종으로 */
    var parts = R.cpLine.filter(function (c) { return c.d > 0.005 && rowOf[c.id] != null; });
    parts.forEach(function (c, i) {
      if (i === parts.length - 1) return;
      var nx = parts[i + 1], ra = rowOf[c.id], rb = rowOf[nx.id], xe = X(c.e), ya = top + ra * rh + rh / 2, yb = top + rb * rh + rh / 2, dn = rb > ra ? 1 : -1;
      var y0 = ya + dn * bh / 2, y1 = yb - dn * bh / 2, ns = X(Math.max(c.e, nx.e - nx.d));
      fg += '<path d="M' + r1(xe) + ' ' + r1(y0) + 'V' + r1(y1) + (Math.abs(ns - xe) > 1 ? 'H' + r1(ns) : '') + '" fill="none" stroke="var(--cp-deep)" stroke-width="1.4"/>';
      fg += '<circle cx="' + r1(xe) + '" cy="' + r1(y0) + '" r="2.4" fill="#fff" stroke="var(--cp-deep)" stroke-width="1.3"/>';
    });
    var ms = GK.milestones(R), yb0 = top + rowsH, lev = [-1e9, -1e9];
    ms.forEach(function (mm, i) {
      var x = X(mm.m), end = mm.k === '준공', col = end ? 'var(--cp)' : 'var(--navy)';
      fg += Ln(x, top - 4, x, yb0 + 8, col, 1, '3 3', ' opacity=".6"');
      fg += '<path d="M' + r1(x) + ' ' + r1(yb0 + 6) + 'l6.5 6.5-6.5 6.5-6.5-6.5z" fill="' + col + '"/>';
      var lab = mm.k + ' ' + (st ? GK.ym(GK.addM(st, mm.m)) : 'M+' + m1(mm.m)), w = tw(lab, 12.5), last = i === ms.length - 1;
      var L0 = last ? x - w : x - w / 2, lv = L0 < lev[0] + 10 ? (L0 < lev[1] + 10 ? 0 : 1) : 0;
      lev[lv] = last ? x : x + w / 2;
      fg += T(x, yb0 + 38 + lv * 17, lab, { a: last ? 'end' : 'middle', fs: 12.5, w: 600, c: end ? 'var(--cp-deep)' : 'var(--ink-2)' });
    });
    var H = top + rowsH + 70;
    return svgEl(W, H, defs + bg + s + fg, 'Master Schedule 바차트 · 총 ' + m1(R.total) + '개월');
  }
  function renderGantt(R) {
    var el = $('#gantt'); el.innerHTML = gantt(R, el.clientWidth || 900); widths.gantt = el.clientWidth;
    $('#g-sub').textContent = GK.SEQ_N[R.basic.seq] + ' · C.P ' + GK.cpParts(R).length + '개 공종 · ' + (R.inp.start ? GK.ym(GK.addM(R.inp.start, 0)) + ' 착공' : 'M+ = 착공 후 개월');
    var parts = GK.cpParts(R);
    $('#cpf').innerHTML = '<span class="k">C.P 산식</span>' + parts.map(function (p) { return '<span class="t">' + esc(p.label) + '<b>' + m1(p.d) + '</b></span>'; }).join('<span class="op">+</span>') + '<span class="op">=</span><span class="sum">' + m2(R.total) + '개월</span>';
    $('#g-lg').innerHTML = '<span><i style="background:var(--cp)"></i>C.P (주공정)</span><span><i style="background:repeating-linear-gradient(-45deg,#F6D9D5 0 3px,#FCEFED 3px 6px);box-shadow:inset 0 0 0 1px rgba(209,56,44,.45)"></i>앞 공종과 병행 (Non-C.P)</span><span><i style="background:var(--slate-2)"></i>Non-C.P 공종</span>' +
      '<span><svg width="20" height="14" aria-hidden="true"><path d="M4 2V12H16" fill="none" stroke="var(--cp-deep)" stroke-width="1.4"/><circle cx="4" cy="2.5" r="2" fill="#fff" stroke="var(--cp-deep)"/></svg>C.P 연결선</span><span><svg width="14" height="14" aria-hidden="true"><path d="M7 1l6 6-6 6-6-6z" fill="var(--navy)"/></svg>마일스톤</span><span>막대 숫자 = C.P 기여 개월</span>';
  }

  /* ───────── 가정 단면 : 입면 일러스트 + 정확한 치수 (층고 칸 = input[data-floor-h]) */
  /* 흙막이 길이 : qty 의 L 값 전부 — CIP 는 '444공 (L≈25m) + 엄지말뚝 148공 (L≈41.6m, 암반 근입)' 처럼 벽체 · 엄지말뚝 두 길이 */
  function wallInfo(o) {
    if (!o || !o.qty) return null;
    var Ls = [], re = /L≈([\d.]+)m/g, m;
    while ((m = re.exec(o.qty))) Ls.push(+m[1]);
    if (!Ls.length) return null;
    var thumb = /엄지말뚝/.test(o.qty) && Ls.length > 1 ? Ls[Ls.length - 1] : 0;
    var nm = /^([\d,]+)(공|본|매|㎡)/.exec(o.qty), nt = /엄지말뚝 ([\d,]+)공/.exec(o.qty);
    return { main: Ls[0], thumb: thumb, max: Math.max.apply(null, Ls), n: nm ? nm[1] + nm[2] : '', nT: nt ? nt[1] + '공' : '' };
  }
  /* want = 원하는 도면 높이 (벤토 오른쪽 열과 높이를 맞출 때) — 세로 비율을 키워 다시 그린다 (줄이지는 않음).
     단면이 길어지지 않게 기본 높이는 낮게, 옆 열에 맞춰 늘리는 것도 SEC_GROW 배까지만 */
  var SEC_GROW = 1.15;
  function secT0(Wc) { return Wc < 600 ? 520 : 600; }
  function section(R, Wc, want) {
    var T0 = secT0(Wc), res = sectionAt(R, Wc, T0);
    if (!want || res.Ht >= want - 14) return res;
    var lo = T0, hi = T0 * SEC_GROW;
    for (var it = 0; it < 8; it++) {
      var md = (lo + hi) / 2, nx = sectionAt(R, Wc, md);
      if (nx.Ht <= want) { res = nx; lo = md; if (want - nx.Ht < 14) break; } else hi = md;
    }
    return res;
  }
  function sectionAt(R, Wc, TT) {
    var W = Math.max(300, Math.floor(Wc)), nar = W < 600;
    var g = R.geo, b = R.basic, fr = R.frame, G = GK.secLevels(R), TD = b.seq === 'TD';
    var below = {}; if (TD) R.tdBase.st.forEach(function (lv) { below[lv] = 1; }); else for (var k0 = 1; k0 <= b.nB; k0++) below['B' + k0] = 1;
    /* 모바일 : 오른쪽은 층 이름만 (층고 칸 · 타설은 도면 아래 표) → 도면이 전체 폭을 쓴다 */
    var LC = nar ? 46 : 96, RW = nar ? 48 : 236, X0 = LC + (nar ? 8 : 18), X1 = W - RW - (nar ? 6 : 24), top = nar ? 26 : 40;
    var Lm = function (A) { return Math.sqrt(Math.max(0, A || 0) * 1.6); };
    var Lup = Lm(fr.Atyp > 0 ? fr.Atyp : g.bldg) || 30, Lb = b.nB > 0 ? (Lm(g.AdnEff) || Lup) : 0, Lx = b.nB > 0 ? (Lm(g.Adeep) || Lb) : 0;
    var Lf = Lm(R.found.Af > 0 ? R.found.Af : g.bldg) || Math.max(Lup, Lb);
    var open = b.sup === 'OPEN' && b.nB > 0, partial = !!g.partial && b.nB > 0, slope = open ? g.slopeW : 0;
    var nsup = R.exc && R.exc.ns > 0 ? R.exc.ns : 0, anc = b.nB > 0 && b.sup === 'ANCHOR' && nsup > 0, aPx = anc ? (nar ? 20 : 44) : 0;
    var spanM = partial ? Math.max(Lf + slope, Lup) : Math.max(Lup, Lx + 2 * slope, Lf, Lb);
    var hs = Math.max(0.05, (X1 - X0 - 2 * aPx - 8) / Math.max(spanM, 1));
    var mid = (X0 + X1) / 2, cx, fL, fR, bL, bR, eL, eR;
    if (partial) { var totW = (Lf + slope) * hs; fL = mid - totW / 2 + slope * hs; cx = fL + Lf * hs / 2; fR = fL + Lf * hs; eL = fL; eR = fL + Lx * hs; bL = eL + (Lx - Lb) * hs / 2; bR = bL + Lb * hs; }
    else { cx = mid; fL = cx - Lf * hs / 2; fR = cx + Lf * hs / 2; bL = cx - Lb * hs / 2; bR = cx + Lb * hs / 2; eL = cx - Lx * hs / 2; eR = cx + Lx * hs / 2; }
    var tL = cx - Lup * hs / 2, tR = cx + Lup * hs / 2, hasCore = fr.coreRows.length > 0 || !!fr.dc, sl = slope * hs;
    /* 세로 : 층고 비례 (묶음 층은 최대 2.4개층 높이로 압축), 지하 · 지층은 같은 비율 */
    var rows = G.map(function (gr) { return { gr: gr, bl: !!below[gr.items[0].lv], vis: gr.h * (gr.cnt > 1 ? Math.min(gr.cnt, 2.4) : 1) }; });
    var visUp = 0, dB = 0; rows.forEach(function (r) { if (r.bl) dB += r.gr.h * r.gr.cnt; else visUp += r.vis; });
    var matTop, matBot, Hx = b.nB > 0 ? g.H : g.Hs;
    if (b.nB > 0) { matTop = dB; matBot = dB + g.tMat; } else { matBot = Math.max(g.Hs, 0.8); matTop = Math.max(0, matBot - g.tMat); }
    var pile = R.pile, pTip = 0, pTr = false, pRock = false;
    if (pile) { if (g.wrockTop > matBot + 2) { pTip = Math.min(g.wrockTop, matBot + 24); pTr = g.wrockTop > matBot + 24; pRock = true; } else pTip = matBot + 6; }
    var prdL = R.PRD ? Math.min(R.PRD.L, Hx + 6) : 0;
    var wi = b.nB > 0 && !open ? wallInfo(R.wall) : null, si = R.scw && b.nB > 0 ? wallInfo(R.scw) : null;
    var maxD = Math.max(Hx, matBot, pTip, prdL, wi ? wi.max + 1.5 : 0, si ? si.main + 1 : 0, isFinite(g.gwl) ? g.gwl + 1 : 0) + (nar ? 3.5 : 4.5);
    /* 세로 과장 상한 : 가로 축척의 5배 (모바일 6배) — 넓고 낮은 건물이 탑처럼 보이지 않게. 층 행 최소 높이만 예외 */
    var vTot = Math.max(1, visUp + maxD), kCap = nar ? Math.max(4, Math.min(16, hs * 6)) : Math.max(5, Math.min(22, hs * 5));
    var k = Math.max(nar ? 3.5 : 5, Math.min(kCap, TT / vTot)), MINR = nar ? 22 : 30;
    var y = top + 14;
    rows.forEach(function (r) { r.hp = Math.max(MINR, r.vis * k); r.y0 = y; y += r.hp; r.y1 = y; });
    var yGL = top + 14; rows.forEach(function (r) { if (!r.bl) yGL = r.y1; });
    var pts = [[0, yGL]], dd = 0; rows.forEach(function (r) { if (r.bl) { dd += r.gr.h * r.gr.cnt; pts.push([dd, r.y1]); } });
    function yd(d) {
      for (var i = 1; i < pts.length; i++) if (d <= pts[i][0] + 1e-9) return pts[i - 1][1] + (d - pts[i - 1][0]) / Math.max(1e-6, pts[i][0] - pts[i - 1][0]) * (pts[i][1] - pts[i - 1][1]);
      var lp = pts[pts.length - 1]; return lp[1] + (d - lp[0]) * k;
    }
    var yBot = yd(maxD), Ht = Math.ceil(yBot + (nar ? 40 : 46)), yH = yd(Hx);
    /* EL (층 바닥 높이) */
    var el = 0, rev = rows.filter(function (r) { return !r.bl; }).reverse();
    rev.forEach(function (r) { r.elB = el; el += r.gr.h * r.gr.cnt; r.elT = el; });
    var elTop = el; dd = 0; rows.forEach(function (r) { if (r.bl) { r.dT = dd; dd += r.gr.h * r.gr.cnt; r.dB = dd; } });
    var s = '', id = 'o7s', notes = [], gwlLab = '', logYs = [];
    function note(t, c, x, yy) { notes.push({ t: t, c: c, x: x, y: yy }); }
    s += '<defs>' +
      pat(id + '-soil', 7, '<circle cx="2" cy="2" r=".75" fill="#9C8456" opacity=".5"/><circle cx="5.5" cy="5.2" r=".6" fill="#9C8456" opacity=".42"/>') +
      pat(id + '-wsoil', 9, '<circle cx="2" cy="3" r=".8" fill="#8F7344" opacity=".45"/><path d="M5 7h2.6" stroke="#8F7344" stroke-width=".8" opacity=".5"/>') +
      pat(id + '-wrock', 10, '<path d="M1 8l3.2-3.2M6 9.5l3-3" stroke="#836A42" stroke-width=".9" opacity=".5"/>') +
      pat(id + '-srock', 8, '<path d="M-1 9L9 -1" stroke="#646B73" stroke-width=".8" opacity=".5"/>') +
      pat(id + '-hrock', 8, '<path d="M-1 9L9 -1M-1 -1l10 10" stroke="#4A5058" stroke-width=".75" opacity=".5"/>') +
      pat(id + '-conc', 5, '<path d="M-1 6L6 -1" stroke="#7D8594" stroke-width=".8"/>', '#E4E7EC') +
      pat(id + '-mat', 11, '<circle cx="2.5" cy="3" r=".95" fill="#8A929F"/><circle cx="7.5" cy="8" r=".75" fill="#8A929F"/><path d="M7 2.4l1.6 1.1M2 8.4l1.2-.8" stroke="#8A929F" stroke-width=".7"/>', '#DCE0E6') +
      pat(id + '-glass', 9, '<path d="M0.5 0V9" stroke="#D4DCE7" stroke-width="1"/>', '#F3F6FA') +
      pat(id + '-fill', 7, '<path d="M-1 8L8 -1" stroke="#B19867" stroke-width=".7" opacity=".55"/>', '#F3ECDD') +
      '<linearGradient id="' + id + '-fd" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".05" stop-color="#fff"/><stop offset=".95" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<mask id="' + id + '-mk"><rect x="' + r1(X0 - 8) + '" y="0" width="' + r1(X1 - X0 + 16) + '" height="' + Ht + '" fill="url(#' + id + '-fd)"/></mask>' +
      '</defs>';
    /* 지층 (GL 아래 전폭, 가장자리 흐리게) + 왼쪽 주상도 막대 */
    var strata = '', log = '';
    for (var i = 0; i < 5; i++) {
      var za = g.z[i], zc = Math.min(g.z[i + 1], maxD); if (!(zc > za)) continue;
      var ya = yd(za), yc = yd(zc);
      strata += Rc(X0 - 8, ya, X1 - X0 + 16, yc - ya, 'var(--' + LKS[i] + ')', ' opacity=".6"') + Rc(X0 - 8, ya, X1 - X0 + 16, yc - ya, 'url(#' + id + '-' + LKS[i] + ')');
      log += Rc(LC - 14, ya, 10, yc - ya, 'var(--' + LKS[i] + ')') + Rc(LC - 14, ya, 10, yc - ya, 'url(#' + id + '-' + LKS[i] + ')');
      if (yc - ya >= 14) logYs.push({ y: ya + 13, p: 1, s: T(LC - 19, ya + 13, LNM[i], { a: 'end', fs: nar ? 10.5 : 12, w: 500, c: 'var(--ink-2)' }) });
      if (!nar && yc - ya >= 30 && isFinite(g.z[i + 1]) && g.z[i + 1] <= maxD) logYs.push({ y: yc - 5, p: 0, s: T(LC - 19, yc - 5, '−' + r1(g.z[i + 1]), { a: 'end', fs: 11, c: 'var(--ink-3)', cls: 'n' }) });
    }
    s += '<g mask="url(#' + id + '-mk)">' + strata + '</g>';
    log += Rc(LC - 14.5, yGL, 11, yBot - yGL, 'none', ' stroke="var(--ink-3)" stroke-width=".8"');
    log += T(LC - 9, yGL - 7, R.ground.assumed ? '지층 · 가정' : '지층', { a: 'middle', fs: 11, w: 600, c: R.ground.assumed ? 'var(--warn)' : 'var(--ink-3)' });
    /* 굴착 (비운 공간) · 오픈컷 사면 · 되메우기 */
    if (b.nB > 0) {
      var pit = open ? 'M' + r1(eL - sl) + ' ' + r1(yGL) + 'L' + r1(eL) + ' ' + r1(yH) + 'L' + r1(eR) + ' ' + r1(yH) + 'L' + r1(eR + sl) + ' ' + r1(yGL) + 'Z' : 'M' + r1(eL) + ' ' + r1(yGL) + 'H' + r1(eR) + 'V' + r1(yH) + 'H' + r1(eL) + 'Z';
      s += '<path d="' + pit + '" fill="#FBFBFA"/>';
      if (open) {
        s += Pg([[eL - sl, yGL], [eL, yH], [bL, yH], [bL, yGL]], ' fill="url(#' + id + '-fill)"') + Pg([[bR, yGL], [bR, yH], [eR, yH], [eR + sl, yGL]], ' fill="url(#' + id + '-fill)"');
        s += '<path d="M' + r1(eL - sl) + ' ' + r1(yGL) + 'L' + r1(eL) + ' ' + r1(yH) + 'M' + r1(eR) + ' ' + r1(yH) + 'L' + r1(eR + sl) + ' ' + r1(yGL) + '" stroke="var(--ink-2)" stroke-width="1.6" fill="none"/>';
        note('오픈컷 1:' + LIB.exc.slope + ' · 사면 폭 ' + r1(g.slopeW) + 'm · 외벽 · 방수 후 되메우기', 'var(--ink)', eL - sl / 2 - 11, (yGL + yH) / 2);
      }
    }
    /* 지하수위 (굴착 바깥) */
    if (isFinite(g.gwl) && g.gwl < maxD) {
      var yw = yd(g.gwl), segs = [];
      if (b.nB > 0 && g.gwl < Hx) {
        var fy = (yw - yGL) / Math.max(1, yH - yGL), sl2 = sl * (1 - fy), pa = open ? eL - sl2 : eL - 7, pb = open ? eR + sl2 : eR + 7;
        if (pa > X0 - 8) segs.push([X0 - 8, pa]); if (pb < X1 + 8) segs.push([pb, X1 + 8]);
      } else segs.push([X0 - 8, X1 + 8]);
      segs.forEach(function (q) { s += Ln(q[0], yw, q[1], yw, 'var(--gwl)', 1.4, '8 4'); });
      /* 수위 표시 : 굴착 바깥 오른쪽 → 왼쪽 → (둘 다 좁으면) 주상도 막대 옆 */
      var gT = '지하수위 GL−' + r1(g.gwl), gNeed = tw(gT, 11.5) + 36, sR = segs[segs.length - 1], sLf = segs[0];
      var sym = function (x) { return '<path d="M' + r1(x - 6) + ' ' + r1(yw - 11) + 'h12l-6 9z" fill="var(--gwl)" stroke="#fff" stroke-width="1"/>' + Ln(x - 4, yw + 3, x + 4, yw + 3, 'var(--gwl)', 1.2) + Ln(x - 2, yw + 6, x + 2, yw + 6, 'var(--gwl)', 1.2); };
      if (sR && sR[1] - sR[0] >= gNeed && sR[0] > cx) gwlLab = sym(X1 - 8) + T(X1 - 19, yw - 4, gT, { a: 'end', fs: 11.5, w: 700, c: 'var(--gwl)', halo: true });
      else if (sLf && sLf[1] - sLf[0] >= gNeed) gwlLab = sym(X0 + 8) + T(X0 + 19, yw - 4, gT, { fs: 11.5, w: 700, c: 'var(--gwl)', halo: true });
      else {
        /* 주상도 막대 옆 : 겹치는 깊이 숫자 (보조) 는 빼고, 지층 이름과도 겹치면 이름 쪽을 뺀다 */
        var cand = [yw - 4, yw + 15, yw - 17, yw + 28], gy = null, free = function (y, pmin) { return logYs.every(function (L) { return L.p < pmin || Math.abs(L.y - y) >= 13; }); };
        for (var ci = 0; ci < cand.length && gy == null; ci++) if (free(cand[ci], 0)) gy = cand[ci];
        for (ci = 0; ci < cand.length && gy == null; ci++) if (free(cand[ci], 1)) gy = cand[ci];
        if (gy == null) gy = cand[0];
        logYs = logYs.filter(function (L) { return Math.abs(L.y - gy) >= 13; });
        gwlLab = '<path d="M' + r1(LC - 15) + ' ' + r1(yw - 5) + 'h12l-6 8z" fill="var(--gwl)" stroke="#fff" stroke-width="1"/>' + T(LC - 19, gy, (nar ? '' : '수위 ') + '−' + r1(g.gwl), { a: 'end', fs: 11.5, w: 700, c: 'var(--gwl)', halo: true, cls: 'n' });
      }
    }
    /* 흙막이 벽체 · 어스앵커 */
    var ww = nar ? 3.5 : 5;
    if (b.nB > 0 && !open) {
      /* 벽체 (CIP 등) = 굵은 막대, 그 아래 엄지말뚝 (H형강) 근입부 = 점선 윤곽 + 가는 강재 */
      var Dw = wi ? wi.main : Hx + 3, Dt = wi && wi.thumb > Dw + 0.05 ? wi.thumb : 0, Dtip = Dt || Dw, yW = yd(Dw), yTip = yd(Dtip);
      s += Rc(eL - ww, yGL - 6, ww, yW - yGL + 6, 'var(--ink-2)', ' rx="1"') + Rc(eR, yGL - 6, ww, yW - yGL + 6, 'var(--ink-2)', ' rx="1"');
      if (Dt) {
        [eL - ww, eR].forEach(function (xw) {
          var hw = Math.max(1.6, ww * 0.42), xc = xw + ww / 2;
          s += Rc(xw, yW, ww, yTip - yW, '#fff', ' stroke="var(--ink-2)" stroke-width=".9" stroke-dasharray="3 2.5"');
          s += Rc(xc - hw / 2, yW - 1, hw, yTip - yW + 1, 'var(--steel)') + Ln(xw - 1, yTip, xw + ww + 1, yTip, 'var(--steel)', 1.6);
        });
        s += Ln(eL - ww - 3, yW, eL + 3, yW, 'var(--ink)', 1.2) + Ln(eR - 3, yW, eR + ww + 3, yW, 'var(--ink)', 1.2);
      }
      var emb = Dtip - Hx, rk = Dtip > g.rockTop + 0.01 ? '암반' : (Dtip > g.wrockTop + 0.01 ? '풍화암' : '');
      /* 근입 치수 (오른쪽 벽 바깥) */
      if (emb > 0.05 && yTip - yH >= 7) {
        var xd = eR + ww + (anc ? 7 : 9);
        s += Ln(xd, yH, xd, yTip, 'var(--ink-2)', 1) + Ln(xd - 3, yH, xd + 3, yH, 'var(--ink-2)', 1) + Ln(xd - 3, yTip, xd + 3, yTip, 'var(--ink-2)', 1);
        s += T(xd + 6, (yH + yTip) / 2 + 4, '근입 ' + r1(emb) + 'm' + (rk && !nar ? ' (' + rk + ')' : ''), { fs: nar ? 10.5 : 11.5, w: 600, c: 'var(--ink)', halo: true });
      }
      note('흙막이 ' + (GE.WALL_N[b.wall] || b.wall) + ' L≈' + r1(Dw) + 'm' + (wi && wi.n ? ' (' + wi.n + ')' : '') + (Dt ? ' + 엄지말뚝 L≈' + r1(Dt) + 'm' + (wi.nT ? ' (' + wi.nT + ')' : '') : '') +
        (emb > 0.05 ? ' · 굴착 아래 근입 ' + r1(emb) + 'm' + (rk ? ' (' + rk + ')' : '') : ' · 근입 없음 (확인)') + (R.wall ? ' · ' + R.wall.sets + '조' : ''), 'var(--ink)', eL - ww / 2, Math.max(yGL + 30, yW - 14));
      if (anc) {
        var spA = LIB.support.ANCHOR.sp, dy = aPx * 0.36;
        for (var q = 0; q < nsup; q++) {
          var yq = yd(Math.min(Hx - 0.5, 1.5 + q * spA));
          s += Ln(eL - ww, yq, eL - ww - aPx, yq + dy, 'var(--cp)', 1.2) + Ln(eL - ww - aPx * 0.5, yq + dy * 0.5, eL - ww - aPx, yq + dy, 'var(--cp)', 3.2, null, ' stroke-linecap="round" opacity=".85"');
          s += Ln(eR + ww, yq, eR + ww + aPx, yq + dy, 'var(--cp)', 1.2) + Ln(eR + ww + aPx * 0.5, yq + dy * 0.5, eR + ww + aPx, yq + dy, 'var(--cp)', 3.2, null, ' stroke-linecap="round" opacity=".85"');
          s += Rc(eL - ww - 2.5, yq - 2, 3, 4, 'var(--cp)') + Rc(eR + ww - 0.5, yq - 2, 3, 4, 'var(--cp)');
        }
        note('어스앵커 ' + nsup + '단 · 첫 단 GL−1.5m · 간격 ' + spA + 'm' + (R.exc.anchor ? ' · 총 ' + fmt(R.exc.anchor.total) + '본 (' + R.exc.anchor.sets + '조)' : ''), 'var(--cp-deep)', Math.max(X0, eL - ww - aPx - 10), yd(1.5) + dy + 4);
      }
    }
    if (si) {
      /* 차수 SCW : 굴착 외곽 둘레 (부분 지하면 얕은 기초 구간까지 감싼 외곽) */
      var Dc = si.main, yS = yd(Math.min(Dc, maxD - 0.5)), xa = eL - sl - 8, xb = (partial ? Math.max(fR, eR + sl) : eR + sl) + 5;
      s += Rc(xa, yGL - 5, 3, yS - yGL + 5, 'var(--steel)') + Rc(xb, yGL - 5, 3, yS - yGL + 5, 'var(--steel)');
      note('차수 SCW · L≈' + r1(Dc) + 'm · ' + (partial ? '굴착 · 얕은 기초 구간 외곽 둘레' : '굴착 외곽 둘레'), 'var(--steel)', xa + 1.5, yS - 12);
    }
    /* 지하층 */
    rows.forEach(function (r) {
      if (!r.bl) return;
      var x0 = bL, x1 = bR, wt = nar ? 3.5 : 5, gr = r.gr;
      s += Rc(x0, r.y0, x1 - x0, r.hp, '#F3F4F6') + Rc(x0, r.y0, wt, r.hp, 'url(#' + id + '-conc)') + Rc(x1 - wt, r.y0, wt, r.hp, 'url(#' + id + '-conc)');
      if (!R.PRD) { var nCl = Math.max(2, Math.min(9, Math.round((x1 - x0) / 46))); for (var cl = 1; cl < nCl; cl++) { var xcl = x0 + (x1 - x0) * cl / nCl; s += Rc(xcl - 1.5, r.y0, 3, r.hp, '#DCE1E8'); } }
      s += Ln(x0, r.y0, x0, r.y1, 'var(--ink-2)', 0.9) + Ln(x1, r.y0, x1, r.y1, 'var(--ink-2)', 0.9) + Ln(x0 - 1, r.y0, x1 + 1, r.y0, 'var(--ink)', 2.2);
      if (gr.n > 1) for (var j = 1; j < gr.n; j++) { var yj = r.y0 + r.hp * j / gr.n; s += Ln(x0 - 3, yj, x0 + wt + 3, yj, 'var(--cp)', 1.6) + Ln(x1 - wt - 3, yj, x1 + 3, yj, 'var(--cp)', 1.6); }
      if (x1 - x0 > 70) s += T(x0 + wt + 6, r.y1 - 6, '−' + r1(r.dB), { fs: 11, c: 'var(--ink-3)', cls: 'n', halo: '#F3F4F6' });
    });
    /* 가설 지보 (지하층 위에 겹쳐) : 스트럿 · 레이커 · 역타 PRD */
    if (b.nB > 0 && !open && nsup > 0 && (b.sup === 'STRUT' || b.sup === 'RAKER')) {
      var spS = LIB.support[b.sup].sp;
      for (var q2 = 0; q2 < nsup; q2++) {
        var yq2 = yd(Math.min(Hx - 0.5, 1.5 + q2 * spS));
        if (b.sup === 'STRUT') s += Ln(eL, yq2, eR, yq2, 'var(--cp)', 1.7, '9 3', ' opacity=".85"') + Rc(eL, yq2 - 3, 6, 6, 'var(--cp)') + Rc(eR - 6, yq2 - 3, 6, 6, 'var(--cp)');
        else { var run = Math.min((yH - yq2) * 0.9, (eR - eL) * 0.3); s += Ln(eL, yq2, eL + run, yH, 'var(--cp)', 1.8, null, ' opacity=".85"') + Ln(eR, yq2, eR - run, yH, 'var(--cp)', 1.8, null, ' opacity=".85"'); }
      }
      note((b.sup === 'STRUT' ? '스트럿 (버팀보) ' : '레이커 ') + nsup + '단 · 첫 단 GL−1.5m · 간격 ' + spS + 'm', 'var(--cp-deep)', b.sup === 'STRUT' ? cx : eL + 16, yd(1.5) + (b.sup === 'STRUT' ? 0 : 14));
    }
    if (TD && b.nB > 0) note('역타 : 지하 슬래브가 지보 · 기준층 ' + R.tdBase.name + ' 슬래브 선타설 → 아래로 굴착 · 슬래브 반복', 'var(--cp-deep)', bL + (bR - bL) / Math.max(3, Math.min(7, Math.round((bR - bL) / 34))), yGL + 17);
    if (R.PRD && b.nB > 0) {
      var nC = Math.max(3, Math.min(7, Math.round((bR - bL) / 34))), yP = yd(prdL), xp0 = 0;
      for (var c = 0; c < nC; c++) { var xp = bL + (bR - bL) * (c + 0.5) / nC; if (!c) xp0 = xp; s += Ln(xp, yGL, xp, yP, '#6E7A8D', 2, null, ' opacity=".75"') + Rc(xp - 3, yP - 1, 6, 4, '#6E7A8D'); }
      note('PRD · SPS 기둥 ' + R.PRD.n + '공 · L≈' + r1(R.PRD.L) + 'm (굴착 전 선시공)', 'var(--steel)', xp0 - 12, yP + 4);
    }
    /* 기초 매트 · 얕은 기초 · 파일 */
    var mL = partial ? bL : fL, mR = partial ? bR : fR, yMt = yd(matTop), yMb = yd(matBot);
    if (!partial && b.nB > 0) { mL = Math.max(fL, eL); mR = Math.min(fR, eR); }
    s += Rc(mL, yMt, mR - mL, Math.max(3, yMb - yMt), 'url(#' + id + '-mat)', ' stroke="var(--ink-2)" stroke-width=".9"');
    var matLab = '매트 t=' + r1(g.tMat) + 'm';
    if (yMb - yMt >= 15 && mR - mL > tw(matLab, 11.5) + 12) s += T((mL + mR) / 2, (yMt + yMb) / 2 + 4, matLab, { a: 'middle', fs: 11.5, w: 700, c: 'var(--ink)', halo: '#DCE0E6' });
    else note('기초 매트 t=' + r1(g.tMat) + 'm', 'var(--ink)', mL + Math.min(34, (mR - mL) * 0.18), (yMt + yMb) / 2);
    var yShB = 0;
    if (partial) { yShB = yd(g.Hs); s += Rc(bR, yGL + 1, fR - bR, Math.max(3, yShB - yGL - 1), 'url(#' + id + '-mat)', ' stroke="var(--ink-2)" stroke-width=".9"'); note('얕은 기초 (지하 없는 구간) · GL−' + r1(g.Hs) + 'm', 'var(--ink)', bR + (fR - bR) * 0.5, (yGL + yShB) / 2); }
    if (pile) {
      var piles = function (a, bnd, yA) { var np = Math.max(4, Math.min(18, Math.round((bnd - a) / 13))), o = ''; for (var p = 0; p < np; p++) { var xq = a + 6 + (bnd - a - 12) * (np > 1 ? p / (np - 1) : 0.5); o += Ln(xq, yA, xq, yd(pTip), '#7E8796', 1.1) + Ln(xq - 2, yd(pTip) - 3, xq, yd(pTip), '#7E8796', 1) + Ln(xq + 2, yd(pTip) - 3, xq, yd(pTip), '#7E8796', 1); } return o; };
      s += piles(mL, mR, yMb); if (partial) s += piles(bR + 4, fR, yShB);
      if (pTr) { var yt = yd(pTip) - 10; s += '<path d="M' + r1(mL) + ' ' + r1(yt) + 'h' + r1((partial ? fR : mR) - mL) + '" stroke="#fff" stroke-width="6"/><path d="M' + r1(mL) + ' ' + r1(yt - 3) + 'h' + r1((partial ? fR : mR) - mL) + 'M' + r1(mL) + ' ' + r1(yt + 3) + 'h' + r1((partial ? fR : mR) - mL) + '" stroke="var(--ink-3)" stroke-width=".8"/>'; }
      s += T((mL + (partial ? fR : mR)) / 2, yd(pTip) + 17, (R.fType === 'PHC' ? 'PHC 파일 ' : '현장타설말뚝 ') + fmt(pile.n) + '본' + (pRock ? ' · 지지층 풍화암 GL−' + r1(g.wrockTop) + 'm' : ''), { a: 'middle', fs: 12, w: 600, c: 'var(--ink)', halo: true });
    }
    /* 굴착선 */
    if (b.nB > 0) {
      s += Ln(eL - 10, yH, eR + 10, yH, 'var(--cp)', 1.5, '6 3');
      s += T(partial ? (eL + eR) / 2 : cx, yH + 17, '굴착 GL−' + r1(Hx) + 'm', { a: 'middle', fs: 12.5, w: 700, c: 'var(--cp-deep)', halo: true });
    } else {
      s += Ln(fL - 6, yd(matBot), fR + 6, yd(matBot), 'var(--cp)', 1.3, '6 3');
      s += T(cx, yd(matBot) + 17, '지하층 없음 · 기초 터파기 GL−' + r1(Hx || matBot) + 'm', { a: 'middle', fs: 12, w: 700, c: 'var(--cp-deep)', halo: true });
    }
    /* 지상층 (입면) */
    var up = '', elL = '';
    rows.forEach(function (r, gi) {
      if (r.bl) return;
      var gr = r.gr, isPH = gr.kind === 'ph', w = isPH ? Math.max(26, (tR - tL) * 0.36) : (gr.kind === 'b' ? bR - bL : tR - tL), x = cx - w / 2;
      r.xr = x + w;
      up += Rc(x, r.y0, w, r.hp, 'url(#' + id + '-glass)');
      var cw = hasCore ? Math.max(8, Math.min(w, (tR - tL) * 0.2)) : 0;
      if (cw) up += Rc(cx - cw / 2, r.y0, cw, r.hp, '#E2E7EE') + Ln(cx - cw / 2, r.y0, cx - cw / 2, r.y1, '#A9B4C3', 0.8) + Ln(cx + cw / 2, r.y0, cx + cw / 2, r.y1, '#A9B4C3', 0.8);
      var segN = gr.cnt > 1 ? Math.min(gr.cnt, 6) : 1;
      for (var j = 1; j < segN; j++) { var yj = r.y0 + r.hp * j / segN; up += Ln(x, yj, x + w, yj, '#97A3B4', 0.9); }
      if (gr.n > 1) {
        var coreOnly = /^코어/.test(gr.p || '');
        for (var sg = 0; sg < segN; sg++) for (var jj = 1; jj < gr.n; jj++) {
          var yk = r.y0 + r.hp * (sg + jj / gr.n) / segN;
          up += coreOnly ? Ln(cx - cw / 2, yk, cx + cw / 2, yk, 'var(--cp)', 1.7, '4 2.5') : Ln(x + 1, yk, x + w - 1, yk, 'var(--cp)', 1.5, '6 3.5');
        }
      }
      up += Ln(x, r.y0, x, r.y1, 'var(--ink-2)', 1.2) + Ln(x + w, r.y0, x + w, r.y1, 'var(--ink-2)', 1.2);
      up += Ln(x - 1.5, r.y0, x + w + 1.5, r.y0, 'var(--ink)', gi === 0 ? 2.8 : 2.2) + Ln(x - 1.5, r.y1, x + w + 1.5, r.y1, 'var(--ink)', 2.2);
      if (gr.cnt > 1) {
        var ym = (r.y0 + r.y1) / 2, lab = '× ' + gr.cnt + '개층', lw = tw(lab, 11.5) + 18;
        up += '<path d="M' + r1(x - 5) + ' ' + r1(ym - 7) + 'l5 3.5-5 3.5 5 3.5M' + r1(x + w + 5) + ' ' + r1(ym - 7) + 'l-5 3.5 5 3.5-5 3.5" fill="none" stroke="var(--ink-2)" stroke-width="1.1"/>';
        if (w > lw + 8) up += Rc(cx - lw / 2, ym - 10, lw, 20, '#fff', ' rx="10" stroke="#C3CCD8"') + T(cx, ym + 4.2, lab, { a: 'middle', fs: 11.5, w: 600, c: 'var(--ink-2)', cls: 'n' });
      }
      var lx = Math.min(x, tL);
      if (lx - X0 >= 34) {
        if (r.elB > 0) elL += Ln(lx - 9, r.y1, lx - 3, r.y1, 'var(--ink-3)', 1) + T(lx - 12, r.y1 + 4, '+' + r1(r.elB), { a: 'end', fs: 11, c: 'var(--ink-3)', cls: 'n' });
        if (gi === 0) elL += T(lx - 12, r.y0 + 4, '+' + r1(r.elT), { a: 'end', fs: 11.5, w: 700, c: 'var(--ink)', cls: 'n' }) + Ln(lx - 9, r.y0, lx - 3, r.y0, 'var(--ink)', 1.2);
        if (lx < x - 4) { if (r.elB > 0) elL += Ln(lx - 2, r.y1, x - 3, r.y1, 'var(--slate-2)', 1, '1.5 2.5'); if (gi === 0) elL += Ln(lx - 2, r.y0, x - 3, r.y0, 'var(--slate)', 1, '1.5 2.5'); }
      }
    });
    s += up + elL + gwlLab;
    /* GL · 지표 기호 */
    s += Ln(X0 - 8, yGL, X1 + 8, yGL, 'var(--ink)', 1.7);
    var gh = '', gEndL = b.nB > 0 ? (open ? eL - sl - (R.scw ? 9 : 0) : eL - ww) - 3 : fL - 4, gStartR = b.nB > 0 ? (open ? (partial ? Math.max(fR, eR + sl) : eR + sl) + (R.scw ? 9 : 0) : eR + ww) + 3 : fR + 4;
    for (var hx = X0; hx < gEndL - 4; hx += 8) gh += 'M' + r1(hx + 5) + ' ' + r1(yGL + 1) + 'l-5 6';
    for (hx = gStartR; hx < X1; hx += 8) gh += 'M' + r1(hx + 5) + ' ' + r1(yGL + 1) + 'l-5 6';
    s += '<path d="' + gh + '" stroke="var(--ink-2)" stroke-width="1" fill="none"/>';
    s += T(LC - 4, yGL - 22, 'GL ±0', { a: 'end', fs: 12, w: 700, c: 'var(--ink)' });
    s += log + logYs.map(function (L) { return L.s; }).join('');
    /* 왼쪽 치수선 (넓은 화면) */
    function dimV(x, ya, yb, col, lab) {
      var o = Ln(x, ya, x, yb, col, 1) + Ln(x - 4, ya + 4, x + 4, ya - 4, col, 1.5) + Ln(x - 4, yb + 4, x + 4, yb - 4, col, 1.5) + Ln(x - 6, ya, x + 10, ya, col, 0.7) + Ln(x - 6, yb, x + 10, yb, col, 0.7);
      var my = (ya + yb) / 2; return o + T(x - 7, my, lab, { a: 'middle', fs: 12, w: 700, c: col, cls: 'n', tr: 'rotate(-90 ' + r1(x - 7) + ' ' + r1(my) + ')' });
    }
    if (!nar) {
      s += dimV(22, rows[0].y0, yGL, 'var(--ink-2)', '높이 ' + r1(elTop) + 'm');
      if (b.nB > 0 && yH - yGL > 60) s += dimV(22, yGL, yH, 'var(--cp-deep)', '굴착 ' + r1(Hx) + 'm');
    }
    /* 주석 번호 (도면 키노트) */
    notes.forEach(function (n, i) {
      var nx = Math.max(10, Math.min(W - RW - 10, n.x)), ny = Math.max(10, Math.min(Ht - 10, n.y));
      s += '<circle cx="' + r1(nx) + '" cy="' + r1(ny) + '" r="9" fill="' + n.c + '" stroke="#fff" stroke-width="2"/>' + T(nx, ny + 4, String(i + 1), { a: 'middle', fs: 11, w: 700, c: '#fff', cls: 'n' });
    });
    /* 오른쪽 : 층 · 층고 칸 · 타설 */
    var RX = W - RW, cLab = RX + (nar ? 4 : 8), cIn = RX + 92, wIn = 64, cP = RX + 166, wP = 66, html = '', lst = '';
    if (!nar) s += T(cLab, top + 2, '층', { fs: 12, c: 'var(--ink-3)' }) + T(cIn + wIn, top + 2, '층고 (m)', { a: 'end', fs: 12, c: 'var(--ink-3)' }) + T(cP + wP / 2, top + 2, '타설', { a: 'middle', fs: 12, c: 'var(--ink-3)' });
    rows.forEach(function (r, gi) {
      var gr = r.gr, ym = (r.y0 + r.y1) / 2, xr;
      if (!r.bl) xr = r.xr || tR;
      else if (open) xr = Math.max(bR, eR + sl * (1 - (ym - yGL) / Math.max(1, yH - yGL)) + (R.scw ? 9 : 0));
      else xr = eR + ww + (anc ? aPx + 2 : 0);
      if (partial && r.bl) xr = Math.max(xr, fR);
      if (RX - 2 - (xr + 6) > 6) s += Ln(xr + 6, ym, RX - 2, ym, 'var(--slate-2)', 1, '1.5 3');
      var lab = gr.label, fs = nar ? 12 : 14, labW = nar ? RW - 6 : cIn - cLab - 6;
      while (fs > 9.5 && tw(lab, fs) > labW) fs -= 0.5;
      var two = gr.cnt > 1 && !nar && r.hp >= 46;
      s += T(cLab, ym + fs * 0.36 + (two ? -6 : 0), lab, { fs: fs, w: 700, c: 'var(--ink)', cls: 'n' });
      if (two) s += T(cLab, ym + 13, gr.cnt + '개층', { fs: 11.5, c: 'var(--ink-3)' });
      var pTxt = gr.p || (r.bl && TD ? '역타' : (gr.n > 1 ? gr.n + '회' : '1회')), hot = gr.n > 1;
      var inp = '<input class="fh' + (nar ? ' fh-l' : '') + '" type="number" min="2" max="30" step="0.05" inputmode="decimal" data-g="' + gi + '" data-floor-h="' + esc(gr.label) + '" value="' + (+gr.h.toFixed(2)) + '" aria-label="' + esc(gr.label) + ' 층고 (m)" title="' + esc(gr.label) + ' 층고 — 바꾸면 바로 공기에 반영"';
      if (nar) {
        var elT = r.bl ? 'GL−' + r1(r.dB) : (r.elB > 0 ? '+' + r1(r.elB) : 'GL');
        lst += '<div class="fr' + (hot ? ' hot' : '') + (r.bl ? ' bl' : '') + '"><span class="fl">' + esc(lab) + (gr.cnt > 1 ? '<small>' + gr.cnt + '개층</small>' : '') + '</span>' + inp + '><span class="fp">' + esc(pTxt.replace(' 타설', '')) + '</span><span class="fe">' + elT + '</span></div>';
        return;
      }
      s += Rc(cP, ym - 11, wP, 22, hot ? 'var(--cp-soft)' : 'var(--band)', ' rx="11"' + (hot ? ' stroke="#EFB3AC"' : '')) + T(cP + wP / 2, ym + 4.3, pTxt, { a: 'middle', fs: 12, w: hot ? 700 : 500, c: hot ? 'var(--cp-deep)' : 'var(--ink-2)' });
      html += inp + ' style="left:' + cIn + 'px;top:' + r1(ym - 13) + 'px;width:' + wIn + 'px">';
    });
    /* 아래 : 가로 축척 + 세로 과장 배율 (지하 · 단일 층 기준) */
    var nice = [5, 10, 20, 25, 50, 100, 200], sm = 200; for (var ni = 0; ni < nice.length; ni++) if (nice[ni] * hs >= 40) { sm = nice[ni]; break; }
    var ysb = Ht - 14, smx = X0 + sm * hs, vx = k / hs;
    s += Rc(X0, ysb - 4, sm * hs / 2, 4, 'var(--ink-2)') + Rc(X0 + sm * hs / 2, ysb - 4, sm * hs / 2, 4, '#fff', ' stroke="var(--ink-2)" stroke-width=".8"');
    s += T(X0, ysb - 9, '0', { fs: 10.5, c: 'var(--ink-3)', cls: 'n', a: 'middle' }) + T(smx, ysb - 9, sm + 'm', { fs: 10.5, c: 'var(--ink-3)', cls: 'n', a: 'middle' });
    var vxT = '세로 ×' + r1(vx), vxW = tw(vxT, 11.5) + 16, vxX = smx + 14;
    if (vx > 1.15) s += Rc(vxX, ysb - 13, vxW, 18, 'var(--warn-soft)', ' rx="9"') + T(vxX + vxW / 2, ysb, vxT, { a: 'middle', fs: 11.5, w: 700, c: 'var(--warn)', cls: 'n' });
    else vxW = -14;
    s += T(vxX + vxW + 8, ysb, nar ? '과장' : (vx > 1.15 ? '과장 (층고 비례 · 묶음 층 압축)' : '가로 · 세로 같은 축척 (묶음 층 압축)'), { fs: 11, c: 'var(--ink-3)' });
    var nh = notes.map(function (n, i) { return '<li><i style="background:' + n.c + '">' + (i + 1) + '</i><span>' + esc(n.t) + '</span></li>'; }).join('');
    if (lst) lst = '<div class="fhl" role="group" aria-label="층별 층고 (바꾸면 바로 다시 계산)"><div class="fr hd"><span>층</span><span>층고 (m)</span><span>타설</span><span>바닥 EL</span></div>' + lst + '</div>';
    return { html: '<div class="sec7" style="width:' + W + 'px;height:' + Ht + 'px">' + svgEl(W, Ht, s, '가정 단면도 · 지상 ' + b.nUp + '층 · 지하 ' + b.nB + '층') + html + '</div>' + lst, groups: G, elTop: elTop, notes: nh, Ht: Ht, vx: vx };
  }
  /* 넓은 화면 배치 : 단면이 높으면 단면 (2행) | 조닝 + 주요 판단, 낮으면 (넓고 낮은 건물) 단면 | 조닝 한 줄 + 주요 판단 전체 폭.
     단면은 옆 열 높이에 맞춰 세로를 조금 키우되, SEC_GROW 배 안에서만 — 남는 높이는 도면을 가운데 둔다 */
  function fitSection(R) {
    var bento = $('#bento');
    zoneFW = 0; if (zoneBig) { zoneBig = false; renderZone(R); }
    if (!window.matchMedia || !window.matchMedia('(min-width: 1180px)').matches) { bento.classList.remove('kf-wide'); return; }
    var tile = $('#sec-sec'), box = $('#section'), z = $('#sec-zone'), kf = $('#sec-kf');
    bento.classList.remove('kf-wide'); bento.classList.add('measure');
    var secN = tile.offsetHeight, boxN = box.offsetHeight, zN = z.offsetHeight, kfN = kf.offsetHeight, over = secN - boxN;
    /* 단면 높이는 자연 높이 ~ 세로 과장 상한 사이에서만 늘릴 수 있다 → 세 배치 중 남는 빈칸이 가장 작은 것 */
    var secW = box.clientWidth || 700, secMax = over + sectionAt(R, secW, secT0(secW) * SEC_GROW).Ht;
    function gap(h) { return Math.abs(h - Math.max(secN, Math.min(secMax, h))); }
    /* 조닝 + 주요 판단을 단면 옆에 세우는 배치는 단면을 늘리지 않을 때만 */
    var opts = [{ m: 'wide', h: zN }], tallH = zN + 16 + kfN;
    bento.classList.add('kf-wide');
    zoneBig = true; renderZone(R); opts.push({ m: 'big', h: z.offsetHeight });
    var best = opts[0]; opts.forEach(function (o) { if (gap(o.h) < gap(best.h) - 40) best = o; });
    if (tallH <= secMax + 24 && gap(tallH) < gap(best.h) - 40) best = { m: 'tall', h: tallH };
    if (best.m !== 'big') { zoneBig = false; renderZone(R); }
    else if (best.h > secMax + 24) {
      /* 큰 판이 단면 상한보다 높으면 판을 줄여 두 타일 높이를 맞춘다 (판 높이 ∝ 판 폭) */
      for (var it = 0; it < 3 && best.h > secMax + 24; it++) {
        var P = 0, fw0 = 0; $$('#zone .iso-fig svg').forEach(function (sv) { P += sv.getBoundingClientRect().height - 60; fw0 = Math.max(fw0, +sv.getAttribute('width') || 0); });
        if (!(P > 0 && fw0 > 0)) break;
        zoneFW = Math.max(300, Math.floor(28 + (fw0 - 28) * Math.max(0.6, (P - (best.h - secMax)) / P))); renderZone(R); best.h = z.offsetHeight;
        if (zoneFW <= 300) break;
      }
    }
    if (best.m === 'tall') bento.classList.remove('kf-wide');
    bento.classList.remove('measure');
    var want = best.h - over;
    if (want > boxN + 24) renderSection(R, want);
  }
  function renderSection(R, want) {
    var box = $('#section'), sc = section(R, box.clientWidth || 700, want);
    secG = sc.groups; box.innerHTML = sc.html; widths.section = box.clientWidth;
    $('#s-notes').innerHTML = sc.notes; $('#s-notes').hidden = !sc.notes;
    var b = R.basic, fr = R.frame, two = sc.groups.filter(function (x) { return x.n > 1 && x.kind !== 'b'; });
    $('#s-chips').innerHTML = '<span>지상 <b>' + b.nUp + '</b>층' + (b.nPH ? ' + 옥탑 <b>' + b.nPH + '</b>' : '') + ' · 지하 <b>' + b.nB + '</b>층</span>' +
      '<span>높이 <b>' + r1(sc.elTop) + '</b>m' + (b.nB > 0 ? ' · 굴착 GL−<b>' + r1(R.geo.H) + '</b>m' : '') + '</span>' +
      '<span class="' + (two.length ? 'hot' : '') + '">2회 분할 : ' + (two.length ? esc(two.map(function (x) { return x.label; }).join(', ')) : '없음') + '</span>' +
      '<span>' + (fr.dc ? 'DC 사이클 · 층고 ' + LIB.dc.split + 'm 이상 2회' : fr.coreRows.length ? '코어 ' + LIB.frame.core.liftMax + 'm 초과 2 Lift' : '층고 ' + LIB.frame.split + 'm 이상 2회 (층 사이클 ×' + r2(1 + LIB.frame.vShare) + ')') + '</span>' +
      (sc.vx > 1.15 ? '<span>세로 <b>×' + r1(sc.vx) + '</b> 과장 그림</span>' : '') +
      '<span>층고 ' + (S.adv && S.adv.hSpec ? '입력값' : '용도 기본값 (' + esc(GE.USE_H[b.use].name) + ')') + '</span>' +
      '<span>지반 ' + esc(R.ground.name) + (R.ground.assumed ? ' (가정)' : '') + '</span>';
    var sw = function (k) { return '<svg width="18" height="12" aria-hidden="true"><rect width="18" height="12" rx="3" fill="var(--' + k + ')" opacity=".6"/><rect width="18" height="12" rx="3" fill="url(#o7s-' + k + ')"/></svg>'; };
    $('#s-lg').innerHTML = LKS.map(function (k, i) { return '<span>' + sw(k) + LNM[i] + '</span>'; }).join('') +
      '<span><svg width="22" height="12" aria-hidden="true"><path d="M1 6h20" stroke="var(--gwl)" stroke-width="1.6" stroke-dasharray="5 3"/></svg>지하수위</span>' +
      '<span><svg width="22" height="12" aria-hidden="true"><path d="M1 6h20" stroke="var(--cp)" stroke-width="1.6" stroke-dasharray="5 3"/></svg>굴착선 · 2회 타설 이음</span>' +
      '<span><svg width="22" height="12" aria-hidden="true"><path d="M2 3l18 6" stroke="var(--cp)" stroke-width="1.3"/><path d="M11 6l9 3" stroke="var(--cp)" stroke-width="3.2" stroke-linecap="round" opacity=".85"/></svg>지보 (앵커 · 스트럿)</span>' +
      '<span><svg width="18" height="12" aria-hidden="true"><rect width="18" height="12" rx="3" fill="url(#o7s-mat)" stroke="var(--ink-2)" stroke-width=".8"/></svg>콘크리트 (매트)</span>';
  }
  function onSecEdit(e) {
    var el = e.target; if (!el || !el.classList || !el.classList.contains('fh') || !lastR || !secG) return;
    if (!document.body.contains(el)) return;
    var gi = +el.getAttribute('data-g'), gr = secG[gi], h = parseFloat(el.value);
    if (!gr) return;
    if (!(h >= 2 && h <= 30)) { el.value = +gr.h.toFixed(2); return; }
    if (Math.abs(h - gr.h) < 1e-9) return;
    var spec = GK.secEdit(lastR, secG, gi, h), kd = e.type === 'keydown', lab = el.getAttribute('data-floor-h');
    /* 다시 그리기는 이벤트가 끝난 뒤 (blur 중 DOM 교체 오류 방지) */
    setTimeout(function () {
      S.adv.hSpec = spec; if (current) markPreset('');
      recompute();
      if (kd) { var nx = document.querySelector('#section input[data-floor-h="' + lab + '"]'); if (nx) nx.focus(); }
    }, 0);
  }
  document.addEventListener('change', onSecEdit);
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target && e.target.classList && e.target.classList.contains('fh')) { e.preventDefault(); onSecEdit(e); } });

  /* ───────── 조닝 : 아이소메트릭 적층 (기준층 · 지하골조 · 기초, 같은 축척) */
  function zgridPlan(X0, Y0, w, h, N, cellOf) {
    var out = []; if (!(N > 0) || !(w > 0) || !(h > 0)) return out;
    var rws = Math.max(1, Math.min(N, Math.round(Math.sqrt(N * h / Math.max(w, 1e-6))))), base = Math.floor(N / rws), extra = N % rws, ch = h / rws, i = 0;
    for (var r = 0; r < rws; r++) {
      var nc = base + (r < extra ? 1 : 0), cw = w / nc;
      for (var c = 0; c < nc; c++, i++) { var cc = r % 2 ? nc - 1 - c : c, o = cellOf(i); o.X0 = X0 + cc * cw; o.X1 = o.X0 + cw; o.Y0 = Y0 + r * ch; o.Y1 = o.Y0 + ch; out.push(o); }
    }
    return out;
  }
  /* 팀 배정 : 이어진 Zone 묶음 = 한 팀. 숫자 = 팀 안 타설 순서, 팀마다 1 Zone 이면 Zone 순서 (모두 '1' 이 되지 않게) */
  function zteams(N, T) { var per = Math.ceil(N / Math.max(1, T)); return function (i) { var t = Math.floor(i / per); return { team: t, ord: per > 1 ? i - t * per + 1 : i + 1 }; }; }
  function isoPlate(o, s, FW, idx) {
    var C = 0.8660254, pad = 14, tz = 9, hc = o.core ? 20 : 0, Lp = o.Lp, Bp = o.Bp;
    var topY = pad + hc + 6, hTop = (Lp + Bp) * 0.5 * s, H = Math.ceil(topY + hTop + tz + 34);
    var cx = FW / 2, ox = cx - (Lp - Bp) / 2 * C * s, oy = topY;
    function P(X, Y, Z) { return [ox + (X - Y) * C * s, oy + (X + Y) * 0.5 * s - (Z || 0)]; }
    var Lr = o.Lr, Br = o.Br, v = '';
    v += '<defs><filter id="o7z-sh' + idx + '" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="7"/></filter></defs>';
    v += Ln(cx, 0, cx, H, '#CBD2DC', 1, '3 4');
    v += Pg([P(0, 0), P(Lr, 0), P(Lr, Br), P(0, Br)].map(function (p) { return [p[0], p[1] + tz + 10]; }), ' fill="#1B2433" opacity=".13" filter="url(#o7z-sh' + idx + ')"');
    if (o.ghost) v += Pg([P(0, 0), P(Lp, 0), P(Lp, Bp), P(0, Bp)], ' fill="#FAFBFC" stroke="var(--ink-3)" stroke-width="1.1" stroke-dasharray="5 4"');
    var pl = P(0, Br), pb = P(Lr, Br), pr = P(Lr, 0), p0 = P(0, 0);
    v += Pg([pl, pb, [pb[0], pb[1] + tz], [pl[0], pl[1] + tz]], ' fill="#DDE2E9"') + Pg([pb, pr, [pr[0], pr[1] + tz], [pb[0], pb[1] + tz]], ' fill="#C6CDD7"');
    v += Pg([p0, pr, pb, pl], ' fill="#FFFFFF"');
    function cells(list, Z) {
      var c = '', t = '';
      list.forEach(function (q) {
        c += Pg([P(q.X0, q.Y0, Z), P(q.X1, q.Y0, Z), P(q.X1, q.Y1, Z), P(q.X0, q.Y1, Z)], ' fill="' + q.fill + '" fill-opacity="' + q.op + '" stroke="' + (q.stroke || '#fff') + '" stroke-width="' + (q.sw || 1.2) + '" stroke-linejoin="round"');
        var m = P((q.X0 + q.X1) / 2, (q.Y0 + q.Y1) / 2, Z), sz = Math.min(q.X1 - q.X0, q.Y1 - q.Y0) * s;
        if (q.t !== '' && q.t != null && sz >= (q.minSz || 12)) t += T(m[0], m[1] + 4, q.t, { a: 'middle', fs: sz > 26 ? 12.5 : 11, w: 700, c: q.tc || 'var(--ink)', cls: 'n', halo: q.halo || 'rgba(255,255,255,.85)' });
      });
      return c + t;
    }
    v += cells(o.cells, 0);
    v += Pg([p0, pr, pb, pl], ' fill="none" stroke="var(--ink)" stroke-width="1.3" stroke-linejoin="round"');
    if (o.core && o.core.cw > 0) {
      var cw = o.core.cw;
      v += Pg([P(0, Br, 0), P(cw, Br, 0), P(cw, Br, hc), P(0, Br, hc)], ' fill="#A3ADBC"') + Pg([P(cw, 0, 0), P(cw, Br, 0), P(cw, Br, hc), P(cw, 0, hc)], ' fill="#838FA1"');
      v += Pg([P(0, 0, hc), P(cw, 0, hc), P(cw, Br, hc), P(0, Br, hc)], ' fill="#EEF1F5"');
      v += cells(o.core.cells, hc);
      v += Pg([P(0, 0, hc), P(cw, 0, hc), P(cw, Br, hc), P(0, Br, hc)], ' fill="none" stroke="var(--ink)" stroke-width="1.1" stroke-linejoin="round"');
    }
    /* 변 치수 (앞 두 변) */
    var mx = (pl[0] + pb[0]) / 2 - 7, my = (pl[1] + pb[1]) / 2 + tz + 12, nx = (pb[0] + pr[0]) / 2 + 7, ny = (pb[1] + pr[1]) / 2 + tz + 12;
    if (Lr * s > 40) v += T(mx, my, '≈ ' + r1(Lr) + ' m', { a: 'middle', fs: 11.5, w: 500, c: 'var(--ink-2)', cls: 'n', tr: 'rotate(30 ' + r1(mx) + ' ' + r1(my) + ')' });
    if (Br * s > 34) v += T(nx, ny, '≈ ' + r1(Br) + ' m', { a: 'middle', fs: 11.5, w: 500, c: 'var(--ink-2)', cls: 'n', tr: 'rotate(-30 ' + r1(nx) + ' ' + r1(ny) + ')' });
    return svgEl(FW, H, v, o.aria);
  }
  function zoning(R, Wc, big) {
    /* 배치 : 좁으면 (또는 옆 단면이 훨씬 높아 세로 여유가 있으면 big) 한 줄 머리 + 큰 판, 보통은 이름 왼쪽 · 판 오른쪽,
       넓으면 (타일이 전체 폭) 세 판을 가로로 나란히. 판 폭은 480px 까지 */
    var W = Math.max(280, Math.floor(Wc)), nar = W < 470 || (!!big && W < 860), cols = W >= 860, f = R.found, b = R.basic, g = R.geo, fr = R.frame, AR = 1.6;
    var Af = f.Af > 0 ? f.Af : g.bldg, Ab = b.nB > 0 ? g.AdnEff : 0, Au = fr.Atyp;
    function dim(A) { A = Math.max(0, A || 0); return { A: A, L: Math.sqrt(A * AR), B: Math.sqrt(A / AR) }; }
    var dF = dim(Af), dB = dim(Ab), dU = dim(Au);
    var FW = Math.min(480, cols ? Math.floor(W / 3) - 38 : nar ? W : W - 160 - 14);
    if (big && zoneFW > 0) FW = Math.min(FW, zoneFW);
    var Lmax = Math.max(dF.L, dB.L, dU.L, 1), s = (FW - 28) / ((Lmax + Lmax / AR) * 0.8660254);
    var maxT = 1, out = '';
    function row(lv, title, area, d, lines, svgHtml) {
      return '<div class="iso-row"><div class="iso-lab"><span class="lv">' + esc(lv) + '</span><h3>' + esc(title) + '</h3>' +
        '<div class="ar"><b>' + fmt(area) + '</b> ㎡<span>≈ ' + r1(d.L) + ' × ' + r1(d.B) + ' m</span></div><ul>' + lines.filter(Boolean).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
        '<div class="iso-fig">' + svgHtml + '</div></div>';
    }
    /* 기준층 */
    var ty = fr.typ, NP, TP, NC = 0, TC = 0, Ac = 0;
    if (ty.dc) { NP = ty.dc.P.N; TP = ty.dc.P.T; NC = ty.dc.C.N; TC = ty.dc.C.T; Ac = ty.dc.Ac; }
    else { NP = ty.slab.Z; TP = ty.slab.T; if (ty.core) { NC = ty.core.Z; TC = ty.core.T; Ac = Au * LIB.frame.core.ratio; } }
    maxT = Math.max(maxT, TP);
    if (Au > 0) {
      var cwU = NC ? Math.min(dU.L * 0.45, Math.max(dU.L * 0.06, Ac / Math.max(dU.B, 1e-6))) : 0, tp = zteams(NP, TP), tc = NC ? zteams(NC, TC) : null;
      var cellsU = zgridPlan(cwU, 0, dU.L - cwU, dU.B, NP, function (i) { var q = tp(i); return { fill: TEAMC[q.team % 8], op: 0.58, t: q.ord }; });
      var coreU = NC ? { cw: cwU, cells: zgridPlan(0, 0, cwU, dU.B, NC, function (i) { var q = tc(i); return { fill: 'var(--ink-2)', op: 0.5 + 0.2 * (q.team % 2), t: q.ord, tc: '#fff', halo: 'rgba(20,24,32,.6)', minSz: 15 }; }) } : null;
      var tact = GK.tactOf(R);
      out += row('지상 ' + b.nUp + '개층 · 기준층 ' + ty.n + 'F', '지상 기준층', Au, dU, [
        ty.dc ? '외주부 <b>' + NP + '</b> Zone · <b>' + TP + '</b>팀' : '바닥 <b>' + NP + '</b> Zone · <b>' + TP + '</b>팀',
        NC ? '코어 <b>' + NC + '</b> Zone · <b>' + TC + '</b>팀' : '코어 별도 없음 (일체 타설)',
        NC ? '코어 ' + fmt(Ac) + '㎡ · ' + (ty.dc ? '분리 타설' : '선행') : '',
        '층고 ' + r1(ty.h) + 'm',
        '사이클 <b>' + m1(tact) + '</b> WD / 층'
      ], isoPlate({ Lp: dU.L, Bp: dU.B, Lr: dU.L, Br: dU.B, cells: cellsU, core: coreU, aria: '지상 기준층 조닝 평면 (아이소메트릭)' }, s, FW, 0));
    } else out += '<div class="iso-none">지상 연면적 · 건축면적을 넣으면 기준층 평면이 그려집니다.</div>';
    /* 지하골조 */
    var bs = R.base;
    if (!bs || b.nB === 0) out += '<div class="iso-none">지하층 없음 · 기초 위에서 바로 지상골조</div>';
    else if (Ab > 0) {
      var NZ, NT, sub;
      if (bs.td) { NZ = 3; NT = 3; sub = ['역타 : 지하 슬래브 <b>3</b> Zone 순환', '굴착 단계마다 반복 · 기초 후 수직재 <b>' + bs.nPost + '</b>개층']; }
      else if (bs.partial) { NZ = Math.max(1, Math.round(Ab / LIB.base.zoneA)); NT = Math.ceil(NZ / LIB.base.zpt - 1e-9); var p = bs.path; sub = ['부분 지하 · 점선 = 기초 외곽', '바닥 <b>' + NZ + '</b> Zone · <b>' + NT + '</b>팀', '외벽 ' + r1(p.walls) + 'WD' + (p.backfill ? ' → 방수 · 되메우기' : '') + ' → 바닥 ' + p.nSlab + '개층']; }
      else { var r0 = bs.rows[bs.rows.length - 1]; NZ = r0.Z; NT = r0.T; sub = ['바닥 <b>' + NZ + '</b> Zone · <b>' + NT + '</b>팀 (' + esc(r0.slab) + ')', '외벽 ' + r0.lifts + '회 끊어치기 · B1 층고 ' + r1(r0.h) + 'm']; }
      maxT = Math.max(maxT, NT);
      var tb = zteams(NZ, NT), ghost = Ab < Af * 0.97;
      var Ldb = ghost ? dF : dB;
      var cellsB = zgridPlan(0, 0, dB.L, dB.B, NZ, function (i) { var q = tb(i); return { fill: TEAMC[q.team % 8], op: 0.58, t: q.ord }; });
      out += row('지하 ' + b.nB + '개층', '지하골조', Ab, dB, sub, isoPlate({ Lp: Ldb.L, Bp: Ldb.B, Lr: dB.L, Br: dB.B, ghost: ghost, cells: cellsB, aria: '지하골조 조닝 평면 (아이소메트릭)' }, s, FW, 1));
    } else out += '<div class="iso-none">지하 ' + b.nB + '개층 · 지하 연면적이나 건축면적을 넣으면 지하골조 평면이 그려집니다.</div>';
    /* 기초 */
    maxT = Math.max(maxT, f.teams);
    if (Af > 0) {
      var Z = f.sim.Z.slice().sort(function (a, c) { return a.pour - c.pour; }), rank = {}, byI = {};
      Z.forEach(function (z, i) { rank[z.i] = i + 1; byI[z.i] = z; });
      var cellsF = zgridPlan(0, 0, dF.L, dF.B, f.nZ, function (i) { var z = byI[i] || { team: 1 }; return { fill: TEAMC[(z.team - 1) % 8], op: z.slope ? 0.22 : 0.58, stroke: z.pit ? 'var(--cp)' : '#fff', sw: z.pit ? 2.2 : 1.2, t: rank[i] || '' }; });
      out += row('기초 · ' + GE.FOUND_N[R.fType].replace(/ \(.*\)/, ''), '기초', Af, dF, [
        '<b>' + f.nZ + '</b> Zone · 철근 <b>' + f.teams + '</b>팀',
        '매트 <b>' + r1(g.tMat) + '</b>m · Zone ' + fmt(f.vZ) + '㎥',
        '사이클 <b>' + r1(f.cyc) + '</b> WD / Zone',
        (f.nPit ? 'PIT <b>' + f.nPit + '</b> Zone (빨간 테두리)' : 'PIT 없음'),
        f.nSlopeZ ? '경사띠 <b>' + f.nSlopeZ + '</b> Zone (연한 칸)' : ''
      ], isoPlate({ Lp: dF.L, Bp: dF.B, Lr: dF.L, Br: dF.B, cells: cellsF, aria: '기초 조닝 평면 (아이소메트릭)' }, s, FW, 2));
    } else out += '<div class="iso-none">건축면적을 넣으면 기초 평면이 그려집니다.</div>';
    var lg = ''; for (var t = 0; t < Math.min(maxT, 8); t++) lg += '<span><i style="background:' + TEAMC[t] + ';opacity:.7"></i>' + (t + 1) + '팀</span>';
    lg += '<span><i style="background:#fff;box-shadow:inset 0 0 0 2px var(--cp)"></i>PIT Zone</span>';
    if (f.nSlopeZ) lg += '<span><i style="background:var(--t1);opacity:.25"></i>경사띠 (되메우기 후)</span>';
    if (NC) lg += '<span><i style="background:#838FA1"></i>코어 (면적 비례 블록)</span>';
    lg += '<span>숫자 = 타설 순서 (기초는 전체 순서 · 지하 · 기준층은 팀 안 순서, 팀당 1 Zone 이면 Zone 순서)</span>';
    return { html: '<div class="iso' + (nar ? ' nar' : cols ? ' cols' : '') + '">' + out + '</div>', legend: lg };
  }
  function renderZone(R) { var box = $('#zone'), z = zoning(R, box.clientWidth || 520, zoneBig); box.innerHTML = z.html; $('#z-lg').innerHTML = z.legend; widths.zone = box.clientWidth; }

  /* ───────── 공종별 C.P 구간 */
  function renderCpb(R) {
    var cps = R.acts.filter(function (a) { return a.cp; }), mx = 0, rows = [];
    R.acts.forEach(function (a) { mx = Math.max(mx, a.e - a.s); });
    cps.forEach(function (a, i) {
      var c = R.cpLine[i]; if (!c) return;
      var prevE = i > 0 ? R.cpLine[i - 1].e : 0, d = c.d, pre = Math.max(0, Math.min(a.e, prevE) - a.s), post = Math.max(0, (a.e - a.s) - pre - d);
      rows.push({ a: a, pre: pre, cp: d, post: post, by: i > 0 && pre > 0.005 ? GK.shortName(cps[i - 1], R) : '' });
    });
    R.acts.filter(function (a) { return !a.cp; }).forEach(function (a) { rows.push({ a: a, pre: 0, cp: 0, post: a.e - a.s, non: true }); });
    var pc = function (v) { return (v / Math.max(mx, 0.01) * 100).toFixed(2) + '%'; }, lbl = function (v, w, t) { return v / Math.max(mx, 0.01) > 0.13 ? t : ''; };
    /* 넓은 화면 2열 : 열 우선 (왼쪽 열 위 → 아래, 다음 오른쪽 열) · 행 높이는 두 열이 같게 (grid) */
    var half = Math.ceil(rows.length / 2), box = $('#cpb');
    box.style.setProperty('--rows', half);
    box.innerHTML = rows.map(function (r, i) {
      var a = r.a, tot = a.e - a.s, tag;
      if (r.non) tag = '전체 Non-C.P · 다른 공종과 병행 (여유)';
      else tag = [r.pre > 0.05 ? '앞 ' + m1(r.pre) + ' Non-C.P' + (r.by ? ' (' + r.by + '와 병행)' : '') : '', r.cp > 0.005 ? 'C.P ' + m1(r.cp) : 'C.P 기여 없음 (앞 공종 안에서 끝남)', r.post > 0.05 ? '뒤 ' + m1(r.post) + ' Non-C.P' : ''].filter(Boolean).join(' · ');
      var bar = r.non ? '<i class="non" style="width:' + pc(r.post) + '">' + lbl(r.post, 0, m1(r.post)) + '</i>' :
        (r.pre > 0.005 ? '<i class="pre" style="width:' + pc(r.pre) + '">' + lbl(r.pre, 0, '병행 ' + m1(r.pre)) + '</i>' : '') + (r.cp > 0.005 ? '<i class="cp" style="width:' + pc(r.cp) + '">' + lbl(r.cp, 0, 'C.P ' + m1(r.cp)) + '</i>' : '') + (r.post > 0.005 ? '<i class="post" style="width:' + pc(r.post) + '">' + lbl(r.post, 0, m1(r.post)) + '</i>' : '');
      return '<div class="cb' + (r.non ? ' non' : '') + (i === 0 || i === half ? ' c0' : '') + (i >= half ? ' c2' : '') + '"><div class="cb-h"><b>' + esc(GK.shortName(a, R)) + '</b><span class="num">M+' + m1(a.s) + ' ~ ' + m1(a.e) + ' · ' + m1(tot) + '개월</span></div>' +
        '<div class="cb-bar" title="' + esc(a.name) + '">' + bar + '</div><div class="cb-w"><span class="tg">' + esc(tag) + '</span>' +
        (a.basis ? '<button class="bs" type="button" aria-expanded="false" title="눌러서 근거 전체 보기">' + esc(a.basis) + '</button>' : '') + '</div></div>';
    }).join('');
  }

  /* ───────── 주요 판단 (영향 큰 것 먼저) */
  function renderKf(R) {
    var g = R.geo, b = R.basic, fr = R.frame, A = R.inp.adv || {}, F = [], L = LIB;
    function add(k, v, why, hi) { F.push({ k: k, v: v, why: why, hi: !!hi }); }
    if (b.nB > 0) add('굴착 깊이', 'GL−' + r1(g.H) + 'm', A.H > 0 ? '입력값' : (b.seq === 'TD' ? '역타 층 층고 합' : '지하 층고 합 ' + r1(g.sumB) + 'm') + ' + 기초 ' + r1(g.tMat) + 'm + 0.3m');
    if (b.nB > 0) {
      if (R.exc && R.exc.ns > 0) { var sp = L.support[b.sup].sp, an = R.exc.anchor; add(GE.SUP_N[b.sup], R.exc.ns + '단', '굴착 ' + r1(g.H) + 'm · 첫 단 1.5m · 간격 ' + sp + 'm' + (an ? ' · 단당 ' + fmt(an.perStage) + '본, 총 ' + fmt(an.total) + '본 · ' + an.sets + '조' : ''), true); }
      else if (b.sup === 'OPEN') add('지보', '오픈컷 1:' + L.exc.slope, '사면 폭 ' + r1(g.slopeW) + 'm 필요 · 흙막이 벽체 없음' + (R.scw ? ' (외곽 SCW 차수만)' : ''), true);
      else if (b.seq === 'TD') add('지보', '역타 슬래브 지지', '기준층 ' + R.tdBase.name + ' 슬래브를 먼저 치고 아래층 굴착 · 슬래브 반복', true);
    }
    if (R.wall) add('흙막이', GE.WALL_N[b.wall], R.wall.qty + ' · ' + R.wall.sets + '조');
    if (R.scw) add('차수', 'SCW', R.scw.qty);
    add('기초 형식', GE.FOUND_N[R.fType], R.fWhy, true);
    add('매트 두께', r1(g.tMat) + 'm', A.mat > 0 ? '입력값' : '자동 = 0.9 + 0.045 × 지상 ' + b.nUp + '층' + (b.use === 'dc' ? ' + DC 0.6' : '') + ' (1.2 ~ 3.5)');
    if (R.pile) add('파일', fmt(R.pile.n) + '본', R.pile.qty.replace(/^[\d,]+본 ?/, '') + ' · ' + R.pile.basis);
    add('기초 Zone', R.found.nZ + ' Zone · ' + R.found.teams + '팀', 'Zone ' + fmt(R.found.vZ) + '㎥ · 철근 ' + r1(R.found.reb) + 't → 사이클 ' + r1(R.found.cyc) + 'WD');
    add('지반', R.ground.name + (R.ground.assumed ? ' (가정)' : ''), '풍화암 GL−' + r1(g.wrockTop) + 'm · 연암 GL−' + r1(g.rockTop) + 'm', R.ground.assumed);
    if (isFinite(g.gwl) && b.nB > 0) add('지하수위', 'GL−' + r1(g.gwl) + 'm', g.gwl < g.H ? '굴착 바닥이 수위보다 ' + r1(g.H - g.gwl) + 'm 아래 → 차수 · 영구배수 검토' : '굴착 바닥보다 깊음');
    var t = GK.tactOf(R), ty = fr.typ;
    add('기준층 사이클', m1(t) + ' WD/층', ty.dc ? 'DC 사이클 · 외주부 ' + ty.dc.P.N + ' / 코어 ' + ty.dc.C.N + ' Zone · ' + ty.dc.gov + ' 지배' : '바닥 ' + ty.slab.Z + ' Zone ÷ ' + ty.slab.T + '팀' + (ty.core ? ' · 코어 ' + ty.core.Z + ' Zone' : '') + ' · 주공정 ' + fr.gov, true);
    var two = GK.secLevels(R).filter(function (x) { return x.kind !== 'b' && x.n > 1; });
    add('분할 타설 층', two.length ? two.map(function (x) { return x.label; }).join(', ') : '없음', fr.dc ? '층고 ' + L.dc.split + 'm 이상 = 수직재 2회 (그 아래 1회)' : fr.coreRows.length ? '코어 ' + L.frame.core.liftMax + 'm 초과 = 2 Lift' : '층고 ' + L.frame.split + 'm 이상 = 수직재 2회 · 층 사이클 × ' + r2(1 + L.frame.vShare), two.length > 0);
    if (fr.coreRows.length) add('코어 거푸집', fr.sysC === 'ACS' ? 'ACS' : '갱폼 · 알폼', R.inp.coreSys && R.inp.coreSys !== 'AUTO' ? '선택값' : '자동 : 지상 15층 이상 ACS');
    if (b.seq === 'TD') add('역타 구조제한', '기초 전 ' + fr.lim + 'F · 수직재 전 ' + fr.lim2 + 'F', R.tags.lim === '기본' ? '모를 때 기본값 (지하 + 지상 25 · 32개층)' : '입력값', true);
    var hi = F.filter(function (x) { return x.hi; }), lo = F.filter(function (x) { return !x.hi; });
    $('#kf').innerHTML = (hi.length ? '<div class="kf-hi">' + hi.map(function (x) { return '<div class="kc" title="' + esc(x.why) + '"><span class="kk">' + esc(x.k) + '</span><b class="kv">' + esc(x.v) + '</b><span class="kw">' + esc(x.why) + '</span></div>'; }).join('') + '</div>' : '') +
      (lo.length ? '<dl class="kf-lo">' + lo.map(function (x) { return '<div title="' + esc(x.k + ' : ' + x.why) + '"><dt>' + esc(x.k) + '</dt><dd>' + esc(x.v) + '</dd></div>'; }).join('') + '</dl>' : '');
  }
  /* 확인 사항 (= 히어로 칩 건수) 과 계산 가정 (엔진 notes) 을 나눠 보여 준다 */
  function renderWarns(R) {
    var w = GK.warns(R), n = R.notes || [];
    $('#warns').innerHTML = w.length ? w.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') : '<li class="none">입력 · 면적 점검에서 확인할 사항이 없습니다.</li>';
    var wc = $('#w-ct'); wc.textContent = w.length ? w.length + '건' : '없음'; wc.classList.toggle('ok', !w.length);
    $('#notes').innerHTML = n.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
    $('#n-ct').textContent = n.length + '건';
    $('#notes-g').hidden = !n.length; $('#wgs').classList.toggle('two', n.length > 0);
  }

  /* ───────── 입력 시트 자동값 */
  function renderHints(R) {
    var ah = GK.autoHints(R), b = R.basic, fr = R.frame, g = R.geo, td = fr.typ.dc;
    function set(k, t) { $$('[data-auto="' + k + '"]').forEach(function (el) { el.textContent = t; }); }
    set('cov', ah.cov ? '자동 ' + ah.cov + '%' : ''); set('nPH', '자동 ' + ah.nPH);
    set('H', ah.H ? '자동 ' + ah.H : ''); set('A', ah.A ? '자동 ' + ah.A : ''); set('P', ah.P ? '자동 ' + ah.P : '');
    set('found', '판정 ' + ah.found); set('core', ah.core);
    set('lim', b.seq === 'TD' ? (R.tags.lim === '기본' ? '자동 ' : '') + ah.lim : ''); set('lim2', b.seq === 'TD' ? '자동 ' + Math.max(fr.lim, LIB.td.limTot2 - b.nB) + 'F' : '');
    set('Atyp', '자동 ' + ah.Atyp); set('coreZ', ah.coreZ ? '자동 ' + ah.coreZ : ''); set('mat', '자동 ' + ah.mat); set('fTeams', '자동 ' + ah.fTeams);
    set('prd', ah.prd ? '자동 ' + ah.prd : ''); set('pile', ah.pile ? '추정 ' + ah.pile : '');
    set('dc', fr.dc ? '적용 중' : '미적용'); set('coreA', td ? '자동 ' + fmt(td.Ac) : ''); set('colN', td ? '자동 ' + td.nCol : '');
    var cv = $('#in-cov'); if (cv && document.activeElement !== cv) cv.placeholder = ah.cov || '자동';
    var ph = $('#q-nPH'); if (ph) ph.placeholder = '자동 ' + ah.nPH;
    for (var i = 0; i < 4; i++) $$('[data-dp="' + i + '"]').forEach(function (el) { el.textContent = 'GL−' + r1(g.z[i + 1]); });
    $$('[data-dp="4"]').forEach(function (el) { el.textContent = 'GL−' + r1(g.z[4]) + ' 이하'; });
    var gb = GK.groundBar(R); $('#gbar').innerHTML = gb.bar; $('#gcap').innerHTML = '<b>' + esc(gb.layers) + '</b><br>' + esc(gb.depth) + (gb.desc ? '<br>' + esc(gb.desc) : '');
    $('#in-gfa').value = ah.gfa ? fmt(ah.gfa) + ' ㎡' : '';
  }

  /* ───────── 사례 · 시트 · 초기화 */
  function loadPreset(k) {
    if (!PRESETS[k]) return;
    S = norm(GK.clone(PRESETS[k])); lastGround = S.ground; markPreset(k);
    GK.fill(document, S); syncUI(); recompute();
  }
  function openSheet(focusId) {
    var d = $('#sheet');
    if (!d.open) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
    if (focusId) { var el = document.getElementById(focusId); if (el) { var det = el.closest('details'); if (det) det.open = true; setTimeout(function () { el.focus(); if (el.scrollIntoView) el.scrollIntoView({ block: 'center' }); }, 30); } }
  }
  function closeSheet() { var d = $('#sheet'); if (d.open) { if (d.close) d.close(); else d.removeAttribute('open'); } }
  function rerenderOnResize() {
    if (!lastR) return;
    var a = document.activeElement, inSec = a && a.classList && a.classList.contains('fh');
    if ($('#gantt').clientWidth !== widths.gantt) renderGantt(lastR);
    if ($('#ms-flow').clientWidth !== widths.ms) { renderMs(lastR); widths.ms = $('#ms-flow').clientWidth; }
    var zc = $('#zone').clientWidth !== widths.zone, sc = $('#section').clientWidth !== widths.section;
    if (zc) renderZone(lastR);
    if (!inSec && (sc || zc)) { renderSection(lastR); fitSection(lastR); }
  }
  function init() {
    var saved = ST.load();
    try { S = saved && saved.inp ? norm(saved.inp) : norm(GK.clone(PRESETS.refA)); } catch (e) { S = norm(GK.clone(PRESETS.refA)); }
    lastGround = S.ground; markPreset(saved && saved.inp ? (saved.preset || '') : 'refA');
    buildLib();
    GK.bind(document, function () { return S; }, onField);
    GK.fill(document, S); syncUI();
    $$('#libtbl input').forEach(function (el) { el.addEventListener('input', schedule); });
    $('#lib-reset').addEventListener('click', function () { LIB = GE.defaultLib(); fillLib(); recompute(); });
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target : null; if (!t) return;
      var pb = t.closest('[data-p]'); if (pb) { loadPreset(pb.getAttribute('data-p')); return; }
      var bs = t.closest('.bs'); if (bs) { bs.setAttribute('aria-expanded', bs.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'); return; }
      var gt = t.closest('[data-goto]');
      if (gt) {
        var tg = document.getElementById(gt.getAttribute('data-goto'));
        if (tg) { tg.scrollIntoView({ behavior: 'smooth', block: 'start' }); var f1 = tg.querySelector('input.fh'); if (f1) setTimeout(function () { try { f1.focus({ preventScroll: true }); } catch (er) { f1.focus(); } }, 450); }
        return;
      }
      var stp = t.closest('[data-step]');
      if (stp) {
        var k = stp.getAttribute('data-step'), dlt = +stp.getAttribute('data-d'), cur = S[k];
        if (k === 'nPH' && (cur == null || cur === '')) cur = lastR ? lastR.basic.nPH : 1;
        var lim = { nB: [0, 12], nUp: [1, 120], nPH: [0, 4] }[k], nv = Math.max(lim[0], Math.min(lim[1], (+cur || 0) + dlt));
        S[k] = nv; onField(k, nv); return;
      }
      var op = t.closest('[data-open]'); if (op) { openSheet(op.getAttribute('data-open')); return; }
    });
    $('#open-sheet').addEventListener('click', function () { openSheet(); });
    $('#sheet-x').addEventListener('click', closeSheet);
    $('#sheet').addEventListener('click', function (e) { if (e.target === e.currentTarget) closeSheet(); });
    recompute();
    if (window.ResizeObserver) { var rt = null, ro = new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(rerenderOnResize, 90); }); ro.observe($('#bento')); }
    GK.connect(function (c) {
      if (c.downloads) {
        downloads = c.downloads; var bx = $('#btn-xlsx'); bx.hidden = false;
        bx.addEventListener('click', async function () { if (!lastR) return; bx.disabled = true; var t0 = bx.textContent; bx.textContent = '파일 준비 중…'; try { bx.textContent = await GK.exportX(lastR, downloads); } catch (e) { bx.textContent = '저장 실패'; } setTimeout(function () { bx.textContent = t0; bx.disabled = false; }, 2200); });
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.__agent = { get R() { return lastR; }, loadPreset: loadPreset, recompute: recompute, get state() { return S; } };
})();

