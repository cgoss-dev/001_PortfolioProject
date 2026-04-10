// NOTE: GAME INPUT

import {
     miniGameCanvas,
     miniGameWidth,
     miniGameHeight,
     keys,
     gamePaused,
     gameStarted,
     gameMenuOpen,
     keyboardInputBound,
     pointerInputBound,
     resizeHandlerBound,
     isPointInsideRect,
     setKeyboardInputBound,
     setPointerInputBound,
     setResizeHandlerBound,
     setGameStarted,
     setGamePaused,
     setGameMenuOpen,
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
     const bottomPadding = 15;
     const sideGap = 25; // Distance between L/R buttons.

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
// Kept for compatibility with core update cycle even though the old floating label is gone.

export function getPauseButtonLabel() {
     if (!gameStarted || gamePaused) {
          return "START";
     }

     return "PAUSE";
}

// NOTE: LEGACY PAUSE HELPERS
// Kept as harmless no-op / press-state support so core imports stay stable.

export function updatePauseButtonBounds() {
     // No floating pause label anymore.
}

export function updatePauseButtonState() {
     // No floating pause label press animation anymore.
}

// NOTE: GAME FLOW BUTTONS

export function toggleStartPause() {
     if (!gameStarted) {
          setGameStarted(true);
          setGamePaused(false);
          return;
     }

     if (gameMenuOpen) {
          return;
     }

     const nextPausedState = !gamePaused;
     setGamePaused(nextPausedState);

     if (nextPausedState) {
          resetJoystickState();
          resetTouchButtons();
     }
}

export function toggleGameMenu() {
     const nextMenuState = !gameMenuOpen;

     setGameMenuOpen(nextMenuState);

     if (!gameStarted) {
          setGamePaused(true);
     } else {
          setGamePaused(nextMenuState);
     }

     resetJoystickState();
     resetTouchButtons();
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

export function bindPointerInput() {
     if (!miniGameCanvas || pointerInputBound) {
          return;
     }

     miniGameCanvas.style.touchAction = "none";

     miniGameCanvas.addEventListener("pointerdown", (event) => {
          event.preventDefault();

          const pos = getCanvasPointerPosition(event);

          updateTouchControlBounds();

          // LEFT BUTTON = START / PAUSE
          if (isPointInsideRect(pos.x, pos.y, touchControls.leftButton)) {
               setLeftButtonPressed(true);
               setLeftButtonPointerId(event.pointerId);
               toggleStartPause();
               return;
          }

          // RIGHT BUTTON = MENU
          if (isPointInsideRect(pos.x, pos.y, touchControls.rightButton)) {
               setRightButtonPressed(true);
               setRightButtonPointerId(event.pointerId);
               toggleGameMenu();
               return;
          }

          // If paused or menu open, joystick should not activate.
          if (gamePaused || gameMenuOpen) {
               return;
          }

          const joystick = touchControls.joystick;

          // NOTE: JOYSTICK
          if (isPointInsideCircle(pos.x, pos.y, joystick.centerX, joystick.centerY, joystick.baseRadius)) {
               setJoystickActive(true); // Is joystick inside circle? Then it's active.
               setJoystickPointerId(event.pointerId);
               miniGameCanvas.setPointerCapture(event.pointerId);
          }
     });

     miniGameCanvas.addEventListener("pointermove", (event) => {
          const joystick = touchControls.joystick;

          if (joystick.isActive && joystick.pointerId === event.pointerId) {
               const pos = getCanvasPointerPosition(event);

               const dx = pos.x - joystick.centerX; // Calc knob offset from center.
               const dy = pos.y - joystick.centerY;

               const distance = Math.sqrt(dx * dx + dy * dy); // Conv into direction using maths.
               const max = joystick.baseRadius;

               const clamped = Math.min(distance, max); // Limit movement within radius.
               const angle = Math.atan2(dy, dx);

               const x = Math.cos(angle) * clamped;
               const y = Math.sin(angle) * clamped;

               setJoystickKnobOffset(x, y);

               const nx = x / max;
               const ny = y / max;
               const magnitude = Math.sqrt(nx * nx + ny * ny); // Normalize input range on xy...

               if (magnitude < joystick.deadZone) { // ... except in the very middle, so player can be still.
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
          updateTouchControlBounds();
     });

     setResizeHandlerBound(true);
}