// NOTE: GAME CORE
// This file is the shared "home base" for the whole mini-game.
// It stores shared state, core settings, utility helpers, and the main startup/update/draw loop.

// NOTE: IMPORTS

import {
     bindKeyboardInput,
     bindPointerInput,
     bindResizeHandler,
     updatePauseButtonState,
     updatePauseButtonBounds,
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
     drawPauseButton,
     drawTouchJoystick,
     drawTouchButtons
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
     speed: 3,
     radius: 30,
     sparkleFaceTimer: 0,
     // Counts down how long the temporary sparkle / obstacle face should stay active.
};

export const playerBaseHealth = 3;
export const playerBaseSpeed = 3;
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
          width: 68,
          height: 68,
          isPressed: false,
          pointerId: null,
          label: "✧" // Left button glyph.
     },
     rightButton: {
          x: 0,
          y: 0,
          width: 68,
          height: 68,
          isPressed: false,
          pointerId: null,
          label: "✦" // Right button glyph.
     }
};

// NOTE: PAUSE BUTTON

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

export function setPlayerHealth(v) { playerHealth = v; }
export function addPlayerHealth(v) { playerHealth += v; }

export function setGameStarted(v) { gameStarted = v; }
export function setGamePaused(v) { gamePaused = v; }

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
     updatePauseButtonBounds();
     updateTouchControlBounds();
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

// NOTE: LOOP

export function updateGame() {
     updatePauseButtonState();
     if (gamePaused) return;

     updatePlayer();
     updatePlayerFaceState();
     updateSparkleSpawns();
     updateObstacleSpawns();
     updateSparkles();
     updateObstacles();
     updateCollisionBursts();
     collectSparkles();
     hitObstacles();
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
     drawPauseButton();
     drawTouchJoystick();
     drawTouchButtons();
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

     sparkles.length = 0;
     obstacles.length = 0;
     collisionBursts.length = 0;

     sparkleSpawnTimer = 0;
     obstacleSpawnTimer = 0;

     resetTouchControls();
     syncPlayerHealthState();
}

// NOTE: START

export function startSparkleSeeker() {
     resetGameState();
     updateMiniGameCanvasSize();

     resetPlayerPosition();
     updatePauseButtonBounds();
     updateTouchControlBounds();

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