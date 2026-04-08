// NOTE: GAME RENDER
// This file draws everything the player SEES.
// It does not handle input.
// It does not update gameplay logic.
// It only renders the current game state onto the canvas.

import {
     miniGameCtx,
     miniGameWidth,
     miniGameHeight,
     player,
     playerFaces,
     sparkleScore,
     playerHealth,
     maxPlayerHealth,
     gameButton,
     sparkles,
     obstacles,
     collisionBursts
} from "./game-core.js";

import {
     getPauseButtonLabel,
     updatePauseButtonBounds
} from "./game-input.js";

import {
     getGlowSettings
} from "./game-theme.js";
// 🔥 REQUIRED FIX
// This was missing before.
// Without this import, draw functions crash when trying to read glow settings.

// NOTE: PLAYER

export function drawPlayer() {
     if (!miniGameCtx) {
          return;
     }

     miniGameCtx.font = `${player.size}px Arial, Helvetica, sans-serif`;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.fillStyle = "#ffffff";

     let playerYOffset = 0;

     if (player.char === playerFaces.neutral) {
          playerYOffset = 3;
     }

     miniGameCtx.fillText(player.char, player.x, player.y + playerYOffset);
}

// NOTE: SCOREKEEPING

export function drawScore() {
     if (!miniGameCtx) {
          return;
     }

     miniGameCtx.save();

     const formattedScore = sparkleScore.toString().padStart(3, "0");

     miniGameCtx.font = '28px "Bungee", "Bungee Shade", cursive';
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = "#ffffff";
     miniGameCtx.shadowColor = "rgba(255, 255, 255, 0.35)";
     miniGameCtx.shadowBlur = 8;

     miniGameCtx.fillText(formattedScore, 16, 14);

     miniGameCtx.restore();
}

export function drawHealth() {
     if (!miniGameCtx) {
          return;
     }

     miniGameCtx.save();

     const filledHeart = "♥";
     const emptyHeart = "♡";

     const heartsPerRow = 5;

     let topRow = "";
     let bottomRow = "";

     for (let i = maxPlayerHealth - 1; i >= heartsPerRow; i -= 1) {
          topRow += (i < playerHealth) ? filledHeart : emptyHeart;
     }

     for (let i = heartsPerRow - 1; i >= 0; i -= 1) {
          bottomRow += (i < playerHealth) ? filledHeart : emptyHeart;
     }

     miniGameCtx.font = '26px "Noto Sans Mono", monospace';
     miniGameCtx.textAlign = "right";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = "#ea76cb";
     miniGameCtx.shadowColor = "#ea76cb";
     miniGameCtx.shadowBlur = 8;

     const healthX = miniGameWidth - 16;
     const healthY = 14;
     const rowGap = 24;

     miniGameCtx.fillText(topRow, healthX, healthY);
     miniGameCtx.fillText(bottomRow, healthX, healthY + rowGap);

     miniGameCtx.restore();
}

export function drawPauseButton() {
     if (!miniGameCtx) {
          return;
     }

     updatePauseButtonBounds();

     const label = getPauseButtonLabel();
     const pressOffsetY = gameButton.isPressed ? 3 : 0;
     const pressScale = gameButton.isPressed ? 0.96 : 1;

     const buttonCenterX = gameButton.x + (gameButton.width / 2);
     const buttonCenterY = gameButton.y + (gameButton.height / 2) + pressOffsetY;

     miniGameCtx.save();

     miniGameCtx.translate(buttonCenterX, buttonCenterY);
     miniGameCtx.scale(pressScale, pressScale);
     miniGameCtx.translate(-buttonCenterX, -buttonCenterY);

     miniGameCtx.fillStyle = gameButton.isPressed
          ? "rgba(255, 255, 255, 0.16)"
          : "rgba(255, 255, 255, 0.08)";

     miniGameCtx.strokeStyle = gameButton.isPressed
          ? "rgba(255, 255, 255, 0.55)"
          : "rgba(255, 255, 255, 0.35)";

     miniGameCtx.lineWidth = 2;

     miniGameCtx.shadowColor = gameButton.isPressed
          ? "rgba(255, 255, 255, 0.28)"
          : "rgba(255, 255, 255, 0.18)";

     miniGameCtx.shadowBlur = gameButton.isPressed ? 14 : 10;

     miniGameCtx.beginPath();
     miniGameCtx.roundRect(
          gameButton.x,
          gameButton.y + pressOffsetY,
          gameButton.width,
          gameButton.height,
          12
     );
     miniGameCtx.fill();
     miniGameCtx.stroke();

     miniGameCtx.font = '24px "Bungee", "Bungee Shade", cursive';
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.fillStyle = "#ffffff";

     miniGameCtx.shadowColor = gameButton.isPressed
          ? "rgba(255, 255, 255, 0.5)"
          : "rgba(255, 255, 255, 0.35)";

     miniGameCtx.shadowBlur = gameButton.isPressed ? 10 : 8;

     miniGameCtx.fillText(
          label,
          gameButton.x + (gameButton.width / 2),
          gameButton.y + (gameButton.height / 2) + 1 + pressOffsetY
     );

     miniGameCtx.restore();
}

// NOTE: COLLISION BURSTS

export function drawCollisionBursts() {
     if (!miniGameCtx) return;

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

// NOTE: SPARKLES

export function drawSparkles() {
     if (!miniGameCtx) return;

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

// NOTE: OBSTACLES

export function drawObstacles() {
     if (!miniGameCtx) return;

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

// NOTE: BACKGROUND

export function drawMiniGameBackground() {
     if (!miniGameCtx) return;

     miniGameCtx.clearRect(0, 0, miniGameWidth, miniGameHeight);
     miniGameCtx.fillStyle = "rgba(0, 0, 0, 0.75)";
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);
}

export function drawUiUnderlay() {
     if (!miniGameCtx) return;

     const centerX = miniGameWidth / 2;
     const centerY = miniGameHeight / 2 + miniGameHeight * 0.1;
     const distanceToCorner = Math.sqrt((centerX * centerX) + (centerY * centerY));

     const underlayGradient = miniGameCtx.createRadialGradient(
          centerX, centerY, distanceToCorner * 0.1,
          centerX, centerY, distanceToCorner
     );

     underlayGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
     underlayGradient.addColorStop(0.6, "rgba(255, 255, 255, 0)");
     underlayGradient.addColorStop(0.8, "rgba(255, 255, 255, 0.1)");
     underlayGradient.addColorStop(1, "rgba(255, 255, 255, 0.2)");

     miniGameCtx.save();
     miniGameCtx.fillStyle = underlayGradient;
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);
     miniGameCtx.restore();
}