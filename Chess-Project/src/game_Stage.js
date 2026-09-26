// CRITICAL FIX: Game State with proper dead piece handling
window.gameState = {
  boardState: [],
  whiteKingPos: [7, 4],
  blackKingPos: [0, 4],

  timers: {
    white: 600,
    black: 600,
    currentPlayer: "white",
    interval: null,
    isPaused: false,
  },

  turnNumber: 1,

  energy: {
    white: 1,
    black: 1,
    maxEP: 12,
  },

  pieceHealth: {},
  energyTiles: [],
  playerDeck: [],
  playerHand: [],
  enemyDeck: [],
  enemyHand: [],
  pieceSkills: {},
  lastCombat: { attacker: null, defender: null },
  _lastCombatTimer: null,
  attackedPieces: { white: {}, black: {} },
  activeEffects: [],
  moveLog: [],
  skillLog: [],
  selectedPiece: null,

  init() {
    this.generateEnergyTiles();
    this.initializePieceHealth();
    this.loadPlayerDeck();
    this.updateEnergyDisplay();
    this.updateEffectsDisplay();
    this.selectedFaction = localStorage.getItem("selected_faction") || "azw";
    if (window.skillSystem && window.skillSystem.getPieceSkillMapping) {
      this.assignPieceSkills();
    }
  },

  generateEnergyTiles() {
    this.energyTiles = [];
    for (let row = 2; row <= 5; row++) {
      for (let col = 0; col < 8; col++) {
        if (Math.random() < 0.3) {
          this.energyTiles.push({ row, col, active: true });
        }
      }
    }
  },

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

  loadPlayerDeck() {
    let savedDeck = null;
    try {
      savedDeck = JSON.parse(localStorage.getItem("chess_player_deck") || "null");
    } catch (error) {
      localStorage.removeItem("chess_player_deck");
    }

    const validSkillIds = new Set(Object.keys(window.skillSystem?.skills || {}));
    if (
      Array.isArray(savedDeck) &&
      savedDeck.length === 5 &&
      savedDeck.every((skillId) => validSkillIds.has(skillId))
    ) {
      this.playerDeck = savedDeck;
    } else {
      this.playerDeck = ["azw_attack", "azw_shield", "azw_hard_work", "azw_unity", "azw_sandstorm"];
    }

    this.drawCard("white");
  },

  drawCard(player) {
    const deck = player === "white" ? this.playerDeck : this.enemyDeck;
    const hand = player === "white" ? this.playerHand : this.enemyHand;

    if (deck.length === 0) return;

    const randomIndex = Math.floor(Math.random() * deck.length);
    const card = deck.splice(randomIndex, 1)[0];
    hand.push(card);

    if (player === "white") {
      this.updateSkillCardsUI();
    }
  },

  updateSkillCardsUI() {
    const container = document.getElementById("battle-skills");
    if (!container) return;

    container.innerHTML = "";
    this.playerHand.forEach((skillId, index) => {
      const skill = window.skillSystem.getSkill(skillId);
      if (!skill) return;

      const card = document.createElement("button");
      card.className = "skill-card";
      card.type = "button";
      card.setAttribute("aria-label", `${skill.name}, costs ${skill.cost} energy`);
      card.innerHTML = `
        <span class="skill-card-top"><span class="skill-name">${skill.name}</span><span class="skill-state">READY</span></span>
        <span class="skill-cost">${skill.cost} EP</span>
        <div class="skill-desc">${skill.description}</div>
      `;

      const isPlayerTurn = this.timers.currentPlayer === "white";
      const canUse = isPlayerTurn && this.energy.white >= skill.cost;
      if (canUse) {
        card.classList.add("usable");
        card.onclick = () => this.useSkill(index);
      } else {
        card.classList.add("disabled");
        card.querySelector(".skill-state").textContent = isPlayerTurn ? "NEEDS EP" : "WAIT";
        card.setAttribute("aria-disabled", "true");
      }

      container.appendChild(card);
    });
  },

  useSkill(handIndex) {
    if (handIndex >= this.playerHand.length) return;

    const skillId = this.playerHand[handIndex];
    const skill = window.skillSystem.getSkill(skillId);

    if (!skill || this.energy.white < skill.cost) {
      alert("Not enough energy!");
      return;
    }

    if (window.skillSystem.executeSkill(skillId, "white")) {
      this.energy.white -= skill.cost;
      this.playerHand.splice(handIndex, 1);
      this.skillLog.push(`Turn ${this.turnNumber}: Used ${skill.name}`);
      this.updateSkillLog();
      this.updateEnergyDisplay();
      this.updateSkillCardsUI();
      this.showBattleNotification(`${skill.name} activated`, "success");

      // CRITICAL: Prune and update after skill
      this.pruneDeadPieces();
      if (window.syncBoardStateWithDOM) window.syncBoardStateWithDOM();
      if (window.updateAllHealthBars) window.updateAllHealthBars();
    }
  },

  addEnergy(player, amount) {
    if (player === "white") {
      this.energy.white = Math.min(this.energy.white + amount, this.energy.maxEP);
    } else {
      this.energy.black = Math.min(this.energy.black + amount, this.energy.maxEP);
    }
    this.updateEnergyDisplay();
  },

  updateEnergyDisplay() {
    const epElement = document.getElementById("current-ep");
    const maxEpElement = document.getElementById("max-ep");
    if (epElement) epElement.textContent = this.energy.white;
    if (maxEpElement) maxEpElement.textContent = this.energy.maxEP;
    const track = document.querySelector(".energy-track span");
    if (track) track.style.width = `${Math.max(0, Math.min(100, (this.energy.white / this.energy.maxEP) * 100))}%`;
    const hint = document.getElementById("energy-hint");
    if (hint)
      hint.textContent =
        this.energy.white === 0 ? "No energy. Capture energy tiles or end a turn." : "Use energy to activate skills.";
    this.updateBattleHud();
  },

  getKingHealthStats(color) {
    const position = color === "white" ? this.whiteKingPos : this.blackKingPos;
    const health = this.pieceHealth[`${position[0]}-${position[1]}`] || { current: 0, max: 1 };
    return { current: Math.max(0, health.current), max: Math.max(health.max, 1) };
  },

  updateBattleHud() {
    const updateHealth = (color, prefix) => {
      const stats = this.getKingHealthStats(color);
      const current = Math.round(stats.current * 100);
      const max = Math.round(stats.max * 100);
      const value = document.getElementById(`${prefix}-hp`);
      const maxValue = document.getElementById(`${prefix}-hp-max`);
      const fill = document.getElementById(`${prefix}-hp-fill`);
      if (value) value.textContent = current;
      if (maxValue) maxValue.textContent = max;
      if (fill) {
        fill.style.width = `${Math.max(0, Math.min(100, (stats.current / stats.max) * 100))}%`;
        fill.parentElement?.parentElement?.classList.toggle("critical", stats.current / stats.max <= 0.33);
      }
    };
    updateHealth("white", "player");
    updateHealth("black", "opponent");
  },

  showBattleNotification(message, type = "info") {
    const notification = document.getElementById("battle-notification");
    if (!notification) return;
    notification.textContent = message;
    notification.dataset.type = type;
    notification.classList.remove("is-visible");
    requestAnimationFrame(() => notification.classList.add("is-visible"));
    clearTimeout(this._notificationTimer);
    this._notificationTimer = setTimeout(
      () => notification.classList.remove("is-visible"),
      type === "critical" ? 3200 : 2200,
    );
  },

  isEnergyTile(row, col) {
    return this.energyTiles.some((t) => t.row === row && t.col === col && t.active);
  },

  logMove(from, to, piece, captured) {
    const fromNotation = this.positionToNotation(from[0], from[1]);
    const toNotation = this.positionToNotation(to[0], to[1]);
    const captureSymbol = captured ? "x" : "-";

    const log = `${this.turnNumber}. ${piece} ${fromNotation}${captureSymbol}${toNotation}`;
    this.moveLog.push(log);
    this.updateMoveLog();
  },

  updateMoveLog() {
    const container = document.getElementById("move-log");
    if (!container) return;

    container.innerHTML = this.moveLog
      .slice(-10)
      .reverse()
      .map((log) => `<div class="log-entry">${log}</div>`)
      .join("");
  },

  updateSkillLog() {
    const container = document.getElementById("skill-log");
    if (!container) return;

    container.innerHTML = this.skillLog
      .slice(-5)
      .reverse()
      .map((log) => `<div class="log-entry">${log}</div>`)
      .join("");
  },

  positionToNotation(row, col) {
    const files = "abcdefgh";
    const rank = 8 - row;
    return files[col] + rank;
  },

  incrementTurn() {
    if (this.timers.currentPlayer === "black") {
      this.turnNumber++;
      document.getElementById("battle-turn").textContent = `Turn: ${this.turnNumber}`;

      if (this.turnNumber >= 50) {
        this.handleTurnLimit();
        return;
      }

      if (this.turnNumber % 3 === 0) {
        this.drawCard("white");
      }
    }
  },

  handleTurnLimit() {
    this.timers.isPaused = true;
    document.getElementById("battle-turn").textContent = `Turn: ${this.turnNumber} - GAME OVER (Turn Limit)`;

    const winner = this.calculateTurnLimitWinner();

    if (winner === "white") {
      alert("Turn limit reached! White wins based on total piece health!");
      window.battleSystem.endBattle(true);
    } else if (winner === "black") {
      alert("Turn limit reached! Black wins based on total piece health!");
      window.battleSystem.endBattle(false);
    } else {
      alert("Turn limit reached! It's a draw!");
      window.battleSystem.endBattle(false);
    }
  },

  calculateTurnLimitWinner() {
    const whitePieces = ["♔", "♕", "♖", "♗", "♘", "♙"];
    const blackPieces = ["♚", "♛", "♜", "♝", "♞", "♟"];

    let whiteTotal = 0,
      blackTotal = 0;
    let whiteKingHealth = 0,
      blackKingHealth = 0;

    for (let key in this.pieceHealth) {
      const health = this.pieceHealth[key];
      if (health && health.current > 0) {
        const [row, col] = key.split("-").map(Number);
        const piece = this.boardState[row][col];

        if (whitePieces.includes(piece)) {
          whiteTotal += health.current;
          if (piece === "♔") whiteKingHealth = health.current;
        } else if (blackPieces.includes(piece)) {
          blackTotal += health.current;
          if (piece === "♚") blackKingHealth = health.current;
        }
      }
    }

    if (whiteTotal > blackTotal) return "white";
    if (blackTotal > whiteTotal) return "black";
    if (whiteKingHealth > blackKingHealth) return "white";
    if (blackKingHealth > whiteKingHealth) return "black";

    return "draw";
  },

  updateEffectsDisplay() {
    const container = document.getElementById("buff-debuff-list");
    if (!container) return;

    container.innerHTML = "";
    this.activeEffects.forEach((effect) => {
      const div = document.createElement("div");
      // Default owner to white when missing
      const owner = effect.owner || "white";
      let classes = `effect-item ${effect.type}`;
      if (owner === "black") {
        // enemy: use special coloring class
        if (effect.type === "buff") classes += " enemy-buff";
        else if (effect.type === "debuff") classes += " enemy-debuff";
        else classes += " enemy-buff";
      } else {
        // player effects keep default styling
      }

      div.className = classes;
      div.innerHTML = `
        <strong>${owner === "black" ? "Enemy: " : ""}${effect.name}</strong>
        <div>Duration: ${effect.duration} turns</div>
      `;
      container.appendChild(div);
    });
  },

  processTurnEffects() {
    this.activeEffects = this.activeEffects.filter((effect) => {
      effect.duration--;
      return effect.duration > 0;
    });

    const whitePieces = ["♔", "♕", "♖", "♗", "♘", "♙"];
    const blackPieces = ["♚", "♛", "♜", "♝", "♞", "♟"];

    for (let key in this.pieceHealth) {
      const [r, c] = key.split("-").map(Number);
      const piece = this.boardState[r] ? this.boardState[r][c] : null;
      if (!piece) continue;

      if (whitePieces.includes(piece) && (r === 6 || r === 7)) {
        this.pieceHealth[key].current = Math.min(this.pieceHealth[key].max, this.pieceHealth[key].current + 0.2);
      }

      if (blackPieces.includes(piece) && (r === 0 || r === 1)) {
        this.pieceHealth[key].current = Math.min(this.pieceHealth[key].max, this.pieceHealth[key].current + 0.2);
      }
    }

    this.updateEffectsDisplay();
    this.pruneDeadPieces();
  },

  // Mark a piece (by its current position key) as having attacked. The marker persists until
  // the piece is removed or the battle ends.
  markAttacked(color, key) {
    if (!color || !key) return;
    if (!this.attackedPieces) this.attackedPieces = { white: {}, black: {} };
    if (color === "white") this.attackedPieces.white[key] = true;
    else this.attackedPieces.black[key] = true;
  },

  // Remove attacked marker for a removed piece
  unmarkAttacked(key) {
    if (!key) return;
    if (this.attackedPieces.white && this.attackedPieces.white[key]) delete this.attackedPieces.white[key];
    if (this.attackedPieces.black && this.attackedPieces.black[key]) delete this.attackedPieces.black[key];
  },

  // Clear all attacked markers (call at end of battle)
  clearAttackedMarkers() {
    this.attackedPieces = { white: {}, black: {} };
  },

  // CRITICAL FIX: Apply damage with immediate dead piece removal
  applyDamage(row, col, amount, source = "skill", attacker = null) {
    if (source === "skill") amount = Math.min(amount, 0.5);
    if (source === "capture") amount = Math.min(amount, 0.75);

    const key = `${row}-${col}`;
    let health = this.pieceHealth[key];
    // If health entry is missing but a piece exists on the board, initialize it to full health
    if (!health) {
      const piece = this.boardState[row] ? this.boardState[row][col] : null;
      if (!piece || piece === "") return false;
      this.pieceHealth[key] = { current: 1.0, max: 1.0 };
      health = this.pieceHealth[key];
    }

    health.current -= amount;
    if (window.battleSystem && window.battleSystem.showBattleNotification) {
      window.battleSystem.showBattleNotification(
        `${Math.round(amount * 100)} damage`,
        amount >= 0.5 ? "critical" : "info",
      );
    }

    if (health.current <= 0) {
      const piece = this.boardState[row][col];

      // IMMEDIATE REMOVAL
      this.boardState[row][col] = "";
      delete this.pieceHealth[key];

      if (attacker) this.addEnergy(attacker, 2);

      if (this.pieceSkills && this.pieceSkills[key]) {
        delete this.pieceSkills[key];
      }

      this.moveLog.push(`Piece eliminated: ${piece} at ${this.positionToNotation(row, col)}`);
      this.updateMoveLog();

      // Force immediate UI update
      if (window.syncBoardStateWithDOM) {
        window.syncBoardStateWithDOM();
      }
      if (window.updateAllHealthBars) {
        window.updateAllHealthBars();
      }

      if (window.battleSystem) {
        window.battleSystem.checkVictory();
      }

      return true;
    }

    if (window.updateAllHealthBars) {
      window.updateAllHealthBars();
    }
    return false;
  },

  // CRITICAL FIX: Comprehensive dead piece cleanup
  pruneDeadPieces() {
    const toRemove = [];

    for (let key in this.pieceHealth) {
      const health = this.pieceHealth[key];
      if (!health || health.current <= 0) {
        toRemove.push(key);
      }
    }

    toRemove.forEach((key) => {
      const [r, c] = key.split("-").map(Number);
      const piece = this.boardState[r] && this.boardState[r][c] ? this.boardState[r][c] : null;

      if (piece && piece !== "") {
        this.boardState[r][c] = "";
        this.moveLog.push(`Piece eliminated (cleanup): ${piece} at ${this.positionToNotation(r, c)}`);
      }

      delete this.pieceHealth[key];

      // Remove any attacked markers for the removed piece
      try {
        this.unmarkAttacked(key);
      } catch (e) {}

      if (this.pieceSkills && this.pieceSkills[key]) {
        delete this.pieceSkills[key];
      }
    });

    if (toRemove.length > 0) {
      this.updateMoveLog();
      if (window.updateAllHealthBars) {
        window.updateAllHealthBars();
      }
    }
  },

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

  usePieceSkill(row, col, player) {
    const key = `${row}-${col}`;
    const skillId = this.pieceSkills[key];
    if (!skillId) return false;
    const skill = window.skillSystem.getSkill(skillId);
    if (!skill) return false;

    if (this.energy[player] < skill.cost) {
      this.showBattleNotification("Not enough energy for that skill", "warning");
      return false;
    }

    const ok = window.skillSystem.executeSkill(skillId, player, { row, col });
    if (ok) {
      this.energy[player] = Math.max(0, this.energy[player] - skill.cost);
      this.updateEnergyDisplay();
      this.showBattleNotification(`${skill.name} activated`, "success");
      this.skillLog.push(`${player} used ${skill.name} at ${this.positionToNotation(row, col)}`);
      this.updateSkillLog();

      // CRITICAL: Always prune after piece skill
      this.pruneDeadPieces();
      if (window.syncBoardStateWithDOM) window.syncBoardStateWithDOM();
      if (window.updateAllHealthBars) window.updateAllHealthBars();
      return true;
    }
    return false;
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const storyBtn = document.getElementById("start-story-btn");
  if (storyBtn) {
    storyBtn.addEventListener("click", () => {
      document.getElementById("story-intro").classList.add("hidden");
      document.getElementById("main-menu").classList.remove("hidden");
    });
  }
});
