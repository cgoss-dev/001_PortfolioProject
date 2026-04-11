// NOTE: PLAYER SYSTEM
// Handles player position, movement, drawing, and temporary face-state timing.

import {
     miniGameCtx,
     miniGameWidth,
     miniGameHeight,
     player,
     keys,
     touchControls
} from "../state.js";

import {
     refreshPlayerStateFace
} from "../winloselevels.js";

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

// NOTE: POSITION HELPERS

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

// NOTE: MOVEMENT

export function updatePlayer() {
     let movedByKeyboard = false;

     // NOTE: KEYBOARD INPUT
     // Keyboard wins over joystick if both are active at once.
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

     // NOTE: JOYSTICK INPUT
     // Only used when keyboard input did not move the player this frame.
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

// NOTE: FACE TIMER

export function updatePlayerFaceState() {
     if (player.sparkleFaceTimer > 0) {
          player.sparkleFaceTimer -= 1;
     }

     if (player.sparkleFaceTimer <= 0) {
          refreshPlayerStateFace();
     }
}

// NOTE: DRAWING

export function drawPlayer() {
     if (!miniGameCtx) {
          return;
     }

     miniGameCtx.save();

     miniGameCtx.font = `${player.size}px Arial, Helvetica, sans-serif`;
     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";
     miniGameCtx.fillStyle = "#ffffff";

     let playerYOffset = 0;

     // NOTE:
     // The neutral face sits a little differently visually,
     // so this tiny offset keeps it centered better.
     if (player.char === playerFaces.neutral) {
          playerYOffset = 3;
     }

     miniGameCtx.fillText(player.char, player.x, player.y + playerYOffset);

     miniGameCtx.restore();
}