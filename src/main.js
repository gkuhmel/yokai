// Interface : plateau en paysage, fiche de carte à droite, tour du joueur.
import './style.css';
import { C, CLANS, LORE, FXT, FXI, CDT, CDI, CONDS, pl } from './cards.js';
import { G, setG, hooks, RULES, newState, beginTurn, playCard, buy, capture, finishTurn, gains, gainStr, phase, wildNeed, say } from './engine.js';
import { aiTurn, simulate } from './ai.js';

const $ = s => document.querySelector(s);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
let SNAP = null, clanChoice = 'sam', dealAnim = false, landAnim = false, lastCoins = 0, lastForce = 0;

/* ---------- Mise à l'échelle : toujours en paysage ---------- */
// Sur un téléphone tenu debout, le plateau est tourné d'un quart de tour : il suffit de pencher l'appareil.
function layout() {
  const fit = $('#fit'), app = $('#app'), cw = fit.clientWidth, ch = fit.clientHeight;
  const rot = ch > cw && matchMedia('(pointer:coarse)').matches;
  const W = rot ? ch : cw, H = rot ? cw : ch, w = Math.min(W, H * 2.4);
  app.style.width = w + 'px'; app.style.height = H + 'px';
  app.style.left = (rot ? cw : (cw - w) / 2) + 'px'; app.style.top = (rot ? (ch - w) / 2 : 0) + 'px';
  app.style.transform = rot ? 'rotate(90deg)' : '';
  app.style.setProperty('--u', H / 100 + 'px'); app.classList.toggle('tall', w / H < 1.15);
  if (!$('#game').hidden) {
    const CW = $('#center').clientWidth;
    app.style.setProperty('--mw', Math.floor(Math.min(0.72 * 0.225 * H, (CW - 40) / 6)) + 'px');
    app.style.setProperty('--hw', Math.floor(Math.min(0.72 * 0.32 * H, CW / 3.6)) + 'px');
  }
}
const px = name => parseFloat($('#app').style.getPropertyValue(name));
const fan = (n, w, avail) => (n > 1 ? Math.min(6, (avail - n * w) / (n - 1)) : 0);

/* ---------- Cartes ---------- */
function icons(c, full) {
  const base = c.fx.filter(f => !f[2]).map(f => FXI[f[0]](f[1])).join(' ');
  const cds = CONDS.filter(cd => c.fx.some(f => f[2] === cd));
  if (!full) return `<span class="ic">${base}${cds.length ? ' ' + cds.map(cd => CDI[cd]).join('') : ''}</span>`;
  return (base ? `<span class="ic">${base}</span>` : '') + cds.map(cd =>
    `<span class="ic cd">${CDI[cd]} ${c.fx.filter(f => f[2] === cd).map(f => FXI[f[0]](f[1])).join(' ')}</span>`).join('');
}
function cardHTML(id, zone, i, o = {}) {
  const c = C[id], sel = G.sel && G.sel.z === zone && G.sel.i === i;
  return `<button class="card c-${c.clan}${o.big ? ' big' : ''}${o.gain != null ? ' played' : ''}${sel ? ' sel' : ''}${o.no ? ' no' : ''}${o.anim ? ' in' : ''}" data-z="${zone}" data-i="${i}"${o.style ? ` style="${o.style}"` : ''} aria-label="${esc(c.name)}">
    ${o.cost != null ? `<span class="cost">${o.cost}</span>` : ''}${o.gain ? `<span class="gain">${o.gain}</span>` : ''}<span class="emo">${c.emo}</span><span class="ics">${o.gain != null ? '' : icons(c, o.big)}</span><span class="nm">${esc(c.name)}</span></button>`;
}

/* ---------- Affichage ---------- */
const ownTable = pi => (G.table.pi === pi && !G.tableStale ? G.table.cards.length : 0);
const totalOf = pi => { const p = G.P[pi]; return p.deck.length + p.disc.length + p.hand.length + ownTable(pi); };

function playerHTML(pi) {
  const p = G.P[pi], sh = p.arm + p.garde;
  const pile = (k, lbl, n) => `<button class="pile${G.sel && G.sel.z === 'pile' && G.sel.i === k ? ' sel' : ''}" data-pile="${k}">${lbl}<b>${n}</b></button>`;
  return `<span class="av">${CLANS[p.clan].av}</span><b>${pi ? 'Clan ' + CLANS[p.clan].name : 'Toi'}</b>
    <div class="st"><span class="stat" id="hp${pi}">❤️${p.hp}</span><span class="stat">🛡️${sh}</span></div>
    ${pi ? `<small>${totalOf(1)} cartes · ${p.caught + ' yōkai'}</small>`
      : `${p.garde ? `<small>dont garde ${p.garde}</small>` : ''}<div class="piles">${pile('deck', 'Pioche', p.deck.length)}${pile('disc', 'Défausse', p.disc.length)}</div>`}`;
}

function render() {
  if (!G || G.sim) return;
  document.documentElement.dataset.phase = phase();
  const me = G.P[0], op = G.P[1], mine = G.turn === 0 && !G.busy && !G.over, pos = (G.round - 1) % 4;
  $('#opp').innerHTML = playerHTML(1); $('#opp').classList.toggle('on', G.turn === 1 && !G.over);
  $('#me').innerHTML = playerHTML(0); $('#me').classList.toggle('on', G.turn === 0 && !G.over);
  $('#mid').innerHTML = `<span class="ph">${phase() === 'jour' ? 'Jour' : 'Nuit'} · tour ${G.round}</span>
    <div id="dial">${['☀️', '☀️', '🌙', '🌙'].map((e, i) => `<i class="${i === pos ? 'on' : ''}">${e}</i>`).join('')}</div>
    <button id="help">Règles</button>`;

  const slot = '<span class="slot"></span>';
  $('#wild').innerHTML = [0, 1].map(i => (G.wild[i] ? cardHTML(G.wild[i], 'wild', i, { cost: wildNeed(G.wild[i]), no: mine && wildNeed(G.wild[i]) > G.force }) : slot)).join('');
  $('#market').innerHTML = [0, 1, 2, 3].map(i => (G.market[i] ? cardHTML(G.market[i], 'market', i, { cost: C[G.market[i]].cost, no: mine && C[G.market[i]].cost > G.coins }) : slot)).join('');
  $('#shop').innerHTML = [0, 1, 2].map(i => (me.shop[i] ? cardHTML(me.shop[i], 'shop', i, { cost: C[me.shop[i]].cost, no: mine && C[me.shop[i]].cost > G.coins }) : slot)).join('');

  // Cartes posées : celles du joueur en cours, ou le dernier tour adverse tant qu'on n'a rien joué.
  const tb = $('#table'), t = G.table, mw = px('--mw'), m = fan(t.cards.length, mw, tb.clientWidth - 14);
  $('#table-lbl').textContent = !t.cards.length ? 'Cartes jouées' : t.pi === 0 ? 'Tu as joué' : `Le clan ${CLANS[op.clan].name} ${G.turn === 1 ? 'joue…' : 'a joué'}`;
  tb.innerHTML = t.cards.length ? t.cards.map((c, i) => cardHTML(c.id, 'table', i, { gain: c.g, anim: landAnim && i === t.cards.length - 1, style: i ? `margin-left:${m}px` : '' })).join('')
    : `<span class="empty">${G.turn === 0 ? 'Les cartes que tu joues se posent ici.' : `Le clan ${CLANS[op.clan].name} réfléchit…`}</span>`;
  landAnim = false;

  const hand = $('#hand'), hw = px('--hw'), hm = fan(me.hand.length, hw, hand.clientWidth);
  $('#hand-lbl').textContent = G.turn === 0 ? `Ma main · ${G.plays > 0 ? pl(G.plays, 'carte') + ' à jouer' : 'plus de carte à jouer ce tour'}` : 'Ma main pour le prochain tour';
  hand.innerHTML = me.hand.map((id, i) => cardHTML(id, 'hand', i, { big: true, no: mine && G.plays <= 0, anim: dealAnim,
    style: (i ? `margin-left:${hm}px;` : '') + (dealAnim ? `animation-delay:${i * 60}ms` : '') })).join('');
  dealAnim = false;

  const set = (id, v, lbl) => { const el = $(id); el.querySelector('b').textContent = v; if (lbl) el.querySelector('span').textContent = lbl; return el; };
  const ro = set('#r-or', G.coins), rf = set('#r-fo', G.force, G.turn === 0 ? '⚔️ force' : '⚔️ ennemi'); set('#r-pl', G.turn === 0 ? G.plays : '–');
  if (G.coins > lastCoins) bump(ro); if (G.force > lastForce) bump(rf); lastCoins = G.coins; lastForce = G.force;
  const et = $('#end-turn'); et.disabled = !mine; et.className = mine && G.force ? 'atk' : '';
  et.textContent = !mine ? 'Tour adverse…' : G.confirmEnd ? 'Finir quand même ?' : G.force ? `Attaquer ⚔️${G.force}` : 'Fin du tour';
  renderInfo(mine);
}
function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

function selCard() {
  const s = G.sel; if (!s || s.z === 'pile') return null; const me = G.P[0];
  const id = s.z === 'hand' ? me.hand[s.i] : s.z === 'shop' ? me.shop[s.i] : s.z === 'market' ? G.market[s.i] : s.z === 'wild' ? G.wild[s.i] : (G.table.cards[s.i] || {}).id;
  return id ? C[id] : null;
}
function canAct(mine) {
  const s = G.sel, c = selCard(); if (!s || !c || s.z === 'table') return null;
  if (!mine) return { ok: false, label: 'Attends ton tour' };
  if (s.z === 'hand') return G.plays > 0 ? { ok: true, label: 'Jouer cette carte' } : { ok: false, label: 'Plus de carte à jouer ce tour' };
  if (s.z === 'wild') { const n = wildNeed(c.id); return n <= G.force ? { ok: true, label: `Capturer · ${n} ⚔️` } : { ok: false, label: `Il manque ${n - G.force} ⚔️` }; }
  return c.cost <= G.coins ? { ok: true, label: `Acheter · ${c.cost} 🪙` } : { ok: false, label: `Il manque ${c.cost - G.coins} 🪙` };
}
function pileHTML(k) {
  const me = G.P[0], arr = k === 'deck' ? me.deck : me.disc, n = {};
  arr.forEach(id => { n[id] = (n[id] || 0) + 1; });
  const items = Object.keys(n).sort((a, b) => C[b].cost - C[a].cost || C[a].name.localeCompare(C[b].name)).map(id => `<li>${C[id].emo} ${esc(C[id].name)}${n[id] > 1 ? ' ×' + n[id] : ''}</li>`).join('');
  return `<div class="det"><div class="det-h"><span class="e">${k === 'deck' ? '🎴' : '♻️'}</span><div><strong>${k === 'deck' ? 'Ta pioche' : 'Ta défausse'}</strong><small>${pl(arr.length, 'carte')}${k === 'deck' ? ', dans le désordre' : ''}</small></div></div>
    ${items ? `<ul>${items}</ul>` : `<p class="note">${k === 'deck' ? 'Vide : ta défausse sera mélangée pour refaire la pioche.' : 'Vide pour l\'instant.'}</p>`}
    ${k === 'disc' ? '<p class="note">Quand la pioche est vide, la défausse est mélangée et redevient la pioche.</p>' : ''}</div>`;
}
function renderInfo(mine) {
  const el = $('#info'), bar = $('#actbar'), c = selCard(); bar.innerHTML = '';
  if (G.sel && G.sel.z === 'pile') { el.innerHTML = pileHTML(G.sel.i); return; }
  if (!c) {
    const tip = mine && G.round === 1 && !G.nPlayed ? `<p class="tip">À toi ! Touche une carte de ta main pour la lire. Tu peux en jouer ${G.plays} ce tour.</p>` : '';
    el.innerHTML = `<div class="log">${G.log.slice(tip ? -2 : -6).map(l => `<p>${l}</p>`).join('')}${tip}</div>`; return;
  }
  const z = G.sel.z, a = canAct(mine);
  const kind = c.clan === 'yok' ? (z === 'wild' ? `Yōkai sauvage · ${wildNeed(c.id)} ⚔️ pour le capturer` : 'Yōkai') :
    `${CLANS[c.clan].name} · ${c.cost === 0 ? 'carte de base' : c.cost >= 6 ? 'légendaire' : c.cost >= 4 ? 'rare' : 'commune'}`;
  const base = c.fx.filter(f => !f[2]).map(f => FXT[f[0]](f[1])).join(', ');
  const live = mine && z === 'hand';
  const lines = (base ? `<p>${base.charAt(0).toUpperCase() + base.slice(1)}.</p>` : '') + CONDS.filter(cd => c.fx.some(f => f[2] === cd)).map(cd => {
    const on = cd === 'jour' || cd === 'nuit' ? phase() === cd : cd === 'combo' ? G.nPlayed >= 2 : G.nPlayed === 0;
    return `<p class="cdl${live && on ? ' on' : ''}">${CDT[cd]} : ${c.fx.filter(f => f[2] === cd).map(f => FXT[f[0]](f[1])).join(', ')}.</p>`; }).join('');
  const now = live && G.plays > 0 ? `<p class="now">Si tu la joues maintenant : <b>${gainStr(gains(0, c.id)) || 'rien'}</b></p>` : '';
  const ks = c.fx.map(f => f[0]);
  const note = z === 'wild' && phase() === 'nuit' ? `La nuit : ${RULES.nightCost} ⚔️ de plus pour le capturer, mais il te donne ${RULES.nightCoins} 🪙.`
    : ks.includes('g') ? 'Garde : ce bouclier reste tant qu\'il n\'est pas cassé.' : ks.includes('a') ? 'Armure : elle disparaît au début de ton prochain tour.'
    : ks.includes('x') ? 'Dégâts directs : ils traversent le bouclier.' : ks.includes('j') ? '⏩ Cette carte ne compte pas dans tes 3 cartes du tour.' : '';
  el.innerHTML = `<div class="det c-${c.clan}"><div class="det-h"><span class="e">${c.emo}</span><div><strong>${esc(c.name)}</strong><small>${kind}</small></div></div>
    ${lines}${now}${note ? `<p class="note">${note}</p>` : ''}${LORE[c.id] ? `<p class="lore">${LORE[c.id]}</p>` : ''}</div>`;
  if (a) bar.innerHTML = `<button class="act" id="act"${a.ok ? '' : ' disabled'}>${a.label}</button>`;
}

function pop(pi, text, cls, shake) {
  if (!G || G.sim) return;
  requestAnimationFrame(() => { const t = $('#hp' + pi); if (!t) return;
    const s = document.createElement('span'); s.className = 'pop ' + cls; s.textContent = text; t.appendChild(s);
    if (shake && cls === 'bad') { const b = t.closest('.pl'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); } });
}
function banner(html) {
  const old = $('#banner'); if (old) old.remove();
  const b = document.createElement('div'); b.id = 'banner'; b.innerHTML = html; $('#app').appendChild(b); setTimeout(() => b.remove(), 2000);
}
hooks.render = () => { if (G && !G.sim && G.turn === 1) landAnim = true; render(); };
hooks.pop = pop;
hooks.sleep = ms => (G && G.sim ? null : new Promise(r => setTimeout(r, ms)));
hooks.phaseChange = () => {
  if (!G || G.sim) return;
  banner(phase() === 'nuit' ? `🌙 La nuit tombe<small>Les yōkai sauvages sont plus forts, mais rapportent ${RULES.nightCoins} 🪙.</small>` : '☀️ Le jour se lève<small>Les yōkai sauvages sont plus faciles à capturer.</small>');
  render();
};

/* ---------- Tour du joueur ---------- */
function saveSnap() { try { SNAP = JSON.stringify({ G, clanChoice }); } catch (e) { SNAP = null; } }
function act() {
  const s = G.sel; if (!s || G.busy || G.over || G.turn !== 0) return;
  const a = canAct(true); if (!a || !a.ok) return;
  if (s.z === 'hand') { const id = playCard(0, s.i); const last = G.table.cards[G.table.cards.length - 1]; say(`Tu joues ${C[id].emo} ${C[id].name}${last.g ? ' : ' + last.g : ''}.`); landAnim = true; }
  else if (s.z === 'wild') capture(0, s.i); else buy(0, s.z, s.i);
  G.sel = null; G.confirmEnd = false; render();
  if (G.over) return showEnd(); saveSnap();
}
async function endTurn() {
  if (G.busy || G.over || G.turn !== 0) return;
  if (G.plays > 0 && G.P[0].hand.length && !G.confirmEnd) { G.confirmEnd = true; say(`Tu peux encore jouer ${pl(Math.min(G.plays, G.P[0].hand.length), 'carte')}.`); G.sel = null; render(); return; }
  G.busy = true; G.sel = null; render();
  await finishTurn(0); if (G.over) return showEnd();
  dealAnim = true; G.turn = 1; render();
  await aiTurn(1); if (G.over) return showEnd();
  beginTurn(0); G.busy = false; say('À toi de jouer.'); render(); saveSnap();
}
function showEnd() {
  render(); const win = G.winner === 0, me = G.P[0], foe = CLANS[G.P[1].clan].name;
  $('#end-t').textContent = win ? 'Victoire ! 🎉' : 'Défaite…';
  $('#end-p').textContent = win ? `Le clan ${foe} est battu en ${pl(G.round, 'tour')}. Tu as capturé ${me.caught + ' yōkai'} et ton deck compte ${totalOf(0)} cartes.`
    : `Le clan ${foe} a gagné au tour ${G.round}. Essaie de capturer des yōkai plus tôt, ou de garder du bouclier.`;
  setTimeout(() => { $('#end').hidden = false; }, 900); SNAP = null;
}
function show(screen) {
  $('#home').hidden = screen !== 'home'; $('#game').hidden = screen !== 'game';
  if (screen === 'home') delete document.documentElement.dataset.phase;
  layout();
}
function startGame(clan) {
  clanChoice = clan; setG(newState(clan)); lastCoins = lastForce = 0;
  $('#end').hidden = true; show('game'); beginTurn(0); dealAnim = true; say(`Tu mènes le clan ${CLANS[clan].name}.`); render(); saveSnap();
}

document.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.clan) return startGame(t.dataset.clan);
  if (t.dataset.pile) { const k = t.dataset.pile; G.sel = G.sel && G.sel.z === 'pile' && G.sel.i === k ? null : { z: 'pile', i: k }; return render(); }
  if (t.dataset.z) {
    const z = t.dataset.z, i = +t.dataset.i;
    if (G.sel && G.sel.z === z && G.sel.i === i) { const a = canAct(G.turn === 0 && !G.busy); if (a && a.ok) return act(); G.sel = null; }
    else G.sel = { z, i };
    return render();
  }
  switch (t.id) {
    case 'act': return act();
    case 'end-turn': return endTurn();
    case 'help': case 'home-rules': $('#rules-quit').hidden = $('#game').hidden; $('#rules').hidden = false; return;
    case 'rules-ok': $('#rules').hidden = true; return;
    case 'rules-quit': $('#rules').hidden = true; setG(null); SNAP = null; show('home'); return;
    case 'end-again': return startGame(clanChoice);
    case 'end-home': $('#end').hidden = true; setG(null); show('home'); return;
  }
});
window.addEventListener('resize', () => { layout(); render(); });
window.__sim = simulate; // équilibrage depuis la console

// Reprise après une mise à jour de la page (artifact claude.ai) : on retrouve la partie au début du dernier coup.
function start(data) {
  if (data && data.G) { try { const d = JSON.parse(data.G); setG(d.G); clanChoice = d.clanChoice; show('game'); render(); return; } catch (e) { setG(null); } }
  show('home');
}
window.claude?.hot?.snapshot?.(() => (SNAP ? { G: SNAP } : {}));
if (window.claude?.hot?.ready) window.claude.hot.ready(start); else start(window.claude?.hot?.data ?? {});
