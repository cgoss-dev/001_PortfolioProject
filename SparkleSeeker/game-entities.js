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
     pointerInput,
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
     getSparkleSettings
} from "./game-theme.js";
// These helpers read theme values from CSS and build the shared color engine.
// They live in game-theme.js so the game modules do not have to rely on script.js globals.

// NOTE: PLAYER

export function resetPlayerPosition() {
     player.x = miniGameWidth / 2;
     player.y = miniGameHeight / 2;
     // Use visible canvas size here, not the raw internal canvas size.
     // Keeps player centered where the user actually sees the canvas.
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
     // Clamp against the visible game area so the player stays inside the on-screen canvas.
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

     if (!movedByKeyboard && pointerInput.active) {
          const dx = pointerInput.x - player.x;
          const dy = pointerInput.y - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 4) {
               player.x += (dx / distance) * player.speed;
               player.y += (dy / distance) * player.speed;
          }
     }

     clampPlayerToCanvas();
}
// Added mouseclick/touchscreen recognition.

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
     const burstCount = burstType === "obstacle" ? 12 : 8;
     const burstSizeMin = burstType === "obstacle" ? 16 : 12;
     const burstSizeMax = burstType === "obstacle" ? 28 : 20;
     const burstSpeedMin = burstType === "obstacle" ? 1.2 : 0.8;
     const burstSpeedMax = burstType === "obstacle" ? 3.2 : 2.1;
     const burstLifeMin = burstType === "obstacle" ? 24 : 18;
     const burstLifeMax = burstType === "obstacle" ? 40 : 28;

     for (let i = 0; i < burstCount; i += 1) {
          const angle = (Math.PI * 2 * i) / burstCount + (Math.random() * 0.5);
          const speed = randomNumber(burstSpeedMin, burstSpeedMax);
          const life = Math.floor(randomNumber(burstLifeMin, burstLifeMax));

          collisionBursts.push({
               x: x,
               y: y,
               dx: Math.cos(angle) * speed,
               dy: Math.sin(angle) * speed,
               size: randomNumber(burstSizeMin, burstSizeMax),
               char: randomItem(burstChars),
               color: color,
               life: life,
               maxLife: life,
               glowBoost: burstType === "obstacle" ? 2 : 1.4
          });
     }

     collisionBursts.push({
          x: x,
          y: y,
          dx: 0,
          dy: 0,
          size: burstType === "obstacle" ? 72 : 56,
          char: "✦",
          color: color,
          life: burstType === "obstacle" ? 12 : 10,
          maxLife: burstType === "obstacle" ? 12 : 10,
          glowBoost: burstType === "obstacle" ? 3 : 2
     });
     // Add one larger centered glow pop so the collision feels more punchy.
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
     // Safety fallback: if engine somehow was not created yet, build it here instead of crashing.
     // Pass the palette FUNCTION, same pattern the updated core script uses.

     const sparkleSettings = getSparkleSettings();
     // Pulls the same sparkle size settings the background particle system uses.
     // Keeps both systems reading from the same control center.

     const x = Math.random() * (miniGameWidth - 20) + 10;
     // Spawn across the visible canvas width instead of the raw internal width.

     const nextSparkleColor = gameSparkleColorEngine.next() || "#ffffff";
     // Ask the shared color engine for the next color.
     // Fallback keeps sparkles visible if the palette ever fails.

     sparkles.push({
          x: x,
          baseX: x,
          y: -20,
          speed: 0.25 + Math.random() * 0.5,
          size: randomNumber(sparkleSettings.sizeMin, sparkleSettings.sizeMax),
          // This now matches the same size range logic used by the background sparkles.
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
          // Remove sparkles when they move below the visible canvas height.
     }
}

export function collectSparkles() {
     for (let i = sparkles.length - 1; i >= 0; i -= 1) {
          const sparkle = sparkles[i];

          if (isCollidingWithSparkle(player, sparkle)) {
               createCollisionBurst(sparkle.x, sparkle.y, sparkle.color, "sparkle");

               sparkles.splice(i, 1);
               // Remove collected sparkle.

               addSparkleScore(1);
               // Add 1 point for each sparkle collected.

               addSparkleHealProgress(1);
               // Count sparkles toward the next heart refill.

               while (sparkleHealProgress >= 10 && playerHealth < maxPlayerHealth) {
                    setSparkleHealProgress(sparkleHealProgress - 10);
                    addPlayerHealth(1);
               }
               // Every 10 sparkles restores 1 heart, up to the max.

               syncPlayerHealthState();
               applyTemporaryPlayerFace(playerFaces.sparkle, 60);
               // Switch player face to the happy sparkle face on collection unless a health-state face should override it.
          }
     }
}

// NOTE: OBSTACLES

export function createObstacle() {
     const type = randomItem(obstacleTypes);
     const sparkleSettings = getSparkleSettings();

     if (!gameSparkleColorEngine) {
          setGameSparkleColorEngine(createColorEngine(getRainbowPalette));
     }
     // Same safety fallback as sparkles.
     // This protects obstacle spawning if the shared engine was somehow not ready yet.

     const x = Math.random() * (miniGameWidth - 20) + 10;
     // Spawn across the visible canvas width instead of the raw internal width.

     const nextObstacleColor = gameSparkleColorEngine.next() || "#ffffff";
     // Use the SAME shared color engine as the collectible sparkles.

     obstacles.push({
          x: x,
          baseX: x,
          y: -20,
          speed: 0.5 + Math.random() * 0.7,
          size: randomNumber(sparkleSettings.sizeMin, sparkleSettings.sizeMax),
          char: type.char,
          type: type,
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
          // Remove obstacles when they move below the visible canvas height.
     }
}

export function hitObstacles() {
     for (let i = obstacles.length - 1; i >= 0; i -= 1) {
          const obstacle = obstacles[i];

          if (isCollidingWithSparkle(player, obstacle)) {
               createCollisionBurst(obstacle.x, obstacle.y, obstacle.color, "obstacle");

               obstacles.splice(i, 1);
               // Remove obstacle on hit.

               addSparkleScore(-obstacle.type.penalty);
               setSparkleScore(Math.max(0, sparkleScore));
               // Negative points for hitting an obstacle, but never below zero.
               // We subtract first, then clamp the total score back up to zero if needed.

               setPlayerHealth(Math.max(0, playerHealth - 1));
               // Remove health, but do not allow it to go below zero.

               syncPlayerHealthState();
               applyTemporaryPlayerFace(playerFaces.obstacle, 30);
               // Switch player face to the hurt face on collision unless a health-state face should override it.
          }
     }
}