// NOTE: UI / MENU / OVERLAY / STARTUP
// This file is the game entry file loaded by the page.
//
// It owns:
// - canvas size syncing
// - round/startup flow
// - menu layout + menu helpers
// - overlay state helpers
// - update orchestration
// - draw orchestration
// - game UI drawing
//
// Shared visual values come from the root CSS through window.SiteTheme.

import {
     miniGameCanvas,
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
     setMiniGameSize,

     resetGameState
} from "./state.js";

import {
     bindKeyboardInput,
     bindPointerInput,
     bindResizeHandler,
     updatePauseButtonState,
     updateTouchControlBounds,
     resetTouchControls
} from "./input.js";

import {
     resetPlayerPosition,
     resetEntityColorCycle,

     updatePlayer,
     updatePlayerFaceState,
     updateSparkleSpawns,
     updateObstacleSpawns,
     updateSparkles,
     updateObstacles,
     updateCollisionBursts,
     collectSparkles,
     hitObstacles,

     drawPlayer,
     drawSparkles,
     drawObstacles,
     drawCollisionBursts
} from "./entities.js";

// ==================================================
// UI CONSTANTS
// ==================================================

export const difficultyOptions = ["Easy", "Normal", "Hard"];
export const startOverlayDuration = 120;
export const overlayFadeFrames = 30;

// ==================================================
// CSS HELPERS
// ==================================================

const siteTheme = window.SiteTheme;

function getCssColor(variableName, fallback = "#ffffff") {
     return siteTheme?.getCssColor?.(variableName, fallback) || fallback;
}

function getCssNumber(variableName, fallback = 0) {
     return siteTheme?.getCssNumber?.(variableName, fallback) ?? fallback;
}

// ==================================================
// SHARED UI THEME
// ==================================================

function getUiTheme() {
     return {
          fonts: {
               display: '"Bungee Shade", cursive',
               body: '"Noto Sans Mono", monospace',
               symbol: '"Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif'
          },

          colors: {
               white: getCssColor("--text-color", "#ffffff"),
               softWhite: "rgba(255, 255, 255, 0.72)",

               accent: getCssColor("--accent-color", "#ea76cb"),
               panelFill: "rgba(0, 0, 0, 0.88)",
               panelStroke: getCssColor("--canvasboard-border-color", getCssColor("--accent-color", "#ea76cb")),

               buttonFill: "rgba(255, 255, 255, 0.05)",
               buttonStroke: getCssColor("--canvasboard-border-color", getCssColor("--accent-color", "#ea76cb")),
               buttonText: getCssColor("--text-color", "#ffffff"),

               controlFill: "rgba(255, 255, 255, 0.08)",
               controlFillPressed: "rgba(255, 255, 255, 0.18)",
               controlStroke: getCssColor("--accent-color", "#ea76cb"),
               controlText: getCssColor("--text-color", "#ffffff"),
               controlGlow: getCssColor("--accent-color", "#ea76cb"),

               overlayGlow: getCssColor("--accent-color", "#ea76cb"),
               scoreGlow: getCssColor("--accent-color", "#ea76cb"),

               joystickOuter: "rgba(255, 255, 255, 0.05)",
               joystickInner: "rgba(255, 255, 255, 0.18)",
               joystickStroke: getCssColor("--accent-color", "#ea76cb"),

               heartFull: "#ea76cb",
               heartGlow: "#ea76cb"
          },

          sizes: {
               scoreFont: 26,
               scoreX: 12,
               scoreY: 12,

               heartFont: 18,
               heartGap: 16,
               heartY: 12,
               heartXPadding: 12,

               overlayTitleFont: 36,
               overlaySubFont: 18,

               menuTitleFont: 28,
               menuButtonFont: 18,

               controlRadius: getCssNumber("--canvasboard-radius", 12)
          },

          glow: {
               uiSoftGlow: getCssNumber("--glow-bg-particle-blur", 10),
               uiMediumGlow: getCssNumber("--glow-game-particle-blur", 16),
               uiStrongGlow: getCssNumber("--glow-game-particle-blur", 16) * 1.35
          }
     };
}

// ==================================================
// SHARED DRAW HELPERS
// ==================================================

function isPointInsideRect(x, y, rect) {
     return (
          x >= rect.x &&
          x <= rect.x + rect.width &&
          y >= rect.y &&
          y <= rect.y + rect.height
     );
}

function drawRoundedRect(x, y, width, height, radius) {
     if (!miniGameCtx) {
          return;
     }

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
     if (!miniGameCtx) {
          return;
     }

     const { colors, sizes, fonts, glow } = theme;

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.buttonFill;
     miniGameCtx.strokeStyle = colors.buttonStroke;
     miniGameCtx.lineWidth = 1.5;
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     drawRoundedRect(button.x, button.y, button.width, button.height, sizes.controlRadius);
     miniGameCtx.fill();
     miniGameCtx.stroke();

     miniGameCtx.fillStyle = colors.buttonText;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;
     miniGameCtx.font = `${sizes.menuButtonFont}px ${fonts.body}`;
     miniGameCtx.fillText(label, button.x + (button.width / 2), button.y + (button.height / 2) + 1);
     miniGameCtx.restore();
}

function drawControlButton(button, isPressed, theme) {
     if (!miniGameCtx) {
          return;
     }

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

// ==================================================
// BACKGROUND / MASTER DRAW HELPERS
// ==================================================

function drawMiniGameBackground() {
     if (!miniGameCtx) {
          return;
     }

     miniGameCtx.clearRect(0, 0, miniGameWidth, miniGameHeight);
     miniGameCtx.fillStyle = "rgba(0, 0, 0, 0.75)";
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);
}

// ==================================================
// CANVAS
// ==================================================

export function resizeMiniGameCanvasFromCss() {
     if (!miniGameCanvas || !miniGameCtx) {
          return;
     }

     const rect = miniGameCanvas.getBoundingClientRect();
     const dpr = window.devicePixelRatio || 1;

     miniGameCanvas.width = Math.round(rect.width * dpr);
     miniGameCanvas.height = Math.round(rect.height * dpr);
     miniGameCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

     setMiniGameSize(rect.width, rect.height);
}

export function updateMiniGameCanvasSize() {
     resizeMiniGameCanvasFromCss();
     updateTouchControlBounds();
     updateMenuUiBounds();
}

// ==================================================
// ROUNDS
// ==================================================

export function startNewGameRound() {
     resetGameState();
     resetTouchControls();
     resetEntityColorCycle();

     updateMiniGameCanvasSize();
     resetPlayerPosition();
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

// ==================================================
// MENU
// ==================================================

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
     const next = !(musicEnabled && soundEffectsEnabled);
     setMusicEnabled(next);
     setSoundEffectsEnabled(next);
}

export function updateMenuUiBounds() {
     const panelWidth = Math.max(300, Math.min(miniGameWidth * 0.66, 420));
     const panelHeight = Math.max(320, Math.min(miniGameHeight * 0.78, 430));
     const panelX = (miniGameWidth - panelWidth) / 2;
     const panelY = (miniGameHeight - panelHeight) / 2;

     gameMenuUi.panel.x = panelX;
     gameMenuUi.panel.y = panelY;
     gameMenuUi.panel.width = panelWidth;
     gameMenuUi.panel.height = panelHeight;

     const sidePadding = 20;
     const buttonX = panelX + sidePadding;
     const buttonWidth = panelWidth - (sidePadding * 2);

     // Smaller buttons so they fit cleanly inside the menu.
     const buttonHeight = 42;
     const buttonGap = 10;
     const firstButtonY = panelY + 74;

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
     gameMenuUi.backButton.y = panelY + panelHeight - 58;
     gameMenuUi.backButton.width = buttonWidth;
     gameMenuUi.backButton.height = 38;
}

export function isPointInsideMenuPanel(x, y) {
     return isPointInsideRect(x, y, gameMenuUi.panel);
}

// ==================================================
// OVERLAY SYSTEM
// ==================================================

export function clearGameOverlay() {
     setGameOverlayText("");
     setGameOverlaySubtext("");
     setGameOverlayTimer(0);
     setGameOverlayDuration(0);
}

export function showTimedGameOverlay(text, sub = "", duration = startOverlayDuration) {
     setGameOverlayText(text);
     setGameOverlaySubtext(sub);
     setGameOverlayTimer(duration);
     setGameOverlayDuration(duration);
}

export function showPersistentGameOverlay(text, sub = "") {
     setGameOverlayText(text);
     setGameOverlaySubtext(sub);
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

// ==================================================
// PAUSE SYNC
// ==================================================

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

// ==================================================
// GAME UPDATE / DRAW
// ==================================================

export function updateGame() {
     updatePauseButtonState();
     updateGameOverlayTimer();
     syncPauseOverlay();

     if (!gameStarted || gamePaused || gameMenuOpen || gameOver || gameWon) {
          return;
     }

     updatePlayer();
     updatePlayerFaceState();

     updateSparkleSpawns();
     updateObstacleSpawns();

     updateSparkles();
     updateObstacles();
     updateCollisionBursts();

     collectSparkles();
     hitObstacles();

     if (playerHealth <= 0) {
          setGameOver(true);
          setGameWon(false);
          setGamePaused(true);
          setGameMenuOpen(false);
          setGameMenuView("main");
          resetTouchControls();
          showPersistentGameOverlay("TRY AGAIN!", "Press ⏯ to play again.");
          return;
     }

     if (playerHealth >= maxPlayerHealth) {
          setGameWon(true);
          setGameOver(false);
          setGamePaused(true);
          setGameMenuOpen(false);
          setGameMenuView("main");
          resetTouchControls();
          showPersistentGameOverlay("WIN!", "Press ⏯ to play again.");
     }
}

export function drawGame() {
     drawMiniGameBackground();

     drawSparkles();
     drawObstacles();
     drawCollisionBursts();
     drawPlayer();

     drawScore();
     drawHealth();
     drawTouchJoystick();
     drawTouchButtons();
     drawMenuOverlay();
     drawGameStatusOverlay();
}

function gameLoop() {
     updateGame();
     drawGame();
     requestAnimationFrame(gameLoop);
}

// ==================================================
// UI DRAW FUNCTIONS
// ==================================================

function drawScore() {
     if (!miniGameCtx) {
          return;
     }

     miniGameCtx.save();

     const formattedScore = String(sparkleScore).padStart(3, "0");

     miniGameCtx.font = '30px "Bungee Shade", cursive';
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = "#ffffff";
     miniGameCtx.shadowColor = "rgba(255, 255, 255, 0.35)";
     miniGameCtx.shadowBlur = 8;

     miniGameCtx.fillText(formattedScore, 16, 14);

     miniGameCtx.restore();
}

function drawHealth() {
     if (!miniGameCtx) {
          return;
     }

     miniGameCtx.save();

     const filledHeart = "♥";
     const emptyHeart = "♡";
     const heartsPerRow = 5;

     let topRow = "";
     let bottomRow = "";

     // TOP ROW: hearts 10 → 6
     for (let i = maxPlayerHealth - 1; i >= heartsPerRow; i -= 1) {
          if (i < playerHealth) {
               topRow += filledHeart;
          } else {
               topRow += emptyHeart;
          }
     }

     // BOTTOM ROW: hearts 5 → 1
     for (let i = heartsPerRow - 1; i >= 0; i -= 1) {
          if (i < playerHealth) {
               bottomRow += filledHeart;
          } else {
               bottomRow += emptyHeart;
          }
     }

     miniGameCtx.font = '20px "Noto Sans Mono", monospace';
     miniGameCtx.textAlign = "right";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = "#ea76cb";
     miniGameCtx.shadowColor = "#ea76cb";
     miniGameCtx.shadowBlur = 8;

     const healthX = miniGameWidth - 16;
     const healthY = 15;
     const rowGap = 15;

     miniGameCtx.fillText(topRow, healthX, healthY);
     miniGameCtx.fillText(bottomRow, healthX, healthY + rowGap);

     miniGameCtx.restore();
}

export function drawTouchJoystick() {
     if (!miniGameCtx) {
          return;
     }

     const { colors, glow } = getUiTheme();
     const joystick = touchControls.joystick;

     miniGameCtx.save();
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiMediumGlow;

     // JOYSTICK BASE

     miniGameCtx.beginPath();
     miniGameCtx.arc(joystick.centerX, joystick.centerY, joystick.baseRadius, 0, Math.PI * 2);
     miniGameCtx.fillStyle = colors.joystickOuter;
     miniGameCtx.fill();
     miniGameCtx.lineWidth = 1.5;
     miniGameCtx.strokeStyle = colors.joystickStroke;
     miniGameCtx.stroke();

     miniGameCtx.beginPath();
     miniGameCtx.arc(joystick.centerX, joystick.centerY, joystick.baseRadius * 0.52, 0, Math.PI * 2);
     miniGameCtx.fillStyle = "rgba(255, 255, 255, 0.06)";
     miniGameCtx.fill();

     // WASD LABELS

     miniGameCtx.save();

     miniGameCtx.fillStyle = colors.controlText;
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = 6;

     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.font = `${joystick.baseRadius * 0.28}px "Noto Sans Mono", monospace`;

     const offset = joystick.baseRadius * 0.7;
     const cx = joystick.centerX;
     const cy = joystick.centerY;

     miniGameCtx.fillText("W", cx, cy - offset);
     miniGameCtx.fillText("A", cx - offset, cy);
     miniGameCtx.fillText("S", cx, cy + offset);
     miniGameCtx.fillText("D", cx + offset, cy);

     miniGameCtx.restore();

     // ==================================================
     // JOYSTICK KNOB
     // ==================================================

     miniGameCtx.beginPath();
     miniGameCtx.arc(
          joystick.centerX + joystick.knobX,
          joystick.centerY + joystick.knobY,
          joystick.thumbRadius,
          0,
          Math.PI * 2
     );
     miniGameCtx.fillStyle = colors.joystickInner;
     miniGameCtx.fill();
     miniGameCtx.lineWidth = 1.2;
     miniGameCtx.strokeStyle = colors.joystickStroke;
     miniGameCtx.stroke();

     miniGameCtx.restore();
}

export function drawTouchButtons() {
     if (!miniGameCtx) {
          return;
     }

     const theme = getUiTheme();
     const { colors, fonts, glow } = theme;
     const leftButton = touchControls.leftButton;
     const rightButton = touchControls.rightButton;

     drawControlButton(leftButton, leftButton.isPressed, theme);
     drawControlButton(rightButton, rightButton.isPressed, theme);

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.controlText;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     miniGameCtx.font = `${leftButton.height * 0.42}px ${fonts.symbol}`; //REVIEW -  revisit button size
     miniGameCtx.fillText(leftButton.label, leftButton.x + leftButton.width / 2, leftButton.y + leftButton.height / 2 + 1);

     miniGameCtx.font = `${rightButton.height * 0.36}px ${fonts.symbol}`;
     miniGameCtx.fillText(rightButton.label, rightButton.x + rightButton.width / 2, rightButton.y + rightButton.height / 2 + 1);

     miniGameCtx.restore();
}

export function drawMenuOverlay() {
     if (!miniGameCtx || !gameMenuOpen) {
          return;
     }

     const theme = getUiTheme();
     const { colors, sizes, fonts, glow } = theme;

     miniGameCtx.save();
     miniGameCtx.globalAlpha = 1;
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiStrongGlow;

     drawRoundedRect(
          gameMenuUi.panel.x,
          gameMenuUi.panel.y,
          gameMenuUi.panel.width,
          gameMenuUi.panel.height,
          sizes.controlRadius
     );
     miniGameCtx.fillStyle = colors.panelFill;
     miniGameCtx.fill();

     miniGameCtx.shadowBlur = 0;
     miniGameCtx.strokeStyle = colors.panelStroke;
     miniGameCtx.lineWidth = 2;
     drawRoundedRect(
          gameMenuUi.panel.x,
          gameMenuUi.panel.y,
          gameMenuUi.panel.width,
          gameMenuUi.panel.height,
          sizes.controlRadius
     );
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
     if (!miniGameCtx || !gameOverlayText) {
          return;
     }

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

// ==================================================
// NOTE: STARTUP
// ==================================================

export function startSparkleSeeker() {
     resetGameState();
     resetTouchControls();
     resetEntityColorCycle();

     updateMiniGameCanvasSize();
     resetPlayerPosition();
     updateTouchControlBounds();
     updateMenuUiBounds();

     bindKeyboardInput();
     bindPointerInput();
     bindResizeHandler();

     gameLoop();
}

if (!miniGameCanvas || !miniGameCtx) {
     console.warn("Sparkle Seeker canvas not found.");
} else {
     startSparkleSeeker();
}