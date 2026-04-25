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
//
// Newbie note:
// - If a visual size/spacing change "does nothing", the value may be controlled in
//   `ui_draw.js` instead of here.
// - This file is the main source-of-truth for shared UI knobs.
// - Try changing values in the JS Root first before hunting through draw functions.
// - Most "what size is this text/button/gap?" questions are answered in `getUiTheme()`.
// - `theme` is just a plain object full of numbers/colors/fonts that other draw
//   functions read from.

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
// These helpers read values from CSS custom properties like `--font-size-lg`.
// That lets you keep visual design tokens in CSS, but still use them in canvas JS.

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

     // Canvas text APIs want real pixel sizes.
     // CSS variables may contain `rem`, `vw`, `clamp(...)`, etc.
     // So we briefly create a hidden DOM element, let the browser resolve the size,
     // then read back the final pixel value.
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
// This is the main "tuning panel" for the shared canvas UI.
// Most text size / spacing / opacity changes should start here.

export function getUiTheme() {
     const fontColor = getCssColor("--color-text", getCssColor("--color-text", "#ffffff"));
     const uiFontLg = getCssPixelSize("--font-size-lg");
     const uiFontMd = getCssPixelSize("--font-size-md");
     const uiFontSm = getCssPixelSize("--font-size-sm");

     // One master screen overlay fill for Tips / Options / detail screens /
     // Paused / You Win / Try Again backgrounds.
     const menuOverlayFill = "rgba(0, 0, 0, 0.9)";

     // "base" holds generic shared sizes used in many places.
     const base = {
          uiFontLg,
          uiFontMd,
          uiFontSm,
          controlRadius: getCssNumber("--panel-radius", 15)
     };

     // NOTE: HUD
     // top-left / top-right in-game info.
     // This controls score, stars, hearts, level label, status label, READY text, etc.
     const hud = {
          statusLabelFontSize: uiFontLg * 1.5,
          scoreDetailFontSize: uiFontLg,
          statusDetailFontSize: uiFontLg,

          starSize: uiFontLg * 1.5,
          heartSize: uiFontLg * 2,
          starIconY: 3,
          heartIconY: 2,

          scoreX: 5,
          healthX: 5,

          starGap: uiFontSm * 0.25,
          heartGap: uiFontSm * 0.5,

          levelGapAbove: uiFontSm * 0.25,
          levelGapBelow: uiFontSm * 0.5,

          statusGapAbove: uiFontSm * 0.01,
          statusGapBelow: uiFontSm * 0.5
     };

     // NOTE: Menu text controls are collocated here:
     // - menu title text
     // - menu row button text
     // - options row text
     // - detail / instructions text
     //
     // Newbie note:
     // `titleFontSize` is for labels like "TIPS" / "OPTIONS" / "FRIENDS".
     // `buttonFontSize` is for menu buttons inside those screens.
     // `optionLabelFontSize` is for rows like "Difficulty: Normal".
     // `detailFontSize` is for paragraph-like help text.
     const menu = {
          sidePadding: uiFontLg,
          topPadding: uiFontLg * 2,

          titleFontSize: uiFontLg * 3, //TODO eval ttl font size
          titleLetterSpacing: uiFontSm / 2,
          titleGapBelow: uiFontLg * 2,

          contentRowGap: uiFontMd,
          contentBottomPadding: uiFontSm,

          backButtonSize: 50,
          backButtonBottomOffset: 0,
          arrowFontSize: uiFontLg * 2,

          buttonHeight: uiFontLg,
          buttonFontSize: uiFontLg, // TODO menu btn font size
          optionLabelFontSize: uiFontLg,

          detailFontSize: uiFontMd, // TODO dtl font size
          detailLineHeight: uiFontLg, // space betweens lines within the same paragraph
          detailSectionGap: uiFontLg, // space between paragraphs
          detailIconGutterWidth: uiFontLg * 2
     };

     // NOTE: Shared button format for welcome / paused / result overlays.
     // This is where NEW GAME / TIPS / OPTIONS / RESUME / TRY AGAIN / etc. stay in sync.
     //
     // Newbie note:
     // We use the *same property names* that the screens expect.
     // That lets us "spread" this object directly into each screen with `...sharedScreenButtons`
     // instead of rewriting the same lines over and over.
     const sharedScreenButtons = {
          buttonPaddingX: 10,
          buttonPaddingY: 10,
          buttonFontSize: uiFontLg, // TODO: w btn font size
          buttonGapMin: uiFontMd,
          buttonGapTitleScale: 0.25
     };

     // NOTE: Shared title sizing for SPARKLE SEEKER / YOU WIN / TRY AGAIN.
     // `getWelcomeTitleFontSize()` reads these values.
     //
     // Newbie note:
     // `titleWidthScale` and `titleHeightScale` make the title responsive.
     // `titleMinSize` stops it from getting too small.
     // `titleMaxSizeFloor` means "never let the max calculation start below this."
     const sharedScreenTitle = {
          titleMinSize: 20,
          titleMaxSizeFloor: 50,
          titleWidthScale: 0.2,
          titleHeightScale: 0.2,
          titleSidePadding: 50
     };

     // Screen-specific config.
     // Each screen can inherit shared settings and still override a few values if needed.
     const screens = {
          welcome: {
               ...sharedScreenTitle,

               titleStackGap: 10,
               titleBlockYOffset: 0,

               ...sharedScreenButtons
          },

          paused: {
               overlayFill: menuOverlayFill,

               titleFontSizeMin: 40,
               titleFontSizeWidthScale: 0.1,
               titleFontSizeHeightScale: 0.1,
               titleYRatio: 0.5,

               ...sharedScreenButtons,

               buttonYOffsetMin: 50,
               buttonYOffsetTitleScale: 1,

               // This is the button box fill, not the full-screen background.
               buttonFill: getCssColor("--translucent-soft", "rgba(0, 0, 0, 0.25)"),
               buttonStroke: "rgba(255, 255, 255, 0.75)"
          },

          result: {
               overlayFill: menuOverlayFill,

               ...sharedScreenTitle,

               titleStackGap: uiFontSm,
               titleBlockYOffset: 0,

               ...sharedScreenButtons
          },

          statusOverlay: {
               subtextOffset: 30,
               horizontalPadding: 20,
               topPadding: 20,
               bottomPaddingNoSubtext: 20,
               bottomPaddingWithSubtext: 22,
               gapBetweenLines: 18
          }
     };

     return {
          fonts: {
               // `display` = decorative title font
               // `body` = readable UI font
               // `symbol` = safe fallback stack for stars/hearts/special glyphs
               display: getCssString("--font-display", '"Bungee Shade", cursive'),
               body: getCssString("--font-body", '"Noto Sans Mono", monospace'),
               symbol: '"Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif'
          },

          colors: {
               fontColor,
               controlText: fontColor,
               controlGlow: fontColor,
               overlayGlow: fontColor,
               statusText: fontColor,
               statusTextGlow: fontColor,
               starFull: fontColor,
               starGlow: fontColor,

               controlFill: getCssColor("--opaque-soft", "rgba(0, 0, 0, 0.25)"),
               outlineSoft: getCssColor("--opaque-soft", "rgba(0, 0, 0, 0.25)"),
               outlineStrong: getCssColor("--opaque-strong", "rgba(0, 0, 0, 0.75)"),

               // `menuScreenFill` = full-screen background wash
               // `menuPanelFill` = box/panel fill used by panel components
               // They currently match, but are kept separate in case you want them different later.
               menuScreenFill: menuOverlayFill,
               menuPanelFill: menuOverlayFill
          },

          sizes: {
               ...base,
               ...hud,
               touchButtonFontScale: 0.5
          },

          layout: {
               menu
          },

          screens,

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

     // Canvas has no built-in "draw rounded rectangle" helper with exactly the behavior
     // we want, so we build the shape manually with lines + curves.
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
// These map tokens like `{iconShield}` in help text to actual glyphs and offsets.
// Offsets are hand-tuned because symbol fonts rarely align perfectly by default.

const richTextIcons = {
     iconShield: { char: "\u2B21\uFE0E", scale: 1.5, xOffset: 0, yOffset: -6 },
     iconCure: { char: "\u271A\uFE0E", scale: 1.5, xOffset: 0, yOffset: -7 },
     iconLuck: { char: "\u2618\uFE0E", scale: 1.5, xOffset: 0, yOffset: -6 },
     iconMagnet: { char: "\u2316\uFE0E", scale: 1.5, xOffset: -3, yOffset: -7 },
     iconSlowmo: { char: "\u29D6\uFE0E", scale: 1.5, xOffset: -1, yOffset: -5 },

     iconFreeze: { char: "\u2744\uFE0E", scale: 1.5, xOffset: 1, yOffset: -4 },
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

     // NOTE: We split text into a flat stream of text/icon tokens so they can wrap together.
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

     // NOTE: first pass - measure and decide where line breaks should happen.
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

     // NOTE: second pass - actually draw the prepared lines.
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
// These manage rainbow-style title coloring for the welcome screen and menu titles.

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
     const { fonts, screens } = theme;
     const config = screens.welcome;
     const baseSize = Math.min(
          miniGameWidth * config.titleWidthScale,
          miniGameHeight * config.titleHeightScale
     );
     const maxSize = Math.max(config.titleMaxSizeFloor, baseSize);
     const minSize = config.titleMinSize;
     const sidePadding = config.titleSidePadding;
     let fontSize = maxSize;

     miniGameCtx.save();

     // NOTE: We shrink the title until the widest line fits the canvas with side padding.
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
     const titleY = topPadding;

     // NOTE: Returning a layout object avoids recalculating these same positions in multiple files.
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
     miniGameCtx.strokeStyle = colors.outlineStrong;
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
     miniGameCtx.strokeStyle = colors.outlineStrong;
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
     miniGameCtx.font = `700 ${layout.menu.arrowFontSize}px ${fonts.body}`;
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
     miniGameCtx.strokeStyle = colors.outlineStrong;
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

     miniGameCtx.fillStyle = isPressed ? colors.controlFill : colors.controlFill;
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
     const { starGap, levelGapAbove, levelGapBelow, statusLabelFontSize, scoreDetailFontSize } = sizes;
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
     miniGameCtx.font = `400 ${scoreDetailFontSize}px ${fonts.body}`;
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
     const {
          heartGap,
          statusGapAbove,
          statusGapBelow,
          statusLabelFontSize,
          statusDetailFontSize
     } = sizes;
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
          miniGameCtx.font = `400 ${statusDetailFontSize}px ${fonts.body}`;
          const statusTimeWidth = statusTimeText
               ? miniGameCtx.measureText(statusTimeText).width
               : 0;
          const iconFontSize = sizes.uiFontMd * statusIconScale;
          const iconX = miniGameWidth - sizes.healthX - statusTimeWidth;

          miniGameCtx.fillText(statusTimeText, miniGameWidth - sizes.healthX, statusDetailY);

          miniGameCtx.font = `400 ${iconFontSize}px ${fonts.body}`;
          miniGameCtx.fillText(statusIcon, iconX, statusDetailY - ((iconFontSize - sizes.uiFontMd) * 0.35));
     } else {
          miniGameCtx.font = `400 ${statusDetailFontSize}px ${fonts.body}`;
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

     // NOTE:
     // Radial gradient gives a "visible around player, hidden elsewhere" fog effect.
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
