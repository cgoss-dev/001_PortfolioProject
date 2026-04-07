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
     // Counts down how long the sparkle face should stay active after collecting a sparkle.
};

const keys = {};
const sparkles = [];

const pointerInput = {
     active: false,
     x: 0,
     y: 0,
     pointerId: null
};

let pointerInputBound = false;

const sparkleChars = ["✦", "✧"];

let sparkleSpawnTimer = 0;
const sparkleSpawnDelay = 50;
const sparkleSpawnCap = 25;
// Lower number = more sparkles, more often.
// Max number of sparkles allowed on screen at once.

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
     updateSparkles();
     collectSparkles();
}

function drawGame() {
     drawMiniGameBackground();
     drawSparkles();
     drawPlayer();
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

     updateMiniGameCanvasSize();
     // Match the game canvas drawing size to the CSS display size before the game starts drawing.

     resetPlayerPosition();
     bindKeyboardInput();
     bindPointerInput();
     // Added mouseclick/touchscreen recognition.
     bindResizeHandler();
     gameLoop();
}

if (!miniGameCanvas || !miniGameCtx) {
     console.warn("Sparkle Seeker could not find #miniGameCanvas.");
} else {
     startSparkleSeeker();
}