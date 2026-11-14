// Moteur du jeu : règles pures, sans affichage (utilisé aussi par scripts/sim.mjs).
import { C, D, CLANS, START, ICON, pl } from './cards.js';

export const RULES = { hp: 25, hand: 5, plays: 3, firstPlays: 2, nightCost: 2, nightCoins: 3 };

export let G = null;
export const setG = g => { G = g; };
// L'interface branche ici son affichage ; en simulation tout reste vide.
export const hooks = { render() {}, pop() {}, phaseChange() {}, sleep: () => null };

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Paquet d'achat : 2 exemplaires de chaque carte, 1 seul pour les plus chères.
const pool = (clan, one) => shuffle(D.filter(d => d[1] === clan && d[4] > 0).flatMap(d => (d[4] >= one ? [d[0]] : [d[0], d[0]])));

export const phase = () => (((G.round - 1) % 4) < 2 ? 'jour' : 'nuit');
export const wildNeed = id => C[id].cost + (phase() === 'nuit' ? RULES.nightCost : 0);
export const say = m => { G.log.push(m); if (G.log.length > 40) G.log.shift(); };
export const nameOf = pi => (G.P[pi].human ? 'Tu' : 'Le clan ' + CLANS[G.P[pi].clan].name);
const verb = (pi, tu, il) => (G.P[pi].human ? tu : il);

export function draw(p, n) {
  for (let i = 0; i < n; i++) {
    if (!p.deck.length) { if (!p.disc.length) return; p.deck = shuffle(p.disc); p.disc = []; }
    p.hand.push(p.deck.pop());
  }
}

export function newState(clan, sim) {
  const other = clan === 'sam' ? 'nin' : 'sam';
  const mk = (c, human) => ({ clan: c, human, hp: RULES.hp, arm: 0, garde: 0, deck: shuffle(START[c].slice()), hand: [], disc: [],
    shop: [], shopDeck: pool(c, 6), less: 0, caught: 0 });
  const g = { round: 1, turn: 0, P: [mk(clan, !sim), mk(other, false)], market: [], marketDeck: pool('neu', 6), wild: [], wildDeck: pool('yok', 6),
    coins: 0, force: 0, nPlayed: 0, plays: 0, bought: {}, first: true, over: false, winner: -1, log: [], sel: null, busy: false, sim: !!sim,
    confirmEnd: false, table: { pi: 0, cards: [] }, tableStale: false };
  g.P.forEach(p => { for (let i = 0; i < 3; i++) p.shop.push(p.shopDeck.pop()); draw(p, RULES.hand); });
  for (let i = 0; i < 4; i++) g.market.push(g.marketDeck.pop());
  for (let i = 0; i < 2; i++) g.wild.push(g.wildDeck.pop());
  return g;
}

function hit(ti, n, direct) {
  const t = G.P[ti]; let blocked = 0;
  if (!direct) { const a = Math.min(t.arm, n); t.arm -= a; n -= a; const g = Math.min(t.garde, n); t.garde -= g; n -= g; blocked = a + g; }
  t.hp = Math.max(0, t.hp - n);
  if (t.hp <= 0 && !G.over) { G.over = true; G.winner = 1 - ti; }
  return { blocked, lost: n };
}

export function beginTurn(pi) {
  const p = G.P[pi]; G.turn = pi; p.arm = 0; G.coins = 0; G.force = 0; G.nPlayed = 0;
  G.bought = { shop: false, market: false }; G.confirmEnd = false; G.tableStale = true;
  G.plays = Math.max(1, RULES.plays - p.less);
  if (p.less) say(`💤 ${nameOf(pi)} ${verb(pi, 'joues', 'joue')} ${pl(p.less, 'carte')} de moins ce tour.`);
  p.less = 0;
  if (G.first) { G.plays = RULES.firstPlays; G.first = false; }
}

export const condAt = (cd, np) => !cd || (cd === 'jour' || cd === 'nuit' ? phase() === cd : cd === 'combo' ? np >= 3 : np === 1);

// Ce que rapporte une carte si elle est jouée en np-ième position (par défaut : maintenant).
export function gains(pi, id, np = G.nPlayed + 1, extraShield = 0) {
  const p = G.P[pi], out = {};
  const add = (k, n) => { if (n) out[k] = (out[k] || 0) + n; };
  for (const [k, n, cd] of C[id].fx) {
    if (!condAt(cd, np)) continue;
    if (k === 'fc') add('f', n * np);
    else if (k === 'fb') add('f', Math.min(n, p.arm + p.garde + extraShield + (out.a || 0) + (out.g || 0)));
    else add(k, n);
  }
  return out;
}
export function gainStr(g) {
  const parts = [];
  for (const k of ['f', 'x', 'o', 'g', 'a', 's', 'p']) if (g[k]) parts.push((k === 'x' ? '' : '+') + g[k] + ICON[k]);
  if (g.j) parts.push('⏩'); if (g.sl) parts.push('💤');
  return parts.join(' ');
}

export function playCard(pi, i) {
  const p = G.P[pi]; if (G.plays <= 0 || !p.hand[i]) return null;
  const id = p.hand.splice(i, 1)[0];
  G.nPlayed++; G.plays--;
  const g = gains(pi, id, G.nPlayed);
  if (G.tableStale) { G.table = { pi, cards: [] }; G.tableStale = false; }
  G.table.cards.push({ id, g: gainStr(g) });
  G.force += g.f || 0; G.coins += g.o || 0; p.arm += g.a || 0; p.garde += g.g || 0; G.plays += g.j || 0;
  if (g.s) p.hp = Math.min(RULES.hp, p.hp + g.s);
  if (g.p) draw(p, g.p);
  if (g.sl) G.P[1 - pi].less += g.sl;
  if (g.x) { hit(1 - pi, g.x, true); hooks.pop(1 - pi, '−' + g.x + ' 💥', 'bad'); }
  return id;
}

export function buy(pi, zone, i) {
  const p = G.P[pi], arr = zone === 'shop' ? p.shop : G.market, deck = zone === 'shop' ? p.shopDeck : G.marketDeck, id = arr[i];
  if (!id || C[id].cost > G.coins) return false;
  G.coins -= C[id].cost; p.disc.push(id); arr.splice(i, 1); if (deck.length) arr.push(deck.pop());
  G.bought[zone] = true; say(`${nameOf(pi)} ${verb(pi, 'achètes', 'achète')} ${C[id].emo} ${C[id].name}.`); return true;
}

export function capture(pi, i) {
  const p = G.P[pi], id = G.wild[i]; if (!id) return false;
  const need = wildNeed(id); if (need > G.force) return false;
  G.force -= need; p.disc.push(id); p.caught++; G.wild.splice(i, 1); if (G.wildDeck.length) G.wild.push(G.wildDeck.pop());
  let bonus = ''; if (phase() === 'nuit') { G.coins += RULES.nightCoins; bonus = ` (+${RULES.nightCoins} 🪙)`; }
  say(`${nameOf(pi)} ${verb(pi, 'captures', 'capture')} ${C[id].emo} ${C[id].name} !${bonus}`); return true;
}

// La carte la plus ancienne d'un étal repart sous le paquet (si rien n'y a été acheté).
const cycle = (arr, deck) => { if (deck.length && arr.length) { deck.unshift(arr.shift()); arr.push(deck.pop()); } };

// Fin de tour : la force restante frappe, la main part à la défausse et la nouvelle main est piochée tout de suite.
export async function finishTurn(pi) {
  const p = G.P[pi];
  if (G.force > 0) {
    const r = hit(1 - pi, G.force);
    say(`${nameOf(pi)} ${verb(pi, 'attaques', 'attaque')} avec ${G.force} ⚔️ : ${r.blocked ? r.blocked + ' bloqués, ' : ''}−${r.lost} ❤️`);
    hooks.pop(1 - pi, r.lost ? '−' + r.lost : 'Bloqué !', r.lost ? 'bad' : 'good', true);
    G.force = 0; hooks.render(); await hooks.sleep(750);
  }
  if (G.table.pi === pi && !G.tableStale) p.disc.push(...G.table.cards.map(c => c.id));
  p.disc.push(...p.hand); p.hand = [];
  if (G.over) return;
  draw(p, RULES.hand);
  if (!G.bought.shop) cycle(p.shop, p.shopDeck);
  if (!G.bought.market) cycle(G.market, G.marketDeck);
  if (pi === 1) {
    const before = phase(); G.round++;
    if (phase() !== before) { cycle(G.wild, G.wildDeck); say(phase() === 'nuit' ? '🌙 La nuit tombe.' : '☀️ Le jour se lève.'); hooks.phaseChange(); await hooks.sleep(1500); }
  }
}

// Toutes les cartes d'un joueur (deck complet), pour les compteurs.
export const total = p => p.deck.length + p.disc.length + p.hand.length;
