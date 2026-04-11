import { playerFaces } from "./theme.js";

export const miniGameCanvas = document.getElementById("miniGameCanvas");
export const miniGameCtx = miniGameCanvas ? miniGameCanvas.getContext("2d") : null;

export let miniGameWidth = 0;
export let miniGameHeight = 0;

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

export const keys = {};
export const sparkles = [];
export const obstacles = [];
export const collisionBursts = [];

export let sparkleScore = 0;
export let sparkleHealProgress = 0;

export let playerHealth = 3;
export const maxPlayerHealth = 10;

export let gameStarted = false;
export let gamePaused = true;

export let gameMenuOpen = false;
export let gameMenuView = "main";

export let musicEnabled = true;
export let soundEffectsEnabled = true;

export let difficultyIndex = 1;

export let gameOver = false;
export let gameWon = false;

export let gameOverlayText = "";
export let gameOverlaySubtext = "";
export let gameOverlayTimer = 0;
export let gameOverlayDuration = 0;

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

export let pointerInputBound = false;
export let keyboardInputBound = false;
export let resizeHandlerBound = false;

export let sparkleSpawnTimer = 0;
export let obstacleSpawnTimer = 0;

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

// NOTE: SHARED HELPERS

export function randomItem(a) {
     return a[Math.floor(Math.random() * a.length)];
}

export function randomNumber(min, max) {
     return Math.random() * (max - min) + min;
}

export function isCollidingWithSparkle(p, s) {
     const dx = p.x - s.x;
     const dy = p.y - s.y;
     return Math.sqrt(dx * dx + dy * dy) < p.radius + (s.size * 0.25);
}

export function setMiniGameSize(width, height) {
     miniGameWidth = width;
     miniGameHeight = height;
}