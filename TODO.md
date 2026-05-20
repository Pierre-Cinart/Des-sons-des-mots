# TODO - Refonte pedagogique Des sons et des mots

Cette feuille de route sert a refaire le jeu etape par etape, en mode tuto +
push. Le but est de partir du modele actuel, mais de reconstruire une version
plus propre, plus difficile, plus lisible et adaptee a l'univers Pawat Labz.

Branche de travail actuelle : `dev`.

## Vision du jeu

- [ ] Garder le principe central : ecouter des sons, deviner un mot, composer la
  reponse avec des lettres.
- [ ] Adapter l'identite visuelle a Pawat Labz : laboratoire, signal audio,
  interface neon/cyber, ambiance experimenteur.
- [ ] Rendre le jeu plus pedagogique pour le code : chaque etape doit pouvoir
  devenir un commit/tuto clair.
- [ ] Rendre le jeu moins facile avec une vraie economie de pieces et des bonus.
- [ ] Garder une version 100% frontend pour le moment, sans achat et sans pub.
- [ ] Preparer le terrain pour un futur backend avec achat, pub, validation
  serveur et anti-triche plus solide.

## Hypotheses gameplay a confirmer

- [ ] Le joueur gagne un nombre aleatoire de pieces entre 1 et 5 quand il trouve
  une bonne reponse.
- [ ] Le gain aleatoire doit creer un petit effet d'adrenaline, avec affichage
  clair du nombre de pieces gagnees.
- [ ] Plus tard, une pub pourra doubler le gain, mais cette version ne branche
  pas encore de publicite.
- [ ] Aucun achat reel dans cette version.
- [ ] Les pieces servent uniquement aux bonus internes du jeu.
- [ ] Hypothese pour les sons bonus :
  - [ ] son/indice de base gratuit ;
  - [ ] indice audio plus clair a 20 pieces ;
  - [ ] indice audio tres clair ou super indice a 50 pieces.
- [ ] Confirmer si les bonus audio doivent etre rejouables gratuitement une fois
  achetes pendant le meme niveau, ou repayants a chaque lecture.
- [ ] Confirmer si le joueur commence avec 0 piece ou un petit capital de depart.

## Etape 0 - Base de travail propre

- [ ] Verifier que la branche `dev` est bien a jour.
- [ ] Faire un commit documentaire avec `README.md` et `TODO.md`.
- [ ] Lancer la version actuelle pour garder un point de comparaison.
- [ ] Noter les bugs visibles avant la refonte.
- [ ] Decider si on garde le nom `Des sons et des mots` ou si une version Pawat
  Labz aura un nom plus marque.

## Etape 1 - Nettoyage HTML sans changer le gameplay

- [ ] Corriger le titre affiche : `DES SONS ET DES MOTS`.
- [ ] Corriger l'id incoherent entre `#_sounds` dans le HTML et `#sounds` dans le
  JS.
- [ ] Remplacer les faux boutons en `<p>` par de vrais `<button>`.
- [ ] Remplacer les images cliquables de lecture par des boutons audio.
- [ ] Ajouter des labels accessibles aux boutons de lecture.
- [ ] Retirer les styles inline du panneau d'infos.
- [ ] Ajouter des zones HTML claires :
  - [ ] menu principal ;
  - [ ] barre de progression/pieces ;
  - [ ] zone sons ;
  - [ ] zone reponse ;
  - [ ] zone lettres ;
  - [ ] zone feedback.

## Etape 2 - Premier design Pawat Labz

- [ ] Reprendre une direction visuelle labo/neon proche de Pawat Labz.
- [ ] Definir une palette simple :
  - [ ] fond sombre ;
  - [ ] accents cyan/neon ;
  - [ ] accent jaune/orange pour les pieces ;
  - [ ] vert pour bonne reponse ;
  - [ ] rouge pour erreur.
- [ ] Creer un vrai menu de depart avec :
  - [ ] titre ;
  - [ ] bouton jouer ;
  - [ ] bouton regles ;
  - [ ] bouton reprendre/recommencer si utile.
- [ ] Ameliorer la disposition des elements en mobile.
- [ ] Eviter que le contenu soit coupe sur petits ecrans.
- [ ] Garder une interface ludique, pas corporate.

## Etape 3 - JavaScript plus propre

- [ ] Supprimer les `onclick` inline.
- [ ] Brancher les interactions avec `addEventListener`.
- [ ] Encapsuler le jeu pour limiter les variables globales.
- [ ] Creer un objet `gameState` clair :
  - [ ] partie active ;
  - [ ] niveau courant ;
  - [ ] pieces ;
  - [ ] lettres disponibles ;
  - [ ] lettres posees ;
  - [ ] audio actif ;
  - [ ] bonus achetes pour le niveau courant.
- [ ] Supprimer les variables inutilisees.
- [ ] Corriger la variable globale accidentelle `rdm`.
- [ ] Retirer les `console.log` de debug.

## Etape 4 - Donnees de niveaux

- [ ] Sortir les mots et chemins audio de la logique principale.
- [ ] Creer une structure de niveaux claire.
- [ ] Utiliser des ids neutres, par exemple `level-001`, `sound-001`.
- [ ] Prevoir pour chaque niveau :
  - [ ] id ;
  - [ ] reponse encodee ;
  - [ ] sons gratuits ;
  - [ ] sons bonus a 20 pieces ;
  - [ ] sons bonus a 50 pieces ;
  - [ ] lettres leurres ;
  - [ ] difficulte ;
  - [ ] categorie optionnelle.
- [ ] Melanger les niveaux sans detruire definitivement la liste.
- [ ] Prevoir une fin de partie propre.

## Etape 5 - Brouillage anti-triche frontend

- [ ] Renommer les dossiers audio pour ne plus reveler la reponse.
- [ ] Ne plus construire les chemins audio avec le mot en clair.
- [ ] Stocker les reponses sous forme encodee ou legerement chiffree.
- [ ] Ajouter une fonction de decodage courte et bien commentee.
- [ ] Decoder uniquement au moment de valider la reponse.
- [ ] Ne pas garder la reponse decodee dans un etat global.
- [ ] Nettoyer la valeur decodee juste apres comparaison.
- [ ] Eviter d'exposer des fonctions de triche faciles depuis la console.
- [ ] Documenter clairement que c'est un brouillage frontend, pas une securite
  definitive.

## Etape 6 - Systeme de pieces

- [ ] Ajouter un compteur de pieces visible.
- [ ] Stocker les pieces dans `gameState`.
- [ ] Donner entre 1 et 5 pieces au hasard apres une bonne reponse.
- [ ] Afficher une animation ou un message du type `+3 pieces`.
- [ ] Empecher le compteur de devenir negatif.
- [ ] Decider si les pieces sont conservees entre parties :
  - [ ] non pour la premiere version ;
  - [ ] possible avec `localStorage` plus tard.
- [ ] Preparer un emplacement UI pour un futur multiplicateur x2 par pub, sans
  le brancher.

## Etape 7 - Bonus et difficulte

- [ ] Ajouter un bouton bonus a 20 pieces.
- [ ] Ajouter un bouton bonus a 50 pieces.
- [ ] Griser/desactiver les bonus si le joueur n'a pas assez de pieces.
- [ ] Debiter les pieces quand un bonus est achete.
- [ ] Marquer un bonus comme achete pendant le niveau.
- [ ] Tester une difficulte plus forte :
  - [ ] plus de lettres leurres ;
  - [ ] mots plus longs ;
  - [ ] sons gratuits moins evidents ;
  - [ ] sons bonus plus explicites.
- [ ] Ajouter un feedback si le joueur essaie d'acheter sans assez de pieces.

## Etape 8 - Audio et formats web

- [ ] Faire l'inventaire des sons existants.
- [ ] Nettoyer les sons trop lourds ou trop longs.
- [ ] Normaliser le volume des sons.
- [ ] Choisir une strategie de format :
  - [ ] M4A/AAC pour compatibilite large, notamment mobile/Safari ;
  - [ ] OGG possible en alternative ou fallback ;
  - [ ] si un seul format est garde, tester sur les navigateurs cibles.
- [ ] Renommer les fichiers avec des ids neutres.
- [ ] Centraliser la lecture audio dans une seule fonction.
- [ ] Garantir qu'un seul son joue a la fois.
- [ ] Gerer les erreurs de chargement audio.

## Etape 9 - Validation et feedback joueur

- [ ] Generer les cases vides selon la longueur de la reponse.
- [ ] Garantir que toutes les lettres utiles sont disponibles.
- [ ] Ajouter assez de leurres pour augmenter la difficulte.
- [ ] Permettre de retirer une lettre posee.
- [ ] Verifier la reponse quand toutes les cases sont remplies.
- [ ] Afficher un feedback clair :
  - [ ] bonne reponse ;
  - [ ] mauvaise reponse ;
  - [ ] pieces gagnees ;
  - [ ] niveau suivant ;
  - [ ] fin de partie.
- [ ] Ajouter un bouton recommencer.

## Etape 10 - Accessibilite et ergonomie

- [ ] Rendre tout jouable au clavier.
- [ ] Ajouter un focus visible sur tous les boutons.
- [ ] Ajouter des `aria-label` aux boutons audio et bonus.
- [ ] Ajouter une zone de statut lisible par lecteur d'ecran.
- [ ] Ne pas transmettre l'information uniquement par couleur.
- [ ] Verifier les contrastes.
- [ ] Tester mobile, tablette et desktop.

## Etape 11 - Documentation tuto

- [ ] Mettre a jour le README apres chaque grosse etape.
- [ ] Documenter la structure des niveaux.
- [ ] Documenter comment ajouter un mot.
- [ ] Documenter comment encoder une reponse.
- [ ] Documenter comment ajouter un son bonus.
- [ ] Expliquer la limite de l'anti-triche frontend.
- [ ] Garder une section `Roadmap backend`.

## Etape 12 - Future version backend

- [ ] Validation des reponses cote serveur.
- [ ] Sessions de jeu.
- [ ] Score signe.
- [ ] Pieces persistantes.
- [ ] Achat de pieces.
- [ ] Visionnage pub pour bonus ou multiplicateur x2.
- [ ] Limitation de tentatives.
- [ ] Anti-triche plus solide.

## Ordre conseille des prochains pushs

1. `docs: cadrer la refonte pedagogique`
2. `refactor: nettoyer le html et les boutons`
3. `style: poser le menu pawat labz`
4. `refactor: encapsuler l etat du jeu`
5. `data: structurer les niveaux`
6. `security: brouiller les reponses frontend`
7. `feat: ajouter le compteur de pieces`
8. `feat: ajouter les bonus audio`
9. `style: ameliorer le plateau de jeu`
10. `docs: documenter l ajout de niveaux`
