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

        // Place piece
        const piece = initialPosition[row][col];
        if (piece) {
          square.innerHTML = `
            <span class="piece-icon">${piece}</span>
            <div class="health-bar-container">
              <div class="health-bar" style="width: 100%"></div>
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

    // Color controls
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
        const targetPiece = window.gameState.boardState[r][c];
        if (!targetPiece) {
          moves.push([r, c]);
        } else {
          if ((isWhite && blackPieces.includes(targetPiece)) || (!isWhite && whitePieces.includes(targetPiece))) {
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
        const targetPiece = window.gameState.boardState[r][c];
        if (
          !targetPiece ||
          (isWhite && blackPieces.includes(targetPiece)) ||
          (!isWhite && whitePieces.includes(targetPiece))
        ) {
          moves.push([r, c]);
        }
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
        const targetPiece = window.gameState.boardState[r][c];
        if (!targetPiece) {
          moves.push([r, c]);
        } else {
          if ((isWhite && blackPieces.includes(targetPiece)) || (!isWhite && whitePieces.includes(targetPiece))) {
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
        const targetPiece = window.gameState.boardState[r][c];
        if (!targetPiece) {
          moves.push([r, c]);
        } else {
          if ((isWhite && blackPieces.includes(targetPiece)) || (!isWhite && whitePieces.includes(targetPiece))) {
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

  function getValidPawnMoves(row, col, piece) {
    const moves = [];
    const isWhite = whitePieces.includes(piece);
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
        const targetPiece = window.gameState.boardState[r][c];
        if (
          targetPiece &&
          ((isWhite && blackPieces.includes(targetPiece)) || (!isWhite && whitePieces.includes(targetPiece)))
        ) {
          moves.push([r, c]);
        }
      }
    });

    return moves;
  }

  function getValidKnightMoves(row, col, piece) {
    const moves = [];
    const isWhite = whitePieces.includes(piece);
    const directions = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];

    directions.forEach(([dr, dc]) => {
      const r = row + dr,
        c = col + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const targetPiece = window.gameState.boardState[r][c];
        if (
          !targetPiece ||
          (isWhite && blackPieces.includes(targetPiece)) ||
          (!isWhite && whitePieces.includes(targetPiece))
        ) {
          moves.push([r, c]);
        }
      }
    });
    return moves;
  }

  function isKingInCheck(kingPos, boardState) {
    const [kingRow, kingCol] = kingPos;
    const isWhiteKing = boardState[kingRow][kingCol] === "♔";

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardState[row][col];
        if (piece && (isWhiteKing ? blackPieces.includes(piece) : whitePieces.includes(piece))) {
          let moves = [];
          if (piece === "♕" || piece === "♛") moves = getValidQueenMoves(row, col, piece);
          else if (piece === "♔" || piece === "♚") moves = getValidKingMoves(row, col, piece);
          else if (piece === "♗" || piece === "♝") moves = getValidBishopMoves(row, col, piece);
          else if (piece === "♖" || piece === "♜") moves = getValidRookMoves(row, col, piece);
          else if (piece === "♙" || piece === "♟") moves = getValidPawnMoves(row, col, piece);
          else if (piece === "♘" || piece === "♞") moves = getValidKnightMoves(row, col, piece);

          if (moves.some(([r, c]) => r === kingRow && c === kingCol)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function syncBoardStateWithDOM() {
    const squares = document.querySelectorAll(".chess-square");
    squares.forEach((square) => {
      const row = parseInt(square.dataset.row);
      const col = parseInt(square.dataset.col);
      const icon = square.querySelector(".piece-icon");
      window.gameState.boardState[row][col] = icon ? icon.textContent : "";
    });
  }

  function isValidMove(fromRow, fromCol, toRow, toCol, piece, isWhiteTurn) {
    const isWhitePiece = whitePieces.includes(piece);
    if (isWhiteTurn && !isWhitePiece) return false;
    if (!isWhiteTurn && isWhitePiece) return false;

    let validMoves = [];
    if (piece === "♕" || piece === "♛") validMoves = getValidQueenMoves(fromRow, fromCol, piece);
    else if (piece === "♔" || piece === "♚") validMoves = getValidKingMoves(fromRow, fromCol, piece);
    else if (piece === "♗" || piece === "♝") validMoves = getValidBishopMoves(fromRow, fromCol, piece);
    else if (piece === "♖" || piece === "♜") validMoves = getValidRookMoves(fromRow, fromCol, piece);
    else if (piece === "♙" || piece === "♟") validMoves = getValidPawnMoves(fromRow, fromCol, piece);
    else if (piece === "♘" || piece === "♞") validMoves = getValidKnightMoves(fromRow, fromCol, piece);
    else return false;

    const isMoveValid = validMoves.some(([r, c]) => r === toRow && c === toCol);
    if (!isMoveValid) return false;

    // Check if move puts own king in check
    const tempPiece = window.gameState.boardState[toRow][toCol];
    window.gameState.boardState[toRow][toCol] = piece;
    window.gameState.boardState[fromRow][fromCol] = "";

    const kingPos =
      piece === "♔" || piece === "♚"
        ? [toRow, toCol]
        : isWhitePiece
        ? window.gameState.whiteKingPos
        : window.gameState.blackKingPos;
    const kingInCheck = isKingInCheck(kingPos, window.gameState.boardState);

    window.gameState.boardState[fromRow][fromCol] = piece;
    window.gameState.boardState[toRow][toCol] = tempPiece;

    return !kingInCheck;
  }

  // === TIMER SYSTEM ===

  function initTimers() {
    updateTimerDisplay();
    startTimer();
  }

  function startTimer() {
    const timers = window.gameState.timers;
    if (timers.interval) clearInterval(timers.interval);

    timers.interval = setInterval(() => {
      if (!timers.isPaused) {
        timers[timers.currentPlayer]--;
        updateTimerDisplay();

        if (timers[timers.currentPlayer] <= 0) {
          clearInterval(timers.interval);
          alert(`${timers.currentPlayer === "white" ? "White" : "Black"} ran out of time!`);
        }
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const timers = window.gameState.timers;
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0");
      const secs = (seconds % 60).toString().padStart(2, "0");
      return `${mins}:${secs}`;
    };

    const whiteTimer = document.querySelector("#player-white .time");
    const blackTimer = document.querySelector("#player-black .time");

    if (whiteTimer) whiteTimer.textContent = formatTime(timers.white);
    if (blackTimer) blackTimer.textContent = formatTime(timers.black);

    document.getElementById(`player-${timers.currentPlayer}`)?.classList.add("active");
    document
      .getElementById(`player-${timers.currentPlayer === "white" ? "black" : "white"}`)
      ?.classList.remove("active");

    if (whiteTimer && timers.white < 60) whiteTimer.classList.add("time-critical");
    else if (whiteTimer) whiteTimer.classList.remove("time-critical");

    if (blackTimer && timers.black < 60) blackTimer.classList.add("time-critical");
    else if (blackTimer) blackTimer.classList.remove("time-critical");
  }

  function switchPlayer() {
    const timers = window.gameState.timers;
    timers.currentPlayer = timers.currentPlayer === "white" ? "black" : "white";
    window.gameState.incrementTurn();
    window.gameState.processTurnEffects();
    startTimer();
  }

  // === HANDLE SQUARE CLICK ===

  let selectedPiece = null;

  window.handleSquareClick = function (square) {
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

      if (isValidMove(fromRow, fromCol, row, col, movingPiece, isWhiteTurn)) {
        const captured = piece !== "";

        // Handle capture - deal 1 damage
        if (captured) {
          const targetKey = `${row}-${col}`;
          if (window.gameState.pieceHealth[targetKey]) {
            window.gameState.pieceHealth[targetKey].current -= 1;
            if (window.gameState.pieceHealth[targetKey].current <= 0) {
              // Piece eliminated
              delete window.gameState.pieceHealth[targetKey];
            }
          }
        }

        // Move piece
        window.gameState.boardState[row][col] = movingPiece;
        window.gameState.boardState[fromRow][fromCol] = "";

        // Update king position
        if (movingPiece === "♔") window.gameState.whiteKingPos = [row, col];
        else if (movingPiece === "♚") window.gameState.blackKingPos = [row, col];

        // Update health key
        const oldKey = `${fromRow}-${fromCol}`;
        const newKey = `${row}-${col}`;
        if (window.gameState.pieceHealth[oldKey]) {
          window.gameState.pieceHealth[newKey] = window.gameState.pieceHealth[oldKey];
          delete window.gameState.pieceHealth[oldKey];
        }

        // Check energy tile
        if (window.gameState.isEnergyTile(row, col)) {
          window.gameState.addEnergy(isWhiteTurn ? "white" : "black", 1);
        }

        // Update UI
        if (captured) {
          square.innerHTML = `
            <span class="piece-icon">${movingPiece}</span>
            <div class="health-bar-container">
              <div class="health-bar" style="width: 100%"></div>
            </div>
          `;
        } else {
          square.innerHTML = fromIcon.parentElement.innerHTML;
        }

        selectedPiece.innerHTML = "";
        selectedPiece.classList.remove("selected");
        selectedPiece = null;

        // Log move
        window.gameState.logMove([fromRow, fromCol], [row, col], movingPiece, captured);

        syncBoardStateWithDOM();
        updateAllHealthBars();
        switchPlayer();

        // Auto-save
        if (window.saveGameAuto) {
          setTimeout(window.saveGameAuto, 100);
        }
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
  };

  function handleSquareClick(square) {
    window.handleSquareClick(square);
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

      if (healthData && healthBar) {
        const percentage = (healthData.current / healthData.max) * 100;
        healthBar.style.width = percentage + "%";

        if (percentage > 66) healthBar.style.backgroundColor = "#4CAF50";
        else if (percentage > 33) healthBar.style.backgroundColor = "#FFC107";
        else healthBar.style.backgroundColor = "#F44336";
      }
    });
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
});
