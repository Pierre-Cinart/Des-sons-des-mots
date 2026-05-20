# TODO - Suivi de refonte

La roadmap principale est maintenant stockee dans :

- `Data/todo-roadmap.json`

Elle est consultable et cochable via :

- `todo.html`

## Pourquoi ce format

- Le JSON sert de source de verite modifiable facilement.
- La page `todo.html` affiche les etapes sous forme de checklist cliquable.
- L'avancement est sauvegarde dans le navigateur avec `localStorage`.
- La progression peut etre exportee et importee en JSON.
- Plus tard, le meme systeme pourra etre branche sur un backend.

## Comment l'utiliser

1. Lancer le projet avec un serveur local.
2. Ouvrir `todo.html`.
3. Cocher les taches au fur et a mesure.
4. Exporter la progression avant un changement important si besoin.

Note : ouvrir `todo.html` directement en `file://` peut bloquer le chargement du
JSON selon le navigateur. Un serveur local est recommande.

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
