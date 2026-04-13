// NOTE: UI / MENU / OVERLAY / STARTUP
// Game entry file loaded by page.
//
// Owned here:
// - canvas size syncing
// - round/startup flow
// - menu layout + menu helpers
// - overlay state helpers
// - update orchestration
// - draw orchestration
// - game UI drawing
//
// Shared visual values pulled from root CSS through window.SiteTheme.

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

// UI CONSTANTS

export const difficultyOptions = ["Easy", "Normal", "Hard"];
export const startOverlayDuration = 120;
export const overlayFadeFrames = 30;

// CSS HELPERS

const siteTheme = window.SiteTheme;

function getCssColor(variableName, fallback = "#ffffff") {
     return siteTheme?.getCssColor?.(variableName, fallback) || fallback;
}

function getCssNumber(variableName, fallback = 0) {
     return siteTheme?.getCssNumber?.(variableName, fallback) ?? fallback;
}

// STRING VALUE HELPER
// Font-family values pulled from root CSS here.
function getCssString(variableName, fallback = "") {
     if (!document?.documentElement) {
          return fallback;
     }

     const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
     return value || fallback;
}

// PIXEL SIZE HELPER
// clamp()/rem values from root CSS resolved into px here for canvas text. Canvas needs a real number, not raw CSS text.
function getCssPixelSize(variableName, fallback = 16) {
     if (!document?.body) {
          return fallback;
     }

     const probe = document.createElement("span");
     probe.style.position = "absolute";
     probe.style.visibility = "hidden";
     probe.style.pointerEvents = "none";
     probe.style.fontSize = `var(${variableName})`;
     probe.textContent = "M";

     document.body.appendChild(probe);
     const resolved = parseFloat(getComputedStyle(probe).fontSize);
     document.body.removeChild(probe);

     return Number.isFinite(resolved) ? resolved : fallback;
}

// SHARED UI THEME

function getUiTheme() {
     return {
          fonts: {
               display: getCssString("--font-fancy", '"Bungee Shade", cursive'),
               body: getCssString("--font-body", '"Noto Sans Mono", monospace'),
               symbol: '"Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif'
          },

          colors: {
               white: getCssColor("--text-color", "#ffffff"),
               softWhite: getCssColor("--text-color-medium", "rgba(255, 255, 255, 0.75)"),

               accent: getCssColor("--accent-color", "#ea76cb"),
               panelFill: "rgba(0, 0, 0, 0.9)",

               // OUTLINE GROUP A
               // Menu popup outline + touch button outline + joystick knob outline.
               outlineStrong: getCssColor("--accent-color", "#ea76cb"),

               // OUTLINE GROUP B
               // Menu option button outline + joystick static circle outlines.
               outlineSoft: "rgba(255, 255, 255, 0.25)",

               panelStroke: getCssColor("--accent-color", "#ea76cb"),

               buttonFill: "rgba(255, 255, 255, 0.1)",
               buttonStroke: "rgba(255, 255, 255, 0.25)",
               buttonText: getCssColor("--text-color-medium", "#ffffff"),

               controlFill: "rgba(255, 255, 255, 0.1)",
               controlFillPressed: "rgba(255, 255, 255, 0.25)",
               controlStroke: getCssColor("--accent-color", "#ea76cb"),
               controlText: getCssColor("--text-color", "#ffffff"),

               controlGlow: getCssColor("--accent-color", "#ea76cb"),

               overlayGlow: getCssColor("--accent-color", "#ea76cb"),
               scoreGlow: getCssColor("--accent-color", "#ea76cb"),

               joystickOuter: "rgba(255, 255, 255, 0.1)",
               joystickInner: "rgba(255, 255, 255, 0.25)",
               joystickStroke: "rgba(255, 255, 255, 0.25)",

               heartFull: "#ea76cb",
               heartGlow: "#ea76cb"
          },

          sizes: {
               scoreFont: 26,
               scoreX: 10,
               scoreY: 10,

               heartFont: 18,
               heartGap: 16,
               heartY: 12,
               heartXPadding: 12,

               overlayTitleFont: 36,
               overlaySubFont: getCssPixelSize("--text-size-medium", 18),

               menuTitleFont: 0,
               menuButtonFont: getCssPixelSize("--text-size-small", 14),
               menuSmallFont: getCssPixelSize("--text-size-small", 14),

               controlRadius: getCssNumber("--canvasboard-radius", 12)
          },

          glow: {
               uiSoftGlow: getCssNumber("--glow-bg-particle-blur", 10),
               uiMediumGlow: getCssNumber("--glow-game-particle-blur", 16),
               uiStrongGlow: getCssNumber("--glow-game-particle-blur", 16) * 1.35
          }
     };
}

// SHARED DRAW HELPERS

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

// Center point reused for label and circle alignment here.
function getRectCenter(rect) {
     return {
          x: rect.x + (rect.width / 2),
          y: rect.y + (rect.height / 2)
     };
}

function drawMenuButton(button, label, theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, sizes, fonts, glow } = theme;
     const center = getRectCenter(button);

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.buttonFill;
     miniGameCtx.strokeStyle = colors.outlineSoft;
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

     // FONT STRING
     // Explicit normal weight used here so "Back" stays on body font consistently.
     miniGameCtx.font = `400 ${sizes.menuButtonFont}px ${fonts.body}`;
     miniGameCtx.fillText(label, center.x, center.y + 1);

     miniGameCtx.restore();
}

function drawControlButton(button, isPressed, theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, glow } = theme;
     const center = getRectCenter(button);
     const radius = button.width / 2;

     miniGameCtx.save();
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = isPressed ? glow.uiStrongGlow : glow.uiMediumGlow;

     miniGameCtx.beginPath();
     miniGameCtx.arc(center.x, center.y, radius, 0, Math.PI * 2);

     miniGameCtx.fillStyle = isPressed ? colors.controlFillPressed : colors.controlFill;
     miniGameCtx.fill();

     miniGameCtx.lineWidth = 1.5;
     miniGameCtx.strokeStyle = colors.outlineStrong;
     miniGameCtx.stroke();

     miniGameCtx.restore();
}

// BACKGROUND / MASTER DRAW HELPERS

function drawMiniGameBackground() {
     if (!miniGameCtx) {
          return;
     }

     miniGameCtx.clearRect(0, 0, miniGameWidth, miniGameHeight);
     miniGameCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);
}

// CANVAS

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

// ROUNDS

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

// MENU

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
     const panelWidth = Math.max(280, Math.min(miniGameWidth * 0.72, 400));
     const panelHeight = Math.max(280, Math.min(miniGameHeight * 0.72, 380));
     const panelX = (miniGameWidth - panelWidth) / 2;
     const panelY = (miniGameHeight - panelHeight) / 2;

     gameMenuUi.panel.x = panelX;
     gameMenuUi.panel.y = panelY;
     gameMenuUi.panel.width = panelWidth;
     gameMenuUi.panel.height = panelHeight;

     const sidePadding = 20;
     const buttonX = panelX + sidePadding;
     const buttonWidth = panelWidth - (sidePadding * 2);

     const buttonHeight = 38;
     const buttonGap = 10;
     const firstButtonY = panelY + 28;

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
     gameMenuUi.backButton.y = panelY + panelHeight - 50;
     gameMenuUi.backButton.width = buttonWidth;
     gameMenuUi.backButton.height = 34;
}

export function isPointInsideMenuPanel(x, y) {
     return isPointInsideRect(x, y, gameMenuUi.panel);
}

// OVERLAY SYSTEM

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

// PAUSE SYNC

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

// GAME UPDATE / DRAW

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

// UI DRAW FUNCTIONS

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

     miniGameCtx.fillText(formattedScore, 10, 12);

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

     // TOP ROW
     // Hearts 10 → 6.
     for (let i = maxPlayerHealth - 1; i >= heartsPerRow; i -= 1) {
          if (i < playerHealth) {
               topRow += filledHeart;
          } else {
               topRow += emptyHeart;
          }
     }

     // BOTTOM ROW
     // Hearts 5 → 1.
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

     const healthX = miniGameWidth - 10;
     const healthY = 10;
     const rowGap = 15;

     miniGameCtx.fillText(topRow, healthX, healthY);
     miniGameCtx.fillText(bottomRow, healthX, healthY + rowGap);

     miniGameCtx.restore();
}

export function drawTouchJoystick() {
     if (!miniGameCtx) {
          return;
     }

     const theme = getUiTheme();
     const { colors, glow, fonts, sizes } = theme;
     const joystick = touchControls.joystick;

     miniGameCtx.save();
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     // JOYSTICK BASE

     miniGameCtx.beginPath();
     miniGameCtx.arc(joystick.centerX, joystick.centerY, joystick.baseRadius, 0, Math.PI * 2);
     miniGameCtx.fillStyle = colors.joystickOuter;
     miniGameCtx.fill();
     miniGameCtx.lineWidth = 1.5;
     miniGameCtx.strokeStyle = colors.outlineSoft; // Joystick outer static circle.
     miniGameCtx.stroke();

     miniGameCtx.beginPath();
     miniGameCtx.arc(joystick.centerX, joystick.centerY, joystick.baseRadius * 0.52, 0, Math.PI * 2);
     miniGameCtx.fillStyle = "rgba(255, 255, 255, 0.01)";
     miniGameCtx.fill();
     miniGameCtx.lineWidth = 1.5;
     miniGameCtx.strokeStyle = colors.outlineSoft; // Joystick inner static circle.
     miniGameCtx.stroke();

     // WASD LABELS
     // Menu option font styling reused here. Small text size pulled from root CSS here.

     miniGameCtx.save();

     miniGameCtx.fillStyle = colors.controlText;
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = 6;

     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.font = `400 ${sizes.menuSmallFont}px ${fonts.body}`;

     const offset = joystick.baseRadius * 0.75;
     const cx = joystick.centerX;
     const cy = joystick.centerY;

     miniGameCtx.fillText("W", cx, cy - offset);
     miniGameCtx.fillText("A", cx - offset, cy);
     miniGameCtx.fillText("S", cx, cy + offset);
     miniGameCtx.fillText("D", cx + offset, cy);

     miniGameCtx.restore();

     // JOYSTICK KNOB

     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiMediumGlow;

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
     miniGameCtx.lineWidth = 2;
     miniGameCtx.strokeStyle = colors.outlineStrong;
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

     // BUTTON DRAW
     // Circular button rendering handled in drawControlButton.
     drawControlButton(leftButton, leftButton.isPressed, theme);
     drawControlButton(rightButton, rightButton.isPressed, theme);

     const leftCenter = getRectCenter(leftButton);
     const rightCenter = getRectCenter(rightButton);

     miniGameCtx.save();

     miniGameCtx.fillStyle = colors.controlText;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     // TEXT SIZE
     // Scaled from button size here for consistent visual balance.
     const leftFontSize = leftButton.height * 0.5;
     const rightFontSize = rightButton.height * 0.5;

     // LEFT BUTTON LABEL
     miniGameCtx.font = `${leftFontSize}px ${fonts.symbol}`;
     miniGameCtx.fillText(leftButton.label, leftCenter.x, leftCenter.y + 1.25);

     // RIGHT BUTTON LABEL
     miniGameCtx.font = `${rightFontSize}px ${fonts.symbol}`;
     miniGameCtx.fillText(rightButton.label, rightCenter.x, rightCenter.y + 1.15);

     miniGameCtx.restore();
}

export function drawMenuOverlay() {
     if (!miniGameCtx || !gameMenuOpen) {
          return;
     }

     const theme = getUiTheme();
     const { colors, fonts, glow, sizes } = theme;

     miniGameCtx.save();
     miniGameCtx.globalAlpha = 1;
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiStrongGlow;

     drawRoundedRect(
          gameMenuUi.panel.x,
          gameMenuUi.panel.y,
          gameMenuUi.panel.width,
          gameMenuUi.panel.height,
          theme.sizes.controlRadius
     );
     miniGameCtx.fillStyle = colors.panelFill;
     miniGameCtx.fill();

     miniGameCtx.shadowBlur = 0;
     miniGameCtx.strokeStyle = colors.outlineStrong;
     miniGameCtx.lineWidth = 2;
     drawRoundedRect(
          gameMenuUi.panel.x,
          gameMenuUi.panel.y,
          gameMenuUi.panel.width,
          gameMenuUi.panel.height,
          theme.sizes.controlRadius
     );
     miniGameCtx.stroke();

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
          miniGameCtx.font = `400 ${sizes.menuSmallFont}px ${fonts.body}`;

          const textX = gameMenuUi.panel.x + 24;
          let textY = gameMenuUi.panel.y + 34;
          const lineGap = 24;

          miniGameCtx.fillText("Move with arrows, WASD, or joystick.", textX, textY);
          textY += lineGap;
          miniGameCtx.fillText("Collect sparkles, avoid obstacles.", textX, textY);
          textY += lineGap;
          miniGameCtx.fillText("Max hearts to win.", textX, textY);
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
          miniGameCtx.font = `400 ${sizes.overlaySubFont}px ${fonts.body}`;
          miniGameCtx.fillText(gameOverlaySubtext, miniGameWidth / 2, miniGameHeight / 2 + 34);
     }

     miniGameCtx.restore();
}

// NOTE: STARTUP

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