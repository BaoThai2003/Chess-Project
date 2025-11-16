// Battle System - Manages battle flow
window.battleSystem = {
  currentOpponent: null,
  battleActive: false,

  // Start a battle
  startBattle(opponentId) {
    console.log("Starting battle with:", opponentId);
    this.currentOpponent = opponentId;
    this.battleActive = true;

    // Get opponent data
    const enemyData = window.dialogueSystem.getEnemyData(opponentId);

    // Set AI difficulty
    window.aiSystem.setDifficulty(enemyData.difficulty);

    // Show dialogue first
    window.dialogueSystem.showDialogue(opponentId, () => {
      // After dialogue, show battle screen
      this.showBattleScreen(enemyData);
    });
  },

  // Show battle screen and initialize board
  showBattleScreen(enemyData) {
    // Hide all screens
    document.querySelectorAll(".fullscreen-overlay").forEach((el) => {
      el.classList.add("hidden");
    });

    // Show battle screen
    const battleScreen = document.getElementById("battle-screen");
    battleScreen.classList.remove("hidden");

    // Set enemy name
    document.getElementById("battle-opponent").textContent = `vs ${enemyData.name}`;
    document.getElementById("enemy-name-battle").textContent = enemyData.name;

    // Initialize game state
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

    // Create chess board
    if (window.createChessBoard) {
      window.createChessBoard();
    }

    // Update turn display
    document.getElementById("battle-turn").textContent = "Turn: 1";

    // Surrender button
    const surrenderBtn = document.querySelector(".btn-surrender");
    if (surrenderBtn) {
      surrenderBtn.onclick = () => {
        if (confirm("Surrender this battle?")) {
          this.endBattle(false);
        }
      };
    }
  },

  // End battle
  endBattle(victory) {
    this.battleActive = false;

    // Hide battle screen
    document.getElementById("battle-screen").classList.add("hidden");

    if (victory) {
      // Show victory dialogue
      window.dialogueSystem.showVictoryDialogue(this.currentOpponent, () => {
        this.showVictoryScreen();
      });
    } else {
      // Show defeat screen
      this.showDefeatScreen();
    }
  },

  // Show victory screen
  showVictoryScreen() {
    const victoryScreen = document.getElementById("victory-screen");
    victoryScreen.classList.remove("hidden");

    // Calculate rewards
    const expRewards = {
      easy: 10,
      medium: 25,
      hard: 50,
    };

    const enemyData = window.dialogueSystem.getEnemyData(this.currentOpponent);
    const expGained = expRewards[enemyData.difficulty] || 10;

    // Update player stats
    const playerData = this.getPlayerData();
    playerData.exp += expGained;
    playerData.wins += 1;

    // Check level up
    const oldLevel = playerData.level;
    while (playerData.exp >= playerData.expToNext) {
      playerData.exp -= playerData.expToNext;
      playerData.level += 1;
      playerData.expToNext = Math.floor(playerData.expToNext * 1.5);
    }

    this.savePlayerData(playerData);

    // Display rewards
    document.getElementById("exp-gained").textContent = `+${expGained}`;
    document.getElementById("new-level").textContent = playerData.level;

    // Update campaign progress if applicable
    if (this.currentOpponent.startsWith("fight-") || this.currentOpponent.startsWith("boss-")) {
      this.updateCampaignProgress(this.currentOpponent);
    }

    // Continue button
    document.getElementById("victory-continue").onclick = () => {
      victoryScreen.classList.add("hidden");

      // Return to appropriate screen
      if (this.currentOpponent.startsWith("fight-") || this.currentOpponent.startsWith("boss-")) {
        document.getElementById("campaign-screen").classList.remove("hidden");
      } else {
        document.getElementById("arena-screen").classList.remove("hidden");
      }
    };
  },

  // Show defeat screen
  showDefeatScreen() {
    const defeatScreen = document.getElementById("defeat-screen");
    defeatScreen.classList.remove("hidden");

    // Update stats
    const playerData = this.getPlayerData();
    playerData.losses += 1;
    this.savePlayerData(playerData);

    // Retry button
    document.getElementById("defeat-retry").onclick = () => {
      defeatScreen.classList.add("hidden");
      this.startBattle(this.currentOpponent);
    };

    // Menu button
    document.getElementById("defeat-menu").onclick = () => {
      defeatScreen.classList.add("hidden");
      document.getElementById("main-menu").classList.remove("hidden");
    };
  },

  // Get player data
  getPlayerData() {
    const defaultData = {
      name: "Bao",
      level: 1,
      exp: 0,
      expToNext: 100,
      wins: 0,
      losses: 0,
      campaignProgress: {},
    };

    const saved = localStorage.getItem("chess_player_data");
    return saved ? JSON.parse(saved) : defaultData;
  },

  // Save player data
  savePlayerData(data) {
    localStorage.setItem("chess_player_data", JSON.stringify(data));
    this.updatePlayerUI();
  },

  // Update player UI
  updatePlayerUI() {
    const data = this.getPlayerData();

    // Main menu
    const nameEl = document.getElementById("player-name");
    const levelEl = document.getElementById("player-level");
    const expEl = document.getElementById("player-exp");
    const expMaxEl = document.getElementById("player-exp-max");

    if (nameEl) nameEl.textContent = data.name;
    if (levelEl) levelEl.textContent = data.level;
    if (expEl) expEl.textContent = data.exp;
    if (expMaxEl) expMaxEl.textContent = data.expToNext;

    // Profile screen
    document.getElementById("profile-name").textContent = data.name;
    document.getElementById("profile-level").textContent = data.level;
    document.getElementById("profile-exp").textContent = data.exp;
    document.getElementById("profile-wins").textContent = data.wins;
    document.getElementById("profile-losses").textContent = data.losses;

    const totalBattles = data.wins + data.losses;
    const winRate = totalBattles > 0 ? Math.round((data.wins / totalBattles) * 100) : 0;
    document.getElementById("profile-winrate").textContent = `${winRate}%`;
  },

  // Update campaign progress
  updateCampaignProgress(nodeId) {
    const playerData = this.getPlayerData();
    if (!playerData.campaignProgress) playerData.campaignProgress = {};

    playerData.campaignProgress[nodeId] = true;
    this.savePlayerData(playerData);

    // Update node visuals
    this.updateCampaignUI();
  },

  // Update campaign UI
  updateCampaignUI() {
    const playerData = this.getPlayerData();
    const progress = playerData.campaignProgress || {};

    // Count completed fights
    let completed = 0;
    for (let i = 1; i <= 4; i++) {
      if (progress[`fight-${i}`]) completed++;
    }

    // Update progress bar
    const progressBar = document.getElementById("act-progress");
    const progressText = document.getElementById("act-progress-text");
    if (progressBar) progressBar.style.width = `${(completed / 5) * 100}%`;
    if (progressText) progressText.textContent = `${completed}/5`;

    // Unlock nodes
    document.querySelectorAll(".map-node").forEach((node) => {
      const nodeId = node.dataset.node;

      if (progress[nodeId]) {
        node.classList.add("completed");
        node.classList.remove("locked");
      }

      // Unlock boss if all fights completed
      if (nodeId === "boss-1" && completed >= 4) {
        node.classList.remove("locked");
      }
    });
  },

  // Check victory condition
  checkVictory() {
    if (!window.gameState || !this.battleActive) return;

    const whiteKingHealth = this.getKingHealth("white");
    const blackKingHealth = this.getKingHealth("black");

    if (blackKingHealth <= 0) {
      // Player wins
      this.endBattle(true);
      return true;
    } else if (whiteKingHealth <= 0) {
      // Player loses
      this.endBattle(false);
      return true;
    }

    return false;
  },

  // Get king health
  getKingHealth(color) {
    const kingPos = color === "white" ? window.gameState.whiteKingPos : window.gameState.blackKingPos;
    const key = `${kingPos[0]}-${kingPos[1]}`;
    const health = window.gameState.pieceHealth[key];
    return health ? health.current : 0;
  },
};

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  // Update player UI
  if (window.battleSystem) {
    window.battleSystem.updatePlayerUI();
    window.battleSystem.updateCampaignUI();
  }
});
