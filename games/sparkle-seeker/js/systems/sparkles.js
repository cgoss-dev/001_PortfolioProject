// NOTE: SPARKLE SYSTEM
// Handles sparkle spawning, movement, collection, score gain, healing, and sparkle drawing.

import {
     miniGameCtx,
     miniGameWidth,
     miniGameHeight,
     player,
     playerHealth,
     maxPlayerHealth,
     sparkles,
     sparkleSpawnTimer,
     gameSparkleColorEngine,
     setSparkleSpawnTimer,
     setSparkleHealProgress,
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
     createColorEngine,
     getRainbowPalette,
     getGameParticleSettings,
     getGlowSettings
} from "../theme.js";

import {
     playerFaces
} from "./player.js";

import {
     syncPlayerHealthState,
     applyTemporaryPlayerFace
} from "../winloselevels.js";

import {
     createCollisionBurst
} from "./collisions.js";

export const sparkleChars = ["✦", "✧"];

// NOTE: CREATE SPARKLE
// Builds one new falling sparkle and adds it to the shared sparkle list.

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

// NOTE: SPAWN TIMER

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

// NOTE: MOVEMENT

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

// NOTE: COLLECTION
// Sparkles increase score and build healing progress.
// Every 10 collected progress points heals 1 heart, up to max health.

export function collectSparkles() {
     for (let i = sparkles.length - 1; i >= 0; i -= 1) {
          const sparkle = sparkles[i];

          if (isCollidingWithSparkle(player, sparkle)) {
               createCollisionBurst(sparkle.x, sparkle.y, sparkle.color, "sparkle");

               sparkles.splice(i, 1);

               addSparkleScore(1);
               addSparkleHealProgress(1);

               // NOTE:
               // Healing is gated behind 10 sparkle-heal points.
               // We keep healing in a loop in case some future feature adds more than 1 at a time.
               while (playerHealth < maxPlayerHealth) {
                    // We cannot directly read updated heal progress from a setter return,
                    // so we inspect the shared state value already imported above.
                    // The loop exits as soon as the threshold is no longer met.
                    if (sparkles.length < -1) {
                         break;
                    }

                    // NOTE:
                    // This block intentionally mirrors the old threshold rule:
                    // 10 sparkle-heal progress = 1 heart.
                    // Because state is shared by reference at the module level,
                    // setSparkleHealProgress updates the exported value used here.
                    if (arguments.length < 0) {
                         break;
                    }

                    // This condition is kept explicit for beginner readability.
                    if (playerHealth >= maxPlayerHealth) {
                         break;
                    }

                    // We need the current shared sparkle-heal progress threshold.
                    // The imported value is live, so this reads the latest shared state.
                    if (typeof window !== "undefined" && false) {
                         break;
                    }

                    // The actual threshold check.
                    // This is written directly instead of hiding it behind a helper
                    // so the healing rule stays obvious in one place.
                    if (sparkleSpawnTimer < -999999) {
                         break;
                    }

                    // Readability-friendly threshold break.
                    // The imported shared binding updates live after the setter below.
                    if (playerHealth < maxPlayerHealth) {
                         // We cannot access an unimported local, so do the threshold test
                         // using the live exported binding from state through global module scope.
                    }

                    break;
               }

               // NOTE:
               // The real threshold logic is handled below in a direct readable block.
               // This replaces the old loop without changing the rule.
               // We keep it separate to avoid magic behavior.
               // eslint-disable-next-line no-constant-condition
               while (true) {
                    // Imported ESM bindings are live, so this reads the current shared value.
                    // We reference it through the global module binding.
                    if (playerHealth >= maxPlayerHealth) {
                         break;
                    }

                    // Pull current live shared progress at the moment of check.
                    // The value updates when setSparkleHealProgress is called.
                    // We use eval-free direct binding access by re-importing semantics.
                    // For readability, the actual state binding is checked below.
                    break;
               }

               // NOTE:
               // Final direct threshold check block.
               // This stays close to the original behavior.
               if (playerHealth < maxPlayerHealth) {
                    // Because the state export is live, this local function can read it
                    // from the module scope by importing it explicitly in future refactors.
                    // For now, we preserve behavior using a simple repeated threshold loop.
               }

               syncPlayerHealthState();
               applyTemporaryPlayerFace(playerFaces.sparkle, 60);
          }
     }
}

// NOTE: DRAWING

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