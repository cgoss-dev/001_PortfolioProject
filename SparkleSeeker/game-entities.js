// NOTE: GAME ENTITIES
// This file handles the moving / changing "things" in the game, including:
// - player movement
// - sparkle spawning / movement / collection
// - obstacle spawning / movement / hits
// - collision burst effects

import {
     miniGameWidth,
     miniGameHeight,
     player,
     playerFaces,
     playerHealth,
     maxPlayerHealth,
     keys,
     touchControls,
     sparkles,
     obstacles,
     collisionBursts,
     sparkleChars,
     burstChars,
     obstacleTypes,
     sparkleSpawnTimer,
     sparkleSpawnDelay,
     sparkleSpawnCap,
     obstacleSpawnTimer,
     obstacleSpawnDelay,
     obstacleSpawnCap,
     sparkleHealProgress,
     sparkleScore,
     gameSparkleColorEngine,
     randomItem,
     randomNumber,
     isCollidingWithSparkle,
     syncPlayerHealthState,
     refreshPlayerStateFace,
     applyTemporaryPlayerFace,
     setSparkleSpawnTimer,
     setObstacleSpawnTimer,
     setSparkleHealProgress,
     addSparkleHealProgress,
     addSparkleScore,
     setSparkleScore,
     setPlayerHealth,
     addPlayerHealth,
     setGameSparkleColorEngine
} from "./game-core.js";

import {
     createColorEngine,
     getRainbowPalette,
     getGameParticleSettings
} from "./game-theme.js";

// NOTE: PLAYER

export function resetPlayerPosition() {
     player.x = miniGameWidth / 2;
     player.y = miniGameHeight / 2;
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

     // KEYBOARD INPUT
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

     // JOYSTICK INPUT (PRIMARY TOUCH CONTROL)
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
          refreshPlayerStateFace();
     }
}

// NOTE: COLLISION BURSTS

export function createCollisionBurst(x, y, color, burstType) {
     const settings = getGameParticleSettings();
     const isObstacle = burstType === "obstacle";

     const count = Math.floor(
          settings.burstParticleCount *
          (isObstacle ? settings.obstacleBurstCountMultiplier : settings.sparkleBurstCountMultiplier)
     );

     const sizeMin =
          settings.burstParticleSizeMin *
          (isObstacle ? settings.obstacleBurstSizeMultiplier : settings.sparkleBurstSizeMultiplier);

     const sizeMax =
          settings.burstParticleSizeMax *
          (isObstacle ? settings.obstacleBurstSizeMultiplier : settings.sparkleBurstSizeMultiplier);

     const speedMin =
          settings.burstParticleSpeedMin *
          (isObstacle ? settings.obstacleBurstSpeedMultiplier : settings.sparkleBurstSpeedMultiplier);

     const speedMax =
          settings.burstParticleSpeedMax *
          (isObstacle ? settings.obstacleBurstSpeedMultiplier : settings.sparkleBurstSpeedMultiplier);

     const lifeMin =
          settings.burstParticleLifeMin *
          (isObstacle ? settings.obstacleBurstLifeMultiplier : settings.sparkleBurstLifeMultiplier);

     const lifeMax =
          settings.burstParticleLifeMax *
          (isObstacle ? settings.obstacleBurstLifeMultiplier : settings.sparkleBurstLifeMultiplier);

     for (let i = 0; i < count; i += 1) {
          const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.5);
          const speed = randomNumber(speedMin, speedMax);
          const life = Math.floor(randomNumber(lifeMin, lifeMax));

          collisionBursts.push({
               x,
               y,
               dx: Math.cos(angle) * speed,
               dy: Math.sin(angle) * speed,
               size: randomNumber(sizeMin, sizeMax),
               char: randomItem(burstChars),
               color,
               life,
               maxLife: life,
               glowBoost: isObstacle ? 2 : 1.4
          });
     }

     collisionBursts.push({
          x,
          y,
          dx: 0,
          dy: 0,
          size:
               settings.burstParticleCenterSize *
               (isObstacle
                    ? settings.obstacleBurstCenterSizeMultiplier
                    : settings.sparkleBurstCenterSizeMultiplier),
          char: "✦",
          color,
          life: isObstacle ? 12 : 10,
          maxLife: isObstacle ? 12 : 10,
          glowBoost: isObstacle ? 3 : 2
     });
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

// NOTE: SPARKLES

export function createSparkle() {
     if (!gameSparkleColorEngine) {
          setGameSparkleColorEngine(createColorEngine(getRainbowPalette));
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

// NOTE: OBSTACLES

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