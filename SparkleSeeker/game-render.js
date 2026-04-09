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
     sparkles,
     obstacles,
     collisionBursts,
     touchControls,
     gameStarted,
     gameMenuOpen,
     musicEnabled,
     soundEffectsEnabled
} from "./game-core.js";

import {
     getGlowSettings
} from "./game-theme.js";

// NOTE: PLAYER

export function drawPlayer() {
     if (!miniGameCtx || !gameStarted) {
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

     miniGameCtx.font = '32px "Bungee", "Bungee Shade", cursive';
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

     miniGameCtx.font = '20px "Noto Sans Mono", monospace';
     miniGameCtx.textAlign = "right";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = "#ea76cb";
     miniGameCtx.shadowColor = "#ea76cb";
     miniGameCtx.shadowBlur = 8;

     const healthX = miniGameWidth - 16;
     const healthY = 14;
     const rowGap = 14;

     miniGameCtx.fillText(topRow, healthX, healthY);
     miniGameCtx.fillText(bottomRow, healthX, healthY + rowGap);

     miniGameCtx.restore();
}

// NOTE: LEGACY PAUSE LABEL
// Kept as a no-op so core imports remain stable if reused later.

export function drawPauseButton() {
     return;
}

// NOTE: TOUCH CONTROLS

export function drawTouchJoystick() {
     if (!miniGameCtx) {
          return;
     }

     const joystick = touchControls.joystick;
     const glowSettings = getGlowSettings();

     const centerX = joystick.centerX;
     const centerY = joystick.centerY;
     const knobCenterX = centerX + joystick.knobX;
     const knobCenterY = centerY + joystick.knobY;

     miniGameCtx.save();

     miniGameCtx.globalAlpha = 0.9;
     miniGameCtx.fillStyle = "rgba(255, 255, 255, 0.05)";
     miniGameCtx.strokeStyle = joystick.isActive
          ? "rgba(255, 255, 255, 0.4)"
          : "rgba(255, 255, 255, 0.25)";
     miniGameCtx.lineWidth = 2;

     miniGameCtx.shadowColor = joystick.isActive
          ? "rgba(255, 255, 255, 0.3)"
          : "rgba(255, 255, 255, 0.18)";
     miniGameCtx.shadowBlur = joystick.isActive
          ? glowSettings.gameParticleBlur
          : glowSettings.gameParticleBlur * 0.75;

     miniGameCtx.beginPath();
     miniGameCtx.arc(centerX, centerY, joystick.baseRadius, 0, Math.PI * 2);
     miniGameCtx.fill();
     miniGameCtx.stroke();

     miniGameCtx.shadowBlur = 0;
     miniGameCtx.strokeStyle = "rgba(255, 255, 255, 0.18)";
     miniGameCtx.lineWidth = 2;
     miniGameCtx.lineCap = "round";

     const tickInset = joystick.baseRadius * 0.48;
     const tickOutset = joystick.baseRadius * 0.78;

     miniGameCtx.beginPath();
     miniGameCtx.moveTo(centerX, centerY - tickInset);
     miniGameCtx.lineTo(centerX, centerY - tickOutset);
     miniGameCtx.moveTo(centerX + tickInset, centerY);
     miniGameCtx.lineTo(centerX + tickOutset, centerY);
     miniGameCtx.moveTo(centerX, centerY + tickInset);
     miniGameCtx.lineTo(centerX, centerY + tickOutset);
     miniGameCtx.moveTo(centerX - tickInset, centerY);
     miniGameCtx.lineTo(centerX - tickOutset, centerY);
     miniGameCtx.stroke();

     miniGameCtx.restore();

     miniGameCtx.save();

     const pressScale = joystick.isActive ? 0.94 : 1;
     const thumbRadius = joystick.thumbRadius;

     miniGameCtx.translate(knobCenterX, knobCenterY);
     miniGameCtx.scale(pressScale, pressScale);
     miniGameCtx.translate(-knobCenterX, -knobCenterY);

     miniGameCtx.fillStyle = joystick.isActive
          ? "rgba(255, 255, 255, 0.42)"
          : "rgba(255, 255, 255, 0.24)";
     miniGameCtx.strokeStyle = joystick.isActive
          ? "rgba(255, 255, 255, 0.55)"
          : "rgba(255, 255, 255, 0.28)";
     miniGameCtx.lineWidth = 2;

     miniGameCtx.shadowColor = joystick.isActive
          ? "rgba(255, 255, 255, 0.34)"
          : "rgba(255, 255, 255, 0.2)";
     miniGameCtx.shadowBlur = joystick.isActive
          ? glowSettings.gameParticleBlur * 1.1
          : glowSettings.gameParticleBlur * 0.85;

     miniGameCtx.beginPath();
     miniGameCtx.arc(knobCenterX, knobCenterY, thumbRadius, 0, Math.PI * 2);
     miniGameCtx.fill();
     miniGameCtx.stroke();

     miniGameCtx.restore();
}

export function drawTouchButtons() {
     if (!miniGameCtx) {
          return;
     }

     const glowSettings = getGlowSettings();

     drawSingleTouchButton(touchControls.leftButton, glowSettings);
     drawSingleTouchButton(touchControls.rightButton, glowSettings);
}

function drawSingleTouchButton(button, glowSettings) {
     const pressOffsetY = button.isPressed ? 3 : 0;
     const pressScale = button.isPressed ? 0.94 : 1;

     const buttonCenterX = button.x + (button.width / 2);
     const buttonCenterY = button.y + (button.height / 2) + pressOffsetY;

     miniGameCtx.save();

     miniGameCtx.translate(buttonCenterX, buttonCenterY);
     miniGameCtx.scale(pressScale, pressScale);
     miniGameCtx.translate(-buttonCenterX, -buttonCenterY);

     miniGameCtx.fillStyle = button.isPressed
          ? "rgba(255, 255, 255, 0.16)"
          : "rgba(255, 255, 255, 0.08)";

     miniGameCtx.strokeStyle = button.isPressed
          ? "rgba(255, 255, 255, 0.55)"
          : "rgba(255, 255, 255, 0.35)";

     miniGameCtx.lineWidth = 2;

     miniGameCtx.shadowColor = button.isPressed
          ? "rgba(255, 255, 255, 0.28)"
          : "rgba(255, 255, 255, 0.18)";

     miniGameCtx.shadowBlur = button.isPressed
          ? glowSettings.gameParticleBlur
          : glowSettings.gameParticleBlur * 0.85;

     const radius = button.width / 2;
     const centerX = button.x + radius;
     const centerY = button.y + radius + pressOffsetY;

     miniGameCtx.beginPath();
     miniGameCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
     miniGameCtx.fill();
     miniGameCtx.stroke();

     miniGameCtx.font = '28px "Bungee", "Bungee Shade", cursive';
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.fillStyle = "#ffffff";

     miniGameCtx.shadowColor = button.isPressed
          ? "rgba(255, 255, 255, 0.45)"
          : "rgba(255, 255, 255, 0.3)";

     miniGameCtx.shadowBlur = button.isPressed ? 10 : 8;

     miniGameCtx.fillText(
          button.label,
          centerX,
          centerY + 1
     );

     miniGameCtx.restore();
}

// NOTE: MENU OVERLAY

export function drawMenuOverlay() {
     if (!miniGameCtx || !gameMenuOpen) {
          return;
     }

     const panelWidth = Math.min(320, miniGameWidth - 48);
     const panelHeight = 180;
     const panelX = (miniGameWidth - panelWidth) / 2;
     const panelY = (miniGameHeight - panelHeight) / 2;

     miniGameCtx.save();

     miniGameCtx.fillStyle = "rgba(0, 0, 0, 0.82)";
     miniGameCtx.strokeStyle = "rgba(255, 255, 255, 0.28)";
     miniGameCtx.lineWidth = 2;
     miniGameCtx.shadowColor = "rgba(255, 255, 255, 0.18)";
     miniGameCtx.shadowBlur = 14;

     miniGameCtx.beginPath();
     miniGameCtx.roundRect(panelX, panelY, panelWidth, panelHeight, 18);
     miniGameCtx.fill();
     miniGameCtx.stroke();

     miniGameCtx.shadowBlur = 0;
     miniGameCtx.fillStyle = "#ffffff";
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "top";

     miniGameCtx.font = '24px "Bungee", "Bungee Shade", cursive';
     miniGameCtx.fillText("MENU", miniGameWidth / 2, panelY + 18);

     miniGameCtx.font = '16px "Noto Sans Mono", monospace';
     miniGameCtx.textAlign = "left";

     const textX = panelX + 22;
     let textY = panelY + 62;
     const lineGap = 28;

     miniGameCtx.fillText("How to Play:", textX, textY);
     textY += lineGap;
     miniGameCtx.fillText("Drag joystick to move.", textX, textY);
     textY += lineGap;
     miniGameCtx.fillText(`Music: ${musicEnabled ? "On" : "Off"}`, textX, textY);
     textY += lineGap;
     miniGameCtx.fillText(`Sound Effects: ${soundEffectsEnabled ? "On" : "Off"}`, textX, textY);

     miniGameCtx.restore();
}

// NOTE: COLLISION BURSTS

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

// NOTE: SPARKLES

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

// NOTE: OBSTACLES

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

// NOTE: BACKGROUND

export function drawMiniGameBackground() {
     if (!miniGameCtx) {
          return;
     }

     miniGameCtx.clearRect(0, 0, miniGameWidth, miniGameHeight);
     miniGameCtx.fillStyle = "rgba(0, 0, 0, 0.75)";
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);
}

export function drawUiUnderlay() {
     if (!miniGameCtx) {
          return;
     }

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