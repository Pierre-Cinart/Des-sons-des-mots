// Des Sons & Des Mots — Pawat Labz
// Moteur de jeu complet : economie de pieces, niveaux par tiers, brouillage XOR+base64,
// systeme de vies, coffre de recompense, bonus (cadeau / suppression leurre / melange),
// anti-triche par invariant earned/spent, overlays Game Over et Felicitations.
//
// Architecture front-only : la securite sert a brouiller les pistes en console,
// pas a remplacer un futur backend. Voir levels-data.js pour encoder de nouveaux mots.
//
// Flux principal d'une manche :
//   newGame() → placeLetters() → renderAvailableLetters() → renderAnswerSlots()
//   → joueur ecoute / pose des lettres → validateAnswer() → testWord()
//   → handleGoodAnswer() → showRewardOverlay() → openRewardChest() → revealReward()
//   → continueAfterReward() → newGame() (ou showCongrats si fin de session)
//
// Flux anti-triche (fin de chaque niveau) :
//   continueAfterReward() → checkAntiCheat()
//   Invariant : getCoins() doit etre exactement egal a sessionEarned - sessionSpent.
//   Toute injection console detectee → confiscation totale + message + son d'erreur.

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
// Boutons de controle de la banque de lettres
const shuffleButton          = document.querySelector("#shuffleButton");
const bonusLetterButton      = document.querySelector("#bonusLetterButton");
const bonusSupButton         = document.querySelector("#bonusSupButton");
const bonusLetterCostDisplay = document.querySelector("#bonusLetterCostDisplay");
const bonusSupCostDisplay    = document.querySelector("#bonusSupCostDisplay");
// Zone d'action : vies + bouton VALIDER
const actionZone     = document.querySelector("#actionZone");
const validateButton = document.querySelector("#validateButton");
const livesIcons     = document.querySelector("#livesIcons");
// Overlay game over et ses elements
const gameOverOverlay = document.querySelector("#gameOverOverlay");
const gameOverLevel   = document.querySelector("#gameOverLevel");
const gameOverCoins   = document.querySelector("#gameOverCoins");
const gameOverRestart = document.querySelector("#gameOverRestart");
const gameOverQuit    = document.querySelector("#gameOverQuit");
// Overlay felicitations : affiche en fin de session quand tous les mots ont ete trouves
const congratsOverlay = document.querySelector("#congratsOverlay");
const congratsLevel   = document.querySelector("#congratsLevel");
const congratsCoins   = document.querySelector("#congratsCoins");
const congratsRestart = document.querySelector("#congratsRestart");
const congratsQuit    = document.querySelector("#congratsQuit");
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

// Nombre d'erreurs cumule sur toute la partie (pas par manche).
// Quand errorCount atteint maxErrors, c'est game over.
let errorCount = 0;
const maxErrors = 3;

// Couts des bonus — doublent a chaque achat sur toute la partie, reinitialises a init()
let bonusLetterCost = 5;
let bonusSupCost    = 5;

// Traceurs anti-triche : coherence des pieces verifiee en fin de chaque niveau.
// Invariant attendu a tout moment : getCoins() === sessionEarned - sessionSpent
// sessionEarned : pieces gagnees uniquement via les coffres (revealReward)
// sessionSpent  : pieces depensees via spendCoins (sons + bonus)
let sessionEarned = 0;
let sessionSpent  = 0;

let randomList = [];
let game = false;
let currentLevel = 0;
let unlockedSounds = [true, false, false];
let roundResolved = false;
let pendingReward = 0;
let pendingEndOfGame = false;
let rewardCanOpen = false;
let rewardTickerTimer = null;
let cheatPenaltyTimer = null;

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

// Ensemble des folderIds joues dans la session active.
// Reinitialise uniquement au debut d'une nouvelle partie (init()).
// Permet d'eviter de rejouer deux fois le meme son dans la meme partie.
const sessionUsed = new Set();

let currentFolderId = ""; // Chemin relatif du dossier audio courant (ex: "easy/s004").
let secureWord = createSecureCell(""); // Mot cache dans une cellule brouillee.
let secureCoins = createSecureCell(0); // Pieces conservees dans une cellule brouillee.

// Initialise la partie au premier lancement.
// Remet a zero tous les compteurs et vide la memoire des sons joues.
function init() {
    fx.src = "./Audio/fx/click.mp3";

    // Vide la memoire des sons joues : chaque nouvelle partie repart de zero
    sessionUsed.clear();

    // Remet le compteur d'erreurs a zero pour la nouvelle partie
    errorCount = 0;

    currentLevel = 0;
    levelValue.textContent = "0";

    menu.classList.add("displayNone");
    document.body.classList.remove("is-menu-open");
    setFeedback("");
    setCoins(0);
    sessionEarned = 0;
    sessionSpent  = 0;
    updateCoinDisplay();

    // Remet les couts des bonus a leur valeur de depart pour la nouvelle partie
    bonusLetterCost = 5;
    bonusSupCost    = 5;

    // Affiche les zones de jeu actives : vies, VALIDER, QUITTER
    actionZone.hidden = false;
    quitZone.hidden   = false;

    // Initialise l'affichage des vies pour la nouvelle partie
    renderLives();
    updateBonusButtons();
}

// Lance une nouvelle manche.
// Sequence : verification integrite → init si premier lancement →
// construction du pool disponible → selection anti-repetition → affichage.
function newGame() {
    if (!ensureSecureState("demarrage")) {
        return;
    }

    if (!game) {
        init();
    }

    clearRound();
    hideRewardOverlay();

    // Construit le pool des niveaux jouables pour ce round
    // (bon tier de difficulte, filtre les sons deja joues dans la session)
    const available = buildAvailablePool();

    // Selectionne un niveau au hasard dans le pool disponible
    const chosen = randomLevel(available);

    // Marque ce niveau comme joue dans la session pour eviter les repetitions
    sessionUsed.add(chosen.folderId);

    setCurrentWord(chosen);
    currentLevel += 1;
    levelValue.textContent = String(currentLevel);

    placeLetters();
    prepareAudioSources();
    renderAvailableLetters();
    renderAnswerSlots();
    updateSoundButtons();

    game = true;
    updateBonusButtons(); // game vient de passer a true : active les boutons bonus
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
    updateBonusButtons();
}

// Prepare les trois sources audio du niveau courant.
// On utilise currentFolderId (ex: "easy/s004") et non le mot en clair :
// les requetes reseau afficheront Audio/easy/s004/0.ogg et non le mot correspondant.
//
// Fisher-Yates : on melange les indices [0, 1, 2] pour que Signal 01/02/03
// ne correspondent pas toujours aux memes fichiers d'une partie a l'autre.
// Rejouer le meme mot ne garantit plus d'entendre le meme son sur le premier signal.
function prepareAudioSources() {
    const indices = [0, 1, 2];
    for (let i = indices.length - 1; i > 0; i -= 1) {
        const j = Math.trunc(Math.random() * (i + 1));
        const tmp = indices[i];
        indices[i] = indices[j];
        indices[j] = tmp;
    }
    for (let i = 0; i < 3; i += 1) {
        audioSources[i] = "./Audio/" + currentFolderId + "/" + indices[i] + ".ogg";
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

// Selectionne un niveau aleatoire dans un pool sans le retirer.
// Le marquage comme "joue" est gere separement via sessionUsed.
function randomLevel(pool) {
    return pool[Math.trunc(Math.random() * pool.length)];
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

        // Vague d'apparition : chaque lettre rebondit avec un delai croissant
        button.style.animationDelay = (i * 35) + "ms";
        button.classList.add("letter--wave");
        button.addEventListener("animationend", () => {
            button.classList.remove("letter--wave");
            button.style.animationDelay = "";
        }, { once: true });

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

// Verifie si toutes les cases de reponse sont remplies.
// La validation n'est plus automatique : elle se declenche uniquement
// via le bouton VALIDER (voir validateAnswer).
function checkIfAnswerIsComplete() {
    for (let i = 0; i < lettersEmpty.children.length; i += 1) {
        if (lettersEmpty.children[i].textContent === "_") {
            return false;
        }
    }
    return true;
}

// Declenche la validation de la reponse quand le joueur clique VALIDER.
// Si la reponse est incomplete, la zone de reponse tremble pour signaler
// les cases vides sans interrompre le placement des lettres.
function validateAnswer() {
    if (roundResolved) { return; }

    if (!checkIfAnswerIsComplete()) {
        // Reponse incomplete : tremblement visuel + message
        shakeAnswerZone();
        setFeedback("Remplis toutes les cases avant de valider !");
        return;
    }

    // Toutes les cases sont remplies : on teste la reponse
    testWord();
}

// Applique une animation de tremblement a la zone de reponse.
// La classe CSS est retiree automatiquement a la fin de l'animation.
function shakeAnswerZone() {
    // On retire d'abord la classe pour relancer l'animation si elle est deja active.
    lettersEmpty.classList.remove("answer-slots--shake");

    // Forcer un reflow : sans ca le navigateur ne voit pas la suppression
    // et ne relance pas l'animation.
    void lettersEmpty.offsetWidth;

    lettersEmpty.classList.add("answer-slots--shake");

    lettersEmpty.addEventListener("animationend", function onEnd() {
        lettersEmpty.classList.remove("answer-slots--shake");
        lettersEmpty.removeEventListener("animationend", onEnd);
    });
}

// Retire une lettre posee et la replace dans la premiere case disponible.
function resetLetter(letter) {
    if (roundResolved) {
        return;
    }

    if (letter.textContent === "_") {
        return;
    }

    // Cases verrouillees par le bonus lettre : non supprimables
    if (letter.classList.contains("letterEmpty--bonus")) {
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
    updateBonusButtons(); // verrouille les bonus pendant l'animation coffre

    // La partie est terminee quand tous les niveaux disponibles ont ete joues.
    // sessionUsed contient deja le niveau courant (ajoute dans newGame).
    pendingEndOfGame = sessionUsed.size >= getTotalLevelCount();

    setFeedback("Bonne reponse ! Ouvre le coffre pour reveler les pieces.");

    fx.currentTime = 0;
    fx.pause();
    fx.src = "./Audio/fx/applaudissement.ogg";
    safePlay(fx);

    showRewardOverlay();
}

// Gere une mauvaise reponse : incremente les erreurs, met a jour les vies.
// Si le nombre max d'erreurs est atteint, declenche le game over apres un
// court delai pour laisser le joueur voir l'etat rouge de sa reponse.
function handleWrongAnswer() {
    errorCount += 1;

    for (let i = 0; i < lettersEmpty.children.length; i += 1) {
        // Les cases bonus sont toujours correctes : on ne les passe pas en rouge
        if (!lettersEmpty.children[i].classList.contains("letterEmpty--bonus")) {
            lettersEmpty.children[i].classList.add("letterEmpty--wrong");
        }
    }

    // Son d'erreur + tremblement de la zone reponse
    fx.currentTime = 0;
    fx.src = "./Audio/fx/error.ogg";
    safePlay(fx);
    shakeAnswerZone();

    // Met a jour l'affichage des vies immediatement
    renderLives();

    if (errorCount >= maxErrors) {
        // 3 erreurs atteintes : game over apres 700ms pour que le joueur
        // voie la reponse rouge avant l'overlay.
        setFeedback("3 erreurs — game over !");
        setTimeout(showGameOver, 700);
        return;
    }

    const remaining = maxErrors - errorCount;
    setFeedback(
        "Mauvaise reponse ! " + remaining +
        " tentative" + (remaining > 1 ? "s" : "") + " restante" + (remaining > 1 ? "s" : "") + "."
    );
}

function setFeedback(message) {
    feedback.textContent = message;
    if (!message) {
        feedback.classList.remove("feedback-zone--cheat");
    }
}

// ─── Systeme de vies ──────────────────────────────────────────────────────────

// Redessine les icones de vie selon le nombre d'erreurs actuel.
// Icone verte = vie disponible / icone rouge = vie perdue.
function renderLives() {
    livesIcons.innerHTML = "";
    for (let i = 0; i < maxErrors; i += 1) {
        const icon = document.createElement("span");
        icon.className = "life-icon" + (i < errorCount ? " life-icon--lost" : "");
        livesIcons.appendChild(icon);
    }
    // Texte accessible pour les lecteurs d'ecran
    livesIcons.setAttribute(
        "aria-label",
        (maxErrors - errorCount) + " vie(s) sur " + maxErrors
    );
}

// ─── Game Over ────────────────────────────────────────────────────────────────

// Affiche l'overlay game over avec le score de la session terminee.
// Verrouille toutes les interactions via roundResolved.
function showGameOver() {
    roundResolved = true;
    stopActiveAudio();

    // Sauvegarde les records uniquement si les pieces sont coherentes.
    // Un joueur ayant injecte des pieces puis perdu volontairement ne doit pas
    // voir son faux total enregistre : on enregistre 0 en cas d'incoherence.
    const coinsForRecord = (getCoins() === sessionEarned - sessionSpent)
        ? getCoins()
        : 0;
    updateBestStats(currentLevel, coinsForRecord);

    // Affiche le score de la session
    gameOverLevel.textContent = String(currentLevel);
    gameOverCoins.textContent = String(getCoins());

    gameOverOverlay.hidden = false;
    // Focus sur RECOMMENCER pour faciliter la navigation clavier
    gameOverRestart.focus();
}

function hideGameOver() {
    gameOverOverlay.hidden = true;
}

// ─── Felicitations ────────────────────────────────────────────────────────────

// Affiche l'ecran de felicitations quand tous les mots de la session ont ete trouves.
// Sauvegarde les records, affiche le score final et propose deux actions.
function showCongrats() {
    roundResolved = true;
    stopActiveAudio();

    // Sauvegarde les records de cette session avant d'afficher le bilan
    updateBestStats(currentLevel, getCoins());

    congratsLevel.textContent = String(currentLevel);
    congratsCoins.textContent = String(getCoins());

    congratsOverlay.hidden = false;
    congratsRestart.focus();
}

function hideCongrats() {
    congratsOverlay.hidden = true;
}

// Lance une nouvelle partie complete sans repasser par le menu.
// Equivalent a cliquer JOUER depuis le menu : remet tout a zero.
// Le passage par init() (via newGame() quand game = false) gere le reset complet.
function restartGame() {
    hideGameOver();
    hideCongrats();
    clearRound();
    hideRewardOverlay();
    game = false; // Force init() dans newGame()
    newGame();
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
    sessionEarned += pendingReward; // seul point legitime d'ajout de pieces
    addCoins(pendingReward);

    // Pas de updateBestStats ici : les pieces viennent d'etre creditees mais
    // l'invariant anti-triche n'a pas encore ete verifie. Si le joueur a injecte
    // des pieces en console, on enregistrerait un faux record. Le save se fait
    // dans continueAfterReward(), seulement apres que checkAntiCheat() est passe.

    rewardContinue.focus();
}

// ─── Anti-triche niveau ───────────────────────────────────────────────────────

// Verifie la coherence des pieces a la fin de chaque niveau.
// Deux regles :
//   1. Impossible d'avoir gagne plus de 5 pieces par niveau (max de la table de recompenses).
//   2. Les pieces actuelles doivent etre exactement egales a earned - spent.
// En cas d'anomalie : confiscation totale des pieces, message et trace dans la console.
function checkAntiCheat() {
    const maxPossible  = currentLevel * 5;
    const expectedCoins = sessionEarned - sessionSpent;
    const actualCoins   = getCoins();

    if (sessionEarned > maxPossible || actualCoins !== expectedCoins) {
        const stolen = actualCoins;
        setCoins(0);
        sessionEarned = 0;
        sessionSpent  = 0;
        updateCoinDisplay();
        setFeedback(
            "Petit malin... c’est pas beau de tricher ! " +
            stolen + " piece(s) confisquee(s)."
        );
        feedback.classList.add("feedback-zone--cheat");

        fx.currentTime = 0;
        fx.src = "./Audio/fx/error.ogg";
        safePlay(fx);

        return true; // triche detectee
    }

    return false;
}

// Transition entre la recompense et le niveau suivant (ou la fin de session).
//
// Si une triche est detectee :
//   1. checkAntiCheat() confisque les pieces, affiche le message centre.
//   2. On attend 4 s (cheatPenaltyTimer) pour laisser le joueur lire le message.
//   3. Si le joueur clique QUITTER pendant ces 4 s, quitGame() annule le timer
//      (clearTimeout) pour eviter que newGame() se declenche apres le retour au menu.
//
// Si pendingEndOfGame est vrai, on bascule sur l'ecran Felicitations au lieu du
// prochain niveau. quitZone et actionZone sont masques avant l'overlay.
function continueAfterReward() {
    hideRewardOverlay();

    if (checkAntiCheat()) {
        // Triche detectee : message visible 4 s, puis niveau suivant (ou congrats).
        // L'ID est stocke pour que quitGame() puisse annuler si le joueur quitte.
        cheatPenaltyTimer = setTimeout(() => { // 4 s pour lire le message
            if (pendingEndOfGame) {
                quitZone.hidden   = true;
                actionZone.hidden = true;
                showCongrats();
                return;
            }
            newGame();
        }, 4000);
        return;
    }

    // Anti-triche passe : les pieces sont legitimes, on peut enregistrer le record.
    updateBestStats(currentLevel, getCoins());

    if (pendingEndOfGame) {
        quitZone.hidden   = true;
        actionZone.hidden = true;
        showCongrats();
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
    // Annule le timer anti-triche si le joueur quitte pendant la fenetre de 2,5 s.
    // Sans ca, newGame() se declencherait apres le retour au menu.
    clearTimeout(cheatPenaltyTimer);

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

    // 4. Effacement du mot brouille, de l'ID de dossier et de la session
    secureWord = createSecureCell("");
    currentFolderId = "";
    sessionUsed.clear();
    sessionEarned = 0;
    sessionSpent  = 0;

    // 5. Desactivation de l'etat de partie et retour au menu
    game = false;
    menu.classList.remove("displayNone");
    document.body.classList.add("is-menu-open");

    // 6. Cache les zones de jeu actif et les overlays de fin si presents
    quitZone.hidden   = true;
    actionZone.hidden = true;
    hideGameOver();
    hideCongrats();

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

// Charge un niveau courant depuis un objet { folderId, encoded }.
// Le mot est decode depuis son payload puis re-encode dans la cellule brouillee.
// Le folderId est stocke en clair : il ne revele pas la reponse.
function setCurrentWord(level) {
    const word = decodeLevel(level.encoded); // decode via levels-data.js
    secureWord = encodeValue(word);          // re-encode localement avec integritySalt
    currentFolderId = level.folderId;        // dossier audio neutre (ex: "s004")
}

// Retourne le mot courant en clair depuis la cellule brouillee.
// A n'appeler que pour les operations qui necessitent le mot (lettres, validation).
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
    sessionSpent += amount; // trace chaque depense pour la verification anti-triche
    updateCoinDisplay();
    updateSoundButtons();
    return true;
}

function updateCoinDisplay() {
    coinValue.textContent = String(getCoins());
    updateBonusButtons();
}

// Retourne le tier de difficulte adapte au numero de niveau indique.
//   niveaux  1 -  5 → easy   (toujours disponible, sert de repli)
//   niveaux  6 - 15 → medium (repli sur easy si vide)
//   niveaux 16+     → hard   (repli sur easy si vide)
function getDifficultyTier(levelNum) {
    if (levelNum <= 5)  { return "easy";   }
    if (levelNum <= 15) { return "medium"; }
    return "hard";
}

// Construit la liste des niveaux jouables pour le prochain round.
// Logique :
//   1. Determine le tier de difficulte selon le niveau a venir (currentLevel + 1).
//   2. Recupere le pool du tier via getLevelPool() (repli auto sur easy si vide).
//   3. Retire les niveaux deja joues dans cette session (sessionUsed).
//   4. Si tout le pool filtre est epuise, repli sur easy non joues.
//   5. Dernier recours (partie tres longue) : autorise easy sans filtre.
function buildAvailablePool() {
    const nextLevel = currentLevel + 1;
    const tier = getDifficultyTier(nextLevel);

    // Pool du tier (avec repli sur easy si medium ou hard est vide)
    const tierPool = getLevelPool(tier);

    // Filtre les niveaux deja joues dans la session
    let available = tierPool.filter(function (l) {
        return !sessionUsed.has(l.folderId);
    });

    // Si le tier est epuise, essayer easy non encore joue
    if (available.length === 0) {
        available = LEVELS_BY_DIFFICULTY.easy.filter(function (l) {
            return !sessionUsed.has(l.folderId);
        });
    }

    // Dernier recours : partie tres longue, tous les niveaux ont ete joues.
    // On autorise de reprendre depuis easy sans filtre plutot que de bloquer.
    if (available.length === 0) {
        available = LEVELS_BY_DIFFICULTY.easy.slice();
    }

    return available;
}

function rollCoinReward() {
    return rewardTable[Math.trunc(Math.random() * rewardTable.length)];
}

// ─── Cache des records (localStorage) ────────────────────────────────────────

const BEST_STATS_KEY = "des-sons-des-mots-best";

// Lit les records sauvegardes dans le localStorage.
// Retourne { level: 0, coins: 0 } si aucun record n'existe encore.
function loadBestStats() {
    try {
        const raw = localStorage.getItem(BEST_STATS_KEY);
        if (!raw) { return { level: 0, coins: 0 }; }
        return JSON.parse(raw);
    } catch (_e) {
        return { level: 0, coins: 0 };
    }
}

// Met a jour les records si le niveau ou les pieces actuels sont superieurs.
// Appele apres chaque bonne reponse avec les valeurs de la session.
function updateBestStats(level, coins) {
    const current = loadBestStats();
    const best = {
        level: Math.max(current.level, level),
        coins: Math.max(current.coins, coins)
    };
    try {
        localStorage.setItem(BEST_STATS_KEY, JSON.stringify(best));
    } catch (_e) {
        // Echec silencieux : localStorage indisponible (mode prive strict).
    }
    renderBestStats(best);
}

// Affiche les records dans le menu de demarrage.
// Cache le bloc si aucun record n'existe encore (premiere partie).
function renderBestStats(best) {
    const zone = document.querySelector("#bestStats");
    if (!zone) { return; }

    if (best.level === 0 && best.coins === 0) {
        zone.hidden = true;
        return;
    }

    document.querySelector("#bestLevel").textContent  = String(best.level);
    document.querySelector("#bestCoins").textContent  = String(best.coins);
    zone.hidden = false;
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

// ─── Shuffle & Bonus ─────────────────────────────────────────────────────────
//
// Trois outils payants aident le joueur bloque :
//   ↺ Melanger  — gratuit, purement visuel, Fisher-Yates sur les boutons du DOM.
//   ◈ Cadeau    — pieces → revele une case correcte en cyan (verrouilee).
//                 La lettre est retiree de la banque. Cout double a chaque achat.
//   ✂ Suppr     — pieces → supprime un leurre detecete par exces de frequence.
//                 Cout double a chaque achat.
//
// Principe "faisabilite avant depense" : on verifie qu'une action est possible
// AVANT d'appeler spendCoins(). Cela evite tout remboursement, ce qui garderait
// l'invariant anti-triche sessionEarned - sessionSpent propre.

// Met a jour l'etat desactive/actif et le cout affiche des deux boutons bonus.
// Appele apres chaque changement de pieces, de round ou d'etat de partie.
function updateBonusButtons() {
    const coins = getCoins();
    const active = game && !roundResolved;

    bonusLetterCostDisplay.textContent = String(bonusLetterCost);
    bonusSupCostDisplay.textContent    = String(bonusSupCost);
    bonusLetterButton.disabled = !active || coins < bonusLetterCost;
    bonusSupButton.disabled    = !active || coins < bonusSupCost;
}

// Bonus Lettre : revele une case vide au hasard avec la bonne lettre (cyan, verrouilee).
// La lettre est retiree de la banque. Cout : double a chaque achat sur toute la partie.
// La faisabilite est verifiee AVANT la depense pour ne pas creer de remboursement
// (qui fausserait le traceur sessionSpent utilise par l'anti-triche).
function bonusRevealLetter() {
    if (!game || roundResolved) { return; }

    const currentWord = getCurrentWord();

    // Verifie la faisabilite avant toute depense
    const emptySlots = [];
    for (let i = 0; i < lettersEmpty.children.length; i += 1) {
        if (lettersEmpty.children[i].textContent === "_") {
            emptySlots.push({ slot: lettersEmpty.children[i], index: i });
        }
    }

    if (emptySlots.length === 0) {
        setFeedback("Toutes les cases sont deja remplies !");
        return;
    }

    if (!spendCoins(bonusLetterCost)) {
        setFeedback("Il te faut " + bonusLetterCost + " pieces pour ce bonus.");
        return;
    }

    bonusLetterCost *= 2;

    const chosen = emptySlots[Math.trunc(Math.random() * emptySlots.length)];
    const letter = currentWord[chosen.index].toUpperCase();
    chosen.slot.textContent = letter;
    chosen.slot.classList.add("letterEmpty--bonus");

    // Retire la lettre de la banque en privilegiant un doublon leurre
    let removed = false;
    for (let i = 0; i < letters.children.length; i += 1) {
        if (letters.children[i].textContent === letter && !randomList.includes(i)) {
            letters.children[i].textContent = " ";
            letters.children[i].setAttribute("aria-label", "Emplacement de lettre vide");
            removed = true;
            break;
        }
    }
    if (!removed) {
        for (let i = 0; i < letters.children.length; i += 1) {
            if (letters.children[i].textContent === letter) {
                letters.children[i].textContent = " ";
                letters.children[i].setAttribute("aria-label", "Emplacement de lettre vide");
                break;
            }
        }
    }

    setFeedback("Lettre bonus revelee !");
}

// Bonus Suppression : elimine une lettre leurre de la banque.
// Detection robuste par frequence : compare ce qui reste a trouver
// vs ce qui est disponible dans la banque pour chaque lettre.
// Cout : double a chaque achat sur toute la partie.
function bonusRemoveDecoy() {
    if (!game || roundResolved) { return; }

    const currentWord = getCurrentWord();

    // Compte les lettres encore a trouver (cases vides dans la zone reponse)
    const needed = {};
    for (let i = 0; i < lettersEmpty.children.length; i += 1) {
        if (lettersEmpty.children[i].textContent === "_") {
            const l = currentWord[i].toUpperCase();
            needed[l] = (needed[l] || 0) + 1;
        }
    }

    // Regroupe les boutons disponibles de la banque par lettre
    const available = {};
    for (let i = 0; i < letters.children.length; i += 1) {
        const text = letters.children[i].textContent;
        if (text !== " ") {
            if (!available[text]) { available[text] = []; }
            available[text].push(letters.children[i]);
        }
    }

    // Les leurres sont les exemplaires en surplus (disponible > necessaire)
    const decoys = [];
    Object.keys(available).forEach((l) => {
        const excess = available[l].length - (needed[l] || 0);
        for (let k = 0; k < excess; k += 1) {
            decoys.push(available[l][k]);
        }
    });

    if (decoys.length === 0) {
        setFeedback("Aucune lettre inutile a supprimer !");
        return;
    }

    // Faisabilite confirmee : on depense maintenant et on double le cout
    if (!spendCoins(bonusSupCost)) {
        setFeedback("Il te faut " + bonusSupCost + " pieces pour ce bonus.");
        return;
    }

    bonusSupCost *= 2;

    const chosen = decoys[Math.trunc(Math.random() * decoys.length)];
    chosen.textContent = " ";
    chosen.setAttribute("aria-label", "Emplacement de lettre vide");

    setFeedback("Lettre inutile supprimee !");
}

// Melange l'ordre des boutons de lettres sans modifier leur contenu.
// Purement visuel : aide le joueur a voir les lettres sous un nouvel angle.
// Bloque pendant roundResolved pour ne pas interferrer avec l'animation coffre.
function shuffleLetters() {
    if (!game || roundResolved) { return; }

    const children = Array.from(letters.children);

    // Fisher-Yates sur le tableau puis re-insertion dans le DOM
    for (let i = children.length - 1; i > 0; i -= 1) {
        const j = Math.trunc(Math.random() * (i + 1));
        const tmp = children[i];
        children[i] = children[j];
        children[j] = tmp;
    }

    // Vague : chaque lettre rebondit avec un delai croissant (35ms par lettre)
    children.forEach((btn, i) => {
        letters.appendChild(btn);

        // Retire la classe si elle est deja presente (double-clic rapide)
        btn.classList.remove("letter--wave");
        void btn.offsetWidth; // force reflow pour relancer l'animation

        btn.style.animationDelay = (i * 35) + "ms";
        btn.classList.add("letter--wave");

        btn.addEventListener("animationend", () => {
            btn.classList.remove("letter--wave");
            btn.style.animationDelay = "";
        }, { once: true });
    });

    fx.currentTime = 0;
    fx.src = "./Audio/fx/click.mp3";
    safePlay(fx);
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
// Branche les boutons de controle de la banque de lettres
shuffleButton.addEventListener("click", shuffleLetters);
bonusLetterButton.addEventListener("click", bonusRevealLetter);
bonusSupButton.addEventListener("click", bonusRemoveDecoy);
// Branche le bouton QUITTER sur la fonction d'abandon de partie
quitButton.addEventListener("click", quitGame);
// Branche le bouton VALIDER sur la validation de la reponse
validateButton.addEventListener("click", validateAnswer);
// Le "?" affiche dans le ticker est cliquable : il ouvre le coffre au clic.
// openRewardChest() gere deja la garde rewardCanOpen, donc cliquer trop tot ne fait rien.
rewardTicker.addEventListener("click", openRewardChest);
// Branche les boutons de l'ecran game over
gameOverRestart.addEventListener("click", restartGame);
gameOverQuit.addEventListener("click", quitGame);
// Branche les boutons de l'ecran felicitations
congratsRestart.addEventListener("click", restartGame);
congratsQuit.addEventListener("click", quitGame);
helpOverlay.addEventListener("click", (event) => {
    if (event.target === helpOverlay) {
        toggleHelp(false);
    }
});
updateCoinDisplay();
updateSoundButtons();
updateBonusButtons();
// Affiche les records existants des le chargement de la page
renderBestStats(loadBestStats());
