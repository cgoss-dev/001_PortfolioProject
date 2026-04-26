// NOTE: UI MODE
// Game entry file loaded by page.
//
// Owned here:
// - canvas size syncing
// - round/startup flow
// - mode/state transitions
// - gameplay update loop
// - overlay timers
// - screen action hitbox storage
// - menu screen layout math
//
// NOT owned here anymore:
// - screen-specific canvas rendering
// - low-level shared draw primitives
// - theme/color/font token creation
// - progression/help copy
//
// Newbie note:
// - This file should answer "what state is the game in?" and
//   "where should clickable menu things live?"
// - If code is about actually drawing pixels, it belongs in `ui_draw.js`.
// - If code is about reusable colors/fonts/shapes, it belongs in `ui_config.js`.
// - If code is about progression text/goals/titles, it belongs in `entities_level.js`.

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
     musicLevel,
     soundEffectsLevel,
     harmfulLevel,
     optionLevelLabels,
     optionLevelValues,
     maxOptionLevelIndex,
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
     updatePlayerTrail
} from "./entities_player.js";

import {
     updateSparkleSpawns,
     updateSparkles,
     collectSparkles
} from "./entities_sparkles.js";

import {
     updateEffectState,
     updateEffectPickups,
     updateCollisionBursts,
     collectEffectPickups
} from "./entities_effects.js";

import {
     winScore,
     startOverlayDuration,
     overlayFadeFrames,
     getScreenTitleLinesForMode
} from "./entities_level.js";

import {
     drawGame,
     updateScreenTitleColorState
} from "./ui_draw.js";

import {
     getUiTheme,
     getMenuScreenLayout
} from "./ui_config.js";

// SCREEN STATE
let screenLayerActive = true;
let screenLayerTimer = -1;
let screenLayerDuration = -1;

// SCREEN MODE
// `screenWelcome` is the only screen that hides the board.
// `screenTryAgain` and `screenYouWin` are overlays.
let gameScreenMode = "screenWelcome";

// ==================================================
// SCREEN ACTION TARGETS
// These hitboxes are updated by layout/draw code and read by input code.
// Keeping them here makes `ui_mode.js` the source-of-truth for UI interaction state.
// ==================================================

const screenActionUi = {
     startButton: { x: 0, y: 0, width: 0, height: 0 },
     tipsButton: { x: 0, y: 0, width: 0, height: 0 },
     menuButton: { x: 0, y: 0, width: 0, height: 0 }
};

const pausedActionUi = {
     resumeButton: { x: 0, y: 0, width: 0, height: 0 },
     tipsButton: { x: 0, y: 0, width: 0, height: 0 },
     menuButton: { x: 0, y: 0, width: 0, height: 0 }
};

export function getScreenActionUi() {
     return screenActionUi;
}

export function getPausedActionUi() {
     return pausedActionUi;
}

export function resetScreenActionUiBounds() {
     screenActionUi.startButton.x = 0;
     screenActionUi.startButton.y = 0;
     screenActionUi.startButton.width = 0;
     screenActionUi.startButton.height = 0;

     screenActionUi.tipsButton.x = 0;
     screenActionUi.tipsButton.y = 0;
     screenActionUi.tipsButton.width = 0;
     screenActionUi.tipsButton.height = 0;

     screenActionUi.menuButton.x = 0;
     screenActionUi.menuButton.y = 0;
     screenActionUi.menuButton.width = 0;
     screenActionUi.menuButton.height = 0;

     pausedActionUi.resumeButton.x = 0;
     pausedActionUi.resumeButton.y = 0;
     pausedActionUi.resumeButton.width = 0;
     pausedActionUi.resumeButton.height = 0;

     pausedActionUi.tipsButton.x = 0;
     pausedActionUi.tipsButton.y = 0;
     pausedActionUi.tipsButton.width = 0;
     pausedActionUi.tipsButton.height = 0;

     pausedActionUi.menuButton.x = 0;
     pausedActionUi.menuButton.y = 0;
     pausedActionUi.menuButton.width = 0;
     pausedActionUi.menuButton.height = 0;
}

export function getCurrentScreenTitleLines() {
     return getScreenTitleLinesForMode(gameScreenMode);
}

// ==================================================
// SCREEN MODE HELPERS
// ==================================================

function setMenuViewAndRefresh(view) {
     setGameMenuView(view);
     updateMenuUiBounds();
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
          updateMenuUiBounds();
          updateTouchControlBounds();
          return;
     }

     setGamePaused(true);
     updateMenuUiBounds();
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

// ==================================================
// MENU LAYOUT / MENU INPUT BOUNDS
// This math supports clicking/tapping on menu rows and buttons.
// It belongs here because it defines interactive UI state, not drawing style.
// ==================================================

function setOptionRowBounds(row, decreaseButton, increaseButton, x, y, width, height) {
     const arrowWidth = Math.min(48, Math.max(35, width * 0.18));

     row.x = x;
     row.y = y;
     row.width = width;
     row.height = height;

     decreaseButton.x = x;
     decreaseButton.y = y;
     decreaseButton.width = arrowWidth;
     decreaseButton.height = height;

     increaseButton.x = x + width - arrowWidth;
     increaseButton.y = y;
     increaseButton.width = arrowWidth;
     increaseButton.height = height;
}

function getMenuLayoutMetrics(panelX, panelWidth) {
     const theme = getUiTheme();
     const sharedLayout = getMenuScreenLayout(theme);
     const buttonHeight = theme.layout.menu.buttonHeight;
     const buttonX = panelX + sharedLayout.sidePadding;
     const buttonWidth = panelWidth - (sharedLayout.sidePadding * 2);

     return {
          buttonHeight,
          buttonX,
          buttonWidth,
          rowGap: sharedLayout.rowGap,
          backButtonSize: sharedLayout.backButtonSize,
          backButtonX: sharedLayout.backButtonX,
          backButtonY: sharedLayout.backButtonY,
          contentTopY: sharedLayout.contentTopY
     };
}

export function updateMenuUiBounds() {
     const panelX = 0;
     const panelY = 0;
     const panelWidth = miniGameWidth;
     const panelHeight = miniGameHeight;

     gameMenuUi.panel.x = panelX;
     gameMenuUi.panel.y = panelY;
     gameMenuUi.panel.width = panelWidth;
     gameMenuUi.panel.height = panelHeight;

     const layout = getMenuLayoutMetrics(panelX, panelWidth);

     gameMenuUi.backButton.x = layout.backButtonX;
     gameMenuUi.backButton.y = layout.backButtonY;
     gameMenuUi.backButton.width = layout.backButtonSize;
     gameMenuUi.backButton.height = layout.backButtonSize;

     if (gameMenuView === "tips") {
          const menuButtons = [
               gameMenuUi.tipsHowToPlayButton,
               gameMenuUi.tipsHelpEffectsButton,
               gameMenuUi.tipsHarmEffectsButton
          ];

          menuButtons.forEach((row, index) => {
               const y = layout.contentTopY + (index * (layout.buttonHeight + layout.rowGap));

               row.x = layout.buttonX;
               row.y = y;
               row.width = layout.buttonWidth;
               row.height = layout.buttonHeight;
          });

          return;
     }

     if (
          gameMenuView === "tips_how_to_play" ||
          gameMenuView === "tips_help_effects" ||
          gameMenuView === "tips_harm_effects"
     ) {
          return;
     }

     if (gameMenuView !== "options") {
          return;
     }

     const optionRows = [
          {
               row: gameMenuUi.harmfulRow,
               decreaseButton: gameMenuUi.harmfulDecreaseButton,
               increaseButton: gameMenuUi.harmfulIncreaseButton
          },
          {
               row: gameMenuUi.musicRow,
               decreaseButton: gameMenuUi.musicDecreaseButton,
               increaseButton: gameMenuUi.musicIncreaseButton
          },
          {
               row: gameMenuUi.soundEffectsRow,
               decreaseButton: gameMenuUi.soundEffectsDecreaseButton,
               increaseButton: gameMenuUi.soundEffectsIncreaseButton
          }
     ];

     optionRows.forEach((item, index) => {
          const y = layout.contentTopY + (index * (layout.buttonHeight + layout.rowGap));

          setOptionRowBounds(
               item.row,
               item.decreaseButton,
               item.increaseButton,
               layout.buttonX,
               y,
               layout.buttonWidth,
               layout.buttonHeight
          );
     });
}

export function isPointInsideMenuPanel(x, y) {
     return (
          x >= gameMenuUi.panel.x &&
          x <= gameMenuUi.panel.x + gameMenuUi.panel.width &&
          y >= gameMenuUi.panel.y &&
          y <= gameMenuUi.panel.y + gameMenuUi.panel.height
     );
}

export function syncCanvasResolutionAndUiBounds() {
     syncCanvasResolutionFromCssSize();
     updateTouchControlBounds();
     updateMenuUiBounds();
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
}

export function increaseMusicLevel() {
     setMusicLevel(getNextOptionLevelIndex(musicLevel));
}

export function decreaseSoundEffectsLevel() {
     setSoundEffectsLevel(getPreviousOptionLevelIndex(soundEffectsLevel));
}

export function increaseSoundEffectsLevel() {
     setSoundEffectsLevel(getNextOptionLevelIndex(soundEffectsLevel));
}

export function decreaseHarmfulLevel() {
     const nextLevel = getPreviousOptionLevelIndex(harmfulLevel);
     setHarmfulLevel(nextLevel);

     if (nextLevel === 0) {
          effectPickups.length = 0;
     }
}

export function increaseHarmfulLevel() {
     setHarmfulLevel(getNextOptionLevelIndex(harmfulLevel));
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
// PAUSE SYNC
// ==================================================

export function syncPauseOverlay() {
     // Pause uses the dedicated full-screen paused overlay.
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
     resetGameState();
     resetTouchControls();
     resetEntityColorCycle();

     syncCanvasResolutionAndUiBounds();
     resetPlayerPosition();
     resetScreenActionUiBounds();

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
