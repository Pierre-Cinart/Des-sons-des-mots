// / creer un menu ********
// / afficher 4 images de lecture de son ***********
// / afficher le nombre de lettres correspondants au mot mystère
// / afficher les lettres disponibles
// / determiner l affichage en pensant mobile first // test 100% POUR TOUS *******
// developper une logique de placement pour les lettres

// RECUPERATION ELEMENTS DU DOM
const infoBar = document.querySelector('#infoBar');
const menu = document.querySelector('#menu');
const sounds = document.querySelector('#sounds');
const lettersEmpty = document.querySelector('#lettersEmpty');
const letters = document.querySelector('#letters');
//
// VARIABLES AUDIO
let audio = new Audio();
let audioSources = [];
//
// VARIABLE ENVIRONEMENT
const maxLetters = 12;
let game = false;
let words = [];
let word = '';
//

//FONCTIONS
//LANCER UNE NOUVELLE PARTIE
function newGame(){
    menu.classList.toggle('displayNone');
// test de fonctionalités post développement
    // initialisation des sons pour test de lancement et autodistribution de source en boucle for
    word = 'dauphin';
    for ( let i = 0 ; i < 3 ; i++ ){
        audioSources[i] = './Audio/'+ word +'/' + i + '.ogg';
    }
    // affichages du nombre de lettre à l ' écran
    for (let i = 0 ; i < word.length ; i++ ){
        let p = document.createElement('p');
        p.className = 'letterEmpty';
        p.textContent = '_'
        lettersEmpty.appendChild(p);
    }
    //générer un placement aléatoire de lettres

    // placer les lettres cliquables
    
    // lance le jeu 
    game = true;
    
}

function playSound(nb){
    if (game){
        audio.pause();
        audio.currentTime = 0;
        audio.src = audioSources[nb];
        audio.play();
    } else { return; }  
}