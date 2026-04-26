// NOTE: 9 - UI
// Shared HUD, menus, overlays, menu layout, and screen rendering for Sparkle Seeker.
//
// Owned here:
// - full canvas draw entry
// - HUD drawing
// - welcome / paused / win / lose overlays
// - tips / options menus
// - menu layout + shared UI bounds
// - touch pause button bounds/state
// - shared visual/theme helpers
//
// NOT owned here:
// - main game loop / startup flow
// - player movement input plumbing
// - raw shared runtime state storage
// - progression rule ownership
//
// Newbie note:
// - This file should answer "what does the player see?" and
//   "where are the current UI hitboxes?"
// - If code answers "what happens next?", it belongs in `2_GameEngine.js`.
// - If code only stores shared mutable data, it belongs in `3_Vars.js`.
// - If code changes win thresholds or help copy, it belongs in `5_WinRulesConditions.js`.

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
     gameStarted,
     gamePaused,
     gameMenuOpen,
     gameMenuView,
     gameOver,
     gameWon,
     gameOverlayText,
     gameOverlaySubtext,
     gameMenuUi,
     musicLevel,
     soundEffectsLevel,
     harmfulLevel,
     screenActionUi,
     pausedActionUi,
     welcomeSelectionIndex,
     pausedSelectionIndex,
     tipsSelectionIndex,
     optionsSelection,
     isEffectActive
} from "./3_Vars.js";

import {
     pauseButtonMarginTop
} from "./4_Config.js";

import {
     drawPlayer,
     drawPlayerTrail
} from "./7_Player.js";

import {
     drawSparkles,
     drawEffectPickups,
     drawCollisionBursts
} from "./8_Particles.js";

import {
     getCurrentLevelProgressStars,
     getCurrentLevelNumber,
     getCurrentScreenActionTexts,
     getCurrentPausedActionTexts,
     getHowToPlayLines,
     getHelpfulEffectLines,
     getHarmfulEffectLines
} from "./5_WinRulesConditions.js";

import {
     isScreenWelcomeActive,
     isOverlayScreenActive,
     getCurrentScreenTitleLines,
     getGameWelcomeAlpha,
     getHarmfulToggleLabel,
     getMusicToggleLabel,
     getSoundEffectsToggleLabel,
     getGameOverlayAlpha
} from "./2_GameEngine.js";

const siteTheme = window.SiteTheme;

// ==================================================
// CSS / THEME HELPERS
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
// NOTE: ⭐️ GET UI THEME
// ==================================================

export function getUiTheme() {
     const fontColor = getCssColor("--color-text", "#ffffff");
     const uiFontMarquee = getCssPixelSize("--font-size-marquee", 80);
     const uiFontLg = getCssPixelSize("--font-size-lg", 20);
     const uiFontMd = getCssPixelSize("--font-size-md", 15);
     const uiFontSm = getCssPixelSize("--font-size-sm", 10);

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

          starSize: uiFontLg,
          heartSize: uiFontLg,
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
          buttonFontSize: uiFontMd,
          optionLabelFontSize: uiFontMd,

          detailFontSize: uiFontMd,
          detailLineHeight: uiFontMd,
          detailSectionGap: uiFontLg,
          detailIconGutterWidth: uiFontLg * 2
     };

     const sharedScreenButtons = {
          buttonPaddingX: 10,
          buttonPaddingY: 10,
          buttonTextSize: uiFontMd,
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
// ==================================================

let welcomeColorEngine = null;
let welcomePreviousColors = [];
let welcomeCurrentColors = [];
let welcomeLastColorCycleTime = 0;

let tipsTitleColorEngine = null;
let tipsTitlePreviousColors = [];
let tipsTitleCurrentColors = [];
let tipsTitleLastColorCycleTime = 0;

function getRainbowPalette() {
     return [
          getCssColor("--rainbow-red"),
          getCssColor("--rainbow-orange"),
          getCssColor("--rainbow-yellow"),
          getCssColor("--rainbow-lime"),
          getCssColor("--rainbow-green"),
          getCssColor("--rainbow-mint"),
          getCssColor("--rainbow-cyan"),
          getCssColor("--rainbow-sky"),
          getCssColor("--rainbow-blue"),
          getCssColor("--rainbow-violet"),
          getCssColor("--rainbow-magenta"),
          getCssColor("--rainbow-rose")
     ].filter(Boolean);
}

function ensureWelcomeColorEngine() {
     if (welcomeColorEngine || !siteTheme?.createColorEngine) {
          return;
     }

     welcomeColorEngine = siteTheme.createColorEngine(getRainbowPalette);
}

function ensureTipsTitleColorEngine() {
     if (tipsTitleColorEngine || !siteTheme?.createColorEngine) {
          return;
     }

     tipsTitleColorEngine = siteTheme.createColorEngine(getRainbowPalette);
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

// ==================================================
// UI BOUNDS / STATE SYNC
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

function updateMenuUiBounds() {
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

function updatePauseButtonBounds() {
     const button = touchControls.pauseButton;

     button.x = (miniGameWidth - button.width) / 2;
     button.y = pauseButtonMarginTop;
}

export function syncUiBounds() {
     updatePauseButtonBounds();
     updateMenuUiBounds();
}

export function updatePauseButtonState() {
     if (gameMenuOpen || gameOver || gameWon) {
          touchControls.pauseButton.isPressed = false;
          touchControls.pauseButton.pointerId = null;
     }
}

export function updateScreenTitleColorState() {
     if (!isScreenWelcomeActive() && !isOverlayScreenActive()) {
          return;
     }

     updateWelcomeTitleColors(getCurrentScreenTitleLines());
}

// ==================================================
// SHARED DRAW HELPERS
// ==================================================

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
     if (!miniGameCtx) {
          return;
     }

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

export function drawMenuButton(button, label, theme, isFocused = false) {
     if (!miniGameCtx || !button) {
          return;
     }

     const { colors, sizes, fonts, glow, layout } = theme;
     const centerX = button.x + (button.width / 2);
     const centerY = button.y + (button.height / 2);

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.controlFill;
     miniGameCtx.strokeStyle = isFocused ? colors.fontColor : colors.outlineStrong;
     miniGameCtx.lineWidth = isFocused ? 5 : 3;
     miniGameCtx.shadowColor = isFocused ? colors.fontColor : colors.controlGlow;
     miniGameCtx.shadowBlur = isFocused ? glow.uiStrongGlow : glow.uiSoftGlow;

     drawRoundedRect(button.x, button.y, button.width, button.height, sizes.controlRadius);
     miniGameCtx.fill();
     miniGameCtx.stroke();

     miniGameCtx.fillStyle = colors.controlText;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = isFocused ? colors.fontColor : colors.controlGlow;
     miniGameCtx.shadowBlur = isFocused ? glow.uiStrongGlow : glow.uiSoftGlow;
     miniGameCtx.font = `400 ${layout.menu.buttonFontSize}px ${fonts.body}`;
     miniGameCtx.fillText(label, centerX, centerY + 1);

     miniGameCtx.restore();
}

export function drawMenuBackButton(button, theme, isFocused = false) {
     if (!miniGameCtx || !button) {
          return;
     }

     const { colors, glow, fonts, layout } = theme;
     const centerX = button.x + (button.width / 2);
     const centerY = button.y + (button.height / 2);
     const radius = Math.min(button.width, button.height) * 0.5;

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.controlFill;
     miniGameCtx.strokeStyle = isFocused ? colors.fontColor : colors.outlineStrong;
     miniGameCtx.lineWidth = isFocused ? 5 : 3;
     miniGameCtx.shadowColor = isFocused ? colors.fontColor : colors.controlGlow;
     miniGameCtx.shadowBlur = isFocused ? glow.uiStrongGlow : glow.uiSoftGlow;

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

export function drawOptionStepper(
     row,
     decreaseButton,
     increaseButton,
     label,
     value,
     levelIndex,
     theme,
     isRowFocused = false,
     focusedSide = -1
) {
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
     miniGameCtx.strokeStyle = isRowFocused ? colors.fontColor : colors.outlineStrong;
     miniGameCtx.lineWidth = isRowFocused ? 5 : 3;
     miniGameCtx.shadowColor = isRowFocused ? colors.fontColor : colors.controlGlow;
     miniGameCtx.shadowBlur = isRowFocused ? glow.uiStrongGlow : glow.uiSoftGlow;

     drawRoundedRect(row.x, row.y, row.width, row.height, sizes.controlRadius);
     miniGameCtx.fill();
     miniGameCtx.stroke();

     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";

     miniGameCtx.fillStyle = focusedSide === 0 ? colors.fontColor : colors.controlText;
     miniGameCtx.globalAlpha = decreaseAlpha;
     miniGameCtx.shadowColor = focusedSide === 0 ? colors.fontColor : colors.controlGlow;
     miniGameCtx.shadowBlur = focusedSide === 0 ? glow.uiStrongGlow : glow.uiSoftGlow;
     miniGameCtx.font = arrowFont;
     miniGameCtx.fillText("<", decreaseButton.x + (decreaseButton.width / 2), centerY + 1);

     miniGameCtx.globalAlpha = 1;
     miniGameCtx.fillStyle = isRowFocused ? colors.fontColor : colors.controlText;
     miniGameCtx.shadowColor = isRowFocused ? colors.fontColor : colors.controlGlow;
     miniGameCtx.shadowBlur = isRowFocused ? glow.uiStrongGlow : glow.uiSoftGlow;
     miniGameCtx.font = `400 ${layout.menu.optionLabelFontSize}px ${fonts.body}`;
     miniGameCtx.fillText(`${label}: ${value}`, row.x + (row.width / 2), centerY + 1);

     miniGameCtx.fillStyle = focusedSide === 1 ? colors.fontColor : colors.controlText;
     miniGameCtx.globalAlpha = increaseAlpha;
     miniGameCtx.shadowColor = focusedSide === 1 ? colors.fontColor : colors.controlGlow;
     miniGameCtx.shadowBlur = focusedSide === 1 ? glow.uiStrongGlow : glow.uiSoftGlow;
     miniGameCtx.font = arrowFont;
     miniGameCtx.fillText(">", increaseButton.x + (increaseButton.width / 2), centerY + 1);

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

     miniGameCtx.fillStyle = colors.controlFill;
     miniGameCtx.fill();

     miniGameCtx.lineWidth = 2;
     miniGameCtx.strokeStyle = colors.outlineStrong;
     miniGameCtx.stroke();

     miniGameCtx.restore();
}

// ==================================================
// NOTE: ICON TEXT HELPERS
// ==================================================

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
     const iconBaseSize = options.iconBaseSize || options.fontSize || 10;
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

// ==================================================
// NOTE: BACKGROUND / HUD / TOUCH
// ==================================================

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
     miniGameCtx.font = `${statusLabelFontSize}px ${fonts.marquee}`;
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

     miniGameCtx.font = `${statusLabelFontSize}px ${fonts.marquee}`;
     miniGameCtx.fillText(statusLabel, miniGameWidth - sizes.healthX, statusLabelY);

     const statusDetailY = statusLabelY + statusLabelFontSize + statusGapBelow;

     if (statusIcon) {
          const statusTimeText = statusSeconds ? ` ${statusSeconds}` : "";
          miniGameCtx.font = `400 ${statusDetailFontSize}px ${fonts.body}`;
          const statusTimeWidth = statusTimeText ? miniGameCtx.measureText(statusTimeText).width : 0;
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
     const button = touchControls.pauseButton;

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
}

// ==================================================
// NOTE: MENU / OVERLAY SCREENS
// ==================================================

function drawTipsMenuScreen(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors } = theme;
     const layout = getMenuScreenLayout(theme);
     const focusedIndex = tipsSelectionIndex;

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.menuScreenFill;
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

     drawMenuScreenTitle("TIPS", theme, layout.titleCenterX, layout.titleY);
     drawMenuButton(gameMenuUi.tipsHowToPlayButton, "How to Play", theme, focusedIndex === 0);
     drawMenuButton(gameMenuUi.tipsHelpEffectsButton, "Friends", theme, focusedIndex === 1);
     drawMenuButton(gameMenuUi.tipsHarmEffectsButton, "Enemies", theme, focusedIndex === 2);
     drawMenuBackButton(gameMenuUi.backButton, theme, focusedIndex === 3);

     miniGameCtx.restore();
}

function drawTipsDetailScreen(theme, title, lines) {
     if (!miniGameCtx) {
          return;
     }

     const { colors, fonts, sizes, layout } = theme;
     const menu = layout.menu;
     const screenLayout = getMenuScreenLayout(theme);

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.menuScreenFill;
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

     drawMenuScreenTitle(title, theme, screenLayout.titleCenterX, screenLayout.titleY);

     let textY = screenLayout.contentTopY;
     const fontSize = menu.detailFontSize;
     const lineHeight = menu.detailLineHeight;
     const sectionGap = menu.detailSectionGap;

     const hasIconGutter = lines.some((line) => line.includes("{icon"));
     const iconGutterWidth = hasIconGutter ? menu.detailIconGutterWidth : 0;
     const iconX = screenLayout.sidePadding + (iconGutterWidth * 0.25);
     const detailTextX = screenLayout.sidePadding + iconGutterWidth;
     const detailTextWidth = miniGameWidth - detailTextX - screenLayout.sidePadding;

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

     drawMenuBackButton(gameMenuUi.backButton, theme, true);
     miniGameCtx.restore();
}

function drawOptionsScreen(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors } = theme;
     const layout = getMenuScreenLayout(theme);
     const focused = optionsSelection;

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.menuScreenFill;
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

     drawMenuScreenTitle("OPTIONS", theme, layout.titleCenterX, layout.titleY);

     drawOptionStepper(
          gameMenuUi.harmfulRow,
          gameMenuUi.harmfulDecreaseButton,
          gameMenuUi.harmfulIncreaseButton,
          "Difficulty",
          getHarmfulToggleLabel(),
          harmfulLevel,
          theme,
          focused.row === 0,
          focused.row === 0 ? focused.col : -1
     );

     drawOptionStepper(
          gameMenuUi.musicRow,
          gameMenuUi.musicDecreaseButton,
          gameMenuUi.musicIncreaseButton,
          "Music",
          getMusicToggleLabel(),
          musicLevel,
          theme,
          focused.row === 1,
          focused.row === 1 ? focused.col : -1
     );

     drawOptionStepper(
          gameMenuUi.soundEffectsRow,
          gameMenuUi.soundEffectsDecreaseButton,
          gameMenuUi.soundEffectsIncreaseButton,
          "Sound FX",
          getSoundEffectsToggleLabel(),
          soundEffectsLevel,
          theme,
          focused.row === 2,
          focused.row === 2 ? focused.col : -1
     );

     drawMenuBackButton(gameMenuUi.backButton, theme, focused.row === 3);
     miniGameCtx.restore();
}

function drawGameWelcomeOverlay(theme) {
     if (!miniGameCtx || (!isScreenWelcomeActive() && !isOverlayScreenActive())) {
          return;
     }

     const { colors, fonts, glow, screens } = theme;
     const isWelcomeScreen = isScreenWelcomeActive();
     const screenConfig = isWelcomeScreen ? screens.welcome : screens.result;
     const alpha = getGameWelcomeAlpha();
     const titleLines = getCurrentScreenTitleLines();
     const actionTexts = getCurrentScreenActionTexts();
     const titleFontSize = getWelcomeMarqueeFontSize(theme, titleLines);
     const welcomeSelection = welcomeSelectionIndex;

     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;
     miniGameCtx.font = `400 ${screenConfig.buttonTextSize}px ${fonts.body}`;

     const measuredActions = actionTexts.map((text) => ({
          text,
          textWidth: miniGameCtx.measureText(text).width
     }));

     const actionGap = Math.max(
          screenConfig.buttonGapMin,
          titleFontSize * screenConfig.buttonGapTitleScale
     );
     const tallestButtonHeight = screenConfig.buttonTextSize + (screenConfig.buttonPaddingY * 2);

     const totalTitleBlockHeight =
          titleFontSize +
          screenConfig.titleStackGap +
          titleFontSize +
          screenConfig.titleStackGap +
          tallestButtonHeight;

     const stackTopY =
          ((miniGameHeight - totalTitleBlockHeight) / 2) + screenConfig.titleBlockYOffset;

     const firstLineY = stackTopY + (titleFontSize / 2);
     const secondLineY = firstLineY + titleFontSize + screenConfig.titleStackGap;
     const actionY =
          secondLineY +
          (titleFontSize / 2) +
          screenConfig.titleStackGap +
          (tallestButtonHeight / 2);

     updateWelcomeTitleColors(titleLines);
     const colorsForWelcomeTitle = getWelcomeCurrentColors();

     miniGameCtx.save();
     miniGameCtx.globalAlpha = alpha;

     if (!isWelcomeScreen) {
          miniGameCtx.fillStyle = screenConfig.overlayFill;
          miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);
     }

     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.font = `${titleFontSize}px ${fonts.marquee}`;

     titleLines.forEach((line, lineIndex) => {
          const y = lineIndex === 0 ? firstLineY : secondLineY;
          const colorsForLine = colorsForWelcomeTitle[lineIndex] || [];
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

     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.controlGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;
     miniGameCtx.font = `400 ${screenConfig.buttonTextSize}px ${fonts.body}`;

     const totalActionWidth =
          measuredActions.reduce((sum, item) => sum + item.textWidth + (screenConfig.buttonPaddingX * 2), 0) +
          (actionGap * Math.max(0, measuredActions.length - 1));

     let currentX = (miniGameWidth - totalActionWidth) / 2;

     measuredActions.forEach((item) => {
          const buttonWidth = item.textWidth + (screenConfig.buttonPaddingX * 2);
          const buttonHeight = screenConfig.buttonTextSize + (screenConfig.buttonPaddingY * 2);
          const buttonX = currentX;
          const buttonY = actionY - (buttonHeight / 2);
          const textX = buttonX + (buttonWidth / 2);

          const isFocused =
               (!isOverlayScreenActive() && (
                    (item.text === "NEW GAME" && welcomeSelection === 0) ||
                    (item.text === "TIPS" && welcomeSelection === 1) ||
                    (item.text === "OPTIONS" && welcomeSelection === 2)
               )) ||
               (isOverlayScreenActive() && item.text === "NEW GAME");

          miniGameCtx.save();
          miniGameCtx.fillStyle = colors.controlFill;
          miniGameCtx.strokeStyle = isFocused ? colors.fontColor : colors.outlineStrong;
          miniGameCtx.lineWidth = isFocused ? 5 : 3;
          miniGameCtx.shadowColor = isFocused ? colors.fontColor : colors.controlGlow;
          miniGameCtx.shadowBlur = isFocused ? glow.uiStrongGlow : glow.uiSoftGlow;

          drawRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, theme.sizes.controlRadius);
          miniGameCtx.fill();
          miniGameCtx.stroke();

          miniGameCtx.fillStyle = colors.controlText;
          miniGameCtx.textAlign = "center";
          miniGameCtx.textBaseline = "middle";
          miniGameCtx.font = `400 ${screenConfig.buttonTextSize}px ${fonts.body}`;
          miniGameCtx.fillText(item.text, textX, actionY + 1);
          miniGameCtx.restore();

          if (item.text === "NEW GAME") {
               screenActionUi.startButton.x = buttonX;
               screenActionUi.startButton.y = buttonY;
               screenActionUi.startButton.width = buttonWidth;
               screenActionUi.startButton.height = buttonHeight;
          }

          if (item.text === "TIPS") {
               screenActionUi.tipsButton.x = buttonX;
               screenActionUi.tipsButton.y = buttonY;
               screenActionUi.tipsButton.width = buttonWidth;
               screenActionUi.tipsButton.height = buttonHeight;
          }

          if (item.text === "OPTIONS") {
               screenActionUi.menuButton.x = buttonX;
               screenActionUi.menuButton.y = buttonY;
               screenActionUi.menuButton.width = buttonWidth;
               screenActionUi.menuButton.height = buttonHeight;
          }

          currentX += buttonWidth + actionGap;
     });

     miniGameCtx.restore();
}

function drawPausedOverlay(theme) {
     if (!miniGameCtx || !gamePaused || gameMenuOpen || gameOver || gameWon) {
          return;
     }

     const { colors, fonts, glow, screens } = theme;
     const paused = screens.paused;
     const titleLines = ["PAUSED"];
     const actionTexts = getCurrentPausedActionTexts();
     const pausedSelection = pausedSelectionIndex;
     const titleFontSize = Math.max(
          paused.titleFontSizeMin,
          Math.min(
               miniGameWidth * paused.titleFontSizeWidthScale,
               miniGameHeight * paused.titleFontSizeHeightScale
          )
     );
     const titleY = miniGameHeight * paused.titleYRatio;
     const actionGap = Math.max(paused.buttonGapMin, titleFontSize * paused.buttonGapTitleScale);
     const actionY =
          titleY +
          Math.max(paused.buttonYOffsetMin, titleFontSize * paused.buttonYOffsetTitleScale);

     updateWelcomeTitleColors(titleLines);
     const colorsForPausedTitle = getWelcomeCurrentColors();

     miniGameCtx.save();
     miniGameCtx.fillStyle = paused.overlayFill;
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

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

     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.font = `${titleFontSize}px ${fonts.marquee}`;

     titleLines.forEach((line, lineIndex) => {
          const y = titleY + (lineIndex * titleFontSize);
          const colorsForLine = colorsForPausedTitle[lineIndex] || [];
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

     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.shadowColor = colors.overlayGlow;
     miniGameCtx.shadowBlur = glow.uiSoftGlow;
     miniGameCtx.font = `400 ${paused.buttonTextSize}px ${fonts.body}`;

     const measuredActions = actionTexts.map((text) => ({
          text,
          textWidth: miniGameCtx.measureText(text).width
     }));

     const totalActionWidth =
          measuredActions.reduce((sum, item) => sum + item.textWidth + (paused.buttonPaddingX * 2), 0) +
          (actionGap * Math.max(0, measuredActions.length - 1));

     let currentX = (miniGameWidth - totalActionWidth) / 2;

     measuredActions.forEach((item) => {
          const buttonWidth = item.textWidth + (paused.buttonPaddingX * 2);
          const buttonHeight = paused.buttonTextSize + (paused.buttonPaddingY * 2);
          const buttonX = currentX;
          const buttonY = actionY - (buttonHeight / 2);
          const textX = buttonX + (buttonWidth / 2);

          const isFocused =
               (item.text === "RESUME" && pausedSelection === 0) ||
               (item.text === "TIPS" && pausedSelection === 1) ||
               (item.text === "OPTIONS" && pausedSelection === 2);

          miniGameCtx.save();
          miniGameCtx.fillStyle = colors.controlFill;
          miniGameCtx.strokeStyle = isFocused ? colors.fontColor : paused.buttonStroke;
          miniGameCtx.lineWidth = isFocused ? 5 : 2;
          miniGameCtx.shadowColor = isFocused ? colors.fontColor : colors.controlGlow;
          miniGameCtx.shadowBlur = isFocused ? glow.uiStrongGlow : glow.uiSoftGlow;

          drawRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, theme.sizes.controlRadius);
          miniGameCtx.fill();
          miniGameCtx.stroke();

          miniGameCtx.fillStyle = colors.controlText;
          miniGameCtx.textAlign = "center";
          miniGameCtx.textBaseline = "middle";
          miniGameCtx.font = `400 ${paused.buttonTextSize}px ${fonts.body}`;
          miniGameCtx.fillText(item.text, textX, actionY);
          miniGameCtx.restore();

          if (item.text === "RESUME") {
               pausedActionUi.resumeButton.x = buttonX;
               pausedActionUi.resumeButton.y = buttonY;
               pausedActionUi.resumeButton.width = buttonWidth;
               pausedActionUi.resumeButton.height = buttonHeight;
          }

          if (item.text === "TIPS") {
               pausedActionUi.tipsButton.x = buttonX;
               pausedActionUi.tipsButton.y = buttonY;
               pausedActionUi.tipsButton.width = buttonWidth;
               pausedActionUi.tipsButton.height = buttonHeight;
          }

          if (item.text === "OPTIONS") {
               pausedActionUi.menuButton.x = buttonX;
               pausedActionUi.menuButton.y = buttonY;
               pausedActionUi.menuButton.width = buttonWidth;
               pausedActionUi.menuButton.height = buttonHeight;
          }

          currentX += buttonWidth + actionGap;
     });

     miniGameCtx.restore();
}

function drawGameStatusOverlay(theme) {
     if (!miniGameCtx || !gameOverlayText || gameMenuOpen) {
          return;
     }

     const { colors, sizes, fonts, glow, screens } = theme;
     const overlay = screens.statusOverlay;
     const alpha = getGameOverlayAlpha();
     const titleY = miniGameHeight / 2;
     const subtextOffset = overlay.subtextOffset;
     const hasSubtext = Boolean(gameOverlaySubtext);

     miniGameCtx.save();
     miniGameCtx.globalAlpha = alpha;

     miniGameCtx.fillStyle = colors.controlFill;
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";

     miniGameCtx.font = `${sizes.uiFontMd}px ${fonts.marquee}`;
     const titleWidth = miniGameCtx.measureText(gameOverlayText).width;

     let subWidth = 0;
     if (hasSubtext) {
          miniGameCtx.font = `400 ${sizes.uiFontMd}px ${fonts.body}`;
          subWidth = miniGameCtx.measureText(gameOverlaySubtext).width;
     }

     const horizontalPadding = overlay.horizontalPadding;
     const topPadding = overlay.topPadding;
     const bottomPadding = hasSubtext
          ? overlay.bottomPaddingWithSubtext
          : overlay.bottomPaddingNoSubtext;
     const gapBetweenLines = hasSubtext ? overlay.gapBetweenLines : 0;

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
     miniGameCtx.font = `${sizes.uiFontMd}px ${fonts.marquee}`;
     miniGameCtx.fillText(gameOverlayText, miniGameWidth / 2, titleY);

     if (hasSubtext) {
          miniGameCtx.shadowBlur = glow.uiSoftGlow;
          miniGameCtx.font = `400 ${sizes.uiFontMd}px ${fonts.body}`;
          miniGameCtx.fillText(gameOverlaySubtext, miniGameWidth / 2, titleY + subtextOffset);
     }

     miniGameCtx.restore();
}

// ==================================================
// MASTER DRAW ENTRY
// ==================================================

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
