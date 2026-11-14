// L'adversaire joué par l'ordinateur, et la simulation d'équilibrage.
import { C } from './cards.js';
import { G, setG, hooks, RULES, newState, beginTurn, playCard, buy, capture, finishTurn, gains, wildNeed } from './engine.js';

// Cherche la meilleure suite de cartes à jouer dans la main actuelle et renvoie l'indice de la première (-1 = rien).
export function aiPlan(pi) {
  const p = G.P[pi], hand = p.hand;
  const wo = G.round <= 5 ? 1.2 : G.round <= 10 ? 0.8 : 0.4;
  const val = g => (g.f || 0) + (g.x || 0) * 1.4 + (g.o || 0) * wo + (g.g || 0) * 0.9 + (g.a || 0) * 0.7
    + Math.min(g.s || 0, RULES.hp - p.hp) * 0.5 + (g.p || 0) * 0.7 + (g.sl || 0) * 2.5 + (g.j ? 0.2 : 0);
  let bestV = 0, bestI = -1;
  const rec = (used, np, plays, acc, first, shield) => {
    if (acc > bestV) { bestV = acc; bestI = first; }
    if (plays <= 0 || used.length >= 5) return;
    const seen = new Set();
    for (let i = 0; i < hand.length; i++) {
      if (used.includes(i) || seen.has(hand[i])) continue; seen.add(hand[i]);
      const g = gains(pi, hand[i], np + 1, shield);
      rec([...used, i], np + 1, plays - 1 + (g.j || 0), acc + val(g), first < 0 ? i : first, shield + (g.a || 0) + (g.g || 0));
    }
  };
  rec([], G.nPlayed, G.plays, 0, -1, 0);
  return bestI;
}

export async function aiTurn(pi) {
  const p = G.P[pi], o = G.P[1 - pi];
  beginTurn(pi); hooks.render(); await hooks.sleep(700);
  for (let guard = 0; guard < 12 && !G.over; guard++) {
    const i = aiPlan(pi); if (i < 0) break;
    playCard(pi, i); hooks.render(); await hooks.sleep(900);
  }
  if (G.over) return;
  for (let guard = 0; guard < 6; guard++) {
    if (G.force >= o.hp + o.arm + o.garde) break; // de quoi gagner : on garde la force
    let pick = -1, pv = 0;
    G.wild.forEach((id, i) => { const need = wildNeed(id); if (need <= G.force && need > pv && (G.round <= 6 || need <= G.force * 0.5 || C[id].cost >= 8)) { pv = need; pick = i; } });
    if (pick < 0) break; capture(pi, pick); hooks.render(); await hooks.sleep(800);
  }
  for (let guard = 0; guard < 6; guard++) {
    let best = null, bs = 0;
    const look = (zone, arr) => arr.forEach((id, i) => {
      const c = C[id]; if (c.cost > G.coins) return;
      let s = c.cost * 10 + (zone === 'shop' ? 3 : 0) + Math.random() * 2;
      if (G.round > 8 && c.fx.every(f => f[0] === 'o')) s -= 30;
      if (s > bs) { bs = s; best = [zone, i]; }
    });
    look('shop', p.shop); look('market', G.market);
    if (!best) break; buy(pi, best[0], best[1]); hooks.render(); await hooks.sleep(800);
  }
  await finishTurn(pi);
}

// n parties ordinateur contre ordinateur : victoires par clan, avantage du premier joueur, durée moyenne.
export async function simulate(n) {
  const keep = G, res = { sam: 0, nin: 0, premier: 0, tours: 0, max: 0 };
  for (let i = 0; i < n; i++) {
    setG(newState(i % 2 ? 'sam' : 'nin', true)); let t = 0;
    while (!G.over && G.round < 120) { await aiTurn(t); t = 1 - t; }
    if (G.over) { res[G.P[G.winner].clan]++; if (G.winner === 0) res.premier++; }
    res.tours += G.round; res.max = Math.max(res.max, G.round);
  }
  res.tours = +(res.tours / n).toFixed(1); setG(keep); return res;
}
