// NOTE: UI / MENU / OVERLAY / STARTUP
// Game entry file loaded by page.
//
// Owned here: canvas size syncing, round/startup flow, game UI drawing.
// Shared visual values pulled from root CSS through window.SiteTheme.

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
     maxPlayerHealth,
     touchControls,

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
     hitObstacles,

     drawPlayer,
     drawSparkles,
     drawObstacles,
     drawCollisionBursts
} from "./entities.js";

// UI CONSTANTS

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
// Keeping one shared screen renderer is simpler for a beginner than
// maintaining several different full-screen UI systems.
let gameWelcomeMode = "welcome";

// WELCOME ACTION TARGETS
// Clickable word bounds are stored here for input handling.
const gameWelcomeUi = {
     startButton: { x: 0, y: 0, width: 0, height: 0 },
     instructionsButton: { x: 0, y: 0, width: 0, height: 0 },
     menuButton: { x: 0, y: 0, width: 0, height: 0 }
};

// WELCOME TITLE COLOR ENGINE
// Canvas title colors are cycled here using shared root theme helpers.
const welcomeTitleLines = ["SPARKLE", "SEEKER"];
let welcomeColorEngine = null;
let welcomePreviousColors = [];
let welcomeCurrentColors = [];
let welcomeLastColorCycleTime = 0;

export function isGameWelcomeActive() {
     return gameWelcome;
}

export function getGameWelcomeUi() {
     return gameWelcomeUi;
}

// WELCOME MODE GETTER
// Input code can read this to decide what each action word should do.
export function getGameWelcomeMode() {
     return gameWelcomeMode;
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

// CSS HELPERS

const siteTheme = window.SiteTheme;

function getCssColor(variableName, fallback = "#ffffff") {
     return siteTheme?.getCssColor?.(variableName, fallback) || fallback;
}

function getCssNumber(variableName, fallback = 0) {
     return siteTheme?.getCssNumber?.(variableName, fallback) ?? fallback;
}

// STRING VALUE HELPER: Font-family values pulled from root CSS here.
function getCssString(variableName, fallback = "") {
     if (!document?.documentElement) {
          return fallback;
     }

     const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
     return value || fallback;
}

// PIXEL SIZE HELPER: clamp()/rem values from root CSS resolved into px here for canvas text. Canvas needs a real number, not raw CSS text.
function getCssPixelSize(variableName, fallback = 16) {
     if (!document?.body) {
          return fallback;
     }

     const probe = document.createElement("span");
     probe.style.position = "absolute";
     probe.style.visibility = "hidden";
     probe.style.pointerEvents = "none";
     probe.style.fontSize = `var(${variableName})`;
     probe.textContent = "M";

     document.body.appendChild(probe);
     const resolved = parseFloat(getComputedStyle(probe).fontSize);
     document.body.removeChild(probe);

     return Number.isFinite(resolved) ? resolved : fallback;
}

// SHARED UI THEME

function getUiTheme() {
     return {
          fonts: {
               display: getCssString("--font-fancy", '"Bungee Shade", cursive'),
               body: getCssString("--font-body", '"Noto Sans Mono", monospace'),
               symbol: '"Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif'
          },

          colors: {
               white: getCssColor("--text-color", "#ffffff"),
               softWhite: getCssColor("--text-color-medium", "rgba(255, 255, 255, 0.75)"),

               panelFill: "rgba(0, 0, 0, 0.9)",

               // OUTLINE GROUP A: Menu popup outline + touch button outline.
               outlineStrong: getCssColor("--accent-color", "#ffffff"),

               // OUTLINE GROUP B: Menu option button outline.
               outlineSoft: "rgba(255, 255, 255, 0.25)",

               buttonFill: "rgba(255, 255, 255, 0.15)", // MENU OPTIONS BUTTONS
               buttonText: getCssColor("--text-color-medium", "#ffffff"),

               controlFill: "rgba(255, 255, 255, 0.1)", // START/MENU BUTTONS
               controlFillPressed: "rgba(255, 255, 255, 0.25)",
               controlText: getCssColor("--text-color", "#ffffff"),

               controlGlow: getCssColor("--accent-color", "#ffffff"),

               overlayGlow: getCssColor("--accent-color", "#ffffff"),
               scoreGlow: getCssColor("--accent-color", "#ffffff"),

               heartFull: "#ffffff",
               heartGlow: "#ffffff"
          },

          sizes: {
               scoreFont: 32,
               scoreX: 8,
               scoreY: 8,

               heartFont: 24,
               heartGap: 15,
               heartY: 5,
               heartXPadding: 8,

               overlayTitleFont: 36,
               overlaySubFont: getCssPixelSize("--text-size-medium", 14),

               // WELCOME TITLE SIZE
               // Title is allowed to scale from canvas size here.
               welcomeSubFont: getCssPixelSize(10),

               menuButtonFont: getCssPixelSize(10),
               menuSmallFont: getCssPixelSize(10),

               controlRadius: getCssNumber("--canvasboard-radius", 15)
          },

          glow: {
               uiSoftGlow: getCssNumber("--glow-bg-particle-blur", 10),
               uiMediumGlow: getCssNumber("--glow-game-particle-blur", 16),
               uiStrongGlow: getCssNumber("--glow-game-particle-blur", 16) * 1.35
          }
     };
}

// NOTE: SHARED DRAW HELPERS

function isPointInsideRect(x, y, rect) {
     return (
          x >= rect.x &&
          x <= rect.x + rect.width &&
          y >= rect.y &&
          y <= rect.y + rect.height
     );
}

function drawRoundedRect(x, y, width, height, radius) {
     if (!miniGameCtx) {
          return;
     }

     const r = Math.min(radius, width / 2, height / 2);

     miniGameCtx.beginPath();
     miniGameCtx.moveTo(x + r, y);
     miniGameCtx.lineTo(x + width - r, y);
     miniGameCtx.quadraticCurveTo(x + width, y, x + width, y + r);
     miniGameCtx.lineTo(x + width, y + height - r);
     miniGameCtx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
     miniGameCtx.lineTo(x + r, y + height);
     miniGameCtx.quadraticCurveTo(x, y + height, x, y + height - r);
     miniGameCtx.lineTo(x, y + r);
     miniGameCtx.quadraticCurveTo(x, y, x + r, y);
     miniGameCtx.closePath();
}

// PANEL BOX BORDER
// Shared fill/stroke box is drawn here so repetition is reduced.
function drawPanelBox(x, y, width, height, theme, lineWidth = 3) {
     const { colors, glow, sizes } = theme;

     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiStrongGlow;

     drawRoundedRect(x, y, width, height, sizes.controlRadius);
     miniGameCtx.fillStyle = colors.panelFill;
     miniGameCtx.fill();

     miniGameCtx.shadowBlur = 0;
     miniGameCtx.strokeStyle = colors.outlineStrong;
     miniGameCtx.lineWidth = lineWidth;

     drawRoundedRect(x, y, width, height, sizes.controlRadius);
     miniGameCtx.stroke();
}

// WRAPPED TEXT DRAW
// Line breaks are measured from available width here. Line count is returned so spacing can be advanced below.
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
     const words = text.split(" ");
     let line = "";
     const lines = [];

     for (let i = 0; i < words.length; i += 1) {
          const testLine = `${line}${words[i]} `;
          const testWidth = ctx.measureText(testLine).width;

          if (testWidth > maxWidth && i > 0) {
               lines.push(line.trim());
               line = `${words[i]} `;
          } else {
               line = testLine;
          }
     }

     lines.push(line.trim());

     lines.forEach((wrappedLine, index) => {
          ctx.fillText(wrappedLine, x, y + (index * lineHeight));
     });

     return lines.length;
}

// NOTE: SCREEN CONTENT HELPERS
// These small helpers make the giant welcome renderer easier to read.
// Instead of hardcoding text in 5 places, we define each screen's content here.
function getCurrentWelcomeTitleLines() {
     if (gameWelcomeMode === "win") {
          return ["YOU", "WIN"];
     }

     if (gameWelcomeMode === "lose") {
          return ["TRY", "AGAIN"];
     }

     return welcomeTitleLines;
}

function getCurrentWelcomeActionTexts() {
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

// WELCOME COLOR SETUP
// Shared root color engine is reused here for canvas title letters.
function ensureWelcomeColorEngine() {
     if (welcomeColorEngine || !siteTheme?.createColorEngine || !siteTheme?.getRainbowPalette) {
          return;
     }

     welcomeColorEngine = siteTheme.createColorEngine(siteTheme.getRainbowPalette);
}

function updateWelcomeTitleColors(titleLines = welcomeTitleLines) {
     ensureWelcomeColorEngine();

     const rainbowCycleSpeed = siteTheme?.getTextSettings?.().rainbowCycleSpeed ?? 900;
     const now = performance.now();

     if (welcomeCurrentColors.length && welcomeCurrentColors[0]?.length && (now - welcomeLastColorCycleTime) < rainbowCycleSpeed) {
          return;
     }

     if (!welcomeColorEngine?.nextCycle) {
          const fallbackColor = getCssColor("--text-color", "#ffffff");
          welcomeCurrentColors = titleLines.map((line) => Array(line.length).fill(fallbackColor));
          welcomePreviousColors = welcomeCurrentColors.map((colors) => [...colors]);
          welcomeLastColorCycleTime = now;
          return;
     }

     welcomeCurrentColors = titleLines.map((line, lineIndex) =>
          welcomeColorEngine.nextCycle(line.length, welcomePreviousColors[lineIndex] || [])
     );

     welcomePreviousColors = welcomeCurrentColors.map((colors) => [...colors]);
     welcomeLastColorCycleTime = now;
}

// WELCOME TITLE FIT
// Font size is reduced until both title lines fit safely inside canvas.
function getWelcomeTitleFontSize(theme, titleLines = welcomeTitleLines) {
     const { fonts } = theme;
     const baseSize = Math.min(miniGameWidth * 0.18, miniGameHeight * 0.16);
     const maxSize = Math.max(48, baseSize);
     const minSize = 28;
     const sidePadding = 32;
     let fontSize = maxSize;

     miniGameCtx.save();

     while (fontSize > minSize) {
          miniGameCtx.font = `${fontSize}px ${fonts.display}`;

          const lineWidths = titleLines.map((line) => {
               let width = 0;

               for (let i = 0; i < line.length; i += 1) {
                    width += miniGameCtx.measureText(line[i]).width;
               }

               return width;
          });

          const widestLine = Math.max(...lineWidths);

          if (widestLine <= (miniGameWidth - (sidePadding * 2))) {
               break;
          }

          fontSize -= 2;
     }

     miniGameCtx.restore();

     return fontSize;
}

function drawMenuButton(button, label, theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, sizes, fonts, glow } = theme;
     const centerX = button.x + (button.width / 2);
     const centerY = button.y + (button.height / 2);

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.buttonFill; // FIXME: REVISIT MENU BUTTONS
     miniGameCtx.strokeStyle = colors.outlineSoft;
     miniGameCtx.lineWidth = 2;
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     drawRoundedRect(button.x, button.y, button.width, button.height, sizes.controlRadius);
     miniGameCtx.fill();
     miniGameCtx.stroke();

     miniGameCtx.fillStyle = colors.buttonText;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     // FONT STRING
     // Explicit normal weight used here so "Back" stays on body font consistently.
     miniGameCtx.font = `400 ${sizes.menuButtonFont}px ${fonts.body}`;
     miniGameCtx.fillText(label, centerX, centerY + 1);

     miniGameCtx.restore();
}

// START/STOP BUTTON SHAPE
function drawControlButton(button, isPressed, theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, glow } = theme;
     const centerX = button.x + (button.width / 2);
     const centerY = button.y + (button.height / 2);
     const radius = button.width / 2;

     miniGameCtx.save();
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = isPressed ? glow.uiStrongGlow : glow.uiMediumGlow;

     miniGameCtx.beginPath();
     miniGameCtx.arc(centerX, centerY, radius * 1.25, 0, Math.PI * 2);

     miniGameCtx.fillStyle = isPressed ? colors.controlFillPressed : colors.controlFill;
     miniGameCtx.fill();

     miniGameCtx.lineWidth = 3;
     miniGameCtx.strokeStyle = colors.outlineStrong;
     miniGameCtx.stroke();

     miniGameCtx.restore();
}

// BACKGROUND / MASTER DRAW HELPERS

function drawMiniGameBackground() {
     if (!miniGameCtx) {
          return;
     }

     miniGameCtx.clearRect(0, 0, miniGameWidth, miniGameHeight);
     miniGameCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);
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

     showTimedGameOverlay("LET'S PLAY!");
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
     // NOTE: FULL-CANVAS MENU PANEL
     // The menu now uses the entire canvas instead of a centered popup box.
     const panelX = 0;
     const panelY = 0;
     const panelWidth = miniGameWidth;
     const panelHeight = miniGameHeight;

     gameMenuUi.panel.x = panelX;
     gameMenuUi.panel.y = panelY;
     gameMenuUi.panel.width = panelWidth;
     gameMenuUi.panel.height = panelHeight;

     // NOTE: FULL-CANVAS MENU LAYOUT
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
     return isPointInsideRect(x, y, gameMenuUi.panel);
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

// WELCOME ALPHA
// Same fade math is reused here for page-load welcome state.
function getGameWelcomeAlpha() {
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

// PAUSE SYNC

export function syncPauseOverlay() {
     const shouldShow = gameStarted && gamePaused && !gameMenuOpen && !gameOver && !gameWon;

     if (shouldShow) {
          showPersistentGameOverlay("PAUSED");
          return;
     }

     if (gameOverlayText === "PAUSED" && (!gamePaused || gameMenuOpen || gameOver || gameWon)) {
          clearGameOverlay();
     }
}

// GAME UPDATE / DRAW

export function updateGame() {
     updatePauseButtonState();
     updateGameOverlayTimer();
     syncPauseOverlay();

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

export function drawGame() {
     const theme = getUiTheme();

     drawMiniGameBackground();

     // WELCOME DRAW GATE
     // Canvas HUD and controls are hidden here while welcome state is active.
     if (gameWelcome) {
          drawGameWelcomeOverlay(theme);
          return;
     }

     drawSparkles();
     drawObstacles();
     drawCollisionBursts();
     drawPlayer();

     drawScore(theme);
     drawHealth(theme);
     drawTouchButtons(theme);

     // LAYER GATE
     // Only one top UI state is drawn here. Stack order is kept clear by branching here.
     if (gameMenuOpen) {
          drawMenuOverlay(theme);
     } else {
          drawGameStatusOverlay(theme);
     }
}

function gameLoop() {
     updateGame();
     drawGame();
     requestAnimationFrame(gameLoop);
}

// UI DRAW FUNCTIONS

function drawScore(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, sizes, fonts } = theme;
     const formattedScore = String(sparkleScore).padStart(3, "0");

     miniGameCtx.save();
     miniGameCtx.font = `${sizes.scoreFont}px ${fonts.display}`;
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = colors.white;
     miniGameCtx.shadowColor = colors.white;
     miniGameCtx.shadowBlur = 10;
     miniGameCtx.fillText(formattedScore, sizes.scoreX, sizes.scoreY);
     miniGameCtx.restore();
}

function drawHealth(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, sizes, fonts, glow } = theme;
     const filledHeart = "♥";
     const emptyHeart = "♡";
     const heartsPerRow = 5;

     let topRow = "";
     let bottomRow = "";

     // TOP ROW: Hearts 10 → 6.
     for (let i = maxPlayerHealth - 1; i >= heartsPerRow; i -= 1) {
          bottomRow += (i < playerHealth) ? filledHeart : emptyHeart;
     }
     //NOTE: SWAPPED TOP/BOTTOM ROWS FOR TESTING
     // BOTTOM ROW: Hearts 5 → 1.
     for (let i = heartsPerRow - 1; i >= 0; i -= 1) {
          topRow += (i < playerHealth) ? filledHeart : emptyHeart;
     }

     miniGameCtx.save();
     miniGameCtx.font = `${sizes.heartFont}px ${fonts.body}`;
     miniGameCtx.textAlign = "right";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = colors.heartFull;
     miniGameCtx.shadowColor = colors.heartGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;
     miniGameCtx.fillText(topRow, miniGameWidth - sizes.heartXPadding, sizes.heartY);
     miniGameCtx.fillText(bottomRow, miniGameWidth - sizes.heartXPadding, sizes.heartY + sizes.heartGap);
     miniGameCtx.restore();
}

// BUTTON LABELS
export function drawTouchButtons(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, fonts, glow } = theme;
     const leftButton = touchControls.leftButton;
     const rightButton = touchControls.rightButton;

     // BUTTON DRAW
     // Circular button rendering handled in drawControlButton.
     drawControlButton(leftButton, leftButton.isPressed, theme);
     drawControlButton(rightButton, rightButton.isPressed, theme);

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.controlText;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     // LABEL SIZE
     // Scaled from button size here for consistent visual balance.
     miniGameCtx.font = `${leftButton.height * 0.5}px ${fonts.symbol}`;
     miniGameCtx.fillText(
          leftButton.label,
          leftButton.x + (leftButton.width / 2),
          leftButton.y + (leftButton.height / 2) + 1
     ); //FIXME: REVISIT LABELS

     miniGameCtx.font = `${rightButton.height * 0.5}px ${fonts.symbol}`;
     miniGameCtx.fillText(
          rightButton.label,
          rightButton.x + (rightButton.width / 2),
          rightButton.y + (rightButton.height / 2) + 1
     );

     miniGameCtx.restore();
}

// NOTE: SHARED INSTRUCTIONS TEXT
// Single source of truth for all instructions in the game.
function getInstructionLines() {
     return [
          "Collect sparkles, avoid obstacles.",
          "Use WASD/arrows or pointer/touch.",
          "Speed scales with health.",
          "Max health = 2x points.",
     ];
}

export function drawMenuOverlay(theme) {
     if (!miniGameCtx || !gameMenuOpen) {
          return;
     }

     const { colors, fonts, sizes } = theme;

     miniGameCtx.save();
     miniGameCtx.globalAlpha = 1;

     // NOTE: FULL-CANVAS MENU BACKDROP
     // The entire canvas is now the menu surface.
     miniGameCtx.fillStyle = "rgba(0, 0, 0, 0.85)";
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

     // NOTE: FULL-CANVAS BORDER
     // Instead of a popup box in the middle, the full canvas gets the framed border.
     drawPanelBox(
          0,
          0,
          miniGameWidth,
          miniGameHeight,
          theme
     );

     if (gameMenuView === "main") {
          drawMenuButton(gameMenuUi.newGameButton, "New Game", theme);
          drawMenuButton(gameMenuUi.instructionsButton, "Instructions", theme);
          drawMenuButton(gameMenuUi.difficultyButton, `Difficulty: ${getCurrentDifficultyLabel()}`, theme);
          drawMenuButton(gameMenuUi.soundButton, `Sound: ${getCurrentSoundLabel()}`, theme);

     } else if (gameMenuView === "instructions") {
          miniGameCtx.shadowBlur = 0;
          miniGameCtx.fillStyle = colors.softWhite;
          miniGameCtx.textAlign = "left";
          miniGameCtx.textBaseline = "top";

          const textX = Math.max(24, miniGameWidth * 0.12);
          let textY = Math.max(28, miniGameHeight * 0.12);
          const fontSize = Math.max(12, sizes.menuSmallFont * Math.min(1, miniGameWidth / 320));
          const lineHeight = fontSize * 1.4;
          const sectionGap = lineHeight * 0.5;
          const maxTextWidth = miniGameWidth - (textX * 2);

          miniGameCtx.font = `400 ${fontSize}px ${fonts.body}`;

          // NOTE: USE SHARED INSTRUCTIONS
          const instructionLines = getInstructionLines();

          instructionLines.forEach((instructionLine) => {
               textY += (
                    drawWrappedText(
                         miniGameCtx,
                         instructionLine,
                         textX,
                         textY,
                         maxTextWidth,
                         lineHeight
                    ) * lineHeight
               ) + sectionGap;
          });
     }

     drawMenuButton(gameMenuUi.backButton, "Back", theme);
     miniGameCtx.restore();
}

function drawGameWelcomeOverlay(theme) {
     if (!miniGameCtx || !gameWelcome) {
          return;
     }

     const { colors, fonts, glow, sizes } = theme;
     const alpha = getGameWelcomeAlpha();
     const titleLines = getCurrentWelcomeTitleLines();
     const actionTexts = getCurrentWelcomeActionTexts();
     const titleFontSize = getWelcomeTitleFontSize(theme, titleLines);
     const lineGap = Math.max(12, titleFontSize * 0.12);

     // TITLE Y POSITIONS
     // Two-line title layout is kept centered.
     const firstLineY = (miniGameHeight / 2) - ((titleFontSize * 0.8) + (lineGap * 0.5));
     const secondLineY = firstLineY + titleFontSize + lineGap;

     // NOTE: MODE-SPECIFIC CONTENT SPACING
     // Some modes need room for body text, while others only need action words.
     const actionGap = Math.max(28, titleFontSize * 0.45);
     const actionY = (gameWelcomeMode === "instructions")
          ? (miniGameHeight * 0.82)
          : (secondLineY + Math.max(28, titleFontSize * 0.95));

     updateWelcomeTitleColors(titleLines);

     miniGameCtx.save();
     miniGameCtx.globalAlpha = alpha;

     // WELCOME BACKDROP
     // Subtle dimming is applied here so marquee title reads cleanly.
     miniGameCtx.fillStyle = "rgba(0, 0, 0, 0.25)";
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

     // WELCOME TITLE LETTERS
     // Each letter is measured and placed individually here so colors can vary per character.
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.font = `${titleFontSize}px ${fonts.display}`;

     titleLines.forEach((line, lineIndex) => {
          const y = lineIndex === 0 ? firstLineY : secondLineY;
          const colorsForLine = welcomeCurrentColors[lineIndex] || [];
          const letterWidths = [];

          for (let i = 0; i < line.length; i += 1) {
               letterWidths.push(miniGameCtx.measureText(line[i]).width);
          }

          const totalWidth = letterWidths.reduce((sum, width) => sum + width, 0);
          let x = (miniGameWidth - totalWidth) / 2;

          for (let i = 0; i < line.length; i += 1) {
               const letter = line[i];
               const letterWidth = letterWidths[i];
               const letterColor = colorsForLine[i] || colors.white;

               miniGameCtx.fillStyle = letterColor;
               miniGameCtx.shadowColor = letterColor;
               miniGameCtx.shadowBlur = glow.uiStrongGlow;
               miniGameCtx.fillText(letter, x, y);

               x += letterWidth;
          }
     });

     // NOTE: FULL-SCREEN INSTRUCTIONS (DISABLED)
     // We now use the menu instructions instead.
     // Leaving this block intentionally empty to avoid layout breakage.
     if (gameWelcomeMode === "instructions") {
          // no-op
     }

     else if (gameWelcomeMode === "win" || gameWelcomeMode === "lose") {
          miniGameCtx.save();
          miniGameCtx.textAlign = "center";
          miniGameCtx.textBaseline = "middle";
          miniGameCtx.fillStyle = colors.softWhite;
          miniGameCtx.shadowColor = colors.overlayGlow;
          miniGameCtx.shadowBlur = glow.uiSoftGlow;
          miniGameCtx.font = `400 ${Math.max(16, sizes.welcomeSubFont * 1.15)}px ${fonts.body}`;

          const subtext = (gameWelcomeMode === "win")
               ? ""
               : ""; // Just in case i want to add test later

          miniGameCtx.fillText(
               subtext,
               miniGameWidth / 2,
               secondLineY + Math.max(24, titleFontSize * 0.75)
          );

          miniGameCtx.restore();
     }

     // RESET ACTION BOUNDS
     // Always clear old hit boxes first so stale click areas do not survive
     // when switching between screens with different action counts.
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

     // NOTE: WELCOME ACTION WORDS
     // Click targets are measured and stored here for input handling.
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.overlayGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;
     miniGameCtx.font = `400 ${Math.max(18, sizes.welcomeSubFont * 1.35)}px ${fonts.body}`;

     const actionHeight = Math.max(28, sizes.welcomeSubFont * 1.8);
     const buttonPaddingX = 8;

     const measuredActions = actionTexts.map((text) => ({
          text,
          width: miniGameCtx.measureText(text).width
     }));

     const totalActionWidth =
          measuredActions.reduce((sum, item) => sum + item.width, 0) +
          (actionGap * Math.max(0, measuredActions.length - 1));

     let currentX = (miniGameWidth - totalActionWidth) / 2;

     measuredActions.forEach((item) => {
          const buttonWidth = item.width + (buttonPaddingX * 2);

          if (item.text === "START") {
               gameWelcomeUi.startButton.x = currentX - buttonPaddingX;
               gameWelcomeUi.startButton.y = actionY - (actionHeight / 2);
               gameWelcomeUi.startButton.width = buttonWidth;
               gameWelcomeUi.startButton.height = actionHeight;
          }

          if (item.text === "TIPS") {
               gameWelcomeUi.instructionsButton.x = currentX - buttonPaddingX;
               gameWelcomeUi.instructionsButton.y = actionY - (actionHeight / 2);
               gameWelcomeUi.instructionsButton.width = buttonWidth;
               gameWelcomeUi.instructionsButton.height = actionHeight;
          }

          if (item.text === "MENU") {
               gameWelcomeUi.menuButton.x = currentX - buttonPaddingX;
               gameWelcomeUi.menuButton.y = actionY - (actionHeight / 2);
               gameWelcomeUi.menuButton.width = buttonWidth;
               gameWelcomeUi.menuButton.height = actionHeight;
          }

          miniGameCtx.fillStyle = colors.white;
          miniGameCtx.fillText(item.text, currentX, actionY);

          currentX += item.width + actionGap;
     });

     miniGameCtx.restore();
}

export function drawGameStatusOverlay(theme) {
     if (!miniGameCtx || !gameOverlayText || gameMenuOpen) {
          return;
     }

     const { colors, sizes, fonts, glow } = theme;
     const alpha = getGameOverlayAlpha();
     const titleY = miniGameHeight / 2;
     const subtextOffset = 30;
     const hasSubtext = Boolean(gameOverlaySubtext);

     miniGameCtx.save();
     miniGameCtx.globalAlpha = alpha;

     // OVERLAY BACKDROP
     // Lower playfield is dimmed here. Status state is separated more clearly here.
     miniGameCtx.fillStyle = "rgba(0, 0, 0, 0.25)";
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";

     miniGameCtx.font = `${sizes.overlayTitleFont}px ${fonts.display}`;
     const titleWidth = miniGameCtx.measureText(gameOverlayText).width;

     let subWidth = 0;
     if (hasSubtext) {
          miniGameCtx.font = `400 ${sizes.overlaySubFont}px ${fonts.body}`;
          subWidth = miniGameCtx.measureText(gameOverlaySubtext).width;
     }

     const horizontalPadding = 20;
     const topPadding = 20;
     const bottomPadding = hasSubtext ? 22 : 20;
     const gapBetweenLines = hasSubtext ? 18 : 0;

     const panelWidth = Math.max(titleWidth, subWidth) + (horizontalPadding * 2);
     const panelHeight =
          sizes.overlayTitleFont +
          (hasSubtext ? sizes.overlaySubFont + gapBetweenLines : 0) +
          topPadding +
          bottomPadding;
     const panelX = (miniGameWidth - panelWidth) / 2;
     const panelY = titleY - topPadding - (sizes.overlayTitleFont / 2);

     drawPanelBox(panelX, panelY, panelWidth, panelHeight, theme);

     // TEXT
     miniGameCtx.fillStyle = colors.white;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.overlayGlow;
     miniGameCtx.shadowBlur = glow.uiStrongGlow;
     miniGameCtx.font = `${sizes.overlayTitleFont}px ${fonts.display}`;
     miniGameCtx.fillText(gameOverlayText, miniGameWidth / 2, titleY);

     if (hasSubtext) {
          miniGameCtx.shadowBlur = glow.uiSoftGlow;
          miniGameCtx.font = `400 ${sizes.overlaySubFont}px ${fonts.body}`;
          miniGameCtx.fillText(gameOverlaySubtext, miniGameWidth / 2, titleY + subtextOffset);
     }

     miniGameCtx.restore();
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
     welcomeColorEngine = null;
     welcomePreviousColors = [];
     welcomeCurrentColors = [];
     welcomeLastColorCycleTime = 0;

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