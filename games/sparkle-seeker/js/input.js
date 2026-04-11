// NOTE: MASTER RENDER
// Handles only top-level draw orchestration and shared background layers.

import {
     miniGameCtx,
     miniGameWidth,
     miniGameHeight
} from "./state.js";

import {
     drawPlayer
} from "./systems/player.js";

import {
     drawSparkles
} from "./systems/sparkles.js";

import {
     drawObstacles
} from "./systems/obstacles.js";

import {
     drawCollisionBursts
} from "./systems/collisions.js";

import {
     drawScore,
     drawHealth,
     drawTouchJoystick,
     drawTouchButtons,
     drawMenuOverlay,
     drawGameStatusOverlay
} from "./ui.js";

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

export function drawGame() {
     drawMiniGameBackground();
     drawUiUnderlay();
     drawSparkles();
     drawObstacles();
     drawCollisionBursts();
     drawPlayer();
     drawScore();
     drawHealth();
     drawTouchJoystick();
     drawTouchButtons();
     drawMenuOverlay();
     drawGameStatusOverlay();
}