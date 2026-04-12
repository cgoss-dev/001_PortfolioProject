// NOTE: ENTITIES
// Combines player, sparkles, obstacles, and collision bursts in one file.

// NOTE: IMPORTS

import {
     miniGameCtx,
     miniGameWidth,
     miniGameHeight,
     player,
     keys,
     touchControls,
     playerHealth,
     maxPlayerHealth,
     sparkleScore,
     sparkleHealProgress,
     sparkles,
     obstacles,
     collisionBursts,
     sparkleSpawnTimer,
     obstacleSpawnTimer,
     gameSparkleColorEngine,

     setSparkleSpawnTimer,
     setObstacleSpawnTimer,
     setSparkleHealProgress,
     setSparkleScore,
     setPlayerHealth,
     addSparkleHealProgress,
     addSparkleScore,
     addPlayerHealth,
     setGameSparkleColorEngine,

     randomItem,
     randomNumber,
     isCollidingWithSparkle
} from "../state.js";

import {
     sparkleSpawnDelay,
     sparkleSpawnCap,
     obstacleSpawnDelay,
     obstacleSpawnCap,
     createColorEngine,
     getRainbowPalette,
     getGameParticleSettings,
     getGlowSettings
} from "../theme.js";

import {
     syncPlayerHealthState,
     applyTemporaryPlayerFace
} from "../winloselevels.js";

// NOTE: PLAYER

export const playerFaces = {
     neutral: "🙂",
     sparkle: "😁",
     obstacle: "😫",
     maxHealth: "🤩",
     lowHealth: "😰",
     dead: "☠️"
};

export const playerBaseHealth = 3;
export const playerBaseSpeed = 2;
export const playerSpeedPerHeart = 0.5;

// NOTE: PLAYER HELPERS

export function getDefaultPlayerFace() {
     if (playerHealth <= 0) return playerFaces.dead;
     if (playerHealth === maxPlayerHealth) return playerFaces.maxHealth;
     if (playerHealth <= 2) return playerFaces.lowHealth;
     return playerFaces.neutral;
}

export function refreshPlayerFaceFromHealth() {
     player.char = getDefaultPlayerFace();
}

export function resetPlayerPosition() {
     player.x = miniGameWidth / 2;
     player.y = miniGameHeight / 2;
     refreshPlayerFaceFromHealth();
     player.sparkleFaceTimer = 0;
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
     let movedByKeyboard = false;

     if (keys["w"] || keys["arrowup"]) {
          player.y -= player.speed;
          movedByKeyboard = true;
     }

     if (keys["s"] || keys["arrowdown"]) {
          player.y += player.speed;
          movedByKeyboard = true;
     }

     if (keys["a"] || keys["arrowleft"]) {
          player.x -= player.speed;
          movedByKeyboard = true;
     }

     if (keys["d"] || keys["arrowright"]) {
          player.x += player.speed;
          movedByKeyboard = true;
     }

     if (!movedByKeyboard) {
          const inputX = touchControls.joystick.inputX;
          const inputY = touchControls.joystick.inputY;

          if (inputX !== 0 || inputY !== 0) {
               player.x += inputX * player.speed;
               player.y += inputY * player.speed;
          }
     }

     clampPlayerToCanvas();
}

export function updatePlayerFaceState() {
     if (player.sparkleFaceTimer > 0) {
          player.sparkleFaceTimer -= 1;
     }

     if (player.sparkleFaceTimer <= 0) {
          refreshPlayerFaceFromHealth();
     }
}

export function drawPlayer() {
     if (!miniGameCtx) {
          return;
     }

     miniGameCtx.save();
     miniGameCtx.font = `${player.size}px Arial, Helvetica, sans-serif`;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.fillStyle = "#ffffff";

     let playerYOffset = 0;
     if (player.char === playerFaces.neutral) {
          playerYOffset = 3;
     }

     miniGameCtx.fillText(player.char, player.x, player.y + playerYOffset);
     miniGameCtx.restore();
}

// NOTE: SPARKLES

export const sparkleChars = ["✦", "✧"];

export function createSparkle() {
     if (!gameSparkleColorEngine) {
          setGameSparkleColorEngine(createColorEngine(getRainbowPalette()));
     }

     const settings = getGameParticleSettings();
     const x = Math.random() * (miniGameWidth - 20) + 10;
     const nextSparkleColor = gameSparkleColorEngine.next() || "#ffffff";

     sparkles.push({
          x,
          baseX: x,
          y: -20,
          speed: 0.25 + Math.random() * 0.5,
          size: randomNumber(settings.particleSizeMin, settings.particleSizeMax),
          char: randomItem(sparkleChars),
          color: nextSparkleColor,
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.02 + Math.random() * 0.03,
          wobbleAmount: 5 + Math.random() * 10
     });
}

export function updateSparkleSpawns() {
     const nextSparkleSpawnTimer = sparkleSpawnTimer + 1;
     setSparkleSpawnTimer(nextSparkleSpawnTimer);

     if (nextSparkleSpawnTimer >= sparkleSpawnDelay) {
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

               while (sparkleHealProgress >= 10 && playerHealth < maxPlayerHealth) {
                    setSparkleHealProgress(sparkleHealProgress - 10);
                    addPlayerHealth(1);
               }

               syncPlayerHealthState();
               applyTemporaryPlayerFace(playerFaces.sparkle, 60);
          }
     }
}

export function drawSparkles() {
     if (!miniGameCtx) {
          return;
     }

     const glowSettings = getGlowSettings();

     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";

     for (let i = 0; i < sparkles.length; i += 1) {
          const sparkle = sparkles[i];

          miniGameCtx.save();
          miniGameCtx.font = `${Math.max(16, sparkle.size)}px Arial, Helvetica, sans-serif`;
          miniGameCtx.fillStyle = sparkle.color;
          miniGameCtx.shadowColor = sparkle.color;
          miniGameCtx.shadowBlur = glowSettings.gameParticleBlur;

          miniGameCtx.globalAlpha = 0.95;
          miniGameCtx.fillText(sparkle.char, sparkle.x, sparkle.y);

          miniGameCtx.shadowBlur = 0;
          miniGameCtx.globalAlpha = 1;
          miniGameCtx.fillText(sparkle.char, sparkle.x, sparkle.y);

          miniGameCtx.restore();
     }
}

// NOTE: OBSTACLES

export const obstacleTypes = [
     { name: "affectSize", char: "☢\uFE0E", effect: ["playerGrow", "playerShrink"], penalty: 1 },
     { name: "affectSpeed", char: "⚡\uFE0E", effect: ["playerSlow", "objectSlow"], penalty: 1 },
     { name: "affectType", char: "⚠\uFE0E", effect: ["swapSparkleObjects"], penalty: 1 }
];

export function createObstacle() {
     const type = randomItem(obstacleTypes);
     const settings = getGameParticleSettings();

     if (!gameSparkleColorEngine) {
          setGameSparkleColorEngine(createColorEngine(getRainbowPalette()));
     }

     const x = Math.random() * (miniGameWidth - 20) + 10;
     const nextObstacleColor = gameSparkleColorEngine.next() || "#ffffff";

     obstacles.push({
          x,
          baseX: x,
          y: -20,
          speed: 0.5 + Math.random() * 0.7,
          size: randomNumber(settings.particleSizeMin, settings.particleSizeMax),
          char: type.char,
          type,
          color: nextObstacleColor,
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.02 + Math.random() * 0.03,
          wobbleAmount: 5 + Math.random() * 10
     });
}

export function updateObstacleSpawns() {
     const nextObstacleSpawnTimer = obstacleSpawnTimer + 1;
     setObstacleSpawnTimer(nextObstacleSpawnTimer);

     if (nextObstacleSpawnTimer >= obstacleSpawnDelay) {
          if (obstacles.length < obstacleSpawnCap) {
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

               addSparkleScore(-obstacle.type.penalty);
               setSparkleScore(Math.max(0, sparkleScore));
               setPlayerHealth(Math.max(0, playerHealth - 1));

               syncPlayerHealthState();
               applyTemporaryPlayerFace(playerFaces.obstacle, 30);
          }
     }
}

export function drawObstacles() {
     if (!miniGameCtx) {
          return;
     }

     const glowSettings = getGlowSettings();

     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";

     for (let i = 0; i < obstacles.length; i += 1) {
          const obstacle = obstacles[i];

          miniGameCtx.save();
          miniGameCtx.font = `${Math.max(18, obstacle.size)}px Arial, Helvetica, sans-serif`;
          miniGameCtx.fillStyle = obstacle.color;
          miniGameCtx.shadowColor = obstacle.color;
          miniGameCtx.shadowBlur = glowSettings.gameParticleBlur;

          miniGameCtx.globalAlpha = 0.95;
          miniGameCtx.fillText(obstacle.char, obstacle.x, obstacle.y);

          miniGameCtx.shadowBlur = 0;
          miniGameCtx.globalAlpha = 1;
          miniGameCtx.fillText(obstacle.char, obstacle.x, obstacle.y);

          miniGameCtx.restore();
     }
}

// NOTE: COLLISION BURSTS

export const burstChars = ["✦", "✧", "·", "•"];

export function createCollisionBurst(x, y, color, burstType) {
     const settings = getGameParticleSettings();
     const particleCount = settings.burstParticleCount;

     for (let i = 0; i < particleCount; i += 1) {
          const angle = randomNumber(0, Math.PI * 2);
          const speed = burstType === "obstacle"
               ? randomNumber(1.1, 2.6)
               : randomNumber(0.7, 2.1);

          collisionBursts.push({
               x,
               y,
               dx: Math.cos(angle) * speed,
               dy: Math.sin(angle) * speed,
               life: randomNumber(18, 34),
               maxLife: 34,
               size: randomNumber(10, 18),
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

     const glowSettings = getGlowSettings();

     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";

     for (let i = 0; i < collisionBursts.length; i += 1) {
          const burst = collisionBursts[i];
          const lifeRatio = burst.life / burst.maxLife;
          const sizeMultiplier = 0.7 + ((1 - lifeRatio) * 0.6);
          const burstSize = burst.size * sizeMultiplier;

          miniGameCtx.save();
          miniGameCtx.font = `${burstSize}px Arial, Helvetica, sans-serif`;
          miniGameCtx.fillStyle = burst.color;
          miniGameCtx.shadowColor = burst.color;
          miniGameCtx.shadowBlur = glowSettings.gameParticleBlur * burst.glowBoost * lifeRatio;

          miniGameCtx.globalAlpha = Math.max(0, lifeRatio * 0.95);
          miniGameCtx.fillText(burst.char, burst.x, burst.y);

          miniGameCtx.shadowBlur = 0;
          miniGameCtx.globalAlpha = Math.max(0, lifeRatio * 0.8);
          miniGameCtx.fillText(burst.char, burst.x, burst.y);

          miniGameCtx.restore();
     }
}