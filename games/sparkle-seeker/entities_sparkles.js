// NOTE: ENTITIES / SPARKLES
// Sparkle-only logic extracted from entities.js.
//
// Owned here:
// - sparkle spawning
// - sparkle updates
// - sparkle collection
// - sparkle drawing
// - shared sparkle color cycle

import {
     miniGameCtx,
     miniGameWidth,
     miniGameHeight,
     player,

     playerHealth,
     maxPlayerHealth,
     sparkleHealProgress,
     sparkles,
     sparkleSpawnTimer,

     setSparkleSpawnTimer,
     setSparkleHealProgress,
     addSparkleHealProgress,
     addSparkleScore,
     addPlayerHealth,

     isEffectActive,
     isCollidingWithSparkle
} from "./state.js";

import {
     playerFaces,
     syncPlayerHealthState,
     applyTemporaryPlayerFace,
     triggerPlayerFacePop
} from "./entities_player.js";

import {
     maybeCreateEffectPickupsFromSparkleSpawn,
     createCollisionBurst
} from "./entities_effects.js";

const siteTheme = window.SiteTheme;

// ==================================================
// NOTE: GAMEPLAY BALANCE
// These are game rules, so they belong in JS.
// ==================================================

export const sparkleSpawnDelay = 20;
export const sparkleSpawnCap = 75;

// ==================================================
// SHARED VISUAL HELPERS
// ==================================================

function getGameGlowBlur() {
     return siteTheme?.getGlowSettings?.().gameParticleBlur ?? 18; // FIXME gameParticleBlur?
}

function getGameParticleSizeMin() {
     return siteTheme?.getSparkleSettings?.().sizeMin ?? 25;
}

function getGameParticleSizeMax() {
     return siteTheme?.getSparkleSettings?.().sizeMax ?? 30;
}

function getRainbowPalette() {
     return siteTheme?.getRainbowPalette?.() ?? [
          "#ea76cb",
          "#d20f39",
          "#fe640b",
          "#df8e1d",
          "#40a02b",
          "#179299",
          "#04a5e5",
          "#1e66f5",
          "#7287fd",
          "#8839ef"
     ];
}

// ==================================================
// COLOR ROTATION
// Uses the shared root color engine instead of a local duplicate.
// ==================================================

const sparkleColorEngine = {
     engine: null
};

function ensureSparkleColorEngine() {
     if (!sparkleColorEngine.engine) {
          const createEngine = siteTheme?.createColorEngine;

          sparkleColorEngine.engine = createEngine
               ? createEngine(getRainbowPalette)
               : {
                    next() {
                         const palette = getRainbowPalette();
                         return palette[0] || "#ffffff";
                    }
               };
     }
}

function getNextSparkleColor() {
     ensureSparkleColorEngine();
     return sparkleColorEngine.engine.next() || "#ffffff";
}

export function resetEntityColorCycle() {
     if (sparkleColorEngine.engine?.reset) {
          sparkleColorEngine.engine.reset();
     }

     sparkleColorEngine.engine = null;
}

// ==================================================
// NOTE: SPARKLES
// ==================================================

export const sparkleChars = ["✦", "✧"];

function applyMagnetEffectToSparkle(sparkle) {
     if (!isEffectActive("magnet")) {
          return;
     }

     const dx = player.x - sparkle.x;
     const dy = player.y - sparkle.y;
     const distance = Math.hypot(dx, dy);
     const magnetRadius = Math.max(120, Math.min(220, miniGameWidth * 0.75));

     if (distance <= 0 || distance > magnetRadius) {
          return;
     }

     // Stronger when closer to the player.
     const strength = 1 - (distance / magnetRadius);

     // Make sideways pull feel more obvious than vertical pull.
     const pullX = (dx / distance) * (2 + (strength * 3.5));
     const pullY = (dy / distance) * (0.75 + (strength * 2));

     sparkle.x += pullX;
     sparkle.y += pullY;

     // Optional: slow the normal falling motion a bit while magnetized.
     if (typeof sparkle.speed === "number") {
          sparkle.speed *= 0.9;
     }
}


function getObjectFallSpeedMultiplier() {
     if (isEffectActive("surge")) {
          return 3;
     }

     if (isEffectActive("slowmo")) {
          return 0.25;
     }

     return 1;
}

export function createSparkle() {
     const x = Math.random() * (miniGameWidth - 20) + 10;

     sparkles.push({
          x,
          baseX: x,
          y: -20,
          speed: 0.25 + Math.random() * 0.5,
          size: Math.random() * (getGameParticleSizeMax() - getGameParticleSizeMin()) + getGameParticleSizeMin(),
          char: sparkleChars[Math.floor(Math.random() * sparkleChars.length)],
          color: getNextSparkleColor(),
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.02 + Math.random() * 0.03,
          wobbleAmount: 5 + Math.random() * 10
     });
}

export function updateSparkleSpawns() {
     const nextSparkleSpawnTimer = sparkleSpawnTimer + 1;
     setSparkleSpawnTimer(nextSparkleSpawnTimer);

     // This keeps sparkles from spawning on a perfectly robotic rhythm.
     const sparkleSpawnJitter = Math.random() * 8;

     if (nextSparkleSpawnTimer >= sparkleSpawnDelay + sparkleSpawnJitter) {
          if (sparkles.length < sparkleSpawnCap) {
               createSparkle();
               maybeCreateEffectPickupsFromSparkleSpawn();
          }

          setSparkleSpawnTimer(0);
     }
}

export function updateSparkles() {
     const fallSpeedMultiplier = getObjectFallSpeedMultiplier();

     for (let i = sparkles.length - 1; i >= 0; i -= 1) {
          const sparkle = sparkles[i];

          sparkle.y += sparkle.speed * fallSpeedMultiplier;
          sparkle.wobbleOffset += sparkle.wobbleSpeed;
          sparkle.x = sparkle.baseX + Math.sin(sparkle.wobbleOffset) * sparkle.wobbleAmount;

          applyMagnetEffectToSparkle(sparkle);

          if (sparkle.y > miniGameHeight + 30) {
               sparkles.splice(i, 1);
          }
     }
}

export function collectSparkles() {
     for (let i = sparkles.length - 1; i >= 0; i -= 1) {
          const sparkle = sparkles[i];

          if (isCollidingWithSparkle(player, sparkle)) {
               createCollisionBurst(sparkle.x, sparkle.y, sparkle.color, "sparkle");
               sparkles.splice(i, 1);

               addSparkleScore(1);
               addSparkleHealProgress(1);

               let progress = sparkleHealProgress;

               while (progress >= 10 && playerHealth < maxPlayerHealth) {
                    progress -= 10;
                    addPlayerHealth(1);
               }

               setSparkleHealProgress(progress);
               syncPlayerHealthState();
               applyTemporaryPlayerFace(playerFaces.sparkle, 60);
               triggerPlayerFacePop(1.25);
          }
     }
}

export function drawSparkles() {
     if (!miniGameCtx) {
          return;
     }

     const glowBlur = getGameGlowBlur();

     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";

     for (let i = sparkles.length - 1; i >= 0; i -= 1) {
          const sparkle = sparkles[i];

          miniGameCtx.save();
          miniGameCtx.font = `${Math.max(16, sparkle.size)}px Arial, Helvetica, sans-serif`;
          miniGameCtx.fillStyle = sparkle.color;
          miniGameCtx.shadowColor = sparkle.color;
          miniGameCtx.shadowBlur = glowBlur;

          miniGameCtx.globalAlpha = 0.95;
          miniGameCtx.fillText(sparkle.char, sparkle.x, sparkle.y);

          miniGameCtx.shadowBlur = 0;
          miniGameCtx.globalAlpha = 1;
          miniGameCtx.fillText(sparkle.char, sparkle.x, sparkle.y);

          miniGameCtx.restore();
     }
}
