// NOTE: GAME INPUT
// This file handles player input and canvas-interaction behavior.
// It does NOT run the whole game by itself.
// It just listens for input and updates shared state in game-core.js.

import {
     miniGameCanvas,
     miniGameCtx,
     miniGameWidth,
     miniGameHeight,
     keys,
     gameButton,
     pointerInput,
     gamePaused,
     gameStarted,
     keyboardInputBound,
     pointerInputBound,
     resizeHandlerBound,
     isPointInsideRect,
     setKeyboardInputBound,
     setPointerInputBound,
     setResizeHandlerBound,
     setGameStarted,
     setGamePaused,
     updateMiniGameCanvasSize
} from "./game-core.js";

import {
     resetPlayerPosition
} from "./game-entities.js";

// NOTE: BUTTON LABEL

export function getPauseButtonLabel() {
     if (!gameStarted || gamePaused) {
          return "START";
     }

     return "PAUSE";
}

// NOTE: BUTTON SIZE / POSITION
// The pause button is drawn inside the canvas, not in HTML.
// That means we have to measure its text size and manually calculate its clickable box.

export function updatePauseButtonBounds() {
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

export function updatePauseButtonState() {
     if (gameButton.pressTimer > 0) {
          gameButton.pressTimer -= 1;
     } else {
          gameButton.isPressed = false;
     }
}

// NOTE: PAUSE TOGGLE
// Shared state lives in game-core.js, so we update it through setter functions.

export function toggleGamePause() {
     if (!gameStarted) {
          setGameStarted(true);
          setGamePaused(false);
          return;
     }

     const nextPausedState = !gamePaused;
     setGamePaused(nextPausedState);

     if (nextPausedState) {
          pointerInput.active = false;
          pointerInput.pointerId = null;
     }
}

// NOTE: KEYBOARD INPUT

export function bindKeyboardInput() {
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

     setKeyboardInputBound(true);
}

// NOTE: POINTER POSITION HELPERS

export function getCanvasPointerPosition(event) {
     if (!miniGameCanvas) {
          return { x: 0, y: 0 };
     }

     const rect = miniGameCanvas.getBoundingClientRect();

     const x = ((event.clientX - rect.left) / rect.width) * miniGameWidth;
     const y = ((event.clientY - rect.top) / rect.height) * miniGameHeight;

     return { x, y };
}

// NOTE: POINTER / TOUCH INPUT

export function bindPointerInput() {
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

     setPointerInputBound(true);
}

// NOTE: RESIZE HANDLING

export function bindResizeHandler() {
     if (resizeHandlerBound) {
          return;
     }

     window.addEventListener("resize", function () {
          updateMiniGameCanvasSize();
          resetPlayerPosition();
          updatePauseButtonBounds();
     });
     // On resize, first update the canvas drawing space, then re-center the player inside the new visible area.

     setResizeHandlerBound(true);
}