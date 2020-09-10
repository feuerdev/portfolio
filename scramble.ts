class Scrambler {

  /**
   * Timeout between each random character
   */
  private timeout = 5;

  /**
   * Random characters to pick from
   */
  private characters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'x', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'X', '#', '%', '&', '-', '+', '_', '?', '/', '\\', '='];

  /**
   * Texts to shuffle through
   */
  private texts = ["Hey, I'm Jannik", "Hi, ich bin Jannik", "嗨，我是季焱"];

  /**
   * The element to be used
   */
  private element = document.querySelector('[data-target-resolver]')

  /**
   * currently scrambled text
   */
  private index = 0;

  /**
   * currently scrambled letter
   */
  private offset = 0;

  /**
   * Times to show a random Char 
   */
  private iterations = 10;

  private partialString = "";

  public scramble() {
    const currentString = this.texts[this.index];
    this.partialString = currentString.substring(0, this.offset);

    this.doRandomiserEffect(() => {
      if (this.offset <= currentString.length) {
        this.scramble();
        this.offset++;
      } else {
        this.offset = 0;
        this.index = (this.index+1) % (this.texts.length);
        this.scramble();
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
          this.element.textContent = this.partialString.substring(0, this.partialString.length - 1) + randomCharacter(this.characters);
        }

        this.iterations--;
        this.doRandomiserEffect(callback)
      } else if (typeof callback === "function") {
        this.iterations = 10;
        callback();
      }
    }, this.timeout);
  }
}

function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function randomCharacter(characters) {
  return characters[getRandomInteger(0, characters.length - 1)];
};

new Scrambler().scramble();