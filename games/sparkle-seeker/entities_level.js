// NOTE: ENTITIES / LEVEL
// Shared level and score progression helpers.
//
// Owned here:
// - level rules
// - win score
// - current level lookup
// - level progress stars
// - current level number

import {
     sparkleScore
} from "./state.js";

// LEVEL RULES
// Score controls the current level here.
// Keeping this in one place makes balancing much easier later.
export const levelRules = [
     { level: 1, minScore: 0, maxScore: 99 },
     { level: 2, minScore: 100, maxScore: 249 },
     { level: 3, minScore: 250, maxScore: 449 },
     { level: 4, minScore: 450, maxScore: 699 },
     { level: 5, minScore: 700, maxScore: 999 }
];


// WIN SCORE: 999+ ends the run in a win state.
export const winScore = 999;

// NOTE: LEVEL LOOKUP
// This helper reads the current score and returns the matching level rule.
export function getCurrentLevelData() {
     for (let i = 0; i < levelRules.length; i += 1) {
          const rule = levelRules[i];

          if (sparkleScore >= rule.minScore && sparkleScore <= rule.maxScore) {
               return rule;
          }
     }

     // Anything at or above win score is treated like the final level band.
     // This keeps the function safe even if it gets called right before win cleanup happens.
     return {
          level: 5,
          minScore: 700,
          maxScore: winScore - 1
     };
}

// NOTE: LEVEL PROGRESS
// Stars represent progress through the current level, not the current level number.
export function getCurrentLevelProgressStars() {
     const levelData = getCurrentLevelData();
     const levelScoreRange = levelData.maxScore - levelData.minScore + 1;
     const scoreIntoLevel = sparkleScore - levelData.minScore + 1;
     const progressRatio = Math.max(0, Math.min(1, scoreIntoLevel / levelScoreRange));

     return Math.max(0, Math.min(5, Math.ceil(progressRatio * 5)));
}

// NOTE: LEVEL NUMBER
// Handy if you want to draw "LVL 3" in the HUD later.
export function getCurrentLevelNumber() {
     return getCurrentLevelData().level;
}
