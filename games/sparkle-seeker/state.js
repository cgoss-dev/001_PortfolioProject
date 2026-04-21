// NOTE: GAME STATE
// This file stores shared runtime data for Sparkle Seeker.
// Other JS files can import from here to READ state,
// and use the setter functions below to UPDATE state.
//
// Keep this file focused on shared data only.
// Do not place game loop, rendering, or gameplay system logic in here.

export const miniGameCanvas = document.getElementById("miniGameCanvas");

// Canvas may not exist immediately during page load, so we guard against null here.
export const miniGameCtx = miniGameCanvas ? miniGameCanvas.getContext("2d") : null;

// These track the CSS-sized play area used by gameplay logic.
// The real canvas pixel size can still be scaled elsewhere for DPR.
export let miniGameWidth = 0;
export let miniGameHeight = 0;

// ==================================================
// NOTE: PLAYER
// Core player data lives here because several systems need it.
// ==================================================

export const player = {
     x: 0,
     y: 0,
     char: "😐",
     size: 64,
     speed: 2,
     radius: 32,

     baseSize: 54,
     baseRadius: 30,

     // Temporary face-expression timer.
     // Example: sparkle pickup changes the face briefly, then it returns.
     sparkleFaceTimer: 0,

     hitScale: 1,
     lowHealthPulseTime: 0
};

// ==================================================
// INPUT + SHARED ENTITY ARRAYS
// These are mutated during gameplay, so they stay centralized here.
// ==================================================

export const keys = {};
export const sparkles = [];
export const obstacles = [];
export const collisionBursts = [];

// ==================================================
// NOTE: SCORE + HEALTH
// ==================================================

export let sparkleScore = 0;
export let sparkleHealProgress = 0;

export let playerHealth = 3;
export const maxPlayerHealth = 5;

// ==================================================
// OPTIONS LEVELS
// Shared scale for Options submenu items.
// ==================================================

export const optionLevelLabels = ["Off", "Low", "Med", "High", "Max"];
export const optionLevelValues = [0, 0.25, 0.5, 0.75, 1];
export const maxOptionLevelIndex = optionLevelLabels.length - 1;
export const defaultOptionLevelIndex = 1;

// ==================================================
// GAME FLOW FLAGS
// ==================================================

export let gameStarted = false;
export let gamePaused = true;

// Transitional screen-routing state.
// These can be removed later once the menu layer is fully collapsed.
export let gameMenuOpen = false;
export let gameMenuView = "main";

// Compatibility booleans for gameplay/audio systems that still expect simple flags.
export let musicEnabled = true;
export let soundEffectsEnabled = true;
export let obstaclesEnabled = true;

// Persistent option levels.
export let musicLevel = defaultOptionLevelIndex;
export let soundEffectsLevel = defaultOptionLevelIndex;
export let obstaclesLevel = defaultOptionLevelIndex;

export let gameOver = false;
export let gameWon = false;

// ==================================================
// OVERLAY STATE
// Used by UI code for short messages like win / lose / start text.
// ==================================================

export let gameOverlayText = "";
export let gameOverlaySubtext = "";
export let gameOverlayTimer = 0;
export let gameOverlayDuration = 0;

// ==================================================
// NOTE: SCREEN UI HIT BOXES
// These are layout bounds used by pointer/touch input.
// ==================================================

export const gameMenuUi = {
     panel: { x: 0, y: 0, width: 0, height: 0 },

     newGameButton: { x: 0, y: 0, width: 0, height: 0 },
     instructionsButton: { x: 0, y: 0, width: 0, height: 0 },
     optionsButton: { x: 0, y: 0, width: 0, height: 0 },

     obstaclesToggleButton: { x: 0, y: 0, width: 0, height: 0 },
     musicToggleButton: { x: 0, y: 0, width: 0, height: 0 },
     soundEffectsToggleButton: { x: 0, y: 0, width: 0, height: 0 },

     backButton: { x: 0, y: 0, width: 0, height: 0 }
};

// ==================================================
// NOTE: TOUCH CONTROLS
// Sizes here are gameplay/UI data, not CSS styling.
// So it is fine to keep them in JS.
// ==================================================

export const touchControls = {
     touchMoveTarget: {
          x: 0.5,
          y: 0.5,
          pointerId: null,
          isActive: false
     },

     leftButton: {
          x: 0,
          y: 0,
          width: 60,
          height: 60,
          isPressed: false,
          pointerId: null,
          label: "L"
     },

     pauseButton: {
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
          label: "R"
     }
};

// ==================================================
// TOUCH TARGET HELPERS
// ==================================================

export function setTouchMoveTarget(x, y, pointerId) {
     touchControls.touchMoveTarget.x = x;
     touchControls.touchMoveTarget.y = y;
     touchControls.touchMoveTarget.pointerId = pointerId;
     touchControls.touchMoveTarget.isActive = true;
}

export function clearTouchMoveTarget(pointerId) {
     if (touchControls.touchMoveTarget.pointerId !== pointerId) {
          return;
     }

     touchControls.touchMoveTarget.isActive = false;
     touchControls.touchMoveTarget.pointerId = null;
}

// ==================================================
// ONE-TIME BIND FLAGS
// These prevent accidental duplicate event listeners.
// ==================================================

export let pointerInputBound = false;
export let keyboardInputBound = false;
export let resizeHandlerBound = false;

// ==================================================
// SPAWN TIMERS
// ==================================================

export let sparkleSpawnTimer = 0;
export let obstacleSpawnTimer = 0;

// ==================================================
// BASIC SETTERS
// ==================================================

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

// ==================================================
// SCORE + HEALTH SETTERS
// ==================================================

export function setSparkleScore(value) {
     sparkleScore = Math.max(0, value);
}

// NOTE: SCORE MULTIPLIER
// When player is at max health, all score gains are doubled.
export function addSparkleScore(value) {
     const multiplier = (playerHealth >= maxPlayerHealth) ? 2 : 1;

     sparkleScore = Math.max(0, sparkleScore + (value * multiplier));
}

export function setSparkleHealProgress(value) {
     sparkleHealProgress = value;
}

export function addSparkleHealProgress(value) {
     sparkleHealProgress += value;
}

export function setPlayerHealth(value) {
     playerHealth = Math.max(0, Math.min(maxPlayerHealth, value));
}

export function addPlayerHealth(value) {
     playerHealth = Math.max(0, Math.min(maxPlayerHealth, playerHealth + value));
}

// ==================================================
// OPTIONS HELPERS
// ==================================================

function clampOptionLevelIndex(value) {
     return Math.max(0, Math.min(maxOptionLevelIndex, value));
}

function syncMusicEnabledFromLevel() {
     musicEnabled = musicLevel > 0;
}

function syncSoundEffectsEnabledFromLevel() {
     soundEffectsEnabled = soundEffectsLevel > 0;
}

function syncObstaclesEnabledFromLevel() {
     obstaclesEnabled = obstaclesLevel > 0;
}

export function syncOptionFlagsFromLevels() {
     syncMusicEnabledFromLevel();
     syncSoundEffectsEnabledFromLevel();
     syncObstaclesEnabledFromLevel();
}

export function resetOptionsToDefaults() {
     musicLevel = defaultOptionLevelIndex;
     soundEffectsLevel = defaultOptionLevelIndex;
     obstaclesLevel = defaultOptionLevelIndex;

     syncOptionFlagsFromLevels();
}

// ==================================================
// GAME FLOW SETTERS
// ==================================================

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

// Compatibility boolean setters.
export function setMusicEnabled(value) {
     musicEnabled = value;
     musicLevel = value ? maxOptionLevelIndex : 0;
}

export function setSoundEffectsEnabled(value) {
     soundEffectsEnabled = value;
     soundEffectsLevel = value ? maxOptionLevelIndex : 0;
}

export function setObstaclesEnabled(value) {
     obstaclesEnabled = value;
     obstaclesLevel = value ? maxOptionLevelIndex : 0;
}

// Level setters for Options UI.
export function setMusicLevel(value) {
     musicLevel = clampOptionLevelIndex(value);
     syncMusicEnabledFromLevel();
}

export function setSoundEffectsLevel(value) {
     soundEffectsLevel = clampOptionLevelIndex(value);
     syncSoundEffectsEnabledFromLevel();
}

export function setObstaclesLevel(value) {
     obstaclesLevel = clampOptionLevelIndex(value);
     syncObstaclesEnabledFromLevel();
}

export function setGameOver(value) {
     gameOver = value;
}

export function setGameWon(value) {
     gameWon = value;
}

// ==================================================
// OVERLAY SETTERS
// ==================================================

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

// ==================================================
// TOUCH BUTTON SETTERS
// ==================================================

export function setLeftButtonPressed(value) {
     touchControls.leftButton.isPressed = value;
}

export function setLeftButtonPointerId(value) {
     touchControls.leftButton.pointerId = value;
}

export function setPauseButtonPressed(value) {
     touchControls.pauseButton.isPressed = value;
}

export function setPauseButtonPointerId(value) {
     touchControls.pauseButton.pointerId = value;
}

export function setRightButtonPressed(value) {
     touchControls.rightButton.isPressed = value;
}

export function setRightButtonPointerId(value) {
     touchControls.rightButton.pointerId = value;
}

// ==================================================
// NOTE: FULL GAME RESET
// Central reset used when starting a new round.
// This keeps reset logic from being scattered across files.
// ==================================================

export function resetGameState() {
     sparkleScore = 0;
     sparkleHealProgress = 0;

     playerHealth = 3;

     gameStarted = false;
     gamePaused = true;

     gameMenuOpen = false;
     gameMenuView = "main";

     // Options are intentionally NOT reset here.
     // They persist across rounds until the player changes them.
     syncOptionFlagsFromLevels();

     gameOver = false;
     gameWon = false;

     gameOverlayText = "";
     gameOverlaySubtext = "";
     gameOverlayTimer = 0;
     gameOverlayDuration = 0;

     sparkleSpawnTimer = 0;
     obstacleSpawnTimer = 0;

     sparkles.length = 0;
     obstacles.length = 0;
     collisionBursts.length = 0;
}

// ==================================================
// SMALL SHARED HELPERS
// ==================================================

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
