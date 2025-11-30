// FIXED Battle System - Complete rewrite with proper background loading and dead piece handling
window.battleSystem = {
  currentOpponent: null,
  battleActive: false,

  startBattle(opponentId) {
    console.log("Starting battle with:", opponentId);
    this.currentOpponent = opponentId;
    this.battleActive = true;

    const enemyData = window.dialogueSystem.getEnemyData(opponentId);
    window.aiSystem.setDifficulty(enemyData.difficulty);

    window.dialogueSystem.showDialogue(opponentId, () => {
      this.showBattleScreen(enemyData);
    });
  },

  showBattleScreen(enemyData) {
    document.querySelectorAll(".fullscreen-overlay").forEach((el) => {
      el.classList.add("hidden");
    });

    const battleScreen = document.getElementById("battle-screen");
    battleScreen.classList.remove("hidden");

    // CRITICAL FIX: Set background image with proper paths
    this.setBackgroundImage();

    document.getElementById("battle-opponent").textContent = `vs ${enemyData.name}`;

    if (window.gameState) {
      window.gameState.turnNumber = 1;
      window.gameState.energy.white = 1;
      window.gameState.energy.black = 1;
      window.gameState.timers.white = 600;
      window.gameState.timers.black = 600;
      window.gameState.timers.currentPlayer = "white";
      window.gameState.moveLog = [];
      window.gameState.skillLog = [];
      window.gameState.activeEffects = [];
      window.gameState.playerHand = [];
      window.gameState.enemyHand = [];
    }

    const renderBoard = () => {
      if (window.createChessBoard) {
        window.createChessBoard();
        window.gameState.updateSkillCardsUI();
        window.gameState.updateEnergyDisplay();
        window.gameState.updateEffectsDisplay();
      } else {
        setTimeout(renderBoard, 500);
      }
    };
    renderBoard();

    document.getElementById("battle-turn").textContent = "Turn: 1";

    const surrenderBtn = document.querySelector(".btn-surrender");
    if (surrenderBtn) {
      surrenderBtn.onclick = () => {
        if (confirm("Surrender this battle?")) {
          this.endBattle(false);
        }
      };
    }
  },

  // CRITICAL FIX: Properly set background images
  setBackgroundImage() {
    const battleScreen = document.getElementById("battle-screen");
    let imageName;

    if (this.currentOpponent === "desert-merchant") {
      imageName = "Akh'Zahara_secret_map.png";
    } else if (this.currentOpponent && this.currentOpponent.includes("trade")) {
      imageName = "Akh'Zahara_village.png";
    } else {
      imageName = "Akh'Zahara_map.png";
    }

    // Try multiple path variations
    const paths = [
      `/assets/img/map/${imageName}`,
      `../assets/img/map/${imageName}`,
      `assets/img/map/${imageName}`,
      `./assets/img/map/${imageName}`,
    ];

    let loaded = false;
    const tryLoad = (index) => {
      if (loaded || index >= paths.length) {
        if (!loaded) {
          console.warn("Could not load battle background");
          battleScreen.style.backgroundImage = "none";
        }
        return;
      }

      const img = new Image();
      img.onload = () => {
        if (!loaded) {
          loaded = true;
          battleScreen.style.backgroundImage = `url('${paths[index]}')`;
          battleScreen.style.backgroundSize = "cover";
          battleScreen.style.backgroundPosition = "center center";
          battleScreen.style.backgroundRepeat = "no-repeat";
          battleScreen.style.backgroundAttachment = "fixed";
          console.log("Loaded background:", paths[index]);
        }
      };
      img.onerror = () => tryLoad(index + 1);
      img.src = paths[index];
    };

    tryLoad(0);
  },

  endBattle(victory) {
    this.battleActive = false;
    document.getElementById("battle-screen").classList.add("hidden");

    if (victory) {
      window.dialogueSystem.showVictoryDialogue(this.currentOpponent, () => {
        this.showVictoryScreen();
      });
    } else {
      this.showDefeatScreen();
    }
  },

  showVictoryScreen() {
    const victoryScreen = document.getElementById("victory-screen");
    victoryScreen.classList.remove("hidden");

    const expRewards = { easy: 10, medium: 25, hard: 50 };
    const moneyRewards = {
      "miner-1": 1000,
      "miner-2": 1500,
      "miner-3": 2000,
      edras: 5000,
      wior: 15000,
      "trade-1": 3000,
      "trade-2": 5000,
      "trade-3": 8000,
      "desert-merchant": 500000,
    };

    const enemyData = window.dialogueSystem.getEnemyData(this.currentOpponent);
    const expGained = expRewards[enemyData.difficulty] || 10;
    const moneyGained = moneyRewards[this.currentOpponent] || 1000;

    const playerData = this.getPlayerData();
    playerData.exp += expGained;
    playerData.wins += 1;
    playerData.money = (playerData.money || 0) + moneyGained;

    if (
      this.currentOpponent.startsWith("miner-") ||
      this.currentOpponent === "edras" ||
      this.currentOpponent === "wior"
    ) {
      playerData.akhZaharaProgress = playerData.akhZaharaProgress || {};
      playerData.akhZaharaProgress[this.currentOpponent] = true;
    }

    if (this.currentOpponent === "desert-merchant") {
      playerData.merchantDefeated = true;
    }

    const oldLevel = playerData.level;
    while (playerData.exp >= playerData.expToNext) {
      playerData.exp -= playerData.expToNext;
      playerData.level += 1;
      playerData.expToNext = Math.floor(playerData.expToNext * 1.5);
    }

    this.savePlayerData(playerData);

    document.getElementById("exp-gained").textContent = `+${expGained} EXP +${moneyGained.toLocaleString()} Gold`;
    document.getElementById("new-level").textContent = playerData.level;

    if (this.currentOpponent.startsWith("fight-") || this.currentOpponent.startsWith("boss-")) {
      this.updateCampaignProgress(this.currentOpponent);
    }

    document.getElementById("victory-continue").onclick = () => {
      victoryScreen.classList.add("hidden");

      if (window.dialogueSystem.victoryDialogues[this.currentOpponent]) {
        window.dialogueSystem.showVictoryDialogue(this.currentOpponent, () => {
          this.returnToAppropriateScreen();
        });
      } else {
        this.returnToAppropriateScreen();
      }
    };
  },

  returnToAppropriateScreen() {
    if (
      this.currentOpponent.startsWith("miner-") ||
      this.currentOpponent === "edras" ||
      this.currentOpponent === "wior"
    ) {
      document.getElementById("akh-zahara-screen").classList.remove("hidden");
    } else if (this.currentOpponent.startsWith("trade-")) {
      document.getElementById("guild-screen").classList.remove("hidden");
    } else if (this.currentOpponent === "desert-merchant") {
      document.getElementById("main-menu").classList.remove("hidden");
    } else if (this.currentOpponent.startsWith("fight-") || this.currentOpponent.startsWith("boss-")) {
      document.getElementById("campaign-screen").classList.remove("hidden");
    } else {
      document.getElementById("arena-screen").classList.remove("hidden");
    }
  },

  showDefeatScreen() {
    const defeatScreen = document.getElementById("defeat-screen");
    defeatScreen.classList.remove("hidden");

    const playerData = this.getPlayerData();
    playerData.losses += 1;
    this.savePlayerData(playerData);

    document.getElementById("defeat-retry").onclick = () => {
      defeatScreen.classList.add("hidden");
      this.startBattle(this.currentOpponent);
    };

    document.getElementById("defeat-menu").onclick = () => {
      defeatScreen.classList.add("hidden");
      document.getElementById("main-menu").classList.remove("hidden");
    };
  },

  getPlayerData() {
    const defaultData = {
      name: "Bao",
      level: 1,
      exp: 0,
      expToNext: 100,
      wins: 0,
      losses: 0,
      money: 9999999,
      campaignProgress: {},
      akhZaharaProgress: {},
      merchantDefeated: false,
      boughtSkills: [],
    };

    const saved = localStorage.getItem("chess_player_data");
    return saved ? JSON.parse(saved) : defaultData;
  },

  savePlayerData(data) {
    localStorage.setItem("chess_player_data", JSON.stringify(data));
    this.updatePlayerUI();
  },

  updatePlayerUI() {
    const data = this.getPlayerData();

    const nameEl = document.getElementById("player-name");
    const levelEl = document.getElementById("player-level");
    const expEl = document.getElementById("player-exp");
    const expMaxEl = document.getElementById("player-exp-max");

    if (nameEl) nameEl.textContent = data.name;
    if (levelEl) levelEl.textContent = data.level;
    if (expEl) expEl.textContent = data.exp;
    if (expMaxEl) expMaxEl.textContent = data.expToNext;

    document.getElementById("profile-name").textContent = data.name;
    document.getElementById("profile-level").textContent = data.level;
    document.getElementById("profile-exp").textContent = data.exp;
    document.getElementById("profile-wins").textContent = data.wins;
    document.getElementById("profile-losses").textContent = data.losses;

    const totalBattles = data.wins + data.losses;
    const winRate = totalBattles > 0 ? Math.round((data.wins / totalBattles) * 100) : 0;
    document.getElementById("profile-winrate").textContent = `${winRate}%`;
  },

  updateCampaignProgress(nodeId) {
    const playerData = this.getPlayerData();
    if (!playerData.campaignProgress) playerData.campaignProgress = {};

    playerData.campaignProgress[nodeId] = true;
    this.savePlayerData(playerData);
    this.updateCampaignUI();
  },

  updateCampaignUI() {
    const playerData = this.getPlayerData();
    const progress = playerData.campaignProgress || {};

    let completed = 0;
    for (let i = 1; i <= 4; i++) {
      if (progress[`fight-${i}`]) completed++;
    }

    const progressBar = document.getElementById("act-progress");
    const progressText = document.getElementById("act-progress-text");
    if (progressBar) progressBar.style.width = `${(completed / 5) * 100}%`;
    if (progressText) progressText.textContent = `${completed}/5`;

    document.querySelectorAll(".map-node").forEach((node) => {
      const nodeId = node.dataset.node;

      if (progress[nodeId]) {
        node.classList.add("completed");
        node.classList.remove("locked");
      }

      if (nodeId === "boss-1" && completed >= 4) {
        node.classList.remove("locked");
      }
    });
  },

  updateAkhZaharaProgress() {
    const playerData = this.getPlayerData();
    const progress = playerData.akhZaharaProgress || {};

    let completed = 0;
    const battles = ["miner-1", "miner-2", "miner-3", "edras", "wior"];
    battles.forEach((b) => {
      if (progress[b]) completed++;
    });

    const progressBar = document.getElementById("akh-progress");
    const progressText = document.getElementById("akh-progress-text");
    if (progressBar) progressBar.style.width = `${(completed / 5) * 100}%`;
    if (progressText) progressText.textContent = `${completed}/5`;

    document.querySelectorAll("#akh-zahara-screen .map-node").forEach((node) => {
      const nodeId = node.dataset.node;

      if (progress[nodeId]) {
        node.classList.add("completed");
        node.classList.remove("locked");
      }

      if (nodeId === "miner-1") {
        node.classList.remove("locked");
      } else if (nodeId === "miner-2" && progress["miner-1"]) {
        node.classList.remove("locked");
      } else if (nodeId === "miner-3" && progress["miner-2"]) {
        node.classList.remove("locked");
      } else if (nodeId === "edras" && progress["miner-3"]) {
        node.classList.remove("locked");
      } else if (nodeId === "wior" && progress["edras"]) {
        node.classList.remove("locked");
      }
    });
  },

  initTradeAssociation() {
    const playerData = this.getPlayerData();

    const moneyEl = document.getElementById("player-money");
    if (moneyEl) moneyEl.textContent = playerData.money.toLocaleString();

    const opponents = document.getElementById("trade-opponents");
    if (opponents) {
      opponents.innerHTML = `
        <div class="opponent-card" data-opponent="trade-1">
          <div class="card-icon">♟</div>
          <div class="card-name">Merchant Fighter 1</div>
          <div class="card-difficulty">Easy</div>
          <button class="btn-challenge">Challenge</button>
        </div>
        <div class="opponent-card" data-opponent="trade-2">
          <div class="card-icon">♞</div>
          <div class="card-name">Merchant Fighter 2</div>
          <div class="card-difficulty">Medium</div>
          <button class="btn-challenge">Challenge</button>
        </div>
        <div class="opponent-card" data-opponent="trade-3">
          <div class="card-icon">♜</div>
          <div class="card-name">Merchant Fighter 3</div>
          <div class="card-difficulty">Hard</div>
          <button class="btn-challenge">Challenge</button>
        </div>
      `;

      document.querySelectorAll("#trade-opponents .btn-challenge").forEach((btn) => {
        btn.onclick = () => {
          const card = btn.closest(".opponent-card");
          const opponentId = card.dataset.opponent;
          this.startBattle(opponentId);
        };
      });
    }

    this.updateShop();
  },

  updateShop() {
    const shopItems = document.getElementById("shop-items");
    if (!shopItems) return;

    const playerData = this.getPlayerData();
    const allSkills = window.skillSystem.getAllSkills() || [];

    shopItems.innerHTML = "";
    allSkills.forEach((skill) => {
      if (!playerData.boughtSkills.includes(skill.id)) {
        const cost = skill.cost * 1000;
        const canAfford = playerData.money >= cost;

        const item = document.createElement("div");
        item.className = "shop-item";
        item.innerHTML = `
          <div class="shop-item-name">${skill.name}</div>
          <div class="shop-item-price">${cost.toLocaleString()} Gold</div>
          <button class="btn-buy" ${!canAfford ? "disabled" : ""}>Buy</button>
        `;

        const buyBtn = item.querySelector(".btn-buy");
        buyBtn.onclick = () => {
          if (playerData.money >= cost) {
            playerData.money -= cost;
            playerData.boughtSkills.push(skill.id);
            this.savePlayerData(playerData);
            alert(`Purchased ${skill.name}!`);
            this.updateShop();
            this.initTradeAssociation();
          }
        };

        shopItems.appendChild(item);
      }
    });
  },

  // CRITICAL FIX: Check victory with proper dead piece handling
  checkVictory() {
    if (!window.gameState || !this.battleActive) return;

    // Force prune dead pieces before checking
    if (window.gameState.pruneDeadPieces) {
      window.gameState.pruneDeadPieces();
    }

    const whiteKingHealth = this.getKingHealth("white");
    const blackKingHealth = this.getKingHealth("black");

    if (blackKingHealth <= 0) {
      this.endBattle(true);
      return true;
    } else if (whiteKingHealth <= 0) {
      this.endBattle(false);
      return true;
    }

    return false;
  },

  getKingHealth(color) {
    const kingPos = color === "white" ? window.gameState.whiteKingPos : window.gameState.blackKingPos;
    const key = `${kingPos[0]}-${kingPos[1]}`;
    const health = window.gameState.pieceHealth[key];
    return health ? health.current : 0;
  },
};

document.addEventListener("DOMContentLoaded", () => {
  if (window.battleSystem) {
    window.battleSystem.updatePlayerUI();
    window.battleSystem.updateCampaignUI();
  }
});
