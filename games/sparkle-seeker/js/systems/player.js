// NOTE: PLAYER SYSTEM
// Handles player position, movement, and temporary face-state timing.

import {
     miniGameWidth,
     miniGameHeight,
     player,
     keys,
     touchControls
} from "../state.js";

import {
     refreshPlayerStateFace
} from "../winlose.js";

export const playerFaces = {
     neutral: "😐",
     sparkle: "😁",
     obstacle: "😫",
     maxHealth: "🤩",
     lowHealth: "😰",
     dead: "☠️"
};

export const playerBaseHealth = 3;
export const playerBaseSpeed = 2;
export const playerSpeedPerHeart = 0.5;

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

     // JOYSTICK INPUT
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