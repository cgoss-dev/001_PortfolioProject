// NOTE: GAME THEME
// Pure configuration + CSS-driven visuals.
// Does NOT hold runtime game state anymore.

export const difficultyOptions = ["Easy", "Normal", "Hard"];

export const startOverlayDuration = 120;
export const overlayFadeFrames = 30;

export const sparkleSpawnDelay = 50;
export const sparkleSpawnCap = 25;

export const obstacleSpawnDelay = 120;
export const obstacleSpawnCap = 10;

// NOTE: CSS HELPERS

export function getCssValue(variableName) {
     return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

export function getCssNumber(variableName, fallback = 0) {
     const rawValue = getCssValue(variableName);
     const value = Number(rawValue);
     return Number.isNaN(value) ? fallback : value;
}

export function getCssColor(variableName, fallback = "#ffffff") {
     const value = getCssValue(variableName);
     return value || fallback;
}

// NOTE: GLOW SETTINGS

export function getGlowSettings() {
     return {
          bgParticleBlur: getCssNumber("--glow-bg-particle-blur", 12),
          gameParticleBlur: getCssNumber("--glow-game-particle-blur", 16)
     };
}

// NOTE: PARTICLE SETTINGS

export function getGameParticleSettings() {
     return {
          particleSizeMin: getCssNumber("--game-particle-size-min", 16),
          particleSizeMax: getCssNumber("--game-particle-size-max", 26),
          burstParticleCount: getCssNumber("--burst-particle-count", 10)
     };
}

// NOTE: COLOR SYSTEM

export function getRainbowPalette() {
     return [
          getCssColor("--rainbow-pink"),
          getCssColor("--rainbow-red"),
          getCssColor("--rainbow-yellow"),
          getCssColor("--rainbow-green"),
          getCssColor("--rainbow-blue")
     ].filter(Boolean);
}

export function createColorEngine(colors) {
     let index = 0;

     return {
          next() {
               if (!colors.length) return "#ffffff";
               const color = colors[index % colors.length];
               index++;
               return color;
          }
     };
}