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

    const blackPieces = ["♚", "♛", "♜", "♝", "♞", "♟"];
    const pieces = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = window.gameState.boardState[row][col];
        if (blackPieces.includes(piece)) pieces.push({ row, col, piece });
      }
    }

    if (pieces.length === 0) return;

    // Gather all valid moves
    const allMoves = [];
    pieces.forEach(({ row, col, piece }) => {
      const moves = this.getValidMovesForPiece(row, col, piece);
      moves.forEach(([toRow, toCol]) => {
        allMoves.push({
          fromRow: row,
          fromCol: col,
          toRow,
          toCol,
          piece,
          score: this.evaluateMove(row, col, toRow, toCol, piece),
        });
      });
    });

    if (allMoves.length === 0) return;

    // Prefer capture moves strongly: if any capture exists, bias selection toward captures
    const captureMoves = allMoves.filter((m) => window.gameState.boardState[m.toRow][m.toCol]);

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

    if (captured && window.gameState.applyDamage) {
      window.gameState.applyDamage(tr, tc, 1, "capture", "black");
    }

    window.gameState.boardState[tr][tc] = pieceChar;
    window.gameState.boardState[fr][fc] = "";

    if (pieceChar === "♚") window.gameState.blackKingPos = [tr, tc];

    const oldKey = `${fr}-${fc}`;
    const newKey = `${tr}-${tc}`;
    if (window.gameState.pieceHealth[oldKey]) {
      window.gameState.pieceHealth[newKey] = window.gameState.pieceHealth[oldKey];
      delete window.gameState.pieceHealth[oldKey];
    }

    if (window.gameState.isEnergyTile(tr, tc)) window.gameState.addEnergy("black", 1);

    window.gameState.logMove([fr, fc], [tr, tc], pieceChar, captured);

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
    if (window.gameState.energy.black < 2) return;

    // AI uses skills randomly when it has energy
    if (Math.random() < 0.3 && window.gameState.enemyHand.length > 0) {
      const randomSkill = Math.floor(Math.random() * window.gameState.enemyHand.length);
      const skillId = window.gameState.enemyHand[randomSkill];
      const skill = window.skillSystem.getSkill(skillId);
      if (skill && window.gameState.energy.black >= skill.cost) {
        if (window.skillSystem.executeSkill(skillId, "black")) {
          window.gameState.energy.black -= skill.cost;
          window.gameState.enemyHand.splice(randomSkill, 1);
          window.gameState.skillLog.push(`AI Turn ${window.gameState.turnNumber}: Used ${skill.name}`);
          window.gameState.updateSkillLog();
        }
      }
    }
  },
};
