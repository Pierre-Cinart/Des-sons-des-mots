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
- Ajouter une premiere couche anti-triche cote frontend, en attendant un futur
  backend.

## Etat actuel

Le jeu fonctionne avec une structure tres directe :

- `index.html` : structure de la page et elements de jeu.
- `Js/app.js` : logique principale du jeu.
- `Scss/style.scss` : source des styles.
- `Css/style.css` : CSS compile.
- `Audio/` : sons classes par mot.
- `Images/` : images d'interface.

La version actuelle est une beta pedagogique inspiree de l'univers Pawat Labz.
Elle propose deja :

- un menu de jeu avec infos et credits ;
- un compteur de pieces local ;
- trois pistes audio, dont deux a deverrouiller avec des pieces ;
- une recompense aleatoire de 1 a 5 pieces apres une bonne reponse ;
- une animation de coffre avant de passer au niveau suivant ;
- une premiere couche de brouillage frontend pour les pieces et le mot courant.

De nombreuses mises a jour sont encore prevues, notamment pour les bonus,
l'equilibrage, la sauvegarde et le futur backend.

## Limite anti-triche actuelle

Le jeu tourne entierement dans le navigateur. Cela signifie qu'une securite
parfaite n'est pas possible cote frontend : tout ce qui est envoye au navigateur
peut etre inspecte par un utilisateur motive.

L'objectif de la prochaine etape n'est donc pas de rendre la triche impossible,
mais de brouiller les pistes :

- eviter une variable globale contenant la bonne reponse en clair ;
- eviter les chemins audio qui revelent directement le mot ;
- stocker les reponses sous une forme encodee ou chiffree legerement ;
- decoder seulement au moment de verifier la proposition du joueur ;
- reduire les fonctions globales accessibles depuis la console ;
- retirer les logs inutiles en production.

Une protection plus serieuse sera prevue plus tard avec un backend : validation
serveur, sessions, score signe, limitation des tentatives et reponses jamais
envoyees directement en clair.

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
- Creation de zones plus lisibles pour le menu, les sons, la reponse, les lettres
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
- Alignement de l'icone de piece juste apres les nombres dans le compteur et les
  couts de deverrouillage.
- Masquage du plateau tant que le menu de demarrage est ouvert.
- Ajout d'une phrase courte sous le titre du menu pour presenter le principe.
- Ajout d'un bouton d'aide `?` en jeu avec un panneau fermable par une croix.

### Etape 4 - Alignement UI et bouton Quitter

- Ancrage du bouton d'aide `?` a l'extreme droite de la barre de statut via
  `position: absolute` : le niveau et les pieces restent centres sans etre
  decales par le bouton.
- Ajout d'un bouton `QUITTER` sous la zone de feedback, visible uniquement
  pendant une partie active (attribut HTML `hidden` gere cote JavaScript).
- La fonction `quitGame()` remet a zero dans l'ordre : audio, compteurs, plateau,
  mot brouille, etat de partie, puis retourne au menu.
- Commentaires de code en mode tutoriel : chaque etape de `quitGame()` est
  documentee pour rendre la logique lisible dans l'historique git.

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

## Ajouter un mot plus tard

La structure cible sera documentee pendant la refonte. A terme, l'ajout d'un mot
devra suivre une procedure simple :

1. Ajouter les fichiers audio dans un dossier a id neutre.
2. Ajouter une entree de niveau dans les donnees du jeu.
3. Encoder la reponse avec l'outil ou la fonction prevue.
4. Tester que les sons, les lettres et la validation fonctionnent.

## Roadmap

La feuille de route detaillee est maintenant disponible sous deux formes :

- `todo.html` : checklist cliquable avec sauvegarde locale et export/import JSON.
- `Data/todo-roadmap.json` : source de donnees de la roadmap.
- `TODO.md` : note courte qui explique comment utiliser le suivi.

Pour utiliser la version cliquable, lance le projet via un serveur local puis
ouvre `todo.html`.


reprise v1 front only
