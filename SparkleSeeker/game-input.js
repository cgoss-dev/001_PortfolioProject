// NOTE: GAME INPUT

import {
     miniGameCanvas,
     miniGameCtx,
     miniGameWidth,
     miniGameHeight,
     keys,
     gameButton,
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
     updateMiniGameCanvasSize,
     touchControls,
     setJoystickActive,
     setJoystickPointerId,
     setJoystickKnobOffset,
     setJoystickInput,
     setLeftButtonPressed,
     setLeftButtonPointerId,
     setRightButtonPressed,
     setRightButtonPointerId,
     resetJoystickState,
     resetTouchButtons,
     isPointInsideCircle
} from "./game-core.js";

import {
     resetPlayerPosition
} from "./game-entities.js";

// NOTE: TOUCH CONTROL BOUNDS

export function updateTouchControlBounds() {
     const bottomPadding = 22;
     const sideGap = 28;

     const joystick = touchControls.joystick;
     const left = touchControls.leftButton;
     const right = touchControls.rightButton;

     const centerX = miniGameWidth / 2;
     const bottomY = miniGameHeight - bottomPadding;

     joystick.centerX = centerX;
     joystick.centerY = bottomY - joystick.baseRadius;

     left.x = centerX - joystick.baseRadius - sideGap - left.width;
     right.x = centerX + joystick.baseRadius + sideGap;

     left.y = joystick.centerY - (left.height / 2);
     right.y = joystick.centerY - (right.height / 2);
}

// NOTE: BUTTON LABEL

export function getPauseButtonLabel() {
     if (!gameStarted || gamePaused) {
          return "START";
     }

     return "PAUSE";
}

// NOTE: PAUSE BUTTON BOUNDS
// Moved to the top-right so it does not overlap the bottom-center joystick.

export function updatePauseButtonBounds() {
     if (!miniGameCtx) {
          return;
     }

     const label = getPauseButtonLabel();

     miniGameCtx.save();
     miniGameCtx.font = '24px "Bungee", cursive';

     const textWidth = miniGameCtx.measureText(label).width;

     gameButton.width = textWidth + (gameButton.paddingX * 2);
     gameButton.height = 24 + (gameButton.paddingY * 2);

     const topPadding = 14;

     gameButton.x = (miniGameWidth - gameButton.width) / 2;
     gameButton.y = topPadding;

     miniGameCtx.restore();
}

// NOTE: PAUSE BUTTON PRESS STATE
// This keeps the pause/start button press animation alive for a short time.

export function updatePauseButtonState() {
     if (gameButton.pressTimer > 0) {
          gameButton.pressTimer -= 1;
     } else {
          gameButton.isPressed = false;
     }
}

// NOTE: PAUSE TOGGLE

export function toggleGamePause() {
     if (!gameStarted) {
          setGameStarted(true);
          setGamePaused(false);
          return;
     }

     const nextPausedState = !gamePaused;
     setGamePaused(nextPausedState);

     if (nextPausedState) {
          resetJoystickState();
          resetTouchButtons();
     }
}

// NOTE: POINTER POSITION

export function getCanvasPointerPosition(event) {
     const rect = miniGameCanvas.getBoundingClientRect();

     return {
          x: ((event.clientX - rect.left) / rect.width) * miniGameWidth,
          y: ((event.clientY - rect.top) / rect.height) * miniGameHeight
     };
}

// NOTE: POINTER INPUT
// We still use pointer EVENTS for the joystick and buttons.
// We just no longer store old pointer-follow movement state in game-core.

export function bindPointerInput() {
     if (!miniGameCanvas || pointerInputBound) {
          return;
     }

     miniGameCanvas.style.touchAction = "none";

     miniGameCanvas.addEventListener("pointerdown", (event) => {
          event.preventDefault();

          const pos = getCanvasPointerPosition(event);

          updatePauseButtonBounds();
          updateTouchControlBounds();

          // PAUSE BUTTON
          if (isPointInsideRect(pos.x, pos.y, gameButton)) {
               gameButton.isPressed = true;
               gameButton.pressTimer = 15;
               toggleGamePause();
               return;
          }

          if (gamePaused) {
               return;
          }

          const joystick = touchControls.joystick;

          // JOYSTICK
          if (isPointInsideCircle(pos.x, pos.y, joystick.centerX, joystick.centerY, joystick.baseRadius)) {
               setJoystickActive(true);
               setJoystickPointerId(event.pointerId);
               miniGameCanvas.setPointerCapture(event.pointerId);
               return;
          }

          // LEFT BUTTON
          if (isPointInsideRect(pos.x, pos.y, touchControls.leftButton)) {
               setLeftButtonPressed(true);
               setLeftButtonPointerId(event.pointerId);
               return;
          }

          // RIGHT BUTTON
          if (isPointInsideRect(pos.x, pos.y, touchControls.rightButton)) {
               setRightButtonPressed(true);
               setRightButtonPointerId(event.pointerId);
               return;
          }
     });

     miniGameCanvas.addEventListener("pointermove", (event) => {
          const joystick = touchControls.joystick;

          if (joystick.isActive && joystick.pointerId === event.pointerId) {
               const pos = getCanvasPointerPosition(event);

               const dx = pos.x - joystick.centerX;
               const dy = pos.y - joystick.centerY;

               const distance = Math.sqrt(dx * dx + dy * dy);
               const max = joystick.baseRadius;

               const clamped = Math.min(distance, max);
               const angle = Math.atan2(dy, dx);

               const x = Math.cos(angle) * clamped;
               const y = Math.sin(angle) * clamped;

               setJoystickKnobOffset(x, y);

               const nx = x / max;
               const ny = y / max;
               const magnitude = Math.sqrt(nx * nx + ny * ny);

               if (magnitude < joystick.deadZone) {
                    setJoystickInput(0, 0);
               } else {
                    setJoystickInput(nx, ny);
               }
          }
     });

     miniGameCanvas.addEventListener("pointerup", (event) => {
          const joystick = touchControls.joystick;

          if (joystick.pointerId === event.pointerId) {
               resetJoystickState();
          }

          if (touchControls.leftButton.pointerId === event.pointerId) {
               setLeftButtonPressed(false);
               setLeftButtonPointerId(null);
          }

          if (touchControls.rightButton.pointerId === event.pointerId) {
               setRightButtonPressed(false);
               setRightButtonPointerId(null);
          }
     });

     miniGameCanvas.addEventListener("pointercancel", () => {
          resetJoystickState();
          resetTouchButtons();
     });

     setPointerInputBound(true);
}

// NOTE: KEYBOARD INPUT

export function bindKeyboardInput() {
     if (keyboardInputBound) {
          return;
     }

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

     setKeyboardInputBound(true);
}

// NOTE: RESIZE

export function bindResizeHandler() {
     if (resizeHandlerBound) {
          return;
     }

     window.addEventListener("resize", () => {
          updateMiniGameCanvasSize();
          resetPlayerPosition();
          updatePauseButtonBounds();
          updateTouchControlBounds();
     });

     setResizeHandlerBound(true);
}