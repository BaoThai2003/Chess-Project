// Dialogue System - Shadow Fight 2 Style
window.dialogueSystem = {
  dialogues: {
    // Campaign Act 1
    "fight-1": [
      { speaker: "enemy", text: "Another lost soul wandering the desert... You won't last long here." },
      { speaker: "player", text: "I'm looking for someone. Have you seen a girl with a chess piece?" },
      { speaker: "enemy", text: "Ha! Many come seeking, few leave. Prove your worth on the board!" },
      { speaker: "player", text: "I don't have time for games. But if this is the only way..." },
    ],
    "fight-2": [
      { speaker: "enemy", text: "You survived the desert? Impressive... for a beginner." },
      { speaker: "player", text: "Tell me about this place. Where am I?" },
      { speaker: "enemy", text: "Welcome to Akh'Zahara - where the weak serve and the strong rule through chess." },
      { speaker: "player", text: "Chess decides everything? That's insane!" },
      { speaker: "enemy", text: "Insane? This is order! Now, let's see if you can back up those words!" },
    ],
    "fight-3": [
      { speaker: "enemy", text: "You've made it far, stranger. But the Sandlord doesn't tolerate rebels." },
      { speaker: "player", text: "I'm not here to start a revolution. I just want to find Shizuku and leave." },
      { speaker: "enemy", text: "Leave? No one leaves Akh'Zahara. We are all prisoners here." },
      { speaker: "player", text: "Then I'll be the first to break free. Starting with defeating you!" },
    ],
    "fight-4": [
      { speaker: "enemy", text: "You dare challenge the elite? I've crushed countless warriors!" },
      { speaker: "player", text: "I've beaten everyone else. You're just another obstacle." },
      { speaker: "enemy", text: "Arrogant fool! The Sandlord will personally destroy you after I'm done!" },
      { speaker: "player", text: "Good. That's exactly what I'm counting on. Bring it on!" },
    ],
    "boss-1": [
      { speaker: "enemy", text: "So... you're the outsider causing trouble in my domain." },
      { speaker: "player", text: "You must be the Sandlord. Where is Shizuku?!" },
      { speaker: "enemy", text: "The chess maiden? She's safe... for now. But you'll never reach her." },
      { speaker: "player", text: "I'll defeat you and take her back!" },
      { speaker: "enemy", text: "Bold words. Let's see if your skills match your determination!" },
    ],

    // Arena opponents
    "easy-1": [
      { speaker: "enemy", text: "First time in the arena? Don't worry, I'll go easy on you... or not!" },
      { speaker: "player", text: "Just a warm-up. Let's get this over with." },
    ],
    "easy-2": [
      { speaker: "enemy", text: "Training time! I hope you're ready to learn some lessons!" },
      { speaker: "player", text: "I learn best under pressure. Show me what you've got." },
    ],
    "medium-1": [
      { speaker: "enemy", text: "You think you're ready for real competition? Let's find out!" },
      { speaker: "player", text: "I didn't come here to play. I came to win." },
    ],
    "hard-1": [
      { speaker: "enemy", text: "A challenger approaches the champion? This will be entertaining!" },
      { speaker: "player", text: "Every champion falls eventually. Today is your day." },
      { speaker: "enemy", text: "Such confidence! I'll enjoy crushing it!" },
    ],
  },

  // Victory dialogues
  victoryDialogues: {
    "fight-1": [
      { speaker: "enemy", text: "Impossible... How did you...?" },
      { speaker: "player", text: "Tell me where to find the Sandlord!" },
      { speaker: "enemy", text: "Keep... going forward... You'll find him... at the palace..." },
    ],
    "fight-2": [
      { speaker: "enemy", text: "You're... stronger than you look..." },
      { speaker: "player", text: "I have someone I need to protect. That's my strength." },
    ],
    "fight-3": [
      { speaker: "enemy", text: "Maybe... maybe there is hope after all..." },
      { speaker: "player", text: "Hope? What do you mean?" },
      { speaker: "enemy", text: "If you can defeat the Sandlord... you could free us all..." },
    ],
    "fight-4": [
      { speaker: "enemy", text: "The Sandlord... won't go down... as easily..." },
      { speaker: "player", text: "I'm coming for him next. This ends now!" },
    ],
    "boss-1": [
      { speaker: "enemy", text: "No... this can't be... my power..." },
      { speaker: "player", text: "Where is Shizuku?! Tell me!" },
      { speaker: "enemy", text: "She's in... the tower... but be warned... this is only the beginning..." },
      { speaker: "player", text: "I don't care what comes next. I'm getting her back!" },
    ],
  },

  currentDialogue: [],
  currentIndex: 0,
  currentEnemy: null,

  // Show dialogue before battle
  showDialogue(enemyId, callback) {
    this.currentEnemy = enemyId;
    this.currentDialogue = this.dialogues[enemyId] || [
      { speaker: "enemy", text: "Let's battle!" },
      { speaker: "player", text: "Bring it on!" },
    ];
    this.currentIndex = 0;

    const dialogueScreen = document.getElementById("dialogue-screen");
    const enemyPortrait = document.getElementById("enemy-portrait");
    const enemyName = document.getElementById("enemy-name");

    // Set enemy info
    const enemyData = this.getEnemyData(enemyId);
    enemyPortrait.textContent = enemyData.portrait;
    enemyName.textContent = enemyData.name;

    // Show screen
    dialogueScreen.classList.remove("hidden");

    // Display first dialogue
    this.displayCurrentDialogue();

    // Continue button
    const continueBtn = document.getElementById("dialogue-continue");
    continueBtn.onclick = () => {
      this.currentIndex++;
      if (this.currentIndex >= this.currentDialogue.length) {
        dialogueScreen.classList.add("hidden");
        if (callback) callback();
      } else {
        this.displayCurrentDialogue();
      }
    };
  },

  // Show victory dialogue
  showVictoryDialogue(enemyId, callback) {
    this.currentDialogue = this.victoryDialogues[enemyId] || [
      { speaker: "enemy", text: "You... win..." },
      { speaker: "player", text: "I'll keep fighting until I find her!" },
    ];
    this.currentIndex = 0;

    const dialogueScreen = document.getElementById("dialogue-screen");
    dialogueScreen.classList.remove("hidden");

    this.displayCurrentDialogue();

    const continueBtn = document.getElementById("dialogue-continue");
    continueBtn.onclick = () => {
      this.currentIndex++;
      if (this.currentIndex >= this.currentDialogue.length) {
        dialogueScreen.classList.add("hidden");
        if (callback) callback();
      } else {
        this.displayCurrentDialogue();
      }
    };
  },

  displayCurrentDialogue() {
    const dialogue = this.currentDialogue[this.currentIndex];
    const dialogueText = document.getElementById("dialogue-text");
    const leftPortrait = document.querySelector(".dialogue-portrait.left");
    const rightPortrait = document.querySelector(".dialogue-portrait.right");

    // Highlight active speaker
    if (dialogue.speaker === "player") {
      leftPortrait.classList.add("active");
      rightPortrait.classList.remove("active");
    } else {
      leftPortrait.classList.remove("active");
      rightPortrait.classList.add("active");
    }

    // Type effect
    dialogueText.textContent = "";
    let i = 0;
    const text = dialogue.text;
    const typeInterval = setInterval(() => {
      if (i < text.length) {
        dialogueText.textContent += text[i];
        i++;
      } else {
        clearInterval(typeInterval);
      }
    }, 30);
  },

  getEnemyData(enemyId) {
    const enemies = {
      "fight-1": { name: "Lost Traveler", portrait: "♟", difficulty: "easy" },
      "fight-2": { name: "Dune Raider", portrait: "♞", difficulty: "easy" },
      "fight-3": { name: "Sandstorm Scout", portrait: "♜", difficulty: "medium" },
      "fight-4": { name: "Desert Warrior", portrait: "♛", difficulty: "medium" },
      "boss-1": { name: "The Sandlord", portrait: "♚", difficulty: "hard" },
      "easy-1": { name: "Beginner Bot", portrait: "♟", difficulty: "easy" },
      "easy-2": { name: "Training Dummy", portrait: "♞", difficulty: "easy" },
      "medium-1": { name: "Arena Fighter", portrait: "♜", difficulty: "medium" },
      "hard-1": { name: "Champion", portrait: "♛", difficulty: "hard" },
    };
    return enemies[enemyId] || { name: "Unknown", portrait: "♟", difficulty: "easy" };
  },
};

// Story intro handler
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-story-btn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      console.log("Start button clicked!");
      const storyIntro = document.getElementById("story-intro");
      const mainMenu = document.getElementById("main-menu");

      if (storyIntro) {
        storyIntro.classList.add("hidden");
        console.log("Story intro hidden");
      }

      if (mainMenu) {
        mainMenu.classList.remove("hidden");
        console.log("Main menu shown");
      }
    });
  }
});
