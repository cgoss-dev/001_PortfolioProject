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
     maxPlayerHealth,
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
     updateTouchControlBounds,
     resetTouchControls
} from "./input.js";

import {
     difficultyOptions,
     startOverlayDuration,
     overlayFadeFrames,
     getUiFonts,
     getUiColors,
     getUiSizes,
     getGlowSettings
} from "./theme.js";

import {
     resetPlayerPosition
} from "./systems/player.js";

// NOTE: SHARED DRAW HELPERS

function getUiTheme() {
     return {
          fonts: getUiFonts(),
          colors: getUiColors(),
          sizes: getUiSizes(),
          glow: getGlowSettings()
     };
}

function isPointInsideRect(x, y, rect) {
     return (
          x >= rect.x &&
          x <= rect.x + rect.width &&
          y >= rect.y &&
          y <= rect.y + rect.height
     );
}

function drawRoundedRect(x, y, width, height, radius) {
     const r = Math.min(radius, width / 2, height / 2);

     miniGameCtx.beginPath();
     miniGameCtx.moveTo(x + r, y);
     miniGameCtx.lineTo(x + width - r, y);
     miniGameCtx.quadraticCurveTo(x + width, y, x + width, y + r);
     miniGameCtx.lineTo(x + width, y + height - r);
     miniGameCtx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
     miniGameCtx.lineTo(x + r, y + height);
     miniGameCtx.quadraticCurveTo(x, y + height, x, y + height - r);
     miniGameCtx.lineTo(x, y + r);
     miniGameCtx.quadraticCurveTo(x, y, x + r, y);
     miniGameCtx.closePath();
}

function drawMenuButton(button, label, theme) {
     const { colors, sizes, fonts, glow } = theme;

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.buttonFill;
     miniGameCtx.strokeStyle = colors.buttonStroke;
     miniGameCtx.lineWidth = 1.5;

     drawRoundedRect(button.x, button.y, button.width, button.height, sizes.controlRadius);
     miniGameCtx.fill();
     miniGameCtx.stroke();

     miniGameCtx.fillStyle = colors.buttonText;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;
     miniGameCtx.font = `${sizes.menuButtonFont}px ${fonts.display}`;
     miniGameCtx.fillText(label, button.x + (button.width / 2), button.y + (button.height / 2) + 1);
     miniGameCtx.restore();
}

function drawControlButton(button, isPressed, theme) {
     const { colors, sizes, glow } = theme;

     miniGameCtx.save();
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = isPressed ? glow.uiStrongGlow : glow.uiMediumGlow;
     miniGameCtx.lineWidth = 1.6;
     miniGameCtx.fillStyle = isPressed ? colors.controlFillPressed : colors.controlFill;
     miniGameCtx.strokeStyle = colors.controlStroke;

     drawRoundedRect(button.x, button.y, button.width, button.height, sizes.controlRadius);
     miniGameCtx.fill();
     miniGameCtx.stroke();
     miniGameCtx.restore();
}

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
     const shouldShow = gameStarted && gamePaused && !gameMenuOpen && !gameOver && !gameWon;

     if (shouldShow) {
          showPersistentGameOverlay("PAUSED", "Press ⏯ to continue.");
          return;
     }

     if (gameOverlayText === "PAUSED" && (!gamePaused || gameMenuOpen || gameOver || gameWon)) {
          clearGameOverlay();
     }
}

// NOTE: UI DRAW FUNCTIONS

export function drawScore() {
     if (!miniGameCtx) return;

     const { colors, sizes, fonts, glow } = getUiTheme();

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.white;
     miniGameCtx.shadowColor = colors.scoreGlow;
     miniGameCtx.shadowBlur = glow.uiMediumGlow;
     miniGameCtx.font = `${sizes.scoreFont}px ${fonts.display}`;
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillText(`${sparkleScore}`, sizes.scoreX, sizes.scoreY);
     miniGameCtx.restore();
}

export function drawHealth() {
     if (!miniGameCtx) return;

     const { colors, sizes, fonts, glow } = getUiTheme();
     const totalWidth = maxPlayerHealth * sizes.heartGap;
     const startX = miniGameWidth - sizes.heartXPadding - totalWidth;

     miniGameCtx.save();
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.font = `${sizes.heartFont}px ${fonts.symbol}`;

     for (let i = 0; i < maxPlayerHealth; i += 1) {
          const x = startX + (i * sizes.heartGap);

          if (i < playerHealth) {
               miniGameCtx.shadowColor = colors.heartGlow;
               miniGameCtx.shadowBlur = glow.uiMediumGlow;
               miniGameCtx.fillStyle = colors.heartFull;
          } else {
               miniGameCtx.shadowBlur = 0;
               miniGameCtx.fillStyle = colors.heartEmpty;
          }

          miniGameCtx.fillText("♥", x, sizes.heartY);
     }

     miniGameCtx.restore();
}

export function drawTouchJoystick() {
     if (!miniGameCtx) return;

     const { colors, glow } = getUiTheme();
     const j = touchControls.joystick;

     miniGameCtx.save();
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiMediumGlow;

     miniGameCtx.beginPath();
     miniGameCtx.arc(j.centerX, j.centerY, j.baseRadius, 0, Math.PI * 2);
     miniGameCtx.fillStyle = colors.joystickOuter;
     miniGameCtx.fill();
     miniGameCtx.lineWidth = 1.5;
     miniGameCtx.strokeStyle = colors.joystickStroke;
     miniGameCtx.stroke();

     miniGameCtx.beginPath();
     miniGameCtx.arc(j.centerX, j.centerY, j.baseRadius * 0.52, 0, Math.PI * 2);
     miniGameCtx.fillStyle = "rgba(255, 255, 255, 0.06)";
     miniGameCtx.fill();

     miniGameCtx.beginPath();
     miniGameCtx.arc(j.centerX + j.knobX, j.centerY + j.knobY, j.thumbRadius, 0, Math.PI * 2);
     miniGameCtx.fillStyle = colors.joystickInner;
     miniGameCtx.fill();
     miniGameCtx.lineWidth = 1.2;
     miniGameCtx.strokeStyle = colors.joystickStroke;
     miniGameCtx.stroke();

     miniGameCtx.restore();
}

export function drawTouchButtons() {
     if (!miniGameCtx) return;

     const theme = getUiTheme();
     const { colors, fonts, glow } = theme;
     const left = touchControls.leftButton;
     const right = touchControls.rightButton;

     drawControlButton(left, left.isPressed, theme);
     drawControlButton(right, right.isPressed, theme);

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.controlText;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     miniGameCtx.font = `26px ${fonts.symbol}`;
     miniGameCtx.fillText(left.label, left.x + left.width / 2, left.y + left.height / 2 + 1);

     miniGameCtx.font = `22px ${fonts.symbol}`;
     miniGameCtx.fillText(right.label, right.x + right.width / 2, right.y + right.height / 2 + 1);
     miniGameCtx.restore();
}

export function drawMenuOverlay() {
     if (!miniGameCtx || !gameMenuOpen) return;

     const theme = getUiTheme();
     const { colors, sizes, fonts, glow } = theme;

     miniGameCtx.save();
     miniGameCtx.globalAlpha = 0.95;
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiStrongGlow;

     drawRoundedRect(gameMenuUi.panel.x, gameMenuUi.panel.y, gameMenuUi.panel.width, gameMenuUi.panel.height, 24);
     miniGameCtx.fillStyle = colors.panelFill;
     miniGameCtx.fill();

     miniGameCtx.shadowBlur = 0;
     miniGameCtx.strokeStyle = colors.panelStroke;
     miniGameCtx.lineWidth = 2;
     drawRoundedRect(gameMenuUi.panel.x, gameMenuUi.panel.y, gameMenuUi.panel.width, gameMenuUi.panel.height, 24);
     miniGameCtx.stroke();

     miniGameCtx.fillStyle = colors.white;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.shadowColor = colors.overlayGlow;
     miniGameCtx.shadowBlur = glow.uiMediumGlow;
     miniGameCtx.font = `${sizes.menuTitleFont}px ${fonts.display}`;
     miniGameCtx.fillText("Menu", gameMenuUi.panel.x + (gameMenuUi.panel.width / 2), gameMenuUi.panel.y + 14);

     if (gameMenuView === "main") {
          drawMenuButton(gameMenuUi.newGameButton, "New Game", theme);
          drawMenuButton(gameMenuUi.instructionsButton, "Instructions", theme);
          drawMenuButton(gameMenuUi.difficultyButton, `Difficulty: ${getCurrentDifficultyLabel()}`, theme);
          drawMenuButton(gameMenuUi.soundButton, `Sound: ${getCurrentSoundLabel()}`, theme);
     } else if (gameMenuView === "instructions") {
          miniGameCtx.shadowBlur = 0;
          miniGameCtx.fillStyle = colors.softWhite;
          miniGameCtx.textAlign = "left";
          miniGameCtx.textBaseline = "top";
          miniGameCtx.font = `16px ${fonts.body}`;

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
     }

     drawMenuButton(gameMenuUi.backButton, "Back", theme);
     miniGameCtx.restore();
}

export function drawGameStatusOverlay() {
     if (!miniGameCtx || !gameOverlayText) return;

     const { colors, sizes, fonts, glow } = getUiTheme();
     const alpha = getGameOverlayAlpha();

     miniGameCtx.save();
     miniGameCtx.globalAlpha = alpha;
     miniGameCtx.fillStyle = colors.white;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.overlayGlow;
     miniGameCtx.shadowBlur = glow.uiStrongGlow;
     miniGameCtx.font = `${sizes.overlayTitleFont}px ${fonts.display}`;
     miniGameCtx.fillText(gameOverlayText, miniGameWidth / 2, miniGameHeight / 2);

     if (gameOverlaySubtext) {
          miniGameCtx.shadowBlur = glow.uiSoftGlow;
          miniGameCtx.font = `${sizes.overlaySubFont}px ${fonts.body}`;
          miniGameCtx.fillText(gameOverlaySubtext, miniGameWidth / 2, miniGameHeight / 2 + 34);
     }

     miniGameCtx.restore();
}






// NOTE: GAME THEME
// Because Canvas cant read CSS.
// Pure configuration + CSS-driven visuals.
// Does NOT hold runtime game state anymore.

export function getUiFonts() {
     return {
          display: '"Bungee Shade", cursive',
          body: '"Noto Sans Mono", monospace',
          symbol: '"Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif'
     };
}
export const difficultyOptions = ["Easy", "Normal", "Hard"];

export const startOverlayDuration = 120;
export const overlayFadeFrames = 30;

export const sparkleSpawnDelay = 50;
export const sparkleSpawnCap = 25;

export const obstacleSpawnDelay = 120;
export const obstacleSpawnCap = 10;

// NOTE: CSS HELPERS

export function getCssValue(variableName) {
     return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

export function getCssNumber(variableName, fallback = 0) {
     const rawValue = getCssValue(variableName);
     const value = Number(rawValue);
     return Number.isNaN(value) ? fallback : value;
}

export function getCssColor(variableName, fallback = "#ffffff") {
     const value = getCssValue(variableName);
     return value || fallback;
}

// NOTE: GLOW SETTINGS

export function getGlowSettings() {
     return {
          bgParticleBlur: getCssNumber("--glow-bg-particle-blur", 12),
          gameParticleBlur: getCssNumber("--glow-game-particle-blur", 16)
     };
}

// NOTE: PARTICLE SETTINGS

export function getGameParticleSettings() {
     return {
          particleSizeMin: getCssNumber("--game-particle-size-min", 16),
          particleSizeMax: getCssNumber("--game-particle-size-max", 26),
          burstParticleCount: getCssNumber("--burst-particle-count", 10)
     };
}

// NOTE: COLOR SYSTEM

export function getRainbowPalette() {
     return [
          getCssColor("--rainbow-pink"),
          getCssColor("--rainbow-red"),
          getCssColor("--rainbow-yellow"),
          getCssColor("--rainbow-green"),
          getCssColor("--rainbow-blue")
     ].filter(Boolean);
}

export function createColorEngine(colors) {
     let index = 0;

     return {
          next() {
               if (!colors.length) return "#ffffff";
               const color = colors[index % colors.length];
               index++;
               return color;
          }
     };
}