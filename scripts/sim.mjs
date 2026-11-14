// Équilibrage : `npm run sim -- 500` fait jouer l'ordinateur contre lui-même.
// Options : `hp=30` change une règle, `katana=f4,p1` essaie d'autres effets pour une carte.
import { simulate } from '../src/ai.js';
import { RULES } from '../src/engine.js';
import { C } from '../src/cards.js';
const n = +process.argv[2] || 400;
for (const a of process.argv.slice(3)) {
  const [k, v] = a.split('=');
  if (k in RULES) RULES[k] = +v;
  else C[k].fx = v.split(',').map(e => { const [, t, num, cd] = e.match(/^([a-z]+)(\d+)(?::(\w+))?$/); return cd ? [t, +num, cd] : [t, +num]; });
}
console.log(process.argv.slice(3).join(' ') || 'réglages actuels', JSON.stringify(await simulate(n)));
