// NOTE: SPARKLE SYSTEM
// Handles sparkle spawning, movement, collection, score gain, and healing.

import {
     miniGameWidth,
     miniGameHeight,
     player,
     playerHealth,
     maxPlayerHealth,
     sparkles,
     sparkleSpawnTimer,
     sparkleSpawnDelay,
     sparkleSpawnCap,
     sparkleHealProgress,
     sparkleScore,
     gameSparkleColorEngine,
     sparkleChars,
     setSparkleSpawnTimer,
     setSparkleHealProgress,
     addSparkleHealProgress,
     addSparkleScore,
     setSparkleScore,
     setPlayerHealth,
     addPlayerHealth,
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
} from "../winlose.js";

import {
     createCollisionBurst
} from "./collisions.js";

export const sparkleChars = ["✦", "✧"];

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

          miniGameCtx.font = `${sparkle.size}px Arial, Helvetica, sans-serif`;
          miniGameCtx.fillStyle = sparkle.color;
          miniGameCtx.shadowBlur = glowSettings.gameParticleBlur * 1.2;
          miniGameCtx.shadowColor = sparkle.color;

          miniGameCtx.globalAlpha = 0.9;
          miniGameCtx.fillText(sparkle.char, sparkle.x, sparkle.y);

          miniGameCtx.globalAlpha = 1;
          miniGameCtx.shadowBlur = 0;
          miniGameCtx.fillText(sparkle.char, sparkle.x, sparkle.y);

          miniGameCtx.restore();
     }
}

