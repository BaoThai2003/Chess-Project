document.addEventListener("DOMContentLoaded", function () {
  const notification = document.querySelector(".notification");
  const container = document.getElementById("chess-pieces-container");
  const goButton = document.getElementById("go-button");
  const pieces = ["♔", "♕", "♖", "♗", "♘", "♙", "♚", "♛", "♜", "♝", "♞", "♟"];

  const whitePieces = ["♔", "♕", "♖", "♗", "♘", "♙"];
  const blackPieces = ["♚", "♛", "♜", "♝", "♞", "♟"];

  // Flying pieces effect on hover
  if (notification) {
    notification.addEventListener("mouseenter", function () {
      for (let i = 0; i < 20; i++) {
        createFlyingPiece();
      }
    });
  }

  // Go button handler
  if (goButton) {
    goButton.addEventListener("click", function () {
      if (notification) notification.style.display = "none";
    });
  }

  // Make createChessBoard globally accessible
  window.createChessBoard = createChessBoard;
  window.syncBoardStateWithDOM = syncBoardStateWithDOM;
  window.updateTimerDisplay = updateTimerDisplay;
  window.updateAllHealthBars = updateAllHealthBars;

  function createChessBoard() {
    const board = document.getElementById("chess-board");
    if (!board) return;

    board.innerHTML = "";

    // Initial chess position
    const initialPosition = [
      ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
      ["♟", "♟", "♟", "♟", "♟", "♟", "♟", "♟"],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"],
      ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"],
    ];

    // Initialize game state
    window.gameState.boardState = initialPosition.map((row) => [...row]);
    window.gameState.whiteKingPos = [7, 4];
    window.gameState.blackKingPos = [0, 4];
    window.gameState.init();

    // Default colors (lighter board for better visual over map)
    let whiteSquareColor = "#fbf5ea"; /* very light beige */
    let blackSquareColor = "#d6b889"; /* warm tan */
    let whitePieceColor = "#ffffff";
    let blackPieceColor = "#1a1a1a";

    // Create board squares
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement("div");
        square.className = "chess-square";
        square.dataset.row = row;
        square.dataset.col = col;

        // Set square color
        if ((row + col) % 2 === 0) {
          square.style.backgroundColor = whiteSquareColor;
        } else {
          square.style.backgroundColor = blackSquareColor;
        }

        // Check if energy tile
        if (window.gameState.isEnergyTile(row, col)) {
          square.classList.add("energy-tile");
        }

        // Place piece from initialPosition
        const piece = initialPosition[row][col];
        if (piece) {
          square.innerHTML = `
            <div class="piece-stack">
              <span class="piece-icon">${piece}</span>
              <div class="blood"></div>
              <div class="health-bar-container">
                <div class="health-bar" style="width: 100%"></div>
              </div>
            </div>
          `;
          const icon = square.querySelector(".piece-icon");
          icon.style.color = whitePieces.includes(piece) ? whitePieceColor : blackPieceColor;
        }

        // Click handler
        square.addEventListener("click", function () {
          handleSquareClick(this);
        });

        board.appendChild(square);
      }
    }

    // Color controls (if exist)
    const colorInputs = ["white-square", "black-square", "white-piece", "black-piece"];
    colorInputs.forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener("input", updateColors);
      }
    });

    function updateColors() {
      whiteSquareColor = document.getElementById("white-square")?.value || whiteSquareColor;
      blackSquareColor = document.getElementById("black-square")?.value || blackSquareColor;
      whitePieceColor = document.getElementById("white-piece")?.value || whitePieceColor;
      blackPieceColor = document.getElementById("black-piece")?.value || blackPieceColor;

      const squares = document.querySelectorAll(".chess-square");
      squares.forEach((square) => {
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);

        if ((row + col) % 2 === 0) {
          square.style.backgroundColor = whiteSquareColor;
        } else {
          square.style.backgroundColor = blackSquareColor;
        }

        const icon = square.querySelector(".piece-icon");
        if (icon) {
          const piece = icon.textContent;
          icon.style.color = whitePieces.includes(piece) ? whitePieceColor : blackPieceColor;
        }
      });
    }

    // Initialize timers
    initTimers();
  }

  // === SPECIAL BATTLE ACTIONS ===
  // Purge action removed

  // === PAWN PROMOTION & CASTLING ===
  function checkPawnPromotion(row, col, piece, isWhite) {
    // White pawns promoted at row 0, black pawns at row 7
    const promotionRow = isWhite ? 0 : 7;

    if (piece === "♙" && row === promotionRow) {
      promotePawn(row, col, isWhite);
    } else if (piece === "♟" && row === promotionRow) {
      promotePawn(row, col, isWhite);
    }
  }

  function promotePawn(row, col, isWhite) {
    const pieceOptions = isWhite ? ["♕", "♖", "♗", "♘"] : ["♛", "♜", "♝", "♞"];
    const pieceNames = ["Queen", "Rook", "Bishop", "Knight"];

    let promoted = false;
    let choice = 0;

    // Simple choice: default to Queen for now
    // In a full implementation, could show a dialog for player choice
    choice = 0; // Queen

    const newPiece = pieceOptions[choice];
    const oldPiece = window.gameState.boardState[row][col];

    // Replace pawn with promoted piece on board
    window.gameState.boardState[row][col] = newPiece;

    // Create new piece health entry for the promoted piece
    const key = `${row}-${col}`;
    const oldHealth = window.gameState.pieceHealth[key];
    if (oldHealth) {
      // Promoted piece keeps the pawn's health
      window.gameState.pieceHealth[key] = { ...oldHealth };
    }

    window.gameState.moveLog.push(
      `Pawn promoted to ${pieceNames[choice]} at ${window.gameState.positionToNotation(row, col)}!`
    );

    if (window.updateAllHealthBars) window.updateAllHealthBars();
  }

  function isCastlingMove(fromRow, fromCol, toRow, toCol, piece) {
    // Castling is only for kings and must move 2 squares horizontally
    if ((piece !== "♔" && piece !== "♚") || fromRow !== toRow) return false;
    if (Math.abs(toCol - fromCol) !== 2) return false;

    // King must not have moved (simplified check - would need to track move history for full implementation)
    // For now, just allow if rook is in starting position
    const isWhite = piece === "♔";
    const rookRow = isWhite ? 7 : 0;

    // Kingside castling (king moves right)
    if (toCol === fromCol + 2) {
      const rookCol = 7;
      const rook = window.gameState.boardState[rookRow][rookCol];
      return (isWhite && rook === "♖") || (!isWhite && rook === "♜");
    }

    // Queenside castling (king moves left)
    if (toCol === fromCol - 2) {
      const rookCol = 0;
      const rook = window.gameState.boardState[rookRow][rookCol];
      return (isWhite && rook === "♖") || (!isWhite && rook === "♜");
    }

    return false;
  }

  function executeCastling(fromRow, fromCol, toRow, toCol) {
    const piece = window.gameState.boardState[fromRow][fromCol];

    // Move king
    window.gameState.boardState[toRow][toCol] = piece;
    window.gameState.boardState[fromRow][fromCol] = "";

    // Update king position and health entries
    const oldKingKey = `${fromRow}-${fromCol}`;
    const newKingKey = `${toRow}-${toCol}`;
    if (window.gameState.pieceHealth[oldKingKey]) {
      window.gameState.pieceHealth[newKingKey] = window.gameState.pieceHealth[oldKingKey];
      delete window.gameState.pieceHealth[oldKingKey];
    }

    // Move rook
    const isWhite = piece === "♔";
    const rookRow = isWhite ? 7 : 0;
    const rook = isWhite ? "♖" : "♜";

    if (toCol === fromCol + 2) {
      // Kingside castling - rook moves from h-file to f-file
      const rookFromCol = 7;
      const rookToCol = 5;
      window.gameState.boardState[rookRow][rookToCol] = rook;
      window.gameState.boardState[rookRow][rookFromCol] = "";

      const oldRookKey = `${rookRow}-${rookFromCol}`;
      const newRookKey = `${rookRow}-${rookToCol}`;
      if (window.gameState.pieceHealth[oldRookKey]) {
        window.gameState.pieceHealth[newRookKey] = window.gameState.pieceHealth[oldRookKey];
        delete window.gameState.pieceHealth[oldRookKey];
      }
    } else if (toCol === fromCol - 2) {
      // Queenside castling - rook moves from a-file to d-file
      const rookFromCol = 0;
      const rookToCol = 3;
      window.gameState.boardState[rookRow][rookToCol] = rook;
      window.gameState.boardState[rookRow][rookFromCol] = "";

      const oldRookKey = `${rookRow}-${rookFromCol}`;
      const newRookKey = `${rookRow}-${rookToCol}`;
      if (window.gameState.pieceHealth[oldRookKey]) {
        window.gameState.pieceHealth[newRookKey] = window.gameState.pieceHealth[oldRookKey];
        delete window.gameState.pieceHealth[oldRookKey];
      }
    }

    if (piece === "♔") window.gameState.whiteKingPos = [toRow, toCol];
    if (piece === "♚") window.gameState.blackKingPos = [toRow, toCol];

    window.gameState.moveLog.push(`Castling: ${piece} moves to ${window.gameState.positionToNotation(toRow, toCol)}`);
  }

  // === PIECE MOVEMENT LOGIC ===
  // Helper: robust checks for whether a piece at a square is alive and whether it's an enemy
  function isPieceAlive(r, c) {
    if (!window.gameState || !window.gameState.pieceHealth) return false;
    const h = window.gameState.pieceHealth[`${r}-${c}`];
    return !!(h && h.current > 0);
  }

  function isEnemyAt(r, c, isWhite) {
    if (!window.gameState || !window.gameState.boardState) return false;
    const piece = window.gameState.boardState[r] ? window.gameState.boardState[r][c] : null;
    if (!piece) return false;
    if (!isPieceAlive(r, c)) return false;
    return isWhite ? blackPieces.includes(piece) : whitePieces.includes(piece);
  }

  function getValidQueenMoves(row, col, piece) {
    const moves = [];
    const isWhite = whitePieces.includes(piece);
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
      let r = row + dr,
        c = col + dc;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = window.gameState.boardState[r][c];
        // If there's a piece but it's missing health or dead, treat it as empty (skip)
        if (target && !isPieceAlive(r, c)) {
          r += dr;
          c += dc;
          continue;
        }
        if (!target) {
          moves.push([r, c]);
        } else {
          if (isEnemyAt(r, c, isWhite)) {
            moves.push([r, c]);
          }
          break;
        }
        r += dr;
        c += dc;
      }
    });
    return moves;
  }

  function getValidKingMoves(row, col, piece) {
    const moves = [];
    const isWhite = whitePieces.includes(piece);
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
        if (!target || (isWhite ? blackPieces.includes(target) : whitePieces.includes(target))) {
          moves.push([r, c]);
        }
      }
    });
    return moves;
  }

  function getValidRookMoves(row, col, piece) {
    const moves = [];
    const isWhite = whitePieces.includes(piece);
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
        if (target && !isPieceAlive(r, c)) {
          r += dr;
          c += dc;
          continue;
        }
        if (!target) {
          moves.push([r, c]);
        } else {
          if (isEnemyAt(r, c, isWhite)) {
            moves.push([r, c]);
          }
          break;
        }
        r += dr;
        c += dc;
      }
    });
    return moves;
  }

  function getValidBishopMoves(row, col, piece) {
    const moves = [];
    const isWhite = whitePieces.includes(piece);
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
        if (target && !isPieceAlive(r, c)) {
          r += dr;
          c += dc;
          continue;
        }
        if (!target) {
          moves.push([r, c]);
        } else {
          if (isEnemyAt(r, c, isWhite)) {
            moves.push([r, c]);
          }
          break;
        }
        r += dr;
        c += dc;
      }
    });
    return moves;
  }

  function getValidKnightMoves(row, col, piece) {
    const moves = [];
    const isWhite = whitePieces.includes(piece);
    const jumps = [
      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],
      [1, 2],
      [1, -2],
      [-1, 2],
      [-1, -2],
    ];

    jumps.forEach(([dr, dc]) => {
      const r = row + dr,
        c = col + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = window.gameState.boardState[r][c];
        if (!target) {
          moves.push([r, c]);
        } else if (!isPieceAlive(r, c)) {
          // dead/orphaned piece: treat as empty square (allow landing)
          moves.push([r, c]);
        } else if (isEnemyAt(r, c, isWhite)) {
          moves.push([r, c]);
        }
      }
    });
    return moves;
  }

  function getValidPawnMoves(row, col, piece) {
    const moves = [];
    const isWhite = whitePieces.includes(piece);
    const direction = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;

    // Forward move
    const forwardRow = row + direction;
    // Forward square allowed if empty or contains a dead/orphaned piece
    if (forwardRow >= 0 && forwardRow < 8) {
      const forwardPiece = window.gameState.boardState[forwardRow][col];
      if (!forwardPiece || !isPieceAlive(forwardRow, col)) {
        moves.push([forwardRow, col]);
        // Double move from start
        const doubleRow = row + 2 * direction;
        if (row === startRow && doubleRow >= 0 && doubleRow < 8) {
          const doublePiece = window.gameState.boardState[doubleRow][col];
          if (!doublePiece || !isPieceAlive(doubleRow, col)) {
            moves.push([doubleRow, col]);
          }
        }
      }
    }

    // Captures
    const captureCols = [col - 1, col + 1];
    captureCols.forEach((captureCol) => {
      if (captureCol >= 0 && captureCol < 8) {
        if (isEnemyAt(row + direction, captureCol, isWhite)) {
          moves.push([row + direction, captureCol]);
        }
      }
    });

    return moves;
  }

  function isValidMove(fromRow, fromCol, toRow, toCol, piece, isWhiteTurn) {
    const isWhitePiece = whitePieces.includes(piece);
    if ((isWhiteTurn && !isWhitePiece) || (!isWhiteTurn && isWhitePiece)) return false;

    let validMoves;
    if (piece === "♕" || piece === "♛") {
      validMoves = getValidQueenMoves(fromRow, fromCol, piece);
    } else if (piece === "♔" || piece === "♚") {
      validMoves = getValidKingMoves(fromRow, fromCol, piece);
    } else if (piece === "♖" || piece === "♜") {
      validMoves = getValidRookMoves(fromRow, fromCol, piece);
    } else if (piece === "♗" || piece === "♝") {
      validMoves = getValidBishopMoves(fromRow, fromCol, piece);
    } else if (piece === "♘" || piece === "♞") {
      validMoves = getValidKnightMoves(fromRow, fromCol, piece);
    } else if (piece === "♙" || piece === "♟") {
      validMoves = getValidPawnMoves(fromRow, fromCol, piece);
    } else {
      return false;
    }

    return validMoves.some(([r, c]) => r === toRow && c === toCol);
  }

  // Handle square click
  let selectedPiece = null;
  function handleSquareClick(square) {
    // CRITICAL: Clean up dead pieces at the start to prevent blocked moves
    if (window.gameState && window.gameState.pruneDeadPieces) {
      window.gameState.pruneDeadPieces();
    }

    // Intercept multi-step skill selections (if any)
    try {
      const pending = window.skillSystem && window.skillSystem.pending ? window.skillSystem.pending : null;
      if (pending) {
        const pid = pending.id;
        // gather click coords
        const rowClicked = parseInt(square.dataset.row);
        const colClicked = parseInt(square.dataset.col);
        const icon = square.querySelector(".piece-icon");
        const clickedPiece = icon ? icon.textContent : "";

        // AZW Attack: select friendly piece then choose direction
        if (pid === "azw_attack") {
          if (pending.step === 0) {
            const isWhitePiece = ["♔", "♕", "♖", "♗", "♘", "♙"].includes(clickedPiece);
            const isOwnerWhite = pending.player === "white";
            if (!clickedPiece || (isOwnerWhite && !isWhitePiece) || (!isOwnerWhite && isWhitePiece)) {
              alert("Select a friendly piece to push.");
              return;
            }
            pending.step = 1;
            pending.data.selected = { r: rowClicked, c: colClicked, piece: clickedPiece };
            // Ask direction
            const dir = prompt("Choose direction: straight, diag-left, diag-right");
            if (!dir) {
              window.skillSystem.pending = null;
              return;
            }
            const d = dir.toLowerCase().trim();
            const sign = pending.player === "white" ? -1 : 1;
            let dr = 0;
            let dc = 0;
            if (d === "straight") {
              dr = sign * 2;
              dc = 0;
            } else if (d === "diag-left") {
              dr = sign * 2;
              dc = -2;
            } else if (d === "diag-right") {
              dr = sign * 2;
              dc = 2;
            } else {
              alert("Invalid direction. Use straight, diag-left or diag-right.");
              window.skillSystem.pending = null;
              return;
            }

            const sel = pending.data.selected;
            const targetR = sel.r + dr;
            const targetC = sel.c + dc;
            // bounds check
            if (targetR < 0 || targetR > 7 || targetC < 0 || targetC > 7) {
              alert("Target out of board. Skill cancelled.");
              window.skillSystem.pending = null;
              return;
            }
            // cannot move into occupied square
            if (window.gameState.boardState[targetR][targetC]) {
              alert("Cannot push into an occupied square. Skill cancelled.");
              window.skillSystem.pending = null;
              return;
            }

            // Check intermediate square for straight (must be empty)
            if (Math.abs(dr) === 2 && dc === 0) {
              const midR = sel.r + sign * 1;
              if (window.gameState.boardState[midR][sel.c]) {
                alert("Path blocked. Skill cancelled.");
                window.skillSystem.pending = null;
                return;
              }
            }

            // Perform move
            window.gameState.boardState[targetR][targetC] = sel.piece;
            window.gameState.boardState[sel.r][sel.c] = "";
            // update health mapping
            const oldKey = `${sel.r}-${sel.c}`;
            const newKey = `${targetR}-${targetC}`;
            if (window.gameState.pieceHealth[oldKey]) {
              window.gameState.pieceHealth[newKey] = window.gameState.pieceHealth[oldKey];
              delete window.gameState.pieceHealth[oldKey];
            }
            // update king pos if needed
            if (sel.piece === "♔") window.gameState.whiteKingPos = [targetR, targetC];
            if (sel.piece === "♚") window.gameState.blackKingPos = [targetR, targetC];

            window.gameState.moveLog.push(
              `Skill ${pending.id}: moved ${sel.piece} ${window.gameState.positionToNotation(
                sel.r,
                sel.c
              )} -> ${window.gameState.positionToNotation(targetR, targetC)}`
            );
            window.skillSystem.pending = null;
            syncBoardStateWithDOM();
            if (window.updateAllHealthBars) window.updateAllHealthBars();
            if (window.gameState && window.gameState.pruneDeadPieces) window.gameState.pruneDeadPieces();
            return;
          }
        }

        // AZW Sand Rage: choose two enemy pieces to swap
        if (pid === "azw_sand_rage") {
          const isWhiteOwner = pending.player === "white";
          const isClickedEnemy =
            clickedPiece &&
            ((isWhiteOwner && ["♚", "♛", "♜", "♝", "♞", "♟"].includes(clickedPiece)) ||
              (!isWhiteOwner && ["♔", "♕", "♖", "♗", "♘", "♙"].includes(clickedPiece)));
          if (!isClickedEnemy) {
            alert("Select an enemy piece.");
            return;
          }
          pending.data.picks.push({ r: rowClicked, c: colClicked, piece: clickedPiece });
          if (pending.data.picks.length < 2) {
            alert("Select the second enemy piece to swap.");
            return;
          }
          const a = pending.data.picks[0];
          const b = pending.data.picks[1];
          // check same row/col/diag
          const sameRow = a.r === b.r;
          const sameCol = a.c === b.c;
          const sameDiag = Math.abs(a.r - b.r) === Math.abs(a.c - b.c);
          if (!(sameRow || sameCol || sameDiag)) {
            alert("Selected pieces must be on the same row, column, or diagonal. Skill cancelled.");
            window.skillSystem.pending = null;
            return;
          }

          // Swap pieces and health
          const pa = window.gameState.boardState[a.r][a.c];
          const pb = window.gameState.boardState[b.r][b.c];
          window.gameState.boardState[a.r][a.c] = pb;
          window.gameState.boardState[b.r][b.c] = pa;
          const keyA = `${a.r}-${a.c}`;
          const keyB = `${b.r}-${b.c}`;
          const ha = window.gameState.pieceHealth[keyA];
          const hb = window.gameState.pieceHealth[keyB];
          if (ha || hb) {
            window.gameState.pieceHealth[keyA] = hb || { current: 1.0, max: 1.0 };
            window.gameState.pieceHealth[keyB] = ha || { current: 1.0, max: 1.0 };
          }

          // Damage both swapped pieces and any other enemy pieces on the same line
          function damageLine(r1, c1, r2, c2) {
            const dr = Math.sign(r2 - r1);
            const dc = Math.sign(c2 - c1);
            let r = r1;
            let c = c1;
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
              const key = `${r}-${c}`;
              const p = window.gameState.boardState[r][c];
              if (p) {
                // only damage enemy pieces (opposite of owner)
                const isWhiteP = ["♔", "♕", "♖", "♗", "♘", "♙"].includes(p);
                if ((pending.player === "white" && !isWhiteP) || (pending.player === "black" && isWhiteP)) {
                  if (window.gameState.applyDamage) window.gameState.applyDamage(r, c, 0.25, "skill", null);
                }
              }
              if (r === r2 && c === c2) break;
              r += dr;
              c += dc;
            }
          }

          // determine line endpoints
          damageLine(a.r, a.c, b.r, b.c);

          window.gameState.moveLog.push(
            `Skill ${pending.id}: swapped ${pa} and ${pb} at ${window.gameState.positionToNotation(
              a.r,
              a.c
            )} <-> ${window.gameState.positionToNotation(b.r, b.c)}`
          );
          window.skillSystem.pending = null;
          syncBoardStateWithDOM();
          if (window.updateAllHealthBars) window.updateAllHealthBars();
          if (window.gameState && window.gameState.pruneDeadPieces) window.gameState.pruneDeadPieces();
          return;
        }
      }
    } catch (e) {
      // swallow and continue to normal click handling
      console.error(e);
    }

    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    const icon = square.querySelector(".piece-icon");
    const piece = icon ? icon.textContent : "";

    if (selectedPiece) {
      const fromRow = parseInt(selectedPiece.dataset.row);
      const fromCol = parseInt(selectedPiece.dataset.col);
      const fromIcon = selectedPiece.querySelector(".piece-icon");
      const movingPiece = fromIcon ? fromIcon.textContent : "";

      const isWhiteTurn = window.gameState.timers.currentPlayer === "white";

      // Check for castling move
      if (isCastlingMove(fromRow, fromCol, row, col, movingPiece)) {
        executeCastling(fromRow, fromCol, row, col);

        selectedPiece.classList.remove("selected");
        selectedPiece = null;

        window.gameState.logMove([fromRow, fromCol], [row, col], movingPiece, false);
        syncBoardStateWithDOM();
        updateAllHealthBars();
        switchPlayer();
        window.battleSystem.checkVictory();

        if (window.gameState.timers.currentPlayer === "black") {
          setTimeout(() => window.aiSystem.makeMove(), 600);
        }

        if (window.saveGameAuto) setTimeout(window.saveGameAuto, 100);
        return;
      }

      // Sandstorm restrictions: prevent movement for affected piece types
      try {
        const sandEffects =
          window.gameState && window.gameState.activeEffects
            ? window.gameState.activeEffects.filter((e) => e.effect === "sandstorm" || e.name === "Sandstorm")
            : [];
        if (sandEffects && sandEffects.length > 0) {
          // If the piece is on any sandstorm row, restrict movement
          const keyFrom = `${fromRow}-${fromCol}`;
          const pieceType = movingPiece;
          const isPawnOrKingOrKnight = ["♙", "♟", "♔", "♚", "♘", "♞"].includes(pieceType);
          let affected = false;
          sandEffects.forEach((ef) => {
            if (ef.rows && ef.rows.includes(fromRow)) affected = true;
          });
          if (affected && isPawnOrKingOrKnight) {
            alert("This piece cannot move while in the sandstorm.");
            selectedPiece.classList.remove("selected");
            selectedPiece = null;
            return;
          }
        }
      } catch (e) {}

      if (isValidMove(fromRow, fromCol, row, col, movingPiece, isWhiteTurn)) {
        const captured = piece !== "";
        let defeatPieceSurvived = false;

        // Handle capture using centralized applyDamage (awards EP to attacker)
        const attacker = isWhiteTurn ? "white" : "black";

        // Mark last combat for visuals (attacker/defender keys)
        if (window.gameState) {
          // clear previous timer
          if (window.gameState._lastCombatTimer) {
            clearTimeout(window.gameState._lastCombatTimer);
            window.gameState._lastCombatTimer = null;
          }
          window.gameState.lastCombat = {
            attacker: `${fromRow}-${fromCol}`,
            defender: `${row}-${col}`,
          };
          // Clear markers after 3 seconds
          window.gameState._lastCombatTimer = setTimeout(() => {
            if (window.gameState) window.gameState.lastCombat = { attacker: null, defender: null };
            window.gameState._lastCombatTimer = null;
            if (window.syncBoardStateWithDOM) window.syncBoardStateWithDOM();
          }, 3000);
        }
        if (captured && window.gameState && window.gameState.applyDamage) {
          // applyDamage returns true if the target died
          const died = window.gameState.applyDamage(row, col, 1, "capture", attacker);
          // If it died, attacker can move to that square; if not, attacker should return to origin
          defeatPieceSurvived = !died;
        }

        // Determine where attacking piece moves
        let finalRow = row;
        let finalCol = col;

        if (captured && defeatPieceSurvived) {
          // If defeated piece survived, attacker returns to origin
          finalRow = fromRow;
          finalCol = fromCol;
        }
        // If defeated piece died, attacker moves to target square (already set)

        // Move piece in state only if final position differs from origin
        if (finalRow !== fromRow || finalCol !== fromCol) {
          window.gameState.boardState[finalRow][finalCol] = movingPiece;
          window.gameState.boardState[fromRow][fromCol] = "";

          // Update king position
          if (movingPiece === "♔") window.gameState.whiteKingPos = [finalRow, finalCol];
          else if (movingPiece === "♚") window.gameState.blackKingPos = [finalRow, finalCol];

          // Update health key mapping
          const oldKey = `${fromRow}-${fromCol}`;
          const newKey = `${finalRow}-${finalCol}`;
          if (window.gameState.pieceHealth[oldKey]) {
            window.gameState.pieceHealth[newKey] = window.gameState.pieceHealth[oldKey];
            delete window.gameState.pieceHealth[oldKey];
          }

          // If this was an attack (capture) mark the attacker as having attacked
          try {
            if (captured && window.gameState && window.gameState.markAttacked) {
              const attackerColor = isWhiteTurn ? "white" : "black";
              window.gameState.markAttacked(attackerColor, `${finalRow}-${finalCol}`);
            }
          } catch (e) {}

          // Energy tile (only if actually moved to that square)
          if (window.gameState.isEnergyTile(finalRow, finalCol)) {
            window.gameState.addEnergy(isWhiteTurn ? "white" : "black", 1);
          }
        } else {
          // Stayed in place: no board/health changes needed
        }

        selectedPiece.classList.remove("selected");
        selectedPiece = null;

        // Log move
        window.gameState.logMove([fromRow, fromCol], [finalRow, finalCol], movingPiece, captured);

        // Check for pawn promotion
        checkPawnPromotion(finalRow, finalCol, movingPiece, isWhiteTurn);

        // Update DOM - CRITICAL: Force complete re-render
        syncBoardStateWithDOM();
        updateAllHealthBars();

        // Ensure any pieces reduced to 0 are cleaned up before switching player
        if (window.gameState && window.gameState.pruneDeadPieces) window.gameState.pruneDeadPieces();

        // If moved piece was in sandstorm and is a sliding piece (rook/bishop/queen), move it back 1 square
        try {
          const sandEffects2 =
            window.gameState && window.gameState.activeEffects
              ? window.gameState.activeEffects.filter((e) => e.effect === "sandstorm" || e.name === "Sandstorm")
              : [];
          if (sandEffects2 && sandEffects2.length > 0) {
            const movedPiece = movingPiece;
            const isSlider = ["♕", "♛", "♖", "♜", "♗", "♝"].includes(movedPiece);
            if (isSlider) {
              // compute backward step vector from origin to final
              const dr = finalRow - fromRow;
              const dc = finalCol - fromCol;
              const backR = finalRow - Math.sign(dr);
              const backC = finalCol - Math.sign(dc);
              if (backR >= 0 && backR < 8 && backC >= 0 && backC < 8 && !window.gameState.boardState[backR][backC]) {
                // move back one
                window.gameState.boardState[backR][backC] = window.gameState.boardState[finalRow][finalCol];
                window.gameState.boardState[finalRow][finalCol] = "";
                // update health keys
                const oldKey2 = `${finalRow}-${finalCol}`;
                const newKey2 = `${backR}-${backC}`;
                if (window.gameState.pieceHealth[oldKey2]) {
                  window.gameState.pieceHealth[newKey2] = window.gameState.pieceHealth[oldKey2];
                  delete window.gameState.pieceHealth[oldKey2];
                }
                window.gameState.moveLog.push(
                  `Sandstorm backlash moved ${movedPiece} back to ${window.gameState.positionToNotation(backR, backC)}`
                );
              }
            }
          }
        } catch (e) {}

        // Switch player and process effects
        switchPlayer();
        window.battleSystem.checkVictory();

        // If it's enemy (black) turn now, trigger AI
        if (window.gameState.timers.currentPlayer === "black") {
          setTimeout(() => window.aiSystem.makeMove(), 600);
        }

        // Auto-save
        if (window.saveGameAuto) setTimeout(window.saveGameAuto, 100);
      } else {
        alert("Invalid move or not your turn!");
        selectedPiece.classList.remove("selected");
        selectedPiece = null;
      }
    } else if (piece !== "") {
      const isWhitePiece = whitePieces.includes(piece);
      const isWhiteTurn = window.gameState.timers.currentPlayer === "white";

      if ((isWhiteTurn && isWhitePiece) || (!isWhiteTurn && !isWhitePiece)) {
        selectedPiece = square;
        square.classList.add("selected");
      } else {
        alert("Not your turn!");
      }
    }
  }

  // Sync board state with DOM - FIXED VERSION
  function syncBoardStateWithDOM() {
    const squares = document.querySelectorAll(".chess-square");

    // Remove any lingering tooltip when rebuilding
    removeSkillTooltip();

    // CRITICAL FIX: Clean up dead pieces BEFORE syncing
    if (window.gameState && window.gameState.pruneDeadPieces) {
      window.gameState.pruneDeadPieces();
    }

    squares.forEach((square) => {
      const row = parseInt(square.dataset.row);
      const col = parseInt(square.dataset.col);
      const piece = window.gameState.boardState[row][col];

      // If board has a piece but there is no health entry or health is zero,
      // treat it as dead/orphaned and clear it so it doesn't block movement.
      const key = `${row}-${col}`;
      const healthData = window.gameState.pieceHealth ? window.gameState.pieceHealth[key] : null;
      if (piece && (!healthData || healthData.current <= 0)) {
        // cleanup state and continue (render as empty)
        try {
          window.gameState.boardState[row][col] = "";
          if (window.gameState.pieceHealth && window.gameState.pieceHealth[key])
            delete window.gameState.pieceHealth[key];
        } catch (e) {}
        square.innerHTML = "";
        square.classList.remove("energy-tile");
        square.classList.remove("selected");
        // ensure no listeners flag remains so listeners can be reattached later
        if (square.dataset.pieceListenersAttached) delete square.dataset.pieceListenersAttached;
        return;
      }

      // Preserve or toggle energy tile class
      if (window.gameState.isEnergyTile(row, col)) {
        square.classList.add("energy-tile");
      } else {
        square.classList.remove("energy-tile");
      }

      // CRITICAL FIX: Always clear and rebuild content
      if (piece && piece !== "") {
        const isWhitePiece = whitePieces.includes(piece);
        square.innerHTML = `
          <div class="piece-stack" data-piece="${piece}">
            <span class="piece-icon">${piece}</span>
            <div class="blood"></div>
            <div class="health-bar-container">
              <div class="health-bar"></div>
            </div>
          </div>
        `;
        const icon = square.querySelector(".piece-icon");
        icon.style.color = isWhitePiece ? "#fff" : "#000";

        // Apply recent combat marker classes if applicable
        try {
          const key = `${row}-${col}`;
          const lc = window.gameState && window.gameState.lastCombat ? window.gameState.lastCombat : null;
          const stack = square.querySelector(".piece-stack");
          if (lc && stack) {
            if (lc.attacker === key || lc.defender === key) {
              // mark based on side: white -> yellow, black -> red
              if (whitePieces.includes(piece)) {
                stack.classList.add("recent-combat-white");
              } else {
                stack.classList.add("recent-combat-black");
              }
            }
          }
        } catch (e) {}

        // Persistent attacked highlight: if this piece has attacked during the match,
        // show a colored outline until end of match.
        try {
          const key2 = `${row}-${col}`;
          const attacked = window.gameState && window.gameState.attackedPieces ? window.gameState.attackedPieces : null;
          const stack2 = square.querySelector(".piece-stack");
          if (attacked && stack2) {
            if (attacked.white && attacked.white[key2]) stack2.classList.add("attacked-white");
            if (attacked.black && attacked.black[key2]) stack2.classList.add("attacked-black");
          }
        } catch (e) {}

        // Visual effects from activeEffects (shield, on-fire, sandstorm)
        try {
          const effects = window.gameState && window.gameState.activeEffects ? window.gameState.activeEffects : [];
          const stack3 = square.querySelector(".piece-stack");
          if (stack3) {
            // remove any previous classes (fresh render)
            stack3.classList.remove("shielded", "on-fire", "sandstorm-affected");

            effects.forEach((effect) => {
              try {
                if (effect.effect === "damage_reduction") {
                  // team-wide shield; apply to friendly pieces of owner
                  if (
                    (effect.owner === "white" && whitePieces.includes(piece)) ||
                    (effect.owner === "black" && blackPieces.includes(piece))
                  ) {
                    stack3.classList.add("shielded");
                  }
                }

                if (effect.effect === "damage_increase") {
                  if (
                    (effect.owner === "white" && whitePieces.includes(piece)) ||
                    (effect.owner === "black" && blackPieces.includes(piece))
                  ) {
                    stack3.classList.add("on-fire");
                  }
                }

                if (effect.name === "Sandstorm" && effect.rows && effect.rows.includes(row)) {
                  // any piece on sandstorm rows is visually affected
                  stack3.classList.add("sandstorm-affected");
                }
              } catch (e) {}
            });
          }
        } catch (e) {}

        // Attach hover handlers to show piece skill tooltip after ~1s
        // Avoid attaching duplicate listeners on repeated syncs by marking the square.
        if (!square.dataset.pieceListenersAttached) {
          let hoverTimer = null;
          const onEnter = function onEnter() {
            if (_tooltipHideTimer) clearTimeout(_tooltipHideTimer);
            _tooltipHideTimer = null;
            hoverTimer = setTimeout(() => {
              const key = `${row}-${col}`;
              const skillId =
                window.gameState && window.gameState.pieceSkills ? window.gameState.pieceSkills[key] : null;
              if (skillId && window.skillSystem) {
                const skill = window.skillSystem.getSkill(skillId);
                showSkillTooltip(row, col, square, skillId, skill);
              }
            }, 1000);
          };

          const onLeave = function onLeave() {
            if (hoverTimer) clearTimeout(hoverTimer);
            if (_tooltipHideTimer) clearTimeout(_tooltipHideTimer);
            _tooltipHideTimer = setTimeout(() => {
              removeSkillTooltip();
              _tooltipHideTimer = null;
            }, 500);
          };

          square.addEventListener("mouseenter", onEnter);
          square.addEventListener("mouseleave", onLeave);
          // remember we attached listeners so we don't add them again
          square.dataset.pieceListenersAttached = "1";
        }
      } else {
        // CRITICAL FIX: Completely clear empty squares and reset any visual state
        // Remove any tooltip listeners flag so when a piece later appears
        // listeners can be attached fresh if needed.
        if (square.dataset.pieceListenersAttached) {
          delete square.dataset.pieceListenersAttached;
        }

        square.innerHTML = "";
        square.classList.remove("selected");
        square.classList.remove("energy-tile");
      }
    });

    // Ensure piece-skill mapping matches current board
    if (window.gameState && window.gameState.assignPieceSkills) {
      window.gameState.assignPieceSkills();
    }

    // Update all health bars after sync
    updateAllHealthBars();
  }

  // Tooltip helpers with persistence and auto-hide timer
  let _currentSkillTooltip = null;
  let _tooltipHideTimer = null;

  function showSkillTooltip(row, col, square, skillId, skill) {
    // Clear any pending hide timer
    if (_tooltipHideTimer) clearTimeout(_tooltipHideTimer);

    removeSkillTooltip();
    if (!skill) return;
    const rect = square.getBoundingClientRect();
    const tip = document.createElement("div");
    tip.className = "piece-skill-tooltip";
    tip.style.position = "fixed";
    tip.style.left = `${rect.right + 8}px`;
    tip.style.top = `${rect.top}px`;
    tip.style.background = "rgba(0,0,0,0.85)";
    tip.style.border = "1px solid #444";
    tip.style.padding = "8px";
    tip.style.zIndex = 9999;
    tip.style.color = "#fff";
    tip.style.maxWidth = "260px";
    tip.innerHTML = `<strong style="display:block;margin-bottom:6px">${skill.name}</strong>
      <div style="font-size:12px;margin-bottom:8px">${skill.description}</div>`;

    // Activation button (only for player side if enough EP)
    const btn = document.createElement("button");
    btn.textContent = `Use (${skill.cost} EP)`;
    btn.style.display = "inline-block";
    btn.style.padding = "6px 8px";
    btn.style.cursor = "pointer";
    btn.style.marginTop = "4px";
    btn.onclick = (e) => {
      e.stopPropagation();
      // assume white player uses tooltip button
      if (window.gameState && window.gameState.usePieceSkill) {
        const ok = window.gameState.usePieceSkill(row, col, "white");
        if (ok) removeSkillTooltip();
      }
    };

    // Gray out button if not enough EP
    if (!window.gameState || window.gameState.energy.white < (skill.cost || 0)) {
      btn.disabled = true;
      btn.style.opacity = "0.5";
    }

    tip.appendChild(btn);
    document.body.appendChild(tip);
    _currentSkillTooltip = tip;

    // Persist tooltip when hovering over it; hide after 3s of inactivity
    tip.addEventListener("mouseenter", () => {
      if (_tooltipHideTimer) clearTimeout(_tooltipHideTimer);
    });

    tip.addEventListener("mouseleave", () => {
      // Start 3 second timer to hide tooltip
      _tooltipHideTimer = setTimeout(() => {
        removeSkillTooltip();
        _tooltipHideTimer = null;
      }, 3000);
    });

    // Initial 3s inactivity timer
    _tooltipHideTimer = setTimeout(() => {
      removeSkillTooltip();
      _tooltipHideTimer = null;
    }, 3000);
  }

  function removeSkillTooltip() {
    if (_tooltipHideTimer) clearTimeout(_tooltipHideTimer);
    if (_currentSkillTooltip) {
      _currentSkillTooltip.remove();
      _currentSkillTooltip = null;
    }
  }

  // Update all health bars
  function updateAllHealthBars() {
    const squares = document.querySelectorAll(".chess-square");
    squares.forEach((square) => {
      const row = parseInt(square.dataset.row);
      const col = parseInt(square.dataset.col);
      const key = `${row}-${col}`;
      const healthData = window.gameState.pieceHealth[key];
      const healthBar = square.querySelector(".health-bar");
      const blood = square.querySelector(".blood");

      if (healthData && healthBar) {
        const percentage = (healthData.current / healthData.max) * 100;
        healthBar.style.width = percentage + "%";

        if (percentage > 66) healthBar.style.backgroundColor = "#4CAF50";
        else if (percentage > 33) healthBar.style.backgroundColor = "#FFC107";
        else healthBar.style.backgroundColor = "#F44336";

        // Blood overlay: more blood when lower health
        if (blood) {
          const bloodOpacity = Math.min(1, Math.max(0, 1 - healthData.current / healthData.max));
          blood.style.opacity = bloodOpacity;
        }
      }
    });
  }

  // Switch player and timer
  function switchPlayer() {
    window.gameState.timers.currentPlayer = window.gameState.timers.currentPlayer === "white" ? "black" : "white";
    window.gameState.incrementTurn();
    window.gameState.processTurnEffects();
  }

  // Init timers
  function initTimers() {
    clearInterval(window.gameState.timers.interval);
    window.gameState.timers.interval = setInterval(() => {
      if (!window.gameState.timers.isPaused) {
        const player = window.gameState.timers.currentPlayer;
        window.gameState.timers[player]--;
        updateTimerDisplay();
        if (window.gameState.timers[player] <= 0) {
          alert(`${player.toUpperCase()} time out!`);
          window.battleSystem.endBattle(player === "black");
        }
      }
    }, 1000);
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    document.getElementById("player-timer").textContent = formatTime(window.gameState.timers.white);
    document.getElementById("opponent-timer").textContent = formatTime(window.gameState.timers.black);
  }

  function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  }

  function createFlyingPiece() {
    const piece = document.createElement("div");
    piece.className = "chess-piece";
    piece.textContent = pieces[Math.floor(Math.random() * pieces.length)];

    const rect = notification?.getBoundingClientRect();
    if (!rect) return;

    const startX = rect.left + Math.random() * rect.width;
    const startY = rect.top + Math.random() * rect.height;
    const angle = Math.random() * Math.PI * 2;
    const distance = 200 + Math.random() * 300;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    piece.style.left = `${startX}px`;
    piece.style.top = `${startY}px`;
    piece.style.setProperty("--tx", `${tx}px`);
    piece.style.setProperty("--ty", `${ty}px`);
    piece.style.color = `hsl(${Math.random() * 360}, 70%, 50%)`;

    container?.appendChild(piece);
    setTimeout(() => piece.remove(), 3000);
  }

  // Expose move validators to global so AI can use them
  window.getValidQueenMoves = getValidQueenMoves;
  window.getValidKingMoves = getValidKingMoves;
  window.getValidRookMoves = getValidRookMoves;
  window.getValidBishopMoves = getValidBishopMoves;
  window.getValidKnightMoves = getValidKnightMoves;
  window.getValidPawnMoves = getValidPawnMoves;
  window.isValidMove = isValidMove;
  window.switchPlayer = switchPlayer;
});
