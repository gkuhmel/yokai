# La Route des Yōkai — notes pour Claude Code

Deck builder japonais pour un enfant de 11 ans. Interface en français, cible **iPhone et iPad via Safari, en paysage** (aussi publié comme artifact claude.ai : tout doit tenir dans `dist/index.html`, aucun fetch réseau).
État : **prototype** — 2 clans (Samouraï, Ninja), 60 cartes, solo contre l'ordinateur. Prévu : 5 clans (+ Onmyōji, Marchand, Yōkai), ~200 cartes, duel en ligne.

## Stack (identique à Geoose)
- Vite + JS vanilla (pas de framework), `vite-plugin-singlefile` pour un build en un seul HTML.
- Déploiement Cloudflare Workers (assets statiques) : `wrangler.jsonc` → `dist/`, `npm run deploy` (= `vite build && wrangler deploy`).
- Polices Google Fonts « Dela Gothic One » (titres, chiffres) et « Zen Maru Gothic » (texte) : seule ressource externe.

## Règles du jeu
- Chacun a 25 PV et un deck de départ de 10 cartes de son clan. Main de **5 cartes, 3 jouées par tour** (le premier joueur n'en joue que 2 à son premier tour) ; le reste part à la défausse. Réglages dans `RULES` (`engine.js`).
- Une carte jouée donne de la **force** ⚔️, des **pièces** 🪙, du bouclier 🛡️ (armure = un tour, **Garde** = reste), des soins, de la pioche…
- Les pièces achètent dans **son échoppe de clan** (3 cartes) ou au **marché commun** (4 neutres). La force **capture un yōkai sauvage** (2 visibles, il rejoint le deck) ; la force restante frappe l'adversaire en fin de tour.
- **Jour / Nuit** : 2 tours de jour, 2 de nuit (`phase()`). La nuit, un yōkai sauvage coûte +2 force mais rapporte 3 pièces ; certaines cartes ont un bonus ☀️ ou 🌙.
- Mots-clés : **Combo** 🔗 (bonus si c'est au moins la 3ᵉ carte du tour, Ninja), ⏩ (la carte ne compte pas dans les 3), ① (bonus si jouée en premier), 💤 (l'adversaire joue une carte de moins).
- La nouvelle main est piochée **à la fin de son propre tour** : elle reste visible et ne change pas pendant le tour adverse.

## Fichiers
- `index.html` : markup (accueil, plateau 3 colonnes, règles, fin de partie).
- `src/cards.js` : toutes les cartes, `[id, clan, nom, emoji, prix, effets]`, effet = `[type, nombre, condition?]` (légende en tête du fichier). Les textes et pictos des cartes sont **générés depuis les effets** (`FXT`, `FXI`) : ne pas écrire de texte de carte à la main. `LORE` = « le savais-tu ? ».
- `src/engine.js` : règles pures, sans DOM (`newState`, `beginTurn`, `playCard`, `buy`, `capture`, `finishTurn`). `gains(pi, id)` calcule ce que rapporte une carte **maintenant** : `playCard` l'applique et l'interface l'affiche, c'est la seule source de vérité. L'état `G` est un objet JSON simple (prévu pour le jeu en ligne). `hooks` relie le moteur à l'affichage.
- `src/ai.js` : l'ordinateur (`aiPlan` essaie les suites de cartes possibles, puis capture et achète) et `simulate`.
- `src/main.js` : affichage et tour du joueur. Un toucher sélectionne (fiche à droite), un second toucher agit.
- `src/style.css` : toutes les couleurs passent par des variables (`:root`, puis `:root[data-phase="nuit"]`) ; ne pas remettre de couleur en dur. `--u` = 1 % de la hauteur du plateau.
- `scripts/sim.mjs` : équilibrage. `scripts/shots.mjs` : captures d'écran de contrôle.

## Points d'attention
- **Toujours en paysage** : `layout()` dimensionne `#app` ; sur un écran tactile tenu debout, il est tourné de 90° en CSS. Tailles des cartes (`--mw`, `--hw`) calculées depuis la hauteur disponible.
- Rien ne doit défiler sur le plateau. Vérifier en 760×340 (iPhone paysage dans Safari), 1180×760 (iPad) et 390×700 tactile (debout, donc tourné) avec `node scripts/shots.mjs <dossier>` après `npm run build`.
- **Équilibrage** : après tout changement de carte ou de règle, lancer `npm run sim -- 1000`. Cible : chaque clan entre 45 et 55 % de victoires, 12 à 14 tours en moyenne. On peut essayer un réglage sans toucher au code : `npm run sim -- 1000 katana=f4,p1 hp=30`. Le jeu est très sensible aux cartes de départ.
- Les illustrations sont des émojis : n'utiliser que des émojis anciens (affichés par iOS 15).
