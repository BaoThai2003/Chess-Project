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
    maxEP: 12,
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

  // Piece-level skills mapping: key = "row-col" -> skillId
  pieceSkills: {},

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
    this.updateEnergyDisplay(); // New: Update on init
    this.updateEffectsDisplay();
    // Load selected faction and assign piece skills
    this.selectedFaction = localStorage.getItem("selected_faction") || "azw";
    if (window.skillSystem && window.skillSystem.getPieceSkillMapping) {
      this.assignPieceSkills();
    }
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
    const card = deck.splice(randomIndex, 1)[0]; // remove from deck when drawn
    hand.push(card);

    if (player === "white") {
      this.updateSkillCardsUI();
    }
  },

  // Update skill cards UI
  updateSkillCardsUI() {
    const container = document.getElementById("battle-skills");
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

    // Update orbs
    const orbs = document.querySelectorAll(".energy-orb");
    orbs.forEach((orb, i) => {
      if (i < this.energy.white) {
        orb.classList.add("filled");
      } else {
        orb.classList.remove("filled");
      }
    });
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
      document.getElementById("battle-turn").textContent = `Turn: ${this.turnNumber}`;

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
    // Decrement durations and remove expired effects
    this.activeEffects = this.activeEffects.filter((effect) => {
      effect.duration--;
      return effect.duration > 0;
    });

    // Regenerate pieces that are on their starting rows (rows 0-1 for black, 6-7 for white)
    const whitePieces = ["♔", "♕", "♖", "♗", "♘", "♙"];
    const blackPieces = ["♚", "♛", "♜", "♝", "♞", "♟"];
    for (let key in this.pieceHealth) {
      const [r, c] = key.split("-").map(Number);
      const piece = this.boardState[r] ? this.boardState[r][c] : null;
      if (!piece) continue;

      // If white piece on rows 6-7, regen 0.25 per turn
      if (whitePieces.includes(piece) && (r === 6 || r === 7)) {
        this.pieceHealth[key].current = Math.min(this.pieceHealth[key].max, this.pieceHealth[key].current + 0.25);
      }

      // If black piece on rows 0-1, regen 0.25 per turn
      if (blackPieces.includes(piece) && (r === 0 || r === 1)) {
        this.pieceHealth[key].current = Math.min(this.pieceHealth[key].max, this.pieceHealth[key].current + 0.25);
      }
    }

    this.updateEffectsDisplay();
  },

  // Apply damage to a piece at (row,col). `source` = 'skill'|'capture' etc.
  // `attacker` should be 'white' or 'black' when awarding EP on kill.
  applyDamage(row, col, amount, source = "skill", attacker = null) {
    // Cap skill damage at 0.75
    if (source === "skill") amount = Math.min(amount, 0.75);

    const key = `${row}-${col}`;
    const health = this.pieceHealth[key];
    if (!health) return false;

    health.current -= amount;
    if (health.current <= 0) {
      // Remove piece from board
      const piece = this.boardState[row][col];
      this.boardState[row][col] = "";
      delete this.pieceHealth[key];

      // Award 2 EP to attacker if provided (cap applied in addEnergy)
      if (attacker) this.addEnergy(attacker, 2);

      // Remove piece-skill mapping
      if (this.pieceSkills && this.pieceSkills[key]) delete this.pieceSkills[key];

      // Log death
      this.moveLog.push(`Piece eliminated: ${piece} at ${this.positionToNotation(row, col)}`);
      this.updateMoveLog();

      // Update UI
      if (window.syncBoardStateWithDOM) window.syncBoardStateWithDOM();
      if (window.updateAllHealthBars) window.updateAllHealthBars();
      if (window.battleSystem) window.battleSystem.checkVictory();
      return true; // died
    }

    // Update health bar visuals
    if (window.updateAllHealthBars) window.updateAllHealthBars();
    return false; // still alive
  },

  // Assign piece skills according to selected faction mapping
  assignPieceSkills() {
    const mapping =
      window.skillSystem && window.skillSystem.getPieceSkillMapping
        ? window.skillSystem.getPieceSkillMapping(this.selectedFaction || "azw")
        : null;
    this.pieceSkills = {};
    if (!mapping) return;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.boardState[r] && this.boardState[r][c];
        if (!piece) continue;
        const skillId = mapping[piece];
        if (skillId) this.pieceSkills[`${r}-${c}`] = skillId;
      }
    }
  },

  // Use a piece-level skill at (row,col) for `player` ("white"/"black")
  usePieceSkill(row, col, player) {
    const key = `${row}-${col}`;
    const skillId = this.pieceSkills[key];
    if (!skillId) return false;
    const skill = window.skillSystem.getSkill(skillId);
    if (!skill) return false;

    // Check EP
    if (this.energy[player] < skill.cost) {
      alert("Not enough EP to use piece skill");
      return false;
    }

    // Execute skill (pass context if skill supports it)
    const ok = window.skillSystem.executeSkill(skillId, player, { row, col });
    if (ok) {
      this.energy[player] = Math.max(0, this.energy[player] - skill.cost);
      this.updateEnergyDisplay();
      this.skillLog.push(`${player} used ${skill.name} at ${this.positionToNotation(row, col)}`);
      this.updateSkillLog();
      return true;
    }
    return false;
  },
};

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  // Story intro button
  const storyBtn = document.getElementById("start-story-btn");
  if (storyBtn) {
    storyBtn.addEventListener("click", () => {
      document.getElementById("story-intro").classList.add("hidden");
      document.getElementById("main-menu").classList.remove("hidden");
    });
  }
});
