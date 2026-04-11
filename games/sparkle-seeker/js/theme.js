export let difficultyOptions = ["Easy", "Normal", "Hard"];

export const startOverlayDuration = 120;
export const overlayFadeFrames = 30;

export const sparkleSpawnDelay = 50;
export const sparkleSpawnCap = 25;

export const obstacleSpawnDelay = 120;
export const obstacleSpawnCap = 10;

export let gameSparkleColorEngine = null;
export function setGameSparkleColorEngine(v) { gameSparkleColorEngine = v; }

// NOTE: GAME THEME / SHARED VISUAL HELPERS
// This file reads CSS custom properties and shares theme helpers with the game files.
// style.css stores the values.
// THIS file reads them in JavaScript, then the other game js files read from this.

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

// NOTE: SHARED GLOW SETTINGS
// These are used by multiple systems, including the background and the mini-game.

export function getGlowSettings() {
     return {
          bgParticleBlur: getCssNumber("--glow-bg-particle-blur", 12),
          gameParticleBlur: getCssNumber("--glow-game-particle-blur", 16),
          bungeeGlowBlur: getCssValue("--bungee-glow-blur") || "0 0 0.05rem",
          bungeeShadowOffset1: getCssValue("--bungee-shadow-offset-1") || "0.125rem 0.125rem 0 rgba(0, 0, 0, 0.8)",
          bungeeShadowOffset2: getCssValue("--bungee-shadow-offset-2") || "0.25rem 0.25rem 0 rgba(0, 0, 0, 0.6)"
     };
}

// NOTE: BACKGROUND SPARKLE SETTINGS
// These are for the root page background sparkle rain, NOT the mini-game entities.

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

// NOTE: MINI-GAME PARTICLE CONTROL CENTER
// Sparkles and Obstacles are both particles in the mini-game.
// Their shared visual tuning lives here in one place.
//
// particleSize = normal falling mini-game particle size
// burstParticle = the emitted collision bits
// burstParticleCenter = the big center pop added during a collision
//
// The base values are shared.
// Type-specific multipliers let sparkle hits and obstacle hits still feel different
// without splitting the whole settings object into two separate systems.

export function getGameParticleSettings() {
     return {
          particleSizeMin: getCssNumber("--game-particle-size-min", 16),
          particleSizeMax: getCssNumber("--game-particle-size-max", 26),

          burstParticleCount: getCssNumber("--burst-particle-count", 10),

          burstParticleSizeMin: getCssNumber("--burst-particle-size-min", 12),
          burstParticleSizeMax: getCssNumber("--burst-particle-size-max", 28),

          burstParticleSpeedMin: getCssNumber("--burst-particle-speed-min", 0.8),
          burstParticleSpeedMax: getCssNumber("--burst-particle-speed-max", 3.2),

          burstParticleLifeMin: getCssNumber("--burst-particle-life-min", 18),
          burstParticleLifeMax: getCssNumber("--burst-particle-life-max", 40),

          burstParticleCenterSize: getCssNumber("--burst-particle-center-size", 64),

          sparkleBurstCountMultiplier: getCssNumber("--sparkle-burst-count-multiplier", 0.8),
          obstacleBurstCountMultiplier: getCssNumber("--obstacle-burst-count-multiplier", 1.2),

          sparkleBurstSizeMultiplier: getCssNumber("--sparkle-burst-size-multiplier", 0.85),
          obstacleBurstSizeMultiplier: getCssNumber("--obstacle-burst-size-multiplier", 1.15),

          sparkleBurstSpeedMultiplier: getCssNumber("--sparkle-burst-speed-multiplier", 0.85),
          obstacleBurstSpeedMultiplier: getCssNumber("--obstacle-burst-speed-multiplier", 1.15),

          sparkleBurstLifeMultiplier: getCssNumber("--sparkle-burst-life-multiplier", 0.85),
          obstacleBurstLifeMultiplier: getCssNumber("--obstacle-burst-life-multiplier", 1.15),

          sparkleBurstCenterSizeMultiplier: getCssNumber("--sparkle-burst-center-size-multiplier", 0.9),
          obstacleBurstCenterSizeMultiplier: getCssNumber("--obstacle-burst-center-size-multiplier", 1.15)
     };
}

export function getRainbowPalette() {
     return [
          getCssColor("--rainbow-pink"),
          getCssColor("--rainbow-red"),
          getCssColor("--rainbow-maroon"),
          getCssColor("--rainbow-peach"),
          getCssColor("--rainbow-flamingo"),
          getCssColor("--rainbow-yellow"),
          getCssColor("--rainbow-green"),
          getCssColor("--rainbow-teal"),
          getCssColor("--rainbow-sky"),
          getCssColor("--rainbow-blue"),
          getCssColor("--rainbow-lavender"),
          getCssColor("--rainbow-violet")
     ].filter(Boolean);
}

function randomWholeNumber(min, max) {
     return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(array) {
     return array[randomWholeNumber(0, array.length - 1)];
}

function randomItemExcept(array, previousItem) {
     if (!array.length) {
          return undefined;
     }

     if (array.length === 1) {
          return array[0];
     }

     let nextItem = randomItem(array);

     while (nextItem === previousItem) {
          nextItem = randomItem(array);
     }

     return nextItem;
}

function shuffleArray(array) {
     const shuffled = [...array];

     for (let i = shuffled.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
     }

     return shuffled;
}

export function createColorEngine(colorsOrFactory) {
     let previousColor = null;

     function resolvePalette() {
          const rawPalette = typeof colorsOrFactory === "function"
               ? colorsOrFactory()
               : colorsOrFactory;

          if (!Array.isArray(rawPalette)) {
               return [];
          }

          return rawPalette.filter(Boolean);
     }

     function avoidImmediateRepeatInBatch(colorBatch, previousColorForSlot, startIndex = 0) {
          if (colorBatch.length <= startIndex) {
               return;
          }

          if (colorBatch[startIndex] !== previousColorForSlot) {
               return;
          }

          let swapIndex = -1;

          for (let i = startIndex + 1; i < colorBatch.length; i += 1) {
               if (colorBatch[i] !== previousColorForSlot) {
                    swapIndex = i;
                    break;
               }
          }

          if (swapIndex !== -1) {
               const temp = colorBatch[startIndex];
               colorBatch[startIndex] = colorBatch[swapIndex];
               colorBatch[swapIndex] = temp;
          }
     }

     return {
          next() {
               const palette = resolvePalette();

               if (!palette.length) {
                    return undefined;
               }

               if (palette.length === 1) {
                    previousColor = palette[0];
                    return palette[0];
               }

               const nextColor = randomItemExcept(palette, previousColor);
               previousColor = nextColor;
               return nextColor;
          },

          nextCycle(count, previousCycleColors = []) {
               const palette = resolvePalette();

               if (!palette.length || count <= 0) {
                    return [];
               }

               if (palette.length === 1) {
                    return Array(count).fill(palette[0]);
               }

               const nextColors = [];
               let availableColors = shuffleArray(palette);
               let colorIndex = 0;

               for (let i = 0; i < count; i += 1) {
                    if (colorIndex >= availableColors.length) {
                         availableColors = shuffleArray(palette);
                         colorIndex = 0;
                    }

                    const previousColorForSlot = previousCycleColors[i] || null;
                    avoidImmediateRepeatInBatch(availableColors, previousColorForSlot, colorIndex);

                    const nextColor = availableColors[colorIndex];
                    colorIndex += 1;
                    nextColors.push(nextColor);
               }

               return nextColors;
          },

          reset() {
               previousColor = null;
          }
     };
}