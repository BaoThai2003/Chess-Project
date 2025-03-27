document.addEventListener("DOMContentLoaded", function () {
  const notification = document.querySelector(".notification");
  const container = document.getElementById("chess-pieces-container");
  const okButton = document.getElementById("ok-button");
  const notificationContainer = document.getElementById("notification-container");
  const pieces = ["♔", "♕", "♖", "♗", "♘", "♙", "♚", "♛", "♜", "♝", "♞", "♟"];

  // Hiệu ứng quân cờ bay khi hover
  notification.addEventListener("mouseenter", function () {
    for (let i = 0; i < 20; i++) {
      createFlyingPiece();
    }
  });

  // Xử lý khi nhấn nút OK
  okButton.addEventListener("click", function () {
    // Ẩn bảng thông báo
    notificationContainer.style.display = "none";

    // Chuyển sang giao diện khác (thêm code của bạn ở đây)
    // Ví dụ: load giao diện chơi cờ
    // window.location.href = "game.html";
    alert("Chuyển sang giao diện chính!");
  });

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
