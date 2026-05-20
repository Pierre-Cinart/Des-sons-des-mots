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
const rewardOverlay = document.querySelector("#rewardOverlay");
const rewardChestButton = document.querySelector("#rewardChestButton");
const rewardChestImage = document.querySelector("#rewardChestImage");
const rewardTicker = document.querySelector("#rewardTicker");
const rewardAmount = document.querySelector("#rewardAmount");
const rewardAmountValue = document.querySelector("#rewardAmountValue");
const rewardContinue = document.querySelector("#rewardContinue");
const helpButton = document.querySelector("#helpButton");
const helpOverlay = document.querySelector("#helpOverlay");
const helpClose = document.querySelector("#helpClose");
// References au bouton quitter et a sa zone conteneur (visibles uniquement en partie)
const quitZone = document.querySelector("#quitZone");
const quitButton = document.querySelector("#quitButton");
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
let roundResolved = false;
let pendingReward = 0;
let pendingEndOfGame = false;
let rewardCanOpen = false;
let rewardTickerTimer = null;

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
    currentLevel = 0;
    levelValue.textContent = "0";

    menu.classList.add("displayNone");
    document.body.classList.remove("is-menu-open");
    setFeedback("");
    setCoins(0);
    updateCoinDisplay();

    // Rend le bouton QUITTER visible maintenant qu'une partie est en cours
    quitZone.hidden = false;
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
    hideRewardOverlay();

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
    roundResolved = false;
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

// Gere la lecture des pistes d'indice.
// 1. On refuse la lecture si aucune partie n'est active.
// 2. On bloque les sons apres une bonne reponse pour eviter de continuer
//    a manipuler la manche pendant l'animation du coffre.
// 3. On verifie l'etat local avant de debloquer ou jouer une piste.
// 4. On utilise safePlay() pour eviter les erreurs console quand le navigateur
//    interrompt volontairement une lecture audio.
function playSound(nb) {
    if (!game) {
        setFeedback("Lance une partie avant de jouer un son.");
        return;
    }

    if (roundResolved) {
        setFeedback("Ouvre le coffre pour recuperer ta recompense.");
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
        safePlay(audio);
        audioTxt = audioSources[nb];
        isPlaying = true;
        return;
    }

    if (audioTxt === audioSources[nb] && isPlaying) {
        audio.pause();
        isPlaying = false;
        return;
    }

    safePlay(audio);
    isPlaying = true;
}

// Ajoute une lettre choisie dans le premier emplacement libre.
function clickLetter(letter) {
    if (roundResolved) {
        return;
    }

    fx.currentTime = 0;
    fx.src = "./Audio/fx/click.mp3";
    safePlay(fx);

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
    if (roundResolved) {
        return;
    }

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
    if (roundResolved) {
        return;
    }

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

// Verrouille la manche et lance le coffre de recompense.
// Important pedagogique :
// - la piste audio en cours est arretee des que le mot est devine ;
// - les pieces ne sont pas creditees immediatement ;
// - le gain est garde en attente dans pendingReward ;
// - l'ajout au compteur se fait seulement quand le coffre est ouvert.
// Cette separation rend la boucle de jeu plus claire :
// "bonne reponse" -> "coffre" -> "gain" -> "continuer".
function handleGoodAnswer() {
    roundResolved = true;
    stopActiveAudio();

    for (let i = 0; i < lettersEmpty.children.length; i += 1) {
        lettersEmpty.children[i].classList.add("letterEmpty--good");
    }

    pendingReward = rollCoinReward();
    pendingEndOfGame = words.length < 1;
    setFeedback("Bonne reponse ! Ouvre le coffre pour reveler les pieces.");

    fx.currentTime = 0;
    fx.pause();
    fx.src = "./Audio/fx/applaudissement.ogg";
    safePlay(fx);

    showRewardOverlay();
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

// Affiche ou masque l'aide de jeu.
// Cette aide est volontairement separee du panneau "Infos" du menu :
// - "Infos" presente le projet et la beta avant de jouer ;
// - "Aide" accompagne le joueur pendant la partie avec les actions utiles.
function toggleHelp(isOpen) {
    helpOverlay.hidden = !isOpen;
    helpButton.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) {
        helpClose.focus();
        return;
    }

    helpButton.focus();
}

function stopActiveAudio() {
    audio.pause();
    audio.currentTime = 0;
    audioTxt = "";
    isPlaying = false;
}

function safePlay(media) {
    const playPromise = media.play();

    if (playPromise?.catch) {
        playPromise.catch(() => {
            // Certains navigateurs rejettent play() si un son est coupe trop vite.
            // On garde l'erreur silencieuse pour ne pas polluer la console en beta.
        });
    }
}

function showRewardOverlay() {
    clearInterval(rewardTickerTimer);
    rewardCanOpen = false;
    rewardOverlay.hidden = false;
    rewardOverlay.classList.remove("reward-overlay--opened");
    rewardOverlay.classList.add("reward-overlay--entering");
    rewardChestButton.disabled = true;
    rewardChestImage.src = "Images/chest_close.webp";
    rewardChestImage.alt = "Coffre ferme";
    rewardTicker.textContent = "?";
    rewardAmount.hidden = true;
    rewardContinue.hidden = true;

    // La courte attente laisse le zoom-in se terminer avant d'autoriser le clic.
    setTimeout(() => {
        rewardCanOpen = true;
        rewardChestButton.disabled = false;
        rewardChestButton.focus();
        rewardOverlay.classList.remove("reward-overlay--entering");
    }, 650);
}

function hideRewardOverlay() {
    clearInterval(rewardTickerTimer);
    rewardOverlay.hidden = true;
    rewardOverlay.classList.remove("reward-overlay--entering", "reward-overlay--opened");
    rewardChestButton.disabled = true;
    rewardCanOpen = false;
}

function openRewardChest() {
    if (!rewardCanOpen || rewardOverlay.classList.contains("reward-overlay--opened")) {
        return;
    }

    rewardCanOpen = false;
    rewardChestButton.disabled = true;
    rewardOverlay.classList.add("reward-overlay--opened");
    rewardChestImage.src = "Images/chest_open.webp";
    rewardChestImage.alt = "Coffre ouvert";
    animateRewardTicker();
}

function animateRewardTicker() {
    const startTime = Date.now();
    const duration = 850;

    clearInterval(rewardTickerTimer);
    rewardTickerTimer = setInterval(() => {
        const nextNumber = Math.trunc(Math.random() * 5) + 1;
        rewardTicker.textContent = String(nextNumber);

        if (Date.now() - startTime >= duration) {
            clearInterval(rewardTickerTimer);
            revealReward();
        }
    }, 60);
}

function revealReward() {
    rewardTicker.textContent = String(pendingReward);
    rewardAmountValue.textContent = String(pendingReward);
    rewardAmount.hidden = false;
    rewardContinue.hidden = false;
    addCoins(pendingReward);
    rewardContinue.focus();
}

function continueAfterReward() {
    hideRewardOverlay();

    if (pendingEndOfGame) {
        // Fin de partie complete : cache le bouton quitter avant de revenir au menu
        quitZone.hidden = true;
        alert(
            "Vous avez trouve tous les mots.\n" +
            "Cette demo Pawat Labz est en cours de developpement.\n" +
            "Le systeme de sauvegarde arrivera avec la mise en ligne."
        );
        menu.classList.remove("displayNone");
        document.body.classList.add("is-menu-open");
        game = false;
        return;
    }

    newGame();
}

// Abandonne la partie en cours et retourne au menu principal.
//
// Sequence d'execution :
//   1. Arret audio      — on coupe tout son pour ne pas laisser de bruit orphelin.
//   2. Remise a zero    — compteurs de niveau et de pieces reinitialises.
//   3. Nettoyage visuel — plateau, coffre et feedback vides.
//   4. Effacement mot   — la cellule brouillee est remplacee par une cellule vide
//                         pour ne laisser aucune trace de la session en memoire.
//   5. Retour menu      — on reactive la classe is-menu-open et on masque le plateau.
//   6. Masquage bouton  — le bouton QUITTER disparait car on n'est plus en partie.
//
// Note : les pieces sont remises a 0 ici car il n'y a pas encore de sauvegarde.
// Quand le systeme de sauvegarde sera ajoute, on conservera les pieces entre les sessions.
function quitGame() {
    // 1. Arret immediat du son en cours
    stopActiveAudio();

    // 2. Reinitialisation des compteurs
    currentLevel = 0;
    levelValue.textContent = "0";
    setCoins(0);
    updateCoinDisplay();

    // 3. Nettoyage visuel du plateau (lettres, reponse, feedback, son)
    clearRound();
    hideRewardOverlay();

    // 4. Effacement du mot brouille stocke en memoire
    secureWord = createSecureCell("");

    // 5. Desactivation de l'etat de partie et retour au menu
    game = false;
    menu.classList.remove("displayNone");
    document.body.classList.add("is-menu-open");

    // 6. Cache le bouton quitter : on est de retour au menu
    quitZone.hidden = true;

    setFeedback("");
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
    safePlay(fx);
}

function playSyntheticReward(frequencies, duration) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
        fx.currentTime = 0;
        fx.src = "./Audio/fx/applaudissement.ogg";
        safePlay(fx);
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
        const lockPanel = button.querySelector(".sound-button__lock");
        const lockCost = lockPanel.querySelector("strong");

        price.textContent = isUnlocked ? (cost === 0 ? "Actif" : "Debloque") : (cost === 0 ? "Gratuit" : cost + " pieces");
        lockCost.textContent = String(cost);
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
rewardChestButton.addEventListener("click", openRewardChest);
rewardContinue.addEventListener("click", continueAfterReward);
helpButton.addEventListener("click", () => toggleHelp(true));
helpClose.addEventListener("click", () => toggleHelp(false));
// Branche le bouton QUITTER sur la fonction d'abandon de partie
quitButton.addEventListener("click", quitGame);
helpOverlay.addEventListener("click", (event) => {
    if (event.target === helpOverlay) {
        toggleHelp(false);
    }
});
updateCoinDisplay();
updateSoundButtons();
