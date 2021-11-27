class Scrambler {

  private characterDuration:number;
  private sentenceDuration:number;

  /**
   * Random characters to pick from
   */
  private chars:string[];

  /**
   * Texts to shuffle through
   */
  private sentences:string[];

  /**
   * The element to be used
   */
  private element;

  /**
   * Times to show a random Char 
   */
  private iterations:number;

  /**
   * currently scrambled text
   */
  private idxSentence = 0;

  /**
   * currently scrambled letter
   */
  private idxChar = 0;

  private partialString = "";

  constructor(element, toChar, toSentence, chars, sentences, iterations) {
    this.element = element;
    this.characterDuration = toChar;
    this.sentenceDuration = toSentence;
    this.chars = chars;
    this.sentences = sentences;
    this.iterations = iterations;

    //Calculate the height of the h1 div before the text gets scrambled and set it as the min height to prevent the content from twitching up and down
    this.element.style.minHeight = this.element.offsetHeight +"px";

  }

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
        }, this.sentenceDuration);
        
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
    }, this.characterDuration);
  }
}

function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function randomCharacter(characters) {
  return characters[getRandomInteger(0, characters.length - 1)];
};
