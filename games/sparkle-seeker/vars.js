// NOTE: UI VARS
// Central shared UI/theme/settings source for Sparkle Seeker.
//
// Owned here:
// - CSS-backed theme readers
// - text/glow/sparkle settings
// - rainbow/sparkle palettes
// - UI theme assembly
//
// NOT owned here:
// - rendering
// - screen state
// - gameplay update logic
// - reusable draw components

import {
     getCssColor,
     getCssNumber,
     getCssPixelSize,
     getCssString
} from "./ui_config_helpers.js";

export function getTextSettings() {
     return {
          rainbowCycleSpeed: getCssNumber("--text-rainbow-cycle-speed", 900),
          glowCore: getCssString("--glow-core", "0 0 0.05rem"),
          glowSoft: getCssString("--glow-soft", "0 0 0.25rem"),
          glowWide: getCssString("--glow-wide", "0 0 0.75rem")
     };
}

export function getGlowSettings() {
     return {
          bgParticleBlur: getCssNumber("--glow-particle-bg-blur", 12),
          gameParticleBlur: getCssNumber("--glow-particle-game-blur", 16),
          bungeeGlowBlur: getCssString("--glow-bungee-core", "0 0 0 transparent"),
          bungeeShadowOffset1: getCssString("--glow-bungee-shadow-offset-1", "0 0 0 transparent"),
          bungeeShadowOffset2: getCssString("--glow-bungee-shadow-offset-2", "0 0 0 transparent")
     };
}

export function getSparkleSettings() {
     return {
          countMax: getCssNumber("--sparkle-count-max", 180),
          sizeMin: getCssNumber("--sparkle-size-min", 16),
          sizeMax: getCssNumber("--sparkle-size-max", 26),
          speedMin: getCssNumber("--sparkle-speed-min", 0.2),
          speedMax: getCssNumber("--sparkle-speed-max", 0.7),
          density: getCssNumber("--sparkle-density", 0.00015),
          wobbleSpeedMin: getCssNumber("--sparkle-wobble-speed-min", 0.005),
          wobbleSpeedMax: getCssNumber("--sparkle-wobble-speed-max", 0.02),
          wobbleAmountMin: getCssNumber("--sparkle-wobble-amount-min", 5),
          wobbleAmountMax: getCssNumber("--sparkle-wobble-amount-max", 15),
          opacityMin: getCssNumber("--sparkle-opacity-min", 0.2),
          opacityMax: getCssNumber("--sparkle-opacity-max", 1),
          respawnOffsetTop: getCssNumber("--sparkle-respawn-offset-top", -20),
          respawnOffsetBottom: getCssNumber("--sparkle-respawn-offset-bottom", 24)
     };
}

export function getRainbowPalette() {
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

export function getSparklePalette() {
     return ["#ffffff"];
}

export function getUiTheme() {
     const fontColor = getCssColor("--color-text", "#ffffff");
     const uiFontMarquee = getCssPixelSize("--font-size-marquee", 80);
     const uiFontLg = getCssPixelSize("--font-size-lg");
     const uiFontMd = getCssPixelSize("--font-size-md");
     const uiFontSm = getCssPixelSize("--font-size-sm");

     const glowSettings = getGlowSettings();
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
               uiSoftGlow: glowSettings.bgParticleBlur,
               uiMediumGlow: glowSettings.gameParticleBlur,
               uiStrongGlow: glowSettings.gameParticleBlur * 1.35
          }
     };
}
