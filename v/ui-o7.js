/* 디자인 옵션 7 · 벤토 · 입체 — 상태 객체 (S) 하나를 빠른 입력 타일 · 입력 시트 · 단면 층고 칸이 함께 고친다
   렌더 : 히어로 (총 공기 · 범위 · C.P 구성) · 마일스톤 · Master Schedule · 가정 단면 (입면 일러스트) · 조닝 (아이소메트릭 적층) · C.P 구간 · 주요 판단 · 확인 사항 */
(function () {
  'use strict';
  var GE = window.GE, GK = window.GK, r1 = GE.r1, r2 = GE.r2, fmt = GE.fmt, esc = GK.esc, m1 = GK.m1, m2 = GK.m2;
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  var LIB = GE.defaultLib(), ST = GK.store('gonggi-agent-o7'), PRESETS = GK.PRESETS;
  var S = null, lastR = null, current = 'refA', timer = null, secG = null, lastGround = 'AUTO', downloads = null, widths = {}, gInfo = [], tipOn = -1;
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
    GK.fill(document, S); syncUI(); syncFloors(); schedule();
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
  /* 팀수 (기초 철근팀 fTeams · 지상 형틀팀 uTeams) : 비워 두면 최적값으로 계산 — 최적 = 최단 공기와 차이 OPT_TOL 개월 이내인 가장 적은 팀수.
     사용자가 ± 로 정하면 그 값 (S.adv 에 저장). 사례 A · B · C 는 실적 팀수가 들어 있어 재현값 그대로 */
  var OPT_TOL = 0.2;
  function hasTeam(k) { var v = S.adv && S.adv[k]; return v != null && v !== '' && +v > 0; }
  function sweepTeams(inp, key, max) {
    var tt = [], best = Infinity;
    for (var n = 1; n <= max; n++) { var c = GK.clone(inp), t = Infinity; c.adv = c.adv || {}; c.adv[key] = n; try { t = GE.compute(c, LIB).total; } catch (e) {} tt.push(t); if (t < best) best = t; }
    for (var i = 0; i < tt.length; i++) if (tt[i] <= best + OPT_TOL) return { opt: i + 1, totals: tt, max: max };
    return { opt: 1, totals: tt, max: max };
  }
  function recompute() {
    clearTimeout(timer);
    readLib();
    var inp = toInp(), R, team = { u: null, c: null, f: null };
    inp.adv = inp.adv || {};
    try {
      var R0 = GE.compute(inp, LIB), ty0 = R0.frame.typ, Zu = ty0.dc ? ty0.dc.P.N : ty0.slab.Z, Zc = ty0.dc ? ty0.dc.C.N : ty0.core ? ty0.core.Z : 0;
      var pz = pitUnderCore(R0); if (pz) inp.adv.pitZ = pz;
      team.u = sweepTeams(inp, 'uTeams', Math.max(1, Math.min(8, Zu)));
      if (!hasTeam('uTeams')) inp.adv.uTeams = team.u.opt;
      if (Zc > 0) { team.c = sweepTeams(inp, 'cTeams', Math.max(1, Math.min(8, Zc))); if (!hasTeam('cTeams')) inp.adv.cTeams = team.c.opt; }
      team.f = sweepTeams(inp, 'fTeams', 8);
      if (!hasTeam('fTeams')) inp.adv.fTeams = team.f.opt;
    } catch (e) { team = { u: null, c: null, f: null }; }
    try { R = GE.compute(inp, LIB); } catch (e) { $('#warns').innerHTML = '<li>계산 오류 : ' + esc(e.message) + '</li>'; return; }
    R.team = team;
    try { R.sens = GE.sensitivity(inp, LIB); } catch (e) { R.sens = { lo: R.total, hi: R.total }; }
    lastR = R;
    if (S.seq === 'TD' && R.tdBase && R.tdBase.off !== (S.tdBase || 0)) S.tdBase = R.tdBase.off;
    ST.save({ inp: S, preset: current });
    render(R);
  }
  function render(R) {
    var steps = [renderHead, renderHero, renderMs, renderGantt, renderSection, renderZone, renderKf, renderWarns, renderHints];
    steps.forEach(function (fn) { try { fn(R); } catch (e) { if (window.console) console.error(e); } });
    widths.ms = $('#ms-flow').clientWidth;
    GK.fill(document, S); syncFloors();
  }
  /* 층수 숫자 · 막대 채움 (드래그 중에도 바로) — 옥탑을 비워 두면 자동값 */
  function syncFloors() {
    ['nB', 'nUp'].forEach(function (k) { var r = $('#r-' + k), o = $('#o-' + k); if (!r || !o) return; var v = S[k] != null && S[k] !== '' ? S[k] : r.value; o.textContent = v; r.style.setProperty('--p', ((+r.value - +r.min) / Math.max(1, +r.max - +r.min) * 100).toFixed(1) + '%'); });
    var auto = S.nPH == null || S.nPH === '', o = $('#o-nPH'), u = $('#o-nPH-u');
    if (o) o.textContent = auto ? (lastR ? lastR.basic.nPH : '-') : S.nPH;
    if (u) { u.textContent = auto ? '층 · 자동' : '층'; u.classList.toggle('auto', auto); }
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
    $('#h-exact').innerHTML = '<span><b class="num">' + m2(R.total) + '</b>개월</span><i class="sep"></i><span>' + esc(GK.ymText(R.total)) + '</span>';
    var lo = R.sens.lo, hi = R.sens.hi, t = R.total, a = Math.min(lo, t), b = Math.max(hi, t), pad = Math.max(1, (b - a) * 0.3), x0 = a - pad, x1 = b + pad;
    var P = function (v) { return (v - x0) / (x1 - x0) * 100; };
    var near = Math.min(Math.abs(P(t) - P(lo)), Math.abs(P(hi) - P(t))) < 12;
    $('#h-range').innerHTML = '<div class="rg-k" title="생산성 ±15% 민감도"><span>범위</span><b class="num">' + m1(lo) + ' ~ ' + m1(hi) + '</b></div>' +
      '<div class="rg-track" aria-hidden="true"><i class="rg-band" style="left:' + P(lo).toFixed(2) + '%;width:' + (P(hi) - P(lo)).toFixed(2) + '%"></i><i class="rg-dot" style="left:' + P(t).toFixed(2) + '%"></i></div>' +
      '<div class="rg-lab" aria-hidden="true"><span class="num" style="left:' + P(lo).toFixed(2) + '%">' + m1(lo) + '</span>' + (near ? '' : '<span class="num now" style="left:' + P(t).toFixed(2) + '%">' + m1(t) + '</span>') + '<span class="num" style="left:' + P(hi).toFixed(2) + '%">' + m1(hi) + '</span></div>';
    /* 왜 이 공기인가 : 가장 긴 C.P 공종 한 줄 */
    var top = parts.slice().sort(function (a, c) { return c.d - a.d; })[0];
    $('#h-why').innerHTML = top ? '<span class="k">최대 C.P</span><b>' + esc(top.label) + ' <span class="num">' + m1(top.d) + '</span>개월</b><span class="pc">' + Math.round(top.d / Math.max(0.01, R.total) * 100) + '%</span>' : '';
    $('#h-why').title = top ? whyCtx(top, R) : '';
    $('#h-why').hidden = !top;
    var st = R.inp.start, ds = GK.addM(st, 0), de = GK.addM(st, R.total), w = GK.warns(R).length;
    $('#h-foot').innerHTML = (ds ? '<span class="dt">착공<b>' + GK.ym(ds) + '</b></span><span class="dt">준공<b>' + GK.ym(de) + '</b></span>' : '<button class="link" type="button" data-open="in-start">착공월 입력</button>') +
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
    $('#ms-sub').textContent = '';
    var prev = 0;
    $('#ms-list').innerHTML = ms.map(function (x) {
      var end = x.k === '준공', d = x.m - prev, h = '<div class="ms-item' + (end ? ' end' : '') + '"><i class="d" aria-hidden="true"></i><div><div class="k">' + esc(x.k) + '</div><div class="s">' +
        (st ? GK.ym(GK.addM(st, x.m)) + ' · ' : '') + Math.round(x.m / tot * 100) + '% · +' + m1(d) + '</div></div><div class="v"><small>M+</small>' + m1(x.m) + '</div>' +
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
    box.innerHTML = '<div class="comp-k"><span>C.P 흐름</span></div><div class="fl-wrap"><div class="fl-strip">' + strip + '</div>' + ticks + '</div><div class="fl-ax" aria-hidden="true">' + ax + '</div>' +
      '<div class="comp-leg">' + keys.map(function (k) { return '<div><span class="sw" style="background:' + GCOL[k][0] + '"></span>' + k + '<b>' + m1(G[k]) + '<small>' + Math.round(G[k] / tot * 100) + '%</small></b></div>'; }).join('') + '</div>';
  }

  /* ───────── Master Schedule (C.P = 빨강 · C.P 연결선 · 개월 축 · 마일스톤) */
  /* Master Schedule : 연차 머리 · 가는 눈금, 행 왼쪽 = 대공종 색 띠, C.P = 코발트 막대 (앞 병행 = 빗금), Non-C.P = 옅은 막대.
     C.P 연결선 · 마일스톤 (점선 + 아래 알약 라벨). 행 전체가 말풍선 걸림 영역 */
  function gantt(R, Wc) {
    var W = Math.max(680, Math.floor(Wc)), nar = Wc < 760;
    var acts = GK.ganttActs(R), n = acts.length, st = R.inp.start;
    var LW = nar ? 136 : 214, PR = 58, top = 54, rh = nar ? 30 : 33, bh = nar ? 11 : 12;
    var Mmax = Math.ceil(R.total + 0.4), span = W - LW - PR, X = function (m) { return LW + m / Mmax * span; };
    var rowsH = n * rh, bg = '', s = '', fg = '', xEnd = W - PR + 34;
    var defs = '<defs>' + pat('o7g-pre', 5, '<path d="M-1 6L6 -1" stroke="var(--cp)" stroke-width=".9" opacity=".45"/>', '#EEF3FC') + '</defs>';
    /* 연차 : 위쪽 얇은 칸 + 짝수 연차 옅은 바탕 */
    for (var yr = 0; yr * 12 < Mmax; yr++) {
      var ya = X(yr * 12), yb = X(Math.min(Mmax, yr * 12 + 12));
      if (yr % 2 === 1) bg += Rc(ya, top - 4, yb - ya, rowsH + 4, '#F6F8FB');
      bg += Rc(ya + 1, top - 44, yb - ya - 2, 18, yr % 2 ? '#EEF2F8' : '#F5F7FA', ' rx="5"');
      if (yb - ya > 36) bg += T(ya + 9, top - 31, (yr + 1) + '년차', { fs: 11.5, w: 600, c: 'var(--ink-2)' });
    }
    var pxM = span / Mmax, step = pxM > 26 ? 3 : pxM > 13 ? 6 : 12;
    for (var m = 0; m <= Mmax; m++) {
      var x = X(m), maj = m % step === 0;
      if (pxM > 7 || maj) bg += Ln(x, top - (maj ? 5 : 2), x, top + rowsH, maj ? '#E3E8EF' : '#EEF1F5', maj ? 0.8 : 0.6);
      if (maj) bg += T(x, top - 10, st ? GK.yy(GK.addM(st, m)) : 'M+' + m, { a: 'middle', fs: 10.5, c: 'var(--ink-3)', cls: 'n' });
    }
    var cpMap = {}, cpS = {}, rowOf = {};
    R.cpLine.forEach(function (c, i) { cpMap[c.id] = c; cpS[c.id] = i ? R.cpLine[i - 1].e : 0; });
    gInfo = [];
    var prevG = null;
    acts.forEach(function (a, i) {
      rowOf[a.id] = i;
      var y = top + i * rh, mid = y + rh / 2, cp = !!(a.cp && cpMap[a.id]), x0 = X(a.s), x1 = Math.max(X(a.e), x0 + 2), gk = GRP[a.id] || '골조';
      /* 대공종이 바뀌는 행 위는 조금 진한 선 */
      bg += Ln(0, y, xEnd, y, gk !== prevG && i ? '#DCE3EC' : '#EEF1F5', gk !== prevG && i ? 0.9 : 0.6); prevG = gk;
      var nm = GK.shortName(a, R), fs = nar ? 12 : 13.5;
      while (fs > 10.5 && tw(nm, fs) > LW - 34) fs -= 0.5;
      gInfo.push({ a: a, cp: cp, pre: 0, d: 0, post: 0 });
      var cs = cp ? Math.max(a.s, Math.min(a.e, cpS[a.id])) : a.s, xc = X(cs), d = cp ? cpMap[a.id].d : a.e - a.s;
      gInfo[i] = { a: a, cp: cp, pre: cp ? cs - a.s : 0, d: cp ? d : 0, post: cp ? Math.max(0, a.e - cs - d) : a.e - a.s };
      s += '<g class="ga" data-a="' + i + '">' + Rc(0, y, xEnd, rh, 'transparent', ' class="hit"');
      s += Rc(0, mid - 7, 3, 14, GCOL[gk][0], ' rx="1.5"' + (cp ? '' : ' opacity=".55"'));
      s += T(14, mid + fs * 0.36, nm, { fs: fs, w: cp ? 600 : 400, c: cp ? 'var(--ink)' : 'var(--ink-3)' });
      if (cp) {
        if (cs > a.s + 0.01) s += Rc(x0, mid - bh / 2, xc - x0, bh, 'url(#o7g-pre)', ' rx="3" stroke="var(--cp)" stroke-opacity=".35" stroke-width=".7"');
        if (x1 - xc > 0.6) s += Rc(xc, mid - bh / 2, x1 - xc, bh, 'var(--cp)', ' rx="3"');
        if (d >= 0.05) s += (x1 - xc > 36) ? T(xc + (x1 - xc) / 2, mid + 3.8, m1(d), { a: 'middle', fs: 11, w: 600, c: '#fff', cls: 'n' }) : T(x1 + 6, mid + 3.8, m1(d), { fs: 11, w: 600, c: 'var(--cp-deep)', cls: 'n' });
      } else {
        s += Rc(x0, mid - bh / 2 + 1.5, x1 - x0, bh - 3, '#D3DBE6', ' rx="2.5"');
        s += T(x1 + 6, mid + 3.8, m1(d), { fs: 10.5, c: 'var(--ink-3)', cls: 'n' });
      }
      s += '</g>';
    });
    bg += Ln(0, top + rowsH, xEnd, top + rowsH, '#DCE3EC', 0.9);
    /* C.P 연결선 : 한 C.P 공종 끝 → 다음 C.P 공종 */
    var parts = R.cpLine.filter(function (c) { return c.d > 0.005 && rowOf[c.id] != null; });
    parts.forEach(function (c, i) {
      if (i === parts.length - 1) return;
      var nx = parts[i + 1], ra = rowOf[c.id], rb = rowOf[nx.id], xe = X(c.e), ya = top + ra * rh + rh / 2, yb = top + rb * rh + rh / 2, dn = rb > ra ? 1 : -1;
      var y0 = ya + dn * bh / 2, y1 = yb - dn * bh / 2, ns = X(Math.max(c.e, nx.e - nx.d));
      fg += '<path d="M' + r1(xe) + ' ' + r1(y0) + 'V' + r1(y1) + (Math.abs(ns - xe) > 1 ? 'H' + r1(ns) : '') + '" fill="none" stroke="var(--cp-deep)" stroke-width="1" stroke-opacity=".7"/>';
      fg += '<circle cx="' + r1(xe) + '" cy="' + r1(y0) + '" r="2" fill="#fff" stroke="var(--cp-deep)" stroke-width="1"/>';
    });
    /* 마일스톤 : 점선 + 아래 알약 라벨 (겹치면 두 줄) */
    var ms = GK.milestones(R), yb0 = top + rowsH, lev = [-1e9, -1e9];
    ms.forEach(function (mm, i) {
      var x = X(mm.m), end = mm.k === '준공', col = end ? 'var(--cp)' : 'var(--navy)';
      fg += Ln(x, top - 2, x, yb0 + 6, col, 0.8, '2 3', ' opacity=".55"');
      fg += '<path d="M' + r1(x) + ' ' + r1(yb0 + 4) + 'l5 5-5 5-5-5z" fill="' + col + '"/>';
      var lab = mm.k + ' ' + (st ? GK.ym(GK.addM(st, mm.m)) : 'M+' + m1(mm.m)), w = tw(lab, 11.5) + 18, last = i === ms.length - 1;
      var L0 = last ? x - w + 9 : x - w / 2, lv = L0 < lev[0] + 8 ? (L0 < lev[1] + 8 ? 0 : 1) : 0, yl = yb0 + 22 + lv * 24;
      lev[lv] = L0 + w;
      fg += Rc(L0, yl, w, 20, end ? 'var(--cp)' : '#fff', ' rx="10"' + (end ? '' : ' stroke="#CBD5E3" stroke-width=".8"')) + T(L0 + w / 2, yl + 14, lab, { a: 'middle', fs: 11.5, w: 600, c: end ? '#fff' : 'var(--ink-2)' });
    });
    var H = top + rowsH + 76;
    return svgEl(W, H, defs + bg + s + fg, 'Master Schedule 바차트 · 총 ' + m1(R.total) + '개월');
  }
  function renderGantt(R) {
    var el = $('#gantt'); hideTip(); el.innerHTML = gantt(R, el.clientWidth || 900); widths.gantt = el.clientWidth;
    $('#g-sub').textContent = '막대에 커서 → 산출 근거';
    var parts = GK.cpParts(R);
    $('#cpf').innerHTML = '<span class="k">C.P 산식</span>' + parts.map(function (p) { return '<span class="t">' + esc(p.label) + '<b>' + m1(p.d) + '</b></span>'; }).join('<span class="op">+</span>') + '<span class="op">=</span><span class="sum">' + m2(R.total) + '개월</span>';
    $('#g-lg').innerHTML = '<span><i style="background:var(--cp)"></i>C.P</span><span><i style="background:repeating-linear-gradient(-45deg,#C8D7F3 0 3px,#EEF3FC 3px 6px);box-shadow:inset 0 0 0 1px rgba(31,86,201,.45)"></i>병행</span><span><i style="background:var(--slate-2)"></i>Non-C.P</span>' +
      '<span><svg width="14" height="14" aria-hidden="true"><path d="M7 1l6 6-6 6-6-6z" fill="var(--navy)"/></svg>마일스톤</span>' +
      '<span class="lg-ph">' + ['준비', '토목', '골조', '마감'].map(function (k) { return '<i style="background:' + GCOL[k][0] + ';width:4px;height:12px;border-radius:2px"></i>' + k; }).join('') + '</span>';
  }

  /* Master Schedule 말풍선 : 공종 · 기간 · C.P 구성 (앞 병행 · C.P · 뒤) · 산출 근거 */
  function tipHTML(g) {
    var a = g.a, R = lastR, tot = Math.max(0.01, a.e - a.s), pc = function (v) { return (v / tot * 100).toFixed(1) + '%'; };
    var nm = GK.shortName(a, R), bar = '', seg = [];
    if (g.cp) {
      if (g.pre > 0.005) { bar += '<i class="pre" style="width:' + pc(g.pre) + '"></i>'; seg.push('병행 ' + m1(g.pre)); }
      if (g.d > 0.005) { bar += '<i class="cp" style="width:' + pc(g.d) + '"></i>'; seg.push('<b>C.P ' + m1(g.d) + '</b>'); } else seg.push('C.P 기여 없음');
      if (g.post > 0.005) { bar += '<i class="non" style="width:' + pc(g.post) + '"></i>'; seg.push('여유 ' + m1(g.post)); }
    } else { bar = '<i class="non" style="width:100%"></i>'; seg.push('Non-C.P ' + m1(tot)); }
    var bs = a.basis ? a.basis.split(' · ').filter(Boolean) : [];
    return '<div class="gt-h"><b>' + esc(nm) + '</b><span class="n">M+' + m1(a.s) + ' ~ ' + m1(a.e) + '</span></div>' +
      (a.name !== nm ? '<div class="gt-nm">' + esc(a.name) + '</div>' : '') +
      '<div class="gt-bar">' + bar + '</div><div class="gt-seg">' + seg.join('<span>·</span>') + '<em>개월</em></div>' +
      (bs.length ? '<ul class="gt-b">' + bs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '');
  }
  function showTip(i, cx, cy) {
    var tip = $('#gtip'), tile = $('#sec-gantt'), g = gInfo[i]; if (!g || !tip) return;
    if (tipOn !== i) { tip.innerHTML = tipHTML(g); tipOn = i; $$('#gantt .ga.on').forEach(function (el) { el.classList.remove('on'); }); var ga = $('#gantt .ga[data-a="' + i + '"]'); if (ga) ga.classList.add('on'); }
    tip.hidden = false;
    var r = tile.getBoundingClientRect(), tw0 = tip.offsetWidth, th = tip.offsetHeight, x = cx - r.left + 16, y = cy - r.top - th - 14;
    if (x + tw0 > r.width - 12) x = Math.max(12, cx - r.left - tw0 - 16);
    if (y < 8) y = cy - r.top + 20;
    tip.style.left = Math.round(x) + 'px'; tip.style.top = Math.round(y) + 'px';
  }
  function hideTip() { var tip = $('#gtip'); if (tip) tip.hidden = true; tipOn = -1; $$('#gantt .ga.on').forEach(function (el) { el.classList.remove('on'); }); }
  /* 코어 드래그 : 화면 이동량 → 아이소 역변환 → 평면 이동량 (가장자리 · 가운데 근처는 붙음) */
  function bindCoreDrag() {
    var box = $('#zone'), drag = null, raf = 0, C = 0.8660254;
    function snap(v) { [0, 0.5, 1].forEach(function (t) { if (Math.abs(v - t) < 0.035) v = t; }); return Math.max(0, Math.min(1, v)); }
    function redraw(keepFocus) {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; if (!lastR) return; renderZone(lastR); renderSection(lastR); if (keepFocus) { var h = $('#zone .core-h.drag'); if (h) h.focus({ preventScroll: true }); } });
    }
    function setPos(px, py) { S.adv = S.adv || {}; S.adv.coreX = +px.toFixed(3); S.adv.coreY = +py.toFixed(3); }
    box.addEventListener('pointerdown', function (e) {
      var h = e.target.closest && e.target.closest('.core-h.drag'), sv = h && h.closest('svg[data-iso]'); if (!sv || !lastR) return;
      var d = sv.getAttribute('data-iso').split(',').map(Number), cg = coreGeom(lastR), rc = sv.getBoundingClientRect();
      drag = { x: e.clientX, y: e.clientY, k: (+sv.getAttribute('width') || rc.width) / Math.max(1, rc.width), s: d[0], fx: Math.max(1e-6, d[3] - d[1]), fy: Math.max(1e-6, d[4] - d[2]), x0: cg.x0, y0: cg.y0 };
      document.body.classList.add('dragging'); e.preventDefault();
    });
    document.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = (e.clientX - drag.x) * drag.k, dy = (e.clientY - drag.y) * drag.k, a = dx / (C * drag.s), b = 2 * dy / drag.s;
      setPos(snap((drag.x0 + (a + b) / 2) / drag.fx), snap((drag.y0 + (b - a) / 2) / drag.fy)); redraw(false);
    });
    document.addEventListener('pointerup', function () { if (!drag) return; drag = null; document.body.classList.remove('dragging'); ST.save({ inp: S, preset: current }); });
    box.addEventListener('keydown', function (e) {
      var h = e.target.closest && e.target.closest('.core-h.drag'); if (!h || !lastR) return;
      var st = e.shiftKey ? 0.25 : 0.05, cg = coreGeom(lastR), px = cg.px, py = cg.py;
      if (e.key === 'ArrowLeft') px -= st; else if (e.key === 'ArrowRight') px += st; else if (e.key === 'ArrowUp') py -= st; else if (e.key === 'ArrowDown') py += st; else return;
      e.preventDefault(); setPos(Math.max(0, Math.min(1, px)), Math.max(0, Math.min(1, py))); redraw(true); ST.save({ inp: S, preset: current });
    });
  }
  function bindTip() {
    var box = $('#gantt'), pin = false;
    box.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; var ga = e.target.closest && e.target.closest('.ga'); if (ga) { pin = false; showTip(+ga.getAttribute('data-a'), e.clientX, e.clientY); } else if (!pin) hideTip(); });
    box.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !pin) hideTip(); });
    box.addEventListener('click', function (e) { var ga = e.target.closest && e.target.closest('.ga'); if (!ga) { hideTip(); return; } var i = +ga.getAttribute('data-a'); if (pin && tipOn === i) { pin = false; hideTip(); return; } pin = true; showTip(i, e.clientX, e.clientY); });
    document.addEventListener('click', function (e) { if (pin && !(e.target.closest && e.target.closest('#gantt'))) { pin = false; hideTip(); } });
    window.addEventListener('scroll', function () { if (pin) { pin = false; hideTip(); } }, { passive: true });
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
  /* 단면이 길어지지 않게 기본 도면 높이는 낮게 (세로 과장 상한 · 층 행 최소 높이 안에서) */
  function secT0(Wc) { return Wc < 600 ? 520 : 600; }
  function section(R, Wc) { return sectionAt(R, Wc, secT0(Wc)); }
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
    function note(t, c, x, yy) { notes.push({ t: t, c: 'var(--navy)', x: x, y: yy }); }
    s += '<defs>' +
      pat(id + '-soil', 8, '<circle cx="2" cy="2" r=".6" fill="#7F90AA" opacity=".38"/><circle cx="6" cy="5.8" r=".5" fill="#7F90AA" opacity=".3"/>') +
      pat(id + '-wsoil', 9, '<circle cx="2" cy="3" r=".6" fill="#71839E" opacity=".38"/><path d="M5 7h2.4" stroke="#71839E" stroke-width=".6" opacity=".4"/>') +
      pat(id + '-wrock', 10, '<path d="M1 8l3-3M6 9.5l2.8-2.8" stroke="#647691" stroke-width=".7" opacity=".42"/>') +
      pat(id + '-srock', 8, '<path d="M-1 9L9 -1" stroke="#5B6C86" stroke-width=".6" opacity=".4"/>') +
      pat(id + '-hrock', 8, '<path d="M-1 9L9 -1M-1 -1l10 10" stroke="#4E5E78" stroke-width=".55" opacity=".42"/>') +
      pat(id + '-conc', 5, '<path d="M-1 6L6 -1" stroke="#95A4BA" stroke-width=".6"/>', '#E9EEF5') +
      pat(id + '-mat', 10, '<circle cx="2.5" cy="3" r=".7" fill="#8394AE"/><circle cx="7.2" cy="7.6" r=".55" fill="#8394AE"/>', '#E3E9F1') +
      pat(id + '-glass', 8, '<path d="M0.5 0V8" stroke="#E2E8F1" stroke-width=".8"/>', '#FAFBFD') +
      pat(id + '-fill', 7, '<path d="M-1 8L8 -1" stroke="#A3B2C8" stroke-width=".6" opacity=".6"/>', '#F1F4F9') +
      '<linearGradient id="' + id + '-sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#F3F6FB"/><stop offset="1" stop-color="#FCFDFE"/></linearGradient>' +
      '<linearGradient id="' + id + '-fd" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".05" stop-color="#fff"/><stop offset=".95" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<mask id="' + id + '-mk"><rect x="' + r1(X0 - 8) + '" y="0" width="' + r1(X1 - X0 + 16) + '" height="' + Ht + '" fill="url(#' + id + '-fd)"/></mask>' +
      '</defs>';
    /* 지층 (GL 아래 전폭, 가장자리 흐리게) + 왼쪽 주상도 막대 */
    var strata = '', log = '';
    for (var i = 0; i < 5; i++) {
      var za = g.z[i], zc = Math.min(g.z[i + 1], maxD); if (!(zc > za)) continue;
      var ya = yd(za), yc = yd(zc);
      strata += Rc(X0 - 8, ya, X1 - X0 + 16, yc - ya, 'var(--' + LKS[i] + ')', ' opacity=".9"') + Rc(X0 - 8, ya, X1 - X0 + 16, yc - ya, 'url(#' + id + '-' + LKS[i] + ')');
      log += Rc(LC - 14, ya, 10, yc - ya, 'var(--' + LKS[i] + ')') + Rc(LC - 14, ya, 10, yc - ya, 'url(#' + id + '-' + LKS[i] + ')') + (i ? Ln(X0 - 8, ya, X1 + 8, ya, '#FFFFFF', 0.8, null, ' opacity=".7"') : '');
      if (yc - ya >= 14) logYs.push({ y: ya + 13, p: 1, s: T(LC - 19, ya + 13, LNM[i], { a: 'end', fs: nar ? 10.5 : 12, w: 500, c: 'var(--ink-2)' }) });
      if (!nar && yc - ya >= 30 && isFinite(g.z[i + 1]) && g.z[i + 1] <= maxD) logYs.push({ y: yc - 5, p: 0, s: T(LC - 19, yc - 5, '−' + r1(g.z[i + 1]), { a: 'end', fs: 11, c: 'var(--ink-3)', cls: 'n' }) });
    }
    s += '<g mask="url(#' + id + '-mk)">' + Rc(X0 - 8, top, X1 - X0 + 16, yGL - top, 'url(#' + id + '-sky)') + strata + '</g>';
    log += Rc(LC - 14.5, yGL, 11, yBot - yGL, 'none', ' stroke="#8C9AB0" stroke-width=".7" rx="1.5"');
    log += T(LC - 9, yGL - 7, R.ground.assumed ? '지층 · 가정' : '지층', { a: 'middle', fs: 11, w: 600, c: R.ground.assumed ? 'var(--warn)' : 'var(--ink-3)' });
    /* 굴착 (비운 공간) · 오픈컷 사면 · 되메우기 */
    if (b.nB > 0) {
      var pit = open ? 'M' + r1(eL - sl) + ' ' + r1(yGL) + 'L' + r1(eL) + ' ' + r1(yH) + 'L' + r1(eR) + ' ' + r1(yH) + 'L' + r1(eR + sl) + ' ' + r1(yGL) + 'Z' : 'M' + r1(eL) + ' ' + r1(yGL) + 'H' + r1(eR) + 'V' + r1(yH) + 'H' + r1(eL) + 'Z';
      s += '<path d="' + pit + '" fill="#FFFFFF"/>';
      if (open) {
        s += Pg([[eL - sl, yGL], [eL, yH], [bL, yH], [bL, yGL]], ' fill="url(#' + id + '-fill)"') + Pg([[bR, yGL], [bR, yH], [eR, yH], [eR + sl, yGL]], ' fill="url(#' + id + '-fill)"');
        s += '<path d="M' + r1(eL - sl) + ' ' + r1(yGL) + 'L' + r1(eL) + ' ' + r1(yH) + 'M' + r1(eR) + ' ' + r1(yH) + 'L' + r1(eR + sl) + ' ' + r1(yGL) + '" stroke="#3B4E6C" stroke-width="1.2" fill="none"/>';
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
      s += Rc(eL - ww, yGL - 6, ww, yW - yGL + 6, '#3B4E6C', ' rx="1"') + Rc(eR, yGL - 6, ww, yW - yGL + 6, '#3B4E6C', ' rx="1"');
      if (Dt) {
        [eL - ww, eR].forEach(function (xw) {
          var hw = Math.max(1.6, ww * 0.42), xc = xw + ww / 2;
          s += Rc(xw, yW, ww, yTip - yW, '#fff', ' stroke="#3B4E6C" stroke-width=".7" stroke-dasharray="3 2.5"');
          s += Rc(xc - hw / 2, yW - 1, hw, yTip - yW + 1, 'var(--steel)') + Ln(xw - 1, yTip, xw + ww + 1, yTip, 'var(--steel)', 1.6);
        });
        s += Ln(eL - ww - 3, yW, eL + 3, yW, 'var(--navy)', 1) + Ln(eR - 3, yW, eR + ww + 3, yW, 'var(--navy)', 1);
      }
      var emb = Dtip - Hx, rk = Dtip > g.rockTop + 0.01 ? '암반' : (Dtip > g.wrockTop + 0.01 ? '풍화암' : '');
      /* 근입 치수 (오른쪽 벽 바깥) */
      if (emb > 0.05 && yTip - yH >= 7) {
        var xd = eR + ww + (anc ? 7 : 9);
        s += Ln(xd, yH, xd, yTip, '#7C8BA3', .8) + Ln(xd - 3, yH, xd + 3, yH, '#7C8BA3', .8) + Ln(xd - 3, yTip, xd + 3, yTip, '#7C8BA3', .8);
        s += T(xd + 6, (yH + yTip) / 2 + 4, '근입 ' + r1(emb) + 'm' + (rk && !nar ? ' (' + rk + ')' : ''), { fs: nar ? 10.5 : 11, w: 500, c: 'var(--ink-2)', halo: true });
      }
      note('흙막이 ' + (GE.WALL_N[b.wall] || b.wall) + ' L≈' + r1(Dw) + 'm' + (wi && wi.n ? ' (' + wi.n + ')' : '') + (Dt ? ' + 엄지말뚝 L≈' + r1(Dt) + 'm' + (wi.nT ? ' (' + wi.nT + ')' : '') : '') +
        (emb > 0.05 ? ' · 굴착 아래 근입 ' + r1(emb) + 'm' + (rk ? ' (' + rk + ')' : '') : ' · 근입 없음 (확인)') + (R.wall ? ' · ' + R.wall.sets + '조' : ''), 'var(--ink)', eL - ww / 2, Math.max(yGL + 30, yW - 14));
      if (anc) {
        var spA = LIB.support.ANCHOR.sp, dy = aPx * 0.36;
        for (var q = 0; q < nsup; q++) {
          var yq = yd(Math.min(Hx - 0.5, 1.5 + q * spA));
          s += Ln(eL - ww, yq, eL - ww - aPx, yq + dy, 'var(--accent)', .9) + Ln(eL - ww - aPx * 0.5, yq + dy * 0.5, eL - ww - aPx, yq + dy, 'var(--accent)', 2.6, null, ' stroke-linecap="round" opacity=".75"');
          s += Ln(eR + ww, yq, eR + ww + aPx, yq + dy, 'var(--accent)', .9) + Ln(eR + ww + aPx * 0.5, yq + dy * 0.5, eR + ww + aPx, yq + dy, 'var(--accent)', 2.6, null, ' stroke-linecap="round" opacity=".75"');
          s += Rc(eL - ww - 2.5, yq - 1.5, 3, 3, 'var(--accent)') + Rc(eR + ww - 0.5, yq - 1.5, 3, 3, 'var(--accent)');
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
      s += Rc(x0, r.y0, x1 - x0, r.hp, '#F7F9FC') + Rc(x0, r.y0, wt, r.hp, 'url(#' + id + '-conc)') + Rc(x1 - wt, r.y0, wt, r.hp, 'url(#' + id + '-conc)');
      if (!R.PRD) { var nCl = Math.max(2, Math.min(9, Math.round((x1 - x0) / 46))); for (var cl = 1; cl < nCl; cl++) { var xcl = x0 + (x1 - x0) * cl / nCl; s += Rc(xcl - 1, r.y0, 2, r.hp, '#E4EAF2'); } }
      s += Ln(x0, r.y0, x0, r.y1, '#8C9AB0', 0.7) + Ln(x1, r.y0, x1, r.y1, '#8C9AB0', 0.7) + Ln(x0 - 1, r.y0, x1 + 1, r.y0, 'var(--navy)', 1.4);
      if (gr.n > 1) for (var j = 1; j < gr.n; j++) { var yj = r.y0 + r.hp * j / gr.n; s += Ln(x0 - 3, yj, x0 + wt + 3, yj, 'var(--cp)', 1.3) + Ln(x1 - wt - 3, yj, x1 + 3, yj, 'var(--cp)', 1.3); }
      if (x1 - x0 > 70) s += T(x0 + wt + 6, r.y1 - 6, '−' + r1(r.dB), { fs: 10.5, c: 'var(--ink-3)', cls: 'n', halo: '#F7F9FC' });
    });
    /* 가설 지보 (지하층 위에 겹쳐) : 스트럿 · 레이커 · 역타 PRD */
    if (b.nB > 0 && !open && nsup > 0 && (b.sup === 'STRUT' || b.sup === 'RAKER')) {
      var spS = LIB.support[b.sup].sp;
      for (var q2 = 0; q2 < nsup; q2++) {
        var yq2 = yd(Math.min(Hx - 0.5, 1.5 + q2 * spS));
        if (b.sup === 'STRUT') s += Ln(eL, yq2, eR, yq2, 'var(--accent)', 1.3, '9 3', ' opacity=".8"') + Rc(eL, yq2 - 2.5, 5, 5, 'var(--accent)') + Rc(eR - 5, yq2 - 2.5, 5, 5, 'var(--accent)');
        else { var run = Math.min((yH - yq2) * 0.9, (eR - eL) * 0.3); s += Ln(eL, yq2, eL + run, yH, 'var(--accent)', 1.4, null, ' opacity=".8"') + Ln(eR, yq2, eR - run, yH, 'var(--accent)', 1.4, null, ' opacity=".8"'); }
      }
      note((b.sup === 'STRUT' ? '스트럿 (버팀보) ' : '레이커 ') + nsup + '단 · 첫 단 GL−1.5m · 간격 ' + spS + 'm', 'var(--cp-deep)', b.sup === 'STRUT' ? cx : eL + 16, yd(1.5) + (b.sup === 'STRUT' ? 0 : 14));
    }
    if (TD && b.nB > 0) note('역타 : 지하 슬래브가 지보 · 기준층 ' + R.tdBase.name + ' 슬래브 선타설 → 아래로 굴착 · 슬래브 반복', 'var(--cp-deep)', bL + (bR - bL) / Math.max(3, Math.min(7, Math.round((bR - bL) / 34))), yGL + 17);
    if (R.PRD && b.nB > 0) {
      var nC = Math.max(3, Math.min(7, Math.round((bR - bL) / 34))), yP = yd(prdL), xp0 = 0;
      for (var c = 0; c < nC; c++) { var xp = bL + (bR - bL) * (c + 0.5) / nC; if (!c) xp0 = xp; s += Ln(xp, yGL, xp, yP, '#7C8BA3', 1.5, null, ' opacity=".7"') + Rc(xp - 2.5, yP - 1, 5, 3, '#7C8BA3'); }
      note('PRD · SPS 기둥 ' + R.PRD.n + '공 · L≈' + r1(R.PRD.L) + 'm (굴착 전 선시공)', 'var(--steel)', xp0 - 12, yP + 4);
    }
    /* 기초 매트 · 얕은 기초 · 파일 */
    var mL = partial ? bL : fL, mR = partial ? bR : fR, yMt = yd(matTop), yMb = yd(matBot);
    if (!partial && b.nB > 0) { mL = Math.max(fL, eL); mR = Math.min(fR, eR); }
    s += Rc(mL, yMt, mR - mL, Math.max(3, yMb - yMt), 'url(#' + id + '-mat)', ' stroke="var(--navy)" stroke-width=".8"');
    var matLab = '매트 t=' + r1(g.tMat) + 'm';
    if (yMb - yMt >= 15 && mR - mL > tw(matLab, 11.5) + 12) s += T((mL + mR) / 2, (yMt + yMb) / 2 + 4, matLab, { a: 'middle', fs: 11, w: 600, c: 'var(--navy)', halo: '#E3E9F1' });
    else note('기초 매트 t=' + r1(g.tMat) + 'm', 'var(--ink)', mL + Math.min(34, (mR - mL) * 0.18), (yMt + yMb) / 2);
    var yShB = 0;
    if (partial) { yShB = yd(g.Hs); s += Rc(bR, yGL + 1, fR - bR, Math.max(3, yShB - yGL - 1), 'url(#' + id + '-mat)', ' stroke="var(--navy)" stroke-width=".8"'); note('얕은 기초 (지하 없는 구간) · GL−' + r1(g.Hs) + 'm', 'var(--ink)', bR + (fR - bR) * 0.5, (yGL + yShB) / 2); }
    if (pile) {
      var piles = function (a, bnd, yA) { var np = Math.max(4, Math.min(18, Math.round((bnd - a) / 13))), o = ''; for (var p = 0; p < np; p++) { var xq = a + 6 + (bnd - a - 12) * (np > 1 ? p / (np - 1) : 0.5); o += Ln(xq, yA, xq, yd(pTip), '#8C9AB0', .8) + Ln(xq - 1.8, yd(pTip) - 3, xq, yd(pTip), '#8C9AB0', .8) + Ln(xq + 1.8, yd(pTip) - 3, xq, yd(pTip), '#8C9AB0', .8); } return o; };
      s += piles(mL, mR, yMb); if (partial) s += piles(bR + 4, fR, yShB);
      if (pTr) { var yt = yd(pTip) - 10; s += '<path d="M' + r1(mL) + ' ' + r1(yt) + 'h' + r1((partial ? fR : mR) - mL) + '" stroke="#fff" stroke-width="6"/><path d="M' + r1(mL) + ' ' + r1(yt - 3) + 'h' + r1((partial ? fR : mR) - mL) + 'M' + r1(mL) + ' ' + r1(yt + 3) + 'h' + r1((partial ? fR : mR) - mL) + '" stroke="var(--ink-3)" stroke-width=".8"/>'; }
      s += T((mL + (partial ? fR : mR)) / 2, yd(pTip) + 17, (R.fType === 'PHC' ? 'PHC 파일 ' : '현장타설말뚝 ') + fmt(pile.n) + '본' + (pRock ? ' · 지지층 풍화암 GL−' + r1(g.wrockTop) + 'm' : ''), { a: 'middle', fs: 11.5, w: 500, c: 'var(--ink-2)', halo: true });
    }
    /* 굴착선 */
    if (b.nB > 0) {
      s += Ln(eL - 10, yH, eR + 10, yH, 'var(--cp)', 1.1, '5 3');
      s += T(partial ? (eL + eR) / 2 : cx, yH + 16, '굴착 GL−' + r1(Hx) + 'm', { a: 'middle', fs: 12, w: 600, c: 'var(--cp-deep)', halo: true });
    } else {
      s += Ln(fL - 6, yd(matBot), fR + 6, yd(matBot), 'var(--cp)', 1.1, '5 3');
      s += T(cx, yd(matBot) + 16, '터파기 GL−' + r1(Hx || matBot) + 'm', { a: 'middle', fs: 12, w: 600, c: 'var(--cp-deep)', halo: true });
    }
    /* 지상층 (입면) */
    /* 코어 띠 : 평면 (조닝 지상 판) 에서 옮긴 코어 위치를 긴 변 방향으로 그대로 — 옥탑은 코어 위에 */
    var up = '', elL = '', cg = coreGeom(R), coreX0 = 0, coreW = 0;
    if (cg) { coreW = Math.max(6, cg.cw / cg.L * (tR - tL)); coreX0 = tL + cg.x0 / cg.L * (tR - tL); }
    else if (hasCore) { coreW = Math.max(8, (tR - tL) * 0.2); coreX0 = cx - coreW / 2; }
    rows.forEach(function (r, gi) {
      if (r.bl) return;
      var gr = r.gr, isPH = gr.kind === 'ph', w = isPH ? Math.max(26, (tR - tL) * 0.36) : (gr.kind === 'b' ? bR - bL : tR - tL), x = cx - w / 2;
      if (isPH && coreW) x = Math.max(tL, Math.min(tR - w, coreX0 + coreW / 2 - w / 2));
      r.xr = x + w;
      up += Rc(x, r.y0, w, r.hp, 'url(#' + id + '-glass)');
      var ca = coreW ? Math.max(x, coreX0) : 0, cb = coreW ? Math.min(x + w, coreX0 + coreW) : 0;
      if (cb > ca) up += Rc(ca, r.y0, cb - ca, r.hp, '#E3EAF5') + Ln(ca, r.y0, ca, r.y1, '#A4B6D1', 0.7) + Ln(cb, r.y0, cb, r.y1, '#A4B6D1', 0.7);
      var segN = gr.cnt > 1 ? Math.min(gr.cnt, 6) : 1;
      for (var j = 1; j < segN; j++) { var yj = r.y0 + r.hp * j / segN; up += Ln(x, yj, x + w, yj, '#C6D1E0', 0.6); }
      if (gr.n > 1) {
        var coreOnly = /^코어/.test(gr.p || '') && cb > ca;
        for (var sg = 0; sg < segN; sg++) for (var jj = 1; jj < gr.n; jj++) {
          var yk = r.y0 + r.hp * (sg + jj / gr.n) / segN;
          up += coreOnly ? Ln(ca, yk, cb, yk, 'var(--cp)', 1.2, '4 2.5') : Ln(x + 1, yk, x + w - 1, yk, 'var(--cp)', 1.1, '5 3');
        }
      }
      up += Ln(x, r.y0, x, r.y1, 'var(--navy)', 1) + Ln(x + w, r.y0, x + w, r.y1, 'var(--navy)', 1);
      up += Ln(x - 1.5, r.y0, x + w + 1.5, r.y0, 'var(--navy)', gi === 0 ? 1.8 : 1.3) + Ln(x - 1.5, r.y1, x + w + 1.5, r.y1, 'var(--navy)', 1.3);
      if (gr.cnt > 1) {
        var ym = (r.y0 + r.y1) / 2, lab = '× ' + gr.cnt + '개층', lw = tw(lab, 11) + 16, lx0 = x + w / 2;
        up += '<path d="M' + r1(x - 5) + ' ' + r1(ym - 6) + 'l4 3-4 3 4 3M' + r1(x + w + 5) + ' ' + r1(ym - 6) + 'l-4 3 4 3-4 3" fill="none" stroke="#8C9AB0" stroke-width=".9"/>';
        if (w > lw + 8) up += Rc(lx0 - lw / 2, ym - 9, lw, 18, '#fff', ' rx="9" stroke="#C9D4E3" stroke-width=".8"') + T(lx0, ym + 3.8, lab, { a: 'middle', fs: 11, w: 600, c: 'var(--ink-2)', cls: 'n' });
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
    s += Ln(X0 - 8, yGL, X1 + 8, yGL, 'var(--navy)', 1.3);
    var gh = '', gEndL = b.nB > 0 ? (open ? eL - sl - (R.scw ? 9 : 0) : eL - ww) - 3 : fL - 4, gStartR = b.nB > 0 ? (open ? (partial ? Math.max(fR, eR + sl) : eR + sl) + (R.scw ? 9 : 0) : eR + ww) + 3 : fR + 4;
    for (var hx = X0; hx < gEndL - 4; hx += 8) gh += 'M' + r1(hx + 5) + ' ' + r1(yGL + 1) + 'l-5 6';
    for (hx = gStartR; hx < X1; hx += 8) gh += 'M' + r1(hx + 5) + ' ' + r1(yGL + 1) + 'l-5 6';
    s += '<path d="' + gh + '" stroke="#8C9AB0" stroke-width=".8" fill="none"/>';
    s += T(LC - 4, yGL - 22, 'GL ±0', { a: 'end', fs: 12, w: 700, c: 'var(--ink)' });
    s += log + logYs.map(function (L) { return L.s; }).join('');
    /* 왼쪽 치수선 (넓은 화면) */
    function dimV(x, ya, yb, col, lab) {
      var o = Ln(x, ya, x, yb, col, .8) + Ln(x - 3.5, ya + 3.5, x + 3.5, ya - 3.5, col, 1.2) + Ln(x - 3.5, yb + 3.5, x + 3.5, yb - 3.5, col, 1.2) + Ln(x - 5, ya, x + 9, ya, col, 0.6) + Ln(x - 5, yb, x + 9, yb, col, 0.6);
      var my = (ya + yb) / 2; return o + T(x - 7, my, lab, { a: 'middle', fs: 11.5, w: 600, c: col, cls: 'n', tr: 'rotate(-90 ' + r1(x - 7) + ' ' + r1(my) + ')' });
    }
    if (!nar) {
      s += dimV(22, rows[0].y0, yGL, '#6B7B95', '높이 ' + r1(elTop) + 'm');
      if (b.nB > 0 && yH - yGL > 60) s += dimV(22, yGL, yH, 'var(--cp-deep)', '굴착 ' + r1(Hx) + 'm');
    }
    /* 주석 번호 (도면 키노트) */
    notes.forEach(function (n, i) {
      var nx = Math.max(10, Math.min(W - RW - 10, n.x)), ny = Math.max(10, Math.min(Ht - 10, n.y));
      s += '<circle cx="' + r1(nx) + '" cy="' + r1(ny) + '" r="8" fill="' + n.c + '" stroke="#fff" stroke-width="1.6"/>' + T(nx, ny + 3.6, String(i + 1), { a: 'middle', fs: 10, w: 700, c: '#fff', cls: 'n' });
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
      s += T(cLab, ym + fs * 0.36 + (two ? -6 : 0), lab, { fs: fs, w: 600, c: 'var(--navy)', cls: 'n' });
      if (two) s += T(cLab, ym + 13, gr.cnt + '개층', { fs: 11.5, c: 'var(--ink-3)' });
      var pTxt = gr.p || (r.bl && TD ? '역타' : (gr.n > 1 ? gr.n + '회' : '1회')), hot = gr.n > 1;
      var inp = '<input class="fh' + (nar ? ' fh-l' : '') + '" type="number" min="2" max="30" step="0.05" inputmode="decimal" data-g="' + gi + '" data-floor-h="' + esc(gr.label) + '" value="' + (+gr.h.toFixed(2)) + '" aria-label="' + esc(gr.label) + ' 층고 (m)" title="' + esc(gr.label) + ' 층고 — 바꾸면 바로 공기에 반영"';
      if (nar) {
        var elT = r.bl ? 'GL−' + r1(r.dB) : (r.elB > 0 ? '+' + r1(r.elB) : 'GL');
        lst += '<div class="fr' + (hot ? ' hot' : '') + (r.bl ? ' bl' : '') + '"><span class="fl">' + esc(lab) + (gr.cnt > 1 ? '<small>' + gr.cnt + '개층</small>' : '') + '</span>' + inp + '><span class="fp">' + esc(pTxt.replace(' 타설', '')) + '</span><span class="fe">' + elT + '</span></div>';
        return;
      }
      s += Rc(cP, ym - 10, wP, 20, hot ? 'var(--cp-soft)' : 'var(--band)', ' rx="10"' + (hot ? ' stroke="var(--cp-line)" stroke-width=".8"' : '')) + T(cP + wP / 2, ym + 4, pTxt, { a: 'middle', fs: 11.5, w: hot ? 600 : 400, c: hot ? 'var(--cp-deep)' : 'var(--ink-3)' });
      html += inp + ' style="left:' + cIn + 'px;top:' + r1(ym - 13) + 'px;width:' + wIn + 'px">';
    });
    /* 아래 : 가로 축척 + 세로 과장 배율 (지하 · 단일 층 기준) */
    var nice = [5, 10, 20, 25, 50, 100, 200], sm = 200; for (var ni = 0; ni < nice.length; ni++) if (nice[ni] * hs >= 40) { sm = nice[ni]; break; }
    var ysb = Ht - 14, smx = X0 + sm * hs, vx = k / hs;
    s += Rc(X0, ysb - 4, sm * hs / 2, 4, 'var(--ink-2)') + Rc(X0 + sm * hs / 2, ysb - 4, sm * hs / 2, 4, '#fff', ' stroke="var(--ink-2)" stroke-width=".8"');
    s += T(X0, ysb - 9, '0', { fs: 10.5, c: 'var(--ink-3)', cls: 'n', a: 'middle' }) + T(smx, ysb - 9, sm + 'm', { fs: 10.5, c: 'var(--ink-3)', cls: 'n', a: 'middle' });
    var vxT = '세로 ×' + r1(vx), vxW = tw(vxT, 11.5) + 16, vxX = smx + 14;
    if (vx > 1.15) s += Rc(vxX, ysb - 13, vxW, 18, 'var(--cp-soft)', ' rx="9"') + T(vxX + vxW / 2, ysb, vxT, { a: 'middle', fs: 11, w: 600, c: 'var(--cp-deep)', cls: 'n' });
    else vxW = -14;
    if (vx <= 1.15) s += T(smx + tw(sm + 'm', 10.5) / 2 + 10, ysb, '같은 축척', { fs: 11, c: 'var(--ink-3)' });
    var nh = notes.map(function (n, i) { return '<li><i style="background:' + n.c + '">' + (i + 1) + '</i><span>' + esc(n.t) + '</span></li>'; }).join('');
    if (lst) lst = '<div class="fhl" role="group" aria-label="층별 층고 (바꾸면 바로 다시 계산)"><div class="fr hd"><span>층</span><span>층고 (m)</span><span>타설</span><span>바닥 EL</span></div>' + lst + '</div>';
    return { html: '<div class="sec7" style="width:' + W + 'px;height:' + Ht + 'px">' + svgEl(W, Ht, s, '가정 단면도 · 지상 ' + b.nUp + '층 · 지하 ' + b.nB + '층') + html + '</div>' + lst, groups: G, elTop: elTop, notes: nh, Ht: Ht, vx: vx };
  }
  function renderSection(R) {
    var box = $('#section'), sc = section(R, box.clientWidth || 700);
    secG = sc.groups; box.innerHTML = sc.html; widths.section = box.clientWidth;
    $('#s-notes').innerHTML = sc.notes; $('#s-notes').hidden = !sc.notes;
    var b = R.basic, fr = R.frame, two = sc.groups.filter(function (x) { return x.n > 1 && x.kind !== 'b'; });
    $('#s-chips').innerHTML = '<span>지상 <b>' + b.nUp + '</b>층' + (b.nPH ? ' + 옥탑 <b>' + b.nPH + '</b>' : '') + ' · 지하 <b>' + b.nB + '</b>층</span>' +
      '<span>높이 <b>' + r1(sc.elTop) + '</b>m' + (b.nB > 0 ? ' · 굴착 GL−<b>' + r1(R.geo.H) + '</b>m' : '') + '</span>' +
      (two.length ? '<span class="hot" title="' + esc(fr.dc ? '층고 ' + LIB.dc.split + 'm 이상 = 수직재 2회' : fr.coreRows.length ? '코어 ' + LIB.frame.core.liftMax + 'm 초과 = 2 Lift' : '층고 ' + LIB.frame.split + 'm 이상 = 수직재 2회 (층 사이클 ×' + r2(1 + LIB.frame.vShare) + ')') + '">2회 타설 : ' + esc(two.map(function (x) { return x.label; }).join(', ')) + '</span>' : '');
    var sw = function (k) { return '<svg width="18" height="12" aria-hidden="true"><rect width="18" height="12" rx="3" fill="var(--' + k + ')" opacity=".6"/><rect width="18" height="12" rx="3" fill="url(#o7s-' + k + ')"/></svg>'; };
    $('#s-lg').innerHTML = LKS.map(function (k, i) { return '<span>' + sw(k) + LNM[i] + '</span>'; }).join('') +
      '<span><svg width="22" height="12" aria-hidden="true"><path d="M1 6h20" stroke="var(--gwl)" stroke-width="1.6" stroke-dasharray="5 3"/></svg>지하수위</span>' +
      '<span><svg width="22" height="12" aria-hidden="true"><path d="M1 6h20" stroke="var(--cp)" stroke-width="1.6" stroke-dasharray="5 3"/></svg>굴착선 · 타설 이음</span>' +
      '<span><svg width="22" height="12" aria-hidden="true"><path d="M2 3l18 6" stroke="var(--cp)" stroke-width="1.3"/><path d="M11 6l9 3" stroke="var(--cp)" stroke-width="3.2" stroke-linecap="round" opacity=".85"/></svg>지보</span>' +
      '<span><svg width="18" height="12" aria-hidden="true"><rect width="18" height="12" rx="3" fill="url(#o7s-mat)" stroke="var(--ink-2)" stroke-width=".8"/></svg>매트</span>';
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

  /* ───────── 조닝 아래 사이클 바차트 : 엔진이 실제로 계산한 단위 (기초 = 준비 · 철근 · 형틀 Zone 1개, 지하 = 층별 외벽 · 바닥 또는 역타 Zone 순환,
     지상 = DC 는 외주부 · 코어 공종, 일반은 팀당 Zone 연속) — 막대 = 시작 · 기간 (WD), 진한 레인 = 층 사이클을 정하는 쪽 */
  function cyRow(n, segs, v, o) { o = o || {}; return { n: n, segs: segs, v: v, ghost: o.ghost || null, tip: o.tip || '' }; }
  function cyFound(R) {
    var f = R.found, a = f.prep, b = a + f.R, rows = [
      cyRow('준비', [{ s: 0, d: f.prep }], r1(f.prep), { tip: '영구배수 · 버림 · 먹' }),
      cyRow('철근', [{ s: a, d: f.R }], r1(f.R), { ghost: f.nPit ? { s: b, d: f.Rpit - f.R, lab: 'PIT +' + r1(f.Rpit - f.R) } : null, tip: r1(f.reb) + 't ÷ ' + r1(f.tpd) + 't/일 (' + f.crew + '명)' }),
      cyRow('형틀 · 타설', [{ s: b, d: f.tail }], r1(f.tail), { tip: '형틀 · 검측 · 타설' })
    ];
    return { tot: f.cyc + (f.nPit ? f.Rpit - f.R : 0), v: r1(f.cyc), u: 'WD / Zone', x: f.nPit ? 'PIT ' + r1(f.cycPit) : '', lanes: [{ rows: rows }] };
  }
  function cyBase(R) {
    var bs = R.base, b = R.basic, g = R.geo, hF = b.hF || 1;
    if (!bs || b.nB === 0) return null;
    if (bs.td) {
      var TD = LIB.td, n1 = Math.max(2, Math.min(4, Math.round(g.Adeep / TD.f1ZoneA))), z = TD.f1Zone / hF, lag = TD.f1Lag / hF, rows = [];
      for (var i = 0; i < n1; i++) rows.push(cyRow('Zone ' + (i + 1), [{ s: i * lag, d: z }], r1(z)));
      return { tot: z + (n1 - 1) * lag, v: r1(z + (n1 - 1) * lag), u: 'WD / 슬래브', x: '아래층 ×' + TD.slabF, lanes: [{ rows: rows }] };
    }
    if (bs.partial) {
      var p = bs.path, t = 0, rp = [];
      rp.push(cyRow('외벽', [{ s: t, d: p.walls }], r1(p.walls))); t += p.walls;
      if (p.backfill > 0) { rp.push(cyRow('방수 · 되메우기', [{ s: t, d: p.backfill }], r1(p.backfill))); t += p.backfill; }
      rp.push(cyRow(p.nSlab > 1 ? '바닥 ' + p.nSlab + '개층' : '바닥', [{ s: t, d: p.slab }], r1(p.slab))); t += p.slab;
      return { tot: t, v: r1(t), u: 'WD', x: '', lanes: [{ rows: rp }] };
    }
    var t2 = 0, rb = [];
    bs.rows.forEach(function (x) { rb.push(cyRow(x.lv, [{ s: t2, d: x.Vw, k: 'w' }, { s: t2 + x.Vw, d: x.Sw }], m1(x.wd), { tip: '외벽 ' + x.lifts + '회 ' + m1(x.Vw) + ' → 바닥 ' + m1(x.Sw) })); t2 += x.wd; });
    return { tot: t2, v: m1(t2 / Math.max(1, bs.rows.length)), u: 'WD / 층', x: '', key: [['w', '외벽'], ['', '바닥']], lanes: [{ rows: rb }] };
  }
  function cyTyp(R) {
    var fr = R.frame, ty = fr.typ, tact = GK.tactOf(R);
    if (ty.dc) {
      var d = ty.dc, nV = (d.lifts || 1) * 5;
      var lane = function (st) {
        var rows = [], t = 0;
        for (var q = 0; q < nV; q += 5) {
          var segs = [], t0 = t, nm = [];
          st.items.slice(q, q + 5).forEach(function (it) { segs.push({ s: t, d: it[1] }); nm.push(it[0].replace(/ \d\/\d차$/, '') + ' ' + r1(it[1])); t += it[1]; });
          rows.push(cyRow(nV > 5 ? '수직재 ' + (q / 5 + 1) + '차' : '수직재', segs, r1(t - t0), { tip: nm.join(' → ') }));
        }
        st.items.slice(nV).forEach(function (it) { rows.push(cyRow(it[0], [{ s: t, d: it[1] }], r1(it[1]))); t += it[1]; });
        return { name: st.name, info: st.N + ' Zone · ' + st.T + '팀', gov: d.gov === st.name, rows: rows };
      };
      var P = lane(d.P), C = lane(d.C);
      return { tot: Math.max(d.P.zone, d.C.zone), v: m1(tact), u: 'WD / 층', x: '', lanes: [P, C] };
    }
    var sl = ty.slab, per = sl.per, zs = sl.wd > 0 ? Math.min(sl.wd, per * fr.dS * (sl.lk || 1) * (sl.hf || 1)) / per : 0, lanes = [], segs = [];
    for (var i = 0; i < per; i++) segs.push({ s: i * zs, d: zs, lab: i + 1 });
    var tot = sl.wd;
    lanes.push({ name: ty.core ? '외주부' : '외주부 · 코어 일체', info: sl.Z + ' Zone · ' + sl.T + '팀' + (sl.lifts > 1 ? ' · 수직재 ' + sl.lifts + '회' : ''), gov: !ty.core || sl.wd >= ty.core.wd,
      rows: [cyRow('팀당 ' + per + ' Zone', segs, m1(sl.wd), { ghost: sl.wd > per * zs + 0.05 ? { s: per * zs, d: sl.wd - per * zs, lab: '최소' } : null, tip: 'Zone ' + r2(zs) + 'WD × ' + per })] });
    if (ty.core) {
      var c = ty.core, nc = c.per * c.lifts, zc = c.wd / Math.max(1, nc), sc = [];
      for (var j = 0; j < nc; j++) sc.push({ s: j * zc, d: zc, lab: j + 1 });
      lanes.push({ name: '코어', info: c.Z + ' Zone · ' + c.T + '팀' + (c.lifts > 1 ? ' · ' + c.lifts + ' Lift' : ''), gov: c.wd > sl.wd, rows: [cyRow('팀당 ' + c.per + ' Zone', sc, m1(c.wd), { tip: 'Zone ' + r2(zc) + 'WD × ' + nc })] });
      tot = Math.max(tot, c.wd);
    }
    return { tot: tot, v: m1(tact), u: 'WD / 층', x: '', lanes: lanes };
  }
  function cyHTML(c) {
    if (!c) return '';
    var T = Math.max(c.tot, 0.01), F = function (v) { return (v / T).toFixed(4); }, multi = c.lanes.length > 1, h = '';
    h += '<div class="cy-hd"><span>사이클</span><b>' + c.v + '</b><small>' + esc(c.u) + '</small>' + (c.x ? '<em>' + esc(c.x) + '</em>' : '') +
      (c.key ? '<span class="cy-key">' + c.key.map(function (k) { return '<i class="' + k[0] + '"></i>' + esc(k[1]); }).join('') + '</span>' : '') + '</div>';
    c.lanes.forEach(function (ln) {
      if (multi) h += '<div class="cy-ln' + (ln.gov ? ' gov' : '') + '"><b>' + esc(ln.name) + '</b><span>' + esc(ln.info) + '</span></div>';
      h += '<div class="cy-g' + (multi && !ln.gov ? ' sub' : '') + '">';
      ln.rows.forEach(function (r) {
        var e = 0, bars = r.segs.map(function (q) { e = Math.max(e, q.s + q.d); return '<i class="' + (q.k || '') + '" style="--s:' + F(q.s) + ';--w:' + F(q.d) + '">' + (q.lab != null ? '<span>' + q.lab + '</span>' : '') + '</i>'; }).join('');
        if (r.ghost && r.ghost.d > 0.01) { bars += '<i class="gh" style="--s:' + F(r.ghost.s) + ';--w:' + F(r.ghost.d) + '"></i>'; }
        var ve = r.ghost && r.ghost.d > 0.01 ? r.ghost.s + r.ghost.d : e;
        h += '<div class="cy-r"' + (r.tip ? ' title="' + esc(r.tip) + '"' : '') + '><span class="cy-n">' + esc(r.n) + '</span><span class="cy-t">' + bars +
          '<em style="--e:' + F(ve) + '">' + r.v + (r.ghost && r.ghost.lab ? '<small>' + esc(r.ghost.lab) + '</small>' : '') + '</em></span></div>';
      });
      h += '</div>';
    });
    return '<div class="cy">' + h + '</div>';
  }

  /* ───────── 조닝 : 아이소메트릭 적층 (기준층 · 지하골조 · 기초, 같은 축척) */
  /* 지상 코어 : 면적 = 코어 비율 (DC 는 엔진 코어 면적), 모양은 깊이 ≤ 단변 0.6 의 직사각형.
     위치 (S.adv.coreX · coreY = 0~1, 남는 폭 안의 비율) 는 조닝 판에서 드래그 — 공기 계산에는 쓰지 않는 배치 가정 */
  function coreGeom(R) {
    var fr = R.frame, ty = fr.typ, Au = fr.Atyp;
    if (!(Au > 0)) return null;
    /* RC (코어 별도 경로 없음) 도 코어 벽체는 있으므로 같은 비율의 '일체 타설' 코어로 배치 · PIT 위치에만 쓴다 */
    var Ac = ty.dc ? ty.dc.Ac : Au * LIB.frame.core.ratio, integ = !(ty.dc || ty.core); if (!(Ac > 0)) return null;
    var L = Math.sqrt(Au * 1.6), B = Math.sqrt(Au / 1.6), cd = Math.min(B * 0.6, Math.sqrt(Ac / 1.5)), cw = Ac / cd;
    if (cw > L * 0.6) { cw = L * 0.6; cd = Math.min(B * 0.9, Ac / cw); }
    var A = S.adv || {}, px = A.coreX != null && isFinite(A.coreX) ? Math.max(0, Math.min(1, +A.coreX)) : 0.5, py = A.coreY != null && isFinite(A.coreY) ? Math.max(0, Math.min(1, +A.coreY)) : 0.5;
    return { L: L, B: B, cw: cw, cd: cd, px: px, py: py, x0: px * (L - cw), y0: py * (B - cd), Ac: Ac, integ: integ };
  }
  /* PIT : 지상 코어 아래 (평면 비율 위치를 기초 평면에 그대로) 의 기초 Zone — 수는 S.adv.pitN (사례 보정값), 없으면 2개.
     부분 지하는 깊은 구간 Zone 안에서만. 지하층 없으면 PIT 없음 */
  function pitUnderCore(R) {
    var f = R.found, b = R.basic, cg = coreGeom(R);
    if (!cg || b.nB === 0 || !(f.nZ > 0)) return null;
    var Af = f.Af > 0 ? f.Af : R.geo.bldg, Lf = Math.sqrt(Af * 1.6), Bf = Math.sqrt(Af / 1.6), n = S.adv && S.adv.pitN > 0 ? Math.round(S.adv.pitN) : 2;
    var tx = (cg.x0 + cg.cw / 2) / cg.L * Lf, ty = (cg.y0 + cg.cd / 2) / cg.B * Bf;
    var cells = zgridPlan(0, 0, Lf, Bf, f.nZ, function (i) { return { i: i }; }).filter(function (c) { return !(f.nDeep > 0 && f.nDeep < f.nZ) || c.i < f.nDeep; });
    cells.forEach(function (c) { c.d = Math.hypot((c.X0 + c.X1) / 2 - tx, (c.Y0 + c.Y1) / 2 - ty); });
    return cells.sort(function (a, c) { return a.d - c.d; }).slice(0, Math.max(1, Math.min(n, cells.length))).map(function (c) { return c.i; });
  }
  function coreWhere(cg) {
    var e = 0.04, edge = cg.px < e || cg.px > 1 - e || cg.py < e || cg.py > 1 - e;
    return (cg.px < 0.3 ? '좌측' : cg.px > 0.7 ? '우측' : '중앙') + ' · ' + (edge ? '외주부 면함' : '내부');
  }
  /* 바닥 Zone : 코어를 뺀 나머지 (코어 왼쪽 · 위 · 아래 · 오른쪽 띠) 에 면적 비례로 나눠 이어 번호 */
  function slabCells(L, B, cg, N, cellOf) {
    if (!cg) return zgridPlan(0, 0, L, B, N, cellOf);
    var x0 = cg.x0, x1 = cg.x0 + cg.cw, y0 = cg.y0, y1 = cg.y0 + cg.cd;
    var rs = [[0, 0, x0, B], [x0, 0, x1 - x0, y0], [x0, y1, x1 - x0, B - y1], [x1, 0, L - x1, B]].filter(function (r) { return r[2] > 0.5 && r[3] > 0.5; });
    var tot = rs.reduce(function (a, r) { return a + r[2] * r[3]; }, 0), n = rs.map(function (r) { return Math.floor(N * r[2] * r[3] / tot); }), left = N - n.reduce(function (a, v) { return a + v; }, 0);
    rs.map(function (r, i) { return { i: i, f: N * r[2] * r[3] / tot - n[i] }; }).sort(function (a, b) { return b.f - a.f; }).forEach(function (q) { if (left > 0) { n[q.i]++; left--; } });
    var out = [], base = 0;
    rs.forEach(function (r, i) {
      if (n[i] > 0) { var b0 = base; out = out.concat(zgridPlan(r[0], r[1], r[2], r[3], n[i], function (j) { return cellOf(b0 + j); })); base += n[i]; }
      else { var nb = cellOf(Math.max(0, base - 1)); nb.t = ''; nb.X0 = r[0]; nb.X1 = r[0] + r[2]; nb.Y0 = r[1]; nb.Y1 = r[1] + r[3]; out.push(nb); }
    });
    return out;
  }
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
    var C = 0.8660254, pad = 14, tz = o.tz || 9, hc = o.core ? (o.core.integ ? 9 : 20) : 0, Lp = o.Lp, Bp = o.Bp;
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
      var k0 = o.core.x0 || 0, k1 = k0 + o.core.cw, j0 = o.core.y0 || 0, j1 = j0 + (o.core.cd || Br);
      v += '<g class="core-h' + (o.core.drag ? ' drag' : '') + '"' + (o.core.drag ? ' tabindex="0" role="slider" aria-label="코어 위치 (드래그 · 방향키)" aria-valuetext="' + esc(o.core.where || '') + '"' : '') + '>';
      v += Pg([P(k0, j1, 0), P(k1, j1, 0), P(k1, j1, hc), P(k0, j1, hc)], ' fill="#9DB0CC"') + Pg([P(k1, j0, 0), P(k1, j1, 0), P(k1, j1, hc), P(k1, j0, hc)], ' fill="#7F95B8"');
      v += Pg([P(k0, j0, hc), P(k1, j0, hc), P(k1, j1, hc), P(k0, j1, hc)], ' fill="#EEF2F8"');
      v += cells(o.core.cells, hc);
      v += Pg([P(k0, j0, hc), P(k1, j0, hc), P(k1, j1, hc), P(k0, j1, hc)], ' class="core-top" fill="none" stroke="var(--navy)" stroke-width="1.1" stroke-linejoin="round"');
      if (o.core.drag) { var cm = P(k0, j0, hc); v += '<g class="core-grip" transform="translate(' + r1(cm[0]) + ' ' + r1(cm[1] - 13) + ')"><rect x="-17" y="-8" width="34" height="16" rx="8" fill="var(--navy)"/><path d="M-9 0h18M-9 0l3-3M-9 0l3 3M9 0l-3-3M9 0l-3 3" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>'; }
      v += '</g>';
    }
    /* 판 두께 표기 (기초 매트) : 오른쪽 앞 모서리 옆 */
    if (o.tLab) { var pq = P(Lr, Br), qx = pq[0] - 6; v += Ln(qx, pq[1] + 1, qx, pq[1] + tz, 'var(--navy)', 0.9) + Ln(qx - 3, pq[1] + 1, qx + 3, pq[1] + 1, 'var(--navy)', 0.9) + Ln(qx - 3, pq[1] + tz, qx + 3, pq[1] + tz, 'var(--navy)', 0.9) + T(qx - 6, pq[1] + tz / 2 + 4, o.tLab, { a: 'end', fs: 11.5, w: 600, c: 'var(--navy)', cls: 'n', halo: true }); }
    /* 변 치수 (앞 두 변) */
    var mx = (pl[0] + pb[0]) / 2 - 7, my = (pl[1] + pb[1]) / 2 + tz + 12, nx = (pb[0] + pr[0]) / 2 + 7, ny = (pb[1] + pr[1]) / 2 + tz + 12;
    if (Lr * s > 40) v += T(mx, my, '≈ ' + r1(Lr) + ' m', { a: 'middle', fs: 11.5, w: 500, c: 'var(--ink-2)', cls: 'n', tr: 'rotate(30 ' + r1(mx) + ' ' + r1(my) + ')' });
    if (Br * s > 34) v += T(nx, ny, '≈ ' + r1(Br) + ' m', { a: 'middle', fs: 11.5, w: 500, c: 'var(--ink-2)', cls: 'n', tr: 'rotate(-30 ' + r1(nx) + ' ' + r1(ny) + ')' });
    var svg = svgEl(FW, H, v, o.aria);
    /* 드래그용 : 화면 → 평면 좌표 변환에 쓰는 값 */
    return o.core && o.core.drag ? svg.replace('<svg ', '<svg data-iso="' + r2(s) + ',' + r2(o.core.cw) + ',' + r2(o.core.cd) + ',' + r2(Lr) + ',' + r2(Br) + '" ') : svg;
  }
  /* 팀수 조절 : − n팀 + · 최적이 아니면 '최적 n팀 · 공기' 버튼 */
  function teamCtl(key, lab, cur, sw) {
    var opt = sw ? sw.opt : cur, max = sw ? sw.max : 10;
    return '<span class="tm" data-team="' + key + '" data-max="' + max + '"><span class="tm-k">' + esc(lab) + '</span>' +
      '<button type="button" class="tm-b" data-tstep="-1" aria-label="' + esc(lab) + ' 줄이기"' + (cur <= 1 ? ' disabled' : '') + '>−</button><b class="tm-v">' + cur + '</b><span class="tm-u">팀</span>' +
      '<button type="button" class="tm-b" data-tstep="1" aria-label="' + esc(lab) + ' 늘리기"' + (cur >= max ? ' disabled' : '') + '>+</button>' +
      (!sw ? '' : cur === opt ? '<span class="tm-o on" title="최단 공기와 ' + OPT_TOL + '개월 이내인 가장 적은 팀수">최적</span>' :
        '<button type="button" class="tm-o" data-topt="' + opt + '" title="최단 공기와 ' + OPT_TOL + '개월 이내인 가장 적은 팀수 — 누르면 적용 (공기 ' + m2(sw.totals[opt - 1]) + '개월)">최적 ' + opt + '팀 · ' + dM(sw.totals[opt - 1] - (lastR ? lastR.total : sw.totals[opt - 1])) + '</button>') + '</span>';
  }
  function dM(d) { return Math.abs(d) < 0.005 ? '공기 같음' : (d > 0 ? '+' : '−') + m2(Math.abs(d)) + '개월';
  }
  function zoning(R, Wc) {
    /* 배치 : 좁으면 (또는 옆 단면이 훨씬 높아 세로 여유가 있으면 big) 한 줄 머리 + 큰 판, 보통은 이름 왼쪽 · 판 오른쪽,
       넓으면 (타일이 전체 폭) 세 판을 가로로 나란히. 판 폭은 480px 까지 */
    var W = Math.max(280, Math.floor(Wc)), nar = W < 470, cols = W >= 860, f = R.found, b = R.basic, g = R.geo, fr = R.frame, AR = 1.6;
    var Af = f.Af > 0 ? f.Af : g.bldg, Ab = b.nB > 0 ? g.AdnEff : 0, Au = fr.Atyp;
    function dim(A) { A = Math.max(0, A || 0); return { A: A, L: Math.sqrt(A * AR), B: Math.sqrt(A / AR) }; }
    var dF = dim(Af), dB = dim(Ab), dU = dim(Au);
    var FW = Math.min(480, cols ? Math.floor(W / 3) - 38 : nar ? W : W - 160 - 14);
    var Lmax = Math.max(dF.L, dB.L, dU.L, 1), s = (FW - 28) / ((Lmax + Lmax / AR) * 0.8660254);
    var maxT = 1, steel = b.struct === 'SC' || b.struct === 'COMP';
    function row(lv, title, area, d, lines, svgHtml, cy) {
      return '<div class="iso-row"><div class="iso-lab"><span class="lv">' + esc(lv) + '</span><h3>' + esc(title) + '</h3>' +
        '<div class="ar"><b>' + fmt(area) + '</b> ㎡<span>≈ ' + r1(d.L) + ' × ' + r1(d.B) + ' m</span></div><ul>' + lines.filter(Boolean).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
        '<div class="iso-fig">' + svgHtml + '</div><div class="iso-cy">' + cyHTML(cy) + '</div></div>';
    }
    /* 기초 : 판 두께 = 매트 두께 (세로 ×4), PIT = 지상 코어 아래 Zone (굵은 테두리) */
    var oF = '', oB = '', oU = '';
    maxT = Math.max(maxT, f.teams);
    if (Af > 0) {
      var Z = f.sim.Z.slice().sort(function (a, c) { return a.pour - c.pour; }), rank = {}, byI = {};
      Z.forEach(function (z, i) { rank[z.i] = i + 1; byI[z.i] = z; });
      var cellsF = zgridPlan(0, 0, dF.L, dF.B, f.nZ, function (i) { var z = byI[i] || { team: 1 }; return { fill: TEAMC[(z.team - 1) % 8], op: z.slope ? 0.22 : 0.58, stroke: z.pit ? 'var(--cp)' : '#fff', sw: z.pit ? 2.4 : 1.2, t: rank[i] || '' }; });
      var tzF = Math.max(7, Math.min(28, g.tMat * s * 4));
      oF = row('기초 · ' + GE.FOUND_N[R.fType].replace(/ \(.*\)/, ''), '기초', Af, dF, [
        '<b>' + f.nZ + '</b> Zone · 매트 <b>' + r1(g.tMat) + '</b>m',
        teamCtl('fTeams', '철근팀', f.teams, R.team && R.team.f),
        f.nPit ? 'PIT <b>' + f.nPit + '</b> Zone · 코어 아래' : ''
      ], isoPlate({ Lp: dF.L, Bp: dF.B, Lr: dF.L, Br: dF.B, cells: cellsF, tz: tzF, tLab: 't=' + r1(g.tMat) + 'm', aria: '기초 조닝 평면 (아이소메트릭) · 매트 ' + r1(g.tMat) + 'm' }, s, FW, 2), cyFound(R));
    } else oF = '<div class="iso-none">건축면적을 넣으면 기초 평면이 그려집니다.</div>';
    /* 지하골조 */
    var bs = R.base;
    if (!bs || b.nB === 0) oB = '<div class="iso-none">지하층 없음 · 기초 위에서 바로 지상골조</div>';
    else if (Ab > 0) {
      var NZ, NT, sub;
      if (bs.td) { NZ = Math.max(2, Math.min(4, Math.round(g.Adeep / LIB.td.f1ZoneA))); NT = NZ; sub = ['역타 슬래브 <b>' + NZ + '</b> Zone 순환']; }
      else if (bs.partial) { NZ = Math.max(1, Math.round(Ab / LIB.base.zoneA)); NT = Math.ceil(NZ / LIB.base.zpt - 1e-9); sub = ['바닥 <b>' + NZ + '</b> Zone · <b>' + NT + '</b>팀', '점선 = 기초 외곽']; }
      else { var r0 = bs.rows[bs.rows.length - 1]; NZ = r0.Z; NT = r0.T; sub = ['바닥 <b>' + NZ + '</b> Zone · <b>' + NT + '</b>팀']; }
      maxT = Math.max(maxT, NT);
      var tb = zteams(NZ, NT), ghost = Ab < Af * 0.97;
      var Ldb = ghost ? dF : dB;
      var cellsB = zgridPlan(0, 0, dB.L, dB.B, NZ, function (i) { var q = tb(i); return { fill: TEAMC[q.team % 8], op: 0.58, t: q.ord }; });
      oB = row('지하 ' + b.nB + '개층', '지하골조', Ab, dB, sub, isoPlate({ Lp: Ldb.L, Bp: Ldb.B, Lr: dB.L, Br: dB.B, ghost: ghost, cells: cellsB, aria: '지하골조 조닝 평면 (아이소메트릭)' }, s, FW, 1), cyBase(R));
    } else oB = '<div class="iso-none">지하 ' + b.nB + '개층 · 지하 연면적이나 건축면적을 넣으면 지하골조 평면이 그려집니다.</div>';
    /* 지상골조 (기준층) : 외주부 (RC = 형틀팀 · 철골 = 철골팀) 와 코어 (RC 코어 = 형틀팀) 를 따로. RC 는 코어 일체 타설 */
    var ty = fr.typ, NP, TP, NC = 0, TC = 0;
    if (ty.dc) { NP = ty.dc.P.N; TP = ty.dc.P.T; NC = ty.dc.C.N; TC = ty.dc.C.T; }
    else { NP = ty.slab.Z; TP = ty.slab.T; if (ty.core) { NC = ty.core.Z; TC = ty.core.T; } }
    if (Au > 0) {
      var cg = coreGeom(R), tp = zteams(NP, TP), tc = NC ? zteams(NC, TC) : null, oTrade = steel ? '철골팀' : '형틀팀';
      var cellsU = slabCells(dU.L, dU.B, cg, NP, function (i) { var q = tp(i); return { fill: 'var(--t1)', op: 0.36 + 0.2 * (q.team % 3), t: q.ord }; });
      var coreU = cg ? { cw: cg.cw, cd: cg.cd, x0: cg.x0, y0: cg.y0, drag: true, integ: cg.integ, where: coreWhere(cg), cells: NC ? zgridPlan(cg.x0, cg.y0, cg.cw, cg.cd, NC, function (i) { var q = tc(i); return { fill: 'var(--navy)', op: 0.42 + 0.2 * (q.team % 2), t: q.ord, tc: '#fff', halo: 'rgba(16,30,56,.55)', minSz: 15 }; }) : [] } : null;
      oU = row('지상 ' + b.nUp + '개층 · 기준층 ' + ty.n + 'F', '지상골조', Au, dU, [
        '<i class="dot" style="background:var(--t1)"></i>외주부 <b>' + NP + '</b> Zone',
        teamCtl('uTeams', oTrade, TP, R.team && R.team.u),
        NC ? '<i class="dot" style="background:var(--navy)"></i>코어 <b>' + NC + '</b> Zone' : '<i class="dot" style="background:var(--navy)"></i>코어 일체 타설 (외주부 형틀팀)',
        NC ? teamCtl('cTeams', '형틀팀', TC, R.team && R.team.c) : '',
        cg ? '<span class="core-at" title="코어 블록을 끌어서 옮기기">코어 위치 <b>' + coreWhere(cg) + '</b></span>' : ''
      ], isoPlate({ Lp: dU.L, Bp: dU.B, Lr: dU.L, Br: dU.B, cells: cellsU, core: coreU, aria: '지상 기준층 조닝 평면 (아이소메트릭)' }, s, FW, 0), cyTyp(R));
    } else oU = '<div class="iso-none">지상 연면적 · 건축면적을 넣으면 기준층 평면이 그려집니다.</div>';
    var lg = ''; for (var t = 0; t < Math.min(maxT, 8); t++) lg += '<span><i style="background:' + TEAMC[t] + ';opacity:.7"></i>' + (t + 1) + '팀</span>';
    lg += '<span><i style="background:#fff;box-shadow:inset 0 0 0 2px var(--cp)"></i>PIT Zone</span>';
    if (f.nSlopeZ) lg += '<span><i style="background:var(--t1);opacity:.25"></i>경사띠</span>';
    lg += '<span><i style="background:var(--t1);opacity:.6"></i>외주부</span><span><i style="background:var(--navy);opacity:.7"></i>코어</span>';
    lg += '<span>숫자 = 타설 순서</span>';
    return { html: '<div class="iso' + (nar ? ' nar' : cols ? ' cols' : '') + '">' + oF + oB + oU + '</div>', legend: lg };
  }
  function renderZone(R) { var box = $('#zone'), z = zoning(R, box.clientWidth || 520); box.innerHTML = z.html; $('#z-lg').innerHTML = z.legend; widths.zone = box.clientWidth; }

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
    $('#warns').innerHTML = w.length ? w.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') : '<li class="none">없음</li>';
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
    set('Atyp', '자동 ' + ah.Atyp); set('coreZ', ah.coreZ ? '자동 ' + ah.coreZ : ''); set('mat', '자동 ' + ah.mat); set('fTeams', lastR && lastR.team && lastR.team.f ? '최적 ' + lastR.team.f.opt : '자동 ' + ah.fTeams);
    set('prd', ah.prd ? '자동 ' + ah.prd : ''); set('pile', ah.pile ? '추정 ' + ah.pile : '');
    set('dc', fr.dc ? '적용 중' : '미적용'); set('coreA', td ? '자동 ' + fmt(td.Ac) : ''); set('colN', td ? '자동 ' + td.nCol : '');
    var cv = $('#in-cov'); if (cv && document.activeElement !== cv) cv.placeholder = ah.cov || '자동';
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
    if (!inSec && (sc || zc)) renderSection(lastR);
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
      var ts = t.closest('[data-tstep],[data-topt]');
      if (ts) {
        var tm = ts.closest('[data-team]'), key = tm.getAttribute('data-team'), cur = +tm.querySelector('.tm-v').textContent, mx = +tm.getAttribute('data-max') || 10;
        var nv = ts.hasAttribute('data-topt') ? +ts.getAttribute('data-topt') : Math.max(1, Math.min(mx, cur + +ts.getAttribute('data-tstep')));
        S.adv = S.adv || {}; S.adv[key] = nv; if (current) markPreset(''); GK.fill(document, S); recompute(); return;
      }
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
    bindTip(); bindCoreDrag();
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

