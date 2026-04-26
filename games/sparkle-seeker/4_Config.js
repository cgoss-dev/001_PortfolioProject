// NOTE: CONFIG
// Player-facing settings, persistence helpers, and shared tunables for Sparkle Seeker.
//
// Owned here:
// - saved options / localStorage keys
// - option metadata for Music / Sound FX / Difficulty
// - shared tunables that are configuration, not runtime state
// - helpers for loading/saving persistent settings
//
// NOT owned here:
// - mutable runtime state
// - game loop logic
// - menu hitbox math
// - rendering implementation
//
// Newbie note:
// - This file should answer "what settings exist?" and
//   "what reusable numbers should the rest of the game agree on?"
// - If code changes every frame, it belongs in `3_Vars.js` or gameplay files.
// - If code draws UI, it belongs in `9_UI.js`.

import {
     optionLevelLabels,
     optionLevelValues,
     maxOptionLevelIndex,
     defaultOptionLevelIndex,
     musicLevel,
     soundEffectsLevel,
     harmfulLevel,
     setMusicLevel,
     setSoundEffectsLevel,
     setHarmfulLevel
} from "./3_Vars.js";

// ==================================================
// STORAGE
// ==================================================

export const configStorageKeys = {
     options: "sparkle-seeker-options"
};

// ==================================================
// OPTION DEFINITIONS
// ==================================================

export const optionDefinitions = {
     harmful: {
          id: "harmful",
          label: "Difficulty",
          defaultLevel: defaultOptionLevelIndex
     },

     music: {
          id: "music",
          label: "Music",
          defaultLevel: defaultOptionLevelIndex
     },

     soundEffects: {
          id: "soundEffects",
          label: "Sound FX",
          defaultLevel: defaultOptionLevelIndex
     }
};

// ==================================================
// NOTE: SHARED TUNABLES
// These are configuration values rather than live state.
// ==================================================

export const gameplayStartingHealth = 3;
export const maxVisibleHearts = 5;
export const healProgressPerHeart = 10;

export const pauseButtonMarginTop = 10;
export const touchArriveDistance = 2;

export const playerTrailMaxPoints = 14;
export const playerGlowBlurFallback = 18;
export const particleGlowBlurFallback = 18;

export const sparkleSizeMinFallback = 25;
export const sparkleSizeMaxFallback = 30;

export const statusFlashSeconds = 1.25;

export const rainbowFallbackPalette = [
     "#f00",
     "#f80",
     "#ff0",
     "#bf0",
     "#0f0",
     "#0fb",
     "#0ff",
     "#0bf",
     "#00f",
     "#80f",
     "#f0f",
     "#f08"
];

// ==================================================
// SMALL HELPERS
// ==================================================

export function clampOptionLevelIndex(value) {
     const numericValue = Number(value);

     if (!Number.isFinite(numericValue)) {
          return defaultOptionLevelIndex;
     }

     return Math.max(0, Math.min(maxOptionLevelIndex, Math.round(numericValue)));
}

export function getOptionLevelLabel(levelIndex) {
     return optionLevelLabels[clampOptionLevelIndex(levelIndex)] || optionLevelLabels[0];
}

export function getOptionLevelValue(levelIndex) {
     return optionLevelValues[clampOptionLevelIndex(levelIndex)] ?? optionLevelValues[0];
}

export function getOptionDefinition(optionName) {
     return optionDefinitions[optionName] || null;
}

export function getAllOptionDefinitions() {
     return Object.values(optionDefinitions);
}

export function getDefaultOptionSnapshot() {
     return {
          music: optionDefinitions.music.defaultLevel,
          soundEffects: optionDefinitions.soundEffects.defaultLevel,
          harmful: optionDefinitions.harmful.defaultLevel
     };
}

export function getCurrentOptionSnapshot() {
     return {
          music: musicLevel,
          soundEffects: soundEffectsLevel,
          harmful: harmfulLevel
     };
}

// ==================================================
// PERSISTENCE
// ==================================================

function canUseStorage() {
     try {
          return typeof window !== "undefined" && Boolean(window.localStorage);
     } catch {
          return false;
     }
}

export function normalizeOptionSnapshot(snapshot = {}) {
     const defaults = getDefaultOptionSnapshot();

     return {
          music: clampOptionLevelIndex(snapshot.music ?? defaults.music),
          soundEffects: clampOptionLevelIndex(snapshot.soundEffects ?? defaults.soundEffects),
          harmful: clampOptionLevelIndex(snapshot.harmful ?? defaults.harmful)
     };
}

export function saveOptionSnapshot(snapshot = getCurrentOptionSnapshot()) {
     if (!canUseStorage()) {
          return false;
     }

     const normalizedSnapshot = normalizeOptionSnapshot(snapshot);

     try {
          window.localStorage.setItem(
               configStorageKeys.options,
               JSON.stringify(normalizedSnapshot)
          );
          return true;
     } catch {
          return false;
     }
}

export function loadSavedOptionSnapshot() {
     const defaults = getDefaultOptionSnapshot();

     if (!canUseStorage()) {
          return defaults;
     }

     try {
          const rawValue = window.localStorage.getItem(configStorageKeys.options);

          if (!rawValue) {
               return defaults;
          }

          const parsedValue = JSON.parse(rawValue);
          return normalizeOptionSnapshot(parsedValue);
     } catch {
          return defaults;
     }
}

export function clearSavedOptionSnapshot() {
     if (!canUseStorage()) {
          return false;
     }

     try {
          window.localStorage.removeItem(configStorageKeys.options);
          return true;
     } catch {
          return false;
     }
}

export function applyOptionSnapshot(snapshot = loadSavedOptionSnapshot()) {
     const normalizedSnapshot = normalizeOptionSnapshot(snapshot);

     setMusicLevel(normalizedSnapshot.music);
     setSoundEffectsLevel(normalizedSnapshot.soundEffects);
     setHarmfulLevel(normalizedSnapshot.harmful);

     return normalizedSnapshot;
}

export function restoreDefaultOptionSnapshot() {
     const defaults = getDefaultOptionSnapshot();
     applyOptionSnapshot(defaults);
     saveOptionSnapshot(defaults);
     return defaults;
}

// ==================================================
// SETTING-SPECIFIC HELPERS
// ==================================================

export function saveCurrentOptions() {
     return saveOptionSnapshot(getCurrentOptionSnapshot());
}

export function loadAndApplySavedOptions() {
     return applyOptionSnapshot(loadSavedOptionSnapshot());
}

export function setAndPersistMusicLevel(levelIndex) {
     setMusicLevel(clampOptionLevelIndex(levelIndex));
     saveCurrentOptions();
}

export function setAndPersistSoundEffectsLevel(levelIndex) {
     setSoundEffectsLevel(clampOptionLevelIndex(levelIndex));
     saveCurrentOptions();
}

export function setAndPersistHarmfulLevel(levelIndex) {
     setHarmfulLevel(clampOptionLevelIndex(levelIndex));
     saveCurrentOptions();
}
