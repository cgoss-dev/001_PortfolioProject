// NOTE: 2-- GAME ENGINE
// Main runtime orchestration for Sparkle Seeker.
//
// Owned here:
// - startup / boot flow
// - main game loop
// - round reset flow
// - screen/mode transitions
// - overlay timers / overlay state helpers
// - win / lose checks
// - option step helpers used by input/UI
//
// NOT owned here:
// - raw shared data storage
// - drawing implementation
// - menu layout / menu click handling
// - player movement input plumbing
// - particle internals
//
// Newbie note:
// - This file should answer "what happens next?"
// - If code draws things, it belongs in `9_UI.js`.
// - If code stores shared mutable data, it belongs in `3_Vars.js`.
// - If code updates sparkles/friends/enemies, it belongs in `8_Particles.js`.

import {
     miniGameCanvas,
     miniGameCtx,
     gameStarted,
     gamePaused,
     gameMenuOpen,
     gameMenuView,
     gameOver,
     gameWon,
     gameOverlayText,
     gameOverlayTimer,
     gameOverlayDuration,
     optionLevelLabels,
     optionLevelValues,
     maxOptionLevelIndex,
     musicLevel,
     soundEffectsLevel,
     harmfulLevel,
     effectPickups,
     sparkleScore,
     playerHealth,

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
     setMusicLevel,
     setSoundEffectsLevel,
     setHarmfulLevel,
     setMiniGameSize,

     resetUiActionBounds,
     resetGameState
} from "./3_Vars.js";

import {
     bindKeyboardInput,
     bindPointerInput,
     bindResizeHandler,
     updateTouchControlBounds,
     resetTouchControls
} from "./6_Input.js";

import {
     resetPlayerPosition,
     updatePlayer,
     updatePlayerFaceState,
     updatePlayerTrail
} from "./7_Player.js";

import {
     resetEntityColorCycle,
     updateEffectState,
     updateSparkleSpawns,
     updateSparkles,
     updateEffectPickups,
     updateCollisionBursts,
     collectSparkles,
     collectEffectPickups
} from "./8_Particles.js";

import {
     winScore,
     startOverlayDuration,
     overlayFadeFrames,
     getScreenTitleLinesForMode
} from "./5_WinRulesConditions.js";

import {
     drawGame,
     syncUiBounds,
     updatePauseButtonState,
     updateScreenTitleColorState
} from "./9_UI.js";

import {
     loadAndApplySavedOptions,
     saveCurrentOptions
} from "./4_Config.js";

// ==================================================
// SCREEN STATE
// `screenWelcome` hides the board entirely.
// `screenTryAgain` and `screenYouWin` are board overlays.
// ==================================================

let screenLayerActive = true;
let screenLayerTimer = -1;
let screenLayerDuration = -1;
let gameScreenMode = "screenWelcome";

// ==================================================
// SCREEN MODE HELPERS
// ==================================================

function setMenuViewAndRefresh(view) {
     setGameMenuView(view);
     syncUiBounds();
}

export function isScreenWelcomeActive() {
     return screenLayerActive && gameScreenMode === "screenWelcome";
}

export function isOverlayScreenActive() {
     return screenLayerActive && (
          gameScreenMode === "screenTryAgain" ||
          gameScreenMode === "screenYouWin"
     );
}

export function getGameScreenMode() {
     return gameScreenMode;
}

export function getCurrentScreenTitleLines() {
     return getScreenTitleLinesForMode(gameScreenMode);
}

export function dismissScreenWelcomeToStart() {
     screenLayerActive = false;
     gameScreenMode = "screenWelcome";
     screenLayerTimer = 0;
     screenLayerDuration = 0;
     startNewGameRound();
}

export function dismissScreenWelcomeToTipsMenu() {
     screenLayerActive = false;
     gameScreenMode = "screenWelcome";
     screenLayerTimer = 0;
     screenLayerDuration = 0;

     resetGameState();
     resetTouchControls();
     resetEntityColorCycle();

     syncCanvasResolutionAndUiBounds();
     resetPlayerPosition();

     setGameStarted(false);
     setGamePaused(false);
     setGameMenuOpen(true);
     setMenuViewAndRefresh("tips");
     setGameOver(false);
     setGameWon(false);

     clearGameOverlay();
}

export function dismissScreenWelcomeToOptionsMenu() {
     screenLayerActive = false;
     gameScreenMode = "screenWelcome";
     screenLayerTimer = 0;
     screenLayerDuration = 0;

     resetGameState();
     resetTouchControls();
     resetEntityColorCycle();

     syncCanvasResolutionAndUiBounds();
     resetPlayerPosition();

     setGameStarted(false);
     setGamePaused(false);
     setGameMenuOpen(true);
     setMenuViewAndRefresh("options");
     setGameOver(false);
     setGameWon(false);

     clearGameOverlay();
}

export function dismissPausedToTipsMenu() {
     setGamePaused(true);
     setGameMenuOpen(true);
     setMenuViewAndRefresh("tips");
}

export function dismissPausedToOptionsMenu() {
     setGamePaused(true);
     setGameMenuOpen(true);
     setMenuViewAndRefresh("options");
}

export function dismissMenuBackToPreviousScreen() {
     if (
          gameMenuView === "tips_how_to_play" ||
          gameMenuView === "tips_help_effects" ||
          gameMenuView === "tips_harm_effects"
     ) {
          setMenuViewAndRefresh("tips");
          return;
     }

     setGameMenuOpen(false);
     setGameMenuView("");

     if (!gameStarted) {
          showScreenWelcome();
          setGamePaused(false);
          setGameOver(false);
          setGameWon(false);
          clearGameOverlay();
          syncUiBounds();
          updateTouchControlBounds();
          return;
     }

     setGamePaused(true);
     syncUiBounds();
     updateTouchControlBounds();
}

export function showScreenWelcome() {
     screenLayerActive = true;
     gameScreenMode = "screenWelcome";
     screenLayerTimer = -1;
     screenLayerDuration = -1;
}

export function showScreenTryAgain() {
     screenLayerActive = true;
     gameScreenMode = "screenTryAgain";
     screenLayerTimer = -1;
     screenLayerDuration = -1;
}

export function showScreenYouWin() {
     screenLayerActive = true;
     gameScreenMode = "screenYouWin";
     screenLayerTimer = -1;
     screenLayerDuration = -1;
}

export function getGameWelcomeAlpha() {
     if (!screenLayerActive) {
          return 0;
     }

     if (screenLayerTimer < 0 || screenLayerDuration < 0) {
          return 1;
     }

     const elapsed = screenLayerDuration - screenLayerTimer;
     const fadeIn = Math.min(1, elapsed / overlayFadeFrames);
     const fadeOut = Math.min(1, screenLayerTimer / overlayFadeFrames);

     return Math.max(0, Math.min(1, Math.min(fadeIn, fadeOut)));
}

// ==================================================
// CANVAS
// ==================================================

export function syncCanvasResolutionFromCssSize() {
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

export function syncCanvasResolutionAndUiBounds() {
     syncCanvasResolutionFromCssSize();
     updateTouchControlBounds();
     syncUiBounds();
}

// ==================================================
// ROUNDS
// ==================================================

export function startNewGameRound() {
     resetGameState();
     resetTouchControls();
     resetEntityColorCycle();

     syncCanvasResolutionAndUiBounds();
     resetPlayerPosition();

     screenLayerActive = false;

     setGameStarted(true);
     setGamePaused(false);
     setGameMenuOpen(false);
     setGameMenuView("");
     setGameOver(false);
     setGameWon(false);
}

// ==================================================
// OPTIONS
// ==================================================

export function getOptionLevelLabel(levelIndex) {
     return optionLevelLabels[levelIndex] || optionLevelLabels[0];
}

export function getOptionLevelValue(levelIndex) {
     return optionLevelValues[levelIndex] ?? optionLevelValues[0];
}

function getPreviousOptionLevelIndex(levelIndex) {
     return Math.max(0, levelIndex - 1);
}

function getNextOptionLevelIndex(levelIndex) {
     return Math.min(maxOptionLevelIndex, levelIndex + 1);
}

export function getHarmfulToggleLabel() {
     return getOptionLevelLabel(harmfulLevel);
}

export function getMusicToggleLabel() {
     return getOptionLevelLabel(musicLevel);
}

export function getSoundEffectsToggleLabel() {
     return getOptionLevelLabel(soundEffectsLevel);
}

export function decreaseMusicLevel() {
     setMusicLevel(getPreviousOptionLevelIndex(musicLevel));
     saveCurrentOptions();
}

export function increaseMusicLevel() {
     setMusicLevel(getNextOptionLevelIndex(musicLevel));
     saveCurrentOptions();
}

export function decreaseSoundEffectsLevel() {
     setSoundEffectsLevel(getPreviousOptionLevelIndex(soundEffectsLevel));
     saveCurrentOptions();
}

export function increaseSoundEffectsLevel() {
     setSoundEffectsLevel(getNextOptionLevelIndex(soundEffectsLevel));
     saveCurrentOptions();
}

export function decreaseHarmfulLevel() {
     const nextLevel = getPreviousOptionLevelIndex(harmfulLevel);
     setHarmfulLevel(nextLevel);

     if (nextLevel === 0) {
          effectPickups.length = 0;
     }

     saveCurrentOptions();
}

export function increaseHarmfulLevel() {
     setHarmfulLevel(getNextOptionLevelIndex(harmfulLevel));
     saveCurrentOptions();
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
     if (!gameOverlayText) {
          return 0;
     }

     if (gameOverlayTimer < 0 || gameOverlayDuration < 0) {
          return 1;
     }

     const elapsed = gameOverlayDuration - gameOverlayTimer;
     const fadeIn = Math.min(1, elapsed / overlayFadeFrames);
     const fadeOut = Math.min(1, gameOverlayTimer / overlayFadeFrames);

     return Math.max(0, Math.min(1, Math.min(fadeIn, fadeOut)));
}

// ==================================================
// GAME UPDATE
// ==================================================

export function updateGame() {
     updatePauseButtonState();
     updateGameOverlayTimer();

     if (screenLayerActive) {
          updateScreenTitleColorState();
     }

     if (isScreenWelcomeActive()) {
          return;
     }

     if (!gameStarted) {
          return;
     }

     updatePlayerFaceState();

     if (gamePaused || gameMenuOpen || gameOver || gameWon) {
          return;
     }

     updateEffectState();
     updatePlayer();
     updateSparkleSpawns();
     updateSparkles();
     updateEffectPickups();
     updateCollisionBursts();
     updatePlayerTrail();
     collectSparkles();
     collectEffectPickups();

     if (playerHealth <= 0) {
          setGameOver(true);
          setGameWon(false);
          setGamePaused(true);
          setGameMenuOpen(false);
          setGameMenuView("");
          resetTouchControls();
          clearGameOverlay();
          showScreenTryAgain();
          return;
     }

     if (sparkleScore >= winScore) {
          setGameWon(true);
          setGameOver(false);
          setGamePaused(true);
          setGameMenuOpen(false);
          setGameMenuView("");
          resetTouchControls();
          clearGameOverlay();
          showScreenYouWin();
     }
}

function gameLoop() {
     updateGame();
     drawGame();
     requestAnimationFrame(gameLoop);
}

// ==================================================
// STARTUP
// ==================================================

export function startSparkleSeeker() {
     loadAndApplySavedOptions();

     resetGameState();
     resetTouchControls();
     resetEntityColorCycle();

     syncCanvasResolutionAndUiBounds();
     resetPlayerPosition();
     resetUiActionBounds();

     screenLayerActive = true;
     screenLayerTimer = -1;
     screenLayerDuration = -1;
     gameScreenMode = "screenWelcome";

     bindKeyboardInput();
     bindPointerInput();
     bindResizeHandler(syncCanvasResolutionAndUiBounds);

     gameLoop();
}

if (!miniGameCanvas || !miniGameCtx) {
     console.warn("Sparkle Seeker canvas not found.");
} else {
     startSparkleSeeker();
}
