// NOTE: 7 - PLAYER
// Player movement, face state, trail state, health-expression sync, and player drawing.
//
// Owned here:
// - player reset / position clamping
// - keyboard and touch movement handling
// - temporary face-expression changes
// - low-health visual pulse
// - player trail updates / drawing
// - player rendering
//
// NOT owned here:
// - input event binding
// - shared state storage
// - sparkle/effect spawning
// - menus / overlays / HUD
//
// Newbie note:
// - This file should answer "what is the player doing and how do they look?"
// - If code stores the shared player object, it belongs in `3_Vars.js`.
// - If code updates falling pickups or score, it belongs in `8_Particles.js`.

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
} from "./3_Vars.js";

import {
     touchArriveDistance,
     playerGlowBlurFallback,
     rainbowFallbackPalette
} from "./4_Config.js";

import {
     getCurrentLevelNumber
} from "./5_WinRulesConditions.js";

const siteTheme = window.SiteTheme;

// ==================================================
// NOTE: PLAYER
// ==================================================

export const playerFaces = {
     neutral: "😐",
     smile: "🙂",
     sparkle: "😁",
     harmful: "😫",
     maxHealth: "🤩",
     lowHealth: "😰",
     dead: "☠️",
     frozen: "🥶",
     dazed: "😵‍💫"
};

export const playerBaseHealth = 3;
export const playerBaseSpeed = 3;
export const playerSpeedPerHeart = 1;

export const playerBaseSize = 64;
export const playerBaseRadius = 30;

// ==================================================
// NOTE: TRAIL
// Short rainbow ribbon segments that follow actual movement.
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
// ==================================================

function getTrailGlowBlur() {
     return siteTheme?.getGlowSettings?.().gameParticleBlur ?? playerGlowBlurFallback;
}

function getRainbowPalette() {
     const cssPalette = [
          siteTheme?.getCssColor?.("--rainbow-red"),
          siteTheme?.getCssColor?.("--rainbow-orange"),
          siteTheme?.getCssColor?.("--rainbow-yellow"),
          siteTheme?.getCssColor?.("--rainbow-lime"),
          siteTheme?.getCssColor?.("--rainbow-green"),
          siteTheme?.getCssColor?.("--rainbow-mint"),
          siteTheme?.getCssColor?.("--rainbow-cyan"),
          siteTheme?.getCssColor?.("--rainbow-sky"),
          siteTheme?.getCssColor?.("--rainbow-blue"),
          siteTheme?.getCssColor?.("--rainbow-violet"),
          siteTheme?.getCssColor?.("--rainbow-magenta"),
          siteTheme?.getCssColor?.("--rainbow-rose")
     ].filter(Boolean);

     return cssPalette.length ? cssPalette : rainbowFallbackPalette;
}

// ==================================================
// COLOR ROTATION
// ==================================================

const trailColorEngine = {
     engine: null
};

function ensureTrailColorEngine() {
     if (!trailColorEngine.engine) {
          const createEngine = siteTheme?.createColorEngine;

          trailColorEngine.engine = createEngine
               ? createEngine(getRainbowPalette)
               : {
                    paletteIndex: 0,
                    next() {
                         const palette = getRainbowPalette();

                         if (!palette.length) {
                              return "#ffffff";
                         }

                         const color = palette[this.paletteIndex % palette.length];
                         this.paletteIndex += 1;
                         return color;
                    },
                    reset() {
                         this.paletteIndex = 0;
                    }
               };
     }
}

function getNextTrailColor() {
     ensureTrailColorEngine();
     return trailColorEngine.engine.next() || "#ffffff";
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
     const trailCount =
          Math.floor(Math.random() * (playerTrailCountMax - playerTrailCountMin + 1)) +
          playerTrailCountMin;

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
               color: getNextTrailColor(),
               life,
               maxLife: life,
               width
          });
     }
}

// ==================================================
// PLAYER HEALTH / FACE HELPERS
// ==================================================

export function getDefaultPlayerFace() {
     if (playerHealth <= 0) {
          return playerFaces.dead;
     }

     if (isEffectActive("freeze")) {
          return playerFaces.frozen;
     }

     if (isEffectActive("daze")) {
          return playerFaces.dazed;
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
          playerHealth <= 2 ||
          isEffectActive("freeze") ||
          isEffectActive("daze")
     ) {
          player.sparkleFaceTimer = 0;
          refreshPlayerFaceFromHealth();
          return;
     }

     player.char = face;
     player.sparkleFaceTimer = duration;
}

export function triggerPlayerFacePop(scale = 1.1) {
     player.hitScale = Math.max(player.hitScale, scale);
}

// ==================================================
// PLAYER LEVEL SCALE
// Level 5 makes the player 10% larger.
// ==================================================

export function getPlayerLevelScale() {
     return getCurrentLevelNumber() >= 5 ? 1.1 : 1;
}

export function applyPlayerLevelScale() {
     const levelScale = getPlayerLevelScale();

     player.size = playerBaseSize * levelScale;
     player.radius = playerBaseRadius * levelScale;
     clampPlayerToCanvas();
}

// ==================================================
// NOTE: MOVEMENT
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

     if (trailColorEngine.engine?.reset) {
          trailColorEngine.engine.reset();
     }

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

function movePlayerTowardPointerTarget() {
     const target = touchControls.touchMoveTarget;

     if (!target?.isActive) {
          return false;
     }

     const dx = target.x - player.x;
     const dy = target.y - player.y;
     const distance = Math.hypot(dx, dy);

     if (distance <= touchArriveDistance) {
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

     if (keys.a || keys.A || keys.ArrowLeft || keys.arrowleft) {
          dx -= 1;
     }

     if (keys.d || keys.D || keys.ArrowRight || keys.arrowright) {
          dx += 1;
     }

     if (keys.w || keys.W || keys.ArrowUp || keys.arrowup) {
          dy -= 1;
     }

     if (keys.s || keys.S || keys.ArrowDown || keys.arrowdown) {
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

     if (!movePlayerTowardPointerTarget()) {
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

     if (playerHealth <= 2) {
          player.lowHealthPulseTime += 0.14;
     } else {
          player.lowHealthPulseTime = 0;
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

// ==================================================
// DRAW
// ==================================================

export function drawPlayerTrail() {
     if (!miniGameCtx) {
          return;
     }

     const glowBlur = getTrailGlowBlur();

     for (let i = playerTrail.length - 1; i >= 0; i -= 1) {
          const trail = playerTrail[i];
          const lifeRatio = trail.life / trail.maxLife;

          miniGameCtx.save();
          miniGameCtx.globalAlpha = Math.max(0, lifeRatio * 0.75);
          miniGameCtx.strokeStyle = trail.color;
          miniGameCtx.shadowColor = trail.color;
          miniGameCtx.shadowBlur = glowBlur;
          miniGameCtx.lineWidth = Math.max(1, trail.width * lifeRatio);
          miniGameCtx.lineCap = "round";

          miniGameCtx.beginPath();
          miniGameCtx.moveTo(trail.fromX, trail.fromY);
          miniGameCtx.lineTo(trail.toX, trail.toY);
          miniGameCtx.stroke();

          miniGameCtx.restore();
     }
}

export function drawPlayer() {
     if (!miniGameCtx) {
          return;
     }

     miniGameCtx.save();

     const drawSize = player.size * (player.hitScale || 1);

     miniGameCtx.globalAlpha = 1;
     miniGameCtx.font = `${drawSize}px Arial, Helvetica, sans-serif`;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.fillStyle = "#ffffff";
     miniGameCtx.shadowColor = "transparent";
     miniGameCtx.shadowBlur = 0;

     let playerYOffset = 0;

     if (player.char === playerFaces.smile) {
          playerYOffset = 3;
     }

     miniGameCtx.fillText(player.char, player.x, player.y + playerYOffset);
     miniGameCtx.restore();
}
