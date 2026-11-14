// Captures d'écran de contrôle : `node scripts/shots.mjs <dossier>` (après `npm run build`).
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // Playwright installé globalement
import { fileURLToPath } from 'node:url';
const out = process.argv[2] || '.';
const page = 'file://' + fileURLToPath(new URL('../dist/index.html', import.meta.url));
const b = await chromium.launch();
const only = process.argv[3];
for (const [w, h, tag, mobile] of [[760, 340, 'iphone', false], [1180, 760, 'ipad', false], [390, 700, 'debout', true]]) {
  if (only && only !== tag) continue;
  const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, isMobile: mobile });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto(page); await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/${tag}-accueil.png` });
  await p.click('#pick-nin'); await p.waitForTimeout(600);
  await p.click('#hand .card'); await p.waitForTimeout(200);
  await p.screenshot({ path: `${out}/${tag}-fiche.png` });
  for (let t = 0; t < 4; t++) {
    for (let k = 0; k < 8 && await p.$('#hand .card:not(.no)'); k++) { await p.click('#hand .card:not(.no)'); if (await p.$('#act:not([disabled])')) await p.click('#act'); }
    const buyable = await p.$('#shop .card:not(.no), #market .card:not(.no)');
    if (buyable) { await buyable.click(); await p.click('#act'); }
    if (t === 1) await p.screenshot({ path: `${out}/${tag}-joue.png` });
    if (t === 3) { await p.click('[data-pile=deck]'); await p.waitForTimeout(150); await p.screenshot({ path: `${out}/${tag}-pioche.png` }); }
    await p.click('#end-turn'); if (await p.evaluate(() => document.querySelector('#end-turn').textContent.includes('quand'))) await p.click('#end-turn');
    if (t === 0) { await p.waitForTimeout(3200); await p.screenshot({ path: `${out}/${tag}-adverse.png` }); }
    await p.waitForFunction(() => !document.querySelector('#end-turn').disabled, null, { timeout: 40000 });
  }
  const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, iw: innerWidth, ih: innerHeight,
    info: document.querySelector('#info').clientHeight, mw: document.querySelector('#app').style.getPropertyValue('--mw'), hw: document.querySelector('#app').style.getPropertyValue('--hw'),
    centre: [document.querySelector('#center').scrollHeight, document.querySelector('#center').clientHeight] }));
  console.log(tag, JSON.stringify(m), 'erreurs', errs.filter(e => !/font|ERR_/i.test(e)));
  await p.close();
}
await b.close();
