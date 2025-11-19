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
      description: "Khi số quân AZW còn lại ≤ 6 → Vua tự hồi 0.25 máu mỗi lượt.",
      execute: function (player) {
        const whitePieces = ["♔", "♕", "♖", "♗", "♘", "♙"];
        let count = 0;
        for (let key in window.gameState.pieceHealth) {
          const [row, col] = key.split("-").map(Number);
          const piece = window.gameState.boardState[row][col];
          if (whitePieces.includes(piece)) count++;
        }

        if (count <= 6) {
          window.gameState.activeEffects.push({
            name: "Concentric",
            type: "buff",
            duration: 999,
            effect: "king_regen",
            value: 0.25,
          });
          window.gameState.updateEffectsDisplay();
          alert("Đồng tâm hiệp lực! Ngai vàng mãi vững giữa bão cát khô căn!");
          return true;
        } else {
          alert("Need ≤6 pieces to activate Concentric");
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

    // Pass context if skill implementation accepts it
    try {
      return skill.execute(player, context);
    } catch (e) {
      // Fallback: call with only player
      return skill.execute(player);
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

  // Insert faction selector control (allows choosing piece skill set)
  const factionDiv = document.createElement("div");
  factionDiv.id = "faction-selector";
  factionDiv.style.marginBottom = "8px";
  factionDiv.innerHTML = `
    <label style="font-size:14px;color:#fff">Faction: 
      <select id="faction-select">
        <option value="azw">AZW (Akh'Zahara Workers)</option>
      </select>
    </label>
  `;
  deckBuilder.insertBefore(factionDiv, deckBuilder.firstChild);
  const factionSelect = document.getElementById("faction-select");
  const savedFaction = localStorage.getItem("selected_faction") || "azw";
  factionSelect.value = savedFaction;
  factionSelect.addEventListener("change", () => {
    localStorage.setItem("selected_faction", factionSelect.value);
    if (window.gameState) {
      window.gameState.selectedFaction = factionSelect.value;
      if (window.gameState.assignPieceSkills) window.gameState.assignPieceSkills();
      if (window.syncBoardStateWithDOM) window.syncBoardStateWithDOM();
    }
  });

  // Populate available skills
  const availableSkills = document.getElementById("available-skills");
  const selectedSkills = document.getElementById("selected-skills");

  let currentDeck =
    JSON.parse(localStorage.getItem("chess_player_deck") || "null") || window.skillSystem.getDefaultDeck();

  function renderSkills() {
    if (!availableSkills || !selectedSkills) return;

    availableSkills.innerHTML = "";
    selectedSkills.innerHTML = "";

    const allSkills = window.skillSystem.getAllSkills();

    // Render available skills
    allSkills.forEach((skill) => {
      if (!currentDeck.includes(skill.id)) {
        const card = createSkillCard(skill, false);
        availableSkills.appendChild(card);
      }
    });

    // Render selected skills
    currentDeck.forEach((skillId) => {
      const skill = window.skillSystem.getSkill(skillId);
      if (skill) {
        const card = createSkillCard(skill, true);
        selectedSkills.appendChild(card);
      }
    });
  }

  function createSkillCard(skill, isSelected) {
    const card = document.createElement("div");
    card.className = "deck-skill-card";
    card.innerHTML = `
      <div class="skill-name">${skill.name}</div>
      <div class="skill-cost">Cost: ${skill.cost} EP</div>
      <div class="skill-desc">${skill.description}</div>
    `;

    card.onclick = () => {
      if (isSelected) {
        // Remove from deck
        currentDeck = currentDeck.filter((id) => id !== skill.id);
      } else {
        // Add to deck (max 5)
        if (currentDeck.length < 5) {
          currentDeck.push(skill.id);
        } else {
          alert("Deck is full! (Max 5 skills)");
          return;
        }
      }
      renderSkills();
    };

    return card;
  }

  // Save deck button
  const saveDeckBtn = document.getElementById("save-deck-btn");
  if (saveDeckBtn) {
    saveDeckBtn.addEventListener("click", () => {
      if (currentDeck.length !== 5) {
        alert("Deck must have exactly 5 skills!");
        return;
      }
      localStorage.setItem("chess_player_deck", JSON.stringify(currentDeck));
      alert("Deck saved successfully!");
    });
  }

  // Initialize deck builder when shown
  const observer = new MutationObserver(() => {
    if (!deckBuilder.classList.contains("hidden")) {
      renderSkills();
    }
  });

  observer.observe(deckBuilder, { attributes: true, attributeFilter: ["class"] });
});
