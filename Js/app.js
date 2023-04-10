// / creer un menu ********
// / afficher 4 images de lecture de son ***********
// / afficher le nombre de lettres correspondants au mot mystère
// / afficher les lettres disponibles
// / determiner l affichage en pensant mobile first // test 100% POUR TOUS *******
// developper une logique de placement pour les lettres

// RECUPERATION ELEMENTS DU DOM
const infoBar = document.querySelector('#infoBar')
const infoTxt = document.querySelector('#infoTxt')
const menu = document.querySelector('#menu')
const sounds = document.querySelector('#sounds')
const lettersEmpty = document.querySelector('#lettersEmpty')
const letters = document.querySelector('#letters')
//
// VARIABLES AUDIO
let audio = new Audio()
let audioTxt = ''
let isPlaying = false
let fx = new Audio()
let audioSources = []
//
// VARIABLE ENVIRONEMENT
const maxLetters = 12

let randomList = []
let game = false
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
let words = [];//tableau des mots 
let word = '';//mot à trouver
let wordFind = '';
let lettersToTest = [];

//

//FONCTIONS
function init(){
        fx.src="./Audio/fx/click.mp3"
     //initialisation de la liste de mots possible 
     words = ['abeille','avion' ,'bagarre','canard','cartoon','cochon','cuisine', 'dauphin', 'dinde',
     'enfant','ferme' ,'hymne','monstre','oie']
     console.log('init')
      //efface le menu
    menu.classList.toggle('displayNone')
}
//LANCER UNE NOUVELLE PARTIE
function newGame(){
   
    if (!game){
        init()
    }
    console.log('newGame')
   
    while (letters.firstChild) {
        letters.removeChild(letters.firstChild);
      }
      while (lettersEmpty.firstChild) {
        lettersEmpty.removeChild(lettersEmpty.firstChild);
      }
      audio.pause();
      audio.currentTime = 0;
///////// test de fonctionalités post développement //////////
   

    // selection d un mot aleatoire
    word = randomWord(words);
   

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
        p.setAttribute('onclick','clickLetter(this)');//attribut la fonction clickLetter sur la case
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
        p.setAttribute('onclick','resetLetter(this)')
        lettersEmpty.appendChild(p);
    }
   
    // lance le jeu 
    game = true; 
}

// PLACE LES LETTRES PARMIS LES LETTRES CLIQUABLES 
function placeLetters(){
    randomList = null;
    
    randomList = []
    let maxRandom = [];
   for (let i = 0 ; i < maxLetters ; i++) {
        maxRandom[i] = i;
   }
   for (let i = 0 ; i < word.length ; i++) {
        let rdm = Math.trunc(Math.random()*maxRandom.length);
        randomList[i] = maxRandom[rdm]
        maxRandom.splice(rdm,1);
   }
   
}

//selectionne un mot dans la liste l affecte à word et le supprime de la liste
function randomWord(_list) {
    let str = ''
    rdm = Math.trunc(Math.random() * _list.length);
   
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
        if (audioTxt != audioSources[nb] ) {
            audio.currentTime = 0
            audio.src = audioSources[nb]
            audio.play()
            audioTxt = audioSources[nb]      
            isPlaying = true
            
        } else if (audioTxt == audioSources[nb] && isPlaying) {
            audio.pause()
            isPlaying = false
            console.log('pause')
        } 
        else if (!isPlaying) {
            audio.play()
            isPlaying = true
            console.log('continue')
        }
        
    } else { return; }  
}

function clickLetter(letter){
fx.currentTime = 0
fx.src = './Audio/fx/click.mp3'
fx.play()
for (let i = 0; i < lettersEmpty.children.length; i++) {
   if ( lettersEmpty.children[i].textContent == '_' && letter.textContent!=' '){
        lettersEmpty.children[i].textContent = letter.textContent
        letter.textContent = ' '
        for ( let j = 0  ; j < lettersEmpty.children.length ; j++) {
            if (lettersEmpty.children[j].textContent == '_' ){
                console.log(j + " : " +lettersEmpty.children[j].textContent)
                return
            } else { 
                if( j == lettersEmpty.children.length - 1) {
                    testWord()
                }
            }
        
        }
        
    }
  
   
}

}

function resetLetter(letter) {
   
    if (letter.textContent!='_'){
        for (let i = 0 ; i < letters.children.length ; i ++){
            if (letters.children[i].textContent == ' '){
                letters.children[i].textContent = letter.textContent
                letter.textContent = '_'
                if (lettersEmpty.children[0].style.backgroundColor == 'red'){
                    console.log(lettersEmpty.children[0].style.backgroundColor)
                    for ( let i = 0 ; i < lettersEmpty.children.length ; i ++){
                        lettersEmpty.children[i].style.backgroundColor = 'wheat';
                    }   
                } 
                return
            }
        }
    }
       
}

function testWord(){
    let good = true
    // verifie si les lettres correspondent
    for ( let i = 0 ; i < lettersEmpty.children.length ; i ++){
        if (lettersEmpty.children[i].textContent != word[i].toUpperCase()){
            good = false;
        }
    }

    if (good){
        for ( let i = 0 ; i < lettersEmpty.children.length ; i ++){
                lettersEmpty.children[i].style.backgroundColor = 'green';
                
            }
            if ( words.length >= 1){
                fx.currentTime = 0
                fx.pause()
                fx.src = './Audio/fx/applaudissement.ogg'
                fx.play()
                setTimeout(newGame,2000);
            }
            else{
                alert('vous avez trouver tout les mots \n' +
                'Cette application et en cours de développement \n'+
                'pour toute sugestion rendez vous sur https://cinartdev.fr rubrique contact ')
            }
            
    }
    else {
        for ( let i = 0 ; i < lettersEmpty.children.length ; i ++){
            lettersEmpty.children[i].style.backgroundColor = 'red';
        }
    }
  
}

function pauseSound(snd){
    snd.pause();
}

function showInfo () {
    if (infoTxt.style.display == "none") {
        infoTxt.style.display = "block"
    } else {
        infoTxt.style.display = "none"
    }
}