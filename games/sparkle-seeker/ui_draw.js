// NOTE: UI DRAW / RENDERING
// This file owns canvas drawing and visual helpers.
//
// Owned here:
// - theme/color/font helpers
// - shared draw helpers
// - HUD drawing
// - screen / overlay rendering
// - welcome title rainbow color engine
//
// NOT owned here:
// - startup / round flow
// - screen state transitions
// - game update loop
// - hitbox state storage

import {
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
     touchControls,
     gameMenuUi,
     sparkleScore,
     playerHealth
} from "./state.js";

import {
     drawPlayer,
     drawPlayerTrail,
     drawSparkles,
     drawObstacles,
     drawCollisionBursts,
     getCurrentLevelNumber
} from "./entities.js";

import {
     isScreenWelcomeActive,
     isOverlayScreenActive,
     getGameWelcomeUi,
     getGamePausedUi,
     getCurrentScreenTitleLines,
     getCurrentScreenActionTexts,
     getCurrentPausedActionTexts,
     getGameWelcomeAlpha,
     getInstructionLines,
     getObstaclesToggleLabel,
     getMusicToggleLabel,
     getSoundEffectsToggleLabel,
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

function getCssString(variableName, fallback = "") {
     if (!document?.documentElement) {
          return fallback;
     }

     const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
     return value || fallback;
}

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

// NOTE: SHARED UI THEME

function getUiTheme() {
     const fontColor = getCssColor("--font-color", getCssColor("--color-text", "#ffffff"));

     return {
          fonts: {
               display: getCssString("--font-display", '"Bungee Shade", cursive'),
               body: getCssString("--font-body", '"Noto Sans Mono", monospace'),
               symbol: '"Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif'
          },

          colors: {
               fontColor,

               fillColorNone: getCssColor("--overlay-none", "rgba(0, 0, 0, 0)"),
               fillColorSoft: getCssColor("--overlay-soft", "rgba(0, 0, 0, 0.25)"),
               fillColorMed: getCssColor("--overlay-medium", "rgba(0, 0, 0, 0.5)"),
               fillColorHard: getCssColor("--overlay-strong", "rgba(0, 0, 0, 0.75)"),

               outlineStrong: fontColor,
               outlineSoft: "rgba(255, 255, 255, 0.25)",

               controlFill: "rgba(255, 255, 255, 0.25)",
               controlFillPressed: "rgba(255, 255, 255, 0.75)",
               controlText: fontColor,
               controlGlow: fontColor,

               overlayGlow: fontColor,
               scoreGlow: fontColor,

               starFull: fontColor,
               starGlow: fontColor,
               scoreText: fontColor,
               scoreTextGlow: fontColor,

               heartFull: fontColor,
               heartGlow: fontColor,
               statusText: fontColor,
               statusTextGlow: fontColor
          },

          sizes: {
               statusFontSize: getCssPixelSize("--font-size-small", 8),
               statusFontY: 20,

               starSize: 16,
               heartSize: 22,

               starIconY: 4,
               heartIconY: 2,

               scoreX: 5,
               healthX: 5,

               overlayFontTitle: getCssPixelSize("--font-size-medium", 16),
               uiFontSmall: getCssPixelSize("--font-size-small", 8),

               controlRadius: getCssNumber("--panel-radius", 15)
          },

          glow: {
               uiSoftGlow: getCssNumber("--glow-particle-bg-blur", 10),
               uiMediumGlow: getCssNumber("--glow-particle-game-blur", 16),
               uiStrongGlow: getCssNumber("--glow-particle-game-blur", 16) * 1.35
          }
     };
}

// SHARED DRAW HELPERS

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

function drawPanelBox(x, y, width, height, theme, lineWidth = 3) {
     const { colors, glow, sizes } = theme;

     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiStrongGlow;

     drawRoundedRect(x, y, width, height, sizes.controlRadius);
     miniGameCtx.fillStyle = colors.fillColorNone;
     miniGameCtx.fill();

     miniGameCtx.shadowBlur = 0;
     miniGameCtx.strokeStyle = colors.outlineStrong;
     miniGameCtx.lineWidth = lineWidth;

     drawRoundedRect(x, y, width, height, sizes.controlRadius);
     miniGameCtx.stroke();
}

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

export function updateWelcomeTitleColors(titleLines = getCurrentScreenTitleLines()) {
     ensureWelcomeColorEngine();

     const rainbowCycleSpeed = siteTheme?.getTextSettings?.().rainbowCycleSpeed ?? 900;
     const now = performance.now();

     if (
          welcomeCurrentColors.length &&
          welcomeCurrentColors[0]?.length &&
          (now - welcomeLastColorCycleTime) < rainbowCycleSpeed
     ) {
          return;
     }

     if (!welcomeColorEngine?.nextCycle) {
          const fallbackColor = getCssColor("--font-color", getCssColor("--color-text", "#ffffff"));
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

function getWelcomeTitleFontSize(theme, titleLines = getCurrentScreenTitleLines()) {
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
     if (!miniGameCtx || !button) {
          return;
     }

     const { colors, sizes, fonts, glow } = theme;
     const centerX = button.x + (button.width / 2);
     const centerY = button.y + (button.height / 2);

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.controlFill;
     miniGameCtx.strokeStyle = colors.outlineSoft;
     miniGameCtx.lineWidth = 2;
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     drawRoundedRect(button.x, button.y, button.width, button.height, sizes.controlRadius);
     miniGameCtx.fill();
     miniGameCtx.stroke();

     miniGameCtx.fillStyle = colors.controlText;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     miniGameCtx.font = `400 ${sizes.uiFontSmall}px ${fonts.body}`;
     miniGameCtx.fillText(label, centerX, centerY + 1);

     miniGameCtx.restore();
}

function drawControlButton(button, isPressed, theme) {
     if (!miniGameCtx || !button) {
          return;
     }

     const { colors, glow } = theme;
     const centerX = button.x + (button.width / 2);
     const centerY = button.y + (button.height / 2);
     const radius = button.width / 3;

     miniGameCtx.save();
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = isPressed ? glow.uiStrongGlow : glow.uiMediumGlow;

     miniGameCtx.beginPath();
     miniGameCtx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);

     miniGameCtx.fillStyle = isPressed ? colors.controlFillPressed : colors.controlFill;
     miniGameCtx.fill();

     miniGameCtx.lineWidth = 2;
     miniGameCtx.strokeStyle = colors.outlineStrong;
     miniGameCtx.stroke();

     miniGameCtx.restore();
}

function drawMiniGameBackground() {
     if (!miniGameCtx) {
          return;
     }

     miniGameCtx.clearRect(0, 0, miniGameWidth, miniGameHeight);
     miniGameCtx.fillStyle = getCssColor("--overlay-medium", "rgba(0, 0, 0, 0.5)");
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);
}

// HUD

function drawScore(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, sizes, fonts, glow } = theme;
     const formattedScore = String(sparkleScore).padStart(3, "0");
     const currentLevel = Math.max(1, Math.min(5, getCurrentLevelNumber()));

     let starRow = "";

     for (let i = 1; i <= 5; i += 1) {
          starRow += (i <= currentLevel) ? "\u2605\uFE0E" : "\u2606\uFE0E";
     }

     miniGameCtx.save();
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = colors.starFull;
     miniGameCtx.shadowColor = colors.starGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     miniGameCtx.font = `${sizes.starSize}px ${fonts.symbol}`;
     miniGameCtx.fillText(starRow, sizes.scoreX, sizes.starIconY);

     miniGameCtx.font = `${sizes.statusFontSize}px ${fonts.display}`;
     miniGameCtx.fillText(formattedScore, sizes.scoreX, sizes.statusFontY);

     miniGameCtx.restore();
}

function drawHealth(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, sizes, fonts, glow } = theme;
     const filledHeart = "\u2665\uFE0E";
     const emptyHeart = "\u2661\uFE0E";
     const maxVisibleHearts = 5;

     let heartRow = "";

     for (let i = maxVisibleHearts - 1; i >= 0; i -= 1) {
          heartRow += (i < playerHealth) ? filledHeart : emptyHeart;
     }

     miniGameCtx.save();
     miniGameCtx.font = `${sizes.heartSize}px ${fonts.body}`;
     miniGameCtx.textAlign = "right";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = colors.statusText;
     miniGameCtx.shadowColor = colors.statusTextGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;
     miniGameCtx.fillText(heartRow, miniGameWidth - sizes.healthX, sizes.heartIconY);
     miniGameCtx.restore();
}

function drawHealthStatus(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, sizes, fonts, glow } = theme;
     let statusText = "";

     if (playerHealth >= 5) {
          statusText = "Points x2!";
     } else if (playerHealth === 4) {
          statusText = "Speed +1";
     } else if (playerHealth === 2) {
          statusText = "Speed -1";
     } else if (playerHealth === 1) {
          statusText = "Speed -2";
     }

     miniGameCtx.save();
     miniGameCtx.font = `${sizes.statusFontSize}px ${fonts.display}`;
     miniGameCtx.textAlign = "right";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = colors.fontColor;
     miniGameCtx.shadowColor = colors.heartGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     miniGameCtx.fillText(
          statusText,
          miniGameWidth - sizes.healthX,
          sizes.statusFontY
     );

     miniGameCtx.restore();
}

function drawTouchButtons(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, fonts, glow } = theme;
     const buttons = [
          touchControls.leftButton,
          touchControls.pauseButton,
          touchControls.rightButton
     ];

     buttons.forEach((button) => {
          if (!button) {
               return;
          }

          drawControlButton(button, button.isPressed, theme);

          miniGameCtx.save();
          miniGameCtx.fillStyle = colors.fontColor;
          miniGameCtx.textAlign = "center";
          miniGameCtx.textBaseline = "middle";
          miniGameCtx.shadowColor = colors.controlGlow;
          miniGameCtx.shadowBlur = glow.uiSoftGlow;

          miniGameCtx.font = `400 ${button.height * 0.42}px ${fonts.body}`;
          miniGameCtx.fillText(
               button.label,
               button.x + (button.width / 2),
               button.y + (button.height / 2) + 1
          );

          miniGameCtx.restore();
     });
}

// FULL-SCREEN SCREENS

function drawTipsScreen(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, fonts, sizes } = theme;

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.fillColorMed;
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

     miniGameCtx.fillStyle = colors.fontColor;
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.shadowBlur = 0;

     const textX = Math.max(24, miniGameWidth * 0.12);
     let textY = Math.max(28, miniGameHeight * 0.12);
     const fontSize = Math.max(12, sizes.uiFontSmall * Math.min(1, miniGameWidth / 320));
     const lineHeight = fontSize * 1;
     const sectionGap = lineHeight * 1.25;
     const maxTextWidth = miniGameWidth - (textX * 2);

     miniGameCtx.font = `400 ${fontSize}px ${fonts.body}`;

     getInstructionLines().forEach((instructionLine) => {
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

     drawMenuButton(gameMenuUi.backButton, "Back", theme);
     miniGameCtx.restore();
}

function drawOptionsScreen(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors } = theme;

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.fillColorMed;
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

     drawMenuButton(
          gameMenuUi.obstaclesToggleButton,
          `Obstacles: ${getObstaclesToggleLabel()}`,
          theme
     );

     drawMenuButton(
          gameMenuUi.musicToggleButton,
          `Music: ${getMusicToggleLabel()}`,
          theme
     );

     drawMenuButton(
          gameMenuUi.soundEffectsToggleButton,
          `Sound FX: ${getSoundEffectsToggleLabel()}`,
          theme
     );

     drawMenuButton(gameMenuUi.backButton, "Back", theme);
     miniGameCtx.restore();
}

// SCREENS / OVERLAYS

function drawGameWelcomeOverlay(theme) {
     if (!miniGameCtx || (!isScreenWelcomeActive() && !isOverlayScreenActive())) {
          return;
     }

     const { colors, fonts, glow, sizes } = theme;
     const alpha = getGameWelcomeAlpha();
     const titleLines = getCurrentScreenTitleLines();
     const actionTexts = getCurrentScreenActionTexts();
     const titleFontSize = getWelcomeTitleFontSize(theme, titleLines);
     const lineGap = Math.max(12, titleFontSize * 0.012);

     const firstLineY = (miniGameHeight / 2) - ((titleFontSize * 1) + (lineGap * 0.5));
     const secondLineY = firstLineY + titleFontSize + lineGap;

     const actionGap = Math.max(18, titleFontSize * 0.5);
     const actionY = secondLineY + Math.max(34, titleFontSize * 1.25);

     updateWelcomeTitleColors(titleLines);

     miniGameCtx.save();
     miniGameCtx.globalAlpha = alpha;

     if (!isScreenWelcomeActive()) {
          miniGameCtx.fillStyle = colors.fillColorMed;
          miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);
     }

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
               const letterColor = colorsForLine[i] || colors.fontColor;

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
     const actionTextSize = Math.max(10, sizes.uiFontSmall * 1.1);

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

          miniGameCtx.fillStyle = colors.controlText;
          miniGameCtx.textAlign = "center";
          miniGameCtx.textBaseline = "middle";
          miniGameCtx.fillText(item.text, textX, actionY);
          miniGameCtx.restore();

          if (item.text === "NEW GAME") {
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

          if (item.text === "OPTIONS") {
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
     const actionTexts = getCurrentPausedActionTexts();
     const titleFontSize = Math.max(40, Math.min(miniGameWidth * 0.16, miniGameHeight * 0.16));
     const titleY = miniGameHeight * 0.46;
     const actionGap = Math.max(18, titleFontSize * 0.2);
     const actionY = titleY + Math.max(52, titleFontSize * 1.05);

     updateWelcomeTitleColors(titleLines);

     miniGameCtx.save();

     miniGameCtx.fillStyle = colors.fillColorMed;
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

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
               const letterColor = colorsForLine[i] || colors.fontColor;

               miniGameCtx.fillStyle = letterColor;
               miniGameCtx.shadowColor = letterColor;
               miniGameCtx.shadowBlur = glow.uiStrongGlow;
               miniGameCtx.fillText(letter, x, y);

               x += letterWidth;
          }
     });

     const buttonPaddingX = 12;
     const buttonPaddingY = 6;
     const actionTextSize = Math.max(10, sizes.uiFontSmall * 1.1);

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

          miniGameCtx.fillStyle = colors.controlText;
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

          if (item.text === "OPTIONS") {
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

     miniGameCtx.fillStyle = colors.fillColorSoft;
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";

     miniGameCtx.font = `${sizes.overlayFontTitle}px ${fonts.display}`;
     const titleWidth = miniGameCtx.measureText(gameOverlayText).width;

     let subWidth = 0;
     if (hasSubtext) {
          miniGameCtx.font = `400 ${sizes.overlayFontTitle}px ${fonts.body}`;
          subWidth = miniGameCtx.measureText(gameOverlaySubtext).width;
     }

     const horizontalPadding = 20;
     const topPadding = 20;
     const bottomPadding = hasSubtext ? 22 : 20;
     const gapBetweenLines = hasSubtext ? 18 : 0;

     const panelWidth = Math.max(titleWidth, subWidth) + (horizontalPadding * 2);
     const panelHeight =
          sizes.overlayFontTitle +
          (hasSubtext ? sizes.overlayFontTitle + gapBetweenLines : 0) +
          topPadding +
          bottomPadding;
     const panelX = (miniGameWidth - panelWidth) / 2;
     const panelY = titleY - topPadding - (sizes.overlayFontTitle / 2);

     drawPanelBox(panelX, panelY, panelWidth, panelHeight, theme);

     miniGameCtx.fillStyle = colors.fontColor;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.overlayGlow;
     miniGameCtx.shadowBlur = glow.uiStrongGlow;
     miniGameCtx.font = `${sizes.overlayFontTitle}px ${fonts.display}`;
     miniGameCtx.fillText(gameOverlayText, miniGameWidth / 2, titleY);

     if (hasSubtext) {
          miniGameCtx.shadowBlur = glow.uiSoftGlow;
          miniGameCtx.font = `400 ${sizes.overlayFontTitle}px ${fonts.body}`;
          miniGameCtx.fillText(gameOverlaySubtext, miniGameWidth / 2, titleY + subtextOffset);
     }

     miniGameCtx.restore();
}

// MASTER DRAW ENTRY

export function drawGame() {
     const theme = getUiTheme();

     drawMiniGameBackground();

     if (isScreenWelcomeActive()) {
          drawGameWelcomeOverlay(theme);
          return;
     }

     if (gameStarted) {
          drawSparkles();
          drawObstacles();
          drawCollisionBursts();
          drawPlayerTrail();
          drawPlayer();

          drawScore(theme);
          drawHealth(theme);
          drawHealthStatus(theme);

          if (!gamePaused && !gameMenuOpen && !gameOver && !gameWon) {
               drawTouchButtons(theme);
          }
     }

     if (gameMenuOpen) {
          if (gameMenuView === "instructions") {
               drawTipsScreen(theme);
          } else if (gameMenuView === "options") {
               drawOptionsScreen(theme);
          }
     } else if (gamePaused && !gameOver && !gameWon) {
          drawPausedOverlay(theme);
     } else if (isOverlayScreenActive()) {
          drawGameWelcomeOverlay(theme);
     } else {
          drawGameStatusOverlay(theme);
     }
}
