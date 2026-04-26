// NOTE: ENTITIES / PLAYER
// Player-only logic extracted from entities.js.
//
// Owned here:
// - player movement
// - player face / health sync helpers
// - player level scale
// - player trail
// - player drawing

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

     isEffectActive
} from "./state.js";

import {
     getCurrentLevelNumber
} from "./win_rules_conditions.js";

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
export const playerBaseSpeed = 2;
export const playerSpeedPerHeart = 0.5;

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
export const playerTrailLifeMin = 16;

export const playerTrailWidthMax = 10;
export const playerTrailWidthMin = 2;

export const playerTrailOffsetMax = 25;
export const playerTrailOffsetMin = -25;

export const playerTrailLengthMax = 32;
export const playerTrailLengthMin = 8;

// Negative raises the ribbon anchor above the player center; positive lowers it.
export const playerTrailAnchorYOffset = -4;

const playerTrail = [];

// ==================================================
// SHARED VISUAL HELPERS
// Pull visual values from root helpers when possible.
// Keep safe fallbacks in case something is missing.
// ==================================================

const siteTheme = window.SiteTheme;

function getGameGlowBlur() {
     return siteTheme?.getGlowSettings?.().gameParticleBlur ?? 18;
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

function getPlayerMovementMultiplier() {
     if (isEffectActive("freeze")) {
          return 0;
     }

     return 1;
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
     const trailCount = Math.floor(Math.random() * (playerTrailCountMax - playerTrailCountMin + 1)) + playerTrailCountMin;

     for (let i = 0; i < trailCount; i += 1) {
          const life = Math.random() * (playerTrailLifeMax - playerTrailLifeMin) + playerTrailLifeMin;
          const width = Math.random() * (playerTrailWidthMax - playerTrailWidthMin) + playerTrailWidthMin;
          const offset = Math.random() * (playerTrailOffsetMax - playerTrailOffsetMin) + playerTrailOffsetMin;
          const length = Math.random() * (playerTrailLengthMax - playerTrailLengthMin) + playerTrailLengthMin;

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

// SHARED FACE POP
// Centralized collision scale effect for sparkles and effect pickups.
export function triggerPlayerFacePop(scale = 1.1) {
     player.hitScale = Math.max(player.hitScale, scale);
}

// PLAYER LEVEL SCALE
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
     player.y = miniGameHeight * 0.75;
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
