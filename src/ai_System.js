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

    // Find all black pieces
    const blackPieces = ["♚", "♛", "♜", "♝", "♞", "♟"];
    const pieces = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = window.gameState.boardState[row][col];
        if (blackPieces.includes(piece)) {
          pieces.push({ row, col, piece });
        }
      }
    }

    if (pieces.length === 0) return;

    // Get valid moves for all pieces
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

    // Choose move based on difficulty
    let selectedMove;
    if (this.difficulty === "easy") {
      // Easy: Random move
      selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    } else if (this.difficulty === "medium") {
      // Medium: 70% best move, 30% random
      if (Math.random() < 0.7) {
        allMoves.sort((a, b) => b.score - a.score);
        selectedMove = allMoves[0];
      } else {
        selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
      }
    } else {
      // Hard: Always best move
      allMoves.sort((a, b) => b.score - a.score);
      selectedMove = allMoves[0];
    }

    // Execute move
    if (selectedMove && window.executeMove) {
      setTimeout(() => {
        window.executeMove(
          selectedMove.fromRow,
          selectedMove.fromCol,
          selectedMove.toRow,
          selectedMove.toCol,
          selectedMove.piece,
          false // isPlayerMove
        );
      }, 1000); // 1 second delay for AI
    }
  },

  // Get valid moves for a piece
  getValidMovesForPiece(row, col, piece) {
    const whitePieces = ["♔", "♕", "♖", "♗", "♘", "♙"];
    const blackPieces = ["♚", "♛", "♜", "♝", "♞", "♟"];

    let moves = [];

    if (piece === "♛") {
      moves = this.getQueenMoves(row, col, false);
    } else if (piece === "♚") {
      moves = this.getKingMoves(row, col, false);
    } else if (piece === "♝") {
      moves = this.getBishopMoves(row, col, false);
    } else if (piece === "♜") {
      moves = this.getRookMoves(row, col, false);
    } else if (piece === "♟") {
      moves = this.getPawnMoves(row, col, false);
    } else if (piece === "♞") {
      moves = this.getKnightMoves(row, col, false);
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
      score += (values[targetPiece] || 1) * 10;
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
    const safe = !this.isKingInCheck(kingPos);

    window.gameState.boardState[fromRow][fromCol] = piece;
    window.gameState.boardState[toRow][toCol] = tempPiece;

    return safe;
  },

  // Check if king is in check
  isKingInCheck(kingPos) {
    const [kingRow, kingCol] = kingPos;
    const whitePieces = ["♔", "♕", "♖", "♗", "♘", "♙"];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = window.gameState.boardState[row][col];
        if (whitePieces.includes(piece)) {
          const moves = this.getValidMovesForPiece(row, col, piece);
          if (moves.some(([r, c]) => r === kingRow && c === kingCol)) {
            return true;
          }
        }
      }
    }
    return false;
  },

  // Movement patterns (simplified from chess_Logic.js)
  getQueenMoves(row, col, isWhite) {
    return [...this.getRookMoves(row, col, isWhite), ...this.getBishopMoves(row, col, isWhite)];
  },

  getKingMoves(row, col, isWhite) {
    const moves = [];
    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    directions.forEach(([dr, dc]) => {
      const r = row + dr,
        c = col + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = window.gameState.boardState[r][c];
        if (!target || this.isOpponentPiece(target, isWhite)) {
          moves.push([r, c]);
        }
      }
    });
    return moves;
  },

  getRookMoves(row, col, isWhite) {
    const moves = [];
    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];
    directions.forEach(([dr, dc]) => {
      let r = row + dr,
        c = col + dc;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = window.gameState.boardState[r][c];
        if (!target) {
          moves.push([r, c]);
        } else {
          if (this.isOpponentPiece(target, isWhite)) moves.push([r, c]);
          break;
        }
        r += dr;
        c += dc;
      }
    });
    return moves;
  },

  getBishopMoves(row, col, isWhite) {
    const moves = [];
    const directions = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    directions.forEach(([dr, dc]) => {
      let r = row + dr,
        c = col + dc;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = window.gameState.boardState[r][c];
        if (!target) {
          moves.push([r, c]);
        } else {
          if (this.isOpponentPiece(target, isWhite)) moves.push([r, c]);
          break;
        }
        r += dr;
        c += dc;
      }
    });
    return moves;
  },

  getKnightMoves(row, col, isWhite) {
    const moves = [];
    const jumps = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];
    jumps.forEach(([dr, dc]) => {
      const r = row + dr,
        c = col + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = window.gameState.boardState[r][c];
        if (!target || this.isOpponentPiece(target, isWhite)) {
          moves.push([r, c]);
        }
      }
    });
    return moves;
  },

  getPawnMoves(row, col, isWhite) {
    const moves = [];
    const direction = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;

    // Forward 1
    if (row + direction >= 0 && row + direction < 8) {
      if (!window.gameState.boardState[row + direction][col]) {
        moves.push([row + direction, col]);
        // Forward 2 from start
        if (row === startRow && !window.gameState.boardState[row + 2 * direction][col]) {
          moves.push([row + 2 * direction, col]);
        }
      }
    }

    // Diagonal captures
    [
      [direction, -1],
      [direction, 1],
    ].forEach(([dr, dc]) => {
      const r = row + dr,
        c = col + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = window.gameState.boardState[r][c];
        if (target && this.isOpponentPiece(target, isWhite)) {
          moves.push([r, c]);
        }
      }
    });

    return moves;
  },

  isOpponentPiece(piece, isWhite) {
    const whitePieces = ["♔", "♕", "♖", "♗", "♘", "♙"];
    const blackPieces = ["♚", "♛", "♜", "♝", "♞", "♟"];
    return isWhite ? blackPieces.includes(piece) : whitePieces.includes(piece);
  },

  // AI uses skill (simple logic)
  useSkill() {
    if (!window.gameState || window.gameState.energy.black < 2) return;

    // AI uses skills randomly when it has energy
    if (Math.random() < 0.3 && window.gameState.enemyHand.length > 0) {
      const randomSkill = Math.floor(Math.random() * window.gameState.enemyHand.length);
      // Simple skill execution - you can enhance this
      if (window.skillSystem && window.gameState.enemyHand[randomSkill]) {
        window.skillSystem.executeSkill(window.gameState.enemyHand[randomSkill], "black");
        window.gameState.enemyHand.splice(randomSkill, 1);
      }
    }
  },
};
