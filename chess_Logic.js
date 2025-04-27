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

  //Cập nhật trạng thái bàn cờ
  let boardState = [];

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
          // Đặt màu quân cờ dựa trên danh sách whitePieces
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

        // Cập nhật màu ô cờ
        if ((row + col) % 2 === 0) {
          square.style.backgroundColor = whiteSquareColor;
        } else {
          square.style.backgroundColor = blackSquareColor;
        }

        // Cập nhật màu quân cờ
        if (square.textContent) {
          square.style.color = whitePieces.includes(square.textContent) ? whitePieceColor : blackPieceColor;
        }
      });
    }
  }
  //Xây dựng các nước đi cho các quân cờ

  //Quân hậu
  function getValidQueenMoves (row, col, piece){
    const moves = [];
    const isWhite = whitePieces.includes(piece);
    //Kiểm tra các hướng ngang, dọc, chéo
    const directions = [
      [0,1], [0,-1], //ngang(phải, trái)
      [1,0], [-1,0], //dọc(xuống, lên)
      [1,1], [1,-1], //chéo(xuống phải, xuống trái)
      [-1,1],[-1,-1], //chéo(lên phải, lên trái)
    ];
    directions.forEach(([dr, dc]) => {
      let r = row + dr;
      let c = col + dc;
      //tiếp tục kiểm tra cho đến khi chạm giới hạn bàn cờ
      while (r>=0 && r<8 && c>=0 && c<8){
        const targetPiece = boardState[r][c];
        if (!targetPiece) {
          moves.push([r,c]);
        }
        else{
          //Gặp quân cờ
          if (
          (isWhite && blackPieces.includes(targetPiece)) ||
          (!isWhite && whitePieces.includes(targetPiece))
          ){
            //ăn quân
            moves.push([r,c]);
          }
          //không thể nhảy qua quân cờ
          break;
        }
        r += dr;
        c += dc;
      }
    });
    return moves;
  }

//Quân vua
function getValidKingMoves (row, col, piece){
  const moves = [];
  const isWhite = whitePieces.includes(piece);
  //Kiểm tra các hướng ngang, dọc, chéo
  const directions = [
    [0,1], [0,-1], //ngang(phải, trái)
    [1,0], [-1,0], //dọc(xuống, lên)
    [1,1], [1,-1], //chéo(xuống phải, xuống trái)
    [-1,1], [-1,-1], //chéo(lên phải, lên trái)
  ];
  directions.forEach(([dr,dc]) => {
    let r = row + dr;
    let c = col + dc;
    //tiếp tục kiểm tra cho đến khi chạm giới hạn bàn cờ
    //khác với hậu phải chạy while để đi cả bàn cờ thì vua chỉ cần if là được do chỉ đi 1 ô
    if(r>=0 && r<8 && c>=0 && c<8){
      const targetPiece = boardState[r][c];
      if (!targetPiece){
        moves.push([r,c]);
      }
      else{
        //gặp quân cờ
        if (
        (isWhite && blackPieces.includes(targetPiece)) ||
        (!isWhite && whitePieces.includes(targetPiece))
        ){
         //ăn quân
          moves.push([r,c]);
        }
      }
    }
  });
  return moves;
}

//Hàm kiểm tra vua bị chiếu
function isKingInCheck(kingPos, boardState) {
  const [kingRow, kingCol] = kingPos;
  const isWhiteKing = boardState[kingRow][kingCol] === "♔";

  // Kiểm tra xem vị trí vua có bị tấn công bởi quân đối phương hay không
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col];
      if (piece && (isWhiteKing ? blackPieces.includes(piece) : whitePieces.includes(piece))) {
        // Giả định: kiểm tra nước đi hợp lệ của quân cờ đối phương
        // Cần triển khai logic đầy đủ cho tất cả các quân cờ
        if (piece === "♕" || piece === "♛") {
          const moves = getValidQueenMoves(row, col, piece);
          if (moves.some(([r, c]) => r === kingRow && c === kingCol)) {
            return true;
          }
        } else if (piece === "♔" || piece === "♚") {
          const moves = getValidKingMoves(row, col, piece);
          if (moves.some(([r, c]) => r === kingRow && c === kingCol)) {
            return true;
          }
        }
        // Thêm logic cho các quân cờ khác (xe, tượng, mã, tốt)
      }
    }
  }
  return false;
}

  //Hàm kiểm tra nước đi hợp lệ
  function isValidMove (fromRow, fromCol, toRow, toCol, piece, isWhiteTurn){
    const isWhitePiece = whitePieces.includes(piece);
    if (isWhiteTurn && !isWhitePiece) return false;
    if (!isWhiteTurn && isWhitePiece) return false;
    let validMoves = [];
    if (piece === "♕" || piece === "♛") {
      validMoves = getValidQueenMoves(fromRow, fromCol, piece);
    } else if (piece === "♔" || piece === "♚") {
      validMoves = getValidKingMoves(fromRow, fromCol, piece);
    } else {
      return false;
    }
  }

  //Kiểm tra nước đi có trong danh sách hợp lệ
  const isMoveValid = validMoves.some (([r,c]) => r === toRow && c == toCol);
  if(!isMoveValid) return false;
  
  //Kiểm tra xem nước đi có dẫn đến vua bị chiếu
  const tempPiece = boardState[toRow][toCol];
  boardState[toRow][toCol] = piece;
  boardState[fromRow][fromCol] = "";
  const kingPos = (piece === "♔" || piece === "♚") ? [toRow, toCol] : (isWhitePiece ? whiteKingPos : blackKingPos);
  const kingInCheck = isKingInCheck(kingPos, boardState);
  boardState[fromRow][fromCol] = piece;
  boardState[toRow][toCol] = tempPiece;

  return !kingInCheck;

  // Hàm xử lý timer
  function initTimers() {
    updateTimerDisplay();

    // Bắt đầu timer cho người chơi trắng
    startTimer();

    // Thêm sự kiện click cho nút tạm dừng
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

        // Kiểm tra hết giờ
        if (timers[timers.currentPlayer] <= 0) {
          clearInterval(timers.interval);
          alert(`${timers.currentPlayer === "white" ? "Trắng" : "Đen"} hết giờ!`);
        }
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0");
      const secs = (seconds % 60).toString().padStart(2, "0");
      return `${mins}:${secs}`;
    };

    document.querySelector("#player-white .time").textContent = formatTime(timers.white);
    document.querySelector("#player-black .time").textContent = formatTime(timers.black);

    // Đánh dấu timer hiện tại đang chạy
    document.getElementById(`player-${timers.currentPlayer}`).classList.add("active");
    document
      .getElementById(`player-${timers.currentPlayer === "white" ? "black" : "white"}`)
      .classList.remove("active");

    // Thêm hiệu ứng khi thời gian ít hơn 1 phút
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

  // Hàm xử lý khi click vào ô cờ (cần phát triển thêm)
  let selectedPiece = null;

  function handleSquareClick(square) {
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);

    if (selectedPiece) {
      const fromRow = parseInt(selectedPiece.dataset.row);
      const fromCol = parseInt(selectedPiece.dataset.col);
      const piece = selectedPiece.textContent;

      // Kiểm tra nước đi hợp lệ
      if (isValidMove(fromRow, fromCol, row, col, piece)) {
        // Kiểm tra lượt chơi
        const isWhiteTurn = timers.currentPlayer === "white";
        const isWhitePiece = whitePieces.includes(piece);

        if ((isWhiteTurn && isWhitePiece) || (!isWhiteTurn && !isWhitePiece)) {
          // Cập nhật trạng thái bàn cờ
          boardState[row][col] = piece;
          boardState[fromRow][fromCol] = "";

          // Cập nhật giao diện
          square.textContent = piece;
          square.style.color = selectedPiece.style.color;
          selectedPiece.textContent = "";
          selectedPiece = null;

          // Chuyển lượt
          switchPlayer();
        } else {
          alert("Không phải lượt của bạn!");
        }
      } else {
        alert("Nước đi không hợp lệ!");
      }

      selectedPiece = null; // Reset sau mỗi lần thử di chuyển
    } else if (square.textContent !== "") {
      // Chọn quân cờ
      selectedPiece = square;
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