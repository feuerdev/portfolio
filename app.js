//Launch the word scrambler
let element = document.querySelector('[data-target-resolver]')
let toChar = 5;
let toSentence = 2000;
let chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'x', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'X', '#', '%', '&', '-', '+', '_', '?', '/', '\\', '='];
let sentences = ["Hey, I'm Jannik", "Hi, ich bin Jannik", "嗨，我是季焱"];
let iterations = 10;
new Scrambler(element, toChar, toSentence, chars, sentences, iterations).scramble();

//Launch the particle generator
particlesJS.load("particle-container", "particles.json");

//pJSDom[0].pJS.fn.particlesRefresh() to refresh

let detail = document.getElementsByClassName("detail")[0];
let content = document.getElementsByClassName("content")[0];

function openNav() {
  detail.classList.add("show-detail");
  content.classList.add("show-detail");
}

function closeNav() {
  detail.classList.remove("show-detail");
  content.classList.remove("show-detail");
}

function wilo() {
  openNav();
  return false;
}

function feuer() {
  openNav();
  return false;
}

function awt() {
  openNav();
  return false;
}

function ttc() {
  openNav();
  return false;
}
