// NOTE: UI STATE / MENU / OVERLAY HELPERS
// Handles non-render UI behavior for the mini-game.
// Also includes UI-specific draw functions used by render.js.

import {
     miniGameCtx,
     miniGameWidth,
     miniGameHeight,
     gameStarted,
     gamePaused,
     gameMenuOpen,
     gameMenuView,
     gameOver,
     gameWon,
     gameOverlayText,
     gameOverlaySubtext,
     gameOverlayTimer,
     gameOverlayDuration,
     gameMenuUi,
     musicEnabled,
     soundEffectsEnabled,
     difficultyIndex,
     sparkleScore,
     playerHealth,
     touchControls,

     setGameStarted,
     setGamePaused,
     setGameMenuOpen,
     setGameMenuView,
     setGameOver,
     setGameWon,
     setGameOverlayText,
     setGameOverlaySubtext,
     setGameOverlayTimer,
     setGameOverlayDuration,
     setMusicEnabled,
     setSoundEffectsEnabled,
     setDifficultyIndex,
     setMiniGameSize
} from "./state.js";

import {
     difficultyOptions,
     startOverlayDuration,
     overlayFadeFrames
} from "./theme.js";

import {
     isPointInsideRect,
     updateTouchControlBounds,
     resetTouchControls
} from "./input.js";

import {
     resetPlayerPosition
} from "./systems/player.js";


// NOTE: CANVAS SIZE

export function resizeMiniGameCanvasFromCss() {
     const canvas = document.getElementById("miniGameCanvas");
     const ctx = canvas ? canvas.getContext("2d") : null;

     if (!canvas || !ctx) return;

     const rect = canvas.getBoundingClientRect();
     const dpr = window.devicePixelRatio || 1;

     canvas.width = Math.round(rect.width * dpr);
     canvas.height = Math.round(rect.height * dpr);
     ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

     setMiniGameSize(rect.width, rect.height);
}

export function updateMiniGameCanvasSize() {
     resizeMiniGameCanvasFromCss();
     updateTouchControlBounds();
     updateMenuUiBounds();
}


// NOTE: ROUND FLOW

export function startNewGameRound() {
     // NOTE:
     // Starting a new round resets touch input first so the player
     // does not begin the round with a stuck joystick or button state.
     resetTouchControls();
     resetPlayerPosition();

     updateMiniGameCanvasSize();
     updateTouchControlBounds();
     updateMenuUiBounds();

     setGameStarted(true);
     setGamePaused(false);
     setGameMenuOpen(false);
     setGameMenuView("main");
     setGameOver(false);
     setGameWon(false);

     showTimedGameOverlay("LET'S PLAY!");
}


// NOTE: MENU / SETTINGS

export function getCurrentDifficultyLabel() {
     return difficultyOptions[difficultyIndex] || "Normal";
}

export function getCurrentSoundLabel() {
     return (musicEnabled && soundEffectsEnabled) ? "On" : "Off";
}

export function cycleDifficulty() {
     setDifficultyIndex((difficultyIndex + 1) % difficultyOptions.length);
}

export function toggleAllSound() {
     const nextEnabled = !(musicEnabled && soundEffectsEnabled);
     setMusicEnabled(nextEnabled);
     setSoundEffectsEnabled(nextEnabled);
}


// NOTE: MENU LAYOUT

export function updateMenuUiBounds() {
     const panelWidth = Math.max(320, Math.min(miniGameWidth * 0.68, miniGameWidth * 0.78));
     const panelHeight = Math.max(300, Math.min(miniGameHeight * 0.72, miniGameHeight * 0.8));
     const panelX = (miniGameWidth - panelWidth) / 2;
     const panelY = (miniGameHeight - panelHeight) / 2;

     gameMenuUi.panel.x = panelX;
     gameMenuUi.panel.y = panelY;
     gameMenuUi.panel.width = panelWidth;
     gameMenuUi.panel.height = panelHeight;

     const buttonX = panelX + 24;
     const buttonWidth = panelWidth - 48;
     const buttonHeight = 50;
     const buttonGap = 14;
     const firstButtonY = panelY + 78;

     gameMenuUi.newGameButton.x = buttonX;
     gameMenuUi.newGameButton.y = firstButtonY;
     gameMenuUi.newGameButton.width = buttonWidth;
     gameMenuUi.newGameButton.height = buttonHeight;

     gameMenuUi.instructionsButton.x = buttonX;
     gameMenuUi.instructionsButton.y = firstButtonY + (buttonHeight + buttonGap);
     gameMenuUi.instructionsButton.width = buttonWidth;
     gameMenuUi.instructionsButton.height = buttonHeight;

     gameMenuUi.difficultyButton.x = buttonX;
     gameMenuUi.difficultyButton.y = firstButtonY + ((buttonHeight + buttonGap) * 2);
     gameMenuUi.difficultyButton.width = buttonWidth;
     gameMenuUi.difficultyButton.height = buttonHeight;

     gameMenuUi.soundButton.x = buttonX;
     gameMenuUi.soundButton.y = firstButtonY + ((buttonHeight + buttonGap) * 3);
     gameMenuUi.soundButton.width = buttonWidth;
     gameMenuUi.soundButton.height = buttonHeight;

     gameMenuUi.backButton.x = buttonX;
     gameMenuUi.backButton.y = panelY + panelHeight - 70;
     gameMenuUi.backButton.width = buttonWidth;
     gameMenuUi.backButton.height = 44;
}

export function isPointInsideMenuPanel(x, y) {
     return isPointInsideRect(x, y, gameMenuUi.panel);
}


// NOTE: OVERLAY SYSTEM

export function clearGameOverlay() {
     setGameOverlayText("");
     setGameOverlaySubtext("");
     setGameOverlayTimer(0);
     setGameOverlayDuration(0);
}

export function showTimedGameOverlay(text, subtext = "", duration = startOverlayDuration) {
     setGameOverlayText(text);
     setGameOverlaySubtext(subtext);
     setGameOverlayTimer(duration);
     setGameOverlayDuration(duration);
}

export function showPersistentGameOverlay(text, subtext = "") {
     setGameOverlayText(text);
     setGameOverlaySubtext(subtext);
     setGameOverlayTimer(-1);
     setGameOverlayDuration(-1);
}

export function updateGameOverlayTimer() {
     if (gameOverlayTimer > 0) {
          const nextTimer = gameOverlayTimer - 1;
          setGameOverlayTimer(nextTimer);

          if (nextTimer === 0) {
               clearGameOverlay();
          }
     }
}

export function getGameOverlayAlpha() {
     if (!gameOverlayText) return 0;

     if (gameOverlayTimer < 0 || gameOverlayDuration < 0) return 1;

     const elapsed = gameOverlayDuration - gameOverlayTimer;
     const fadeIn = Math.min(1, elapsed / overlayFadeFrames);
     const fadeOut = Math.min(1, gameOverlayTimer / overlayFadeFrames);

     return Math.max(0, Math.min(1, Math.min(fadeIn, fadeOut)));
}


// NOTE: PAUSE SYNC

export function syncPauseOverlay() {
     const shouldShow =
          gameStarted &&
          gamePaused &&
          !gameMenuOpen &&
          !gameOver &&
          !gameWon;

     if (shouldShow) {
          showPersistentGameOverlay("PAUSED", "Press ⏯ to continue.");
          return;
     }

     if (
          gameOverlayText === "PAUSED" &&
          (!gamePaused || gameMenuOpen || gameOver || gameWon)
     ) {
          clearGameOverlay();
     }
}


// NOTE: UI DRAW FUNCTIONS
// Used by render.js

export function drawScore() {
     if (!miniGameCtx) return;

     miniGameCtx.save();
     miniGameCtx.fillStyle = "#ffffff";
     miniGameCtx.font = "18px Arial, Helvetica, sans-serif";
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillText(`Score: ${sparkleScore}`, 12, 12);
     miniGameCtx.restore();
}

export function drawHealth() {
     if (!miniGameCtx) return;

     miniGameCtx.save();
     miniGameCtx.fillStyle = "#ffffff";
     miniGameCtx.font = "18px Arial, Helvetica, sans-serif";
     miniGameCtx.textAlign = "right";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillText(`HP: ${playerHealth}`, miniGameWidth - 12, 12);
     miniGameCtx.restore();
}

export function drawTouchJoystick() {
     if (!miniGameCtx) return;

     const j = touchControls.joystick;

     miniGameCtx.save();
     miniGameCtx.globalAlpha = 0.3;

     miniGameCtx.beginPath();
     miniGameCtx.arc(j.centerX, j.centerY, j.baseRadius, 0, Math.PI * 2);
     miniGameCtx.fillStyle = "#888";
     miniGameCtx.fill();

     miniGameCtx.beginPath();
     miniGameCtx.arc(
          j.centerX + j.knobX,
          j.centerY + j.knobY,
          j.thumbRadius,
          0,
          Math.PI * 2
     );
     miniGameCtx.fillStyle = "#ccc";
     miniGameCtx.fill();

     miniGameCtx.restore();
}

export function drawTouchButtons() {
     if (!miniGameCtx) return;

     const left = touchControls.leftButton;
     const right = touchControls.rightButton;

     miniGameCtx.save();
     miniGameCtx.globalAlpha = 0.4;

     miniGameCtx.fillStyle = "#aaa";
     miniGameCtx.fillRect(left.x, left.y, left.width, left.height);
     miniGameCtx.fillRect(right.x, right.y, right.width, right.height);

     miniGameCtx.fillStyle = "#000";
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.font = "18px Arial, Helvetica, sans-serif";

     miniGameCtx.fillText(
          left.label,
          left.x + left.width / 2,
          left.y + left.height / 2
     );

     miniGameCtx.fillText(
          right.label,
          right.x + right.width / 2,
          right.y + right.height / 2
     );

     miniGameCtx.restore();
}

export function drawMenuOverlay() {
     if (!miniGameCtx || !gameMenuOpen) return;

     miniGameCtx.save();
     miniGameCtx.globalAlpha = 0.92;

     miniGameCtx.fillStyle = "rgba(0, 0, 0, 0.85)";
     miniGameCtx.fillRect(
          gameMenuUi.panel.x,
          gameMenuUi.panel.y,
          gameMenuUi.panel.width,
          gameMenuUi.panel.height
     );

     miniGameCtx.strokeStyle = "#ffffff";
     miniGameCtx.lineWidth = 2;
     miniGameCtx.strokeRect(
          gameMenuUi.panel.x,
          gameMenuUi.panel.y,
          gameMenuUi.panel.width,
          gameMenuUi.panel.height
     );

     miniGameCtx.fillStyle = "#ffffff";
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "top";

     miniGameCtx.font = "26px Arial, Helvetica, sans-serif";
     miniGameCtx.fillText(
          "MENU",
          gameMenuUi.panel.x + (gameMenuUi.panel.width / 2),
          gameMenuUi.panel.y + 18
     );

     if (gameMenuView === "main") {
          drawMenuButton(gameMenuUi.newGameButton, "New Game");
          drawMenuButton(gameMenuUi.instructionsButton, "Instructions");
          drawMenuButton(gameMenuUi.difficultyButton, `Difficulty: ${getCurrentDifficultyLabel()}`);
          drawMenuButton(gameMenuUi.soundButton, `Sound: ${getCurrentSoundLabel()}`);
     } else if (gameMenuView === "instructions") {
          drawInstructionsText();
     }

     drawMenuButton(gameMenuUi.backButton, "Back");

     miniGameCtx.restore();
}

function drawMenuButton(button, label) {
     miniGameCtx.save();

     miniGameCtx.fillStyle = "rgba(255, 255, 255, 0.12)";
     miniGameCtx.fillRect(button.x, button.y, button.width, button.height);

     miniGameCtx.strokeStyle = "#ffffff";
     miniGameCtx.lineWidth = 1.5;
     miniGameCtx.strokeRect(button.x, button.y, button.width, button.height);

     miniGameCtx.fillStyle = "#ffffff";
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.font = "18px Arial, Helvetica, sans-serif";
     miniGameCtx.fillText(
          label,
          button.x + (button.width / 2),
          button.y + (button.height / 2)
     );

     miniGameCtx.restore();
}

function drawInstructionsText() {
     miniGameCtx.save();

     miniGameCtx.fillStyle = "#ffffff";
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.font = "16px Arial, Helvetica, sans-serif";

     const textX = gameMenuUi.panel.x + 24;
     let textY = gameMenuUi.panel.y + 86;
     const lineGap = 26;

     miniGameCtx.fillText("Move with WASD, arrow keys, or the joystick.", textX, textY);
     textY += lineGap;
     miniGameCtx.fillText("Collect sparkles to gain score and heal.", textX, textY);
     textY += lineGap;
     miniGameCtx.fillText("Avoid obstacles or you lose health.", textX, textY);
     textY += lineGap;
     miniGameCtx.fillText("Fill your hearts to win the round.", textX, textY);

     miniGameCtx.restore();
}

export function drawGameStatusOverlay() {
     if (!miniGameCtx || !gameOverlayText) return;

     const alpha = getGameOverlayAlpha();

     miniGameCtx.save();
     miniGameCtx.globalAlpha = alpha;

     miniGameCtx.fillStyle = "#ffffff";
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";

     miniGameCtx.font = "36px Arial, Helvetica, sans-serif";
     miniGameCtx.fillText(gameOverlayText, miniGameWidth / 2, miniGameHeight / 2);

     if (gameOverlaySubtext) {
          miniGameCtx.font = "16px Arial, Helvetica, sans-serif";
          miniGameCtx.fillText(
               gameOverlaySubtext,
               miniGameWidth / 2,
               miniGameHeight / 2 + 30
          );
     }

     miniGameCtx.restore();
}