document.addEventListener("DOMContentLoaded", () => {
  console.log("Menu Logic loaded");

  // === MENU NAVIGATION ===

  // Main menu buttons
  document.querySelectorAll(".menu-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      console.log("Menu action:", action);

      hideAllScreens();

      switch (action) {
        case "campaign":
          showCampaign();
          break;
        case "arena":
          showArena();
          break;
        case "deck":
          showDeckBuilder();
          break;
        case "profile":
          showProfile();
          break;
        case "options":
          alert("Options coming soon!");
          document.getElementById("main-menu").classList.remove("hidden");
          break;
        case "quit":
          if (confirm("Exit Chess Project?")) {
            window.close();
          } else {
            document.getElementById("main-menu").classList.remove("hidden");
          }
          break;
      }
    });
  });

  // Back buttons
  document.querySelectorAll(".btn-back").forEach((btn) => {
    btn.addEventListener("click", () => {
      const backTo = btn.dataset.back;
      hideAllScreens();

      if (backTo === "main-menu") {
        document.getElementById("main-menu").classList.remove("hidden");
      }
    });
  });

  // === CAMPAIGN ===
  function showCampaign() {
    document.getElementById("campaign-screen").classList.remove("hidden");
    if (window.battleSystem) {
      window.battleSystem.updateCampaignUI();
    }

    // Campaign node clicks
    document.querySelectorAll(".map-node").forEach((node) => {
      node.onclick = () => {
        if (node.classList.contains("locked")) {
          alert("Complete previous battles to unlock this fight!");
          return;
        }

        const nodeId = node.dataset.node;
        const nodeLevel = parseInt(node.dataset.level);

        // Check player level requirement
        const playerData = window.battleSystem.getPlayerData();
        if (playerData.level < nodeLevel) {
          alert(`You need to be level ${nodeLevel} to fight this opponent!`);
          return;
        }

        // Start battle
        window.battleSystem.startBattle(nodeId);
      };
    });
  }

  // === ARENA ===
  function showArena() {
    document.getElementById("arena-screen").classList.remove("hidden");

    // Challenge buttons
    document.querySelectorAll(".btn-challenge").forEach((btn) => {
      btn.onclick = () => {
        const card = btn.closest(".opponent-card");
        const opponentId = card.dataset.opponent;

        window.battleSystem.startBattle(opponentId);
      };
    });
  }

  // === DECK BUILDER ===
  function showDeckBuilder() {
    document.getElementById("deck-builder").classList.remove("hidden");
    renderDeckBuilder();
  }

  function renderDeckBuilder() {
    const availableSkills = document.getElementById("available-skills");
    const selectedSkills = document.getElementById("selected-skills");

    if (!availableSkills || !selectedSkills) return;

    // Get current deck
    let currentDeck =
      JSON.parse(localStorage.getItem("chess_player_deck") || "null") || window.skillSystem.getDefaultDeck();

    // Render available skills
    availableSkills.innerHTML = "";
    const allSkills = window.skillSystem.getAllSkills();

    allSkills.forEach((skill) => {
      if (!currentDeck.includes(skill.id)) {
        const card = createDeckSkillCard(skill, false);
        card.onclick = () => {
          if (currentDeck.length < 5) {
            currentDeck.push(skill.id);
            renderDeckBuilder();
          } else {
            alert("Deck is full! (Max 5 skills)");
          }
        };
        availableSkills.appendChild(card);
      }
    });

    // Render selected skills
    selectedSkills.innerHTML = "";
    currentDeck.forEach((skillId, index) => {
      const skill = window.skillSystem.getSkill(skillId);
      if (skill) {
        const card = createDeckSkillCard(skill, true);
        card.onclick = () => {
          currentDeck.splice(index, 1);
          renderDeckBuilder();
        };
        selectedSkills.appendChild(card);
      }
    });

    // Save deck button
    const saveBtn = document.getElementById("save-deck-btn");
    if (saveBtn) {
      saveBtn.onclick = () => {
        if (currentDeck.length !== 5) {
          alert("Deck must have exactly 5 skills!");
          return;
        }
        localStorage.setItem("chess_player_deck", JSON.stringify(currentDeck));
        alert("Deck saved successfully!");
      };
    }
  }

  function createDeckSkillCard(skill, isSelected) {
    const card = document.createElement("div");
    card.className = "deck-skill-card";
    card.innerHTML = `
      <div class="skill-name">${skill.name}</div>
      <div class="skill-cost">Cost: ${skill.cost} EP</div>
      <div class="skill-desc">${skill.description}</div>
      ${
        isSelected
          ? '<div class="remove-indicator">Click to remove</div>'
          : '<div class="add-indicator">Click to add</div>'
      }
    `;
    return card;
  }

  // === PROFILE ===
  function showProfile() {
    document.getElementById("profile-screen").classList.remove("hidden");

    if (window.battleSystem) {
      window.battleSystem.updatePlayerUI();
    }
  }

  // === UTILITY ===
  function hideAllScreens() {
    document.querySelectorAll(".fullscreen-overlay").forEach((screen) => {
      screen.classList.add("hidden");
    });
  }

  // === SAVE/LOAD SYSTEM ===

  window.saveGameAuto = () => {
    if (!window.gameState || !window.gameState.boardState) return;

    const saveData = {
      boardState: window.gameState.boardState.map((r) => [...r]),
      whiteKingPos: [...window.gameState.whiteKingPos],
      blackKingPos: [...window.gameState.blackKingPos],
      timers: { ...window.gameState.timers },
      turnNumber: window.gameState.turnNumber,
      energy: { ...window.gameState.energy },
      pieceHealth: JSON.parse(JSON.stringify(window.gameState.pieceHealth)),
      energyTiles: [...window.gameState.energyTiles],
      playerHand: [...window.gameState.playerHand],
      activeEffects: [...window.gameState.activeEffects],
      moveLog: [...window.gameState.moveLog],
      skillLog: [...window.gameState.skillLog],
      currentOpponent: window.battleSystem.currentOpponent,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("chess_battle_autosave", JSON.stringify(saveData));
  };

  window.loadGameAuto = () => {
    const saved = localStorage.getItem("chess_battle_autosave");
    if (!saved) return false;

    try {
      const data = JSON.parse(saved);

      // Restore game state
      window.gameState.boardState = data.boardState.map((r) => [...r]);
      window.gameState.whiteKingPos = [...data.whiteKingPos];
      window.gameState.blackKingPos = [...data.blackKingPos];
      Object.assign(window.gameState.timers, data.timers);

      if (data.turnNumber) window.gameState.turnNumber = data.turnNumber;
      if (data.energy) Object.assign(window.gameState.energy, data.energy);
      if (data.pieceHealth) window.gameState.pieceHealth = JSON.parse(JSON.stringify(data.pieceHealth));
      if (data.energyTiles) window.gameState.energyTiles = [...data.energyTiles];
      if (data.playerHand) window.gameState.playerHand = [...data.playerHand];
      if (data.activeEffects) window.gameState.activeEffects = [...data.activeEffects];
      if (data.moveLog) window.gameState.moveLog = [...data.moveLog];
      if (data.skillLog) window.gameState.skillLog = [...data.skillLog];
      if (data.currentOpponent) window.battleSystem.currentOpponent = data.currentOpponent;

      return true;
    } catch (e) {
      console.error("Failed to load autosave:", e);
      return false;
    }
  };

  // Check for autosave on load
  setTimeout(() => {
    const autosave = localStorage.getItem("chess_battle_autosave");
    if (autosave) {
      const data = JSON.parse(autosave);
      const timeSince = Date.now() - new Date(data.timestamp).getTime();

      // If less than 1 hour, offer to continue
      if (timeSince < 3600000) {
        if (confirm("Continue your last battle?")) {
          if (window.loadGameAuto()) {
            // Resume battle
            const enemyData = window.dialogueSystem.getEnemyData(window.battleSystem.currentOpponent);
            hideAllScreens();
            window.battleSystem.showBattleScreen(enemyData);
            window.battleSystem.battleActive = true;

            // Restore board
            if (window.createChessBoard) {
              window.createChessBoard();
            }
          }
        }
      }
    }
  }, 500);
});
