// NOTE: GAME CORE
// This file is the shared "home base" for the whole mini-game.
// It stores shared state, core settings, utility helpers, and the main startup/update/draw loop.

// NOTE: IMPORTS

import {
     bindKeyboardInput,
     bindPointerInput,
     bindResizeHandler,
     updatePauseButtonState,
     updateTouchControlBounds
} from "./game-input.js";

import {
     resetPlayerPosition,
     updatePlayer,
     updatePlayerFaceState,
     updateSparkleSpawns,
     updateObstacleSpawns,
     updateSparkles,
     updateObstacles,
     updateCollisionBursts,
     collectSparkles,
     hitObstacles
} from "./game-entities.js";

import {
     drawMiniGameBackground,
     drawUiUnderlay,
     drawSparkles,
     drawObstacles,
     drawCollisionBursts,
     drawPlayer,
     drawScore,
     drawHealth,
     drawTouchJoystick,
     drawTouchButtons,
     drawMenuOverlay,
     drawGameStatusOverlay
} from "./game-render.js";

import {
     createColorEngine,
     getRainbowPalette
} from "./game-theme.js";

// NOTE: CANVAS

export const miniGameCanvas = document.getElementById("miniGameCanvas");
export const miniGameCtx = miniGameCanvas ? miniGameCanvas.getContext("2d") : null;

export let miniGameWidth = 0;
export let miniGameHeight = 0;

// NOTE: PLAYER

export const playerFaces = {
     neutral: "😐",
     sparkle: "😁",
     obstacle: "😫",
     maxHealth: "🤩",
     lowHealth: "😰",
     dead: "☠️"
};

export const player = {
     x: 0,
     y: 0,
     char: playerFaces.neutral,
     size: 54,
     speed: 2,
     radius: 30,
     sparkleFaceTimer: 0,
     // FIXME: Counts down how long the temporary sparkle / obstacle face should stay active.
};

export const playerBaseHealth = 3;
export const playerBaseSpeed = 2;
export const playerSpeedPerHeart = 0.5;

// NOTE: ARRAYS

export const keys = {};
export const sparkles = [];
export const obstacles = [];
export const collisionBursts = [];

// NOTE: TABLES

export const sparkleChars = ["✦", "✧"];
export const burstChars = ["✦", "✧", "·", "•"];

export const obstacleTypes = [
     { name: "affectSize", char: "☢\uFE0E", effect: ["playerGrow", "playerShrink"], penalty: 10 },
     { name: "affectSpeed", char: "⚡\uFE0E", effect: ["playerSlow", "objectSlow"], penalty: 10 },
     { name: "affectType", char: "⚠\uFE0E", effect: ["swapSparkleObjects"], penalty: 10 }
];

// NOTE: GAME STATE

export let sparkleScore = 0;
export let sparkleHealProgress = 0;

export let playerHealth = 3;
export const maxPlayerHealth = 10;

export let gameStarted = false;
export let gamePaused = true;

export let gameMenuOpen = false;
export let gameMenuView = "main"; // "main" | "instructions"

export let musicEnabled = true;
export let soundEffectsEnabled = true;

export let difficultyOptions = ["Easy", "Normal", "Hard"];
export let difficultyIndex = 1;

export let gameOver = false;
export let gameWon = false;

export let gameOverlayText = "";
export let gameOverlaySubtext = "";
export let gameOverlayTimer = 0;
export let gameOverlayDuration = 0;

export const startOverlayDuration = 120;
export const overlayFadeFrames = 30;

// NOTE: MENU UI
// Shared clickable bounds for the menu panel and buttons.

export const gameMenuUi = {
     panel: {
          x: 0,
          y: 0,
          width: 0,
          height: 0
     },
     newGameButton: {
          x: 0,
          y: 0,
          width: 0,
          height: 0
     },
     instructionsButton: {
          x: 0,
          y: 0,
          width: 0,
          height: 0
     },
     difficultyButton: {
          x: 0,
          y: 0,
          width: 0,
          height: 0
     },
     soundButton: {
          x: 0,
          y: 0,
          width: 0,
          height: 0
     },
     backButton: {
          x: 0,
          y: 0,
          width: 0,
          height: 0
     }
};

// NOTE: TOUCH CONTROLS

export const touchControls = {
     joystick: {
          centerX: 0,
          centerY: 0,
          baseRadius: 44,
          thumbRadius: 22,
          knobX: 0,
          knobY: 0,
          isActive: false,
          pointerId: null,
          inputX: 0,
          inputY: 0,
          deadZone: 0.18
     },
     leftButton: {
          x: 0,
          y: 0,
          width: 60,
          height: 60,
          isPressed: false,
          pointerId: null,
          label: "\u23EF\uFE0E" // Force unicode. ⏯
     },
     rightButton: {
          x: 0,
          y: 0,
          width: 60,
          height: 60,
          isPressed: false,
          pointerId: null,
          label: "\u2630\uFE0E" // Force unicode. ☰
     }
};

// NOTE: UI BUTTON STATE
// Kept because other files may still rely on this shared object idk yet

export const gameButton = {
     x: 0,
     y: 0,
     width: 0,
     height: 0,
     paddingX: 16,
     paddingY: 10,
     isPressed: false,
     pressTimer: 0
};

// NOTE: BIND FLAGS

export let pointerInputBound = false;
export let keyboardInputBound = false;
export let resizeHandlerBound = false;

// NOTE: TIMERS

export let sparkleSpawnTimer = 0;
export const sparkleSpawnDelay = 50;
export const sparkleSpawnCap = 25;

export let obstacleSpawnTimer = 0;
export const obstacleSpawnDelay = 120;
export const obstacleSpawnCap = 10;

export let gameSparkleColorEngine = null;

// NOTE: SETTERS

export function setPointerInputBound(v) { pointerInputBound = v; }
export function setKeyboardInputBound(v) { keyboardInputBound = v; }
export function setResizeHandlerBound(v) { resizeHandlerBound = v; }

export function setSparkleSpawnTimer(v) { sparkleSpawnTimer = v; }
export function setObstacleSpawnTimer(v) { obstacleSpawnTimer = v; }

export function setSparkleScore(v) { sparkleScore = v; }
export function addSparkleScore(v) { sparkleScore += v; }

export function setSparkleHealProgress(v) { sparkleHealProgress = v; }
export function addSparkleHealProgress(v) { sparkleHealProgress += v; }

export function setPlayerHealth(v) {
     playerHealth = Math.max(0, Math.min(maxPlayerHealth, v));
}

export function addPlayerHealth(v) {
     playerHealth = Math.max(0, Math.min(maxPlayerHealth, playerHealth + v));
}

export function setGameStarted(v) { gameStarted = v; }
export function setGamePaused(v) { gamePaused = v; }
export function setGameMenuOpen(v) { gameMenuOpen = v; }
export function setGameMenuView(v) { gameMenuView = v; }
export function setMusicEnabled(v) { musicEnabled = v; }
export function setSoundEffectsEnabled(v) { soundEffectsEnabled = v; }
export function setDifficultyIndex(v) { difficultyIndex = v; }

export function setGameOver(v) { gameOver = v; }
export function setGameWon(v) { gameWon = v; }

export function setGameOverlayText(v) { gameOverlayText = v; }
export function setGameOverlaySubtext(v) { gameOverlaySubtext = v; }
export function setGameOverlayTimer(v) { gameOverlayTimer = v; }
export function setGameOverlayDuration(v) { gameOverlayDuration = v; }

export function setGameSparkleColorEngine(v) { gameSparkleColorEngine = v; }

// NOTE: TOUCH SETTERS

export function setJoystickActive(v) { touchControls.joystick.isActive = v; }
export function setJoystickPointerId(v) { touchControls.joystick.pointerId = v; }
export function setJoystickKnobOffset(x, y) {
     touchControls.joystick.knobX = x;
     touchControls.joystick.knobY = y;
}
export function setJoystickInput(x, y) {
     touchControls.joystick.inputX = x;
     touchControls.joystick.inputY = y;
}

export function setLeftButtonPressed(v) { touchControls.leftButton.isPressed = v; }
export function setLeftButtonPointerId(v) { touchControls.leftButton.pointerId = v; }
export function setRightButtonPressed(v) { touchControls.rightButton.isPressed = v; }
export function setRightButtonPointerId(v) { touchControls.rightButton.pointerId = v; }

// NOTE: TOUCH HELPERS

export function resetJoystickState() {
     const j = touchControls.joystick;
     j.knobX = j.knobY = j.inputX = j.inputY = 0;
     j.isActive = false;
     j.pointerId = null;
}

export function resetTouchButtons() {
     touchControls.leftButton.isPressed = false;
     touchControls.leftButton.pointerId = null;
     touchControls.rightButton.isPressed = false;
     touchControls.rightButton.pointerId = null;
}

export function resetTouchControls() {
     resetJoystickState();
     resetTouchButtons();
}

export function isPointInsideCircle(x, y, cx, cy, r) {
     const dx = x - cx;
     const dy = y - cy;
     return Math.sqrt(dx * dx + dy * dy) <= r;
}

// NOTE: UTILITIES

export function randomItem(a) { return a[Math.floor(Math.random() * a.length)]; }
export function randomNumber(min, max) { return Math.random() * (max - min) + min; }

export function isCollidingWithSparkle(p, s) {
     const dx = p.x - s.x;
     const dy = p.y - s.y;
     return Math.sqrt(dx * dx + dy * dy) < p.radius + (s.size * 0.25);
}

export function isPointInsideRect(x, y, r) {
     return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
}

// NOTE: MENU HELPERS

export function getCurrentDifficultyLabel() {
     return difficultyOptions[difficultyIndex] || "Normal";
}

export function getCurrentSoundLabel() {
     return (musicEnabled && soundEffectsEnabled) ? "On" : "Off";
}

export function cycleDifficulty() {
     difficultyIndex = (difficultyIndex + 1) % difficultyOptions.length;
}

export function toggleAllSound() {
     const nextEnabled = !(musicEnabled && soundEffectsEnabled);
     musicEnabled = nextEnabled;
     soundEffectsEnabled = nextEnabled;
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

// NOTE: CANVAS SIZE

export function resizeMiniGameCanvasFromCss() {
     if (!miniGameCanvas || !miniGameCtx) return;

     const rect = miniGameCanvas.getBoundingClientRect();
     const dpr = window.devicePixelRatio || 1;

     miniGameCanvas.width = Math.round(rect.width * dpr);
     miniGameCanvas.height = Math.round(rect.height * dpr);
     miniGameCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

     miniGameWidth = rect.width;
     miniGameHeight = rect.height;
}

export function updateMiniGameCanvasSize() {
     resizeMiniGameCanvasFromCss();
     updateTouchControlBounds();
     updateMenuUiBounds();
}

// NOTE: PLAYER STATE

export function getDefaultPlayerFace() {
     if (playerHealth <= 0) return playerFaces.dead;
     if (playerHealth === maxPlayerHealth) return playerFaces.maxHealth;
     if (playerHealth <= 2) return playerFaces.lowHealth;
     return playerFaces.neutral;
}

export function updatePlayerSpeedFromHealth() {
     const diff = playerHealth - playerBaseHealth;
     player.speed = Math.max(0, playerBaseSpeed + (diff * playerSpeedPerHeart));
}

export function refreshPlayerStateFace() {
     player.char = getDefaultPlayerFace();
}

export function applyTemporaryPlayerFace(face, duration) {
     if (playerHealth <= 0 || playerHealth === maxPlayerHealth || playerHealth <= 2) {
          player.sparkleFaceTimer = 0;
          refreshPlayerStateFace();
          return;
     }

     player.char = face;
     player.sparkleFaceTimer = duration;
}

export function syncPlayerHealthState() {
     updatePlayerSpeedFromHealth();

     if (
          player.sparkleFaceTimer <= 0 ||
          playerHealth <= 0 ||
          playerHealth === maxPlayerHealth ||
          playerHealth <= 2
     ) {
          refreshPlayerStateFace();
     }
}

// NOTE: OVERLAYS

export function clearGameOverlay() {
     gameOverlayText = "";
     gameOverlaySubtext = "";
     gameOverlayTimer = 0;
     gameOverlayDuration = 0;
}

export function showTimedGameOverlay(text, subtext = "", duration = startOverlayDuration) {
     gameOverlayText = text;
     gameOverlaySubtext = subtext;
     gameOverlayTimer = duration;
     gameOverlayDuration = duration;
}

export function showPersistentGameOverlay(text, subtext = "") {
     gameOverlayText = text;
     gameOverlaySubtext = subtext;
     gameOverlayTimer = -1;
     gameOverlayDuration = -1;
}

export function updateGameOverlayTimer() {
     if (gameOverlayTimer > 0) {
          gameOverlayTimer -= 1;

          if (gameOverlayTimer === 0) {
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
          showPersistentGameOverlay("PAUSED", "Press ⏯ to continue");
          return;
     }

     if (
          gameOverlayText === "PAUSED" &&
          (!gamePaused || gameMenuOpen || gameOver || gameWon)
     ) {
          clearGameOverlay();
     }
}

// NOTE: ROUND FLOW

export function startNewGameRound() {
     resetGameState();
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

// NOTE: LOOP

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
          setPlayerHealth(0);
          setGameOver(true);
          setGameWon(false);
          setGamePaused(true);
          setGameMenuOpen(false);
          setGameMenuView("main");
          resetTouchControls();
          syncPlayerHealthState();
          showPersistentGameOverlay("TRY AGAIN!", "Press ⏯ to play again");
          return;
     }

     if (playerHealth >= maxPlayerHealth) {
          setPlayerHealth(maxPlayerHealth);
          setGameWon(true);
          setGameOver(false);
          setGamePaused(true);
          setGameMenuOpen(false);
          setGameMenuView("main");
          resetTouchControls();
          syncPlayerHealthState();
          showPersistentGameOverlay("YOU WIN!", "Press ⏯ to play again");
     }
}

export function drawGame() {
     drawMiniGameBackground();
     drawUiUnderlay();
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

export function gameLoop() {
     updateGame();
     drawGame();
     requestAnimationFrame(gameLoop);
}

// NOTE: RESET

export function resetGameState() {
     gameSparkleColorEngine = createColorEngine(getRainbowPalette);

     sparkleScore = 0;
     sparkleHealProgress = 0;
     playerHealth = playerBaseHealth;
     gameStarted = false;
     gamePaused = true;
     gameMenuOpen = false;
     gameMenuView = "main";
     musicEnabled = true;
     soundEffectsEnabled = true;
     difficultyIndex = 1;
     gameOver = false;
     gameWon = false;

     sparkles.length = 0;
     obstacles.length = 0;
     collisionBursts.length = 0;

     sparkleSpawnTimer = 0;
     obstacleSpawnTimer = 0;

     clearGameOverlay();
     resetTouchControls();
     syncPlayerHealthState();
}

// NOTE: START

export function startSparkleSeeker() {
     resetGameState();
     updateMiniGameCanvasSize();

     resetPlayerPosition();
     updateTouchControlBounds();
     updateMenuUiBounds();

     bindKeyboardInput();
     bindPointerInput();
     bindResizeHandler();

     gameLoop();
}

// NOTE: AUTO START

if (!miniGameCanvas || !miniGameCtx) {
     console.warn("Sparkle Seeker could not find #miniGameCanvas.");
} else {
     startSparkleSeeker();
}