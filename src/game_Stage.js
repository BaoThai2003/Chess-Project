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
  // Track pieces that have attacked during the match. Keys are position strings 'r-c'.
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
    const savedDeck = JSON.parse(localStorage.getItem("chess_player_deck") || "null");
    if (savedDeck && savedDeck.length === 5) {
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
      this.updateSkillCardsUI();
      this.updateEnergyDisplay();

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
      let extra = "";
      if (effect.effect === "king_damage_increase") {
        const acc = (effect.accumulated || 0).toFixed(2);
        extra = `<div>King damage bonus: +${acc}</div>`;
      }
      div.innerHTML = `
        <strong>${owner === "black" ? "Enemy: " : ""}${effect.name}</strong>
        <div>Duration: ${effect.duration} turns</div>
        ${extra}
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

    // Special handling: king damage stacking effect increases each turn
    try {
      // If AZW piece count <= 6 and there's no existing white king_damage_increase effect, auto-add it
      const wp = ["♔", "♕", "♖", "♗", "♘", "♙"];
      let whiteCount = 0;
      for (let key in this.pieceHealth) {
        const [r, c] = key.split("-").map(Number);
        const p = this.boardState[r] ? this.boardState[r][c] : null;
        if (p && wp.includes(p)) whiteCount++;
      }
      const hasKingDamage = this.activeEffects.some((e) => e.effect === "king_damage_increase" && e.owner === "white");
      if (whiteCount <= 6 && !hasKingDamage) {
        this.activeEffects.push({
          name: "Concentric",
          type: "buff",
          duration: 999,
          effect: "king_damage_increase",
          value: 0.05,
          accumulated: 0,
          max: 1,
          owner: "white",
        });
      }

      // Increment accumulated damage for existing king_damage_increase effects
      this.activeEffects.forEach((e) => {
        if (e.effect === "king_damage_increase") {
          e.accumulated = Math.min(e.max || 1, (e.accumulated || 0) + (e.value || 0));
        }
      });
    } catch (e) {}

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

    // King damage increase: if the lastCombat attacker is a king and has a stacking bonus,
    // add its accumulated bonus to the damage dealt.
    try {
      if (this.lastCombat && this.lastCombat.attacker) {
        const aKey = this.lastCombat.attacker;
        const [ar, ac] = aKey.split("-").map(Number);
        const attackerPiece = this.boardState[ar] ? this.boardState[ar][ac] : null;
        if (attackerPiece === "♔" || attackerPiece === "♚") {
          // Find matching active effect owned by the attacker's side
          const owner = attacker === "black" ? "black" : "white";
          const eff = this.activeEffects.find((e) => e.effect === "king_damage_increase" && e.owner === owner);
          if (eff && eff.accumulated) {
            amount += eff.accumulated;
          }
        }
      }
    } catch (e) {}

    const key = `${row}-${col}`;
    const health = this.pieceHealth[key];
    if (!health) return false;

    health.current -= amount;

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
      alert("Not enough EP to use piece skill");
      return false;
    }

    const ok = window.skillSystem.executeSkill(skillId, player, { row, col });
    if (ok) {
      this.energy[player] = Math.max(0, this.energy[player] - skill.cost);
      this.updateEnergyDisplay();
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
