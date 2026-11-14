// Les cartes. Une carte = [id, clan, nom, emoji, prix, effets].
// effet = [type, nombre, condition?]
//   types : f force · o pièces · a armure (un tour) · g garde (reste) · p pioche · s soin · x dégâts directs
//           j carte de plus à jouer · fc force par carte jouée · fb force = bouclier (max n) · sl l'adversaire joue n carte de moins
//   conditions : jour · nuit · combo (3ᵉ carte du tour ou plus) · prem (1ʳᵉ carte du tour)
// Pour un yōkai sauvage (clan "yok"), le prix est la force à dépenser pour le capturer.
export const D = [
  // Cartes de base (decks de départ)
  ['riz', 'neu', 'Bol de riz', '🍚', 0, [['o', 1]]],
  ['bokken', 'sam', 'Sabre de bois', '🗡️', 0, [['f', 2]]],
  ['tenue', 'sam', 'Tenue de dōjō', '🥋', 0, [['g', 2], ['f', 1]]],
  ['kunai', 'nin', 'Kunai', '🗡️', 0, [['f', 2], ['f', 1, 'combo']]],
  ['pasloup', 'nin', 'Pas de loup', '👣', 0, [['p', 1], ['j', 1]]],
  // Samouraï : gros coups, garde, plus fort le jour
  ['yari', 'sam', 'Lance yari', '🔱', 1, [['f', 3]]],
  ['armure', 'sam', 'Armure de laque', '🛡️', 2, [['g', 3], ['f', 1]]],
  ['cri', 'sam', 'Cri de guerre', '📣', 2, [['f', 2], ['f', 2, 'jour']]],
  ['banniere', 'sam', 'Bannière du clan', '🎌', 2, [['o', 2], ['g', 1]]],
  ['the', 'sam', 'Thé du matin', '🍵', 2, [['s', 3], ['j', 1, 'jour']]],
  ['katana', 'sam', 'Katana', '⚔️', 3, [['f', 5]]],
  ['kabuto', 'sam', 'Casque kabuto', '🪖', 3, [['g', 3], ['f', 2]]],
  ['archer', 'sam', 'Archer à cheval', '🏹', 4, [['f', 4], ['p', 1]]],
  ['iaido', 'sam', 'Iaidō', '⚡', 4, [['f', 4], ['f', 4, 'prem']]],
  ['rempart', 'sam', 'Muraille', '🧱', 4, [['g', 5], ['f', 2]]],
  ['soleil', 'sam', 'Soleil levant', '🌅', 4, [['f', 3], ['f', 4, 'jour'], ['g', 3, 'nuit']]],
  ['dojo', 'sam', 'Dōjō', '🏯', 5, [['o', 2], ['f', 3], ['g', 2]]],
  ['charge', 'sam', 'Charge héroïque', '🐎', 5, [['f', 2], ['fb', 8]]],
  ['daimyo', 'sam', 'Daimyō', '👑', 7, [['f', 6], ['g', 4], ['p', 1]]],
  // Ninja : cartes qui s'enchaînent (⏩), combos, plus fort la nuit
  ['shuriken', 'nin', 'Shuriken', '✴️', 1, [['f', 2], ['j', 1]]],
  ['kusarigama', 'nin', 'Kusarigama', '⛓️', 2, [['f', 2], ['f', 2, 'combo']]],
  ['fumigene', 'nin', 'Bombe fumigène', '💨', 2, [['a', 3], ['a', 2, 'nuit']]],
  ['grappin', 'nin', 'Grappin', '🪝', 2, [['o', 2], ['p', 1, 'combo']]],
  ['toits', 'nin', 'Course sur les toits', '🏘️', 2, [['o', 1], ['p', 1], ['j', 1]]],
  ['ombre', 'nin', 'Ombre', '👤', 3, [['p', 2], ['j', 1]]],
  ['sarbacane', 'nin', 'Sarbacane', '🎯', 3, [['x', 2], ['x', 1, 'combo']]],
  ['lamenuit', 'nin', 'Lame de nuit', '🌑', 3, [['f', 2], ['f', 3, 'nuit']]],
  ['cambriolage', 'nin', 'Cambriolage', '💰', 3, [['o', 2], ['o', 2, 'nuit']]],
  ['deguisement', 'nin', 'Déguisement', '🎭', 3, [['a', 2], ['j', 1]]],
  ['embuscade', 'nin', 'Embuscade', '🎋', 4, [['f', 3], ['f', 3, 'combo']]],
  ['sommeil', 'nin', 'Poudre de sommeil', '😴', 4, [['f', 2], ['sl', 1]]],
  ['lames', 'nin', 'Mille lames', '🌀', 5, [['fc', 2]]],
  ['maitre', 'nin', 'Maître ninja', '🥷', 7, [['f', 3], ['p', 1], ['j', 1], ['x', 2, 'combo']]],
  // Neutres : achetables par les deux joueurs au marché
  ['onigiri', 'neu', 'Onigiri', '🍙', 1, [['s', 2], ['j', 1]]],
  ['carillon', 'neu', 'Carillon fūrin', '🎐', 2, [['a', 2], ['o', 1]]],
  ['lanterne', 'neu', 'Lanterne', '🏮', 2, [['o', 1], ['f', 2, 'nuit']]],
  ['cerfvolant', 'neu', 'Cerf-volant', '🪁', 2, [['p', 1], ['j', 1], ['o', 1, 'jour']]],
  ['koban', 'neu', 'Koban', '🪙', 3, [['o', 2]]],
  ['koi', 'neu', 'Carpe koï', '🎏', 3, [['o', 1], ['f', 1], ['j', 1]]],
  ['cerisier', 'neu', 'Cerisier en fleurs', '🌸', 3, [['s', 2], ['o', 1], ['o', 1, 'jour']]],
  ['ramen', 'neu', 'Ramen', '🍜', 3, [['s', 3], ['p', 1]]],
  ['origami', 'neu', 'Grue en origami', '🕊️', 4, [['s', 3], ['a', 3]]],
  ['onsen', 'neu', 'Onsen', '♨️', 4, [['s', 6]]],
  ['artifice', 'neu', "Feux d'artifice", '🎆', 4, [['f', 4], ['f', 2, 'nuit']]],
  ['sumo', 'neu', 'Sumo', '🤼', 5, [['f', 3], ['a', 4]]],
  ['torii', 'neu', 'Torii', '⛩️', 5, [['o', 2], ['p', 1], ['a', 2]]],
  ['tresor', 'neu', 'Trésor du shōgun', '💎', 6, [['o', 4]]],
  ['fuji', 'neu', 'Mont Fuji', '🗻', 7, [['f', 4], ['a', 4], ['s', 2]]],
  // Yōkai sauvages
  ['tanuki', 'yok', 'Tanuki', '🦝', 3, [['o', 3]]],
  ['kasa', 'yok', 'Kasa-obake', '☂️', 3, [['f', 2], ['j', 1]]],
  ['kodama', 'yok', 'Kodama', '🌳', 3, [['s', 3], ['o', 1]]],
  ['kappa', 'yok', 'Kappa', '🐢', 4, [['f', 3], ['a', 2]]],
  ['hitodama', 'yok', 'Hitodama', '🔥', 4, [['f', 2], ['f', 3, 'nuit']]],
  ['bakeneko', 'yok', 'Bakeneko', '🐱', 4, [['o', 1], ['j', 1], ['f', 3, 'nuit']]],
  ['kitsune', 'yok', 'Kitsune', '🦊', 5, [['o', 2], ['j', 1], ['p', 1, 'nuit']]],
  ['tengu', 'yok', 'Tengu', '👺', 6, [['f', 5], ['p', 1]]],
  ['yukionna', 'yok', 'Yuki-onna', '❄️', 6, [['a', 4], ['sl', 1]]],
  ['tsuchigumo', 'yok', 'Tsuchigumo', '🕷️', 7, [['f', 4], ['sl', 1]]],
  ['oni', 'yok', 'Oni', '👹', 8, [['f', 8]]],
  ['ryujin', 'yok', 'Ryūjin', '🐉', 10, [['f', 6], ['a', 4], ['j', 1]]],
];

// « Le savais-tu ? » affiché sur la fiche de la carte.
export const LORE = {
  tanuki: "Un vrai animal du Japon. Dans les contes, il se transforme en posant une feuille sur sa tête.",
  kasa: "Un vieux parapluie devenu vivant, avec un seul œil et une seule jambe.",
  kodama: "L'esprit qui habite les très vieux arbres. Couper son arbre porte malheur.",
  kappa: "L'esprit des rivières. Il a un creux rempli d'eau sur la tête et adore les concombres.",
  hitodama: "Une boule de feu qui flotte dans la nuit : on dit que c'est l'âme d'un défunt.",
  bakeneko: "Un chat qui, en devenant très vieux, se change en yōkai.",
  kitsune: "Le renard magique. Plus il est vieux et sage, plus il a de queues, jusqu'à neuf.",
  tengu: "L'esprit des montagnes au long nez, grand maître du sabre.",
  yukionna: "La femme des neiges, qui apparaît pendant les tempêtes.",
  tsuchigumo: "Une araignée géante des vieilles légendes de guerriers.",
  oni: "L'ogre à cornes. À la fête de Setsubun, on le chasse en lançant des haricots.",
  ryujin: "Le dieu dragon de la mer, qui vit dans un palais au fond de l'océan.",
  daimyo: "Le seigneur d'une province, que les samouraïs servaient.",
  fuji: "3 776 mètres : le plus haut sommet du Japon, et un volcan.",
  koban: "La pièce d'or ovale du Japon des samouraïs.",
  torii: "Le portail rouge qui marque l'entrée d'un sanctuaire.",
  onsen: "Une source d'eau chaude naturelle, grâce aux volcans.",
};

export const C = {};
D.forEach(([id, clan, name, emo, cost, fx]) => { C[id] = { id, clan, name, emo, cost, fx }; });

export const CLANS = {
  sam: { name: 'Samouraï', av: '🏯' },
  nin: { name: 'Ninja', av: '🥷' },
  neu: { name: 'Neutre' },
  yok: { name: 'Yōkai' },
};
export const START = {
  sam: ['riz', 'riz', 'riz', 'riz', 'riz', 'riz', 'bokken', 'bokken', 'bokken', 'tenue'],
  nin: ['riz', 'riz', 'riz', 'riz', 'riz', 'riz', 'kunai', 'kunai', 'kunai', 'pasloup'],
};

// Textes et pictos générés depuis les effets (une seule source de vérité).
export const pl = (n, w) => n + ' ' + w + (n > 1 ? 's' : '');
export const FXT = {
  f: n => `+${n} force`, o: n => '+' + pl(n, 'pièce'), a: n => `+${n} armure`, g: n => `+${n} garde`,
  p: n => 'pioche ' + pl(n, 'carte'), s: n => `soigne ${n} PV`, x: n => `${n} dégâts directs`,
  j: n => `joue ${n} carte de plus`, fc: n => `+${n} force par carte jouée ce tour`,
  fb: n => `+1 force par point de bouclier (max ${n})`, sl: n => `l'adversaire jouera ${n} carte de moins`,
};
export const ICON = { f: '⚔️', x: '💥', o: '🪙', g: '🛡️', a: '🛡️', s: '❤️', p: '🃏', j: '⏩', sl: '💤' };
export const FXI = {
  f: n => '⚔️' + n, o: n => '🪙' + n, a: n => '🛡️' + n, g: n => '🛡️' + n, p: n => '🃏' + n, s: n => '❤️' + n, x: n => '💥' + n,
  j: () => '⏩', fc: n => `⚔️${n}×🃏`, fb: () => '⚔️=🛡️', sl: () => '💤',
};
export const CDT = { jour: '☀️ Le jour', nuit: '🌙 La nuit', combo: '🔗 Combo (3ᵉ carte du tour ou plus)', prem: '① Jouée en premier' };
export const CDI = { jour: '☀️', nuit: '🌙', combo: '🔗', prem: '①' };
export const CONDS = ['jour', 'nuit', 'combo', 'prem'];
