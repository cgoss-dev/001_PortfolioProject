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
     obstacle: "😫"
};

const player = {
     x: 0,
     y: 0,
     char: playerFaces.neutral,
     size: 64,
     // Size of player emoji. Recommended 40-60px for finger size.
     speed: 3,
     // Base player speed.
     radius: 30,
     // Size of collision box/circle.
     sparkleFaceTimer: 0
     // Counts down how long the sparkle face should stay active after collecting a sparkle or hitting an obstacle.
};

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
          penalty: 2
     }
];
// Keep these as Unicode text presentation so they stay consistent and do not switch to emoji style unexpectedly.

let sparkleScore = 0;
let playerHealth = 3;
const maxPlayerHealth = 3;

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
          player.char = playerFaces.neutral;
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

     let healthDisplay = "";

     for (let i = 0; i < maxPlayerHealth; i += 1) {
          if (i < playerHealth) {
               healthDisplay += filledHeart;
          } else {
               healthDisplay += emptyHeart;
          }
     }
     // Build a simple heart string like ♥♥♥, ♥♥♡, or ♥♡♡.

     miniGameCtx.font = '32px "Noto Sans Mono", monospace'; // Use a font that properly supports heart symbols.

     miniGameCtx.textAlign = "right";
     miniGameCtx.textBaseline = "top";
     miniGameCtx.fillStyle = "#ff6b9a";
     miniGameCtx.shadowColor = "rgba(255, 107, 154, 0.35)";
     miniGameCtx.shadowBlur = 8;

     miniGameCtx.fillText(healthDisplay, miniGameWidth - 16, 14);

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

          collisionBursts.push({
               x: x,
               y: y,
               dx: Math.cos(angle) * speed,
               dy: Math.sin(angle) * speed,
               size: randomNumber(burstSizeMin, burstSizeMax),
               char: randomItem(burstChars),
               color: color,
               life: Math.floor(randomNumber(burstLifeMin, burstLifeMax)),
               maxLife: Math.floor(randomNumber(burstLifeMin, burstLifeMax)),
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

               player.char = playerFaces.sparkle;
               // Switch player face to the happy sparkle face on collection.

               player.sparkleFaceTimer = 60;
               // Keep the sparkle face for a short time.
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
               // Negative points for hitting an obstacle.

               playerHealth -= 1;
               playerHealth = Math.max(0, playerHealth);
               // Remove health, but do not allow it to go below zero.

               player.char = playerFaces.obstacle;
               // Switch player face to the hurt face on collision.

               player.sparkleFaceTimer = 30;
               // Keep the obstacle face for a short time.

               // Step 4 effect logic is intentionally not added yet.
               // This only handles negative score + health damage for now.
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

     miniGameCtx.fillStyle = "rgba(0, 0, 0, 0.75)"; // Canvas opacity.
     miniGameCtx.fillRect(0, 0, miniGameWidth, miniGameHeight);
}

function updateMiniGameCanvasSize() {
     resizeMiniGameCanvasFromCss();
     // Recalculate the internal canvas size so the drawing space matches the CSS display size.
}

// NOTE: GAME UPDATE DRAW LOOP

function updateGame() {
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
     drawSparkles();
     drawObstacles();
     drawCollisionBursts();
     drawPlayer();
     drawScore();
     drawHealth();
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
     playerHealth = maxPlayerHealth;

     sparkles.length = 0;
     obstacles.length = 0;
     collisionBursts.length = 0;
     // Reset spawned objects whenever the game starts.

     sparkleSpawnTimer = 0;
     obstacleSpawnTimer = 0;
     // Reset timers whenever the game starts.

     updateMiniGameCanvasSize();
     // Match the game canvas drawing size to the CSS display size before the game starts drawing.

     resetPlayerPosition();
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