/* 공기산정 UI 공용 키트 (GK) — 렌더러는 HTML/SVG 문자열을 돌려주고, 각 화면 버전이 원하는 자리에 넣는다.
   필요한 CSS 토큰 : --cp --cp-soft --cp-ink --slate --slate-2 --slate-3 --sheet --sheet-2 --ink --ink-2 --ink-3 --rule --rule-2 --navy
                    --warn --warn-soft --ok --ok-soft --accent --accent-soft --soil --wsoil --wrock --srock --hrock --gwl */
(function (root) {
  'use strict';
  var GE = root.GE, r1 = GE.r1, r2 = GE.r2, fmt = GE.fmt, D = GE.D;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function m1(x) { return isFinite(x) ? (Math.round(x * 10 + 1e-9) / 10).toFixed(1) : '-'; }
  function m2(x) { return isFinite(x) ? (Math.round(x * 100 + 1e-9) / 100).toFixed(2) : '-'; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var SEQ_N = { BU: '순타', TD: '역타' };

  /* ── 입력 기본값 · 사례 */
  var BLANK = { name: '새 프로젝트', use: 'office', site: '', bldg: '', gfaUp: '', aDn: '', nB: 3, nUp: 15, nPH: '', ground: 'AUTO', strata: [null, null, null, null], gwl: '', seq: 'BU', tdBase: 0, wall: 'CIP', support: 'ANCHOR', scw: false, found: 'AUTO', geo: 0,
    struct: 'RC', pt: false, coreSys: 'AUTO', lim: '', lim2: '', mob: 1.0, fin: 8.0, tc: 2.0, rExt: 0.702, rRC: 0.585, hours: 8, link: false, start: '', adv: {} };
  var PRESETS = { blank: BLANK };
  GE.REFS.forEach(function (r) { if (r.inp) PRESETS[r.key] = r.inp; });
  var PRESET_N = { refA: '사례 A · 역타 업무', refB: '사례 B · 순타 앵커', refC: '사례 C · 오픈컷 DC', blank: '새 프로젝트' };
  var BASE_OPTS = [[-2, 'B2'], [-1, 'B1'], [0, '1F'], [1, '2F'], [2, '3F']];
  function store(key) {
    return {
      load: function () { try { var s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch (e) { return null; } },
      save: function (o) { try { localStorage.setItem(key, JSON.stringify(o)); } catch (e) { /* 저장 불가 환경 */ } }
    };
  }

  /* ── 날짜 : 정수 개월 = 달력 월, 소수부 = 30.4일 환산 */
  function addM(start, m) {
    if (!start || !/^\d{4}-\d{2}$/.test(start)) return null;
    var y = +start.slice(0, 4), mo = +start.slice(5, 7) - 1, w = Math.floor(m + 1e-9), d = new Date(y, mo + w, 1);
    d.setDate(d.getDate() + Math.round((m - w) * D)); return d;
  }
  function ym(d) { return d ? d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') : '-'; }
  function yy(d) { return d ? String(d.getFullYear()).slice(2) + '.' + String(d.getMonth() + 1).padStart(2, '0') : ''; }
  function when(R, m) { var d = addM(R.inp.start, m); return d ? ym(d) : 'M+' + m1(m); }

  function svgEl(w, h, inner, label) { return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(label) + '" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>'; }
  function txt(x, y, s, o) { o = o || {}; return '<text x="' + r1(x) + '" y="' + r1(y) + '" font-size="' + (o.fs || 11) + '" fill="' + (o.fill || 'var(--ink-2)') + '"' + (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') + (o.w ? ' font-weight="' + o.w + '"' : '') + (o.cls ? ' class="' + o.cls + '"' : '') + '>' + esc(s) + '</text>'; }

  /* ── 공종 이름 */
  function shortName(a, R) {
    var b = R.basic;
    switch (a.id) {
      case 'mob': return 'MOB';
      case 'demo': return '지상 해체';
      case 'demoB': return '지하 해체';
      case 'wall': return '흙막이 · ' + ({ CIP: 'CIP', SW: 'Slurry Wall', HP: 'H-Pile', SCW: 'SCW', SP: 'Sheet Pile' }[b.wall] || '');
      case 'scw': return '차수 SCW';
      case 'prd': return 'PRD · SPS 기둥';
      case 'geo': return '지열';
      case 'pile': return R.fType === 'PHC' ? 'PHC 파일' : '현장타설말뚝';
      case 'exc1': return '1차 터파기';
      case 'f1': return R.tdBase.name + ' 슬래브 (기준층)';
      case 'exc': return b.seq === 'TD' ? '지하 터파기 · 슬래브' : '터파기' + (R.exc.ns ? ' · ' + ({ ANCHOR: '앵커', STRUT: '스트럿', RAKER: '레이커' }[b.sup]) + ' ' + R.exc.ns + '단' : '');
      case 'found': return '기초';
      case 'base': return '지하골조';
      case 'vert': return '지하 수직재';
      case 'frameA': return '지상골조 (기초 전)';
      case 'tdwait': return '지상 착수 준비';
      case 'frame': return a.name.indexOf('기초 완료 후') >= 0 ? '지상골조 (기초 후)' : (a.name.indexOf('수직재 완료 후') >= 0 ? '지상골조 (수직재 후)' : '지상골조');
      case 'core': return '코어 선행';
      case 'fin': return '마감';
      case 'tc': return 'T&C';
    }
    return a.name;
  }
  function cpShort(c, R) {
    if (c.id === 'exc' && R.basic.seq === 'TD') return '지하 터파기';
    if (c.id === 'f1') return R.tdBase.name + ' 슬래브';
    return GE.CP_SHORT[c.id] || c.name;
  }
  function cpParts(R) { return R.cpLine.filter(function (c) { return c.d > 0.005; }).map(function (c) { return { id: c.id, label: cpShort(c, R), d: c.d, e: c.e }; }); }
  function cpLineHTML(R) { return '<b>C.P</b> : ' + esc(cpParts(R).map(function (p) { return p.label + ' ' + m1(p.d); }).join(' + ')) + ' = <b>' + m2(R.total) + '개월</b>'; }
  /* C.P를 대공종 4묶음으로 (준비 · 토목 · 골조 · 마감) */
  var GROUP_OF = { mob: '준비', demo: '준비', demoB: '준비', wall: '토목', scw: '토목', prd: '토목', geo: '토목', pile: '토목', exc1: '토목', f1: '토목', exc: '토목', found: '골조', base: '골조', vert: '골조', tdwait: '골조', frame: '골조', fin: '마감', tc: '마감' };
  function cpGroups(R) {
    var o = { 준비: 0, 토목: 0, 골조: 0, 마감: 0 };
    R.cpLine.forEach(function (c) { o[GROUP_OF[c.id] || '골조'] += c.d; });
    return o;
  }
  function milestones(R) {
    var ms = [];
    if (R.basic.seq === 'TD') ms.push({ k: R.tdBase.name + ' 슬래브', m: R.T_1F });
    ms.push({ k: '기초 완료', m: R.T_F }, { k: '골조 완료', m: R.frameEnd }, { k: '준공', m: R.total });
    return ms;
  }
  function warns(R) {
    var w = R.warn.slice();
    if (!R.geo.site || !R.geo.bldg) w.push('대지면적 · 건축면적을 입력하면 굴착 면적 · 흙막이 연장 · 기초 물량이 산정됩니다.');
    if (!R.geo.gUp) w.push('지상 연면적이 없어 건축면적을 기준층 면적으로 사용했습니다.');
    return w;
  }
  function nearest(R) { return GE.similarity(R).filter(function (s) { return s.score != null; }).sort(function (a, b) { return b.score - a.score; })[0] || null; }
  function title(R) { var b = R.basic; return GE.USE_H[b.use].name + ' · 지하 ' + b.nB + '층 / 지상 ' + b.nUp + '층' + (b.nPH ? ' + 옥탑 ' + b.nPH : '') + ' · ' + SEQ_N[b.seq] + ' · ' + GE.STRUCT_N[b.struct].replace(/ \(.*\)$/, ''); }

  /* ── Master Schedule 바차트 */
  var ORDER = ['mob', 'demo', 'demoB', 'wall', 'scw', 'prd', 'geo', 'pile', 'exc1', 'f1', 'exc', 'found', 'base', 'vert', 'tdwait', 'frameA', 'frame', 'core', 'fin', 'tc'];
  var CIV = ['wall', 'scw', 'prd', 'geo', 'pile', 'exc1', 'f1', 'exc'], PRE = ['mob', 'demo', 'demoB'];
  function ganttActs(R) {
    /* 토목 공종은 착수 순서대로 (순타 = 굴착 후 지열 · 바닥 파일, 역타 = 지열 · PRD 선행) */
    var gkey = function (a) { var i = ORDER.indexOf(a.id); if (i < 0) i = 99; return CIV.indexOf(a.id) >= 0 ? [1, a.s, i] : [PRE.indexOf(a.id) >= 0 ? 0 : 2, i, a.s]; };
    return R.acts.slice().sort(function (a, b) { var p = gkey(a), q = gkey(b); return p[0] - q[0] || p[1] - q[1] || p[2] - q[2]; });
  }
  function gantt(R, W, o) {
    o = o || {}; W = Math.max(o.minW || 600, Math.floor(W || 820));
    var acts = ganttActs(R);
    if (o.cpOnly) acts = acts.filter(function (a) { return a.cp; });
    var LW = o.labelW || (W < 720 ? 122 : 176), PR = 40, top = 30, rh = o.rowH || 25, bh = o.barH || 13;
    var Mmax = Math.ceil(R.total + 0.6), x = function (m) { return LW + m / Mmax * (W - LW - PR); };
    var rowsH = acts.length * rh, Hh = top + rowsH + 70, g = '', s = '';
    var pxM = (W - LW - PR) / Mmax, step = pxM > 22 ? 3 : (pxM > 11 ? 6 : 12);
    var start = R.inp.start;
    for (var m = 0; m <= Mmax; m++) {
      var X = x(m), major = m % step === 0;
      g += '<line x1="' + r1(X) + '" x2="' + r1(X) + '" y1="' + (top - 4) + '" y2="' + (top + rowsH) + '" stroke="' + (major ? 'var(--rule)' : 'var(--rule-2)') + '" stroke-width="' + (major ? 1 : .6) + '"/>';
      if (major) g += txt(X, top - 10, start ? yy(addM(start, m)) : 'M+' + m, { anchor: 'middle', fs: 10.5, fill: 'var(--ink-3)', cls: 't-num' });
    }
    var cpMap = {}, cpStart = {}; R.cpLine.forEach(function (c, i) { cpMap[c.id] = c.d; cpStart[c.id] = i ? R.cpLine[i - 1].e : 0; });
    acts.forEach(function (a, i) {
      var y = top + i * rh, x0 = x(a.s), x1 = Math.max(x(a.e), x0 + 2), mid = y + rh / 2, cp = a.cp && cpMap[a.id] != null;
      if (i % 2 === 1) s += '<rect x="0" y="' + y + '" width="' + W + '" height="' + rh + '" fill="var(--sheet-2)" opacity=".55"/>';
      s += txt(LW - 8, mid + 4, shortName(a, R), { anchor: 'end', fs: 11.5, fill: cp ? 'var(--ink)' : 'var(--ink-3)', w: cp ? 500 : 400 });
      var cs = cp ? Math.max(a.s, Math.min(a.e, cpStart[a.id])) : a.s, xc = x(cs), lab = cp ? m1(cpMap[a.id]) : m1(a.e - a.s);
      s += '<g><title>' + esc(a.name + ' · M+' + m1(a.s) + ' ~ M+' + m1(a.e) + (cp ? ' · C.P ' + m1(cpMap[a.id] || 0) + '개월' + (cs > a.s + 0.01 ? ' (선행 공종과 병행 ' + m1(cs - a.s) + '개월)' : '') : ' · 병행') + (a.basis ? '\n' + a.basis : '')) + '</title>';
      if (cp && cs > a.s + 0.01) s += '<rect x="' + r1(x0) + '" y="' + r1(mid - bh / 2) + '" width="' + r1(xc - x0) + '" height="' + bh + '" rx="2.5" fill="var(--cp-soft)" stroke="var(--cp)" stroke-width=".8" stroke-dasharray="3 2"/>';
      var bx = cp ? xc : x0, wbar = Math.max(2, x1 - bx);
      s += '<rect x="' + r1(bx) + '" y="' + r1(mid - bh / 2) + '" width="' + r1(wbar) + '" height="' + bh + '" rx="2.5" fill="' + (cp ? 'var(--cp)' : 'var(--slate)') + '"' + (cp ? '' : ' opacity=".85"') + '/>';
      if (wbar > 34) s += txt(bx + wbar / 2, mid + 4, lab, { anchor: 'middle', fs: 10.5, fill: cp ? 'var(--cp-ink)' : 'var(--sheet)', cls: 't-num', w: 500 });
      else s += txt(x1 + 4, mid + 4, lab, { fs: 10.5, fill: 'var(--ink-3)', cls: 't-num' });
      s += '</g>';
    });
    var yb = top + rowsH + 18, ms = milestones(R);
    /* 마일스톤 라벨 : 가까우면 아래 줄로 (한글 ≈ 10.5px · 숫자 ≈ 6.3px) */
    var lastR = [-Infinity, -Infinity];
    var tw = function (t) { var w = 0; for (var c = 0; c < t.length; c++) w += /[ㄱ-힝]/.test(t[c]) ? 10.5 : 6.3; return w; };
    ms.forEach(function (mm, i) {
      var X = x(mm.m), lab = mm.k + ' ' + (start ? ym(addM(start, mm.m)) : 'M+' + m1(mm.m)), endA = i === ms.length - 1, w = tw(lab);
      var L0 = endA ? X - w : X - w / 2, lv = L0 < lastR[0] + 8 ? (L0 < lastR[1] + 8 ? 0 : 1) : 0;
      lastR[lv] = endA ? X : X + w / 2;
      s += '<path d="M' + r1(X) + ' ' + (yb - 6) + 'l6 6-6 6-6-6z" fill="' + (mm.k === '준공' ? 'var(--cp)' : 'var(--navy)') + '"/>';
      s += txt(X, yb + 22 + lv * 14, lab, { anchor: endA ? 'end' : 'middle', fs: 10.5, fill: 'var(--ink-2)' });
    });
    if (R.basic.seq === 'TD') [R.T_F, R.frame.V_END].forEach(function (q) {
      if (!isFinite(q)) return; var X = x(q);
      g += '<line x1="' + r1(X) + '" x2="' + r1(X) + '" y1="' + (top - 2) + '" y2="' + (top + rowsH) + '" stroke="var(--ink-3)" stroke-dasharray="4 3" stroke-width="1.2"/>';
    });
    g += '<line x1="' + LW + '" x2="' + (W - PR) + '" y1="' + (top + rowsH) + '" y2="' + (top + rowsH) + '" stroke="var(--rule)"/>';
    var anyOv = acts.some(function (a) { return a.cp && cpMap[a.id] != null && cpStart[a.id] > a.s + 0.01; });
    return {
      svg: svgEl(W, Hh, g + s, 'Master Schedule 바차트 · 총 ' + m1(R.total) + '개월'),
      legend: '<span><i style="background:var(--cp)"></i>C.P (주공정)</span>' + (anyOv ? '<span><i style="background:var(--cp-soft);border:1px dashed var(--cp)"></i>선행 공종과 병행 (C.P 제외)</span>' : '') + (o.cpOnly ? '' : '<span><i style="background:var(--slate)"></i>병행 (Non-C.P)</span>') + (R.basic.seq === 'TD' ? '<span><i style="background:transparent;border-left:1.5px dashed var(--ink-3);width:2px;height:12px"></i>구조제한 해제 (기초 · 수직재 완료)</span>' : '') + '<span>막대 숫자 = C.P 기여 개월</span>',
      sub: SEQ_N[R.basic.seq] + ' · C.P ' + R.cpLine.length + '개 공종 · ' + (start ? ym(addM(start, 0)) + ' 착공' : 'M+ 표기')
    };
  }
  /* 한 줄 C.P 띠 (공종별 길이 비례) */
  function cpStrip(R, o) {
    o = o || {}; var parts = cpParts(R), tot = R.total || 1;
    var GC = { 준비: 'var(--g-prep, var(--slate))', 토목: 'var(--g-civ, var(--wrock))', 골조: 'var(--g-frame, var(--cp))', 마감: 'var(--g-fin, var(--navy))' };
    return '<div class="cpstrip">' + parts.map(function (p) {
      var w = p.d / tot * 100, gname = GROUP_OF[p.id] || '골조';
      return '<i style="width:' + r2(w) + '%;background:' + GC[gname] + '" title="' + esc(p.label + ' ' + m1(p.d) + '개월') + '">' + (w > (o.minLabel || 7) ? '<b>' + esc(p.label) + '</b><em>' + m1(p.d) + '</em>' : '') + '</i>';
    }).join('') + '</div>';
  }

  /* ── C.P 산출표 */
  function cpTable(R) {
    var cpMap = {}; R.cpLine.forEach(function (c) { cpMap[c.id] = c; });
    var G = { 준비: [], 토목: [], 골조: [], 마감: [] };
    var order = ['mob', 'demo', 'demoB', 'wall', 'scw', 'prd', 'geo', 'pile', 'exc1', 'exc', 'f1', 'found', 'base', 'vert', 'tdwait', 'frameA', 'frame', 'core', 'fin', 'tc'];
    R.acts.slice().sort(function (a, b) { return a.s - b.s || order.indexOf(a.id) - order.indexOf(b.id); }).forEach(function (a) { (G[a.g] || G['골조']).push(a); });
    var h = '<thead><tr><th>공종</th><th>물량</th><th>산출 근거</th><th class="n">WD</th><th class="n">C.P (개월)</th><th class="n">누계</th></tr></thead><tbody>';
    Object.keys(G).forEach(function (k) {
      if (!G[k].length) return;
      h += '<tr class="grp"><td colspan="6">' + k + '</td></tr>';
      G[k].forEach(function (a) {
        var c = cpMap[a.id], cp = !!c && a.cp;
        h += '<tr class="' + (cp ? 'cp' : '') + '"><td>' + esc(a.name) + (cp ? '' : ' <span class="tag def">병행</span>') + '</td><td class="small">' + esc(a.qty || '-') + '</td><td class="basis">' + esc(a.basis || '') + '</td>' +
          '<td class="n mono">' + (a.wd ? m1(a.wd) : '-') + '</td><td class="n mono">' + (cp ? m1(c.d) : '<span class="muted">' + m1(a.e - a.s) + '</span>') + '</td><td class="n mono">' + (cp ? 'M+' + m1(c.e) : '') + '</td></tr>';
      });
    });
    return h + '<tr class="sum"><td colspan="4">합계 (준공)</td><td class="n mono">' + m2(R.total) + '</td><td class="n mono">M+' + m1(R.total) + '</td></tr></tbody>';
  }

  /* ── 단위 사이클 카드 */
  function cycles(R, L) {
    var f = R.found, fr = R.frame, b = R.basic, typ = fr.typ, out = '';
    out += '<div class="sheetbox"><span class="k">기초 Zone 사이클</span><span class="big">' + r1(f.cyc) + '<small>WD</small></span><dl>' +
      '<dt>Zone</dt><dd>' + f.nZ + '개 · ' + fmt(f.vZ) + '㎥</dd><dt>철근 / Zone</dt><dd>' + r1(f.reb) + 't (' + f.rebR + 't/㎥)</dd><dt>철근 배근</dt><dd>' + f.R + 'WD (' + f.crew + '명 × ' + r1(f.tpd / f.crew) + 't)</dd>' +
      (f.nPit ? '<dt>PIT Zone</dt><dd>' + f.nPit + '개 · ' + r1(f.cycPit) + 'WD</dd>' : '') + '<dt>철근팀</dt><dd>' + f.teams + '팀 · 시차 ' + r1(f.lag) + 'WD</dd></dl><span class="small muted">준비 ' + r1(f.prep) + ' (영구배수 · 버림 · 먹) + 철근 ' + f.R + ' + 형틀 · 검측 · 타설 ' + r1(f.tail) + '</span></div>';
    if (R.base && R.base.rows && R.base.rows.length) {
      var rows = R.base.rows, avg = rows.reduce(function (s, x) { return s + x.wd; }, 0) / rows.length;
      out += '<div class="sheetbox"><span class="k">지하골조 층당</span><span class="big">' + m1(avg) + '<small>WD 평균</small></span><dl>' +
        rows.map(function (x) { return '<dt>' + x.lv + ' (' + x.h + 'm)</dt><dd>외벽 ' + m1(x.Vw) + ' + 바닥 ' + m1(x.Sw) + ' = ' + m1(x.wd) + '</dd>'; }).join('') + '</dl></div>';
    } else if (R.base && R.base.td) {
      var f1c = R.cpLine.filter(function (c) { return c.id === 'f1'; })[0];
      out += '<div class="sheetbox"><span class="k">지하 (역타 · 기준층 ' + esc(R.tdBase.name) + ')</span><span class="big">' + m1(L.td.f1Zone) + '<small>WD / Zone</small></span><dl><dt>지하 슬래브</dt><dd>3 Zone 순환 · 시차 ' + L.td.f1Lag + 'WD</dd><dt>굴착 단계</dt><dd>' + (R.exc.stages ? R.exc.stages.length : 0) + '단계 (층별)</dd>' +
        '<dt>기초 후 수직재</dt><dd>' + R.base.nPost + '개층 · ' + m1(R.base.wd) + 'WD</dd><dt>' + esc(R.tdBase.name) + ' 슬래브</dt><dd>' + m1(f1c ? f1c.d : 0) + '개월 (양생 · 셋팅 포함)</dd></dl></div>';
    } else if (R.base && R.base.partial) {
      var p = R.base.path;
      out += '<div class="sheetbox"><span class="k">부분 지하 (지하부 경로)</span><span class="big">' + m1(p.walls + p.backfill + p.slab) + '<small>WD</small></span><dl><dt>외벽</dt><dd>' + m1(p.walls) + 'WD</dd>' +
        (p.backfillExt ? '<dt>방수 · 되메우기</dt><dd>' + m1(p.backfillExt) + 'WD (토목) = 골조 ' + m1(p.backfill) + 'WD</dd>' : '') +
        '<dt>' + (p.nSlab > 1 ? '지하 바닥 ' + p.nSlab + '개층' : '1F 바닥 (지하부)') + '</dt><dd>' + (p.nSlab > 1 ? p.nSlab + ' × ' + m1(p.slabPer) + ' = ' : '') + m1(p.slab) + 'WD</dd><dt>경사띠 Zone</dt><dd>' + f.nSlopeZ + '개 (되메우기 후)</dd></dl></div>';
    } else out += '<div class="sheetbox"><span class="k">지하골조</span><span class="big">-</span><span class="small muted">지하층 없음</span></div>';
    var tact = Math.max(typ.slab.wd, typ.core ? typ.core.wd : 0), perM = b.rRC * D / tact;
    if (typ.dc) {
      var d = typ.dc, its = function (s) { return s.items.map(function (x) { return esc(x[0]) + ' ' + r1(x[1]); }).join(' + '); };
      out += '<div class="sheetbox"><span class="k">지상 기준층 DC 사이클 (' + r1(typ.h) + 'm)</span><span class="big">' + m1(tact) + '<small>WD / 층</small></span><dl>' +
        '<dt>외주부</dt><dd>' + fmt(d.P.V) + '㎥ → ' + d.P.N + ' Zone · ' + d.P.T + '팀 = ' + m1(d.P.zone) + 'WD</dd>' +
        '<dt>코어</dt><dd>' + fmt(d.C.V) + '㎥ → ' + d.C.N + ' Zone · ' + d.C.T + '팀 = ' + m1(d.C.zone) + 'WD</dd>' +
        '<dt>층 진행</dt><dd>' + (d.flow ? 'Zone 연속 · Zone 간격 ' + Math.max(d.P.gap, d.C.gap) + 'WD 는 맨 위층 1회' : '층 단위 완결 (Zone 간격 포함)') + '</dd>' +
        '<dt>주공정</dt><dd>' + esc(d.gov) + (d.lifts > 1 ? ' · 수직재 ' + d.lifts + '회 분할' : '') + (d.lead ? ' · 철골 · 데크 선행 ' + r1(d.lead) + 'WD (첫 절)' : '') + '</dd>' +
        '<dt>물량 기준</dt><dd>기준층 ' + fmt(d.Au) + '㎡ · 코어 ' + fmt(d.Ac) + '㎡ · 기둥 ' + d.nCol + '개 · 보 ' + d.nBm + '개</dd><dt>월 진도</dt><dd>' + r1(perM) + '개층 / 월</dd></dl>' +
        '<span class="small muted">외주부 Zone 1개 : ' + its(d.P) + '<br>코어 Zone 1개 : ' + its(d.C) + '</span></div>';
      return out;
    }
    out += '<div class="sheetbox"><span class="k">지상 기준층 사이클 (' + r1(typ.h) + 'm)</span><span class="big">' + m1(tact) + '<small>WD / 층</small></span><dl>' +
      (typ.slab.model === 'v28'
        ? '<dt>바닥 (공종 사슬)</dt><dd>' + typ.slab.N + ' Zone · ' + typ.slab.T + '팀 (팀당 ' + typ.slab.nt + ') · Zone 1개 ' + m1(typ.slab.zone) + 'WD → 층간 ' + m1(typ.slab.wd) + '</dd>' +
          '<dt>Zone 1개</dt><dd>' + typ.slab.items.map(function (x) { return esc(x.n) + ' ' + r1(x.wd); }).join(' · ') + '</dd>'
        : '<dt>바닥</dt><dd>' + typ.slab.Z + ' Zone ÷ ' + typ.slab.T + '팀 × ' + r2(fr.dS) + 'WD = ' + m1(typ.slab.wd) + (typ.slab.lb && typ.slab.lb.on ? ' (c3 하한)' : '') + '</dd>') +
      (typ.core ? '<dt>코어 (' + (fr.sysC === 'ACS' ? 'ACS' : '갱폼') + ')</dt><dd>' + typ.core.Z + ' Zone ÷ ' + typ.core.T + '팀 = ' + m1(typ.core.wd) + '</dd>' : '') +
      '<dt>주공정</dt><dd>' + esc(fr.gov) + '</dd><dt>월 진도</dt><dd>' + r1(perM) + '개층 / 월</dd><dt>기준층 면적</dt><dd>' + fmt(fr.Atyp) + '㎡</dd></dl></div>';
    return out;
  }
  function keyCycles(R) {
    var f = R.found, fr = R.frame, typ = fr.typ, tact = Math.max(typ.slab.wd, typ.core ? typ.core.wd : 0);
    return [{ k: '기초 Zone', v: r1(f.cyc), u: 'WD', s: f.nZ + ' Zone · ' + f.teams + '팀' }, { k: '지상 기준층', v: m1(tact), u: 'WD/층', s: r1(R.basic.rRC * D / tact) + '개층 / 월' }, { k: '굴착', v: fmt(R.exc.Vtot || R.geo.Vtot), u: '㎥', s: R.basic.nB > 0 ? 'GL−' + r1(R.geo.H) + 'm' : '기초 터파기' }];
  }

  /* ── 골조 층별 (계단형 공정표 + 산정표) */
  function levelOrder(rows) {
    var map = {};
    rows.forEach(function (x) { if (!map[x.lv]) map[x.lv] = { lv: x.lv, n: x.n, core: / 코어$/.test(x.lv) }; });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return a.n - b.n || (a.core ? -1 : 1) - (b.core ? -1 : 1); }).map(function (x) { return x.lv; });
  }
  function lob(R, W) {
    var fr = R.frame, b = R.basic, hasCore = fr.coreRows.length > 0;
    W = Math.max(600, Math.floor(W || 820));
    var chains = hasCore ? [{ k: '코어', rows: fr.coreRows, color: 'var(--navy)' }, { k: '바닥', rows: fr.slabRows, color: 'var(--cp)' }] : [{ k: '골조', rows: fr.floors, color: 'var(--cp)' }];
    var allRows = chains.reduce(function (a, c) { return a.concat(c.rows); }, []);
    var t0 = Math.min.apply(null, allRows.map(function (x) { return x.s - (x.hold || 0); })), t1 = Math.max(fr.end, Math.max.apply(null, allRows.map(function (x) { return x.e; })));
    var levels = levelOrder(allRows);
    var LW = 56, PR = 16, top = 12, hl = Math.max(5, Math.min(13, 300 / levels.length)), H = top + levels.length * hl + 36;
    var x = function (m) { return LW + (m - t0) / Math.max(0.1, t1 - t0) * (W - LW - PR); }, y = function (lv) { return top + (levels.length - 1 - levels.indexOf(lv)) * hl + hl / 2; };
    var g = '', s = '', span = t1 - t0, stepM = span > 30 ? 6 : span > 14 ? 3 : span > 6 ? 2 : 1;
    for (var m = Math.ceil(t0); m <= t1; m++) { if ((m % stepM) !== 0) continue; var X = x(m); g += '<line x1="' + r1(X) + '" x2="' + r1(X) + '" y1="' + top + '" y2="' + (H - 26) + '" stroke="var(--rule-2)"/>' + txt(X, H - 12, R.inp.start ? yy(addM(R.inp.start, m)) : 'M+' + m, { anchor: 'middle', fs: 10, fill: 'var(--ink-3)', cls: 't-num' }); }
    var every = Math.ceil(levels.length / 14);
    levels.forEach(function (lv, i) { if (i % every === 0 || i === levels.length - 1) s += txt(LW - 6, y(lv) + 3.5, lv, { anchor: 'end', fs: 10, fill: 'var(--ink-3)' }); });
    if (b.seq === 'TD') [[R.T_F, '기초 완료'], [fr.V_END, '수직재 완료']].forEach(function (q) { if (!isFinite(q[0]) || q[0] < t0 || q[0] > t1) return; var X = x(q[0]); g += '<line x1="' + r1(X) + '" x2="' + r1(X) + '" y1="' + top + '" y2="' + (H - 26) + '" stroke="var(--ink-3)" stroke-dasharray="4 3"/>' + txt(X + 4, top + 10, q[1], { fs: 10, fill: 'var(--ink-3)' }); });
    chains.forEach(function (c) {
      c.rows.forEach(function (r) {
        var Y = y(r.lv);
        if (r.hold > 0.01) s += '<rect x="' + r1(x(r.s - r.hold)) + '" y="' + r1(Y - hl / 2 + 1) + '" width="' + r1(x(r.s) - x(r.s - r.hold)) + '" height="' + r1(hl - 2) + '" fill="var(--warn-soft)" stroke="var(--warn)" stroke-width=".6"><title>' + esc(r.lv + ' 구조제한 대기 ' + m2(r.hold) + '개월') + '</title></rect>';
        s += '<rect x="' + r1(x(r.s)) + '" y="' + r1(Y - Math.max(2, hl * 0.28)) + '" width="' + r1(Math.max(1.5, x(r.e) - x(r.s))) + '" height="' + r1(Math.max(4, hl * 0.56)) + '" rx="1.5" fill="' + c.color + '" opacity="' + (c.k === '코어' ? .85 : 1) + '"><title>' + esc(c.k + ' ' + r.lv + ' : M+' + m2(r.s) + ' ~ M+' + m2(r.e) + ' · ' + m1(r.wd) + 'WD') + '</title></rect>';
      });
    });
    return {
      svg: svgEl(W, H, g + s, '지상골조 층 × 시간 계단형 공정표'),
      legend: (hasCore ? '<span><i style="background:var(--navy)"></i>코어 (' + (fr.sysC === 'ACS' ? 'ACS' : '갱폼 · 알폼') + ')</span><span><i style="background:var(--cp)"></i>바닥 (' + (fr.struct === 'SC' ? '철골 · 데크 · 슬래브' : '강합성 · 데크 · 슬래브') + ')</span>' : '<span><i style="background:var(--cp)"></i>골조 (수직재 → 수평재)</span>') + (fr.holds.length ? '<span><i style="background:var(--warn-soft);border:1px solid var(--warn)"></i>구조제한 대기</span>' : '') + '<span>층 표기 = 수직재 기준 (nF = n+1층 바닥)</span>',
      sub: (b.seq === 'TD' ? '역타 · 기준층 ' + R.tdBase.name + ' · 기초 전 ' + fr.lim + 'F (코어 ' + fr.limC + 'F) / 수직재 전 ' + fr.lim2 + 'F 허용 · ' : '') + '주공정 ' + fr.gov + ' · 층 표기 = 수직재 기준'
    };
  }
  function frameTable(R) {
    var fr = R.frame, b = R.basic, hasCore = fr.coreRows.length > 0, rRC = b.rRC, h = '';
    if (!hasCore) {
      h = '<thead><tr><th>층</th><th class="n">층고</th><th>산정식 (바닥 + 수직재 일체)</th><th class="n">WD</th><th class="n">CD</th><th class="n">누계 (D)</th><th class="n">누계 (M+)</th><th>비고</th></tr></thead><tbody>';
      if (R.base && R.base.rows) R.base.rows.forEach(function (x) { h += '<tr><td>' + x.lv + '</td><td class="n mono">' + r1(x.h) + '</td><td class="f">외벽 ' + r1(x.h) + 'm × ' + r2(x.Vw / x.h) + ' + 바닥 ' + x.Z + ' Zone ÷ ' + x.T + '팀</td><td class="n mono">' + m1(x.wd) + '</td><td class="n mono">' + m1(x.wd / rRC) + '</td><td></td><td></td><td class="small muted">지하골조 → ' + x.slab + ' 바닥</td></tr>'; });
      fr.floors.forEach(function (x) {
        h += '<tr class="cp"><td>' + esc(x.lv) + '</td><td class="n mono">' + r1(x.h) + '</td><td class="f">' + esc(x.formula) + '</td><td class="n mono">' + m1(x.wd) + '</td><td class="n mono">' + m1(x.wd / rRC) + '</td><td class="n mono">' + fmt(x.e * D) + '</td><td class="n mono">' + m2(x.e) + '</td><td class="small muted">' + esc((x.why || '') + (x.hold > 0.01 ? ' · 대기 ' + m2(x.hold) + 'M' : '')) + '</td></tr>';
      });
      if (R.frameLead) h += '<tr><td>Zone 파이프라인</td><td></td><td class="f">마지막 Zone 완료 (' + r1(R.frameLead) + 'WD)</td><td class="n mono">' + m1(R.frameLead) + '</td><td class="n mono">' + m1(R.frameLead / rRC) + '</td><td class="n mono">' + fmt(fr.end * D) + '</td><td class="n mono">' + m2(fr.end) + '</td><td></td></tr>';
    } else {
      h = '<thead><tr><th>층</th><th class="n">층고</th><th>코어 산정식</th><th class="n">코어 WD</th><th class="n">코어 완료</th><th>바닥 산정식</th><th class="n">바닥 WD</th><th class="n">바닥 완료</th><th>비고</th></tr></thead><tbody>';
      if (R.base && R.base.rows) R.base.rows.forEach(function (x) { h += '<tr><td>' + x.lv + '</td><td class="n mono">' + r1(x.h) + '</td><td class="f" colspan="3">지하골조 : 외벽 ' + r1(x.h) + 'm × ' + r2(x.Vw / x.h) + 'WD/m = ' + m1(x.Vw) + 'WD</td><td class="f">' + x.Z + ' Zone ÷ ' + x.T + '팀 → ' + x.slab + ' 바닥</td><td class="n mono">' + m1(x.Sw) + '</td><td></td><td></td></tr>'; });
      var byLv = {}; fr.coreRows.forEach(function (c) { byLv[c.lv] = { c: c }; }); fr.slabRows.forEach(function (sl) { (byLv[sl.lv] = byLv[sl.lv] || {}).s = sl; });
      levelOrder(fr.coreRows.concat(fr.slabRows)).forEach(function (lv) {
        var c = byLv[lv].c, sl = byLv[lv].s, note = [];
        if (c && c.why) note.push('코어 ' + c.why); if (sl && sl.why) note.push('바닥 ' + sl.why); if (sl && sl.bind) note.push('착수 = ' + sl.bind + ' 완료 후'); if (c && c.hold > 0.01) note.push('코어 대기 ' + m2(c.hold) + 'M');
        h += '<tr class="' + (sl ? 'cp' : '') + '"><td>' + esc(lv) + '</td><td class="n mono">' + r1((c || sl).h) + '</td><td class="f">' + (c ? esc(c.formula) : '-') + '</td><td class="n mono">' + (c ? m1(c.wd) : '') + '</td><td class="n mono">' + (c ? 'M+' + m2(c.e) : '') + '</td>' +
          '<td class="f">' + (sl ? esc(sl.formula) : '-') + '</td><td class="n mono">' + (sl ? m1(sl.wd) : '') + '</td><td class="n mono">' + (sl ? 'M+' + m2(sl.e) : '') + '</td><td class="small muted">' + esc(note.join(' · ')) + '</td></tr>';
      });
      if (R.frameLead) h += '<tr><td>파이프라인</td><td></td><td class="f" colspan="6">코어 마지막 Zone 완료 ' + r1(R.frameLead) + 'WD → 지상골조 완료 M+' + m2(fr.end) + '</td><td></td></tr>';
    }
    return h + '<tr class="sum"><td colspan="3">지상골조 완료</td><td colspan="' + (hasCore ? 6 : 5) + '" class="n mono">M+' + m2(fr.end) + (fr.done > fr.end + 0.005 ? ' · 골조 완료 M+' + m2(fr.done) + ' (지하 포함)' : '') + ' · C.P ' + m2(R.gsum.frame) + '개월 (' + m1(R.gsum.frame * rRC * D) + 'WD)</td></tr></tbody>';
  }

  /* ── 기초 Zone 철근팀 레인 */
  function lanes(R, W) {
    var f = R.found, Z = f.sim.Z, end = Math.max(1, f.sim.end);
    W = Math.max(600, Math.floor(W || 820));
    var LW = 58, PR = 14, top = 14, rh = 28, H = top + f.teams * rh + 34;
    var x = function (w) { return LW + w / end * (W - LW - PR); }, g = '', s = '';
    var stp = end > 160 ? 20 : end > 70 ? 10 : 5;
    for (var w = 0; w <= end; w += stp) { var X = x(w); g += '<line x1="' + r1(X) + '" x2="' + r1(X) + '" y1="' + top + '" y2="' + (top + f.teams * rh) + '" stroke="var(--rule-2)"/>' + txt(X, H - 12, w + 'WD', { anchor: 'middle', fs: 10, fill: 'var(--ink-3)', cls: 't-num' }); }
    for (var t = 1; t <= f.teams; t++) s += txt(LW - 8, top + (t - 1) * rh + rh / 2 + 4, t + '팀', { anchor: 'end', fs: 11, fill: 'var(--ink-2)' });
    var pid = 'hatch' + Math.round(Math.random() * 1e6);
    s += '<defs><pattern id="' + pid + '" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--slate-3)"/><line x1="0" y1="0" x2="0" y2="5" stroke="var(--slate)" stroke-width="1.4"/></pattern></defs>';
    Z.slice().sort(function (a, b) { return a.i - b.i; }).forEach(function (z) {
      var Y = top + (z.team - 1) * rh, x0 = x(z.s), x1 = x(z.pour), wbar = Math.max(2, x1 - x0);
      var fill = z.pit ? 'url(#' + pid + ')' : (z.slope ? 'var(--warn-soft)' : (z.deep ? 'var(--accent-soft)' : 'var(--ok-soft)'));
      s += '<g><title>' + esc('Zone ' + (z.i + 1) + (z.pit ? ' (PIT)' : '') + (z.slope ? ' (경사띠 · 되메우기 후)' : '') + ' · ' + z.team + '팀 · 착수 가능 ' + r1(Math.max(0, z.ready - f.prep)) + 'WD · 철근 착수 ' + r1(z.s) + 'WD → 타설 ' + z.pour + 'WD') + '</title>';
      s += '<rect x="' + r1(x0) + '" y="' + (Y + 5) + '" width="' + r1(wbar) + '" height="' + (rh - 10) + '" rx="2" fill="' + fill + '" stroke="var(--slate)" stroke-width=".6"' + (z.slope ? ' stroke-dasharray="3 2"' : '') + '/>';
      s += '<rect x="' + r1(x1 - 2) + '" y="' + (Y + 3) + '" width="3" height="' + (rh - 6) + '" fill="var(--cp)"/>';
      if (wbar > 24) s += txt(x0 + 4, Y + rh / 2 + 4, (z.pit ? 'PIT ' : 'Z') + (z.i + 1), { fs: 10, fill: 'var(--ink)', cls: 't-num' });
      s += '</g>';
    });
    return {
      svg: svgEl(W, H, g + s, '기초 Zone 철근팀 레인 차트'),
      legend: '<span><i style="background:var(--accent-soft);border:1px solid var(--slate)"></i>지하부 Zone</span><span><i style="background:var(--ok-soft);border:1px solid var(--slate)"></i>일반 Zone</span><span><i style="background:var(--slate-3);border:1px solid var(--slate)"></i>PIT (2회 타설)</span>' + (f.nSlopeZ ? '<span><i style="background:var(--warn-soft);border:1px dashed var(--slate)"></i>경사띠 (되메우기 후)</span>' : '') + '<span><i style="background:var(--cp);width:4px"></i>타설일 (1일 1 Zone)</span><span>막대 = 철근 착수 → 타설 · 준비 ' + r1(f.prep) + 'WD는 별도 조</span>',
      sub: f.nZ + ' Zone · ' + fmt(f.V) + '㎥ · ' + R.fType + ' (' + (R.fWhy || '') + ') · 완료 ' + end + 'WD (' + m1(end / (R.basic.rRC * D)) + '개월)'
    };
  }

  /* ── 지층 기둥 · 굴착표 */
  function strata(R, o) {
    o = o || {};
    var g = R.geo, z = g.z, b = R.basic;
    var dmax = Math.max(g.H + 4, isFinite(z[4]) ? Math.min(z[4] + 3, g.H * 1.6 + 6) : g.H + 6, 12);
    var W = o.w || 300, Hh = o.h || 380, top = 18, bot = 18, x0 = 92, x1 = 170, y = function (d) { return top + d / dmax * (Hh - top - bot); }, s = '';
    var cols = ['var(--soil)', 'var(--wsoil)', 'var(--wrock)', 'var(--srock)', 'var(--hrock)'], names = ['토사', '풍화토', '풍화암', '연암', '경암'];
    for (var i = 0; i < 5; i++) { var a = Math.min(z[i], dmax), bb = Math.min(z[i + 1], dmax); if (bb <= a) continue; s += '<rect x="' + x0 + '" y="' + r1(y(a)) + '" width="' + (x1 - x0) + '" height="' + r1(y(bb) - y(a)) + '" fill="' + cols[i] + '"/>'; if (y(bb) - y(a) > 12) s += txt(x1 + 6, (y(a) + y(bb)) / 2 + 4, names[i] + (isFinite(z[i + 1]) ? ' ~' + r1(z[i + 1]) : ''), { fs: 10.5, fill: 'var(--ink-2)' }); }
    s += '<rect x="' + x0 + '" y="' + top + '" width="' + (x1 - x0) + '" height="' + (Hh - top - bot) + '" fill="none" stroke="var(--rule)"/>';
    if (b.nB > 0) {
      s += '<rect x="' + (x0 + 8) + '" y="' + top + '" width="' + (x1 - x0 - 16) + '" height="' + r1(y(g.H) - top) + '" fill="var(--sheet)" opacity=".55" stroke="var(--cp)" stroke-dasharray="4 3"/>';
      s += txt(x0 + (x1 - x0) / 2, y(g.H) + 13, '굴착 GL−' + r1(g.H) + 'm', { anchor: 'middle', fs: 10.5, fill: 'var(--cp)', w: 600 });
      var nm = b.seq === 'TD' ? R.tdBase.st : g.hB.map(function (h, k) { return 'B' + (k + 1); }), hh = b.seq === 'TD' ? R.tdBase.h : g.hB, cum = 0;
      hh.forEach(function (h, k) { cum += h; s += '<line x1="' + (x0 - 8) + '" x2="' + x0 + '" y1="' + r1(y(cum)) + '" y2="' + r1(y(cum)) + '" stroke="var(--ink-3)"/>' + txt(x0 - 11, y(cum) + 3.5, nm[k], { anchor: 'end', fs: 10, fill: 'var(--ink-3)' }); });
    }
    if (isFinite(g.gwl) && g.gwl < dmax) s += '<line x1="' + (x0 - 30) + '" x2="' + x1 + '" y1="' + r1(y(g.gwl)) + '" y2="' + r1(y(g.gwl)) + '" stroke="var(--gwl)" stroke-width="1.4"/>' + txt(x0 - 34, y(g.gwl) + 3.5, '▽ ' + r1(g.gwl), { anchor: 'end', fs: 10, fill: 'var(--gwl)' });
    s += txt(x0 - 11, top + 4, b.seq === 'TD' && R.tdBase.off !== 0 ? 'GL (' + R.tdBase.name + ')' : 'GL', { anchor: 'end', fs: 10, fill: 'var(--ink-3)' });
    return svgEl(W, Hh, s, '지층 분포와 굴착 깊이');
  }
  function excTable(R, L) {
    var g = R.geo, b = R.basic, h = '';
    if (R.exc.stages) {
      h = '<thead><tr><th>단계</th><th class="n">구간 (GL−m)</th><th class="n">굴착량 (㎥)</th><th class="n">WD</th><th class="n">개월</th><th>지배</th></tr></thead><tbody>';
      var a1 = (R.acts || []).filter(function (a) { return a.id === 'exc1'; })[0], w1 = a1 && a1.wd ? a1.wd : 0, m1st = a1 ? a1.e - a1.s : 0, anySlab = false;
      h += '<tr><td>1차 (' + esc(R.tdBase.name) + ' 슬래브 하부)</td><td class="n mono">0 ~ ' + L.td.d1 + '</td><td class="n mono">' + fmt(R.exc.V1) + '</td><td class="n mono">' + (w1 ? m1(w1) : '-') + '</td><td class="n mono">' + m2(m1st) + '</td><td class="small muted">개방 굴착</td></tr>';
      R.exc.stages.forEach(function (st) { if (st.gov === 'slab') anySlab = true; h += '<tr><td>' + esc(st.lv) + '</td><td class="n mono">' + st.a + ' ~ ' + st.b + '</td><td class="n mono">' + fmt(st.Vt) + '</td><td class="n mono">' + m1(st.wd) + '</td><td class="n mono">' + m2(st.m) + '</td><td class="small">' + (st.gov === 'slab' ? '<span class="tag warn">슬래브 (골조 WD)</span>' : '굴착') + '</td></tr>'; });
      h += '<tr class="sum"><td colspan="2">합계</td><td class="n mono">' + fmt(R.exc.Vtot) + '</td><td class="n mono">' + m1(R.exc.wd + w1) + (anySlab ? '*' : '') + '</td><td class="n mono">' + m2(R.exc.m + m1st) + '</td><td></td></tr>';
      if (anySlab) h += '<tr><td colspan="6" class="small muted">* 슬래브 지배 단계는 골조 가동률로 개월 환산 · 합계 WD는 토목 가동률 기준 환산값</td></tr>';
    } else {
      h = '<thead><tr><th>지층</th><th class="n">굴착량 (㎥)</th><th class="n">생산성 (㎥/WD)</th><th class="n">WD</th></tr></thead><tbody>';
      GE.LK.forEach(function (k) { var V = g.Vexc[k] || 0; if (V < 1) return; var rt = R.exc.rate[k]; h += '<tr><td>' + GE.LN[k] + '</td><td class="n mono">' + fmt(V) + '</td><td class="n mono">' + fmt(rt) + '</td><td class="n mono">' + m1(V / rt) + '</td></tr>'; });
      if (R.exc.ns) h += '<tr><td>지보 ' + R.exc.ns + '단 (' + GE.SUP_N[b.sup] + ')</td><td></td><td class="n mono">' + m1(R.exc.pen / R.exc.ns) + 'WD/단</td><td class="n mono">' + m1(R.exc.pen) + '</td></tr>';
      h += '<tr class="sum"><td>합계</td><td class="n mono">' + fmt(g.Vtot) + '</td><td></td><td class="n mono">' + m1(R.exc.wd || 0) + '</td></tr>';
    }
    return h + '</tbody><tfoot><tr><td colspan="6" class="small muted" style="padding-top:8px">굴착 면적 ' + fmt(g.Adeep) + '㎡' + (g.Ash ? ' + 얕은 기초부 ' + fmt(g.Ash) + '㎡' : '') + (g.slopeA ? ' + 사면 ' + fmt(g.slopeA) + '㎡' : '') + ' · 흙막이 연장 ' + fmt(g.P) + 'm · 면적 보정 ×' + r2(R.exc.fA || 1) + (g.Vvoid ? ' · 기존 지하 ' + fmt(g.Vvoid) + '㎥ 제외' : '') + '</td></tr></tfoot>';
  }
  function excSub(R) { var g = R.geo, b = R.basic; return b.nB > 0 ? '굴착 ' + fmt(R.exc.Vtot || g.Vtot) + '㎥ · 깊이 ' + r1(g.H) + 'm · ' + GE.SUP_N[b.sup] : '지하층 없음 · 기초 터파기 ' + fmt(g.Vtot) + '㎥'; }
  /* 입력 패널용 가로 지층 막대 */
  function groundBar(R) {
    var z = R.geo.z, H = R.basic.nB > 0 ? R.geo.H : 0, Dm = Math.max(40, Math.ceil((H + 5) / 5) * 5);
    var cols = ['var(--soil)', 'var(--wsoil)', 'var(--wrock)', 'var(--srock)', 'var(--hrock)'], nm = ['토사', '풍화토', '풍화암', '연암', '경암'], h = '';
    for (var i = 0; i < 5; i++) { var a = Math.min(z[i], Dm), b = Math.min(z[i + 1], Dm); if (b > a) h += '<i style="width:' + r2((b - a) / Dm * 100) + '%;background:' + cols[i] + '" title="' + nm[i] + ' GL−' + r1(z[i]) + (isFinite(z[i + 1]) ? '~' + r1(z[i + 1]) : ' 이하') + 'm"></i>'; }
    if (H > 0) h += '<b style="left:' + r2(Math.min(H, Dm) / Dm * 100) + '%"></b>';
    var G = R.ground;
    return { bar: h, layers: '토사 ~' + r1(z[1]) + ' · 풍화토 ~' + r1(z[2]) + ' · 풍화암 ~' + r1(z[3]) + ' · 연암 ~' + r1(z[4]) + 'm · 이하 경암', depth: (H > 0 ? '점선 = 굴착 GL−' + r1(H) + 'm · ' : '') + '막대 GL 0 ~ ' + Dm + 'm', desc: G.assumed ? GE.GROUND[G.mode].desc + (G.mode === 'AUTO' ? ' — 주상도가 없을 때 적용' : '') : '' };
  }

  /* ── 검토 포인트 · 민감 입력 */
  function reviewList(R) { return R.review.map(function (r) { return '<li class="' + (r.lvl === 'warn' ? 'warn-i' : '') + '"><span class="c">' + esc(r.cat) + '</span><span>' + esc(r.text) + '</span></li>'; }).join(''); }
  function sensItems(R, L) {
    var inp = R.inp, base = R.total, items = [];
    function tryIt(label, mod, tag) { try { var c = clone(inp); c.adv = c.adv || {}; mod(c); var t = GE.compute(c, L).total; items.push({ label: label, d: t - base, tag: tag }); } catch (e) { /* skip */ } }
    var A = inp.adv || {};
    if (R.basic.nB > 0 && !(A.H > 0)) tryIt('굴착 깊이 +10%', function (c) { c.adv.H = R.geo.H * 1.1; }, '추정');
    if (!A.hSpec) { var gg = R.geo, spec = 'B1:' + r2((gg.hB[0] || 5) * 1.1) + ',1:' + r2(gg.hUp[0] * 1.1) + ',2-' + R.basic.nUp + ':' + r2(gg.hUp[Math.min(1, gg.hUp.length - 1)] * 1.1); tryIt('층고 +10%', function (c) { c.adv.hSpec = spec; }, '기본값'); }
    if (!(A.Atyp > 0)) tryIt('기준층 면적 +20%', function (c) { c.adv.Atyp = R.frame.Atyp * 1.2; }, '추정');
    if (!(A.fTeams > 0)) tryIt('기초 철근팀 −1', function (c) { c.adv.fTeams = Math.max(1, R.found.teams - 1); }, '추정');
    if (R.ground.assumed) ['AUTO', 'SOIL', 'ROCK'].forEach(function (k) { if (k !== R.ground.mode) tryIt(GE.GROUND[k].name + '이면', function (c) { c.ground = k; }, '가정'); });
    else tryIt('암반선 2m 상승', function (c) { var s2 = R.ground.st.slice(); var cut = 2; for (var i = 2; i >= 0 && cut > 0; i--) { var dd = Math.min(cut, s2[i]); s2[i] -= dd; cut -= dd; } c.ground = 'CUSTOM'; c.strata = s2; }, '입력');
    if (R.pile && !(A.pileN > 0)) tryIt('파일 본수 +20%', function (c) { c.adv.pileN = R.pile.n * 1.2; }, '추정');
    if (R.basic.seq === 'TD' && !(inp.lim > 0)) tryIt('기초 전 허용층 −3', function (c) { c.lim = Math.max(1, R.frame.lim - 3); }, '기본값');
    items = items.filter(function (it) { return Math.abs(it.d) >= 0.05; });
    items.sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); });
    return items;
  }
  var TAG_C = { '추정': 'est', '기본값': 'def', '입력': 'in', '가정': 'warn' };
  function sensHTML(R, items, n) {
    var mx = Math.max(0.5, Math.max.apply(null, items.map(function (i) { return Math.abs(i.d); }).concat([0])));
    return '<div class="row"><span class="muted">생산성 ±15%</span><div class="bar"><i style="left:0;width:100%;background:var(--slate-2)"></i></div><span class="mono">' + m1(R.sens.lo) + '~' + m1(R.sens.hi) + '</span></div>' +
      items.slice(0, n || 6).map(function (it) { var w = Math.abs(it.d) / mx * 100; return '<div class="row"><span>' + esc(it.label) + ' <span class="tag ' + TAG_C[it.tag] + '">' + it.tag + '</span></span><div class="bar"><i style="left:0;width:' + r1(w) + '%"></i></div><span class="mono">' + (it.d >= 0 ? '+' : '') + m1(it.d) + '개월</span></div>'; }).join('');
  }
  var SENS_NOTE = ['추정 · 기본값 · 가정 항목을 도면 · 주상도 값으로 바꾸면 산정 범위가 줄어듭니다. 막대가 긴 항목부터 확인하세요.', '주요 민감 입력이 모두 입력값입니다. 남은 범위는 생산성 편차입니다.'];

  /* ── 사례 비교 · 재현 검증 */
  function refsTable(R) {
    var sims = GE.similarity(R), b = R.basic;
    var h = '<thead><tr><th>현장</th><th>위치 · 용도</th><th>시퀀스</th><th>구조</th><th class="n">지하 / 지상</th><th class="n">총공기</th><th class="n">지상골조</th><th class="n">유사도</th></tr></thead><tbody>';
    h += '<tr class="cp"><td><b>' + esc(R.inp.name || '이 프로젝트') + '</b></td><td>' + esc(GE.USE_H[b.use].name) + '</td><td>' + SEQ_N[b.seq] + '</td><td>' + esc(GE.STRUCT_N[b.struct].replace(/ \(.*\)$/, '')) + '</td><td class="n mono">B' + b.nB + ' / ' + b.nUp + 'F</td><td class="n mono">' + m1(R.total) + '</td><td class="n mono">' + m1(R.gsum.frame) + '</td><td class="n">-</td></tr>';
    sims.forEach(function (sm) {
      var r = sm.ref;
      h += '<tr><td>' + esc(r.name) + '</td><td class="small">' + esc(r.loc) + '</td><td>' + (r.seq ? SEQ_N[r.seq] : '-') + '</td><td class="small">' + (r.struct && GE.STRUCT_N[r.struct] ? esc(GE.STRUCT_N[r.struct].replace(/ \(.*\)$/, '')) : '미확인') + '</td>' +
        '<td class="n mono">' + (r.nB != null ? 'B' + r.nB + ' / ' + r.nUp + 'F' : '-') + '</td><td class="n mono">' + m1(r.cmp || r.total) + (r.cmp && r.cmp !== r.total ? '*' : '') + '</td><td class="n mono">' + (r.frame ? m1(r.frame) : '-') + '</td><td class="n mono">' + sm.score + '</td></tr>';
    });
    return h + '</tbody><tfoot><tr><td colspan="8" class="small muted" style="padding-top:8px">유사도 = 시퀀스 40 + 구조 25 + 지하 깊이 20 + 지상 층수 15. * 기존 건물 해체 · 인수인계를 뺀 비교 기준 (해체공사는 별도).</td></tr></tfoot>';
  }
  var valCache = null, valLib = null;
  function validCards(L) {
    if (!valCache || valLib !== L) { valCache = GE.validate(L); valLib = L; }
    return valCache.map(function (vv) {
      var r = vv.ref, tot = r.cmp || r.total, dt = vv.total - tot;
      return '<div class="vcard"><h4>' + esc(r.name) + '<span>실제 ' + m1(tot) + ' · 에이전트 ' + m1(vv.total) + '</span></h4><table>' +
        vv.rows.map(function (x) { var d = x.agent - x.actual, cls = Math.abs(d) < 0.15 ? 'd-zero' : d > 0 ? 'd-pos' : 'd-neg'; return '<tr><td>' + esc(x.label) + '</td><td class="n">' + m1(x.actual) + '</td><td class="n">' + m1(x.agent) + '</td><td class="n ' + cls + '">' + (d >= 0 ? '+' : '') + m1(d) + '</td></tr>'; }).join('') +
        '<tr><td><b>합계</b></td><td class="n"><b>' + m1(tot) + '</b></td><td class="n"><b>' + m1(vv.total) + '</b></td><td class="n ' + (Math.abs(dt) < 0.5 ? 'd-zero' : dt > 0 ? 'd-pos' : 'd-neg') + '"><b>' + (dt >= 0 ? '+' : '') + m1(dt) + '</b></td></tr></table>' +
        '<div class="ex">' + esc((r.excl ? r.excl + ' · ' : '') + r.src) + '</div></div>';
    }).join('');
  }
  function resetValid() { valCache = null; }

  /* ── 산정 기준 */
  function basis(R, L) {
    return '<ol class="basis-list">' +
      '<li><b>공기 구조</b> : 준비 (MOB) + 작업일수 ÷ 가동률 + 정리 (마감 · T&amp;C) — 국토부 「적정 공사기간 확보를 위한 가이드라인」 구성. 1개월 = 30.4일. 해체공사는 별도.</li>' +
      '<li><b>가동률</b> : 토목 · 외부 ' + r1(R.basic.rExt * 100) + '% / 골조 ' + r1(R.basic.rRC * 100) + '% (기본 70.2 · 58.5 — 사례 A 70.2 / 58.4, B 64.9 / 59.7, C 70.2 / 58.6). 토요일 레미콘 타설 불가 · 악천후 반영. 1일 작업시간은 작업량 공종에 비례 (8시간 = 1.0, 하이테크 10시간 = ×1.25) — 양생 · 팀 시차 · 기본값 개월 · 역타 지상 착수 시점은 고정.</li>' +
      '<li><b>굴착</b> : 지층별 물량 ÷ 생산성. 역타 (슬래브 하부) 토사 ' + L.exc.TD.soil + ' · 풍화암 ' + L.exc.TD.wrock + ' · 연암 ' + L.exc.TD.srock + ' · 경암 ' + L.exc.TD.hrock + ' ㎥/WD — 사례 A 토목 공기검토 실적 (12단계). 순타는 역타 대비 1.3~1.45배 (가정), 오픈컷 ×1.3 · 스트럿 · 레이커 ×0.85. 면적 보정 √(굴착면적 ÷ 기준면적), 0.6~2.5.</li>' +
      '<li><b>지반</b> : 주상도 두께를 넣거나 지반 유형만 고름 (두께 m : 토사 · 풍화토 · 풍화암 · 연암, 그 아래 경암). ' + ['AUTO', 'SOIL', 'ROCK'].map(function (k) { var G = GE.GROUND[k]; return (k === 'AUTO' ? '모름 (자동) = ' : '') + G.name + ' ' + G.st.join(' · ') + (k === 'AUTO' ? ' (국내 도심 대심도 굴착 실적 분포)' : ''); }).join(' / ') + '.</li>' +
      '<li><b>지보</b> : 앵커 수직간격 ' + L.support.ANCHOR.sp + 'm (사례 B 7단) · 단당 ' + L.support.ANCHOR.pen + 'WD · 스트럿 ' + L.support.STRUT.sp + 'm · ' + L.support.STRUT.pen + 'WD · 레이커 최대 2단 · ' + L.support.RAKER.pen + 'WD (사례 A 역레이커 Zone 6WD).</li>' +
      '<li><b>흙막이</b> : CIP 피치 ' + L.wall.CIP.pitch + 'm, 천공 토사 ' + L.wall.CIP.rate.soil + ' / 풍화암 ' + L.wall.CIP.rate.wrock + ' / 암 ' + L.wall.CIP.rate.srock + ' m/일·조 (사례 A 천공 1.6공/일 · 철근망 4.9공/일 환산), 암반선 +2m까지 + 엄지말뚝 1/3 굴착저 +2m. 연장 200m당 1조. Slurry Wall · H-Pile · SCW · Sheet Pile은 일반 생산성 (가정).</li>' +
      '<li><b>PRD · 지열 · 파일</b> : PRD 지하 바닥 ' + L.prd.areaPer + '㎡당 1공 (사례 A 54공) · 천공 토사 ' + L.prd.rate.soil + ' / 암 ' + L.prd.rate.srock + ' m/일 + 장비 조립 ' + L.prd.setup + 'WD. 지열 ' + L.geo.rate + '공/일 × ' + L.geo.rigs + '대 (사례 A · B). PHC 기초면적 ' + L.pile.PHC.areaPer + '㎡당 1본 · ' + L.pile.PHC.rate + '본/일·팀 · 5,000㎡당 1팀 (사례 C 4팀 참고, 가정).</li>' +
      '<li><b>기초</b> : Zone ' + L.found.zoneV + '㎥ (1일 타설 한도 800~900㎥) · 철근 ' + L.found.rebar + 't/㎥ · 철근팀 ' + L.found.crew + '명 (최대 25명) × ' + L.found.tPerMD + 't/인·일 · 사이클 = 준비 4 (영구배수 2 · 버림 1 · 먹 1) + 철근 + 3, PIT +' + L.found.pitAdd + 'WD · 1팀 = 1 Zone 완결 · 팀 시차 ' + L.found.lag + 'WD · 하루 1 Zone 타설 · 역타는 최종 단계 굴착 Zone 순 착수 + 양생 ' + L.found.cureCD + 'CD (사례 A 기준).</li>' +
      '<li><b>지하골조 (순타)</b> : 외벽 · 수직재 ' + r2(L.base.liftWD / L.base.liftRef) + 'WD/m (사례 B 합벽 49CD/3회), 앵커 · 레이커는 Lift ' + L.base.liftAnchor + 'm 끊어치기 + 바닥 ' + L.base.zoneA + '㎡/Zone · 팀당 ' + L.base.zpt + ' Zone · ' + L.base.slabD + 'WD/Zone (층당 최소 ' + L.base.minSlab + 'WD). 지하 연면적 미입력 시 굴착 면적 기준 전면 지하. 부분 지하 (오픈컷) = 지하부 Zone → 외벽 → 방수 · 되메우기 ' + L.base.backfill + 'WD (토공, 토목 가동률) → 경사띠 Zone, 지하 바닥 = 층수만큼. 지하 → 지상 연계 착수 중첩은 지상골조 공기의 1/2 이내.</li>' +
      '<li><b>지상골조</b> : 층 사이클 = (Zone ÷ 팀) × Zone당 WD × 층고 보정. RC ' + L.frame.d.RC + ' (사례 B 고층 13WD/4 Zone) · SRC ' + L.frame.d.SRC + ' (가정) · 철골 + 코어 ' + L.frame.d.SC + ' (사례 A 8WD/2 Zone) · 강합성 ' + L.frame.d.COMP + ' WD. 코어 ACS ' + L.frame.core.ACS + ' (사례 A) · 갱폼 · 알폼 ' + L.frame.core.GANG + ' WD/Zone (사례 C 18WD/3 Zone). Zone ' + L.frame.zoneA + '㎡ · 팀당 Zone RC ' + L.frame.zonesPerTeam.RC + ' · 철골 ' + L.frame.zonesPerTeam.SC + ' · 강합성 ' + L.frame.zonesPerTeam.COMP + ' · 층고 ' + L.frame.hRef + 'm 초과 1m당 +' + Math.round(L.frame.hK * 100) + '% · 코어 ' + L.frame.core.liftMax + 'm 초과 2 Lift · 옥탑 · 최상층 ×' + L.frame.roofF + ' · 철골 n층 = 코어 n+3층 완료 후 · ACS 초기 숙련 (사례 A Learning Curve).</li>' +
      '<li><b>역타</b> : 기준층 = 외부 도로와 면해 차량 진출입이 되는 층 (기본 1F, 사례 A 1F) — 기준층 슬래브를 먼저 치고 아래 층은 역타, 위 층은 상향 골조, 지층 · 굴착 깊이는 기준층 바닥 = GL. 기준층 슬래브 Zone ' + L.td.f1Zone + 'WD + 시차 ' + L.td.f1Lag + 'WD + 양생 ' + L.td.f1CureCD + 'CD + 셋팅 ' + L.td.setup + 'WD · 지하 슬래브 3 Zone 순환 병행 · 구조제한 (모를 때) 기초 완료 전 지하 + 지상 ' + L.td.limTot1 + '개층 · 지하 수직재 완료 전 ' + L.td.limTot2 + '개층 (사례 A 8 + 17 / 8 + 24), 코어는 +3개층 · 지상 착수 = 기준층 슬래브 + ' + L.td.startOffsetM + '개월 · 기초 전 T/C 공용 ×' + L.td.preF + ' (기초 완료 전 작업분만, 걸치는 층은 비례 · RC 바닥 · 코어 · 강합성 바닥). 슬래브가 지배하는 굴착 단계는 골조 가동률. 파일은 굴착 전 지상 천공 현장타설 (PHC 불가). 기초 완료 후 지상 착수면 C.P = 기준층 슬래브 → 착수 준비 → 지상골조, 지상골조가 지하 수직재보다 먼저 끝나면 C.P = 기초 → 지하 수직재.</li>' +
      '<li><b>마감 · T&amp;C</b> : 골조 완료 (지상골조 · 순타 지하골조 · 역타 지하 수직재 중 마지막) 후 착수.</li>' +
      '<li><b>검증</b> : 실적 사례 3건을 해당 조건으로 다시 계산해 실제 계획과 비교 (사례 비교 표). 계산 엔진은 독립 검토 후 무작위 입력 2만 건으로 C.P 합계 · 구조제한 · 착수 순서 · 단조성 (구조제한 완화 · 작업시간 증가 시 공기 비증가) 확인.</li></ol>';
  }
  /* 화면 입력 옆에 표시할 자동값 */
  function autoHints(R) {
    var g = R.geo, b = R.basic, fr = R.frame, L = R.lib || null;
    return {
      cov: isFinite(g.coverage) ? r1(g.coverage * 100) : '',
      nPH: String(b.nUp >= 20 ? 2 : 1),
      H: b.nB > 0 ? r1(g.Hauto) : '',
      A: b.nB > 0 ? fmt(g.Adeep) : '',
      P: b.nB > 0 ? fmt(g.P) : '',
      found: { MAT: '매트', PHC: 'PHC', BORED: '현장타설' }[R.fType] || '',
      core: fr.coreRows.length ? (fr.sysC === 'ACS' ? 'ACS' : '갱폼') : '',
      lim: b.seq === 'TD' ? fr.lim + 'F' : '', lim2: b.seq === 'TD' ? fr.lim2 + 'F' : '',
      limNote: b.seq === 'TD' ? '지하 ' + b.nB + ' + 지상 ' + fr.lim + ' = ' + (b.nB + fr.lim) + '개층' : '',
      Atyp: fmt(g.gUp > 0 ? g.gUp / b.nUp : g.bldg), coreZ: fr.typ.core ? String(fr.typ.core.Z) : '', mat: r1(g.autoT), fTeams: String(R.found.teams),
      prd: R.PRD ? String(R.PRD.n) : '', pile: R.pile ? fmt(R.pile.n) : '', gfa: (g.gUp || 0) + (g.gDn || 0)
    };
  }

  /* ── AI (sample) */
  function aiErr(e) {
    var c = e && e.code;
    if (c === 'not_granted' || c === 'sampling_disabled' || c === 'not_declared' || c === 'capability_disabled' || c === 'capability_removed') return 'AI 사용이 허용되지 않았습니다. 계산 기능은 그대로 쓸 수 있습니다.';
    if (c === 'rate_limited') return '요청이 많습니다. 잠시 후 다시 시도하세요.';
    if (c === 'invalid_json') return 'AI 응답을 읽지 못했습니다. 자료를 줄여서 다시 시도하세요.';
    if (c === 'image_rejected') return '이미지를 읽을 수 없습니다. PNG · JPG로 다시 첨부하세요.';
    if (c === 'cancelled') return '중지했습니다.';
    if (c === 'refused') return 'AI가 이 요청에 답하지 않았습니다. 자료 내용을 바꿔 보세요.';
    return 'AI 응답 중 문제가 생겼습니다. 다시 시도하세요.';
  }
  function extractPrompt(text) {
    return '너는 건설 공사기간 산정 에이전트의 입력 도우미다. 아래 자료(건축개요 · 지반조사 · 공법 설명 등)와 첨부 이미지에서 값을 찾아 JSON 객체 하나로만 답하라.\n' +
      '스키마: {"name":문자열|null,"use":"office"|"dc"|"residential"|"mixed"|"other"|null,"site":대지면적㎡|null,"bldg":건축면적㎡|null,"gfaUp":지상연면적㎡|null,"gfaDn":지하연면적㎡|null,"nB":지하층수|null,"nUp":지상층수|null,"nPH":옥탑층수|null,"H":굴착깊이m|null,' +
      '"strata":{"soil":매립·퇴적층(토사)두께m|null,"wsoil":풍화토두께m|null,"wrock":풍화암두께m|null,"srock":연암두께m|null},"ground":"SOIL"|"ROCK"|null,"gwl":지하수위GL-m|null,"seq":"BU"|"TD"|null,"tdBase":역타기준층(B2=-2,B1=-1,1F=0,2F=1,3F=2)|null,"wall":"CIP"|"SW"|"HP"|"SCW"|"SP"|"NONE"|null,"support":"ANCHOR"|"STRUT"|"RAKER"|"OPEN"|"SLAB"|null,"struct":"RC"|"SRC"|"SC"|"COMP"|null,"geo":지열공수|null,"notes":"확인이 필요한 점 1~3문장"}\n' +
      '규칙: 평 단위는 ㎡로 환산 (1평 = 3.3058㎡). 지층은 주상도 깊이 구간을 두께로 바꾸고 시추공이 여러 개면 평균한다. 두께는 없고 지반 설명만 있으면 ground에 적는다 (매립 · 충적층이 두꺼운 토사 지반 = SOIL, 연암 · 경암이 얕게 나오는 암반 지반 = ROCK). 역타 = TD, 순타 = BU, SC = 철골 + RC코어, COMP = 강합성. 역타 기준층은 외부 도로와 면해 차량이 드나드는 층. 근거가 없는 값은 null로 두고 추측하지 않는다.\n\n자료:\n' + String(text || '').slice(0, 20000);
  }
  /* AI JSON → 입력 객체 (새 프로젝트 기본값 위에 채움). keys = 채워진 항목 */
  function extractToInp(o) {
    var p = clone(BLANK), keys = [];
    p.name = ''; p.strata = [null, null, null, null];
    function numOk(v) { return v != null && v !== '' && isFinite(+v); }
    if (o.name) { p.name = String(o.name).slice(0, 60); keys.push('name'); }
    if (o.use && GE.USE_H[o.use]) { p.use = o.use; keys.push('use'); }
    ['site', 'bldg', 'gfaUp', 'gfaDn', 'nB', 'nUp', 'nPH', 'gwl', 'geo'].forEach(function (k) { if (numOk(o[k])) { p[k] = r2(+o[k]); keys.push(k); } });
    if (numOk(o.H)) { p.adv.H = r2(+o.H); keys.push('H'); }
    if (p.gfaDn > 0) { if (p.nB > 0) p.aDn = r2(p.gfaDn / p.nB); delete p.gfaDn; }
    var nSt = 0;
    if (o.strata && typeof o.strata === 'object') ['soil', 'wsoil', 'wrock', 'srock'].forEach(function (k, i) { if (numOk(o.strata[k])) { p.strata[i] = r2(+o.strata[k]); nSt++; keys.push('strata.' + k); } });
    if (nSt) p.ground = 'CUSTOM'; else if (o.ground === 'SOIL' || o.ground === 'ROCK') { p.ground = o.ground; keys.push('ground'); }
    if (o.seq === 'TD' || o.seq === 'BU') { p.seq = o.seq; keys.push('seq'); }
    if (numOk(o.tdBase)) { p.tdBase = Math.round(+o.tdBase); keys.push('tdBase'); }
    if (o.wall && GE.WALL_N[o.wall]) { p.wall = o.wall; keys.push('wall'); }
    if (o.support && GE.SUP_N[o.support]) { p.support = o.support; keys.push('support'); }
    if (o.struct && GE.STRUCT_N[o.struct]) { p.struct = o.struct; keys.push('struct'); }
    return { inp: p, keys: keys, notes: o.notes ? String(o.notes) : '' };
  }
  function reviewPrompt(R) {
    var sum = { 프로젝트: R.inp.name, 용도: GE.USE_H[R.basic.use].name, 규모: '지하 ' + R.basic.nB + ' / 지상 ' + R.basic.nUp + ' / 옥탑 ' + R.basic.nPH, 대지: R.geo.site, 건축면적: R.geo.bldg, 연면적: R.geo.gfa,
      시퀀스: SEQ_N[R.basic.seq] + (R.basic.seq === 'TD' ? ' (기준층 ' + R.tdBase.name + ')' : ''), 흙막이: GE.WALL_N[R.basic.wall], 지보: GE.SUP_N[R.basic.sup], 기초: GE.FOUND_N[R.fType], 구조: GE.STRUCT_N[R.basic.struct], 굴착깊이m: R.geo.H, 굴착량: Math.round(R.exc.Vtot || R.geo.Vtot),
      지반: R.ground.name + (R.ground.assumed ? ' (가정 — 주상도 없음)' : ' (주상도 입력)'), 지층두께m: R.ground.st, 지하수위: R.inp.gwl, 가동률: { 토목: R.basic.rExt, 골조: R.basic.rRC },
      CP: R.cpLine.map(function (c) { return { 공종: c.name, 개월: r2(c.d), 누계: r2(c.e) }; }), 총공기: r2(R.total), 범위: [r2(R.sens.lo), r2(R.sens.hi)],
      기초: { Zone: R.found.nZ, 팀: R.found.teams, 사이클WD: R.found.cyc }, 지상기준층WD: r2(Math.max(R.frame.typ.slab.wd, R.frame.typ.core ? R.frame.typ.core.wd : 0)), 주공정: R.frame.gov,
      검토포인트: R.review.map(function (x) { return x.text; }), 경고: R.warn };
    return '너는 대형 건설사 공정 · 공기검토 전문가다. 아래는 공기산정 에이전트가 규칙 기반으로 계산한 결과다. 한국어로 간결하게 검토 의견을 써라.\n형식 (각 줄은 "- "로 시작):\n**핵심 리스크** 3개 (각 1~2문장)\n**확인이 필요한 입력값** 2~3개\n**공기 단축 검토안** 2~3개 (예상 효과를 개월로, 아래 숫자만 근거로)\n규칙: 계산에 없는 숫자를 만들지 말 것. 과장하지 말 것.\n\n데이터:\n' + JSON.stringify(sum);
  }
  function mdSafe(t) {
    var lines = esc(t).split(/\n/), out = '', inList = false;
    lines.forEach(function (ln) {
      var l = ln.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      if (/^\s*[-•]\s+/.test(l)) { if (!inList) { out += '<ul>'; inList = true; } out += '<li>' + l.replace(/^\s*[-•]\s+/, '') + '</li>'; }
      else { if (inList) { out += '</ul>'; inList = false; } if (l.trim()) out += '<p>' + l + '</p>'; }
    });
    return out + (inList ? '</ul>' : '');
  }
  /* 런타임 기능 연결 : cb({ sample, downloads, images }) — 없는 기능은 null */
  function connect(cb) {
    var out = { sample: null, downloads: null, images: null }, n = 0;
    function done() { n++; if (n === 2) cb(out); }
    if (!(root.claude && root.claude.use)) { cb(out); return; }
    root.claude.use('sample').then(function (s) {
      out.sample = s || null;
      if (s && s.limits) s.limits().then(function (lim) { out.images = lim && lim.images ? lim.images : null; done(); }).catch(done); else done();
    }).catch(done);
    root.claude.use('downloads').then(function (d) { out.downloads = d || null; done(); }).catch(done);
  }

  /* ── 엑셀 (downloads + SheetJS) */
  function loadX() {
    return new Promise(function (res, rej) {
      if (root.XLSX) return res(root.XLSX);
      var urls = ['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.mini.min.js', 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.mini.min.js'], i = 0;
      (function next() {
        if (i >= urls.length) return rej(new Error('load'));
        var s = document.createElement('script'); s.src = urls[i++]; s.onload = function () { root.XLSX ? res(root.XLSX) : next(); }; s.onerror = next; document.head.appendChild(s);
      })();
    });
  }
  function buildWorkbook(X, R) {
    var wb = X.utils.book_new(), b = R.basic;
    var inRows = [['공기산정 에이전트 · 입력값', ''], ['프로젝트', R.inp.name], ['용도', GE.USE_H[b.use].name], ['대지면적 (㎡)', R.geo.site], ['건축면적 (㎡)', R.geo.bldg], ['건폐율 (%)', r1(R.geo.coverage * 100)], ['연면적 지상 (㎡)', R.geo.gUp], ['연면적 지하 (㎡)', R.geo.gDn],
      ['지하 / 지상 / 옥탑', b.nB + ' / ' + b.nUp + ' / ' + b.nPH], ['지반 유형', R.ground.name + (R.ground.assumed ? ' (가정)' : '')], ['지층 두께 토사 · 풍화토 · 풍화암 · 연암 (m)', R.ground.st.join(' · ')], ['지하수위 (GL−m)', R.inp.gwl], ['굴착 깊이 (m)', R.geo.H], ['굴착 면적 (㎡)', Math.round(R.geo.Adeep)], ['흙막이 연장 (m)', Math.round(R.geo.P)],
      ['시퀀스', SEQ_N[b.seq] + (b.seq === 'TD' ? ' · 기준층 ' + R.tdBase.name : '')], ['흙막이', GE.WALL_N[b.wall]], ['지보', GE.SUP_N[b.sup]], ['기초', GE.FOUND_N[R.fType]], ['구조', GE.STRUCT_N[b.struct]],
      ['역타 구조제한 (기초 전 / 수직재 전)', b.seq === 'TD' ? R.frame.lim + 'F / ' + R.frame.lim2 + 'F' + (R.tags.lim === '기본' ? ' (기본값)' : '') : '-'], ['가동률 토목 · 외부', b.rExt], ['가동률 골조', b.rRC], ['MOB / 마감 / T&C (개월)', [R.inp.mob, R.inp.fin, R.inp.tc].join(' / ')]];
    var ws0 = X.utils.aoa_to_sheet(inRows); ws0['!cols'] = [{ wch: 34 }, { wch: 40 }]; X.utils.book_append_sheet(wb, ws0, '입력값');
    var rows = [['C.P 산출 내역 (누계 = 이전 누계 + C.P · CD = WD ÷ 가동률)', '', '', '', '', '', ''], ['가동률 토목 · 외부', { t: 'n', v: b.rExt, z: '0.0%' }, '', '가동률 골조', { t: 'n', v: b.rRC, z: '0.0%' }, '', ''], ['공종', '물량', '산출 근거', 'WD', 'C.P (개월)', '누계 (개월)', 'CD (=WD÷가동률)']];
    R.cpLine.forEach(function (c, i) {
      var a = R.acts.filter(function (q) { return q.id === c.id; })[0] || {}, rr = rows.length + 1, rate = a.rate === 'ext' ? '$B$2' : '$E$2';
      rows.push([c.name, a.qty || '', a.basis || '', a.wd ? { t: 'n', v: a.wd, z: '0.0' } : '', { t: 'n', v: c.d, z: '0.00' }, { t: 'n', f: (i === 0 ? 'E' + rr : 'F' + (rr - 1) + '+E' + rr), z: '0.00' }, a.wd ? { t: 'n', f: 'D' + rr + '/' + rate, z: '0.0' } : '']);
    });
    rows.push(['합계 (준공)', '', '', '', { t: 'n', f: 'SUM(E4:E' + rows.length + ')', z: '0.00' }, { t: 'n', f: 'F' + rows.length, z: '0.00' }, '']);
    var ws1 = X.utils.aoa_to_sheet(rows); ws1['!cols'] = [{ wch: 34 }, { wch: 26 }, { wch: 70 }, { wch: 8 }, { wch: 10 }, { wch: 11 }, { wch: 14 }]; X.utils.book_append_sheet(wb, ws1, 'C.P 산출');
    var fr = R.frame, hasCore = fr.coreRows.length > 0, fRows = [['골조 층별 공기 산정 (누계 D = M+0 기준 달력일 · 누계 = MAX(선행 누계) + CD)', '', '', '', '', '', '', ''], ['가동률 골조', { t: 'n', v: b.rRC, z: '0.0%' }, '지상 착수 (D)', { t: 'n', v: fr.start * D, z: '0.0' }, '기초 완료 (D)', { t: 'n', v: R.T_F * D, z: '0.0' }, '수직재 완료 (D)', fr.V_END ? { t: 'n', v: fr.V_END * D, z: '0.0' } : ''],
      ['층', '공종', '산정식', 'WD', 'CD (=WD÷가동률)', '선행 조건', '누계 (D)', '누계 (개월)']];
    var cellOf = {};
    function holdRef(n, isCore) {
      if (b.seq !== 'TD') return null; var L1 = isCore ? fr.limC : fr.lim, L2 = isCore ? fr.lim2C : fr.lim2;
      if (n > L2) return '$H$2'; if (n > L1) return '$F$2'; return null;
    }
    function pushChain(list, kind, gateFn) {
      var prev = null;
      list.forEach(function (x) {
        var rr = fRows.length + 1, refs = [prev || '$D$2'], cond = prev ? '이전 층' : '지상 착수';
        var hr = holdRef(x.n, kind === '코어'); if (hr) { refs.push(hr); cond += ' · 구조제한'; }
        var gt = gateFn ? gateFn(x) : null; if (gt) { refs.push(gt.ref); cond += ' · ' + gt.label; }
        fRows.push([x.lv, kind, x.formula, { t: 'n', v: x.wd, z: '0.0' }, { t: 'n', f: 'D' + rr + '/$B$2', z: '0.0' }, cond, { t: 'n', f: (refs.length > 1 ? 'MAX(' + refs.join(',') + ')' : refs[0]) + '+E' + rr, z: '0.0' }, { t: 'n', f: 'G' + rr + '/30.4', z: '0.00' }]);
        prev = 'G' + rr; cellOf[kind + x.n] = 'G' + rr;
      });
      return prev;
    }
    if (!hasCore) { var last = pushChain(fr.floors, '골조'); if (R.frameLead) { var rr = fRows.length + 1; fRows.push(['파이프라인', '마지막 Zone', 'Zone 완료 지연', { t: 'n', v: R.frameLead, z: '0.0' }, { t: 'n', f: 'D' + rr + '/$B$2', z: '0.0' }, '최상층 완료', { t: 'n', f: last + '+E' + rr, z: '0.0' }, { t: 'n', f: 'G' + rr + '/30.4', z: '0.00' }]); } }
    else {
      var cLast = pushChain(fr.coreRows, '코어');
      var top = fr.coreRows[fr.coreRows.length - 1].n;
      var sLast = pushChain(fr.slabRows, '바닥', fr.struct === 'SC' ? function (x) { var k = Math.min(x.n + 3, top); return cellOf['코어' + k] ? { ref: cellOf['코어' + k], label: '코어 ' + (k > b.nUp ? '옥탑' : (k >= 1 ? k + 'F' : 'B' + (1 - k))) + ' 완료' } : null; } : null);
      var rr2 = fRows.length + 1; fRows.push(['골조 완료', '', fr.struct === 'COMP' ? '코어 마지막 Zone ' + r1(R.frameLead) + 'WD' : '바닥 최종', { t: 'n', v: R.frameLead || 0, z: '0.0' }, { t: 'n', f: 'D' + rr2 + '/$B$2', z: '0.0' }, 'MAX(코어, 바닥)', { t: 'n', f: 'MAX(' + cLast + '+E' + rr2 + ',' + sLast + ')', z: '0.0' }, { t: 'n', f: 'G' + rr2 + '/30.4', z: '0.00' }]);
    }
    var ws2 = X.utils.aoa_to_sheet(fRows); ws2['!cols'] = [{ wch: 9 }, { wch: 7 }, { wch: 52 }, { wch: 8 }, { wch: 14 }, { wch: 26 }, { wch: 11 }, { wch: 11 }]; X.utils.book_append_sheet(wb, ws2, '골조 층별');
    var f = R.found, zr = [['기초 Zone · 철근팀', '', '', '', '', ''], ['Zone', '팀', '구분', '물량 (㎥)', '철근 착수 (WD)', '타설 (WD)']];
    f.sim.Z.slice().sort(function (a, b2) { return a.i - b2.i; }).forEach(function (z) { zr.push(['Z' + (z.i + 1), z.team + '팀', z.pit ? 'PIT' : z.slope ? '경사띠' : z.deep ? '지하부' : '일반', Math.round(f.vZ), r1(z.s), z.pour]); });
    var ws3 = X.utils.aoa_to_sheet(zr); ws3['!cols'] = [{ wch: 8 }, { wch: 6 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 10 }]; X.utils.book_append_sheet(wb, ws3, '기초 Zone');
    return wb;
  }
  /* 엑셀 저장 : 결과 메시지 문자열로 resolve */
  function exportX(R, downloads) {
    return loadX().then(function (X) {
      var wb = buildWorkbook(X, R), out = X.write(wb, { type: 'array', bookType: 'xlsx' });
      var name = (R.inp.name || '프로젝트').replace(/[\\/:*?"<>|]+/g, ' ').trim() + '_공기산정.xlsx';
      return downloads.save({ filename: name, data: new Blob([out]) }).then(function () { return '저장 요청 완료'; });
    }).catch(function (e) { return e && e.code === 'declined' ? '저장 취소됨' : (e && e.message === 'load' ? '엑셀 모듈을 불러오지 못했습니다' : '저장하지 못했습니다'); });
  }

  /* 대표 층고 3개 (지하 · 1층 · 기준층) → 층고 구성 문자열 */
  function simpleH(o, nB, nUp) {
    var t = [];
    if (o.hB > 0 && nB > 0) t.push('B1-' + Math.max(1, nB) + ':' + o.hB);
    if (o.h1 > 0) t.push('1:' + o.h1);
    if (o.hTyp > 0 && nUp > 1) t.push('2-' + nUp + ':' + o.hTyp);
    return t.join(', ');
  }
  /* 입력값 정리 (빈 문자열 → null) */
  function blankNull(v) { return v === '' || v == null || (typeof v === 'number' && !isFinite(v)) ? null : v; }

  /* ── 입력 바인딩 : [data-k="경로"] 입력칸 · [data-chips][data-k] 선택 버튼 묶음 ↔ 상태 객체
     data-type = num | int | pct (화면 %, 상태 0~1) | str (기본). 선택 버튼은 [data-v] 값, data-def = 값이 없을 때 켤 버튼 */
  function getPath(o, k) { return k.split('.').reduce(function (a, p) { return a == null ? a : a[p]; }, o); }
  function setPath(o, k, v) { var ps = k.split('.'), last = ps.pop(), t = ps.reduce(function (a, p) { if (a[p] == null || typeof a[p] !== 'object') a[p] = {}; return a[p]; }, o); t[last] = v; }
  function parseVal(type, raw) {
    if (type === 'num' || type === 'int' || type === 'pct') { if (raw === '' || raw == null) return null; var x = parseFloat(raw); if (!isFinite(x)) return null; return type === 'int' ? Math.round(x) : type === 'pct' ? x / 100 : x; }
    if (type === 'bool') return raw === true || raw === 'true';
    return raw;
  }
  function fillOne(el, st) {
    var k = el.getAttribute('data-k'), v = getPath(st, k), type = el.getAttribute('data-type');
    if (el.hasAttribute('data-chips')) {
      var cur = v == null || v === '' ? el.getAttribute('data-def') : v;
      el.querySelectorAll('[data-v]').forEach(function (b) { var on = String(parseVal(type, b.getAttribute('data-v'))) === String(parseVal(type, cur)); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      return;
    }
    if (el.type === 'checkbox') { el.checked = !!v; return; }
    if (document.activeElement === el) return;
    el.value = v == null || v === '' || (typeof v === 'number' && !isFinite(v)) ? '' : (type === 'pct' ? r1(v * 100) : v);
  }
  function fill(rootEl, st) { Array.prototype.forEach.call(rootEl.querySelectorAll('[data-k]'), function (el) { fillOne(el, st); }); }
  function bind(rootEl, getS, onChange) {
    Array.prototype.forEach.call(rootEl.querySelectorAll('[data-k]'), function (el) {
      var k = el.getAttribute('data-k'), type = el.getAttribute('data-type');
      if (el.hasAttribute('data-chips')) {
        el.addEventListener('click', function (e) { var b = e.target.closest('[data-v]'); if (!b || !el.contains(b) || b.disabled) return; var val = parseVal(type, b.getAttribute('data-v')); setPath(getS(), k, val); fillOne(el, getS()); onChange(k, val); });
        return;
      }
      var ev = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(ev, function () { var val = el.type === 'checkbox' ? el.checked : parseVal(type, el.value); setPath(getS(), k, val); onChange(k, val); });
    });
  }

  /* ── 화면 버전 공용 : 입력 정리 · 층고 구성 · AI 추출 · 요약 문장 */
  function hasVal(x) { return x != null && x !== '' && isFinite(+x); }
  function normInp(p) {
    p = clone(p || BLANK); p.adv = p.adv || {};
    var st = Array.isArray(p.strata) ? p.strata.slice(0, 4) : [];
    while (st.length < 4) st.push(null);
    p.strata = st.map(function (x) { return hasVal(x) ? +x : null; });
    p.ground = p.ground && (GE.GROUND[p.ground] || p.ground === 'CUSTOM') ? p.ground : (p.strata.some(hasVal) ? 'CUSTOM' : 'AUTO');
    [['mob', 1.0], ['fin', 8.0], ['tc', 2.0], ['rExt', 0.702], ['rRC', 0.585], ['hours', 8], ['tdBase', 0]].forEach(function (d) { if (!hasVal(p[d[0]])) p[d[0]] = d[1]; });
    if (!p.use) p.use = 'office';
    /* 옛 입력 : 지하 연면적 (gfaDn) → 지하층 바닥면적 (층당, aDn) */
    if (!hasVal(p.aDn) || !(+p.aDn > 0)) { if (+p.gfaDn > 0 && +p.nB > 0) p.aDn = Math.round(p.gfaDn / p.nB * 100) / 100; }
    delete p.gfaDn;
    return p;
  }
  /* 사례 층고 구성 (orig) 위에 대표 층고 (지하 · 1층 · 기준층) 덮어쓰기 — 뒤 항목이 앞 항목을 이긴다 */
  function composeH(orig, hs, nB, nUp) {
    hs = hs || {}; var any = ['hB', 'h1', 'hTyp'].some(function (k) { return hs[k] > 0; });
    return [orig || '', any ? simpleH(hs, Math.max(0, +nB || 0), Math.max(1, +nUp || 1)) : ''].filter(Boolean).join(', ');
  }
  var AI_K = { name: 'name', site: 'site', bldg: 'bldg', gfaUp: 'gfaUp', gfaDn: 'aDn', nB: 'nB', nUp: 'nUp', nPH: 'nPH', H: 'adv.H', gwl: 'gwl', geo: 'geo', 'strata.soil': 'strata.0', 'strata.wsoil': 'strata.1', 'strata.wrock': 'strata.2', 'strata.srock': 'strata.3' };
  function aiExtract(sample, text, imgs) {
    var opt = { modelTier: 'default' }; if (imgs && imgs.length) opt.images = imgs;
    return sample.json(extractPrompt(text), opt).then(function (o) { if (!o || typeof o !== 'object') throw { code: 'invalid_json' }; var res = extractToInp(o); res.paths = res.keys.map(function (k) { return AI_K[k]; }).filter(Boolean); return res; });
  }
  function ymText(m) { var y = Math.floor(m / 12 + 1e-9), mo = Math.round(m - y * 12); if (mo >= 12) { y++; mo -= 12; } return (y ? y + '년' : '') + (mo ? (y ? ' ' : '') + mo + '개월' : (y ? '' : '1개월 미만')); }
  function tactOf(R) { var t = R.frame.typ; return Math.max(t.slab.wd, t.core ? t.core.wd : 0); }
  function topCtx(p, R) {
    var g = R.geo, f = R.found;
    if (p.id === 'exc') return ' (굴착 ' + fmt(R.exc.Vtot || g.Vtot) + '㎥ · GL−' + r1(g.H) + 'm)';
    if (p.id === 'frame') return ' (' + R.basic.nUp + '개층 · 층당 ' + m1(tactOf(R)) + 'WD)';
    if (p.id === 'found') return ' (' + f.nZ + ' Zone · ' + fmt(f.V) + '㎥)';
    if (p.id === 'fin') return ' (마감 기본값, 사양에 따라 조정)';
    if (p.id === 'base') return ' (지하 ' + R.basic.nB + '개층)';
    return '';
  }
  /* 결론 문장 (개조식) — HTML 문자열 배열. R.sens 필요 */
  function summaryLines(R) {
    var b = R.basic, g = R.geo, gr = cpGroups(R), parts = cpParts(R).slice().sort(function (a, c) { return c.d - a.d; }), top = parts[0], L = [];
    var pc = function (x) { return Math.round(x / Math.max(0.1, R.total) * 100); };
    L.push('적정 공사기간 <b class="cp">' + m1(R.total) + '개월</b> (약 ' + ymText(R.total) + ')' + (R.sens ? ' · 범위 ' + m1(R.sens.lo) + ' ~ ' + m1(R.sens.hi) + '개월' : ''));
    L.push('공기 구성 : 준비 ' + m1(gr['준비']) + ' · 토목 <b>' + m1(gr['토목']) + '</b> · 골조 <b>' + m1(gr['골조']) + '</b> · 마감 ' + m1(gr['마감']) + '개월 (토목 ' + pc(gr['토목']) + '% · 골조 ' + pc(gr['골조']) + '%)');
    if (top) L.push('최대 주공정 : <b>' + esc(top.label) + ' ' + m1(top.d) + '개월</b>' + esc(topCtx(top, R)));
    if (b.seq === 'TD') L.push('역타 : 기준층 <b>' + esc(R.tdBase.name) + '</b> · 구조제한 기초 완료 전 지상 ' + R.frame.lim + 'F / 수직재 완료 전 ' + R.frame.lim2 + 'F' + (R.tags.lim === '기본' ? ' (모름 → 기본값 지하 + 지상 ' + (b.nB + R.frame.lim) + '개층)' : ' (입력)'));
    L.push('지반 : ' + (R.ground.assumed ? '주상도 없이 <b>' + esc(R.ground.name) + '</b> 분포 가정 (주상도 확인 필요)' : '주상도 입력값 적용') + (b.nB > 0 ? ' · 굴착 GL−' + r1(g.H) + 'm' : ''));
    return L;
  }

  /* ── 가정 단면 : 층별 층고 (단면의 칸에서 바로 수정) · 타설 회수 · 지하 · 지층 · 지보 · 기초 */
  function hSpecOf(hB, hUp, hPH) {
    var out = [];
    function runs(arr, pre) {
      for (var i = 0; i < arr.length;) {
        var j = i; while (j + 1 < arr.length && Math.abs(arr[j + 1] - arr[i]) < 1e-9) j++;
        out.push((i === j ? pre + (i + 1) : pre + (i + 1) + '-' + pre + (j + 1)) + ':' + (+(+arr[i]).toFixed(3)));
        i = j + 1;
      }
    }
    runs(hB, 'B'); runs(hUp, ''); runs(hPH, 'PH');
    return out.join(', ');
  }
  /* 층 목록 (위 → 아래) + 타설 회수 판정 : DC = 층고 분할 기준, 코어 = Lift, 지하 = 외벽 끊어치기, 그 외 RC = 층고 보정 계수 */
  function secLevels(R) {
    var g = R.geo, b = R.basic, fr = R.frame, L = [], fl = {}, cr = {}, bs = {};
    fr.floors.forEach(function (x) { fl[x.lv] = x; }); fr.coreRows.forEach(function (x) { cr[x.lv] = x; });
    if (R.base && R.base.rows) R.base.rows.forEach(function (x) { bs[x.lv] = x; });
    for (var k = b.nPH; k >= 1; k--) L.push({ kind: 'ph', i: k - 1, lv: b.nPH > 1 ? '옥탑' + k : '옥탑', h: g.hPH[k - 1] });
    for (var n = b.nUp; n >= 1; n--) L.push({ kind: 'up', i: n - 1, lv: n + 'F', h: g.hUp[n - 1] });
    for (k = 1; k <= b.nB; k++) L.push({ kind: 'b', i: k - 1, lv: 'B' + k, h: g.hB[k - 1] });
    L.forEach(function (x) {
      var f = fl[x.lv], c = cr[x.lv], br = bs[x.lv];
      if (f && f.dc) { x.n = f.dc.lifts; x.p = x.n > 1 ? x.n + '회 타설' : '1회 타설'; }
      else if (c) { x.n = c.lifts; x.p = '코어 ' + c.lifts + '회'; }
      else if (br) { x.n = br.lifts; x.p = '외벽 ' + br.lifts + '회'; }
      else if (f && f.lifts) { x.n = f.lifts; x.p = f.lifts > 1 ? f.lifts + '회 타설' : '1회 타설'; }
      else if (f && f.hf > 1.001) { x.n = 1; x.p = '층고 ×' + r2(f.hf); }
      else { x.n = 1; x.p = ''; }
    });
    var G = [];
    L.forEach(function (x) {
      var last = G[G.length - 1];
      if (last && last.kind === x.kind && x.kind !== 'b' && x.lv !== '1F' && Math.abs(last.h - x.h) < 1e-9 && last.p === x.p) last.items.push(x);
      else G.push({ kind: x.kind, h: x.h, p: x.p, n: x.n, items: [x] });
    });
    var out = [];
    G.forEach(function (gr) { if (gr.items.length === 1 || gr.items.length >= 3) out.push(gr); else gr.items.forEach(function (x) { out.push({ kind: x.kind, h: x.h, p: x.p, n: x.n, items: [x] }); }); });
    out.forEach(function (gr) { var lo = gr.items[gr.items.length - 1].lv, hi = gr.items[0].lv; gr.label = gr.items.length > 1 ? lo.replace(/F$/, '') + '~' + hi : hi; gr.cnt = gr.items.length; });
    return out;
  }
  function section(R, L, Wc) {
    var W = Math.max(300, Math.min(640, Math.floor(Wc || 640))), bx = W < 520 ? 70 : 150, bw = W - bx - (W < 520 ? 132 : 150);
    var g = R.geo, b = R.basic, G = secLevels(R), k = 6, MIN = 24, top = 30;
    var rows = G.map(function (gr) { return { gr: gr, hp: Math.max(MIN, gr.h * k * (gr.cnt > 1 ? 1.6 : 1)) }; });
    var y = top, yGL = top;
    rows.forEach(function (r) { r.y0 = y; y += r.hp; r.y1 = y; if (r.gr.kind !== 'b') yGL = y; });
    /* 깊이 → y : 지하층 칸을 따라 구간별로, 그 아래는 k px/m */
    var pts = [[0, yGL]], d = 0;
    rows.forEach(function (r) { if (r.gr.kind === 'b') { d += r.gr.h; pts.push([d, r.y1]); } });
    function yd(dep) {
      for (var i = 1; i < pts.length; i++) if (dep <= pts[i][0]) return pts[i - 1][1] + (dep - pts[i - 1][0]) / Math.max(1e-6, pts[i][0] - pts[i - 1][0]) * (pts[i][1] - pts[i - 1][1]);
      var lp = pts[pts.length - 1]; return lp[1] + (dep - lp[0]) * k;
    }
    var sumB = d, matTop = b.nB > 0 ? sumB : 0, matBot = matTop + g.tMat, Hx = b.nB > 0 ? g.H : g.Hs;
    var pileL = R.pile ? 8 : 0, maxD = Math.max(Hx, matBot) + pileL + 4, Ht = Math.ceil(yd(maxD)) + 26;
    var s = '', LK = GE.LK, LC = ['soil', 'wsoil', 'wrock', 'srock', 'hrock'];
    /* 지층 (GL 아래 전폭) */
    for (var i = 0; i < 5; i++) {
      var a = g.z[i], c = Math.min(g.z[i + 1], maxD); if (!(c > a)) continue;
      s += '<rect x="0" y="' + r1(yd(a)) + '" width="' + W + '" height="' + r1(yd(c) - yd(a)) + '" fill="var(--' + LC[i] + ')" opacity=".55"/>';
      if (i > 0 && a < maxD) s += txt(W - 4, yd(a) - 3, 'GL−' + r1(a) + ' ' + GE.LN[LK[i]].replace(/\(.*\)/, ''), { anchor: 'end', fs: 10, fill: 'var(--ink-2)', cls: 't-num' });
    }
    s += txt(W - 4, yGL + 12, GE.LN.soil.replace(/\(.*\)/, '') + (R.ground.assumed ? ' · 지반 가정' : ''), { anchor: 'end', fs: 10, fill: 'var(--ink-2)' });
    /* 굴착 · 오픈컷 사면 · 흙막이 · 지보 */
    if (b.nB > 0) {
      var yH = yd(Hx);
      if (b.sup === 'OPEN') s += '<path d="M' + (bx - 4) + ' ' + r1(yH) + ' L' + r1(Math.max(4, bx - 4 - (yH - yGL) * 1.2)) + ' ' + r1(yGL) + '" stroke="var(--ink-2)" stroke-width="1.4" fill="none"/>' + txt(Math.max(8, bx - 4 - (yH - yGL) * 1.2) + 2, yGL - 4, '오픈컷 1:' + (L ? L.exc.slope : 1.5), { fs: 10, fill: 'var(--ink-2)' });
      else {
        s += '<line x1="' + (bx - 5) + '" x2="' + (bx - 5) + '" y1="' + r1(yGL - 6) + '" y2="' + r1(yd(Hx + 2)) + '" stroke="var(--ink)" stroke-width="3"/>';
        s += txt(bx - 9, yGL - 8, b.seq === 'TD' ? '역타 (슬래브 지지)' : GE.WALL_N[b.wall], { anchor: 'end', fs: 10, fill: 'var(--ink-2)' });
        if (R.exc && R.exc.ns > 0 && L && L.support[b.sup]) {
          var sp = L.support[b.sup].sp;
          for (var q = 0; q < R.exc.ns; q++) {
            var dq = Math.min(Hx - 0.5, 1.5 + q * sp), yq = yd(dq);
            s += b.sup === 'ANCHOR' ? '<line x1="' + (bx - 5) + '" y1="' + r1(yq) + '" x2="' + (bx - 60) + '" y2="' + r1(yq + 14) + '" stroke="var(--cp)" stroke-width="1.6"/>' : '<line x1="' + (bx - 5) + '" y1="' + r1(yq) + '" x2="' + (bx + bw) + '" y2="' + r1(yq) + '" stroke="var(--cp)" stroke-width="1.6" stroke-dasharray="6 3"/>';
          }
          s += txt(bx - 64, yd(1.5) + 4, ({ ANCHOR: '어스앵커', STRUT: '스트럿', RAKER: '레이커' }[b.sup]) + ' ' + R.exc.ns + '단', { anchor: 'end', fs: 11, fill: 'var(--cp)', w: 600 });
        }
      }
      s += '<line x1="' + (bx - 30) + '" x2="' + (bx + bw + 30) + '" y1="' + r1(yH) + '" y2="' + r1(yH) + '" stroke="var(--cp)" stroke-dasharray="5 3"/>' + txt(bx + bw + 34, yH + 4, '굴착 GL−' + r1(Hx) + 'm', { fs: 10.5, fill: 'var(--cp)', w: 600, cls: 't-num' });
    }
    if (isFinite(g.gwl)) s += '<line x1="0" x2="' + (bx - 8) + '" y1="' + r1(yd(g.gwl)) + '" y2="' + r1(yd(g.gwl)) + '" stroke="var(--gwl)" stroke-dasharray="3 3"/>' + txt(4, yd(g.gwl) - 3, '지하수위 GL−' + r1(g.gwl), { fs: 10, fill: 'var(--gwl)', cls: 't-num' });
    /* 기초 · 파일 */
    s += '<rect x="' + bx + '" y="' + r1(yd(matTop)) + '" width="' + bw + '" height="' + r1(Math.max(4, yd(matBot) - yd(matTop))) + '" fill="var(--slate-2)" stroke="var(--ink-2)"/>' + txt(bx + bw / 2, yd(matTop) + Math.max(4, yd(matBot) - yd(matTop)) / 2 + 4, '기초 ' + GE.FOUND_N[R.fType].replace(/ \(.*\)/, '') + ' t=' + r1(g.tMat) + 'm', { anchor: 'middle', fs: 10.5, fill: 'var(--ink)', w: 500 });
    if (R.pile) {
      for (var p = 0; p < 9; p++) { var px = bx + 12 + p * (bw - 24) / 8; s += '<line x1="' + r1(px) + '" x2="' + r1(px) + '" y1="' + r1(yd(matBot)) + '" y2="' + r1(yd(matBot + pileL)) + '" stroke="var(--ink-2)" stroke-width="2"/>'; }
      s += txt(bx + bw + 8, yd(matBot + pileL / 2), (R.fType === 'PHC' ? 'PHC ' : '현장타설 ') + fmt(R.pile.n) + '본', { fs: 10.5, fill: 'var(--ink-2)' });
    }
    /* 층 */
    var el = 0, html = '';
    rows.slice().reverse().forEach(function (r) { if (r.gr.kind !== 'b') { r.elB = el; el += r.gr.h * r.gr.cnt; r.elT = el; } });
    rows.forEach(function (r, gi) {
      var gr = r.gr, two = gr.n > 1, fill = gr.kind === 'b' ? 'var(--sheet-2)' : 'var(--sheet)';
      s += '<rect x="' + bx + '" y="' + r1(r.y0) + '" width="' + bw + '" height="' + r1(r.hp) + '" fill="' + fill + '" stroke="var(--ink-2)" stroke-width=".8"/>';
      s += '<line x1="' + bx + '" x2="' + (bx + bw) + '" y1="' + r1(r.y0) + '" y2="' + r1(r.y0) + '" stroke="var(--ink)" stroke-width="2.2"/>';
      if (gr.cnt > 1) for (var j = 1; j < Math.min(gr.cnt, 5); j++) { var yj = r.y0 + r.hp * j / Math.min(gr.cnt, 5); s += '<line x1="' + bx + '" x2="' + (bx + bw) + '" y1="' + r1(yj) + '" y2="' + r1(yj) + '" stroke="var(--slate)" stroke-dasharray="4 3"/>'; }
      if (two) s += '<rect x="' + (bx + bw - 10) + '" y="' + r1(r.y0 + 2) + '" width="6" height="' + r1(r.hp / gr.n - 3) + '" fill="var(--cp)" opacity=".75"/><rect x="' + (bx + bw - 10) + '" y="' + r1(r.y0 + r.hp / gr.n + 1) + '" width="6" height="' + r1(r.hp - r.hp / gr.n - 3) + '" fill="var(--cp)" opacity=".4"/>';
      s += txt(bx + 8, (r.y0 + r.y1) / 2 + 4.5, gr.label + (gr.cnt > 1 ? ' (' + gr.cnt + '개층)' : ''), { fs: 13, fill: 'var(--navy, var(--ink))', w: 600 });
      if (gr.p) s += txt(bx + bw + 72, (r.y0 + r.y1) / 2 + 4.5, gr.p, { fs: W < 520 ? 11 : 12.5, fill: two ? 'var(--cp)' : 'var(--ink-2)', w: two ? 700 : 500 });
      if (gr.kind !== 'b' && r.elB > 0) s += txt(bx - 8, r.y1 + 4, 'EL+' + r1(r.elB), { anchor: 'end', fs: 9.5, fill: 'var(--ink-3)', cls: 't-num' });
      html += '<input class="sec-h" type="number" min="2" max="30" step="0.1" inputmode="decimal" data-g="' + gi + '" data-floor-h="' + esc(gr.label) + '" value="' + (+gr.h.toFixed(2)) + '" aria-label="' + esc(gr.label) + ' 층고 (m)" title="' + esc(gr.label) + ' 층고 — 바꾸면 바로 공기에 반영" style="left:' + (bx + bw + 8) + 'px;top:' + r1((r.y0 + r.y1) / 2 - 11) + 'px">';
    });
    s += '<line x1="0" x2="' + W + '" y1="' + r1(yGL) + '" y2="' + r1(yGL) + '" stroke="var(--ink)" stroke-width="1.6"/>' + txt(4, yGL - 4, 'GL ±0', { fs: 11, fill: 'var(--ink)', w: 600 });
    s += txt(bx + bw / 2, top - 10, '건물 높이 ' + r1(el) + 'm · 지상 ' + b.nUp + '층' + (b.nPH ? ' + 옥탑 ' + b.nPH : '') + (b.nB ? ' / 지하 ' + b.nB + '층' : ''), { anchor: 'middle', fs: 11, fill: 'var(--ink-2)' });
    s += txt(bx + bw + 8, top - 10, '층고 (m)', { fs: 10, fill: 'var(--ink-3)' });
    return { html: '<div class="sec" style="width:' + W + 'px;height:' + Ht + 'px">' + svgEl(W, Ht, s, '가정 단면도') + html + '</div>', groups: G };
  }
  /* 단면 칸에서 바꾼 층고 → 층고 구성 문자열 */
  function secEdit(R, G, gi, h) {
    var g = R.geo, A = { b: g.hB.slice(), up: g.hUp.slice(), ph: g.hPH.slice() };
    G[gi].items.forEach(function (x) { A[x.kind][x.i] = h; });
    return hSpecOf(A.b, A.up, A.ph);
  }

  /* ── 조닝 계획 (개략 평면) : 칸 = Zone, 색 = 팀, 숫자 = 팀 안 타설 순서 */
  /* 팀 색 : 화면 토큰 --t1 ~ --t6 (블루 계열) 이 있으면 그 색, 없으면 기존 토큰 */
  var TEAMC = ['var(--t1, var(--accent))', 'var(--t2, var(--ok))', 'var(--t3, var(--warn))', 'var(--t4, var(--navy))', 'var(--t5, var(--cp))', 'var(--t6, var(--slate))', 'var(--slate, var(--wrock))', 'var(--hrock)'];
  function zgrid(x0, y0, w, h, N, cellOf) {
    /* 행 수 = 칸이 정사각형에 가깝게, 행마다 칸 수를 나눠 직사각형을 빈칸 없이 채움 · 행마다 방향을 바꿔 (지그재그) 순서가 이어지게 */
    var rws = Math.max(1, Math.min(N, Math.round(Math.sqrt(N * h / Math.max(w, 1))))), base = Math.floor(N / rws), extra = N % rws, ch = h / rws, s = '', i = 0;
    for (var r = 0; r < rws; r++) {
      var nc = base + (r < extra ? 1 : 0), cw = w / nc;
      for (var c = 0; c < nc; c++, i++) {
        var cc = r % 2 ? nc - 1 - c : c, o = cellOf(i), X = x0 + cc * cw, Y = y0 + r * ch;
        s += '<rect x="' + r1(X + 1) + '" y="' + r1(Y + 1) + '" width="' + r1(Math.max(1, cw - 2)) + '" height="' + r1(Math.max(1, ch - 2)) + '" rx="2" fill="' + o.fill + '" opacity="' + (o.op || .35) + '" stroke="' + o.stroke + '"/>';
        if (cw > 16 && ch > 13) s += txt(X + cw / 2, Y + ch / 2 + 4, o.t, { anchor: 'middle', fs: cw > 30 && ch > 22 ? 12 : 9.5, fill: 'var(--ink)', w: 600, cls: 't-num' });
      }
    }
    return s;
  }
  function zteams(N, T) { var per = Math.ceil(N / T); return function (i) { var t = Math.floor(i / per); return { team: t, ord: i - t * per + 1 }; }; }
  function zcard(title, sub, svg, legend) { return '<div class="zcard"><h4>' + esc(title) + '</h4><div class="chart">' + svg + '</div><div class="zsub">' + sub + '</div>' + (legend ? '<div class="legend">' + legend + '</div>' : '') + '</div>'; }
  function tLegend(T) { var o = ''; for (var t = 0; t < Math.min(T, 8); t++) o += '<span><i style="background:' + TEAMC[t] + ';opacity:.6"></i>' + (t + 1) + '팀</span>'; return o; }
  /* 세 평면을 같은 축척의 직사각형으로 : 면적 = 입력값 기준 (기초 면적 · 지하층 바닥 = 지하 연면적 ÷ 층수 · 기준층 = 지상 연면적 ÷ 층수), 장단변비 AR 가정 */
  function zonePlans(R, Lb) {
    var f = R.found, b = R.basic, g = R.geo, fr = R.frame, AR = 1.6, W = 300, P = 8, out = '';
    var Af = f.Af > 0 ? f.Af : g.bldg, Ab = b.nB > 0 ? g.AdnEff : 0, Au = fr.Atyp;
    function dim(A) { return { A: A, L: Math.sqrt(Math.max(A, 0) * AR), B: Math.sqrt(Math.max(A, 0) / AR) }; }
    var dF = dim(Af), dB = dim(Ab), dU = dim(Au), sc = (W - P * 2) / Math.max(dF.L, dB.L, dU.L, 1);
    function plan(d, inner, ghost) {
      var w = Math.max(8, d.L * sc), h = Math.max(8, d.B * sc), H = Math.max(ghost ? ghost.B * sc : 0, h) + P * 2 + 18, s = '';
      if (ghost) s += '<rect x="' + P + '" y="' + P + '" width="' + r1(ghost.L * sc) + '" height="' + r1(ghost.B * sc) + '" fill="none" stroke="var(--slate)" stroke-dasharray="4 3"/>';
      s += inner(P, P, w, h) + '<rect x="' + P + '" y="' + P + '" width="' + r1(w) + '" height="' + r1(h) + '" fill="none" stroke="var(--ink)" stroke-width="1.6"/>';
      s += txt(P, H - 5, '≈ ' + r1(d.L) + ' × ' + r1(d.B) + 'm · ' + fmt(d.A) + '㎡', { fs: 11, fill: 'var(--ink-2)', cls: 't-num' });
      return svgEl(W, H, s, '조닝 평면');
    }
    /* 기초 */
    var Z = f.sim.Z.slice().sort(function (a, c) { return a.pour - c.pour; }), rank = {}, byI = {}; Z.forEach(function (z, i) { rank[z.i] = i + 1; byI[z.i] = z; });
    out += zcard('기초', f.nZ + ' Zone · 철근 ' + f.teams + '팀 · Zone ' + fmt(f.vZ) + '㎥ · 사이클 ' + r1(f.cyc) + 'WD · 매트 ' + r1(g.tMat) + 'm' + (f.nPit ? ' · PIT ' + f.nPit + ' Zone (빨간 테두리)' : '') + (f.nSlopeZ ? ' · 연한 칸 = 경사띠' : ''),
      plan(dF, function (x, y, w, h) { return zgrid(x, y, w, h, f.nZ, function (i) { var z = byI[i] || { team: 1 }; return { fill: TEAMC[(z.team - 1) % 8], stroke: z.pit ? 'var(--cp)' : 'var(--sheet)', op: z.slope ? .22 : .5, t: rank[i] || '' }; }); }), tLegend(f.teams) + '<span>숫자 = 타설 순서</span>');
    /* 지하골조 */
    var bs = R.base;
    if (!bs || b.nB === 0) out += zcard('지하골조', '지하층 없음', svgEl(W, 60, txt(W / 2, 34, '지하층 없음', { anchor: 'middle', fs: 13, fill: 'var(--ink-3)' }), '지하골조'), '');
    else {
      var NZ, NT, sub;
      if (bs.td) { NZ = 3; NT = 3; sub = '역타 : 지하 슬래브 3 Zone 순환 · 굴착 단계마다 반복 · 기초 후 수직재 ' + bs.nPost + '개층'; }
      else if (bs.partial) { NZ = Math.max(1, Math.round(Ab / Lb.base.zoneA)); NT = Math.ceil(NZ / Lb.base.zpt - 1e-9); var p = bs.path; sub = '부분 지하 (점선 = 기초 외곽) : 지하부 Zone 완료 → 외벽 ' + r1(p.walls) + 'WD' + (p.backfill ? ' → 방수 · 되메우기' : '') + ' → 바닥 ' + p.nSlab + '개층 × ' + r1(p.slabPer) + 'WD'; }
      else { var r0 = bs.rows[bs.rows.length - 1]; NZ = r0.Z; NT = r0.T; sub = r0.slab + ' 바닥 ' + NZ + ' Zone · ' + NT + '팀 · 외벽 ' + r0.lifts + '회 끊어치기 (B1 층고 ' + r1(r0.h) + 'm)'; }
      var tb = zteams(NZ, NT);
      out += zcard('지하골조 (지하 ' + b.nB + '개층 × 바닥 ' + fmt(Ab) + '㎡)', sub, plan(dB, function (x, y, w, h) { return zgrid(x, y, w, h, NZ, function (i) { var q = tb(i); return { fill: TEAMC[q.team % 8], stroke: 'var(--sheet)', op: .5, t: q.ord }; }); }, Ab < Af * 0.97 ? dF : null), tLegend(NT) + '<span>숫자 = 팀 안 순서</span>');
    }
    /* 지상 기준층 : 코어는 오른쪽 띠 (면적 비례) */
    var ty = fr.typ, NP, TP, NC = 0, TC = 0, Ac = 0;
    if (ty.dc) { NP = ty.dc.P.N; TP = ty.dc.P.T; NC = ty.dc.C.N; TC = ty.dc.C.T; Ac = ty.dc.Ac; }
    else { NP = ty.slab.Z; TP = ty.slab.T; if (ty.core) { NC = ty.core.Z; TC = ty.core.T; Ac = Au * Lb.frame.core.ratio; } }
    var tp = zteams(NP, TP), tc = NC ? zteams(NC, TC) : null;
    var usub = (ty.dc ? '외주부 ' + NP + ' Zone · ' + TP + '팀 (' + r1(ty.dc.P.zone) + 'WD) / 코어 ' + NC + ' Zone · ' + TC + '팀 (' + r1(ty.dc.C.zone) + 'WD) · 분리 타설' : '바닥 ' + NP + ' Zone · ' + TP + '팀' + (NC ? ' / 코어 ' + NC + ' Zone · ' + TC + '팀 (선행)' : '')) + ' · 기준층 ' + ty.n + 'F 층고 ' + r1(ty.h) + 'm';
    out += zcard('지상 기준층 (지상 ' + b.nUp + '층 × ' + fmt(Au) + '㎡)', usub, plan(dU, function (x, y, w, h) {
      var cw = NC ? Math.min(w * 0.45, Math.max(14, Ac / Math.max(dU.B, 1) * sc)) : 0, s = zgrid(x, y, w - cw, h, NP, function (i) { var q = tp(i); return { fill: TEAMC[q.team % 8], stroke: 'var(--sheet)', op: .5, t: q.ord }; });
      if (NC) s += zgrid(x + w - cw, y, cw, h, NC, function (i) { var q = tc(i); return { fill: 'var(--ink-2)', stroke: 'var(--sheet)', op: .55 + .15 * (q.team % 2), t: q.ord }; });
      return s;
    }), tLegend(TP) + (NC ? '<span><i style="background:var(--ink-2);opacity:.6"></i>코어 (오른쪽 띠, ' + fmt(Ac) + '㎡)</span>' : '') + '<span>숫자 = 팀 안 순서</span>');
    return out;
  }

  /* ── 공종별 C.P 구간 : 공종 기간 중 앞부분 Non-C.P (직전 공종과 병행) · C.P · 전체 Non-C.P */
  function cpBreak(R) {
    var cps = R.acts.filter(function (a) { return a.cp; }), mx = 0, rows = [];
    R.acts.forEach(function (a) { mx = Math.max(mx, a.e - a.s); });
    cps.forEach(function (a, i) {
      var prevE = i > 0 ? R.cpLine[i - 1].e : 0, d = R.cpLine[i].d, pre = Math.max(0, Math.min(a.e, prevE) - a.s), post = Math.max(0, (a.e - a.s) - pre - d);
      rows.push({ a: a, pre: pre, cp: d, post: post, by: i > 0 && pre > 0.005 ? shortName(cps[i - 1], R) : '' });
    });
    R.acts.filter(function (a) { return !a.cp; }).forEach(function (a) { rows.push({ a: a, pre: 0, cp: 0, post: a.e - a.s, by: '', non: true }); });
    var h = '';
    rows.forEach(function (r) {
      var a = r.a, tot = a.e - a.s, pc = function (v) { return (v / Math.max(mx, 0.01) * 100).toFixed(2) + '%'; };
      var parts = [];
      if (r.non) parts.push('전체 Non-C.P (여유)');
      else {
        if (r.pre > 0.05) parts.push('앞 ' + m1(r.pre) + ' Non-C.P' + (r.by ? ' (' + r.by + '와 병행)' : ''));
        parts.push(r.cp > 0.005 ? 'C.P ' + m1(r.cp) : 'C.P 기여 없음 (앞 공종 안에서 끝남)');
        if (r.post > 0.05) parts.push('뒤 ' + m1(r.post) + ' Non-C.P');
      }
      h += '<div class="cpb-row' + (r.non ? ' non' : '') + '"><div class="cpb-n">' + esc(shortName(a, R)) + '<span class="mono">' + m1(tot) + '개월</span></div>' +
        '<div class="cpb-bar" title="M+' + m2(a.s) + ' ~ M+' + m2(a.e) + '"><i class="pre" style="width:' + pc(r.pre) + '"></i><i class="' + (r.non ? 'nonbar' : 'cp') + '" style="width:' + pc(r.non ? r.post : r.cp) + '"></i>' + (!r.non && r.post > 0.005 ? '<i class="pre" style="width:' + pc(r.post) + '"></i>' : '') + '</div>' +
        '<div class="cpb-t"><b>' + esc(parts.join(' · ')) + '</b><span title="' + esc(a.basis || '') + '">' + esc(a.basis || '') + '</span></div></div>';
    });
    return h;
  }

  /* ── 주요 판단 카드 : 에이전트가 정한 값과 그 이유를 한 줄로 */
  function keyFacts(R, L) {
    var g = R.geo, b = R.basic, fr = R.frame, A = R.inp.adv || {}, F = [];
    function add(k, v, why, hi) { F.push({ k: k, v: v, why: why, hi: !!hi }); }
    if (b.nB > 0) add('굴착 깊이', 'GL−' + r1(g.H) + 'm', g.Hfix ? '고정값' : (b.seq === 'TD' ? '역타 층 층고 합' : '지하 층고 합 ' + r1(g.sumB) + 'm') + ' + 기초 ' + r1(g.tMat) + 'm + 0.3m');
    if (b.nB > 0) {
      if (R.exc && R.exc.ns > 0) { var sp = L.support[b.sup].sp, an = R.exc.anchor; add(GE.SUP_N[b.sup], R.exc.ns + '단', '굴착 ' + r1(g.H) + 'm 에서 첫 단 1.5m · 간격 ' + sp + 'm' + (an ? ' · 단당 ' + fmt(an.perStage) + '본, 총 ' + fmt(an.total) + '본 · ' + an.sets + '조' : ''), true); }
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
    if (isFinite(g.gwl) && b.nB > 0) add('지하수위', 'GL−' + r1(g.gwl) + 'm', g.gwl < g.H ? '굴착 바닥이 수위보다 ' + r1(g.H - g.gwl) + 'm 아래' : '굴착 바닥보다 깊음');
    var t = tactOf(R), ty = fr.typ;
    add('지상 기준층', m1(t) + 'WD/층', ty.dc ? 'DC 사이클 · 외주부 ' + ty.dc.P.N + ' / 코어 ' + ty.dc.C.N + ' Zone · ' + ty.dc.gov + ' 지배' : '바닥 ' + ty.slab.Z + ' Zone ÷ ' + ty.slab.T + '팀' + (ty.core ? ' · 코어 ' + ty.core.Z + ' Zone' : '') + ' · 주공정 ' + fr.gov, true);
    var two = secLevels(R).filter(function (x) { return x.kind !== 'b' && x.n > 1; });
    add('분할 타설 층', two.length ? two.map(function (x) { return x.label; }).join(', ') : '없음', fr.dc ? '층고 ' + L.dc.split + 'm 이상 = 수직재 2회 (그 아래 1회)' : fr.coreRows.length ? '코어 ' + L.frame.core.liftMax + 'm 초과 = 2 Lift' : '층고 ' + L.frame.split + 'm 이상 = 수직재 2회 · 층 사이클 × ' + r2(1 + L.frame.vShare), two.length > 0);
    if (fr.coreRows.length) add('코어 거푸집', fr.sysC === 'ACS' ? 'ACS' : '갱폼 · 알폼', (R.inp.coreSys && R.inp.coreSys !== 'AUTO' ? '선택값' : '자동 : 지상 15층 이상 ACS'));
    if (b.seq === 'TD') add('구조제한', '기초 전 ' + fr.lim + 'F / 수직재 전 ' + fr.lim2 + 'F', R.tags.lim === '기본' ? '모를 때 기본값 (지하 + 지상 25 · 32개층)' : '입력값');
    return '<div class="kf">' + F.map(function (f) { return '<div class="kf-c' + (f.hi ? ' hi' : '') + '"><span class="k">' + esc(f.k) + '</span><b>' + esc(f.v) + '</b><span class="w">' + esc(f.why) + '</span></div>'; }).join('') + '</div>';
  }

  /* 입력칸 id 자동 부여 (재게시 때 값 · 포커스 유지용) — 이미 id가 있으면 그대로 */
  function autoIds(rootEl, prefix) {
    Array.prototype.forEach.call(rootEl.querySelectorAll('input, select, textarea'), function (el, i) {
      if (el.id) return; var k = el.getAttribute('data-k') || el.getAttribute('data-h') || el.name || ('f' + i);
      var id = prefix + '-' + String(k).replace(/[^A-Za-z0-9_-]/g, '-') + (el.type === 'radio' ? '-' + el.value : '');
      if (!document.getElementById(id)) el.id = id;
    });
  }
  root.GK = { autoIds: autoIds, getPath: getPath, setPath: setPath, parseVal: parseVal, fill: fill, fillOne: fillOne, bind: bind, simpleH: simpleH, blankNull: blankNull,
    esc: esc, m1: m1, m2: m2, clone: clone, SEQ_N: SEQ_N, BLANK: BLANK, PRESETS: PRESETS, PRESET_N: PRESET_N, BASE_OPTS: BASE_OPTS, store: store,
    addM: addM, ym: ym, yy: yy, when: when, svgEl: svgEl, txt: txt, shortName: shortName, cpShort: cpShort, cpParts: cpParts, cpLineHTML: cpLineHTML, cpGroups: cpGroups, GROUP_OF: GROUP_OF,
    milestones: milestones, warns: warns, nearest: nearest, title: title, ganttActs: ganttActs, gantt: gantt, cpStrip: cpStrip, cpTable: cpTable, cycles: cycles, keyCycles: keyCycles,
    lob: lob, frameTable: frameTable, lanes: lanes, strata: strata, excTable: excTable, excSub: excSub, groundBar: groundBar, reviewList: reviewList, sensItems: sensItems, sensHTML: sensHTML, SENS_NOTE: SENS_NOTE, TAG_C: TAG_C,
    refsTable: refsTable, validCards: validCards, resetValid: resetValid, basis: basis, autoHints: autoHints,
    hSpecOf: hSpecOf, secLevels: secLevels, section: section, secEdit: secEdit, zonePlans: zonePlans, cpBreak: cpBreak, keyFacts: keyFacts,
    hasVal: hasVal, normInp: normInp, composeH: composeH, AI_K: AI_K, aiExtract: aiExtract, ymText: ymText, tactOf: tactOf, summaryLines: summaryLines,
    aiErr: aiErr, extractPrompt: extractPrompt, extractToInp: extractToInp, reviewPrompt: reviewPrompt, mdSafe: mdSafe, connect: connect, loadX: loadX, buildWorkbook: buildWorkbook, exportX: exportX
  };
})(window);

