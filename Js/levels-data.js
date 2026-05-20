// Module de donnees de niveaux — anti-triche frontend + systeme de difficulte.
//
// STRUCTURE DES DOSSIERS AUDIO :
//   Audio/easy/sXXX/    — niveaux 1 a 5   (mots du vocabulaire courant)
//   Audio/medium/sXXX/  — niveaux 6 a 15  (a remplir plus tard)
//   Audio/hard/sXXX/    — niveaux 16+     (a remplir plus tard)
//
//   Le folderId contient le chemin relatif depuis Audio/ :
//   ex: "easy/s004" → Audio/easy/s004/0.ogg
//
// ANTI-TRICHE :
//   Les mots sont stockes encodes (XOR + base64). Les noms de mots n'apparaissent
//   jamais en clair dans ce fichier. Voir decodeLevel() pour le decodage.
//
// SEL DE BROUILLAGE :
//   AUDIO_SALT doit rester identique au sel utilise dans app.js.
//   Si tu changes ce sel, regenere TOUS les encoded de la table LEVELS_BY_DIFFICULTY
//   avec la commande documentee en bas de ce fichier.

const AUDIO_SALT = "pawat-labz-audio-demo";

// ─── Decodage ─────────────────────────────────────────────────────────────────

// Decode un payload XOR+base64 vers le mot en clair.
// A appeler uniquement pendant la preparation d'un niveau, pas en continu.
function decodeLevel(payload) {
    const raw = atob(payload);
    let word = "";
    for (let i = 0; i < raw.length; i += 1) {
        word += String.fromCharCode(
            raw.charCodeAt(i) ^ AUDIO_SALT.charCodeAt(i % AUDIO_SALT.length)
        );
    }
    return word;
}

// ─── Table des niveaux ────────────────────────────────────────────────────────
//
// Chaque entree contient :
//   folderId : chemin relatif depuis Audio/ vers le dossier des sons du niveau.
//              Format : "difficulte/id"  ex: "easy/s004", "medium/s015"
//   encoded  : mot encode en XOR+base64 — les mots en clair n'apparaissent PAS ici.
//
// Pour ajouter un nouveau niveau :
//   1. Placer les sons dans Audio/<difficulte>/sXXX/ (0.ogg, 1.ogg, 2.ogg).
//   2. Encoder le mot avec la commande ci-dessous.
//   3. Ajouter { folderId: "<difficulte>/sXXX", encoded: "..." } dans le bon tier.
//
// Commande d'encodage (remplacer MOT par le mot a encoder) :
//   node -e "
//     const s='pawat-labz-audio-demo', w='MOT';
//     const c=[];
//     for(let i=0;i<w.length;i++) c.push(String.fromCharCode(w.charCodeAt(i)^s.charCodeAt(i%s.length)));
//     console.log(Buffer.from(c.join('')).toString('base64'));
//   "

const LEVELS_BY_DIFFICULTY = {

    // Easy : vocabulaire tres courant, sons courts et distincts (niveaux 1-5).
    // Sert aussi de repli si medium ou hard est vide.
    easy: [
        { folderId: "easy/s001", encoded: "EQMSCBhBCQ==" }, // abeille
        { folderId: "easy/s002", encoded: "ERceDho="     }, // avion
        { folderId: "easy/s004", encoded: "EwAZAAZJ"     }, // canard
        { folderId: "easy/s006", encoded: "Ew4UCRtD"     }, // cochon
        { folderId: "easy/s009", encoded: "FAgZBRE="     }, // dinde
        { folderId: "easy/s014", encoded: "HwgS"         }  // oie
    ],

    // Medium : mots un peu plus longs ou moins frequents (niveaux 6-15).
    medium: [
        { folderId: "medium/s003", encoded: "EgAQAAZfCQ==" }, // bagarre
        { folderId: "medium/s007", encoded: "ExQeEh1DCQ==" }, // cuisine
        { folderId: "medium/s010", encoded: "FQ8RABpZ"     }, // enfant
        { folderId: "medium/s011", encoded: "FgQFDBE="     }, // ferme
        { folderId: "medium/s012", encoded: "GBgaDxE="     }  // hymne
    ],

    // Hard : mots moins courants ou sons plus complexes (niveaux 16+).
    hard: [
        { folderId: "hard/s005", encoded: "EwAFFRtCAg==" }, // cartoon
        { folderId: "hard/s008", encoded: "FAACERxEAg==" }, // dauphin
        { folderId: "hard/s013", encoded: "HQ4ZEgBfCQ==" }  // monstre
    ]
};

// ─── Acces au pool ────────────────────────────────────────────────────────────

// Retourne le pool de niveaux pour un tier donne.
// Si le tier demande est vide, repli automatique sur easy.
// Retourne toujours une copie du tableau pour ne pas modifier l'original.
function getLevelPool(tier) {
    const pool = LEVELS_BY_DIFFICULTY[tier];
    if (!pool || pool.length === 0) {
        return LEVELS_BY_DIFFICULTY.easy.slice();
    }
    return pool.slice();
}

// Retourne le nombre total de niveaux disponibles tous tiers confondus.
// Utilise pour detecter la fin de partie quand tout a ete joue.
function getTotalLevelCount() {
    return Object.values(LEVELS_BY_DIFFICULTY).reduce(
        (sum, tier) => sum + tier.length,
        0
    );
}
