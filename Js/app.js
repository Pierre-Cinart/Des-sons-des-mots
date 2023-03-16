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

let randomList = [];
let game = false;
const alphabet = ['A','A','A','B','C','C','C',
                    'D','E','E','E','F','G','H',
                    'I','I','S','J','K','L','A','L',
                    'M','M','A','N','O','O','P','P','V',
                    'Q','R','S','S','I','S','T','U','V','V','V','W',
                    'X','Y','Z','A','N','E','E','R','I','I',
                    'V','E','T','E','M','M','O','O','H','I','I',
                    'L','L','D','E','A','N','R','F','G',
                    'Q','R','S','K','L','A','L','N','R','F','W'];
let theme ='';
let words = [];
let word = '';
let wordFind = '';

//

//FONCTIONS

//LANCER UNE NOUVELLE PARTIE
function newGame(){

    //efface le menu
    menu.classList.toggle('displayNone');

///////// test de fonctionalités post développement //////////
    //initialisation de la liste de mots possible
    words = ['abeille', 'canard', 'dauphin', 'dinde','ferme' ,'hymne','oie'];

    // selection d un mot aleatoire
    word = randomWord(words);
    console.log('mot ' + word);

    //affectation de la place des lettres parmis les lettres cliquables
    placeLetters();
     // initialisation des sons pour test de lancement et autodistribution de source en boucle for
    for ( let i = 0 ; i < 3 ; i++ ){
        audioSources[i] = './Audio/'+ word +'/' + i + '.ogg';
    }
    
    // placer les lettres cliquables //générer un placement aléatoire de lettres
    for (let i = 0 ; i < maxLetters ; i++) {
        let p = document.createElement('p');
        p.textContent = '*'
        p.className = 'letter';
        for ( let j = 0 ; j < randomList.length ; j++ ){
            if ( i == randomList[j]){
                p.textContent = word[j].toUpperCase();
            }
        }
        if (p.textContent == '*') {
            p.textContent = randomLetter();
        }
        
        letters.appendChild(p);
    }
    
  
    // incorporer les lettres du mot
     // affichages du nombre de lettre à l ' écran
     for (let i = 0 ; i < word.length ; i++ ){
        let p = document.createElement('p');
        p.className = 'letterEmpty';
        p.textContent = '_'
        lettersEmpty.appendChild(p);
    }

    // lance le jeu 
    game = true; 
}

// PLACE LES LETTRES PARMIS LES LETTRES CLIQUABLES 
function placeLetters(){
    let maxRandom = [];
   for (let i = 0 ; i < maxLetters ; i++) {
        maxRandom[i] = i;
   }
   for (let i = 0 ; i < word.length ; i++) {
        let rdm = Math.trunc(Math.random()*maxRandom.length);
        randomList[i] = maxRandom[rdm]
        maxRandom.splice(rdm,1);
   }
   console.log('rdm lst : ' + randomList)
}

//selectionne un mot dans la liste l affecte à word et le supprime de la liste
function randomWord(_list) {
    let str = ''
    rdm = Math.trunc(Math.random() * _list.length);
    console.log('rdm :' + rdm)
    str = _list[rdm];
    _list.splice(rdm,1);
    return str;
}

// INSCRIT UNE LETTRE ALEATOIRE SUR LES LETTRES CLIQUABLES
function randomLetter(){
    return alphabet[Math.trunc(Math.random() * alphabet.length)];
}

// JOUER LE SON // 
function playSound(nb){
    if (game){
        audio.pause();
        audio.currentTime = 0;
        audio.src = audioSources[nb];
        audio.play();
    } else { return; }  
}

