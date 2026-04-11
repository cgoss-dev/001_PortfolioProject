// NOTE: OBSTACLE SYSTEM
// Handles obstacle spawning, movement, collision penalties, and damage.

import {
     miniGameWidth,
     miniGameHeight,
     player,
     playerHealth,
     sparkleScore,
     obstacles,
     obstacleTypes,
     obstacleSpawnTimer,
     obstacleSpawnDelay,
     obstacleSpawnCap,
     gameSparkleColorEngine,
     setObstacleSpawnTimer,
     setSparkleScore,
     setPlayerHealth,
     addSparkleScore,
     setGameSparkleColorEngine,
     randomItem,
     randomNumber,
     isCollidingWithSparkle
} from "../state.js";

import {
     playerFaces,
     createColorEngine,
     getRainbowPalette,
     getGameParticleSettings
} from "../theme.js";

import {
     syncPlayerHealthState,
     applyTemporaryPlayerFace
} from "../winloselevels.js";

import {
     createCollisionBurst
} from "./collisions.js";

export const obstacleTypes = [
     { name: "affectSize", char: "☢\uFE0E", effect: ["playerGrow", "playerShrink"], penalty: 1 },
     { name: "affectSpeed", char: "⚡\uFE0E", effect: ["playerSlow", "objectSlow"], penalty: 1 },
     { name: "affectType", char: "⚠\uFE0E", effect: ["swapSparkleObjects"], penalty: 1 }
];

export function createObstacle() {
     const type = randomItem(obstacleTypes);
     const settings = getGameParticleSettings();

     if (!gameSparkleColorEngine) {
          setGameSparkleColorEngine(createColorEngine(getRainbowPalette));
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

          miniGameCtx.font = `${obstacle.size}px Arial, Helvetica, sans-serif`;
          miniGameCtx.fillStyle = obstacle.color;
          miniGameCtx.shadowColor = obstacle.color;
          miniGameCtx.shadowBlur = glowSettings.gameParticleBlur * 1.2;

          miniGameCtx.globalAlpha = 0.9;
          miniGameCtx.fillText(obstacle.char, obstacle.x, obstacle.y);

          miniGameCtx.globalAlpha = 1;
          miniGameCtx.shadowBlur = 0;
          miniGameCtx.fillText(obstacle.char, obstacle.x, obstacle.y);

          miniGameCtx.restore();
     }
}