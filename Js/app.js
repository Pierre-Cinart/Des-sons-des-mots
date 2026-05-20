// Etape 2 : economie de pieces locale, menu enrichi et brouillage simple des donnees.
// Le but n'est pas de rendre la triche impossible en front, mais de cacher les donnees
// sensibles les plus evidentes pour eviter la lecture immediate en console.

// Recuperation des elements fixes du DOM.
const infoBar = document.querySelector("#infoBar");
const infoTxt = document.querySelector("#infoTxt");
const menu = document.querySelector("#menu");
const sounds = document.querySelector("#sounds");
const lettersEmpty = document.querySelector("#lettersEmpty");
const letters = document.querySelector("#letters");
const feedback = document.querySelector("#feedback");
const levelValue = document.querySelector("#levelValue");
const coinValue = document.querySelector("#coinValue");
const soundButtons = Array.from(sounds.querySelectorAll("[data-sound-index]"));
const panelToggles = {
    info: document.querySelectorAll("[data-toggle-info]"),
    credits: document.querySelectorAll("[data-toggle-credits]")
};
const panels = {
    info: document.querySelector("#infoTxt"),
    credits: document.querySelector("#creditsTxt")
};

// Variables audio.
let audio = new Audio();
let audioTxt = "";
let isPlaying = false;
let fx = new Audio();
let audioSources = [];
let audioContext = null;

// Variables d'environnement.
const maxLetters = 12;
const soundCosts = [0, 15, 30];
const rewardTable = [1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 5];
const obfuscationSalt = "pawat-labz-audio-demo";
const integritySalt = "des-sons-des-mots";

let randomList = [];
let game = false;
let currentLevel = 0;
let unlockedSounds = [true, false, false];

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
let secureWord = createSecureCell(""); // Mot cache dans une cellule brouillee.
let secureCoins = createSecureCell(0); // Pieces conservees dans une cellule brouillee.

// Initialise la partie au premier lancement.
function init() {
    fx.src = "./Audio/fx/click.mp3";
    resetWordPool();

    menu.classList.add("displayNone");
    setFeedback("");
    setCoins(0);
    updateCoinDisplay();
}

// Lance une nouvelle manche.
function newGame() {
    if (!ensureSecureState("demarrage")) {
        return;
    }

    if (!game) {
        init();
    }

    if (words.length === 0) {
        resetWordPool();
    }

    clearRound();

    setCurrentWord(randomWord(words));
    currentLevel += 1;
    levelValue.textContent = String(currentLevel);

    placeLetters();
    prepareAudioSources();
    renderAvailableLetters();
    renderAnswerSlots();
    updateSoundButtons();

    game = true;
}

// Nettoie l'affichage et stoppe le son actif avant une nouvelle manche.
function clearRound() {
    letters.replaceChildren();
    lettersEmpty.replaceChildren();
    setFeedback("");
    unlockedSounds = [true, false, false];

    audio.pause();
    audio.currentTime = 0;
    audioTxt = "";
    isPlaying = false;
}

// Prepare les trois sons du mot actif.
// Cette logique sera remplacee plus tard par des ids neutres pour brouiller les pistes.
function prepareAudioSources() {
    const currentWord = getCurrentWord();

    for (let i = 0; i < 3; i += 1) {
        audioSources[i] = "./Audio/" + currentWord + "/" + i + ".ogg";
    }
}

// Place aleatoirement les lettres du mot dans la banque de lettres.
function placeLetters() {
    const currentWord = getCurrentWord();

    randomList = [];
    const maxRandom = [];

    for (let i = 0; i < maxLetters; i += 1) {
        maxRandom[i] = i;
    }

    for (let i = 0; i < currentWord.length; i += 1) {
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
    const currentWord = getCurrentWord();

    for (let j = 0; j < randomList.length; j += 1) {
        if (position === randomList[j]) {
            return currentWord[j].toUpperCase();
        }
    }

    return randomLetter();
}

// Cree les emplacements vides de la reponse.
function renderAnswerSlots() {
    const currentWord = getCurrentWord();

    for (let i = 0; i < currentWord.length; i += 1) {
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

    if (!ensureSecureState("lecture-audio")) {
        return;
    }

    if (!unlockSound(nb)) {
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
    const currentWord = getCurrentWord();
    let good = true;

    for (let i = 0; i < lettersEmpty.children.length; i += 1) {
        if (lettersEmpty.children[i].textContent !== currentWord[i].toUpperCase()) {
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

    const reward = rollCoinReward();
    addCoins(reward);
    setFeedback("Bonne reponse ! +" + reward + " piece" + (reward > 1 ? "s" : "") + ".");

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
        "Cette demo Pawat Labz est en cours de developpement.\n" +
        "Le systeme de sauvegarde arrivera avec la mise en ligne."
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

function togglePanel(panelName) {
    const selectedPanel = panels[panelName];
    const isHidden = selectedPanel.hidden;

    Object.keys(panels).forEach((name) => {
        const shouldOpen = name === panelName ? isHidden : false;
        panels[name].hidden = !shouldOpen;
        panelToggles[name].forEach((button) => {
            button.setAttribute("aria-expanded", String(shouldOpen));
        });
    });
}

function createSecureCell(initialValue) {
    return encodeValue(initialValue);
}

function encodeValue(value) {
    const clearValue = String(value);
    const maskedChars = [];

    for (let i = 0; i < clearValue.length; i += 1) {
        const saltCode = obfuscationSalt.charCodeAt(i % obfuscationSalt.length);
        maskedChars.push(String.fromCharCode(clearValue.charCodeAt(i) ^ saltCode));
    }

    return {
        payload: btoa(maskedChars.join("")),
        digest: computeDigest(clearValue)
    };
}

function decodeValue(cell) {
    const maskedValue = atob(cell.payload);
    let clearValue = "";

    for (let i = 0; i < maskedValue.length; i += 1) {
        const saltCode = obfuscationSalt.charCodeAt(i % obfuscationSalt.length);
        clearValue += String.fromCharCode(maskedValue.charCodeAt(i) ^ saltCode);
    }

    if (cell.digest !== computeDigest(clearValue)) {
        throw new Error("Etat local invalide");
    }

    return clearValue;
}

function computeDigest(value) {
    let total = 0;
    const raw = integritySalt + "|" + value;

    for (let i = 0; i < raw.length; i += 1) {
        total = (total + raw.charCodeAt(i) * (i + 3)) % 1000003;
    }

    return String(total);
}

function ensureSecureState(source) {
    try {
        const coins = Number(decodeValue(secureCoins));
        const currentWord = decodeValue(secureWord);

        if (!Number.isInteger(coins) || coins < 0) {
            throw new Error("Pieces invalides");
        }

        if (game && currentWord.length === 0) {
            throw new Error("Mot manquant");
        }

        return true;
    } catch (error) {
        currentLevel = 0;
        levelValue.textContent = "0";
        secureCoins = encodeValue(0);
        secureWord = encodeValue("");
        words = [];
        game = false;
        menu.classList.remove("displayNone");
        updateCoinDisplay();
        updateSoundButtons();
        setFeedback("Verification anti-triche activee pendant " + source + ". La session locale a ete reinitialisee.");
        return false;
    }
}

function setCurrentWord(nextWord) {
    secureWord = encodeValue(nextWord);
}

function getCurrentWord() {
    return decodeValue(secureWord);
}

function setCoins(value) {
    secureCoins = encodeValue(value);
}

function getCoins() {
    return Number(decodeValue(secureCoins));
}

function addCoins(amount) {
    setCoins(getCoins() + amount);
    updateCoinDisplay();
    updateSoundButtons();
    playRewardFx(amount);
}

function spendCoins(amount) {
    const availableCoins = getCoins();

    if (availableCoins < amount) {
        return false;
    }

    setCoins(availableCoins - amount);
    updateCoinDisplay();
    updateSoundButtons();
    return true;
}

function updateCoinDisplay() {
    coinValue.textContent = String(getCoins());
}

function resetWordPool() {
    words = [
        "abeille", "avion", "bagarre", "canard", "cartoon", "cochon", "cuisine",
        "dauphin", "dinde", "enfant", "ferme", "hymne", "monstre", "oie"
    ];
}

function rollCoinReward() {
    return rewardTable[Math.trunc(Math.random() * rewardTable.length)];
}

function playRewardFx(reward) {
    if (reward === 5) {
        playSyntheticReward([880, 1320, 1760], 0.18);
        return;
    }

    if (reward >= 4) {
        playSyntheticReward([660, 990], 0.14);
        return;
    }

    fx.currentTime = 0;
    fx.src = "./Audio/fx/applaudissement.ogg";
    fx.play();
}

function playSyntheticReward(frequencies, duration) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
        fx.currentTime = 0;
        fx.src = "./Audio/fx/applaudissement.ogg";
        fx.play();
        return;
    }

    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const startTime = audioContext.currentTime;

    frequencies.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const noteStart = startTime + (index * duration * 0.65);
        const noteEnd = noteStart + duration;

        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency, noteStart);
        gainNode.gain.setValueAtTime(0.001, noteStart);
        gainNode.gain.linearRampToValueAtTime(0.12, noteStart + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, noteEnd);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteEnd);
    });
}

function unlockSound(index) {
    if (unlockedSounds[index]) {
        return true;
    }

    const cost = soundCosts[index];

    if (!spendCoins(cost)) {
        setFeedback("Il te faut " + cost + " pieces pour debloquer ce signal.");
        return false;
    }

    unlockedSounds[index] = true;
    updateSoundButtons();
    setFeedback("Signal " + String(index + 1).padStart(2, "0") + " debloque pour " + cost + " pieces.");
    return true;
}

function updateSoundButtons() {
    const coins = getCoins();

    soundButtons.forEach((button) => {
        const index = Number(button.dataset.soundIndex);
        const cost = soundCosts[index];
        const isUnlocked = unlockedSounds[index];
        const isAvailable = isUnlocked || coins >= cost;

        button.classList.toggle("sound-button--locked", !isUnlocked);
        button.classList.toggle("sound-button--ready", !isUnlocked && isAvailable);
        button.setAttribute(
            "aria-label",
            isUnlocked
                ? "Jouer le son " + String(index + 1)
                : "Debloquer le son " + String(index + 1) + " pour " + cost + " pieces"
        );

        const price = button.querySelector(".sound-button__price");
        price.textContent = isUnlocked ? (cost === 0 ? "Actif" : "Debloque") : (cost === 0 ? "Gratuit" : cost + " pieces");
    });
}

// Branchement des interactions fixes de la page.
document.querySelector("[data-start-game]").addEventListener("click", newGame);
panelToggles.info.forEach((button) => {
    button.addEventListener("click", () => togglePanel("info"));
});
panelToggles.credits.forEach((button) => {
    button.addEventListener("click", () => togglePanel("credits"));
});
sounds.querySelectorAll("[data-sound-index]").forEach((button) => {
    button.addEventListener("click", () => playSound(Number(button.dataset.soundIndex)));
});
updateCoinDisplay();
updateSoundButtons();
