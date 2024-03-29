//Launch the word scrambler
let element = document.querySelector('[data-target-resolver]')
let toChar = 3;
let toSentence = 5000;
let chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'x', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'X', '#', '%', '&', '-', '+', '_', '?', '/', '\\', '='];
let sentences = ["Hey, I'm Jannik", "Hi, ich bin Jannik", "嗨，我是季焱"];
let iterations = 35;
new Scrambler(element, toChar, toSentence, chars, sentences, iterations).scramble();

//Launch the particle generator
particlesJS.load("particle-container", "assets/particles.json");

let detail = document.getElementsByClassName("detail")[0];
let content = document.getElementsByClassName("content")[0];

//Set the transition property after the page load (otherwise the content will look like its flying in)
content.style.transition = ".5s";

//load images
let imgs = document.getElementsByTagName("img"); 
for(let img of imgs) {
  let data_src = img.getAttribute("data-src");
  if(data_src && data_src !== "null") {
    img.setAttribute("data-src", null);
    img.src = data_src;
  }
}

function openNav() {
  detail.classList.add("show-detail");
  content.classList.add("show-detail");
}

function closeNav() {
  detailOpen = false;
  detail.classList.remove("show-detail");
  content.classList.remove("show-detail");
}

//To close the menu on back button
let detailOpen = false;

window.addEventListener("popstate", function (e) {
  if(detailOpen) {
    closeNav();
  }
});

function showDetail(index) {
  hideAll();
  openNav();
  let div;
  switch(index) {
    case 0: div = document.getElementById("wilo"); break;
    case 1: div = document.getElementById("feuer"); break;
    case 2: div = document.getElementById("others"); break;
    case 3: div = document.getElementById("fish"); break;
  }
  if(div) {
    div.style.display = "block";
    div.style.visibility = "visible";
    div.style.opacity = 1;
  }
  if(!detailOpen) {
    history.pushState(null, null, null);
  }
  detailOpen = true;
}

function hideDetail() {
  if(detailOpen) {
    history.back();
    closeNav();
  }
}

function hideAll() {
  let divs = document.getElementsByClassName("detail-content");
  for(let div of divs) {
    div.style.visibility = "hidden"
    div.style.opacity = 0;
    div.style.display = "none";
  }
}

const louis = document.querySelector(".louis")
const count = document.querySelector(".particle-count")
const privacy = document.querySelector(".privacy")

louis.onclick = () => {
  content.style.display = "none"
  privacy.style.display = "none"
  pJSDom[0].pJS.fn.particlesCreate()
  updateParticleCount()
}

louis.onmouseover = () => {
  updateParticleCount()
}

function updateParticleCount() {
  count.textContent = pJSDom[0].pJS.particles.array.length +" Particles"
}
