// NOTE: UI CONFIG
// Shared visual configuration for Sparkle Seeker canvas UI.
//
// Owned here:
// - CSS/theme readers
// - UI theme creation
// - shared sizing/layout rules
// - title color animation state
// - marquee/title sizing helpers
// - reusable menu title layout/drawing
//
// NOT owned here:
// - screen state / menu hitbox storage
// - screen-specific rendering flow
// - reusable button/HUD drawing components
//
// Newbie note:
// - This file answers "what should the UI look like?" and
//   "how big should shared UI pieces be?"
// - If code draws reusable buttons/panels/HUD pieces, it belongs in `ui_components.js`.
// - If code decides which screen is active, it belongs in `ui_mode.js`.

import {
     miniGameCtx,
     miniGameWidth,
     miniGameHeight
} from "./state.js";

import {
     getCurrentScreenTitleLines
} from "./ui_mode.js";

const siteTheme = window.SiteTheme;

// ==================================================
// CSS HELPERS
// These helpers read CSS custom properties so canvas JS can follow the site design.
// ==================================================

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

     // Canvas text APIs need real pixel sizes.
     // CSS variables may contain rem/vw/clamp values, so we let the browser resolve them.
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

// ==================================================
// UI THEME
// Main shared tuning panel for canvas UI values.
// ==================================================

export function getUiTheme() {
     const fontColor = getCssColor("--color-text", "#ffffff");
     const uiFontMarquee = getCssPixelSize("--font-size-marquee", 80);
     const uiFontLg = getCssPixelSize("--font-size-lg");
     const uiFontMd = getCssPixelSize("--font-size-md");
     const uiFontSm = getCssPixelSize("--font-size-sm");

     const menuOverlayFill = "rgba(0, 0, 0, 0.9)";

     const base = {
          uiFontMarquee,
          uiFontLg,
          uiFontMd,
          uiFontSm,
          controlRadius: getCssNumber("--panel-radius", 15)
     };

     const hud = {
          statusLabelFontSize: uiFontLg * 1.5,
          scoreDetailFontSize: uiFontLg,
          statusDetailFontSize: uiFontLg,

          starSize: uiFontLg * 1.5,
          heartSize: uiFontLg * 1.5,
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

     const menu = {
          sidePadding: uiFontLg,
          topPadding: uiFontLg,

          titleFontSize: uiFontLg * 2,
          titleLetterSpacing: uiFontSm / 4,
          titleGapBelow: uiFontLg,

          contentRowGap: uiFontMd,
          contentBottomPadding: uiFontSm,

          backButtonSize: 50,
          backButtonBottomOffset: 0,
          arrowFontSize: uiFontLg * 2,

          buttonHeight: uiFontLg * 2,
          buttonFontSize: uiFontLg,
          optionLabelFontSize: uiFontLg,

          detailFontSize: uiFontMd,
          detailLineHeight: uiFontLg,
          detailSectionGap: uiFontLg,
          detailIconGutterWidth: uiFontLg * 2
     };

     const sharedScreenButtons = {
          buttonPaddingX: 10,
          buttonPaddingY: 10,
          buttonTextSize: uiFontLg,
          buttonGapMin: uiFontMd,
          buttonGapTitleScale: 0.25
     };

     const sharedScreenTitle = {
          titleBaseSize: uiFontMarquee,
          titleMinSize: Math.max(25, uiFontMarquee * 0.35),
          titleShrinkStep: 2,
          titleSidePadding: 25
     };

     return {
          fonts: {
               display: getCssString("--font-marquee", getCssString("--font-display", "\"Bungee Shade\", cursive")),
               marquee: getCssString("--font-marquee", getCssString("--font-display", "\"Bungee Shade\", cursive")),
               body: getCssString("--font-body", "\"Noto Sans Mono\", monospace"),
               symbol: "\"Segoe UI Symbol\", \"Apple Color Emoji\", \"Noto Color Emoji\", sans-serif"
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

          screens: {
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
                    buttonYOffsetMin: 25,
                    buttonYOffsetTitleScale: 1,
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
          },

          glow: {
               uiSoftGlow: getCssNumber("--glow-particle-bg-blur", 10),
               uiMediumGlow: getCssNumber("--glow-particle-game-blur", 16),
               uiStrongGlow: getCssNumber("--glow-particle-game-blur", 16) * 1.35
          }
     };
}

// ==================================================
// TITLE COLOR / TITLE SIZE HELPERS
// Reused by welcome/result/menu titles.
// ==================================================

let welcomeColorEngine = null;
let welcomePreviousColors = [];
let welcomeCurrentColors = [];
let welcomeLastColorCycleTime = 0;

let tipsTitleColorEngine = null;
let tipsTitlePreviousColors = [];
let tipsTitleCurrentColors = [];
let tipsTitleLastColorCycleTime = 0;

function ensureWelcomeColorEngine() {
     if (welcomeColorEngine || !siteTheme?.createColorEngine || !siteTheme?.getRainbowPalette) {
          return;
     }

     welcomeColorEngine = siteTheme.createColorEngine(siteTheme.getRainbowPalette);
}

function ensureTipsTitleColorEngine() {
     if (tipsTitleColorEngine || !siteTheme?.createColorEngine || !siteTheme?.getRainbowPalette) {
          return;
     }

     tipsTitleColorEngine = siteTheme.createColorEngine(siteTheme.getRainbowPalette);
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
          const fallbackColor = getCssColor("--color-rainbow", "#ffffff");
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

export function updateTipsTitleColors(title) {
     ensureTipsTitleColorEngine();

     const rainbowCycleSpeed = siteTheme?.getTextSettings?.().rainbowCycleSpeed ?? 900;
     const now = performance.now();

     if (tipsTitleCurrentColors.length && (now - tipsTitleLastColorCycleTime) < rainbowCycleSpeed) {
          return;
     }

     if (!tipsTitleColorEngine?.nextCycleForText) {
          tipsTitleCurrentColors = Array(title.length).fill(getCssColor("--color-rainbow", "#ffffff"));
     } else {
          tipsTitleCurrentColors = tipsTitleColorEngine.nextCycleForText(title, tipsTitlePreviousColors);
     }

     tipsTitlePreviousColors = [...tipsTitleCurrentColors];
     tipsTitleLastColorCycleTime = now;
}

export function getWelcomeMarqueeFontSize(theme, titleLines = getCurrentScreenTitleLines()) {
     if (!miniGameCtx) {
          return theme.screens.welcome.titleBaseSize;
     }

     const { fonts, screens } = theme;
     const config = screens.welcome;
     const sidePadding = config.titleSidePadding;
     const minSize = config.titleMinSize;
     const shrinkStep = config.titleShrinkStep;
     let fontSize = config.titleBaseSize;

     miniGameCtx.save();

     while (fontSize > minSize) {
          miniGameCtx.font = `${fontSize}px ${fonts.marquee}`;

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

          fontSize -= shrinkStep;
     }

     miniGameCtx.restore();

     return fontSize;
}

// ==================================================
// MENU LAYOUT / MENU TITLE HELPERS
// Shared menu-like screen layout and title drawing.
// ==================================================

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
     if (!miniGameCtx) {
          return;
     }

     const { colors, fonts, glow, layout } = theme;
     const titleFontSize = layout.menu.titleFontSize;
     const letterSpacing = layout.menu.titleLetterSpacing;

     miniGameCtx.save();
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.font = `${titleFontSize}px ${fonts.marquee}`;

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
