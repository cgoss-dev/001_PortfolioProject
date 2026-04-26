// NOTE: 5 - WIN RULES CONDITIONS
// Score thresholds, progression rules, win-goal helpers,
// and shared progression/help copy used by the UI.
//
// Owned here:
// - level rules
// - win score / progression constants
// - overlay timing constants tied to game feel
// - win-goal and title helpers
// - shared screen copy for welcome / paused / help screens
// - helpers for current level / star progress
//
// NOT owned here:
// - screen state
// - menu layout
// - rendering
// - general UI flow
//
// Newbie note:
// - If code answers "how far through the run is the player?",
//   "what is the goal?", or "what text explains that goal?",
//   it belongs here.

import {
     sparkleScore
} from "./3_Vars.js";

// ==================================================
// NOTE: LEVEL PARAMETERS
// `scoreMin` is inclusive. Stars show progress inside the current level.
// ==================================================

export const winScore = 999;
export const startOverlayDuration = 120;
export const overlayFadeFrames = 30;

const levelRules = [
     { levelNumber: 1, scoreMin: 0, starsFilled: 0 },
     { levelNumber: 1, scoreMin: 40, starsFilled: 1 },
     { levelNumber: 1, scoreMin: 80, starsFilled: 2 },
     { levelNumber: 1, scoreMin: 120, starsFilled: 3 },
     { levelNumber: 1, scoreMin: 160, starsFilled: 4 },
     { levelNumber: 1, scoreMin: 200, starsFilled: 5 },

     { levelNumber: 2, scoreMin: 240, starsFilled: 1 },
     { levelNumber: 2, scoreMin: 280, starsFilled: 2 },
     { levelNumber: 2, scoreMin: 320, starsFilled: 3 },
     { levelNumber: 2, scoreMin: 360, starsFilled: 4 },
     { levelNumber: 2, scoreMin: 400, starsFilled: 5 },

     { levelNumber: 3, scoreMin: 440, starsFilled: 1 },
     { levelNumber: 3, scoreMin: 480, starsFilled: 2 },
     { levelNumber: 3, scoreMin: 520, starsFilled: 3 },
     { levelNumber: 3, scoreMin: 560, starsFilled: 4 },
     { levelNumber: 3, scoreMin: 600, starsFilled: 5 },

     { levelNumber: 4, scoreMin: 680, starsFilled: 1 },
     { levelNumber: 4, scoreMin: 760, starsFilled: 2 },
     { levelNumber: 4, scoreMin: 840, starsFilled: 3 },
     { levelNumber: 4, scoreMin: 920, starsFilled: 4 },
     { levelNumber: 4, scoreMin: winScore, starsFilled: 5 }
];

// ==================================================
// NOTE: WELCOME / BUTTON TEXT
// ==================================================

const welcomeTitleLines = ["SPARKLE", "SEEKER"];
const screenActionTexts = ["NEW GAME", "TIPS", "OPTIONS"];
const pausedActionTexts = ["RESUME", "TIPS", "OPTIONS"];

export function getWelcomeTitleLines() {
     return welcomeTitleLines;
}

export function getWinGoalText() {
     return `Reach ${winScore} sparkles to win.`;
}

export function getWinTitleLines() {
     return ["YOU", "WIN"];
}

export function getLoseTitleLines() {
     return ["TRY", "AGAIN"];
}

export function getScreenTitleLinesForMode(gameScreenMode) {
     if (gameScreenMode === "screenYouWin") {
          return getWinTitleLines();
     }

     if (gameScreenMode === "screenTryAgain") {
          return getLoseTitleLines();
     }

     return getWelcomeTitleLines();
}

export function getCurrentScreenActionTexts() {
     return screenActionTexts;
}

export function getCurrentPausedActionTexts() {
     return pausedActionTexts;
}

// ==================================================
// NOTE: TIPS TEXT
// ==================================================

export function getHowToPlayLines() {
     return [
          "Collect sparkles to score and heal.",
          "Use arrows/WASD, or click/hold to move.",
          "Stars show progress toward the next level.",
          "Only one timed effect active at a time.",
          getWinGoalText()
     ];
}

export function getHelpfulEffectLines() {
     return [
          "{iconShield} Shield: blocks next hit.",
          "{iconCure} Cure: blocks next status effect.",
          "{iconLuck} Luck: doubles points for a short time.",
          "{iconMagnet} Magnet: pulls sparkles toward you.",
          "{iconSlowmo} Slowmo: slows falling objects."
     ];
}

export function getHarmfulEffectLines() {
     return [
          "{iconFreeze} Freeze: stops player briefly.",
          "{iconSurge} Surge: speeds falling objects.",
          "{iconDaze} Daze: reverses player movement.",
          "{iconGlass} Glass: doubles hit cost.",
          "{iconFog} Fog: limits visible area."
     ];
}

// ==================================================
// LEVEL HELPERS
// ==================================================

export function getCurrentLevelData() {
     let currentLevelData = levelRules[0];

     for (let i = 0; i < levelRules.length; i += 1) {
          if (sparkleScore >= levelRules[i].scoreMin) {
               currentLevelData = levelRules[i];
          } else {
               break;
          }
     }

     return currentLevelData;
}

export function getCurrentLevelProgressStars() {
     return getCurrentLevelData().starsFilled;
}

export function getCurrentLevelNumber() {
     return getCurrentLevelData().levelNumber;
}
