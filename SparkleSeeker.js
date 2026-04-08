// NOTE: SPARKLE SEEKER

// TROUBLESHOOTING

// alert("top of game js");
// console.log("top of game js");

// NOTE: BASE CONST

const miniGameCanvas = document.getElementById("miniGameCanvas");
const miniGameCtx = miniGameCanvas ? miniGameCanvas.getContext("2d") : null;

let miniGameWidth = 0;
let miniGameHeight = 0;
// These store the canvas size in CSS pixels.
// We use these for gameplay math so movement/drawing matches the canvas as it appears on screen.

const playerFaces = {
     neutral: "😐",
     sparkle: "😁",
     obstacle: "😫",
     maxHealth: "🤩",
     lowHealth: "😰",
     dead: "☠️"
};

const player = {
     x: 0,
     y: 0,
     char: playerFaces.neutral,
     size: 54,
     // Size of player emoji. Recommended 40-60px for finger size.
     speed: 3,
     // Base player speed.
     radius: 30,
     // Size of collision box/circle.
     sparkleFaceTimer: 0
     // Counts down how long the temporary sparkle / obstacle face should stay active.
};

const playerBaseHealth = 3;
const playerBaseSpeed = 3;
const playerSpeedPerHeart = 0.5;

const keys = {};
const sparkles = [];
const obstacles = [];
const collisionBursts = [];

const sparkleChars = ["✦", "✧"];
const burstChars = ["✦", "✧", "·", "•"];

const obstacleTypes = [
     {
          name: "affectSize",
          char: "☢\uFE0E",
          effect: ["playerGrow", "playerShrink"],
          penalty: 1
     },
     {
          name: "affectSpeed",
          char: "⚡\uFE0E",
          effect: ["playerSlow", "objectSlow"],
          penalty: 1
     },
     {
          name: "affectType",
          char: "⚠\uFE0E",
          effect: ["swapSparkleObjects"],
          penalty: 1
     }
];
// Keep these as Unicode text presentation so they stay consistent and do not switch to emoji style unexpectedly.

let sparkleScore = 0;
let sparkleHealProgress = 0;
// Every 10 collected sparkles restores 1 heart.

let playerHealth = 3;
const maxPlayerHealth = 10;

let gameStarted = false;
let gamePaused = true;

const gameButton = {
     x: 0,
     y: 0,
     width: 0,
     height: 0,
     paddingX: 16,
     paddingY: 10,
     isPressed: false,
     pressTimer: 0
};
// Drawn inside the canvas. Click/tap to toggle START and PAUSE.

const pointerInput = {
     active: false,
     x: 0,
     y: 0,
     pointerId: null
};

let pointerInputBound = false;

let sparkleSpawnTimer = 0;
const sparkleSpawnDelay = 50;
const sparkleSpawnCap = 25;
// Lower number = more sparkles, more often.
// Max number of sparkles allowed on screen at once.

let obstacleSpawnTimer = 0;
const obstacleSpawnDelay = 120;
const obstacleSpawnCap = 10;
// Lower number = obstacles appear more often.
// Max number of obstacles allowed on screen at once.

let gameSparkleColorEngine = null;

let keyboardInputBound = false;
let resizeHandlerBound = false;
// These stop us from attaching the same listeners more than once if the game ever gets restarted.

// NOTE: UTILITIES

function isCollidingWithSparkle(playerObject, sparkleObject) {
     const dx = playerObject.x - sparkleObject.x;
     const dy = playerObject.y - sparkleObject.y;
     const distance = Math.sqrt(dx * dx + dy * dy);

     return distance < playerObject.radius + (sparkleObject.size * 0.25);
     // Collision circle, so we do not have to rely on glyphs being the exact same size.
}

function isPointInsideRect(x, y, rect) {
     return (
          x >= rect.x &&
          x <= rect.x + rect.width &&
          y >= rect.y &&
          y <= rect.y + rect.height
     );
}

function resizeMiniGameCanvasFromCss() {
     if (!miniGameCanvas || !miniGameCtx) {
          return;
     }

     const rect = miniGameCanvas.getBoundingClientRect();
     // This reads the canvas size as it is ACTUALLY being displayed by CSS on the page.

     const dpr = window.devicePixelRatio || 1;
     // DPR = device pixel ratio. Helps the canvas stay sharp on retina/high-density screens.

     miniGameCanvas.width = Math.round(rect.width * dpr);
     miniGameCanvas.height = Math.round(rect.height * dpr);
     // The canvas has an internal drawing size and a visual CSS size.
     // We resize the internal drawing size to match the displayed size more accurately.

     miniGameCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
     // This makes our drawing coordinates behave like CSS pixels instead of raw device pixels.

     miniGameWidth = rect.width;
     miniGameHeight = rect.height;
     // Store the visible canvas size separately so gameplay math uses screen-sized values.
}

function getDefaultPlayerFace() {
     if (playerHealth <= 0) {
          return playerFaces.dead;
     }

     if (playerHealth === maxPlayerHealth) {
          return playerFaces.maxHealth;
     }

     if (playerHealth <= 2) {
          return playerFaces.lowHealth;
     }

     return playerFaces.neutral;
}

function updatePlayerSpeedFromHealth() {
     const heartDifference = playerHealth - playerBaseHealth;
     player.speed = Math.max(0, playerBaseSpeed + (heartDifference * playerSpeedPerHeart));
     // Speed rises or falls by 0.5 for every heart above or below the starting 3 hearts, controlled in BASE CONST.
}

function refreshPlayerStateFace() {
     player.char = getDefaultPlayerFace();
}

function applyTemporaryPlayerFace(face, duration) {
     if (playerHealth <= 0 || playerHealth === maxPlayerHealth || playerHealth <= 2) {
          player.sparkleFaceTimer = 0;
          refreshPlayerStateFace();
          return;
     }

     player.char = face;
     player.sparkleFaceTimer = duration;
}

function syncPlayerHealthState() {
     updatePlayerSpeedFromHealth();

     if (player.sparkleFaceTimer <= 0 || playerHealth <= 0 || playerHealth === maxPlayerHealth || playerHealth <= 2) {
          refreshPlayerStateFace();
     }
}

function getPauseButtonLabel() {
     if (!gameStarted || gamePaused) {
          return "START";
     }

     return "PAUSE";
}

function updatePauseButtonBounds() {
     if (!miniGameCtx) {
          return;
     }

     const label = getPauseButtonLabel();

     miniGameCtx.save();
     miniGameCtx.font = '24px "Bungee", "Bungee Shade", cursive';

     const measuredText = miniGameCtx.measureText(label);
     const textWidth = measuredText.width;

     gameButton.width = textWidth + (gameButton.paddingX * 2);
     gameButton.height = 24 + (gameButton.paddingY * 2);

     gameButton.x = (miniGameWidth - gameButton.width) / 2;
     gameButton.y = miniGameHeight - gameButton.height - 18;

     miniGameCtx.restore();
}

function updatePauseButtonState() {
     if (gameButton.pressTimer > 0) {
          gameButton.pressTimer -= 1;
     } else {
          gameButton.isPressed = false;
     }
}

function toggleGamePause() {
     if (!gameStarted) {
          gameStarted = true;
          gamePaused = false;
          return;
     }

     gamePaused = !gamePaused;

     if (gamePaused) {
          pointerInput.active = false;
          pointerInput.pointerId = null;
     }
}

function bindKeyboardInput() {
     if (keyboardInputBound) {
          return;
     }

     window.addEventListener("keydown", function (event) {
          const key = event.key.toLowerCase();

          if ([
               "w", "a", "s", "d",
               "arrowup", "arrowdown", "arrowleft", "arrowright"
          ].includes(key)) {
               event.preventDefault();
          }

          keys[key] = true;
     });

     window.addEventListener("keyup", function (event) {
          const key = event.key.toLowerCase();
          keys[key] = false;
     });

     keyboardInputBound = true;
}

function getCanvasPointerPosition(event) {
     if (!miniGameCanvas) {
          return { x: 0, y: 0 };
     }

     const rect = miniGameCanvas.getBoundingClientRect();

     const x = ((event.clientX - rect.left) / rect.width) * miniGameWidth;
     const y = ((event.clientY - rect.top) / rect.height) * miniGameHeight;

     return { x, y };
}

function bindPointerInput() {
     if (!miniGameCanvas || pointerInputBound) {
          return;
     }

     miniGameCanvas.style.touchAction = "none";
     // Prevent browser scrolling/zoom gestures from hijacking the game.

     miniGameCanvas.addEventListener("pointerdown", function (event) {
          event.preventDefault();

          const position = getCanvasPointerPosition(event);
          updatePauseButtonBounds();

          if (isPointInsideRect(position.x, position.y, gameButton)) {
               gameButton.isPressed = true;
               gameButton.pressTimer = 15; // Change length of button press animation.
               toggleGamePause();
               return;
          }

          if (gamePaused) {
               return;
          }

          pointerInput.active = true;
          pointerInput.x = position.x;
          pointerInput.y = position.y;
          pointerInput.pointerId = event.pointerId;

          miniGameCanvas.setPointerCapture(event.pointerId);
     });

     miniGameCanvas.addEventListener("pointermove", function (event) {
          if (!pointerInput.active) {
               return;
          }

          if (pointerInput.pointerId !== event.pointerId) {
               return;
          }

          const position = getCanvasPointerPosition(event);

          pointerInput.x = position.x;
          pointerInput.y = position.y;
     });

     miniGameCanvas.addEventListener("pointerup", function (event) {
          if (pointerInput.pointerId === event.pointerId) {
               pointerInput.active = false;
               pointerInput.pointerId = null;
          }
     });

     miniGameCanvas.addEventListener("pointercancel", function (event) {
          if (pointerInput.pointerId === event.pointerId) {
               pointerInput.active = false;
               pointerInput.pointerId = null;
          }
     });

     pointerInputBound = true;
}

// NOTE: PLAYER

function resetPlayerPosition() {
     player.x = miniGameWidth / 2;
     player.y = miniGameHeight / 2;
     // Use visible canvas size here, not the raw internal canvas size.
     // Keeps player centered where the user actually sees the canvas.
}

function clampPlayerToCanvas() {
     const edgePadding = 3;

     player.x = Math.max(
          player.radius + edgePadding,
          Math.min(miniGameWidth - player.radius - edgePadding, player.x)
     );

     player.y = Math.max(
          player.radius + edgePadding,
          Math.min(miniGameHeight - player.radius - edgePadding, player.y)
     );
     // Clamp against the visible game area so the player stays inside the on-screen canvas.
}

function updatePlayer() {
     let movedByKeyboard = false;

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

     if (!movedByKeyboard && pointerInput.active) {
          const dx = pointerInput.x - player.x;
          const dy = pointerInput.y - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 4) {
               player.x += (dx / distance) * player.speed;
               player.y += (dy / distance) * player.speed;
          }
     }

     clampPlayerToCanvas();
}
// Added mouseclick/touchscreen recognition.

function updatePlayerFaceState() {
     if (player.sparkleFaceTimer > 0) {
          player.sparkleFaceTimer -= 1;
     }

     if (player.sparkleFaceTimer <= 0) {
          refreshPlayerStateFace();
     }
}

function drawPlayer() {
     if (!miniGameCtx) {
          return;
     }
     // Defensive guard: prevents crashes if canvas context is missing.

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

function drawScore() {
     if (!miniGameCtx) {
          return;
     }

     miniGameCtx.save();

     const formattedScore = sparkleScore.toString().padStart(3, "0");
     // Always show at least three digits.

     miniGameCtx.font = '28px "Bungee", "Bungee Shade", cursive';
     miniGameCtx.textAlign = "left";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = "#ffffff";
     miniGameCtx.shadowColor = "rgba(255, 255, 255, 0.35)";
     miniGameCtx.shadowBlur = 8;

     miniGameCtx.fillText(formattedScore, 16, 14);

     miniGameCtx.restore();
}

function drawHealth() {
     if (!miniGameCtx) {
          return;
     }

     miniGameCtx.save();

     const filledHeart = "♥";
     const emptyHeart = "♡";

     const heartsPerRow = 5;

     let topRow = "";
     let bottomRow = "";

     // TOP ROW: hearts 10 → 6
     for (let i = maxPlayerHealth - 1; i >= heartsPerRow; i -= 1) {
          if (i < playerHealth) {
               topRow += filledHeart;
          } else {
               topRow += emptyHeart;
          }
     }

     // BOTTOM ROW: hearts 5 → 1
     for (let i = heartsPerRow - 1; i >= 0; i -= 1) {
          if (i < playerHealth) {
               bottomRow += filledHeart;
          } else {
               bottomRow += emptyHeart;
          }
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

function drawPauseButton() {
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

function createCollisionBurst(x, y, color, burstType) {
     const burstCount = burstType === "obstacle" ? 12 : 8;
     const burstSizeMin = burstType === "obstacle" ? 16 : 12;
     const burstSizeMax = burstType === "obstacle" ? 28 : 20;
     const burstSpeedMin = burstType === "obstacle" ? 1.2 : 0.8;
     const burstSpeedMax = burstType === "obstacle" ? 3.2 : 2.1;
     const burstLifeMin = burstType === "obstacle" ? 24 : 18;
     const burstLifeMax = burstType === "obstacle" ? 40 : 28;

     for (let i = 0; i < burstCount; i += 1) {
          const angle = (Math.PI * 2 * i) / burstCount + (Math.random() * 0.5);
          const speed = randomNumber(burstSpeedMin, burstSpeedMax);
          const life = Math.floor(randomNumber(burstLifeMin, burstLifeMax));

          collisionBursts.push({
               x: x,
               y: y,
               dx: Math.cos(angle) * speed,
               dy: Math.sin(angle) * speed,
               size: randomNumber(burstSizeMin, burstSizeMax),
               char: randomItem(burstChars),
               color: color,
               life: life,
               maxLife: life,
               glowBoost: burstType === "obstacle" ? 2 : 1.4
          });
     }

     collisionBursts.push({
          x: x,
          y: y,
          dx: 0,
          dy: 0,
          size: burstType === "obstacle" ? 72 : 56,
          char: "✦",
          color: color,
          life: burstType === "obstacle" ? 12 : 10,
          maxLife: burstType === "obstacle" ? 12 : 10,
          glowBoost: burstType === "obstacle" ? 3 : 2
     });
     // Add one larger centered glow pop so the collision feels more punchy.
}

function updateCollisionBursts() {
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

function drawCollisionBursts() {
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

function createSparkle() {
     if (!gameSparkleColorEngine) {
          gameSparkleColorEngine = createColorEngine(getRainbowPalette);
     }
     // Safety fallback: if engine somehow was not created yet, build it here instead of crashing.
     // Pass the palette FUNCTION, same pattern the updated core script uses.

     const sparkleSettings = getSparkleSettings();
     // Pulls the same sparkle size settings the background particle system uses.
     // Keeps both systems reading from the same control center.

     const x = Math.random() * (miniGameWidth - 20) + 10;
     // Spawn across the visible canvas width instead of the raw internal width.

     const nextSparkleColor = gameSparkleColorEngine.next() || "#ffffff";
     // Ask the shared color engine for the next color.
     // Fallback keeps sparkles visible if the palette ever fails.

     sparkles.push({
          x: x,
          baseX: x,
          y: -20,
          speed: 0.25 + Math.random() * 0.5,
          size: randomNumber(sparkleSettings.sizeMin, sparkleSettings.sizeMax),
          // This now matches the same size range logic used by the background sparkles.
          char: randomItem(sparkleChars),
          color: nextSparkleColor,
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.02 + Math.random() * 0.03,
          wobbleAmount: 5 + Math.random() * 10
     });
}

function updateSparkleSpawns() {
     sparkleSpawnTimer += 1;

     if (sparkleSpawnTimer >= sparkleSpawnDelay) {
          if (sparkles.length < sparkleSpawnCap) {
               createSparkle();
          }

          sparkleSpawnTimer = 0;
     }
}

function updateSparkles() {
     for (let i = sparkles.length - 1; i >= 0; i -= 1) {
          const sparkle = sparkles[i];

          sparkle.y += sparkle.speed;

          sparkle.wobbleOffset += sparkle.wobbleSpeed;
          sparkle.x = sparkle.baseX + Math.sin(sparkle.wobbleOffset) * sparkle.wobbleAmount;

          if (sparkle.y > miniGameHeight + 30) {
               sparkles.splice(i, 1);
          }
          // Remove sparkles when they move below the visible canvas height.
     }
}

function collectSparkles() {
     for (let i = sparkles.length - 1; i >= 0; i -= 1) {
          const sparkle = sparkles[i];

          if (isCollidingWithSparkle(player, sparkle)) {
               createCollisionBurst(sparkle.x, sparkle.y, sparkle.color, "sparkle");

               sparkles.splice(i, 1);
               // Remove collected sparkle.

               sparkleScore += 1;
               // Add 1 point for each sparkle collected.

               sparkleHealProgress += 1;
               // Count sparkles toward the next heart refill.

               while (sparkleHealProgress >= 10 && playerHealth < maxPlayerHealth) {
                    sparkleHealProgress -= 10;
                    playerHealth += 1;
               }
               // Every 10 sparkles restores 1 heart, up to the max.

               syncPlayerHealthState();
               applyTemporaryPlayerFace(playerFaces.sparkle, 60);
               // Switch player face to the happy sparkle face on collection unless a health-state face should override it.
          }
     }
}

function drawSparkles() {
     if (!miniGameCtx) {
          return;
     }
     // Defensive guard: prevents drawing errors if context is missing.

     const glowSettings = getGlowSettings();

     miniGameCtx.textAlign = "center";
     miniGameCtx.textBaseline = "middle";

     for (let i = 0; i < sparkles.length; i += 1) {
          const sparkle = sparkles[i];

          miniGameCtx.save();

          miniGameCtx.font = `${sparkle.size}px Arial, Helvetica, sans-serif`;

          miniGameCtx.fillStyle = sparkle.color;
          // Brighten colored sparkles slightly so they compete with white sparkles visually.

          miniGameCtx.shadowBlur = glowSettings.gameParticleBlur * 1.2;
          // Multiply blur slightly so colored sparkles read brighter.

          miniGameCtx.shadowColor = sparkle.color;

          // DOUBLE DRAW FOR INTENSITY

          miniGameCtx.globalAlpha = 0.9;
          miniGameCtx.fillText(sparkle.char, sparkle.x, sparkle.y);
          // First pass (glow)

          miniGameCtx.globalAlpha = 1;
          miniGameCtx.shadowBlur = 0;
          miniGameCtx.fillText(sparkle.char, sparkle.x, sparkle.y);
          // Second pass (core brightness)

          miniGameCtx.restore();
     }
}

// NOTE: OBSTACLES

function createObstacle() {
     const type = randomItem(obstacleTypes);
     const sparkleSettings = getSparkleSettings();

     const x = Math.random() * (miniGameWidth - 20) + 10;
     // Spawn across the visible canvas width instead of the raw internal width.

     const nextObstacleColor = gameSparkleColorEngine.next() || "#ffffff";
     // Use the SAME shared color engine as the collectible sparkles.

     obstacles.push({
          x: x,
          baseX: x,
          y: -20,
          speed: 0.5 + Math.random() * 0.7,
          size: randomNumber(sparkleSettings.sizeMin, sparkleSettings.sizeMax),
          char: type.char,
          type: type,
          color: nextObstacleColor,
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.02 + Math.random() * 0.03,
          wobbleAmount: 5 + Math.random() * 10
     });
}

function updateObstacleSpawns() {
     obstacleSpawnTimer += 1;

     if (obstacleSpawnTimer >= obstacleSpawnDelay) {
          if (obstacles.length < obstacleSpawnCap) {
               createObstacle();
          }

          obstacleSpawnTimer = 0;
     }
}

function updateObstacles() {
     for (let i = obstacles.length - 1; i >= 0; i -= 1) {
          const obstacle = obstacles[i];

          obstacle.y += obstacle.speed;

          obstacle.wobbleOffset += obstacle.wobbleSpeed;
          obstacle.x = obstacle.baseX + Math.sin(obstacle.wobbleOffset) * obstacle.wobbleAmount;

          if (obstacle.y > miniGameHeight + 30) {
               obstacles.splice(i, 1);
          }
          // Remove obstacles when they move below the visible canvas height.
     }
}

function hitObstacles() {
     for (let i = obstacles.length - 1; i >= 0; i -= 1) {
          const obstacle = obstacles[i];

          if (isCollidingWithSparkle(player, obstacle)) {
               createCollisionBurst(obstacle.x, obstacle.y, obstacle.color, "obstacle");

               obstacles.splice(i, 1);
               // Remove obstacle on hit.

               sparkleScore -= obstacle.type.penalty;
               sparkleScore = Math.max(0, sparkleScore);
               // Negative points for hitting an obstacle, but never below zero.

               playerHealth -= 1;
               playerHealth = Math.max(0, playerHealth);
               // Remove health, but do not allow it to go below zero.

               syncPlayerHealthState();
               applyTemporaryPlayerFace(playerFaces.obstacle, 30);
               // Switch player face to the hurt face on collision unless a health-state face should override it.
          }
     }
}

function drawObstacles() {
     if (!miniGameCtx) {
          return;
     }
     // Defensive guard: prevents drawing errors if context is missing.

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

function drawMiniGameBackground() {
     if (!miniGameCtx) {
          return;
     }
     // Defensive guard for safety.

     miniGameCtx.clearRect(0, 0, miniGameWidth, miniGameHeight);
     // Clear using the visible canvas size so drawing lines up with what the user sees.

     miniGameCtx.fillStyle = "rgba(0, 0, 0, 0.75)";
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);
}

function drawUiUnderlay() {
     if (!miniGameCtx) {
          return;
     }

     const centerX = miniGameWidth / 2;
     const centerY = miniGameHeight / 2;
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
     // Constant, non-pulsing, soft white vignette to gently support readability around the UI edges.
}

function updateMiniGameCanvasSize() {
     resizeMiniGameCanvasFromCss();
     // Recalculate the internal canvas size so the drawing space matches the CSS display size.
}

// NOTE: GAME UPDATE DRAW LOOP

function updateGame() {
     updatePauseButtonState();

     if (gamePaused) {
          return;
     }

     updatePlayer();
     updatePlayerFaceState();
     updateSparkleSpawns();
     updateObstacleSpawns();
     updateSparkles();
     updateObstacles();
     updateCollisionBursts();
     collectSparkles();
     hitObstacles();
}

function drawGame() {
     drawMiniGameBackground();
     drawUiUnderlay();
     drawSparkles();
     drawObstacles();
     drawCollisionBursts();
     drawPlayer();
     drawScore();
     drawHealth();
     drawPauseButton();
}

function gameLoop() {
     updateGame();
     drawGame();
     window.requestAnimationFrame(gameLoop);
}

// NOTE: RESIZE HANDLING

function bindResizeHandler() {
     if (resizeHandlerBound) {
          return;
     }

     window.addEventListener("resize", function () {
          updateMiniGameCanvasSize();
          resetPlayerPosition();
          updatePauseButtonBounds();
     });
     // On resize, first update the canvas drawing space, then re-center the player inside the new visible area.

     resizeHandlerBound = true;
}

// NOTE: STARTUP

function startSparkleSeeker() {
     gameSparkleColorEngine = createColorEngine(getRainbowPalette);
     // Create the game's own color engine here so CSS + DOM are ready BEFORE colors are read.
     // Pass the palette function itself so it can always pull the latest theme colors.

     sparkleScore = 0;
     sparkleHealProgress = 0;
     playerHealth = playerBaseHealth;
     gameStarted = false;
     gamePaused = true;
     // Start in a paused state until the player clicks START.

     sparkles.length = 0;
     obstacles.length = 0;
     collisionBursts.length = 0;
     // Reset spawned objects whenever the game starts.

     sparkleSpawnTimer = 0;
     obstacleSpawnTimer = 0;
     // Reset timers whenever the game starts.

     syncPlayerHealthState();

     updateMiniGameCanvasSize();
     // Match the game canvas drawing size to the CSS display size before the game starts drawing.

     resetPlayerPosition();
     updatePauseButtonBounds();
     bindKeyboardInput();
     bindPointerInput();
     bindResizeHandler();
     gameLoop();
}

if (!miniGameCanvas || !miniGameCtx) {
     console.warn("Sparkle Seeker could not find #miniGameCanvas.");
} else {
     startSparkleSeeker();
}