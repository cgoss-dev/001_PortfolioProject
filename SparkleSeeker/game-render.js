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
     gameMenuView,
     gameOver,
     gameWon,
     gameOverlayText,
     gameOverlaySubtext,
     gameMenuUi,
     updateMenuUiBounds,
     getCurrentDifficultyLabel,
     getCurrentSoundLabel,
     getGameOverlayAlpha
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

     updateMenuUiBounds();

     const panel = gameMenuUi.panel;

     miniGameCtx.save();
     miniGameCtx.globalAlpha = 0.9;

     miniGameCtx.fillStyle = "rgba(0, 0, 0, 0.9)";
     miniGameCtx.strokeStyle = "rgba(255, 255, 255, 0.28)";
     miniGameCtx.lineWidth = 2;
     miniGameCtx.shadowColor = "rgba(255, 255, 255, 0.18)";
     miniGameCtx.shadowBlur = 14;

     miniGameCtx.beginPath();
     miniGameCtx.roundRect(panel.x, panel.y, panel.width, panel.height, 22);
     miniGameCtx.fill();
     miniGameCtx.stroke();

     miniGameCtx.shadowBlur = 0;
     miniGameCtx.fillStyle = "#ffffff";
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.font = '26px "Bungee", "Bungee Shade", cursive';
     miniGameCtx.fillText("MENU", miniGameWidth / 2, panel.y + 20);

     if (gameMenuView === "main") {
          drawMenuRowButton(gameMenuUi.newGameButton, "NEW GAME", "Start");
          drawMenuRowButton(gameMenuUi.instructionsButton, "INSTRUCTIONS", "View");
          drawMenuRowButton(gameMenuUi.difficultyButton, "DIFFICULTY", getCurrentDifficultyLabel());
          drawMenuRowButton(gameMenuUi.soundButton, "SOUND", getCurrentSoundLabel());
          drawMenuBackButton(gameMenuUi.backButton, "BACK");
     } else {
          drawInstructionsPanelText(panel);
          drawMenuBackButton(gameMenuUi.backButton, "BACK");
     }

     miniGameCtx.restore();
}

function drawMenuRowButton(button, label, value) {
     miniGameCtx.save();

     miniGameCtx.fillStyle = "rgba(255, 255, 255, 0.08)";
     miniGameCtx.strokeStyle = "rgba(255, 255, 255, 0.3)";
     miniGameCtx.lineWidth = 2;
     miniGameCtx.shadowColor = "rgba(255, 255, 255, 0.14)";
     miniGameCtx.shadowBlur = 10;

     miniGameCtx.beginPath();
     miniGameCtx.roundRect(button.x, button.y, button.width, button.height, 16);
     miniGameCtx.fill();
     miniGameCtx.stroke();

     miniGameCtx.shadowBlur = 0;
     miniGameCtx.textBaseline = "middle";

     miniGameCtx.font = '18px "Bungee", "Bungee Shade", cursive';
     miniGameCtx.textAlign = "left";
     miniGameCtx.fillStyle = "#ffffff";
     miniGameCtx.fillText(label, button.x + 18, button.y + (button.height / 2) + 1);

     miniGameCtx.font = '16px "Noto Sans Mono", monospace';
     miniGameCtx.textAlign = "right";
     miniGameCtx.fillStyle = "rgba(255, 255, 255, 0.92)";
     miniGameCtx.fillText(value, button.x + button.width - 18, button.y + (button.height / 2) + 1);

     miniGameCtx.restore();
}

function drawMenuBackButton(button, label) {
     miniGameCtx.save();

     miniGameCtx.fillStyle = "rgba(255, 255, 255, 0.12)";
     miniGameCtx.strokeStyle = "rgba(255, 255, 255, 0.34)";
     miniGameCtx.lineWidth = 2;
     miniGameCtx.shadowColor = "rgba(255, 255, 255, 0.16)";
     miniGameCtx.shadowBlur = 10;

     miniGameCtx.beginPath();
     miniGameCtx.roundRect(button.x, button.y, button.width, button.height, 16);
     miniGameCtx.fill();
     miniGameCtx.stroke();

     miniGameCtx.shadowBlur = 0;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.font = '20px "Bungee", "Bungee Shade", cursive';
     miniGameCtx.fillStyle = "#ffffff";
     miniGameCtx.fillText(label, button.x + (button.width / 2), button.y + (button.height / 2) + 1);

     miniGameCtx.restore();
}

function drawInstructionsPanelText(panel) {
     miniGameCtx.save();

     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = "#ffffff";

     const textX = panel.x + 28;
     let textY = panel.y + 74;
     const lineGap = 28;
     const smallGap = 20;

     miniGameCtx.font = '18px "Bungee", "Bungee Shade", cursive';
     miniGameCtx.fillText("HOW TO PLAY", textX, textY);
     textY += lineGap + 6;

     miniGameCtx.font = '17px "Noto Sans Mono", monospace';
     miniGameCtx.fillText("• Drag the joystick to move your player.", textX, textY);
     textY += lineGap;
     miniGameCtx.fillText("• Collect sparkles to raise your score.", textX, textY);
     textY += lineGap;
     miniGameCtx.fillText("• Avoid obstacle hits so you do not lose hearts.", textX, textY);
     textY += lineGap;
     miniGameCtx.fillText("• Reach full hearts to win the round.", textX, textY);
     textY += smallGap + 8;

     miniGameCtx.font = '16px "Noto Sans Mono", monospace';
     miniGameCtx.fillStyle = "rgba(255, 255, 255, 0.9)";
     miniGameCtx.fillText("Use BACK below to return to the main menu.", textX, textY);

     miniGameCtx.restore();
}

// NOTE: GAME STATUS OVERLAY

export function drawGameStatusOverlay() {
     if (!miniGameCtx || !gameOverlayText) {
          return;
     }

     const alpha = getGameOverlayAlpha();

     if (alpha <= 0) {
          return;
     }

     const isEndState = gameOver || gameWon || gameOverlayText === "PAUSED";
     const panelWidth = Math.min(360, miniGameWidth - 40);
     const panelHeight = isEndState ? 170 : 110;
     const panelX = (miniGameWidth - panelWidth) / 2;
     const panelY = (miniGameHeight - panelHeight) / 2;
     const panelCenterX = panelX + (panelWidth / 2);
     const panelCenterY = panelY + (panelHeight / 2);
     const panelScale = 0.97 + (0.03 * alpha);

     miniGameCtx.save();
     miniGameCtx.globalAlpha = alpha;

     miniGameCtx.translate(panelCenterX, panelCenterY);
     miniGameCtx.scale(panelScale, panelScale);
     miniGameCtx.translate(-panelCenterX, -panelCenterY);

     miniGameCtx.fillStyle = isEndState
          ? "rgba(0, 0, 0, 0.62)"
          : "rgba(0, 0, 0, 0.32)";

     miniGameCtx.strokeStyle = isEndState
          ? "rgba(255, 255, 255, 0.24)"
          : "rgba(255, 255, 255, 0.16)";

     miniGameCtx.lineWidth = 2;
     miniGameCtx.shadowColor = "rgba(255, 255, 255, 0.16)";
     miniGameCtx.shadowBlur = 16;

     miniGameCtx.beginPath();
     miniGameCtx.roundRect(panelX, panelY, panelWidth, panelHeight, 20);
     miniGameCtx.fill();
     miniGameCtx.stroke();

     miniGameCtx.shadowBlur = 0;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";

     miniGameCtx.font = '34px "Bungee", "Bungee Shade", cursive';
     miniGameCtx.fillStyle = "#ffffff";
     miniGameCtx.shadowColor = "rgba(255, 255, 255, 0.35)";
     miniGameCtx.shadowBlur = 10;
     miniGameCtx.fillText(gameOverlayText, miniGameWidth / 2, panelY + 56);

     if (gameOverlaySubtext) {
          miniGameCtx.shadowBlur = 0;
          miniGameCtx.font = '17px "Noto Sans Mono", monospace';
          miniGameCtx.fillStyle = "rgba(255, 255, 255, 0.92)";
          miniGameCtx.fillText(gameOverlaySubtext, miniGameWidth / 2, panelY + 108);
     }

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