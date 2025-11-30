// Skill System
window.skillSystem = {
  // Define all skills
  skills: {
    // === AZW Faction Skills ===
    azw_attack: {
      id: "azw_attack",
      name: "AZW - Tiến công",
      cost: 2,
      description: "Đẩy 1 quân cờ chỉ định của phe mình tiến thêm 2 ô.",
      execute: function (player) {
        alert("Chọn 1 quân cờ để đẩy quân cờ chỉ định đó tiến thêm 2 ô.");
        // Implementation would require piece selection
        return true;
      },
    },

    azw_shield: {
      id: "azw_shield",
      name: "AZW - AZW - Che chở",
      cost: 2,
      description: "Tạo lớp khiên, giảm 0.25 sát thương từ mọi nguồn cho toàn đội trong 3 lượt.",
      execute: function (player) {
        window.gameState.activeEffects.push({
          name: "Shield",
          type: "buff",
          duration: 3,
          effect: "damage_reduction",
          value: 0.25,
        });
        window.gameState.updateEffectsDisplay();
        alert("Khiên đang kích hoạt! Giảm 0.25 sát thương trong 3 lượt!");
        return true;
      },
    },

    azw_hard_work: {
      id: "azw_hard_work",
      name: "AZW - Lao động hăng say",
      cost: 2,
      description:
        "Toàn bộ quân mình nhận 0.25 sát thương ngay lập tức, nhưng tăng 0.25 sát thương trong 3 lượt tiếp theo.",
      execute: function (player) {
        // Damage all friendly pieces
        const whitePieces = ["♔", "♕", "♖", "♗", "♘", "♙"];
        for (let key in window.gameState.pieceHealth) {
          const [row, col] = key.split("-").map(Number);
          const piece = window.gameState.boardState[row][col];
          if (whitePieces.includes(piece)) {
            // Use centralized applyDamage so death/removal is handled consistently
            if (window.gameState.applyDamage) {
              window.gameState.applyDamage(row, col, 0.25, "skill", null);
            } else {
              window.gameState.pieceHealth[key].current = Math.max(0, window.gameState.pieceHealth[key].current - 0.25);
            }
          }
        }

        // Add buff
        window.gameState.activeEffects.push({
          name: "Hard Work",
          type: "buff",
          duration: 3,
          effect: "damage_increase",
          value: 0.25,
        });
        window.gameState.updateEffectsDisplay();
        window.updateAllHealthBars();
        alert("Các công nhân đang lao động hăng say! Toàn bộ sát thương tăng 0.25 trong 3 lượt!");
        return true;
      },
    },

    azw_unity: {
      id: "azw_unity",
      name: "AZW - Đồng tâm hiệp lực",
      cost: 6,
      description:
        "Khi 1 quân phe mình bị loại hoặc chịu trên 0.5 sát thương → sát thương toàn quân tăng vĩnh viễn 0.25.",
      execute: function (player) {
        window.gameState.activeEffects.push({
          name: "Unity",
          type: "buff",
          duration: 999,
          effect: "unity_trigger",
          value: 0.25,
        });
        window.gameState.updateEffectsDisplay();
        alert("Đông tâm hiệp lực đã kích hoạt! Sức mạnh tăng từ sự hy sinh");
        return true;
      },
    },

    azw_sandstorm: {
      id: "azw_sandstorm",
      name: "AZW - Anh em ta là bão cát",
      cost: 6,
      description:
        "Gọi bão cát bao phủ 2 hàng trong 3 lượt. Quân địch trong phạm vi chỉ có thể di chuyển tối đa giảm đi 1 ô.",
      execute: function (player) {
        window.gameState.activeEffects.push({
          name: "Sandstorm",
          type: "debuff",
          duration: 3,
          effect: "move_reduction",
          value: 1,
        });
        window.gameState.updateEffectsDisplay();
        alert("Bão cát đã bao trùm! Những kẻ xâm phạm sẽ bị giảm di chuyển giảm 1 ô trong 3 lượt");
        return true;
      },
    },

    // New skill
    azw_sand_rage: {
      id: "azw_sand_rage",
      name: "AZW - Cuồng Phong Cát",
      cost: 4,
      description: "Đổi chỗ 2 quân địch, gây 0.25 sát thương nếu chúng va chạm",
      execute: function (player) {
        alert("Lụa chọn 2 quân địch để đổi chỗ chúng. Nếu chúng va chạm, mỗi quân sẽ chịu 0.25 sát thương.");
        // Implementation for swap
        return true;
      },
    },

    // === Individual Piece Skills ===
    pawn_volcanic: {
      id: "pawn_volcanic",
      name: "Bão cát nóng chảy",
      cost: 1,
      description: "Khi di chuyển vào ô năng lượng, tất cả quân AZW nhận +0.25 HP trong 1 lượt",
      execute: function (player) {
        const whitePieces = ["♔", "♕", "♖", "♗", "♘", "♙"];
        for (let key in window.gameState.pieceHealth) {
          const [row, col] = key.split("-").map(Number);
          const piece = window.gameState.boardState[row][col];
          if (whitePieces.includes(piece)) {
            window.gameState.pieceHealth[key].max += 0.25;
            window.gameState.pieceHealth[key].current += 0.25;
          }
        }
        window.updateAllHealthBars();
        alert("Bão cát nóng chảy! Năng lượng từ sa mạc tiếp thêm sức mạnh cho đồng đội!");
        return true;
      },
    },

    rook_caravan: {
      id: "rook_caravan",
      name: "Mánh khóe của những kẻ du mục",
      cost: 2,
      description: "Sau khi tấn công, hồi 0.25 HP cho 2 đồng minh kế bên",
      execute: function (player) {
        alert("Caravan healing activated after next attack");
        return true;
      },
    },

    knight_forced_labor: {
      id: "knight_forced_labor",
      name: "Lao dịch khổ sai",
      cost: 2,
      description:
        "Sau khi nhảy, nếu hạ gục được quân địch → gây thêm 0.25 sát thương lan cho quân địch đứng cạnh ô đáp xuống.",
      execute: function (player) {
        alert("Hãy cất lên, hỡi tiếng gầm của những người cùng khổ!");
        return true;
      },
    },

    bishop_guide: {
      id: "bishop_guide",
      name: "Đưa đường dẫn lối",
      cost: 1,
      description:
        "Khi đi qua ô năng lượng, để lại dấu ấn trong 1 lượt. Quân AZW đứng trên đó được +1 ô di chuyển trong lượt kế tiếp.",
      execute: function (player) {
        alert("Những dấu chân đã để lại, liệu người đến sau có thể tìm thấy lối đi?");
        return true;
      },
    },

    queen_roar: {
      id: "queen_roar",
      name: "Tiếng gào hoang mạc",
      cost: 3,
      description: "Khi bị tấn công, phản lại 0.5 sát thương lên quân địch (kích hoạt tối đa 1 lần mỗi 2 lượt).",
      execute: function (player) {
        window.gameState.activeEffects.push({
          name: "Desert Roar",
          type: "buff",
          duration: 2,
          effect: "reflect_damage",
          value: 0.5,
        });
        window.gameState.updateEffectsDisplay();
        alert("Bão cát rít từng hồi đáng sợ ! Liệu ngươi có sống sót trong tiếng gào này?");
        return true;
      },
    },

    king_concentric: {
      id: "king_concentric",
      name: "Đồng tâm",
      cost: 2,
      description:
        "When the number of AZW pieces remaining ≤ 6 → The King automatically increases 0.05 damage each turn (maximum +1). The current accumulated bonus is shown on the buffs/debuffs board.",
      execute: function (player) {
        // This skill registers a stacking king damage bonus effect for the owner's king.
        const whitePieces = ["♔", "♕", "♖", "♗", "♘", "♙"];
        let count = 0;
        for (let key in window.gameState.pieceHealth) {
          const [row, col] = key.split("-").map(Number);
          const piece = window.gameState.boardState[row] ? window.gameState.boardState[row][col] : null;
          if (piece && whitePieces.includes(piece)) count++;
        }

        if (count <= 6) {
          // Push effect; executeSkill wrapper will annotate owner
          window.gameState.activeEffects.push({
            name: "Concentric",
            type: "buff",
            duration: 999,
            effect: "king_damage_increase",
            value: 0.05,
            accumulated: 0,
            max: 1,
          });
          window.gameState.updateEffectsDisplay();
          alert("Concentric activated: King's damage will increase each turn.");
          return true;
        } else {
          alert("Need ≤6 AZW pieces to activate Concentric");
          return false;
        }
      },
    },
  },

  // Get skill by ID
  getSkill(skillId) {
    return this.skills[skillId];
  },

  // Execute a skill
  executeSkill(skillId, player, context) {
    const skill = this.skills[skillId];
    if (!skill) return false;

    // Execute and annotate any added activeEffects with owner (player)
    try {
      const beforeCount =
        window.gameState && window.gameState.activeEffects ? window.gameState.activeEffects.length : 0;
      const result = skill.execute(player, context);
      const afterCount = window.gameState && window.gameState.activeEffects ? window.gameState.activeEffects.length : 0;

      if (window.gameState && window.gameState.activeEffects && afterCount > beforeCount) {
        for (let i = beforeCount; i < afterCount; i++) {
          try {
            window.gameState.activeEffects[i].owner = player;
          } catch (e) {}
        }
      }

      return result;
    } catch (e) {
      // Fallback: call with only player
      try {
        const beforeCount =
          window.gameState && window.gameState.activeEffects ? window.gameState.activeEffects.length : 0;
        const result = skill.execute(player);
        const afterCount =
          window.gameState && window.gameState.activeEffects ? window.gameState.activeEffects.length : 0;
        if (window.gameState && window.gameState.activeEffects && afterCount > beforeCount) {
          for (let i = beforeCount; i < afterCount; i++) {
            try {
              window.gameState.activeEffects[i].owner = player;
            } catch (e) {}
          }
        }
        return result;
      } catch (err) {
        return false;
      }
    }
  },

  // Get all available skills for deck building
  getAllSkills() {
    return Object.values(this.skills);
  },

  // Get default AZW faction skills
  getDefaultDeck() {
    return ["azw_attack", "azw_shield", "azw_hard_work", "azw_unity", "azw_sandstorm"];
  },

  // Get piece-skill mapping for factions. Keys are piece symbols placed on board.
  getPieceSkillMapping(faction) {
    if (!faction || faction === "azw") {
      // Map both white and black symbols to AZW piece skills
      return {
        // White pieces
        "♙": "pawn_volcanic",
        "♖": "rook_caravan",
        "♘": "knight_forced_labor",
        "♗": "bishop_guide",
        "♕": "queen_roar",
        "♔": "king_concentric",
        // Black pieces
        "♟": "pawn_volcanic",
        "♜": "rook_caravan",
        "♞": "knight_forced_labor",
        "♝": "bishop_guide",
        "♛": "queen_roar",
        "♚": "king_concentric",
      };
    }
    return null;
  },
};

// Deck builder functionality
document.addEventListener("DOMContentLoaded", () => {
  const deckBuilder = document.getElementById("deck-builder");
  if (!deckBuilder) return;

  // Build a two-column layout: header + left 70% (piece skills top, skill cards bottom), right 30% (available skills)
  deckBuilder.innerHTML = `
    <div class="deck-header">
      <div class="deck-title"><h2>Deck Builder</h2></div>
      <div class="deck-controls">
        <button id="return-main-btn" class="btn-secondary">Return</button>
        <button id="save-deck-btn" class="btn-primary">Save Deck</button>
      </div>
    </div>
    <div class="deck-builder-grid">
      <div class="deck-left">
        <div id="piece-skills-panel" class="piece-skills-panel">
          <h3 id="piece-skills-toggle" class="toggle">Chess Piece Skills ▸</h3>
          <div id="piece-skills" class="piece-skills" style="display:none"></div>
        </div>
        <div class="skill-cards-panel">
          <h3>Skill Cards (max 7)</h3>
          <div id="selected-skills" class="selected-skills"></div>
        </div>
      </div>
      <div class="deck-right">
        <h3 id="right-panel-title">Available Skills</h3>
        <div id="available-skills" class="available-skills"></div>
      </div>
    </div>
  `;

  const availableSkills = document.getElementById("available-skills");
  const selectedSkills = document.getElementById("selected-skills");
  const pieceSkillsContainer = document.getElementById("piece-skills");

  // Load current deck and player piece-skill mapping
  let currentDeck = JSON.parse(localStorage.getItem("chess_player_deck") || "null") || [];
  // ensure deck is array
  if (!Array.isArray(currentDeck)) currentDeck = window.skillSystem.getDefaultDeck();
  if (currentDeck.length === 0) currentDeck = window.skillSystem.getDefaultDeck();

  let playerPieceSkills = JSON.parse(localStorage.getItem("player_piece_skills") || "null") || {};

  const pieceTypes = [
    { key: "pawn", symbol: "♙", label: "Pawn" },
    { key: "knight", symbol: "♘", label: "Knight" },
    { key: "bishop", symbol: "♗", label: "Bishop" },
    { key: "rook", symbol: "♖", label: "Rook" },
    { key: "queen", symbol: "♕", label: "Queen" },
    { key: "king", symbol: "♔", label: "King" },
  ];

  // rightMode: 'available' | 'assigned' - toggled when piece skills header clicked
  let rightMode = "available";

  function renderBuilder() {
    availableSkills.innerHTML = "";
    selectedSkills.innerHTML = "";
    pieceSkillsContainer.innerHTML = "";

    const allSkills = window.skillSystem.getAllSkills();

    // Render selected skill cards (deck) - max 7, single copies
    currentDeck.forEach((skillId, idx) => {
      const skill = window.skillSystem.getSkill(skillId);
      if (!skill) return;
      const card = document.createElement("div");
      card.className = "deck-skill-card";
      card.innerHTML = `<div class="skill-name">${skill.name}</div><div class="skill-cost">Cost: ${skill.cost}</div>`;
      // Remove button
      const rem = document.createElement("button");
      rem.textContent = "Remove";
      rem.onclick = () => {
        currentDeck.splice(idx, 1);
        renderBuilder();
      };
      card.appendChild(rem);
      selectedSkills.appendChild(card);
    });

    // Render piece skills slots (left-top)
    pieceTypes.forEach((pt) => {
      const slot = document.createElement("div");
      slot.className = "piece-skill-slot";
      const current = playerPieceSkills[pt.key] || null;
      slot.innerHTML = `<strong>${pt.label} ${pt.symbol}</strong>`;
      if (current) {
        const skill = window.skillSystem.getSkill(current);
        const sdiv = document.createElement("div");
        sdiv.className = "assigned-skill";
        sdiv.innerHTML = `<span>${skill ? skill.name : current}</span>`;
        const x = document.createElement("button");
        x.textContent = "X";
        x.className = "assigned-remove-btn";
        x.setAttribute("data-ptype", pt.key);
        x.onclick = () => {
          delete playerPieceSkills[pt.key];
          localStorage.setItem("player_piece_skills", JSON.stringify(playerPieceSkills));
          renderBuilder();
        };
        sdiv.appendChild(x);
        slot.appendChild(sdiv);
      } else {
        const hint = document.createElement("div");
        hint.className = "no-skill";
        hint.textContent = "(no skill attached)";
        slot.appendChild(hint);
      }
      pieceSkillsContainer.appendChild(slot);
    });

    // Render right pane depending on mode
    const rightTitle = document.getElementById("right-panel-title");
    rightTitle.textContent = rightMode === "available" ? "Available Skills" : "Assigned Piece Skills";

    // If available, list all skills that are not in deck or assigned as piece-skill
    if (rightMode === "available") {
      allSkills.forEach((skill) => {
        const isAssignedAsPiece = Object.values(playerPieceSkills).includes(skill.id);
        const inDeck = currentDeck.includes(skill.id);
        if (!inDeck && !isAssignedAsPiece) {
          const card = createAvailableSkillCard(skill);
          availableSkills.appendChild(card);
        }
      });
    } else {
      // show assigned piece skills on right for quick management
      Object.keys(playerPieceSkills).forEach((ptype) => {
        const skillId = playerPieceSkills[ptype];
        if (!skillId) return;
        const skill = window.skillSystem.getSkill(skillId);
        if (!skill) return;
        const sym = pieceTypes.find((pt) => pt.key === ptype).symbol;
        const card = document.createElement("div");
        card.className = "deck-skill-card assigned-card";
        card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><strong>${sym} - ${ptype}</strong><button class='remove-assigned' data-ptype='${ptype}'>X</button></div><div>${skill.name}</div><div class='skill-desc'>${skill.description}</div>`;
        availableSkills.appendChild(card);
      });
    }

    // Attach a delegated click handler for remove-assigned in right pane
    availableSkills.querySelectorAll(".remove-assigned").forEach((btn) => {
      btn.onclick = (e) => {
        const p = btn.getAttribute("data-ptype");
        if (p && playerPieceSkills[p]) {
          delete playerPieceSkills[p];
          localStorage.setItem("player_piece_skills", JSON.stringify(playerPieceSkills));
          renderBuilder();
        }
      };
    });
  }

  // Expose renderBuilder so other modules can trigger a refresh
  window.renderDeckBuilder = renderBuilder;

  function createAvailableSkillCard(skill) {
    const card = document.createElement("div");
    card.className = "deck-skill-card";
    card.innerHTML = `
      <div class="skill-name">${skill.name}</div>
      <div class="skill-cost">Cost: ${skill.cost} EP</div>
      <div class="skill-desc">${skill.description}</div>
    `;
    card.onclick = () => {
      // Prompt: equip to piece or add to deck
      const choice = confirm(
        "OK = Equip to a piece (single per piece type). Cancel = Add to skill deck (max 7).\n(Use Cancel to add to deck)"
      );
      if (choice) {
        // Equip to piece: ask which piece type
        const typesStr = pieceTypes.map((p) => p.key).join(", ");
        const pick = prompt(`Enter piece type to equip (${typesStr}):`);
        if (!pick) return;
        const normalized = pick.trim().toLowerCase();
        const valid = pieceTypes.find((p) => p.key === normalized);
        if (!valid) {
          alert("Invalid piece type");
          return;
        }
        // Ensure only one skill per piece type
        playerPieceSkills[normalized] = skill.id;
        localStorage.setItem("player_piece_skills", JSON.stringify(playerPieceSkills));
        // Assign to gameState.pieceSkills so pieces on board gain the mapping
        if (window.gameState && window.gameState.assignPieceSkills) window.gameState.assignPieceSkills();
        renderBuilder();
      } else {
        // Add to deck
        if (currentDeck.includes(skill.id)) {
          alert("This card is already in your deck (one copy max).");
          return;
        }
        if (currentDeck.length >= 7) {
          alert("Deck full (max 7 skill cards).");
          return;
        }
        currentDeck.push(skill.id);
        renderBuilder();
      }
    };
    return card;
  }

  // Save deck button
  const saveDeckBtn = document.getElementById("save-deck-btn");
  if (saveDeckBtn) {
    saveDeckBtn.addEventListener("click", () => {
      // Persist both deck and piece skills
      localStorage.setItem("chess_player_deck", JSON.stringify(currentDeck));
      localStorage.setItem("player_piece_skills", JSON.stringify(playerPieceSkills));
      // Apply piece skills to current gameState if present
      if (window.gameState) {
        if (!window.gameState.pieceSkills) window.gameState.pieceSkills = {};
        // Map per-position for current board based on playerPieceSkills
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = window.gameState.boardState[r][c];
            if (!p) continue;
            const mapping = window.skillSystem.getPieceSkillMapping(window.gameState.selectedFaction || "azw") || {};
            // If player has customized mapping for white pieces, apply
            const typeKey = Object.keys(playerPieceSkills).find((k) => {
              const sym = pieceTypes.find((pt) => pt.key === k).symbol;
              return sym === p;
            });
            // alternative: map by symbol
            const bySymbol = Object.entries(playerPieceSkills).reduce((acc, [k, v]) => {
              const sym = pieceTypes.find((pt) => pt.key === k).symbol;
              acc[sym] = v;
              return acc;
            }, {});
            if (bySymbol[p]) window.gameState.pieceSkills[`${r}-${c}`] = bySymbol[p];
          }
        }
        if (window.syncBoardStateWithDOM) window.syncBoardStateWithDOM();
      }
      alert("Deck and piece skills saved.");
    });
  }

  // Return/Main button behavior
  const returnBtn = document.getElementById("return-main-btn");
  if (returnBtn) {
    returnBtn.addEventListener("click", () => {
      // Hide deck builder and attempt to show main menu if available
      deckBuilder.classList.add("hidden");
      if (window.hideAllScreens) window.hideAllScreens();
      if (window.showMainMenu) window.showMainMenu();
    });
  }

  // Toggle piece-skills panel and switch right pane mode
  const pieceToggle = document.getElementById("piece-skills-toggle");
  const piecePanel = document.getElementById("piece-skills");
  if (pieceToggle && piecePanel) {
    pieceToggle.addEventListener("click", () => {
      const isHidden = piecePanel.style.display === "none" || !piecePanel.style.display;
      if (isHidden) {
        piecePanel.style.display = "block";
        pieceToggle.textContent = "Chess Piece Skills ▾";
        rightMode = "assigned";
      } else {
        piecePanel.style.display = "none";
        pieceToggle.textContent = "Chess Piece Skills ▸";
        rightMode = "available";
      }
      renderBuilder();
    });
  }

  // Initial render when deck builder opened
  const observer = new MutationObserver(() => {
    if (!deckBuilder.classList.contains("hidden")) {
      renderBuilder();
    }
  });

  observer.observe(deckBuilder, { attributes: true, attributeFilter: ["class"] });
});
