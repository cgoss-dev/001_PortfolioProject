// NOTE: ENTITIES
// This file combines:
// - player logic
// - sparkle logic
// - effect pickup logic
// - collision burst logic
// - player health/face sync helpers
//
// Gameplay balance values stay in JS.
// Shared visual/theme helpers come from root script.js through window.SiteTheme.

import {
     miniGameCtx,
     miniGameWidth,
     miniGameHeight,
     player,
     keys,
     touchControls,

     gamePaused,
     playerHealth,
     maxPlayerHealth,
     sparkleScore,
     sparkleHealProgress,
     scoreMultiplier,
     sparkles,
     effectPickups,
     collisionBursts,
     sparkleSpawnTimer,
     harmfulLevel,
     effectTimers,

     setSparkleSpawnTimer,
     setSparkleHealProgress,
     setSparkleScore,
     setScoreMultiplier,
     setPlayerHealth,
     addSparkleHealProgress,
     addSparkleScore,
     addPlayerHealth,
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

const siteTheme = window.SiteTheme;

// ==================================================
// NOTE: GAMEPLAY BALANCE
// These are game rules, so they belong in JS.
// ==================================================

export const framesPerSecond = 60;

export const sparkleSpawnDelay = 25;
export const sparkleSpawnCap = 60;

// Global safety cap only.
// Harmful effect density is controlled by Options, not by level.
export const effectPickupCap = 60;

// Helpful effects are intentionally rarer than sparkles.
export const helpfulEffectSpawnChance = 1 / 14;

// LEVEL RULES
// Score controls the current level here.
// Keeping this in one place makes balancing much easier later.
export const levelRules = [
     { level: 1, minScore: 0, maxScore: 49 },
     { level: 2, minScore: 50, maxScore: 149 },
     { level: 3, minScore: 150, maxScore: 249 },
     { level: 4, minScore: 250, maxScore: 449 },
     { level: 5, minScore: 450, maxScore: 999 }
];

// WIN SCORE: 1000+ ends the run in a win state.
export const winScore = 1000;

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
     { name: "surge", label: "SURGE", char: "\u26A1\uFE0E", effect: "doubleObjectFallSpeed", durationSeconds: 5, lastsUntilUsed: false, penalty: 1 },
     { name: "daze", label: "DAZE", char: "\u2300\uFE0E", effect: "reversePlayerMovement", durationSeconds: 8, lastsUntilUsed: false, penalty: 1 },
     { name: "glass", label: "GLASS", char: "\u26A0\uFE0E", effect: "nextHitExtraDamage", durationSeconds: 10, lastsUntilUsed: false, penalty: 1 },
     { name: "fog", label: "FOG", char: "\u224B\uFE0E", effect: "limitVisionAroundPlayer", durationSeconds: 6, lastsUntilUsed: false, penalty: 1 }
];

// Harmful effects are spawned as a ratio of successful sparkle spawns:
// Off 0:1, Min 1:10, Low 1:8, Med 1:6, Max 1:4.
export const harmfulEffectSpawnRatios = [
     0,
     1 / 10,
     1 / 8,
     1 / 6,
     1 / 4
];

// ==================================================
// PLAYER
// ==================================================

export const playerFaces = {
     neutral: "😐",
     smile: "🙂",
     sparkle: "😁",
     harmful: "😫",
     maxHealth: "🤩",
     lowHealth: "😰",
     dead: "☠️"
};

export const playerBaseHealth = 3;
export const playerBaseSpeed = 3;
export const playerSpeedPerHeart = 1;

// PLAYER BASE SIZE
// These are the player's normal visual/collision values.
// We keep them separate so level-based scaling can always return to the original size cleanly.
export const playerBaseSize = 64;
export const playerBaseRadius = 30;

// ==================================================
// NOTE: PLAYER TRAIL
// Short rainbow ribbon segments that follow actual movement.
// This now supports full 2D movement from keyboard or touch.
// ==================================================

export const playerTrailCountMax = 2;
export const playerTrailCountMin = 0;

export const playerTrailLifeMax = 64;
export const playerTrailLifeMin = 12;

export const playerTrailWidthMax = 10;
export const playerTrailWidthMin = 2;

export const playerTrailOffsetMax = 25;
export const playerTrailOffsetMin = -25;

export const playerTrailLengthMax = 32;
export const playerTrailLengthMin = 2;

// Negative raises the ribbon anchor above the player center; positive lowers it.
export const playerTrailAnchorYOffset = -4;

const playerTrail = [];

// ==================================================
// SHARED VISUAL HELPERS
// Pull visual values from root helpers when possible.
// Keep safe fallbacks in case something is missing.
// ==================================================

function getGameGlowBlur() {
     return siteTheme?.getGlowSettings?.().gameParticleBlur ?? 16;
}

function getGameParticleSizeMin() {
     return siteTheme?.getSparkleSettings?.().sizeMin ?? 20;
}

function getGameParticleSizeMax() {
     return siteTheme?.getSparkleSettings?.().sizeMax ?? 25;
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

function secondsToFrames(seconds) {
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

function getObjectFallSpeedMultiplier() {
     if (isEffectActive("surge")) {
          return 2;
     }

     if (isEffectActive("slowmo")) {
          return 0.5;
     }

     return 1;
}

function getPlayerMovementMultiplier() {
     if (isEffectActive("freeze")) {
          return 0;
     }

     return 1;
}

function syncScoreMultiplierFromEffects() {
     const nextMultiplier = isEffectActive("luck") ? 2 : 1;

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

function applyMagnetEffectToSparkle(sparkle) {
     if (!isEffectActive("magnet")) {
          return;
     }

     const dx = player.x - sparkle.x;
     const dy = player.y - sparkle.y;
     const distance = Math.hypot(dx, dy);
     const magnetRadius = Math.max(120, Math.min(220, miniGameWidth * 0.45));

     if (distance <= 0 || distance > magnetRadius) {
          return;
     }

     const pullStrength = 1 - (distance / magnetRadius);
     const pullSpeed = 0.45 + (pullStrength * 1.8);

     sparkle.x += (dx / distance) * pullSpeed;
     sparkle.y += (dy / distance) * pullSpeed;
}

// ==================================================
// PLAYER TRAIL HELPERS
// ==================================================

function createPlayerTrail(fromX, fromY, toX, toY) {
     const dx = toX - fromX;
     const dy = toY - fromY;
     const distance = Math.hypot(dx, dy);

     if (distance < 0.5) {
          return;
     }

     const directionX = dx / distance;
     const directionY = dy / distance;
     const normalX = -directionY;
     const normalY = directionX;
     const trailCount = Math.floor(randomNumber(playerTrailCountMin, playerTrailCountMax + 1));

     for (let i = 0; i < trailCount; i += 1) {
          const life = Math.floor(randomNumber(playerTrailLifeMin, playerTrailLifeMax + 1));
          const width = randomNumber(playerTrailWidthMin, playerTrailWidthMax);
          const offset = randomNumber(playerTrailOffsetMin, playerTrailOffsetMax);
          const length = randomNumber(playerTrailLengthMin, playerTrailLengthMax);

          const trailFromX = toX - (directionX * length);
          const trailFromY = toY - (directionY * length);

          playerTrail.push({
               fromX: trailFromX + (normalX * offset),
               fromY: trailFromY + (normalY * offset),
               toX: toX + (normalX * offset),
               toY: toY + (normalY * offset),
               color: getNextSparkleColor(),
               life,
               maxLife: life,
               width
          });
     }
}

export function updatePlayerTrail() {
     for (let i = playerTrail.length - 1; i >= 0; i -= 1) {
          const trail = playerTrail[i];

          trail.life -= 1;

          if (trail.life <= 0) {
               playerTrail.splice(i, 1);
          }
     }
}

export function drawPlayerTrail() {
     if (!miniGameCtx) {
          return;
     }

     const glowBlur = getGameGlowBlur();

     for (let i = playerTrail.length - 1; i >= 0; i -= 1) {
          const trail = playerTrail[i];
          const lifeRatio = trail.life / trail.maxLife;

          miniGameCtx.save();
          miniGameCtx.globalAlpha = Math.max(0, lifeRatio * 0.75);
          miniGameCtx.strokeStyle = trail.color;
          miniGameCtx.shadowColor = trail.color;
          miniGameCtx.shadowBlur = glowBlur;
          miniGameCtx.lineWidth = trail.width * lifeRatio;
          miniGameCtx.lineCap = "round";

          miniGameCtx.beginPath();
          miniGameCtx.moveTo(trail.fromX, trail.fromY);
          miniGameCtx.lineTo(trail.toX, trail.toY);
          miniGameCtx.stroke();

          miniGameCtx.restore();
     }
}

// ==================================================
// NOTE: PLAYER HEALTH / FACE HELPERS
// ==================================================

export function getDefaultPlayerFace() {
     if (playerHealth <= 0) {
          return playerFaces.dead;
     }

     if (playerHealth === maxPlayerHealth) {
          return playerFaces.maxHealth;
     }

     if (playerHealth <= 2) {
          return playerFaces.lowHealth;
     }

     return playerFaces.smile;
}

export function refreshPlayerFaceFromHealth() {
     player.char = getDefaultPlayerFace();
}

export function updatePlayerSpeedFromHealth() {
     const diff = playerHealth - playerBaseHealth;
     player.speed = Math.max(0, playerBaseSpeed + (diff * playerSpeedPerHeart));
}

export function syncPlayerHealthState() {
     updatePlayerSpeedFromHealth();
     refreshPlayerFaceFromHealth();
}

export function applyTemporaryPlayerFace(face, duration) {
     if (
          playerHealth <= 0 ||
          playerHealth === maxPlayerHealth ||
          playerHealth <= 2
     ) {
          player.sparkleFaceTimer = 0;
          refreshPlayerFaceFromHealth();
          return;
     }

     player.char = face;
     player.sparkleFaceTimer = duration;
}

// NOTE: SHARED FACE POP
// Centralized collision scale effect for sparkles and effect pickups.
export function triggerPlayerFacePop(scale = 1.1) {
     player.hitScale = Math.max(player.hitScale, scale);
}

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
          minScore: 450,
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

// NOTE: PLAYER LEVEL SCALE
// Level 5 makes the player 10% larger.
// This affects BOTH the drawn icon size and the collision radius.
export function getPlayerLevelScale() {
     const level = getCurrentLevelNumber();

     if (level >= 5) {
          return 1.1;
     }

     return 1;
}

// APPLY PLAYER LEVEL SCALE
// This keeps size/radius changes centralized instead of scattering them through draw/collision code.
// Newbie tip:
// - player.size controls how big the emoji LOOKS
// - player.radius controls how big the hitbox/collision area IS
export function applyPlayerLevelScale() {
     const levelScale = getPlayerLevelScale();

     player.size = playerBaseSize * levelScale;
     player.radius = playerBaseRadius * levelScale;

     // If the player grows near a wall, keep them safely inside the canvas.
     clampPlayerToCanvas();
}

// ==================================================
// PLAYER MOVEMENT
// ==================================================

export function resetPlayerPosition() {
     player.x = miniGameWidth / 2;
     player.y = miniGameHeight * 0.75; // NOTE: How far down y player should populate.
     player.size = playerBaseSize;
     player.radius = playerBaseRadius;
     player.sparkleFaceTimer = 0;
     player.hitScale = 1;
     player.lowHealthPulseTime = 0;
     playerTrail.length = 0;
     syncPlayerHealthState();
}

export function clampPlayerToCanvas() {
     const edgePadding = 3;

     player.x = Math.max(
          player.radius + edgePadding,
          Math.min(miniGameWidth - player.radius - edgePadding, player.x)
     );

     player.y = Math.max(
          player.radius + edgePadding,
          Math.min(miniGameHeight - player.radius - edgePadding, player.y)
     );
}

function movePlayerTowardTouchTarget() {
     const target = touchControls.touchMoveTarget;

     if (!target?.isActive) {
          return false;
     }

     const dx = target.x - player.x;
     const dy = target.y - player.y;
     const distance = Math.hypot(dx, dy);

     if (distance < 0.5) {
          return true;
     }

     const reverseMultiplier = isEffectActive("daze") ? -1 : 1;
     const step = Math.min(player.speed * getPlayerMovementMultiplier(), distance);

     player.x += (dx / distance) * step * reverseMultiplier;
     player.y += (dy / distance) * step * reverseMultiplier;

     return true;
}

function movePlayerFromKeyboard() {
     let dx = 0;
     let dy = 0;

     if (keys["a"] || keys["arrowleft"]) {
          dx -= 1;
     }

     if (keys["d"] || keys["arrowright"]) {
          dx += 1;
     }

     if (keys["w"] || keys["arrowup"]) {
          dy -= 1;
     }

     if (keys["s"] || keys["arrowdown"]) {
          dy += 1;
     }

     if (dx === 0 && dy === 0) {
          return;
     }

     // Normalize diagonal movement so moving at an angle is not faster.
     const length = Math.hypot(dx, dy);
     const reverseMultiplier = isEffectActive("daze") ? -1 : 1;
     const speed = player.speed * getPlayerMovementMultiplier();

     player.x += (dx / length) * speed * reverseMultiplier;
     player.y += (dy / length) * speed * reverseMultiplier;
}

export function updatePlayer() {
     const previousX = player.x;
     const previousY = player.y;

     if (!movePlayerTowardTouchTarget()) {
          movePlayerFromKeyboard();
     }

     clampPlayerToCanvas();

     if (player.x !== previousX || player.y !== previousY) {
          createPlayerTrail(
               previousX,
               previousY + playerTrailAnchorYOffset,
               player.x,
               player.y + playerTrailAnchorYOffset
          );
     }
}

export function updatePlayerFaceState() {
     // NOTE: LEVEL SIZE SHOULD STILL APPLY WHILE PAUSED
     // Pause changes the face to neutral, but size/radius still reflect current level.
     applyPlayerLevelScale();

     if (gamePaused) {
          player.char = playerFaces.neutral;
          player.hitScale = 1;
          return;
     }

     if (player.sparkleFaceTimer > 0) {
          player.sparkleFaceTimer -= 1;
     }

     if (player.sparkleFaceTimer <= 0) {
          refreshPlayerFaceFromHealth();
     }

     if (player.hitScale > 1) {
          player.hitScale += (1 - player.hitScale) * 0.18;

          if (Math.abs(player.hitScale - 1) < 0.01) {
               player.hitScale = 1;
          }
     }
}

export function drawPlayer() {
     if (!miniGameCtx) {
          return;
     }

     miniGameCtx.save();

     const drawSize = player.size * player.hitScale;

     miniGameCtx.font = `${drawSize}px Arial, Helvetica, sans-serif`;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.fillStyle = "#ffffff";

     let playerYOffset = 0;

     if (player.char === playerFaces.smile) {
          playerYOffset = 3;
     }

     miniGameCtx.fillText(player.char, player.x, player.y + playerYOffset);
     miniGameCtx.restore();
}

// ==================================================
// NOTE: SPARKLES
// ==================================================

export const sparkleChars = ["✦", "✧"];

export function createSparkle() {
     const x = Math.random() * (miniGameWidth - 20) + 10;

     sparkles.push({
          x,
          baseX: x,
          y: -20,
          speed: 0.25 + Math.random() * 0.5,
          size: randomNumber(getGameParticleSizeMin(), getGameParticleSizeMax()),
          char: randomItem(sparkleChars),
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

// ==================================================
// NOTE: EFFECT PICKUPS
// ==================================================

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

function maybeCreateEffectPickupsFromSparkleSpawn() {
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

          // Some icon glyphs are visually smaller/larger than their font box suggests.
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
