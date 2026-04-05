// NOTE: SPARKLE SEEKER
// Meant to be displayed in the homepage canvas window, or on it's own page.

const gameCanvas = document.getElementById("miniGameCanvas");
const gameCtx = gameCanvas ? gameCanvas.getContext("2d") : null;

// PLAYER CONST

const playerFaces = {
     neutral: "😐",
     sparkle: "😁",
     obstacle: "😫"
};

const player = {
     x: 0,
     y: 0,
     char: playerFaces.neutral,
     size: 48, // Size of player emoji. Recommended 48px for finger size.
     speed: 3, // Base player speed.
     radius: 20 // Size of collision box/circle.
};

const keys = {};

// SPARKLE CONST
// Add obstacles and collisions later.

const sparkles = [];

const sparkleChars = ["✦", "✧"];
const sparkleColors = getSparklePalette();

let sparkleSpawnTimer = 0;
const sparkleSpawnDelay = 50; // Lower number = more sparkles, more often.
const sparkleSpawnCap = 10; // Max number of sparkles allowed on screen at once.

// NOTE: INPUT HANDLERS
// Gotta add touchscreen capability later, but no idea how.

function bindKeyboardInput() { // Tracks which keys are currently pressed.
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

// NOTE: PLAYER CORE

function resetPlayerPosition() { // Canvas centering.
     player.x = gameCanvas.width / 2;
     player.y = gameCanvas.height / 2;
}

function clampPlayerToCanvas() { // So that the player doesnt clip under canvas borders.
     const edgePadding = 3;
     
     player.x = Math.max(
          player.radius + edgePadding,
          Math.min(gameCanvas.width - player.radius - edgePadding, player.x)
     );

     player.y = Math.max(
          player.radius + edgePadding,
          Math.min(gameCanvas.height - player.radius - edgePadding, player.y)
     );
}

// NOTE: PLAYER MOVEMENT
// Later gotta add touchscreen recognition.

function updatePlayer() { // Acts upon keyboard input.
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

// NOTE: PLAYER DRAW

function drawPlayer() {
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

// NOTE: SPARKLE SPAWN
// Creates one falling sparkle above the canvas.
// Uses the same wobble idea as the base sparkle rain.

function createSparkle() {
     const x = Math.random() * (gameCanvas.width - 20) + 10;

     sparkles.push({
          x: x,
          baseX: x, // Starting x position that the wobble swings around.
          y: -20,

          speed: 0.25 + Math.random() * 0.5, // Falling speed.
          size: 16 + Math.random() * 5, // Size and magnify.

          char: sparkleChars[Math.floor(Math.random() * sparkleChars.length)],
          color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],

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

// NOTE: SPARKLE MOVEMENT
// Moves sparkles downward and side-to-side.
// Removes them once they leave the bottom of the canvas.

function updateSparkles() {
     for (let i = sparkles.length - 1; i >= 0; i -= 1) {
          const sparkle = sparkles[i];

          sparkle.y += sparkle.speed;

          // Same wobble logic as the base sparkle rain.
          sparkle.wobbleOffset += sparkle.wobbleSpeed;
          sparkle.x = sparkle.baseX + Math.sin(sparkle.wobbleOffset) * sparkle.wobbleAmount;

          if (sparkle.y > gameCanvas.height + 30) {
               sparkles.splice(i, 1);
          }
     }
}

// NOTE: SPARKLE DRAW
// Draws the falling sparkles in theme colors.

function drawSparkles() {
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

// NOTE: SIMPLE BACKGROUND
// Only paints inside the game canvas, not the site background.

function drawGameBackground() {
     gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

     gameCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
     // Do I want the canvas to have a solid black backround?
     // If it's transparent, I can reuse the white particles as extra visual noise in the game.
     // If it's solid, it's more versatile in future games that have no use for falling particles.
     gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
}

// NOTE: GAME UPDATE DRAW LOOP

function updateGame() {
     updatePlayer();
     updateSparkleSpawns();
     updateSparkles();
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
// Keeps player centered when window size changes.

function bindResizeHandler() {
     window.addEventListener("resize", () => {
          resetPlayerPosition();
     });
}

// NOTE: STARTUP

function startSparkleSeeker() {
     resetPlayerPosition();
     bindKeyboardInput();
     bindResizeHandler();
     gameLoop();
}

// NOTE: FAILSAFE
// This HAS to come after player + functions.

if (!gameCanvas || !gameCtx) {
     console.warn("Sparkle Seeker could not find #miniGameCanvas.");
} else {
     startSparkleSeeker();
}