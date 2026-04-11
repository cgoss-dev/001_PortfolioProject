// NOTE: COLLISION BURST SYSTEM
// Handles the little burst particles that appear when sparkles or obstacles are hit.

import {
     miniGameCtx,
     collisionBursts,
     randomItem,
     randomNumber
} from "../state.js";

import {
     getGameParticleSettings,
     getGlowSettings
} from "../theme.js";

export const burstChars = ["✦", "✧", "·", "•"];

// NOTE: CREATE BURST

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

     // NOTE:
     // This is the bigger "center pop" that helps collisions feel punchier.
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

// NOTE: UPDATE BURSTS

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

// NOTE: DRAW BURSTS

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

          miniGameCtx.globalAlpha = Math.max(0, lifeRatio * 0.8);
          miniGameCtx.shadowBlur = 0;
          miniGameCtx.fillText(burst.char, burst.x, burst.y);

          miniGameCtx.restore();
     }
}