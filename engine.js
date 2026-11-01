/* 공기산정 엔진 v1 — 결정론적 규칙 기반 (같은 입력 = 같은 결과)
   근거 : 실적 사례 A (역타 · 철골 + ACS 코어) · B (순타 · 어스앵커 · RC) · C (순타 · 오픈컷 · 강합성)
   단위 : WD(작업일) → CD = WD ÷ 가동률 → 개월 = CD ÷ 30.4 */
(function (root) {
  'use strict';
  var D = 30.4;
  var LK = ['soil', 'wsoil', 'wrock', 'srock', 'hrock'];
  var LN = { soil: '토사(매립·퇴적)', wsoil: '풍화토', wrock: '풍화암', srock: '연암', hrock: '경암·보통암' };

  function defaultLib() {
    return {
      exc: {
        /* 순타 : '26.10.28 v2.8 생산성 DB (직상차 520 · 크람쉘 400 · 풍화암 300 · 발파 180 ㎥/일) 를 검토했으나 사례 B 터파기 5.9 → 10.3개월 ·
           사례 A 1차 터파기 0.5 → 1.4개월로 실적과 어긋나 반영하지 않음 (기존 값 유지). dir · dirD (직상차 구간) 를 넣으면 상부 토사에 별도 생산성 적용 */
        BU: { soil: 1000, wsoil: 950, wrock: 800, srock: 640, hrock: 400, Aref: 5000 },
        TD: { soil: 690, wsoil: 690, wrock: 600, srock: 490, hrock: 300, Aref: 4416 },
        methodF: { OPEN: 1.3, ANCHOR: 1.0, STRUT: 0.85, RAKER: 0.85, SLAB: 1.0 },
        areaExp: 0.5, areaMin: 0.6, areaMax: 2.5, slope: 1.5
      },
      support: { ANCHOR: { sp: 2.3, pen: 3, hsp: 2.0, rate: 15 }, STRUT: { sp: 3.0, pen: 4 }, RAKER: { sp: 4.0, pen: 6, max: 2 } },
      wall: {
        CIP: { pitch: 0.6, rate: { soil: 130, wsoil: 130, wrock: 80, srock: 50, hrock: 50 }, setPer: 200, maxSets: 4 },
        /* SW · HP : '26.10.28 v2.8 생산성 DB 반영 (지하연속벽 86.4 · 43.2 · 17.28 ㎡/일, H-Pile 576 · 288 · 115.2 ㎡/일 ÷ 피치 1.8m) — 경암은 v2.8 값 없음 → 기존 유지 */
        SW: { rate: { soil: 86.4, wsoil: 86.4, wrock: 43.2, srock: 17.28, hrock: 12 }, setPer: 200, maxSets: 3 },
        HP: { pitch: 1.8, rate: { soil: 320, wsoil: 320, wrock: 160, srock: 64, hrock: 60 }, setPer: 250, maxSets: 3 },
        SCW: { rate: 150, setPer: 300, maxSets: 3 },
        SP: { width: 0.5, rate: 40, maxLen: 18, setPer: 250, maxSets: 3 }
      },
      prd: { areaPer: 77, rate: { soil: 60, wsoil: 60, wrock: 45, srock: 35, hrock: 35 }, setPer: 70, maxSets: 3, setup: 10, ext: 5 },
      geo: { rate: 1, rigs: 2 },
      /* PHC : v2.8 12본/일 검토 → 사례 C 토공 5.5 → 4.3개월 (실적과 어긋남) → 8본/일 유지. 본수 기초면적 ÷ 8㎡ 는 사례 C 도면 계수 2,599본과 일치 (v2.8 교점 × 9 = 1,989본) */
      pile: { PHC: { areaPer: 8, rate: 8, teamArea: 5000, maxTeams: 4 }, BORED: { areaPer: 25, rate: 1.0, setPer: 80, maxSets: 4 } },
      found: { zoneV: 850, rebar: 0.15, crew: 20, tPerMD: 0.8, prep: 4, tail: 3, pitAdd: 6, pitRatio: 0.12, teamV: 4500, maxTeams: 6, lag: 3, cureCD: 14 },
      /* slabT : 바닥 Zone 근거 표시용 가정 슬래브 두께 (m) — Zone 900㎡ × 0.3m ≈ 1회 타설 270㎥ (250 ~ 300㎥). 계산에는 쓰지 않음 */
      base: { liftAnchor: 3.0, liftOther: 4.5, liftWD: 10, liftRef: 3.0, slabD: 3.25, zoneA: 900, zpt: 4.5, minSlab: 6, backfill: 20, slabT: 0.3 },
      td: { f1Zone: 13, f1Lag: 4.5, f1CureCD: 7, f1ZoneA: 1400, setup: 3, slabF: 0.8, startOffsetM: 2.5, preF: 1.25, vertFirst: 20, vertNext: 12, coreShare: 0.4, d1: 2.5, limTot1: 25, limTot2: 32 },
      frame: {
        d: { RC: 3.25, SRC: 3.5, SC: 4.0, COMP: 3.5 }, minTact: { RC: 6, SRC: 7, SC: 6, COMP: 8 }, ptAdd: 0.25,
        zoneDur: { RC: 8, SRC: 9, SC: 10, COMP: 18 }, zoneA: 900, zonesPerTeam: { RC: 4.5, SRC: 4.5, SC: 2, COMP: 4.5 }, lag: 5,
        core: { ACS: 4.0, GANG: 6.0, ratio: 0.2, zoneA: 300, perTeam: 3, liftMax: 6.0, slabShare: 0.82 },
        hRef: 4.7, hK: 0.15, roofF: 1.5,
        /* '26.10.28 일반 RC 바닥 (코어 없는 RC · SRC) 도 층고 split m 이상이면 수직재 2회 타설 : 층 사이클 × (1 − vShare + vShare × 회수), 층고 보정은 1회 높이 기준
         slabT = 바닥 Zone 근거 표시용 가정 슬래브 두께 (계산에는 쓰지 않음) */
        split: 6.5, vShare: 0.3, slabT: 0.3,
        learnSlab: [2.0, 1.625, 1.5, 1.375, 1.25], learnCore: [1.875, 1.625, 1.5, 1.375], sysF: 1.75, acsSetup: 15, setFloor: 1.4, gangFirst: 1.15, firstF: 1.25
      },
      /* DC 층 사이클 (체적 Zone · 코어 / 외주부 분리 타설) — v2.8 (다른 버전 공기산정 도구) DC 로직을 참고해 옮김
         Zone = 부위 체적 ÷ 일 타설량, 팀 = Zone 4개당 1팀, 층고 6.5m 이상이면 수직재 분할, 층간 = Zone 1개 작업 합계 (Zone 연속) */
      dc: { pourV: 500, zpt: 4, split: 6.5, spanL: 12, spanS: 9, colA: 1.21, beamsPerCol: 3.5, beamA: { RC: 0.88, steel: 0.3 }, slabT: 0.3, coreWall: 0.24,
        rebCB: 0.21, rebSC: 0.1, tPerMD: 0.3, crewH: 25, crewC: 25, lift: 1, form: 2, strip: 1, pour: 1, scaf: 2, table: 50, bform: 2, cure: 2, coreForm: 2, me: 1, steelPc: 18, bolt: 2, deck: 300 },
      v28: defaultV28(),
      seq: defaultSeq()
    };
  }
  /* 타설 순서 (adv.pourSeq) 자동 규칙 기준 — 가정 (v2.8 기본 조합 RC = 동시타설 · 철골 = 코어선행 에 일반 적용 기준을 더함, 사례 보정 전). 화면 편집 경로 = 'seq.<키>' (S.libOv)
     rcPreF : RC · SRC 지상 층수 ≥ 이 값 → 코어선행 (고층 · 코어 시스템폼 ACS), 그 밖 동시타설 · stPostF : 철골 · 강합성 지상 층수 ≤ 이 값 → 코어후행 (저층), 그 밖 코어선행
     rcLag : RC 코어선행 바닥 n층 = 코어 n + rcLag 층 완료 후 (철골 코어선행의 n+3 과 같은 값 — ACS 하부 발판 간섭 · 안전측, 가정) */
  function defaultSeq() { return { rcPreF: 30, stPostF: 10, rcLag: 3 }; }
  function seqOf(src) {
    var d = defaultSeq(), o = {}, s = src && typeof src === 'object' ? src : {};
    Object.keys(d).forEach(function (k) { var x = s[k] == null || s[k] === '' ? NaN : parseFloat(s[k]); o[k] = isFinite(x) && x >= (k === 'rcLag' ? 0 : 1) ? Math.round(x) : d[k]; });
    return o;
  }
  /* 일반 골조 (DC 아님) 공종 사슬 기본 가정 — v2.8 (다른 버전 공기산정 도구) (frameQty · frameCycles · zoning) 에서 옮김. 화면 편집 경로 = 'v28.<키>' (S.libOv)
     쓰는 곳 : ① 일반 지상 RC · SRC 바닥 = v2.8 c4 '동시 RC' 사슬 + Zone 연속 ② 철골 · 강합성 코어 c1 · 바닥 c3 하한 ③ 지하 순타 층별 바닥 사슬 · 외벽 Zone ④ DC 분할 하한 (일반 사이클)
     DC 경로 (L.dc) 값과 이름이 겹쳐도 따로 둔다 (DC 사례 재현 영향 없음) */
  function defaultV28() {
    return {
      spanL: 12, spanS: 9,                       /* 기둥 스팬 장변 · 단변 m (adv.spanL · spanS 가 있으면 그 값) */
      colA: 1.21, colAB: 1.44,                   /* 기둥 단면 ㎡ : 지상 (1.1 × 1.1) · 지하 */
      beamsPerCol: 3.5, beamA: 0.63, beamAB: 0.84, beamK: 0.85,   /* 기둥당 보 개수 · 보 단면 ㎡ (지상 · 지하) · 보 길이 계수 */
      slabT: 0.15, slabTB: 0.15,                 /* 슬래브 두께 m (지상 · 지하) */
      coreR: 0.23, coreWall: 0.24,               /* 코어 면적 = 기준층 × 0.23 (adv.coreA 없을 때) · 코어 벽 체적 = 코어 면적 × 0.24 × 층고 */
      rebCB: 0.21, rebSC: 0.1,                   /* 철근비 t/㎥ : 기둥 · 보 / 슬래브 · 벽 */
      tPerMD: 0.3, crewW: 20, crewCS: 10, crewU: 25,   /* 철근 t/인·일 · 인원 : 벽체 철근 20 · 코어 슬래브 철근 10 · 바닥 철근 / M&E 25 */
      crewS: 20,                                 /* 동시타설 철골 (v2.8 c5) 바닥 철근 · M&E 인원 20 (v2.8 c5 는 ÷ 6t/일) */
      c1W: 0.8, c1S: 0.2,                        /* 코어 c1 : 벽체 철근 몫 0.8 · 슬래브 철근 몫 0.2 */
      pourV: 300, pourVc: 230, pump: 1,          /* 1회 (1일) 타설 ㎥ : 수평 300 · 수직 230 × 펌프 대수 */
      zpt: 4, takt: 1,                           /* 팀당 Zone 4 (Zone 4개당 1팀) · 팀 안 Zone 간격 1일 (하루 1 Zone) */
      table: 50, tableW: 2.4, deck: 300, steelPc: 18, bolt: 2,   /* 테이블폼 장/일 · 1장 폭 m · DECK ㎡/일 · 철골 pcs/일 · 볼팅 WD */
      lift: 1, wform: 2, form: 2, form2: 3, me: 1, pour: 1, c3End: 1,   /* 고정 일수 WD : 양중 · 벽체 형틀 · 형틀 (c4) · 형틀 (c2) · M&E · 타설 · c3 마무리 */
      ptAdd: 1, ptAll: 1,                        /* c4 철근 · M&E 'PT 1일' : ptAll 1 = v2.8 처럼 항상 (기본 — 사례 B 보정 겹침도 이 기준) · 0 = PT 슬래브 (inp.pt) 일 때만 */
      ptX: 1,                                    /* PT 슬래브 (inp.pt) 추가 WD (ptAll 1 일 때, 지상 바닥만) — 가정 : 옛 PT 할증 (ptAdd 0.25 ÷ d.RC 3.25 ≈ 8%) 과 같은 크기 (사슬 13 WD 의 1일) */
      hQ: 4.5, hQB: 3.5,                         /* 물량 · Zone 기준 층고 m : 지상 4.5 (v2.8 기준층 층고 기본값) · 지하 3.5 (v2.8 지하 물량 고정). 층별 층고는 2회 타설 계수 · 층고 보정으로만 반영 (층고를 올렸는데 사이클이 줄지 않게) */
      hStd: 4.5,                                 /* DC 분할 하한의 '일반 사이클' 기준 층고 m — 가정 (v2.8 은 DC 기준층 층고 (기본 6m) 기준, 사례 C 영향 없음) */
      /* c4 사슬 기본 겹침 WD (공종 순번 a0 양중 · a1 벽체 철근 · a2 벽체 형틀 · a3 테이블폼 · a4 형틀 · a5 DECK · a6 철근 · M&E · a7 타설)
         ov1 = 벽체 철근 ∥ 양중 (v2.8 간격 0) · ov3 · ov4 · ov5 = 테이블폼 · 형틀 · DECK 를 앞 공종과 1 WD 겹침 — 사례 B 보정 (v2.8 근거 아님) */
      ov0: 0, ov1: 1, ov2: 0, ov3: 1, ov4: 1, ov5: 1, ov6: 0, ov7: 0,
      wallZ: 40, wzpt: 4,                        /* 지하 외벽 Zone = 흙막이 둘레 ÷ 40m (v2.8 합벽 Zone) · 외벽팀 자동 = ⌈Zone ÷ 4⌉ (가정) */
      wKmin: 0.5,                                /* 외벽팀 입력 반영 하한 : 외벽 WD ≥ 지금 실적값 × 0.5 (팀을 늘려도 Lift 순서 · 양생 때문에 반 이하로 줄지 않음 — 가정) */
      /* 철골 · 강합성 코어선행 (옛 경로) 의 v2.8 코어 c1 · 바닥 c3 하한 : 0 = 끔 (기본 — 순타 철골 건물이 근거 없이 길어짐 : v2.8 c1 직렬 사슬이 ACS 코어 실제 속도보다 느림, c3 는 해석), 1 = 켬 */
      lbSC: 0
    };
  }
  /* v2.8 라이브러리 값 정리 : 숫자가 아니거나 음수면 기본값, 나눗셈에 쓰는 값 (POS) 은 0 이하도 기본값, 비율 (UNIT) 은 0 ~ 1 */
  var V28_POS = { spanL: 1, spanS: 1, tPerMD: 1, crewW: 1, crewCS: 1, crewU: 1, crewS: 1, pourV: 1, pourVc: 1, pump: 1, zpt: 1, table: 1, tableW: 1, deck: 1, steelPc: 1, wallZ: 1, wzpt: 1, hQ: 1, hQB: 1, hStd: 1 };
  var V28_UNIT = { wKmin: 1, c1W: 1, c1S: 1, lbSC: 1 };
  function v28Of(src) {
    var d = defaultV28(), o = defaultV28(), s = src && typeof src === 'object' ? src : {};
    Object.keys(d).forEach(function (k) {
      var x = s[k] == null || s[k] === '' ? NaN : parseFloat(s[k]);
      if (!isFinite(x) || x < 0 || (V28_POS[k] && x <= 0)) x = d[k];
      if (V28_UNIT[k]) x = Math.min(1, x);
      o[k] = x;
    });
    return o;
  }

  var USE_H = {
    office: { b1: 5.5, b: 4.0, f1: 5.5, typ: 4.2, ph: 5.0, name: '업무시설' },
    dc: { b1: 6.0, b: 5.0, f1: 7.0, typ: 5.5, ph: 6.0, name: '데이터센터' },
    residential: { b1: 4.5, b: 3.6, f1: 4.0, typ: 2.9, ph: 4.0, name: '공동주택' },
    mixed: { b1: 5.0, b: 3.8, f1: 5.0, typ: 3.6, ph: 4.5, name: '주상복합' },
    other: { b1: 5.5, b: 4.5, f1: 6.0, typ: 4.5, ph: 5.0, name: '기타' }
  };
  /* 지반 유형 (주상도가 없을 때) — 두께 m : 매립 · 퇴적 (토사) · 풍화토 · 풍화암 · 연암, 그 아래 경암
     AUTO = 국내 도심 대심도 (굴착 40m 내외) 현장에서 흔한 분포 → 얕은 굴착은 토사 위주, 깊은 굴착은 연암 · 경암까지 */
  var GROUND = {
    AUTO: { name: '국내 일반', st: [12, 9, 2, 8.6], desc: '국내 도심 대심도 현장에서 흔한 분포 — 상부 약 20m 토사 · 풍화토, 풍화암은 얇고 GL−23m 전후 연암, GL−32m 전후부터 경암' },
    SOIL: { name: '토사 지반', st: [20, 10, 6, 10], desc: '충적 · 매립층이 두꺼운 지반 — GL−30m까지 토사 · 풍화토, 풍화암 6m, GL−36m 이하 연암' },
    ROCK: { name: '암반 지반', st: [4, 4, 3, 6], desc: '암반이 얕은 지반 — GL−8m 전후 풍화암, GL−11m 전후 연암, GL−17m 이하 경암' }
  };
  var STRUCT_N = { RC: '철근콘크리트 (RC)', SRC: '철골철근콘크리트 (SRC)', SC: '철골 + RC 코어', COMP: '강합성 (PSRC·TSC 등) + RC 코어' };
  /* 타설 순서 (adv.pourSeq) 이름 — 철골 '코어 선행' 은 이제 골조 형식이 아니라 타설 순서 (자동 = 10층 초과 코어선행) */
  var POUR_N = { AUTO: '자동', SIM: '동시타설', PRE: '코어선행', POST: '코어후행', DC: '분리 타설 (DC)' };
  var WALL_N = { CIP: 'CIP', SW: 'Slurry Wall (지하연속벽)', HP: 'H-Pile + 토류판', SCW: 'SCW', SP: 'Sheet Pile', NONE: '없음 (오픈컷)' };
  var SUP_N = { ANCHOR: '어스앵커', STRUT: '스트럿 (버팀보)', RAKER: '레이커', OPEN: '오픈컷 (사면)', SLAB: '영구 슬래브 지지 (탑다운)' };
  var FOUND_N = { MAT: '매트 (직접기초)', PHC: 'PHC 파일 + 매트', BORED: '현장타설말뚝 + 매트' };

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function r1(x) { return Math.round(x * 10 + 1e-9) / 10; }
  function r2(x) { return Math.round(x * 100 + 1e-9) / 100; }
  function num(v, d) { var n = parseFloat(v); return isFinite(n) ? n : d; }
  function fmt(n, k) { if (!isFinite(n)) return '-'; k = k == null ? 0 : k; return n.toLocaleString('ko-KR', { minimumFractionDigits: k, maximumFractionDigits: k }); }

  /* 사양 문자열 : "B1:6.0, B2:8.6, 1:4.2, 3-8:6.6, PH:6.3, PH1:7.35" */
  /* 허용 : "B2-B4:4.0" · "3~8:6.6" · "B-2:5" (= B2) · "PH:6" · "옥탑1:7" · "지하2층:8.6" · 전각 기호 (～ ： ，)
     거부 : 0 이하 값 · 0층 · 접두어가 다른 범위 ("1-B3") · 200개층 초과 범위 · "4.2.1" 같은 숫자 */
  var SPEC_MAX = 200;
  function parseSpec(str) {
    var out = { up: {}, ph: {}, b: {}, err: [] };
    if (!str) return out;
    String(str).replace(/옥탑/g, 'PH').replace(/지하\s*/g, 'B').replace(/지상\s*/g, '').replace(/층/g, 'F')
      .replace(/[～〜]/g, '~').replace(/：/g, ':').replace(/＝/g, '=').replace(/，/g, ',').replace(/[－–—]/g, '-')
      .split(/[,;\n]+/).forEach(function (tok) {
        tok = tok.trim(); if (!tok) return;
        var t = tok.toUpperCase().replace(/\s+/g, '').replace(/^(PH|B)-(?=\d)/, '$1').replace(/([-~])(PH|B)-(?=\d)/, '$1$2');
        var m = t.match(/^(PH|B)?(\d*)F?(?:[-~](PH|B)?(\d+)F?)?[:=](\d+(?:\.\d+)?)$/);
        if (!m) { out.err.push(tok); return; }
        var pre = m[1] || '', a = m[2] ? parseInt(m[2], 10) : null, pre2 = m[3] || '', b = m[4] ? parseInt(m[4], 10) : a, v = parseFloat(m[5]);
        if (!(v > 0) || (pre2 && pre2 !== pre) || (a == null && m[4])) { out.err.push(tok); return; }
        var tgt = pre === 'PH' ? out.ph : pre === 'B' ? out.b : out.up;
        if (a == null) { if (pre === 'PH' || pre === 'B') tgt['*'] = v; else out.err.push(tok); return; }
        var lo = Math.min(a, b), hi = Math.max(a, b);
        if (lo < 1 || hi > SPEC_MAX) { out.err.push(tok); return; }
        for (var i = lo; i <= hi; i++) tgt[i] = v;
      });
    return out;
  }

  function bounds(st) { var z = [0], s = 0; for (var i = 0; i < 4; i++) { s += Math.max(0, num(st[i], 0)); z.push(s); } z.push(Infinity); return z; }
  function lens(z, a, b) { var o = {}; LK.forEach(function (k, i) { o[k] = Math.max(0, Math.min(b, z[i + 1]) - Math.max(a, z[i])); }); return o; }
  function slopeVol(z, P, s, H) { var o = {}; LK.forEach(function (k, i) { var a = Math.min(H, z[i]), b = Math.min(H, z[i + 1]); o[k] = b > a ? P * s * (Math.pow(H - a, 2) - Math.pow(H - b, 2)) / 2 : 0; }); return o; }
  function addL(a, b, f) { var o = {}; LK.forEach(function (k) { o[k] = (a[k] || 0) + (b[k] || 0) * (f == null ? 1 : f); }); return o; }
  function sumL(a) { return LK.reduce(function (s, k) { return s + (a[k] || 0); }, 0); }
  function wdOf(V, rate) { return LK.reduce(function (s, k) { return s + (V[k] > 0 ? V[k] / rate[k] : 0); }, 0); }

  function compute(inp, LIB) {
    var L = LIB || defaultLib();
    var A = inp.adv || {};
    var R = { inp: inp, warn: [], notes: [], tags: {} };
    var use = USE_H[inp.use] ? inp.use : 'office', U = USE_H[use];
    var nB = clamp(Math.round(num(inp.nB, 0)), 0, 15), nUp = clamp(Math.round(num(inp.nUp, 1)), 1, 150);
    var nPH = inp.nPH == null || inp.nPH === '' ? (nUp >= 20 ? 2 : 1) : clamp(Math.round(num(inp.nPH, 1)), 0, 4);
    var site = Math.max(0, num(inp.site, 0)), bldg = Math.max(0, num(inp.bldg, 0)), gUp = Math.max(0, num(inp.gfaUp, 0)), gDn = Math.max(0, num(inp.gfaDn, 0));
    /* 지하층 바닥면적 (㎡/층, inp.aDn) 이 1차 입력 — 지하 연면적 = aDn × 지하 층수 (층수를 바꾸면 굴착 · 기초 물량이 따라감). 없으면 옛 입력 지하 연면적 ÷ 층수 */
    var aDnIn = Math.max(0, num(inp.aDn, 0)); if (aDnIn > 0) gDn = aDnIn * nB;
    var rExt = clamp(num(inp.rExt, 0.702), 0.3, 1), rRC = clamp(num(inp.rRC, 0.585), 0.3, 1);
    /* 내부 (마감) 공사 가동률 : 마감 개월 (inp.fin) 은 기준 가동률 R_INT0 에서의 값 → 가동률이 다르면 그 비율로 (사례 실적 없음 — 일요일 · 공휴일만 쉬는 기준 가정) */
    var R_INT0 = 0.81, rInt = clamp(num(inp.rInt, R_INT0), 0.3, 1);
    /* 1일 작업시간 : 4~12시간 (8시간 = 1.0) — 작업량으로 정해지는 공종만 비례 (양생 · 팀 시차 · 기본값 개월은 고정) */
    var hours = num(inp.hours, 8); if (!(hours > 0)) hours = 8; hours = clamp(hours, 4, 12); var hF = hours / 8;
    var seq = inp.seq === 'TD' ? 'TD' : 'BU';
    var sup = seq === 'TD' ? 'SLAB' : (inp.support === 'SLAB' ? 'ANCHOR' : (inp.support || 'ANCHOR'));
    if (nB === 0 && seq === 'TD') { seq = 'BU'; R.warn.push('지하층이 없어 역타를 적용할 수 없습니다 → 순타로 계산했습니다.'); }
    if (nB === 0) sup = 'OPEN';
    var wall = WALL_N[inp.wall] ? inp.wall : 'CIP';
    if (nB > 0 && seq === 'TD' && wall === 'NONE') { wall = 'CIP'; R.warn.push('역타는 흙막이 벽체가 필요합니다 → CIP로 계산했습니다.'); }
    if (nB > 0 && seq === 'BU' && wall === 'NONE' && sup !== 'OPEN') { sup = 'OPEN'; R.warn.push('흙막이 벽체 없음 → 지보 형식을 오픈컷 (사면) 으로 계산했습니다.'); }
    if (nB > 0 && sup === 'OPEN' && wall !== 'NONE' && wall !== 'SCW') R.warn.push('오픈컷 (사면) 에서는 흙막이 벽체 (' + WALL_N[wall] + ') 를 제외했습니다 → 일부 구간 흙막이가 필요하면 지보 형식을 앵커 · 스트럿으로 선택하세요.');
    var struct = STRUCT_N[inp.struct] ? inp.struct : 'RC';
    var MO = function (wd, r) { return wd / ((r || rRC) * D); };
    R.basic = { use: use, nB: nB, nUp: nUp, nPH: nPH, seq: seq, sup: sup, wall: wall, struct: struct, rExt: rExt, rRC: rRC, rInt: rInt, hF: hF, hours: hours };

    /* ── 층고 */
    var HS = parseSpec(A.hSpec); if (HS.err.length) R.warn.push('층고 입력을 읽지 못한 항목 : ' + HS.err.join(', '));
    var hB = []; for (var k = 1; k <= nB; k++) hB.push(HS.b[k] != null ? HS.b[k] : HS.b['*'] != null ? HS.b['*'] : (k === 1 ? U.b1 : U.b));
    var hUp = []; for (var n = 1; n <= nUp; n++) hUp.push(HS.up[n] != null ? HS.up[n] : (n === 1 ? U.f1 : U.typ));
    var hPH = []; for (k = 1; k <= nPH; k++) hPH.push(HS.ph[k] != null ? HS.ph[k] : HS.ph['*'] != null ? HS.ph['*'] : U.ph);
    var sumB = hB.reduce(function (s, v) { return s + v; }, 0);
    /* 역타 기준층 : 외부 도로와 면해 차량 진출입이 되는 층 (기본 1F) = 작업 GL (지층 · 굴착 깊이 기준)
       기준층 슬래브를 먼저 치고 그 아래 층은 역타 (굴착 · 슬래브), 위 층은 상향 골조 */
    var off = seq === 'TD' && nB > 0 ? clamp(Math.round(num(inp.tdBase, 0)), 1 - nB, Math.max(0, Math.min(2, nUp - 1))) : 0;
    var baseName = off === 0 ? '1F' : (off < 0 ? 'B' + (-off) : (off + 1) + 'F');
    var tdSt = [];   /* 기준층 아래 역타 층 (위 → 아래) */
    if (seq === 'TD') {
      for (k = off; k >= 1; k--) tdSt.push({ lv: k + 'F', h: hUp[k - 1], n: k, b: false });
      for (k = Math.max(1, 1 - off); k <= nB; k++) tdSt.push({ lv: 'B' + k, h: hB[k - 1], n: 1 - k, b: true });
    }
    var sumTD = tdSt.reduce(function (s, x) { return s + x.h; }, 0);
    R.tdBase = { off: off, name: baseName, nTD: tdSt.length, st: tdSt.map(function (x) { return x.lv; }), h: tdSt.map(function (x) { return x.h; }) };

    /* ── 지반 */
    /* 지반 : 지반 유형 (모름 = 국내 일반 · 토사 · 암반) 또는 주상도 두께 직접 입력 */
    var stIn = Array.isArray(inp.strata) ? inp.strata : null;
    var stBlank = !stIn || [0, 1, 2, 3].every(function (i) { var x = stIn[i]; return x == null || x === '' || !isFinite(parseFloat(x)); });
    var gMode = GROUND[inp.ground] ? inp.ground : (inp.ground === 'CUSTOM' ? 'CUSTOM' : (stBlank ? 'AUTO' : 'CUSTOM'));
    if (gMode === 'CUSTOM' && stBlank) { gMode = 'AUTO'; R.warn.push('직접 입력을 골랐지만 지층 두께가 없어 국내 일반 분포로 계산했습니다.'); }
    var stUse = gMode === 'CUSTOM' ? [0, 1, 2, 3].map(function (i) { return Math.max(0, num(stIn[i], 0)); }) : GROUND[gMode].st.slice();
    var z = bounds(stUse);
    if (gMode === 'CUSTOM' && z[4] <= 0 && nB > 0) R.warn.push('지층 두께가 모두 0 → 지표부터 경암으로 계산했습니다 (암반 노출 지반이 아니면 주상도 값을 확인하세요).');
    R.ground = { mode: gMode, name: gMode === 'CUSTOM' ? '주상도 입력' : GROUND[gMode].name, st: stUse, assumed: gMode !== 'CUSTOM' };
    R.tags.strata = gMode === 'CUSTOM' ? '입력' : '가정';
    var gwl = num(inp.gwl, NaN);
    var wrockTop = z[2], rockTop = z[3];

    /* ── 기하 · 물량 */
    var coverage = site > 0 ? bldg / site : NaN;
    var Adn = nB > 0 ? (aDnIn > 0 ? aDnIn : (gDn > 0 ? gDn / nB : 0)) : 0;
    var partial = nB > 0 && Adn > 0 && Adn < 0.75 * bldg;
    var Adeep = nB > 0 ? (partial ? Adn : Math.max(Adn, bldg)) * 1.08 : 0;
    if (num(A.Aexc, 0) > 0 && nB > 0) Adeep = num(A.Aexc, 0);
    var Ash = partial ? Math.max(0, bldg - Adn) * 1.05 : (nB === 0 ? bldg * 1.05 : 0);
    /* 지하층 바닥 면적 : 입력 (층당) 또는 지하 연면적 ÷ 층수, 미입력 시 굴착 면적 기준 전면 지하 */
    var AdnEff = Adn > 0 ? Adn : (Adeep > 0 ? Adeep / 1.08 : 0);
    /* v2.8 면적 경고 : 기본값으로 추정한 지하 연면적이 지상 연면적의 50% 를 넘으면 (자동 보정하지 않고 경고만) */
    var estDn = AdnEff * nB, estPct = gUp > 0 ? estDn / gUp * 100 : 0;
    if (nB > 0 && gDn <= 0 && Adeep > 0) R.warn.push('지하 바닥면적이 없어 지하층 면적을 ' + (num(A.Aexc, 0) > 0 ? '굴착 면적' : '건축면적') + ' 기준 (전면 지하) 으로 가정했습니다.' +
      (gUp > 0 && estDn > gUp * 0.5 ? ' 추정 지하 연면적 ' + fmt(estDn) + '㎡ = 지상의 ' + Math.round(estPct) + '% — 지하 바닥면적 (층당) 입력 권장' : ''));
    if (nB > 0 && Adeep <= 0) R.warn.push('지하 ' + nB + '개층인데 건축면적 · 지하 바닥면적이 없어 굴착 · 기초 물량이 0입니다 → 면적을 입력하세요.');
    if (nB === 0 && bldg <= 0) R.warn.push('건축면적이 없어 기초 물량을 계산할 수 없습니다 → 건축면적을 입력하세요.');
    /* 면적 점검 : 입력끼리 맞지 않으면 값을 고치지 않고 경고만 한다 (계산은 입력값 그대로) */
    var aChk = [];
    if (site > 0 && bldg > site) aChk.push('건축면적 ' + fmt(bldg) + '㎡ 가 대지면적 ' + fmt(site) + '㎡ 보다 큽니다 (건폐율 ' + r1(bldg / site * 100) + '%) → 단위 · 자릿수를 확인하세요.');
    if (bldg > 0 && gUp > 0 && gUp / nUp > bldg * 1.15) aChk.push('지상 평균 바닥면적 ' + fmt(gUp / nUp) + '㎡ (지상 연면적 ÷ ' + nUp + '개층) 가 건축면적 ' + fmt(bldg) + '㎡ 보다 큽니다 → 지상 층수 · 연면적을 확인하세요 (단지 전체 연면적을 넣었는지).');
    if (bldg > 0 && gUp > 0 && gUp < bldg * 0.95) aChk.push('지상 연면적 ' + fmt(gUp) + '㎡ 가 건축면적 ' + fmt(bldg) + '㎡ 보다 작습니다 → 지상 · 지하 연면적이 바뀌었는지 확인하세요.');
    if (site > 0 && Adn > site) aChk.push('지하층 바닥면적 ' + fmt(Adn) + '㎡ 가 대지면적 ' + fmt(site) + '㎡ 보다 큽니다 → 지하 바닥면적 (층당) 을 확인하세요.');
    if (gUp <= 0 && bldg <= 0 && !(num(A.Atyp, 0) > 0)) aChk.push('지상 연면적 · 건축면적이 없어 지상골조 물량을 계산할 수 없습니다 → 면적을 입력하세요.');
    aChk.forEach(function (x) { R.warn.push('면적 확인 : ' + x); });
    R.areaChk = aChk;
    var autoT = clamp(0.9 + 0.045 * nUp, 1.2, 3.5) + (use === 'dc' ? 0.6 : 0);
    var tMat = num(A.mat, 0) > 0 ? clamp(num(A.mat, 0), 0.3, 6) : r1(autoT);
    var Hauto = nB > 0 ? (seq === 'TD' ? sumTD : sumB) + tMat + 0.3 : 0;
    /* 굴착 깊이 = 자동 (층고 합 + 매트 + 0.3) + 보정 adv.dH (사례 실측 차이 · 사용자 입력) — 지하 층수 · 층고를 바꾸면 따라감. adv.H = 고정값 (옛 파일 · 고급) */
    var dH = num(A.dH, 0), Hfix = num(A.H, 0) > 0;
    var H = nB > 0 ? (Hfix ? clamp(num(A.H, 0), 1, 80) : clamp(r1(Hauto + dH), 1, 80)) : 0;
    if (nB > 0 && Hfix && Math.abs(num(A.H, 0) - Hauto) >= 3) R.warn.push('굴착 깊이 고정값 GL−' + r1(num(A.H, 0)) + 'm 가 지하 층고 합 기준 GL−' + r1(Hauto) + 'm 와 ' + r1(Math.abs(num(A.H, 0) - Hauto)) + 'm 다릅니다 → 지하 층수 · 층고를 바꿨다면 굴착 깊이를 다시 확인하세요.');
    var Hs = Ash > 0 ? Math.max(1.0, r1(tMat - 0.5)) : 0;
    var P = num(A.P, 0) > 0 ? num(A.P, 0) : 4.08 * Math.sqrt(Math.max(Adeep, 1));
    var s = L.exc.slope, open = sup === 'OPEN' && nB > 0;
    var slopeA = open ? P * s * H : 0;
    var Vdeep = {}, Vsl = {}, Vsh = {}, Vvoid = {};
    if (nB > 0) { var ld = lens(z, 0, H); LK.forEach(function (k) { Vdeep[k] = Adeep * ld[k]; }); }
    if (open) Vsl = slopeVol(z, P, s, H);
    if (Ash > 0) { var ls = lens(z, 0, Hs); LK.forEach(function (k) { Vsh[k] = Ash * ls[k]; }); }
    var exA = Math.min(num(A.exVoidA, 0), Adeep), exD = Math.min(num(A.exVoidD, 0), H);
    if (exA > 0 && exD > 0) { var lv = lens(z, 0, exD); LK.forEach(function (k) { Vvoid[k] = exA * lv[k]; }); }
    var Vexc = addL(addL(addL(Vdeep, Vsl), Vsh), Vvoid, -1);
    LK.forEach(function (k) { Vexc[k] = Math.max(0, Vexc[k]); });
    var Aeff = Adeep + Ash + slopeA;
    var Pall = 4.08 * Math.sqrt(Math.max(Aeff, 1));
    R.geo = { site: site, bldg: bldg, coverage: coverage, gUp: gUp, gDn: gDn, gfa: gUp + gDn, Adn: Adn, AdnEff: AdnEff, partial: partial, Adeep: Adeep, Ash: Ash, Aeff: Aeff, tMat: tMat, autoT: autoT, H: H, Hauto: Hauto, dH: Hfix ? 0 : dH, Hfix: Hfix, Hs: Hs, P: P, Pall: Pall, slopeA: slopeA, slopeW: open ? s * H : 0, z: z, gwl: gwl, wrockTop: wrockTop, rockTop: rockTop, Vexc: Vexc, Vtot: sumL(Vexc), Vvoid: sumL(Vvoid), hB: hB, hUp: hUp, hPH: hPH, sumB: sumB };

    var acts = [];
    function act(o) { o.dur = r2(o.e - o.s); acts.push(o); return o; }
    var t = 0;
    var mob = Math.max(0, num(inp.mob, 1.0));
    if (mob > 0) { act({ id: 'mob', g: '준비', name: 'MOB (가설 · 준비)', s: 0, e: mob, cp: true, basis: '기본값 ' + mob + '개월 (사용자 조정 가능)' }); t = mob; }
    /* 해체공사 (입력 개월, 기본 0 = 행 없음) : 지상 해체 (inp.demo) → 지하 해체 (inp.demoB = 굴착과 병행하지 않는 부분) → 흙막이 · 굴착. 모두 C.P 직렬 */
    var demoM = Math.max(0, num(inp.demo, 0)), demoBM = Math.max(0, num(inp.demoB, 0));
    if (demoM > 0) { act({ id: 'demo', g: '준비', name: '지상 해체', s: t, e: t + demoM, cp: true, basis: '입력값 ' + r2(demoM) + '개월' }); t += demoM; }
    if (demoBM > 0) { act({ id: 'demoB', g: '준비', name: '지하 해체 (굴착 전)', s: t, e: t + demoBM, cp: true, basis: '입력값 ' + r2(demoBM) + '개월 · 굴착과 병행하지 않는 부분 (굴착 전 직렬)' }); t += demoBM; }

    /* ── 흙막이 벽체 */
    function wallCalc(type, Pw, Hw, cutoff) {
      var o = { type: type }, W = L.wall[type];
      if (type === 'CIP') {
        var nP = Math.ceil(Pw / W.pitch), Dw = Math.min(Hw + 3, rockTop + 2); if (Dw < Math.min(Hw, 3)) Dw = Math.min(Hw + 3, 3);
        var per = wdOf(lens(z, 0, Dw), W.rate), ns = Math.ceil(nP / 3), Ds = Hw + 2, ex = Ds > Dw ? wdOf(lens(z, Dw, Ds), W.rate) : 0;
        var sets = clamp(Math.ceil(Pw / W.setPer), 1, W.maxSets);
        o.wd = (nP * per + ns * ex) / (sets * hF); o.sets = sets;
        o.qty = fmt(nP) + '공 (L≈' + r1(Dw) + 'm)' + (ex > 0 ? ' + 엄지말뚝 ' + fmt(ns) + '공 (L≈' + r1(Ds) + 'm, 암반 근입)' : '');
        o.basis = '연장 ' + fmt(Pw) + 'm ÷ 피치 ' + W.pitch + 'm · 천공 토사 ' + W.rate.soil + ' / 풍화암 ' + W.rate.wrock + ' / 암 ' + W.rate.srock + ' m/일·조 · ' + sets + '조';
      } else if (type === 'SW') {
        var Dsw = Hw + 3, a = lens(z, 0, Dsw), sd = 0; LK.forEach(function (k) { sd += Pw * a[k] / W.rate[k]; });
        var sets2 = clamp(Math.ceil(Pw / W.setPer), 1, W.maxSets);
        o.wd = sd / (sets2 * hF); o.sets = sets2; o.qty = fmt(Pw * Dsw) + '㎡ (L≈' + r1(Dsw) + 'm)';
        o.basis = '벽체 면적 · 굴착 토사 ' + W.rate.soil + ' / 연암 ' + W.rate.srock + ' / 경암 ' + W.rate.hrock + ' ㎡/일·조 · ' + sets2 + '조';
      } else if (type === 'HP') {
        var nH = Math.ceil(Pw / W.pitch) + 1, Dh = Hw + 2, ph = wdOf(lens(z, 0, Dh), W.rate), sets3 = clamp(Math.ceil(Pw / W.setPer), 1, W.maxSets);
        o.wd = nH * ph / (sets3 * hF); o.sets = sets3; o.qty = fmt(nH) + '본 (L≈' + r1(Dh) + 'm) · 토류판 굴착 병행';
        o.basis = '피치 ' + W.pitch + 'm · 천공 토사 ' + W.rate.soil + ' / 암 ' + W.rate.srock + ' m/일·조 · ' + sets3 + '조';
      } else if (type === 'SCW') {
        var Dc = cutoff ? Math.min(wrockTop, Hw + 10) : Math.min(Hw + 3, rockTop);
        if (!cutoff && rockTop < Hw + 3) R.warn.push('SCW는 연암 이하를 관입하기 어렵습니다 (암반선 GL−' + r1(rockTop) + 'm < 필요 근입 ' + r1(Hw + 3) + 'm) → 하부 보강 공법 확인 필요');
        var sets4 = clamp(Math.ceil(Pw / W.setPer), 1, W.maxSets), Aw = Pw * Math.max(Dc, 1);
        o.wd = Aw / (W.rate * sets4 * hF); o.sets = sets4; o.qty = fmt(Aw) + '㎡ (L≈' + r1(Dc) + 'm)';
        o.basis = '벽체 면적 ÷ ' + W.rate + '㎡/일·조 · ' + sets4 + '조' + (cutoff ? ' · 차수 (풍화암 상단까지)' : '');
      } else if (type === 'SP') {
        var nS = Math.ceil(Pw / W.width), Ls = Math.min(Hw + 4, W.maxLen), sets5 = clamp(Math.ceil(Pw / W.setPer), 1, W.maxSets);
        if (Hw > 12) R.warn.push('Sheet Pile은 굴착 12m 이하에 적합합니다 (현재 ' + r1(Hw) + 'm)');
        if (rockTop < Ls) R.warn.push('Sheet Pile 근입 구간에 암반이 있습니다 (암반선 GL−' + r1(rockTop) + 'm)');
        o.wd = nS / (W.rate * sets5 * hF); o.sets = sets5; o.qty = fmt(nS) + '매 (L≈' + r1(Ls) + 'm)';
        o.basis = nS + '매 ÷ ' + W.rate + '매/일·조 · ' + sets5 + '조';
      }
      return o;
    }

    var wallRes = null;
    if (nB > 0 && wall !== 'NONE' && !open) {
      wallRes = wallCalc(wall, P, H, false);
      var wm = MO(wallRes.wd, rExt);
      act({ id: 'wall', g: '토목', name: '흙막이 (' + WALL_N[wall] + ')', s: t, e: t + wm, cp: true, wd: wallRes.wd, rate: 'ext', qty: wallRes.qty, basis: wallRes.basis });
      t += wm;
    }
    var scwRes = null;
    if (open && (inp.scw || wall === 'SCW')) {
      scwRes = wallCalc('SCW', Pall, H, true);
      var sm = MO(scwRes.wd, rExt);
      act({ id: 'scw', g: '토목', name: '차수 SCW (오픈컷 외곽)', s: t, e: t + sm, cp: true, wd: scwRes.wd, rate: 'ext', qty: scwRes.qty, basis: scwRes.basis });
      t += sm;
    }
    R.wall = wallRes; R.scw = scwRes;

    /* ── 기초 형식 판정 */
    var fType = inp.found && inp.found !== 'AUTO' ? inp.found : null, fWhy = '';
    var Hbot = nB > 0 ? H : Hs;
    if (!fType) {
      if (wrockTop <= Hbot + 3) { fType = 'MAT'; fWhy = '풍화암 상단 GL−' + r1(wrockTop) + 'm ≤ 기초 하부 GL−' + r1(Hbot) + 'm + 3m → 직접기초'; }
      else if (z[1] <= Hbot && nUp <= 25) { fType = 'MAT'; fWhy = '기초 하부가 풍화토층 (GL−' + r1(z[1]) + 'm 이하) · 지상 ' + nUp + '층 → 직접기초'; }
      else if (wrockTop <= 45) { fType = 'PHC'; fWhy = '기초 하부 토사층 · 풍화암 GL−' + r1(wrockTop) + 'm → PHC 파일'; }
      else { fType = 'BORED'; fWhy = '풍화암 GL−' + r1(wrockTop) + 'm (45m 초과) → 현장타설말뚝'; }
    } else fWhy = '사용자 지정';
    if (seq === 'TD' && fType === 'PHC') {
      fType = 'BORED'; fWhy += ' → 역타는 현장타설말뚝 (굴착 전 지상 천공)';
      R.warn.push('역타에서는 PHC 항타가 어렵습니다 (지하 슬래브 하부 장비 진입 불가) → 굴착 전 지상에서 천공하는 현장타설말뚝으로 계산했습니다.');
    }
    R.fType = fType; R.fWhy = fWhy;

    var Af = Adeep / 1.08 + Ash / 1.05;
    var pileRes = null, pileM = 0, pileBefore = H <= 12;
    if ((fType === 'PHC' || fType === 'BORED') && Af > 0) {
      var PL = L.pile[fType], nPile = num(A.pileN, 0) > 0 ? Math.round(num(A.pileN, 0)) : Math.max(1, Math.round(Af / PL.areaPer)), teamsP;
      if (fType === 'PHC') teamsP = clamp(Math.ceil(Af / PL.teamArea), 1, PL.maxTeams); else teamsP = clamp(Math.ceil(nPile / PL.setPer), 1, PL.maxSets);
      var pwd = nPile / (PL.rate * teamsP * hF);
      pileRes = { n: nPile, teams: teamsP, wd: pwd, qty: fmt(nPile) + '본' + (num(A.pileN, 0) > 0 ? '' : ' (기초면적 ÷ ' + PL.areaPer + '㎡ 추정)'), basis: nPile + '본 ÷ (' + PL.rate + '본/일 × ' + teamsP + (fType === 'PHC' ? '팀' : '조') + ')' };
      pileM = MO(pwd, rExt);
      R.tags.pileN = num(A.pileN, 0) > 0 ? '입력' : '추정';
    }
    R.pile = pileRes;

    /* ── 지열 */
    var geoN = Math.max(0, Math.round(num(inp.geo, 0))), geoRes = null;
    if (geoN > 0) { var gwd = geoN / (L.geo.rate * L.geo.rigs * hF); geoRes = { n: geoN, wd: gwd, m: MO(gwd, rExt) }; }

    /* ── 굴착 */
    var exc = { V: Vexc, Vtot: sumL(Vexc) };
    var T_F, F0, tFound, foundAvail = null, EXC_END, lastStage = null, T_1F = null;
    var fz = null, base = null, PRD = null;
    var fl = L.found, crew = clamp(num(A.crew, fl.crew), 5, 40);
    var liftWD = (num(A.liftWD, 0) > 0 ? clamp(num(A.liftWD, 0), 1, 60) : L.base.liftWD) / hF, slabDB = L.base.slabD / hF;
    /* 방수 · 되메우기 = 토공 → 토목 가동률. 기초 Zone 시뮬레이션 (골조 WD) 에 넣을 때는 골조 WD로 환산 */
    var backfillWD = (A.backfill != null && A.backfill !== '' ? Math.max(0, num(A.backfill, L.base.backfill)) : L.base.backfill) / hF, backfillRC = backfillWD * rRC / rExt;
    var minSlab = L.base.minSlab / hF, zpt = L.base.zpt, bZoneA = L.base.zoneA;
    if (seq === 'BU') {
      if (pileRes && pileBefore) { act({ id: 'pile', g: '토목', name: (fType === 'PHC' ? 'PHC 파일' : '현장타설말뚝') + ' (굴착 전 선시공)', s: t, e: t + pileM, cp: true, wd: pileRes.wd, rate: 'ext', qty: pileRes.qty, basis: pileRes.basis }); }
      var methodF = L.exc.methodF[sup] || 1;
      var fA = clamp(Math.pow(Math.max(Aeff, 1) / L.exc.BU.Aref, L.exc.areaExp), L.exc.areaMin, L.exc.areaMax);
      var rate = {}; LK.forEach(function (k) { rate[k] = L.exc.BU[k] * methodF * fA * hF; });
      var ewd = wdOf(Vexc, rate), ns = 0, pen = 0, inst = 0;
      /* 토사 · 풍화토 상부 dirD m 는 직상차 (덤프 직접 상차), 그 아래는 크람쉘 */
      var dirD = Math.min(L.exc.BU.dirD || 0, nB > 0 ? H : Hs), dirV = 0;
      if (dirD > 0 && L.exc.BU.dir > 0) {
        var ldir = lens(z, 0, dirD), rDir = L.exc.BU.dir * methodF * fA * hF;
        ['soil', 'wsoil'].forEach(function (k) { var vd = Math.min(Vexc[k], (nB > 0 ? Adeep : Ash) * ldir[k] + (Vsl[k] || 0)); if (vd > 0) { ewd += vd / rDir - vd / rate[k]; dirV += vd; } });
      }
      exc.dirV = dirV; exc.dirD = dirD;
      if (nB > 0 && (sup === 'ANCHOR' || sup === 'STRUT' || sup === 'RAKER')) {
        var SP = L.support[sup];
        ns = Math.ceil(Math.max(0, H - 1.5) / SP.sp); if (sup === 'RAKER') { ns = Math.min(SP.max, ns); if (H > 10) R.warn.push('레이커는 굴착 10m 이하에 적합합니다 (현재 ' + r1(H) + 'm) → 앵커·스트럿 검토'); }
        pen = ns * SP.pen / hF;
        if (sup === 'ANCHOR') { var setsA = clamp(Math.ceil(P / 200), 1, 4), perSt = (P / SP.hsp) / (SP.rate * setsA * hF), stExc = ewd / Math.max(ns, 1); inst = Math.max(0, perSt - stExc) * ns; exc.anchor = { stages: ns, perStage: Math.ceil(P / SP.hsp), total: Math.ceil(P / SP.hsp) * ns, sets: setsA }; }
      }
      exc.wd = ewd + pen + inst; exc.ns = ns; exc.pen = pen; exc.rate = rate; exc.fA = fA; exc.methodF = methodF;
      var em = MO(exc.wd, rExt);
      var es = t + (pileRes && pileBefore ? Math.min(pileM, 1.0) : 0), ee = Math.max(es + em, pileRes && pileBefore ? t + pileM + 0.5 : 0);
      act({ id: 'exc', g: '토목', name: '터파기' + (ns ? ' + ' + SUP_N[sup] + ' ' + ns + '단' : (open ? ' (오픈컷 1:' + s + ')' : '')), s: es, e: ee, cp: true, wd: exc.wd, rate: 'ext',
        qty: fmt(exc.Vtot) + '㎥' + (exc.anchor ? ' · 앵커 ' + fmt(exc.anchor.total) + '본' : ''),
        basis: '지층별 물량 ÷ 생산성 (면적 보정 ×' + r2(fA) + (methodF !== 1 ? ', 공법 ×' + methodF : '') + ')' + (ns ? ' + 지보 ' + ns + '단 × ' + r1(L.support[sup].pen / hF) + 'WD' : '') + (pileRes && pileBefore ? ' · 파일 Zone 추종 (1.0개월 시차)' : '') });
      t = ee; EXC_END = ee;
      if (pileRes && !pileBefore) { act({ id: 'pile', g: '토목', name: (fType === 'PHC' ? 'PHC 파일' : '현장타설말뚝') + ' (굴착 후 바닥 시공)', s: t, e: t + pileM, cp: true, wd: pileRes.wd, rate: 'ext', qty: pileRes.qty, basis: pileRes.basis }); t += pileM; }
      if (geoRes) { act({ id: 'geo', g: '토목', name: '지열 (' + geoN + '공)', s: t, e: t + geoRes.m, cp: true, wd: geoRes.wd, rate: 'ext', qty: geoN + '공', basis: geoN + '공 ÷ (' + L.geo.rate + '공/일 × ' + L.geo.rigs + '대) · 굴착 바닥에서 천공' }); t += geoRes.m; }
      F0 = t;
    } else {
      /* 역타 : 벽체 → PRD → 지열 → 1차 터파기 → 기준층 슬래브 → 하부 터파기 (층별) → 기초 */
      var Tp = L.prd, nPrd = num(A.prdN, 0) > 0 ? Math.round(num(A.prdN, 0)) : Math.max(4, Math.round(Adeep / Tp.areaPer));
      var Lp = H + Tp.ext, perP = wdOf(lens(z, 0, Lp), Tp.rate), setsP = clamp(Math.ceil(nPrd / Tp.setPer), 1, Tp.maxSets);
      var pwd2 = (nPrd * perP / setsP + Tp.setup) / hF;
      PRD = { n: nPrd, L: Lp, sets: setsP, wd: pwd2 };
      var prm = MO(pwd2, rExt);
      act({ id: 'prd', g: '토목', name: 'PRD · SPS 기둥 (' + nPrd + '공)', s: t, e: t + prm, cp: true, wd: pwd2, rate: 'ext', qty: nPrd + '공 (L≈' + r1(Lp) + 'm)', basis: '기둥 ' + nPrd + '공 (지하 바닥 ÷ ' + Tp.areaPer + '㎡' + (num(A.prdN, 0) > 0 ? ' → 입력값' : ' 추정') + ') · 천공 토사 ' + Tp.rate.soil + ' / 암 ' + Tp.rate.srock + ' m/일 · ' + setsP + '조 + 장비 조립 ' + Tp.setup + 'WD' });
      t += prm;
      /* 역타 파일 : 지하 슬래브 하부로 장비 진입 불가 → 굴착 전 지상에서 공굴착 포함 천공 */
      if (pileRes) { act({ id: 'pile', g: '토목', name: '현장타설말뚝 (굴착 전 지상 천공)', s: t, e: t + pileM, cp: true, wd: pileRes.wd, rate: 'ext', qty: pileRes.qty, basis: pileRes.basis + ' · 공굴착 GL−' + r1(H) + 'm 포함 (생산성 확인 필요)' }); t += pileM; }
      if (geoRes) { act({ id: 'geo', g: '토목', name: '지열 (' + geoN + '공)', s: t, e: t + geoRes.m, cp: true, wd: geoRes.wd, rate: 'ext', qty: geoN + '공', basis: geoN + '공 ÷ (' + L.geo.rate + '공/일 × ' + L.geo.rigs + '대) · 굴착 전 지상 천공' }); t += geoRes.m; }
      var TD = L.td;
      var fA1 = clamp(Math.pow(Math.max(Adeep + Ash, 1) / L.exc.BU.Aref, L.exc.areaExp), L.exc.areaMin, L.exc.areaMax);
      var rate1 = {}; LK.forEach(function (k) { rate1[k] = L.exc.BU[k] * fA1 * hF; });
      /* 1차 터파기 : 기준층 슬래브 하부 (기존 지하 공간 제외) + 부분 지하일 때 얕은 구간 기초 터파기 */
      var V1 = {}, l1 = lens(z, 0, TD.d1), lv1 = exA > 0 && exD > 0 ? lens(z, 0, Math.min(TD.d1, exD)) : null, lsh = Ash > 0 ? lens(z, 0, Hs) : null;
      LK.forEach(function (k) { V1[k] = Math.max(0, Adeep * l1[k] - (lv1 ? exA * lv1[k] : 0)) + (lsh ? Ash * lsh[k] : 0); });
      if (Ash > 0) R.warn.push('역타 + 부분 지하 : 얕은 구간 (' + fmt(Ash / 1.05) + '㎡) 기초 터파기는 1차 터파기에 포함했습니다 — 얕은 구간 기초 · 1F 바닥 순서는 별도 검토 필요');
      var w1 = wdOf(V1, rate1), m1 = MO(w1, rExt);
      act({ id: 'exc1', g: '토목', name: '1차 터파기 (' + baseName + ' 슬래브 하부)', s: t, e: t + m1, cp: true, wd: w1, rate: 'ext', qty: fmt(sumL(V1)) + '㎥ (GL−' + TD.d1 + 'm)', basis: '개방 굴착 생산성 (순타 기준)' + (lv1 ? ' · 기존 지하 공간 제외' : '') + (lsh ? ' · 얕은 구간 기초 터파기 포함' : '') });
      t += m1;
      /* 역타 슬래브 팀 (adv.tdTeams, 기본 1 = 1팀 Zone 순환) : 팀당 Zone m = ⌈Zone ÷ 팀⌉ → WD = Zone 13 + 시차 4.5 × (m − 1) — 팀끼리 병행 (Zone 1개 13 WD 미만으로 줄지 않음)
         v2.8 은 Zone 수를 팀으로 나눈 뒤 다시 ÷ 팀 (이중 나눗셈) 이라 따르지 않고 한 번만 나눔 */
      var n1 = clamp(Math.round(Adeep / TD.f1ZoneA), 2, 4), tdT = num(A.tdTeams, 0) > 0 ? clamp(Math.round(num(A.tdTeams, 0)), 1, n1) : 1, m1z = Math.ceil(n1 / tdT - 1e-9);
      var f1wd = (TD.f1Zone + (m1z - 1) * TD.f1Lag) / hF, setWD = TD.setup / hF;
      var f1m = MO(f1wd, rRC) + TD.f1CureCD / D + MO(setWD, rExt);
      act({ id: 'f1', g: '토목', name: baseName + ' 슬래브 (기준층 · ' + n1 + ' Zone' + (tdT > 1 ? ' · ' + tdT + '팀' : '') + ')', s: t, e: t + f1m, cp: true, wd: f1wd, rate: 'rc', qty: n1 + ' Zone',
        basis: 'Zone ' + TD.f1Zone + 'WD + 시차 ' + TD.f1Lag + 'WD × ' + (m1z - 1) + (tdT > 1 ? ' (' + tdT + '팀 · 팀당 ' + m1z + ' Zone)' : '') + ' → 양생 ' + TD.f1CureCD + 'CD → 덤프 · 크람쉘 셋팅 ' + TD.setup + 'WD' });
      T_1F = t + f1m; t = T_1F;
      var fAt = clamp(Math.pow(Math.max(Adeep, 1) / L.exc.TD.Aref, L.exc.areaExp), L.exc.areaMin, L.exc.areaMax);
      var rateT = {}; LK.forEach(function (k) { rateT[k] = L.exc.TD[k] * fAt * hF; });
      var levels = [], cum = 0; for (k = 0; k < tdSt.length - 1; k++) { cum += tdSt[k].h; levels.push({ lv: tdSt[k].lv + ' 슬래브', d: Math.min(cum + 0.5, H - 0.5), slab: true }); }
      levels.push({ lv: '기초 바닥', d: H, slab: false });
      /* 단계 공기 : 굴착 지배 = 토목 가동률, 슬래브 지배 = 골조 가동률 (각 단계 개월을 합산) */
      var prev = TD.d1, stages = [], slabWD = (TD.f1Zone + (m1z - 1) * TD.f1Lag) * TD.slabF / hF, totM = 0;
      levels.forEach(function (lvl) {
        var a = prev, b = Math.max(prev, lvl.d), ll = lens(z, a, b), Vs = {}; LK.forEach(function (k) { Vs[k] = Adeep * ll[k]; });
        if (exA > 0 && exD > a) { var lvv = lens(z, a, Math.min(b, exD)); LK.forEach(function (k) { Vs[k] = Math.max(0, Vs[k] - exA * lvv[k]); }); }
        var wE = wdOf(Vs, rateT), mE = MO(wE, rExt), mS = lvl.slab ? MO(slabWD, rRC) : 0, slabGov = mS > mE;
        var st = { lv: lvl.lv, a: r1(a), b: r1(b), V: Vs, Vt: sumL(Vs), wd: slabGov ? slabWD : wE, wdExc: wE, m: slabGov ? mS : mE, rate: slabGov ? 'rc' : 'ext', gov: slabGov ? 'slab' : 'exc' };
        stages.push(st); totM += st.m; prev = b;
      });
      /* 합계 WD = 토목 가동률 환산 (개월 × 가동률 × 30.4) → 엑셀 · 산출표와 같은 기준 */
      var totW = totM * rExt * D;
      exc.stages = stages; exc.rate = rateT; exc.fA = fAt; exc.wd = totW; exc.m = totM; exc.V1 = sumL(V1);
      exc.td = { n1: n1, T: tdT, m: m1z, f1wd: f1wd, slabWD: slabWD, tIn: num(A.tdTeams, 0) > 0 };
      exc.Vtot = sumL(V1) + stages.reduce(function (s2, x) { return s2 + x.Vt; }, 0);
      var em2 = totM, nSlabGov = stages.filter(function (x) { return x.gov === 'slab'; }).length;
      act({ id: 'exc', g: '토목', name: '지하 터파기 · 슬래브 (' + (tdSt[0] ? tdSt[0].lv : 'B1') + ' ~ 기초, ' + stages.length + '단계)', s: t, e: t + em2, cp: true, wd: totW, rate: 'ext', qty: fmt(exc.Vtot - exc.V1) + '㎥',
        basis: '층별 단계 굴착 (슬래브 하부 · 크람쉘) · 지층별 생산성 × 면적 보정 ' + r2(fAt) + ' · 지하 슬래브는 3 Zone 순환으로 병행' + (nSlabGov ? ' · 슬래브 지배 ' + nSlabGov + '단계는 골조 가동률 (토목 WD 환산)' : '') });
      lastStage = stages[stages.length - 1];
      var lsM = lastStage.m;
      EXC_END = t + em2; foundAvail = { s: EXC_END - lsM, d: lsM };
      t = EXC_END;
      F0 = foundAvail.s;
    }
    R.exc = exc;

    /* ── 기초 Zone · 철근팀 시뮬레이션 */
    var teq = fType === 'MAT' ? tMat * 1.10 : tMat * 0.6 * 1.10;
    var Vf = Af * teq, zoneV = clamp(num(A.zoneV, fl.zoneV), 300, 2000);
    var nZ = Math.max(1, Math.ceil(Vf / zoneV - 1e-9)), vZ = Vf / nZ;
    var nDeep = nB > 0 ? Math.min(nZ, Math.ceil((Adeep / 1.08) * teq / zoneV - 1e-9)) : 0;
    /* PIT Zone : 입력 (adv.pitZ = Zone 번호 목록, 0부터 — 화면이 지상 코어 아래 Zone 으로 채움) 이 있으면 그 Zone, 없으면 Zone 수 × pitRatio 를 고르게 */
    var pitIn = Array.isArray(A.pitZ) ? A.pitZ.map(function (v) { return Math.round(+v); }).filter(function (v, k, a) { return v >= 0 && v < nZ && a.indexOf(v) === k; }) : [];
    var nPit = pitIn.length ? pitIn.length : nB > 0 ? Math.min(num(A.pitN, 0) > 0 ? Math.round(num(A.pitN, 0)) : Math.max(1, Math.round(nZ * fl.pitRatio)), nDeep > 0 ? nDeep : nZ) : 0;
    var rebR = num(A.rebar, 0) > 0 ? clamp(num(A.rebar, 0), 0.03, 0.4) : fl.rebar, lagF = A.lag != null && A.lag !== '' ? clamp(num(A.lag, fl.lag), 0, 60) : fl.lag;
    /* 준비 (영구배수 · 버림 · 먹) · 마무리 (형틀 · 검측 · 타설) · PIT 추가는 작업량 → 작업시간 비례. 팀 시차는 계획값 (고정) */
    var prepW = fl.prep / hF, tailW = fl.tail / hF, pitW = fl.pitAdd / hF;
    /* Zone 당 철근 WD : adv.fRwd (화면 사이클 바차트에서 고친 값) 가 있으면 그 값, 없으면 철근량 ÷ (인원 × 생산성) */
    var reb = vZ * rebR, tpd = crew * fl.tPerMD * hF, Rr0 = Math.max(1, Math.ceil(reb / tpd - 1e-9)), Rr = num(A.fRwd, 0) > 0 ? clamp(num(A.fRwd, 0), 0.5, 200) : Rr0, Rpit = Rr + pitW;
    var teamsF = num(A.fTeams, 0) > 0 ? clamp(Math.round(num(A.fTeams, 0)), 1, 10) : clamp(Math.ceil(Vf / fl.teamV), 1, fl.maxTeams);
    var nSlopeZ = open && partial ? Math.min(nZ - nDeep, Math.ceil(slopeA * teq / zoneV)) : 0;
    /* Zone 안 공종 겹침 (adv.fOv = { r : 준비 ↔ 철근, t : 철근 ↔ 형틀 · 타설 } WD — 화면 사이클 표에서 막대를 끌어 정함, 0 ≤ 겹침 ≤ 앞 공종 일수)
       철근 착수 = 준비 끝 − r (준비 대기 줄어듦) · 형틀 · 타설 = 앞 공종 (준비 · 철근) 이 모두 끝나는 때 − t · 타설일 = 가장 늦은 끝 (PIT 도 같은 규칙). 없으면 순차 그대로 */
    var fOv = A.fOv && typeof A.fOv === 'object' ? A.fOv : null;
    var ovR = fOv ? clamp(num(fOv.r, 0), 0, prepW) : 0, ovT = fOv ? clamp(num(fOv.t, 0), 0, Rr) : 0, fOvOn = ovR > 0 || ovT > 0;
    function zEnd(occ) { var fr = Math.max(prepW, prepW - ovR + occ); return Math.max(fr, fr - ovT + tailW); }
    function sim(avail) {
      var pit = {}; if (pitIn.length) pitIn.forEach(function (v) { pit[v] = true; }); else for (var j = 0; j < nPit; j++) pit[Math.min(nZ - 1, Math.floor((j + 0.5) * (nDeep > 0 ? nDeep : nZ) / nPit))] = true;
      var free = []; for (var q = 0; q < teamsF; q++) free.push(q * lagF);
      var pours = {}, Z = [], order = []; for (var i = 0; i < nZ; i++) order.push(i);
      order.sort(function (a, b) { return avail[a] - avail[b] || a - b; });
      order.forEach(function (i) {
        var ready = avail[i] + prepW - ovR, best = 0, bs = Infinity;
        for (var q2 = 0; q2 < teamsF; q2++) { var st = Math.max(free[q2], ready); if (st < bs - 1e-9 || (Math.abs(st - bs) < 1e-9 && free[q2] < free[best])) { bs = st; best = q2; } }
        var isP = !!pit[i], occ = isP ? Rpit : Rr, fr = Math.max(avail[i] + prepW, bs + occ), pd = Math.ceil((fOvOn ? Math.max(fr, fr - ovT + tailW) : bs + occ + tailW) - 1e-9);
        if (!isFinite(pd)) pd = 1e6;
        for (var guard = 0; pours[pd] && guard < 100000; guard++) pd++;
        pours[pd] = 1; free[best] = bs + occ;
        Z.push({ i: i, team: best + 1, pit: isP, s: bs, pour: pd, ready: ready, deep: i < nDeep, slope: i >= nZ - nSlopeZ && nSlopeZ > 0 });
      });
      var end = 0; Z.forEach(function (x) { end = Math.max(end, x.pour + 1); });
      return { Z: Z, end: end };
    }
    var avail = []; for (var i2 = 0; i2 < nZ; i2++) avail.push(0);
    if (seq === 'TD') { var gW = foundAvail.d * rRC * D; for (i2 = 0; i2 < nZ; i2++) avail[i2] = (i2 + 1) / nZ * gW; }
    var S1 = sim(avail), bPath = null;
    /* 부분 지하 (오픈컷) : 지하부 Zone 완료 → 외벽 → 방수 · 되메우기 → 경사띠 Zone */
    if (partial && seq === 'BU') {
      var deepDone = 0; S1.Z.forEach(function (x) { if (x.deep) deepDone = Math.max(deepDone, x.pour + 1); });
      var wv = 0;
      hB.forEach(function (h) { wv += h * liftWD / L.base.liftRef; });
      var bf = open ? backfillRC : 0;
      /* 경로 공종 겹침 (adv.pOv = { bf : 외벽 ↔ 방수 · 되메우기, s : 앞 공종 ↔ 바닥 } WD, 0 ≤ 겹침 ≤ 앞 공종 일수)
         바닥 착수 = 앞 공종 (외벽 · 방수 · 되메우기) 이 모두 끝나는 때 − s → 경로 = 가장 늦은 끝. 없으면 순차 그대로 */
      var pOv = A.pOv && typeof A.pOv === 'object' ? A.pOv : null, ovBf = pOv && bf > 0 ? clamp(num(pOv.bf, 0), 0, wv) : 0;
      if (nSlopeZ > 0) { for (i2 = nZ - nSlopeZ; i2 < nZ; i2++) avail[i2] = ovBf > 0 ? deepDone + Math.max(wv, wv - ovBf + bf) : deepDone + wv + bf; S1 = sim(avail); deepDone = 0; S1.Z.forEach(function (x) { if (x.deep) deepDone = Math.max(deepDone, x.pour + 1); }); }
      /* 지하부 바닥 : 지하 각 층 상부 슬래브 (B(n-1) ~ 1F) = 지하 층수만큼 */
      var Zs1 = Math.max(1, Math.round(AdnEff / bZoneA)), Ts1 = Math.ceil(Zs1 / zpt - 1e-9), sl1 = Math.max(minSlab, Math.ceil(Zs1 / Ts1 - 1e-9) * slabDB), slT = sl1 * nB;
      bPath = { start: deepDone, walls: wv, backfill: bf, backfillExt: open ? backfillWD : 0, slab: slT, slabPer: sl1, nSlab: nB, end: deepDone + wv + bf + slT };
      var ovS = pOv ? clamp(num(pOv.s, 0), 0, bf > 0 ? bf : wv) : 0;
      if (ovBf > 0 || ovS > 0) {
        var bfE = bf > 0 ? wv - ovBf + bf : 0, frS = Math.max(wv, bfE), slE = frS - ovS + slT, span = Math.max(frS, slE);
        bPath.ov = { bf: ovBf, s: ovS }; bPath.span = span; bPath.end = deepDone + span;
      }
    }
    var fEndWD = S1.end;
    fz = { rebR: rebR, lag: lagF, Af: Af, t: tMat, teq: teq, V: Vf, nZ: nZ, vZ: vZ, nPit: nPit, reb: reb, R: Rr, R0: Rr0, Rpit: Rpit, prep: prepW, tail: tailW, cyc: Rr + prepW + tailW, cycPit: Rpit + prepW + tailW, teams: teamsF, crew: crew, tpd: tpd, sim: S1, nDeep: nDeep, nSlopeZ: nSlopeZ, bPath: bPath };
    if (fOvOn) { fz.ov = { r: ovR, t: ovT }; fz.cyc = zEnd(Rr); fz.cycPit = zEnd(Rpit); }
    if (crew > 25) R.warn.push('철근팀 ' + crew + '명/팀 : 팀당 25명 초과는 작업 간섭으로 비권장 (기준 20명, 최대 25명)');
    var fM;
    if (seq === 'BU') {
      fM = MO(fEndWD, rRC);
      var fEndM = F0 + fM;
      act({ id: 'found', g: '골조', name: '기초 (' + nZ + ' Zone · 철근 ' + teamsF + '팀)', s: F0, e: fEndM, cp: true, wd: fEndWD, rate: 'rc', qty: fmt(Vf) + '㎥ · 철근 ' + fmt(Vf * rebR) + 't',
        basis: 'Zone ' + fmt(vZ) + '㎥ · 철근 ' + r1(reb) + 't ÷ ' + r1(tpd) + 't/일 (' + crew + '명) = ' + (Rr !== Rr0 ? r1(Rr) + 'WD (입력)' : Rr + 'WD') + ' → 사이클 ' + r1(fz.cyc) + 'WD (PIT ' + r1(fz.cycPit) + 'WD) · ' + teamsF + '팀 ' + lagF + 'WD 시차 착수' });
      t = fEndM; T_F = fEndM;
    } else {
      var cureWD = fl.cureCD * rRC;
      fM = MO(fEndWD + cureWD, rRC);
      T_F = F0 + fM;
      act({ id: 'found', g: '골조', name: '기초 (' + nZ + ' Zone · 철근 ' + teamsF + '팀) + 양생 ' + fl.cureCD + 'CD', s: F0, e: T_F, cp: true, cpFrom: EXC_END, wd: fEndWD + cureWD, rate: 'rc', qty: fmt(Vf) + '㎥ · 철근 ' + fmt(Vf * rebR) + 't',
        basis: '최종 단계 굴착 Zone 순 (3구간) 착수 · 사이클 ' + r1(fz.cyc) + 'WD (PIT ' + r1(fz.cycPit) + 'WD) · ' + teamsF + '팀 · 최종 타설 후 양생 ' + fl.cureCD + 'CD = 구조제한 해제' });
      t = T_F;
    }

    /* ── v2.8 일반 골조 물량 · 공종 사슬 (v2.8 (다른 버전 공기산정 도구) frameQty · frameCycles · zoning 을 옮김)
       쓰는 곳 : 지하 순타 층별 바닥 (E3) · 일반 지상 RC · SRC 바닥 (c4) · 철골 · 강합성 코어 c1 / 바닥 c3 하한 · DC 분할 하한 (일반 사이클) */
    var FR = L.frame, V8 = v28Of(L.v28), V8D = defaultV28();
    /* Zone 수 입력 : zSpec = 옛 경로 (면적 900㎡ Zone · 철골 · 강합성 · 벽식 · frChain OFF) 와 DC (체적 500㎥ Zone) 용 — 뜻이 그대로라 옛 저장 파일 · 보관함 값이 새 경로에 섞이지 않음
       zN = v2.8 공종 사슬 경로 (일반 지상 RC · SRC 바닥 · 순타 지하 바닥) 의 체적 Zone 수 (같은 형식 'n-m:N, Bk:N' — Bk = 지하 Bk 층 행 (외벽 Bk + 그 위 바닥)) */
    var ZS = parseSpec(A.zSpec), ZN = parseSpec(A.zN), Atyp = num(A.Atyp, 0) > 0 ? num(A.Atyp, 0) : (gUp > 0 ? gUp / nUp : bldg);
    /* 코어 바닥면적 (adv.coreA = 화면 코어 합계) : 기준층 60% 까지 */
    var coreAin = num(A.coreA, 0) > 0 ? Math.min(num(A.coreA, 0), Atyp * 0.6) : 0;
    /* 코어 면적 자동 비율 (adv.coreA 없을 때) : 철골 · 강합성 · DC 건물 = frame.core.ratio 0.2 (옛 경로 코어 Zone · 화면 코어 그림 · c1 · c3 하한 · 지하 사슬 모두 같은 코어), 그 밖 (일반 RC · SRC) = v28.coreR 0.23 (v2.8) */
    var coreSC = struct === 'SC' || struct === 'COMP' || (seq === 'BU' && (A.dcCycle === 'ON' || (A.dcCycle !== 'OFF' && use === 'dc'))), coreRb = coreSC ? FR.core.ratio : V8.coreR;
    function hfac(h) { return 1 + FR.hK * Math.max(0, h - FR.hRef); }
    function RU(x, d) { var p = Math.pow(10, d || 0); return Math.ceil(x * p - 1e-9) / p; }
    function RN(x, d) { var p = Math.pow(10, d || 0); return Math.round(x * p + 1e-9) / p; }
    function cl(x) { return Math.ceil(x - 1e-9); }
    var sL8 = num(A.spanL, 0) > 0 ? num(A.spanL, 0) : V8.spanL, sS8 = num(A.spanS, 0) > 0 ? num(A.spanS, 0) : V8.spanS, colN8 = num(A.colN, 0) > 0 ? Math.round(num(A.colN, 0)) : 0;
    /* 물량 (v2.8 frameQty) : Au = 층 면적 · Ac = 코어 면적 · h = 층고 · bsm = 지하 (기둥 1.44 · 보 0.84 · 슬래브 0.15) · nC = 기둥 수 입력 (지상만)
       기둥 = 격자 ⌈√A/장변+1⌉ × ⌈√A/단변+1⌉ − 코어 격자, 보 = ⌈기둥 × 3.5⌉ · 길이 (⌈보/3⌉ × 단변 + 나머지 × 장변) × 단면 × 0.85, 슬래브 = (A − 코어) × 두께,
       코어 벽 = 코어 × 0.24 × 층고 · 코어 바닥 = 코어 × 두께, 철근 = 기둥 · 보 × 0.21 · 슬래브 · 벽 × 0.1 t/㎥, 테이블폼 = ⌈보/3 × 단변 ÷ 2.4⌉ + ⌈보/3 × 2 × 장변 ÷ 2.4⌉ 장 */
    function q28(Au, Ac, h, bsm, nC) {
      function grid(a) { return a > 0 ? RU(Math.sqrt(a) / sL8 + 1) * RU(Math.sqrt(a) / sS8 + 1) : 0; }
      Au = Math.max(0, Au || 0); Ac = Math.max(0, Math.min(Ac || 0, Au));
      var nCol = nC > 0 ? nC : Math.max(1, grid(Au) - grid(Ac)), nBm = RU(nCol * V8.beamsPerCol), nb3 = RU(nBm / 3);
      var tS = bsm ? V8.slabTB : V8.slabT, cA = bsm ? V8.colAB : V8.colA, bA = bsm ? V8.beamAB : V8.beamA;
      var Vc = cA * nCol * h, Vb = RU((nb3 * sS8 + (nBm - nb3) * sL8) * bA * V8.beamK, 1), Vs = RU((Au - Ac) * tS), Vw = Ac * V8.coreWall * h, Vcs = Ac * tS;
      return { Au: Au, Ac: Ac, h: h, bsm: !!bsm, nCol: nCol, nBm: nBm, tS: tS, Vc: Vc, Vb: Vb, Vs: Vs, Vw: Vw, Vcs: Vcs, V: Vc + Vb + Vs + Vw + Vcs, slabA: Au - Ac,
        rW: RU(Vw * V8.rebSC, 2), rS: RU(Vcs * V8.rebSC, 2), rRC: RU(Vc * V8.rebCB, 1) + RU(Vb * V8.rebCB, 1) + Vs * V8.rebSC, rST: RU(Vc * V8.rebCB, 1) + Vs * V8.rebSC,
        tf: RU(nBm / 3 * sS8 / V8.tableW) + RU(nBm / 3 * 2 * sL8 / V8.tableW) };
    }
    function qSum(Q) { return { Au: r1(Q.Au), Ac: r1(Q.Ac), h: Q.h, nCol: Q.nCol, nBm: Q.nBm, V: r1(Q.V), Vcol: r1(Q.Vc), Vbeam: r1(Q.Vb), Vslab: r1(Q.Vs), Vwall: r1(Q.Vw), Vcs: r1(Q.Vcs), reb: r1(Q.rW + Q.rS + Q.rRC), tf: Q.tf }; }
    /* 공종 한 줄 : k = 순번 키 (겹침 입력 키), n = 공종명, wd, fixed = 고정 일수, q · u = Zone 1개 물량 · 단위, p = 생산성 (철근은 인원), lib = 편집 경로 */
    function it8(k, n, wd, o) { o = o || {}; var x = { k: k, n: n, wd: wd, fixed: !!o.fixed, q: o.q != null ? o.q : null, u: o.u || '', p: o.p != null ? o.p : null, lib: o.lib || '' }; if (o.pt) x.pt = o.pt; return x; }
    function rb8(t, crew) { return cl(t / (V8.tPerMD * crew * hF)); }
    /* PT : v2.8 c4 는 '철근 · M&E (PT 1일)' 을 늘 넣음 (ptAll 1, 사례 B 보정 겹침도 이 기준). PT 슬래브 (inp.pt) 면 지상 바닥에 ptX 를 더함 (ptAll 0 이면 PT 슬래브일 때만 ptAdd) */
    var ptOn = V8.ptAll > 0 || !!inp.pt, ptXd = inp.pt && V8.ptAll > 0 ? V8.ptX : 0;
    /* 공종 사슬 : 착수 = 앞 공종들이 다 끝나는 때 − 겹침 (0 ≤ 겹침 ≤ 바로 앞 공종 일수, dcOv 와 같은 규칙) → Zone 1개 작업 = 가장 늦은 끝 */
    function run28(items, ovOf) {
      var fr = 0, mx = 0;
      items.forEach(function (it, i) {
        var o = i > 0 ? clamp(num(ovOf(i), 0), 0, items[i - 1].wd) : 0;
        it.ov = o; it.pe = fr; it.ovMax = i > 0 ? items[i - 1].wd : 0; it.s = Math.max(0, fr - o); fr = Math.max(fr, it.s + it.wd); mx = Math.max(mx, it.wd);
      });
      return { items: items, zone: fr, maxWD: mx };
    }
    /* 공종 사슬 (일반형 — c1 · c2 · c3 · c5) : pre[i] = null → 앞 공종들이 다 끝나는 때 (run28 와 같음) · [] → 0 에서 착수 (겹침 없음) · [j] → j 번째 공종 끝
       착수 = 기준 시점 (pe) − 겹침 (0 ≤ 겹침 ≤ ovMax = 기준 공종 일수). 겹침 = 사용자 입력 (adv.seqOv.<사슬> = { a0: WD, … }) 이 있으면 그 값, 없으면 v2.8 간격 (ovDef)
       Zone 1개 = 가장 늦은 끝 + endAdd (c3 마무리). zone28 = v2.8 간격 그대로의 사슬 길이 (사용자 겹침 없이) */
    function runCh(items, ovDef, ovUser, pre, endAdd) {
      var u = ovUser && typeof ovUser === 'object' ? ovUser : null;
      function go(useU) {
        var fr = 0, ends = [];
        items.forEach(function (it, i) {
          var p = pre ? pre[i] : null, ref, mo;
          if (i === 0 || (p && !p.length)) { ref = 0; mo = 0; } else if (p) { ref = ends[p[0]]; mo = items[p[0]].wd; } else { ref = fr; mo = items[i - 1].wd; }
          var x = useU && u ? parseFloat(u['a' + i]) : NaN, o = clamp(isFinite(x) ? x : (ovDef[i] || 0), 0, mo), s0 = Math.max(0, ref - o);
          if (useU) { it.ov = o; it.pe = ref; it.ovMax = mo; it.s = s0; }
          ends.push(s0 + it.wd); fr = Math.max(fr, s0 + it.wd);
        });
        return fr + (endAdd || 0);
      }
      var z = go(true), mx = 0; items.forEach(function (it) { mx = Math.max(mx, it.wd); });
      return { items: items, zone: z, zone28: u ? go(false) : z, maxWD: mx };
    }
    /* 사슬 길이만 (items 는 바꾸지 않음) : ov[i] = 겹침 WD */
    function len28(items, ov) {
      var fr = 0; items.forEach(function (it, i) { var o = i > 0 ? clamp(ov[i] || 0, 0, items[i - 1].wd) : 0; fr = Math.max(fr, Math.max(0, fr - o) + it.wd); });
      return fr;
    }
    /* 겹침 : 사용자 입력 (adv.rcOv · bcOv = { a0: WD, a1: … }, 키 = 공종 순번) 이 있으면 그 값, 없으면 라이브러리 기본 (v28.ov0 ~ ov7) */
    function ovSrc(user) {
      var u = user && typeof user === 'object' ? user : null;
      return function (i) { var x = u ? parseFloat(u['a' + i]) : NaN; return isFinite(x) ? x : num(V8['ov' + i], 0); };
    }
    /* c4 동시 RC (Zone 1개) : 양중 · 벽체 철근 · 벽체 형틀 · 테이블폼 · 형틀 · DECK · 철근 · M&E (+ PT) · 타설 — 작업량 공종은 ÷ 작업시간 hF (DC rb 와 같음), 타설은 고정 */
    function c4(Q, N, ovUser, up) {
      /* PT 일수 : 지상 (up) = v2.8 PT 1일 (ptAll 또는 PT 슬래브) + PT 슬래브 추가 ptX · 지하 = v2.8 PT 1일 (ptAll) 만 (PT 슬래브 입력은 지상 바닥에만 — 옛 엔진과 같음) */
      var qW = Q.rW / N, qT = RU(Q.tf / N), qD = RU(Q.slabA / N, 1), qR = (Q.rS + Q.rRC) / N, ptd = up ? (ptOn ? V8.ptAdd : 0) + ptXd : (V8.ptAll > 0 ? V8.ptAdd : 0);
      var r = run28([
        it8('a0', '양중', V8.lift / hF, { fixed: true, lib: 'v28.lift' }),
        it8('a1', '벽체 철근', rb8(qW, V8.crewW), { q: RN(qW, 2), u: 't', p: V8.crewW, lib: 'v28.crewW' }),
        it8('a2', '벽체 형틀', V8.wform / hF, { fixed: true, lib: 'v28.wform' }),
        it8('a3', '테이블폼', cl(qT / (V8.table * hF)), { q: qT, u: '장', p: V8.table, lib: 'v28.table' }),
        it8('a4', '형틀', V8.form / hF, { fixed: true, lib: 'v28.form' }),
        it8('a5', 'DECK', cl(qD / (V8.deck * hF)), { q: qD, u: '㎡', p: V8.deck, lib: 'v28.deck' }),
        it8('a6', ptd > 0 ? '철근 · M&E (PT ' + r1(ptd) + '일)' : '철근 · M&E', rb8(qR, V8.crewU) + ptd / hF, { q: RN(qR, 1), u: 't', p: V8.crewU, lib: 'v28.crewU', pt: ptd }),
        it8('a7', '타설', V8.pour, { fixed: true, lib: 'v28.pour' })
      ], ovSrc(ovUser));
      /* v2.8 소요 작업조 (참고) 는 v2.8 간격 그대로 (벽체 철근 ∥ 양중만, 사례 B 보정 겹침 없음) 의 사슬로 */
      r.zone28 = len28(r.items, [0, 1, 0, 0, 0, 0, 0, 0]); r.ptd = ptd;
      return r;
    }
    /* c1 코어 (Zone 1개, 수직재 회차마다) : Zc = ⌈코어 체적 ÷ 230⌉ (Nc 입력이 있으면 그 값) · 순타 직렬 / 역타 [양중 ∥ 벽체 철근, 형틀 · 슬래브 철근 각 1일 겹침] → 층 = 사슬 × 회수
       ovUser = 사용자 겹침 (코어후행 코어 경로 adv.seqOv.c1) — 없으면 v2.8 간격 (하한 · DC 분할 하한은 늘 v2.8 간격) */
    function c1(Ac, h, lifts, td, ovUser, Nc) {
      lifts = Math.max(1, lifts || 1);
      var Vw = Ac * V8.coreWall * h, Vcs = Ac * V8.slabT, Zc = Nc > 0 ? Math.max(1, Math.round(Nc)) : Math.max(1, RU((Vw + Vcs) / (V8.pourVc * V8.pump)));
      var qW = RU(RU(Vw / lifts * V8.rebSC, 2) / Zc * V8.c1W, 2), qS = RU(RU(Vcs * V8.rebSC, 2) / Zc * V8.c1S, 2), g = td ? [0, 1, 1, 1, 0, 0] : [0, 0, 0, 0, 0, 0];
      var r = runCh([
        it8('c0', '양중', V8.lift / hF, { fixed: true, lib: 'v28.lift' }),
        it8('c1', '벽체 철근', rb8(qW, V8.crewW), { q: qW, u: 't', p: V8.crewW, lib: 'v28.crewW' }),
        it8('c2', '벽체 형틀', V8.wform / hF, { fixed: true, lib: 'v28.wform' }),
        it8('c3', '슬래브 철근', rb8(qS, V8.crewCS), { q: qS, u: 't', p: V8.crewCS, lib: 'v28.crewCS' }),
        it8('c4', 'M&E', V8.me / hF, { fixed: true, lib: 'v28.me' }),
        it8('c5', '타설', V8.pour, { fixed: true, lib: 'v28.pour' })
      ], g, ovUser, null);
      r.Z = Zc; r.lifts = lifts; r.wd = r.zone * lifts; r.V = Vw + Vcs;
      return r;
    }
    /* c2 외주 RC : 양중 · 테이블폼 · 형틀 3 · DECK · 철근 · M&E · 타설, 테이블폼 ~ 철근은 앞 공종과 1일 겹침 (v2.8 간격 0)
       쓰는 곳 : DC 분할 하한 (일반 사이클) · RC 코어선행 바닥 · RC 코어후행 외주부. N = Zone 수 입력 (없으면 ⌈(기둥 + 보 + 슬래브) ÷ 300⌉), ptd = PT 슬래브 일수 (철근 · M&E 에) */
    function c2(Q, N, ovUser, ptd) {
      var Z = N > 0 ? Math.max(1, Math.round(N)) : Math.max(1, RU((Q.Vc + Q.Vb + Q.Vs) / (V8.pourV * V8.pump))), qT = RU(Q.tf / Z), qD = RU(Q.slabA / Z, 1), qR = Q.rRC / Z, g = [0, 1, 1, 1, 1, 0];
      ptd = ptd > 0 ? ptd : 0;
      var r = runCh([
        it8('b0', '양중', V8.lift / hF, { fixed: true, lib: 'v28.lift' }),
        it8('b1', '테이블폼', cl(qT / (V8.table * hF)), { q: qT, u: '장', p: V8.table, lib: 'v28.table' }),
        it8('b2', '형틀', V8.form2 / hF, { fixed: true, lib: 'v28.form2' }),
        it8('b3', 'DECK', cl(qD / (V8.deck * hF)), { q: qD, u: '㎡', p: V8.deck, lib: 'v28.deck' }),
        it8('b4', ptd > 0 ? '철근 · M&E (PT ' + r1(ptd) + '일)' : '철근 · M&E', rb8(qR, V8.crewU) + ptd / hF, { q: RN(qR, 2), u: 't', p: V8.crewU, lib: 'v28.crewU', pt: ptd }),
        it8('b5', '타설', V8.pour, { fixed: true, lib: 'v28.pour' })
      ], g, ovUser, null);
      r.Z = Z; r.wd = r.zone; r.V = Q.Vc + Q.Vb + Q.Vs; return r;
    }
    /* c3 외주 철골 : 철골 + 볼팅 · DECK · 철근 동시 착수 → 철근 뒤 M&E · 타설, 사이클 = 가장 늦은 끝 + 1 (Z = ⌈(기둥 + 슬래브) ÷ 300⌉, N 입력이 있으면 그 값)
       겹침 : 철골 · DECK · 철근은 0 에서 착수 (겹침 없음), M&E = 철근 끝 − 겹침, 타설 = M&E 끝 − 겹침 (v2.8 기본 0) */
    function c3(Q, N, ovUser) {
      var Z = N > 0 ? Math.max(1, Math.round(N)) : Math.max(1, RU((Q.Vc + Q.Vs) / (V8.pourV * V8.pump))), qS = (Q.nCol + Q.nBm) / Z, qD = RU(Q.slabA / Z), qR = Q.rST / Z;
      var r = runCh([
        it8('s0', '철골 + 볼팅', cl(qS / (V8.steelPc * hF)) + V8.bolt / hF, { q: RN(qS, 1), u: 'pcs', p: V8.steelPc, lib: 'v28.steelPc' }),
        it8('s1', 'DECK', cl(qD / (V8.deck * hF)), { q: qD, u: '㎡', p: V8.deck, lib: 'v28.deck' }),
        it8('s2', '철근', rb8(qR, V8.crewU), { q: RN(qR, 2), u: 't', p: V8.crewU, lib: 'v28.crewU' }),
        it8('s3', 'M&E', V8.me / hF, { fixed: true, lib: 'v28.me' }),
        it8('s4', '타설', V8.pour, { fixed: true, lib: 'v28.pour' })
      ], [0, 0, 0, 0, 0], ovUser, [[], [], [], [2], [3]], V8.c3End);
      r.Z = Z; r.wd = r.zone; r.V = Q.Vc + Q.Vs; return r;
    }
    /* c5 동시 철골 (v2.8 c5, 동시타설 철골 · 강합성) : 철골 + 볼팅 · DECK 는 선행 (사슬 밖, Zone 1개 lead = 철골 + DECK) →
       양중 ∥ 벽체 철근 → 벽체 형틀 (1일 겹침) → 철근 · M&E (crewS 20인) → 타설. Z = ⌈(코어 + 기둥 + 슬래브) ÷ 300⌉ (N 입력이 있으면 그 값) */
    function c5(Q, N, ovUser) {
      var Z = N > 0 ? Math.max(1, Math.round(N)) : Math.max(1, RU((Q.Vw + Q.Vcs + Q.Vc + Q.Vs) / (V8.pourV * V8.pump)));
      var qS = RU((Q.nCol + Q.nBm) / Z), qD = RU(Q.slabA / Z), qW = RU(Q.rW / Z, 1), qR = RU((Q.rS + Q.rST) / Z, 1);
      var lead = [it8('L0', '철골 + 볼팅 (선행)', cl(qS / (V8.steelPc * hF)) + V8.bolt / hF, { q: qS, u: 'pcs', p: V8.steelPc, lib: 'v28.steelPc' }),
        it8('L1', 'DECK (선행)', cl(qD / (V8.deck * hF)), { q: qD, u: '㎡', p: V8.deck, lib: 'v28.deck' })];
      lead[0].s = 0; lead[1].s = lead[0].wd; lead.forEach(function (x) { x.ov = 0; x.pe = x.s; x.ovMax = 0; });
      var r = runCh([
        it8('e0', '양중', V8.lift / hF, { fixed: true, lib: 'v28.lift' }),
        it8('e1', '벽체 철근', rb8(qW, V8.crewW), { q: qW, u: 't', p: V8.crewW, lib: 'v28.crewW' }),
        it8('e2', '벽체 형틀', V8.wform / hF, { fixed: true, lib: 'v28.wform' }),
        it8('e3', '철근 · M&E', rb8(qR, V8.crewS), { q: qR, u: 't', p: V8.crewS, lib: 'v28.crewS' }),
        it8('e4', '타설', V8.pour, { fixed: true, lib: 'v28.pour' })
      ], [0, 99, 1, 0, 0], ovUser, null);
      r.Z = Z; r.wd = r.zone; r.V = Q.Vw + Q.Vcs + Q.Vc + Q.Vs; r.leadItems = lead; r.lead = lead[0].wd + lead[1].wd;
      return r;
    }
    /* v2.8 소요 작업조 (참고값, 계산에는 안 씀) = ⌈Zone ÷ (사슬 ÷ (사슬 − 최대 공종))⌉ */
    function need8(N, c) { var z = c.zone28 != null ? c.zone28 : c.zone; return z > c.maxWD + 1e-9 ? Math.max(1, RU(N / (z / (z - c.maxWD)))) : 1; }
    function lk8(h) { var lf = h >= FR.split ? 1 + Math.floor(h / FR.split) : 1; return { lf: lf, lk: 1 - FR.vShare + FR.vShare * lf, hf: hfac(h / lf) }; }

    /* ── 지하골조 */
    var frameStart, V_END = null, ovApplied = 0, tdOff = Math.max(0, num(A.tdOffset, L.td.startOffsetM));
    if (seq === 'BU' && nB > 0) {
      var liftH2 = (sup === 'ANCHOR' || sup === 'RAKER') ? L.base.liftAnchor : L.base.liftOther, rows = [], wsum = 0;
      if (partial) {
        var endWD = Math.max(fEndWD, bPath.end), extra = endWD - fEndWD;
        base = { partial: true, rows: [], wd: extra, path: bPath };
        var bWho = nB > 1 ? '지하 ' + nB + '개층' : 'B1';
        if (extra > 0.01) { var bm = MO(extra, rRC); act({ id: 'base', g: '골조', name: '지하골조 (' + bWho + ' 외벽' + (open ? ' · 방수 · 되메우기' : '') + ' · ' + (nB > 1 ? '지하 바닥 ~ 1F' : '1F 바닥') + ')', s: t, e: t + bm, cp: true, wd: extra, rate: 'rc', basis: '지하부 Zone 완료 후 외벽 ' + r1(bPath.walls) + 'WD' + (open ? ' + 방수·되메우기 ' + r1(bPath.backfillExt) + 'WD (토목, 골조 ' + r1(bPath.backfill) + 'WD 환산)' : '') + ' + 바닥 ' + nB + '개층 × ' + r1(bPath.slabPer) + 'WD (기초와 병행분 제외)' }); t += bm; }
        else R.notes.push('지하부 외벽 · 바닥은 기초 Zone 진행 중 병행 완료 (C.P 영향 없음)');
      } else {
        /* 층 안 외벽 → 바닥 겹침 (adv.bOv = { B2 : WD, … }, 0 ≤ 겹침 ≤ 외벽 일수) → 층 WD = max(외벽, 바닥, 외벽 + 바닥 − 겹침). 없으면 외벽 + 바닥 */
        var bOv = A.bOv && typeof A.bOv === 'object' ? A.bOv : null;
        /* v2.8 지하 바닥 (adv.bChain 'ON' 일 때만 — 기본 (AUTO · 빈 값 · OFF) = 옛 식 : 면적 900㎡ Zone × 3.25 WD 순환. 사례 B 지하골조 실적 3.8개월 : 옛 식 4.11 · v2.8 사슬 4.91 로 멀어져 기본에서 뺌)
           켜면 : 지하 물량 (기둥 1.44 · 보 0.84 · 슬래브 0.15) 의 c4 공종 사슬, Zone = 체적 ÷ 300㎥,
           팀 = adv.bTeams 또는 ⌈Zone ÷ 4⌉, 층 바닥 WD = max(사슬 × 2회 타설 계수 × 층고 보정, 팀당 Zone × 하루 1 Zone) — 지상과 같은 Zone 연속, 팀 안 Zone 간격 (nt − 1) 은 1F 바닥에서 1회
           외벽 : 둘레 Zone = ⌈흙막이 둘레 ÷ 40m⌉ (v2.8 합벽), 외벽팀 = adv.wTeams 또는 ⌈Zone ÷ 4⌉ → 지금 외벽 식 × ⌈Zone ÷ 팀⌉ ÷ 4 (Zone 4개를 1팀이 맡는 지금 실적 보정값 기준으로 팀 수만 상대 반영 — 가정) */
        var bCh = A.bChain === 'ON', bTin = num(A.bTeams, 0) > 0 ? Math.round(num(A.bTeams, 0)) : 0, wTin = num(A.wTeams, 0) > 0 ? Math.round(num(A.wTeams, 0)) : 0;
        /* 지하 바닥팀 (adv.bTeams) = 1F 바닥 (B1 층 바닥 · 화면 지하 판에 보이는 층) 팀 수 — 다른 층은 자동값 (⌈Zone ÷ 4⌉) 에 같은 비율 (지상 uTeams 와 같은 규칙) */
        /* 물량 · Zone 은 지하 기준 층고 (v28.hQB 3.5m, v2.8 지하 고정) 로 — 층별 층고는 2회 타설 계수 · 층고 보정으로만 (층고를 올려도 Zone 이 늘어 사슬이 짧아지지 않게)
           Zone 수 입력 = adv.zN 'Bk:N' (Bk 층 행 = Bk 외벽 + 그 위 바닥). 옛 zSpec 은 순타 지하에 쓰지 않음 (옛 엔진과 같음) */
        var bQ = function (k) { var Ak = k === 1 ? Math.max(AdnEff, bldg) : AdnEff, Ack = coreAin ? Math.min(coreAin, Ak * 0.6) : Math.min(Atyp * coreRb, Ak * 0.6), Q = q28(Ak, Ack, V8.hQB, true, 0), sp = ZN.b[k] != null ? ZN.b[k] : ZN.b['*'];
          return { A: Ak, Q: Q, N: sp != null ? Math.max(1, Math.round(sp)) : Math.max(1, RU(Q.V / (V8.pourV * V8.pump))), zIn: sp != null }; };
        var bK = bCh && bTin ? bTin / Math.max(1, cl(bQ(1).N / V8.zpt)) : 1;
        /* 외벽팀 : 자동 Tw0 = ⌈Zw ÷ 4⌉ → 외벽 = 지금 실적값 그대로 (wK 1). 입력 Tw 만 자동 대비 상대 반영 wK = ⌈Zw/Tw⌉ ÷ ⌈Zw/Tw0⌉ (uTeams · bTeams 와 같은 비율 규칙), 하한 v28.wKmin (가정) */
        var Zw = Math.max(1, cl(P / V8.wallZ)), Tw0 = clamp(cl(Zw / V8.wzpt), 1, Zw), Tw = wTin ? clamp(wTin, 1, Zw) : Tw0;
        var wK = bCh && wTin ? Math.max(V8.wKmin, cl(Zw / Tw) / Math.max(1, cl(Zw / Tw0))) : 1, bLast = null;
        for (k = nB; k >= 1; k--) {
          var h = hB[k - 1], lifts = Math.ceil(h / liftH2 - 1e-9), Vw0 = h * liftWD / L.base.liftRef, Vw = Vw0 * wK;
          var Aslab = k === 1 ? Math.max(AdnEff, bldg) : AdnEff, rw;
          if (bCh) {
            var bq = bQ(k), Qb = bq.Q, Nb = bq.N, Tb0 = Math.max(1, cl(Nb / V8.zpt));
            var cb = c4(Qb, Nb, A.bcOv, false), kb = lk8(h), zB = cb.zone * kb.lk * kb.hf, Tb = bTin ? clamp(Math.round(Tb0 * bK), 1, Nb) : Tb0, ntB = cl(Nb / Tb), Sw = Math.max(zB, ntB * V8.takt);
            rw = { lv: 'B' + k, h: h, lifts: lifts, Vw: Vw, Vw0: Vw0, Z: Nb, T: Tb, Sw: Sw, slab: k === 1 ? '1F' : 'B' + (k - 1), wd: Vw + Sw,
              model: 'v28', N: Nb, nt: ntB, takt: V8.takt, zone: cb.zone, zoneF: zB, chain: cb.zone, pl: kb.lf, lk: kb.lk, hf: kb.hf, items: cb.items, need: need8(Nb, cb), zIn: bq.zIn, tIn: !!bTin,
              lb: { v: ntB * V8.takt, on: ntB * V8.takt > zB + 1e-9, k: 'takt' }, Zw: Zw, Tw: Tw, Tw0: Tw0, wK: wK, wIn: !!wTin, q: qSum(Qb), zone28: cb.zone28, tail: 0 };
          } else {
            var Zs = Math.max(1, Math.round(Aslab / bZoneA)), Ts = Math.ceil(Zs / zpt - 1e-9), Sw0 = Math.max(minSlab, Math.ceil(Zs / Ts - 1e-9) * slabDB);
            rw = { lv: 'B' + k, h: h, lifts: lifts, Vw: Vw, Vw0: Vw0, Z: Zs, T: Ts, Sw: Sw0, slab: k === 1 ? '1F' : 'B' + (k - 1), wd: Vw + Sw0, model: 'old', N: Zs, nt: Math.ceil(Zs / Ts - 1e-9) };
          }
          var ovB = bOv ? clamp(num(bOv['B' + k], 0), 0, Vw) : 0;
          if (ovB > 0) { rw.ov = ovB; rw.wd = Math.max(Vw, rw.Sw, Vw + rw.Sw - ovB); }
          rows.push(rw); bLast = rw;
        }
        /* Zone 연속 꼬리 : 1F 바닥의 마지막 Zone = 착수 + 사슬 + (nt − 1) → 층간을 넘는 만큼만 1회 */
        if (bCh && bLast) { bLast.tail = Math.max(0, bLast.zoneF + (bLast.nt - 1) * V8.takt - bLast.Sw); bLast.wd += bLast.tail; }
        rows.forEach(function (x) { wsum += x.wd; });
        base = { partial: false, rows: rows, wd: wsum, liftH: liftH2, model: bCh ? 'v28' : 'old', Zw: bCh ? Zw : null, Tw: bCh ? Tw : null, Tw0: bCh ? Tw0 : null, wK: wK, wIn: bCh && !!wTin, tail: bCh && bLast ? bLast.tail : 0 };
        var bm2 = MO(wsum, rRC), bR0 = rows[rows.length - 1];
        act({ id: 'base', g: '골조', name: '지하골조 (B' + nB + ' ~ 1F 바닥)', s: t, e: t + bm2, cp: true, wd: wsum, rate: 'rc',
          basis: bCh ? '층별 외벽 ' + r2(liftWD / L.base.liftRef) + 'WD/m' + (wTin ? ' × 외벽팀 ' + r2(wK) + ' (⌈' + Zw + ' Zone ÷ ' + Tw + '팀⌉ ÷ ⌈' + Zw + ' ÷ 자동 ' + Tw0 + '팀⌉' + (wK <= V8.wKmin + 1e-9 ? ' · 하한 ' + V8.wKmin : '') + ')' : '') + ' (Lift ' + liftH2 + 'm 끊어치기) + 바닥 공종 사슬 (' + bR0.slab + ' ' + bR0.N + ' Zone · ' + bR0.T + '팀 · Zone 1개 ' + r1(bR0.zone) + 'WD · Zone 연속)' + (base.tail > 0.005 ? ' + 1F 바닥 Zone 간격 ' + r1(base.tail) + 'WD' : '')
            : '층별 수직재 ' + r2(liftWD / L.base.liftRef) + 'WD/m (Lift ' + liftH2 + 'm 끊어치기) + 바닥 Zone 순환 (' + r2(slabDB) + 'WD/Zone)' });
        t += bm2;
      }
      frameStart = t;
      if (inp.link) { ovApplied = Math.min(0.2 * (t - F0), MO(20, rRC)); frameStart = t - ovApplied; }
    } else if (seq === 'BU') { frameStart = t; }
    else {
      /* 코어 벽체 : adv.coreWallK = 코어 벽 길이 ÷ 기본 코어 1개 벽 길이 (화면이 코어 개수 · 크기에서 계산). 수직재 일의 coreShare 만큼이 코어 벽 → 그 몫만 비례 */
      var cwK = num(A.coreWallK, 0) > 0 ? num(A.coreWallK, 0) : 1, cwF = 1 - (L.td.coreShare || 0) + (L.td.coreShare || 0) * cwK;
      var nPost = Math.ceil(tdSt.length / 2), vwd = (L.td.vertFirst + L.td.vertNext * (nPost - 1)) * cwF / hF;
      V_END = T_F + MO(vwd, rRC);
      act({ id: 'vert', g: '골조', name: '지하 수직재 (' + tdSt[tdSt.length - 1].lv + ' ~ ' + tdSt[tdSt.length - nPost].lv + ', 기초 완료 후)', s: T_F, e: V_END, cp: false, wd: vwd, rate: 'rc', basis: '최하층 ' + L.td.vertFirst + 'WD + ' + L.td.vertNext + 'WD × ' + (nPost - 1) + '개층' + (Math.abs(cwF - 1) > 0.005 ? ' × 코어 벽 ' + r2(cwF) : '') + ' · 지상 2차 구조제한 해제 조건' });
      base = { td: true, nPost: nPost, wd: vwd, n1: n1, T: tdT, m: m1z, tIn: num(A.tdTeams, 0) > 0 };
      frameStart = T_1F + tdOff;
    }
    R.base = base;
    var baseEnd = t;   /* 순타 : 지하골조 (또는 기초) 완료 · 역타 : 기초 완료 (T_F) */

    /* ── 지상골조 */
    if (ZS.err.length) R.warn.push('바닥 Zone 수 입력을 읽지 못한 항목 : ' + ZS.err.join(', '));
    var sysC = inp.coreSys && inp.coreSys !== 'AUTO' && FR.core[inp.coreSys] ? inp.coreSys : (nUp >= 15 ? 'ACS' : 'GANG');
    var hasCore = struct === 'SC' || struct === 'COMP';   /* 철골 · 강합성 (코어 · 바닥 두 사슬이 실제로 있는지는 corePath) */
    /* DC 층 사이클 (순타 · 용도 데이터센터 기본, 상세 조정 'DC 층 사이클' 로 켜고 끔) */
    var DCL = L.dc, steelF = hasCore;
    var dcMode = A.dcCycle === 'ON' || A.dcCycle === 'OFF' ? A.dcCycle : 'AUTO';
    var dcOn = seq === 'BU' && (dcMode === 'ON' || (dcMode === 'AUTO' && use === 'dc'));
    var frMode = A.frChain === 'ON' || A.frChain === 'OFF' ? A.frChain : 'AUTO', walled = use === 'residential' || use === 'mixed';
    /* ── 타설 순서 (adv.pourSeq = AUTO · SIM 동시타설 · PRE 코어선행 · POST 코어후행) — 건물 규모 · 골조 형식으로 자동 선택, 사용자가 다른 순서를 고르면 그 경로로 계산
       자동 (기준 = LIB.seq, 가정) : RC · SRC 지상 rcPreF (30) 층 이상 → 코어선행, 그 밖 → 동시타설 · 공동주택 · 주상복합 (벽식 RC) → 동시타설만 · 철골 · 강합성 지상 stPostF (10) 층 이하 → 코어후행, 그 밖 → 코어선행
       DC 층 사이클 = 외주부 · 코어 분리 타설 (선택 대상 아님) · adv.frChain 'OFF' (옛 식 복원) = RC · SRC 일체 (동시) · 철골 · 강합성 코어선행 고정 */
    var SQ = seqOf(L.seq);
    var pSel = A.pourSeq === 'SIM' || A.pourSeq === 'PRE' || A.pourSeq === 'POST' ? A.pourSeq : 'AUTO', wallRC = walled && !steelF, legacy = frMode === 'OFF';
    var sNm = struct === 'SC' ? '철골' : struct === 'COMP' ? '강합성' : struct, pAuto, pWhy;
    if (dcOn) { pAuto = 'DC'; pWhy = '데이터센터 DC 층 사이클 → 외주부 · 코어 분리 타설 (타설 순서 선택 대상 아님)'; }
    else if (legacy) { pAuto = steelF ? 'PRE' : 'SIM'; pWhy = '옛 식 (상세 조정 frChain OFF) → ' + (steelF ? sNm + ' 코어선행 (옛 경로)' : sNm + ' 일체 타설 (옛 경로)'); }
    else if (wallRC) { pAuto = 'SIM'; pWhy = U.name + ' (벽식 ' + sNm + ') → 동시타설 (벽 · 슬래브 일체 타설)'; }
    else if (!steelF) { pAuto = nUp >= SQ.rcPreF ? 'PRE' : 'SIM'; pWhy = sNm + ' · ' + nUp + '층 (' + SQ.rcPreF + '층 ' + (nUp >= SQ.rcPreF ? '이상 고층' : '미만') + ') → ' + (pAuto === 'PRE' ? '코어선행 (코어 시스템폼 ' + (sysC === 'ACS' ? 'ACS' : '갱폼') + ' 가 먼저 오르고 바닥이 n+' + SQ.rcLag + '층 뒤를 따라감)' : '동시타설 (코어 · 바닥 한 번에 타설, v2.8 RC 기본)'); }
    else { pAuto = nUp <= SQ.stPostF ? 'POST' : 'PRE'; pWhy = sNm + ' · ' + nUp + '층 (' + SQ.stPostF + '층 ' + (nUp <= SQ.stPostF ? '이하 저층' : '초과') + ') → ' + (pAuto === 'POST' ? '코어후행 (철골 · DECK 바닥이 먼저, 코어는 따라 타설)' : '코어선행 (' + (sysC === 'ACS' ? 'ACS' : '갱폼') + ' 코어가 먼저 오르고 ' + sNm + ' 바닥이 따라감, v2.8 철골 기본)'); }
    var seqU = dcOn ? 'DC' : (legacy || wallRC ? pAuto : (pSel === 'AUTO' ? pAuto : pSel));
    if (pSel !== 'AUTO' && pSel !== seqU) {
      if (dcOn) R.notes.push('DC 층 사이클은 외주부 · 코어 분리 타설 — 타설 순서 선택 (' + POUR_N[pSel] + ') 은 쓰지 않았습니다');
      else if (legacy) R.notes.push('상세 조정 frChain OFF (옛 식) — 타설 순서 선택 (' + POUR_N[pSel] + ') 대신 옛 경로 (' + POUR_N[seqU] + ') 로 계산했습니다');
      else if (wallRC) R.warn.push(U.name + ' (벽식) 은 벽 · 슬래브 일체 타설 → 동시타설로 계산했습니다 (' + POUR_N[pSel] + ' 선택은 쓰지 않음)');
    }
    var corePath = seqU === 'PRE';   /* 코어 · 바닥 두 사슬 (코어 선행 체인 + 바닥 체인) */
    if (corePath && sysC === 'ACS' && nUp < 10) R.warn.push('ACS는 고층 코어 (15층 이상) 에 적합합니다 → 지상 ' + nUp + '층은 갱폼 · 알폼 검토');
    var dS = (FR.d[struct] + (inp.pt ? FR.ptAdd : 0)) / hF, dC = FR.core[sysC] / hF, minT = FR.minTact[struct] / hF, acsSet = FR.acsSetup / hF;
    /* 바닥 Zone : 층별 Zone 입력 → 없으면 (기준층 면적, 지하층은 지하 면적) ÷ 900㎡ */
    /* 지상 형틀팀 수 (adv.uTeams) = 기준층 팀 수. 다른 층은 자동 규칙 (Zone ÷ 팀당 Zone) 에 같은 비율 (입력 ÷ 기준층 자동값) 을 곱한다
       → 입력이 기준층 자동값과 같으면 모든 층이 입력 없을 때와 똑같다 */
    var typN0 = Math.min(nUp, Math.max(2, Math.floor(nUp / 2))), uTin = num(A.uTeams, 0) > 0 ? Math.round(num(A.uTeams, 0)) : 0;
    /* 코어 바닥면적 (adv.coreA) : 있으면 코어 Zone = 코어 면적 ÷ 코어 Zone 면적, 바닥 Zone = 나머지 면적 기준 (없으면 비율 · 바닥 몫 기본값) */
    var slabK = coreAin ? Math.max(0.4, 1 - coreAin / Atyp) : FR.core.slabShare;
    function zOf(n, area) {
      var spec = n >= 1 ? ZS.up[n] : ZS.b[1 - n], Au = area != null && area > 0 ? area : Atyp;
      return spec != null ? Math.max(1, Math.round(spec)) : Math.max(1, Math.round(Au * (hasCore ? slabK : 1) / FR.zoneA));
    }
    function teamsAuto(Zx) { return Math.ceil(Zx / FR.zonesPerTeam[struct] - 1e-9); }
    var uK = uTin ? uTin / teamsAuto(zOf(typN0)) : 1;
    /* 일반 지상 RC · SRC 동시타설 바닥 (DC 아님) = v2.8 c4 '동시 RC' 공종 사슬 + Zone 연속 (adv.frChain : AUTO = 공동주택 · 주상복합 (벽식) 제외하고 켬 · ON · OFF = 옛 식)
       Zone N = 층 체적 ÷ (300㎥ × 펌프) (Zone 수 입력 zN 이 있으면 그 값), 층간 = Zone 1개 사슬 × 2회 타설 계수 × 층고 보정 — 팀 수는 층간을 나누지 않음
       팀 T = adv.uTeams (기준층, 다른 층은 같은 비율) 또는 ⌈N ÷ 4⌉, 팀당 nt = ⌈N ÷ T⌉ Zone 을 하루 1 Zone 씩 → 층간 ≥ nt × 1일 (팀이 너무 적을 때 하한 — v2.8 에 없는 우리 규칙)
       Zone 연속 (adv.rcFlow ≠ 'FLOOR') : 팀 안 Zone 간격은 맨 위층 꼬리 (nt − 1) 1회 · 층 완결 ('FLOOR') : 층마다 + (nt − 1) */
    var v28On = !steelF && seqU === 'SIM' && (frMode === 'ON' || (frMode === 'AUTO' && !walled)), rcFlowZ = A.rcFlow !== 'FLOOR', uK8 = null;
    /* 철골 · 강합성 코어선행 옛 경로 (+ RC 코어선행 코어) 의 v2.8 하한 (코어 c1 · 바닥 c3) : v28.lbSC 1 일 때만 (기본 0 = 끔) · frChain OFF 면 늘 끔 */
    var lbOn = !legacy && V8.lbSC > 0;
    /* 물량 · Zone 은 기준 층고 하나 (지상 v28.hQ 4.5m · 지하 hQB 3.5m — v2.8 은 건물 전체를 기준층 층고 하나로 계산) → 층별 층고는 lk × hfac 로만 (층고를 올렸는데 Zone 이 늘어 사이클이 줄지 않게)
       Zone 수 입력 = adv.zN (옛 zSpec 은 면적 900㎡ Zone 이라 이 경로에서 쓰지 않음) */
    function c4Floor(n, h, area, bsm) {
      var Au = area != null && area > 0 ? area : Atyp, Ac = coreAin ? Math.min(coreAin, Au * 0.6) : Math.min((bsm ? Atyp : Au) * V8.coreR, Au * 0.6);
      var Q = q28(Au, Ac, bsm ? V8.hQB : V8.hQ, bsm, bsm ? 0 : colN8), spec = n >= 1 ? ZN.up[n] : (ZN.b[1 - n] != null ? ZN.b[1 - n] : ZN.b['*']);
      var N = spec != null ? Math.max(1, Math.round(spec)) : Math.max(1, RU(Q.V / (V8.pourV * V8.pump))), c = c4(Q, N, A.rcOv, !bsm);
      c.N = N; c.Q = Q; c.zIn = spec != null; c.need = need8(N, c);
      return c;
    }
    function uK28() { if (uK8 == null) { uK8 = 1; uK8 = uTin / Math.max(1, cl(c4Floor(typN0, hUp[typN0 - 1]).N / V8.zpt)); } return uK8; }
    /* 코어 형틀팀 수 (adv.cTeams) : 코어 Zone 수는 층마다 같으므로 입력이 있으면 그 값 (1 ~ Zone 수) */
    var cTin = num(A.cTeams, 0) > 0 ? Math.round(num(A.cTeams, 0)) : 0;
    /* ── 타설 순서별 새 경로 (v2.8 cycleFor) : 동시 철골 c5 · RC 코어선행 바닥 c2 · 코어후행 = max(코어 c1, 외주부 c2 | c3) — 모두 Zone 연속 · 팀 규칙 (c4 경로와 같음)
       층 물량 = c4Floor 와 같은 규칙 (기준 층고 hQ · hQB, 코어 = adv.coreA 또는 기준층 × coreRb (RC · SRC 0.23 · 철골 · 강합성 0.2)), Zone 수 입력 zN = 바닥 (코어후행은 외주부) Zone */
    var SOV = A.seqOv && typeof A.seqOv === 'object' ? A.seqOv : {};
    function ovU(ch) { return SOV[ch] && typeof SOV[ch] === 'object' ? SOV[ch] : null; }
    var ptS = inp.pt ? V8.ptX : 0;   /* PT 슬래브 (inp.pt) : c2 바닥 철근 · M&E 에 ptX 일 (c4 의 'PT 1일 항상' 은 v2.8 c4 만) */
    function qFl(n, area, bsm) {
      var Au = area != null && area > 0 ? area : Atyp, Ac = coreAin ? Math.min(coreAin, Au * 0.6) : Math.min((bsm ? Atyp : Au) * coreRb, Au * 0.6);
      var sp = n >= 1 ? ZN.up[n] : (ZN.b[1 - n] != null ? ZN.b[1 - n] : ZN.b['*']);
      return { Au: Au, Ac: Ac, Q: q28(Au, Ac, bsm ? V8.hQB : V8.hQ, !!bsm, bsm ? 0 : colN8), spec: sp != null ? Math.max(1, Math.round(sp)) : 0 };
    }
    /* 팀 : 자동 T0 = ⌈N ÷ 4⌉, 입력 (기준층 팀 수) 이 있으면 다른 층은 자동값 × (입력 ÷ 기준층 자동값) — uTeams · cTeams 와 같은 규칙. n0 = 기준층 Zone 수 (팀과 무관) */
    var tkR = {};
    function teamOf(id, N, tin, n0) {
      var T0 = Math.max(1, cl(N / V8.zpt));
      if (!tin) return { T0: T0, T: T0 };
      if (tkR[id] == null) { tkR[id] = 1; tkR[id] = tin / Math.max(1, cl(n0() / V8.zpt)); }
      return { T0: T0, T: clamp(Math.round(T0 * tkR[id]), 1, N) };
    }
    function n0c5() { var f = qFl(typN0); return c5(f.Q, f.spec).Z; }
    function n0c2() { var f = qFl(typN0); return c2(f.Q, f.spec).Z; }
    function n0P() { var f = qFl(typN0); return (steelF ? c3(f.Q, f.spec) : c2(f.Q, f.spec)).Z; }
    function n0C() { var f = qFl(typN0); return c1(f.Ac, V8.hQ, 1, false, null, num(A.coreZ, 0)).Z; }
    /* 사슬 하나 (동시 철골 c5 · RC 코어선행 바닥 c2) 의 층 : 층간 = max(Zone 1개 사슬 × lk × 층고 보정, 철골 · DECK 선행 lead (c5, Zone 1개 — v2.8 DC flowPz 처럼), 팀당 nt × 하루 1 Zone)
       층 완결 (rcFlow FLOOR) = max(사슬, lead) + (nt − 1). 꼬리 (Zone 연속) = 맨 위층 마지막 Zone 이 층간을 넘는 만큼 */
    function chFloor(c, f, h, tid, n0) {
      var N = c.Z, tq = teamOf(tid, N, uTin, n0), nt = cl(N / tq.T), kq = lk8(h), zw = c.zone * kq.lk * kq.hf, tk = V8.takt, ld = c.lead || 0, b0 = Math.max(zw, ld);
      var iv = rcFlowZ ? Math.max(b0, nt * tk) : b0 + (nt - 1) * tk, bind = rcFlowZ && nt * tk > b0 + 1e-9 ? 'takt' : (ld > zw + 1e-9 ? 'steel' : '');
      return { model: 'v28', ch: c.ch, ovKey: 'seqOv.' + c.ch, Z: N, N: N, T: tq.T, T0: tq.T0, per: nt, nt: nt, hf: kq.hf, lifts: kq.lf, lk: kq.lk, wd: iv, zone: c.zone, chain: c.zone, zoneF: zw, takt: tk, flow: rcFlowZ ? 'ZONE' : 'FLOOR',
        tail: rcFlowZ ? Math.max(0, zw + (nt - 1) * tk - iv) : 0, need: need8(N, c), zone28: c.zone28, items: c.items, maxWD: c.maxWD, zIn: !!f.spec, tIn: !!uTin, q: qSum(f.Q), Ac: f.Ac,
        lb: { v: nt * tk, on: bind === 'takt', k: 'takt' }, lead: ld, leadItems: c.leadItems || null, bind: bind };
    }
    function c5Floor(n, h, area, bsm) { var f = qFl(n, area, bsm), c = c5(f.Q, f.spec, ovU('c5')); c.ch = 'c5'; return chFloor(c, f, h, 'c5', n0c5); }
    function c2Floor(n, h, area, bsm) { var f = qFl(n, area, bsm), c = c2(f.Q, f.spec, ovU('c2'), bsm ? 0 : ptS); c.ch = 'c2'; return chFloor(c, f, h, 'c2', n0c2); }
    /* 코어후행 : 외주부 (RC · SRC = c2 · 철골 · 강합성 = c3) 와 코어 (c1, v2.8 순타 간격 = 직렬) 를 따로 → 층간 = 두 경로 중 긴 쪽 (각각 Zone 연속 · 팀 규칙)
       외주부 층고 = lk × 층고 보정 (c4 와 같음) · 코어 층고 = 수직재 회수 ⌈h ÷ 6⌉ × 층고 보정 (h ÷ 회수) — 코어선행 코어 (coreT) 와 같은 규칙. 코어 Zone = ⌈코어 체적 ÷ 230⌉ (adv.coreZ 가 있으면 그 값) */
    function postFloor(n, h, area, bsm) {
      var f = qFl(n, area, bsm), Q = f.Q, tk = V8.takt, kq = lk8(h);
      var cP = steelF ? c3(Q, f.spec, ovU('c3')) : c2(Q, f.spec, ovU('c2'), bsm ? 0 : ptS); cP.ch = steelF ? 'c3' : 'c2';
      var lifts = Math.max(1, Math.ceil(h / FR.core.liftMax - 1e-9)), hfC = hfac(h / lifts), cC = c1(f.Ac, bsm ? V8.hQB : V8.hQ, 1, false, ovU('c1'), num(A.coreZ, 0)); cC.ch = 'c1';
      function path(name, c, tq, zf, ext) {
        var nt = cl(c.Z / tq.T), iv = rcFlowZ ? Math.max(zf, nt * tk) : zf + (nt - 1) * tk, o = { name: name, ch: c.ch, ovKey: 'seqOv.' + c.ch, N: c.Z, T: tq.T, T0: tq.T0, nt: nt, V: c.V, items: c.items,
          zone: c.zone, zone28: c.zone28, zoneF: zf, maxWD: c.maxWD, gap: nt - 1, cyc: zf + (nt - 1) * tk, int: iv, need: need8(c.Z, c),
          ov: c.items.map(function (x) { return x.ov; }), ss: c.items.map(function (x) { return x.s; }), lb: { v: nt * tk, on: rcFlowZ && nt * tk > zf + 1e-9, k: 'takt' } };
        Object.keys(ext).forEach(function (k) { o[k] = ext[k]; });
        return o;
      }
      var P = path('외주부', cP, teamOf('pP', cP.Z, uTin, n0P), cP.zone * kq.lk * kq.hf, { lk: kq.lk, hf: kq.hf, lifts: kq.lf, tIn: !!uTin, zIn: !!f.spec, q: qSum(Q) });
      var C = path('코어', cC, teamOf('pC', cC.Z, cTin, n0C), cC.zone * lifts * hfC, { lifts: lifts, hf: hfC, tIn: !!cTin, zIn: num(A.coreZ, 0) > 0, Ac: f.Ac });
      var gv = P.int >= C.int - 1e-9 ? P : C, iv = Math.max(P.int, C.int);
      return { model: 'post', ch: P.ch + '+c1', Z: P.N, N: P.N, T: P.T, T0: P.T0, per: P.nt, nt: P.nt, hf: kq.hf, lifts: kq.lf, lk: kq.lk, wd: iv, takt: tk, flow: rcFlowZ ? 'ZONE' : 'FLOOR',
        tail: rcFlowZ ? Math.max(0, Math.max(P.zoneF + P.gap * tk, C.zoneF + C.gap * tk) - iv) : 0, zIn: !!f.spec, tIn: !!uTin, P: P, C: C, gov: gv.name, Au: f.Au, Ac: f.Ac };
    }
    function slabT(n, h, area, bsm) {
      if (seqU === 'POST') return postFloor(n, h, area, bsm);
      if (seqU === 'SIM' && steelF) return c5Floor(n, h, area, bsm);
      if (seqU === 'PRE' && !steelF) return c2Floor(n, h, area, bsm);
      if (v28On) {
        var c = c4Floor(n, h, area, bsm), N = c.N, T0 = Math.max(1, cl(N / V8.zpt)), Tq = uTin ? clamp(Math.round(T0 * uK28()), 1, N) : T0, nt = cl(N / Tq);
        var kq = lk8(h), zw = c.zone * kq.lk * kq.hf, tk = V8.takt, iv = rcFlowZ ? Math.max(zw, nt * tk) : zw + (nt - 1) * tk;
        return { model: 'v28', ch: 'c4', ovKey: 'rcOv', Z: N, N: N, T: Tq, per: nt, nt: nt, hf: kq.hf, lifts: kq.lf, lk: kq.lk, wd: iv, zone: c.zone, chain: c.zone, zoneF: zw, takt: tk, flow: rcFlowZ ? 'ZONE' : 'FLOOR',
          tail: rcFlowZ ? Math.max(0, zw + (nt - 1) * tk - iv) : 0, need: c.need, zone28: c.zone28, T0: T0, items: c.items, maxWD: c.maxWD, zIn: c.zIn, tIn: !!uTin, q: qSum(c.Q),
          lb: { v: nt * tk, on: rcFlowZ && nt * tk > zw + 1e-9, k: 'takt' }, lead: 0, bind: rcFlowZ && nt * tk > zw + 1e-9 ? 'takt' : '' };
      }
      var Zx = zOf(n, area);
      var Tx = uTin ? clamp(Math.round(teamsAuto(Zx) * uK), 1, Zx) : teamsAuto(Zx), per = Math.ceil(Zx / Tx - 1e-9);
      if (hasCore) {
        var o = { model: 'old', Z: Zx, T: Tx, per: per, hf: hfac(h), lifts: 0, wd: Math.max(minT, per * dS * hfac(h)) };
        /* 철골 · 강합성 바닥 하한 (v2.8 c3 외주 철골 사슬 — v2.8 철골 기본은 '코어 선행' 이라 층 사이클은 c1 만 → c3 하한은 v2.8 동작이 아니라 해석) — v28.lbSC 1 일 때만 */
        if (!dcOn && lbOn) {
          /* 물량은 기준 층고 (v28.hQ) — 층고가 올라도 하한이 줄지 않게. 코어 면적 자동값은 이 경로의 코어 (frame.core.ratio 0.2, 화면 코어 그림과 같음) 를 그대로 */
          var Au3 = area != null && area > 0 ? area : Atyp, Ac3 = coreAin ? Math.min(coreAin, Au3 * 0.6) : Au3 * FR.core.ratio, g3 = c3(q28(Au3, Ac3, V8.hQ, false, colN8));
          o.wd0 = o.wd; o.lb = { v: g3.wd, on: g3.wd > o.wd + 1e-9, k: 'c3', src: '해석', Z: g3.Z, items: g3.items, zone: g3.zone };
          if (o.lb.on) o.wd = g3.wd;
        }
        return o;
      }
      var lf = h >= FR.split ? 1 + Math.floor(h / FR.split) : 1, lk = 1 - FR.vShare + FR.vShare * lf, hf1 = hfac(h / lf);
      return { model: 'old', Z: Zx, T: Tx, per: per, hf: hf1, lifts: lf, lk: lk, wd: Math.max(minT, per * dS * lk * hf1) };
    }
    /* 코어선행 코어 (옛 식 : 팀당 Zone × ACS 4 · 갱폼 6 WD/Zone × 수직재 회수 × 층고 보정) — 철골 · 강합성 (사례 A 보정) 과 RC · SRC 코어선행 공통.
       코어 Zone = (adv.coreA 또는 기준층 × coreRb (철골 · 강합성 0.2 · RC · SRC 0.23)) ÷ 300㎡ */
    function coreT(h) {
      var cAu = coreAin || Atyp * coreRb;
      var Zc = num(A.coreZ, 0) > 0 ? Math.max(1, Math.round(num(A.coreZ, 0))) : Math.max(coreAin ? 1 : 2, Math.round(cAu / FR.core.zoneA));
      var Tc = cTin ? clamp(cTin, 1, Zc) : Math.ceil(Zc / FR.core.perTeam - 1e-9), per = Math.ceil(Zc / Tc - 1e-9), lifts = Math.max(1, Math.ceil(h / FR.core.liftMax - 1e-9)), hl = h / lifts;
      var o = { model: 'old', Z: Zc, T: Tc, per: per, lifts: lifts, hf: hfac(hl), wd: lifts * per * dC * hfac(hl), Ac: r1(cAu) };
      /* 코어 하한 = v2.8 c1 사슬 (기준 층고 v28.hQ 1개층분, Zc = ⌈코어 체적 ÷ 230⌉) × 수직재 회수 — 필요 이상 팀은 효과 없게. v28.lbSC 1 일 때만 (기본 끔)
         층고는 회수로만 (v2.8 dcGuard 처럼 '일반 사이클 × 회수') → 층고를 올려도 하한이 줄지 않음. 코어 면적 자동값 = 이 경로의 코어와 같음 */
      if (!dcOn && lbOn) {
        var g1 = c1(cAu, V8.hQ, 1, seq === 'TD'), v1 = g1.zone * lifts;
        o.wd0 = o.wd; o.lb = { v: v1, on: v1 > o.wd + 1e-9, k: 'c1', src: 'v2.8', Z: g1.Z, items: g1.items, zone: g1.zone, lifts: lifts };
        if (o.lb.on) o.wd = v1;
      }
      return o;
    }
    /* DC 층 사이클 :
       외주부 (기둥 · 보 · 슬라브) 와 코어 (벽체 · 코어 바닥) 를 따로 타설 → 층간 = 두 경로 중 긴 쪽의 Zone 1개 작업 합계
       Zone = 체적 ÷ 일 타설량 (바닥 Zone 수 입력이 있으면 외주부 Zone 으로), 팀 = Zone 4개당 1팀, 팀 안 Zone 간격 (하루 1 Zone) 은 맨 위층에서 1회 */
    var dcFlow = A.dcFlow !== 'FLOOR', dcKv = null;
    /* DC 외주부 팀 비율 = 입력 ÷ 기준층 외주부 자동 팀 수 (기준층 Zone 수는 팀 수와 무관하므로 한 번 계산해 둔다) */
    function dcK() {
      if (dcKv == null) { dcKv = 1; var t0 = dcFloor(typN0, hUp[typN0 - 1], Atyp); dcKv = uTin / Math.ceil(t0.P.N / L.dc.zpt - 1e-9); }
      return dcKv;
    }
    var dcKcv = null;
    function dcKc() {
      if (dcKcv == null) { dcKcv = 1; var t0 = dcFloor(typN0, hUp[typN0 - 1], Atyp); dcKcv = cTin / Math.ceil(t0.C.N / L.dc.zpt - 1e-9); }
      return dcKcv;
    }
    function dcFloor(n, h, Au) {
      var Ac = num(A.coreA, 0) > 0 ? Math.min(num(A.coreA, 0), Au * 0.6) : Au * FR.core.ratio;
      var sL = num(A.spanL, 0) > 0 ? num(A.spanL, 0) : DCL.spanL, sS = num(A.spanS, 0) > 0 ? num(A.spanS, 0) : DCL.spanS;
      function grid(a) { return a > 0 ? Math.ceil(Math.sqrt(a) / sL + 1) * Math.ceil(Math.sqrt(a) / sS + 1) : 0; }
      var nCol = num(A.colN, 0) > 0 ? Math.round(num(A.colN, 0)) : Math.max(1, grid(Au) - grid(Ac)), nBm = Math.ceil(nCol * DCL.beamsPerCol);
      var tS = num(A.slabT, 0) > 0 ? num(A.slabT, 0) : DCL.slabT, nb3 = Math.ceil(nBm / 3);
      var Vcol = DCL.colA * nCol * h, Vbm = (nb3 * sS + (nBm - nb3) * sL) * DCL.beamA[steelF ? 'steel' : 'RC'] * 0.85, Vsl = Math.max(0, Au - Ac) * tS;
      var Vw = Ac * DCL.coreWall * h, Vcs = Ac * tS;
      var lifts = h >= DCL.split ? 1 + Math.floor(h / DCL.split) : 1;
      /* 수직재 철근 인원 : adv.dcCrewV (없으면 기초 철근팀 인원 adv.crew, 그것도 없으면 20명 — v2.8 은 20인 고정) */
      var crewV = num(A.dcCrewV, 0) > 0 ? num(A.dcCrewV, 0) : (num(A.crew, 0) > 0 ? num(A.crew, 0) : L.found.crew), crewH = num(A.dcCrewH, 0) > 0 ? num(A.dcCrewH, 0) : DCL.crewH;
      function rb(t, crew) { return Math.ceil(t / (DCL.tPerMD * crew * hF) - 1e-9); }
      var pourD = DCL.pour > 0 ? DCL.pour : 1;   /* 타설 WD (라이브러리 dc.pour, 없으면 1일) */
      function vert(R1, N, items) {
        for (var q = 1; q <= lifts; q++) {
          var tg = lifts > 1 ? ' ' + q + '/' + lifts + '차' : '';
          items.push(['양중' + tg, DCL.lift / hF], ['철근' + tg, rb(R1 / lifts / N, crewV)], ['형틀' + tg, DCL.form / hF], ['타설' + tg, pourD], ['해체' + tg, DCL.strip]);
        }
      }
      /* 외주부 */
      var zs = ZS.up[n], Np = zs != null ? Math.max(1, Math.round(zs)) : Math.max(1, Math.ceil((Vcol + Vbm + Vsl) / DCL.pourV - 1e-9));
      var Rh = (Vbm * DCL.rebCB + Vsl * DCL.rebSC) / Np, pIt = [], lead = 0;
      vert(Vcol * DCL.rebCB, Np, pIt);
      if (steelF) {
        lead = Math.ceil((nCol + nBm) / Np / (DCL.steelPc * hF) - 1e-9) + DCL.bolt / hF + Math.ceil(Math.max(0, Au - Ac) / Np / (DCL.deck * hF) - 1e-9);
        pIt.push(['비계 · 안전망', DCL.scaf / hF], ['슬래브 · 보 철근', rb(Rh, crewH)], ['M&E', DCL.me / hF], ['타설', pourD], ['양생', DCL.cure]);
      } else {
        var tbl = Math.ceil(nb3 * sS / 2.4) + Math.ceil((nBm - nb3) * sL / 2.4);
        pIt.push(['비계 · 동바리', DCL.scaf / hF], ['테이블폼', Math.ceil(tbl / Np / (DCL.table * hF) - 1e-9)], ['보 형틀', DCL.bform / hF], ['슬래브 · 보 철근', rb(Rh, crewH)], ['타설', pourD], ['양생 · 해체', DCL.cure]);
      }
      /* 코어 */
      var Nc = num(A.coreZ, 0) > 0 ? Math.max(1, Math.round(num(A.coreZ, 0))) : Math.max(1, Math.ceil((Vw + Vcs) / DCL.pourV - 1e-9)), cIt = [];
      vert(Vw * DCL.rebSC, Nc, cIt);
      cIt.push(['코어 슬래브 형틀', DCL.coreForm / hF], ['코어 슬래브 철근', rb(Vcs * DCL.rebSC / Nc, DCL.crewC)], ['타설', pourD], ['양생', DCL.cure]);
      /* 공종 사슬 겹침 (adv.dcOv = { P : { 키 : WD }, C : { … } } — 키 = 수직재 v0 ~ v4 (양중 · 철근 · 형틀 · 타설 · 해체, 회차마다 같은 값) · 이후 공종 a0, a1 …)
         공종 착수 = 앞 공종이 모두 끝나는 때 − 겹침 (0 ≤ 겹침 ≤ 바로 앞 공종 일수 — 짧은 공종을 앞당겨도 뒤 공종은 긴 공종 끝을 기다림)
         → Zone 1개 작업 = 가장 늦은 끝. 없으면 일수 합 그대로 */
      var dcOvIn = A.dcOv && typeof A.dcOv === 'object' ? A.dcOv : null;
      function st(name, N, items, V, k) {
        var T0 = Math.ceil(N / DCL.zpt - 1e-9), T = k && k !== 1 ? clamp(Math.round(T0 * k), 1, N) : T0, nt = Math.ceil(N / T - 1e-9), z = items.reduce(function (s, x) { return s + x[1]; }, 0);
        var lo = dcOvIn && dcOvIn[name === '외주부' ? 'P' : 'C'], ov = null, ss = null;
        if (lo && typeof lo === 'object') {
          var nv = lifts * 5, fr = 0, any = false; ov = []; ss = [];
          items.forEach(function (x, i) {
            var o = i > 0 ? clamp(num(lo[i < nv ? 'v' + (i % 5) : 'a' + (i - nv)], 0), 0, items[i - 1][1]) : 0, s0 = Math.max(0, fr - o);
            if (o > 0) any = true;
            ov.push(o); ss.push(s0); fr = Math.max(fr, s0 + x[1]);
          });
          if (any) z = fr; else { ov = null; ss = null; }
        }
        var o2 = { name: name, N: N, T: T, nt: nt, V: V, items: items, zone: z, gap: nt - 1, cyc: z + nt - 1 };
        if (ov) { o2.ov = ov; o2.ss = ss; }
        return o2;
      }
      var P = st('외주부', Np, pIt, Vcol + Vbm + Vsl, uTin ? dcK() : 1), C = st('코어', Nc, cIt, Vw + Vcs, cTin ? dcKc() : 1);
      /* 철골 경로 (v2.8) : 층 완결이면 외주부 사이클 ≥ 철골 · DECK 선행 + Zone 간격 (nt − 1) · Zone 연속이면 층간 ≥ 선행 (Zone 1개) — (nt − 1) 은 더하지 않음 */
      /* adv.frChain 'OFF' 면 이 두 규칙 (철골 선행 지배 · 분할 하한) 도 끔 → 옛 엔진 (cb81304) 결과 그대로 */
      var dc28 = frMode !== 'OFF';
      if (dc28 && !dcFlow && lead > 0 && lead + P.nt - 1 > P.cyc + 1e-9) { P.steel = lead + P.nt - 1 - P.cyc; P.cyc = lead + P.nt - 1; }
      var gov = (dcFlow ? P.zone >= C.zone : P.cyc >= C.cyc) ? P : C, wd0 = dcFlow ? gov.zone : gov.cyc, wd = wd0, bind = '';
      if (dc28 && dcFlow && lead > wd + 1e-9) { wd = lead; bind = 'steel'; }
      /* 분할 하한 (v2.8 dcGuard) : 수직재 2회 이상이면 층간 ≥ 일반 사이클 × 회수 — 일반 사이클 = 같은 면적 · 층고 hStd 4.5m (가정 — v2.8 은 DC 기준층 층고) 의 v2.8 일반 사슬 (코어 후행 : c1 · c2 (RC) | c3 (철골) 중 긴 쪽) */
      var guard = null;
      if (dc28 && lifts >= 2) {
        var Qg = q28(Au, Ac, V8.hStd, false, num(A.colN, 0) > 0 ? Math.round(num(A.colN, 0)) : 0), g1 = c1(Ac, V8.hStd, 1, false), g2 = steelF ? c3(Qg) : c2(Qg), c0 = Math.max(g1.wd, g2.wd);
        guard = { v: c0 * lifts, c0: c0, c1: g1.wd, c2: g2.wd, k: steelF ? 'c3' : 'c2', on: c0 * lifts > wd + 1e-9 };
        if (guard.on) { wd = c0 * lifts; bind = 'guard'; }
      }
      /* Zone 연속 꼬리 : 층간이 사슬보다 길어졌으면 (철골 선행 · 분할 하한) 마지막 Zone 이 층간을 넘는 만큼만 */
      var tail = dcFlow ? (bind ? Math.max(0, Math.max(P.zone + P.gap, C.zone + C.gap) - wd) : Math.max(P.gap, C.gap)) : 0;
      return { n: n, h: h, Au: Au, Ac: Ac, nCol: nCol, nBm: nBm, lifts: lifts, lead: lead, P: P, C: C, gov: gov.name, wd: wd, wd0: wd0, bind: bind, guard: guard, crewV: crewV, crewH: crewH, tail: tail, flow: dcFlow };
    }
    var lim = null, lim2 = null, limC = null, lim2C = null;
    if (seq === 'TD') {
      /* 모르면 : 기초 완료 전 지하 + 지상 25개층, 지하 수직재 완료 전 32개층 (사례 A 지하 8 + 지상 17 / 24) */
      lim = num(inp.lim, 0) > 0 ? Math.max(1, Math.round(num(inp.lim, 0))) : Math.max(1, L.td.limTot1 - nB);
      lim2 = num(inp.lim2, 0) > 0 ? Math.max(1, Math.round(num(inp.lim2, 0))) : Math.max(lim, L.td.limTot2 - nB);
      R.tags.lim = num(inp.lim, 0) > 0 ? '입력' : '기본';
      if (lim2 < lim) { R.warn.push('지하 수직재 전 허용층 (' + lim2 + 'F) 이 기초 전 허용층 (' + lim + 'F) 보다 낮습니다 → ' + lim + 'F로 맞춰 계산했습니다.'); lim2 = lim; }
      limC = lim + 3; lim2C = lim2 + 3;
    }
    /* 역타 기초 전 T/C 공용 할증 : 층 번호가 아니라 시점 기준 — 기초 완료 (T_F) 전에 하는 작업분만 × preF (걸치는 층은 비례 배분)
       → 착수가 늦을수록 종료도 늦어지는 단조 함수라 구조제한을 완화하면 공기가 늘지 않음 */
    function preOn(s0) { return seq === 'TD' && s0 < T_F - 1e-9; }
    function preFac(s0, dn) {
      var p = L.td.preF; if (!preOn(s0) || !(p > 1) || !(dn > 0)) return 1;
      if (s0 + dn * p <= T_F) return p;
      return 1 + (T_F - s0) * (1 - 1 / p) / dn;
    }
    var rcM = function (wd) { return MO(wd, rRC); };
    var floors = [], coreRows = [], slabRows = [], holdLog = [];
    /* 상향 골조 층 : 기준층부터 위로 (기준층이 지하층이면 그 지하층부터, 2F 이상이면 그 층부터) */
    var allLv = [];
    if (seq === 'TD' && off < 0) for (k = -off; k >= 1; k--) allLv.push({ lv: 'B' + k, n: 1 - k, h: hB[k - 1], ph: false, b: true });
    for (n = seq === 'TD' && off > 0 ? off + 1 : 1; n <= nUp; n++) allLv.push({ lv: n + 'F', n: n, h: hUp[n - 1], ph: false });
    for (k = 1; k <= nPH; k++) allLv.push({ lv: nPH > 1 ? '옥탑' + k : '옥탑', n: nUp + k, h: hPH[k - 1], ph: true });
    function holdT(n, isCore) {
      if (seq !== 'TD') return -Infinity;
      var L1 = isCore ? limC : lim, L2 = isCore ? lim2C : lim2, h = -Infinity;
      if (n > L1) h = Math.max(h, T_F); if (n > L2) h = Math.max(h, V_END); return h;
    }
    var frameEnd, gov = '', dcLast = null;
    if (dcOn) {
      /* DC : 층마다 체적 Zone 사이클 (층고 · Zone 입력 반영) · 첫 층 셋팅 / 최상층 · 옥탑 계수는 기존 기준 그대로 · 철골 1절 · 데크는 첫 절만 선행 1회 */
      var tt = frameStart, dc0 = dcFloor(1, hUp[0], Atyp);
      if (dc0.lead > 0) { tt += rcM(dc0.lead); R.notes.push('DC 층 사이클 : 철골 1절 · 데크 선행 ' + r1(dc0.lead) + 'WD (첫 절만, 이후 층은 하부층 RC 중 선행)'); }
      allLv.forEach(function (x, idx) {
        var c = dcFloor(Math.min(x.n, nUp), x.h, Atyp), f = 1, why = [];
        if (idx === 0) { var f0 = steelF ? FR.setFloor : FR.firstF; f *= f0; why.push((steelF ? '셋팅층' : '초기층') + ' × ' + f0); }
        if (x.ph) { f *= FR.roofF; why.push('옥탑 × ' + FR.roofF); }
        else if (nPH === 0 && x.n === nUp && nUp > 1) { f *= FR.roofF; why.push('최상층 × ' + FR.roofF); }
        var wd = c.wd * f, e0 = tt + rcM(wd);
        floors.push({ lv: x.lv, n: x.n, h: x.h, ph: x.ph, Z: c.P.N, T: c.P.T, per: c.P.nt, hf: 1, f: f, why: why.join(' · '), wd: wd, s: tt, e: e0, hold: 0, dc: c, model: 'dc',
          lb: c.bind ? { v: c.wd, on: true, k: c.bind === 'guard' ? 'guard' : 'steel' } : (c.guard ? { v: c.guard.v, on: false, k: 'guard' } : null),
          formula: '외주부 ' + c.P.N + ' Zone · ' + c.P.T + '팀 ' + r1(c.P.zone) + 'WD / 코어 ' + c.C.N + ' Zone ' + r1(c.C.zone) + 'WD' + (c.flow ? '' : ' (층 완결 · Zone 간격 포함)') + ' → ' + c.gov + (c.lifts > 1 ? ' · 수직재 ' + c.lifts + '회 분할' : '') +
            (c.bind === 'guard' ? ' · 분할 하한 ' + r1(c.guard.c0) + ' × ' + c.lifts + ' = ' + r1(c.wd) + 'WD' : c.bind === 'steel' ? ' · 철골 · DECK 선행 ' + r1(c.lead) + 'WD 지배' : '') + (f !== 1 ? ' × ' + r2(f) : '') });
        tt = e0; dcLast = c;
      });
      R.frameLead = dcLast ? dcLast.tail : 0;
      frameEnd = tt + rcM(R.frameLead);
      gov = 'DC 층 사이클 (' + (dcLast ? dcLast.gov : '외주부') + ')';
    } else if (!corePath) {
      /* 한 층씩 (일체 타설) : 동시타설 RC · SRC (c4 또는 옛 식 · 벽식) · 동시타설 철골 · 강합성 (c5) · 코어후행 (외주부 · 코어 두 경로 중 긴 쪽) */
      var tt = frameStart, first = slabT(1, hUp[0]), lastSt = null, chain1 = first.model !== 'old';
      var lead = (FR.zoneDur[struct] / hF - dS) + (first.T - 1) * FR.lag;
      /* 동시타설 철골 : 첫 층 철골 · DECK 선행 1회 (DC 철골 1절 · 데크 선행과 같은 규칙) — 이후 층은 아래층 RC 중 선행 */
      if (first.lead > 0) { tt += rcM(first.lead); R.notes.push('동시타설 철골 : 철골 · DECK 선행 ' + r1(first.lead) + 'WD (첫 층만, 이후 층은 아래층 타설 중 선행 · 층간 ≥ 선행)'); }
      allLv.forEach(function (x, idx) {
        var st = slabT(Math.min(x.n, nUp), x.h, x.b ? AdnEff : null, !!x.b), f = 1, why = [];
        lastSt = st;
        var s0 = Math.max(tt, holdT(x.n, false)), hold = s0 - tt;
        if (x.ph) { f *= FR.roofF; why.push('옥탑 × ' + FR.roofF); }
        else if (nPH === 0 && x.n === nUp && nUp > 1) { f *= FR.roofF; why.push('최상층 × ' + FR.roofF); }
        var fp = preFac(s0, rcM(st.wd * f));
        if (fp > 1 + 1e-9) { f *= fp; why.push('기초 전 T/C 공용 × ' + r2(fp)); }
        var wd = st.wd * f;
        if (hold > 0.005) holdLog.push({ lv: x.lv, m: hold, why: x.n > lim2 ? '지하 수직재 완료 대기' : '기초 완료 대기' });
        var e0 = s0 + rcM(wd), hfx = (st.hf > 1.001 ? ' × 층고 ' + r2(st.hf) : ''), fx = (f !== 1 ? ' × ' + r2(f) : '');
        var fl = { lv: x.lv, n: x.n, h: x.h, ph: x.ph, Z: st.Z, T: st.T, per: st.per, hf: st.hf, lifts: st.lifts, f: f, why: why.join(' · '), wd: wd, s: s0, e: e0, hold: hold, model: st.model,
          formula: st.model === 'post'
            ? '코어후행 : 외주부 (' + st.P.ch + ') ' + st.P.N + ' Zone' + (st.P.zIn ? ' (입력)' : '') + ' · ' + st.P.T + '팀 ' + r1(st.P.zoneF) + 'WD / 코어 (c1) ' + st.C.N + ' Zone · ' + st.C.T + '팀 ' + r1(st.C.zoneF) + 'WD' + (st.C.lifts > 1 ? ' (수직재 ' + st.C.lifts + '회)' : '') +
              ' → ' + st.gov + ' ' + r1(st.wd) + 'WD' + (st.flow === 'FLOOR' ? ' (층 완결 · Zone 간격 포함)' : '') + fx
            : st.model === 'v28'
            ? (st.ch === 'c5' ? '동시타설 철골 (c5) ' : st.ch === 'c2' ? '바닥 (c2) ' : '') + st.N + ' Zone' + (st.zIn ? ' (입력)' : '') + ' · ' + st.T + '팀 (팀당 ' + st.nt + ') · Zone 1개 사슬 ' + r1(st.zone) + 'WD' + (st.lifts > 1 ? ' × ' + st.lifts + '회 타설 ' + r2(st.lk) : '') + hfx +
              (st.bind === 'steel' ? ' → 철골 · DECK 선행 ' + r1(st.lead) + 'WD 지배' : '') + (st.lb.on ? ' → 하루 1 Zone 하한 ' + r1(st.lb.v) + 'WD' : '') + (st.flow === 'FLOOR' && st.nt > 1 ? ' + Zone 간격 ' + (st.nt - 1) + 'WD' : '') + fx
            : st.Z + ' Zone ÷ ' + st.T + '팀 → ' + st.per + ' Zone × ' + r2(dS) + 'WD' + (st.lifts > 1 ? ' × ' + st.lifts + '회 타설 ' + r2(st.lk) : '') + hfx + fx + (st.wd > st.per * dS * (st.lk || 1) * st.hf + 1e-6 ? ' (최소 ' + r1(minT) + 'WD)' : '') };
        if (st.model === 'v28') { fl.N = st.N; fl.nt = st.nt; fl.T0 = st.T0; fl.takt = st.takt; fl.zone = st.zone; fl.zone28 = st.zone28; fl.zoneF = st.zoneF; fl.lk = st.lk; fl.tail = st.tail; fl.need = st.need; fl.items = st.items; fl.lb = st.lb; fl.flow = st.flow; fl.q = st.q;
          fl.ch = st.ch; fl.ovKey = st.ovKey; fl.lead = st.lead; fl.bind = st.bind; if (st.leadItems) fl.leadItems = st.leadItems; }
        if (st.model === 'post') { fl.N = st.N; fl.nt = st.nt; fl.takt = st.takt; fl.lk = st.lk; fl.tail = st.tail; fl.flow = st.flow; fl.ch = st.ch; fl.post = st; fl.gov = st.gov; }
        floors.push(fl);
        tt = e0;
      });
      /* 꼬리 : 옛 식 = (Zone 1개 전체 − 순환 1회) + (팀 − 1) × 시차 · v2.8 사슬 = 맨 위층 마지막 Zone 이 층간을 넘는 만큼 (Zone 연속 : nt − 1) — 사슬이 이미 Zone 1개 전체라 (zoneDur − d) 는 다시 더하지 않음 */
      if (chain1) lead = lastSt ? lastSt.tail : 0;
      frameEnd = tt + rcM(lead);
      gov = seqU === 'POST' ? '코어후행 (' + (lastSt ? lastSt.gov : '외주부') + ' 지배)' : steelF ? '동시타설 (' + sNm + ' c5 공종 사슬)' : v28On ? '바닥 (공종 사슬 · Zone 연속)' : '바닥 (일체 타설)';
      if (chain1 && !rcFlowZ) gov = gov.replace(/\)$/, ' · 층 완결)').replace('Zone 연속 · 층 완결', '층 완결');
      R.frameLead = lead;
    } else {
      /* 코어 선행 체인 + 바닥 체인 */
      var cLv = allLv.slice();
      if (seq === 'TD' && tdSt.length) cLv.unshift({ lv: tdSt[0].lv + ' 코어', n: tdSt[0].n, h: tdSt[0].h || 5, ph: false, b1: true });
      var ct = frameStart, cEnd = {}, acsDone = sysC !== 'ACS', sysCount = 0, learnI = 0;
      cLv.forEach(function (x, idx) {
        var c = coreT(x.h), f = 1, why = [], extra = 0, wdB = c.wd;
        var s0 = Math.max(ct, holdT(x.n, true)), hold = s0 - ct;
        if (sysC === 'ACS' && sysCount < 3 + (seq === 'TD' ? 1 : 0) && !x.ph) {
          wdB = c.per * dC * hfac(x.h); f = FR.sysF; why.push('시스템폼 × ' + FR.sysF); sysCount++;
        } else {
          var lf = 1;
          /* ACS 설치 · 초기 숙련은 일반층에서만 (옥탑만 남은 저층 건물은 제외) */
          if (sysC === 'ACS' && !x.ph) { if (!acsDone) { extra = acsSet; acsDone = true; why.push('ACS 설치 ' + r1(acsSet) + 'WD'); } if (learnI < FR.learnCore.length) { lf = FR.learnCore[learnI]; learnI++; } }
          else if (sysC !== 'ACS' && idx === 0) lf = FR.gangFirst;
          var pf = preFac(s0, rcM(wdB));
          f = Math.max(lf, pf);
          if (f > 1) why.push((lf >= pf ? (sysC === 'ACS' ? '초기 숙련' : '초기층') : '기초 전 T/C 공용') + ' × ' + r2(f));
        }
        var wd = wdB * f + extra;
        if (hold > 0.005) holdLog.push({ lv: x.lv + ' 코어', m: hold, why: x.n > lim2C ? '지하 수직재 완료 대기' : '기초 완료 대기' });
        var e0 = s0 + rcM(wd); cEnd[x.n] = e0;
        var lbC = wdB === c.wd && c.lb ? c.lb : (c.lb ? { v: c.lb.v, on: false, k: 'c1', src: 'v2.8', Z: c.lb.Z, items: c.lb.items, zone: c.lb.zone, lifts: c.lb.lifts } : null);
        coreRows.push({ lv: x.lv, n: x.n, h: x.h, Z: c.Z, T: c.T, per: c.per, lifts: wdB === c.wd ? c.lifts : 1, hf: wdB === c.wd ? c.hf : hfac(x.h), f: f, extra: extra, why: why.join(' · '), wd: wd, s: s0, e: e0, hold: hold, model: 'old', lb: lbC,
          formula: (lbC && lbC.on ? 'v2.8 c1 사슬 ' + r1(lbC.zone) + 'WD × ' + lbC.lifts + '회 = ' + r1(lbC.v) + 'WD (하한 > ' + c.per + ' Zone × ' + r2(dC) + 'WD)'
            : c.per + ' Zone × ' + r2(dC) + 'WD' + (wdB === c.wd && c.lifts > 1 ? ' × ' + c.lifts + ' Lift' : '') + ((wdB === c.wd ? c.hf : hfac(x.h)) > 1.001 ? ' × 층고 ' + r2(wdB === c.wd ? c.hf : hfac(x.h)) : '')) + (f !== 1 ? ' × ' + r2(f) : '') + (extra ? ' + ' + r1(extra) + 'WD' : '') });
        ct = e0;
      });
      var coreEnd = ct, topN = cLv[cLv.length - 1].n;
      var stt = frameStart, li = 0, lastSl = null;
      var slabLv = allLv.filter(function (x) { return !x.ph; });
      for (var si = 0; si < slabLv.length; si++) {
        n = slabLv[si].n;
        var h2 = slabLv[si].h, sl = slabT(n, h2, slabLv[si].b ? AdnEff : null, !!slabLv[si].b), f2 = 1, why2 = [];
        lastSl = sl;
        /* 초기층 계수 : 철골 (ACS 숙련 · 셋팅층 · 초기층) 만 — RC 코어선행 바닥 (c2 사슬) 은 동시타설 c4 경로처럼 없음 (코어가 ACS 셋팅 · 숙련을 맡음) */
        if (struct === 'SC' && sysC === 'ACS' && li < FR.learnSlab.length) { f2 *= FR.learnSlab[li]; why2.push('초기 숙련 × ' + FR.learnSlab[li]); li++; }
        else if (si === 0 && struct === 'COMP') { f2 *= FR.setFloor; why2.push('셋팅층 × ' + FR.setFloor); }
        else if (si === 0 && steelF) { f2 *= FR.firstF; why2.push('초기층 × ' + FR.firstF); }
        if (n === nUp) { f2 *= FR.roofF; why2.push('최상층 × ' + FR.roofF); }
        /* 바닥 n층 착수 = 코어 n + k 층 완료 후 : 철골 k = 3 (사례 A — ACS 하부 발판 간섭, 안전측) · RC 코어선행 k = seq.rcLag (가정, 기본 3) · 강합성 = 코어와 독립 */
        var kLag = struct === 'SC' ? 3 : (!steelF ? SQ.rcLag : -1), ready = kLag >= 0 ? (cEnd[Math.min(n + kLag, topN)] || coreEnd) : frameStart;
        var s1 = Math.max(stt, ready, holdT(n, false)), bind = s1 > stt + 0.005 ? (ready >= holdT(n, false) ? (kLag >= 0 ? '코어 n+' + kLag + '층' : '') : '구조제한') : '';
        /* 강합성 바닥은 코어와 독립 → 기초 전 T/C 공용 할증 (철골 바닥은 코어 n+3층 연동으로 코어에 반영) */
        var fpS = struct === 'COMP' ? preFac(s1, rcM(sl.wd * f2)) : 1;
        if (fpS > 1 + 1e-9) { f2 *= fpS; why2.push('기초 전 T/C 공용 × ' + r2(fpS)); }
        var wd2 = sl.wd * f2;
        if (holdT(n, false) > Math.max(stt, ready) + 0.005) holdLog.push({ lv: slabLv[si].lv + ' 바닥', m: holdT(n, false) - Math.max(stt, ready), why: n > lim2 ? '지하 수직재 완료 대기' : '기초 완료 대기' });
        var e1 = s1 + rcM(wd2);
        var sr = { lv: slabLv[si].lv, n: n, h: h2, Z: sl.Z, T: sl.T, per: sl.per, hf: sl.hf, f: f2, why: why2.join(' · '), wd: wd2, s: s1, e: e1, bind: bind, model: sl.model, lb: sl.lb || null,
          formula: sl.model === 'v28'
            ? '바닥 (c2) ' + sl.N + ' Zone' + (sl.zIn ? ' (입력)' : '') + ' · ' + sl.T + '팀 (팀당 ' + sl.nt + ') · Zone 1개 사슬 ' + r1(sl.zone) + 'WD' + (sl.lifts > 1 ? ' × ' + sl.lifts + '회 타설 ' + r2(sl.lk) : '') + (sl.hf > 1.001 ? ' × 층고 ' + r2(sl.hf) : '') + (sl.lb.on ? ' → 하루 1 Zone 하한 ' + r1(sl.lb.v) + 'WD' : '') + (sl.flow === 'FLOOR' && sl.nt > 1 ? ' + Zone 간격 ' + (sl.nt - 1) + 'WD' : '') + (f2 !== 1 ? ' × ' + r2(f2) : '')
            : (sl.lb && sl.lb.on ? 'v2.8 c3 사슬 하한 ' + r1(sl.lb.v) + 'WD (' + sl.lb.Z + ' Zone · 해석) > ' : '') + sl.Z + ' Zone ÷ ' + sl.T + '팀 → ' + sl.per + ' Zone × ' + r2(dS) + 'WD' + (sl.hf > 1.001 ? ' × 층고 ' + r2(sl.hf) : '') + (f2 !== 1 ? ' × ' + r2(f2) : '') };
        if (sl.model === 'v28') { sr.N = sl.N; sr.nt = sl.nt; sr.T0 = sl.T0; sr.takt = sl.takt; sr.zone = sl.zone; sr.zone28 = sl.zone28; sr.zoneF = sl.zoneF; sr.lk = sl.lk; sr.lifts = sl.lifts; sr.tail = sl.tail; sr.need = sl.need; sr.items = sl.items; sr.flow = sl.flow; sr.q = sl.q; sr.ch = sl.ch; sr.ovKey = sl.ovKey; }
        slabRows.push(sr);
        stt = e1;
      }
      /* RC 코어선행 바닥 (c2 사슬 · Zone 연속) : 맨 위층 마지막 Zone 이 층간을 넘는 만큼 (nt − 1) 을 바닥 끝에 1회 */
      var tailS = lastSl && lastSl.model === 'v28' ? lastSl.tail || 0 : 0, slabEnd = stt + rcM(tailS);
      var leadC = struct === 'COMP' ? (FR.zoneDur.COMP / hF - dC) + (coreRows[coreRows.length - 1].T - 1) * FR.lag : 0;
      var cEndL = coreEnd + rcM(leadC);
      frameEnd = Math.max(slabEnd, cEndL);
      gov = cEndL >= slabEnd ? '코어 (RC)' : (struct === 'SC' ? '철골 · 데크 · 슬래브' : struct === 'COMP' ? '바닥 (강합성)' : '바닥 (RC c2 공종 사슬 · 코어 n+' + SQ.rcLag + '층 후)');
      R.frameLead = cEndL >= slabEnd ? leadC : (tailS || leadC); R.coreEnd = coreEnd; R.slabEnd = slabEnd;
    }
    /* 순타 지하 → 지상 연계 : 중첩은 지상골조 공기의 1/2 이내 (지상골조가 지하골조보다 먼저 끝날 수 없음) */
    if (ovApplied > 0) {
      var maxOv = 0.5 * (frameEnd - frameStart);
      if (ovApplied > maxOv) {
        var sh = ovApplied - maxOv;
        [floors, coreRows, slabRows].forEach(function (rows) { rows.forEach(function (r) { r.s += sh; r.e += sh; }); });
        frameStart += sh; frameEnd += sh; if (R.coreEnd != null) R.coreEnd += sh; if (R.slabEnd != null) R.slabEnd += sh;
        ovApplied = maxOv;
      }
      R.notes.push('지하 → 지상 Zone 연계 착수 : ' + r1(ovApplied) + '개월 중첩 적용');
    }
    /* 골조 완료 = 지상골조 · 지하골조 (순타) · 기초 · 지하 수직재 (역타) 중 마지막 */
    var frameDone = seq === 'TD' ? Math.max(frameEnd, T_F, V_END) : Math.max(frameEnd, baseEnd);
    var typN = Math.min(nUp, Math.max(2, Math.floor(nUp / 2))), typH = hUp[typN - 1];
    var typS = slabT(typN, typH), typC = corePath && !dcOn ? coreT(typH) : null, typD = null, typP = null;
    if (dcOn) { typD = dcFloor(typN, typH, Atyp); typS = { model: 'dc', Z: typD.P.N, T: typD.P.T, per: typD.P.nt, hf: 1, wd: typD.wd }; }
    /* 코어후행 : typ.post = { P (외주부), C (코어), gov, wd … } (DC typ.dc 와 같은 두 경로), typ.slab = 층간 요약 (Z · T · per = 외주부) */
    else if (typS.model === 'post') { typP = typS; typS = { model: 'post', ch: typP.ch, Z: typP.P.N, N: typP.P.N, T: typP.P.T, T0: typP.P.T0, per: typP.P.nt, nt: typP.P.nt, hf: typP.hf, lifts: typP.lifts, lk: typP.lk, wd: typP.wd, tail: typP.tail, flow: typP.flow, gov: typP.gov }; }
    var fBasis = dcOn
      ? '기준층 ' + r1(typD.wd) + 'WD/층 (DC 층 사이클 · 외주부 ' + typD.P.N + ' Zone · ' + typD.P.T + '팀 ' + r1(typD.P.zone) + 'WD / 코어 ' + typD.C.N + ' Zone ' + r1(typD.C.zone) + 'WD · ' + (typD.flow ? 'Zone 연속' : '층 단위 완결') + ') · 주공정 ' + gov
      : typP
        ? '기준층 ' + r1(typP.wd) + 'WD/층 (코어후행 · 외주부 ' + typP.P.ch + ' ' + typP.P.N + ' Zone · ' + typP.P.T + '팀 ' + r1(typP.P.zoneF) + 'WD / 코어 c1 ' + typP.C.N + ' Zone · ' + typP.C.T + '팀 ' + r1(typP.C.zoneF) + 'WD → ' + typP.gov + ' 지배 · ' + (typP.flow === 'ZONE' ? 'Zone 연속 · 맨 위층 + ' + r1(R.frameLead || 0) + 'WD' : '층 단위 완결') + ') · 주공정 ' + gov
      : typS.model === 'v28' && typC
        ? '기준층 ' + r1(Math.max(typS.wd, typC.wd)) + 'WD/층 (코어선행 · 바닥 c2 ' + typS.N + ' Zone · ' + typS.T + '팀 (팀당 ' + typS.nt + ') · Zone 1개 ' + r1(typS.zone) + 'WD → ' + r1(typS.wd) + 'WD / 코어 ' + typC.Z + ' Zone × ' + r2(dC) + 'WD = ' + r1(typC.wd) + 'WD' + (typC.lb && typC.lb.on ? ' → c1 하한 ' + r1(typC.lb.v) + 'WD' : '') + ') · 주공정 ' + gov + ' · 바닥 n층 = 코어 n+' + SQ.rcLag + '층 완료 후'
      : typS.model === 'v28'
        ? '기준층 ' + r1(typS.wd) + 'WD/층 (' + (typS.ch === 'c5' ? '동시타설 ' + sNm + ' c5 ' : 'v2.8 ') + '공종 사슬 · ' + typS.N + ' Zone · ' + typS.T + '팀 (팀당 ' + typS.nt + ') · Zone 1개 ' + r1(typS.zone) + 'WD' + (typS.bind === 'steel' ? ' → 철골 · DECK 선행 ' + r1(typS.lead) + 'WD 지배' : '') + (typS.lb.on ? ' → 하루 1 Zone 하한 ' + r1(typS.lb.v) + 'WD' : '') + ' · ' + (typS.flow === 'ZONE' ? 'Zone 연속 · 맨 위층 + ' + r1(R.frameLead || 0) + 'WD' : '층 단위 완결') + ') · 주공정 ' + gov
        : '기준층 ' + r1(Math.max(typS.wd, typC ? typC.wd : 0)) + 'WD/층 (바닥 ' + typS.Z + ' Zone ÷ ' + typS.T + '팀 × ' + r2(dS) + 'WD' + (typS.lb && typS.lb.on ? ' → c3 하한 ' + r1(typS.lb.v) + 'WD' : '') + (typC ? ' · 코어 ' + typC.Z + ' Zone × ' + r2(dC) + 'WD' + (typC.lb && typC.lb.on ? ' → c1 하한 ' + r1(typC.lb.v) + 'WD' : '') : '') + ') · 주공정 ' + gov + (struct === 'SC' && corePath ? ' · 철골 n층 = 코어 n+3층 완료 후' : '');
    var fName = '지상골조 (' + STRUCT_N[struct].replace(/ \(.*\)/, '') + ', ' + nUp + '층' + (nPH ? ' + 옥탑 ' + nPH : '') + ')';
    function findA(id) { for (var q = 0; q < acts.length; q++) if (acts[q].id === id) return acts[q]; return null; }
    var frameCPs;
    if (seq === 'TD') {
      var aExc = findA('exc'), aFound = findA('found'), aVert = findA('vert');
      if (V_END >= frameEnd) {
        /* 지상골조가 지하 수직재보다 먼저 끝남 (지상 저층) → 기초 → 지하 수직재가 C.P */
        aVert.cp = true; frameCPs = V_END;
        act({ id: 'frame', g: '골조', name: fName, s: frameStart, e: frameEnd, cp: false, rate: 'rc', basis: fBasis + ' · 지하 수직재 완료 전에 끝나 C.P 아님' });
      } else if (frameStart > T_F + 0.005) {
        if (holdLog.length) {
          /* 기초 완료 후 착수 · 상부층이 지하 수직재 완료 대기 → 기초 → 수직재 → 잔여 지상골조 */
          aVert.cp = true; frameCPs = V_END;
          act({ id: 'frame', g: '골조', name: '지상골조 (지하 수직재 완료 후 잔여)', s: frameStart, e: frameEnd, cp: true, rate: 'rc', wd: (frameEnd - V_END) * rRC * D, basis: fBasis + ' · ' + (lim2 + 1) + 'F~ 지하 수직재 완료 대기' });
        } else {
          /* 기초 완료 후 지상 착수 → 1F 슬래브 + 착수 준비가 C.P (굴착 · 기초는 여유) */
          aExc.cp = false; aFound.cp = false; frameCPs = frameStart;
          act({ id: 'tdwait', g: '골조', name: '지상 착수 준비 (' + baseName + ' 슬래브 완료 후 ' + r1(tdOff) + '개월)', s: T_1F, e: frameStart, cp: true, basis: '역타 지상 착수 = 기준층 (' + baseName + ') 슬래브 완료 + ' + r1(tdOff) + '개월 · 기초 완료 (M+' + r1(T_F) + ') 이후 착수 → 굴착 · 기초는 C.P 아님' });
          act({ id: 'frame', g: '골조', name: fName, s: frameStart, e: frameEnd, cp: true, rate: 'rc', wd: (frameEnd - frameStart) * rRC * D, basis: fBasis });
        }
      } else {
        frameCPs = T_F;
        if (frameStart < T_F - 0.01) act({ id: 'frameA', g: '골조', name: '지상골조 (기초 완료 전 진행분)', s: frameStart, e: Math.min(frameEnd, T_F), cp: false, rate: 'rc', basis: '기준층 (' + baseName + ') 슬래브 완료 + ' + r1(tdOff) + '개월 착수 · 기초 전 ' + lim + 'F (코어 ' + limC + 'F)까지 허용' });
        act({ id: 'frame', g: '골조', name: '지상골조 (기초 완료 후 잔여)', s: T_F, e: frameEnd, cp: true, rate: 'rc', wd: (frameEnd - T_F) * rRC * D, basis: fBasis + ' · 기초 완료 후 ' + (lim + 1) + 'F~ 잔여' });
      }
    } else {
      frameCPs = frameStart;
      act({ id: 'frame', g: '골조', name: fName, s: frameStart, e: frameEnd, cp: true, rate: 'rc', wd: (frameEnd - frameStart) * rRC * D, basis: fBasis + (ovApplied > 0 ? ' · 지하골조와 ' + r1(ovApplied) + '개월 중첩' : '') });
    }
    if (corePath && !dcOn) act({ id: 'core', g: '골조', name: '코어 선행 (' + (sysC === 'ACS' ? 'ACS' : '갱폼 · 알폼') + ')', s: coreRows[0].s, e: coreRows[coreRows.length - 1].e, cp: false, rate: 'rc', basis: '코어 ' + coreRows[Math.min(6, coreRows.length - 1)].Z + ' Zone · 기준 ' + r1(typC.wd) + 'WD/층' });
    var bUsed = !!(base && base.model === 'v28'), lbUsed = corePath && !dcOn && lbOn;
    /* 지상 v2.8 공종 사슬 경로 (동시 RC c4 · 동시 철골 c5 · RC 코어선행 바닥 c2 · 코어후행 c2 | c3 + c1) */
    var upCh = !dcOn && (v28On || seqU === 'POST' || (seqU === 'SIM' && steelF) || (seqU === 'PRE' && !steelF));
    var onC5 = !dcOn && seqU === 'SIM' && steelF, onC2 = !dcOn && !steelF && (seqU === 'PRE' || seqU === 'POST'), onC3 = !dcOn && steelF && seqU === 'POST', onC1 = !dcOn && seqU === 'POST';
    /* 코어 면적 자동값 (adv.coreA 없을 때) 에 실제 쓴 비율 (coreRb : 철골 · 강합성 · DC = frame.core.ratio, 일반 RC · SRC = v28.coreR) */
    var coreRuse = coreRb, coreRpath = coreSC ? 'frame.core.ratio' : 'v28.coreR';
    /* 옛 zSpec (면적 900㎡ Zone) 이 v2.8 사슬 경로 층에 들어 있으면 쓰지 않았다고 알림 (체적 Zone 수는 adv.zN) */
    var zIgn = (upCh && Object.keys(ZS.up).length > 0) || (bUsed && Object.keys(ZS.b).length > 0);
    if (zIgn) R.notes.push('바닥 Zone 수 입력 (zSpec \'' + String(A.zSpec) + '\' · 면적 900㎡ Zone 기준) 은 v2.8 공종 사슬 경로 (지상 ' + POUR_N[seqU] + ' 사슬 · 순타 지하 바닥) 에서 쓰지 않았습니다 — 체적 Zone 수 (1회 타설 ' + V8.pourV + '㎥) 는 별도 입력 (adv.zN)');
    if (ZN.err.length) R.warn.push('체적 Zone 수 입력 (zN) 을 읽지 못한 항목 : ' + ZN.err.join(', '));
    /* 타설 순서 결과 : sel (입력) · auto (자동 규칙) · used (계산에 쓴 값) · reason (자동 이유) · src · opts (고를 수 있는 값 — 벽식 SIM 만 · DC · 옛 식은 없음) · lock (선택이 무시되는 이유) */
    var pOpts = dcOn || legacy ? [] : (wallRC ? ['SIM'] : ['SIM', 'PRE', 'POST']);
    var pour = { sel: pSel, auto: pAuto, used: seqU, name: POUR_N[seqU], autoName: POUR_N[pAuto], reason: pWhy, src: dcOn ? 'DC 경로' : legacy ? '옛 식' : '가정 (v2.8 기본 + 일반 적용 기준, 사례 보정 전)',
      opts: pOpts, lock: dcOn ? 'DC 층 사이클 (분리 타설)' : legacy ? 'frChain OFF (옛 식)' : wallRC ? '벽식 — 동시타설만' : '', rule: { rcPreF: SQ.rcPreF, stPostF: SQ.stPostF, rcLag: SQ.rcLag },
      ch: dcOn ? 'dc' : seqU === 'POST' ? (steelF ? 'c3+c1' : 'c2+c1') : seqU === 'SIM' ? (steelF ? 'c5' : (v28On ? 'c4' : 'old')) : (steelF ? 'old' : 'c2+core') };
    R.frame = { struct: struct, sysC: sysC, floors: floors, coreRows: coreRows, slabRows: slabRows, start: frameStart, end: frameEnd, done: frameDone, cpStart: frameCPs, gov: gov, holds: holdLog, lim: lim, lim2: lim2, limC: limC, lim2C: lim2C, Atyp: Atyp, dS: dS, V_END: V_END, T_F: T_F, ov: ovApplied,
      typ: { n: typN, h: typH, slab: typS, core: typC, dc: typD, post: typP }, dc: dcOn, dcMode: dcMode, pour: pour, seq: seqU,
      model: dcOn ? 'dc' : (seqU === 'POST' ? 'post' : (upCh ? 'v28' : 'old')), frChain: frMode, rcFlow: rcFlowZ ? 'ZONE' : 'FLOOR', lead: R.frameLead || 0,
      v28: { on: v28On && !dcOn, up: upCh, ch: pour.ch, base: bUsed, bChain: A.bChain === 'ON' ? 'ON' : 'OFF', lb: lbUsed, lbSC: V8.lbSC, guard: dcOn && frMode !== 'OFF', ptOn: ptOn, ptX: ptXd, ptS: ptS, hQ: V8.hQ, hQB: V8.hQB, spanL: sL8, spanS: sS8, colN: colN8 || null, coreA: coreAin || null,
        coreR: coreRuse, coreRpath: coreRpath, coreAuto: r1(Atyp * coreRuse), zN: !!(Object.keys(ZN.up).length || Object.keys(ZN.b).length), zSpecIgnored: zIgn, lib: Object.assign({}, V8) },
      assume: assume28() };
    /* 실제 쓴 기본 가정 (화면 '주요 가정사항' 표 · 편집용) : k · n (이름) · v · u (단위) · path (편집 경로 : S.libOv 'v28.*' · 'seq.*' 또는 adv.*) · src ('v2.8' | '가정' | '사례 보정' | '해석' | '입력') · g (묶음) · on (이번 계산에 쓰였는지) */
    function assume28() {
      var o = [], onC4 = (v28On && !dcOn) || bUsed, onLb = lbUsed || dcOn, onNew = onC5 || onC2 || onC3 || onC1, onUp = onC4 || onNew, onAll = onUp || onLb;
      function lib(k, n, u, src, g, on) { var v = V8[k], d = V8D[k]; o.push({ k: k, n: n, v: v, u: u, path: 'v28.' + k, src: d != null && Math.abs(v - d) > 1e-9 ? '입력' : src, g: g, on: !!on }); }
      function rule(k, n, src, g, on) { o.push({ k: 'rule.' + k, n: n, v: null, u: '', path: '', src: src, g: g, on: !!on }); }
      var SQD = defaultSeq();
      function sq(k, n, u, on, note) { o.push({ k: 'seq.' + k, n: n, v: SQ[k], u: u, path: 'seq.' + k, src: SQ[k] !== SQD[k] ? '입력' : '가정', g: '타설 순서', on: !!on, note: note || '' }); }
      /* 타설 순서 (맨 앞 — 화면 '주요 가정사항' 칸 '타설 순서' : 자동 표시 + 이유 말풍선 + 선택) */
      o.push({ k: 'pourSeq', n: '타설 순서', v: POUR_N[seqU], u: '', path: 'adv.pourSeq', src: pSel !== 'AUTO' ? '입력' : (dcOn ? 'DC 경로' : legacy ? '옛 식' : '가정'), g: '타설 순서', on: true, note: pWhy, sel: pSel, auto: pAuto, used: seqU, opts: pOpts });
      sq('rcPreF', 'RC · SRC 코어선행 자동 기준 (지상 층수 이상)', '층', !steelF && !dcOn && !legacy && !wallRC && pSel === 'AUTO', '그 아래는 동시타설 — 가정 (사례 보정 전)');
      sq('stPostF', '철골 · 강합성 코어후행 자동 기준 (지상 층수 이하)', '층', steelF && !dcOn && !legacy && pSel === 'AUTO', '그 위는 코어선행 (v2.8 철골 기본) — 가정 (사례 보정 전)');
      sq('rcLag', 'RC 코어선행 바닥 = 코어 n + 이 값 층 완료 후', '층', corePath && !steelF && !dcOn, '철골 코어선행 n+3 (사례 A) 과 같은 값 — 가정');
      o.push({ k: 'spanL', n: '스팬 장변', v: sL8, u: 'm', path: 'adv.spanL', src: num(A.spanL, 0) > 0 || V8.spanL !== V8D.spanL ? '입력' : 'v2.8', g: '물량', on: onAll });
      o.push({ k: 'spanS', n: '스팬 단변', v: sS8, u: 'm', path: 'adv.spanS', src: num(A.spanS, 0) > 0 || V8.spanS !== V8D.spanS ? '입력' : 'v2.8', g: '물량', on: onAll });
      lib('colA', '기둥 단면 (지상)', '㎡', 'v2.8', '물량', onAll); lib('colAB', '기둥 단면 (지하)', '㎡', 'v2.8', '물량', bUsed);
      lib('beamsPerCol', '기둥당 보', '개', 'v2.8', '물량', onAll); lib('beamA', '보 단면 (지상)', '㎡', 'v2.8', '물량', onC4 || onC2 || onLb); lib('beamAB', '보 단면 (지하)', '㎡', 'v2.8', '물량', bUsed); lib('beamK', '보 길이 계수', '', 'v2.8', '물량', onC4 || onC2 || onLb);
      lib('slabT', '슬래브 두께 (지상)', 'm', 'v2.8', '물량', onAll); lib('slabTB', '슬래브 두께 (지하)', 'm', 'v2.8', '물량', bUsed);
      o.push({ k: 'coreA', n: '코어 면적', v: coreAin || r1(Atyp * coreRuse), u: '㎡', path: 'adv.coreA', src: coreAin ? '입력' : (coreSC ? '가정' : 'v2.8'), g: '물량', on: onAll || corePath, note: coreAin ? '' : '기준층 × ' + coreRuse + (coreSC ? ' (frame.core.ratio — 철골 · 강합성 · DC 코어, v2.8 은 0.23)' : '') });
      lib('coreR', '코어 면적 비 (자동, 일반 RC · SRC)', '', 'v2.8', '물량', (onC4 || onC2 || corePath) && !coreAin && !coreSC);
      o.push({ k: 'coreRsc', n: '코어 면적 비 (자동, 철골 · 강합성 · DC)', v: FR.core.ratio, u: '', path: 'frame.core.ratio', src: '가정', g: '물량', on: coreSC && !coreAin, note: '철골 · 강합성 사슬 (c5 · c3 · c1) · c1 · c3 하한 · DC 분할 하한 · 지하 사슬도 이 코어 (옛 경로 코어 Zone · 화면 코어 그림과 같게) — v2.8 은 0.23' });
      lib('coreWall', '코어 벽 체적 비', '', 'v2.8', '물량', onC4 || onC5 || onC1 || onLb);
      lib('hQ', '물량 · Zone 기준 층고 (지상)', 'm', 'v2.8', '물량', onUp || lbUsed); lib('hQB', '물량 · Zone 기준 층고 (지하)', 'm', 'v2.8', '물량', bUsed);
      lib('rebCB', '철근비 기둥 · 보', 't/㎥', 'v2.8', '물량', onAll); lib('rebSC', '철근비 슬래브 · 벽', 't/㎥', 'v2.8', '물량', onAll);
      lib('pourV', '1회 타설 (수평)', '㎥', 'v2.8', 'Zone', onAll); lib('pourVc', '1회 타설 (코어 수직)', '㎥', 'v2.8', 'Zone', lbUsed || onC1); lib('pump', '펌프 대수', '대', 'v2.8', 'Zone', onAll);
      lib('zpt', '팀당 Zone', '개', 'v2.8', '팀', onUp); lib('takt', '팀 안 Zone 간격', 'WD', 'v2.8', '팀', onUp);
      lib('tPerMD', '철근 생산성', 't/인·일', 'v2.8', '생산성', onAll); lib('crewW', '벽체 철근 인원', '인', 'v2.8', '생산성', onC4 || onC5 || onC1 || onLb); lib('crewCS', '코어 슬래브 철근 인원', '인', 'v2.8', '생산성', onLb || onC1); lib('crewU', '바닥 철근 · M&E 인원', '인', 'v2.8', '생산성', onC4 || onC2 || onC3 || onLb);
      lib('crewS', '동시타설 철골 철근 · M&E 인원 (c5)', '인', 'v2.8', '생산성', onC5);
      lib('table', '테이블폼', '장/일', 'v2.8', '생산성', onC4 || onC2 || dcOn); lib('tableW', '테이블폼 1장 폭', 'm', 'v2.8', '생산성', onC4 || onC2 || dcOn); lib('deck', 'DECK', '㎡/일', 'v2.8', '생산성', onAll);
      lib('steelPc', '철골 설치', 'pcs/일', 'v2.8', '생산성', (onLb && steelF) || onC3 || onC5); lib('bolt', '볼팅', 'WD', 'v2.8', '생산성', (onLb && steelF) || onC3 || onC5);
      lib('lift', '양중', 'WD', 'v2.8', '고정 일수', onAll); lib('wform', '벽체 형틀', 'WD', 'v2.8', '고정 일수', onC4 || onC5 || onC1 || onLb); lib('form', '형틀 (c4)', 'WD', 'v2.8', '고정 일수', onC4); lib('form2', '형틀 (c2)', 'WD', 'v2.8', '고정 일수', onC2 || (dcOn && !steelF));
      lib('me', 'M&E', 'WD', 'v2.8', '고정 일수', onLb || onC3 || onC1); lib('pour', '타설', 'WD', 'v2.8', '고정 일수', onAll); lib('ptAdd', 'PT (철근 · M&E 안)', 'WD', 'v2.8', '고정 일수', onC4 && ptOn); lib('ptX', 'PT 슬래브 추가 (지상)', 'WD', '가정', '고정 일수', (v28On && !dcOn && ptXd > 0) || (onC2 && ptS > 0)); lib('c3End', 'c3 마무리', 'WD', 'v2.8', '고정 일수', (onLb && steelF) || onC3);
      lib('ov1', '겹침 : 벽체 철근 ∥ 양중', 'WD', 'v2.8', '겹침', onC4); lib('ov3', '겹침 : 테이블폼', 'WD', '사례 보정', '겹침', onC4); lib('ov4', '겹침 : 형틀', 'WD', '사례 보정', '겹침', onC4); lib('ov5', '겹침 : DECK', 'WD', '사례 보정', '겹침', onC4);
      lib('wallZ', '지하 외벽 Zone 길이', 'm', 'v2.8', '지하', bUsed); lib('wzpt', '외벽팀 자동 = Zone ÷ 이 값', '개', '가정', '지하', bUsed); lib('wKmin', '외벽팀 반영 하한 (지금 값 × )', '', '가정', '지하', bUsed && !!(base && base.wIn));
      o.push({ k: 'hStd', n: 'DC 분할 하한 기준 층고', v: V8.hStd, u: 'm', path: 'v28.hStd', src: Math.abs(V8.hStd - V8D.hStd) > 1e-9 ? '입력' : '가정', g: 'DC', on: dcOn && frMode !== 'OFF', note: 'v2.8 은 DC 기준층 층고 (기본 6m) 기준 — 사례 C 는 하한 18 < 사슬 27 이라 영향 없음' });
      lib('ptAll', 'PT 1일 항상 (1) / PT 슬래브만 (0)', '', 'v2.8', '규칙', onC4);
      lib('lbSC', '철골 · 강합성 코어선행 v2.8 하한 (1 켬 · 0 끔)', '', '가정', '규칙', corePath && !dcOn && !legacy);
      rule('takt', '층간 ≥ 팀당 Zone × 하루 1 Zone (팀이 적을 때 하한)', '가정', '규칙', onUp);
      rule('lk', '2회 타설 = 사슬 × (1 − 0.3 + 0.3 × 회수) · 층고 보정 (수직재 반복 대신)', '가정', '규칙', onUp);
      rule('tail', '맨 위층 꼬리 = 마지막 Zone 이 층간을 넘는 만큼 (nt − 1)', '가정', '규칙', upCh);
      rule('bTail', '지하 바닥 Zone 간격 (nt − 1) 은 1F 바닥에서 1회', '가정', '규칙', bUsed);
      rule('hQ', '물량 · Zone 은 기준 층고 하나로 (층별 층고는 2회 타설 계수 · 층고 보정으로만) — 층고를 올려도 사이클이 줄지 않음', 'v2.8', '규칙', onUp || lbUsed);
      rule('wallK', '지하 외벽 = 지금 식 (실적값) · 외벽팀 입력 때만 × ⌈둘레 Zone ÷ 팀⌉ ÷ ⌈둘레 Zone ÷ 자동 팀⌉ (하한 ' + V8.wKmin + ')', '가정', '규칙', bUsed);
      rule('c3', '철골 · 강합성 바닥 하한 = v2.8 c3 (기준 층고, v2.8 철골 기본 코어 선행은 c1 만)', '해석', '규칙', lbUsed && steelF);
      rule('c1', '코어 하한 = v2.8 c1 (기준 층고 1개층분) × 수직재 회수', 'v2.8', '규칙', lbUsed);
      rule('scTeams', '철골 · 강합성 코어선행 바닥 · 코어는 옛 식 — 팀 수가 층 사이클을 직접 나눔 (사례 A 보정)', '가정', '규칙', corePath && steelF && !dcOn);
      rule('preCore', '코어선행 코어 = 옛 식 (팀당 Zone × ACS 4 · 갱폼 6 WD/Zone · 시스템폼 셋팅 · 숙련) — RC 바닥은 v2.8 c2 사슬 · Zone 연속', '가정', '규칙', corePath && !steelF && !dcOn);
      rule('c5Lead', '동시타설 철골 = v2.8 c5 (철골 · DECK 선행은 사슬 밖) · 층간 ≥ 선행 (Zone 1개, v2.8 DC 처럼) · 첫 층 선행 1회', 'v2.8', '규칙', onC5);
      rule('post', '코어후행 층간 = max(외주부 사슬, 코어 c1 사슬) — 각각 Zone 연속 · 팀 규칙 (v2.8 cycleFor)', 'v2.8', '규칙', onC1);
      rule('tdT', '역타 슬래브 팀 = 팀당 Zone 으로 한 번 나눔 (v2.8 이중 나눗셈 안 따름)', '가정', '규칙', seq === 'TD');
      rule('guard', 'DC 분할 하한 = 일반 사이클 (기준 층고 hStd) × 회수 · 철골 선행 지배', 'v2.8', '규칙', dcOn && frMode !== 'OFF');
      rule('zStep', 'Zone 수 = ⌈체적 ÷ 1회 타설⌉ · 공종 일수 올림 → 면적이 조금 늘 때 Zone 이 하나 늘면 층 사이클이 1 ~ 2 WD 줄 수 있음 (면적 계단 효과, v2.8 도 같음)', 'v2.8', '규칙', onUp);
      return o;
    }

    /* ── 마감 · T&C : 골조 완료 (지하 포함) 후 */
    /* 기본값 : 일반 마감 8 · T&C 2개월, 데이터센터 마감 6 · T&C 3개월 — 입력하면 입력값
       (일반 8 은 사례 실적 (B 8.0 · A 9.0) 기준. v2.8 일반 마감은 고정값이 아니라 5개 트랙 중 최장 = 사실상 부대토목 트랙 9.0개월 · v2.8 DC 는 마감 6 · T&C 3) */
    var fin = Math.max(0, num(inp.fin, use === 'dc' ? 6.0 : 8.0)), tc = Math.max(0, num(inp.tc, use === 'dc' ? 3.0 : 2.0));
    t = frameDone;
    var finM = fin * R_INT0 / rInt;
    if (fin > 0) { act({ id: 'fin', g: '마감', name: '마감', s: t, e: t + finM, cp: true, basis: '기본값 ' + fin + '개월 (내부 가동률 ' + Math.round(R_INT0 * 1000) / 10 + '% 기준)' + (Math.abs(rInt - R_INT0) > 0.0005 ? ' × ' + Math.round(R_INT0 * 1000) / 10 + ' ÷ ' + Math.round(rInt * 1000) / 10 + ' = ' + r2(finM) + '개월' : '') + ' · 골조 완료 후' }); t += finM; }
    if (tc > 0) { act({ id: 'tc', g: '마감', name: 'T&C (시운전)', s: t, e: t + tc, cp: true, basis: '기본값 ' + tc + '개월' }); t += tc; }
    R.total = t; R.frameEnd = frameDone; R.T_F = T_F; R.EXC_END = EXC_END; R.T_1F = T_1F; R.PRD = PRD; R.F0 = F0; R.found = fz; R.geoRes = geoRes; R.acts = acts;

    /* ── C.P 산식 : C.P 공종을 순서대로 이어 각 공종 기여 = 종료 − 직전 C.P 종료 (중첩 · 대기 반영) */
    var cpLine = [], prevE = 0;
    acts.filter(function (a) { return a.cp; }).forEach(function (a) {
      var e = Math.max(a.e, prevE);
      cpLine.push({ id: a.id, name: a.name, d: e - prevE, e: e });
      prevE = e;
    });
    R.cpLine = cpLine;

    /* ── 그룹 요약 */
    var gsum = { pre: 0, civil: 0, found: 0, base: 0, frame: 0, fin: 0, tc: 0 }, GMAP = { mob: 'pre', demo: 'pre', demoB: 'pre', found: 'found', base: 'base', vert: 'base', frame: 'frame', tdwait: 'frame', fin: 'fin', tc: 'tc' };
    cpLine.forEach(function (c) { gsum[GMAP[c.id] || 'civil'] += c.d; });
    R.gsum = gsum;

    /* 팀수 입력 키 (화면 최적 팀 계산 sweepTeams 용) : key · now (지금 값) · max (훑을 범위 끝) · inp (입력했는지) */
    var tk = [{ key: 'fTeams', label: '기초 철근팀', now: fz.teams, max: 8, inp: num(A.fTeams, 0) > 0 }];
    if (typD) tk.push({ key: 'uTeams', label: '지상 외주부팀', now: typD.P.T, max: Math.max(1, Math.min(8, typD.P.N)), inp: !!uTin }, { key: 'cTeams', label: '코어팀', now: typD.C.T, max: Math.max(1, Math.min(8, typD.C.N)), inp: !!cTin });
    else if (typP) tk.push({ key: 'uTeams', label: '지상 외주부팀', now: typP.P.T, max: Math.max(1, Math.min(8, typP.P.N)), inp: !!uTin }, { key: 'cTeams', label: '코어팀', now: typP.C.T, max: Math.max(1, Math.min(8, typP.C.N)), inp: !!cTin });
    else { tk.push({ key: 'uTeams', label: steelF ? (corePath ? '지상 철골팀' : '지상 바닥팀 (동시타설)') : (corePath ? '지상 바닥 형틀팀' : '지상 형틀팀'), now: typS.T, max: Math.max(1, Math.min(8, typS.Z)), inp: !!uTin }); if (typC) tk.push({ key: 'cTeams', label: '코어 형틀팀', now: typC.T, max: Math.max(1, Math.min(8, typC.Z)), inp: !!cTin }); }
    if (bUsed) {
      /* 외벽팀 max = 하한 (wKmin) 에 닿는 가장 적은 팀 (그 위로는 효과 없음). sweep false = 화면 최적 팀 자동 계산에 넣지 않기를 권장 (외벽 팀 반영은 가정 — 비우면 실적값) */
      var bR1 = base.rows[base.rows.length - 1], wq0 = Math.max(1, cl(base.Zw / base.Tw0)), wMax = Math.min(8, base.Zw);
      for (var tw = base.Tw0; tw <= Math.min(8, base.Zw); tw++) if (cl(base.Zw / tw) / wq0 <= V8.wKmin + 1e-9) { wMax = tw; break; }
      tk.push({ key: 'bTeams', label: '지하 바닥팀', now: bR1.T, max: Math.max(1, Math.min(8, bR1.N)), inp: num(A.bTeams, 0) > 0, sweep: true },
        { key: 'wTeams', label: '지하 외벽팀', now: base.Tw, auto: base.Tw0, max: Math.max(1, Math.min(8, wMax)), inp: num(A.wTeams, 0) > 0, sweep: false });
    }
    if (seq === 'TD' && exc.td) tk.push({ key: 'tdTeams', label: '역타 슬래브팀', now: exc.td.T, max: exc.td.n1, inp: exc.td.tIn });
    tk.forEach(function (x) { if (x.sweep == null) x.sweep = true; });
    R.teamKeys = tk;

    R.review = review(R, L);
    return R;
  }

  function review(R, L) {
    var o = [], b = R.basic, g = R.geo, f = R.found, fr = R.frame;
    function add(cat, text, lvl) { o.push({ cat: cat, text: text, lvl: lvl || 'info' }); }
    add('공통', '가동률 토목 · 외부 ' + r1(b.rExt * 100) + '% / 골조 ' + r1(b.rRC * 100) + '% 적용 — 1개월 = 골조 ' + r1(b.rRC * D) + 'WD · 토목 ' + r1(b.rExt * D) + 'WD (토요일 레미콘 타설 불가 · 악천후 반영)');
    if (Math.abs(b.hF - 1) > 1e-9) add('공통', '1일 작업시간 ' + b.hours + '시간' + (b.hours === 10 ? ' (하이테크 기준)' : '') + ' → 작업량 공종 × ' + r2(b.hF) + ' (양생 · 팀 시차 · 기본값 개월은 고정)');
    if (R.ground.assumed) {
      var zz = g.z, Vt = g.Vtot || 0, Vs = (g.Vexc.soil || 0) + (g.Vexc.wsoil || 0), Vw = g.Vexc.wrock || 0, Vr = (g.Vexc.srock || 0) + (g.Vexc.hrock || 0);
      add('토목', '지반 : ' + R.ground.name + ' 가정 (토사 ~' + r1(zz[1]) + ' · 풍화토 ~' + r1(zz[2]) + ' · 풍화암 ~' + r1(zz[3]) + ' · 연암 ~' + r1(zz[4]) + 'm, 이하 경암)' +
        (b.nB > 0 && Vt > 0 ? ' → 굴착량 중 토사 · 풍화토 ' + Math.round(Vs / Vt * 100) + '% · 풍화암 ' + Math.round(Vw / Vt * 100) + '% · 연암 · 경암 ' + Math.round(Vr / Vt * 100) + '%' : '') + ' — 시추 주상도를 확보하면 직접 입력', 'warn');
    }
    if (b.nB > 0 && isFinite(g.gwl) && g.gwl < g.H) add('토목', '지하수위 GL−' + r1(g.gwl) + 'm < 굴착 깊이 ' + r1(g.H) + 'm → 차수 (SCW · 그라우팅) 와 영구배수 검토', 'warn');
    var rockV = (g.Vexc.srock || 0) + (g.Vexc.hrock || 0), allV = g.Vtot || 1;
    if (rockV > 0) add('토목', '암반 (연암 · 경암) 굴착 ' + fmt(rockV) + '㎥ (' + r1(rockV / allV * 100) + '%) → 발파 · 할암 공법, 진동 · 소음 민원 검토 — 굴착 공기 민감도 큼', rockV / allV > 0.25 ? 'warn' : 'info');
    if (b.sup === 'ANCHOR' && R.exc.anchor) add('토목', '어스앵커 ' + R.exc.anchor.stages + '단 · ' + fmt(R.exc.anchor.total) + '본 → 인접 대지 · 도로 점용 동의 필요, 합벽 끊어치기 (Lift ' + L.base.liftAnchor + 'm)', 'warn');
    if (b.sup === 'STRUT') add('토목', '스트럿 ' + R.exc.ns + '단 → 버팀보 간섭으로 굴착 생산성 × ' + L.exc.methodF.STRUT + ' · 해체 순서와 지하골조 연동');
    if (b.sup === 'OPEN' && b.nB > 0) add('토목', '오픈컷 1:' + L.exc.slope + ' → 굴착 상단 사면 폭 ' + r1(g.slopeW) + 'm 확보 필요 (대지 여유 확인) · 사면 경계 = 외벽 · 방수 · 되메우기 후 인접 기초 (후시공 띠 ' + f.nSlopeZ + ' Zone)', 'warn');
    if (b.seq === 'TD') {
      add('토목', '기준층 (' + R.tdBase.name + ') 슬래브 전 Zone 완료 후 하부 굴착 — 덤프 동선 · 크람쉘 (토사 반출구) 셋팅' + (R.tdBase.off !== 0 ? ' · 기준층이 1F가 아님 → 도로 레벨 = GL로 굴착 깊이 산정' : ''));
      add('골조', '구조제한 : 기초 완료 전 지상 ' + fr.lim + 'F (코어 ' + fr.limC + 'F) / 지하 수직재 완료 전 ' + fr.lim2 + 'F (코어 ' + fr.lim2C + 'F)' + (R.tags.lim === '기본' ? ' — 기본값 = 지하 + 지상 ' + L.td.limTot1 + '개층 / ' + L.td.limTot2 + '개층 (사례 A 지하 8 + 지상 17 / 24)' : '') + ' — 구조 검토로 확정 필요', 'warn');
      if (fr.holds.length) add('골조', '구조제한 대기 발생 : ' + fr.holds.slice(0, 3).map(function (h) { return h.lv + ' ' + r2(h.m) + '개월 (' + h.why + ')'; }).join(' · '), 'warn');
      add('골조', '지하 슬래브는 3 Zone 순환으로 굴착과 병행 (Zone 13WD · 시차 4.5WD)');
    }
    add('기초', '기초 Zone ' + fmt(f.vZ) + '㎥ (1일 타설 한도 800~900㎥) · ' + f.nZ + ' Zone · 철근 ' + f.teams + '팀 × ' + f.crew + '명 · 1팀 = 1 Zone 완결 · 팀 착수 ' + r1(f.lag) + 'WD 시차');
    if (f.nPit) add('기초', 'PIT Zone ' + f.nPit + '개 — 바닥 · 벽체 2회 타설 (+' + r1(f.Rpit - f.R) + 'WD) · 공정 불리 시 25명 증원 조건');
    if (R.pile) add('기초', R.fType === 'PHC' ? 'PHC 파일 ' + R.pile.qty + ' — 시항타 후 본수 확정 · 굴착은 파일 Zone 추종' : '현장타설말뚝 ' + R.pile.qty + ' — 지지층 확인 · 슬라임 처리 시간 반영');
    if (R.geoRes) add('토목', '지열 ' + R.geoRes.n + '공 — 건물 하부 시공으로 C.P (' + L.geo.rigs + '대 × ' + L.geo.rate + '공/일)');
    if (fr.pour) {
      var po = fr.pour;
      var ign = po.sel !== 'AUTO' && po.sel !== po.used;
      add('골조', '타설 순서 : ' + po.name + (po.lock ? ' — ' + po.reason + (ign ? ' (선택 ' + ({ SIM: '동시타설', PRE: '코어선행', POST: '코어후행' })[po.sel] + ' 은 쓰지 않음)' : '')
        : po.sel === 'AUTO' ? ' (자동) — ' + po.reason + ' · 자동 기준은 가정 (사례 보정 전), 공법 검토로 확정' : ' (선택 · 자동이면 ' + po.autoName + ')'), ign ? 'warn' : 'info');
    }
    if (fr.struct === 'SC' && fr.seq === 'PRE') add('골조', '철골 n층 = 코어 n+3층 완료 후 (' + (fr.sysC === 'ACS' ? 'ACS 하부 발판 간섭, ' : '') + '안전측) · 코어 · 외주부 A → B 순환, 타설일 분산');
    if (fr.seq === 'PRE' && (fr.struct === 'RC' || fr.struct === 'SRC') && fr.typ.core) add('골조', 'RC 코어선행 : 코어 ' + fr.typ.core.Z + ' Zone × ' + (fr.sysC === 'ACS' ? 'ACS' : '갱폼') + ' (시스템폼 셋팅 · 숙련 포함) → 바닥 (v2.8 c2 사슬) n층 = 코어 n+' + (fr.pour.rule.rcLag) + '층 완료 후 — 코어 · 바닥 사이 간격 (가정) 은 시스템폼 계획으로 확정');
    if (fr.seq === 'POST' && fr.typ.post) { var tp8 = fr.typ.post; add('골조', '코어후행 : 외주부 (' + tp8.P.ch + ') ' + tp8.P.N + ' Zone · ' + r1(tp8.P.zoneF) + 'WD / 코어 (c1) ' + tp8.C.N + ' Zone · ' + r1(tp8.C.zoneF) + 'WD → ' + tp8.gov + ' 지배 ' + r1(tp8.wd) + 'WD/층 — 코어가 바닥보다 늦게 오르므로 양중 · 계단 동선 (가설 계단 · 호이스트) 확인'); }
    if (fr.seq === 'SIM' && (fr.struct === 'SC' || fr.struct === 'COMP') && !fr.dc) { var t5 = fr.typ.slab; add('골조', '동시타설 ' + (fr.struct === 'SC' ? '철골' : '강합성') + ' (v2.8 c5) : ' + t5.N + ' Zone · ' + t5.T + '팀 · Zone 1개 ' + r1(t5.zone) + 'WD · 철골 · DECK 선행 ' + r1(t5.lead || 0) + 'WD' + (t5.bind === 'steel' ? ' (선행이 층간 지배)' : '') + ' → 층간 ' + r1(t5.wd) + 'WD'); }
    if (fr.struct === 'COMP' || fr.struct === 'SC') {
      var c = fr.typ.core, s2 = fr.typ.slab;
      if (c && c.wd > s2.wd + 0.5) add('골조', '코어 사이클 ' + r1(c.wd) + 'WD > 바닥 ' + r1(s2.wd) + 'WD → 코어가 주공정 · ' + (fr.sysC === 'ACS' ? '코어 Zone 분할' : 'ACS · 원클릭 갱폼 · 코어 슬래브 데크화') + ' 검토', 'warn');
    }
    if (fr.struct === 'RC' || fr.struct === 'SRC') add('골조', '층별 수직재 (5m) → 수평재 2회 타설 · 기준층 ' + fr.typ.slab.Z + ' Zone ÷ ' + fr.typ.slab.T + '팀');
    if (fr.model === 'v28') {
      var t8 = fr.typ.slab;
      add('골조', '일반 바닥 = v2.8 공종 사슬 (' + (t8.flow === 'ZONE' ? 'Zone 연속' : '층 완결') + ') · 기준층 ' + t8.N + ' Zone · ' + t8.T + '팀 (팀당 ' + t8.nt + ') · Zone 1개 ' + r1(t8.zone) + 'WD → 층간 ' + r1(t8.wd) + 'WD — 겹침 3곳 (테이블폼 · 형틀 · DECK) 은 사례 B 보정 가정 · v2.8 소요 작업조 ' + t8.need + '팀 (v2.8 간격 사슬 ' + r1(t8.zone28) + 'WD 기준, 참고)');
      if (t8.tIn && t8.T < t8.T0) add('골조', '형틀팀 입력 ' + t8.T + '팀 < v2.8 기준 ' + t8.T0 + '팀 (Zone 4개당 1팀) — v2.8 사슬은 팀 수가 층간을 나누지 않아 (하루 1 Zone 하한 · 맨 위층 꼬리만) 팀이 적어도 층 사이클이 거의 같음 → 팀당 ' + t8.nt + ' Zone 을 공종별 작업조가 따라가는지 확인', 'warn');
    }
    if ((fr.struct === 'SC' || fr.struct === 'COMP') && !fr.dc && fr.seq === 'PRE') add('골조', '철골 · 강합성 코어선행 바닥 · 코어 = 옛 식 (팀당 Zone × Zone당 WD — 팀 수가 층 사이클을 직접 나눔, 사례 A 보정)' + (fr.v28.lb ? ' · v2.8 사슬 하한 (코어 c1 · 바닥 c3) 켬 (v28.lbSC 1)' : ' · v2.8 c1 · c3 하한은 끔 (v28.lbSC 0 — 근거 부족)'));
    if (fr.coreRows.some(function (x) { return x.lb && x.lb.on; }) || fr.slabRows.some(function (x) { return x.lb && x.lb.on; })) add('골조', 'v2.8 사슬 하한에 걸린 층 있음 (코어 c1 · 바닥 c3) → 팀을 늘려도 층 사이클이 줄지 않음');
    if (b.seq === 'BU' && b.nB > 0 && R.base && !R.base.partial && R.base.model !== 'v28') add('골조', '지하 바닥 = 옛 식 (면적 900㎡ Zone 순환) — v2.8 지하 공종 사슬은 끔 (adv.bChain \'ON\' 이면 켬 · 사례 B 지하골조 실적 3.8개월 : 옛 식 4.1 · v2.8 사슬 4.9)');
    if (R.base && R.base.model === 'v28') { var bl = R.base.rows[R.base.rows.length - 1]; add('골조', '지하 바닥 = v2.8 공종 사슬 · 1F 바닥 ' + bl.N + ' Zone · ' + bl.T + '팀 · 외벽 둘레 ' + R.base.Zw + ' Zone · ' + R.base.Tw + '팀' + (R.base.wIn ? ' (입력, 자동 ' + R.base.Tw0 + '팀 대비 × ' + r2(R.base.wK) + ' — 가정)' : ' (자동 = 지금 외벽 실적값)')); }
    /* DC (v2.8 검토 규칙) */
    if (b.use === 'dc' && b.seq === 'TD') add('공법', 'DC 는 순타 기본 — 역타면 DC 층 사이클 미적용 (일반 골조 사이클로 계산)', 'warn');
    if (fr.dc && fr.typ.dc) {
      var d8 = fr.typ.dc, nT8 = d8.P.T + d8.C.T, mx8 = nT8 * L.dc.pourV, V8t = d8.P.V + d8.C.V;
      add('골조', 'DC 동시 타설량 : 작업일 평균 약 ' + fmt(V8t / Math.max(0.1, d8.wd)) + '㎥/일 (기준층 ' + fmt(V8t) + '㎥ ÷ 층간 ' + r1(d8.wd) + 'WD) · 최대 ' + fmt(mx8) + '㎥/일 (외주부 ' + d8.P.T + '팀 + 코어 ' + d8.C.T + '팀 × ' + fmt(L.dc.pourV) + '㎥)' + (mx8 > 2500 ? ' → 레미콘 공급 확인 (겹치는 날은 타설일 조정, 공기 미반영)' : ''));
      if (!(num(R.inp.adv && R.inp.adv.coreA, 0) > 0)) add('골조', '코어 면적 자동 (기준층 × ' + Math.round(L.frame.core.ratio * 100) + '% = ' + fmt(d8.Ac) + '㎡) — 도면 코어 면적 입력 권장 (DC 는 층 콘크리트량 영향 큼)');
    }
    var hi = R.geo.hUp.filter(function (h) { return h >= 6; }).length;
    if (hi) add('골조', '층고 6m 이상 ' + hi + '개층 → 사이클 할증 (층고 ' + L.frame.hRef + 'm 초과 1m당 +' + Math.round(L.frame.hK * 100) + '%) · 코어는 ' + L.frame.core.liftMax + 'm 초과 시 2 Lift');
    if (b.nB > 0) add('가설', '램프 · 사면 · 1F 개구부 등 가설 동선 점유 구역 = 후시공 Zone (골조 후시공) 으로 계획');
    if (g.site > 0 && ((isFinite(g.coverage) && g.coverage > 0.6) || g.site < 6000)) add('가설', '협소 대지 (건폐율 ' + (isFinite(g.coverage) ? r1(g.coverage * 100) + '%' : '-') + ') → 1F 물류 혼잡 : 레미콘 동선 B1 분리 · 철근 선조립장 · 야적장 확보 검토', 'warn');
    if (b.seq === 'BU' && b.nB >= 5) add('공법', '지하 ' + b.nB + '개층 순타 — 굴착 공기가 길면 역타 (지상 동시 진행) 와 비교 검토', 'warn');
    if (b.seq === 'TD' && b.nB <= 2) add('공법', '지하 ' + b.nB + '개층 역타 — 역타 효과가 작음, 순타와 비교 검토', 'warn');
    return o;
  }

  /* ── 실적 사례 (검증 세트) — 현장명은 표기하지 않음 */
  /* adv.uTeams (지상 외주부팀) · cTeams (코어 형틀팀) · bTeams (지하 바닥팀) · wTeams (지하 외벽팀) · tdTeams (역타 슬래브팀) · pitN (PIT Zone 수) = 엔진 기본 규칙 값 그대로
     — 화면이 빈 팀수를 최적값으로 채울 때 사례 재현값이 바뀌지 않게 고정. 사례 B 의 bTeams · wTeams 는 지하 v2.8 사슬 (adv.bChain 'ON') 일 때만 쓰임 (기본 끔 — 켤 때 재현용으로 남김)
     타설 순서 (adv.pourSeq) 는 비움 = 자동 (A 철골 31층 → 코어선행 · B RC 17층 → 동시타설 · C DC) — 사례 실적과 같음. LIB.seq 기준을 바꿔 사례가 다른 순서로 넘어가면 그때 사례에 pourSeq 를 적을 것 */
  var REFS = [
    { key: 'refA', name: '사례 A', loc: '도심 업무시설', seq: 'TD', struct: 'SC', nB: 8, nUp: 31, total: 50.0, cmp: 50.0, frame: 9.5,
      actual: [['MOB + 흙막이', 4.5, ['mob', 'wall']], ['PRD', 2.8, ['prd']], ['지열', 2.6, ['geo']], ['1차 터파기', 0.5, ['exc1']], ['1F 슬래브', 1.6, ['f1']], ['지하 터파기', 16.1, ['exc']], ['기초', 1.4, ['found']], ['지상골조', 9.5, ['frame']], ['마감', 9.0, ['fin']], ['T&C', 2.0, ['tc']]],
      src: '실제 공정계획 (역타 · 철골 + ACS 코어)',
      inp: { name: '사례 A (역타 · 업무시설)', use: 'office', site: 4802, bldg: 2768.32, gfaUp: 60398.2, aDn: 3833.23, nB: 8, nUp: 31, nPH: 2,
        ground: 'CUSTOM', strata: [12, 9, 2, 8.6], gwl: 4.0, seq: 'TD', wall: 'CIP', support: 'SLAB', scw: false, found: 'MAT', geo: 110, struct: 'SC', pt: false, coreSys: 'ACS',
        mob: 1.0, fin: 9.0, tc: 2.0, rExt: 0.702, rRC: 0.584, hours: 8, link: false,
        adv: { dH: -0.2, Aexc: 4416, P: 265.8, mat: 2.1, fTeams: 2, uTeams: 1, cTeams: 1, tdTeams: 1, pitN: 1, crew: 20, lag: 5, prdN: 54,
          hSpec: 'B1:7.6, B2:4.6, B3:3.7, B4:3.55, B5:3.55, B6:3.55, B7:3.55, B8:7.3, 1:4.25, 2:4.0, 3:8.25, 4-7:5.55, 8-28:4.65, 29:6.0, 30:7.75, 31:7.2, PH1:7.35, PH2:5.6' } } },
    { key: 'refB', name: '사례 B', loc: '도심 업무시설 (기존 건물 해체 후 신축)', seq: 'BU', struct: 'RC', nB: 2, nUp: 17, total: 51.5, cmp: 43.0, frame: 15.8,
      actual: [['MOB', 1.0, ['mob']], ['흙막이', 2.6, ['wall']], ['터파기 (지하해체 병행)', 5.9, ['exc']], ['지열', 2.3, ['geo']], ['기초', 1.6, ['found']], ['지하골조', 3.8, ['base']], ['지상골조', 15.8, ['frame']], ['마감', 8.0, ['fin']], ['T&C', 2.0, ['tc']]],
      excl: '지상해체 6.5 · 인수인계 2.0 제외 → 비교 기준 43.0개월',
      src: '실제 공정계획 (순타 · 어스앵커 · RC)',
      inp: { name: '사례 B (순타 · 업무시설)', use: 'office', site: 15840, bldg: 9277.72, gfaUp: 65120.01, aDn: 10818.61, nB: 2, nUp: 17, nPH: 1,
        ground: 'CUSTOM', strata: [6, 4, 4, 8], gwl: 8.0, seq: 'BU', wall: 'CIP', support: 'ANCHOR', scw: false, found: 'MAT', geo: 90, struct: 'RC', pt: false, coreSys: 'AUTO',
        mob: 1.0, fin: 8.0, tc: 2.0, rExt: 0.649, rRC: 0.597, hours: 8, link: false,
        adv: { mat: 1.7, crew: 30, rebar: 0.10, fTeams: 3, uTeams: 3, bTeams: 6, wTeams: 3, pitN: 3, lag: 0, exVoidA: 7700, exVoidD: 14.5,
          hSpec: 'B1:6.0, B2:8.6, 1:4.2, 2:4.8, 3-8:6.6, 9-16:4.8, 17:6.8, PH:6.3' } } },   /* '26.11 v2.8 공종 사슬 적용 → 면적 Zone 보정값 zSpec '1-8:11, 9-17:4' 삭제 (체적 Zone 8 ~ 11 이 대신함) */
    { key: 'refC', name: '사례 C', loc: '데이터센터 (산업단지)', seq: 'BU', struct: 'COMP', nB: 1, nUp: 5, total: 29.0, cmp: 29.0, frame: 10.2,
      actual: [['MOB', 1.0, ['mob']], ['토공 (SCW · PHC · 굴착)', 5.5, ['scw', 'pile', 'exc']], ['기초 · 지하골조', 3.8, ['found', 'base']], ['지상골조', 10.2, ['frame']], ['마감', 6.5, ['fin']], ['T&C', 2.0, ['tc']]],
      excl: '지상골조 10.2 = 입찰안 (DH보) 기준',
      src: '입찰 공정계획 (순타 · 오픈컷 · 강합성)',
      inp: { name: '사례 C (오픈컷 · 데이터센터)', use: 'dc', site: 47620, bldg: 20690.67, gfaUp: 75883.07, aDn: 4217.83, nB: 1, nUp: 5, nPH: 1,
        ground: 'CUSTOM', strata: [22, 4, 6, 6], gwl: 3.5, seq: 'BU', wall: 'NONE', support: 'OPEN', scw: true, found: 'PHC', geo: 0, struct: 'COMP', pt: false, coreSys: 'GANG',
        mob: 1.0, fin: 6.5, tc: 2.0, rExt: 0.702, rRC: 0.586, hours: 8, link: false,
        adv: { dH: 0.1, mat: 1.9, crew: 30, fTeams: 5, uTeams: 3, cTeams: 3, pitN: 4, lag: 1, liftWD: 6, backfill: 12,
          hSpec: 'B1:6.7, 1:9.8, 2:5.5, 3:4.5, 4:5.5, 5:4.5, PH:7.5' } } }   /* '26.10.28 DC 층 사이클 적용 → 면적 Zone 보정값 zSpec '1-5:18' 삭제 (체적 Zone 사용) */
  ];

  function similarity(R) {
    var b = R.basic;
    return REFS.map(function (r) {
      if (!r.inp) return { ref: r, score: null };
      var sc = 0;
      sc += (r.seq === b.seq ? 40 : 0);
      sc += (r.struct === b.struct ? 25 : ((r.struct === 'SC' || r.struct === 'COMP') === (b.struct === 'SC' || b.struct === 'COMP') ? 12 : 0));
      sc += 20 * Math.max(0, 1 - Math.abs(r.nB - b.nB) / 8);
      sc += 15 * Math.max(0, 1 - Math.abs(r.nUp - b.nUp) / 30);
      return { ref: r, score: Math.round(sc) };
    });
  }

  /* 사례 재현 검증 : 사례 조건 입력 → 에이전트 산정 vs 실제 */
  function validate(LIB) {
    return REFS.filter(function (r) { return r.inp && r.actual; }).map(function (r) {
      var R = compute(r.inp, LIB), byId = {};
      R.cpLine.forEach(function (c) { byId[c.id] = (byId[c.id] || 0) + c.d; });
      var rows = r.actual.map(function (a) { var v = 0; a[2].forEach(function (id) { v += byId[id] || 0; }); return { label: a[0], actual: a[1], agent: v }; });
      return { ref: r, total: R.total, rows: rows };
    });
  }

  var CP_SHORT = { mob: 'MOB', demo: '지상 해체', demoB: '지하 해체', wall: '흙막이', scw: '차수 SCW', prd: 'PRD', geo: '지열', pile: '파일', exc1: '1차 터파기', f1: '1F 슬래브', exc: '터파기', found: '기초', base: '지하골조', vert: '지하 수직재', tdwait: '지상 착수 준비', frame: '지상골조', fin: '마감', tc: 'T&C' };

  /* 민감도 : 작업량으로 정해지는 모든 생산성 · 작업일을 ±15% (양생 · 팀 시차 · 기본값 개월 · 착수 시점은 고정) */
  function sensitivity(inp, LIB) {
    function scaled(f) {
      var L = JSON.parse(JSON.stringify(LIB || defaultLib())), I = JSON.parse(JSON.stringify(inp)), A = I.adv || (I.adv = {});
      var mul = function (o, k) { o[k] *= f; }, div = function (o, k) { o[k] /= f; };
      ['BU', 'TD'].forEach(function (m) { LK.forEach(function (k) { mul(L.exc[m], k); }); });
      Object.keys(L.wall).forEach(function (w) { var W = L.wall[w]; if (typeof W.rate === 'number') W.rate *= f; else LK.forEach(function (k) { mul(W.rate, k); }); });
      LK.forEach(function (k) { mul(L.prd.rate, k); }); div(L.prd, 'setup');
      Object.keys(L.support).forEach(function (s) { div(L.support[s], 'pen'); if (L.support[s].rate) mul(L.support[s], 'rate'); });
      mul(L.geo, 'rate'); mul(L.pile.PHC, 'rate'); mul(L.pile.BORED, 'rate');
      mul(L.found, 'tPerMD'); div(L.found, 'prep'); div(L.found, 'tail'); div(L.found, 'pitAdd');
      ['liftWD', 'slabD', 'backfill', 'minSlab'].forEach(function (k) { div(L.base, k); });
      ['f1Zone', 'f1Lag', 'setup', 'vertFirst', 'vertNext'].forEach(function (k) { div(L.td, k); });
      ['d', 'minTact', 'zoneDur'].forEach(function (g) { Object.keys(L.frame[g]).forEach(function (k) { div(L.frame[g], k); }); });
      div(L.frame.core, 'ACS'); div(L.frame.core, 'GANG'); div(L.frame, 'acsSetup');
      ['tPerMD', 'table', 'steelPc', 'deck'].forEach(function (k) { mul(L.dc, k); }); ['lift', 'form', 'scaf', 'bform', 'coreForm', 'me', 'bolt'].forEach(function (k) { div(L.dc, k); });
      L.v28 = Object.assign(defaultV28(), L.v28 || {});
      ['tPerMD', 'table', 'steelPc', 'deck'].forEach(function (k) { mul(L.v28, k); }); ['lift', 'wform', 'form', 'form2', 'me', 'bolt', 'ptAdd'].forEach(function (k) { div(L.v28, k); });
      if (num(A.liftWD, 0) > 0) A.liftWD /= f;
      if (num(A.fRwd, 0) > 0) A.fRwd /= f;
      if (A.backfill != null && A.backfill !== '' && isFinite(parseFloat(A.backfill))) A.backfill = parseFloat(A.backfill) / f;
      return compute(I, L).total;
    }
    return { lo: scaled(1.15), hi: scaled(0.85) };
  }

  var API = { GROUND: GROUND, compute: compute, validate: validate, CP_SHORT: CP_SHORT, defaultLib: defaultLib, parseSpec: parseSpec, REFS: REFS, similarity: similarity, sensitivity: sensitivity, LN: LN, LK: LK, USE_H: USE_H, STRUCT_N: STRUCT_N, POUR_N: POUR_N, WALL_N: WALL_N, SUP_N: SUP_N, FOUND_N: FOUND_N, r1: r1, r2: r2, fmt: fmt, D: D };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.GE = API;
})(this);

