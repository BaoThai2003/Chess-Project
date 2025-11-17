// Skill System
window.skillSystem = {
  // Define all skills
  skills: {
    // === AZW Faction Skills ===
    azw_attack: {
      id: "azw_attack",
      name: "AZW - Attack",
      cost: 2,
      description: "Push a designated piece forward 2 spaces",
      execute: function (player) {
        alert("Select a piece to push forward 2 spaces");
        // Implementation would require piece selection
        return true;
      },
    },

    azw_shield: {
      id: "azw_shield",
      name: "AZW - Shield",
      cost: 2,
      description: "Reduce 0.25 damage from all sources for 3 turns",
      execute: function (player) {
        window.gameState.activeEffects.push({
          name: "Shield",
          type: "buff",
          duration: 3,
          effect: "damage_reduction",
          value: 0.25,
        });
        window.gameState.updateEffectsDisplay();
        alert("Shield activated! -0.25 damage for 3 turns");
        return true;
      },
    },

    azw_hard_work: {
      id: "azw_hard_work",
      name: "AZW - Hard Work",
      cost: 2,
      description: "All troops take 0.25 damage now, but gain +0.25 damage for 3 turns",
      execute: function (player) {
        // Damage all friendly pieces
        const whitePieces = ["♔", "♕", "♖", "♗", "♘", "♙"];
        for (let key in window.gameState.pieceHealth) {
          const [row, col] = key.split("-").map(Number);
          const piece = window.gameState.boardState[row][col];
          if (whitePieces.includes(piece)) {
            window.gameState.pieceHealth[key].current = Math.max(0, window.gameState.pieceHealth[key].current - 0.25);
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
        alert("Hard Work activated! -0.25 HP now, +0.25 damage for 3 turns");
        return true;
      },
    },

    azw_unity: {
      id: "azw_unity",
      name: "AZW - Unity",
      cost: 1,
      description: "When ally eliminated or takes >0.5 damage, all allies gain +0.25 damage permanently",
      execute: function (player) {
        window.gameState.activeEffects.push({
          name: "Unity",
          type: "buff",
          duration: 999,
          effect: "unity_trigger",
          value: 0.25,
        });
        window.gameState.updateEffectsDisplay();
        alert("Unity activated! Gains strength from sacrifice");
        return true;
      },
    },

    azw_sandstorm: {
      id: "azw_sandstorm",
      name: "AZW - Sandstorm",
      cost: 3,
      description: "Cover 2 rows for 3 turns. Enemies can move 1 less space",
      execute: function (player) {
        window.gameState.activeEffects.push({
          name: "Sandstorm",
          type: "debuff",
          duration: 3,
          effect: "move_reduction",
          value: 1,
        });
        window.gameState.updateEffectsDisplay();
        alert("Sandstorm summoned! Enemy movement reduced for 3 turns");
        return true;
      },
    },

    // New skill
    azw_sand_rage: {
      id: "azw_sand_rage",
      name: "AZW - Cuồng Phong Cát",
      cost: 4,
      description: "Đổi chỗ 2 quân địch, gây 0.5 sát thương nếu chúng va chạm",
      execute: function (player) {
        alert("Select 2 enemy pieces to swap");
        // Implementation for swap
        return true;
      },
    },

    // === Individual Piece Skills ===
    pawn_volcanic: {
      id: "pawn_volcanic",
      name: "Volcanic Power",
      cost: 1,
      description: "When moving into energy tile, all AZW pieces gain +0.25 HP for 1 turn",
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
        alert("Volcanic Power! All allies gain +0.25 HP");
        return true;
      },
    },

    rook_caravan: {
      id: "rook_caravan",
      name: "Desert Caravan",
      cost: 2,
      description: "After attack, restore 0.25 HP to 2 adjacent allies",
      execute: function (player) {
        alert("Caravan healing activated after next attack");
        return true;
      },
    },

    knight_forced_labor: {
      id: "knight_forced_labor",
      name: "Forced Labor",
      cost: 2,
      description: "After jump, if enemy defeated, deal 0.25 splash damage to adjacent enemies",
      execute: function (player) {
        alert("Forced Labor activated for next knight move");
        return true;
      },
    },

    bishop_guide: {
      id: "bishop_guide",
      name: "Guide",
      cost: 1,
      description: "Pass through energy tile to leave mark. Ally on it gains +1 move space",
      execute: function (player) {
        alert("Guide activated - leave marks on energy tiles");
        return true;
      },
    },

    queen_roar: {
      id: "queen_roar",
      name: "Desert Roar",
      cost: 3,
      description: "When attacked, reflect 0.5 damage (once every 2 turns)",
      execute: function (player) {
        window.gameState.activeEffects.push({
          name: "Desert Roar",
          type: "buff",
          duration: 2,
          effect: "reflect_damage",
          value: 0.5,
        });
        window.gameState.updateEffectsDisplay();
        alert("Desert Roar! Queen will reflect damage");
        return true;
      },
    },

    king_concentric: {
      id: "king_concentric",
      name: "Concentric",
      cost: 2,
      description: "When ≤6 pieces remain, King heals 0.25 HP per turn",
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
          alert("Concentric activated! King regenerates HP");
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
