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

La version actuelle est volontairement simple, mais plusieurs points doivent
etre repris avant d'ajouter de nouvelles fonctionnalites.

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

La feuille de route detaillee est dans `TODO.md`.
