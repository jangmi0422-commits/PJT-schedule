/* 디자인 옵션 7 · 벤토 · 입체 — 상태 객체 (S) 하나를 빠른 입력 타일 · 입력 시트 · 단면 층고 칸이 함께 고친다
   렌더 : 히어로 (총 공기 · 범위 · C.P 구성) · 마일스톤 · Master Schedule · 가정 단면 (입면 일러스트) · 조닝 (아이소메트릭 적층) · C.P 구간 · 주요 판단 · 확인 사항 */
(function () {
  'use strict';
  var GE = window.GE, GK = window.GK, r1 = GE.r1, r2 = GE.r2, fmt = GE.fmt, esc = GK.esc, m1 = GK.m1, m2 = GK.m2;
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  var LIB = GE.defaultLib(), ST = GK.store('gonggi-agent-o7'), PRESETS = GK.PRESETS;
  var S = null, lastR = null, current = 'refA', timer = null, secG = null, lastGround = 'AUTO', downloads = null, widths = {}, gInfo = [], tipOn = -1;
  /* 화면 안 편집 동작 등록 : 요소에 data-act="이름" (클릭) · data-actc="이름" (입력 바뀜) → ACT[이름] · ACTC[이름](요소, 이벤트).
     기능마다 자기 함수 곁에서 등록한다 (공용 클릭 처리기를 고치지 않게) */
  var ACT = {}, ACTC = {};
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
  /* 빈 값은 빈 값 그대로 (D. 직접입력 = 아무것도 고르지 않은 상태) — 엔진에 넘길 때만 기본값 (toInp) */
  var KEEP_EMPTY = ['use', 'seq', 'struct', 'support', 'wall', 'found', 'coreSys', 'ground', 'rExt', 'rRC', 'rInt', 'mob', 'fin', 'tc', 'hours', 'nB', 'nUp', 'nPH'];
  var EMPTY = { name: '', use: '', site: '', bldg: '', gfaUp: '', aDn: '', nB: '', nUp: '', nPH: '', ground: '', strata: [null, null, null, null], gwl: '', seq: '', tdBase: 0, wall: '', support: '', scw: false, found: '', geo: '',
    struct: '', pt: false, coreSys: '', lim: '', lim2: '', mob: '', demo: '', demoB: '', fin: '', tc: '', rExt: '', rRC: '', rInt: '', hours: '', link: false, start: '', adv: {} };
  PRESETS.blank = EMPTY;
  function norm(p) {
    var src = p || EMPTY, s = GK.normInp(src);
    KEEP_EMPTY.forEach(function (k) { if (src[k] == null || src[k] === '') s[k] = ''; });
    if (s.start == null) s.start = '';
    if (s.name == null) s.name = '';
    s.adv = s.adv || {}; if (!s.adv.dcCycle) s.adv.dcCycle = 'AUTO'; if (!s.adv.dcFlow) s.adv.dcFlow = 'ZONE';
    /* 골조 · 지하 사이클 방식 선택 칸 (엔진 기본과 같은 값) · 해체 개월 (0 · 빈 값 · 이상한 값 = 빈 칸 = 행 없음) */
    [['frChain', 'AUTO', ['AUTO', 'ON', 'OFF']], ['rcFlow', 'ZONE', ['ZONE', 'FLOOR']], ['bChain', 'AUTO', ['AUTO', 'OFF']]].forEach(function (q) { if (q[2].indexOf(s.adv[q[0]]) < 0) s.adv[q[0]] = q[1]; });
    ['demo', 'demoB'].forEach(function (k) { var v = parseFloat(s[k]); s[k] = isFinite(v) && v > 0 ? v : ''; });
    ['scw', 'pt', 'link'].forEach(function (k) { s[k] = !!s[k]; });
    if (s.seq === 'TD') s.support = 'SLAB'; else if (s.support === 'SLAB') s.support = 'ANCHOR';
    return s;
  }
  /* 계산 시작 조건 : 지상 층수 · 면적 · 용도 · 공사 순서 · 골조 (없으면 공기 0.0 · 입력 대기) */
  function missing() {
    var m = [];
    if (!(+S.nUp >= 1)) m.push('지상 층수');
    if (!(+S.bldg > 0 || +S.gfaUp > 0 || (+S.site > 0 && +S.cov > 0))) m.push('면적');
    if (!S.use) m.push('용도'); if (!S.seq) m.push('공사 순서'); if (!S.struct) m.push('골조');
    return m;
  }
  function toInp() {
    var i = GK.clone(S), d0 = { use: 'office', seq: 'BU', struct: 'RC', wall: 'CIP', found: 'AUTO', coreSys: 'AUTO', ground: 'AUTO' };
    Object.keys(d0).forEach(function (k) { if (i[k] == null || i[k] === '') i[k] = d0[k]; });
    if (!i.support) i.support = i.seq === 'TD' ? 'SLAB' : 'ANCHOR';
    if (i.nB == null || i.nB === '') i.nB = 0;
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
    /* 입력 시트 '코어 바닥면적' (adv.coreA = 엔진 입력) : 코어 목록 (S.adv.cores) 이 있으면 그 면적도 같은 합계로 (지금 비율 유지, 비우면 기본 몫) —
       안 그러면 엔진은 시트 값, 조닝 · PIT · 단면 띠는 옛 코어 면적을 써서 서로 어긋남. 자릿수를 남겨 한 글자씩 칠 때도 비율이 유지되게 */
    if (k === 'adv.coreA' && S.adv && Array.isArray(S.adv.cores) && S.adv.cores.length) {
      var cs = S.adv.cores, ct = cs.reduce(function (t, c) { return t + (c.a > 0 ? +c.a : 0); }, 0), all = ct > 0 && cs.every(function (c) { return c.a > 0; });
      S.adv.cores = cs.map(function (c) { return Object.assign({}, c, { a: val > 0 ? +(val * (all ? c.a / ct : 1 / cs.length)).toFixed(4) : null }); });
    }
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
  /* v2.8 공종 사슬 (일반 RC · SRC 지상 · 순타 지하 바닥 · 철골 c1 · c3 하한) — 사슬 경로일 때만 보임. 옛 '바닥 Zone당 WD · RC / SRC' · '지하 바닥 Zone당 WD' 는 그 경로에서 숨김 (결과에 영향 없음) */
  var LIB28 = [
    ['1회 타설 (수평) ㎥', 'pourV'], ['펌프 대수', 'pump'], ['팀당 Zone (Zone ÷ 이 값 = 팀)', 'zpt'], ['팀 안 Zone 간격 WD', 'takt'],
    ['철근 t/인·일', 'tPerMD'], ['벽체 철근 인원', 'crewW'], ['바닥 철근 · M&E 인원', 'crewU'], ['테이블폼 장/일', 'table'], ['DECK ㎡/일', 'deck'],
    ['양중 WD', 'lift'], ['벽체 형틀 WD', 'wform'], ['형틀 WD', 'form'], ['타설 WD', 'pour'], ['PT WD (철근 · M&E 안)', 'ptAdd'],
    ['겹침 · 벽체 철근 ∥ 양중 WD', 'ov1'], ['겹침 · 테이블폼 WD (사례 B 보정)', 'ov3'], ['겹침 · 형틀 WD (사례 B 보정)', 'ov4'], ['겹침 · DECK WD (사례 B 보정)', 'ov5'],
    ['PT 1일 항상 (1) · PT 슬래브만 (0)', 'ptAll'], ['지하 외벽팀 반영 하한 (× 실적값)', 'wKmin']
  ].map(function (r) { return [r[0], ['v28', r[1]]]; });
  /* 0 이 뜻 있는 값 (겹침 · PT 항상 여부 · Zone 간격 · 외벽팀 하한) — 표 · 편집 칸에서 0 을 받는다 */
  function zeroOK(path) { return /^v28\.(ov\d|ptAll|takt|wKmin)$/.test(path); }
  function getP(o, path) { return path.reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setP(o, path, val) { var last = path[path.length - 1], p = path.slice(0, -1).reduce(function (a, k) { return a == null ? a : a[k]; }, o); if (p) p[last] = val; }
  function buildLib() {
    var tb = $('#libtbl'); if (!tb) return;
    var h = '<thead><tr><th scope="col">항목</th><th scope="col">토사</th><th scope="col">풍화토</th><th scope="col">풍화암</th><th scope="col">연암</th><th scope="col">경암</th></tr></thead><tbody>';
    LIBROWS.forEach(function (row) { h += '<tr><td>' + esc(row[0]) + '</td>' + row[1].map(function (p, i) { return '<td><input id="lib_' + p.join('_') + '" data-path="' + p.join('.') + '" type="number" step="any" inputmode="decimal" aria-label="' + esc(row[0] + ' · ' + LNM[i]) + '"></td>'; }).join('') + '</tr>'; });
    function one(row, cls) { var p = row[1].join('.'); return '<tr data-lr="' + p + '"' + (cls ? ' class="' + cls + '"' : '') + '><td colspan="5">' + esc(row[0]) + '</td><td><input id="lib_' + row[1].join('_') + '" data-path="' + p + '" type="number" step="any"' + (zeroOK(p) ? ' min="0"' : '') + ' inputmode="decimal" aria-label="' + esc(row[0]) + '"></td></tr>'; }
    LIBONE.forEach(function (row) { h += one(row); });
    h += '<tr class="l28" data-lr="v28" hidden><th scope="rowgroup" colspan="6">v2.8 공종 사슬 (일반 RC · SRC · 지하 바닥)</th></tr>';
    LIB28.forEach(function (row) { h += one(row, 'l28'); });
    tb.innerHTML = h + '</tbody>';
    fillLib();
  }
  /* 경로마다 쓰는 줄만 : v2.8 사슬이면 옛 바닥 Zone당 WD 줄 숨김 · v28 줄 보임 */
  function libVis(R) {
    var fr = R && R.frame, v8 = fr && fr.v28 || {}, up = fr && fr.model === 'v28', bs = !!(R && R.base && R.base.model === 'v28'), any = !!(v8.on || v8.base || v8.lb || v8.guard);
    $$('#libtbl tr[data-lr]').forEach(function (tr) {
      var p = tr.getAttribute('data-lr');
      tr.hidden = p === 'frame.d.RC' || p === 'frame.d.SRC' ? up : p === 'base.slabD' ? bs : tr.classList.contains('l28') ? !any : false;
    });
  }
  /* 공법 라이브러리 덮어쓰기 : S.libOv = { '경로': 값 } (표 · 사이클 바차트에서 고친 값) — 다시 계산할 때 LIB = 기본 라이브러리 + 덮어쓰기.
     S 안에 있으므로 저장 · 새로고침에 남고, 사례를 불러오면 (S 교체) 기본 라이브러리로 돌아간다 */
  var LIB0 = GE.defaultLib();
  function libDef(path) { return getP(LIB0, path.split('.')); }
  function hasOv(path) { return !!(S && S.libOv && Object.prototype.hasOwnProperty.call(S.libOv, path)); }
  function setLib(path, v) { S.libOv = Object.assign({}, S.libOv); var d = libDef(path); if (d != null && Math.abs(v - d) < 1e-9) delete S.libOv[path]; else S.libOv[path] = v; }
  function delOv(path) { if (hasOv(path)) { S.libOv = Object.assign({}, S.libOv); delete S.libOv[path]; } }
  /* 기본 라이브러리에 있는 숫자 칸만 (저장값이 다른 경로를 건드리지 않게) */
  function ownP(o, ks) { for (var i = 0; i < ks.length; i++) { if (!o || typeof o !== 'object' || !Object.prototype.hasOwnProperty.call(o, ks[i])) return undefined; o = o[ks[i]]; } return o; }
  function applyLib() {
    LIB = GE.defaultLib();
    var ov = S && S.libOv; if (!ov || typeof ov !== 'object') return;
    Object.keys(ov).forEach(function (p) { var v = +ov[p], ks = p.split('.'); if (isFinite(v) && typeof ownP(LIB, ks) === 'number') setP(LIB, ks, v); });
  }
  /* 표 칸 : 지금 LIB 값 (고친 칸은 은은하게 표시) · 입력 중인 칸은 건드리지 않음 */
  function fillLib() {
    $$('#libtbl input').forEach(function (el) {
      var p = el.getAttribute('data-path'), v = getP(LIB, p.split('.'));
      if (el !== document.activeElement) el.value = v == null ? '' : v;
      el.classList.toggle('ov', hasOv(p)); el.title = hasOv(p) ? '기본 ' + libDef(p) : '';
    });
  }
  /* 표에서 고치면 S.libOv 에 기록 (기본값과 같으면 지움, 빈 칸 = 기본값) */
  function readLib(el, fin) {
    var p = el.getAttribute('data-path'), x = parseFloat(el.value);
    if (isFinite(x) && (x > 0 || (x === 0 && zeroOK(p)))) setLib(p, x); else if (fin) { delOv(p); el.value = libDef(p); } else return;
    if (current) markPreset('');
    schedule();
  }

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
    applyLib(); fillLib();
    var miss = missing();
    if (miss.length) { lastR = null; ST.save({ inp: S, preset: current }); renderEmpty(miss); return; }
    /* 옛 파일 · 도면 가져오기의 고정 굴착 깊이 (adv.H) → 자동 깊이 기준 보정값 (adv.dH) 으로 바꿔 지하 층수 · 층고를 따라가게 */
    if (S.adv && +S.adv.H > 0) { try { var i0 = toInp(); delete i0.adv.H; delete i0.adv.dH; var g0 = GE.compute(i0, LIB).geo; if (g0.Hauto > 0) { var d0 = r1(S.adv.H - g0.Hauto); if (d0) S.adv.dH = d0; else delete S.adv.dH; } } catch (e) {} delete S.adv.H; GK.fill(document, S); }
    var inp = toInp(), R, team = {};
    inp.adv = inp.adv || {};
    try {
      var R0 = GE.compute(inp, LIB);
      var pz = pitUnderCore(R0); if (pz) inp.adv.pitZ = pz;
      var cwk = coreWallK(R0); if (Math.abs(cwk - 1) > 0.005) inp.adv.coreWallK = +cwk.toFixed(3);
      /* 훑을 팀수 = 엔진이 알려 주는 R.teamKeys 중 sweep (기초 fTeams · 지상 uTeams · 코어 cTeams · 지하 바닥 bTeams · 역타 tdTeams — 지하 외벽 wTeams 는 가정이라 제외, 비우면 실적값).
         팀수끼리 서로 영향 (예 : 코어팀 · 철근팀 수에 따라 외주부팀 최적이 바뀜) → 다른 팀수를 지금 값으로 두고 다시 훑어 바뀌지 않을 때까지 (최대 3회).
         첫 회는 아직 정해지지 않은 팀수가 엔진 기본값이라, 그 공기 (totals) 로 '최적 n팀 · ±개월' 을 보이면 실제와 어긋남 */
      var ORD = ['uTeams', 'cTeams', 'bTeams', 'tdTeams', 'fTeams'], oi = function (k) { var i = ORD.indexOf(k); return i < 0 ? ORD.length : i; };   /* 훑는 순서 = 옛 순서 (외주부 · 코어 → 기초) */
      var keys = (R0.teamKeys || []).filter(function (q) { return q.sweep && q.max >= 1; }).sort(function (a, b) { return oi(a.key) - oi(b.key); });
      for (var pass = 0; pass < 3; pass++) {
        var moved = false;
        keys.forEach(function (q) { var sw = sweepTeams(inp, q.key, Math.max(1, Math.min(8, q.max))); team[q.key] = sw; if (!hasTeam(q.key) && inp.adv[q.key] !== sw.opt) { inp.adv[q.key] = sw.opt; moved = true; } });
        if (!moved) break;
      }
    } catch (e) { team = {}; }
    /* 옛 이름 (u · c · f) 도 함께 — 팀 칩 · 입력 시트 자동값이 쓴다 */
    team.u = team.uTeams || null; team.c = team.cTeams || null; team.f = team.fTeams || null;
    try { R = GE.compute(inp, LIB); } catch (e) { $('#warns').innerHTML = '<li>계산 오류 : ' + esc(e.message) + '</li>'; return; }
    R.team = team;
    try { R.sens = GE.sensitivity(inp, LIB); } catch (e) { R.sens = { lo: R.total, hi: R.total }; }
    lastR = R;
    if (S.seq === 'TD' && R.tdBase && R.tdBase.off !== (S.tdBase || 0)) S.tdBase = R.tdBase.off;
    ST.save({ inp: S, preset: current });
    render(R);
  }
  function render(R) {
    var steps = [renderHead, renderHero, renderMs, renderGantt, renderSection, renderZone, renderKf, renderWarns, renderHints, renderZin];
    steps.forEach(function (fn) { try { fn(R); } catch (e) { if (window.console) console.error(e); } });
    widths.ms = $('#ms-flow').clientWidth;
    GK.fill(document, S); syncFloors(); rateSrc(); fitHero();
  }
  /* 입력 대기 (D. 직접입력 처음) : 공기 0.0, 나머지 판은 무엇을 넣어야 하는지만 */
  function renderEmpty(miss) {
    var need = '<span>필요한 입력</span><b>' + esc(miss.join(' · ')) + '</b>';
    $('#h-total').textContent = '0.0'; $('#mini-total').textContent = '0.0'; var sh = $('#sh-total'); if (sh) sh.textContent = '0.00';
    $('#pj').textContent = (S.name || '새 프로젝트') + ' · 입력 대기';
    $('#h-exact').innerHTML = '<span><b class="num">0.00</b>개월</span>'; $('#h-range').innerHTML = ''; $('#h-why').innerHTML = ''; $('#h-why').hidden = true;
    $('#h-foot').innerHTML = '<span class="muted">필요한 입력 · <b>' + esc(miss.join(' · ')) + '</b></span>';
    $('#ms-list').innerHTML = '<div class="wait">' + need + '</div>'; $('#ms-flow').innerHTML = ''; $('#ms-sub').textContent = '';
    hideTip(); $('#gantt').innerHTML = '<div class="wait">' + need + '</div>'; $('#cpf').innerHTML = ''; $('#g-lg').innerHTML = '';
    $('#section').innerHTML = '<div class="wait">' + need + '</div>'; ['#s-chips', '#s-notes', '#s-lg'].forEach(function (q) { var e = $(q); if (e) e.innerHTML = ''; });
    $('#kf').innerHTML = ''; $('#zone').innerHTML = '<div class="wait">' + need + '</div>'; $('#z-lg').innerHTML = '';
    $('#warns').innerHTML = '<li>필요한 입력 : ' + esc(miss.join(' · ')) + '</li>'; var wc = $('#w-ct'); if (wc) { wc.textContent = miss.length + '건'; wc.classList.remove('ok'); }
    $('#notes').innerHTML = ''; $('#notes-g').hidden = true;
    var rg = $('#rv-g'); if (rg) { rg.hidden = true; $('#rv-l').innerHTML = ''; }
    footSync();
    widths = {};
    GK.fill(document, S); syncUI(); syncFloors(); rateSrc(); fitHero();
  }
  /* 가동률 출처 표시 : 사례 = 실적값, 비어 있으면 기본값 (칸에 흐리게) */
  function rateSrc() {
    var el = $('#tb-src'); if (!el) return;
    var cs = current && current !== 'blank' && GK.PRESET_N[current], empty = ['rRC', 'rExt', 'rInt'].every(function (k) { return S[k] == null || S[k] === ''; });
    el.textContent = cs ? GK.PRESET_N[current].replace(/ · .*/, '') + ' 실적값' + (S.rInt == null || S.rInt === '' ? ' · 내부는 가정' : '') : empty ? '빈칸 = 기본값' : '';
    el.classList.toggle('case', !!cs);
  }
  /* 총 공기 숫자 : 히어로 칸 폭 안에서 들어가는 가장 큰 글자 (숫자 + '개월') */
  function fitHero() {
    var b = $('#h-total'), big = b && b.parentNode, tile = $('#t-hero'); if (!big || !tile) return;
    var cs = getComputedStyle(tile), avail = tile.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 4, sm = big.querySelector('small');
    var lo = 48, hi = 300;
    for (var it = 0; it < 14; it++) {
      var mid = (lo + hi) / 2; b.style.fontSize = mid + 'px'; if (sm) sm.style.fontSize = Math.max(18, mid * 0.26) + 'px';
      var wd = b.getBoundingClientRect().width + (sm ? sm.getBoundingClientRect().width + (parseFloat(getComputedStyle(big).columnGap) || 10) : 0);
      if (wd <= avail) lo = mid; else hi = mid;
    }
    b.style.fontSize = lo + 'px'; if (sm) sm.style.fontSize = Math.max(18, lo * 0.26) + 'px';
  }
  /* 층수 숫자 · 막대 채움 (드래그 중에도 바로) — 옥탑을 비워 두면 자동값 */
  function syncFloors() {
    ['nB', 'nUp'].forEach(function (k) { var r = $('#r-' + k), o = $('#o-' + k); if (!r || !o) return; var has = S[k] != null && S[k] !== ''; o.textContent = has ? S[k] : '–'; r.style.setProperty('--p', has ? ((+r.value - +r.min) / Math.max(1, +r.max - +r.min) * 100).toFixed(1) + '%' : '0%'); r.classList.toggle('empty', !has); });
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
  var GRP = { mob: '준비', demo: '준비', demoB: '준비', wall: '토목', scw: '토목', prd: '토목', geo: '토목', pile: '토목', exc1: '토목', f1: '토목', exc: '토목', fin: '마감', tc: '마감' };
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
    renderFlow(R, ms);
  }
  /* C.P 흐름 : C.P 공종을 대공종 (준비 · 토목 · 골조 · 마감) 연속 구간으로 묶어 칸마다 이름 · % · 개월 (대공종 합계 표를 겸함).
     칸 아래 가는 띠 = 그 안의 C.P 공종 — 커서 · 탭 → 머리 줄에 공종 · 기간. 좁은 칸도 글자가 들어가게 최소 폭을 주고,
     마일스톤 눈금은 같은 칸 안에서 비례 배치 (칸 폭에 맞춘 구간별 축척) */
  var FLOW = { runs: [], cnt: 0, st: '', on: null };
  /* 기간 표기 : 착공월이 있으면 Master Schedule 축과 같은 'YY.MM' (좁은 머리 줄에서 잘리지 않게) */
  function flowWhen(a, b) { var st = FLOW.st; return st ? GK.yy(GK.addM(st, a)) + ' ~ ' + GK.yy(GK.addM(st, b)) : 'M+' + m1(a) + ' ~ ' + m1(b); }
  function flowRead(el) {
    var rd = $('#fl-rd'); if (!rd || (el && el === FLOW.on)) return;
    if (FLOW.on) FLOW.on.classList.remove('on');
    var r = el && FLOW.runs[+el.getAttribute('data-r')], p = r && r.ps[+el.getAttribute('data-j')];
    FLOW.on = p ? el : null;
    if (!p) { rd.innerHTML = 'C.P 공종<b>' + FLOW.cnt + '</b>'; return; }
    el.classList.add('on');
    rd.innerHTML = '<span class="sw" style="background:' + (GCOL[r.k] || GCOL['골조'])[0] + '"></span>' + esc(p.label) + '<b>' + m1(p.d) + '</b>개월<em>' + esc(flowWhen(p.s, p.s + p.d)) + '</em>';
  }
  ACT.flSeg = function (el) { flowRead(el); };
  function renderFlow(R, ms) {
    var box = $('#ms-flow'), Wf = Math.max(200, box.clientWidth || 380), st = R.inp.start, tot = Math.max(0.01, R.total), GAP = 3, runs = [], t = 0;
    GK.cpParts(R).forEach(function (p) {
      var gk = GRP[p.id] || '골조', run = runs[runs.length - 1];
      if (!run || run.k !== gk) runs.push(run = { k: gk, s: t, d: 0, ps: [] });
      run.ps.push({ label: p.label, s: t, d: p.d }); run.d += p.d; t += p.d;
    });
    FLOW.runs = runs; FLOW.st = st; FLOW.on = null; FLOW.cnt = runs.reduce(function (a, r) { return a + r.ps.length; }, 0);
    if (!runs.length) { box.innerHTML = ''; return; }
    var span = Math.max(0.01, t), n = runs.length, avail = Wf - GAP * (n - 1);
    var pct = function (d) { return Math.round(d / span * 100) + '%'; };
    /* '%' 는 tw 근사보다 넓어 +3 여유 (좁은 칸에서 % 가 잘리지 않게) */
    var needF = function (r) { return Math.max(tw(r.k, 12.5) + 5 + tw(pct(r.d), 11) + 3, tw(m1(r.d), 18)) + 16; };
    var needM = function (r) { return Math.max(tw(r.k, 12.5), tw(m1(r.d), 18)) + 16; };
    var needC = function (r) { return Math.max(tw(r.k, 11.5), tw(m1(r.d), 15)) + 8; };
    /* 칸 폭 : 비례 → 글자가 안 들어가면 % 를 빼고 (m), 더 좁으면 작은 글자 가운데 (c) + 최소 폭으로 고정하고 나머지를 다시 나눔 */
    var md = runs.map(function () { return 'f'; }), pin = runs.map(function () { return false; }), w = [];
    for (var it = 0; it <= n; it++) {
      var fixW = 0, freeD = 0, more = false;
      runs.forEach(function (r, i) { if (pin[i]) fixW += needC(r); else freeD += r.d; });
      var k = Math.max(0, avail - fixW) / Math.max(1e-6, freeD);
      runs.forEach(function (r, i) {
        w[i] = pin[i] ? needC(r) : r.d * k;
        md[i] = w[i] >= needF(r) ? 'f' : w[i] >= needM(r) ? 'm' : 'c';
        if (!pin[i] && w[i] < needC(r)) { pin[i] = true; more = true; }
      });
      if (!more) break;
    }
    if (!w.every(function (x) { return x > 0; })) w = runs.map(function (r) { return r.d / span * avail; });
    var X0 = [], acc = 0;
    runs.forEach(function (r, i) { X0[i] = acc; acc += w[i] + GAP; });
    /* 시점 (개월) → 가로 위치 (px) : 칸 경계에 걸리면 칸 사이 틈 가운데 */
    var xAt = function (m) {
      for (var i = 0; i < n; i++) {
        var r = runs[i], e = r.s + r.d;
        if (i < n - 1 && Math.abs(m - e) < 0.03) return X0[i] + w[i] + GAP / 2;
        if (m <= e || i === n - 1) return X0[i] + Math.max(0, Math.min(1, (m - r.s) / Math.max(1e-6, r.d))) * w[i];
      }
      return Wf;
    };
    var strip = runs.map(function (r, i) {
      var c = GCOL[r.k] || GCOL['골조'];
      var subs = r.ps.map(function (p, j) {
        return '<i class="fl-s" data-act="flSeg" data-r="' + i + '" data-j="' + j + '" style="left:' + ((p.s - r.s) / r.d * 100).toFixed(2) + '%;width:' + (p.d / r.d * 100).toFixed(2) + '%" title="' + esc(p.label + ' ' + m1(p.d) + '개월') + '"></i>';
      }).join('');
      var lab = '<span class="k">' + esc(r.k) + (md[i] === 'f' ? '<small>' + pct(r.d) + '</small>' : '') + '</span><b>' + m1(r.d) + '</b>';
      return '<div class="fl-c' + (md[i] === 'c' ? ' cmp' : '') + (c[1] === '#fff' ? ' dk' : '') + '" style="flex:' + w[i].toFixed(1) + ' 1 0;background:' + c[0] + ';color:' + c[1] + '">' + subs + '<span class="fl-l">' + lab + '</span></div>';
    }).join('');
    /* 마일스톤 눈금 + 축 글자 (M+0 · 마일스톤 · 준공) — 겹치는 마일스톤 글자는 생략 (눈금 title 에 남음) */
    var tk = ms.filter(function (x) { return x.k !== '준공' && x.m > 0.05 && x.m < tot - 0.05; }), FS = 12.5;
    var L0 = st ? GK.ym(GK.addM(st, 0)) : 'M+0', L1 = st ? GK.ym(GK.addM(st, R.total)) : 'M+' + m1(R.total), edge = tw(L0, FS) + 8, endL = Wf - tw(L1, FS) - 8, labs = '';
    var ticks = tk.map(function (x) {
      /* 글자는 눈금 가운데 — 양 끝 글자와 겹치면 눈금을 덮는 범위 안에서 비켜 놓고, 그래도 안 되면 생략 */
      var cx = xAt(x.m), nm = x.k.replace(' 완료', ''), lw = tw(nm, FS), a = Math.min(Math.max(cx - lw / 2, edge), endL - lw);
      if (a >= edge && a <= cx + 2 && a + lw >= cx - 2) { labs += '<span style="left:' + (a / Wf * 100).toFixed(2) + '%">' + esc(nm) + '</span>'; edge = a + lw + 8; }
      return '<b class="fl-t" style="left:' + (cx / Wf * 100).toFixed(2) + '%" title="' + esc(x.k + ' · ' + (st ? GK.ym(GK.addM(st, x.m)) : 'M+' + m1(x.m))) + '"></b>';
    }).join('');
    box.innerHTML = '<div class="fl-hd"><span>C.P 흐름</span><span class="fl-rd" id="fl-rd"></span></div>' +
      '<div class="fl-wrap" role="group" aria-label="' + esc('C.P 흐름 · ' + runs.map(function (r) { return r.k + ' ' + m1(r.d) + '개월'; }).join(' · ')) + '"><div class="fl-strip">' + strip + '</div></div>' +
      '<div class="fl-ax" aria-hidden="true">' + ticks + '<span style="left:0">' + esc(L0) + '</span>' + labs + '<span class="e" style="right:0">' + esc(L1) + '</span></div>';
    flowRead(null);
    if (!box.__fl) {
      /* 마우스 · 펜 : 올리면 보이고 벗어나면 되돌림. 터치 : 탭 (ACT.flSeg) 으로 고르고 흐름 밖을 탭하면 되돌림
         (터치 뒤 따라오는 마우스 호환 이벤트로 바로 지워지지 않게 pointerType 으로 나눔) */
      box.__fl = 1;
      box.addEventListener('pointerover', function (e) { if (e.pointerType === 'touch') return; var s = e.target && e.target.closest ? e.target.closest('.fl-s') : null; if (s || FLOW.on) flowRead(s); });
      box.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') flowRead(null); });
      document.addEventListener('pointerdown', function (e) { if (FLOW.on && e.pointerType === 'touch' && !box.contains(e.target)) flowRead(null); });
    }
  }

  /* ───────── Master Schedule (C.P = 빨강 · C.P 연결선 · 개월 축 · 마일스톤) */
  /* Master Schedule : 머리 = 한 달 한 칸 (착공월 없으면 M+ 1행, 있으면 연도 · 월 · M+ 3행), 행 왼쪽 = 대공종 색 띠,
     C.P = 코발트 막대 (앞 병행 = 빗금), Non-C.P = 옅은 막대. C.P 연결선 · 마일스톤 (점선 + 아래 알약 라벨). 행 전체가 말풍선 걸림 영역 */
  function gantt(R, Wc) {
    var W = Math.max(680, Math.floor(Wc)), nar = Wc < 760;
    var acts = GK.ganttActs(R), n = acts.length, st = R.inp.start, hasSt = !!GK.addM(st, 0);
    var hRows = hasSt ? ['연도', '월', 'M+'] : ['M+'], hr = nar ? 21 : 23, hy = 4;
    var LW = nar ? 136 : 214, PR = 58, top = hy + hRows.length * hr, rh = nar ? 30 : 33, bh = nar ? 11 : 12;
    var Mmax = Math.ceil(R.total + 0.4), span = W - LW - PR, X = function (m) { return LW + m / Mmax * span; };
    var rowsH = n * rh, bg = '', hd = '', s = '', fg = '', xEnd = W - PR + 34;
    var defs = '<defs>' + pat('o7g-pre', 5, '<path d="M-1 6L6 -1" stroke="var(--cp)" stroke-width=".9" opacity=".45"/>', '#EEF3FC') + '</defs>';
    ganttHead();
    /* 머리 행 : 달 칸 (가는 선) · 숫자는 칸 가운데 (촘촘하면 2 · 3 · 6개월마다, 눈금은 매달) · 연도 경계 = 조금 진한 선 · 짝수 연도 옅은 바탕 */
    function ganttHead() {
      var pxM = span / Mmax, nfs = nar ? 10 : 10.5, need = tw('00', nfs) + 6;
      var step = [1, 2, 3, 6, 12].filter(function (k) { return pxM * k >= need; })[0] || 12;
      var cal = [];
      for (var m = 0; m <= Mmax; m++) { var d = hasSt ? GK.addM(st, m) : null; cal.push(d ? { y: d.getFullYear(), mo: d.getMonth() + 1 } : null); }
      var yb = function (m) { return m > 0 && m < Mmax && (hasSt ? cal[m].mo === 1 : m % 12 === 0); };
      var rowY = function (k) { return hy + k * hr; }, mid = function (k) { return rowY(k) + hr / 2 + nfs * 0.36; };
      /* 연도 칸 : 그 해에 속한 달을 묶어 한 칸 */
      if (hasSt) {
        for (var a = 0, b = 1; b <= Mmax; b++) {
          if (b < Mmax && !yb(b)) continue;
          var xa = X(a), w = X(b) - xa, yv = cal[a].y, lab = String(yv);
          if (yv % 2 === 0) bg += Rc(xa, hy, w, top - hy + rowsH, '#F6F8FB');
          lab = w >= tw(lab, 11.5) + 10 ? lab : w >= tw('00', 11) + 8 ? '’' + lab.slice(2) : '';
          if (lab) hd += T(xa + w / 2, mid(0), lab, { a: 'middle', fs: 11.5, w: 600, c: 'var(--ink-2)', cls: 'n' });
          a = b;
        }
      }
      /* 세로선 : 머리 (월 · M+ 행은 매달, 연도 행은 경계만 — 숫자를 띄워 찍을 땐 행 아래 짧은 눈금) · 몸통 (매달 옅게) */
      var h0 = hasSt ? rowY(1) : hy;
      for (var i = 0; i <= Mmax; i++) {
        var x = X(i), edge = i === 0 || i === Mmax, yr = yb(i);
        if (yr || edge) hd += Ln(x, hy, x, top, '#C9D3E0', 0.9);
        else if (step === 1) hd += Ln(x, h0, x, top, '#E3E8EF', 0.6);
        else for (var k = hasSt ? 1 : 0; k < hRows.length; k++) hd += Ln(x, rowY(k + 1) - 4, x, rowY(k + 1), '#D5DDE8', 0.6);
        if (yr) bg += Ln(x, top, x, top + rowsH, '#DCE3EC', 0.9);
        else if (pxM > 5 || edge) bg += Ln(x, top, x, top + rowsH, '#EEF1F5', 0.6);
      }
      /* 가로선 · 행 이름 (왼쪽 칸) */
      hd += Ln(0, hy, xEnd, hy, '#E3E8EF', 0.8);
      hRows.forEach(function (nm, k) {
        if (k) hd += Ln(0, rowY(k), xEnd, rowY(k), '#EEF1F5', 0.6);
        hd += T(LW - 12, mid(k), nm, { a: 'end', fs: 11, w: 600, c: 'var(--ink-3)', cls: nm === 'M+' ? 'n' : '' });
      });
      hd += Ln(0, top, xEnd, top, '#D5DDE8', 0.9);
      /* 월 (1~12) · M+ (0, 1, 2 …) : 촘촘하면 같은 칸끼리 step 간격 (숫자가 칸보다 넓으면 바탕색 테두리로 경계선과 떨어뜨림) */
      for (var c = 0; c < Mmax; c++) {
        var xc = X(c + 0.5);
        if (c % step) continue;
        var hal = step > 1 ? (hasSt && cal[c].y % 2 === 0 ? '#F6F8FB' : '#fff') : '';
        if (hasSt) hd += T(xc, mid(1), cal[c].mo, { a: 'middle', fs: nfs, w: cal[c].mo === 1 ? 600 : 400, c: cal[c].mo === 1 ? 'var(--ink-2)' : 'var(--ink-3)', cls: 'n', halo: hal });
        var k12 = !hasSt && c % 12 === 0 && c > 0;
        hd += T(xc, mid(hRows.length - 1), c, { a: 'middle', fs: nfs, w: k12 ? 600 : 400, c: k12 ? 'var(--ink-2)' : 'var(--ink-3)', cls: 'n', halo: hal });
      }
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
    return svgEl(W, H, defs + bg + hd + s + fg, 'Master Schedule 바차트 · 총 ' + m1(R.total) + '개월');
  }
  function renderGantt(R) {
    var el = $('#gantt'); hideTip(); el.innerHTML = gantt(R, el.clientWidth || 900); widths.gantt = el.clientWidth;
    $('#g-sub').textContent = (window.matchMedia && matchMedia('(hover: none)').matches ? '막대 탭' : '막대에 커서') + ' → 산출 근거';
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
    /* 근거 줄 나눔 : 괄호 밖의 ' · ' 에서만 ('(슬래브 하부 · 크람쉘)' 이 두 줄로 갈라지지 않게) */
    var bs = [], dp = 0, cur = '', bt = a.basis || '';
    for (var ci = 0; ci < bt.length; ci++) {
      var ch = bt[ci]; dp += ch === '(' ? 1 : ch === ')' && dp > 0 ? -1 : 0;
      if (!dp && bt.substr(ci, 3) === ' · ') { bs.push(cur); cur = ''; ci += 2; } else cur += ch;
    }
    bs.push(cur); bs = bs.filter(Boolean);
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
  /* 코어 드래그 : 화면 이동량 → 아이소 역변환 → 평면 이동량. 블록 = 이동 (가장자리 · 가운데 근처는 붙음), 앞 모서리 손잡이 = 크기 (뒤 모서리 고정).
     놓으면 다시 계산 (PIT 위치 · 코어 면적 · 지하 수직재가 공기에 반영) */
  function bindCoreDrag() {
    var box = $('#zone'), drag = null, raf = 0, C = 0.8660254;
    function snap(v) { [0, 0.5, 1].forEach(function (t) { if (Math.abs(v - t) < 0.035) v = t; }); return Math.max(0, Math.min(1, v)); }
    function redraw(keepFocus) {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; if (!lastR) return; renderZone(lastR); renderSection(lastR); if (keepFocus) { var h = $('#zone .core-h.drag[data-core="' + selCore + '"]'); if (h) h.focus({ preventScroll: true }); } });
    }
    function edit(i, fn) { var list = coreList().map(function (c) { return Object.assign({}, c); }); fn(list[i], list); setCores(list); }
    box.addEventListener('pointerdown', function (e) {
      var h = e.target.closest && e.target.closest('.core-h.drag'), sv = h && h.closest('svg[data-iso]'); if (!sv || !lastR) return;
      var i = +h.getAttribute('data-core'), d = sv.getAttribute('data-iso').split(',').map(Number), cg = coresGeom(lastR)[i], rc = sv.getBoundingClientRect(); if (!cg) return;
      selCore = i;
      drag = { i: i, rs: !!e.target.closest('.core-rs'), x: e.clientX, y: e.clientY, k: (+sv.getAttribute('width') || rc.width) / Math.max(1, rc.width), s: d[0], g: cg, moved: false };
      document.body.classList.add('dragging'); e.preventDefault();
    });
    document.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = (e.clientX - drag.x) * drag.k, dy = (e.clientY - drag.y) * drag.k, a = dx / (C * drag.s), b = 2 * dy / drag.s, dX = (a + b) / 2, dY = (b - a) / 2, g = drag.g;
      if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
      if (drag.rs) {
        /* 면적은 기준층의 3 ~ 60% (모든 코어 합계 60% 이하) */
        var others = coresGeom(lastR).reduce(function (t, q) { return q.i === g.i ? t : t + q.Ac; }, 0);
        var cw = Math.max(3, Math.min(g.L - g.x0, g.cw + dX)), cd = Math.max(3, Math.min(g.B - g.y0, g.cd + dY)), A = cw * cd, lo = g.Au * 0.03, hi = Math.max(lo, g.Au * 0.6 - others);
        if (A > hi) { var kk = Math.sqrt(hi / A); cw *= kk; cd *= kk; } else if (A < lo) { var k2 = Math.sqrt(lo / A); cw *= k2; cd *= k2; }
        edit(g.i, function (c) { c.a = cw * cd; c.asp = cw / cd; c.x = g.L - cw > 0.01 ? Math.min(1, g.x0 / (g.L - cw)) : 0.5; c.y = g.B - cd > 0.01 ? Math.min(1, g.y0 / (g.B - cd)) : 0.5; });
      } else edit(g.i, function (c) { c.x = snap((g.x0 + dX) / Math.max(1e-6, g.L - g.cw)); c.y = snap((g.y0 + dY) / Math.max(1e-6, g.B - g.cd)); });
      redraw(false);
    });
    document.addEventListener('pointerup', function () {
      if (!drag) return; var d = drag; drag = null; document.body.classList.remove('dragging');
      if (!d.moved) { renderZone(lastR); return; }
      if (current) markPreset('');
      GK.fill(document, S); recompute();
    });
    box.addEventListener('keydown', function (e) {
      var h = e.target.closest && e.target.closest('.core-h.drag'); if (!h || !lastR) return;
      var i = +h.getAttribute('data-core'), g = coresGeom(lastR)[i], st = e.shiftKey ? 0.25 : 0.05; if (!g) return;
      selCore = i;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); ACT.coreDel(); return; }
      var px = g.px, py = g.py;
      if (e.key === 'ArrowLeft') px -= st; else if (e.key === 'ArrowRight') px += st; else if (e.key === 'ArrowUp') py -= st; else if (e.key === 'ArrowDown') py += st; else return;
      e.preventDefault(); edit(i, function (c) { c.x = Math.max(0, Math.min(1, px)); c.y = Math.max(0, Math.min(1, py)); }); redraw(true); if (current) markPreset(''); schedule();
    });
  }
  /* 코어 추가 · 고르기 · 삭제 · 크기 (± 2%p, 기본값 = 코어 1개 기본) */
  function coreChanged() { if (current) markPreset(''); GK.fill(document, S); recompute(); }
  ACT.coreSel = function (el) { selCore = +el.getAttribute('data-i') || 0; if (lastR) { renderZone(lastR); renderSection(lastR); } };
  ACT.coreAdd = function () {
    if (!lastR) return; var gs = coresGeom(lastR); if (!gs.length || gs.length >= CORE_MAX) return;
    /* 지금 코어들을 면적까지 확정하고, 새 코어 (기준층 8%) 는 다른 코어와 가장 멀리 떨어진 자리 */
    var list = gs.map(function (q) { return { x: q.px, y: q.py, a: q.Ac, asp: q.cw / q.cd }; }), Au = gs[0].Au, L = gs[0].L, B = gs[0].B;
    var na = Math.min(Au * 0.08, Math.max(Au * 0.03, Au * 0.6 - gs.reduce(function (t, q) { return t + q.Ac; }, 0))), sh = coreShape(na, 1.3, L, B), best = null;
    [[0.08, 0.5], [0.92, 0.5], [0.5, 0.08], [0.5, 0.92], [0.08, 0.08], [0.92, 0.92], [0.08, 0.92], [0.92, 0.08], [0.3, 0.5], [0.7, 0.5]].forEach(function (p) {
      var cx = p[0] * (L - sh.cw) + sh.cw / 2, cy = p[1] * (B - sh.cd) + sh.cd / 2, dmin = gs.reduce(function (m, q) { return Math.min(m, Math.hypot(q.x0 + q.cw / 2 - cx, q.y0 + q.cd / 2 - cy)); }, 1e9);
      if (!best || dmin > best.d) best = { d: dmin, x: p[0], y: p[1] };
    });
    list.push({ x: best.x, y: best.y, a: na, asp: 1.3 }); setCores(list); selCore = list.length - 1; coreChanged();
  };
  ACT.coreDel = function () {
    var list = coreList(); if (list.length <= 1 || !lastR) return;
    var gs = coresGeom(lastR); list = gs.filter(function (q) { return q.i !== selCore; }).map(function (q) { return { x: q.px, y: q.py, a: q.Ac, asp: q.cw / q.cd }; });
    setCores(list); selCore = Math.min(selCore, list.length - 1); coreChanged();
  };
  ACT.coreSize = function (el) {
    if (!lastR) return; var d = +el.getAttribute('data-d'), gs = coresGeom(lastR), g = gs[selCore]; if (!g) return;
    if (!d) { S.adv = S.adv || {}; delete S.adv.cores; delete S.adv.coreA; delete S.adv.coreAsp; delete S.adv.coreX; delete S.adv.coreY; selCore = 0; coreChanged(); return; }
    var others = gs.reduce(function (t, q) { return q.i === g.i ? t : t + q.Ac; }, 0), r = Math.max(0.03, Math.min(0.6 - others / g.Au, Math.round(g.Ac / g.Au * 100) / 100 + d * 0.02));
    var list = gs.map(function (q) { return { x: q.px, y: q.py, a: q.set || gs.length > 1 || q.i === g.i ? q.Ac : null, asp: q.cw / q.cd }; });
    list[g.i].a = g.Au * r; setCores(list); coreChanged();
  };
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
    var s = '', id = 'o7s', notes = [], gwlLab = '', logYs = [], lg = { st: [], gwl: false, wall: false, sup: '', two: { up: false, b: false } }, embT = null;
    /* 주석 = 도면 번호 ① ② … ↔ 오른쪽 카드 (짧은 제목 · 핵심 값 · 보조 한 줄, 긴 원문은 title). 번호 색 = 도면에서 그 요소의 색 */
    function note(t, c, x, yy, cd) { cd = cd || {}; notes.push({ t: t, c: c || 'var(--navy)', x: x, y: yy, h: cd.h || '', v: cd.v || '', s: cd.s || '' }); }
    s += '<defs>' +
      pat(id + '-soil', 8, '<circle cx="2" cy="2" r=".65" fill="#9A8457" opacity=".5"/><circle cx="6" cy="5.8" r=".55" fill="#9A8457" opacity=".42"/>') +
      pat(id + '-wsoil', 9, '<circle cx="2" cy="3" r=".65" fill="#8E6F38" opacity=".5"/><path d="M5 7h2.4" stroke="#8E6F38" stroke-width=".6" opacity=".5"/>') +
      pat(id + '-wrock', 10, '<path d="M1 8l3-3M6 9.5l2.8-2.8" stroke="#6F5C47" stroke-width=".7" opacity=".55"/>') +
      pat(id + '-srock', 8, '<path d="M-1 9L9 -1" stroke="#4E5763" stroke-width=".6" opacity=".45"/>') +
      pat(id + '-hrock', 8, '<path d="M-1 9L9 -1M-1 -1l10 10" stroke="#353B44" stroke-width=".55" opacity=".45"/>') +
      pat(id + '-conc', 5, '<path d="M-1 6L6 -1" stroke="#A0A5AC" stroke-width=".6"/>', '#EDEEF0') +
      pat(id + '-mat', 10, '<circle cx="2.5" cy="3" r=".7" fill="#8C9199"/><circle cx="7.2" cy="7.6" r=".55" fill="#8C9199"/>', '#E1E3E6') +
      pat(id + '-glass', 8, '<path d="M0.5 0V8" stroke="#E2E8F1" stroke-width=".8"/>', '#FAFBFD') +
      pat(id + '-fill', 7, '<path d="M-1 8L8 -1" stroke="#C3AE85" stroke-width=".6" opacity=".7"/>', '#F6F1E6') +
      '<linearGradient id="' + id + '-sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#F3F6FB"/><stop offset="1" stop-color="#FCFDFE"/></linearGradient>' +
      '<linearGradient id="' + id + '-fd" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".05" stop-color="#fff"/><stop offset=".95" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<mask id="' + id + '-mk"><rect x="' + r1(X0 - 8) + '" y="0" width="' + r1(X1 - X0 + 16) + '" height="' + Ht + '" fill="url(#' + id + '-fd)"/></mask>' +
      '</defs>';
    /* 지층 (GL 아래 전폭, 가장자리 흐리게) + 왼쪽 주상도 막대 */
    var strata = '', log = '';
    for (var i = 0; i < 5; i++) {
      var za = g.z[i], zc = Math.min(g.z[i + 1], maxD); if (!(zc > za)) continue;
      var ya = yd(za), yc = yd(zc);
      lg.st.push(i);
      strata += Rc(X0 - 8, ya, X1 - X0 + 16, yc - ya, 'var(--' + LKS[i] + ')', ' opacity=".9"') + Rc(X0 - 8, ya, X1 - X0 + 16, yc - ya, 'url(#' + id + '-' + LKS[i] + ')');
      log += Rc(LC - 14, ya, 10, yc - ya, 'var(--' + LKS[i] + ')', ' opacity=".9"') + Rc(LC - 14, ya, 10, yc - ya, 'url(#' + id + '-' + LKS[i] + ')') + (i ? Ln(X0 - 8, ya, X1 + 8, ya, '#FFFFFF', 0.8, null, ' opacity=".7"') : '');
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
        note('오픈컷 1:' + LIB.exc.slope + ' · 사면 폭 ' + r1(g.slopeW) + 'm · 외벽 · 방수 후 되메우기', 'var(--s-exc-ink)', eL - sl / 2 - 11, (yGL + yH) / 2,
          { h: '오픈컷 (사면)', v: '1:' + LIB.exc.slope + ' · 사면 폭 ' + r1(g.slopeW) + 'm', s: '외벽 · 방수 후 되메우기' });
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
      lg.gwl = true;
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
        var embS = '근입 ' + r1(emb) + 'm' + (rk && !nar ? ' (' + rk + ')' : '');
        embT = { x: xd + 6, y: (yH + yTip) / 2 + 4, w: tw(embS, nar ? 10.5 : 11) };
        s += T(embT.x, embT.y, embS, { fs: nar ? 10.5 : 11, w: 500, c: 'var(--ink-2)', halo: true });
      }
      lg.wall = true;
      note('흙막이 ' + (GE.WALL_N[b.wall] || b.wall) + ' L≈' + r1(Dw) + 'm' + (wi && wi.n ? ' (' + wi.n + ')' : '') + (Dt ? ' + 엄지말뚝 L≈' + r1(Dt) + 'm' + (wi.nT ? ' (' + wi.nT + ')' : '') : '') +
        (emb > 0.05 ? ' · 굴착 아래 근입 ' + r1(emb) + 'm' + (rk ? ' (' + rk + ')' : '') : ' · 근입 없음 (확인)') + (R.wall ? ' · ' + R.wall.sets + '조' : ''), '#3B4E6C', eL - ww / 2, Math.max(yGL + 30, yW - 14),
        { h: '흙막이 ' + String(GE.WALL_N[b.wall] || b.wall).replace(/ \(.*\)$/, ''), v: 'L≈' + r1(Dw) + 'm' + (wi && wi.n ? ' · ' + wi.n : '') + (Dt ? ' + 엄지말뚝 ' + r1(Dt) + 'm' : ''),
          s: (emb > 0.05 ? '근입 ' + r1(emb) + 'm' + (rk ? ' (' + rk + ')' : '') : '근입 없음 (확인)') + (R.wall ? ' · ' + R.wall.sets + '조' : '') });
      if (anc) {
        var spA = LIB.support.ANCHOR.sp, dy = aPx * 0.36;
        for (var q = 0; q < nsup; q++) {
          var yq = yd(Math.min(Hx - 0.5, 1.5 + q * spA));
          s += Ln(eL - ww, yq, eL - ww - aPx, yq + dy, 'var(--s-sup)', .9) + Ln(eL - ww - aPx * 0.5, yq + dy * 0.5, eL - ww - aPx, yq + dy, 'var(--s-sup)', 2.6, null, ' stroke-linecap="round" opacity=".75"');
          s += Ln(eR + ww, yq, eR + ww + aPx, yq + dy, 'var(--s-sup)', .9) + Ln(eR + ww + aPx * 0.5, yq + dy * 0.5, eR + ww + aPx, yq + dy, 'var(--s-sup)', 2.6, null, ' stroke-linecap="round" opacity=".75"');
          s += Rc(eL - ww - 2.5, yq - 1.5, 3, 3, 'var(--s-sup)') + Rc(eR + ww - 0.5, yq - 1.5, 3, 3, 'var(--s-sup)');
        }
        lg.sup = 'ANCHOR';
        note('어스앵커 ' + nsup + '단 · 첫 단 GL−1.5m · 간격 ' + spA + 'm' + (R.exc.anchor ? ' · 총 ' + fmt(R.exc.anchor.total) + '본 (' + R.exc.anchor.sets + '조)' : ''), 'var(--s-sup)', Math.max(X0, eL - ww - aPx - 10), yd(1.5) + dy + 4,
          { h: '어스앵커', v: nsup + '단 · 간격 ' + spA + 'm', s: '첫 단 GL−1.5m' + (R.exc.anchor ? ' · ' + fmt(R.exc.anchor.total) + '본 (' + R.exc.anchor.sets + '조)' : '') });
      }
    }
    if (si) {
      /* 차수 SCW : 굴착 외곽 둘레 (부분 지하면 얕은 기초 구간까지 감싼 외곽) */
      var Dc = si.main, yS = yd(Math.min(Dc, maxD - 0.5)), xa = eL - sl - 8, xb = (partial ? Math.max(fR, eR + sl) : eR + sl) + 5;
      s += Rc(xa, yGL - 5, 3, yS - yGL + 5, 'var(--steel)') + Rc(xb, yGL - 5, 3, yS - yGL + 5, 'var(--steel)');
      note('차수 SCW · L≈' + r1(Dc) + 'm · ' + (partial ? '굴착 · 얕은 기초 구간 외곽 둘레' : '굴착 외곽 둘레'), 'var(--steel)', xa + 1.5, yS - 12,
        { h: '차수 SCW', v: 'L≈' + r1(Dc) + 'm', s: partial ? '굴착 · 얕은 기초 외곽 둘레' : '굴착 외곽 둘레' });
    }
    /* 지하층 — 깊이 글자 (dLab) 는 PRD 기둥 선 위에 얹도록 나중에 그린다 */
    var dLab = '';
    rows.forEach(function (r) {
      if (!r.bl) return;
      var x0 = bL, x1 = bR, wt = nar ? 3.5 : 5, gr = r.gr;
      s += Rc(x0, r.y0, x1 - x0, r.hp, '#F7F9FC') + Rc(x0, r.y0, wt, r.hp, 'url(#' + id + '-conc)') + Rc(x1 - wt, r.y0, wt, r.hp, 'url(#' + id + '-conc)');
      if (!R.PRD) { var nCl = Math.max(2, Math.min(9, Math.round((x1 - x0) / 46))); for (var cl = 1; cl < nCl; cl++) { var xcl = x0 + (x1 - x0) * cl / nCl; s += Rc(xcl - 1, r.y0, 2, r.hp, '#E4EAF2'); } }
      s += Ln(x0, r.y0, x0, r.y1, '#8C9AB0', 0.7) + Ln(x1, r.y0, x1, r.y1, '#8C9AB0', 0.7) + Ln(x0 - 1, r.y0, x1 + 1, r.y0, 'var(--navy)', 1.4);
      if (gr.n > 1) for (var j = 1; j < gr.n; j++) { var yj = r.y0 + r.hp * j / gr.n; s += Ln(x0 - 3, yj, x0 + wt + 3, yj, 'var(--cp)', 1.3) + Ln(x1 - wt - 3, yj, x1 + 3, yj, 'var(--cp)', 1.3); }
      if (x1 - x0 > 70) { var dT = '−' + r1(r.dB); dLab += Rc(x0 + wt + 3, r.y1 - 15, tw(dT, 10.5) + 6, 13, '#F7F9FC') + T(x0 + wt + 6, r.y1 - 6, dT, { fs: 10.5, c: 'var(--ink-3)', cls: 'n' }); }
    });
    /* 가설 지보 (지하층 위에 겹쳐) : 스트럿 · 레이커 · 역타 PRD */
    if (b.nB > 0 && !open && nsup > 0 && (b.sup === 'STRUT' || b.sup === 'RAKER')) {
      var spS = LIB.support[b.sup].sp;
      for (var q2 = 0; q2 < nsup; q2++) {
        var yq2 = yd(Math.min(Hx - 0.5, 1.5 + q2 * spS));
        if (b.sup === 'STRUT') s += Ln(eL, yq2, eR, yq2, 'var(--s-sup)', 1.3, '9 3', ' opacity=".8"') + Rc(eL, yq2 - 2.5, 5, 5, 'var(--s-sup)') + Rc(eR - 5, yq2 - 2.5, 5, 5, 'var(--s-sup)');
        else { var run = Math.min((yH - yq2) * 0.9, (eR - eL) * 0.3); s += Ln(eL, yq2, eL + run, yH, 'var(--s-sup)', 1.4, null, ' opacity=".8"') + Ln(eR, yq2, eR - run, yH, 'var(--s-sup)', 1.4, null, ' opacity=".8"'); }
      }
      lg.sup = b.sup;
      note((b.sup === 'STRUT' ? '스트럿 (버팀보) ' : '레이커 ') + nsup + '단 · 첫 단 GL−1.5m · 간격 ' + spS + 'm', 'var(--s-sup)', b.sup === 'STRUT' ? cx : eL + 16, yd(1.5) + (b.sup === 'STRUT' ? 0 : 14),
        { h: b.sup === 'STRUT' ? '스트럿 (버팀보)' : '레이커', v: nsup + '단 · 간격 ' + spS + 'm', s: '첫 단 GL−1.5m' });
    }
    if (TD && b.nB > 0) note('역타 : 지하 슬래브가 지보 · 기준층 ' + R.tdBase.name + ' 슬래브 선타설 → 아래로 굴착 · 슬래브 반복', 'var(--navy)', bL + (bR - bL) * (nar ? 2 : 1) / Math.max(3, Math.min(7, Math.round((bR - bL) / 34))), yGL + 17,
      { h: '역타 (Top-Down)', v: '기준층 ' + R.tdBase.name + ' 선타설', s: '지하 슬래브 = 지보' });
    if (R.PRD && b.nB > 0) {
      var nC = Math.max(3, Math.min(7, Math.round((bR - bL) / 34))), yP = yd(prdL), xp0 = 0;
      for (var c = 0; c < nC; c++) { var xp = bL + (bR - bL) * (c + 0.5) / nC; if (!c) xp0 = xp; s += Ln(xp, yGL, xp, yP, '#7C8BA3', 1.5, null, ' opacity=".7"') + Rc(xp - 2.5, yP - 1, 5, 3, '#7C8BA3'); }
      note('PRD · SPS 기둥 ' + R.PRD.n + '공 · L≈' + r1(R.PRD.L) + 'm (굴착 전 선시공)', 'var(--steel)', xp0 - 12, yP + 4,
        { h: 'PRD · SPS 기둥', v: R.PRD.n + '공 · L≈' + r1(R.PRD.L) + 'm', s: '굴착 전 선시공' });
    }
    s += dLab;
    /* 기초 매트 · 얕은 기초 · 파일 */
    var mL = partial ? bL : fL, mR = partial ? bR : fR, yMt = yd(matTop), yMb = yd(matBot);
    if (!partial && b.nB > 0) { mL = Math.max(fL, eL); mR = Math.min(fR, eR); }
    s += Rc(mL, yMt, mR - mL, Math.max(3, yMb - yMt), 'url(#' + id + '-mat)', ' stroke="var(--navy)" stroke-width=".8"');
    var matLab = '매트 t=' + r1(g.tMat) + 'm';
    /* 매트가 굴착선 아래까지 내려가면 (굴착 깊이 고정 + 두꺼운 매트) 매트 글자가 '굴착 GL−' 글자와 겹친다 → 그때는 번호 · 카드로 */
    var mHit = b.nB > 0 && Math.abs((yMt + yMb) / 2 + 4 - (yH + 16)) < 15 && Math.abs((mL + mR) / 2 - (partial ? (eL + eR) / 2 : cx)) < (tw(matLab, 11.5) + tw('굴착 GL−' + r1(Hx) + 'm', 12)) / 2 + 6;
    if (!mHit && yMb - yMt >= 15 && mR - mL > tw(matLab, 11.5) + 12) s += T((mL + mR) / 2, (yMt + yMb) / 2 + 4, matLab, { a: 'middle', fs: 11, w: 600, c: 'var(--navy)', halo: '#E1E3E6' });
    else note('기초 매트 t=' + r1(g.tMat) + 'm', 'var(--s-conc)', mL + Math.min(34, (mR - mL) * 0.18), (yMt + yMb) / 2,
      { h: '기초 매트', v: 't=' + r1(g.tMat) + 'm', s: GE.FOUND_N[R.fType] || '' });
    var yShB = 0;
    if (partial) {
      yShB = yd(g.Hs); s += Rc(bR, yGL + 1, fR - bR, Math.max(3, yShB - yGL - 1), 'url(#' + id + '-mat)', ' stroke="var(--navy)" stroke-width=".8"');
      note('얕은 기초 (지하 없는 구간) · GL−' + r1(g.Hs) + 'm', 'var(--s-conc)', bR + (fR - bR) * 0.5, (yGL + yShB) / 2, { h: '얕은 기초', v: 'GL−' + r1(g.Hs) + 'm', s: '지하 없는 구간' });
    }
    if (pile) {
      var piles = function (a, bnd, yA) { var np = Math.max(4, Math.min(18, Math.round((bnd - a) / 13))), o = ''; for (var p = 0; p < np; p++) { var xq = a + 6 + (bnd - a - 12) * (np > 1 ? p / (np - 1) : 0.5); o += Ln(xq, yA, xq, yd(pTip), '#8C9AB0', .8) + Ln(xq - 1.8, yd(pTip) - 3, xq, yd(pTip), '#8C9AB0', .8) + Ln(xq + 1.8, yd(pTip) - 3, xq, yd(pTip), '#8C9AB0', .8); } return o; };
      s += piles(mL, mR, yMb); if (partial) s += piles(bR + 4, fR, yShB);
      if (pTr) { var yt = yd(pTip) - 10; s += '<path d="M' + r1(mL) + ' ' + r1(yt) + 'h' + r1((partial ? fR : mR) - mL) + '" stroke="#fff" stroke-width="6"/><path d="M' + r1(mL) + ' ' + r1(yt - 3) + 'h' + r1((partial ? fR : mR) - mL) + 'M' + r1(mL) + ' ' + r1(yt + 3) + 'h' + r1((partial ? fR : mR) - mL) + '" stroke="var(--ink-3)" stroke-width=".8"/>'; }
      s += T((mL + (partial ? fR : mR)) / 2, yd(pTip) + 17, (R.fType === 'PHC' ? 'PHC 파일 ' : '현장타설말뚝 ') + fmt(pile.n) + '본' + (pRock ? ' · 지지층 풍화암 GL−' + r1(g.wrockTop) + 'm' : ''), { a: 'middle', fs: 11.5, w: 500, c: 'var(--ink-2)', halo: true });
    }
    /* 굴착선 (앰버 점선 — 2회 타설 이음 코발트 점선과 따로) */
    if (b.nB > 0) {
      s += Ln(eL - 10, yH, eR + 10, yH, 'var(--s-exc)', 1.4, '5 3');
      s += T(partial ? (eL + eR) / 2 : cx, yH + 16, '굴착 GL−' + r1(Hx) + 'm', { a: 'middle', fs: 12, w: 600, c: 'var(--s-exc-ink)', halo: true });
    } else {
      s += Ln(fL - 6, yd(matBot), fR + 6, yd(matBot), 'var(--s-exc)', 1.4, '5 3');
      s += T(cx, yd(matBot) + 16, '터파기 GL−' + r1(Hx || matBot) + 'm', { a: 'middle', fs: 12, w: 600, c: 'var(--s-exc-ink)', halo: true });
    }
    /* 지상층 (입면) */
    /* 코어 띠 : 평면 (조닝 지상 판) 에서 옮긴 코어 위치를 긴 변 방향으로 그대로 — 옥탑은 코어 위에 */
    /* 코어가 여러 개면 띠도 여러 개 (긴 변 방향 위치 그대로), 옥탑은 가장 큰 코어 위 */
    var up = '', elL = '', gsS = coresGeom(R), bands = gsS.map(function (q) { return { x0: tL + q.x0 / q.L * (tR - tL), w: Math.max(6, q.cw / q.L * (tR - tL)), A: q.Ac }; }), coreX0 = 0, coreW = 0;
    if (!bands.length && hasCore) bands = [{ x0: cx - Math.max(8, (tR - tL) * 0.2) / 2, w: Math.max(8, (tR - tL) * 0.2), A: 1 }];
    if (bands.length) { var big = bands.slice().sort(function (a, c) { return c.A - a.A; })[0]; coreX0 = big.x0; coreW = big.w; }
    rows.forEach(function (r, gi) {
      if (r.bl) return;
      var gr = r.gr, isPH = gr.kind === 'ph', w = isPH ? Math.max(26, (tR - tL) * 0.36) : (gr.kind === 'b' ? bR - bL : tR - tL), x = cx - w / 2;
      if (isPH && coreW) x = Math.max(tL, Math.min(tR - w, coreX0 + coreW / 2 - w / 2));
      r.xr = x + w;
      up += Rc(x, r.y0, w, r.hp, 'url(#' + id + '-glass)');
      var ca = coreW ? Math.max(x, coreX0) : 0, cb = coreW ? Math.min(x + w, coreX0 + coreW) : 0;
      bands.forEach(function (bd) { var qa = Math.max(x, bd.x0), qb = Math.min(x + w, bd.x0 + bd.w); if (qb > qa) up += Rc(qa, r.y0, qb - qa, r.hp, '#E3EAF5') + Ln(qa, r.y0, qa, r.y1, '#A4B6D1', 0.7) + Ln(qb, r.y0, qb, r.y1, '#A4B6D1', 0.7); });
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
      if (b.nB > 0 && yH - yGL > 60) s += dimV(22, yGL, yH, 'var(--s-exc-ink)', '굴착 ' + r1(Hx) + 'm');
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
    /* 기초 (매트) 두께 칸 : 매트 높이 (바로 위 층 칸과 겹치면 그 아래) — 층고 칸과 같은 모양, data-mat → ACTC.secMat (S.adv.mat 0.3 ~ 6m, 비우면 자동) */
    var rLast = rows[rows.length - 1], yMm = (yMt + yMb) / 2, yMr = Math.max(yMm, (rLast.y0 + rLast.y1) / 2 + (nar ? 22 : 30));
    /* 근입 글자가 오른쪽 열까지 들어와 있으면 그 아래로 */
    if (embT && embT.x + embT.w > W - RW - 2 && yMr < embT.y + (nar ? 15 : 19) && yMr > embT.y - (nar ? 26 : 32)) yMr = embT.y + (nar ? 15 : 19);
    var xm = b.nB > 0 ? (open ? Math.max(mR, eR + (R.scw ? 9 : 0)) : eR + ww + (anc ? aPx + 2 : 0)) : mR;
    if (partial) xm = Math.max(xm, fR);
    if (RX - 2 - (xm + 6) > 6) s += Math.abs(yMr - yMm) < 1 ? Ln(xm + 6, yMm, RX - 2, yMm, 'var(--slate-2)', 1, '1.5 3') :
      '<path d="M' + r1(xm + 6) + ' ' + r1(yMm) + 'H' + r1(RX - 16) + 'L' + r1(RX - 2) + ' ' + r1(yMr) + '" fill="none" stroke="var(--slate-2)" stroke-width="1" stroke-dasharray="1.5 3"/>';
    var matSet = +((R.inp && R.inp.adv) || {}).mat > 0, matSub = '두께 · ' + (matSet ? '입력' : '자동'), nZf = R.found && R.found.nZ ? R.found.nZ + ' Zone' : '1회';
    var mInp = '<input class="fh fh-m' + (nar ? ' fh-l' : '') + (matSet ? '' : ' auto') + '" type="number" min="0.3" max="6" step="0.1" inputmode="decimal" data-mat="' + (+g.tMat.toFixed(2)) + '" data-actc="secMat" value="' + (+g.tMat.toFixed(2)) +
      '" aria-label="기초 매트 두께 (m)" title="기초 매트 두께 (' + (matSet ? '입력값' : '자동') + ') — 0.3 ~ 6m, 비우면 자동 · 바꾸면 바로 공기에 반영"';
    if (nar) {
      s += T(cLab, yMr + 4.3, '기초', { fs: 12, w: 600, c: 'var(--navy)' });
      lst += '<div class="fr fm"><span class="fl">기초<small>' + matSub + '</small></span>' + mInp + '><span class="fp">' + nZf + '</span><span class="fe">GL−' + r1(matBot) + '</span></div>';
    } else {
      s += T(cLab, yMr - 1, '기초', { fs: 14, w: 600, c: 'var(--navy)' }) + T(cLab, yMr + 13, matSub, { fs: 11.5, c: 'var(--ink-3)' });
      s += Rc(cP, yMr - 10, wP, 20, 'var(--band)', ' rx="10"') + T(cP + wP / 2, yMr + 4, nZf, { a: 'middle', fs: 11.5, c: 'var(--ink-3)' });
      html += mInp + ' style="left:' + cIn + 'px;top:' + r1(yMr - 13) + 'px;width:' + wIn + 'px">';
    }
    /* 2회 타설 이음 : 지상 = 층 안 코발트 점선, 지하 = 외벽에 짧은 코발트 표시 — 범례도 그린 쪽만 */
    lg.two = { up: rows.some(function (r) { return !r.bl && r.gr.n > 1; }), b: rows.some(function (r) { return r.bl && r.gr.n > 1; }) };
    /* 아래 : 가로 축척 + 세로 과장 배율 (지하 · 단일 층 기준) */
    var nice = [5, 10, 20, 25, 50, 100, 200], sm = 200; for (var ni = 0; ni < nice.length; ni++) if (nice[ni] * hs >= 40) { sm = nice[ni]; break; }
    var ysb = Ht - 14, smx = X0 + sm * hs, vx = k / hs;
    s += Rc(X0, ysb - 4, sm * hs / 2, 4, 'var(--ink-2)') + Rc(X0 + sm * hs / 2, ysb - 4, sm * hs / 2, 4, '#fff', ' stroke="var(--ink-2)" stroke-width=".8"');
    s += T(X0, ysb - 9, '0', { fs: 10.5, c: 'var(--ink-3)', cls: 'n', a: 'middle' }) + T(smx, ysb - 9, sm + 'm', { fs: 10.5, c: 'var(--ink-3)', cls: 'n', a: 'middle' });
    var vxT = '세로 ×' + r1(vx), vxW = tw(vxT, 11.5) + 16, vxX = smx + 14;
    if (vx > 1.15) s += Rc(vxX, ysb - 13, vxW, 18, 'var(--cp-soft)', ' rx="9"') + T(vxX + vxW / 2, ysb, vxT, { a: 'middle', fs: 11, w: 600, c: 'var(--cp-deep)', cls: 'n' });
    else vxW = -14;
    if (vx <= 1.15) s += T(smx + tw(sm + 'm', 10.5) / 2 + 10, ysb, '같은 축척', { fs: 11, c: 'var(--ink-3)' });
    /* 토목 가정 카드 : 번호 배지 (도면 번호와 같은 색) + 짧은 제목 · 핵심 값 · 보조 한 줄 — 긴 원문은 title */
    /* 핵심 값 줄바꿈은 '·' 뒤 · '+' 앞에서만 (값 · 단위가 갈라지지 않게) */
    var kvTxt = function (v) { return esc(v).replace(/ /g, ' ').replace(/ · /g, ' · ').replace(/ \+ /g, ' + '); };
    var nh = notes.map(function (n, i) {
      return '<li title="' + esc(n.t) + '"><div class="kn-h"><i style="background:' + n.c + '">' + (i + 1) + '</i><b>' + esc(n.h || n.t) + '</b></div>' +
        (n.v ? '<span class="kn-v">' + kvTxt(n.v) + '</span>' : '') + (n.s ? '<span class="kn-s">' + esc(n.s) + '</span>' : '') + '</li>';
    }).join('');
    if (lst) lst = '<div class="fhl" role="group" aria-label="층별 층고 (바꾸면 바로 다시 계산)"><div class="fr hd"><span>층</span><span>층고 (m)</span><span>타설</span><span>바닥 EL</span></div>' + lst + '</div>';
    return { html: '<div class="sec7" style="width:' + W + 'px;height:' + Ht + 'px">' + svgEl(W, Ht, s, '가정 단면도 · 지상 ' + b.nUp + '층 · 지하 ' + b.nB + '층') + html + '</div>' + lst, groups: G, elTop: elTop, notes: nh, lg: lg, Ht: Ht, vx: vx };
  }
  function renderSection(R) {
    var box = $('#section'), sc = section(R, box.clientWidth || 700);
    secG = sc.groups; box.innerHTML = sc.html; widths.section = box.clientWidth;
    $('#s-notes').innerHTML = sc.notes; $('#s-notes').hidden = !sc.notes;
    var b = R.basic, fr = R.frame, two = sc.groups.filter(function (x) { return x.n > 1 && x.kind !== 'b'; });
    $('#s-chips').innerHTML = '<span>지상 <b>' + b.nUp + '</b>층' + (b.nPH ? ' + 옥탑 <b>' + b.nPH + '</b>' : '') + ' · 지하 <b>' + b.nB + '</b>층</span>' +
      '<span>높이 <b>' + r1(sc.elTop) + '</b>m' + (b.nB > 0 ? ' · 굴착 GL−<b>' + r1(R.geo.H) + '</b>m' : '') + '</span>' +
      (two.length ? '<span class="hot" title="' + esc(fr.dc ? '층고 ' + LIB.dc.split + 'm 이상 = 수직재 2회' : fr.coreRows.length ? '코어 ' + LIB.frame.core.liftMax + 'm 초과 = 2 Lift' : '층고 ' + LIB.frame.split + 'm 이상 = 수직재 2회 (층 사이클 ×' + r2(1 + LIB.frame.vShare) + ')') + '">2회 타설 : ' + esc(two.map(function (x) { return x.label; }).join(', ')) + '</span>' : '');
    /* 범례 : 도면에 실제로 그린 것만, 도면과 같은 색 · 선 (지층 = 흙 · 암 색, 수위 = 물빛, 굴착선 = 앰버, 2회 타설 이음 = C.P 코발트, 지보 = 틸, 매트 = 콘크리트) */
    var L = sc.lg, ic = function (w, inner) { return '<svg width="' + w + '" height="14" viewBox="0 0 ' + w + ' 14" aria-hidden="true">' + inner + '</svg>'; };
    var sw = function (k) { return ic(18, '<rect y="1" width="18" height="12" fill="var(--' + k + ')" opacity=".9"/><rect y="1" width="18" height="12" fill="url(#o7s-' + k + ')"/>'); };
    var supI = L.sup === 'ANCHOR' ? '<path d="M3 4l18 6" stroke="var(--s-sup)" stroke-width=".9"/><path d="M12 7l9 3" stroke="var(--s-sup)" stroke-width="2.6" stroke-linecap="round" opacity=".75"/><rect x="1.5" y="2.5" width="3" height="3" fill="var(--s-sup)"/>' :
      L.sup === 'STRUT' ? '<path d="M3 7h18" stroke="var(--s-sup)" stroke-width="1.3" stroke-dasharray="9 3" opacity=".8"/><rect x="1" y="4.5" width="5" height="5" fill="var(--s-sup)"/><rect x="18" y="4.5" width="5" height="5" fill="var(--s-sup)"/>' :
      '<path d="M3 2l16 11" stroke="var(--s-sup)" stroke-width="1.4" opacity=".8"/>';
    $('#s-lg').innerHTML = '<span class="lg-st">' + L.st.map(function (i) { return '<span>' + sw(LKS[i]) + LNM[i] + '</span>'; }).join('') + '</span>' +
      (L.gwl ? '<span>' + ic(24, '<path d="M1 9h22" stroke="var(--gwl)" stroke-width="1.4" stroke-dasharray="8 4"/><path d="M7 1h8l-4 6z" fill="var(--gwl)"/>') + '지하수위</span>' : '') +
      '<span>' + ic(24, '<path d="M1 7h22" stroke="var(--s-exc)" stroke-width="1.4" stroke-dasharray="5 3"/>') + (b.nB > 0 ? '굴착선' : '터파기선') + '</span>' +
      (L.two.up || L.two.b ? '<span>' + (L.two.up ? ic(24, '<path d="M1 7h22" stroke="var(--cp)" stroke-width="1.1" stroke-dasharray="5 3"/>') : '') +
        (L.two.b ? ic(14, '<rect x="4.5" y="0" width="5" height="14" fill="url(#o7s-conc)"/><path d="M4.5 0v14" stroke="#8C9AB0" stroke-width=".7"/><path d="M1.5 7h11" stroke="var(--cp)" stroke-width="1.3"/>') : '') + '2회 타설 이음</span>' : '') +
      (L.wall ? '<span>' + ic(14, '<rect x="5" y="0" width="5" height="14" rx="1" fill="#3B4E6C"/>') + '흙막이</span>' : '') +
      (L.sup ? '<span>' + ic(24, supI) + (L.sup === 'ANCHOR' ? '어스앵커' : L.sup === 'STRUT' ? '스트럿' : '레이커') + '</span>' : '') +
      '<span>' + ic(18, '<rect x=".4" y="1.4" width="17.2" height="11.2" fill="url(#o7s-mat)" stroke="var(--navy)" stroke-width=".8"/>') + '기초 매트</span>';
  }
  function onSecEdit(e) {
    var el = e.target; if (!el || !el.classList || !el.classList.contains('fh') || !lastR || !secG) return;
    /* 기초 (매트) 두께 칸 : 바뀜 (change) 은 ACTC.secMat 이 받고, Enter 만 여기서 넘긴다 */
    if (el.hasAttribute('data-mat')) { if (e.type === 'keydown') ACTC.secMat(el, e); return; }
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
  /* 기초 (매트) 두께 칸 : 0.3 ~ 6m 로 맞추고, 비우면 자동 (지상 층수 기준) · 0 이하 · 숫자 아님 = 원래 값으로 */
  ACTC.secMat = function (el, e) {
    if (!lastR || !document.body.contains(el)) return;
    var raw = String(el.value).trim(), x = parseFloat(raw), cur = lastR.geo.tMat, was = S.adv && +S.adv.mat > 0 ? +S.adv.mat : null, v;
    if (raw === '') v = null;
    else if (!isFinite(x) || x <= 0) { el.value = +cur.toFixed(2); return; }
    else v = Math.round(Math.max(0.3, Math.min(6, x)) * 100) / 100;
    if (v === was || (v != null && was == null && Math.abs(v - cur) < 1e-9)) { el.value = +cur.toFixed(2); return; }
    var kd = e && e.type === 'keydown';
    /* 다시 그리기는 이벤트가 끝난 뒤 (blur 중 DOM 교체 오류 방지) */
    setTimeout(function () {
      S.adv = S.adv || {}; S.adv.mat = v; if (current) markPreset('');
      GK.fill(document, S); recompute();
      if (kd) { var nx = document.querySelector('#section input[data-mat]'); if (nx) nx.focus(); }
    }, 0);
  };
  document.addEventListener('change', onSecEdit);
  document.addEventListener('change', function (e) { var ac = e.target && e.target.closest && e.target.closest('[data-actc]'); if (ac && ACTC[ac.getAttribute('data-actc')]) ACTC[ac.getAttribute('data-actc')](ac, e); });
  /* 층고 · 기초 두께 칸 : Enter = 적용, Esc = 고치던 값 취소 (주요 가정사항 · 사이클 칸과 같게) */
  document.addEventListener('keydown', function (e) {
    var t = e.target; if (!t || !t.classList || !t.classList.contains('fh')) return;
    if (e.key === 'Enter') { e.preventDefault(); onSecEdit(e); }
    else if (e.key === 'Escape' && t.value !== t.defaultValue) { e.preventDefault(); t.value = t.defaultValue; }
  });

  /* ───────── 조닝 아래 사이클 표 : 엔진이 실제로 계산한 단위 (기초 = 준비 · 철근 · 형틀 · 타설 Zone 1개, 지하 = 층별 외벽 · 바닥 / 역타 Zone 순환 / 부분 지하 경로,
     지상 = DC 는 외주부 · 코어 공종 사슬, 일반은 팀당 Zone 연속).
     표 = Activity | 일수 (WD) | 바차트 (머리 = WD 눈금 1 2 3 …). 일수 칸 = 직접 입력 · ▲▼ (0.5 WD, 최소 0.5) → 그 값이 나오도록 해당 파라미터
     (공법 라이브러리 S.libOv · 상세 입력 S.adv) 를 엔진 식으로 역산해 다시 계산.
     바를 좌우로 끌면 앞 공종과 겹침 (0 ≤ 겹침 ≤ 앞 공종 일수, 0.5 WD 단위) → S.adv.fOv · bOv · pOv · dcOv (엔진이 사이클 = 가장 늦은 끝으로 계산) · 역타 Zone 은 시차 (td.f1Lag) */
  var CYED = {}, CYCH = {}, cyCur = '', cyDg = null;
  function rd(x) { return Math.round(x * 1e4) / 1e4; }
  /* 차트마다 편집 칸 · 팀 고정 · 겹침 입력 키 (되돌리기 단추가 쓴다) */
  function cyBegin(id, pins, ovk) { (CYCH[id] ? CYCH[id].eds : []).forEach(function (k) { delete CYED[k]; }); CYCH[id] = { eds: [], pins: pins || [], ovk: ovk || [] }; cyCur = id; }
  function addEd(key, e) { e.key = key; e.ch = cyCur; CYED[key] = e; var c = CYCH[cyCur]; if (c && c.eds.indexOf(key) < 0) c.eds.push(key); return key; }
  /* 상세 입력 기록 : 처음 고칠 때 원래 값 (없으면 null) 을 S.cyPrev 에 — 되돌리기는 그 값으로 */
  function jHas(ak) { return !!(S.cyPrev && Object.prototype.hasOwnProperty.call(S.cyPrev, ak)); }
  function jSet(ak, v) { S.cyPrev = Object.assign({}, S.cyPrev); if (!jHas(ak)) S.cyPrev[ak] = S.adv && S.adv[ak] != null && S.adv[ak] !== '' ? S.adv[ak] : null; S.adv = S.adv || {}; S.adv[ak] = v; }
  function jReset(ak, only) {
    if (!jHas(ak)) return; var pv = S.cyPrev[ak]; S.adv = S.adv || {};
    if (only == null || +S.adv[ak] === +only) { if (pv == null || pv === '') delete S.adv[ak]; else S.adv[ak] = pv; }
    S.cyPrev = Object.assign({}, S.cyPrev); delete S.cyPrev[ak];
  }
  /* 팀수가 자동 (최적값) 이면 고칠 때 지금 보이는 팀수로 고정 — 고친 값이 그대로 나오게 (최적 팀수는 팀 칩이 따로 알려 줌). 차트 되돌리기 = 자동으로.
     화면 값이 팀수에 따라 달라지는 칸 (일반 지상 바닥 = uTeams · 코어 = cTeams) 만 고정 — 기초 · 지하 · DC 공종 값은 팀수와 무관 */
  function teamNow(k) {
    var R = lastR, ty = R.frame.typ, tk = (R.teamKeys || []).filter(function (q) { return q.key === k; })[0];
    if (tk && tk.now > 0) return tk.now;
    return k === 'fTeams' ? R.found.teams : k === 'uTeams' ? (ty.dc ? ty.dc.P.T : ty.slab.T) : k === 'cTeams' ? (ty.dc ? ty.dc.C.T : ty.core ? ty.core.T : 0) : 0;
  }
  function pinTeams(keys) { (keys || []).forEach(function (k) { if (hasTeam(k) || !lastR) return; var v = teamNow(k); if (!(v > 0)) return; jSet(k, v); S.cyPin = Object.assign({}, S.cyPin); S.cyPin[k] = v; }); }
  function unpinTeams(keys) { (keys || []).forEach(function (k) { if (!S.cyPin || !Object.prototype.hasOwnProperty.call(S.cyPin, k)) return; jReset(k, S.cyPin[k]); S.cyPin = Object.assign({}, S.cyPin); delete S.cyPin[k]; }); }
  /* 값 하나만 기본값으로 : 같은 차트에 그 팀 고정을 쓰는 다른 고친 값이 없으면 팀 고정도 풂 */
  function cyReset1(e) {
    e.reset();
    var c = CYCH[e.ch], rest = (e.pin || []).filter(function (t) { return !(c ? c.eds : []).some(function (k) { var x = CYED[k]; return x && x !== e && x.on && (x.pin || []).indexOf(t) >= 0; }); });
    unpinTeams(rest);
  }
  /* 숫자 칸 상한 (오타 방지) : 기본값의 10배 · 최소 60 WD */
  function edMax(def) { return Math.max(60, 10 * (def || 0)); }
  /* 라이브러리 값 하나 : 화면 값 = 값 × k — k 는 지금 값으로 역산 (작업시간 · 층고 보정 · Zone 수 등 엔진 식 그대로) */
  function edLin(key, lab, path, cur, o) {
    o = o || {};
    var lv = getP(LIB, path.split('.')), dv = libDef(path);
    var k = o.k != null ? o.k : (lv > 0 ? cur / lv : 0);
    if (!(k > 0) || !isFinite(cur) || !(dv > 0)) return '';
    return addEd(key, { lab: lab, cur: cur, def: dv * k, on: hasOv(path), min: o.min != null ? o.min : 0.1, max: edMax(dv * k), pin: o.pin, zero: !!o.zero,
      set: function (v) { setLib(path, rd(Math.max(0.01, v / k))); },
      reset: function () { delOv(path); } });
  }
  /* 상세 입력 (S.adv) 값 하나 : 화면 값 = 실효값 eff(입력) × k. 처음 고칠 때 원래 입력을 S.cyPrev 에 적어 두고, 되돌리기는 그 값으로 (사례 입력값은 '바뀐 값' 이 아님) */
  function edAdv(key, lab, ak, cur, k, eff, o) {
    o = o || {};
    if (!(k > 0) || !isFinite(cur)) return '';
    var j = jHas(ak), pv = j ? S.cyPrev[ak] : null, now = S.adv ? S.adv[ak] : null;
    var dv = eff(j ? pv : now) * k;
    return addEd(key, { lab: lab, cur: cur, def: dv, on: j && String(pv == null ? '' : pv) !== String(now == null ? '' : now), min: o.min != null ? o.min : 0.1, max: o.max != null ? o.max : edMax(dv),
      set: function (v) { jSet(ak, rd(v / k)); },
      reset: function () { jReset(ak); } });
  }
  function liftEff(x) { return +x > 0 ? Math.max(1, Math.min(60, +x)) : LIB.base.liftWD; }
  function bfEff(x) { return x != null && x !== '' && isFinite(parseFloat(x)) ? Math.max(0, parseFloat(x)) : LIB.base.backfill; }
  /* 지하 바닥 : n개층 × max(최소, Zone/팀 × slabD) ÷ 작업시간 — 최소보다 작게 고치면 최소도 그 값으로 */
  function edSlab(key, lab, cur, per, hF, n) {
    var dp = 'base.slabD', mp = 'base.minSlab';
    if (!(per > 0) || !(n > 0)) return '';
    var dv = n * Math.max(libDef(mp), per * libDef(dp)) / hF;
    return addEd(key, { lab: lab, cur: cur, def: dv, on: hasOv(dp) || hasOv(mp), min: 0.1, max: edMax(dv),
      set: function (v) { var f = v / n * hF; setLib(dp, rd(f / per)); if (f < LIB.base.minSlab - 1e-9) setLib(mp, rd(f)); },
      reset: function () { delOv(dp); delOv(mp); } });
  }
  /* 지상 바닥 (DC 아님) : 층 WD = max(최소 사이클, 팀당 Zone × (d + PT) ÷ 작업시간 × 분할 타설 × 층고) — d = LIB.frame.d[구조] */
  function edFrame(key, R, sl, cur) {
    /* 옛 식 (model 'old') 만 — v2.8 사슬 경로는 frame.d · minTact 를 쓰지 않아 공종 일수 (v28.*) 로 고친다 */
    if (sl.model && sl.model !== 'old') return '';
    var st = R.basic.struct, hF = R.basic.hF || 1, off = R.inp.pt ? LIB.frame.ptAdd : 0, k = sl.per * (sl.lk || 1) * (sl.hf || 1) / hF, dp = 'frame.d.' + st, mp = 'frame.minTact.' + st;
    if (!(k > 0) || libDef(dp) == null) return '';
    var dv = Math.max(libDef(mp) / hF, (libDef(dp) + off) * k);
    return addEd(key, { lab: '바닥 사이클', cur: cur != null ? cur : sl.wd, def: dv, on: hasOv(dp) || hasOv(mp), min: 0.5, max: edMax(dv), pin: ['uTeams'],
      set: function (v) { setLib(dp, rd(Math.max(0.05, v / k - off))); if (v < LIB.frame.minTact[st] / hF - 1e-9) setLib(mp, rd(v * hF)); },
      reset: function () { delOv(dp); delOv(mp); } });
  }
  /* DC 공종 → 라이브러리 키 (철근 · 테이블폼은 물량 ÷ 생산성 자동 계산이라 고치지 않음) */
  var DCMAP = { '양중': 'lift', '형틀': 'form', '해체': 'strip', '타설': 'pour', '비계 · 안전망': 'scaf', '비계 · 동바리': 'scaf', 'M&E': 'me', '양생': 'cure', '양생 · 해체': 'cure', '보 형틀': 'bform', '코어 슬래브 형틀': 'coreForm' };
  var DCRO = '물량 ÷ 생산성 (자동 계산)';
  function edDC(id, nm, cur) { var p = DCMAP[nm]; return p ? edLin('u.dc.' + id, nm, 'dc.' + p, cur) : ''; }
  /* v2.8 사슬 공종 (R.frame.typ.slab.items · R.base.rows[i].items) 의 일수 칸.
     고정 공종 (양중 · 형틀 · 타설 …) = 라이브러리 일수 (v28.lift 등) — 화면 = 일수 ÷ 작업시간 (타설은 고정).
     작업량 공종 (철근 · 테이블폼 · DECK) = ⌈물량 q ÷ (생산성 p × [철근 t/인·일] × 작업시간)⌉ (+ PT 일수) → 넣은 WD 가 나오는 p (인원 · 장/일 · ㎡/일) 로 역산.
     정수 올림이라 0.5 단위 대신 1 WD 씩 (▲ = 올림 · ▼ = 내림). 라이브러리 키는 지상 · 지하 사슬이 같이 쓴다 */
  var V28U = { 'v28.crewW': '인', 'v28.crewU': '인', 'v28.crewCS': '인', 'v28.table': '장/일', 'v28.deck': '㎡/일', 'v28.steelPc': 'pcs/일' };
  function v28Lib(R) { return (R.frame.v28 && R.frame.v28.lib) || LIB.v28 || {}; }
  function edItem(key, it, R) {
    var hF = R.basic.hF || 1, path = it.lib || '';
    if (!/^v28\./.test(path) || !(libDef(path) > 0)) return '';
    if (it.fixed) return edLin(key, it.n, path, it.wd, { k: path === 'v28.pour' || path === 'v28.c3End' ? 1 : 1 / hF });
    var V8 = v28Lib(R), q = +it.q, ex = (it.pt || 0) / hF, m = it.u === 't' ? +V8.tPerMD : 1, pd = libDef(path), cur = it.wd;
    if (!(q > 0) || !(m > 0) || !(V8[path.slice(4)] > 0)) return '';
    var wdOf = function (p) { return Math.ceil(q / (p * m * hF) - 1e-9) + ex; };
    /* q 는 엔진이 반올림한 값 (소수 1 ~ 2자리) → 앞뒤 여유를 두고도 같은 WD 가 되는 값 중 가장 둥근 값 (정수 → 0.5 → 0.1 → 구간 가운데) */
    var pFor = function (W) {
      var lo = q * (1 - 2e-3) - 0.006, hi = q * (1 + 2e-3) + 0.006, b = q / (m * hF * W);
      var ok = function (p) { return p > 0 && Math.ceil(lo / (p * m * hF) - 1e-9) === W && Math.ceil(hi / (p * m * hF) - 1e-9) === W; };
      var cs = [Math.ceil(b - 1e-9), Math.ceil(b * 2 - 1e-9) / 2, Math.ceil(b * 10 - 1e-9) / 10, q / (m * hF * (W - 0.5))];
      for (var i = 0; i < cs.length; i++) if (ok(cs[i])) return rd(cs[i]);
      return rd(cs[3]);
    };
    return addEd(key, { lab: it.n, cur: cur, def: hasOv(path) ? wdOf(pd) : cur, on: hasOv(path), min: 1 + ex, max: edMax(wdOf(pd)), step1: true,
      set: function (v) { var W = Math.max(1, v > cur ? Math.ceil(v - ex - 1e-9) : Math.floor(v - ex + 1e-9)); if (Math.abs(wdOf(pd) - ex - W) < 1e-9) delOv(path); else setLib(path, pFor(W)); },
      reset: function () { delOv(path); } });
  }
  /* 공종 한 줄 근거 (title) */
  function itTip(it, R) {
    var V8 = v28Lib(R), hF = R.basic.hF || 1, hs = hF !== 1 ? ' ÷ 작업시간 ' + r2(hF) : '', p = it.lib ? V8[it.lib.slice(4)] : null;
    if (it.fixed) return '고정 ' + r1(p != null ? p : it.wd) + 'WD' + (it.lib === 'v28.pour' || it.lib === 'v28.c3End' ? '' : hs) + ' (' + it.lib + ')';
    if (!(it.q > 0)) return '물량 0 (코어 · 벽체 없음)';
    var tq = it.u === 't';
    return 'Zone 1개 ' + (tq ? r2(it.q) : fmt(it.q)) + it.u + ' ÷ (' + (tq ? fmt(p) + '인 × ' + r2(V8.tPerMD) + 't/인·일' : fmt(p) + (V28U[it.lib] || '')) + ')' + hs + ' → 올림' + (it.pt ? ' + PT ' + r1(it.pt) + '일' : '') + ' (' + it.lib + (tq ? ' · v28.tPerMD' : '') + ')';
  }
  /* 사슬 겹침 기본 (라이브러리 v28.ov*) : ov1 = v2.8 · ov3 · ov4 · ov5 = 사례 B 보정 (가정) */
  var OV28N = { 1: 'v2.8 (벽체 철근 ∥ 양중)', 3: '사례 B 보정 (가정)', 4: '사례 B 보정 (가정)', 5: '사례 B 보정 (가정)' };
  function ovNote(i, user) {
    var d = +(LIB.v28 && LIB.v28['ov' + i]) || 0, u = user && typeof user === 'object' && user['a' + i] != null && isFinite(parseFloat(user['a' + i]));
    return u ? '입력 (기본 ' + r1(d) + (d > 0 && OV28N[i] ? ' · ' + OV28N[i] : '') + ')' : d > 0 ? '기본 겹침 ' + r1(d) + ' WD = ' + (OV28N[i] || '라이브러리') : '';
  }
  /* v2.8 공종 사슬 표 (Zone 1개) : 공종 줄 (끌기 겹침 → S.adv.rcOv · bcOv) + 층 사이클 환산 (2회 타설 · 층고 · 하루 1 Zone 하한) 점선 줄 */
  function c4Rows(R, x, ch, ovp, user) {
    var rows = [], e = 0, its = x.items || [];
    its.forEach(function (it, i) {
      var ed = edItem(ch + '.' + it.k, it, R), nt = i ? ovNote(i, user) : '';
      /* 이름 칸이 좁아 '(PT 1일)' 은 '+PT' 로 줄임 (일수는 title) */
      rows.push(cyRow(it.pt ? it.n.replace(/ \(PT [\d.]+일\)$/, ' +PT') : it.n, it.s, it.wd, { ed: ed, ro: ed ? '' : itTip(it, R), ch: ch, ci: i, lock: LOCK0, tip: itTip(it, R),
        ov: i ? { key: ovp + '.a' + i, pe: e, mx: its[i - 1].wd, o: it.ov || 0, note: nt } : null }));
      e = Math.max(e, it.s + it.wd);
    });
    var zf = x.zoneF != null ? x.zoneF : x.zone;
    if (zf > x.zone + 0.05) rows.push(cyRow('층 환산', 0, zf, { k: 'gh', sub: true, ro: '사슬 ' + r1(x.zone) + ' × 2회 타설 ' + r2(x.lk || 1) + ' × 층고 ' + r2(x.hf || 1),
      tip: 'Zone 1개 사슬 ' + r1(x.zone) + 'WD × 2회 타설 계수 ' + r2(x.lk || 1) + ((x.pl != null ? x.pl : x.lifts) > 1 ? ' (' + (x.pl != null ? x.pl : x.lifts) + '회 타설)' : '') + ' × 층고 보정 ' + r2(x.hf || 1) + ' = ' + r1(zf) + 'WD', lock: '계산값 — 층고는 단면 층고 칸에서' }));
    if (x.lb && x.lb.on) rows.push(cyRow('하루 1 Zone 하한', 0, x.lb.v, { k: 'gh', sub: true, ro: '팀당 ' + x.nt + ' Zone × ' + r1(x.takt) + 'WD',
      tip: '팀당 ' + x.nt + ' Zone × 하루 1 Zone (' + r1(x.takt) + 'WD) = ' + r1(x.lb.v) + 'WD > 사슬 ' + r1(zf) + 'WD → 층간 하한 (가정)', lock: '팀 수를 늘리면 풀림' }));
    return rows;
  }
  /* 사슬 아래 한 줄 : Zone 연속 · 팀당 nt Zone → 맨 위층 (지하는 1F 바닥) + (nt − 1) */
  function c4Foot(x, top) {
    var g = Math.max(0, (x.nt || 1) - 1) * (x.takt != null ? x.takt : 1);
    return (x.flow === 'FLOOR' ? '층 완결 · 팀당 <b>' + x.nt + '</b> Zone (하루 1 Zone) → 층마다 + ' + r1(g) : 'Zone 연속 · 팀당 <b>' + x.nt + '</b> Zone (하루 1 Zone) → ' + top + ' + ' + r1(g)) + ' WD';
  }
  function needTip(x) { return x.need ? '참고 : v2.8 소요 작업조 ' + x.need + ' (v2.8 간격 사슬 ' + r1(x.zone28 != null ? x.zone28 : x.zone) + 'WD 기준, 계산에는 안 씀)' : ''; }

  /* 표 한 줄 : n = Activity, s · d = 막대 시작 · 기간 (WD), ed = 일수 편집 키 (없으면 ro = 읽기 전용 이유), k = 막대 색 (w = 외벽 · gh = 점선),
     ov = 끌기 { key, pe : 앞 공종이 모두 끝나는 때, mx : 최대 겹침 (= 바로 앞 공종 일수), o : 지금 겹침 } 또는 역타 { key: 'lag', lag : 시차 배수, z : Zone 일수, L : 지금 시차, ed : 시차 칸 },
     lock = 끌 수 없는 이유 (title), ch · ci = 같은 사슬 · 순서 (끄는 동안 사슬을 엔진 규칙대로 다시 쌓음 : 착수 = 앞 공종이 모두 끝나는 때 − 겹침),
     at = 사슬 밖 덧붙임 (PIT 추가 : 바로 앞 공종 끝에 붙고 뒤 공종 착수에는 안 셈) */
  function cyRow(n, s, d, o) {
    o = o || {};
    return { n: n, s: s, d: d, ed: o.ed || '', ro: o.ro || '', k: o.k || '', ov: o.ov || null, lock: o.lock || '', tip: o.tip || '', segs: o.segs || null, ghost: o.ghost || null,
      ch: o.ch || '', ci: o.ci != null ? o.ci : -1, at: !!o.at, sub: !!o.sub };
  }
  var LOCK0 = '첫 공종 — 뒤 공종 바를 끌어 겹침 지정';
  function cyFound(R) {
    var f = R.found, pit = f.nPit ? f.Rpit - f.R : 0, own = f.R0 != null && Math.abs(f.R - f.R0) > 1e-9, ov = f.ov || { r: 0, t: 0 };
    if (S.adv && S.adv.cyOrder) delete S.adv.cyOrder;   /* 옛 표시 순서 (없앤 기능) */
    cyBegin('found', null, ['fOv']);
    var sR = f.prep - ov.r, eR = sR + f.R, fT = Math.max(f.prep, eR), rows = [];
    rows.push(cyRow('준비', 0, f.prep, { ed: edLin('f.prep', '준비', 'found.prep', f.prep), tip: '영구배수 · 버림 · 먹', ch: 'f', ci: 0, lock: LOCK0 }));
    rows.push(cyRow('철근', sR, f.R, { ed: edAdv('f.reb', '철근', 'fRwd', f.R, 1, function (x) { return +x > 0 ? +x : f.R0; }, { min: 0.5, max: 200 }), ch: 'f', ci: 1,
      tip: own ? 'Zone 당 철근 ' + r1(f.R) + 'WD (입력 · 자동 ' + f.R0 + ')' : r1(f.reb) + 't ÷ ' + r1(f.tpd) + 't/일 (' + f.crew + '명)',
      ov: { key: 'f.r', pe: f.prep, mx: f.prep, o: ov.r } }));
    if (pit > 0.01) rows.push(cyRow('PIT 추가', eR, pit, { k: 'gh', sub: true, at: true, ed: edLin('f.pit', 'PIT 추가', 'found.pitAdd', pit), ch: 'f', ci: 2, tip: 'PIT Zone 만 — 바닥 · 벽체 2회 타설', lock: 'PIT Zone 만 철근에 이어서' }));
    rows.push(cyRow('형틀 · 타설', fT - ov.t, f.tail, { ed: edLin('f.tail', '형틀 · 타설', 'found.tail', f.tail), tip: '형틀 · 검측 · 타설', ch: 'f', ci: 3, ov: { key: 'f.t', pe: fT, mx: f.R, o: ov.t } }));
    return { id: 'found', tot: Math.max(f.cyc, eR + pit), v: r1(f.cyc), u: 'WD / Zone', x: f.nPit ? 'PIT ' + r1(f.cycPit) : '', lanes: [{ rows: rows }] };
  }
  function cyBase(R) {
    var bs = R.base, b = R.basic, g = R.geo, hF = b.hF || 1;
    if (!bs || b.nB === 0) return null;
    if (bs.td) {
      /* 역타 Zone 순환 : Zone k 시작 = 시차 × (k − 1) — Zone 2 · 3 바를 끌면 시차가 바뀜 (겹침 = Zone 일수 − 시차) */
      /* 팀 (adv.tdTeams) : 팀당 Zone m = ⌈Zone ÷ 팀⌉ — 팀끼리 병행, 팀 안 Zone k 시작 = 시차 × (k − 1) (엔진 13 + 4.5 × (m − 1)) */
      cyBegin('base');
      var TD = LIB.td, n1 = bs.n1 > 0 ? bs.n1 : Math.max(2, Math.min(4, Math.round(g.Adeep / TD.f1ZoneA))), tT = Math.max(1, bs.T || 1), mz = Math.ceil(n1 / tT - 1e-9), z = TD.f1Zone / hF, lag = TD.f1Lag / hF, rows = [], tz = zteams(n1, tT);
      var ez = edLin('b.z', '역타 슬래브 Zone', 'td.f1Zone', z, { k: 1 / hF }), el = edLin('b.lag', 'Zone 시차', 'td.f1Lag', lag, { k: 1 / hF, min: 0, zero: true });
      for (var i = 0; i < n1; i++) {
        var tq = tz(i), oi = mz > 1 ? tq.ord - 1 : 0;
        rows.push(cyRow('Zone ' + (i + 1) + (tT > 1 ? ' · ' + (tq.team + 1) + '팀' : ''), oi * lag, z, { ed: ez, ch: 'td', ci: i, lock: tT > 1 && !oi ? (tq.team + 1) + '팀 첫 Zone (팀끼리 병행)' : LOCK0, tip: oi ? '시작 = 시차 ' + r1(lag) + ' × ' + oi : '',
          ov: oi && el ? { key: 'lag', lag: oi, z: z, L: lag, o: Math.max(0, z - lag), ed: el } : null }));
      }
      return { id: 'base', tot: z + (mz - 1) * lag, v: r1(z + (mz - 1) * lag), u: 'WD / 슬래브', x: '아래층 ×' + TD.slabF + (tT > 1 ? ' · ' + tT + '팀' : ''), xe: [{ lab: '시차', ed: el }], lanes: [{ rows: rows }] };
    }
    var lr = LIB.base.liftRef;
    if (bs.partial) {
      /* 부분 지하 경로 : 외벽 → 방수 · 되메우기 → 바닥 (겹침 = adv.pOv) */
      cyBegin('base', null, ['pOv']);
      var p = bs.path, po = p.ov || { bf: 0, s: 0 }, kW = (g.sumB || 0) / (hF * lr), kB = b.rRC / (b.rExt * hF), open = b.sup === 'OPEN', rp = [];
      var Zs1 = Math.max(1, Math.round(g.AdnEff / LIB.base.zoneA)), per1 = Math.ceil(Zs1 / Math.ceil(Zs1 / LIB.base.zpt - 1e-9) - 1e-9);
      rp.push(cyRow('외벽', 0, p.walls, { k: 'w', ed: edAdv('b.pw', '외벽', 'liftWD', p.walls, kW, liftEff, { min: kW, max: 60 * kW }), ch: 'p', ci: 0, lock: LOCK0, tip: '지하 ' + b.nB + '개층 외벽 · ' + r2(liftEff(S.adv && S.adv.liftWD)) + 'WD / ' + lr + 'm' }));
      var pe = p.walls, pd = p.walls;
      if (open) {
        var sb = p.walls - po.bf;
        rp.push(cyRow('방수 · 되메우기', sb, p.backfill, { ed: edAdv('b.pbf', '방수 · 되메우기', 'backfill', p.backfill, kB, bfEff, { min: 0 }), ch: 'p', ci: 1, tip: '토목 ' + r1(p.backfillExt) + 'WD → 골조 가동률 환산',
          ov: { key: 'p.bf', pe: p.walls, mx: p.walls, o: po.bf } }));
        if (p.backfill > 0) { pe = Math.max(p.walls, sb + p.backfill); pd = p.backfill; }
      }
      rp.push(cyRow(p.nSlab > 1 ? '바닥 ' + p.nSlab + '개층' : '바닥', pe - po.s, p.slab, { ed: edSlab('b.ps', '바닥', p.slab, per1, hF, p.nSlab), ch: 'p', ci: 2, tip: '층당 ' + r1(p.slabPer) + 'WD',
        ov: { key: 'p.s', pe: pe, mx: pd, o: po.s } }));
      var tp = p.span != null ? p.span : p.walls + (open ? p.backfill : 0) + p.slab;
      return { id: 'base', tot: tp, v: r1(tp), u: 'WD', x: '', lanes: [{ rows: rp }] };
    }
    /* 순타 층별 : 외벽 (끊어치기) → 바닥, 층 안 겹침 = adv.bOv[층] · 층 WD = 가장 늦은 끝 */
    if (bs.model === 'v28') return cyBase28(R);
    cyBegin('base', null, ['bOv']);
    var t2 = 0, rb = [], lE = liftEff(S.adv && S.adv.liftWD), ci = 0;
    bs.rows.forEach(function (x) {
      var kw = x.h / (hF * lr) * (x.wK || 1), per = Math.ceil(x.Z / x.T - 1e-9), o = x.ov || 0, we = t2 + x.Vw;   /* 외벽 WD = 층고 × liftWD ÷ liftRef × 외벽팀 계수 (엔진 wK, 입력 없으면 1) */
      rb.push(cyRow(x.lv + ' 외벽', t2, x.Vw, { k: 'w', ed: edAdv('b.w.' + x.lv, x.lv + ' 외벽', 'liftWD', x.Vw, kw, liftEff, { min: kw, max: 60 * kw }), ch: 'b', ci: ci++, lock: '층 첫 공종 (아래층 완료 후)',
        tip: r1(x.h) + 'm × ' + r2(lE) + 'WD / ' + lr + 'm' + (x.wK && Math.abs(x.wK - 1) > 1e-9 ? ' × 외벽팀 ' + r2(x.wK) : '') + ' · Lift ' + bs.liftH + 'm ' + x.lifts + '회' }));
      rb.push(cyRow(x.slab + ' 바닥', we - o, x.Sw, { ed: edSlab('b.s.' + x.lv, x.slab + ' 바닥', x.Sw, per, hF, 1), ch: 'b', ci: ci++,
        tip: x.Z + ' Zone ÷ ' + x.T + '팀 → ' + per + ' Zone × ' + r2(LIB.base.slabD / hF) + 'WD', ov: { key: 'b.' + x.lv, pe: we, mx: x.Vw, o: o } }));
      t2 += x.wd;
    });
    return { id: 'base', tot: t2, v: m1(t2 / Math.max(1, bs.rows.length)), u: 'WD / 층', x: '', key: [['w', '외벽'], ['', '바닥']], lanes: [{ rows: rb }] };
  }
  /* 순타 층별 · v2.8 사슬 (adv.bChain AUTO) — 표 두 개
     ① 층별 : 외벽 (끊어치기 · liftWD 역산 × 외벽팀 계수 wK) → 바닥 (사슬 × 2회 타설 · 층고 = 계산값), 층 안 겹침 = adv.bOv, 1F 바닥 = + Zone 간격 꼬리 (점선).
        지하 4개층 이상이면 대표 층 (B1 외벽 + 1F 바닥 = 조닝 판 · 바닥팀 기준 층) 만 두 줄, 나머지 층은 한 줄 (외벽 · 바닥 막대)
     ② 1F 바닥 Zone 1개 공종 사슬 : 일수 · 끌기 겹침 (adv.bcOv) — 지하 모든 층 바닥에 같이 쓰인다 */
  function cyBase28(R) {
    var bs = R.base, b = R.basic, hF = b.hF || 1, lr = LIB.base.liftRef, rows = bs.rows, n = rows.length, rep = rows[n - 1], few = n <= 3;
    cyBegin('base', null, ['bOv']);
    var t2 = 0, rb = [], lE = liftEff(S.adv && S.adv.liftWD), ci = 0;
    rows.forEach(function (x, ix) {
      var kw = x.h / (hF * lr) * (x.wK || 1), o = x.ov || 0, we = t2 + x.Vw, ss = we - o, last = ix === n - 1;
      var wTip = r1(x.h) + 'm × ' + r2(lE) + 'WD / ' + lr + 'm' + (x.wK && Math.abs(x.wK - 1) > 1e-9 ? ' × 외벽팀 ' + r2(x.wK) : '') + ' · Lift ' + bs.liftH + 'm ' + x.lifts + '회';
      var sTip = x.N + ' Zone · ' + x.T + '팀 (팀당 ' + x.nt + ') · 사슬 ' + r1(x.zone) + 'WD' + (x.lk > 1.001 ? ' × 2회 타설 ' + r2(x.lk) : '') + (x.hf > 1.001 ? ' × 층고 ' + r2(x.hf) : '') +
        (x.lb && x.lb.on ? ' → 하루 1 Zone 하한 ' + r1(x.lb.v) : '') + ' = ' + r1(x.Sw) + 'WD' + (last && x.tail > 0.005 ? ' + Zone 간격 ' + r1(x.tail) + 'WD (1F 바닥에서 1회)' : '');
      if (few || last) {
        rb.push(cyRow(x.lv + ' 외벽', t2, x.Vw, { k: 'w', ed: edAdv('b.w.' + x.lv, x.lv + ' 외벽', 'liftWD', x.Vw, kw, liftEff, { min: kw, max: 60 * kw }), ch: 'b', ci: ci++, lock: '층 첫 공종 (아래층 완료 후)', tip: wTip }));
        rb.push(cyRow(x.slab + ' 바닥', ss, x.Sw, { ro: '공종 사슬 계산값 — 아래 바닥 사슬 표에서 일수 · 겹침', ch: 'b', ci: ci++, tip: sTip, ov: { key: 'b.' + x.lv, pe: we, mx: x.Vw, o: o },
          ghost: last && x.tail > 0.005 ? { s: Math.max(we, ss + x.Sw), d: x.tail, lab: '+' + r1(x.tail), t: 'Zone 연속 꼬리 : 팀당 ' + x.nt + ' Zone − 1 = ' + r1(x.tail) + 'WD (1F 바닥에서 1회)' } : null }));
      } else {
        rb.push(cyRow(x.lv + ' 외벽 · ' + x.slab + ' 바닥', t2, x.wd, { ro: '층 ' + r1(x.wd) + 'WD = 외벽 ' + r1(x.Vw) + ' → 바닥 ' + r1(x.Sw) + (o > 0 ? ' (겹침 ' + r1(o) + ')' : ''),
          segs: [{ s: t2, d: x.Vw, k: 'w', t: x.lv + ' 외벽 ' + r1(x.Vw) + 'WD · ' + wTip }, { s: ss, d: x.Sw, k: '', t: x.slab + ' 바닥 ' + r1(x.Sw) + 'WD · ' + sTip }], tip: '외벽 ' + wTip + ' / 바닥 ' + sTip }));
      }
      t2 += x.wd;
    });
    var out = [{ id: 'base', tot: t2, v: m1(t2 / Math.max(1, n)), u: 'WD / 층', x: '', key: [['w', '외벽'], ['', '바닥']], lanes: [{ rows: rb }] }];
    if (rep && rep.items && rep.items.length) {
      cyBegin('baseZ', null, ['bcOv']);
      var oth = rows.filter(function (x) { return x !== rep && (x.N !== rep.N || Math.abs(x.zone - rep.zone) > 0.01); });
      out.push({ id: 'baseZ', lab: '바닥 사슬', tot: Math.max(rep.zone, rep.zoneF || 0, rep.lb ? rep.lb.v : 0), v: m1(rep.zone), u: 'WD / Zone', x: '', foot: c4Foot(rep, '1F 바닥'),
        lanes: [{ name: rep.slab + ' 바닥 · Zone 1개', info: rep.N + ' Zone · ' + rep.T + '팀', hd: true, gov: true,
          tip: [needTip(rep), oth.length ? '다른 층 : ' + oth.map(function (x) { return x.slab + ' ' + x.N + ' Zone · 사슬 ' + r1(x.zone) + 'WD'; }).join(' · ') : ''].filter(Boolean).join(' · '),
          rows: c4Rows(R, rep, 'bc', 'bc', zbAdv(R).bcOv) }] });
    }
    return out;
  }
  function cyTyp(R) {
    var fr = R.frame, ty = fr.typ, tact = GK.tactOf(R);
    cyBegin('typ', ['uTeams', 'cTeams'], ['dcOv']);
    if (ty.dc) {
      /* DC : 외주부 · 코어 공종 사슬 (겹침 = adv.dcOv.P · C, 키 = 수직재 v0 ~ v4 · 이후 a0 …) → 착수 = 앞 공종이 모두 끝나는 때 − 겹침, Zone 1개 작업 = 가장 늦은 끝 */
      var d = ty.dc, nv = (d.lifts || 1) * 5;
      var lane = function (st, L) {
        var rows = [], e = 0;
        st.items.forEach(function (it, i) {
          var nm = it[0], s = st.ss ? st.ss[i] : e, ed = edDC(L + i, nm.replace(/ \d\/\d차$/, ''), it[1]), key = i < nv ? 'v' + (i % 5) : 'a' + (i - nv);
          rows.push(cyRow(nm, s, it[1], { ed: ed, ro: ed ? '' : DCRO, ch: 'dc' + L, ci: i, lock: LOCK0,
            ov: i ? { key: 'dc' + L + '.' + key, pe: e, mx: st.items[i - 1][1], o: st.ov ? st.ov[i] : 0 } : null }));
          e = Math.max(e, s + it[1]);
        });
        return { name: st.name, info: st.N + ' Zone · ' + st.T + '팀', gov: d.gov === st.name, rows: rows };
      };
      return { id: 'typ', tot: Math.max(d.P.zone, d.C.zone), v: m1(tact), u: 'WD / 층', x: '', lanes: [lane(d.P, 'P'), lane(d.C, 'C')] };
    }
    var sl = ty.slab;
    if (sl.model === 'v28' && sl.items && sl.items.length) {
      /* 일반 RC · SRC (v2.8 c4 동시 RC) : Zone 1개 공종 사슬 (끌기 겹침 = adv.rcOv · 키 a1 …) → 층간 = 사슬 × 2회 타설 · 층고, 팀은 Zone 연속 꼬리 · 하루 1 Zone 하한만 */
      cyBegin('typ', ['uTeams', 'cTeams'], ['rcOv']);
      var rw = c4Rows(R, sl, 'rc', 'rc', zbAdv(R).rcOv), n28 = Math.max(sl.zone, sl.zoneF || 0, sl.lb ? sl.lb.v : 0);
      return { id: 'typ', tot: n28, v: m1(tact), u: 'WD / 층', x: '', foot: c4Foot(sl, '맨 위층'),
        lanes: [{ name: '외주부 · 코어 일체 · Zone 1개', info: sl.N + ' Zone · ' + sl.T + '팀', hd: true, gov: true, tip: needTip(sl), rows: rw }] };
    }
    /* 일반 지상 (옛 식) · 철골 · 강합성 : 팀당 Zone 연속 (Zone 단위라 겹침 없음 — 일수만). v2.8 사슬 하한 (바닥 c3 · 코어 c1) 이 걸리면 점선 줄 */
    var lockZ = 'Zone 단위 연속 작업 — 겹침 대신 일수만 고칩니다';
    var w0 = sl.lb && sl.lb.on && sl.wd0 != null ? sl.wd0 : sl.wd, per = sl.per, zs = w0 > 0 ? Math.min(w0, per * fr.dS * (sl.lk || 1) * (sl.hf || 1)) / per : 0, lanes = [], segs = [];
    for (var i = 0; i < per; i++) segs.push({ s: i * zs, d: zs, lab: i + 1 });
    var tot = sl.wd, rs = [cyRow('팀당 ' + per + ' Zone', 0, w0, { segs: segs, ed: edFrame('u.slab', R, sl, w0), lock: lockZ, ghost: w0 > per * zs + 0.05 ? { s: per * zs, d: w0 - per * zs, lab: '최소' } : null, tip: 'Zone ' + r2(zs) + 'WD × ' + per })];
    if (sl.lb && sl.lb.on) rs.push(lbRow(sl.lb, R));
    lanes.push({ name: ty.core ? '외주부' : '외주부 · 코어 일체', info: sl.Z + ' Zone · ' + sl.T + '팀' + (sl.lifts > 1 ? ' · 수직재 ' + sl.lifts + '회' : ''), gov: !ty.core || sl.wd >= ty.core.wd, rows: rs });
    if (ty.core) {
      var c = ty.core, c0 = c.lb && c.lb.on && c.wd0 != null ? c.wd0 : c.wd, nc = c.per * c.lifts, zc = c0 / Math.max(1, nc), sc = [];
      for (var j = 0; j < nc; j++) sc.push({ s: j * zc, d: zc, lab: j + 1 });
      var rc = [cyRow('팀당 ' + c.per + ' Zone', 0, c0, { segs: sc, ed: edLin('u.core', '코어 사이클', 'frame.core.' + fr.sysC, c0, { pin: ['cTeams'] }), lock: lockZ, tip: 'Zone ' + r2(zc) + 'WD × ' + nc })];
      if (c.lb && c.lb.on) rc.push(lbRow(c.lb, R));
      lanes.push({ name: '코어', info: c.Z + ' Zone · ' + c.T + '팀' + (c.lifts > 1 ? ' · ' + c.lifts + ' Lift' : ''), gov: c.wd > sl.wd, rows: rc });
      tot = Math.max(tot, c.wd);
    }
    return { id: 'typ', tot: tot, v: m1(tact), u: 'WD / 층', x: '', lanes: lanes };
  }
  /* 철골 · 강합성 하한 (v2.8 c3 바닥 · c1 코어 사슬) : 점선 줄 — 근거 = 사슬 공종 (title) */
  function lbRow(lb, R) {
    var its = (lb.items || []).map(function (it) { return it.n + ' ' + r1(it.wd); }).join(' · ');
    var why = lb.k === 'c1' ? 'v2.8 c1 코어 사슬 (' + lb.Z + ' Zone) ' + r1(lb.zone) + 'WD × 수직재 ' + (lb.lifts || 1) + '회' : 'v2.8 c3 철골 바닥 사슬 (' + lb.Z + ' Zone · 해석) ' + r1(lb.zone) + 'WD';
    return cyRow('하한 (v2.8 사슬)', 0, lb.v, { k: 'gh', sub: true, ro: why, tip: why + ' = ' + r1(lb.v) + 'WD · ' + its, lock: '하한 — 기준 층고 ' + r1(R.frame.v28 ? R.frame.v28.hQ : 4.5) + 'm 물량 (층고를 올려도 줄지 않음)' });
  }
  /* 일수 칸 : 숫자 입력 + ▲▼ (0.5 WD). 바뀐 값 = 코발트. ri = 표 안 자리 (다시 그린 뒤 포커스) */
  function cyMin(e) { return e.zero ? 0 : Math.max(0.5, e.min || 0); }
  function cyStepper(key, lab, ri, small) {
    var e = CYED[key]; if (!e) return '';
    var mn = cyMin(e), at = ' data-ck="' + esc(key) + '" data-ri="' + esc(ri) + '"', sd = e.step1 ? '1' : '0.5';
    return '<span class="cy-sp' + (e.on ? ' on' : '') + (small ? ' sm' : '') + '" title="' + esc(e.on ? '바뀐 값 · 기본 ' + m1(e.def) + ' WD' : e.step1 ? '직접 입력 · ▲▼ 1 WD (물량 ÷ 생산성 올림 → 생산성으로 역산)' : '직접 입력 · ▲▼ 0.5 WD') + '">' +
      '<input class="cy-in" type="number" inputmode="decimal" step="' + sd + '" min="' + mn + '"' + (e.max ? ' max="' + r2(e.max) + '"' : '') + ' value="' + (+e.cur).toFixed(1) + '" data-actc="cyIn"' + at + ' aria-label="' + esc(lab + ' 일수 (WD)') + '">' +
      '<span class="cy-ar"><button type="button" class="cy-st up" data-act="cyStep" data-d="1"' + at + ' aria-label="' + esc(lab) + ' +' + sd + ' WD"></button>' +
      '<button type="button" class="cy-st dn" data-act="cyStep" data-d="-1"' + at + ' aria-label="' + esc(lab) + ' −' + sd + ' WD"' + (cyShown(e) <= mn + 1e-9 ? ' disabled' : '') + '></button></span></span>';
  }
  function cyF(v, N) { return (Math.max(0, v) / N).toFixed(4); }
  /* 바 : 끌 수 있으면 dr (role=slider · ←→ 0.5 WD) — 겹친 구간은 빗금 + 겹침 숫자 */
  function cyBarHTML(r, N) {
    var at = r.ch ? ' data-ch="' + r.ch + '" data-ci="' + r.ci + '"' : '', h = '';
    if (r.segs) {
      r.segs.forEach(function (q) { var k = q.k != null ? q.k : r.k; h += '<i class="cy-b' + (k ? ' ' + k : '') + '" style="--s:' + cyF(q.s, N) + ';--w:' + cyF(q.d, N) + '" title="' + esc(q.t || r.lock) + '">' + (q.lab != null ? '<span>' + q.lab + '</span>' : '') + '</i>'; });
    } else {
      var v = r.ov, base = v && v.lag ? v.z : r.d, o = v ? Math.max(0, v.o || 0) : 0;
      var dat = ' data-s="' + rd(r.s) + '" data-d="' + rd(r.d) + '"' + (r.at ? ' data-at="1"' : '') + (v && v.lag ? ' data-lag="' + v.lag + '"' : '');
      if (v) {
        var mx = v.lag ? v.z : v.mx, ttl = '좌우로 끌어 겹침 지정 (0.5 WD) · 지금 ' + m1(o) + ' WD (0 ~ ' + m1(mx) + ')' + (v.lag ? ' · 시차 ' + m1(v.L) : '') + (v.note ? ' · ' + v.note : '');
        dat += ' data-ov="' + esc(v.key) + '" data-pe="' + rd(v.lag ? 0 : v.pe) + '" data-mx="' + rd(mx) + '" data-o="' + rd(o) + '"' + (v.lag ? ' data-z="' + rd(v.z) + '" data-lg="' + rd(v.L) + '" data-ed="' + esc(v.ed) + '"' : '') +
          ' tabindex="0" role="slider" aria-label="' + esc(r.n + ' 겹침 (WD)') + '" aria-valuemin="0" aria-valuemax="' + r1(mx) + '" aria-valuenow="' + r1(o) + '" title="' + esc(ttl) + '"';
      } else if (r.lock) dat += ' title="' + esc(r.lock) + '"';
      h += '<i class="cy-b' + (r.k ? ' ' + r.k : '') + (v ? ' dr' : '') + '" style="--s:' + cyF(r.s, N) + ';--w:' + cyF(r.d, N) + '"' + at + dat + '>' +
        (v ? '<b class="cy-o" style="--o:' + (base > 0 ? Math.min(1, o / base) : 0).toFixed(4) + '"' + (o > 0.001 ? '' : ' hidden') + '><span>' + r1(o) + '</span></b>' : '') + '</i>';
    }
    if (r.ghost && r.ghost.d > 0.01) h += '<i class="cy-b gh" style="--s:' + cyF(r.ghost.s, N) + ';--w:' + cyF(r.ghost.d, N) + '" title="' + esc(r.ghost.t || '최소 사이클') + '"><span>' + esc(r.ghost.lab || '') + '</span></i>';
    return h;
  }
  function cyRowHTML(r, N, ri) {
    var days = r.ed && CYED[r.ed] ? cyStepper(r.ed, r.n, ri) : '<span class="cy-ro"' + (r.ro ? ' title="' + esc(r.ro) + '"' : '') + '>' + m1(r.d) + '</span>';
    return '<div class="cy-r' + (r.sub ? ' sub' : '') + '"><span class="cy-n"' + (r.tip ? ' title="' + esc(r.n + ' · ' + r.tip) + '"' : ' title="' + esc(r.n) + '"') + '>' + esc(r.n) + '</span>' +
      '<span class="cy-d">' + days + '</span><span class="cy-t">' + cyBarHTML(r, N) + '</span></div>';
  }
  /* WD 눈금 머리 : 칸 = 1 WD, 숫자는 글자가 겹치지 않게 1 · 2 · 5 · 10 … 단위 (바차트 칸 폭 = 조닝 배치와 같은 식으로 어림) */
  function cyPx(N) {
    var W = Math.max(280, Math.floor(($('#zone') || {}).clientWidth || 520)), nar = W < 470, col = W >= 860 ? W / 3 - 36 : W;
    return Math.max(60, nar ? col - 20 - 186 : col - 24 - 190) / Math.max(1, N);
  }
  function cyStepOf(N) {
    var px = cyPx(N), need = N >= 100 ? 24 : N >= 10 ? 17 : 11, ss = [1, 2, 5, 10, 20, 50, 100];
    for (var i = 0; i < ss.length; i++) if (ss[i] * px >= need) return ss[i];
    return 200;
  }
  function cyScale(N, st) {
    var h = '';
    for (var d = st; d <= N; d += st) h += '<s style="--x:' + ((d - 0.5) / N).toFixed(4) + '">' + d + '</s>';
    return '<div class="cy-r cy-sc" aria-hidden="true"><span class="cy-n">Activity</span><span class="cy-d">WD</span><span class="cy-t">' + h + '</span></div>';
  }
  function cyChanged(id) {
    var ch = CYCH[id]; if (!ch) return false;
    return ch.eds.some(function (k) { return CYED[k] && CYED[k].on; }) || (ch.pins || []).some(function (k) { return S.cyPin && S.cyPin[k] != null; }) ||
      (ch.ovk || []).some(function (k) { var o = S.adv && S.adv[k]; return o && typeof o === 'object' && Object.keys(o).length > 0; });
  }
  function cyHTML(c) {
    if (!c) return '';
    var N = Math.max(1, Math.ceil(c.tot - 1e-6)), st = cyStepOf(N), gs = cyPx(N) >= 4 ? 1 : st >= 5 ? 5 : st, multi = c.lanes.length > 1, chg = cyChanged(c.id), n = 0;
    var h = '<div class="cy-hd"><span>' + esc(c.lab || '사이클') + '</span><b>' + c.v + '</b><small>' + esc(c.u) + '</small>' + (c.x ? '<em>' + esc(c.x) + '</em>' : '') +
      (c.xe || []).map(function (q) { return q.ed && CYED[q.ed] ? '<span class="cy-x">' + esc(q.lab) + cyStepper(q.ed, q.lab, c.id + ':x', true) + '</span>' : ''; }).join('') +
      ((c.key || chg) ? '<span class="cy-hr">' + (c.key ? '<span class="cy-key">' + c.key.map(function (k) { return '<i class="' + k[0] + '"></i>' + esc(k[1]); }).join('') + '</span>' : '') +
        (chg ? '<button type="button" class="cy-rsa" data-act="cyRsAll" data-cy="' + c.id + '" title="이 사이클에서 고친 일수 · 겹침을 기본으로">되돌리기</button>' : '') + '</span>' : '') + '</div>';
    h += '<div class="cy-tb">' + cyScale(N, st);
    c.lanes.forEach(function (ln) {
      if (multi || ln.hd) h += '<div class="cy-ln' + (ln.gov ? ' gov' : '') + '"' + (ln.tip ? ' title="' + esc(ln.tip) + '"' : '') + '><b>' + esc(ln.name) + '</b><span>' + esc(ln.info) + '</span></div>';
      h += '<div class="cy-g' + (multi && !ln.gov ? ' sub' : '') + '">' + ln.rows.map(function (r) { return cyRowHTML(r, N, c.id + ':' + (n++)); }).join('') + '</div>';
    });
    /* 아래 한 줄 (v2.8 사슬 : Zone 연속 꼬리) — 표 안 (cy-tb) 마지막에 */
    if (c.foot) h += '<p class="cy-ft">' + c.foot + '</p>';
    return '<div class="cy" data-cy="' + c.id + '" data-n="' + N + '" style="--n:' + N + ';--gs:' + gs + ';--ls:' + st + '">' + h + '</div></div>';
  }
  /* 편집 동작 */
  function cyApply(fn, pins) { pinTeams(pins); fn(); if (current) markPreset(''); GK.fill(document, S); recompute(); }
  function cyFocusSel(sel) {
    var el = sel && document.querySelector('#zone ' + sel);
    if (el && el.disabled) el = el.parentNode && el.parentNode.parentNode ? el.parentNode.parentNode.querySelector('.cy-in') : null;
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (er) { el.focus(); }
    if (el.select) el.select();
  }
  /* 지금 포커스 자리 (다시 그린 뒤 같은 칸으로) */
  function cyFocusNow() {
    var a = document.activeElement; if (!a || !a.closest || !a.closest('#zone .cy')) return null;
    var ri = a.getAttribute('data-ri'), ov = a.getAttribute('data-ov');
    return ri ? (a.classList.contains('cy-in') ? '.cy-in' : '.cy-st') + '[data-ri="' + ri + '"]' + (a.hasAttribute('data-d') ? '[data-d="' + a.getAttribute('data-d') + '"]' : '') : ov ? '.cy-b[data-ov="' + ov + '"]' : null;
  }
  /* 일수 적용 : 범위 안으로 → 기본값 (표시 자리까지 같음) 이면 덮어쓰기 대신 기본값으로 */
  function cyCommit(key, v, fsel) {
    var e = CYED[key]; if (fsel === undefined) fsel = cyFocusNow();
    if (!e) return;
    v = Math.min(e.max || Infinity, Math.max(cyMin(e), v));
    if (isFinite(v) && Math.abs(v - e.cur) > 1e-9) {
      var same = Math.abs(v - e.def) < 1e-6 || (v === +v.toFixed(1) && v === +e.def.toFixed(1));
      if (same && e.on) cyApply(function () { cyReset1(e); });
      else if (!same || Math.abs(e.cur - e.def) > 1e-9) cyApply(function () { e.set(v); }, e.pin);
      else if (lastR) renderZone(lastR);
    } else if (lastR) renderZone(lastR);
    cyFocusSel(fsel);
  }
  /* ▲▼ 는 화면에 보이는 값 (0.1 자리) 기준 — 역산 · 저장 반올림 (예 29.0002) 때문에 ▼ 가 같은 값에 머물지 않게 */
  function cyShown(e) { return Math.round(+e.cur * 10) / 10; }
  ACT.cyStep = function (el) {
    var k = el.getAttribute('data-ck'), e = CYED[k]; if (!e) return;
    var c = cyShown(e), v = +el.getAttribute('data-d') > 0 ? Math.floor(c * 2 + 1e-6) / 2 + 0.5 : Math.ceil(c * 2 - 1e-6) / 2 - 0.5;
    cyCommit(k, v, '.cy-st[data-ri="' + el.getAttribute('data-ri') + '"][data-d="' + el.getAttribute('data-d') + '"]');
  };
  /* 숫자 칸 : 바뀜 (칸 밖 · Enter) = 적용 — 다시 그리기는 이벤트가 끝난 뒤, 그 사이 사례를 바꿨으면 (S 교체) 버림 */
  ACTC.cyIn = function (el) {
    if (el.getAttribute('data-done')) return;
    var k = el.getAttribute('data-ck'), raw = parseFloat(el.value), S0 = S;
    setTimeout(function () { if (S !== S0) return; if (isFinite(raw)) cyCommit(k, raw); else if (lastR) renderZone(lastR); }, 0);
  };
  document.addEventListener('keydown', function (e) {
    var t = e.target; if (!t || !t.classList || !t.classList.contains('cy-in')) return;
    if (e.key === 'Enter') {
      e.preventDefault(); var raw = parseFloat(t.value);
      if (!isFinite(raw)) { t.value = t.defaultValue; return; }
      t.setAttribute('data-done', '1'); cyCommit(t.getAttribute('data-ck'), raw, '.cy-in[data-ri="' + t.getAttribute('data-ri') + '"]');
    } else if (e.key === 'Escape' && t.value !== t.defaultValue) { e.preventDefault(); t.value = t.defaultValue; }
  });
  ACT.cyRsAll = function (el) {
    var id = el.getAttribute('data-cy'), c = CYCH[id], any = false; if (!c) return;
    c.eds.forEach(function (k) { var e = CYED[k]; if (e && e.on) { e.reset(); any = true; } });
    if ((c.pins || []).some(function (k) { return S.cyPin && S.cyPin[k] != null; })) { unpinTeams(c.pins); any = true; }
    (c.ovk || []).forEach(function (k) { if (S.adv && S.adv[k] != null) { delete S.adv[k]; any = true; } });
    if (any) cyApply(function () {}); else if (lastR) renderZone(lastR);
  };
  /* 겹침 저장 : 키 → S.adv 경로 (0 이면 지우고 빈 묶음도 지움) */
  var OVP = { f: ['fOv'], b: ['bOv'], p: ['pOv'], dcP: ['dcOv', 'P'], dcC: ['dcOv', 'C'], rc: ['rcOv'], bc: ['bcOv'] };
  /* 기본 겹침 : 대부분 0, v2.8 사슬 (rc · bc, 키 a1 …) 은 라이브러리 v28.ov* (기본 1 WD 인 곳이 있어 0 도 따로 저장) */
  function ovDef(pre, sub) { return (pre === 'rc' || pre === 'bc') && /^a\d$/.test(sub) ? +(LIB.v28 && LIB.v28['ov' + sub.slice(1)]) || 0 : 0; }
  function ovSet(key, v) {
    var i = key.indexOf('.'), pre = key.slice(0, i), sub = key.slice(i + 1), path = (OVP[pre] || []).concat([sub]); if (path.length < 2) return;
    S.adv = S.adv || {};
    var o = S.adv, up = [];
    for (var j = 0; j < path.length - 1; j++) { var nx = Object.assign({}, o[path[j]] && typeof o[path[j]] === 'object' ? o[path[j]] : {}); o[path[j]] = nx; up.push([o, path[j]]); o = nx; }
    if (Math.abs(v - ovDef(pre, sub)) > 1e-9) o[path[path.length - 1]] = rd(Math.max(0, v)); else delete o[path[path.length - 1]];
    for (j = up.length - 1; j >= 0; j--) if (!Object.keys(up[j][0][up[j][1]]).length) delete up[j][0][up[j][1]];
  }
  /* 끌기 · ←→ 결과 적용 : 역타 = 시차 칸 값, 나머지 = 겹침 */
  function cyOvCommit(b, val, kb) {
    var key = b.getAttribute('data-ov'), fsel = kb ? '.cy-b[data-ov="' + key + '"]' : null;
    if (key === 'lag') { cyCommit(b.getAttribute('data-ed'), val, fsel); return; }
    if (Math.abs(val - (+b.getAttribute('data-o') || 0)) < 1e-9) { if (lastR) renderZone(lastR); cyFocusSel(fsel); return; }
    cyApply(function () { ovSet(key, val); }); cyFocusSel(fsel);
  }
  /* 바 끌기 (마우스 · 터치) : 끄는 동안 사슬을 엔진 규칙대로 다시 쌓고 (착수 = 앞 공종이 모두 끝나는 때 − 겹침) 겹친 구간 빗금 · 숫자, 놓으면 다시 계산 */
  function cyPlace(el, s, N) { el.style.setProperty('--s', cyF(s, N)); }
  function cyOvShow(b, o, base) {
    var x = b.querySelector('.cy-o'); if (!x) return;
    x.hidden = !(o > 0.001); x.style.setProperty('--o', (base > 0 ? Math.min(1, o / base) : 0).toFixed(4)); x.firstChild.textContent = r1(o);
  }
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('#zone .cy-b.dr'); if (!b || e.button > 0 || !lastR) return;
    var cy = b.closest('.cy'), W = b.parentNode.getBoundingClientRect().width, N = +cy.getAttribute('data-n'); if (!(W > 0) || !(N > 0)) return;
    e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (er) { /* 무시 */ }
    var ch = b.getAttribute('data-ch'), num = function (q, k) { return +q.getAttribute(k) || 0; };
    var chain = $$('#zone .cy-b[data-ch="' + ch + '"]').map(function (q) { return { el: q, ci: num(q, 'data-ci'), s: num(q, 'data-s'), d: num(q, 'data-d'), o: num(q, 'data-o'), at: q.hasAttribute('data-at'), lag: num(q, 'data-lag') }; })
      .sort(function (p, q) { return p.ci - q.ci; });
    cyDg = { pid: e.pointerId, x: e.clientX, b: b, k: N / W, N: N, s0: num(b, 'data-s'), d: num(b, 'data-d'), pe: num(b, 'data-pe'), mx: num(b, 'data-mx'), lag: num(b, 'data-lag'), z: num(b, 'data-z'),
      lmx: Math.max(num(b, 'data-z'), num(b, 'data-lg')), val: null, moved: false, chain: chain };
  });
  document.addEventListener('pointermove', function (e) {
    var g = cyDg; if (!g || e.pointerId !== g.pid) return;
    if (!g.moved) { if (Math.abs(e.clientX - g.x) < 3) return; g.moved = true; g.b.classList.add('ing'); document.body.classList.add('dragging'); }
    var ds = (e.clientX - g.x) * g.k, o;
    if (g.lag) {
      var L = Math.max(0, Math.min(g.lmx, Math.round((g.s0 + ds) / g.lag * 2) / 2)); g.val = L; o = Math.max(0, g.z - L);
      g.chain.forEach(function (q) { if (!q.lag) return; cyPlace(q.el, q.lag * L, g.N); cyOvShow(q.el, o, g.z); });
    } else {
      o = Math.min(g.mx, Math.max(0, Math.round((g.pe - g.s0 - ds) * 2) / 2)); g.val = o;
      /* 사슬 다시 쌓기 : fr = 앞 공종이 모두 끝나는 때, pe = 바로 앞 공종 끝 (덧붙임 at 은 그 끝에 붙고 fr 에는 안 셈).
         사슬 첫 공종 자리 = 그 바의 지금 시작 (보통 0 · 지하 대표 층은 아래층들이 끝난 뒤) */
      var fr = g.chain.length ? Math.max(0, g.chain[0].s) : 0, pe = fr;
      g.chain.forEach(function (q) {
        var s = q.at ? pe : Math.max(0, fr - (q.el === g.b ? o : q.o));
        if (!q.at) { pe = s + q.d; fr = Math.max(fr, pe); }
        cyPlace(q.el, s, g.N);
      });
      cyOvShow(g.b, o, g.d);
    }
    g.b.setAttribute('aria-valuenow', r1(o));
  });
  function cyDgEnd(e) {
    var g = cyDg; if (!g || (e && e.pointerId !== g.pid)) return; cyDg = null;
    document.body.classList.remove('dragging'); g.b.classList.remove('ing');
    if (!g.moved) return;
    if (e.type === 'pointercancel' || g.val == null) { if (lastR) renderZone(lastR); return; }
    cyOvCommit(g.b, g.val, false);
  }
  document.addEventListener('pointerup', cyDgEnd); document.addEventListener('pointercancel', cyDgEnd);
  /* 키보드 : 바에 포커스 → ← 겹침 늘림 (앞당김) · → 줄임, 역타는 ← 시차 줄임 */
  document.addEventListener('keydown', function (e) {
    var b = e.target.closest && e.target.closest('#zone .cy-b.dr'); if (!b || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    var dir = e.key === 'ArrowLeft' ? 1 : -1, mx = +b.getAttribute('data-mx') || 0, o = +b.getAttribute('data-o') || 0, v;
    if (b.getAttribute('data-ov') === 'lag') { var z = +b.getAttribute('data-z') || 0, L = b.hasAttribute('data-lg') ? +b.getAttribute('data-lg') : Math.max(0, z - o); v = Math.max(0, Math.min(Math.max(z, L), (dir > 0 ? Math.ceil(L * 2 - 1e-6) / 2 - 0.5 : Math.floor(L * 2 + 1e-6) / 2 + 0.5))); }
    else v = Math.max(0, Math.min(mx, dir > 0 ? Math.floor(o * 2 + 1e-6) / 2 + 0.5 : Math.ceil(o * 2 - 1e-6) / 2 - 0.5));
    cyOvCommit(b, v, true);
  });

  /* ───────── 조닝 판 Zone 산정 근거 (숫자 위주 짧게, 자세한 식은 title) — 엔진 식 그대로 (기초 = 1회 타설 체적, 바닥 = 면적 × 가정 두께, DC = 체적 ÷ 1회 타설) */
  function zbLine(html, title) { return '<span class="zb" title="' + esc(title) + '">' + html + '</span>'; }
  function zbAdv(R) { return (R.inp && R.inp.adv) || {}; }
  function zbFound(R) {
    var f = R.found, zIn = parseFloat(zbAdv(R).zoneV), zv = Math.max(300, Math.min(2000, isFinite(zIn) ? zIn : LIB.found.zoneV)), za = f.Af / Math.max(1, f.nZ), pile = R.fType !== 'MAT';
    /* 범위 (800 ~ 900㎥) 는 기본 기준일 때만 — 입력 · 라이브러리로 바꾸면 그 값만 */
    return zbLine('1회 타설 ≈ <b>' + fmt(zv) + '</b>㎥ ' + (isFinite(zIn) ? '(입력)' : zv >= 800 && zv <= 900 ? '(800 ~ 900㎥)' : '') + ' ÷ 매트 <b>' + r1(f.t) + '</b>m<br>→ Zone ≈ <b>' + fmt(za) + '</b>㎡ · <b>' + fmt(f.vZ) + '</b>㎥ / 회',
      '기초 ' + fmt(f.Af) + '㎡ × 매트 ' + r1(f.t) + 'm' + (pile ? ' × 0.6 (파일 기초)' : '') + ' × 1.1 (할증) = ' + fmt(f.V) + '㎥ ÷ 1회 타설 ' + fmt(zv) + '㎥ = ' + r1(f.V / zv) + ' → ' + f.nZ + ' Zone (올림) · Zone 당 ' + fmt(f.vZ) + '㎥ · ' + fmt(za) + '㎡');
  }
  /* 바닥 (지하 · 지상 일반) : Zone 기준 면적 × 가정 슬래브 두께 (LIB slabT, 계산에는 안 씀) = 1회 타설 */
  function zbSlab(L, area, NZ, lab, k) {
    var za = L.zoneA, t = L.slabT || 0.3, A = area * (k || 1);
    return zbLine('Zone 기준 <b>' + fmt(za) + '</b>㎡ × 슬래브 <b>' + t + '</b>m (가정)<br>→ 1회 타설 ≈ <b>' + fmt(za * t) + '</b>㎥' + (za * t >= 250 && za * t <= 300 ? ' (250 ~ 300㎥)' : ''),
      lab + ' ' + fmt(area) + '㎡' + (k && k !== 1 ? ' × 바닥 몫 ' + r2(k) : '') + ' ÷ ' + fmt(za) + '㎡ = ' + r1(A / za) + ' → ' + NZ + ' Zone (반올림) · Zone ≈ ' + fmt(A / Math.max(1, NZ)) + '㎡ × ' + t + 'm ≈ ' + fmt(A / Math.max(1, NZ) * t) + '㎥');
  }
  function zbBase(R, NZ) {
    var bs = R.base, b = R.basic, g = R.geo;
    if (bs.td) {
      var za = LIB.td.f1ZoneA;
      return zbLine('Zone ≈ <b>' + fmt(g.Adeep / Math.max(1, NZ)) + '</b>㎡ (기준 ' + fmt(za) + '㎡ · 2 ~ 4 Zone)', '굴착 면적 ' + fmt(g.Adeep) + '㎡ ÷ ' + fmt(za) + '㎡ = ' + r1(g.Adeep / za) + ' → ' + NZ + ' Zone (반올림, 2 ~ 4) · 기준층 슬래브 Zone 순환 → 아래층 같은 Zone');
    }
    if (bs.model === 'v28' && bs.rows && bs.rows.length) { var r0 = bs.rows[bs.rows.length - 1]; return zb28(R, r0, '1F 바닥', r0.T); }
    var A = bs.partial ? g.AdnEff : Math.max(g.AdnEff, b.nB > 0 ? g.bldg : 0);
    return zbSlab(LIB.base, A, NZ, bs.partial ? '지하 바닥' : '1F 바닥');
  }
  /* v2.8 사슬 Zone : 체적 ÷ (1회 타설 × 펌프) → N Zone (올림) · Zone 4개당 1팀 — 물량은 기준 층고 (지상 4.5 · 지하 3.5m) 하나 */
  function zb28(R, x, lab, T) {
    var V8 = v28Lib(R), q = x.q || {}, pv = (V8.pourV || 300) * (V8.pump || 1), T0 = x.T0 || Math.max(1, Math.ceil(x.N / (V8.zpt || 4) - 1e-9));
    var parts = '기둥 ' + q.nCol + '개 ' + fmt(q.Vcol) + ' + 보 ' + q.nBm + '개 ' + fmt(q.Vbeam) + ' + 슬래브 ' + fmt(q.Vslab) + (q.Vwall > 0 ? ' + 코어 벽 ' + fmt(q.Vwall) + ' + 코어 바닥 ' + fmt(q.Vcs) : '') + ' = ' + fmt(q.V) + '㎥';
    var head = lab + ' ' + fmt(q.Au) + '㎡' + (q.Ac > 0 ? ' (코어 ' + fmt(q.Ac) + '㎡)' : '') + ' · 기준 층고 ' + r1(q.h) + 'm : ' + parts;
    var team = ' · 팀 ' + (T || x.T) + (x.tIn ? ' (입력 · 자동 ⌈' + x.N + ' ÷ ' + (V8.zpt || 4) + '⌉ = ' + T0 + ')' : ' = ⌈' + x.N + ' ÷ ' + (V8.zpt || 4) + '⌉ (자동)');
    if (x.zIn) return zbLine('Zone 수 입력 · 체적 ≈ <b>' + fmt(q.V) + '</b>㎥ ÷ <b>' + x.N + '</b> Zone<br>→ Zone 당 ≈ <b>' + fmt(q.V / Math.max(1, x.N)) + '</b>㎥', head + ' · Zone 수 입력 ' + x.N + ' (adv.zN)' + team);
    return zbLine('체적 ≈ <b>' + fmt(q.V) + '</b>㎥ ÷ 1회 <b>' + fmt(V8.pourV) + '</b>㎥' + (V8.pump > 1 ? ' × 펌프 ' + V8.pump : '') + '<br>→ <b>' + x.N + '</b> Zone · Zone ' + (V8.zpt || 4) + '개당 1팀',
      head + ' ÷ (' + fmt(V8.pourV) + '㎥ × 펌프 ' + (V8.pump || 1) + ') = ' + r1(q.V / pv) + ' → ' + x.N + ' Zone (올림)' + team);
  }
  function zbUp(R) {
    var fr = R.frame, ty = fr.typ, A = zbAdv(R), zIn = GE.parseSpec(A.zSpec).up[ty.n] != null;
    if (!ty.dc && ty.slab && ty.slab.model === 'v28' && ty.slab.q) return zb28(R, ty.slab, ty.n + 'F 기준층', ty.slab.T);
    if (ty.dc) {
      var P = ty.dc.P;
      return zbLine((zIn ? 'Zone 수 입력 · ' : '') + '체적 ≈ <b>' + fmt(P.V) + '</b>㎥ ÷ 1회 <b>' + fmt(LIB.dc.pourV) + '</b>㎥', '기둥 · 보 · 슬래브 체적 ' + fmt(P.V) + '㎥' + (zIn ? ' · Zone 수 입력 ' + P.N : ' ÷ 1회 타설 ' + fmt(LIB.dc.pourV) + '㎥ = ' + r1(P.V / LIB.dc.pourV) + ' → ' + P.N + ' Zone (올림)') + ' · Zone 당 ≈ ' + fmt(P.V / Math.max(1, P.N)) + '㎥');
    }
    var sl = ty.slab, hasCore = !!ty.core, Au = fr.Atyp, cA = +A.coreA > 0 ? Math.min(+A.coreA, Au * 0.6) : 0, k = hasCore ? (cA ? Math.max(0.4, 1 - cA / Au) : LIB.frame.core.slabShare) : 1;
    if (zIn) return zbLine('Zone 수 입력 · Zone ≈ <b>' + fmt(Au * k / Math.max(1, sl.Z)) + '</b>㎡', ty.n + 'F Zone 수 입력 ' + sl.Z + ' · 기준층 ' + fmt(Au) + '㎡' + (k !== 1 ? ' × 바닥 몫 ' + r2(k) : '') + ' ÷ ' + sl.Z);
    return zbSlab(LIB.frame, Au, sl.Z, '기준층', k);
  }
  function zbCore(R) {
    var ty = R.frame.typ, A = zbAdv(R), zIn = +A.coreZ > 0;
    if (ty.dc) {
      var C = ty.dc.C;
      return zbLine((zIn ? 'Zone 수 입력 · ' : '') + '체적 ≈ <b>' + fmt(C.V) + '</b>㎥ ÷ 1회 <b>' + fmt(LIB.dc.pourV) + '</b>㎥', '코어 벽체 · 바닥 체적 ' + fmt(C.V) + '㎥' + (zIn ? ' · Zone 수 입력 ' + C.N : ' ÷ 1회 타설 ' + fmt(LIB.dc.pourV) + '㎥ = ' + r1(C.V / LIB.dc.pourV) + ' → ' + C.N + ' Zone (올림)'));
    }
    if (!ty.core) return '';
    var Au = R.frame.Atyp, cA = +A.coreA > 0 ? Math.min(+A.coreA, Au * 0.6) : 0, ca = cA || Au * LIB.frame.core.ratio, za = LIB.frame.core.zoneA;
    if (zIn) return zbLine('Zone 수 입력 · Zone ≈ <b>' + fmt(ca / ty.core.Z) + '</b>㎡', '코어 Zone 수 입력 ' + ty.core.Z);
    return zbLine('Zone 기준 <b>' + fmt(za) + '</b>㎡ · 코어 ≈ <b>' + fmt(ca) + '</b>㎡', '코어 ' + fmt(ca) + '㎡' + (cA ? '' : ' (기준층 × ' + LIB.frame.core.ratio + ')') + ' ÷ ' + fmt(za) + '㎡ = ' + r1(ca / za) + ' → ' + ty.core.Z + ' Zone (반올림' + (cA ? '' : ', 최소 2') + ')');
  }

  /* ───────── 조닝 : 아이소메트릭 적층 (기준층 · 지하골조 · 기초, 같은 축척) */
  /* 지상 코어 : 면적 = 코어 비율 (DC 는 엔진 코어 면적), 모양은 깊이 ≤ 단변 0.6 의 직사각형.
     위치 (S.adv.coreX · coreY = 0~1, 남는 폭 안의 비율) 는 조닝 판에서 드래그 — 공기 계산에는 쓰지 않는 배치 가정 */
  /* 지상 코어 (여러 개) : S.adv.cores = [{ x, y, a, asp }] — x · y = 남는 폭 안의 위치 비율 (0~1), a = 면적 ㎡ (없으면 기본 몫), asp = 폭 ÷ 깊이.
     배열이 없으면 옛 한 개 (coreX · coreY · coreA · coreAsp). 면적이 모두 정해지면 합계 = adv.coreA (엔진 입력 : 철골 · 강합성 · DC 의 코어 · 바닥 Zone).
     RC (코어 별도 경로 없음) 도 코어 벽체는 있으므로 '일체 타설' 코어로 배치 · PIT 위치 · 지하 수직재에만 쓴다 */
  var selCore = 0, CORE_MAX = 4;
  /* 기본 코어 면적 = 엔진 코어 (adv.coreA 없을 때 기준층 × R.frame.v28.coreR : 일반 RC · SRC 0.23 (v2.8) · 철골 · 강합성 · DC 0.2 (frame.core.ratio)) */
  function coreDefA(R) { var ty = R.frame.typ, cr = R.frame.v28 && R.frame.v28.coreR > 0 ? R.frame.v28.coreR : LIB.frame.core.ratio; return ty.dc ? ty.dc.Ac : R.frame.Atyp * cr; }
  function coreList() {
    var A = S.adv || {};
    if (Array.isArray(A.cores) && A.cores.length) return A.cores;
    return [{ x: A.coreX, y: A.coreY, a: A.coreA > 0 ? +A.coreA : null, asp: A.coreAsp > 0 ? +A.coreAsp : null }];
  }
  function setCores(list) {
    S.adv = S.adv || {};
    S.adv.cores = list.map(function (c) { return { x: +(+c.x).toFixed(3), y: +(+c.y).toFixed(3), a: c.a > 0 ? Math.round(c.a) : null, asp: c.asp > 0 ? +(+c.asp).toFixed(3) : null }; });
    var all = S.adv.cores.every(function (c) { return c.a > 0; });
    if (all) S.adv.coreA = S.adv.cores.reduce(function (t, c) { return t + c.a; }, 0); else delete S.adv.coreA;
    delete S.adv.coreX; delete S.adv.coreY; delete S.adv.coreAsp;
  }
  function coreShape(Ac, asp, L, B) {
    var cd, cw;
    if (asp > 0) { cd = Math.sqrt(Ac / asp); cw = Ac / cd; if (cw > L * 0.95) { cw = L * 0.95; cd = Ac / cw; } if (cd > B * 0.95) { cd = B * 0.95; cw = Math.min(L * 0.95, Ac / cd); } }
    else { cd = Math.min(B * 0.6, Math.sqrt(Ac / 1.5)); cw = Ac / cd; if (cw > L * 0.6) { cw = L * 0.6; cd = Math.min(B * 0.9, Ac / cw); } }
    return { cw: cw, cd: cd };
  }
  function coresGeom(R) {
    var fr = R.frame, ty = fr.typ, Au = fr.Atyp;
    if (!(Au > 0)) return [];
    var L = Math.sqrt(Au * 1.6), B = Math.sqrt(Au / 1.6), integ = !(ty.dc || ty.core), list = coreList(), defA = coreDefA(R);
    if (!(defA > 0)) return [];
    var c01 = function (v) { return v != null && v !== '' && isFinite(v) ? Math.max(0, Math.min(1, +v)) : 0.5; };
    /* 면적은 ㎡ 로 저장 → 기준층 면적이 줄면 합계가 60% 를 넘을 수 있음. 엔진은 합계 (adv.coreA) 를 기준층 60% 로 자르므로 판도 같은 비율로 줄인다 */
    var raw = list.map(function (c) { return c.a > 0 ? +c.a : defA / list.length; }), sum = raw.reduce(function (t, v) { return t + v; }, 0), kA = sum > Au * 0.6 ? Au * 0.6 / sum : 1;
    return list.map(function (c, i) {
      var Ac = raw[i] * kA, sh = coreShape(Ac, c.asp, L, B), px = c01(c.x), py = c01(c.y);
      return { i: i, L: L, B: B, cw: sh.cw, cd: sh.cd, px: px, py: py, x0: px * (L - sh.cw), y0: py * (B - sh.cd), Ac: Ac, Au: Au, integ: integ, set: c.a > 0 };
    });
  }
  /* 다른 평면 (기초 · 지하) 으로 옮길 때 : 코어 중심의 평면 비율 위치를 그대로, 크기는 실제 크기 (판 안으로) */
  function coreOn(cg, Lt, Bt) {
    var cw = Math.min(cg.cw, Lt * 0.95), cd = Math.min(cg.cd, Bt * 0.95), cx = (cg.x0 + cg.cw / 2) / cg.L * Lt, cy = (cg.y0 + cg.cd / 2) / cg.B * Bt;
    return { cw: cw, cd: cd, x0: Math.max(0, Math.min(Lt - cw, cx - cw / 2)), y0: Math.max(0, Math.min(Bt - cd, cy - cd / 2)), cx: cx, cy: cy };
  }
  /* 지하 수직재용 코어 벽 비 = 코어 둘레 합 ÷ 기본 코어 1개 둘레 (기본 1개 그대로면 1) */
  function coreWallK(R) {
    var gs = coresGeom(R); if (!gs.length) return 1;
    var L = gs[0].L, B = gs[0].B, d0 = coreShape(coreDefA(R), null, L, B), p0 = 2 * (d0.cw + d0.cd);
    return gs.reduce(function (t, g) { return t + 2 * (g.cw + g.cd); }, 0) / Math.max(1e-6, p0);
  }
  /* PIT : 각 코어 아래 기초 Zone (가까운 순). 수 = S.adv.pitN (사례 보정값) 을 코어 면적 비로 나눔, 없으면 코어당 2개.
     부분 지하는 깊은 구간 Zone 안에서만. 지하층 없으면 PIT 없음 */
  function pitUnderCore(R) {
    var f = R.found, b = R.basic, gs = coresGeom(R);
    if (!gs.length || b.nB === 0 || !(f.nZ > 0)) return null;
    var Af = f.Af > 0 ? f.Af : R.geo.bldg, Lf = Math.sqrt(Af * 1.6), Bf = Math.sqrt(Af / 1.6);
    var cells = zgridPlan(0, 0, Lf, Bf, f.nZ, function (i) { return { i: i }; }).filter(function (c) { return !(f.nDeep > 0 && f.nDeep < f.nZ) || c.i < f.nDeep; });
    var n = Math.min(cells.length, S.adv && S.adv.pitN > 0 ? Math.round(S.adv.pitN) : 2 * gs.length), per = splitBy(n, gs.map(function (g) { return g.Ac; }), true), used = {}, out = [];
    gs.forEach(function (g, k) {
      var m = coreOn(g, Lf, Bf);
      cells.filter(function (c) { return !used[c.i]; }).map(function (c) { return { i: c.i, d: Math.hypot((c.X0 + c.X1) / 2 - m.cx, (c.Y0 + c.Y1) / 2 - m.cy) }; })
        .sort(function (a, c) { return a.d - c.d; }).slice(0, per[k]).forEach(function (c) { used[c.i] = 1; out.push(c.i); });
    });
    return out.length ? out : null;
  }
  /* 정수 N 을 가중치 비로 나눔 (큰 나머지 순), atLeast1 이면 N 이 충분할 때 각 1개 이상 */
  function splitBy(N, ws, atLeast1) {
    var tot = ws.reduce(function (t, w) { return t + w; }, 0) || 1, k = ws.length, base = atLeast1 && N >= k ? 1 : 0, rest = N - base * k;
    var n = ws.map(function (w) { return base + Math.floor(rest * w / tot); }), left = N - n.reduce(function (t, v) { return t + v; }, 0);
    ws.map(function (w, i) { return { i: i, f: rest * w / tot - Math.floor(rest * w / tot) }; }).sort(function (a, b) { return b.f - a.f; }).forEach(function (q) { if (left > 0) { n[q.i]++; left--; } });
    return n;
  }
  function coreWhere(cg) {
    var e = 0.04, edge = cg.px < e || cg.px > 1 - e || cg.py < e || cg.py > 1 - e;
    return (cg.px < 0.3 ? '좌측' : cg.px > 0.7 ? '우측' : '중앙') + ' · ' + (edge ? '외주부 면함' : '내부');
  }
  /* 바닥 Zone : 코어들을 뺀 빈 영역을 세로 띠로 쪼개 (같은 위아래 경계면 이어 붙임) 직사각형 목록 → 면적 비로 Zone 을 나눠 이어 번호 */
  function freeRects(L, B, holes) {
    var xs = [0, L]; holes.forEach(function (h) { xs.push(Math.max(0, Math.min(L, h.x0)), Math.max(0, Math.min(L, h.x0 + h.cw))); });
    xs = xs.sort(function (a, b) { return a - b; }).filter(function (v, i, a) { return !i || v - a[i - 1] > 0.05; });
    var rects = [];
    for (var i = 0; i + 1 < xs.length; i++) {
      var xa = xs[i], xb = xs[i + 1], mid = (xa + xb) / 2;
      var occ = holes.filter(function (h) { return h.x0 < mid && h.x0 + h.cw > mid; }).map(function (h) { return [Math.max(0, h.y0), Math.min(B, h.y0 + h.cd)]; }).sort(function (a, b) { return a[0] - b[0]; });
      var y = 0, free = [];
      occ.forEach(function (o) { if (o[0] > y + 0.05) free.push([y, o[0]]); y = Math.max(y, o[1]); });
      if (B > y + 0.05) free.push([y, B]);
      free.forEach(function (f) {
        var prev = rects.filter(function (r) { return Math.abs(r[0] + r[2] - xa) < 0.01 && Math.abs(r[1] - f[0]) < 0.01 && Math.abs(r[1] + r[3] - f[1]) < 0.01; })[0];
        if (prev) prev[2] = xb - prev[0]; else rects.push([xa, f[0], xb - xa, f[1] - f[0]]);
      });
    }
    return rects.filter(function (r) { return r[2] > 0.5 && r[3] > 0.5; });
  }
  function slabCells(L, B, holes, N, cellOf) {
    if (!holes || !holes.length) return zgridPlan(0, 0, L, B, N, cellOf);
    var rs = freeRects(L, B, holes);
    if (!rs.length) return [];
    var n = splitBy(N, rs.map(function (r) { return r[2] * r[3]; }), false), out = [], base = 0;
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
    var cores = o.cores || [], C = 0.8660254, pad = 14, tz = o.tz || 9, hc = cores.reduce(function (m, c) { return Math.max(m, c.hc || (c.integ ? 9 : 20)); }, 0), Lp = o.Lp, Bp = o.Bp;
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
    /* 코어 블록 : 뒤 → 앞 순서 (X+Y 작은 것 먼저) 로 그려 가림이 맞게. drag = 지상 판 (끌기 · 크기 손잡이), 아니면 낮은 블록 (지하) */
    cores.slice().sort(function (a, c) { return (a.x0 + a.cw / 2 + a.y0 + a.cd / 2) - (c.x0 + c.cw / 2 + c.y0 + c.cd / 2); }).forEach(function (cr) {
      var h = cr.hc || (cr.integ ? 9 : 20), k0 = cr.x0, k1 = k0 + cr.cw, j0 = cr.y0, j1 = j0 + cr.cd;
      v += '<g class="core-h' + (cr.drag ? ' drag' : '') + (cr.sel ? ' cur' : '') + '" data-core="' + cr.i + '"' + (cr.drag ? ' tabindex="0" role="slider" aria-label="코어 ' + (cr.i + 1) + ' (드래그로 이동 · 방향키 · Delete 삭제)" aria-valuetext="' + esc(cr.where || '') + '"' : '') + '>';
      v += Pg([P(k0, j1, 0), P(k1, j1, 0), P(k1, j1, h), P(k0, j1, h)], ' fill="' + (cr.drag ? '#9DB0CC' : '#AEBBD0') + '"') + Pg([P(k1, j0, 0), P(k1, j1, 0), P(k1, j1, h), P(k1, j0, h)], ' fill="' + (cr.drag ? '#7F95B8' : '#93A3BD') + '"');
      v += Pg([P(k0, j0, h), P(k1, j0, h), P(k1, j1, h), P(k0, j1, h)], ' fill="' + (cr.drag ? '#EEF2F8' : '#E4E9F1') + '"');
      v += cells(cr.cells || [], h);
      v += Pg([P(k0, j0, h), P(k1, j0, h), P(k1, j1, h), P(k0, j1, h)], ' class="core-top" fill="none" stroke="var(--navy)" stroke-width="' + (cr.sel ? 1.8 : 1.1) + '" stroke-linejoin="round"');
      if (cr.drag) {
        var rz = P(k1, j1, h), cm = P(k0, j0, h);
        v += '<g class="core-rs" transform="translate(' + r1(rz[0]) + ' ' + r1(rz[1]) + ')"><circle r="9" fill="transparent"/><rect x="-5" y="-5" width="10" height="10" rx="2.5" fill="#fff" stroke="var(--navy)" stroke-width="1.4"/><path d="M-2.2 2.2l4.4-4.4" stroke="var(--navy)" stroke-width="1.1" stroke-linecap="round"/></g>';
        v += '<g class="core-grip" transform="translate(' + r1(cm[0]) + ' ' + r1(cm[1] - 13) + ')"><rect x="-17" y="-8" width="34" height="16" rx="8" fill="' + (cr.sel ? 'var(--cp)' : 'var(--navy)') + '"/>' +
          (cores.length > 1 ? T(0, 3.6, String(cr.i + 1), { a: 'middle', fs: 10, w: 700, c: '#fff', cls: 'n' }) : '<path d="M-9 0h18M-9 0l3-3M-9 0l3 3M9 0l-3-3M9 0l-3 3" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round"/>') + '</g>';
      }
      v += '</g>';
    });
    /* 기초 판 : 지상 코어 자리 (점선) — PIT 가 이 아래 Zone 에 놓인다 */
    (o.ghostCores || []).forEach(function (g) { v += Pg([P(g.x0, g.y0), P(g.x0 + g.cw, g.y0), P(g.x0 + g.cw, g.y0 + g.cd), P(g.x0, g.y0 + g.cd)], ' fill="rgba(30,58,98,.06)" stroke="var(--navy)" stroke-width="1.1" stroke-dasharray="4 3" stroke-linejoin="round"'); });
    /* 판 두께 표기 (기초 매트) : 오른쪽 앞 모서리 옆 */
    if (o.tLab) { var pq = P(Lr, Br), qx = pq[0] - 6; v += Ln(qx, pq[1] + 1, qx, pq[1] + tz, 'var(--navy)', 0.9) + Ln(qx - 3, pq[1] + 1, qx + 3, pq[1] + 1, 'var(--navy)', 0.9) + Ln(qx - 3, pq[1] + tz, qx + 3, pq[1] + tz, 'var(--navy)', 0.9) + T(qx - 6, pq[1] + tz / 2 + 4, o.tLab, { a: 'end', fs: 11.5, w: 600, c: 'var(--navy)', cls: 'n', halo: true }); }
    /* 변 치수 (앞 두 변) */
    var mx = (pl[0] + pb[0]) / 2 - 7, my = (pl[1] + pb[1]) / 2 + tz + 12, nx = (pb[0] + pr[0]) / 2 + 7, ny = (pb[1] + pr[1]) / 2 + tz + 12;
    if (Lr * s > 40) v += T(mx, my, '≈ ' + r1(Lr) + ' m', { a: 'middle', fs: 11.5, w: 500, c: 'var(--ink-2)', cls: 'n', tr: 'rotate(30 ' + r1(mx) + ' ' + r1(my) + ')' });
    if (Br * s > 34) v += T(nx, ny, '≈ ' + r1(Br) + ' m', { a: 'middle', fs: 11.5, w: 500, c: 'var(--ink-2)', cls: 'n', tr: 'rotate(-30 ' + r1(nx) + ' ' + r1(ny) + ')' });
    var svg = svgEl(FW, H, v, o.aria);
    /* 드래그용 : 화면 → 평면 좌표 변환에 쓰는 값 */
    return cores.some(function (c) { return c.drag; }) ? svg.replace('<svg ', '<svg data-iso="' + r2(s) + ',' + r2(Lr) + ',' + r2(Br) + '" ') : svg;
  }
  /* 팀수 조절 : − n팀 + · 최적이 아니면 '최적 n팀 · 공기' 버튼 */
  /* o.max = 최적 계산이 없을 때 + 상한 (엔진 R.teamKeys 의 max), o.tail = 뒤에 붙일 칩 (외벽팀 '자동 = 실적값' 등) */
  function teamCtl(key, lab, cur, sw, o) {
    o = o || {};
    var opt = sw ? sw.opt : cur, max = sw ? sw.max : o.max || 10;
    return '<span class="tm" data-team="' + key + '" data-max="' + max + '"><span class="tm-k">' + esc(lab) + '</span>' +
      '<button type="button" class="tm-b" data-tstep="-1" aria-label="' + esc(lab) + ' 줄이기"' + (cur <= 1 ? ' disabled' : '') + '>−</button><b class="tm-v">' + cur + '</b><span class="tm-u">팀</span>' +
      '<button type="button" class="tm-b" data-tstep="1" aria-label="' + esc(lab) + ' 늘리기"' + (cur >= max ? ' disabled' : '') + '>+</button>' +
      (!sw ? '' : cur === opt ? '<span class="tm-o on" title="최단 공기와 ' + OPT_TOL + '개월 이내인 가장 적은 팀수">최적</span>' :
        '<button type="button" class="tm-o" data-topt="' + opt + '" title="최단 공기와 ' + OPT_TOL + '개월 이내인 가장 적은 팀수 — 누르면 적용 (공기 ' + m2(sw.totals[opt - 1]) + '개월)">최적 ' + opt + '팀 · ' + dM(sw.totals[opt - 1] - (lastR ? lastR.total : sw.totals[opt - 1])) + '</button>') + (o.tail || '') + '</span>';
  }
  /* 팀수 비우기 (자동으로) — 외벽팀 : 비우면 외벽 = 실적값 */
  ACT.teamClr = function (el) {
    var k = el.getAttribute('data-key'); if (!k || !S.adv || S.adv[k] == null) return;
    delete S.adv[k]; if (current) markPreset(''); GK.fill(document, S); recompute();
  };
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
        '<div class="iso-fig">' + svgHtml + '</div><div class="iso-cy">' + [].concat(cy || []).map(cyHTML).join('') + '</div></div>';
    }
    /* 기초 : 판 두께 = 매트 두께 (세로 ×4), PIT = 지상 코어 아래 Zone (굵은 테두리) */
    var oF = '', oB = '', oU = '', gsAll = coresGeom(R);
    maxT = Math.max(maxT, f.teams);
    if (Af > 0) {
      var Z = f.sim.Z.slice().sort(function (a, c) { return a.pour - c.pour; }), rank = {}, byI = {};
      Z.forEach(function (z, i) { rank[z.i] = i + 1; byI[z.i] = z; });
      var cellsF = zgridPlan(0, 0, dF.L, dF.B, f.nZ, function (i) { var z = byI[i] || { team: 1 }; return { fill: TEAMC[(z.team - 1) % 8], op: z.slope ? 0.22 : 0.58, stroke: z.pit ? 'var(--cp)' : '#fff', sw: z.pit ? 2.4 : 1.2, t: rank[i] || '' }; });
      var tzF = Math.max(7, Math.min(28, g.tMat * s * 4));
      oF = row('기초 · ' + GE.FOUND_N[R.fType].replace(/ \(.*\)/, ''), '기초', Af, dF, [
        '<b>' + f.nZ + '</b> Zone · 매트 <b>' + r1(g.tMat) + '</b>m',
        zbFound(R),
        teamCtl('fTeams', '철근팀', f.teams, R.team && R.team.f),
        f.nPit ? 'PIT <b>' + f.nPit + '</b> Zone · 코어 아래 (점선)' : ''
      ], isoPlate({ Lp: dF.L, Bp: dF.B, Lr: dF.L, Br: dF.B, cells: cellsF, tz: tzF, tLab: 't=' + r1(g.tMat) + 'm', ghostCores: gsAll.map(function (q) { return coreOn(q, dF.L, dF.B); }), aria: '기초 조닝 평면 (아이소메트릭) · 매트 ' + r1(g.tMat) + 'm · 점선 = 지상 코어 자리' }, s, FW, 2), cyFound(R));
    } else oF = '<div class="iso-none">건축면적을 넣으면 기초 평면이 그려집니다.</div>';
    /* 지하골조 */
    var bs = R.base;
    if (!bs || b.nB === 0) oB = '<div class="iso-none">지하층 없음 · 기초 위에서 바로 지상골조</div>';
    else if (Ab > 0) {
      var NZ, NT, sub, TMS = R.team || {};
      /* 역타 : 팀 = adv.tdTeams (엔진 R.base.T, 팀당 Zone 순환) · 순타 v2.8 : 바닥 형틀팀 bTeams (1F 바닥 기준) · 외벽팀 wTeams (비우면 실적값) */
      if (bs.td) { NZ = bs.n1 > 0 ? bs.n1 : Math.max(2, Math.min(4, Math.round(g.Adeep / LIB.td.f1ZoneA))); NT = Math.max(1, bs.T || 1); sub = ['역타 슬래브 <b>' + NZ + '</b> Zone 순환', teamCtl('tdTeams', '슬래브팀', NT, TMS.tdTeams, { max: NZ })]; }
      else if (bs.partial) { NZ = Math.max(1, Math.round(Ab / LIB.base.zoneA)); NT = Math.ceil(NZ / LIB.base.zpt - 1e-9); sub = ['바닥 <b>' + NZ + '</b> Zone · <b>' + NT + '</b>팀', '점선 = 기초 외곽']; }
      else {
        var r0 = bs.rows[bs.rows.length - 1]; NZ = r0.Z; NT = r0.T;
        sub = ['바닥 <b>' + NZ + '</b> Zone' + (bs.model === 'v28' ? '' : ' · <b>' + NT + '</b>팀')];
        if (bs.model === 'v28') {
          var tkW = (R.teamKeys || []).filter(function (q) { return q.key === 'wTeams'; })[0], wIn = !!bs.wIn;
          sub.push(teamCtl('bTeams', '바닥 형틀팀', NT, TMS.bTeams));
          sub.push('외벽 둘레 <b>' + bs.Zw + '</b> Zone' + (wIn && Math.abs(bs.wK - 1) > 0.005 ? ' · 외벽 × <b>' + r2(bs.wK) + '</b>' : ''));
          sub.push(teamCtl('wTeams', '외벽팀', bs.Tw, null, { max: tkW ? tkW.max : Math.min(8, bs.Zw),
            tail: wIn && Math.abs(bs.wK - 1) > 0.005 ? '<button type="button" class="tm-o" data-act="teamClr" data-key="wTeams" title="비우기 → 외벽 = 지금 실적값 (팀 반영 없음)">자동</button>'
              : '<span class="tm-o on" title="외벽팀을 비우면 외벽 일수 = 지금 실적값 그대로 · 넣으면 자동 ' + bs.Tw0 + '팀 대비 ⌈' + bs.Zw + ' Zone ÷ 팀⌉ 비로 반영 (하한 × ' + r2(v28Lib(R).wKmin) + ', 가정)">자동 = 실적값</span>' }));
        }
      }
      sub.splice(1, 0, zbBase(R, NZ));
      maxT = Math.max(maxT, NT);
      var tb = zteams(NZ, NT), ghost = Ab < Af * 0.97;
      var Ldb = ghost ? dF : dB;
      /* 지상 코어는 지하까지 이어진다 (같은 평면 비율 위치 · 실제 크기) — 바닥 Zone 은 그 둘레.
         지하가 기초보다 작으면 (부분 지하 등) 판은 기초 외곽 (점선) 모서리에 놓이므로 코어도 기초 평면 위치 (기초 판 점선 코어와 같은 자리) 에서 지하 판과 겹치는 부분만 */
      var coresB = gsAll.map(function (q) {
        var m = coreOn(q, ghost ? dF.L : dB.L, ghost ? dF.B : dB.B);
        if (ghost) { var xa = Math.max(0, m.x0), ya = Math.max(0, m.y0), xb = Math.min(dB.L, m.x0 + m.cw), yb = Math.min(dB.B, m.y0 + m.cd); if (xb - xa < 0.5 || yb - ya < 0.5) return null; m = { x0: xa, y0: ya, cw: xb - xa, cd: yb - ya }; }
        return { i: q.i, cw: m.cw, cd: m.cd, x0: m.x0, y0: m.y0, integ: true, hc: 8 };
      }).filter(Boolean);
      var cellsB = slabCells(dB.L, dB.B, coresB, NZ, function (i) { var q = tb(i); return { fill: TEAMC[q.team % 8], op: 0.58, t: q.ord }; });
      var vF = bs.td ? 1 - LIB.td.coreShare + LIB.td.coreShare * coreWallK(R) : 1;
      if (coresB.length) sub.push('코어 <b>' + coresB.length + '</b>개 지하까지' + (Math.abs(vF - 1) > 0.005 ? ' · 수직재 ×' + r2(vF) : ''));
      oB = row('지하 ' + b.nB + '개층', '지하골조', Ab, dB, sub, isoPlate({ Lp: Ldb.L, Bp: Ldb.B, Lr: dB.L, Br: dB.B, ghost: ghost, cells: cellsB, cores: coresB, aria: '지하골조 조닝 평면 (아이소메트릭)' }, s, FW, 1), cyBase(R));
    } else oB = '<div class="iso-none">지하 ' + b.nB + '개층 · 지하 연면적이나 건축면적을 넣으면 지하골조 평면이 그려집니다.</div>';
    /* 지상골조 (기준층) : 외주부 (RC = 형틀팀 · 철골 = 철골팀) 와 코어 (RC 코어 = 형틀팀) 를 따로. RC 는 코어 일체 타설 */
    var ty = fr.typ, NP, TP, NC = 0, TC = 0;
    if (ty.dc) { NP = ty.dc.P.N; TP = ty.dc.P.T; NC = ty.dc.C.N; TC = ty.dc.C.T; }
    else { NP = ty.slab.Z; TP = ty.slab.T; if (ty.core) { NC = ty.core.Z; TC = ty.core.T; } }
    if (Au > 0) {
      var gs = gsAll, tp = zteams(NP, TP), tc = NC ? zteams(NC, TC) : null, oTrade = steel ? '철골팀' : '형틀팀';
      if (selCore >= gs.length) selCore = Math.max(0, gs.length - 1);
      var cellsU = slabCells(dU.L, dU.B, gs, NP, function (i) { var q = tp(i); return { fill: 'var(--t1)', op: 0.36 + 0.2 * (q.team % 3), t: q.ord }; });
      /* 코어 Zone 은 코어 면적 비로 나눠 이어 번호 */
      var perC = NC ? splitBy(NC, gs.map(function (q) { return q.Ac; }), true) : gs.map(function () { return 0; }), cb0 = 0;
      var coresU = gs.map(function (q, k) {
        var b0 = cb0, cl = perC[k] ? zgridPlan(q.x0, q.y0, q.cw, q.cd, perC[k], function (j) { var t = tc(b0 + j); return { fill: 'var(--navy)', op: 0.42 + 0.2 * (t.team % 2), t: t.ord, tc: '#fff', halo: 'rgba(16,30,56,.55)', minSz: 15 }; }) : [];
        cb0 += perC[k];
        return { i: q.i, cw: q.cw, cd: q.cd, x0: q.x0, y0: q.y0, drag: true, integ: q.integ, sel: gs.length > 1 && q.i === selCore, where: coreWhere(q), cells: cl };
      });
      var cs = gs[selCore], totA = gs.reduce(function (t, q) { return t + q.Ac; }, 0);
      oU = row('지상 ' + b.nUp + '개층 · 기준층 ' + ty.n + 'F', '지상골조', Au, dU, [
        '<i class="dot" style="background:var(--t1)"></i>외주부 <b>' + NP + '</b> Zone',
        zbUp(R),
        teamCtl('uTeams', oTrade, TP, R.team && R.team.u),
        NC ? '<i class="dot" style="background:var(--navy)"></i>코어 <b>' + NC + '</b> Zone' : '<i class="dot" style="background:var(--navy)"></i>코어 일체 타설 (외주부 형틀팀)',
        NC ? zbCore(R) : '',
        NC ? teamCtl('cTeams', '형틀팀', TC, R.team && R.team.c) : '',
        gs.length ? '<span class="core-n">코어 <b>' + gs.length + '</b>개 · ' + Math.round(totA / gs[0].Au * 100) + '% · ' + fmt(Math.round(totA)) + '㎡' +
          (gs.length < CORE_MAX ? '<button type="button" class="tm-o core-add" data-act="coreAdd" title="코어 추가 (최대 ' + CORE_MAX + '개)">+ 코어</button>' : '') + '</span>' : '',
        gs.length > 1 ? '<span class="core-pick" role="group" aria-label="코어 고르기">' + gs.map(function (q) { return '<button type="button" data-act="coreSel" data-i="' + q.i + '" class="' + (q.i === selCore ? 'on' : '') + '" aria-pressed="' + (q.i === selCore) + '">' + (q.i + 1) + '</button>'; }).join('') +
          '<button type="button" class="core-del" data-act="coreDel" title="고른 코어 삭제">삭제</button></span>' : '',
        cs ? '<span class="core-at" title="코어 블록을 끌어서 옮기기">' + (gs.length > 1 ? '코어 ' + (cs.i + 1) + ' ' : '') + '위치 <b>' + coreWhere(cs) + '</b></span>' : '',
        cs ? '<span class="tm core-sz"><span class="tm-k">크기</span><button type="button" class="tm-b" data-act="coreSize" data-d="-1" aria-label="코어 줄이기"' + (cs.Ac <= cs.Au * 0.031 ? ' disabled' : '') + '>−</button><b class="tm-v">' + Math.round(cs.Ac / cs.Au * 100) + '</b><span class="tm-u">%</span><button type="button" class="tm-b" data-act="coreSize" data-d="1" aria-label="코어 키우기"' + (totA >= cs.Au * 0.599 ? ' disabled' : '') + '>+</button><span class="tm-u">' + fmt(Math.round(cs.Ac)) + '㎡</span>' +
          (S.adv && (S.adv.cores || S.adv.coreA > 0 || S.adv.coreAsp > 0) ? '<button type="button" class="tm-o" data-act="coreSize" data-d="0" title="코어를 기본 1개 (기본 크기 · 가운데) 로">기본값</button>' : '') + '</span>' : ''
      ], isoPlate({ Lp: dU.L, Bp: dU.B, Lr: dU.L, Br: dU.B, cells: cellsU, cores: coresU, aria: '지상 기준층 조닝 평면 (아이소메트릭)' }, s, FW, 0), cyTyp(R));
    } else oU = '<div class="iso-none">지상 연면적 · 건축면적을 넣으면 기준층 평면이 그려집니다.</div>';
    var lg = ''; for (var t = 0; t < Math.min(maxT, 8); t++) lg += '<span><i style="background:' + TEAMC[t] + ';opacity:.7"></i>' + (t + 1) + '팀</span>';
    lg += '<span><i style="background:#fff;box-shadow:inset 0 0 0 2px var(--cp)"></i>PIT Zone</span>';
    if (f.nSlopeZ) lg += '<span><i style="background:var(--t1);opacity:.25"></i>경사띠</span>';
    lg += '<span><i style="background:var(--t1);opacity:.6"></i>외주부</span><span><i style="background:var(--navy);opacity:.7"></i>코어</span>';
    lg += '<span>숫자 = 타설 순서</span>';
    return { html: '<div class="iso' + (nar ? ' nar' : cols ? ' cols' : '') + '">' + oF + oB + oU + '</div>', legend: lg };
  }
  /* 다시 그려도 키보드 포커스를 같은 자리 새 요소로 (코어 블록 방향키 · 팀수 ± · 코어 단추) — 사이클 칸은 cyFocus 가 따로 */
  function zoneFocus(a) {
    if (!a || !a.closest || !$('#zone').contains(a)) return null;
    if (a.closest('.core-h.drag')) return ['.core-h.drag[data-core="' + selCore + '"]', '.core-h.drag'];
    var tm = a.closest('[data-team]'), ac = a.getAttribute('data-act') || '';
    if (tm) return ['[data-team="' + tm.getAttribute('data-team') + '"] [data-tstep="' + (a.getAttribute('data-tstep') || '1') + '"]:not(:disabled)', '[data-team="' + tm.getAttribute('data-team') + '"] .tm-b:not(:disabled)'];
    if (/^core(Sel|Size|Add|Del)$/.test(ac)) return ['[data-act="' + ac + '"]' + (ac === 'coreSel' ? '[data-i="' + selCore + '"]' : ac === 'coreSize' ? '[data-d="' + a.getAttribute('data-d') + '"]' : '') + ':not(:disabled)', '.core-sz .tm-b:not(:disabled)'];
    return null;
  }
  function renderZone(R) {
    var box = $('#zone'), fk = zoneFocus(document.activeElement), z = zoning(R, box.clientWidth || 520);
    box.innerHTML = z.html; $('#z-lg').innerHTML = z.legend; $('#z-lg').hidden = !box.querySelector('.iso-fig'); widths.zone = box.clientWidth;
    for (var i = 0; fk && i < fk.length; i++) { var f = box.querySelector(fk[i]); if (f) { try { f.focus({ preventScroll: true }); } catch (er) { f.focus(); } break; } }
  }

  /* ───────── 주요 가정사항 및 조건 : 영향 큰 6개 = 같은 크기 카드 (2열 3행), 나머지 = 한 줄 표.
     칸을 누르면 그 자리에서 편집 (선택 · 숫자) → S 갱신 → 다시 계산. Esc = 취소 · Enter / 바깥 클릭 = 적용.
     계산값 (기준층 사이클 · 분할 타설 · 기초 Zone) 은 편집 대신 관련 입력 (조닝 · 단면 층고) 으로 이동 */
  var KF_N = 6, KF_ORD = ['sup', 'found', 'cyc', 'split', 'lim', 'H', 'wall', 'ground', 'fq', 'mat', 'gwl', 'core', 'fz', 'pile', 'scw'];
  var KF_SUP = { ANCHOR: '어스앵커', STRUT: '스트럿', RAKER: '레이커', OPEN: '오픈컷', SLAB: '역타 슬래브 지지' };
  var KI_ED = '<svg class="ki" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.3 3.2l2.5 2.5-6.7 6.7-3.2.7.7-3.2zM9 4.5l2.5 2.5"/></svg>';
  var KI_GO = '<svg class="ki" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.2 3.6 10.6 8l-4.4 4.4"/></svg>';
  var kfIt = {}, kfEd = null, kfFoc = null;
  function kfOptsOf(id) { var el = document.getElementById(id); return el ? Array.prototype.map.call(el.options, function (o) { return [o.value, o.textContent]; }) : []; }
  function kfNumF(key, lab, u, cur, ph, o) { o = o || {}; return { key: key, lab: lab, u: u, cur: cur, ph: ph, step: o.step || 'any', min: o.min || 0, int: !!o.int, pos: !!o.pos, pre: o.pre || '', lib: !!o.lib, src: o.src || '' }; }
  /* 출처 배지 (엔진 R.frame.assume 의 src) : v2.8 · 가정 · 사례 보정 · 해석 · 입력 */
  var KB_C = { 'v2.8': '', '가정': ' kb-a', '사례 보정': ' kb-c', '해석': ' kb-h', '입력': ' kb-i' };
  function kbH(src) { return src ? '<b class="kb' + (KB_C[src] || ' kb-a') + '">' + esc(src) + '</b>' : ''; }
  /* 골조 가정 (fq) : v2.8 일반 사슬의 물량 · Zone · 인원 — R.frame.assume 의 path 로 편집 (adv.* = S.adv, v28.* = S.libOv).
     규칙 · 사례 보정 같은 '가정' 은 title 에만 (화면 문구 최소) */
  var FQ_K = [['spanL', '스팬 장변', 0.1, 3], ['spanS', '스팬 단변', 0.1, 3], ['colA', '기둥 단면', 0.01, 0.01], ['beamA', '보 단면', 0.01, 0.01], ['slabT', '슬래브 두께', 0.01, 0.05], ['pourV', '1회 타설', 10, 10], ['crewU', '바닥 철근', 1, 1]];
  function fqOf(fr, A) {
    var as = fr && Array.isArray(fr.assume) ? fr.assume : null; if (!as || !as.length) return null;
    var by = {}; as.forEach(function (a) { if (a && a.k) by[a.k] = a; });
    var its = FQ_K.map(function (q) { var a = by[q[0]]; return a && a.path ? { a: a, q: q } : null; }).filter(Boolean);
    if (its.length < 2 || !its.some(function (x) { return x.a.on; })) return null;
    function val(k) { return by[k] && isFinite(+by[k].v) ? +(+by[k].v).toFixed(3) : '-'; }
    var md = fr.model, v28 = fr.v28 || {}, lb = v28.lib || {};
    var head = md === 'v28' ? 'v2.8 공종 사슬 물량 · Zone (기준 층고 ' + r1(v28.hQ || 4.5) + 'm)' : md === 'dc' ? 'DC 분할 하한 (일반 사이클) 물량 — DC 사이클 슬래브 두께는 상세 조정' : 'v2.8 하한 (코어 c1 · 바닥 c3) 물량 — 층 사이클은 팀당 Zone (옛 식)';
    var f = its.map(function (x) {
      var a = x.a, q = x.q, lib = !/^adv\./.test(a.path), cur, ph;
      if (lib) { cur = hasOv(a.path) ? +S.libOv[a.path] : ''; ph = libDef(a.path); }
      else { var av = getP({ adv: A }, a.path.split('.')); cur = +av > 0 ? +av : ''; ph = lb[q[0]] != null ? lb[q[0]] : a.v; }
      return kfNumF(a.path, q[1], a.u || '', cur, ph == null ? '' : String(ph), { step: q[2], min: q[3], pos: true, int: q[2] === 1, lib: lib, src: a.src });
    });
    var inp = its.some(function (x) { return x.a.src === '입력'; });
    var v = '스팬 ' + val('spanL') + '×' + val('spanS') + ' · 슬래브 ' + val('slabT') + ' · Zone ' + val('pourV') + '㎥';
    var vh = '<small>스팬 </small>' + val('spanL') + '×' + val('spanS') + '<small> · 슬래브 </small>' + val('slabT');
    var why = 'Zone ' + val('pourV') + '㎥ · 바닥 철근 ' + val('crewU') + '인 · 기둥 ' + val('colA') + ' · 보 ' + val('beamA') + '㎡';
    /* title : 편집 항목 (출처) + 이번 계산에 쓴 가정 · 사례 보정 · 해석 */
    var T = [head, its.map(function (x) { return x.q[1] + ' ' + val(x.q[0]) + (x.a.u || '') + ' (' + x.a.src + ')'; }).join(' · ')];
    ['가정', '사례 보정', '해석'].forEach(function (s) {
      var L = as.filter(function (a) { return a.on && a.src === s && FQ_K.every(function (q) { return q[0] !== a.k; }); }).map(function (a) { var n = +a.v; return a.v == null || !isFinite(n) ? a.n : a.n + ' ' + (Math.abs(n) >= 1000 ? fmt(n) : +n.toFixed(3)) + (a.u || ''); });
      if (L.length) T.push(s + ' : ' + L.join(' · '));
    });
    return { k: '골조 가정' + (md === 'v28' ? '' : ' (하한)'), v: v, vh: vh, why: why, f: f, tip: T.join('\n'), badge: inp ? '입력' : 'v2.8' };
  }
  function renderKf(R) {
    var g = R.geo, b = R.basic, fr = R.frame, A = S.adv || {}, L = LIB, td = b.seq === 'TD', open = b.sup === 'OPEN' && b.nB > 0, F = {};
    function add(id, k, v, why, ed, vh) { F[id] = { id: id, k: k, v: v, vh: vh, why: why, ed: ed || null }; }
    function sel(opts, cur, grp) { cur = String(cur); return { t: 'sel', opts: opts, cur: cur, grp: grp }; }
    function nums(f) { return { t: 'num', f: f }; }
    function go(to, f, tip) { return { t: 'go', to: to, f: f, tip: tip }; }
    function pos(v) { return +v > 0 ? +v : ''; }
    if (b.nB > 0) {
      var sv;
      if (td) sv = ['역타 슬래브 지지', '기준층 ' + R.tdBase.name + ' 슬래브 선행 → 하향 굴착 · 슬래브 반복'];
      else if (open) sv = ['오픈컷 1:' + L.exc.slope, '사면 폭 ' + r1(g.slopeW) + 'm 필요 · 흙막이 벽체 없음' + (R.scw ? ' (외곽 SCW 차수만)' : '')];
      else {
        var ns = R.exc && R.exc.ns, an = R.exc && R.exc.anchor, sp = (L.support[b.sup] || {}).sp;
        sv = [KF_SUP[b.sup] + (ns > 0 ? ' · ' + ns + '단' : ''), '굴착 ' + r1(g.H) + 'm' + (ns > 0 ? ' · 첫 단 1.5m · 간격 ' + sp + 'm' + (an ? ' · 단당 ' + fmt(an.perStage) + '본, 총 ' + fmt(an.total) + '본 · ' + an.sets + '조' : '') : '')];
      }
      add('sup', '지보', sv[0], sv[1], sel(kfOptsOf('in-sup'), td ? 'SLAB' : b.sup, function (v) { return v === 'SLAB' ? '역타' : '순타'; }));
      add('H', '굴착 깊이', 'GL−' + r1(g.H) + 'm', g.Hfix ? '고정값' : (td ? '역타 층 층고 합' : '지하 층고 합 ' + r1(g.sumB) + 'm') + ' + 기초 ' + r1(g.tMat) + 'm + 0.3m' + (g.dH ? ' ' + (g.dH > 0 ? '+' : '−') + ' 보정 ' + r1(Math.abs(g.dH)) + 'm' : ''),
        nums([kfNumF('adv.Habs', '굴착 깊이', 'm', g.dH ? r1(g.H) : '', '자동 ' + r1(g.Hauto), { pos: true, pre: 'GL−' })]));
      var wCur = open && b.wall !== 'SCW' ? 'NONE' : b.wall, wO = kfOptsOf('in-wall').filter(function (o) { return o[0] === wCur || !(td && o[0] === 'NONE'); });
      if (R.wall) add('wall', '흙막이', GE.WALL_N[b.wall], R.wall.qty + ' · ' + R.wall.sets + '조', sel(wO, wCur));
      else if (open) add('wall', '흙막이', b.wall === 'SCW' ? 'SCW (차수)' : '없음 (오픈컷)', b.wall === 'SCW' && R.scw ? R.scw.qty : '사면 개착 · 벽체 없음', sel(wO, wCur));
      if (open && b.wall !== 'SCW') add('scw', '차수', R.scw ? 'SCW 병행' : '없음', R.scw ? R.scw.qty : '오픈컷 외곽 차수 없음', sel([['1', 'SCW 병행'], ['0', '없음']], S.scw ? '1' : '0'));
      add('gwl', '지하수위', isFinite(g.gwl) ? 'GL−' + r1(g.gwl) + 'm' : '없음', isFinite(g.gwl) ? (g.gwl < g.H ? '굴착 바닥이 수위보다 ' + r1(g.H - g.gwl) + 'm 아래 → 차수 · 영구배수 검토' : '굴착 바닥보다 깊음') : '입력 없음',
        nums([kfNumF('gwl', '지하수위', 'm', S.gwl == null ? '' : S.gwl, '없음', { pre: 'GL−' })]));
    }
    var fCur = S.found || 'AUTO';
    add('found', '기초 형식', GE.FOUND_N[R.fType], (fCur === 'AUTO' ? '자동 : ' : '') + R.fWhy, sel(kfOptsOf('in-found').filter(function (o) { return o[0] === fCur || !(td && o[0] === 'PHC'); }), fCur));
    add('mat', '매트 두께', r1(g.tMat) + 'm', A.mat > 0 ? '입력값' : '자동 = 0.9 + 0.045 × 지상 ' + b.nUp + '층' + (b.use === 'dc' ? ' + DC 0.6' : '') + ' (1.2 ~ 3.5)',
      nums([kfNumF('adv.mat', '매트 두께', 'm', pos(A.mat), A.mat > 0 ? '자동' : r1(g.tMat), { step: 0.1, pos: true })]));
    if (R.pile) add('pile', '파일', fmt(R.pile.n) + '본', R.pile.qty.replace(/^[\d,]+본 ?/, '') + ' · ' + R.pile.basis, nums([kfNumF('adv.pileN', '파일 본수', '본', pos(A.pileN), A.pileN > 0 ? '자동' : R.pile.n, { step: 1, int: true, pos: true })]));
    add('fz', '기초 Zone', R.found.nZ + ' Zone · ' + R.found.teams + '팀', 'Zone ' + fmt(R.found.vZ) + '㎥ · 철근 ' + r1(R.found.reb) + 't → 사이클 ' + r1(R.found.cyc) + 'WD', go('sec-zone', '[data-team="fTeams"]', '철근팀 수는 조닝에서'));
    var gc = $$('[data-chips][data-k="ground"]'); gc = gc[gc.length - 1];
    add('ground', '지반', R.ground.name + (R.ground.assumed ? ' (가정)' : ''), '풍화암 GL−' + r1(g.wrockTop) + 'm · 연암 GL−' + r1(g.rockTop) + 'm',
      sel(gc ? $$('[data-v]', gc).map(function (x) { return [x.getAttribute('data-v'), x.textContent]; }) : [], S.ground || 'AUTO'));
    var t = GK.tactOf(R), ty = fr.typ;
    add('cyc', '기준층 사이클', m1(t) + ' WD/층', ty.dc ? 'DC 사이클 · 외주부 ' + ty.dc.P.N + ' / 코어 ' + ty.dc.C.N + ' Zone · ' + ty.dc.gov + ' 지배' : '바닥 ' + ty.slab.Z + ' Zone ÷ ' + ty.slab.T + '팀' + (ty.core ? ' · 코어 ' + ty.core.Z + ' Zone' : '') + ' · 주공정 ' + fr.gov, go('sec-zone', '[data-team="uTeams"]', '팀 수 · Zone 은 조닝에서'));
    var two = GK.secLevels(R).filter(function (x) { return x.kind !== 'b' && x.n > 1; });
    add('split', '분할 타설 층', two.length ? two.map(function (x) { return x.label; }).join(', ') : '없음', fr.dc ? '층고 ' + L.dc.split + 'm 이상 = 수직재 2회 (그 아래 1회)' : fr.coreRows.length ? '코어 ' + L.frame.core.liftMax + 'm 초과 = 2 Lift' : '층고 ' + L.frame.split + 'm 이상 = 수직재 2회 · 층 사이클 × ' + r2(1 + L.frame.vShare), go('sec-sec', two.length ? 'input[data-floor-h="' + two[0].label + '"]' : '', '층고는 단면에서'));
    if (fr.coreRows.length) add('core', '코어 거푸집', fr.sysC === 'ACS' ? 'ACS' : '갱폼 · 알폼', S.coreSys && S.coreSys !== 'AUTO' ? '선택값' : '자동 : 지상 15층 이상 ACS', sel(kfOptsOf('in-core'), S.coreSys || 'AUTO'));
    if (td) {
      var l1 = Math.max(1, L.td.limTot1 - b.nB), l2 = Math.max(fr.lim, L.td.limTot2 - b.nB);   /* 비우면 엔진 자동값 (수직재 전 = max(기초 전, 지하 + 지상 32 − 지하)) */
      add('lim', '역타 구조제한', '기초 전 ' + fr.lim + 'F · 수직재 전 ' + fr.lim2 + 'F', '기초 · 지하 수직재 완료 전 허용 지상층' + (R.tags.lim === '기본' ? ' — 기본값 (지하 + 지상 ' + L.td.limTot1 + ' · ' + L.td.limTot2 + '개층)' : ''),
        nums([kfNumF('lim', '기초 전', 'F', pos(S.lim), l1, { step: 1, int: true, min: 1 }), kfNumF('lim2', '수직재 전', 'F', pos(S.lim2), l2, { step: 1, int: true, min: 1 })]),
        '<small>기초<i class="lx"> 전</i></small> ' + fr.lim + 'F<small class="lx"> ·</small> <small>수직재<i class="lx"> 전</i></small> ' + fr.lim2 + 'F');
    }
    var fq = fqOf(fr, A);
    if (fq) { add('fq', fq.k, fq.v, fq.why, { t: 'num', f: fq.f, grid: true }, fq.vh); F.fq.tip = fq.tip; F.fq.badge = fq.badge; }
    var ids = KF_ORD.filter(function (id) { return F[id]; }), hi = ids.slice(0, KF_N), lo = ids.slice(KF_N);
    /* 한 줄 표의 골조 가정 = 맨 아래 한 줄 전체 폭 (값이 길어 2열 칸에 안 들어감) */
    if (lo.indexOf('fq') >= 0) lo = lo.filter(function (id) { return id !== 'fq'; }).concat('fq');
    /* 편집 중에 다른 동작 (예 : 조닝 팀수 버튼) 이 먼저 다시 그리면 고친 값을 버리지 않고 반영 → 곧 다시 계산 (사례를 바꾼 경우는 버림) */
    var pe = kfEd; kfEd = null;
    if (pe && pe.dirty && pe.S === S && pe.box.isConnected) { try { kfSet(pe.id, kfVals(pe.box)); } catch (er) { if (window.console) console.error(er); } }
    kfIt = F;
    function kind(x) { return x.ed ? (x.ed.t === 'go' ? ' go' : ' can') : ''; }
    function icon(x) { return x.ed ? (x.ed.t === 'go' ? KI_GO : KI_ED) : ''; }
    function wrap(x, body, cls) {
      var e = x.ed, tip = (x.tip || x.why) + (e && e.t === 'go' ? ' — ' + e.tip : '');
      if (!e) return '<div class="' + cls + '" title="' + esc(tip) + '">' + body + '</div>';
      return '<button type="button" class="' + cls + '"' + (e.t === 'go' ? ' data-act="kfGo" data-to="' + e.to + '" data-f="' + esc(e.f || '') + '"' : ' data-act="kfEdit"') + ' title="' + esc(tip) + '" aria-label="' + esc(x.k + ' ' + x.v + ' — ' + (e.t === 'go' ? e.tip : '수정')) + '">' + body + '</button>';
    }
    var h = '<div class="kf-hi">' + hi.map(function (id) { var x = F[id]; return '<div class="kc' + kind(x) + '" data-kf="' + id + '">' + wrap(x, '<span class="kk"><span class="kt">' + esc(x.k) + '</span>' + kbH(x.badge) + icon(x) + '</span><b class="kv">' + (x.vh || esc(x.v)) + '</b><span class="kw">' + esc(x.why) + '</span>', 'kc-b') + '</div>'; }).join('') + '</div>';
    if (lo.length) h += '<ul class="kf-lo">' + lo.map(function (id) { var x = F[id]; return '<li class="' + (kind(x) + (id === 'fq' ? ' wide' : '')).trim() + '" data-kf="' + id + '">' + wrap(x, '<span class="kr-k">' + esc(x.k) + kbH(x.badge) + '</span><span class="kr-v">' + esc(x.v) + '</span>' + icon(x), 'kr') + '</li>'; }).join('') + '</ul>';
    $('#kf').innerHTML = h;
    if (kfFoc) { var fb = $('#kf [data-kf="' + kfFoc + '"] button'); kfFoc = null; if (fb) { try { fb.focus({ preventScroll: true }); } catch (er) { fb.focus(); } } }
  }
  /* 칸 편집기 : 선택 (select · 마우스로 고르면 바로 적용) · 숫자 (Enter 적용).
     마우스 · 터치로 열면 목록을 바로 펼치고, 키보드로 열면 펼치지 않는다 (화살표로 고르고 Enter · Esc 가 그대로 듣게) */
  function kfOpen(id, pick) {
    if (kfEd) kfCommit(false);
    var x = kfIt[id], box = $('#kf [data-kf="' + id + '"]');
    if (!x || !x.ed || x.ed.t === 'go' || !box) return;
    var e = x.ed, h = '<span class="kk"><span class="kt">' + esc(x.k) + '</span>' + (e.grid ? kbH(x.badge) : '') + '</span><span class="ke' + (e.t === 'num' && e.f.length > 1 ? ' two' : '') + (e.grid ? ' grid' : '') + '">';
    if (e.t === 'sel') {
      var grp = null, body = '';
      e.opts.forEach(function (o) {
        var gn = e.grp ? e.grp(o[0]) : null;
        if (gn !== grp) { if (grp) body += '</optgroup>'; if (gn) body += '<optgroup label="' + esc(gn) + '">'; grp = gn; }
        body += '<option value="' + esc(o[0]) + '"' + (o[0] === e.cur ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
      });
      if (grp) body += '</optgroup>';
      h += '<select aria-label="' + esc(x.k) + '">' + body + '</select>';
    } else {
      h += e.f.map(function (f) {
        var two = e.f.length > 1;
        return '<label class="ke-n">' + (two ? '<small>' + esc(f.lab) + kbH(f.src) + '</small>' : '') + '<span class="ke-i">' + (f.pre ? '<i class="kp">' + esc(f.pre) + '</i>' : '') + '<input type="number" step="' + f.step + '" min="' + f.min + '" inputmode="' + (f.int ? 'numeric' : 'decimal') + '" value="' + esc(f.cur == null ? '' : f.cur) + '" placeholder="' + esc(f.ph) + '" aria-label="' + esc(two ? x.k + ' · ' + f.lab : x.k) + '"><i>' + esc(f.u) + '</i></span></label>';
      }).join('');
    }
    box.innerHTML = h + '</span>'; box.classList.add('ed'); if (e.grid) box.classList.add('wide');
    var ed = kfEd = { id: id, box: box, kbd: false, dirty: false, S: S }, c0 = box.querySelector('select, input'), sl = box.querySelector('select');
    box.addEventListener('keydown', kfKey);
    box.addEventListener('focusout', kfOut);
    box.addEventListener('input', function () { ed.dirty = true; });
    /* 편집기 안의 글자 · 단위를 눌러도 편집이 닫히지 않게 (단위 · 칸 둘레를 누르면 그 숫자 칸으로) */
    box.addEventListener('mousedown', function (e) {
      if (/^(INPUT|SELECT|OPTION)$/.test(e.target.tagName)) return;
      e.preventDefault(); var w = e.target.closest('.ke-n'), fi = w && w.querySelector('input'); if (fi) fi.focus();
    });
    if (sl) sl.addEventListener('change', function () { ed.dirty = true; if (kfEd === ed && !ed.kbd) kfCommit(true); });
    if (c0) { try { c0.focus({ preventScroll: true }); } catch (er) { c0.focus(); } if (c0.tagName === 'INPUT') c0.select(); }
    if (pick && sl && sl.showPicker) { try { sl.showPicker(); } catch (er) {} }
  }
  function kfKey(e) {
    var ed = kfEd; if (!ed || !ed.box.contains(e.target)) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); kfCancel(); }
    else if (e.key === 'Enter') { e.preventDefault(); kfCommit(true); }
    else if (e.target.tagName === 'SELECT' && !/^(Tab|Shift| |F4)$/.test(e.key) && !e.altKey) ed.kbd = true;   /* 화살표로 고르는 중엔 Enter · 바깥으로 나갈 때 적용 (목록을 펼쳐 고르면 바로) */
  }
  /* 누르고 있는 중인지 (누른 시각 · 손을 떼거나 키를 누르면 0) — 바깥을 누른 채로 포커스가 빠지면 손을 뗀 뒤 = 그 클릭이 처리된 뒤 적용 */
  var kfPtr = 0;
  document.addEventListener('pointerdown', function () { kfPtr = Date.now(); }, true);
  ['pointerup', 'pointercancel', 'keydown'].forEach(function (t) { document.addEventListener(t, function () { kfPtr = 0; }, true); });
  function kfOut(e) {
    var ed = kfEd; if (!ed) return;
    var to = e.relatedTarget; if (to && ed.box.contains(to)) return;
    function commit() { if (kfEd === ed) kfCommit(false); }
    /* 바깥을 눌러 빠진 경우 : 손을 뗀 뒤 그 클릭까지 처리되고 나서 적용 (다른 칸이면 kfOpen 이 이 편집을 적용하고 열고,
       클릭이 다시 그리면 renderKf 가 고친 값을 반영 · 손 뗌을 놓쳐도 2초 뒤 적용). 키보드 (Tab) · 창 전환 : 입력 칸이면 바로, 그 밖은 조금 뒤에 */
    if (kfPtr && Date.now() - kfPtr < 2000) {
      var tm = 0, once = function () { clearTimeout(tm); document.removeEventListener('pointerup', once, true); document.removeEventListener('pointercancel', once, true); setTimeout(commit, 0); };
      tm = setTimeout(once, 2000);
      document.addEventListener('pointerup', once, true); document.addEventListener('pointercancel', once, true);
      return;
    }
    var txt = to && !$('#kf').contains(to) && to.matches && to.matches('input, select, textarea');
    setTimeout(commit, txt ? 0 : 260);
  }
  /* 숫자로 읽을 수 없는 입력 (예 : '-' 만) 은 NaN → 그 칸은 바꾸지 않음 (비운 것 = 자동 과 구분) */
  function kfVals(box) { return $$('select, input', box).map(function (c) { return c.validity && c.validity.badInput ? NaN : c.value; }); }
  function kfCommit(refocus) {
    var ed = kfEd; if (!ed) return; kfEd = null;
    var vals = kfVals(ed.box), ch = false;
    if (ed.dirty && ed.S === S) { try { ch = kfSet(ed.id, vals); } catch (er) { if (window.console) console.error(er); } }
    var a = document.activeElement, kf = $('#kf'), keep = a && !ed.box.contains(a) && kf.contains(a) ? a.closest('[data-kf]') : null;
    var out = a && a !== document.body && !kf.contains(a) ? a : null;
    kfFoc = refocus ? ed.id : keep ? keep.getAttribute('data-kf') : null;
    if (ch) recompute();
    if (ed.box.isConnected && lastR) renderKf(lastR);
    /* 편집 중 바깥의 입력 칸 (예 : 단면 층고) 을 눌렀는데 다시 그리기로 그 칸이 바뀌었으면 같은 칸으로 포커스를 돌려준다 */
    if (out && !out.isConnected) {
      var fh = out.getAttribute('data-floor-h'), na = out.id ? document.getElementById(out.id) : fh ? $('#section input[data-floor-h="' + fh + '"]') : null;
      if (na) { try { na.focus({ preventScroll: true }); } catch (er) { na.focus(); } }
    }
  }
  function kfCancel() { var ed = kfEd; if (!ed) return; kfEd = null; kfFoc = ed.id; if (lastR) renderKf(lastR); }
  /* 값 반영 : 공사 순서 · 지보 · 흙막이는 엔진 규칙에 맞춰 함께 (슬래브 지지 = 역타, 흙막이 없음 = 오픈컷) */
  function kfSet(id, vals) {
    var x = kfIt[id], e = x && x.ed; if (!e) return false;
    if (e.t === 'num') {
      var last = null;
      e.f.forEach(function (f, i) {
        var raw = vals[i], v = raw === '' || raw == null ? null : parseFloat(raw);
        if (v != null) { if (!isFinite(v) || v < f.min) return; if (f.int) v = Math.round(v); if (f.pos && v <= 0) v = null; }
        /* 굴착 깊이 칸 : 깊이 (절대값) 를 받아 자동 깊이와의 차이 (adv.dH) 로 저장 — 지하 층수 · 층고를 바꾸면 깊이가 따라감 */
        if (f.key === 'adv.Habs') { var ha = lastR && lastR.geo ? lastR.geo.Hauto : 0; if (!(ha > 0)) return; var nd = v == null ? null : r1(v - ha); if (nd === 0) nd = null; var od = S.adv && +S.adv.dH ? +S.adv.dH : null; if (od === nd && !(S.adv && S.adv.H)) return; S.adv = S.adv || {}; if (nd == null) delete S.adv.dH; else S.adv.dH = nd; delete S.adv.H; last = 'adv.dH'; return; }
        /* 공법 라이브러리 경로 (골조 가정 v28.*) : S.libOv 에 기록 — 비우면 기본값, 기본과 같으면 덮어쓰기 지움 */
        if (f.lib) {
          var hv = hasOv(f.key);
          if (v == null ? !hv : (hv ? +S.libOv[f.key] === v : Math.abs(v - libDef(f.key)) < 1e-9)) return;
          if (v == null) delOv(f.key); else setLib(f.key, v);
          last = f.key; return;
        }
        var p = f.key.split('.'), o = getP(S, p);
        if ((o == null || o === '' ? '' : String(+o)) === (v == null ? '' : String(v))) return;
        setP(S, p, v); last = f.key;
      });
      if (!last) return false;
      onField(last, getP(S, last.split('.')));
      return true;
    }
    var v = vals[0]; if (v == null || v === '' || v === e.cur) return false;
    if (id === 'sup') {
      if (v === 'SLAB') { S.seq = 'TD'; if (S.wall === 'NONE') S.wall = 'CIP'; }
      else { S.seq = 'BU'; S.support = v; if (v === 'OPEN') { if (S.wall !== 'SCW') S.wall = 'NONE'; } else if (S.wall === 'NONE') S.wall = 'CIP'; }
      onField('seq', S.seq);
    } else if (id === 'wall') {
      S.wall = v;
      if (S.seq !== 'TD') { if (v === 'NONE') S.support = 'OPEN'; else if (v !== 'SCW' && S.support === 'OPEN') S.support = 'ANCHOR'; }
      onField('wall', v);
    } else if (id === 'scw') { S.scw = v === '1'; onField('scw', S.scw); }
    else { var k = { found: 'found', ground: 'ground', core: 'coreSys' }[id]; if (!k) return false; S[k] = v; onField(k, v); }
    return true;
  }
  ACT.kfEdit = function (el, e) { var bx = el.closest('[data-kf]'); if (bx) kfOpen(bx.getAttribute('data-kf'), !!(e && e.detail > 0)); };
  /* 계산값 칸 → 관련 입력으로 이동 (조닝 팀수 · 단면 층고) : 그 자리를 잠깐 표시하고, 층고 칸 · 키보드로 왔으면 포커스 */
  ACT.kfGo = function (el, e) {
    var to = el.getAttribute('data-to'), f = el.getAttribute('data-f'), kbd = !!(e && e.detail === 0);
    /* 대상은 표시 직전에 다시 찾는다 (그 사이 다시 그려져도 새 요소에 표시 · 포커스) */
    function find() {
      var tg = document.getElementById(to), fx = null; if (!tg) return null;
      try { fx = f ? tg.querySelector(f) : null; } catch (er) { fx = null; }
      if (!fx && tg.id === 'sec-sec') fx = tg.querySelector('input.fh');
      return { tg: tg, fx: fx };
    }
    var t0 = find(); if (!t0) return;
    (t0.fx || t0.tg).scrollIntoView({ behavior: 'smooth', block: t0.fx ? 'center' : 'start' });
    if (!t0.fx) return;
    setTimeout(function () {
      var t = find(), fx = t && t.fx; if (!fx) return;
      fx.classList.remove('kf-hl'); void fx.offsetWidth; fx.classList.add('kf-hl');
      setTimeout(function () { fx.classList.remove('kf-hl'); }, 1700);
      var fc = fx.matches('input') ? fx : kbd ? fx.querySelector('button:not(:disabled)') : null;
      if (fc) { try { fc.focus({ preventScroll: true }); } catch (er) { fc.focus(); } }
    }, 420);
  };
  /* 확인 사항 (= 히어로 칩 건수) 과 계산 가정 (엔진 notes) 을 나눠 보여 준다 */
  function renderWarns(R) {
    var w = GK.warns(R), n = R.notes || [];
    $('#warns').innerHTML = w.length ? w.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') : '<li class="none">없음</li>';
    var wc = $('#w-ct'); wc.textContent = w.length ? w.length + '건' : '없음'; wc.classList.toggle('ok', !w.length);
    $('#notes').innerHTML = n.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
    $('#n-ct').textContent = n.length + '건';
    $('#notes-g').hidden = !n.length; $('#wgs').classList.toggle('two', n.length > 0);
    /* 검토 사항 (R.review) : 기본 접힘 · 건수 (주의 건수) 만 — 누르면 펼침 (펼친 상태는 다시 계산해도 유지) */
    var rv = Array.isArray(R.review) ? R.review : [], nw = rv.filter(function (r) { return r && r.lvl === 'warn'; }).length, rg = $('#rv-g');
    if (rg) {
      rg.hidden = !rv.length;
      $('#rv-ct').textContent = rv.length + '건';
      var rw = $('#rv-w'); rw.textContent = nw ? '주의 ' + nw : ''; rw.hidden = !nw;
      var ul = $('#rv-l'); try { ul.innerHTML = rv.length ? GK.reviewList(R) : ''; } catch (e) { ul.innerHTML = ''; }
      rvShow();
    }
    footSync();
  }
  var RV = { open: false };
  function rvShow() {
    var b = $('#rv-g .rv-b'), ul = $('#rv-l'); if (!b || !ul) return;
    ul.hidden = !RV.open; b.setAttribute('aria-expanded', RV.open ? 'true' : 'false');
  }
  ACT.rvTog = function () { RV.open = !RV.open; rvShow(); };
  /* 바닥글 · 인쇄 바닥글 : 해체 개월이 둘 다 0 (빈 칸) 일 때만 '해체공사 별도' */
  function demoIn() { return +(S && S.demo) > 0 || +(S && S.demoB) > 0; }
  function footText() { return '1개월 = 30.4일' + (demoIn() ? '' : ' · 해체공사 별도'); }
  function footSync() { var f = $('#foot'); if (f) f.textContent = footText(); }

  /* ───────── 입력 시트 Zone 수 칸 · 라이브러리 줄 : v2.8 사슬 경로 (일반 RC · SRC 지상 · 순타 지하 바닥) = 체적 Zone 수 adv.zN (1회 타설 ÷ 300㎥),
     옛 경로 (철골 · 강합성 · 벽식 · 사슬 끔) · DC = 면적 / 체적 500㎥ Zone adv.zSpec (뜻 그대로). 둘이 섞이면 (철골 지상 + 순타 지하) 둘 다 보임 */
  function renderZin(R) {
    var v8 = R.frame.v28 || {}, up28 = R.frame.model === 'v28', b28 = !!(R.base && R.base.model === 'v28'), zs = $('#zs-f'), zn = $('#zn-f'), ig = $('#zs-ign');
    libVis(R);
    if (!zs || !zn) return;
    zs.hidden = up28; zn.hidden = !(up28 || b28);
    var zi = $('#in-zN'); if (zi && document.activeElement !== zi) zi.placeholder = up28 ? '자동 (체적 ÷ ' + fmt(v8.lib ? v8.lib.pourV : 300) + '㎥)' : '자동 (지하 Bk : 체적 ÷ ' + fmt(v8.lib ? v8.lib.pourV : 300) + '㎥)';
    var zl = zn.querySelector('label .auto'); if (zl) zl.textContent = up28 ? '예) 3-8:10, B1:20' : '예) B1:20, B2:18';
    var zsl = zs.querySelector('label'); if (zsl && zsl.firstChild) zsl.firstChild.nodeValue = b28 && !up28 ? '바닥 Zone 수 (지상 · 면적) ' : '바닥 Zone 수 (층별) ';
    if (ig) {
      var on = !!v8.zSpecIgnored, old = zbAdv(R).zSpec;
      ig.hidden = !on; ig.title = on ? '옛 Zone 수 \'' + old + '\' (면적 900㎡ Zone) 는 v2.8 사슬 경로에서 쓰지 않음 — 체적 Zone 수는 이 칸' : '';
      ig.innerHTML = on ? '옛 값 (면적 Zone) 무시됨<button type="button" data-act="zsClr" title="옛 Zone 수 (zSpec) 지우기">지우기</button>' : '';
    }
  }
  ACT.zsClr = function () { if (!S.adv || S.adv.zSpec == null) return; delete S.adv.zSpec; if (current) markPreset(''); GK.fill(document, S); recompute(); };

  /* ───────── 입력 시트 자동값 */
  function renderHints(R) {
    var ah = GK.autoHints(R), b = R.basic, fr = R.frame, g = R.geo, td = fr.typ.dc;
    function set(k, t) { $$('[data-auto="' + k + '"]').forEach(function (el) { el.textContent = t; }); }
    set('cov', ah.cov ? '자동 ' + ah.cov + '%' : ''); set('nPH', '자동 ' + ah.nPH);
    set('H', ah.H ? '자동 GL−' + ah.H + (g.dH ? ' → ' + r1(g.H) : '') : ''); set('gDn', b.nB > 0 && g.gDn > 0 ? '× ' + b.nB + ' = ' + fmt(g.gDn) + '㎡' : ''); set('A', ah.A ? '자동 ' + ah.A : ''); set('P', ah.P ? '자동 ' + ah.P : '');
    set('found', '판정 ' + ah.found); set('core', ah.core);
    set('lim', b.seq === 'TD' ? (R.tags.lim === '기본' ? '자동 ' : '') + ah.lim : ''); set('lim2', b.seq === 'TD' ? '자동 ' + Math.max(fr.lim, LIB.td.limTot2 - b.nB) + 'F' : '');
    set('Atyp', '자동 ' + ah.Atyp); set('coreZ', ah.coreZ ? '자동 ' + ah.coreZ : ''); set('mat', '자동 ' + ah.mat); set('fTeams', lastR && lastR.team && lastR.team.f ? '최적 ' + lastR.team.f.opt : '자동 ' + ah.fTeams);
    set('prd', ah.prd ? '자동 ' + ah.prd : ''); set('pile', ah.pile ? '추정 ' + ah.pile : '');
    set('dc', fr.dc ? '적용 중' : '미적용'); set('coreA', td ? '자동 ' + fmt(td.Ac) : ''); set('colN', td ? '자동 ' + td.nCol : '');
    /* 골조 · 지하 사이클 방식 : 이번 계산에 쓴 경로 · DC 수직재 인원 빈 칸 = 철근팀 인원 (없으면 v2.8 20인) */
    set('frChain', { v28: 'v2.8 사슬', old: '옛 식', dc: 'DC 사이클' }[fr.model] || '');
    var bs = R.base || {}; set('bChain', bs.td ? '역타' : bs.partial ? '부분 지하' : b.nB > 0 ? (bs.model === 'v28' ? 'v2.8 사슬' : '옛 식') : '');
    var cv2 = $('#in-dcCrewV'); if (cv2) cv2.placeholder = +(S.adv && S.adv.crew) > 0 ? String(+S.adv.crew) : '20';
    var cv = $('#in-cov'); if (cv && document.activeElement !== cv) cv.placeholder = ah.cov || '자동';
    for (var i = 0; i < 4; i++) $$('[data-dp="' + i + '"]').forEach(function (el) { el.textContent = 'GL−' + r1(g.z[i + 1]); });
    $$('[data-dp="4"]').forEach(function (el) { el.textContent = 'GL−' + r1(g.z[4]) + ' 이하'; });
    var gb = GK.groundBar(R); $('#gbar').innerHTML = gb.bar; $('#gcap').innerHTML = '<b>' + esc(gb.layers) + '</b><br>' + esc(gb.depth) + (gb.desc ? '<br>' + esc(gb.desc) : '');
    $('#in-gfa').value = ah.gfa ? fmt(ah.gfa) + ' ㎡' : '';
  }

  /* ───────── 저장 · 불러오기 · PDF (맨 위 줄 오른쪽 #tb-act)
     파일 = JSON : 앱 이름 · 형식 · 버전 · 저장 시각 · 결과 요약 (총 공기 · 대공종 합계 · 마일스톤) + 입력 S 전체 (adv · libOv · 코어 · 팀수 · 사이클 편집).
     불러올 때는 입력 (inp) 과 사례 표시 (preset) 만 쓴다. 보관함 = 이 브라우저 localStorage (키 따로 · 최대 30개 · 최신순 · 같은 이름은 덮어씀) */
  var FILE_APP = '공기산정 에이전트', FILE_FMT = 'gonggi-agent/o7', FILE_VER = 1, KEEP_KEY = 'gonggi-agent-o7-saves', KEEP_MAX = 30;
  var FA = { armT: null, toastT: null };
  var FICO = {
    save: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.6v7.6M4.9 7.2 8 10.3l3.1-3.1M2.8 12.9h10.4"/></svg>',
    open: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.4 12.6V3.6h4l1.4 1.6h5.8v7.4z"/><path d="M8 11V7.4M6.4 8.9 8 7.3l1.6 1.6"/></svg>',
    keep: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.3 2.6h7.4v10.8L8 10.9l-3.7 2.5z"/></svg>',
    pdf: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.6 6V2.6h6.8V6M4.6 11.6H2.6V6h10.8v5.6h-2"/><path d="M4.6 9.6h6.8v3.8H4.6z"/></svg>'
  };
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function dDay(d) { return d.getFullYear() + '.' + pad2(d.getMonth() + 1) + '.' + pad2(d.getDate()); }
  function dTime(d) { return dDay(d) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
  function hasR() { return !!(lastR && isFinite(lastR.total)); }
  function isPreset(k) { return typeof k === 'string' && Object.prototype.hasOwnProperty.call(PRESETS, k); }
  function presetName(k) { var b = isPreset(k) && $('#presets [data-p="' + k + '"]'); return b ? b.getAttribute('title') || '' : ''; }
  function initFile() {
    var bar = $('#tb-act'); if (!bar || $('#fa-file')) return;
    bar.innerHTML = '<div class="fa" role="group" aria-label="저장 · 불러오기">' +
      '<button type="button" class="fa-b" data-act="fSave" title="지금 입력 · 검토 상태를 파일 (JSON) 로 내려받기">' + FICO.save + '<span>저장</span></button>' +
      '<button type="button" class="fa-b" data-act="fOpen" title="저장한 파일 (JSON) 불러오기">' + FICO.open + '<span>불러오기</span></button>' +
      '<button type="button" class="fa-b" data-act="fList" aria-haspopup="dialog" aria-expanded="false" aria-controls="fa-pop" title="이 브라우저에 이름 붙여 보관 · 불러오기 · 삭제">' + FICO.keep + '<span>보관함</span><b class="fa-n" id="fa-n" hidden></b></button>' +
      '</div><button type="button" class="fa-b fa-pdf" data-act="fPdf" title="A4 인쇄 · PDF 저장 (요약 세로 · Master Schedule · 단면 · 조닝 가로)">' + FICO.pdf + '<span>PDF</span></button>' +
      '<input type="file" id="fa-file" accept=".json,application/json" data-actc="fFile" hidden tabindex="-1" aria-hidden="true">' +
      '<div class="fa-pop" id="fa-pop" role="dialog" aria-label="보관함" hidden></div>';
    var t = document.createElement('div'); t.className = 'fa-toast'; t.id = 'fa-toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); t.hidden = true;
    document.body.appendChild(t);
    /* 보관함 창 : 바깥 누르기 · Esc = 닫기 */
    document.addEventListener('pointerdown', function (e) { var p = $('#fa-pop'); if (!p || p.hidden || p.contains(e.target) || (e.target.closest && e.target.closest('[data-act="fList"]'))) return; popClose(false); }, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#fa-pop') && !$('#fa-pop').hidden) { e.stopPropagation(); popClose(true); } }, true);
    keepCount();
  }
  function toast(msg, err) {
    var t = $('#fa-toast'); if (!t) return;
    t.textContent = msg; t.classList.toggle('er', !!err); t.hidden = false; t.classList.remove('fa-on'); void t.offsetWidth; t.classList.add('fa-on');
    clearTimeout(FA.toastT);
    FA.toastT = setTimeout(function () { t.classList.remove('fa-on'); FA.toastT = setTimeout(function () { t.hidden = true; }, 240); }, err ? 3800 : 2600);
  }
  /* 결과 요약 (파일 안 참고용 — 불러올 때는 다시 계산) */
  function fileSum() {
    if (!hasR()) return null;
    var R = lastR, o = { name: S.name || '', total: r2(R.total), text: m2(R.total) + '개월' };
    try { o.title = GK.title(R); } catch (e) {}
    try { var g = GK.cpGroups(R); o.groups = {}; Object.keys(g).forEach(function (k) { o.groups[k] = r2(g[k]); }); } catch (e) {}
    try { o.milestones = GK.milestones(R).map(function (x) { return { k: x.k, m: r2(x.m) }; }); } catch (e) {}
    if (R.sens && isFinite(R.sens.lo) && isFinite(R.sens.hi)) o.range = { lo: r2(R.sens.lo), hi: r2(R.sens.hi) };
    if (S.start) o.start = S.start;
    return o;
  }
  function fileName(d) {
    var nm = String(S.name || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || '프로젝트';
    return '공기산정_' + nm + '_' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' + pad2(d.getHours()) + pad2(d.getMinutes()) + '.json';
  }
  /* 내려받기 : 실행 환경의 downloads 기능이 있으면 그것으로, 없으면 링크 내려받기 */
  function fileDown(name, text) {
    var blob = new Blob([text], { type: 'application/json' });
    if (downloads && downloads.save) return downloads.save({ filename: name, data: blob });
    return new Promise(function (res) {
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = name; a.rel = 'noopener'; a.style.display = 'none';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
      res();
    });
  }
  ACT.fSave = function () {
    popClose(false);
    var d = new Date(), name = fileName(d), txt;
    try { txt = JSON.stringify({ app: FILE_APP, format: FILE_FMT, version: FILE_VER, savedAt: d.toISOString(), preset: current || '', summary: fileSum(), inp: S }, null, 2); } catch (e) { toast('저장하지 못했습니다', 1); return; }
    fileDown(name, txt).then(function () { toast('저장 : ' + name); }, function (e) { toast(e && e.code === 'declined' ? '저장을 취소했습니다' : '저장하지 못했습니다', 1); });
  };
  ACT.fOpen = function () { popClose(false); var f = $('#fa-file'); if (f) { f.value = ''; f.click(); } };
  ACTC.fFile = function (el) {
    var f = el.files && el.files[0]; if (!f) return;
    if (f.size > 5e6) { el.value = ''; toast('파일이 너무 큽니다 (5MB 이하)', 1); return; }
    var rd = new FileReader();
    rd.onload = function () { el.value = ''; fileApply(String(rd.result || ''), f.name); };
    rd.onerror = function () { el.value = ''; toast('파일을 읽지 못했습니다', 1); };
    rd.readAsText(f);
  };
  /* 형식 확인 : 이 앱이 저장한 JSON (앱 이름 또는 형식) + 입력 객체 */
  function fileParse(txt) {
    var o; try { o = JSON.parse(String(txt).replace(/^\uFEFF/, '')); } catch (e) { return null; }
    if (!o || typeof o !== 'object' || Array.isArray(o) || (o.format !== FILE_FMT && o.app !== FILE_APP)) return null;
    return o.inp && typeof o.inp === 'object' && !Array.isArray(o.inp) ? o : null;
  }
  function fileApply(txt, fname) {
    var o = fileParse(txt);
    if (!o) { toast('공기산정 저장 파일 (JSON) 이 아닙니다', 1); return; }
    if (!stateLoad(o.inp, o.preset)) { toast('불러오지 못했습니다 — 파일 내용을 확인하세요', 1); return; }
    toast('불러옴 : ' + (S.name || fname) + (hasR() ? ' · ' + m2(lastR.total) + '개월' : ''));
  }
  /* 불러온 입력 다듬기 : 코어 목록은 객체만 (최대 CORE_MAX) — 손으로 고친 파일에서도 판 그리기가 깨지지 않게 */
  function fileSane(inp) {
    var a = inp.adv;
    if (a && typeof a === 'object' && !Array.isArray(a) && a.cores != null) {
      var cs = Array.isArray(a.cores) ? a.cores.filter(function (c) { return c && typeof c === 'object' && !Array.isArray(c); }).slice(0, CORE_MAX) : [];
      if (cs.length) a.cores = cs; else delete a.cores;
    }
    return inp;
  }
  /* 입력 교체 → 화면 · 시트 채우고 다시 계산 (사례 표시는 저장 당시 그대로). 계산 오류가 나는 입력이면 앞 상태로 되돌리고 false */
  function stateLoad(inp, preset) {
    var s; try { s = norm(fileSane(GK.clone(inp))); } catch (e) { return false; }
    var s0 = S, p0 = current, g0 = lastGround, r0 = lastR;
    S = s; lastGround = S.ground;
    markPreset(isPreset(preset) ? preset : '');
    GK.fill(document, S); syncUI(); recompute();
    if (lastR === r0 && /^계산 오류/.test($('#warns').textContent)) { S = s0; lastGround = g0; markPreset(p0); GK.fill(document, S); syncUI(); recompute(); return false; }
    return true;
  }
  /* 보관함 (이 브라우저) */
  function keepRead() {
    try { var a = JSON.parse(localStorage.getItem(KEEP_KEY) || '[]'); return Array.isArray(a) ? a.filter(function (x) { return x && x.id && x.inp && typeof x.inp === 'object'; }) : []; } catch (e) { return []; }
  }
  function keepWrite(a) { try { localStorage.setItem(KEEP_KEY, JSON.stringify(a.slice(0, KEEP_MAX))); return true; } catch (e) { return false; } }
  function keepCount(a) { var n = $('#fa-n'); if (!n) return; a = a || keepRead(); n.textContent = a.length || ''; n.hidden = !a.length; }
  function keepDraw(focus) {
    var p = $('#fa-pop'), a = keepRead(); keepCount(a);
    if (!p || p.hidden) return;
    var ni = $('#fp-name'), val = ni ? ni.value : (S.name || '');
    p.innerHTML = '<div class="fp-h"><b>보관함</b><span>이 브라우저 · <i>' + a.length + '</i> / ' + KEEP_MAX + '</span></div>' +
      '<div class="fp-new"><input id="fp-name" type="text" maxlength="60" autocomplete="off" spellcheck="false" placeholder="보관할 이름" aria-label="보관할 이름"><button type="button" class="fp-k" data-act="fKeep">지금 상태 보관</button></div>' +
      (a.length ? '<ul class="fp-l">' + a.map(function (x) {
        var d = new Date(x.at), when = isFinite(d) ? dTime(d) : '', pn = presetName(x.preset);
        return '<li><button type="button" class="fp-o" data-act="fGet" data-id="' + esc(x.id) + '" title="불러오기 : ' + esc(x.name) + '"><b>' + esc(x.name) + '</b><span><i>' + esc(when) + '</i>' + (pn ? ' · ' + esc(pn) : '') + '</span>' +
          (isFinite(x.total) && x.total != null ? '<em>' + m2(x.total) + '<small>개월</small></em>' : '') + '</button>' +
          '<button type="button" class="fp-x" data-act="fDel" data-id="' + esc(x.id) + '" title="삭제" aria-label="' + esc(x.name) + ' 삭제">×</button></li>';
      }).join('') + '</ul>' : '<p class="fp-e">보관한 검토가 없습니다</p>');
    ni = $('#fp-name'); ni.value = val;
    ni.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); ACT.fKeep(); } });
    if (focus === 'name' || (focus === 'auto' && window.matchMedia && matchMedia('(hover: hover)').matches)) { try { ni.focus({ preventScroll: true }); } catch (er) { ni.focus(); } ni.select(); }
    else if (focus === 'list') { var f = $('#fa-pop .fp-o') || ni; try { f.focus({ preventScroll: true }); } catch (er) { f.focus(); } }
  }
  function popClose(fb) {
    var p = $('#fa-pop'); if (!p || p.hidden) return;
    p.hidden = true; var b = $('[data-act="fList"]');
    if (b) { b.setAttribute('aria-expanded', 'false'); if (fb) b.focus(); }
  }
  ACT.fList = function (el) {
    var p = $('#fa-pop'); if (!p) return;
    if (!p.hidden) { popClose(true); return; }
    p.innerHTML = ''; p.hidden = false; el.setAttribute('aria-expanded', 'true'); keepDraw('auto');
  };
  ACT.fKeep = function () {
    var ni = $('#fp-name'), nm = String(ni && ni.value || '').replace(/\s+/g, ' ').trim().slice(0, 60) || S.name || '이름 없음';
    var a = keepRead(), had = a.some(function (x) { return x.name === nm; }), rest = a.filter(function (x) { return x.name !== nm; }), cut = rest.length >= KEEP_MAX;
    rest.unshift({ id: 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: nm, at: new Date().toISOString(), total: hasR() ? r2(lastR.total) : null, preset: current || '', inp: GK.clone(S) });
    if (!keepWrite(rest)) { toast('브라우저 저장 공간이 부족합니다 — 파일로 저장하세요', 1); return; }
    if (ni) ni.value = nm;
    keepDraw('list'); toast((had ? '덮어씀 : ' : '보관 : ') + nm + (cut ? ' · 가장 오래된 1개 정리' : ''));
  };
  ACT.fGet = function (el) {
    var id = el.getAttribute('data-id'), x = keepRead().filter(function (q) { return q.id === id; })[0];
    if (!x) { keepDraw('auto'); return; }
    popClose(false);
    if (!stateLoad(x.inp, x.preset)) { toast('불러오지 못했습니다', 1); return; }
    toast('불러옴 : ' + x.name + (hasR() ? ' · ' + m2(lastR.total) + '개월' : ''));
  };
  /* 삭제 = 두 번 누르기 (첫 번째에 '삭제' 로 바뀜, 3초 안에 한 번 더) */
  ACT.fDel = function (el) {
    var id = el.getAttribute('data-id');
    if (!el.classList.contains('arm')) {
      $$('#fa-pop .fp-x.arm').forEach(function (b) { b.classList.remove('arm'); b.textContent = '×'; });
      el.classList.add('arm'); el.textContent = '삭제'; clearTimeout(FA.armT);
      FA.armT = setTimeout(function () { if (el.isConnected) { el.classList.remove('arm'); el.textContent = '×'; } }, 3000);
      return;
    }
    var a = keepRead(), x = a.filter(function (q) { return q.id === id; })[0];
    /* 다시 그린 뒤 초점 = 이름 칸 (터치 기기는 자판이 뜨지 않게 초점 없이) */
    keepWrite(a.filter(function (q) { return q.id !== id; })); keepDraw('auto');
    if (x) toast('삭제 : ' + x.name);
  };

  /* ───────── PDF (인쇄) : A4 — 1쪽 요약 (세로) · Master Schedule · 가정 단면 · 조닝 (가로, 한 판에 한 쪽).
     beforeprint (또는 print 미디어) → html.pr + 1쪽 머리 · 주요 가정사항 · 확인 사항을 1쪽으로 옮김 → 도면을 인쇄 폭으로 다시 그리고 넘치면 zoom.
     afterprint → 제자리 · 화면 폭으로 다시 그림 */
  var PR = { on: false, fired: false, mv: [], title: null, y: 0 }, MM = 96 / 25.4, PG = { ph: 272, lh: 185 };
  ACT.fPdf = function () {
    popClose(false); PR.fired = false;
    try { window.print(); } catch (e) {}
    /* 인쇄 창이 막힌 환경 (미리보기 틀 등) 이면 안내 */
    setTimeout(function () { if (!PR.fired) toast('이 화면에서는 인쇄 창이 열리지 않습니다 — 파일을 브라우저에서 열어 주세요', 1); }, 900);
  };
  function cssQ(s) { return '"' + String(s).replace(/[\\"]/g, '\\$&').replace(/[\r\n]+/g, ' ') + '"'; }
  function prTitle(R) {
    var cond = [], pn = presetName(current);
    if (R) {
      try { cond.push(GK.title(R)); } catch (e) {}
      if (R.ground && R.ground.name) cond.push('지반 ' + R.ground.name.replace(/ 입력$/, '') + (R.ground.assumed ? ' (가정)' : ''));
      if (R.basic && R.basic.nB > 0 && GE.WALL_N[R.basic.wall]) cond.push(GE.WALL_N[R.basic.wall].replace(/ \(.*\)$/, '') + ' · ' + (GE.SUP_N[R.basic.sup] || '').replace(/ \(.*\)$/, ''));
      if (R.inp && R.inp.start) cond.push(GK.ym(GK.addM(R.inp.start, 0)) + ' 착공');
    }
    /* 한 줄 요약 (GK.summaryLines : 적정 공사기간 · 범위 + 최대 주공정) — 1쪽 머리에만, 화면에는 없음 */
    var sm = '';
    if (R) { try { var sl = GK.summaryLines(R); sm = [sl[0], sl[2]].filter(Boolean).join('<i class="pr-sep">·</i>'); } catch (e) { sm = ''; } }
    return '<div class="pr-t1"><span>공기산정 에이전트 · 공기 검토</span><span>검토일 <b class="n">' + dDay(new Date()) + '</b></span></div>' +
      '<h1 class="pr-nm">' + esc(S.name || '프로젝트') + '</h1>' +
      '<p class="pr-cd">' + (pn ? '<b>' + esc(pn) + '</b>' : '') + esc(cond.join(' · ')) + '</p>' +
      (sm ? '<p class="pr-sm">' + sm + '</p>' : '');
  }
  function prOn() {
    PR.fired = true;
    if (PR.on) return; PR.on = true;
    try {
      popClose(false); hideTip();
      PR.y = window.pageYOffset || 0;   /* 인쇄 배치로 문서 높이가 바뀌어도 끝나면 보던 자리로 */
      /* PDF 로 저장할 때 기본 파일 이름 = 문서 제목 → '공기산정_<프로젝트명>_<YYYYMMDD>' (끝나면 되돌림) */
      var d = new Date(); PR.title = document.title;
      document.title = '공기산정_' + String(S.name || '프로젝트').replace(/[\\/:*?"<>|]+/g, ' ').trim() + '_' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
      var st = document.getElementById('pr-pg');
      /* 본문 맨 끝에 (본 스타일 <style> 이 body 안에 있어, head 에 두면 @page 꼬리 (해체공사 별도) 를 덮어쓰지 못함) */
      if (!st) { st = document.createElement('style'); st.id = 'pr-pg'; document.body.appendChild(st); }
      st.textContent = '@page { @top-left { content: ' + cssQ('공기산정 · ' + (S.name || '프로젝트')) + '; } @top-right { content: ' + cssQ((hasR() ? '총 공기 ' + m2(lastR.total) + '개월 · ' : '') + dDay(new Date())) + '; } @bottom-left { content: ' + cssQ('공기산정 에이전트 · ' + footText()) + '; } }' +
        ' @page :first { @top-left { content: none; } @top-right { content: none; } }';
      var tb = $('#tbar'), t = document.createElement('header'); t.id = 'pr-t'; t.className = 'pr-t'; t.innerHTML = prTitle(lastR);
      tb.parentNode.insertBefore(t, tb);
      var ms = $('.t-ms'), hold = document.createElement('div'); hold.id = 'pr-x'; hold.className = 'pr-x';
      ms.parentNode.insertBefore(hold, ms.nextSibling);
      PR.mv = [];
      ['sec-kf', 'sec-warn'].forEach(function (id) { var el = document.getElementById(id); if (!el) return; PR.mv.push({ el: el, p: el.parentNode, n: el.nextSibling }); hold.appendChild(el); });
      /* 계산 전 (입력 대기) 이면 1쪽만 — 빈 가로 판은 내지 않음 */
      document.documentElement.classList.add('pr'); document.documentElement.classList.toggle('pr-0', !hasR());
      prFit();
    } catch (e) { if (window.console) console.error(e); }
  }
  function prOff() {
    if (!PR.on) return; PR.on = false;
    try {
      document.documentElement.classList.remove('pr', 'pr-0'); if (!document.documentElement.className) document.documentElement.removeAttribute('class');
      if (PR.title != null) { document.title = PR.title; PR.title = null; }
      PR.mv.slice().reverse().forEach(function (m) { if (m.n && m.n.parentNode === m.p) m.p.insertBefore(m.el, m.n); else m.p.appendChild(m.el); });
      PR.mv = [];
      ['pr-t', 'pr-x'].forEach(function (id) { var el = document.getElementById(id); if (el) el.remove(); });
      $$('[data-prz]').concat($('.wrap')).forEach(function (el) { el.style.removeProperty('--prz'); el.style.removeProperty('--prz1'); el.removeAttribute('data-prz'); if (!el.getAttribute('style')) el.removeAttribute('style'); });
      prDraw([renderMs, renderGantt, renderSection, renderZone]);
      window.scrollTo(window.pageXOffset || 0, PR.y || 0);
    } catch (e) { if (window.console) console.error(e); }
  }
  function prDraw(fns) { if (!lastR) return; fns.forEach(function (fn) { try { fn(lastR); } catch (e) { if (window.console) console.error(e); } }); widths.ms = $('#ms-flow').clientWidth; }
  /* 1쪽 : 제목 ~ 확인 사항이 한 쪽에 들어가게 (확인 사항이 길면 주요 가정사항까지만 맞추고 이어서 다음 쪽). 가로 판 : 한 쪽 높이에 맞춰 zoom (최소 배율까지) */
  function prFit() {
    var wrap = $('.wrap'), AP = PG.ph * MM - 10, AL = PG.lh * MM - 6, z = 1, Z1 = 0.74;
    for (var i = 0; i < 3; i++) {
      wrap.style.setProperty('--prz1', String(z)); prDraw([renderMs]);
      var top = $('#pr-t').getBoundingClientRect().top, b = $('#sec-kf') || $('.t-ms'), hAll = $('#pr-x').getBoundingClientRect().bottom - top;
      var h = hAll * Z1 / z <= AP ? hAll : b.getBoundingClientRect().bottom - top;
      if (h <= AP || z <= Z1) break;
      z = Math.max(Z1, Math.floor(z * AP / h * 1000) / 1000);
    }
    prFitTile('#sec-gantt', renderGantt, AL, 0.55, 1.2);
    prFitTile('#sec-sec', renderSection, AL, 0.6, 1);
    prFitTile('#sec-zone', renderZone, AL, 0.6, 1);
  }
  /* 넘치면 줄이고 (zmin 까지), 공종이 적어 쪽이 많이 남으면 조금 키움 (zmax — Master Schedule 만) */
  function prFitTile(sel, fn, AH, zmin, zmax) {
    var el = $(sel), z = 1; if (!el) return;
    el.setAttribute('data-prz', '');
    for (var i = 0; i < 4; i++) {
      el.style.setProperty('--prz', String(z)); prDraw([fn]);
      var h = el.getBoundingClientRect().height, nz;
      if (h > AH) { if (z <= zmin) break; nz = Math.max(zmin, Math.floor(z * AH / h * 1000) / 1000); }
      else if (i === 0 && zmax > 1 && h < AH * 0.9) nz = Math.min(zmax, Math.floor(z * AH / h * 0.97 * 1000) / 1000);
      else break;
      z = nz;
    }
  }
  function initPrint() {
    window.addEventListener('beforeprint', prOn);
    window.addEventListener('afterprint', prOff);
    var mq = window.matchMedia && matchMedia('print'), f = function (e) { if (e.matches) prOn(); else prOff(); };
    if (mq) { if (mq.addEventListener) mq.addEventListener('change', f); else if (mq.addListener) mq.addListener(f); }
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
    fitHero();
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
    $$('#libtbl input').forEach(function (el) { el.addEventListener('input', function () { readLib(el, false); }); el.addEventListener('change', function () { readLib(el, true); }); });
    $('#lib-reset').addEventListener('click', function () { delete S.libOv; recompute(); });
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target : null; if (!t) return;
      var ac = t.closest('[data-act]'); if (ac && ACT[ac.getAttribute('data-act')]) { ACT[ac.getAttribute('data-act')](ac, e); return; }
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
    initFile(); initPrint();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.__agent = { get R() { return lastR; }, loadPreset: loadPreset, recompute: recompute, get state() { return S; } };
})();

