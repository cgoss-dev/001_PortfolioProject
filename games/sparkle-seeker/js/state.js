// NOTE: GAME STATE
// This file holds all runtime state for the mini-game.
// Other files should READ from here and WRITE via setters.

export const miniGameCanvas = document.getElementById("miniGameCanvas");
export const miniGameCtx = miniGameCanvas ? miniGameCanvas.getContext("2d") : null;

export let miniGameWidth = 0;
export let miniGameHeight = 0;

// PLAYER

export const player = {
     x: 0,
     y: 0,
     char: "😐",
     size: 54,
     speed: 2,
     radius: 30,
     sparkleFaceTimer: 0
     // FIXME: Counts down how long temporary face states last.
};

// INPUT + SHARED ARRAYS

export const keys = {};
export const sparkles = [];
export const obstacles = [];
export const collisionBursts = [];

// SCORE + HEALTH

export let sparkleScore = 0;
export let sparkleHealProgress = 0;

export let playerHealth = 3;
export const maxPlayerHealth = 10;

//GAME FLOW

export let gameStarted = false;
export let gamePaused = true;

export let gameMenuOpen = false;
export let gameMenuView = "main";

export let musicEnabled = true;
export let soundEffectsEnabled = true;

export let difficultyIndex = 1;

export let gameOver = false;
export let gameWon = false;

// OVERLAY

export let gameOverlayText = "";
export let gameOverlaySubtext = "";
export let gameOverlayTimer = 0;
export let gameOverlayDuration = 0;

// MENU UI BOUNDS

export const gameMenuUi = {
     panel: { x: 0, y: 0, width: 0, height: 0 },
     newGameButton: { x: 0, y: 0, width: 0, height: 0 },
     instructionsButton: { x: 0, y: 0, width: 0, height: 0 },
     difficultyButton: { x: 0, y: 0, width: 0, height: 0 },
     soundButton: { x: 0, y: 0, width: 0, height: 0 },
     backButton: { x: 0, y: 0, width: 0, height: 0 }
};

// TOUCH CONTROLS

export const touchControls = {
     joystick: {
          centerX: 0,
          centerY: 0,
          baseRadius: 64,
          thumbRadius: 32,
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
          label: "\u23EF\uFE0E"
     },

     rightButton: {
          x: 0,
          y: 0,
          width: 60,
          height: 60,
          isPressed: false,
          pointerId: null,
          label: "\u2630\uFE0E"
     }
};

// INTERNAL BIND FLAGS

export let pointerInputBound = false;
export let keyboardInputBound = false;
export let resizeHandlerBound = false;

// SPAWN TIMERS

export let sparkleSpawnTimer = 0;
export let obstacleSpawnTimer = 0;

// COLOR ENGINE

export let gameSparkleColorEngine = null;

// BASIC SETTERS

export function setMiniGameSize(width, height) {
     miniGameWidth = width;
     miniGameHeight = height;
}

export function setGameSparkleColorEngine(value) {
     gameSparkleColorEngine = value;
}

export function setPointerInputBound(value) {
     pointerInputBound = value;
}

export function setKeyboardInputBound(value) {
     keyboardInputBound = value;
}

export function setResizeHandlerBound(value) {
     resizeHandlerBound = value;
}

export function setSparkleSpawnTimer(value) {
     sparkleSpawnTimer = value;
}

export function setObstacleSpawnTimer(value) {
     obstacleSpawnTimer = value;
}

// SCORE + HEALTH SETTERS

export function setSparkleScore(value) {
     sparkleScore = value;
}

export function addSparkleScore(value) {
     sparkleScore += value;
}

export function setSparkleHealProgress(value) {
     sparkleHealProgress = value;
}

export function addSparkleHealProgress(value) {
     sparkleHealProgress += value;
}

// PLAYER HEALTH SETTERS

export function setPlayerHealth(value) {
     playerHealth = Math.max(0, Math.min(maxPlayerHealth, value));
}

export function addPlayerHealth(value) {
     playerHealth = Math.max(0, Math.min(maxPlayerHealth, playerHealth + value));
}

// GAME FLOW SETTERS

export function setGameStarted(value) {
     gameStarted = value;
}

export function setGamePaused(value) {
     gamePaused = value;
}

export function setGameMenuOpen(value) {
     gameMenuOpen = value;
}

export function setGameMenuView(value) {
     gameMenuView = value;
}

export function setMusicEnabled(value) {
     musicEnabled = value;
}

export function setSoundEffectsEnabled(value) {
     soundEffectsEnabled = value;
}

export function setDifficultyIndex(value) {
     difficultyIndex = value;
}

export function setGameOver(value) {
     gameOver = value;
}

export function setGameWon(value) {
     gameWon = value;
}

// OVERLAY SETTERS

export function setGameOverlayText(value) {
     gameOverlayText = value;
}

export function setGameOverlaySubtext(value) {
     gameOverlaySubtext = value;
}

export function setGameOverlayTimer(value) {
     gameOverlayTimer = value;
}

export function setGameOverlayDuration(value) {
     gameOverlayDuration = value;
}

// JOYSTICK SETTERS

export function setJoystickActive(value) {
     touchControls.joystick.isActive = value;
}

export function setJoystickPointerId(value) {
     touchControls.joystick.pointerId = value;
}

export function setJoystickKnobOffset(x, y) {
     touchControls.joystick.knobX = x;
     touchControls.joystick.knobY = y;
}

export function setJoystickInput(x, y) {
     touchControls.joystick.inputX = x;
     touchControls.joystick.inputY = y;
}

// TOUCH BUTTON SETTERS

export function setLeftButtonPressed(value) {
     touchControls.leftButton.isPressed = value;
}

export function setLeftButtonPointerId(value) {
     touchControls.leftButton.pointerId = value;
}

export function setRightButtonPressed(value) {
     touchControls.rightButton.isPressed = value;
}

export function setRightButtonPointerId(value) {
     touchControls.rightButton.pointerId = value;
}

// HELPERS

export function randomItem(array) {
     return array[Math.floor(Math.random() * array.length)];
}

export function randomNumber(min, max) {
     return Math.random() * (max - min) + min;
}

export function isCollidingWithSparkle(playerObject, sparkleObject) {
     const dx = playerObject.x - sparkleObject.x;
     const dy = playerObject.y - sparkleObject.y;

     return Math.sqrt((dx * dx) + (dy * dy)) < playerObject.radius + (sparkleObject.size * 0.25);
}






// WIN / LOSE / PLAYER HEALTH STATE
// Handles player face switching and speed changes based on health.

import {
     player,
     playerHealth,
     maxPlayerHealth
} from "./state.js";

import {
     playerBaseHealth,
     playerBaseSpeed,
     playerSpeedPerHeart,
     refreshPlayerFaceFromHealth
} from "./systems/player.js";

export function updatePlayerSpeedFromHealth() {
     const diff = playerHealth - playerBaseHealth;
     player.speed = Math.max(0, playerBaseSpeed + (diff * playerSpeedPerHeart));
}

export function refreshPlayerStateFace() {
     refreshPlayerFaceFromHealth();
}

export function applyTemporaryPlayerFace(face, duration) {
     // If the player is already in a "forced" health state (dead, max health, or low health), that state wins.
     if (
          playerHealth <= 0 ||
          playerHealth === maxPlayerHealth ||
          playerHealth <= 2
     ) {
          player.sparkleFaceTimer = 0;
          refreshPlayerFaceFromHealth();
          return;
     }

     player.char = face;
     player.sparkleFaceTimer = duration;
}

export function syncPlayerHealthState() {
     updatePlayerSpeedFromHealth();
     refreshPlayerFaceFromHealth();
}









// NOTE: GAME LOOP
// Handles canvas sizing, round flow, reset flow, startup, and the main update/draw loop.

function drawMiniGameBackground(ctx, width, height) {
     ctx.clearRect(0, 0, width, height);
     ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
     ctx.fillRect(0, 0, width, height);
}

// IMPORTS

import {
     miniGameCanvas,
     miniGameCtx,
     gameStarted,
     gamePaused,
     gameMenuOpen,
     gameOver,
     gameWon,
     playerHealth,
     maxPlayerHealth,
     sparkles,
     obstacles,
     collisionBursts,
     setGameStarted,
     setGamePaused,
     setGameMenuOpen,
     setGameMenuView,
     setGameOver,
     setGameWon,
     setPlayerHealth,
     setSparkleScore,
     setSparkleHealProgress,
     setMusicEnabled,
     setSoundEffectsEnabled,
     setDifficultyIndex,
     setSparkleSpawnTimer,
     setObstacleSpawnTimer,
     setMiniGameSize,
     setGameSparkleColorEngine
} from "./state.js";

import {
     createColorEngine,
     getRainbowPalette
} from "./theme.js";

import {
     bindKeyboardInput,
     bindPointerInput,
     bindResizeHandler,
     updatePauseButtonState,
     updateTouchControlBounds,
     resetTouchControls
} from "./input.js";

import {
     updateMenuUiBounds,
     showTimedGameOverlay,
     showPersistentGameOverlay,
     updateGameOverlayTimer,
     syncPauseOverlay,
     clearGameOverlay
} from "./ui.js";

import {
     drawGame
} from "./render.js";

import {
     syncPlayerHealthState
} from "./winloselevels.js";

import {
     playerBaseHealth,
     resetPlayerPosition,
     updatePlayer,
     updatePlayerFaceState
} from "./systems/player.js";

import {
     updateSparkleSpawns,
     updateSparkles,
     collectSparkles
} from "./systems/sparkles.js";

import {
     updateObstacleSpawns,
     updateObstacles,
     hitObstacles
} from "./systems/obstacles.js";

import {
     updateCollisionBursts
} from "./systems/collisions.js";

// NOTE: CANVAS SIZE

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

// ROUND FLOW

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

// MAIN UPDATE

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
          showPersistentGameOverlay("TRY AGAIN!", "Press ⏯ to play again.");
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
          showPersistentGameOverlay("WIN!", "Press ⏯ to play again.");
     }
}

// LOOP

export function gameLoop() {
     updateGame();
     drawGame();
     requestAnimationFrame(gameLoop);
}

// RESET

export function resetGameState() {
     setGameSparkleColorEngine(createColorEngine(getRainbowPalette));

     setSparkleScore(0);
     setSparkleHealProgress(0);
     setPlayerHealth(playerBaseHealth);
     setGameStarted(false);
     setGamePaused(true);
     setGameMenuOpen(false);
     setGameMenuView("main");
     setMusicEnabled(true);
     setSoundEffectsEnabled(true);
     setDifficultyIndex(1);
     setGameOver(false);
     setGameWon(false);

     sparkles.length = 0;
     obstacles.length = 0;
     collisionBursts.length = 0;

     setSparkleSpawnTimer(0);
     setObstacleSpawnTimer(0);

     clearGameOverlay();
     resetTouchControls();
     syncPlayerHealthState();
}

// NOTE: STARTUP

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