// NOTE: UI DRAW / RENDERING
// This file owns screen-level canvas rendering and visual orchestration.
//
// Owned here:
// - screen / overlay rendering
// - menu screen rendering
// - master draw entry
//
// NOT owned here:
// - startup / round flow
// - screen state transitions
// - game update loop
// - hitbox state storage
// - shared draw helpers / theme helpers / HUD primitives

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
     gameMenuUi,
     musicLevel,
     soundEffectsLevel,
     harmfulLevel
} from "./state.js";

import {
     drawPlayer,
     drawPlayerTrail
} from "./entities_player.js";

import {
     drawSparkles
} from "./entities_sparkles.js";

import {
     drawEffectPickups,
     drawCollisionBursts
} from "./entities_effects.js";

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
     getGameOverlayAlpha
} from "./ui_mode.js";

import {
     getUiTheme,
     drawRoundedRect,
     drawPanelBox,
     drawWrappedText,
     parseRichTextSegments,
     getRichTextIcon,
     updateWelcomeTitleColors,
     getWelcomeCurrentColors,
     getWelcomeTitleFontSize,
     getMenuScreenLayout,
     drawMenuScreenTitle,
     drawMenuButton,
     drawMenuBackButton,
     drawOptionStepper,
     drawMiniGameBackground,
     drawScore,
     drawHealth,
     drawFogOverlay,
     drawTouchButtons
} from "./ui_draw_shared.js";

// NOTE: MENU SCREENS

function drawTipsMenuScreen(theme) {
     if (!miniGameCtx) {
          return;
     }

     const { colors } = theme;
     const layout = getMenuScreenLayout(theme);

     miniGameCtx.save();
     miniGameCtx.fillStyle = colors.menuScreenFill;
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);

     drawMenuScreenTitle("TIPS", theme, layout.titleCenterX, layout.titleY);
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

     const { colors, fonts, glow, screens } = theme;
     const isWelcomeScreen = isScreenWelcomeActive();
     const screenConfig = isWelcomeScreen ? screens.welcome : screens.result;
     const alpha = getGameWelcomeAlpha();
     const titleLines = getCurrentScreenTitleLines();
     const actionTexts = getCurrentScreenActionTexts();
     const titleFontSize = getWelcomeTitleFontSize(theme, titleLines);

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
     const welcomeCurrentColors = getWelcomeCurrentColors();

     miniGameCtx.save();
     miniGameCtx.globalAlpha = alpha;

     if (!isWelcomeScreen) {
          miniGameCtx.fillStyle = screenConfig.overlayFill;
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

          miniGameCtx.save();
          miniGameCtx.fillStyle = colors.controlFill;
          miniGameCtx.strokeStyle = colors.outlineSoft;
          miniGameCtx.lineWidth = 3;
          miniGameCtx.shadowColor = colors.controlGlow;
          miniGameCtx.shadowBlur = glow.uiSoftGlow;

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

     const { colors, fonts, glow, screens } = theme;
     const paused = screens.paused;
     const titleLines = ["PAUSED"];
     const actionTexts = getCurrentPausedActionTexts();
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
     const welcomeCurrentColors = getWelcomeCurrentColors();

     miniGameCtx.save();

     miniGameCtx.fillStyle = paused.overlayFill;
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

          miniGameCtx.save();
          miniGameCtx.fillStyle = paused.buttonFill;
          miniGameCtx.strokeStyle = paused.buttonStroke;
          miniGameCtx.lineWidth = 2;
          miniGameCtx.shadowColor = colors.controlGlow;
          miniGameCtx.shadowBlur = glow.uiSoftGlow;

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

     const { colors, sizes, fonts, glow, screens } = theme;
     const overlay = screens.statusOverlay;
     const alpha = getGameOverlayAlpha();
     const titleY = miniGameHeight / 2;
     const subtextOffset = overlay.subtextOffset;
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
