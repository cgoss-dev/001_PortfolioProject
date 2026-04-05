// NOTE: SPARKLE SEEKER
// Meant to be displayed in the homepage canvas window, or on it's own page.

const gameCanvas = document.getElementById("miniGameCanvas");
const gameCtx = gameCanvas ? gameCanvas.getContext("2d") : null;

const playerFaces = {
     neutral: "😐",
     sparkle: "😁",
     obstacle: "😫"
};

const player = {
     x: 0,
     y: 0,
     char: playerFaces.neutral,
     size: 48, // Size of player emoji.
     speed: 3, // Base player speed.
     radius: 20 // Size of collision box/circle.
};

const keys = {};

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

// PLAYER MOVEMENT
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

// PLAYER DRAW

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

// NOTE: SIMPLE BACKGROUND
// Only paints inside the game canvas, not the site background.

function drawGameBackground() {
     gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
     gameCtx.fillStyle = "#000000";
     // Do I want the canvas to have a solid black backround?
     // If it's transparent, then I can reuse the white particles as extra visual noise in the game.
     gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
}

// NOTE: GAME UPDATE DRAW LOOP

function updateGame() {
     updatePlayer();
}

function drawGame() {
     drawGameBackground();
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