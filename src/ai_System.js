// AI System for opponents
window.aiSystem = {
  difficulty: "easy", // easy, medium, hard

  // Set difficulty based on opponent
  setDifficulty(level) {
    this.difficulty = level;
  },

  // AI makes a move
  makeMove() {
    if (!window.gameState || !window.gameState.boardState) return;
    // Ensure any dead pieces are cleaned before AI decision-making
    if (window.gameState.pruneDeadPieces) window.gameState.pruneDeadPieces();

    const blackPieces = ["♚", "♛", "♜", "♝", "♞", "♟"];
    const pieces = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = window.gameState.boardState[row][col];
        const key = `${row}-${col}`;
        const health = window.gameState.pieceHealth[key];
        // Only consider pieces that exist and have positive health
        if (blackPieces.includes(piece) && health && health.current > 0) {
          pieces.push({ row, col, piece });
        }
      }
    }

    if (pieces.length === 0) return;

    // Gather all valid moves and compute a simulated 1-ply evaluation for stronger play
    const allMoves = [];
    pieces.forEach(({ row, col, piece }) => {
      const moves = this.getValidMovesForPiece(row, col, piece);
      moves.forEach(([toRow, toCol]) => {
        const baseScore = this.evaluateMove(row, col, toRow, toCol, piece);
        // Simulate the move on a cloned board/pieceHealth to get a better estimate
        const simScore = this.simulateAndEvaluate(row, col, toRow, toCol, piece, baseScore);
        allMoves.push({ fromRow: row, fromCol: col, toRow, toCol, piece, score: simScore });
      });
    });

    if (allMoves.length === 0) return;

    // Prefer capture moves strongly: if any capture exists, bias selection toward captures
    const captureMoves = allMoves.filter((m) => {
      const target = window.gameState.boardState[m.toRow][m.toCol];
      if (!target) return false;
      const tKey = `${m.toRow}-${m.toCol}`;
      const tHealth = window.gameState.pieceHealth[tKey];
      return tHealth && tHealth.current > 0;
    });

    let selectedMove = null;
    if (captureMoves.length > 0) {
      // Choose a capture move with higher probability depending on difficulty
      if (this.difficulty === "easy") {
        // easy: 60% chance to pick a capture, otherwise random
        if (Math.random() < 0.6) selectedMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
      } else if (this.difficulty === "medium") {
        // medium: 90% chance to pick best capture
        if (Math.random() < 0.9) {
          captureMoves.sort((a, b) => b.score - a.score);
          selectedMove = captureMoves[0];
        }
      } else {
        // hard: always pick best capture
        captureMoves.sort((a, b) => b.score - a.score);
        selectedMove = captureMoves[0];
      }
    }

    // If not selected from captures, fall back to normal selection
    if (!selectedMove) {
      if (this.difficulty === "easy") selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
      else if (this.difficulty === "medium") {
        if (Math.random() < 0.7) {
          allMoves.sort((a, b) => b.score - a.score);
          selectedMove = allMoves[0];
        } else selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
      } else {
        allMoves.sort((a, b) => b.score - a.score);
        selectedMove = allMoves[0];
      }
    }

    if (!selectedMove) return;

    // Execute the move immediately (rely on centralized damage logic)
    const fr = selectedMove.fromRow;
    const fc = selectedMove.fromCol;
    const tr = selectedMove.toRow;
    const tc = selectedMove.toCol;
    const pieceChar = selectedMove.piece;

    const captured = window.gameState.boardState[tr][tc] !== "";
    let defeatPieceSurvived = false;

    if (captured && window.gameState.applyDamage) {
      // mark last combat for visuals
      if (window.gameState) {
        if (window.gameState._lastCombatTimer) {
          clearTimeout(window.gameState._lastCombatTimer);
          window.gameState._lastCombatTimer = null;
        }
        window.gameState.lastCombat = { attacker: `${fr}-${fc}`, defender: `${tr}-${tc}` };
        window.gameState._lastCombatTimer = setTimeout(() => {
          if (window.gameState) window.gameState.lastCombat = { attacker: null, defender: null };
          window.gameState._lastCombatTimer = null;
          if (window.syncBoardStateWithDOM) window.syncBoardStateWithDOM();
        }, 3000);
      }

      // applyDamage returns true if the target died
      const died = window.gameState.applyDamage(tr, tc, 1, "capture", "black");
      defeatPieceSurvived = !died;
    }

    // Determine final position
    let finalRow = tr;
    let finalCol = tc;
    if (captured && defeatPieceSurvived) {
      // If defeated piece survived, AI piece returns to origin
      finalRow = fr;
      finalCol = fc;
    }

    // Only move board state if final differs from origin
    if (finalRow !== fr || finalCol !== fc) {
      window.gameState.boardState[finalRow][finalCol] = pieceChar;
      window.gameState.boardState[fr][fc] = "";
    }

    if (pieceChar === "♚") window.gameState.blackKingPos = [finalRow, finalCol];

    const oldKey = `${fr}-${fc}`;
    const newKey = `${finalRow}-${finalCol}`;
    if (window.gameState.pieceHealth[oldKey]) {
      window.gameState.pieceHealth[newKey] = window.gameState.pieceHealth[oldKey];
      delete window.gameState.pieceHealth[oldKey];
    }

    // If this was a capture, mark the AI piece as having attacked (for persistent highlight)
    try {
      if (captured && window.gameState && window.gameState.markAttacked) {
        window.gameState.markAttacked("black", `${finalRow}-${finalCol}`);
      }
    } catch (e) {}

    if (window.gameState.isEnergyTile(finalRow, finalCol)) window.gameState.addEnergy("black", 1);

    window.gameState.logMove([fr, fc], [finalRow, finalCol], pieceChar, captured);

    // Ensure any pieces reduced to 0 are pruned and UI updated
    if (window.gameState.pruneDeadPieces) window.gameState.pruneDeadPieces();
    window.syncBoardStateWithDOM();
    window.updateAllHealthBars();

    // Process turn effects and switch back to player
    window.gameState.processTurnEffects();
    if (window.switchPlayer) switchPlayer();

    window.battleSystem.checkVictory();

    // AI may use a skill
    this.useSkill();
  },

  // Get valid moves for a piece
  getValidMovesForPiece(row, col, piece) {
    let moves = [];

    if (piece === "♛") {
      moves = window.getValidQueenMoves(row, col, piece); // Use global from chess_Logic
    } else if (piece === "♚") {
      moves = window.getValidKingMoves(row, col, piece);
    } else if (piece === "♝") {
      moves = window.getValidBishopMoves(row, col, piece);
    } else if (piece === "♜") {
      moves = window.getValidRookMoves(row, col, piece);
    } else if (piece === "♟") {
      moves = window.getValidPawnMoves(row, col, piece);
    } else if (piece === "♞") {
      moves = window.getValidKnightMoves(row, col, piece);
    }

    // Filter out moves that put king in check
    return moves.filter(([toRow, toCol]) => {
      return this.isMoveSafe(row, col, toRow, toCol, piece);
    });
  },

  // Evaluate move quality (higher = better)
  evaluateMove(fromRow, fromCol, toRow, toCol, piece) {
    let score = 0;
    const targetPiece = window.gameState.boardState[toRow][toCol];

    // Capture value
    if (targetPiece) {
      const values = { "♔": 1000, "♕": 9, "♖": 5, "♗": 3, "♘": 3, "♙": 1 };
      // Heavy weight for captures so AI aggressively takes pieces
      const baseVal = values[targetPiece] || 1;
      score += baseVal * 100; // main capture incentive
      // Also add a small EP-related bonus for defeating (AI gets +2 EP on kill)
      score += 10;
    }

    // Center control
    const centerDistance = Math.abs(toRow - 3.5) + Math.abs(toCol - 3.5);
    score += 7 - centerDistance;

    // Energy tile bonus
    if (window.gameState.isEnergyTile(toRow, toCol)) {
      score += 5;
    }

    // Piece development
    if ((piece === "♞" || piece === "♝") && fromRow <= 1) {
      score += 3;
    }

    // Random factor based on difficulty
    if (this.difficulty === "easy") {
      score += Math.random() * 10;
    } else if (this.difficulty === "medium") {
      score += Math.random() * 3;
    }

    return score;
  },

  // Simulate the move on cloned state and evaluate resulting board position (1-ply lookahead)
  simulateAndEvaluate(fromRow, fromCol, toRow, toCol, piece, baseScore) {
    // shallow clones for board and health
    const boardClone = window.gameState.boardState.map((r) => [...r]);
    const phClone = JSON.parse(JSON.stringify(window.gameState.pieceHealth || {}));

    // Apply move on clones
    const targetKey = `${toRow}-${toCol}`;
    const srcKey = `${fromRow}-${fromCol}`;
    const targetPiece = boardClone[toRow][toCol];

    // Simulate capture damage: reduce health by 1
    if (targetPiece && phClone[targetKey]) {
      phClone[targetKey].current = Math.max(0, phClone[targetKey].current - 1);
      if (phClone[targetKey].current <= 0) {
        boardClone[toRow][toCol] = "";
        delete phClone[targetKey];
      }
    }

    // Move piece
    boardClone[toRow][toCol] = piece;
    boardClone[fromRow][fromCol] = "";

    if (phClone[srcKey]) {
      phClone[`${toRow}-${toCol}`] = phClone[srcKey];
      delete phClone[srcKey];
    }

    // Evaluate resulting board: material + health + mobility + center control
    const values = {
      "♔": 1000,
      "♕": 9,
      "♖": 5,
      "♗": 3,
      "♘": 3,
      "♙": 1,
      "♚": 1000,
      "♛": 9,
      "♜": 5,
      "♝": 3,
      "♞": 3,
      "♟": 1,
    };
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = boardClone[r][c];
        if (!p) continue;
        const k = `${r}-${c}`;
        const health = phClone[k] ? phClone[k].current : 1;
        const val = values[p] || 1;
        if (["♚", "♛", "♜", "♝", "♞", "♟"].includes(p)) {
          score += val * health;
        } else {
          score -= val * health;
        }
      }
    }

    // Mobility: count black piece moves
    let mobility = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = boardClone[r][c];
        if (p && ["♚", "♛", "♜", "♝", "♞", "♟"].includes(p)) {
          // temporarily set global state for move calc
          const oldBoard = window.gameState.boardState;
          const oldPH = window.gameState.pieceHealth;
          window.gameState.boardState = boardClone;
          window.gameState.pieceHealth = phClone;
          try {
            const moves = this.getValidMovesForPiece(r, c, p);
            mobility += moves.length;
          } catch (e) {
            mobility += 0;
          }
          window.gameState.boardState = oldBoard;
          window.gameState.pieceHealth = oldPH;
        }
      }
    }

    score += mobility * 0.1;

    // Safety: penalize moves that allow immediate recapture by white
    // We'll check if any white piece has a capture move to (toRow,toCol)
    const oldBoard = window.gameState.boardState;
    const oldPH = window.gameState.pieceHealth;
    window.gameState.boardState = boardClone;
    window.gameState.pieceHealth = phClone;
    let danger = 0;
    try {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = window.gameState.boardState[r][c];
          if (p && ["♔", "♕", "♖", "♗", "♘", "♙"].includes(p)) {
            const moves =
              window.getValidQueenMoves && p === "♕"
                ? window.getValidQueenMoves(r, c, p)
                : this.getValidMovesForPiece(r, c, p);
            if (moves && moves.some(([mr, mc]) => mr === toRow && mc === toCol)) danger += 1;
          }
        }
      }
    } catch (e) {
      danger = 0;
    }
    window.gameState.boardState = oldBoard;
    window.gameState.pieceHealth = oldPH;

    score -= danger * 2.5; // penalize danger

    // Normalize and combine with baseScore
    return baseScore + score * 0.05;
  },

  // Check if move is safe (doesn't put king in check)
  isMoveSafe(fromRow, fromCol, toRow, toCol, piece) {
    const tempPiece = window.gameState.boardState[toRow][toCol];
    window.gameState.boardState[toRow][toCol] = piece;
    window.gameState.boardState[fromRow][fromCol] = "";

    const kingPos = piece === "♚" ? [toRow, toCol] : window.gameState.blackKingPos;
    const safe = !this.isKingInCheck(kingPos[0], kingPos[1], false);

    // Restore
    window.gameState.boardState[fromRow][fromCol] = piece;
    window.gameState.boardState[toRow][toCol] = tempPiece;

    return safe;
  },

  isKingInCheck(kingRow, kingCol, isWhite) {
    const blackPieces = ["♚", "♛", "♜", "♝", "♞", "♟"];
    const whitePieces = ["♔", "♕", "♖", "♗", "♘", "♙"];
    const opponentPieces = isWhite ? blackPieces : whitePieces;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = window.gameState.boardState[row][col];
        if (opponentPieces.includes(piece)) {
          const moves = this.getValidMovesForPiece(row, col, piece);
          if (moves.some(([r, c]) => r === kingRow && c === kingCol)) {
            return true;
          }
        }
      }
    }
    return false;
  },

  // AI uses skill (simple logic)
  useSkill() {
    if (window.gameState.energy.black < 1) return;

    const hand = window.gameState.enemyHand || [];
    if (!hand || hand.length === 0) return;

    // Determine probability of attempting to use a skill based on difficulty
    let useProb = 0.3; // default
    if (this.difficulty === "easy") useProb = 0.1;
    else if (this.difficulty === "medium") useProb = 0.4;
    else if (this.difficulty === "hard") useProb = 0.9;

    // Boss-like opponents should be more likely to use skills
    try {
      const current = window.battleSystem && window.battleSystem.currentOpponent;
      if (current && ["edras", "wior", "desert-merchant"].includes(current)) {
        useProb = Math.max(useProb, 0.9);
      }
    } catch (e) {}

    if (Math.random() >= useProb) return;

    // Try skills deterministically: prefer ones the AI can afford, iterate to find a usable skill
    for (let i = 0; i < hand.length; i++) {
      const skillId = hand[i];
      const skill = window.skillSystem.getSkill(skillId);
      if (!skill) continue;
      if (window.gameState.energy.black < skill.cost) continue;

      // Attempt to execute skill. If it succeeds, consume cost and remove from hand
      const ok = window.skillSystem.executeSkill(skillId, "black");
      if (ok) {
        window.gameState.energy.black = Math.max(0, window.gameState.energy.black - skill.cost);
        window.gameState.enemyHand.splice(i, 1);
        window.gameState.skillLog.push(`AI Turn ${window.gameState.turnNumber}: Used ${skill.name}`);
        window.gameState.updateSkillLog();

        // Prune dead pieces and update UI after AI skill use
        if (window.gameState.pruneDeadPieces) window.gameState.pruneDeadPieces();
        if (window.syncBoardStateWithDOM) window.syncBoardStateWithDOM();
        if (window.updateAllHealthBars) window.updateAllHealthBars();
        break;
      }
    }
  },
};
