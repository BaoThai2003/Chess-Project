document.addEventListener("DOMContentLoaded", function () {
  const notification = document.querySelector(".notification");
  const container = document.getElementById("chess-pieces-container");
  const goButton = document.getElementById("go-button");
  const pieces = ["♔", "♕", "♖", "♗", "♘", "♙", "♚", "♛", "♜", "♝", "♞", "♟"];

  // Chess piece arrays
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

    // Default colors
    let whiteSquareColor = "#f0d9b5";
    let blackSquareColor = "#b58863";
    let whitePieceColor = "#ffffff";
    let blackPieceColor = "#000000";

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

    // Setup Purge button
    setupPurgeButton();
  }

  // === SPECIAL BATTLE ACTIONS ===
  function setupPurgeButton() {
    const purgeBtn = document.getElementById("purge-btn");
    if (purgeBtn) {
      purgeBtn.addEventListener("click", executePurge);
    }
  }

  function executePurge() {
    if (!window.gameState || !window.gameState.boardState) return;

    let purgedCount = 0;
    const weakPieces = [];

    // Find all pieces with health < 0.25
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const key = `${row}-${col}`;
        const health = window.gameState.pieceHealth[key];
        if (health && health.current > 0 && health.current < 0.25) {
          weakPieces.push({ row, col, key, piece: window.gameState.boardState[row][col] });
        }
      }
    }

    // Deal 1 damage to each weak piece
    weakPieces.forEach(({ row, col, key, piece }) => {
      const died = window.gameState.applyDamage(row, col, 1, "purge", "white");
      if (died) {
        purgedCount++;
        window.gameState.moveLog.push(
          `Purge: ${piece} at ${window.gameState.positionToNotation(row, col)} eliminated!`
        );
      }
    });

    if (purgedCount > 0) {
      window.gameState.updateMoveLog();
      window.syncBoardStateWithDOM();
      window.updateAllHealthBars();
      alert(`Purge executed! ${purgedCount} weak piece(s) eliminated!`);
    } else {
      alert("No weak pieces found (health >= 0.25)!");
    }
  }

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
        if (!target) {
          moves.push([r, c]);
        } else {
          if (isWhite ? blackPieces.includes(target) : whitePieces.includes(target)) {
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
        if (!target) {
          moves.push([r, c]);
        } else {
          if (isWhite ? blackPieces.includes(target) : whitePieces.includes(target)) {
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
        if (!target) {
          moves.push([r, c]);
        } else {
          if (isWhite ? blackPieces.includes(target) : whitePieces.includes(target)) {
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
        if (!target || (isWhite ? blackPieces.includes(target) : whitePieces.includes(target))) {
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
    if (forwardRow >= 0 && forwardRow < 8 && !window.gameState.boardState[forwardRow][col]) {
      moves.push([forwardRow, col]);
      // Double move from start
      const doubleRow = row + 2 * direction;
      if (row === startRow && doubleRow >= 0 && doubleRow < 8 && !window.gameState.boardState[doubleRow][col]) {
        moves.push([doubleRow, col]);
      }
    }

    // Captures
    const captureCols = [col - 1, col + 1];
    captureCols.forEach((captureCol) => {
      if (captureCol >= 0 && captureCol < 8) {
        const target = window.gameState.boardState[row + direction][captureCol];
        if (target && (isWhite ? blackPieces.includes(target) : whitePieces.includes(target))) {
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

      if (isValidMove(fromRow, fromCol, row, col, movingPiece, isWhiteTurn)) {
        const captured = piece !== "";
        let defeatPieceSurvived = false;

        // Handle capture using centralized applyDamage (awards EP to attacker)
        const attacker = isWhiteTurn ? "white" : "black";
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

        // Update DOM
        syncBoardStateWithDOM();
        updateAllHealthBars();

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

  // Sync board state with DOM
  function syncBoardStateWithDOM() {
    const squares = document.querySelectorAll(".chess-square");
    // Remove any lingering tooltip when rebuilding
    removeSkillTooltip();
    // Cleanup any dead pieces left in gameState (in case health reached <= 0 without using applyDamage)
    if (window.gameState && window.gameState.pruneDeadPieces) window.gameState.pruneDeadPieces();

    squares.forEach((square) => {
      const row = parseInt(square.dataset.row);
      const col = parseInt(square.dataset.col);
      const piece = window.gameState.boardState[row][col];

      // Preserve or toggle energy tile class
      if (window.gameState.isEnergyTile(row, col)) square.classList.add("energy-tile");
      else square.classList.remove("energy-tile");

      if (piece) {
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

        // Attach hover handlers to show piece skill tooltip after ~1s
        let hoverTimer = null;
        square.addEventListener("mouseenter", function onEnter() {
          // clear any previous tooltip timers and prepare for display
          if (_tooltipHideTimer) clearTimeout(_tooltipHideTimer);
          _tooltipHideTimer = null;
          hoverTimer = setTimeout(() => {
            const key = `${row}-${col}`;
            const skillId = window.gameState && window.gameState.pieceSkills ? window.gameState.pieceSkills[key] : null;
            if (skillId && window.skillSystem) {
              const skill = window.skillSystem.getSkill(skillId);
              showSkillTooltip(row, col, square, skillId, skill);
            }
          }, 1000);
        });

        square.addEventListener("mouseleave", function onLeave() {
          if (hoverTimer) clearTimeout(hoverTimer);
          // Start hide timer when leaving piece (unless hovering tooltip)
          if (_tooltipHideTimer) clearTimeout(_tooltipHideTimer);
          _tooltipHideTimer = setTimeout(() => {
            removeSkillTooltip();
            _tooltipHideTimer = null;
          }, 500);
        });
      } else {
        // keep square empty but keep classes
        square.innerHTML = "";
      }
    });

    // Ensure piece-skill mapping matches current board
    if (window.gameState && window.gameState.assignPieceSkills) window.gameState.assignPieceSkills();

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
