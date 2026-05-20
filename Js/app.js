// Etape 1 : nettoyage sans refonte complete du gameplay.
// Objectif : remplacer les evenements inline par des listeners JS, corriger les ids
// et utiliser de vrais boutons pour preparer l'accessibilite des prochaines etapes.

// Recuperation des elements fixes du DOM.
const infoBar = document.querySelector("#infoBar");
const infoTxt = document.querySelector("#infoTxt");
const menu = document.querySelector("#menu");
const sounds = document.querySelector("#sounds");
const lettersEmpty = document.querySelector("#lettersEmpty");
const letters = document.querySelector("#letters");
const feedback = document.querySelector("#feedback");
const levelValue = document.querySelector("#levelValue");

// Variables audio.
let audio = new Audio();
let audioTxt = "";
let isPlaying = false;
let fx = new Audio();
let audioSources = [];

// Variables d'environnement.
const maxLetters = 12;

let randomList = [];
let game = false;
let currentLevel = 0;

const alphabet = [
    "A", "A", "A", "B", "C", "C", "C",
    "D", "E", "E", "E", "F", "G", "H",
    "I", "I", "S", "J", "K", "L", "A", "L",
    "M", "M", "A", "N", "O", "O", "P", "P", "V",
    "Q", "R", "S", "S", "I", "S", "T", "U", "V", "V", "V", "W",
    "X", "Y", "Z", "A", "N", "E", "E", "R", "I", "I",
    "V", "E", "T", "E", "M", "M", "O", "O", "H", "I", "I",
    "L", "L", "D", "E", "A", "N", "R", "F", "G",
    "Q", "R", "S", "K", "L", "A", "L", "N", "R", "F", "W"
];

let words = []; // Tableau des mots encore disponibles.
let word = ""; // Mot a trouver. Il sera cache plus tard pendant l'etape anti-triche.

// Initialise la partie au premier lancement.
function init() {
    fx.src = "./Audio/fx/click.mp3";
    words = [
        "abeille", "avion", "bagarre", "canard", "cartoon", "cochon", "cuisine",
        "dauphin", "dinde", "enfant", "ferme", "hymne", "monstre", "oie"
    ];

    menu.classList.add("displayNone");
    setFeedback("");
}

// Lance une nouvelle manche.
function newGame() {
    if (!game) {
        init();
    }

    clearRound();

    word = randomWord(words);
    currentLevel += 1;
    levelValue.textContent = String(currentLevel);

    placeLetters();
    prepareAudioSources();
    renderAvailableLetters();
    renderAnswerSlots();

    game = true;
}

// Nettoie l'affichage et stoppe le son actif avant une nouvelle manche.
function clearRound() {
    letters.replaceChildren();
    lettersEmpty.replaceChildren();
    setFeedback("");

    audio.pause();
    audio.currentTime = 0;
    audioTxt = "";
    isPlaying = false;
}

// Prepare les trois sons du mot actif.
// Cette logique sera remplacee plus tard par des ids neutres pour brouiller les pistes.
function prepareAudioSources() {
    for (let i = 0; i < 3; i += 1) {
        audioSources[i] = "./Audio/" + word + "/" + i + ".ogg";
    }
}

// Place aleatoirement les lettres du mot dans la banque de lettres.
function placeLetters() {
    randomList = [];
    const maxRandom = [];

    for (let i = 0; i < maxLetters; i += 1) {
        maxRandom[i] = i;
    }

    for (let i = 0; i < word.length; i += 1) {
        const rdm = Math.trunc(Math.random() * maxRandom.length);
        randomList[i] = maxRandom[rdm];
        maxRandom.splice(rdm, 1);
    }
}

// Selectionne un mot aleatoire puis le retire de la liste courante.
function randomWord(list) {
    const rdm = Math.trunc(Math.random() * list.length);
    const selectedWord = list[rdm];

    list.splice(rdm, 1);
    return selectedWord;
}

// Retourne une lettre leurre aleatoire.
function randomLetter() {
    return alphabet[Math.trunc(Math.random() * alphabet.length)];
}

// Cree les boutons de lettres disponibles.
function renderAvailableLetters() {
    for (let i = 0; i < maxLetters; i += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "letter";
        button.textContent = getLetterForPosition(i);
        button.setAttribute("aria-label", "Choisir la lettre " + button.textContent);
        button.addEventListener("click", () => clickLetter(button));

        letters.appendChild(button);
    }
}

// Recupere la bonne lettre si la position correspond au mot, sinon cree un leurre.
function getLetterForPosition(position) {
    for (let j = 0; j < randomList.length; j += 1) {
        if (position === randomList[j]) {
            return word[j].toUpperCase();
        }
    }

    return randomLetter();
}

// Cree les emplacements vides de la reponse.
function renderAnswerSlots() {
    for (let i = 0; i < word.length; i += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "letterEmpty";
        button.textContent = "_";
        button.setAttribute("aria-label", "Retirer cette lettre");
        button.addEventListener("click", () => resetLetter(button));

        lettersEmpty.appendChild(button);
    }
}

// Joue, met en pause ou reprend un son selon le bouton choisi.
function playSound(nb) {
    if (!game) {
        setFeedback("Lance une partie avant de jouer un son.");
        return;
    }

    if (audioTxt !== audioSources[nb]) {
        audio.currentTime = 0;
        audio.src = audioSources[nb];
        audio.play();
        audioTxt = audioSources[nb];
        isPlaying = true;
        return;
    }

    if (audioTxt === audioSources[nb] && isPlaying) {
        audio.pause();
        isPlaying = false;
        return;
    }

    audio.play();
    isPlaying = true;
}

// Ajoute une lettre choisie dans le premier emplacement libre.
function clickLetter(letter) {
    fx.currentTime = 0;
    fx.src = "./Audio/fx/click.mp3";
    fx.play();

    for (let i = 0; i < lettersEmpty.children.length; i += 1) {
        if (lettersEmpty.children[i].textContent === "_" && letter.textContent !== " ") {
            lettersEmpty.children[i].textContent = letter.textContent;
            letter.textContent = " ";
            letter.setAttribute("aria-label", "Emplacement de lettre vide");
            checkIfAnswerIsComplete();
            return;
        }
    }
}

// Verifie si toutes les cases de reponse sont remplies avant de tester le mot.
function checkIfAnswerIsComplete() {
    for (let i = 0; i < lettersEmpty.children.length; i += 1) {
        if (lettersEmpty.children[i].textContent === "_") {
            return;
        }
    }

    testWord();
}

// Retire une lettre posee et la replace dans la premiere case disponible.
function resetLetter(letter) {
    if (letter.textContent === "_") {
        return;
    }

    for (let i = 0; i < letters.children.length; i += 1) {
        if (letters.children[i].textContent === " ") {
            letters.children[i].textContent = letter.textContent;
            letters.children[i].setAttribute("aria-label", "Choisir la lettre " + letter.textContent);
            letter.textContent = "_";
            clearWrongAnswerState();
            return;
        }
    }
}

// Enleve le feedback visuel rouge apres correction d'une reponse.
function clearWrongAnswerState() {
    if (lettersEmpty.children[0]?.classList.contains("letterEmpty--wrong")) {
        for (let i = 0; i < lettersEmpty.children.length; i += 1) {
            lettersEmpty.children[i].classList.remove("letterEmpty--wrong");
        }
        setFeedback("");
    }
}

// Compare la proposition du joueur avec le mot courant.
function testWord() {
    let good = true;

    for (let i = 0; i < lettersEmpty.children.length; i += 1) {
        if (lettersEmpty.children[i].textContent !== word[i].toUpperCase()) {
            good = false;
        }
    }

    if (good) {
        handleGoodAnswer();
        return;
    }

    handleWrongAnswer();
}

// Feedback et passage automatique a la manche suivante.
function handleGoodAnswer() {
    for (let i = 0; i < lettersEmpty.children.length; i += 1) {
        lettersEmpty.children[i].classList.add("letterEmpty--good");
    }

    setFeedback("Bonne reponse !");

    if (words.length >= 1) {
        fx.currentTime = 0;
        fx.pause();
        fx.src = "./Audio/fx/applaudissement.ogg";
        fx.play();
        setTimeout(newGame, 2000);
        return;
    }

    alert(
        "Vous avez trouve tous les mots.\n" +
        "Cette application est en cours de developpement.\n" +
        "Pour toute suggestion, rendez-vous sur https://cinartdev.fr rubrique contact."
    );
}

// Feedback en cas d'erreur.
function handleWrongAnswer() {
    for (let i = 0; i < lettersEmpty.children.length; i += 1) {
        lettersEmpty.children[i].classList.add("letterEmpty--wrong");
    }

    setFeedback("Mauvaise reponse, corrige une lettre pour reessayer.");
}

function setFeedback(message) {
    feedback.textContent = message;
}

function showInfo() {
    const isHidden = infoTxt.hidden;
    infoTxt.hidden = !isHidden;

    document.querySelectorAll("[data-toggle-info]").forEach((button) => {
        button.setAttribute("aria-expanded", String(isHidden));
    });
}

// Branchement des interactions fixes de la page.
document.querySelector("[data-start-game]").addEventListener("click", newGame);
document.querySelectorAll("[data-toggle-info]").forEach((button) => {
    button.addEventListener("click", showInfo);
});
sounds.querySelectorAll("[data-sound-index]").forEach((button) => {
    button.addEventListener("click", () => playSound(Number(button.dataset.soundIndex)));
});
