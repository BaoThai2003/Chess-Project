window.dialogueSystem = {
  dialogues: {
    // === AKH'ZAHARA MAIN PLOT ===
    "miner-1": [
      {
        speaker: "player",
        text: "Mắt từ từ mở ra... Một không gian hoàn toàn xa lạ hiện ra ngay trước mắt. Một khu mỏ rộng lớn được phủ dầy bởi cát và nắng gió sa mạc...",
      },
      { speaker: "enemy", text: "À! Một người lạ mặt sao? Lạc lối ở sa mạc hả? Thật tội nghiệp cho người này..." },
      {
        speaker: "player",
        text: "Ông...ông là ai? Đây là đâu? Có lẽ ông có thể giúp tôi? Tôi đang tìm một cô gái, tên là Shizuku...",
      },
      {
        speaker: "enemy",
        text: "Shizuku? Tôi không biết. Nhưng nếu muốn tôi trả lời, hãy đánh bại tôi trong một trận cờ vua!",
      },
      { speaker: "player", text: "Cờ vua? Được thôi, tôi sẽ đánh bại anh!" },
    ],
    "miner-2": [
      {
        speaker: "enemy",
        text: "Anh nói là bạn của thợ mỏ đầu tiên? Thế thì anh cũng là kẻ muốn tìm đường ra khỏi đây sao?",
      },
      { speaker: "player", text: "Đúng vậy. Tôi đang tìm người tên Shizuku. Ông có biết gì không?" },
      {
        speaker: "enemy",
        text: "Mình là những nô lệ của chủ mỏ ở đây. Không ai biết Shizuku là ai. Hãy chuẩn bị cho trận đấu!",
      },
    ],
    "miner-3": [
      { speaker: "enemy", text: "Ba thợ mỏ đã bị đánh bại bởi anh... Chắc anh không phải con người bình thường..." },
      {
        speaker: "player",
        text: "Các vị có thể giới thiệu tôi với người quản lý không? Tôi cần tìm hiểu thêm về nơi này!",
      },
      {
        speaker: "enemy",
        text: "Người quản lý là Edras. Anh rất mạnh. Nhưng vì ba bạn tôi đều thua anh, tôi sẽ dẫn anh gặp ông ấy!",
      },
    ],
    edras: [
      {
        speaker: "enemy",
        text: "Các thợ mỏ của tôi đã đánh thua? Thực sự là bất ngờ. Tôi tên là Edras, người quản lý của mỏ này.",
      },
      { speaker: "player", text: "Rất vui được gặp. Tôi đang tìm một cô gái tên Shizuku. Ông có thể giúp tôi không?" },
      {
        speaker: "enemy",
        text: "Shizuku? Tôi biết cô ấy. Cô ấy ở trong lâu đài của Wior - chủ nhân của cả vùng này. Nhưng trước tiên, bạn phải thắng được tôi!",
      },
      { speaker: "player", text: "Tôi sẽ thắng! Đối với tôi, không có bất cứ điều gì không thể!" },
    ],
    wior: [
      { speaker: "enemy", text: "Wior đây. Tôi nghe nói có một kẻ lạ mặt chinh phục cả mỏ của tôi..." },
      { speaker: "player", text: "Tôi là Bao. Tôi cần gặp Shizuku ngay lập tức! Hãy chỉ cho tôi đường đi!" },
      {
        speaker: "enemy",
        text: "Haha! Dũng khí tuy tốt, nhưng thế giới này không phải do dũng khí quyết định. Cờ vua quyết định tất cả. Nếu muốn gặp cô gái, hãy thắng tôi!",
      },
      { speaker: "player", text: "Được! Tôi sẽ không thua! Cho tôi cơ hội để cứu Shizuku!" },
    ],

    // === TRADE ASSOCIATION ===
    "trade-1": [
      { speaker: "enemy", text: "Chào mừng đến Hiệp Hội Thương Mại! Hãy kiếm tiền bằng cách thắng các trận đấu!" },
      { speaker: "player", text: "Tôi sẽ chiến đấu để kiếm tiền mua kỹ năng và quân cờ." },
    ],
    "trade-2": [
      { speaker: "enemy", text: "Một người khác muốn kiểm tra kỹ năng của mình sao?" },
      { speaker: "player", text: "Vâng, tôi đã sẵn sàng." },
    ],
    "trade-3": [
      { speaker: "enemy", text: "Bạn thực sự rất mạnh. Đây là một đối thủ đáng gặp." },
      { speaker: "player", text: "Cảm ơn. Tôi sẽ tiếp tục cải thiện." },
    ],

    // === DESERT MERCHANT ===
    "desert-merchant": [
      { speaker: "enemy", text: "Xin chào, du khách. Tôi là một thương nhân bí ẩn của sa mạc này." },
      { speaker: "player", text: "Ai vậy? Tôi chưa bao giờ gặp ông trước." },
      {
        speaker: "enemy",
        text: "Tôi là một lũy thừa bị giấu kín trong sa mạc. Mỗi người chỉ được thử thách tôi một lần trong đời. Nếu bạn thắng, kỹ năng độc nhất của tôi sẽ là của bạn, cùng với một kho tàng vàng.",
      },
      { speaker: "player", text: "Một lũy thừa ẩn giấu? Điều này nghe như một cơ hội không thể bỏ qua!" },
      { speaker: "enemy", text: "Chúng ta sẽ xem. Nếu bạn không đủ mạnh, bạn sẽ mất tất cả!" },
    ],

    // === CAMPAIGN ACT 1 (Kept for backward compatibility) ===
    "fight-1": [
      { speaker: "player", text: "Mắt từ từ mở ra... Một không gian hoàn toàn xa lạ hiện ra ngay trước mắt..." },
      { speaker: "enemy", text: "Lại thêm một lãng khách nữa lạc lối sao? Thật tội nghiệp..." },
      { speaker: "player", text: "Ông có thấy một cô gái mặc kimono cao khoảng 1m65 không?" },
      { speaker: "enemy", text: "Biết rồi, nhưng hãy đánh bại tôi trước!" },
    ],
    "fight-2": [
      { speaker: "enemy", text: "You survived the desert? Impressive..." },
      { speaker: "player", text: "Tell me about this place. Where am I?" },
    ],
    "fight-3": [
      { speaker: "enemy", text: "You've made it far, stranger." },
      { speaker: "player", text: "I just want to find Shizuku and leave." },
    ],
    "fight-4": [
      { speaker: "enemy", text: "You dare challenge the elite?" },
      { speaker: "player", text: "I've beaten everyone else." },
    ],
    "boss-1": [
      { speaker: "enemy", text: "So... you're the outsider causing trouble." },
      { speaker: "player", text: "Where is Shizuku?!" },
    ],

    // === ARENA OPPONENTS (Backward compatibility) ===
    "easy-1": [
      { speaker: "enemy", text: "First time in the arena?" },
      { speaker: "player", text: "Let's get this over with." },
    ],
    "easy-2": [
      { speaker: "enemy", text: "Training time! I hope you're ready!" },
      { speaker: "player", text: "I learn best under pressure." },
    ],
    "medium-1": [
      { speaker: "enemy", text: "You think you're ready for real competition?" },
      { speaker: "player", text: "I didn't come here to play." },
    ],
    "hard-1": [
      { speaker: "enemy", text: "A challenger approaches the champion?" },
      { speaker: "player", text: "Every champion falls eventually." },
    ],
  },

  // Victory dialogues
  victoryDialogues: {
    "miner-1": [
      {
        speaker: "enemy",
        text: "Anh quá mạnh... Shizuku? Tôi thực sự không biết. Nhưng Edras - người quản lý mỏ, hắn có thể biết...",
      },
      { speaker: "player", text: "Cảm ơn! Tôi sẽ gặp Edras ngay!" },
    ],
    "miner-2": [
      { speaker: "enemy", text: "Tôi thua rồi... Anh có thể gặp những người khác ở mỏ này..." },
      { speaker: "player", text: "Cảm ơn sự hợp tác của anh!" },
    ],
    "miner-3": [
      { speaker: "enemy", text: "Nếu anh thắng được ba chúng tôi, chắc anh đủ mạnh. Đến gặp Edras đi..." },
      { speaker: "player", text: "Cảm ơn các bạn!" },
    ],
    edras: [
      {
        speaker: "enemy",
        text: "Tôi thua... Điều này chưa bao giờ xảy ra. Bạn thực sự mạnh. Wior - chủ nhân, ông ấy đang chờ bạn ở lâu đài...",
      },
      { speaker: "player", text: "Cảm ơn Edras! Tôi sẽ gặp Wior!" },
      { speaker: "enemy", text: "Cẩn thận... Wior mạnh hơn tôi rất nhiều. May mắn cho bạn!" },
    ],
    wior: [
      {
        speaker: "enemy",
        text: "Không thể... Tôi đã thua... Shizuku ở tháp phía bắc. Cô ấy đang chờ...Nhưng cẩn thận, đây chỉ là khởi đầu...",
      },
      { speaker: "player", text: "Cảm ơn! Tôi sẽ cứu Shizuku!" },
      {
        speaker: "enemy",
        text: "Khi cậu gặp được cô ấy, hãy hỏi cô ấy về AZI faction... Điều gì lắp ẩn đằng sau tất cả...Đây chỉ là cuộc chiến đầu tiên...",
      },
    ],
    "trade-1": [
      { speaker: "enemy", text: "Bạn mạnh lắm! Đây là tiền thưởng của bạn." },
      { speaker: "player", text: "Cảm ơn! Tôi sẽ mua kỹ năng mới." },
    ],
    "trade-2": [
      { speaker: "enemy", text: "Bạn lại thắng! Kỹ năng của bạn thực sự tuyệt vời." },
      { speaker: "player", text: "Tôi sẽ tiếp tục cải thiện." },
    ],
    "trade-3": [
      { speaker: "enemy", text: "Tôi phục! Bạn xứng đáng là một chiến binh tuyệt vời!" },
      { speaker: "player", text: "Cảm ơn! Tôi sẽ không bao giờ từ bỏ!" },
    ],
    "desert-merchant": [
      { speaker: "enemy", text: "Bạn... bạn đã thắng tôi? Điều này là không thể... Bạn chắc là người tuyệt vời..." },
      { speaker: "player", text: "Kỹ năng độc nhất của bạn là của tôi bây giờ!" },
      {
        speaker: "enemy",
        text: "Vâng... Lấy nó. Cùng với vàng... Nhưng xin hãy nhớ... Có những lực lượng lớn hơn lao động viên và trí thức... Có một cuộc chiến sắp xảy ra...",
      },
      { speaker: "player", text: "Cuộc chiến? Tôi sẽ sẵn sàng cho bất cứ điều gì!" },
    ],

    // Campaign backwards compat
    "fight-1": [
      { speaker: "enemy", text: "Không thể... Làm sao cậu...?" },
      { speaker: "player", text: "Hãy cho tôi biết đường tới người lãnh đạo!" },
    ],
    "fight-2": [
      { speaker: "enemy", text: "Cậu mạnh hơn vẻ ngoài..." },
      { speaker: "player", text: "Tôi có người cần bảo vệ." },
    ],
    "fight-3": [
      { speaker: "enemy", text: "Có lẽ còn hy vọng..." },
      { speaker: "player", text: "Tôi sẽ không bao giờ từ bỏ!" },
    ],
    "fight-4": [
      { speaker: "enemy", text: "Tôi thua rồi..." },
      { speaker: "player", text: "Tôi sẽ tiếp tục chiến đấu!" },
    ],
    "boss-1": [
      { speaker: "enemy", text: "Không... điều này không thể..." },
      { speaker: "player", text: "Shizuku ở đâu?!" },
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
    const enemyName = document.getElementById("dialogue-name"); // Sửa id từ enemy-name thành dialogue-name

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
    const dialogueName = document.getElementById("dialogue-name");

    // Update name
    dialogueName.textContent = dialogue.speaker === "player" ? "Bao" : "Opponent";

    // Highlight active speaker
    if (dialogue.speaker === "player") {
      leftPortrait.classList.add("active");
      rightPortrait.classList.remove("active");
    } else {
      leftPortrait.classList.remove("active");
      rightPortrait.classList.add("active");
    }

    // Type effect - no character reversal, set full text properly
    dialogueText.textContent = "";
    let i = 0;
    const text = dialogue.text;
    // Ensure text direction is set correctly
    dialogueText.style.direction = "ltr";
    dialogueText.style.unicodeBidi = "bidi-override";

    const typeInterval = setInterval(() => {
      if (i < text.length) {
        // Append one character at a time without reversing
        const currentText = text.substring(0, i + 1);
        dialogueText.textContent = currentText;
        i++;
      } else {
        clearInterval(typeInterval);
      }
    }, 30);
  },

  getEnemyData(enemyId) {
    const enemies = {
      // Main plot - Akh'Zahara
      "miner-1": { name: "Miner 1", portrait: "⛏️", difficulty: "easy" },
      "miner-2": { name: "Miner 2", portrait: "⛏️", difficulty: "easy" },
      "miner-3": { name: "Miner 3", portrait: "⛏️", difficulty: "easy" },
      edras: { name: "Edras - Manager", portrait: "👔", difficulty: "medium" },
      wior: { name: "Wior - Boss", portrait: "♚", difficulty: "hard" },

      // Trade Association
      "trade-1": { name: "Merchant Fighter 1", portrait: "♟", difficulty: "easy" },
      "trade-2": { name: "Merchant Fighter 2", portrait: "♞", difficulty: "medium" },
      "trade-3": { name: "Merchant Fighter 3", portrait: "♜", difficulty: "hard" },

      // Desert Merchant
      "desert-merchant": { name: "Desert Merchant", portrait: "🏜️", difficulty: "hard" },

      // Campaign backwards compat
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
