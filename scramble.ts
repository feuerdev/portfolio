class Scrambler {

  /**
   * Timeout between each random character
   */
  private toChar = 5;

  /**
   * Timeout between each sentence
   */
  private toSentence = 2000;

  /**
   * Random characters to pick from
   */
  private chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'x', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'X', '#', '%', '&', '-', '+', '_', '?', '/', '\\', '='];

  /**
   * Texts to shuffle through
   */
  private sentences = ["Hey, I'm Jannik", "Hi, ich bin Jannik", "嗨，我是季焱"];

  /**
   * The element to be used
   */
  private element = document.querySelector('[data-target-resolver]')

  /**
   * currently scrambled text
   */
  private idxSentence = 0;

  /**
   * currently scrambled letter
   */
  private idxChar = 0;

  /**
   * Times to show a random Char 
   */
  private iterations = 10;

  private partialString = "";

  public scramble() {
    const currentString = this.sentences[this.idxSentence];
    this.partialString = currentString.substring(0, this.idxChar);

    this.doRandomiserEffect(() => {
      if (this.idxChar <= currentString.length) {
        this.scramble();
        this.idxChar++;
      } else {
        this.idxChar = 0;
        this.idxSentence = (this.idxSentence+1) % (this.sentences.length);
        setTimeout(() => {
          this.scramble();
        }, this.toSentence);
        
      }
    });
  }

  private doRandomiserEffect(callback) {
    setTimeout(() => {
      if (this.iterations >= 0) {
        // Ensures partialString without the random character as the final state.
        if (this.iterations === 0) {
          this.element.textContent = this.partialString;
        } else {
          // Replaces the last character of partialString with a random character
          this.element.textContent = this.partialString.substring(0, this.partialString.length - 1) + randomCharacter(this.chars);
        }

        this.iterations--;
        this.doRandomiserEffect(callback)
      } else if (typeof callback === "function") {
        this.iterations = 10;
        callback();
      }
    }, this.toChar);
  }
}

function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function randomCharacter(characters) {
  return characters[getRandomInteger(0, characters.length - 1)];
};

new Scrambler().scramble();