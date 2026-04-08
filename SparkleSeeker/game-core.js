// NOTE: GAME CORE
// This file is the shared "home base" for the whole mini-game.
// It stores shared state, core settings, utility helpers, and the main startup/update/draw loop.

// TROUBLESHOOTING

// alert("top of game js");
// console.log("top of game js");

// NOTE: IMPORTS
// These will come from the other files in your new split setup.
// Think of imports like "bring these tools in from other files."

import {
     bindKeyboardInput,
     bindPointerInput,
     bindResizeHandler,
     updatePauseButtonState,
     updatePauseButtonBounds
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
     drawPauseButton
} from "./game-render.js";

import {
     createColorEngine,
     getRainbowPalette
} from "./game-theme.js";
// These used to live in script.js.
// They now need to be imported into the game module world properly.

// NOTE: CANVAS REFERENCES

export const miniGameCanvas = document.getElementById("miniGameCanvas");
export const miniGameCtx = miniGameCanvas ? miniGameCanvas.getContext("2d") : null;

export let miniGameWidth = 0;
export let miniGameHeight = 0;
// These store the canvas size in CSS pixels.
// We use these for gameplay math so movement/drawing matches the canvas as it appears on screen.

// NOTE: PLAYER VISUALS

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
     // Size of player emoji. Recommended 40-60px for finger size.
     speed: 3,
     // Base player speed.
     radius: 30,
     // Size of collision box/circle.
     sparkleFaceTimer: 0,
     // FIXME: Counts down how long the temporary sparkle / obstacle face should stay active.
};

export const playerBaseHealth = 3;
export const playerBaseSpeed = 3;
export const playerSpeedPerHeart = 0.5;

// NOTE: SHARED GAME ARRAYS / OBJECT STORAGE
// These arrays are shared across files.
// Entities update them, render draws them, and core resets them.

export const keys = {};
export const sparkles = [];
export const obstacles = [];
export const collisionBursts = [];

// NOTE: CHARACTER TABLES

export const sparkleChars = ["✦", "✧"];
export const burstChars = ["✦", "✧", "·", "•"];

export const obstacleTypes = [
     {
          name: "affectSize",
          char: "☢\uFE0E",
          effect: ["playerGrow", "playerShrink"],
          penalty: 10
     },
     {
          name: "affectSpeed",
          char: "⚡\uFE0E",
          effect: ["playerSlow", "objectSlow"],
          penalty: 10
     },
     {
          name: "affectType",
          char: "⚠\uFE0E",
          effect: ["swapSparkleObjects"],
          penalty: 10
     }
];
// Keep these as Unicode text presentation so they stay consistent and do not switch to emoji style unexpectedly.

// NOTE: SCORE / HEALTH / GAME STATE
// Exported as "let" so this file can reassign them while other files still read the live updated values.

export let sparkleScore = 0;
export let sparkleHealProgress = 0;
// Every 10 collected sparkles restores 1 heart.

export let playerHealth = 3;
export const maxPlayerHealth = 10;

export let gameStarted = false;
export let gamePaused = true;

// NOTE: BUTTON STATE
// Drawn inside the canvas. Click/tap to toggle START and PAUSE.

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

// NOTE: POINTER / TOUCH INPUT STATE
// game-input.js updates this.
// game-entities.js reads it for touch / mouse-follow movement.

export const pointerInput = {
     active: false,
     x: 0,
     y: 0,
     pointerId: null
};

export let pointerInputBound = false;

export let sparkleSpawnTimer = 0;
export const sparkleSpawnDelay = 50; // Lower number = more sparkles, more often.
export const sparkleSpawnCap = 25; // Max number of sparkles allowed on screen at once.

export let obstacleSpawnTimer = 0;
export const obstacleSpawnDelay = 120; // Lower number = obstacles appear more often.
export const obstacleSpawnCap = 10; // Max number of obstacles allowed on screen at once.

export let gameSparkleColorEngine = null;
// This stores the shared color engine used by the game sparkles/obstacles.
// We keep it in core so other game files can read the same engine.

export let keyboardInputBound = false;
export let resizeHandlerBound = false;
// These stop us from attaching the same listeners more than once if the game ever gets restarted.

// NOTE: SHARED SETTERS
// Because imported bindings are read-only in other modules, helper setter functions like these
// give the other files a safe way to update core state without fighting module rules.
// Beginner version: imports can READ live values, but other files should not directly reassign them.

export function setMiniGameSize(width, height) {
     miniGameWidth = width;
     miniGameHeight = height;
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

export function setGameSparkleColorEngine(value) {
     gameSparkleColorEngine = value;
}

export function setSparkleScore(value) {
     sparkleScore = value;
}

export function addSparkleScore(amount) {
     sparkleScore += amount;
}

export function setSparkleHealProgress(value) {
     sparkleHealProgress = value;
}

export function addSparkleHealProgress(amount) {
     sparkleHealProgress += amount;
}

export function setPlayerHealth(value) {
     playerHealth = value;
}

export function addPlayerHealth(amount) {
     playerHealth += amount;
}

export function setGameStarted(value) {
     gameStarted = value;
}

export function setGamePaused(value) {
     gamePaused = value;
}

// NOTE: UTILITIES

export function randomItem(array) {
     return array[Math.floor(Math.random() * array.length)];
}

export function randomNumber(min, max) {
     return Math.random() * (max - min) + min;
}

export function isCollidingWithSparkle(playerObject, sparkleObject) {
     const dx = playerObject.x - sparkleObject.x;
     const dy = playerObject.y - sparkleObject.y;
     const distance = Math.sqrt(dx * dx + dy * dy);

     return distance < playerObject.radius + (sparkleObject.size * 0.25);
     // Collision circle, so we do not have to rely on glyphs being the exact same size.
}

export function isPointInsideRect(x, y, rect) {
     return (
          x >= rect.x &&
          x <= rect.x + rect.width &&
          y >= rect.y &&
          y <= rect.y + rect.height
     );
}

// NOTE: CANVAS SIZE / DISPLAY SYNC

export function resizeMiniGameCanvasFromCss() {
     if (!miniGameCanvas || !miniGameCtx) {
          return;
     }

     const rect = miniGameCanvas.getBoundingClientRect();
     // This reads the canvas size as it is ACTUALLY being displayed by CSS on the page.

     const dpr = window.devicePixelRatio || 1;
     // DPR = device pixel ratio. Helps the canvas stay sharp on retina/high-density screens.

     miniGameCanvas.width = Math.round(rect.width * dpr);
     miniGameCanvas.height = Math.round(rect.height * dpr);
     // The canvas has an internal drawing size and a visual CSS size.
     // We resize the internal drawing size to match the displayed size more accurately.

     miniGameCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
     // This makes our drawing coordinates behave like CSS pixels instead of raw device pixels.

     miniGameWidth = rect.width;
     miniGameHeight = rect.height;
     // Store the visible canvas size separately so gameplay math uses screen-sized values.
}

export function updateMiniGameCanvasSize() {
     resizeMiniGameCanvasFromCss();
     // Recalculate the internal canvas size so the drawing space matches the CSS display size.
}

// NOTE: PLAYER STATE HELPERS
// These are shared helpers used by entities when health changes or temporary faces are applied.

export function getDefaultPlayerFace() {
     if (playerHealth <= 0) {
          return playerFaces.dead;
     }

     if (playerHealth === maxPlayerHealth) {
          return playerFaces.maxHealth;
     }

     if (playerHealth <= 2) {
          return playerFaces.lowHealth;
     }

     return playerFaces.neutral;
}

export function updatePlayerSpeedFromHealth() {
     const heartDifference = playerHealth - playerBaseHealth;
     player.speed = Math.max(0, playerBaseSpeed + (heartDifference * playerSpeedPerHeart));
     // Speed rises or falls by 0.5 for every heart above or below the starting 3 hearts, controlled in BASE CONST.
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

     if (player.sparkleFaceTimer <= 0 || playerHealth <= 0 || playerHealth === maxPlayerHealth || playerHealth <= 2) {
          refreshPlayerStateFace();
     }
}

// NOTE: GAME UPDATE DRAW LOOP

export function updateGame() {
     updatePauseButtonState();

     if (gamePaused) {
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
}

export function gameLoop() {
     updateGame();
     drawGame();
     window.requestAnimationFrame(gameLoop);
     // requestAnimationFrame tells the browser:
     // "run this loop again on the next paint frame."
}

 // NOTE: STARTUP RESET
// This resets the shared game state back to the beginning.
// Good for initial load now, and useful later if you add restart / game-over / replay.

export function resetGameState() {
     gameSparkleColorEngine = createColorEngine(getRainbowPalette);
     // Create the game's own color engine here so CSS + DOM are ready BEFORE colors are read.
     // Pass the palette function itself so it can always pull the latest theme colors.
     // Important: this now comes from game-theme.js, not script.js.

     sparkleScore = 0;
     sparkleHealProgress = 0;
     playerHealth = playerBaseHealth;
     gameStarted = false;
     gamePaused = true;
     // Start in a paused state until the player clicks START.

     sparkles.length = 0;
     obstacles.length = 0;
     collisionBursts.length = 0;
     // Reset spawned objects whenever the game starts.

     sparkleSpawnTimer = 0;
     obstacleSpawnTimer = 0;
     // Reset timers whenever the game starts.

     pointerInput.active = false;
     pointerInput.x = 0;
     pointerInput.y = 0;
     pointerInput.pointerId = null;
     // Reset pointer tracking too so an old touch/click state does not carry across a restart.

     syncPlayerHealthState();
}

export function startSparkleSeeker() {
     resetGameState();

     updateMiniGameCanvasSize();
     // Match the game canvas drawing size to the CSS display size before the game starts drawing.

     resetPlayerPosition();
     updatePauseButtonBounds();

     bindKeyboardInput();
     bindPointerInput();
     bindResizeHandler();
     // These should only bind once because the input file tracks "already bound" state.

     gameLoop();
}

// NOTE: AUTO STARTUP

if (!miniGameCanvas || !miniGameCtx) {
     console.warn("Sparkle Seeker could not find #miniGameCanvas.");
} else {
     startSparkleSeeker();
}