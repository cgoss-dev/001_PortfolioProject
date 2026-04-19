// NOTE: ENTITIES
// This file combines:
// - player logic
// - sparkle logic
// - obstacle logic
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
     sparkles,
     obstacles,
     collisionBursts,
     sparkleSpawnTimer,
     obstacleSpawnTimer,

     setSparkleSpawnTimer,
     setObstacleSpawnTimer,
     setSparkleHealProgress,
     setSparkleScore,
     setPlayerHealth,
     addSparkleHealProgress,
     addSparkleScore,
     addPlayerHealth,

     randomItem,
     randomNumber,
     isCollidingWithSparkle
} from "./state.js";

const siteTheme = window.SiteTheme;

// ==================================================
// NOTE: GAMEPLAY BALANCE
// These are game rules, so they belong in JS.
// ==================================================

export const sparkleSpawnDelay = 30;
export const sparkleSpawnCap = 20;

export const obstacleSpawnDelay = 60;

// LEVEL RULES
// Score controls the current level here.
// Each level sets the obstacle cap that the spawner is allowed to reach.
// Keeping this in one place makes balancing much easier later.
export const levelRules = [
     { level: 1, minScore: 0, maxScore: 49, obstacleSpawnCap: 3 },
     { level: 2, minScore: 50, maxScore: 149, obstacleSpawnCap: 3 },
     { level: 3, minScore: 150, maxScore: 249, obstacleSpawnCap: 5 },
     { level: 4, minScore: 250, maxScore: 449, obstacleSpawnCap: 7 },
     { level: 5, minScore: 450, maxScore: 999, obstacleSpawnCap: 10 }
];

// WIN SCORE: 1000+ ends the run in a win state.
export const winScore = 1000;

export const collisionBurstParticleCount = 15;

// ==================================================
// PLAYER
// ==================================================

export const playerFaces = {
     neutral: "😐",
     smile: "🙂",
     sparkle: "😁",
     obstacle: "😫",
     maxHealth: "🤩",
     lowHealth: "😰",
     dead: "☠️"
};

export const playerBaseHealth = 3;
export const playerBaseSpeed = 3;
export const playerSpeedPerHeart = 1; // Adjust for if it's 5 hearts during testing or 10 hearts during final.

// NOTE: PLAYER BASE SIZE
// These are the player's normal visual/collision values.
// We keep them separate so level-based scaling can always return to the original size cleanly.
export const playerBaseSize = 64;
export const playerBaseRadius = 30;

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
// NOTE: PLAYER HEALTH / FACE HELPERS
// ==================================================

export function getDefaultPlayerFace() {
     if (playerHealth <= 0) return playerFaces.dead;
     if (playerHealth === maxPlayerHealth) return playerFaces.maxHealth;
     if (playerHealth <= 2) return playerFaces.lowHealth;
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
// Centralized collision scale effect for both sparkles and obstacles.
export function triggerPlayerFacePop(scale = 1.25) {
     player.hitScale = Math.max(player.hitScale, scale);
}

// NOTE: LEVEL LOOKUP
// This helper reads the current score and returns the matching level rule.
// The obstacle spawner uses this so it does not need hardcoded score checks.
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
          maxScore: winScore - 1,
          obstacleSpawnCap: 10
     };
}

// LEVEL NUMBER HELPER
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
     player.y = miniGameHeight / 2;
     player.size = playerBaseSize;
     player.radius = playerBaseRadius;
     player.sparkleFaceTimer = 0;
     player.hitScale = 1;
     player.lowHealthPulseTime = 0;
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

export function updatePlayer() {
     let dx = 0;
     let dy = 0;

     if (keys["w"] || keys["arrowup"]) {
          dy -= 1;
     }

     if (keys["s"] || keys["arrowdown"]) {
          dy += 1;
     }

     if (keys["a"] || keys["arrowleft"]) {
          dx -= 1;
     }

     if (keys["d"] || keys["arrowright"]) {
          dx += 1;
     }

     // ==================================================
     // TOUCH INPUT (FULL CANVAS MOVEMENT)
     // ==================================================

     if (touchControls.touchMoveTarget.isActive) {
          const targetX = touchControls.touchMoveTarget.x * miniGameWidth;
          const targetY = touchControls.touchMoveTarget.y * miniGameHeight;

          const tdx = targetX - player.x;
          const tdy = targetY - player.y;
          const distance = Math.hypot(tdx, tdy);

          if (distance > 4) { // REVIEW - FINETUNE TOUCH
               const dirX = tdx / distance;
               const dirY = tdy / distance;

               dx += dirX;
               dy += dirY;
          }
     }

     // ==================================================
     // NORMALIZE COMBINED INPUT (KEYBOARD + TOUCH)
     // ==================================================

     const magnitude = Math.hypot(dx, dy);

     if (magnitude > 0) {
          dx /= magnitude;
          dy /= magnitude;
     }

     player.x += dx * player.speed;
     player.y += dy * player.speed;

     clampPlayerToCanvas();
}

export function updatePlayerFaceState() {
     // NOTE: LEVEL SIZE SHOULD STILL APPLY WHILE PAUSED
     // Pause changes the face to 😐, but size/radius still reflect current level.
     applyPlayerLevelScale();

     // When paused, always show neutral face.
     if (gamePaused) {
          player.char = playerFaces.neutral;
          player.hitScale = 1;
          return;
     }

     // TEMPORARY FACE TIMER (sparkle / obstacle reactions)
     if (player.sparkleFaceTimer > 0) {
          player.sparkleFaceTimer -= 1;
     }

     if (player.sparkleFaceTimer <= 0) {
          refreshPlayerFaceFromHealth();
     }

     // HIT SCALE RECOVERY
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
          }

          setSparkleSpawnTimer(0);
     }
}

export function updateSparkles() {
     for (let i = sparkles.length - 1; i >= 0; i -= 1) {
          const sparkle = sparkles[i];

          sparkle.y += sparkle.speed;
          sparkle.wobbleOffset += sparkle.wobbleSpeed;
          sparkle.x = sparkle.baseX + Math.sin(sparkle.wobbleOffset) * sparkle.wobbleAmount;

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
// NOTE: OBSTACLES
// ==================================================

export const obstacleTypes = [
     { name: "affectSize", char: "☢\uFE0E", effect: ["playerGrow", "playerShrink"], penalty: 1 },
     { name: "affectSpeed", char: "⚡\uFE0E", effect: ["playerSlow", "objectSlow"], penalty: 1 },
     { name: "affectType", char: "⚠\uFE0E", effect: ["swapSparkleObjects"], penalty: 1 }
];

export function createObstacle() {
     const type = randomItem(obstacleTypes);
     const x = Math.random() * (miniGameWidth - 20) + 10;

     obstacles.push({
          x,
          baseX: x,
          y: -20,
          speed: 0.5 + Math.random() * 0.7,
          size: randomNumber(getGameParticleSizeMin() * 1.5, getGameParticleSizeMax() * 1.25),
          char: type.char,
          type,
          color: getNextSparkleColor(),
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.02 + Math.random() * 0.03,
          wobbleAmount: 5 + Math.random() * 10
     });
}

export function updateObstacleSpawns() {
     const nextObstacleSpawnTimer = obstacleSpawnTimer + 1;
     setObstacleSpawnTimer(nextObstacleSpawnTimer);

     const levelData = getCurrentLevelData();

     // LIGHT DIFFICULTY SCALING
     // As score rises, obstacles arrive a little sooner.
     // This affects timing, while levelData.obstacleSpawnCap affects crowd size.
     const difficultyBoost = Math.min(24, sparkleScore * 0.4);

     if (nextObstacleSpawnTimer >= obstacleSpawnDelay - difficultyBoost) {
          if (obstacles.length < levelData.obstacleSpawnCap) {
               createObstacle();
          }

          setObstacleSpawnTimer(0);
     }
}

export function updateObstacles() {
     for (let i = obstacles.length - 1; i >= 0; i -= 1) {
          const obstacle = obstacles[i];

          obstacle.y += obstacle.speed;
          obstacle.wobbleOffset += obstacle.wobbleSpeed;
          obstacle.x = obstacle.baseX + Math.sin(obstacle.wobbleOffset) * obstacle.wobbleAmount;

          if (obstacle.y > miniGameHeight + 30) {
               obstacles.splice(i, 1);
          }
     }
}

export function hitObstacles() {
     for (let i = obstacles.length - 1; i >= 0; i -= 1) {
          const obstacle = obstacles[i];

          if (isCollidingWithSparkle(player, obstacle)) {
               createCollisionBurst(obstacle.x, obstacle.y, obstacle.color, "obstacle");
               obstacles.splice(i, 1);

               setSparkleScore(Math.max(0, sparkleScore - obstacle.type.penalty));
               setPlayerHealth(Math.max(0, playerHealth - 1));

               syncPlayerHealthState();
               applyTemporaryPlayerFace(playerFaces.obstacle, 30);
               triggerPlayerFacePop(1.25);
          }
     }
}

export function drawObstacles() {
     if (!miniGameCtx) {
          return;
     }

     const glowBlur = getGameGlowBlur();

     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";

     for (let i = obstacles.length - 1; i >= 0; i -= 1) {
          const obstacle = obstacles[i];

          miniGameCtx.save();
          miniGameCtx.font = `${Math.max(20, obstacle.size)}px Arial, Helvetica, sans-serif`;
          miniGameCtx.fillStyle = obstacle.color;
          miniGameCtx.shadowColor = obstacle.color;
          miniGameCtx.shadowBlur = glowBlur;

          miniGameCtx.globalAlpha = 0.95;
          miniGameCtx.fillText(obstacle.char, obstacle.x, obstacle.y);

          miniGameCtx.shadowBlur = 0;
          miniGameCtx.globalAlpha = 1;
          miniGameCtx.fillText(obstacle.char, obstacle.x, obstacle.y);

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
          const speed = burstType === "obstacle"
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
               glowBoost: burstType === "obstacle" ? 1.25 : 1
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