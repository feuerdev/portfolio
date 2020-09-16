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

//Set the transition property after the page load (otherwise the content will look like its flying in)
content.style.transition = ".5s";

function openNav() {
  detail.classList.add("show-detail");
  content.classList.add("show-detail");
}

function closeNav() {
  detail.classList.remove("show-detail");
  content.classList.remove("show-detail");
}

function wilo() {
  hideAll();
  openNav();
  document.getElementById("wilo").style.display = "block";
  document.getElementById("wilo").style.visibility = "visible";
  document.getElementById("wilo").style.opacity = 1;
  return false;
}

function feuer() {
  hideAll();
  openNav();
  document.getElementById("feuer").style.display = "block";
  document.getElementById("feuer").style.visibility = "visible";
  document.getElementById("feuer").style.opacity = 1;
  return false;
}

function awt() {
  hideAll();
  openNav();
  document.getElementById("awt").style.display = "block";
  document.getElementById("awt").style.visibility = "visible";
  document.getElementById("awt").style.opacity = 1;
  return false;
}

function ttc() {
  hideAll();
  openNav();
  document.getElementById("ttc").style.display = "block";
  document.getElementById("ttc").style.visibility = "visible";
  document.getElementById("ttc").style.opacity = 1;
  return false;
}

function hideAll() {
  let divs = document.getElementsByClassName("detail-content");
  for(let div of divs) {
    div.style.visibility = "hidden"
    div.style.opacity = 0;
    div.style.display = "none";
  }
}
