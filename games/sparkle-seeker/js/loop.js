// NOTE: GAME LOOP
// Handles canvas sizing, round flow, reset flow, startup, and the main update/draw loop.

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
     playerBaseHealth,

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
     setMiniGameSize
} from "./state.js";

import {
     createColorEngine,
     getRainbowPalette,
     setGameSparkleColorEngine
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
} from "./winlose.js";

import {
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

// NOTE: MAIN UPDATE

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
          showPersistentGameOverlay("WINNER!", "Press ⏯ to play again.");
     }
}

// NOTE: LOOP

export function gameLoop() {
     updateGame();
     drawGame();
     requestAnimationFrame(gameLoop);
}

// NOTE: RESET

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