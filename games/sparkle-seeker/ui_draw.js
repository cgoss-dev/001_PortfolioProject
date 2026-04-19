// NOTE: UI DRAW / RENDERING
// This file owns canvas drawing and visual helpers.
//
// Owned here:
// - theme/color/font helpers
// - shared draw helpers
// - HUD drawing
// - welcome / paused / menu / overlay rendering
// - welcome title rainbow color engine
//
// NOT owned here:
// - startup / round flow
// - welcome/menu state transitions
// - game update loop
// - hitbox state storage
//
// Beginner note:
// Think of this file as the "paintbrush."
// It reads state from ui_mode.js / state.js and draws what should be visible.

import {
     miniGameCanvas,
     miniGameCtx,
     miniGameWidth,
     miniGameHeight,
     gamePaused,
     gameMenuOpen,
     gameMenuView,
     gameOver,
     gameWon,
     gameOverlayText,
     gameOverlaySubtext,
     touchControls,
     gameMenuUi,
     sparkleScore,
     playerHealth,
     maxPlayerHealth
} from "./state.js";

import {
     drawPlayer,
     drawSparkles,
     drawObstacles,
     drawCollisionBursts,
     getCurrentLevelNumber
} from "./entities.js";

import {
     isGameWelcomeActive,
     getGameWelcomeUi,
     getGamePausedUi,
     getCurrentWelcomeTitleLines,
     getCurrentWelcomeActionTexts,
     getGameWelcomeAlpha,
     getInstructionLines,
     getCurrentDifficultyLabel,
     getCurrentSoundLabel,
     getGameOverlayAlpha
} from "./ui_mode.js";

// CSS HELPERS

const siteTheme = window.SiteTheme;

function getCssColor(variableName, fallback = "#ffffff") {
     return siteTheme?.getCssColor?.(variableName, fallback) || fallback;
}

function getCssNumber(variableName, fallback = 0) {
     return siteTheme?.getCssNumber?.(variableName, fallback) ?? fallback;
}

// STRING VALUE HELPER
// Font-family values pulled from root CSS here.
function getCssString(variableName, fallback = "") {
     if (!document?.documentElement) {
          return fallback;
     }

     const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
     return value || fallback;
}

// PIXEL SIZE HELPER
// clamp()/rem values from root CSS resolved into px here for canvas text.
// Canvas needs a real number, not raw CSS text.
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
               scoreFont: 24,
               scoreX: 8,
               scoreY: 8,

               heartFont: 24,
               heartGap: 15,
               heartY: 5,
               heartXPadding: 8,

               overlayTitleFont: 36,
               overlaySubFont: getCssPixelSize("--text-size-medium", 16),

               // WELCOME TITLE SIZE
               // Title is allowed to scale from canvas size here.
               welcomeSubFont: getCssPixelSize("--text-size-small", 8),

               menuButtonFont: getCssPixelSize("--text-size-small", 8), //REVIEW - NAV MENU OPTION SIZES (8, 16, 32)
               menuSmallFont: getCssPixelSize("--text-size-small", 8),

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

// WELCOME COLOR ENGINE
// Shared root color engine is reused here for canvas title letters.
let welcomeColorEngine = null;
let welcomePreviousColors = [];
let welcomeCurrentColors = [];
let welcomeLastColorCycleTime = 0;

function ensureWelcomeColorEngine() {
     if (welcomeColorEngine || !siteTheme?.createColorEngine || !siteTheme?.getRainbowPalette) {
          return;
     }

     welcomeColorEngine = siteTheme.createColorEngine(siteTheme.getRainbowPalette);
}

export function updateWelcomeTitleColors(titleLines = getCurrentWelcomeTitleLines()) {
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
function getWelcomeTitleFontSize(theme, titleLines = getCurrentWelcomeTitleLines()) {
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

// UI DRAW FUNCTIONS

function drawScore(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, sizes, fonts, glow } = theme;
     const formattedScore = String(sparkleScore).padStart(3, "0");
     const currentLevel = Math.max(1, Math.min(5, getCurrentLevelNumber()));

     // REVIEW - LEVEL STARS
     // Filled stars show unlocked levels.
     // Empty stars show remaining level slots up to 5.
     let starRow = "";

     for (let i = 1; i <= 5; i += 1) {
          starRow += (i <= currentLevel) ? "\u2605\uFE0E" : "\u2606\uFE0E";
     }

     miniGameCtx.save();
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = colors.white;
     miniGameCtx.shadowColor = colors.scoreGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     // STAR ROW
     // This sits above the score, similar to how hearts are grouped in rows.
     miniGameCtx.font = `${Math.max(18, sizes.scoreFont * 0.7)}px ${fonts.symbol}`;
     miniGameCtx.fillText(starRow, sizes.scoreX, Math.max(2, sizes.scoreY - 2));

     // SCORE ROW
     // Score is pushed down a bit so the stars have their own line above it.
     miniGameCtx.font = `${sizes.scoreFont}px ${fonts.display}`;
     miniGameCtx.fillText(formattedScore, sizes.scoreX, sizes.scoreY + 20);

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

     for (let i = maxPlayerHealth - 1; i >= heartsPerRow; i -= 1) {
          bottomRow += (i < playerHealth) ? filledHeart : emptyHeart;
     }

     //SWAPPED TOP/BOTTOM ROWS FOR TESTING
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
function drawTouchButtons(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, fonts, glow } = theme;
     const leftButton = touchControls.leftButton;
     const rightButton = touchControls.rightButton;

     drawControlButton(leftButton, leftButton.isPressed, theme);
     drawControlButton(rightButton, rightButton.isPressed, theme);

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.controlText;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

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

function drawMenuOverlay(theme) {
     if (!miniGameCtx || !gameMenuOpen) {
          return;
     }

     const { colors, fonts, sizes } = theme;

     miniGameCtx.save();
     miniGameCtx.globalAlpha = 1;

     miniGameCtx.fillStyle = "rgba(0, 0, 0, 0.85)";
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

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
          const lineHeight = fontSize * 1;
          const sectionGap = lineHeight * 1.25;
          const maxTextWidth = miniGameWidth - (textX * 2);

          miniGameCtx.font = `400 ${fontSize}px ${fonts.body}`;

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
     if (!miniGameCtx || !isGameWelcomeActive()) {
          return;
     }

     const { colors, fonts, glow, sizes } = theme;
     const alpha = getGameWelcomeAlpha();
     const titleLines = getCurrentWelcomeTitleLines();
     const actionTexts = getCurrentWelcomeActionTexts();
     const titleFontSize = getWelcomeTitleFontSize(theme, titleLines);
     const lineGap = Math.max(12, titleFontSize * 0.12);

     const firstLineY = (miniGameHeight / 2) - ((titleFontSize * 0.8) + (lineGap * 0.5));
     const secondLineY = firstLineY + titleFontSize + lineGap;

     const actionGap = Math.max(18, titleFontSize * 0.2);
     const actionY = secondLineY + Math.max(34, titleFontSize * 0.95);

     updateWelcomeTitleColors(titleLines);

     miniGameCtx.save();
     miniGameCtx.globalAlpha = alpha;

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

     const welcomeUi = getGameWelcomeUi();

     welcomeUi.startButton.x = 0;
     welcomeUi.startButton.y = 0;
     welcomeUi.startButton.width = 0;
     welcomeUi.startButton.height = 0;

     welcomeUi.instructionsButton.x = 0;
     welcomeUi.instructionsButton.y = 0;
     welcomeUi.instructionsButton.width = 0;
     welcomeUi.instructionsButton.height = 0;

     welcomeUi.menuButton.x = 0;
     welcomeUi.menuButton.y = 0;
     welcomeUi.menuButton.width = 0;
     welcomeUi.menuButton.height = 0;

     const buttonPaddingX = 12;
     const buttonPaddingY = 6;
     const actionTextSize = Math.max(10, sizes.welcomeSubFont * 1.1);

     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.overlayGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;
     miniGameCtx.font = `400 ${actionTextSize}px ${fonts.body}`;

     const measuredActions = actionTexts.map((text) => ({
          text,
          textWidth: miniGameCtx.measureText(text).width
     }));

     const totalActionWidth =
          measuredActions.reduce((sum, item) => sum + item.textWidth + (buttonPaddingX * 2), 0) +
          (actionGap * Math.max(0, measuredActions.length - 1));

     let currentX = (miniGameWidth - totalActionWidth) / 2;

     measuredActions.forEach((item) => {
          const buttonWidth = item.textWidth + (buttonPaddingX * 2);
          const buttonHeight = actionTextSize + (buttonPaddingY * 2);
          const buttonX = currentX;
          const buttonY = actionY - (buttonHeight / 2);
          const textX = buttonX + (buttonWidth / 2);

          miniGameCtx.save();
          miniGameCtx.fillStyle = "rgba(255, 255, 255, 0.11)";
          miniGameCtx.strokeStyle = "rgba(255, 255, 255, 0.75)";
          miniGameCtx.lineWidth = 2;
          miniGameCtx.shadowColor = colors.controlGlow;
          miniGameCtx.shadowBlur = glow.uiSoftGlow;

          drawRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, sizes.controlRadius);
          miniGameCtx.fill();
          miniGameCtx.stroke();

          miniGameCtx.fillStyle = colors.buttonText;
          miniGameCtx.textAlign = "center";
          miniGameCtx.textBaseline = "middle";
          miniGameCtx.fillText(item.text, textX, actionY);
          miniGameCtx.restore();

          if (item.text === "START") {
               welcomeUi.startButton.x = buttonX;
               welcomeUi.startButton.y = buttonY;
               welcomeUi.startButton.width = buttonWidth;
               welcomeUi.startButton.height = buttonHeight;
          }

          if (item.text === "TIPS") {
               welcomeUi.instructionsButton.x = buttonX;
               welcomeUi.instructionsButton.y = buttonY;
               welcomeUi.instructionsButton.width = buttonWidth;
               welcomeUi.instructionsButton.height = buttonHeight;
          }

          if (item.text === "MENU") {
               welcomeUi.menuButton.x = buttonX;
               welcomeUi.menuButton.y = buttonY;
               welcomeUi.menuButton.width = buttonWidth;
               welcomeUi.menuButton.height = buttonHeight;
          }

          currentX += buttonWidth + actionGap;
     });

     miniGameCtx.restore();
}

function drawPausedOverlay(theme) {
     if (!miniGameCtx || !gamePaused || gameMenuOpen || gameOver || gameWon) {
          return;
     }

     const { colors, fonts, glow, sizes } = theme;
     const titleLines = ["PAUSED"];
     const actionTexts = ["RESUME", "TIPS", "MENU"];
     const titleFontSize = Math.max(40, Math.min(miniGameWidth * 0.16, miniGameHeight * 0.16));
     const titleY = miniGameHeight * 0.46;
     const actionGap = Math.max(18, titleFontSize * 0.2);
     const actionY = titleY + Math.max(52, titleFontSize * 1.05);

     updateWelcomeTitleColors(titleLines);

     miniGameCtx.save();

     const pausedUi = getGamePausedUi();

     pausedUi.resumeButton.x = 0;
     pausedUi.resumeButton.y = 0;
     pausedUi.resumeButton.width = 0;
     pausedUi.resumeButton.height = 0;

     pausedUi.instructionsButton.x = 0;
     pausedUi.instructionsButton.y = 0;
     pausedUi.instructionsButton.width = 0;
     pausedUi.instructionsButton.height = 0;

     pausedUi.menuButton.x = 0;
     pausedUi.menuButton.y = 0;
     pausedUi.menuButton.width = 0;
     pausedUi.menuButton.height = 0;

     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.font = `${titleFontSize}px ${fonts.display}`;

     titleLines.forEach((line, lineIndex) => {
          const y = titleY + (lineIndex * titleFontSize);
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

     const buttonPaddingX = 12;
     const buttonPaddingY = 6;
     const actionTextSize = Math.max(10, sizes.welcomeSubFont * 1.1);

     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.overlayGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;
     miniGameCtx.font = `400 ${actionTextSize}px ${fonts.body}`;

     const measuredActions = actionTexts.map((text) => ({
          text,
          textWidth: miniGameCtx.measureText(text).width
     }));

     const totalActionWidth =
          measuredActions.reduce((sum, item) => sum + item.textWidth + (buttonPaddingX * 2), 0) +
          (actionGap * Math.max(0, measuredActions.length - 1));

     let currentX = (miniGameWidth - totalActionWidth) / 2;

     measuredActions.forEach((item) => {
          const buttonWidth = item.textWidth + (buttonPaddingX * 2);
          const buttonHeight = actionTextSize + (buttonPaddingY * 2);
          const buttonX = currentX;
          const buttonY = actionY - (buttonHeight / 2);
          const textX = buttonX + (buttonWidth / 2);

          miniGameCtx.save();
          miniGameCtx.fillStyle = "rgba(255, 255, 255, 0.11)";
          miniGameCtx.strokeStyle = "rgba(255, 255, 255, 0.75)";
          miniGameCtx.lineWidth = 2;
          miniGameCtx.shadowColor = colors.controlGlow;
          miniGameCtx.shadowBlur = glow.uiSoftGlow;

          drawRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, sizes.controlRadius);
          miniGameCtx.fill();
          miniGameCtx.stroke();

          miniGameCtx.fillStyle = colors.buttonText;
          miniGameCtx.textAlign = "center";
          miniGameCtx.textBaseline = "middle";
          miniGameCtx.fillText(item.text, textX, actionY);
          miniGameCtx.restore();

          if (item.text === "RESUME") {
               pausedUi.resumeButton.x = buttonX;
               pausedUi.resumeButton.y = buttonY;
               pausedUi.resumeButton.width = buttonWidth;
               pausedUi.resumeButton.height = buttonHeight;
          }

          if (item.text === "TIPS") {
               pausedUi.instructionsButton.x = buttonX;
               pausedUi.instructionsButton.y = buttonY;
               pausedUi.instructionsButton.width = buttonWidth;
               pausedUi.instructionsButton.height = buttonHeight;
          }

          if (item.text === "MENU") {
               pausedUi.menuButton.x = buttonX;
               pausedUi.menuButton.y = buttonY;
               pausedUi.menuButton.width = buttonWidth;
               pausedUi.menuButton.height = buttonHeight;
          }

          currentX += buttonWidth + actionGap;
     });

     miniGameCtx.restore();
}

function drawGameStatusOverlay(theme) {
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

// MASTER DRAW ENTRY

export function drawGame() {
     const theme = getUiTheme();

     drawMiniGameBackground();

     if (isGameWelcomeActive()) {
          drawGameWelcomeOverlay(theme);
          return;
     }

     drawSparkles();
     drawObstacles();
     drawCollisionBursts();
     drawPlayer();

     drawScore(theme);
     drawHealth(theme);

     if (!gamePaused && !gameMenuOpen && !gameOver && !gameWon) {
          drawTouchButtons(theme);
     }

     if (gameMenuOpen) {
          drawMenuOverlay(theme);
     } else if (gamePaused && !gameOver && !gameWon) {
          drawPausedOverlay(theme);
     } else {
          drawGameStatusOverlay(theme);
     }
}