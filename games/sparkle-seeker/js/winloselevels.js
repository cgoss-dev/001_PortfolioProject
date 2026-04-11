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