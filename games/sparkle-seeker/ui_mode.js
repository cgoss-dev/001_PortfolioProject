// NOTE: UI MODE / MENU / OVERLAY / STARTUP
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
// - menu rendering
//
// Beginner note:
// Think of this file as the "brain" for UI state.
// A future ui_draw.js will be the "paintbrush."

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
     musicEnabled,
     soundEffectsEnabled,
     difficultyIndex,
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
     setMusicEnabled,
     setSoundEffectsEnabled,
     setDifficultyIndex,
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
     updateSparkleSpawns,
     updateObstacleSpawns,
     updateSparkles,
     updateObstacles,
     updateCollisionBursts,
     collectSparkles,
     hitObstacles
} from "./entities.js";

// DRAW IMPORTS
// These will come from ui_draw.js after the second half of the split.
// This keeps state/update logic separate from canvas rendering.
import {
     drawGame,
     updateWelcomeTitleColors
} from "./ui_draw.js";

// NOTE - 🛑 DIFFICULTY OPTIONS

export const difficultyOptions = ["Easy", "Normal", "Hard"];
export const startOverlayDuration = 120;
export const overlayFadeFrames = 30;

// WELCOME STATE
// Page-load welcome state is owned locally here.
// First action is expected to be triggered from input handling.
let gameWelcome = true;
let gameWelcomeTimer = -1;
let gameWelcomeDuration = -1;

// NOTE: WELCOME MODE
// This started as only the page-load welcome screen,
// but now it also powers full-screen instructions / win / lose states.
// Keeping one shared screen state is simpler for a beginner than
// maintaining several separate full-screen UI systems.
let gameWelcomeMode = "welcome";

// WELCOME ACTION TARGETS
// Clickable word bounds are stored here for input handling.
const gameWelcomeUi = {
     startButton: { x: 0, y: 0, width: 0, height: 0 },
     instructionsButton: { x: 0, y: 0, width: 0, height: 0 },
     menuButton: { x: 0, y: 0, width: 0, height: 0 }
};

// PAUSE ACTION TARGETS
// Clickable word bounds for the paused marquee are stored here.
const gamePausedUi = {
     resumeButton: { x: 0, y: 0, width: 0, height: 0 },
     instructionsButton: { x: 0, y: 0, width: 0, height: 0 },
     menuButton: { x: 0, y: 0, width: 0, height: 0 }
};

// WELCOME TITLE CONTENT
// The actual rainbow color engine + drawing lives in ui_draw.js now.
// This file only owns the state/mode that decides what should be shown.
const welcomeTitleLines = ["SPARKLE", "SEEKER"];

export function isGameWelcomeActive() {
     return gameWelcome;
}

export function getGameWelcomeUi() {
     return gameWelcomeUi;
}

export function getGamePausedUi() {
     return gamePausedUi;
}

// WELCOME MODE GETTER
// Input code can read this to decide what each action word should do.
export function getGameWelcomeMode() {
     return gameWelcomeMode;
}

// WELCOME TITLE GETTER
// ui_draw.js reads this instead of owning the source text itself.
export function getWelcomeTitleLines() {
     return welcomeTitleLines;
}

// NOTE: WELCOME TITLE LINE LOOKUP
// Draw code asks state code which title should be displayed.
export function getCurrentWelcomeTitleLines() {
     if (gameWelcomeMode === "win") {
          return ["YOU", "WIN"];
     }

     if (gameWelcomeMode === "lose") {
          return ["TRY", "AGAIN"];
     }

     return welcomeTitleLines;
}

// NOTE: WELCOME ACTION TEXT LOOKUP
// Draw code asks state code which action words should be displayed.
export function getCurrentWelcomeActionTexts() {
     if (gameWelcomeMode === "welcome") {
          return ["START", "TIPS", "MENU"];
     }

     if (gameWelcomeMode === "win") {
          return ["START", "TIPS", "MENU"];
     }

     if (gameWelcomeMode === "lose") {
          return ["START", "TIPS", "MENU"];
     }

     return ["START", "TIPS", "MENU"];
}

export function dismissGameWelcomeToStart() {
     gameWelcome = false;
     gameWelcomeMode = "welcome";
     gameWelcomeTimer = 0;
     gameWelcomeDuration = 0;
     startNewGameRound();
}

// NOTE: WELCOME -> INSTRUCTIONS MENU
// This uses the existing menu instructions submenu,
// instead of a separate full-screen instructions page.
export function dismissGameWelcomeToInstructionsMenu() {
     gameWelcome = false;
     gameWelcomeMode = "welcome";
     gameWelcomeTimer = 0;
     gameWelcomeDuration = 0;

     resetGameState();
     resetTouchControls();
     resetEntityColorCycle();

     updateMiniGameCanvasSize();
     resetPlayerPosition();
     updateTouchControlBounds();
     updateMenuUiBounds();

     setGameStarted(false);
     setGamePaused(false);
     setGameMenuOpen(true);
     setGameMenuView("instructions");
     setGameOver(false);
     setGameWon(false);

     clearGameOverlay();
}

export function dismissGameWelcomeToMenu() {
     gameWelcome = false;
     gameWelcomeMode = "welcome";
     gameWelcomeTimer = 0;
     gameWelcomeDuration = 0;

     resetGameState();
     resetTouchControls();
     resetEntityColorCycle();

     updateMiniGameCanvasSize();
     resetPlayerPosition();
     updateTouchControlBounds();
     updateMenuUiBounds();

     setGameStarted(false);
     setGamePaused(false);
     setGameMenuOpen(true);
     setGameMenuView("main");
     setGameOver(false);
     setGameWon(false);

     clearGameOverlay();
}

// FULL-SCREEN WELCOME SCREEN HELPERS
// These functions let other files switch the big full-screen state
// without needing to know the low-level timer details.
export function showGameWelcomeScreen(mode = "welcome") {
     gameWelcome = true;
     gameWelcomeMode = mode;
     gameWelcomeTimer = -1;
     gameWelcomeDuration = -1;
}

export function dismissGameWelcomeBackToMain() {
     gameWelcome = true;
     gameWelcomeMode = "welcome";
     gameWelcomeTimer = -1;
     gameWelcomeDuration = -1;
}

// WELCOME ALPHA
// Same fade math is reused here for page-load welcome state.
export function getGameWelcomeAlpha() {
     if (!gameWelcome) {
          return 0;
     }

     if (gameWelcomeTimer < 0 || gameWelcomeDuration < 0) {
          return 1;
     }

     const elapsed = gameWelcomeDuration - gameWelcomeTimer;
     const fadeIn = Math.min(1, elapsed / overlayFadeFrames);
     const fadeOut = Math.min(1, gameWelcomeTimer / overlayFadeFrames);

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

     setGameStarted(true);
     setGamePaused(false);
     setGameMenuOpen(false);
     setGameMenuView("main");
     setGameOver(false);
     setGameWon(false);
}

// MENU

export function getCurrentDifficultyLabel() {
     return difficultyOptions[difficultyIndex] || "Normal";
}

export function getCurrentSoundLabel() {
     return (musicEnabled && soundEffectsEnabled) ? "On" : "Off";
}

export function cycleDifficulty() {
     setDifficultyIndex((difficultyIndex + 1) % difficultyOptions.length);
}

export function toggleAllSound() {
     const next = !(musicEnabled && soundEffectsEnabled);
     setMusicEnabled(next);
     setSoundEffectsEnabled(next);
}

export function updateMenuUiBounds() {
     // FULL-CANVAS MENU PANEL
     // The menu now uses the entire canvas instead of a centered popup box.
     const panelX = 0;
     const panelY = 0;
     const panelWidth = miniGameWidth;
     const panelHeight = miniGameHeight;

     gameMenuUi.panel.x = panelX;
     gameMenuUi.panel.y = panelY;
     gameMenuUi.panel.width = panelWidth;
     gameMenuUi.panel.height = panelHeight;

     // FULL-CANVAS MENU LAYOUT
     // Buttons are centered inside the whole canvas now.
     const sidePadding = Math.max(24, panelWidth * 0.12);
     const buttonHeight = 35;
     const buttonX = panelX + sidePadding;
     const buttonWidth = panelWidth - (sidePadding * 2);

     const stackedButtons = [
          gameMenuUi.newGameButton,
          gameMenuUi.instructionsButton,
          gameMenuUi.difficultyButton,
          gameMenuUi.soundButton,
          gameMenuUi.backButton
     ];

     const buttonCount = stackedButtons.length;
     const totalButtonHeight = buttonCount * buttonHeight;
     const availableHeight = panelHeight - totalButtonHeight;
     const gap = Math.max(18, availableHeight / (buttonCount + 1));

     stackedButtons.forEach((button, index) => {
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

// NOTE: SHARED INSTRUCTIONS TEXT
// Single source of truth for all instructions in the game.
export function getInstructionLines() {
     return [
          "Collect sparkles, avoid obstacles.",
          "Hold WASD/arrows or pointer/touch to move.",
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
     if (!gameOverlayText) return 0;
     if (gameOverlayTimer < 0 || gameOverlayDuration < 0) return 1;

     const elapsed = gameOverlayDuration - gameOverlayTimer;
     const fadeIn = Math.min(1, elapsed / overlayFadeFrames);
     const fadeOut = Math.min(1, gameOverlayTimer / overlayFadeFrames);

     return Math.max(0, Math.min(1, Math.min(fadeIn, fadeOut)));
}

// PAUSE SYNC

export function syncPauseOverlay() {
     // NOTE: PAUSE OVERLAY REMOVED
     // Pause now uses a marquee screen instead of the old centered text overlay.
}

// GAME UPDATE

export function updateGame() {
     updatePauseButtonState();
     updateGameOverlayTimer();

     // WELCOME GATE
     // Gameplay updates are held here until welcome state is dismissed.
     if (gameWelcome) {
          updateWelcomeTitleColors(getCurrentWelcomeTitleLines());
          return;
     }

     if (!gameStarted) {
          return;
     }

     // NOTE: FACE STATE SHOULD STILL UPDATE WHILE PAUSED
     // This lets pause force the neutral face even though gameplay itself is frozen.
     updatePlayerFaceState();

     if (gamePaused || gameMenuOpen || gameOver || gameWon) {
          return;
     }

     updatePlayer();

     updateSparkleSpawns();
     updateObstacleSpawns();

     updateSparkles();
     updateObstacles();
     updateCollisionBursts();

     collectSparkles();
     hitObstacles();

     if (playerHealth <= 0) {
          setGameOver(true);
          setGameWon(false);
          setGamePaused(true);
          setGameMenuOpen(false);
          setGameMenuView("main");
          resetTouchControls();
          clearGameOverlay();
          showGameWelcomeScreen("lose");
          return;
     }

     // REVIEW: WIN CONDITIONS
     if (sparkleScore >= 1000) {
          setGameWon(true);
          setGameOver(false);
          setGamePaused(true);
          setGameMenuOpen(false);
          setGameMenuView("main");
          resetTouchControls();
          clearGameOverlay();
          showGameWelcomeScreen("win");
     }
}

function gameLoop() {
     updateGame();
     drawGame();
     requestAnimationFrame(gameLoop);
}

// NOTE: STARTUP

export function startSparkleSeeker() {
     resetGameState();
     resetTouchControls();
     resetEntityColorCycle();

     updateMiniGameCanvasSize();
     resetPlayerPosition();
     updateTouchControlBounds();
     updateMenuUiBounds();

     // WELCOME RESET
     // Welcome state is restored here on page load.
     gameWelcome = true;
     gameWelcomeTimer = -1;
     gameWelcomeDuration = -1;
     gameWelcomeMode = "welcome";

     gameWelcomeUi.startButton.x = 0;
     gameWelcomeUi.startButton.y = 0;
     gameWelcomeUi.startButton.width = 0;
     gameWelcomeUi.startButton.height = 0;

     gameWelcomeUi.instructionsButton.x = 0;
     gameWelcomeUi.instructionsButton.y = 0;
     gameWelcomeUi.instructionsButton.width = 0;
     gameWelcomeUi.instructionsButton.height = 0;

     gameWelcomeUi.menuButton.x = 0;
     gameWelcomeUi.menuButton.y = 0;
     gameWelcomeUi.menuButton.width = 0;
     gameWelcomeUi.menuButton.height = 0;

     gamePausedUi.resumeButton.x = 0;
     gamePausedUi.resumeButton.y = 0;
     gamePausedUi.resumeButton.width = 0;
     gamePausedUi.resumeButton.height = 0;

     gamePausedUi.instructionsButton.x = 0;
     gamePausedUi.instructionsButton.y = 0;
     gamePausedUi.instructionsButton.width = 0;
     gamePausedUi.instructionsButton.height = 0;

     gamePausedUi.menuButton.x = 0;
     gamePausedUi.menuButton.y = 0;
     gamePausedUi.menuButton.width = 0;
     gamePausedUi.menuButton.height = 0;

     bindKeyboardInput();
     bindPointerInput();
     bindResizeHandler();

     gameLoop();
}

if (!miniGameCanvas || !miniGameCtx) {
     console.warn("Sparkle Seeker canvas not found.");
} else {
     startSparkleSeeker();
}