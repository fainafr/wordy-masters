const ANSWER_LENGTH = 5;
const ROUNDS = 6;
// ROUNDS - how many rounds we are going
const letters = document.querySelectorAll(".scoreboard-letter");
console.log("letters", letters);
const loadingDiv = document.querySelector(".info-bar");
let done = false;

// I like to do an init function so I can use "await"
async function init() {
  // the state for the app
  let currentRow = 0;
  let currentGuess = "";
  let done = false;
  let isLoading = true;

  // nab the word of the day
  const res = await fetch("https://words.dev-apis.com/word-of-the-day");
  const { word: wordRes } = await res.json();
  const word = wordRes.toUpperCase();
  const wordParts = word.split("");
  //split word of the day into Array of letters wordParts
  console.log('wordParts', wordParts);
  isLoading = false;
  // if we should show, we do not want the hidden class
  // if it is not loading, it is hidden
  setLoading(isLoading);

  // user adds a letter to the current guess
  function addLetter(letter) {
    if (currentGuess.length < ANSWER_LENGTH) {
      currentGuess += letter;
    } else {
      current = currentGuess.substring(0, currentGuess.length - 1) + letter;
    }

    letters[currentRow * ANSWER_LENGTH + currentGuess.length - 1].innerText =
      letter;
      console.log("letters after add", letters);
  }

  // use tries to enter a guess
  async function commit() {
    if (currentGuess.length !== ANSWER_LENGTH) {
      // do nothing
      // if length of "word" we entered is less than 5, do nothing
      return;
    }

    // //alternative way to  check whether the word is correct and the player wins:
    // if (  currentGuess === word) {
    //   // win
    //   done = true;
    //   alert("you win");
    //   return;
    // }

    // check the API to see if it's a valid word
    // skip this step if you're not checking for valid words
    isLoading = true;
    setLoading(isLoading);
    const res = await fetch("https://words.dev-apis.com/validate-word", {
      method: "POST",
      body: JSON.stringify({ word: currentGuess }),
    });
    const { validWord } = await res.json();
    isLoading = false;
    setLoading(isLoading);

    // not valid, mark the word as invalid and return
    if (!validWord) {
      markInvalidWord();
      return;
    }

    const guessParts = currentGuess.split("");
    const map = makeMap(wordParts);
    let allRight = true;

    // first pass just finds correct letters so we can mark those as
    // correct first
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      if (guessParts[i] === wordParts[i]) {
        ////this is right things in right spots
        // mark as correct
        letters[currentRow * ANSWER_LENGTH + i].classList.add("correct");
        // it is important to do decrement because one green letter is already "used" and is in correct
        //position
        map[guessParts[i]]--;
      }
    }

    // second pass finds close and wrong letters
    // we use the map to make sure we mark the correct amount of
    // close letters
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      if (guessParts[i] === wordParts[i]) {
        //this is right things in right spots
        // do nothing; everything was done in the first loop
      } else if (wordParts.includes(guessParts[i]) && map[guessParts[i]] > 0) {
        // mark as close - yellow
        allRight = false;
        letters[currentRow * ANSWER_LENGTH + i].classList.add("close");
        map[guessParts[i]]--;
        //because one yellow letter was already "used", the letter is going to be a guess part
      } else {
        // wrong
        allRight = false;
        letters[currentRow * ANSWER_LENGTH + i].classList.add("wrong");
      }
    }

    currentRow++;
    //next row
    currentGuess = "";
    //clear current word
    
    if (allRight) {
      // win
      alert("you win");
      document.querySelector(".brand").classList.add("winner");
      done = true;
    } else if (currentRow === ROUNDS) {
      // if the current row is the same as how many rounds we are going for, the we lose
      // lose
      alert(`you lose, the word was ${word}`);
      done = true;
    }
  }

  // user hits backspace, if the the length of the string is 0 then do
  // nothing
  function backspace() {
    currentGuess = currentGuess.substring(0, currentGuess.length - 1);
    // take one off the end
    letters[currentRow * ANSWER_LENGTH + currentGuess.length].innerText = "";
  }

  // let the user know that their guess wasn't a real word
  // skip this if you're not doing guess validation
  function markInvalidWord() {
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      letters[currentRow * ANSWER_LENGTH + i].classList.remove("invalid");

      // long enough for the browser to repaint without the "invalid class" 
      //so we can then add it again
      // to keep the animation working many times
      setTimeout(
        () => letters[currentRow * ANSWER_LENGTH + i].classList.add("invalid"),
        10
      );
    }
  }

  // listening for event keys and routing to the right function
  // we listen on keydown so we can catch Enter and Backspace
  document.addEventListener("keydown", function handleKeyPress(event) {
    // if it's done, or it's loading, then do nothing
    if (done || isLoading) {
      // do nothing;
      return;
    }

    const action = event.key;
    //the letter or another key that we press
    if (action === "Enter") {
      commit();
    } else if (action === "Backspace") {
      backspace();
    } else if (isLetter(action)) {
      addLetter(action.toUpperCase());
    } else {
      // do nothing
      //not enter, not backspace, not letter
    }
  });
}

// a little function to check to see if a character is alphabet letter
// this uses regex (the /[a-zA-Z]/ part) but don't worry about it
// you can learn that later and don't need it too frequently
function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

// show the loading spinner when needed
//isLoading - boolean(true or false)
function setLoading(isLoading) {
  loadingDiv.classList.toggle("show", isLoading);
  // loadingDiv.classList.add("hidden");
   // when isLoading = true, add it
  // loadingDiv.classList.remove("hidden");
   // if isLoading = false, remove it
   // that was .toggle is doing 
}

// takes an array of letters (like ['E', 'L', 'I', 'T', 'E']) and creates
// an object out of it (like {E: 2, L: 1, T: 1}) so we can use that to
// make sure we get the correct amount of letters marked close instead
// of just wrong or correct
function makeMap(array) {
  //how many times each letter is encounted
  // if we write in console line makeMap('SPOOL'.split(""))
  //we get {S: 1, P: 1, O: 2, L: 1}
  //such kind of data structure is called a map
  const obj = {};
  for (let i = 0; i < array.length; i++) {
    if (obj[array[i]]) {
      obj[array[i]]++;
    } else {
      obj[array[i]] = 1;
    }
  }
  return obj;
}
// if we write in console x =  makeMap('SPOOL'.split(""))
// and then x.O
// we will get 2
// if we write x.O--
// and then x.O
// we will get 1
init();