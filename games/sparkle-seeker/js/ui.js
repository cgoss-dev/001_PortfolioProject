// NOTE: UI STATE / MENU / OVERLAY HELPERS
// Handles non-render UI behavior for the mini-game.
// This file owns:
// - menu labels
// - menu layout bounds
// - menu hit helpers
// - overlay text/timer logic
// - pause overlay sync

import {
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
     setGameMenuOpen,
     setGameMenuView,
     setMusicEnabled,
     setSoundEffectsEnabled,
     setDifficultyIndex,
     setGameOverlayText,
     setGameOverlaySubtext,
     setGameOverlayTimer,
     setGameOverlayDuration
} from "./state.js";

import {
     difficultyOptions,
     startOverlayDuration,
     overlayFadeFrames
} from "./theme.js";

import {
     isPointInsideRect
} from "./input.js";

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
          setGameOverlayTimer(gameOverlayTimer - 1);

          if (gameOverlayTimer - 1 === 0) {
               clearGameOverlay();
          }
     }
}

export function getGameOverlayAlpha() {
     if (!gameOverlayText) {
          return 0;
     }

     if (gameOverlayTimer < 0 || gameOverlayDuration < 0) {
          return 1;
     }

     const elapsed = gameOverlayDuration - gameOverlayTimer;
     const fadeInAlpha = Math.min(1, elapsed / overlayFadeFrames);
     const fadeOutAlpha = Math.min(1, gameOverlayTimer / overlayFadeFrames);

     return Math.max(0, Math.min(1, Math.min(fadeInAlpha, fadeOutAlpha)));
}

export function syncPauseOverlay() {
     const shouldShowPausedOverlay =
          gameStarted &&
          gamePaused &&
          !gameMenuOpen &&
          !gameOver &&
          !gameWon;

     if (shouldShowPausedOverlay) {
          showPersistentGameOverlay("PAUSED", "Press \u23EF\uFE0E to continue.");
          return;
     }

     if (
          gameOverlayText === "PAUSED" &&
          (!gamePaused || gameMenuOpen || gameOver || gameWon)
     ) {
          clearGameOverlay();
     }
}