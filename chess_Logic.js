document.addEventListener("DOMContentLoaded", function () {
  const notification = document.querySelector(".notification");
  const container = document.getElementById("chess-pieces-container");
  const goButton = document.getElementById("go-button");
  const notificationContainer = document.getElementById("notification-container");
  const pieces = ["♔", "♕", "♖", "♗", "♘", "♙", "♚", "♛", "♜", "♝", "♞", "♟"];

  // Hiệu ứng quân cờ bay khi hover
  notification.addEventListener("mouseenter", function () {
    for (let i = 0; i < 20; i++) {
      createFlyingPiece();
    }
  });

  // Ấn nút go
  goButton.addEventListener("click", function () {
    // Ẩn thông báo chào mừng
    notification.style.display = "none";

    // Hiển thị bàn cờ
    const boardContainer = document.getElementById("chess-board-container");
    boardContainer.style.display = "flex";

    // Tạo bàn cờ
    createChessBoard();
  });

  // Biến toàn cục cho timer
  let timers = {
    white: 600, // 10 phút = 600 giây
    black: 600,
    currentPlayer: "white", // Trắng đi trước
    interval: null,
    isPaused: false,
  };

  // Danh sách các quân cờ trắng
  const whitePieces = ["♔", "♕", "♖", "♗", "♘", "♙"];
  const blackPieces = ["♚", "♛", "♜", "♝", "♞", "♟"];

  // Cập nhật trạng thái bàn cờ
  let boardState = [];
  let whiteKingPos = [7, 4]; // Vị trí ban đầu của vua trắng
  let blackKingPos = [0, 4]; // Vị trí ban đầu của vua đen

  function createChessBoard() {
    const board = document.getElementById("chess-board");
    board.innerHTML = "";

    // Vị trí ban đầu các quân cờ
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

    boardState = initialPosition.map(row => [...row]);
    console.log("Initial boardState:", boardState); // Kiểm tra trạng thái ban đầu

    // Màu sắc mặc định
    let whiteSquareColor = "#f0d9b5";
    let blackSquareColor = "#b58863";
    let whitePieceColor = "#ffffff";
    let blackPieceColor = "#000000";

    // Tạo các ô cờ
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement("div");
        square.className = "chess-square";
        square.dataset.row = row;
        square.dataset.col = col;

        // Đặt màu ô cờ
        if ((row + col) % 2 === 0) {
          square.style.backgroundColor = whiteSquareColor;
        } else {
          square.style.backgroundColor = blackSquareColor;
        }

        // Đặt quân cờ nếu có
        const piece = initialPosition[row][col];
        if (piece) {
          square.textContent = piece;
          square.style.color = whitePieces.includes(piece) ? whitePieceColor : blackPieceColor;
        }

        // Thêm sự kiện click để di chuyển quân cờ
        square.addEventListener("click", function () {
          handleSquareClick(this);
        });

        board.appendChild(square);
      }
    }

    // Xử lý thay đổi màu sắc
    document.getElementById("white-square").addEventListener("input", updateColors);
    document.getElementById("black-square").addEventListener("input", updateColors);
    document.getElementById("white-piece").addEventListener("input", updateColors);
    document.getElementById("black-piece").addEventListener("input", updateColors);

    // Khởi tạo timer
    initTimers();

    function updateColors() {
      whiteSquareColor = document.getElementById("white-square").value;
      blackSquareColor = document.getElementById("black-square").value;
      whitePieceColor = document.getElementById("white-piece").value;
      blackPieceColor = document.getElementById("black-piece").value;

      const squares = document.querySelectorAll(".chess-square");
      squares.forEach((square) => {
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);

        if ((row + col) % 2 === 0) {
          square.style.backgroundColor = whiteSquareColor;
        } else {
          square.style.backgroundColor = blackSquareColor;
        }

        if (square.textContent) {
          square.style.color = whitePieces.includes(square.textContent) ? whitePieceColor : blackPieceColor;
        }
      });
    }
  }

  // Quân hậu
  function getValidQueenMoves(row, col, piece) {
    const moves = [];
    const isWhite = whitePieces.includes(piece);
    const directions = [
      [0, 1], [0, -1], // ngang (phải, trái)
      [1, 0], [-1, 0], // dọc (xuống, lên)
      [1, 1], [1, -1], // chéo (xuống phải, xuống trái)
      [-1, 1], [-1, -1], // chéo (lên phải, lên trái)
    ];
    directions.forEach(([dr, dc]) => {
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const targetPiece = boardState[r][c];
        if (!targetPiece) {
          moves.push([r, c]);
        } else {
          if (
            (isWhite && blackPieces.includes(targetPiece)) ||
            (!isWhite && whitePieces.includes(targetPiece))
          ) {
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

  // Quân vua
  function getValidKingMoves(row, col, piece) {
    const moves = [];
    const isWhite = whitePieces.includes(piece);
    const directions = [
      [0, 1], [0, -1], // ngang (phải, trái)
      [1, 0], [-1, 0], // dọc (xuống, lên)
      [1, 1], [1, -1], // chéo (xuống phải, xuống trái)
      [-1, 1], [-1, -1], // chéo (lên phải, lên trái)
    ];
    directions.forEach(([dr, dc]) => {
      let r = row + dr;
      let c = col + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const targetPiece = boardState[r][c];
        if (!targetPiece) {
          moves.push([r, c]);
        } else {
          if (
            (isWhite && blackPieces.includes(targetPiece)) ||
            (!isWhite && whitePieces.includes(targetPiece))
          ) {
            moves.push([r, c]);
          }
        }
      }
    });
    return moves;
  }

  // Quân tượng
  function getValidBishopMoves(row, col, piece) {
    const moves = [];
    const isWhite = whitePieces.includes(piece);
    const directions = [
      [1, 1], [1, -1], // chéo (xuống phải, xuống trái)
      [-1, 1], [-1, -1], // chéo (lên phải, lên trái)
    ];
    directions.forEach(([dr, dc]) => {
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const targetPiece = boardState[r][c];
        if (!targetPiece) {
          moves.push([r, c]);
        } else {
          if (
            (isWhite && blackPieces.includes(targetPiece)) ||
            (!isWhite && whitePieces.includes(targetPiece))
          ) {
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

  // Quân xe
  function getValidRookMoves(row, col, piece) {
    const moves = [];
    const isWhite = whitePieces.includes(piece);
    const directions = [
      [0, 1], [0, -1], // ngang (phải, trái)
      [1, 0], [-1, 0], // dọc (xuống, lên)
    ];
    directions.forEach(([dr, dc]) => {
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const targetPiece = boardState[r][c];
        if (!targetPiece) {
          moves.push([r, c]);
        } else {
          if (
            (isWhite && blackPieces.includes(targetPiece)) ||
            (!isWhite && whitePieces.includes(targetPiece))
          ) {
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

  // Quân tốt
  function getValidPawnMoves(row, col, piece) {
    const moves = [];
    const isWhite = whitePieces.includes(piece);
    const direction = isWhite ? -1 : 1; // Trắng đi lên, đen đi xuống
    const startRow = isWhite ? 6 : 1; // Hàng bắt đầu của tốt

    // Di chuyển tiến 1 ô
    if (row + direction >= 0 && row + direction < 8) {
      if (!boardState[row + direction][col]) {
        moves.push([row + direction, col]);
        // Di chuyển tiến 2 ô từ vị trí ban đầu
        if (row === startRow && !boardState[row + 2 * direction][col]) {
          moves.push([row + 2 * direction, col]);
        }
      }
    }

    // Ăn chéo
    const attackDirections = [
      [direction, -1], // chéo trái
      [direction, 1], // chéo phải
    ];
    attackDirections.forEach(([dr, dc]) => {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const targetPiece = boardState[r][c];
        if (
          targetPiece &&
          ((isWhite && blackPieces.includes(targetPiece)) ||
           (!isWhite && whitePieces.includes(targetPiece)))
        ) {
          moves.push([r, c]);
        }
      }
    });

    return moves;
  }

  // Quân mã
  function getValidKnightMoves(row, col, piece) {
    const moves = [];
    const isWhite = whitePieces.includes(piece);
    const directions = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2], // 2 ô dọc, 1 ô ngang
      [1, -2], [1, 2], [2, -1], [2, 1]      // 2 ô ngang, 1 ô dọc
    ];
    directions.forEach(([dr, dc]) => {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const targetPiece = boardState[r][c];
        if (!targetPiece || 
            (isWhite && blackPieces.includes(targetPiece)) || 
            (!isWhite && whitePieces.includes(targetPiece))) {
          moves.push([r, c]);
        }
      }
    });
    return moves;
  }

  // Hàm kiểm tra vua bị chiếu
  function isKingInCheck(kingPos, boardState) {
    const [kingRow, kingCol] = kingPos;
    const isWhiteKing = boardState[kingRow][kingCol] === "♔";
    console.log(`Checking if king at [${kingRow}, ${kingCol}] (white: ${isWhiteKing}) is in check`);

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardState[row][col];
        if (piece && (isWhiteKing ? blackPieces.includes(piece) : whitePieces.includes(piece))) {
          let moves = [];
          if (piece === "♕" || piece === "♛") {
            moves = getValidQueenMoves(row, col, piece);
          } else if (piece === "♔" || piece === "♚") {
            moves = getValidKingMoves(row, col, piece);
          } else if (piece === "♗" || piece === "♝") {
            moves = getValidBishopMoves(row, col, piece);
          } else if (piece === "♖" || piece === "♜") {
            moves = getValidRookMoves(row, col, piece);
          } else if (piece === "♙" || piece === "♟") {
            moves = getValidPawnMoves(row, col, piece);
          } else if (piece === "♘" || piece === "♞") {
            moves = getValidKnightMoves(row, col, piece);
          }
          console.log(`Piece ${piece} at [${row}, ${col}] has moves:`, moves);
          if (moves.some(([r, c]) => r === kingRow && c === kingCol)) {
            console.log(`King at [${kingRow}, ${kingCol}] is in check by ${piece} at [${row}, ${col}]`);
            return true;
          }
        }
      }
    }
    return false;
  }

  // Hàm đồng bộ trạng thái bàn cờ với DOM
  function syncBoardStateWithDOM() {
    const squares = document.querySelectorAll(".chess-square");
    squares.forEach((square) => {
      const row = parseInt(square.dataset.row);
      const col = parseInt(square.dataset.col);
      boardState[row][col] = square.textContent;
    });
    console.log("Synced boardState:", boardState);
  }

  // Hàm kiểm tra nước đi hợp lệ
  function isValidMove(fromRow, fromCol, toRow, toCol, piece, isWhiteTurn) {
    const isWhitePiece = whitePieces.includes(piece);
    if (isWhiteTurn && !isWhitePiece) {
      console.log("Invalid move: Not your turn (white turn, black piece)");
      return false;
    }
    if (!isWhiteTurn && isWhitePiece) {
      console.log("Invalid move: Not your turn (black turn, white piece)");
      return false;
    }

    let validMoves = [];
    if (piece === "♕" || piece === "♛") {
      validMoves = getValidQueenMoves(fromRow, fromCol, piece);
    } else if (piece === "♔" || piece === "♚") {
      validMoves = getValidKingMoves(fromRow, fromCol, piece);
    } else if (piece === "♗" || piece === "♝") {
      validMoves = getValidBishopMoves(fromRow, fromCol, piece);
    } else if (piece === "♖" || piece === "♜") {
      validMoves = getValidRookMoves(fromRow, fromCol, piece);
    } else if (piece === "♙" || piece === "♟") {
      validMoves = getValidPawnMoves(fromRow, fromCol, piece);
    } else if (piece === "♘" || piece === "♞") {
      validMoves = getValidKnightMoves(fromRow, fromCol, piece);
    } else {
      console.log("Invalid move: Unknown piece");
      return false;
    }

    console.log(`Valid moves for ${piece} at [${fromRow}, ${fromCol}]:`, validMoves);
    const isMoveValid = validMoves.some(([r, c]) => r === toRow && c === toCol);
    if (!isMoveValid) {
      console.log(`Move to [${toRow}, ${toCol}] is not in valid moves`);
      return false;
    }

    console.log("Board state before move:", JSON.parse(JSON.stringify(boardState)));
    const tempPiece = boardState[toRow][toCol];
    boardState[toRow][toCol] = piece;
    boardState[fromRow][fromCol] = "";
    console.log("Board state after move:", JSON.parse(JSON.stringify(boardState)));
    const kingPos = (piece === "♔" || piece === "♚") ? [toRow, toCol] : (isWhitePiece ? whiteKingPos : blackKingPos);
    const kingInCheck = isKingInCheck(kingPos, boardState);
    boardState[fromRow][fromCol] = piece;
    boardState[toRow][toCol] = tempPiece;
    console.log("Board state after restore:", JSON.parse(JSON.stringify(boardState)));

    console.log(`Move to [${toRow}, ${toCol}] results in king in check: ${kingInCheck}`);
    return !kingInCheck;
  }

  // Hàm xử lý timer
  function initTimers() {
    updateTimerDisplay();
    startTimer();
    document.querySelectorAll(".pause-btn").forEach((btn) => {
      btn.addEventListener("click", togglePause);
    });
  }

  function startTimer() {
    if (timers.interval) clearInterval(timers.interval);

    timers.interval = setInterval(() => {
      if (!timers.isPaused) {
        timers[timers.currentPlayer]--;
        updateTimerDisplay();

        if (timers[timers.currentPlayer] <= 0) {
          clearInterval(timers.interval);
          alert(`${timers.currentPlayer === "white" ? "Trắng" : "Đen"} hết giờ!`);
        }
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
      const secs = (seconds % 60).toString().padStart(2, "0");
      return `${mins}:${secs}`;
    };

    document.querySelector("#player-white .time").textContent = formatTime(timers.white);
    document.querySelector("#player-black .time").textContent = formatTime(timers.black);

    document.getElementById(`player-${timers.currentPlayer}`).classList.add("active");
    document
      .getElementById(`player-${timers.currentPlayer === "white" ? "black" : "white"}`)
      .classList.remove("active");

    if (timers.white < 60) {
      document.querySelector("#player-white .time").classList.add("time-critical");
    } else {
      document.querySelector("#player-white .time").classList.remove("time-critical");
    }

    if (timers.black < 60) {
      document.querySelector("#player-black .time").classList.add("time-critical");
    } else {
      document.querySelector("#player-black .time").classList.remove("time-critical");
    }
  }

  function togglePause() {
    timers.isPaused = !timers.isPaused;
    const pauseBtns = document.querySelectorAll(".pause-btn");

    if (timers.isPaused) {
      pauseBtns.forEach((btn) => {
        btn.textContent = "Tiếp tục";
        btn.style.backgroundColor = "#4CAF50";
      });
    } else {
      pauseBtns.forEach((btn) => {
        btn.textContent = "Tạm dừng";
        btn.style.backgroundColor = "#f44336";
      });
    }
  }

  function switchPlayer() {
    timers.currentPlayer = timers.currentPlayer === "white" ? "black" : "white";
    startTimer();
  }

  // Hàm xử lý khi click vào ô cờ
  let selectedPiece = null;

  function handleSquareClick(square) {
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);

    if (selectedPiece) {
      const fromRow = parseInt(selectedPiece.dataset.row);
      const fromCol = parseInt(selectedPiece.dataset.col);
      const piece = selectedPiece.textContent;

      const isWhiteTurn = timers.currentPlayer === "white";
      if (isValidMove(fromRow, fromCol, row, col, piece, isWhiteTurn)) {
        boardState[row][col] = piece;
        boardState[fromRow][fromCol] = "";

        if (piece === "♔") {
          whiteKingPos = [row, col];
        } else if (piece === "♚") {
          blackKingPos = [row, col];
        }

        square.textContent = piece;
        square.style.color = selectedPiece.style.color;
        selectedPiece.textContent = "";
        selectedPiece = null;

        syncBoardStateWithDOM(); // Đồng bộ trạng thái bàn cờ
        switchPlayer();
      } else {
        alert("Nước đi không hợp lệ hoặc không phải lượt của bạn!");
        selectedPiece = null; // Đặt lại selectedPiece
      }
    } else if (square.textContent !== "") {
      const piece = square.textContent;
      const isWhitePiece = whitePieces.includes(piece);
      const isWhiteTurn = timers.currentPlayer === "white";
      if ((isWhiteTurn && isWhitePiece) || (!isWhiteTurn && !isWhitePiece)) {
        selectedPiece = square;
      } else {
        alert("Không phải lượt của quân này!");
      }
    }
  }

  function createFlyingPiece() {
    const piece = document.createElement("div");
    piece.className = "chess-piece";
    piece.textContent = pieces[Math.floor(Math.random() * pieces.length)];

    const rect = notification.getBoundingClientRect();
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
    piece.style.zIndex = "1000";

    container.appendChild(piece);

    setTimeout(() => {
      piece.remove();
    }, 3000);
  }
});