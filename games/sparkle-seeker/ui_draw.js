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
     player,
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
     playerHealth,
     musicLevel,
     soundEffectsLevel,
     harmfulLevel,
     maxOptionLevelIndex,
     activeStatusUi,
     isEffectActive
} from "./state.js";

import {
     drawPlayer,
     drawPlayerTrail,
     drawSparkles,
     drawEffectPickups,
     drawCollisionBursts,
     getCurrentLevelProgressStars,
     getCurrentLevelNumber
} from "./entities.js";

import {
     isScreenWelcomeActive,
     isOverlayScreenActive,
     getScreenActionUi,
     getPausedActionUi,
     getCurrentScreenTitleLines,
     getCurrentScreenActionTexts,
     getCurrentPausedActionTexts,
     getGameWelcomeAlpha,
     getHowToPlayLines,
     getHelpfulEffectLines,
     getHarmfulEffectLines,
     getHarmfulToggleLabel,
     getMusicToggleLabel,
     getSoundEffectsToggleLabel,
     getGameOverlayAlpha,
     getGameMenuSpacing
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

               fillTranslucentNone: getCssColor("--translucent-none", "rgba(0, 0, 0, 0)"),
               fillTranslucentSoft: getCssColor("--translucent-soft", "rgba(0, 0, 0, 0.25)"),
               fillTranslucentMedium: getCssColor("--translucent-medium", "rgba(0, 0, 0, 0.5)"),
               fillTranslucentStrong: getCssColor("--translucent-strong", "rgba(0, 0, 0, 0.75)"),

               outlineSoft: getCssColor("--opaque-soft", "rgba(0, 0, 0, 0.25)"),
               outlineStrong: getCssColor("--opaque-strong", "rgba(0, 0, 0, 0.75)"),
               controlFill: getCssColor("--opaque-soft", "rgba(0, 0, 0, 0.25)"),
               controlFillPressed: getCssColor("--opaque-strong", "rgba(0, 0, 0, 0.75)"),

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
               statusFontSize: getCssPixelSize("--font-size-md", 16),
               statusFontY: 20,

               starSize: Math.max(15, Math.min(24, miniGameWidth * 0.055)),
               heartSize: Math.max(13, Math.min(28, miniGameWidth * 0.06)),

               starIconY: 2.5,
               heartIconY: 2,

               scoreX: 5,
               healthX: 5,

               uiFontLg: getCssPixelSize("--font-size-lg", 48),
               uiFontMd: getCssPixelSize("--font-size-md", 16),
               uiFontSm: getCssPixelSize("--font-size-sm", 10),

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
     miniGameCtx.fillStyle = colors.fillTranslucentStrong;
     miniGameCtx.fill();

     miniGameCtx.shadowBlur = 0;
     miniGameCtx.strokeStyle = colors.outlineStrong;
     miniGameCtx.lineWidth = lineWidth;

     drawRoundedRect(x, y, width, height, sizes.controlRadius);
     miniGameCtx.stroke();
}

// NOTE: ICON SIZE X/Y

const richTextIcons = {
     iconShield: { char: "\u2B21\uFE0E", scale: 1.5, xOffset: 0, yOffset: 0 },
     iconCure: { char: "\u271A\uFE0E", scale: 1.5, xOffset: 0, yOffset: 0 },
     iconLuck: { char: "\u2618\uFE0E", scale: 1.5, xOffset: 0, yOffset: 0 },
     iconMagnet: { char: "\u2316\uFE0E", scale: 1.5, xOffset: -5, yOffset: 0 },
     iconSlowmo: { char: "\u29D6\uFE0E", scale: 1.5, xOffset: -2, yOffset: 0 },

     iconFreeze: { char: "\u2744\uFE0E", scale: 1.5, xOffset: 0, yOffset: 0 },
     iconSurge: { char: "\u26A1\uFE0E", scale: 1.5, xOffset: 0, yOffset: 0 },
     iconDaze: { char: "\u2300\uFE0E", scale: 1.5, xOffset: 0, yOffset: 0 },
     iconGlass: { char: "\u26A0\uFE0E", scale: 1.5, xOffset: 0, yOffset: 0 },
     iconFog: { char: "\u224B\uFE0E", scale: 1.5, xOffset: 0, yOffset: 0 }
};

function parseRichTextSegments(text) {
     const segments = [];
     const tokenPattern = /\{(icon[A-Za-z0-9_]+)\}/g;
     let lastIndex = 0;
     let match = tokenPattern.exec(text);

     while (match) {
          if (match.index > lastIndex) {
               segments.push({
                    type: "text",
                    value: text.slice(lastIndex, match.index)
               });
          }

          segments.push({
               type: "icon",
               value: match[1]
          });

          lastIndex = tokenPattern.lastIndex;
          match = tokenPattern.exec(text);
     }

     if (lastIndex < text.length) {
          segments.push({
               type: "text",
               value: text.slice(lastIndex)
          });
     }

     return segments;
}

function getRichTextIcon(tokenName) {
     return richTextIcons[tokenName] || null;
}

function drawWrappedRichText(ctx, text, x, y, maxWidth, lineHeight, options = {}) {
     const font = options.font || ctx.font;
     const iconBaseSize = options.iconBaseSize || options.fontSize || 16;
     const iconFontFamily = options.iconFontFamily || options.fontFamily || "sans-serif";
     const iconYOffset = options.iconYOffset || 0;
     const segments = parseRichTextSegments(text);
     const tokens = [];

     segments.forEach((segment) => {
          if (segment.type === "icon") {
               tokens.push(segment);
               return;
          }

          segment.value.split(/(\s+)/).forEach((part) => {
               if (part) {
                    tokens.push({
                         type: "text",
                         value: part
                    });
               }
          });
     });

     function getTokenFont(token) {
          if (token.type !== "icon") {
               return font;
          }

          const icon = getRichTextIcon(token.value);

          if (!icon) {
               return font;
          }

          return `400 ${iconBaseSize * icon.scale}px ${iconFontFamily}`;
     }

     function getTokenText(token) {
          if (token.type !== "icon") {
               return token.value;
          }

          const icon = getRichTextIcon(token.value);

          return icon ? icon.char : token.value;
     }

     function getTokenXOffset(token) {
          if (token.type !== "icon") {
               return 0;
          }

          const icon = getRichTextIcon(token.value);

          if (!icon) {
               return 0;
          }

          return icon.xOffset || 0;
     }

     function getTokenYOffset(token) {
          if (token.type !== "icon") {
               return 0;
          }

          const icon = getRichTextIcon(token.value);

          if (!icon) {
               return 0;
          }

          const scaleOffset = -((iconBaseSize * icon.scale - iconBaseSize) * 0.28);
          const customOffset = icon.yOffset || 0;

          return iconYOffset + scaleOffset + customOffset;
     }

     const lines = [];
     let currentLine = [];
     let currentWidth = 0;

     tokens.forEach((token) => {
          ctx.font = getTokenFont(token);

          const tokenText = getTokenText(token);
          const tokenWidth = ctx.measureText(tokenText).width;
          const shouldWrap = currentWidth + tokenWidth > maxWidth && currentLine.length > 0;

          if (shouldWrap) {
               lines.push(currentLine);
               currentLine = [];
               currentWidth = 0;
          }

          currentLine.push(token);
          currentWidth += tokenWidth;
     });

     if (currentLine.length) {
          lines.push(currentLine);
     }

     lines.forEach((lineTokens, lineIndex) => {
          let currentX = x;
          const currentY = y + (lineIndex * lineHeight);

          lineTokens.forEach((token) => {
               ctx.font = getTokenFont(token);

               const tokenText = getTokenText(token);
               const tokenXOffset = getTokenXOffset(token);
               const tokenYOffset = getTokenYOffset(token);

               ctx.fillText(tokenText, currentX + tokenXOffset, currentY + tokenYOffset);
               currentX += ctx.measureText(tokenText).width;
          });
     });

     ctx.font = font;

     return lines.length;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
     return drawWrappedRichText(ctx, text, x, y, maxWidth, lineHeight);
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

// TIPS COLOR ENGINE

let tipsTitleColorEngine = null;
let tipsTitlePreviousColors = [];
let tipsTitleCurrentColors = [];
let tipsTitleLastColorCycleTime = 0;

function ensureTipsTitleColorEngine() {
     if (tipsTitleColorEngine || !siteTheme?.createColorEngine || !siteTheme?.getRainbowPalette) {
          return;
     }

     tipsTitleColorEngine = siteTheme.createColorEngine(siteTheme.getRainbowPalette);
}

function updateTipsTitleColors(title) {
     ensureTipsTitleColorEngine();

     const rainbowCycleSpeed = siteTheme?.getTextSettings?.().rainbowCycleSpeed ?? 900;
     const now = performance.now();

     if (tipsTitleCurrentColors.length && (now - tipsTitleLastColorCycleTime) < rainbowCycleSpeed) {
          return;
     }

     if (!tipsTitleColorEngine?.nextCycleForText) {
          tipsTitleCurrentColors = Array(title.length).fill(
               getCssColor("--font-color", getCssColor("--color-text", "#ffffff"))
          );
     } else {
          tipsTitleCurrentColors = tipsTitleColorEngine.nextCycleForText(title, tipsTitlePreviousColors);
     }

     tipsTitlePreviousColors = [...tipsTitleCurrentColors];
     tipsTitleLastColorCycleTime = now;
}

// NOTE: GAME MENU MEASUREMENTS

function getMenuScreenLayout(theme) {
     const { sizes } = theme;
     const { titleGap, rowGap } = getGameMenuSpacing();

     const sidePadding = miniGameWidth * 0.05;
     const topPadding = miniGameHeight * 0.05;
     const titleFontSize = sizes.uiFontMd * 2;

     const backButtonSize = Math.max(28, sizes.uiFontMd * 1.6);
     const backButtonX = sidePadding;
     const backButtonY = topPadding;

     return {
          sidePadding,
          topPadding,
          titleFontSize,
          titleGap,
          rowGap,
          titleCenterX: miniGameWidth / 2,
          backButtonSize,
          backButtonX,
          backButtonY,
          contentTopY: topPadding + titleFontSize + titleGap,
          contentWidth: miniGameWidth - (sidePadding * 2)
     };
}

// NOTE: GAME MENU SCREEN TITLES

function drawMenuScreenTitle(title, theme, centerX, y) {
     const { colors, fonts, glow, sizes } = theme;
     const titleFontSize = sizes.uiFontMd * 2;

     miniGameCtx.save();
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.font = `${titleFontSize}px ${fonts.display}`;

     updateTipsTitleColors(title);

     const letterWidths = [];

     for (let i = 0; i < title.length; i += 1) {
          letterWidths.push(miniGameCtx.measureText(title[i]).width);
     }

     const totalWidth = letterWidths.reduce((sum, width) => sum + width, 0);
     let titleX = centerX - (totalWidth / 2);

     for (let i = 0; i < title.length; i += 1) {
          const letter = title[i];
          const letterColor = tipsTitleCurrentColors[i] || colors.fontColor;

          miniGameCtx.fillStyle = letterColor;
          miniGameCtx.shadowColor = letterColor;
          miniGameCtx.shadowBlur = glow.uiSoftGlow;
          miniGameCtx.fillText(letter, titleX, y);

          titleX += letterWidths[i];
     }

     miniGameCtx.restore();
}

// MENU BUTTONS

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
     miniGameCtx.lineWidth = 3;
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

     miniGameCtx.font = `400 ${sizes.uiFontSm}px ${fonts.body}`;
     miniGameCtx.fillText(label, centerX, centerY + 1);

     miniGameCtx.restore();
}

function drawMenuBackButton(button, theme) {
     if (!miniGameCtx || !button) {
          return;
     }

     const { colors, fonts, glow, sizes } = theme;
     const centerX = button.x + (button.width / 2);
     const centerY = button.y + (button.height / 2);
     const radius = Math.min(button.width, button.height) * 0.5;

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.controlFill;
     miniGameCtx.strokeStyle = colors.outlineSoft;
     miniGameCtx.lineWidth = 3;
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     miniGameCtx.beginPath();
     miniGameCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
     miniGameCtx.fill();
     miniGameCtx.stroke();

     miniGameCtx.fillStyle = colors.controlText;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.font = `400 ${sizes.uiFontMd}px ${fonts.body}`;
     miniGameCtx.fillText("<", centerX, centerY + 1);

     miniGameCtx.restore();
}

function drawOptionStepper(row, decreaseButton, increaseButton, label, value, levelIndex, theme) {
     if (!miniGameCtx || !row || !decreaseButton || !increaseButton) {
          return;
     }

     const { colors, sizes, fonts, glow } = theme;
     const centerY = row.y + (row.height / 2);
     const decreaseAlpha = levelIndex <= 0 ? 0.28 : 1;
     const increaseAlpha = levelIndex >= maxOptionLevelIndex ? 0.28 : 1;
     const arrowFontSize = Math.max(sizes.uiFontSm * 1.55, row.height * 0.72);

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.controlFill;
     miniGameCtx.strokeStyle = colors.outlineSoft;
     miniGameCtx.lineWidth = 3;
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     drawRoundedRect(row.x, row.y, row.width, row.height, sizes.controlRadius);
     miniGameCtx.fill();
     miniGameCtx.stroke();

     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     miniGameCtx.fillStyle = colors.controlText;
     miniGameCtx.globalAlpha = decreaseAlpha;
     miniGameCtx.font = `700 ${arrowFontSize}px ${fonts.body}`;
     miniGameCtx.fillText(
          "<",
          decreaseButton.x + (decreaseButton.width / 2),
          centerY + 1
     );

     miniGameCtx.globalAlpha = 1;
     miniGameCtx.font = `400 ${sizes.uiFontSm}px ${fonts.body}`;
     miniGameCtx.fillText(
          `${label}: ${value}`,
          row.x + (row.width / 2),
          centerY + 1
     );

     miniGameCtx.globalAlpha = increaseAlpha;
     miniGameCtx.font = `700 ${arrowFontSize}px ${fonts.body}`;
     miniGameCtx.fillText(
          ">",
          increaseButton.x + (increaseButton.width / 2),
          centerY + 1
     );

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
     miniGameCtx.fillStyle = getCssColor("--translucent-medium", "rgba(0, 0, 0, 0.5)");
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);
}

// HUD

function getStatusSecondsRemaining() {
     if (activeStatusUi.timer <= 0) {
          return "";
     }

     return `${Math.ceil(activeStatusUi.timer / 60)}s`;
}

function drawScore(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, sizes, fonts, glow } = theme;
     const levelText = `LVL ${getCurrentLevelNumber()}`;
     const sparkleText = `\u2726\uFE0E ${String(sparkleScore).padStart(3, "0")}`;
     const filledStars = getCurrentLevelProgressStars();
     const lineGap = sizes.uiFontMd;

     let starRow = "";

     for (let i = 1; i <= 5; i += 1) {
          starRow += (i <= filledStars) ? "\u2605\uFE0E" : "\u2606\uFE0E";
     }

     miniGameCtx.save();
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = colors.starFull;
     miniGameCtx.shadowColor = colors.starGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     miniGameCtx.font = `${sizes.starSize}px ${fonts.symbol}`;
     miniGameCtx.fillText(starRow, sizes.scoreX, sizes.starIconY);

     miniGameCtx.font = `${sizes.uiFontMd}px ${fonts.display}`;
     miniGameCtx.fillText(levelText, sizes.scoreX, sizes.starIconY + sizes.starSize + lineGap);

     miniGameCtx.font = `400 ${sizes.uiFontMd}px ${fonts.body}`;
     miniGameCtx.fillText(
          sparkleText,
          sizes.scoreX,
          sizes.starIconY + sizes.starSize + sizes.uiFontMd + (lineGap * 2)
     );

     miniGameCtx.restore();
}

function getStatusIconScale(statusLabel) {
     if (
          statusLabel === "SHIELD" ||
          statusLabel === "BLOCKED" ||
          statusLabel === "LUCK" ||
          statusLabel === "MAGNET" ||
          statusLabel === "FOG"
     ) {
          return 1.25;
     }

     if (statusLabel === "GLASS") {
          return 0.85;
     }

     return 1;
}

function drawHealth(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, sizes, fonts, glow } = theme;
     const filledHeart = "\u2665\uFE0E";
     const emptyHeart = "\u2661\uFE0E";
     const maxVisibleHearts = 5;
     const lineGap = sizes.uiFontMd;
     const statusLabel = activeStatusUi.label || "CLEAR";
     const statusSeconds = getStatusSecondsRemaining();
     const statusIconScale = getStatusIconScale(statusLabel);
     const statusIcon = activeStatusUi.char || "";
     const statusDetailY = sizes.heartIconY + sizes.heartSize + sizes.uiFontMd + (lineGap * 2);

     let heartRow = "";

     for (let i = maxVisibleHearts - 1; i >= 0; i -= 1) {
          heartRow += (i < playerHealth) ? filledHeart : emptyHeart;
     }

     miniGameCtx.save();
     miniGameCtx.textAlign = "right";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = colors.statusText;
     miniGameCtx.shadowColor = colors.statusTextGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     miniGameCtx.font = `${sizes.heartSize}px ${fonts.body}`;
     miniGameCtx.fillText(heartRow, miniGameWidth - sizes.healthX, sizes.heartIconY);

     miniGameCtx.font = `${sizes.uiFontMd}px ${fonts.display}`;
     miniGameCtx.fillText(
          statusLabel,
          miniGameWidth - sizes.healthX,
          sizes.heartIconY + sizes.heartSize + lineGap
     );

     if (statusIcon) {
          const statusTimeText = statusSeconds ? ` ${statusSeconds}` : "";
          const statusTimeWidth = statusTimeText
               ? miniGameCtx.measureText(statusTimeText).width
               : 0;
          const iconFontSize = sizes.uiFontMd * statusIconScale;
          const iconX = miniGameWidth - sizes.healthX - statusTimeWidth;

          miniGameCtx.font = `400 ${sizes.uiFontMd}px ${fonts.body}`;
          miniGameCtx.fillText(statusTimeText, miniGameWidth - sizes.healthX, statusDetailY);

          miniGameCtx.font = `400 ${iconFontSize}px ${fonts.body}`;
          miniGameCtx.fillText(statusIcon, iconX, statusDetailY - ((iconFontSize - sizes.uiFontMd) * 0.35));
     } else {
          miniGameCtx.font = `400 ${sizes.uiFontMd}px ${fonts.body}`;
          miniGameCtx.fillText(
               "READY",
               miniGameWidth - sizes.healthX,
               statusDetailY
          );
     }

     miniGameCtx.restore();
}

function drawFogOverlay() {
     if (!miniGameCtx || !isEffectActive("fog")) {
          return;
     }

     const clearRadius = Math.max(44, Math.min(82, miniGameWidth * 0.16));
     const fadeRadius = clearRadius * 1.5;

     miniGameCtx.save();

     const gradient = miniGameCtx.createRadialGradient(
          player.x,
          player.y,
          clearRadius,
          player.x,
          player.y,
          fadeRadius
     );

     gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
     gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.2)");
     gradient.addColorStop(1, "rgba(0, 0, 0, 1)");

     miniGameCtx.fillStyle = gradient;
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

     miniGameCtx.restore();
}

function drawTouchButtons(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, fonts, glow } = theme;

     [touchControls.pauseButton].forEach((button) => {
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

// NOTE: MENU SCREENS

function drawTipsMenuScreen(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors } = theme;
     const layout = getMenuScreenLayout(theme);

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.fillTranslucentMedium;
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

     drawMenuScreenTitle("TIPS", theme, layout.titleCenterX, layout.topPadding);
     drawMenuButton(gameMenuUi.tipsHowToPlayButton, "How to Play", theme);
     drawMenuButton(gameMenuUi.tipsHelpEffectsButton, "Friends", theme);
     drawMenuButton(gameMenuUi.tipsHarmEffectsButton, "Enemies", theme);
     drawMenuBackButton(gameMenuUi.backButton, theme);

     miniGameCtx.restore();
}

function drawTipsDetailScreen(theme, title, lines) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, fonts, sizes } = theme;
     const layout = getMenuScreenLayout(theme);

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.fillTranslucentMedium;
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

     drawMenuScreenTitle(title, theme, layout.titleCenterX, layout.topPadding);

     let textY = layout.contentTopY;
     const fontSize = Math.max(12, sizes.uiFontSm);
     const lineHeight = fontSize * 1.1;
     const sectionGap = lineHeight * 1.5;

     const hasIconGutter = lines.some((line) => line.includes("{icon"));
     const iconGutterWidth = hasIconGutter ? Math.max(34, sizes.uiFontMd * 3) : 0;
     const iconX = layout.sidePadding + (iconGutterWidth * 0.25);
     const detailTextX = layout.sidePadding + iconGutterWidth;
     const detailTextWidth = miniGameWidth - detailTextX - layout.sidePadding;

     miniGameCtx.fillStyle = colors.fontColor;
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.shadowBlur = 0;
     miniGameCtx.font = `400 ${fontSize}px ${fonts.body}`;

     lines.forEach((line) => {
          const richSegments = parseRichTextSegments(line);
          const firstSegment = richSegments[0];
          const hasLeadingIcon = firstSegment?.type === "icon";
          const bodyText = hasLeadingIcon
               ? richSegments
                    .slice(1)
                    .map((segment) => segment.value)
                    .join("")
                    .trimStart()
               : line;

          if (hasLeadingIcon) {
               const icon = getRichTextIcon(firstSegment.value);

               if (icon) {
                    miniGameCtx.save();
                    miniGameCtx.font = `400 ${sizes.uiFontMd * icon.scale}px ${fonts.body}`;
                    miniGameCtx.fillStyle = colors.fontColor;
                    miniGameCtx.fillText(
                         icon.char,
                         iconX + (icon.xOffset || 0),
                         textY + (icon.yOffset || 0) - ((sizes.uiFontMd * icon.scale - sizes.uiFontMd) * 0.28)
                    );
                    miniGameCtx.restore();
               }
          }

          textY += (
               drawWrappedText(
                    miniGameCtx,
                    bodyText,
                    detailTextX,
                    textY,
                    detailTextWidth,
                    lineHeight
               ) * lineHeight
          ) + sectionGap;
     });

     drawMenuBackButton(gameMenuUi.backButton, theme);
     miniGameCtx.restore();
}

function drawOptionsScreen(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors } = theme;
     const layout = getMenuScreenLayout(theme);

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.fillTranslucentMedium;
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

     drawMenuScreenTitle("OPTIONS", theme, layout.titleCenterX, layout.topPadding);

     drawOptionStepper(
          gameMenuUi.harmfulRow,
          gameMenuUi.harmfulDecreaseButton,
          gameMenuUi.harmfulIncreaseButton,
          "Difficulty",
          getHarmfulToggleLabel(),
          harmfulLevel,
          theme
     );

     drawOptionStepper(
          gameMenuUi.musicRow,
          gameMenuUi.musicDecreaseButton,
          gameMenuUi.musicIncreaseButton,
          "Music",
          getMusicToggleLabel(),
          musicLevel,
          theme
     );

     drawOptionStepper(
          gameMenuUi.soundEffectsRow,
          gameMenuUi.soundEffectsDecreaseButton,
          gameMenuUi.soundEffectsIncreaseButton,
          "Sound FX",
          getSoundEffectsToggleLabel(),
          soundEffectsLevel,
          theme
     );

     drawMenuBackButton(gameMenuUi.backButton, theme);
     miniGameCtx.restore();
}

// NOTE: DRAW GAME WELCOME OVERLAY

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

     const firstLineY = (miniGameHeight / 2) - (titleFontSize + (lineGap * 0.5));
     const secondLineY = firstLineY + titleFontSize + lineGap;

     const actionGap = Math.max(18, titleFontSize * 0.5);
     const actionY = secondLineY + Math.max(34, titleFontSize * 1.25);

     updateWelcomeTitleColors(titleLines);

     miniGameCtx.save();
     miniGameCtx.globalAlpha = alpha;

     if (!isScreenWelcomeActive()) {
          miniGameCtx.fillStyle = colors.fillTranslucentMedium;
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
               const letterColor = colorsForLine[i] || colors.fontColor;

               miniGameCtx.fillStyle = letterColor;
               miniGameCtx.shadowColor = letterColor;
               miniGameCtx.shadowBlur = glow.uiStrongGlow;
               miniGameCtx.fillText(letter, x, y);

               x += letterWidths[i];
          }
     });

     const welcomeUi = getScreenActionUi();

     welcomeUi.startButton.x = 0;
     welcomeUi.startButton.y = 0;
     welcomeUi.startButton.width = 0;
     welcomeUi.startButton.height = 0;

     welcomeUi.tipsButton.x = 0;
     welcomeUi.tipsButton.y = 0;
     welcomeUi.tipsButton.width = 0;
     welcomeUi.tipsButton.height = 0;

     welcomeUi.menuButton.x = 0;
     welcomeUi.menuButton.y = 0;
     welcomeUi.menuButton.width = 0;
     welcomeUi.menuButton.height = 0;

     const buttonPaddingX = 14;
     const buttonPaddingY = 10;
     const actionTextSize = sizes.uiFontMd;

     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.controlGlow;
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
          miniGameCtx.fillStyle = colors.controlFill;
          miniGameCtx.strokeStyle = colors.outlineSoft;
          miniGameCtx.lineWidth = 3;
          miniGameCtx.shadowColor = colors.controlGlow;
          miniGameCtx.shadowBlur = glow.uiSoftGlow;

          drawRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, sizes.controlRadius);
          miniGameCtx.fill();
          miniGameCtx.stroke();

          miniGameCtx.fillStyle = colors.controlText;
          miniGameCtx.textAlign = "center";
          miniGameCtx.textBaseline = "middle";
          miniGameCtx.font = `400 ${sizes.uiFontMd}px ${fonts.body}`;
          miniGameCtx.fillText(item.text, textX, actionY + 1);
          miniGameCtx.restore();

          if (item.text === "NEW GAME") {
               welcomeUi.startButton.x = buttonX;
               welcomeUi.startButton.y = buttonY;
               welcomeUi.startButton.width = buttonWidth;
               welcomeUi.startButton.height = buttonHeight;
          }

          if (item.text === "TIPS") {
               welcomeUi.tipsButton.x = buttonX;
               welcomeUi.tipsButton.y = buttonY;
               welcomeUi.tipsButton.width = buttonWidth;
               welcomeUi.tipsButton.height = buttonHeight;
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

     miniGameCtx.fillStyle = colors.fillTranslucentMedium;
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

     const pausedUi = getPausedActionUi();

     pausedUi.resumeButton.x = 0;
     pausedUi.resumeButton.y = 0;
     pausedUi.resumeButton.width = 0;
     pausedUi.resumeButton.height = 0;

     pausedUi.tipsButton.x = 0;
     pausedUi.tipsButton.y = 0;
     pausedUi.tipsButton.width = 0;
     pausedUi.tipsButton.height = 0;

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
               const letterColor = colorsForLine[i] || colors.fontColor;

               miniGameCtx.fillStyle = letterColor;
               miniGameCtx.shadowColor = letterColor;
               miniGameCtx.shadowBlur = glow.uiStrongGlow;
               miniGameCtx.fillText(letter, x, y);

               x += letterWidths[i];
          }
     });

     const buttonPaddingX = 12;
     const buttonPaddingY = 6;
     const actionTextSize = sizes.uiFontMd;

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
               pausedUi.tipsButton.x = buttonX;
               pausedUi.tipsButton.y = buttonY;
               pausedUi.tipsButton.width = buttonWidth;
               pausedUi.tipsButton.height = buttonHeight;
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

     miniGameCtx.fillStyle = colors.fillTranslucentSoft;
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";

     miniGameCtx.font = `${sizes.uiFontMd}px ${fonts.display}`;
     const titleWidth = miniGameCtx.measureText(gameOverlayText).width;

     let subWidth = 0;
     if (hasSubtext) {
          miniGameCtx.font = `400 ${sizes.uiFontMd}px ${fonts.body}`;
          subWidth = miniGameCtx.measureText(gameOverlaySubtext).width;
     }

     const horizontalPadding = 20;
     const topPadding = 20;
     const bottomPadding = hasSubtext ? 22 : 20;
     const gapBetweenLines = hasSubtext ? 18 : 0;

     const panelWidth = Math.max(titleWidth, subWidth) + (horizontalPadding * 2);
     const panelHeight =
          sizes.uiFontMd +
          (hasSubtext ? sizes.uiFontMd + gapBetweenLines : 0) +
          topPadding +
          bottomPadding;
     const panelX = (miniGameWidth - panelWidth) / 2;
     const panelY = titleY - topPadding - (sizes.uiFontMd / 2);

     drawPanelBox(panelX, panelY, panelWidth, panelHeight, theme);

     miniGameCtx.fillStyle = colors.fontColor;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.overlayGlow;
     miniGameCtx.shadowBlur = glow.uiStrongGlow;
     miniGameCtx.font = `${sizes.uiFontMd}px ${fonts.display}`;
     miniGameCtx.fillText(gameOverlayText, miniGameWidth / 2, titleY);

     if (hasSubtext) {
          miniGameCtx.shadowBlur = glow.uiSoftGlow;
          miniGameCtx.font = `400 ${sizes.uiFontMd}px ${fonts.body}`;
          miniGameCtx.fillText(gameOverlaySubtext, miniGameWidth / 2, titleY + subtextOffset);
     }

     miniGameCtx.restore();
}

// NOTE: MASTER DRAW ENTRY

export function drawGame() {
     const theme = getUiTheme();

     drawMiniGameBackground();

     if (isScreenWelcomeActive()) {
          drawGameWelcomeOverlay(theme);
          return;
     }

     if (gameStarted) {
          drawSparkles();
          drawEffectPickups();
          drawCollisionBursts();
          drawPlayerTrail();
          drawPlayer();

          drawFogOverlay();

          drawScore(theme);
          drawHealth(theme);

          if (!gamePaused && !gameMenuOpen && !gameOver && !gameWon) {
               drawTouchButtons(theme);
          }
     }

     if (gameMenuOpen) {
          if (gameMenuView === "tips") {
               drawTipsMenuScreen(theme);
          } else if (gameMenuView === "tips_how_to_play") {
               drawTipsDetailScreen(theme, "How to Play", getHowToPlayLines());
          } else if (gameMenuView === "tips_help_effects") {
               drawTipsDetailScreen(theme, "Friends", getHelpfulEffectLines());
          } else if (gameMenuView === "tips_harm_effects") {
               drawTipsDetailScreen(theme, "Enemies", getHarmfulEffectLines());
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
