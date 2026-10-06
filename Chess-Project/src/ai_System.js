// He thong AI doi thu
window.aiSystem = {
  difficulty: "easy",

  // Dat do kho
  setDifficulty(level) {
    this.difficulty = level;
  },

  // AI thuc hien mot nuoc
  makeMove() {
    if (!window.gameState || !window.gameState.boardState) return;
    // Duac bao dam cac quan chet duoc lam sach truoc khi AI quyet dinh
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

    const allMoves = [];
    pieces.forEach(({ row, col, piece }) => {
      const moves = this.getValidMovesForPiece(row, col, piece);
      moves.forEach(([toRow, toCol]) => {
        const baseScore = this.evaluateMove(row, col, toRow, toCol, piece);
        const simScore = this.simulateAndEvaluate(row, col, toRow, toCol, piece, baseScore);
        allMoves.push({ fromRow: row, fromCol: col, toRow, toCol, piece, score: simScore });
      });
    });

    if (allMoves.length === 0) return;

    const captureMoves = allMoves.filter((m) => {
      const target = window.gameState.boardState[m.toRow][m.toCol];
      if (!target) return false;
      const tKey = `${m.toRow}-${m.toCol}`;
      const tHealth = window.gameState.pieceHealth[tKey];
      return tHealth && tHealth.current > 0;
    });

    let selectedMove = null;
    if (captureMoves.length > 0) {
      if (this.difficulty === "easy") {
        if (Math.random() < 0.6) selectedMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
      } else if (this.difficulty === "medium") {
        if (Math.random() < 0.9) {
          captureMoves.sort((a, b) => b.score - a.score);
          selectedMove = captureMoves[0];
        }
      } else {
        captureMoves.sort((a, b) => b.score - a.score);
        selectedMove = captureMoves[0];
      }
    }

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

    const fr = selectedMove.fromRow;
    const fc = selectedMove.fromCol;
    const tr = selectedMove.toRow;
    const tc = selectedMove.toCol;
    const pieceChar = selectedMove.piece;

    const captured = window.gameState.boardState[tr][tc] !== "";
    let defeatPieceSurvived = false;

    if (captured && window.gameState.applyDamage) {
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

      const died = window.gameState.applyDamage(tr, tc, 1, "capture", "black");
      defeatPieceSurvived = !died;
    }

    let finalRow = tr;
    let finalCol = tc;
    if (captured && defeatPieceSurvived) {
      finalRow = fr;
      finalCol = fc;
    }

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

    try {
      if (captured && window.gameState && window.gameState.markAttacked) {
        window.gameState.markAttacked("black", `${finalRow}-${finalCol}`);
      }
    } catch (e) {}

    if (window.gameState.isEnergyTile(finalRow, finalCol)) window.gameState.addEnergy("black", 1);

    window.gameState.logMove([fr, fc], [finalRow, finalCol], pieceChar, captured);

    if (window.gameState.pruneDeadPieces) window.gameState.pruneDeadPieces();
    window.syncBoardStateWithDOM();
    window.updateAllHealthBars();

    window.gameState.processTurnEffects();
    if (window.switchPlayer) switchPlayer();

    window.battleSystem.checkVictory();

    this.useSkill();
  },

  getValidMovesForPiece(row, col, piece) {
    const moves = this.getPseudoLegalMoves(row, col, piece);

    return moves.filter(([toRow, toCol]) => {
      return this.isMoveSafe(row, col, toRow, toCol, piece);
    });
  },

  getPseudoLegalMoves(row, col, piece) {
    if (piece === "♛") return window.getValidQueenMoves(row, col, piece);
    if (piece === "♚") return window.getValidKingMoves(row, col, piece);
    if (piece === "♝") return window.getValidBishopMoves(row, col, piece);
    if (piece === "♜") return window.getValidRookMoves(row, col, piece);
    if (piece === "♟") return window.getValidPawnMoves(row, col, piece);
    if (piece === "♞") return window.getValidKnightMoves(row, col, piece);
    return [];
  },

  evaluateMove(fromRow, fromCol, toRow, toCol, piece) {
    let score = 0;
    const targetPiece = window.gameState.boardState[toRow][toCol];

    if (targetPiece) {
      const values = { "♔": 1000, "♕": 9, "♖": 5, "♗": 3, "♘": 3, "♙": 1 };
      const baseVal = values[targetPiece] || 1;
      score += baseVal * 100; // main capture incentive
      score += 10;
    }

    const centerDistance = Math.abs(toRow - 3.5) + Math.abs(toCol - 3.5);
    score += 7 - centerDistance;

    if (window.gameState.isEnergyTile(toRow, toCol)) {
      score += 5;
    }

    if ((piece === "♞" || piece === "♝") && fromRow <= 1) {
      score += 3;
    }

    if (this.difficulty === "easy") {
      score += Math.random() * 10;
    } else if (this.difficulty === "medium") {
      score += Math.random() * 3;
    }

    return score;
  },

  simulateAndEvaluate(fromRow, fromCol, toRow, toCol, piece, baseScore) {
    const boardClone = window.gameState.boardState.map((r) => [...r]);
    const phClone = JSON.parse(JSON.stringify(window.gameState.pieceHealth || {}));

    const targetKey = `${toRow}-${toCol}`;
    const srcKey = `${fromRow}-${fromCol}`;
    const targetPiece = boardClone[toRow][toCol];

    if (targetPiece && phClone[targetKey]) {
      phClone[targetKey].current = Math.max(0, phClone[targetKey].current - 1);
      if (phClone[targetKey].current <= 0) {
        boardClone[toRow][toCol] = "";
        delete phClone[targetKey];
      }
    }

    boardClone[toRow][toCol] = piece;
    boardClone[fromRow][fromCol] = "";

    if (phClone[srcKey]) {
      phClone[`${toRow}-${toCol}`] = phClone[srcKey];
      delete phClone[srcKey];
    }

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

    let mobility = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = boardClone[r][c];
        if (p && ["♚", "♛", "♜", "♝", "♞", "♟"].includes(p)) {
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

    score -= danger * 2.5;

    return baseScore + score * 0.05;
  },

  isMoveSafe(fromRow, fromCol, toRow, toCol, piece) {
    const tempPiece = window.gameState.boardState[toRow][toCol];
    window.gameState.boardState[toRow][toCol] = piece;
    window.gameState.boardState[fromRow][fromCol] = "";

    const kingPos = piece === "♚" ? [toRow, toCol] : window.gameState.blackKingPos;
    const safe = !this.isKingInCheck(kingPos[0], kingPos[1], false);

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
          // Attack detection must use pseudo-legal moves. Calling the full
          // safety filter here would recursively call isKingInCheck again.
          const moves = this.getPseudoLegalMoves(row, col, piece);
          if (moves.some(([r, c]) => r === kingRow && c === kingCol)) {
            return true;
          }
        }
      }
    }
    return false;
  },

  useSkill() {
    if (window.gameState.energy.black < 1) return;

    const hand = window.gameState.enemyHand || [];
    if (!hand || hand.length === 0) return;

    let useProb = 0.3; // default
    if (this.difficulty === "easy") useProb = 0.1;
    else if (this.difficulty === "medium") useProb = 0.4;
    else if (this.difficulty === "hard") useProb = 0.9;

    try {
      const current = window.battleSystem && window.battleSystem.currentOpponent;
      if (current && ["edras", "wior", "desert-merchant"].includes(current)) {
        useProb = Math.max(useProb, 0.9);
      }
    } catch (e) {}

    if (Math.random() >= useProb) return;

    for (let i = 0; i < hand.length; i++) {
      const skillId = hand[i];
      const skill = window.skillSystem.getSkill(skillId);
      if (!skill) continue;
      if (window.gameState.energy.black < skill.cost) continue;

      const ok = window.skillSystem.executeSkill(skillId, "black");
      if (ok) {
        window.gameState.energy.black = Math.max(0, window.gameState.energy.black - skill.cost);
        window.gameState.enemyHand.splice(i, 1);
        window.gameState.skillLog.push(`AI Turn ${window.gameState.turnNumber}: Used ${skill.name}`);
        window.gameState.updateSkillLog();

        if (window.gameState.pruneDeadPieces) window.gameState.pruneDeadPieces();
        if (window.syncBoardStateWithDOM) window.syncBoardStateWithDOM();
        if (window.updateAllHealthBars) window.updateAllHealthBars();
        break;
      }
    }
  },
};
