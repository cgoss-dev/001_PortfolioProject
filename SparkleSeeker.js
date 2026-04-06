// NOTE: SPARKLE SEEKER

// TROUBLESHOOTING

// alert("top of game js");
// console.log("top of game js");

// NOTE: BASE CONST

const gameCanvas = document.getElementById("miniGameCanvas");
const gameCtx = gameCanvas ? gameCanvas.getContext("2d") : null;

let gameWidth = 0;
let gameHeight = 0;
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
     size: 64, // Size of player emoji. Recommended 40-60px for finger size.
     speed: 3, // Base player speed.
     radius: 30, // Size of collision box/circle.
     sparkleFaceTimer: 0 // Counts down how long the sparkle face should stay active after collecting a sparkle.
};

function isCollidingWithSparkle(playerObject, sparkleObject) {
     const dx = playerObject.x - sparkleObject.x;
     const dy = playerObject.y - sparkleObject.y;
     const distance = Math.sqrt(dx * dx + dy * dy);

     return distance < playerObject.radius + (sparkleObject.size * 0.25);
     // Collision circle, so we don't have to rely on glyphs being the exact same size.
}

const keys = {};

const sparkles = [];

const sparkleChars = ["✦", "✧"];
const sparkleColors = getRainbowPalette();
// This comes from CSS/theme system, and feeds this INTO the shared color engine below.

let sparkleSpawnTimer = 0;
const sparkleSpawnDelay = 50; // Lower number = more sparkles, more often.
const sparkleSpawnCap = 25; // Max number of sparkles allowed on screen at once.

// NOTE: SHARED COLOR ENGINE

let gameSparkleColorEngine = null;

function resizeGameCanvasFromCss() {
     if (!gameCanvas || !gameCtx) {
          return;
     }

     const rect = gameCanvas.getBoundingClientRect();
     // This reads the canvas size as it is ACTUALLY being displayed by CSS on the page.

     const dpr = window.devicePixelRatio || 1;
     // DPR = device pixel ratio. Helps the canvas stay sharp on retina/high-density screens.

     gameCanvas.width = Math.round(rect.width * dpr);
     gameCanvas.height = Math.round(rect.height * dpr);
     // The canvas has an internal drawing size and a visual CSS size.
     // We resize the internal drawing size to match the displayed size more accurately.

     gameCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
     // This makes our drawing coordinates behave like CSS pixels instead of raw device pixels.

     gameWidth = rect.width;
     gameHeight = rect.height;
     // Store the visible canvas size separately so gameplay math uses screen-sized values.
}

function bindKeyboardInput() {
     window.addEventListener("keydown", (event) => {
          const key = event.key.toLowerCase();

          if ([
               "w", "a", "s", "d",
               "arrowup", "arrowdown", "arrowleft", "arrowright"
          ].includes(key)) {
               event.preventDefault();
          }

          keys[key] = true;
     });

     window.addEventListener("keyup", (event) => {
          const key = event.key.toLowerCase();
          keys[key] = false;
     });
}

// NOTE: PLAYER

function resetPlayerPosition() {
     player.x = gameWidth / 2;
     player.y = gameHeight / 2;
     // Use visible canvas size here, not the raw internal canvas size.
     // Keeps player centered where the user actually sees the canvas.
}

function clampPlayerToCanvas() {
     const edgePadding = 3;
     
     player.x = Math.max(
          player.radius + edgePadding,
          Math.min(gameWidth - player.radius - edgePadding, player.x)
     );

     player.y = Math.max(
          player.radius + edgePadding,
          Math.min(gameHeight - player.radius - edgePadding, player.y)
     );
     // Clamp against the visible game area so the player stays inside the on-screen canvas.
}

function updatePlayer() {
     if (keys["w"] || keys["arrowup"]) {
          player.y -= player.speed;
     }

     if (keys["s"] || keys["arrowdown"]) {
          player.y += player.speed;
     }

     if (keys["a"] || keys["arrowleft"]) {
          player.x -= player.speed;
     }

     if (keys["d"] || keys["arrowright"]) {
          player.x += player.speed;
     }

     clampPlayerToCanvas();
}

function updatePlayerFaceState() {
     if (player.sparkleFaceTimer > 0) {
          player.sparkleFaceTimer -= 1;
     }

     if (player.sparkleFaceTimer <= 0) {
          player.char = playerFaces.neutral;
     }
}

function drawPlayer() {
     if (!gameCtx) return;
     // Defensive guard: prevents crashes if canvas context is missing.

     gameCtx.font = `${player.size}px Arial, Helvetica, sans-serif`;
     gameCtx.textAlign = "center";
     gameCtx.textBaseline = "middle";
     gameCtx.fillStyle = "#ffffff";

     let playerYOffset = 0;

     if (player.char === playerFaces.neutral) {
          playerYOffset = 3;
     }

     gameCtx.fillText(player.char, player.x, player.y + playerYOffset);
}

// NOTE: SPARKLES

function createSparkle() {
     if (!gameSparkleColorEngine) {
          gameSparkleColorEngine = createColorEngine(getRainbowPalette());
     }
     // Safety fallback: if engine somehow wasn’t created yet, build it here instead of crashing.

     const sparkleSettings = getSparkleSettings();
     // Pulls the same sparkle size settings the background particle system uses, keeps both systems reading from the same control center.

     const x = Math.random() * (gameWidth - 20) + 10;
     // Spawn across the visible canvas width instead of the raw internal width.

     const nextSparkleColor = gameSparkleColorEngine.next();

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

          if (sparkle.y > gameHeight + 30) {
               sparkles.splice(i, 1);
          }
          // Remove sparkles when they move below the visible canvas height.
     }
}

function collectSparkles() {
     for (let i = sparkles.length - 1; i >= 0; i -= 1) {
          const sparkle = sparkles[i];

          if (isCollidingWithSparkle(player, sparkle)) {
               sparkles.splice(i, 1);
               // Remove the collected sparkle from the game.

               player.char = playerFaces.sparkle;
               // Switch player face to the happy sparkle face on collection.

               player.sparkleFaceTimer = 60;
               // Keep the sparkle face for a short time.
          }
     }
}

function drawSparkles() {
     if (!gameCtx) return;
     // Defensive guard: prevents drawing errors if context is missing.

     const glowSettings = getGlowSettings();

     gameCtx.textAlign = "center";
     gameCtx.textBaseline = "middle";

     for (let i = 0; i < sparkles.length; i += 1) {
          const sparkle = sparkles[i];

          gameCtx.save();
          gameCtx.font = `${sparkle.size}px Arial, Helvetica, sans-serif`;
          gameCtx.fillStyle = sparkle.color;
          gameCtx.shadowBlur = glowSettings.particleBlur;
          gameCtx.shadowColor = sparkle.color;
          gameCtx.fillText(sparkle.char, sparkle.x, sparkle.y);
          gameCtx.restore();
     }
}

// NOTE: BACKGROUND

function drawGameBackground() {
     if (!gameCtx) return;
     // Defensive guard for safety.

     gameCtx.clearRect(0, 0, gameWidth, gameHeight);
     // Clear using the visible canvas size so drawing lines up with what the user sees.

     gameCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
     gameCtx.fillRect(0, 0, gameWidth, gameHeight);
}

function updateGameCanvasSize() {
     resizeGameCanvasFromCss();
     // Recalculate the internal canvas size so the drawing space matches the CSS display size.
}

// NOTE: GAME UPDATE DRAW LOOP

function updateGame() {
     updatePlayer();
     updatePlayerFaceState();
     updateSparkleSpawns();
     updateSparkles();
     collectSparkles();
}

function drawGame() {
     drawGameBackground();
     drawSparkles();
     drawPlayer();
}

function gameLoop() {
     updateGame();
     drawGame();
     requestAnimationFrame(gameLoop);
}

// NOTE: RESIZE HANDLING

function bindResizeHandler() {
     window.addEventListener("resize", () => {
          updateGameCanvasSize();
          resetPlayerPosition();
     });
     // On resize, first update the canvas drawing space, then re-center the player inside the new visible area.
}

// NOTE: STARTUP

function startSparkleSeeker() {
     gameSparkleColorEngine = createColorEngine(getRainbowPalette());
     // Create the game's own color engine here so CSS + DOM are ready BEFORE colors are read.

     updateGameCanvasSize();
     // Match the game canvas drawing size to the CSS display size before the game starts drawing.

     resetPlayerPosition();
     bindKeyboardInput();
     bindResizeHandler();
     gameLoop();
}

if (!gameCanvas || !gameCtx) {
     console.warn("Sparkle Seeker could not find #miniGameCanvas.");
} else {
     startSparkleSeeker();
}