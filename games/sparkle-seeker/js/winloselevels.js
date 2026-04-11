// NOTE: WIN / LOSE / PLAYER HEALTH STATE
// Handles player face switching and speed changes based on health.

import {
     player,
     playerHealth,
     maxPlayerHealth
} from "./state.js";

import {
     playerFaces,
     playerBaseHealth,
     playerBaseSpeed,
     playerSpeedPerHeart
} from "./systems/player.js";

export function getDefaultPlayerFace() {
     if (playerHealth <= 0) return playerFaces.dead;
     if (playerHealth === maxPlayerHealth) return playerFaces.maxHealth;
     if (playerHealth <= 2) return playerFaces.lowHealth;
     return playerFaces.neutral;
}

export function updatePlayerSpeedFromHealth() {
     const diff = playerHealth - playerBaseHealth;
     player.speed = Math.max(0, playerBaseSpeed + (diff * playerSpeedPerHeart));
}

export function refreshPlayerStateFace() {
     player.char = getDefaultPlayerFace();
}

export function applyTemporaryPlayerFace(face, duration) {
     // NOTE:
     // If the player is already in a "forced" health state
     // (dead, max health, or low health), that state wins.
     if (playerHealth <= 0 || playerHealth === maxPlayerHealth || playerHealth <= 2) {
          player.sparkleFaceTimer = 0;
          refreshPlayerStateFace();
          return;
     }

     player.char = face;
     player.sparkleFaceTimer = duration;
}

export function syncPlayerHealthState() {
     updatePlayerSpeedFromHealth();

     if (
          player.sparkleFaceTimer <= 0 ||
          playerHealth <= 0 ||
          playerHealth === maxPlayerHealth ||
          playerHealth <= 2
     ) {
          refreshPlayerStateFace();
     }
}