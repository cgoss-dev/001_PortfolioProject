// NOTE: ENTITIES / EFFECTS
// Effect pickup and collision burst logic extracted from entities.js.
//
// Owned here:
// - helpful / harmful effect definitions
// - effect timer/state sync
// - falling effect pickups
// - effect collection / application
// - collision bursts

import {
     miniGameCtx,
     miniGameWidth,
     miniGameHeight,
     player,

     playerHealth,
     sparkleScore,
     scoreMultiplier,
     effectPickups,
     collisionBursts,
     harmfulLevel,
     effectTimers,

     setSparkleScore,
     setScoreMultiplier,
     setPlayerHealth,
     setStoredEffect,
     clearStoredEffect,
     isStoredEffectReady,
     setEffectTimer,
     isEffectActive,
     decrementEffectTimers,
     setActiveStatusUi,
     clearActiveStatusUi,

     randomItem,
     randomNumber,
     isCollidingWithSparkle
} from "./state.js";

import {
     playerFaces,
     syncPlayerHealthState,
     applyTemporaryPlayerFace,
     triggerPlayerFacePop
} from "./entities_player.js";

const siteTheme = window.SiteTheme;

// ==================================================
// NOTE: GAMEPLAY BALANCE
// ==================================================

export const framesPerSecond = 60;

// Global safety cap only.
// Harmful effect density is controlled by Options, not by level.
export const effectPickupCap = 60;

// Helpful effects are intentionally rarer than sparkles.
export const helpfulEffectSpawnChance = 1 / 14;

export const collisionBurstParticleCount = 15;

// ==================================================
// NOTE: EFFECT TYPES
// Helpful and harmful falling pickups share the effectPickups array.
// category tells collision logic whether the pickup helps or hurts.
// ==================================================

export const helpfulEffectTypes = [
     { name: "shield", label: "SHIELD", char: "\u2B21\uFE0E", effect: "blockNextHarmfulCollision", durationSeconds: 0, lastsUntilUsed: true, penalty: 0 },
     { name: "cure", label: "CURE", char: "\u271A\uFE0E", effect: "blockNextHarmfulStatus", durationSeconds: 0, lastsUntilUsed: true, penalty: 0 },
     { name: "luck", label: "LUCK", char: "\u2618\uFE0E", effect: "doubleSparkleScore", durationSeconds: 8, lastsUntilUsed: false, penalty: 0 },
     { name: "magnet", label: "MAGNET", char: "\u2316\uFE0E", effect: "pullSparklesToPlayer", durationSeconds: 8, lastsUntilUsed: false, penalty: 0 },
     { name: "slowmo", label: "SLOWMO", char: "\u29D6\uFE0E", effect: "halveObjectFallSpeed", durationSeconds: 10, lastsUntilUsed: false, penalty: 0 }
];

export const harmfulEffectTypes = [
     { name: "freeze", label: "FREEZE", char: "\u2744\uFE0E", effect: "freezePlayerMovement", durationSeconds: 3, lastsUntilUsed: false, penalty: 1 },
     { name: "surge", label: "SURGE", char: "\u26A1\uFE0E", effect: "doubleObjectFallSpeed", durationSeconds: 8, lastsUntilUsed: false, penalty: 1 },
     { name: "daze", label: "DAZE", char: "\u2300\uFE0E", effect: "reversePlayerMovement", durationSeconds: 8, lastsUntilUsed: false, penalty: 1 },
     { name: "glass", label: "GLASS", char: "\u26A0\uFE0E", effect: "nextHitExtraDamage", durationSeconds: 10, lastsUntilUsed: false, penalty: 1 },
     { name: "fog", label: "FOG", char: "\u224B\uFE0E", effect: "limitVisionAroundPlayer", durationSeconds: 8, lastsUntilUsed: false, penalty: 1 }
];

// Harmful effects are spawned as a ratio of successful sparkle spawns:
// Off 1:0, Min 1:8, Low 1:6, Med 1:4, Max 1:2.
export const harmfulEffectSpawnRatios = [
     0,
     1 / 8,
     1 / 6,
     1 / 4,
     1 / 2
];

// ==================================================
// SHARED VISUAL HELPERS
// ==================================================

function getGameGlowBlur() {
     return siteTheme?.getGlowSettings?.().gameParticleBlur ?? 18;
}

function getGameParticleSizeMin() {
     return siteTheme?.getSparkleSettings?.().sizeMin ?? 25;
}

function getGameParticleSizeMax() {
     return siteTheme?.getSparkleSettings?.().sizeMax ?? 30;
}

function getRainbowPalette() {
     return siteTheme?.getRainbowPalette?.() ?? [ //FIXME: calling wrong rainbow
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

// ==================================================
// EFFECT HELPERS
// ==================================================

const timedEffectNames = [
     "luck",
     "magnet",
     "slowmo",
     "freeze",
     "surge",
     "daze",
     "glass",
     "fog"
];

export function secondsToFrames(seconds) {
     return Math.round(seconds * framesPerSecond);
}

function getEffectDurationFrames(effectType) {
     return secondsToFrames(effectType.durationSeconds || 0);
}

function clearTimedEffects() {
     timedEffectNames.forEach((effectName) => {
          setEffectTimer(effectName, 0);
     });
}

function setSingleTimedEffect(effectName, durationFrames) {
     clearTimedEffects();
     setEffectTimer(effectName, durationFrames);
     syncScoreMultiplierFromEffects();
}

function syncScoreMultiplierFromEffects() {
     const nextMultiplier = isEffectActive("luck") ? 3 : 1;

     if (scoreMultiplier !== nextMultiplier) {
          setScoreMultiplier(nextMultiplier);
     }
}

function getHighestPriorityActiveEffect() {
     const statusPriority = [
          "freeze",
          "fog",
          "surge",
          "daze",
          "glass",
          "slowmo",
          "magnet",
          "luck"
     ];

     for (let i = 0; i < statusPriority.length; i += 1) {
          const effectName = statusPriority[i];

          if (isEffectActive(effectName)) {
               return effectName;
          }
     }

     if (isStoredEffectReady("shield")) {
          return "shield";
     }

     if (isStoredEffectReady("cure")) {
          return "cure";
     }

     return "";
}

function getEffectTypeByName(effectName) {
     return (
          helpfulEffectTypes.find((type) => type.name === effectName) ||
          harmfulEffectTypes.find((type) => type.name === effectName) ||
          null
     );
}

function syncActiveStatusUiFromEffects() {
     const activeEffectName = getHighestPriorityActiveEffect();

     if (!activeEffectName) {
          clearActiveStatusUi();
          return;
     }

     const type = getEffectTypeByName(activeEffectName);

     if (!type) {
          clearActiveStatusUi();
          return;
     }

     if (type.lastsUntilUsed) {
          setActiveStatusUi(type.label, type.char, 0, 0);
          return;
     }

     setActiveStatusUi(
          type.label,
          type.char,
          effectTimers[type.name] || 0,
          getEffectDurationFrames(type)
     );
}

export function updateEffectState() {
     decrementEffectTimers();
     syncScoreMultiplierFromEffects();
     syncActiveStatusUiFromEffects();
}

function applyHelpfulEffect(type) {
     if (type.name === "shield") {
          clearStoredEffect("cure");
          setStoredEffect("shield", true);
          setActiveStatusUi(type.label, type.char);
          return;
     }

     if (type.name === "cure") {
          clearStoredEffect("shield");
          setStoredEffect("cure", true);
          setActiveStatusUi(type.label, type.char);
          return;
     }

     setSingleTimedEffect(type.name, getEffectDurationFrames(type));

     if (type.name === "luck") {
          setScoreMultiplier(2);
     }

     syncActiveStatusUiFromEffects();
}

function applyHarmfulEffect(type) {
     if (isStoredEffectReady("cure")) {
          clearStoredEffect("cure");
          setActiveStatusUi("CURED", "\u271A\uFE0E", secondsToFrames(1.25), secondsToFrames(1.25));
          return;
     }

     setSingleTimedEffect(type.name, getEffectDurationFrames(type));
     syncActiveStatusUiFromEffects();
}

// ==================================================
// NOTE: EFFECT PICKUPS
// ==================================================

function getObjectFallSpeedMultiplier() {
     if (isEffectActive("surge")) {
          return 2;
     }

     if (isEffectActive("slowmo")) {
          return 0.5;
     }

     return 1;
}

function createEffectPickup(type, category) {
     const x = Math.random() * (miniGameWidth - 20) + 10;

     effectPickups.push({
          x,
          baseX: x,
          y: -20,
          speed: category === "helpful"
               ? 0.35 + Math.random() * 0.55
               : 0.5 + Math.random() * 0.7,
          size: category === "helpful"
               ? randomNumber(getGameParticleSizeMin() * 1.25, getGameParticleSizeMax() * 1.15)
               : randomNumber(getGameParticleSizeMin() * 1.5, getGameParticleSizeMax() * 1.25),
          char: type.char,
          type,
          category,
          color: getNextSparkleColor(),
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.02 + Math.random() * 0.03,
          wobbleAmount: 5 + Math.random() * 10
     });
}

export function createHelpfulEffect() {
     createEffectPickup(randomItem(helpfulEffectTypes), "helpful");
}

export function createHarmfulEffect() {
     createEffectPickup(randomItem(harmfulEffectTypes), "harmful");
}

export function maybeCreateEffectPickupsFromSparkleSpawn() {
     const harmfulEffectSpawnChance = harmfulEffectSpawnRatios[harmfulLevel] ?? 0;

     if (effectPickups.length >= effectPickupCap) {
          return;
     }

     if (Math.random() <= helpfulEffectSpawnChance) {
          createHelpfulEffect();
     }

     if (effectPickups.length >= effectPickupCap) {
          return;
     }

     if (harmfulEffectSpawnChance > 0 && Math.random() <= harmfulEffectSpawnChance) {
          createHarmfulEffect();
     }
}

export function updateEffectPickups() {
     const fallSpeedMultiplier = getObjectFallSpeedMultiplier();

     for (let i = effectPickups.length - 1; i >= 0; i -= 1) {
          const pickup = effectPickups[i];

          pickup.y += pickup.speed * fallSpeedMultiplier;
          pickup.wobbleOffset += pickup.wobbleSpeed;
          pickup.x = pickup.baseX + Math.sin(pickup.wobbleOffset) * pickup.wobbleAmount;

          if (pickup.y > miniGameHeight + 30) {
               effectPickups.splice(i, 1);
          }
     }
}

function getHarmfulCollisionDamage(type) {
     let damage = type.penalty || 1;

     if (isEffectActive("glass")) {
          damage += 1;
          setEffectTimer("glass", 0);
     }

     return damage;
}

function collectHelpfulEffect(pickup, index) {
     createCollisionBurst(pickup.x, pickup.y, pickup.color, "sparkle");
     effectPickups.splice(index, 1);

     applyHelpfulEffect(pickup.type);
     applyTemporaryPlayerFace(playerFaces.sparkle, 45);
     triggerPlayerFacePop(1.2);
}

function collectHarmfulEffect(pickup, index) {
     createCollisionBurst(pickup.x, pickup.y, pickup.color, "harmful");
     effectPickups.splice(index, 1);

     if (isStoredEffectReady("shield")) {
          clearStoredEffect("shield");
          setActiveStatusUi("BLOCKED", "\u2B21\uFE0E", secondsToFrames(1.25), secondsToFrames(1.25));
          triggerPlayerFacePop(1.18);
          return;
     }

     const damage = getHarmfulCollisionDamage(pickup.type);

     setSparkleScore(Math.max(0, sparkleScore - damage));
     setPlayerHealth(Math.max(0, playerHealth - damage));

     applyHarmfulEffect(pickup.type);
     syncPlayerHealthState();
     applyTemporaryPlayerFace(playerFaces.harmful, 30);
     triggerPlayerFacePop(1.25);
}

export function collectEffectPickups() {
     for (let i = effectPickups.length - 1; i >= 0; i -= 1) {
          const pickup = effectPickups[i];

          if (!isCollidingWithSparkle(player, pickup)) {
               continue;
          }

          if (pickup.category === "helpful") {
               collectHelpfulEffect(pickup, i);
          } else {
               collectHarmfulEffect(pickup, i);
          }
     }
}

export function drawEffectPickups() {
     if (!miniGameCtx) {
          return;
     }

     const glowBlur = getGameGlowBlur();

     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";

     for (let i = effectPickups.length - 1; i >= 0; i -= 1) {
          const pickup = effectPickups[i];

          const pickupSizeBoost =
               pickup.type?.name === "luck" ? 1.25 :
               pickup.type?.name === "fog" ? 1.25 :
               pickup.type?.name === "shield" ? 1.25 :
               pickup.type?.name === "magnet" ? 1.25 :
               pickup.type?.name === "glass" ? 0.75 :
               1;

          const pickupFontSize = Math.max(20, pickup.size * pickupSizeBoost);

          miniGameCtx.save();
          miniGameCtx.font = `${pickupFontSize}px Arial, Helvetica, sans-serif`;
          miniGameCtx.fillStyle = pickup.color;
          miniGameCtx.shadowColor = pickup.color;
          miniGameCtx.shadowBlur = glowBlur;

          miniGameCtx.globalAlpha = pickup.category === "helpful" ? 1 : 0.95;
          miniGameCtx.fillText(pickup.char, pickup.x, pickup.y);

          miniGameCtx.shadowBlur = 0;
          miniGameCtx.globalAlpha = 1;
          miniGameCtx.fillText(pickup.char, pickup.x, pickup.y);

          miniGameCtx.restore();
     }
}

// ==================================================
// NOTE: COLLISION BURSTS
// ==================================================

export const burstChars = ["✦", "✧", "·", "•"];

export function createCollisionBurst(x, y, color, burstType) {
     for (let i = 0; i < collisionBurstParticleCount; i += 1) {
          const angle = randomNumber(0, Math.PI * 2);
          const speed = burstType === "harmful"
               ? randomNumber(1.1, 2.6)
               : randomNumber(0.7, 2.1);

          collisionBursts.push({
               x,
               y,
               dx: Math.cos(angle) * speed,
               dy: Math.sin(angle) * speed,
               life: randomNumber(25, 50),
               maxLife: 50,
               size: randomNumber(20, 30),
               char: randomItem(burstChars),
               color,
               glowBoost: burstType === "harmful" ? 1.25 : 1
          });
     }
}

export function updateCollisionBursts() {
     for (let i = collisionBursts.length - 1; i >= 0; i -= 1) {
          const burst = collisionBursts[i];

          burst.x += burst.dx;
          burst.y += burst.dy;
          burst.dy += 0.015;
          burst.life -= 1;

          if (burst.life <= 0) {
               collisionBursts.splice(i, 1);
          }
     }
}

export function drawCollisionBursts() {
     if (!miniGameCtx) {
          return;
     }

     const glowBlur = getGameGlowBlur();

     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";

     for (let i = collisionBursts.length - 1; i >= 0; i -= 1) {
          const burst = collisionBursts[i];
          const lifeRatio = burst.life / burst.maxLife;
          const sizeMultiplier = 0.7 + ((1 - lifeRatio) * 0.6);
          const burstSize = burst.size * sizeMultiplier;

          miniGameCtx.save();
          miniGameCtx.font = `${burstSize}px Arial, Helvetica, sans-serif`;
          miniGameCtx.fillStyle = burst.color;
          miniGameCtx.shadowColor = burst.color;
          miniGameCtx.shadowBlur = glowBlur * burst.glowBoost * lifeRatio;

          miniGameCtx.globalAlpha = Math.max(0, lifeRatio * 0.95);
          miniGameCtx.fillText(burst.char, burst.x, burst.y);

          miniGameCtx.shadowBlur = 0;
          miniGameCtx.globalAlpha = Math.max(0, lifeRatio * 0.8);
          miniGameCtx.fillText(burst.char, burst.x, burst.y);

          miniGameCtx.restore();
     }
}
