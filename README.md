# Des sons et des mots

Jeu web vanilla en HTML, CSS/SCSS et JavaScript.

Le principe est simple : le joueur ecoute plusieurs sons, observe les lettres
proposees, puis reconstitue le mot correspondant. Le projet sert de base pour
un jeu d'ecoute, de vocabulaire et de deduction, avec une evolution prevue vers
une version plus propre, plus accessible et plus difficile a tricher.

## Objectif du projet

- Proposer un jeu court et comprehensible.
- Faire deviner un mot a partir d'indices audio.
- Garder une base technique simple, sans framework obligatoire.
- Ameliorer progressivement le code et l'experience utilisateur.
- Ajouter une couche anti-triche cote frontend, en attendant un futur backend.

## Etat actuel

Le jeu fonctionne avec une structure claire :

- `index.html` : structure de la page et elements de jeu.
- `Js/app.js` : logique principale du jeu.
- `Js/levels-data.js` : donnees des niveaux (IDs neutres + mots encodes).
- `Scss/style.scss` : source des styles.
- `Css/style.css` : CSS compile.
- `Audio/` : sons classes par identifiant neutre (s001 a s014).
- `Images/` : images d'interface.

La version actuelle est une beta pedagogique inspiree de l'univers Pawat Labz.
Elle propose deja :

- un menu de jeu avec infos, credits et aide en cours de partie ;
- un compteur de pieces local ;
- trois pistes audio dont deux a deverrouiller avec des pieces ;
- une recompense aleatoire de 1 a 5 pieces apres une bonne reponse ;
- une animation de coffre avant de passer au niveau suivant ;
- un bouton QUITTER pour revenir au menu sans recharger la page ;
- un brouillage anti-triche frontend : dossiers audio neutres et mots encodes.

## Limite anti-triche actuelle

Le jeu tourne entierement dans le navigateur. Une securite parfaite n'est pas
possible cote frontend : tout ce qui est envoye au navigateur peut etre inspecte
par un utilisateur motive.

Ce qui est en place :

- les dossiers audio portent des identifiants neutres (s001, s002...) qui ne
  revelent pas la reponse dans les requetes reseau ou l'inspecteur de fichiers ;
- les mots sont stockes encodes en XOR + base64 dans `levels-data.js` ;
- le decodage ne se fait qu'au moment de preparer le niveau, le resultat etant
  immediatement re-encode dans une cellule brouillee locale ;
- les pieces sont stockees de la meme maniere, avec verification d'integrite ;
- aucun `console.log` ni variable globale accidentelle ne trainent en production.

Une protection plus serieuse sera ajoutee avec le backend : validation serveur,
sessions, score signe, limitation des tentatives et reponses jamais envoyees
au client en clair.

## Direction de refonte

La refonte doit rester progressive. Le but n'est pas de tout casser d'un coup,
mais de rendre chaque partie plus claire :

1. Nettoyer la structure HTML et remplacer les faux boutons par de vrais
   boutons accessibles.
2. Reorganiser le JavaScript autour d'un etat de jeu local et limite.
3. Centraliser les donnees de niveaux dans une structure claire.
4. Ajouter le brouillage anti-triche frontend.
5. Ameliorer l'interface, le feedback joueur et le responsive.
6. Documenter chaque choix important pour pouvoir continuer facilement.

## Etapes realisees

### Etape 1 - Base HTML et interactions

- Remplacement des interactions inline par des listeners JavaScript.
- Creation de zones lisibles pour le menu, les sons, la reponse, les lettres
  et le feedback.
- Ajout de vrais boutons pour preparer l'accessibilite clavier.

### Etape 2 - Style Pawat Labz et economie locale

- Adaptation visuelle retro-futuriste : grille, scan-line, vert neon, cyan et
  accent pieces.
- Ajout du menu `Jouer`, `Infos`, `Credits`.
- Ajout des pieces, du cout des pistes audio et d'un brouillage frontend simple.

### Etape 3 - Verrous et coffre de recompense

- Affichage d'un cadenas sur les pistes verrouillees.
- Affichage du cout de deverrouillage avec l'icone de pieces.
- Ajout d'un coffre central apres une bonne reponse.
- Ouverture du coffre au clic, defilement rapide de chiffres entre 1 et 5,
  affichage du gain puis bouton `Continuer`.
- Arret automatique du son d'indice quand le mot est trouve.
- Amelioration du panneau `Infos` pour expliquer les regles des le debut.
- Correction du pictogramme lecture pour garder le triangle centre dans son cercle.
- Alignement de l'icone de piece dans le compteur et les couts de deverrouillage.
- Masquage du plateau tant que le menu de demarrage est ouvert.
- Ajout d'un bouton d'aide `?` en jeu avec un panneau fermable par une croix.

### Etape 4 - Alignement UI et bouton Quitter

- Ancrage du bouton `?` a l'extreme droite de la barre de statut via
  `position: absolute` : le niveau et les pieces restent centres.
- Ajout d'un bouton `QUITTER` sous la zone de feedback, visible uniquement
  pendant une partie active (attribut HTML `hidden` gere cote JavaScript).
- La fonction `quitGame()` remet a zero dans l'ordre : audio, compteurs, plateau,
  mot brouille, etat de partie, puis retourne au menu.
- Commentaires de code en mode tutoriel : chaque etape de `quitGame()` est
  documentee pour rendre la logique lisible dans l'historique git.
- Police des boutons de lettres changee d'Orbitron vers Exo 2 pour une
  meilleure lisibilite sur les petites touches.

### Etape 6 - Systeme de difficulte, anti-repetition et records

- Restructuration des dossiers audio en trois tiers : `Audio/easy/` (sons
  actuels), `Audio/medium/` et `Audio/hard/` (vides, prets pour de futurs sons).
  Chaque `folderId` dans `levels-data.js` inclut maintenant le tier :
  `"easy/s004"` → `Audio/easy/s004/0.ogg`.
- Selection par difficulte dans `app.js` : la fonction `getDifficultyTier()`
  retourne le tier selon le niveau courant (easy 1-5, medium 6-15, hard 16+).
  Si un tier est vide, repli automatique sur easy via `getLevelPool()`.
- Anti-repetition par session : `sessionUsed` (Set) memorise les niveaux
  joues. `buildAvailablePool()` filtre systematiquement les sons deja entendus
  dans la partie en cours. Reinitialise uniquement au clic JOUER.
- Records en cache localStorage : `updateBestStats()` conserve le niveau max
  et les pieces max atteints. `renderBestStats()` les affiche dans le menu de
  demarrage des la deuxieme partie (masques tant qu'aucun record n'existe).
- `getTotalLevelCount()` dans `levels-data.js` compte les niveaux totaux pour
  declarer la fin de partie quand tout a ete joue.

### Etape 5 - Module de donnees et anti-triche audio

- Creation de `Js/levels-data.js` : module independant qui centralise la table
  des niveaux. Chaque entree contient un `folderId` neutre et un mot encode
  en XOR + base64. Aucun mot en clair n'apparait dans le fichier.
- Renommage de tous les dossiers `Audio/` : les noms de mots sont remplaces
  par des identifiants neutres (`s001/` a `s014/`). Les requetes reseau
  n'exposent plus la reponse.
- Mise a jour de `app.js` : `prepareAudioSources()` utilise le `folderId`
  neutre ; `setCurrentWord()` decode le payload du niveau puis re-encode
  le mot dans la cellule brouillee locale.
- La fonction `decodeLevel()` dans `levels-data.js` est le seul point de
  decodage : appelee uniquement pendant la preparation du niveau, le resultat
  est immediatement re-encode. Aucun mot ne reste en clair en memoire.
- Audit qualite confirme : zero `console.log`, zero `onclick` inline, zero
  `var`, variable `rdm` correctement locale.
- Mise a jour complete de la save `des-sons-des-mots-progress.json` et du
  bloc de progression dans `todo.html`.

### Etape 7 - Melange audio et ecran felicitations

- Melange aleatoire des trois pistes audio a chaque niveau (algorithme Fisher-Yates
  dans `prepareAudioSources()`) : Signal 01, 02 et 03 ne correspondent plus
  toujours aux memes fichiers, rejouer le meme mot ne garantit plus le meme son
  sur le premier signal.
- Remplacement du `alert()` de fin de session par un vrai ecran HTML :
  `#congratsOverlay` avec kicker, titre, statistiques finales (niveau et pieces),
  invitation a contacter Pawat Labz et deux boutons RECOMMENCER / QUITTER.
- Theme vert neon / cyan pour distinguer visuellement la victoire (felicitations)
  de la defaite (game over en rouge).
- `showCongrats()` / `hideCongrats()` symetriques a `showGameOver()` / `hideGameOver()`.
- `restartGame()` et `quitGame()` ferment desormais les deux overlays de fin.

## Lancer le jeu

Le projet peut etre ouvert comme un site statique.

Options simples :

- ouvrir `index.html` dans un navigateur ;
- utiliser Live Server dans VS Code ;
- servir le dossier avec un petit serveur local.

Exemple avec Python, si disponible :

```bash
python -m http.server
```

Puis ouvrir l'adresse locale indiquee par le terminal.

## Ajouter un mot

1. Placer les fichiers audio dans un nouveau dossier `Audio/sXXX/` (0.ogg,
   1.ogg, 2.ogg).
2. Calculer l'encodage du mot avec la commande suivante (remplacer MOT) :

```bash
node -e "
const s='pawat-labz-audio-demo', w='MOT';
const c=[];
for(let i=0;i<w.length;i++) c.push(String.fromCharCode(w.charCodeAt(i)^s.charCodeAt(i%s.length)));
console.log(Buffer.from(c.join('')).toString('base64'));
"
```

3. Ajouter une entree dans le tableau `LEVELS` de `Js/levels-data.js` :

```javascript
{ folderId: "sXXX", encoded: "RESULTAT_DE_LA_COMMANDE" }
```

4. Tester que le son se joue, les lettres s'affichent et la validation fonctionne.

## Roadmap

La feuille de route detaillee est disponible sous deux formes :

- `todo.html` : checklist cliquable avec sauvegarde locale et export/import JSON.
- `Data/todo-roadmap.json` : source de donnees de la roadmap.
- `TODO.md` : note courte qui explique comment utiliser le suivi.

Pour utiliser la version cliquable, lance le projet via un serveur local puis
ouvre `todo.html`.


reprise v1 front only push V1.0.2

