/* 빌드 : v/<ver>.html 의 자리표시를 kit.css · engine.js · kit.js · v/ui-<ver>.js 로 채워 dist/ 에 한 파일로 낸다
   사용 : node build.js           (기본 o7 → dist/option7.html)
          node build.js o7 …
          node build.js release   (o7 을 releases/공기산정 에이전트_vN.html 로 — N 은 있는 것 다음 번호, 탭 제목도 같은 이름) */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = { o7: 'option7.html' };
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

function build(ver) {
  const tpl = rd('v/' + ver + '.html');
  const parts = {
    '/*__KITCSS__*/': rd('kit.css').replace(/\n$/, ''),
    '/*__ENGINE__*/': rd('engine.js').replace(/\n$/, ''),
    '/*__KIT__*/': rd('kit.js').replace(/\n$/, ''),
    '/*__UI__*/': rd('v/ui-' + ver + '.js').replace(/\n$/, ''),
  };
  let html = tpl;
  for (const [k, v] of Object.entries(parts)) {
    if (!html.includes(k)) throw new Error(ver + ' : 자리표시 ' + k + ' 없음');
    html = html.replace(k, () => v);
  }
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  const out = path.join(ROOT, 'dist', OUT[ver] || ver + '.html');
  fs.writeFileSync(out, html);
  console.log(ver, '→', path.relative(ROOT, out), (html.length / 1024).toFixed(0) + 'KB');
  return html;
}

const REL = path.join(ROOT, 'releases'), REL_NAME = '공기산정 에이전트_v';
function release() {
  fs.mkdirSync(REL, { recursive: true });
  const n = fs.readdirSync(REL).reduce((m, f) => { const x = f.startsWith(REL_NAME) && /^(\d+)\.html$/.exec(f.slice(REL_NAME.length)); return x ? Math.max(m, +x[1]) : m; }, 0) + 1;
  const name = REL_NAME + n;
  const html = build('o7').replace(/<title>[^<]*<\/title>/, () => '<title>' + name + '</title>');
  fs.writeFileSync(path.join(REL, name + '.html'), html);
  console.log('release →', 'releases/' + name + '.html');
}

const vers = process.argv.slice(2);
if (vers[0] === 'release') release();
else (vers.length ? vers : ['o7']).forEach(build);
