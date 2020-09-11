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