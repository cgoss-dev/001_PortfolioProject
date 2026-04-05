// NOTE: SPARKLE SEEKER

// TROUBLESHOOTING

alert("top of game js");
console.log("top of game js");

// Meant to be displayed in the homepage canvas window, or on it's own page.

const gameCanvas = document.getElementById("miniGameCanvas");
const gameCtx = gameCanvas ? gameCanvas.getContext("2d") : null;

// NOTE: PLAYER CONST

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

// NOTE: SPARKLE CONST
// Add obstacles and collisions later.

const sparkles = [];

const sparkleChars = ["✦", "✧"];
const sparkleColors = getRainbowPalette();
// This comes from CSS/theme system, and feeds this INTO the shared color engine below.

let sparkleSpawnTimer = 0;
const sparkleSpawnDelay = 50; // Lower number = more sparkles, more often.
const sparkleSpawnCap = 25; // Max number of sparkles allowed on screen at once.

// NOTE: SHARED COLOR ENGINE (HOOK)

let sparkleColorEngine = null;
// Moved engine creation to startup so CSS has time to load before palette is read.

// NOTE: INPUT HANDLERS
// Gotta add touchscreen capability later, but no idea how.

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

// NOTE: PLAYER CORE

function resetPlayerPosition() {
     player.x = gameCanvas.width / 2;
     player.y = gameCanvas.height / 2;
}

function clampPlayerToCanvas() {
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

// NOTE: PLAYER DRAW

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

// NOTE: SPARKLE SPAWN

function createSparkle() {
     if (!sparkleColorEngine) {
          sparkleColorEngine = createColorEngine(getRainbowPalette());
     }
     // Safety fallback: if engine somehow wasn’t created yet, build it here instead of crashing.

     const x = Math.random() * (gameCanvas.width - 20) + 10;

     const nextSparkleColor = sparkleColorEngine.next();

     sparkles.push({
          x: x,
          baseX: x,
          y: -20,
          speed: 0.25 + Math.random() * 0.5,
          size: 16 + Math.random() * 5,
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

// NOTE: SPARKLE MOVEMENT

function updateSparkles() {
     for (let i = sparkles.length - 1; i >= 0; i -= 1) {
          const sparkle = sparkles[i];

          sparkle.y += sparkle.speed;

          sparkle.wobbleOffset += sparkle.wobbleSpeed;
          sparkle.x = sparkle.baseX + Math.sin(sparkle.wobbleOffset) * sparkle.wobbleAmount;

          if (sparkle.y > gameCanvas.height + 30) {
               sparkles.splice(i, 1);
          }
     }
}

// NOTE: SPARKLE DRAW

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

// NOTE: SIMPLE BACKGROUND

function drawGameBackground() {
     if (!gameCtx) return;
     // Defensive guard for safety.

     gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

     gameCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
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

function bindResizeHandler() {
     window.addEventListener("resize", () => {
          resetPlayerPosition();
     });
}

// NOTE: STARTUP

function startSparkleSeeker() {
     sparkleColorEngine = createColorEngine(getRainbowPalette());
     // Create engine here so CSS + DOM are ready BEFORE colors are read.

     resetPlayerPosition();
     bindKeyboardInput();
     bindResizeHandler();
     gameLoop();
}

// // NOTE: FAILSAFE

// if (!gameCanvas || !gameCtx) {
//      console.warn("Sparkle Seeker could not find #miniGameCanvas.");
// } else {
//      startSparkleSeeker();
// }

if (!gameCanvas || !gameCtx) {
     alert("game canvas not found");
     console.warn("Sparkle Seeker could not find #miniGameCanvas.");
} else {
     alert("starting game");
     startSparkleSeeker();
}