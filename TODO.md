# TODO - Refonte Des sons et des mots

Cette liste sert de plan de travail avant de recoder le jeu. On avance etape par
etape, avec des changements petits, testables et faciles a relire.

## 0. Preparation

- [ ] Creer une branche de travail dediee, par exemple `refonte-jeu`.
- [ ] Garder une sauvegarde de la version actuelle.
- [ ] Verifier que le jeu actuel se lance avant modification.
- [ ] Definir le niveau minimum attendu pour la premiere version refondue.

## 1. Audit technique a corriger

- [ ] Corriger l'id incoherent entre `#_sounds` dans le HTML et `#sounds` dans le JS.
- [ ] Corriger le titre HTML : `DES SONS ET DES MOTS`.
- [ ] Remplacer les `onclick` inline par des `addEventListener`.
- [ ] Remplacer les `<p>` cliquables par des `<button>`.
- [ ] Remplacer les images cliquables de lecture par des boutons avec image ou icone.
- [ ] Supprimer les `console.log` inutiles.
- [ ] Corriger la variable globale accidentelle `rdm`.
- [ ] Supprimer les variables inutilisees ou temporaires.

## 2. Structure JavaScript propre

- [ ] Encapsuler le jeu dans un module ou une fonction principale.
- [ ] Limiter les variables globales.
- [ ] Creer un objet `gameState` clair :
  - [ ] partie lancee ;
  - [ ] niveau courant ;
  - [ ] lettres choisies ;
  - [ ] lettres disponibles ;
  - [ ] audio actif ;
  - [ ] score ou progression.
- [ ] Separer les fonctions par responsabilite :
  - [ ] initialisation ;
  - [ ] rendu du menu ;
  - [ ] rendu des sons ;
  - [ ] rendu des lettres ;
  - [ ] selection/retrait de lettre ;
  - [ ] validation ;
  - [ ] passage au niveau suivant.

## 3. Donnees de niveaux

- [ ] Creer une structure de donnees propre pour les niveaux.
- [ ] Eviter une liste `words` en clair directement exploitable.
- [ ] Donner un id neutre a chaque niveau, par exemple `sound-001`.
- [ ] Prevoir les champs suivants :
  - [ ] id neutre ;
  - [ ] chemins audio neutres ;
  - [ ] reponse encodee ;
  - [ ] lettres de distraction optionnelles ;
  - [ ] difficulte ;
  - [ ] categorie ou theme optionnel.
- [ ] Prevoir une fonction pour melanger les niveaux sans les supprimer
  definitivement.

## 4. Brouillage anti-triche frontend

- [ ] Renommer les dossiers audio pour ne plus reveler la reponse.
- [ ] Ne plus construire les chemins audio avec le mot.
- [ ] Stocker la bonne reponse sous forme encodee/chiffree legerement.
- [ ] Ajouter une fonction de decodage bien commentee.
- [ ] Decoder la reponse uniquement pendant la validation.
- [ ] Eviter de stocker la reponse decodee dans une variable globale.
- [ ] Comparer la proposition joueur avec la reponse decodee localement.
- [ ] Nettoyer la valeur decodee juste apres verification.
- [ ] Documenter clairement la limite : protection de brouillage, pas securite
  absolue.

## 5. Logique de jeu

- [ ] Afficher les emplacements vides selon la longueur du mot.
- [ ] Generer les lettres disponibles avec les lettres utiles et des leurres.
- [ ] Garantir que toutes les lettres du mot sont disponibles.
- [ ] Eviter les doublons problematiques si un mot contient plusieurs fois la
  meme lettre.
- [ ] Permettre de retirer une lettre deja posee.
- [ ] Ajouter un feedback clair :
  - [ ] bonne reponse ;
  - [ ] mauvaise reponse ;
  - [ ] niveau termine ;
  - [ ] fin de partie.
- [ ] Ajouter un bouton recommencer.

## 6. Accessibilite

- [ ] Rendre tout le jeu utilisable au clavier.
- [ ] Ajouter des `aria-label` aux boutons audio.
- [ ] Ajouter un message de statut lisible par lecteur d'ecran.
- [ ] Ajouter un focus visible.
- [ ] Eviter les informations donnees uniquement par la couleur.
- [ ] Verifier les contrastes principaux.

## 7. Interface et responsive

- [ ] Sortir les styles inline de `index.html`.
- [ ] Revoir la mise en page mobile.
- [ ] Eviter `overflow: hidden` si cela coupe le contenu.
- [ ] Garder une interface simple et ludique.
- [ ] Harmoniser les tailles de boutons et cases lettres.
- [ ] Ajouter une zone d'aide claire.

## 8. Audio

- [ ] Centraliser la lecture audio.
- [ ] Garantir qu'un seul son joue a la fois.
- [ ] Ajouter un etat visuel au bouton audio actif.
- [ ] Gerer les erreurs de chargement audio.
- [ ] Prevoir un volume ou mute plus tard si utile.

## 9. Documentation

- [ ] Mettre a jour le README apres chaque grosse etape.
- [ ] Documenter la structure des donnees de niveaux.
- [ ] Expliquer comment ajouter un nouveau mot.
- [ ] Expliquer comment encoder une reponse.
- [ ] Noter les limites de l'anti-triche frontend.

## 10. Future version backend

- [ ] Preparer l'idee d'une API de session.
- [ ] Generer les niveaux cote serveur.
- [ ] Valider les reponses cote serveur.
- [ ] Ne jamais envoyer la reponse brute au client.
- [ ] Signer les scores.
- [ ] Ajouter une limite de tentatives.
- [ ] Ajouter une detection d'abus simple.

## Ordre conseille pour le prochain travail

1. Nettoyage HTML et evenements.
2. Encapsulation du JS et etat de jeu propre.
3. Donnees de niveaux avec ids neutres.
4. Renommage audio et brouillage des reponses.
5. Validation de gameplay.
6. Accessibilite et responsive.
7. README finalise.
