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
// Width and height stay separate so the canvas can be rectangular without stretching gameplay.
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
     radius: 30,

     baseSize: 64,
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
export const effectPickups = [];
export const collisionBursts = [];

// ==================================================
// NOTE: SCORE + HEALTH
// ==================================================

export let sparkleScore = 0;
export let sparkleHealProgress = 0;
export let scoreMultiplier = 1;

export let playerHealth = 3;
export const maxPlayerHealth = 5;

// ==================================================
// NOTE: OPTIONS LEVELS
// Shared scale for Options submenu items.
// ==================================================

export const optionLevelLabels = ["Off", "Min", "Low", "Med", "Max"];
export const optionLevelValues = [0, 0.25, 0.5, 0.75, 1];
export const maxOptionLevelIndex = optionLevelLabels.length - 1;
export const defaultOptionLevelIndex = 2;

// ==================================================
// NOTE: EFFECT STATE
// Runtime storage only. Effect rules live in entities.js.
// Timers are frame counts, so 60 frames is roughly 1 second.
// ==================================================

export const storedEffects = {
     shield: false,
     cure: false
};

export const effectTimers = {
     luck: 0,
     magnet: 0,
     slowmo: 0,

     freeze: 0,
     surge: 0,
     daze: 0,
     glass: 0,
     fog: 0
};

export const activeStatusUi = {
     label: "CLEAR",
     char: "",
     timer: 0,
     duration: 0
};

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
export let harmfulEnabled = true;

// Persistent option levels.
export let musicLevel = defaultOptionLevelIndex;
export let soundEffectsLevel = defaultOptionLevelIndex;
export let harmfulLevel = defaultOptionLevelIndex;

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

     harmfulRow: { x: 0, y: 0, width: 0, height: 0 },
     harmfulDecreaseButton: { x: 0, y: 0, width: 0, height: 0 },
     harmfulIncreaseButton: { x: 0, y: 0, width: 0, height: 0 },

     musicRow: { x: 0, y: 0, width: 0, height: 0 },
     musicDecreaseButton: { x: 0, y: 0, width: 0, height: 0 },
     musicIncreaseButton: { x: 0, y: 0, width: 0, height: 0 },

     soundEffectsRow: { x: 0, y: 0, width: 0, height: 0 },
     soundEffectsDecreaseButton: { x: 0, y: 0, width: 0, height: 0 },
     soundEffectsIncreaseButton: { x: 0, y: 0, width: 0, height: 0 },

     backButton: { x: 0, y: 0, width: 0, height: 0 }
};

// ==================================================
// NOTE: TOUCH CONTROLS
// Sizes here are gameplay/UI data, not CSS styling.
// So it is fine to keep them in JS.
// ==================================================

export const touchControls = {
     touchMoveTarget: {
          x: 0,
          y: 0,
          pointerId: null,
          isActive: false
     },

     pauseButton: {
          x: 0,
          y: 0,
          width: 60,
          height: 60,
          isPressed: false,
          pointerId: null,
          label: "\u23EF\uFE0E"
     }
};

// ==================================================
// TOUCH TARGET SETTERS
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

     touchControls.touchMoveTarget.pointerId = null;
     touchControls.touchMoveTarget.isActive = false;
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
export let effectPickupSpawnTimer = 0;

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

export function setEffectPickupSpawnTimer(value) {
     effectPickupSpawnTimer = value;
}

// ==================================================
// SCORE + HEALTH SETTERS
// ==================================================

export function setSparkleScore(value) {
     sparkleScore = Math.max(0, value);
}

export function setScoreMultiplier(value) {
     scoreMultiplier = Math.max(1, value);
}

export function resetScoreMultiplier() {
     scoreMultiplier = 1;
}

export function addSparkleScore(value) {
     sparkleScore = Math.max(0, sparkleScore + (value * scoreMultiplier));
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
// EFFECT SETTERS + HELPERS
// ==================================================

export function setStoredEffect(effectName, value) {
     if (!(effectName in storedEffects)) {
          return;
     }

     storedEffects[effectName] = Boolean(value);
}

export function clearStoredEffect(effectName) {
     setStoredEffect(effectName, false);
}

export function isStoredEffectReady(effectName) {
     return Boolean(storedEffects[effectName]);
}

export function setEffectTimer(effectName, value) {
     if (!(effectName in effectTimers)) {
          return;
     }

     effectTimers[effectName] = Math.max(0, value);
}

export function addEffectTimer(effectName, value) {
     if (!(effectName in effectTimers)) {
          return;
     }

     effectTimers[effectName] = Math.max(0, effectTimers[effectName] + value);
}

export function isEffectActive(effectName) {
     return (effectTimers[effectName] || 0) > 0;
}

export function decrementEffectTimers() {
     Object.keys(effectTimers).forEach((effectName) => {
          if (effectTimers[effectName] > 0) {
               effectTimers[effectName] -= 1;
          }
     });

     if (activeStatusUi.timer > 0) {
          activeStatusUi.timer -= 1;
     }
}

export function setActiveStatusUi(label, char = "", timer = 0, duration = timer) {
     activeStatusUi.label = label;
     activeStatusUi.char = char;
     activeStatusUi.timer = Math.max(0, timer);
     activeStatusUi.duration = Math.max(0, duration);
}

export function clearActiveStatusUi() {
     activeStatusUi.label = "CLEAR";
     activeStatusUi.char = "";
     activeStatusUi.timer = 0;
     activeStatusUi.duration = 0;
}

export function resetEffectState() {
     storedEffects.shield = false;
     storedEffects.cure = false;

     Object.keys(effectTimers).forEach((effectName) => {
          effectTimers[effectName] = 0;
     });

     clearActiveStatusUi();
     resetScoreMultiplier();
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

function syncHarmfulEnabledFromLevel() {
     harmfulEnabled = harmfulLevel > 0;
}

export function syncOptionFlagsFromLevels() {
     syncMusicEnabledFromLevel();
     syncSoundEffectsEnabledFromLevel();
     syncHarmfulEnabledFromLevel();
}

export function resetOptionsToDefaults() {
     musicLevel = defaultOptionLevelIndex;
     soundEffectsLevel = defaultOptionLevelIndex;
     harmfulLevel = defaultOptionLevelIndex;

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

export function setHarmfulEnabled(value) {
     harmfulEnabled = value;
     harmfulLevel = value ? maxOptionLevelIndex : 0;
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

export function setHarmfulLevel(value) {
     harmfulLevel = clampOptionLevelIndex(value);
     syncHarmfulEnabledFromLevel();
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

export function setPauseButtonPressed(value) {
     touchControls.pauseButton.isPressed = value;
}

export function setPauseButtonPointerId(value) {
     touchControls.pauseButton.pointerId = value;
}

// ==================================================
// NOTE: FULL GAME RESET
// Central reset used when starting a new round.
// This keeps reset logic from being scattered across files.
// ==================================================

export function resetGameState() {
     sparkleScore = 0;
     sparkleHealProgress = 0;
     scoreMultiplier = 1;

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
     effectPickupSpawnTimer = 0;

     sparkles.length = 0;
     effectPickups.length = 0;
     collisionBursts.length = 0;

     resetEffectState();

     touchControls.touchMoveTarget.x = 0;
     touchControls.touchMoveTarget.y = 0;
     touchControls.touchMoveTarget.pointerId = null;
     touchControls.touchMoveTarget.isActive = false;

     touchControls.pauseButton.isPressed = false;
     touchControls.pauseButton.pointerId = null;
}

// ==================================================
// NOTE: SMALL SHARED HELPERS
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
