// Global Game State
window.gameState = {
  // Board state
  boardState: [],
  whiteKingPos: [7, 4],
  blackKingPos: [0, 4],

  // Timers
  timers: {
    white: 600,
    black: 600,
    currentPlayer: "white",
    interval: null,
    isPaused: false,
  },

  // Turn counter
  turnNumber: 1,

  // Energy system
  energy: {
    white: 1,
    black: 1,
    maxEP: 3,
  },

  // Piece health system
  pieceHealth: {},

  // Energy tiles (rows 3-6)
  energyTiles: [],

  // Skill cards
  playerDeck: [],
  playerHand: [],
  enemyDeck: [],
  enemyHand: [],

  // Buffs and debuffs
  activeEffects: [],

  // Move and skill logs
  moveLog: [],
  skillLog: [],

  // Selected piece for movement
  selectedPiece: null,

  // Initialize game state
  init() {
    this.generateEnergyTiles();
    this.initializePieceHealth();
    this.loadPlayerDeck();
  },

  // Generate energy tiles in rows 3-6 (indices 2-5)
  generateEnergyTiles() {
    this.energyTiles = [];
    for (let row = 2; row <= 5; row++) {
      for (let col = 0; col < 8; col++) {
        // 30% chance for energy tile
        if (Math.random() < 0.3) {
          this.energyTiles.push({ row, col, active: true });
        }
      }
    }
  },

  // Initialize health for all pieces
  initializePieceHealth() {
    this.pieceHealth = {};
    const pieces = ["♔", "♕", "♖", "♗", "♘", "♙", "♚", "♛", "♜", "♝", "♞", "♟"];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.boardState[row][col];
        if (piece && pieces.includes(piece)) {
          const key = `${row}-${col}`;
          this.pieceHealth[key] = { current: 1.0, max: 1.0 };
        }
      }
    }
  },

  // Load player's deck from localStorage or use default
  loadPlayerDeck() {
    const savedDeck = JSON.parse(localStorage.getItem("chess_player_deck") || "null");
    if (savedDeck && savedDeck.length === 5) {
      this.playerDeck = savedDeck;
    } else {
      // Default deck
      this.playerDeck = ["azw_attack", "azw_shield", "azw_hard_work", "azw_unity", "azw_sandstorm"];
    }

    // Draw initial card
    this.drawCard("white");
  },

  // Draw a skill card
  drawCard(player) {
    const deck = player === "white" ? this.playerDeck : this.enemyDeck;
    const hand = player === "white" ? this.playerHand : this.enemyHand;

    if (deck.length === 0) return;

    const randomIndex = Math.floor(Math.random() * deck.length);
    const card = deck[randomIndex];
    hand.push(card);

    if (player === "white") {
      this.updateSkillCardsUI();
    }
  },

  // Update skill cards UI
  updateSkillCardsUI() {
    const container = document.getElementById("skill-cards");
    if (!container) return;

    container.innerHTML = "";
    this.playerHand.forEach((skillId, index) => {
      const skill = window.skillSystem.getSkill(skillId);
      if (!skill) return;

      const card = document.createElement("div");
      card.className = "skill-card";
      card.innerHTML = `
        <div class="skill-name">${skill.name}</div>
        <div class="skill-cost">Cost: ${skill.cost} EP</div>
        <div class="skill-desc">${skill.description}</div>
      `;

      if (this.energy.white >= skill.cost) {
        card.classList.add("usable");
        card.onclick = () => this.useSkill(index);
      } else {
        card.classList.add("disabled");
      }

      container.appendChild(card);
    });
  },

  // Use a skill card
  useSkill(handIndex) {
    if (handIndex >= this.playerHand.length) return;

    const skillId = this.playerHand[handIndex];
    const skill = window.skillSystem.getSkill(skillId);

    if (!skill || this.energy.white < skill.cost) {
      alert("Not enough energy!");
      return;
    }

    // Execute skill
    if (window.skillSystem.executeSkill(skillId, "white")) {
      // Deduct energy
      this.energy.white -= skill.cost;

      // Remove card from hand
      this.playerHand.splice(handIndex, 1);

      // Log skill usage
      this.skillLog.push(`Turn ${this.turnNumber}: Used ${skill.name}`);
      this.updateSkillLog();

      // Update UI
      this.updateSkillCardsUI();
      this.updateEnergyDisplay();
    }
  },

  // Add energy to player
  addEnergy(player, amount) {
    if (player === "white") {
      this.energy.white = Math.min(this.energy.white + amount, this.energy.maxEP);
    } else {
      this.energy.black = Math.min(this.energy.black + amount, this.energy.maxEP);
    }
    this.updateEnergyDisplay();
  },

  // Update energy display
  updateEnergyDisplay() {
    const epElement = document.getElementById("current-ep");
    if (epElement) {
      epElement.textContent = this.energy.white;
    }
  },

  // Check if tile is energy tile
  isEnergyTile(row, col) {
    return this.energyTiles.some((t) => t.row === row && t.col === col && t.active);
  },

  // Log a move
  logMove(from, to, piece, captured) {
    const fromNotation = this.positionToNotation(from[0], from[1]);
    const toNotation = this.positionToNotation(to[0], to[1]);
    const captureSymbol = captured ? "x" : "-";

    const log = `${this.turnNumber}. ${piece} ${fromNotation}${captureSymbol}${toNotation}`;
    this.moveLog.push(log);
    this.updateMoveLog();
  },

  // Update move log UI
  updateMoveLog() {
    const container = document.getElementById("move-log");
    if (!container) return;

    container.innerHTML = this.moveLog
      .slice(-10)
      .reverse()
      .map((log) => `<div class="log-entry">${log}</div>`)
      .join("");
  },

  // Update skill log UI
  updateSkillLog() {
    const container = document.getElementById("skill-log");
    if (!container) return;

    container.innerHTML = this.skillLog
      .slice(-5)
      .reverse()
      .map((log) => `<div class="log-entry">${log}</div>`)
      .join("");
  },

  // Convert position to chess notation
  positionToNotation(row, col) {
    const files = "abcdefgh";
    const rank = 8 - row;
    return files[col] + rank;
  },

  // Update turn counter
  incrementTurn() {
    if (this.timers.currentPlayer === "black") {
      this.turnNumber++;
      document.getElementById("turn-number").textContent = this.turnNumber;

      // Draw card every 3 turns
      if (this.turnNumber % 3 === 0) {
        this.drawCard("white");
      }
    }
  },

  // Update buffs/debuffs display
  updateEffectsDisplay() {
    const container = document.getElementById("buff-debuff-list");
    if (!container) return;

    container.innerHTML = "";
    this.activeEffects.forEach((effect) => {
      const div = document.createElement("div");
      div.className = `effect-item ${effect.type}`;
      div.innerHTML = `
        <strong>${effect.name}</strong>
        <div>Duration: ${effect.duration} turns</div>
      `;
      container.appendChild(div);
    });
  },

  // Process turn-based effects
  processTurnEffects() {
    this.activeEffects = this.activeEffects.filter((effect) => {
      effect.duration--;
      if (effect.duration <= 0) {
        // Remove effect
        return false;
      }
      return true;
    });
    this.updateEffectsDisplay();
  },
};

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  // Story intro button
  const storyBtn = document.getElementById("start-story-btn");
  if (storyBtn) {
    storyBtn.addEventListener("click", () => {
      document.getElementById("story-intro").classList.add("d-none");
      document.getElementById("welcome-screen").classList.remove("d-none");
    });
  }
});
