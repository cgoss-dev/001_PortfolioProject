// NOTE: UI MODE / SCREEN FLOW / OVERLAY / STARTUP
// Game entry file loaded by page.
//
// Owned here:
// - canvas size syncing
// - round/startup flow
// - UI state + hitboxes
// - gameplay update loop
//
// NOT owned here anymore:
// - canvas drawing
// - theme/color/font helpers
// - welcome screen rendering
//
// Beginner note:
// Think of this file as the "brain" for UI state.
// ui_draw.js is the "paintbrush."

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
     obstaclesLevel,
     obstaclesEnabled,
     optionLevelLabels,
     optionLevelValues,
     maxOptionLevelIndex,
     obstacles,
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
     setObstaclesLevel,
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
     updatePlayerTrail,
     updateSparkleSpawns,
     updateObstacleSpawns,
     updateSparkles,
     updateObstacles,
     updateCollisionBursts,
     collectSparkles,
     hitObstacles
} from "./entities.js";

import {
     drawGame,
     updateWelcomeTitleColors
} from "./ui_draw.js";

export const startOverlayDuration = 120;
export const overlayFadeFrames = 30;

// SCREEN STATE
let screenLayerActive = true;
let screenLayerTimer = -1;
let screenLayerDuration = -1;

// SCREEN MODE
// `screenWelcome` is the only screen that hides the board.
// `screenPaused`, `screenTryAgain`, and `screenYouWin` are overlays.
let gameScreenMode = "screenWelcome";

// SCREEN ACTION TARGETS

const screenActionUi = {
     startButton: { x: 0, y: 0, width: 0, height: 0 },
     instructionsButton: { x: 0, y: 0, width: 0, height: 0 },
     menuButton: { x: 0, y: 0, width: 0, height: 0 }
};

const pausedActionUi = {
     resumeButton: { x: 0, y: 0, width: 0, height: 0 },
     instructionsButton: { x: 0, y: 0, width: 0, height: 0 },
     menuButton: { x: 0, y: 0, width: 0, height: 0 }
};

// SCREEN TITLE CONTENT
const screenWelcomeTitleLines = ["SPARKLE", "SEEKER"];

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

// Compatibility alias for older imports.
export function isGameWelcomeActive() {
     return screenLayerActive;
}

export function getScreenActionUi() {
     return screenActionUi;
}

// Compatibility alias for older imports.
export function getGameWelcomeUi() {
     return getScreenActionUi();
}

export function getPausedActionUi() {
     return pausedActionUi;
}

// Compatibility alias for older imports.
export function getGamePausedUi() {
     return getPausedActionUi();
}

export function getGameScreenMode() {
     return gameScreenMode;
}

// Compatibility alias for older imports.
export function getGameWelcomeMode() {
     return gameScreenMode;
}

export function getWelcomeTitleLines() {
     return screenWelcomeTitleLines;
}

export function getCurrentScreenTitleLines() {
     if (gameScreenMode === "screenYouWin") {
          return ["YOU", "WIN"];
     }

     if (gameScreenMode === "screenTryAgain") {
          return ["TRY", "AGAIN"];
     }

     return screenWelcomeTitleLines;
}

// Compatibility alias for older imports.
export function getCurrentWelcomeTitleLines() {
     return getCurrentScreenTitleLines();
}

export function getCurrentScreenActionTexts() {
     return ["NEW GAME", "TIPS", "OPTIONS"];
}

// Compatibility alias for older imports.
export function getCurrentWelcomeActionTexts() {
     return getCurrentScreenActionTexts();
}

export function getCurrentPausedActionTexts() {
     return ["RESUME", "TIPS", "OPTIONS"];
}

export function dismissScreenWelcomeToStart() {
     screenLayerActive = false;
     gameScreenMode = "screenWelcome";
     screenLayerTimer = 0;
     screenLayerDuration = 0;
     startNewGameRound();
}

// Compatibility alias for older imports.
export function dismissGameWelcomeToStart() {
     dismissScreenWelcomeToStart();
}

export function dismissScreenWelcomeToInstructionsMenu() {
     screenLayerActive = false;
     gameScreenMode = "screenWelcome";
     screenLayerTimer = 0;
     screenLayerDuration = 0;

     resetGameState();
     resetTouchControls();
     resetEntityColorCycle();

     updateMiniGameCanvasSize();
     resetPlayerPosition();
     updateTouchControlBounds();

     setGameStarted(false);
     setGamePaused(false);
     setGameMenuOpen(true);
     setMenuViewAndRefresh("instructions");
     setGameOver(false);
     setGameWon(false);

     clearGameOverlay();
}

// Compatibility alias for older imports.
export function dismissGameWelcomeToInstructionsMenu() {
     dismissScreenWelcomeToInstructionsMenu();
}

export function dismissScreenWelcomeToOptionsMenu() {
     screenLayerActive = false;
     gameScreenMode = "screenWelcome";
     screenLayerTimer = 0;
     screenLayerDuration = 0;

     resetGameState();
     resetTouchControls();
     resetEntityColorCycle();

     updateMiniGameCanvasSize();
     resetPlayerPosition();
     updateTouchControlBounds();

     setGameStarted(false);
     setGamePaused(false);
     setGameMenuOpen(true);
     setMenuViewAndRefresh("options");
     setGameOver(false);
     setGameWon(false);

     clearGameOverlay();
}

// Compatibility alias for older imports.
export function dismissGameWelcomeToOptionsMenu() {
     dismissScreenWelcomeToOptionsMenu();
}

// Compatibility alias in case older input code still imports the old name.
export function dismissGameWelcomeToMenu() {
     dismissScreenWelcomeToOptionsMenu();
}

export function dismissPausedToInstructionsMenu() {
     setGamePaused(true);
     setGameMenuOpen(true);
     setMenuViewAndRefresh("instructions");
}

export function dismissPausedToOptionsMenu() {
     setGamePaused(true);
     setGameMenuOpen(true);
     setMenuViewAndRefresh("options");
}

export function dismissMenuBackToPreviousScreen() {
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
     gameScreenMode = "screenPaused";
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

// Compatibility wrapper for older calls.
export function showGameWelcomeScreen(mode = "welcome") {
     if (mode === "win") {
          showScreenYouWin();
          return;
     }

     if (mode === "lose") {
          showScreenTryAgain();
          return;
     }

     showScreenWelcome();
}

// Compatibility wrapper for older calls.
export function dismissGameWelcomeBackToMain() {
     showScreenWelcome();
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

// CANVAS

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

// ROUNDS

export function startNewGameRound() {
     resetGameState();
     resetTouchControls();
     resetEntityColorCycle();

     updateMiniGameCanvasSize();
     resetPlayerPosition();
     updateTouchControlBounds();
     updateMenuUiBounds();

     screenLayerActive = false;

     setGameStarted(true);
     setGamePaused(false);
     setGameMenuOpen(false);
     setGameMenuView("");
     setGameOver(false);
     setGameWon(false);
}

// OPTIONS

export function getOptionLevelLabel(levelIndex) {
     return optionLevelLabels[levelIndex] || optionLevelLabels[0];
}

export function getOptionLevelValue(levelIndex) {
     return optionLevelValues[levelIndex] ?? optionLevelValues[0];
}

function getNextOptionLevelIndex(levelIndex) {
     return (levelIndex + 1) % (maxOptionLevelIndex + 1);
}

export function getObstaclesToggleLabel() {
     return getOptionLevelLabel(obstaclesLevel);
}

export function getMusicToggleLabel() {
     return getOptionLevelLabel(musicLevel);
}

export function getSoundEffectsToggleLabel() {
     return getOptionLevelLabel(soundEffectsLevel);
}

export function cycleMusicLevel() {
     setMusicLevel(getNextOptionLevelIndex(musicLevel));
}

export function cycleSoundEffectsLevel() {
     setSoundEffectsLevel(getNextOptionLevelIndex(soundEffectsLevel));
}

export function cycleObstaclesLevel() {
     const nextLevel = getNextOptionLevelIndex(obstaclesLevel);
     setObstaclesLevel(nextLevel);

     if (nextLevel === 0) {
          obstacles.length = 0;
     }
}

// TEMPORARY SCREEN LAYOUT
// This layer only feeds instructions + options bounds to input + draw code.

export function updateMenuUiBounds() {
     const panelX = 0;
     const panelY = 0;
     const panelWidth = miniGameWidth;
     const panelHeight = miniGameHeight;

     gameMenuUi.panel.x = panelX;
     gameMenuUi.panel.y = panelY;
     gameMenuUi.panel.width = panelWidth;
     gameMenuUi.panel.height = panelHeight;

     const sidePadding = Math.max(24, panelWidth * 0.12);
     const buttonHeight = 35;
     const buttonX = panelX + sidePadding;
     const buttonWidth = panelWidth - (sidePadding * 2);

     if (gameMenuView === "instructions") {
          gameMenuUi.backButton.x = buttonX;
          gameMenuUi.backButton.y = panelY + panelHeight - buttonHeight - Math.max(18, panelHeight * 0.08);
          gameMenuUi.backButton.width = buttonWidth;
          gameMenuUi.backButton.height = buttonHeight;
          return;
     }

     let stackedButtons = [];

     if (gameMenuView === "options") {
          stackedButtons = [
               gameMenuUi.obstaclesToggleButton,
               gameMenuUi.musicToggleButton,
               gameMenuUi.soundEffectsToggleButton,
               gameMenuUi.backButton
          ];
     }

     const visibleButtons = stackedButtons.filter(Boolean);
     const buttonCount = visibleButtons.length;

     if (buttonCount === 0) {
          return;
     }

     const totalButtonHeight = buttonCount * buttonHeight;
     const availableHeight = panelHeight - totalButtonHeight;
     const gap = Math.max(18, availableHeight / (buttonCount + 1));

     visibleButtons.forEach((button, index) => {
          button.x = buttonX;
          button.y = panelY + gap + (index * (buttonHeight + gap));
          button.width = buttonWidth;
          button.height = buttonHeight;
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

export function getInstructionLines() {
     return [
          "Collect sparkles, avoid obstacles.",
          "Use L/R buttons or left/right keys to move.",
          "Speed scales with health.",
          "Fall rate scales with level.",
          "Max health = double points."
     ];
}

// OVERLAY SYSTEM

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

// PAUSE SYNC

export function syncPauseOverlay() {
     // NOTE: Pause uses the dedicated full-screen paused overlay.
}

// GAME UPDATE

export function updateGame() {
     updatePauseButtonState();
     updateGameOverlayTimer();

     if (screenLayerActive) {
          updateWelcomeTitleColors(getCurrentScreenTitleLines());
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

     updatePlayer();
     updateSparkleSpawns();

     if (obstaclesEnabled) {
          updateObstacleSpawns();
     }

     updateSparkles();

     if (obstaclesEnabled) {
          updateObstacles();
     }

     updateCollisionBursts();
     updatePlayerTrail();
     collectSparkles();

     if (obstaclesEnabled) {
          hitObstacles();
     }

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

     if (sparkleScore >= 1000) {
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

// STARTUP

export function startSparkleSeeker() {
     resetGameState();
     resetTouchControls();
     resetEntityColorCycle();

     updateMiniGameCanvasSize();
     resetPlayerPosition();
     updateTouchControlBounds();
     updateMenuUiBounds();

     screenLayerActive = true;
     screenLayerTimer = -1;
     screenLayerDuration = -1;
     gameScreenMode = "screenWelcome";

     screenActionUi.startButton.x = 0;
     screenActionUi.startButton.y = 0;
     screenActionUi.startButton.width = 0;
     screenActionUi.startButton.height = 0;

     screenActionUi.instructionsButton.x = 0;
     screenActionUi.instructionsButton.y = 0;
     screenActionUi.instructionsButton.width = 0;
     screenActionUi.instructionsButton.height = 0;

     screenActionUi.menuButton.x = 0;
     screenActionUi.menuButton.y = 0;
     screenActionUi.menuButton.width = 0;
     screenActionUi.menuButton.height = 0;

     pausedActionUi.resumeButton.x = 0;
     pausedActionUi.resumeButton.y = 0;
     pausedActionUi.resumeButton.width = 0;
     pausedActionUi.resumeButton.height = 0;

     pausedActionUi.instructionsButton.x = 0;
     pausedActionUi.instructionsButton.y = 0;
     pausedActionUi.instructionsButton.width = 0;
     pausedActionUi.instructionsButton.height = 0;

     pausedActionUi.menuButton.x = 0;
     pausedActionUi.menuButton.y = 0;
     pausedActionUi.menuButton.width = 0;
     pausedActionUi.menuButton.height = 0;

     bindKeyboardInput();
     bindPointerInput();
     bindResizeHandler(updateMiniGameCanvasSize);

     gameLoop();
}

if (!miniGameCanvas || !miniGameCtx) {
     console.warn("Sparkle Seeker canvas not found.");
} else {
     startSparkleSeeker();
}
