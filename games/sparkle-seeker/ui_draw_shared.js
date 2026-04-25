// NOTE: UI DRAW / SHARED
// Shared canvas drawing helpers, theme helpers, HUD drawing,
// menu layout helpers, and rich text / title color helpers.
//
// Owned here:
// - theme/color/font helpers
// - shared draw primitives
// - HUD drawing
// - touch button drawing
// - menu layout helpers
// - rich text helpers
// - title color engines

import {
     miniGameCtx,
     miniGameWidth,
     miniGameHeight,
     player,
     touchControls,
     sparkleScore,
     playerHealth,
     maxOptionLevelIndex,
     activeStatusUi,
     isEffectActive
} from "./state.js";

import {
     getCurrentLevelProgressStars,
     getCurrentLevelNumber
} from "./entities_level.js";

import {
     getCurrentScreenTitleLines
} from "./ui_mode.js";

// CSS HELPERS

const siteTheme = window.SiteTheme;

export function getCssColor(variableName, fallback = "#ffffff") {
     return siteTheme?.getCssColor?.(variableName, fallback) || fallback;
}

export function getCssNumber(variableName, fallback = 0) {
     return siteTheme?.getCssNumber?.(variableName, fallback) ?? fallback;
}

export function getCssString(variableName, fallback = "") {
     if (!document?.documentElement) {
          return fallback;
     }

     const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
     return value || fallback;
}

export function getCssPixelSize(variableName, fallback = 16) {
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

// NOTE: JS Root

export function getUiTheme() {
     const fontColor = getCssColor("--color-text", getCssColor("--color-text", "#ffffff"));
     const uiFontLg = getCssPixelSize("--font-size-lg");
     const uiFontMd = getCssPixelSize("--font-size-md");
     const uiFontSm = getCssPixelSize("--font-size-sm") * 1.5;

     const menuSidePadding = miniGameWidth * 0.05;
     const menuTopPadding = miniGameHeight * 0.05;
     const detailFontSize = Math.max(10, uiFontSm);
     const detailLineHeight = detailFontSize * 1.1;

     return {
          fonts: {
               display: getCssString("--font-display", '"Bungee Shade", cursive'),
               body: getCssString("--font-body", '"Noto Sans Mono", monospace'),
               symbol: '"Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif'
          },

          colors: {
               fontColor,
               controlText: fontColor,
               controlGlow: fontColor,
               overlayGlow: fontColor,
               scoreGlow: fontColor,
               scoreText: fontColor,
               scoreTextGlow: fontColor,
               statusText: fontColor,
               statusTextGlow: fontColor,
               starFull: fontColor,
               starGlow: fontColor,
               heartFull: fontColor,
               heartGlow: fontColor,

               fillTranslucentNone: getCssColor("--translucent-none", "rgba(0, 0, 0, 0)"),
               fillTranslucentSoft: getCssColor("--translucent-soft", "rgba(0, 0, 0, 0.25)"),
               fillTranslucentMedium: getCssColor("--translucent-medium", "rgba(0, 0, 0, 0.5)"),
               fillTranslucentStrong: getCssColor("--translucent-strong", "rgba(0, 0, 0, 0.75)"),

               outlineSoft: getCssColor("--opaque-soft", "rgba(0, 0, 0, 0.25)"),
               outlineStrong: getCssColor("--opaque-strong", "rgba(0, 0, 0, 0.75)"),
               controlFill: getCssColor("--opaque-soft", "rgba(0, 0, 0, 0.25)"),
               controlFillPressed: getCssColor("--opaque-strong", "rgba(0, 0, 0, 0.75)"),

               menuScreenFill: getCssColor("--translucent-strong", "rgba(0, 0, 0, 0.75)"),
               menuPanelFill: getCssColor("--translucent-strong", "rgba(0, 0, 0, 0.75)")
          },

          sizes: {
               uiFontLg,
               uiFontMd,
               uiFontSm,

               controlRadius: getCssNumber("--panel-radius", 15),

               statusFontSize: uiFontMd,
               statusLabelFontSize: uiFontMd * 1.5,

               starSize: Math.max(15, Math.min(24, miniGameWidth * 0.055)),
               heartSize: Math.max(13, Math.min(28, miniGameWidth * 0.06)),
               starIconY: 4,
               heartIconY: 3,

               scoreX: 5,
               healthX: 5,
               statusFontY: 20,

               starGap: uiFontSm * 0.5,
               heartGap: uiFontSm * 0.5,
               levelGapAbove: uiFontSm * 0.75,
               levelGapBelow: uiFontSm * 0.5,
               statusGapAbove: uiFontSm * 0.25,
               statusGapBelow: uiFontSm * 0.5,

               touchButtonFontScale: 0.5
          },

          layout: {
               menu: {
                    sidePadding: menuSidePadding,
                    topPadding: menuTopPadding,

                    titleFontSize: uiFontLg * 2,
                    titleLetterSpacing: 3,
                    titleOffsetFromTop: 12,
                    titleGapBelow: uiFontMd * 2,

                    contentRowGap: uiFontSm * 2,
                    contentBottomPadding: menuTopPadding,

                    backButtonSize: 50,
                    backButtonBottomOffset: 0,
                    backButtonFontSize: uiFontMd,

                    buttonHeight: 50,
                    buttonFontSize: uiFontSm,
                    optionLabelFontSize: uiFontSm,
                    arrowFontSize: uiFontMd,

                    detailFontSize,
                    detailLineHeight,
                    detailSectionGap: detailLineHeight * 1.5,
                    detailIconGutterMin: 34,
                    detailIconGutterWidth: Math.max(34, uiFontMd * 3)
               }
          },

          screens: {
               welcome: {
                    titleStackGap: 10,
                    titleBlockYOffset: 0,

                    buttonPaddingX: 20,
                    buttonPaddingY: 10,
                    buttonTextSize: uiFontSm,
                    buttonGapMin: 10,
                    buttonGapTitleScale: 0.25
               },

               paused: {
                    overlayFill: getCssColor("--translucent-strong", "rgba(0, 0, 0, 0.75)"),

                    titleFontSizeMin: 40,
                    titleFontSizeWidthScale: 0.16,
                    titleFontSizeHeightScale: 0.16,
                    titleYRatio: 0.46,

                    buttonPaddingX: 12,
                    buttonPaddingY: 6,
                    buttonTextSize: uiFontMd,
                    buttonGapMin: 10,
                    buttonGapTitleScale: 0.25,
                    buttonYOffsetMin: 52,
                    buttonYOffsetTitleScale: 1,

                    buttonFill: "rgba(255, 255, 255, 0.1)",
                    buttonStroke: "rgba(255, 255, 255, 0.75)"
               },

               result: {
                    overlayFill: getCssColor("--translucent-strong", "rgba(0, 0, 0, 0.75)"),

                    titleStackGap: 10,
                    titleBlockYOffset: 0,

                    buttonPaddingX: 20,
                    buttonPaddingY: 10,
                    buttonTextSize: uiFontSm,
                    buttonGapMin: 10,
                    buttonGapTitleScale: 0.25
               },

               statusOverlay: {
                    subtextOffset: 30,
                    horizontalPadding: 20,
                    topPadding: 20,
                    bottomPaddingNoSubtext: 20,
                    bottomPaddingWithSubtext: 22,
                    gapBetweenLines: 18
               }
          },

          glow: {
               uiSoftGlow: getCssNumber("--glow-particle-bg-blur", 10),
               uiMediumGlow: getCssNumber("--glow-particle-game-blur", 16),
               uiStrongGlow: getCssNumber("--glow-particle-game-blur", 16) * 1.35
          }
     };
}

// SHARED DRAW HELPERS

export function drawRoundedRect(x, y, width, height, radius) {
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

export function drawPanelBox(x, y, width, height, theme, lineWidth = 3) {
     const { colors, glow, sizes } = theme;

     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiStrongGlow;

     drawRoundedRect(x, y, width, height, sizes.controlRadius);
     miniGameCtx.fillStyle = colors.menuPanelFill;
     miniGameCtx.fill();

     miniGameCtx.shadowBlur = 0;
     miniGameCtx.strokeStyle = colors.outlineStrong;
     miniGameCtx.lineWidth = lineWidth;

     drawRoundedRect(x, y, width, height, sizes.controlRadius);
     miniGameCtx.stroke();
}

function getUiArrowFont(theme) {
     const { layout, fonts } = theme;
     return `700 ${layout.menu.arrowFontSize}px ${fonts.body}`;
}

// NOTE: Icon Size/Scale

const richTextIcons = {
     iconShield: { char: "\u2B21\uFE0E", scale: 1.5, xOffset: 0, yOffset: -6 },
     iconCure: { char: "\u271A\uFE0E", scale: 1.5, xOffset: 0, yOffset: -7 },
     iconLuck: { char: "\u2618\uFE0E", scale: 1.5, xOffset: 0, yOffset: -6 },
     iconMagnet: { char: "\u2316\uFE0E", scale: 1.5, xOffset: -3, yOffset: -7 },
     iconSlowmo: { char: "\u29D6\uFE0E", scale: 1.5, xOffset: -1, yOffset: -5 },

     iconFreeze: { char: "\u2744\uFE0E", scale: 1.5, xOffset: 1, yOffset: -6 },
     iconSurge: { char: "\u26A1\uFE0E", scale: 1.5, xOffset: 0, yOffset: -6 },
     iconDaze: { char: "\u2300\uFE0E", scale: 1.5, xOffset: 0, yOffset: -6 },
     iconGlass: { char: "\u26A0\uFE0E", scale: 1.5, xOffset: 0, yOffset: -6 },
     iconFog: { char: "\u224B\uFE0E", scale: 1.5, xOffset: 0, yOffset: -4 }
};

export function parseRichTextSegments(text) {
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

export function getRichTextIcon(tokenName) {
     return richTextIcons[tokenName] || null;
}

export function drawWrappedRichText(ctx, text, x, y, maxWidth, lineHeight, options = {}) {
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

export function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
     return drawWrappedRichText(ctx, text, x, y, maxWidth, lineHeight);
}

// TITLE COLOR HELPERS

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
          const fallbackColor = getCssColor("--color-rainbow", getCssColor("--color-rainbow", "#ffffff"));
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

export function getWelcomeCurrentColors() {
     return welcomeCurrentColors;
}

export function getWelcomeTitleFontSize(theme, titleLines = getCurrentScreenTitleLines()) {
     const { fonts } = theme;
     const baseSize = Math.min(miniGameWidth * 0.2, miniGameHeight * 0.2);
     const maxSize = Math.max(50, baseSize);
     const minSize = 20;
     const sidePadding = 50;
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

export function updateTipsTitleColors(title) {
     ensureTipsTitleColorEngine();

     const rainbowCycleSpeed = siteTheme?.getTextSettings?.().rainbowCycleSpeed ?? 900;
     const now = performance.now();

     if (tipsTitleCurrentColors.length && (now - tipsTitleLastColorCycleTime) < rainbowCycleSpeed) {
          return;
     }

     if (!tipsTitleColorEngine?.nextCycleForText) {
          tipsTitleCurrentColors = Array(title.length).fill(
               getCssColor("--color-rainbow", getCssColor("--color-rainbow", "#ffffff"))
          );
     } else {
          tipsTitleCurrentColors = tipsTitleColorEngine.nextCycleForText(title, tipsTitlePreviousColors);
     }

     tipsTitlePreviousColors = [...tipsTitleCurrentColors];
     tipsTitleLastColorCycleTime = now;
}

// MENU LAYOUT / MENU HELPERS

export function getMenuScreenLayout(theme) {
     const { layout } = theme;
     const menu = layout.menu;

     const sidePadding = menu.sidePadding;
     const topPadding = menu.topPadding;
     const titleFontSize = menu.titleFontSize;

     const backButtonSize = menu.backButtonSize;
     const backButtonX = (miniGameWidth - backButtonSize) / 2;
     const backButtonY =
          miniGameHeight -
          backButtonSize -
          topPadding -
          menu.backButtonBottomOffset;

     const titleCenterX = miniGameWidth / 2;
     const titleY = topPadding + menu.titleOffsetFromTop;

     return {
          sidePadding,
          topPadding,
          titleFontSize,
          titleGap: menu.titleGapBelow,
          rowGap: menu.contentRowGap,
          titleCenterX,
          titleY,
          backButtonSize,
          backButtonX,
          backButtonY,
          contentTopY: titleY + titleFontSize + menu.titleGapBelow,
          contentWidth: miniGameWidth - (sidePadding * 2),
          contentBottomY: miniGameHeight - topPadding - backButtonSize - menu.contentBottomPadding
     };
}

export function drawMenuScreenTitle(title, theme, centerX, y) {
     const { colors, fonts, glow, layout } = theme;
     const titleFontSize = layout.menu.titleFontSize;
     const letterSpacing = layout.menu.titleLetterSpacing;

     miniGameCtx.save();
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.font = `${titleFontSize}px ${fonts.display}`;

     updateTipsTitleColors(title);

     const letterWidths = [];

     for (let i = 0; i < title.length; i += 1) {
          letterWidths.push(miniGameCtx.measureText(title[i]).width);
     }

     const totalWidth =
          letterWidths.reduce((sum, width) => sum + width, 0) +
          (letterSpacing * Math.max(0, title.length - 1));

     let titleX = centerX - (totalWidth / 2);

     for (let i = 0; i < title.length; i += 1) {
          const letter = title[i];
          const letterColor = tipsTitleCurrentColors[i] || colors.fontColor;

          miniGameCtx.fillStyle = letterColor;
          miniGameCtx.shadowColor = letterColor;
          miniGameCtx.shadowBlur = glow.uiSoftGlow;
          miniGameCtx.fillText(letter, titleX, y);

          titleX += letterWidths[i] + letterSpacing;
     }

     miniGameCtx.restore();
}

export function drawMenuButton(button, label, theme) {
     if (!miniGameCtx || !button) {
          return;
     }

     const { colors, sizes, fonts, glow, layout } = theme;
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
     miniGameCtx.font = `400 ${layout.menu.buttonFontSize}px ${fonts.body}`;
     miniGameCtx.fillText(label, centerX, centerY + 1);

     miniGameCtx.restore();
}

export function drawMenuBackButton(button, theme) {
     if (!miniGameCtx || !button) {
          return;
     }

     const { colors, glow, fonts, layout } = theme;
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
     miniGameCtx.font = `700 ${layout.menu.backButtonFontSize}px ${fonts.body}`;
     miniGameCtx.fillText("<", centerX, centerY + 1);

     miniGameCtx.restore();
}

export function drawOptionStepper(row, decreaseButton, increaseButton, label, value, levelIndex, theme) {
     if (!miniGameCtx || !row || !decreaseButton || !increaseButton) {
          return;
     }

     const { colors, sizes, fonts, glow, layout } = theme;
     const centerY = row.y + (row.height / 2);
     const decreaseAlpha = levelIndex <= 0 ? 0.28 : 1;
     const increaseAlpha = levelIndex >= maxOptionLevelIndex ? 0.28 : 1;
     const arrowFont = getUiArrowFont(theme);

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
     miniGameCtx.font = arrowFont;
     miniGameCtx.fillText(
          "<",
          decreaseButton.x + (decreaseButton.width / 2),
          centerY + 1
     );

     miniGameCtx.globalAlpha = 1;
     miniGameCtx.font = `400 ${layout.menu.optionLabelFontSize}px ${fonts.body}`;
     miniGameCtx.fillText(
          `${label}: ${value}`,
          row.x + (row.width / 2),
          centerY + 1
     );

     miniGameCtx.globalAlpha = increaseAlpha;
     miniGameCtx.font = arrowFont;
     miniGameCtx.fillText(
          ">",
          increaseButton.x + (increaseButton.width / 2),
          centerY + 1
     );

     miniGameCtx.restore();
}

export function drawControlButton(button, isPressed, theme) {
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

// BACKGROUND / HUD / TOUCH

export function drawMiniGameBackground() {
     if (!miniGameCtx) {
          return;
     }

     miniGameCtx.clearRect(0, 0, miniGameWidth, miniGameHeight);
     miniGameCtx.fillStyle = getCssColor("--translucent-medium", "rgba(0, 0, 0, 0.5)");
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);
}

function getStatusSecondsRemaining() {
     if (activeStatusUi.timer <= 0) {
          return "";
     }

     return `${Math.ceil(activeStatusUi.timer / 60)}s`;
}

// NOTE: DRAW SCORE

export function drawScore(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, sizes, fonts, glow } = theme;
     const { starGap, levelGapAbove, levelGapBelow, statusLabelFontSize } = sizes;
     const levelText = `LVL ${getCurrentLevelNumber()}`;
     const sparkleText = `\u2726\uFE0E ${String(sparkleScore).padStart(3, "0")}`;
     const filledStars = getCurrentLevelProgressStars();

     miniGameCtx.save();
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = colors.starFull;
     miniGameCtx.shadowColor = colors.starGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;
     miniGameCtx.font = `${sizes.starSize}px ${fonts.symbol}`;

     const filledStar = "\u2605\uFE0E";
     const emptyStar = "\u2606\uFE0E";
     const starGlyphWidth = miniGameCtx.measureText(filledStar).width;

     let currentX = sizes.scoreX;

     for (let i = 1; i <= 5; i += 1) {
          const starChar = i <= filledStars ? filledStar : emptyStar;
          miniGameCtx.fillText(starChar, currentX, sizes.starIconY);
          currentX += starGlyphWidth + starGap;
     }

     const levelY = sizes.starIconY + sizes.starSize + levelGapAbove;
     miniGameCtx.font = `${statusLabelFontSize}px ${fonts.display}`;
     miniGameCtx.fillText(levelText, sizes.scoreX, levelY);

     const sparkleY = levelY + statusLabelFontSize + levelGapBelow;
     miniGameCtx.font = `400 ${sizes.uiFontMd}px ${fonts.body}`;
     miniGameCtx.fillText(sparkleText, sizes.scoreX, sparkleY);

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

// NOTE: DRAW HEALTH

export function drawHealth(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, sizes, fonts, glow } = theme;
     const { heartGap, statusGapAbove, statusGapBelow, statusLabelFontSize } = sizes;
     const filledHeart = "\u2665\uFE0E";
     const emptyHeart = "\u2661\uFE0E";
     const maxVisibleHearts = 5;
     const statusLabel = activeStatusUi.label || "CLEAR";
     const statusSeconds = getStatusSecondsRemaining();
     const statusIconScale = getStatusIconScale(statusLabel);
     const statusIcon = activeStatusUi.char || "";

     miniGameCtx.save();
     miniGameCtx.textAlign = "right";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = colors.statusText;
     miniGameCtx.shadowColor = colors.statusTextGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;

     miniGameCtx.font = `${sizes.heartSize}px ${fonts.body}`;

     const heartGlyphWidth = miniGameCtx.measureText(filledHeart).width;
     let currentX = miniGameWidth - sizes.healthX;

     for (let i = 0; i < maxVisibleHearts; i += 1) {
          const heartChar = i < playerHealth ? filledHeart : emptyHeart;

          miniGameCtx.fillText(heartChar, currentX, sizes.heartIconY);
          currentX -= heartGlyphWidth + heartGap;
     }

     const statusLabelY = sizes.heartIconY + sizes.heartSize + statusGapAbove;

     miniGameCtx.font = `${statusLabelFontSize}px ${fonts.display}`;
     miniGameCtx.fillText(
          statusLabel,
          miniGameWidth - sizes.healthX,
          statusLabelY
     );

     const statusDetailY = statusLabelY + statusLabelFontSize + statusGapBelow;

     if (statusIcon) {
          const statusTimeText = statusSeconds ? ` ${statusSeconds}` : "";
          miniGameCtx.font = `400 ${sizes.uiFontMd}px ${fonts.body}`;
          const statusTimeWidth = statusTimeText
               ? miniGameCtx.measureText(statusTimeText).width
               : 0;
          const iconFontSize = sizes.uiFontMd * statusIconScale;
          const iconX = miniGameWidth - sizes.healthX - statusTimeWidth;

          miniGameCtx.fillText(statusTimeText, miniGameWidth - sizes.healthX, statusDetailY);

          miniGameCtx.font = `400 ${iconFontSize}px ${fonts.body}`;
          miniGameCtx.fillText(statusIcon, iconX, statusDetailY - ((iconFontSize - sizes.uiFontMd) * 0.35));
     } else {
          miniGameCtx.font = `400 ${sizes.uiFontMd}px ${fonts.body}`;
          miniGameCtx.fillText("READY", miniGameWidth - sizes.healthX, statusDetailY);
     }

     miniGameCtx.restore();
}

export function drawFogOverlay() {
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

export function drawTouchButtons(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, fonts, glow, sizes } = theme;

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
          miniGameCtx.font = `400 ${button.height * sizes.touchButtonFontScale}px ${fonts.body}`;
          miniGameCtx.fillText(
               button.label,
               button.x + (button.width / 2),
               button.y + (button.height / 2) + 1
          );
          miniGameCtx.restore();
     });
}
