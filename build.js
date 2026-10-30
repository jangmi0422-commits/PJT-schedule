/* 빌드 : v/<ver>.html 의 자리표시를 kit.css · engine.js · kit.js · v/ui-<ver>.js 로 채워 dist/ 에 한 파일로 낸다
   사용 : node build.js        (기본 o7 → dist/option7.html)
          node build.js o7 …   */
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
}

const vers = process.argv.slice(2);
(vers.length ? vers : ['o7']).forEach(build);
