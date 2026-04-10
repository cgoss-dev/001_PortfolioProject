// NOTE: GAME INPUT
// Handles touch + pointer + keyboard input for the mini-game.

import {
     miniGameCanvas,
     miniGameWidth,
     miniGameHeight,
     keys,
     gamePaused,
     gameStarted,
     gameMenuOpen,
     gameMenuView,
     gameOver,
     gameWon,
     keyboardInputBound,
     pointerInputBound,
     resizeHandlerBound,
     isPointInsideRect,
     isPointInsideMenuPanel,
     gameMenuUi,
     setKeyboardInputBound,
     setPointerInputBound,
     setResizeHandlerBound,
     setGamePaused,
     setGameMenuOpen,
     setGameMenuView,
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
     isPointInsideCircle,
     startNewGameRound,
     updateMenuUiBounds,
     cycleDifficulty,
     toggleAllSound
} from "./game-core.js";

import {
     resetPlayerPosition
} from "./game-entities.js";

// NOTE: TOUCH CONTROL BOUNDS
// Positions the joystick and left/right buttons based on current canvas size.

export function updateTouchControlBounds() {
     const bottomPadding = 15;
     const sideGap = 25;

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

// NOTE: LEGACY PAUSE HELPER
// game-core still calls this every frame.
// Keeping it as a no-op avoids import errors even though the old floating pause label is gone. // FIXME: come back to this later for workaround

export function updatePauseButtonState() {
     // No floating pause label anymore.
}

// NOTE: GAME FLOW BUTTONS
// These functions control high-level game state like start, pause, and menu open/close.

export function toggleStartPause() {
     if (!gameStarted || gameOver || gameWon) {
          startNewGameRound();
          resetJoystickState();
          resetTouchButtons();
          return;
          // If the game has not started yet, or it already ended, start a brand new round.
     }

     if (gameMenuOpen) {
          return;
          // Menu open should block pause toggling so buttons do not fight each other.
     }

     const nextPausedState = !gamePaused;
     setGamePaused(nextPausedState);

     resetJoystickState();
     resetTouchButtons();
     // Clear held touch input so the player does not "stick" moving after pause changes.
}

export function toggleGameMenu() {
     const nextMenuState = !gameMenuOpen;

     setGameMenuOpen(nextMenuState);

     if (nextMenuState) {
          setGameMenuView("main");
          // Whenever menu opens, return to its main page first.
     }

     resetJoystickState();
     resetTouchButtons();
}

// NOTE: MENU ACTIONS

export function handleMenuNewGame() {
     startNewGameRound();
     resetJoystickState();
     resetTouchButtons();
}

export function handleMenuInstructions() {
     setGameMenuView("instructions");
}

export function handleMenuDifficulty() {
     cycleDifficulty();
}

export function handleMenuSound() {
     toggleAllSound();
}

export function handleMenuBack() {
     if (gameMenuView === "instructions") {
          setGameMenuView("main");
          return;
          // If the user is inside a submenu, BACK returns to main menu first.
     }

     setGameMenuOpen(false);
     setGameMenuView("main");
     // Otherwise BACK closes the menu completely.
}

export function handleMenuCloseOutside() {
     setGameMenuOpen(false);
     setGameMenuView("main");
}

// NOTE: POINTER POSITION
// Converts browser/client coordinates into canvas-space coordinates.

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
          updateMenuUiBounds();
          // Recalculate clickable bounds first in case canvas size changed.

          // MENU PANEL INTERACTION
          if (gameMenuOpen) {
               if (isPointInsideRect(pos.x, pos.y, gameMenuUi.backButton)) {
                    handleMenuBack();
                    return;
               }

               if (gameMenuView === "main") {
                    if (isPointInsideRect(pos.x, pos.y, gameMenuUi.newGameButton)) {
                         handleMenuNewGame();
                         return;
                    }

                    if (isPointInsideRect(pos.x, pos.y, gameMenuUi.instructionsButton)) {
                         handleMenuInstructions();
                         return;
                    }

                    if (isPointInsideRect(pos.x, pos.y, gameMenuUi.difficultyButton)) {
                         handleMenuDifficulty();
                         return;
                    }

                    if (isPointInsideRect(pos.x, pos.y, gameMenuUi.soundButton)) {
                         handleMenuSound();
                         return;
                    }
               }

               if (!isPointInsideMenuPanel(pos.x, pos.y)) {
                    handleMenuCloseOutside();
                    return;
                    // Clicking outside the panel closes the menu.
               }

               return;
               // Clicking inside menu but not on a button does nothing.
          }

          // LEFT BUTTON = START / PAUSE / PLAY AGAIN
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

          if (gamePaused || gameMenuOpen || gameOver || gameWon) {
               return;
               // If paused, won, lost, or menu open, joystick should not activate.
          }

          const joystick = touchControls.joystick;

          if (isPointInsideCircle(pos.x, pos.y, joystick.centerX, joystick.centerY, joystick.baseRadius)) {
               setJoystickActive(true);
               setJoystickPointerId(event.pointerId);
               miniGameCanvas.setPointerCapture(event.pointerId);
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
               // Clamp the thumb/knob so it stays inside the joystick circle.

               const x = Math.cos(angle) * clamped;
               const y = Math.sin(angle) * clamped;

               setJoystickKnobOffset(x, y);

               const nx = x / max;
               const ny = y / max;
               const magnitude = Math.sqrt(nx * nx + ny * ny);
               // Normalize to a -1..1-ish range based on radius.

               if (magnitude < joystick.deadZone) {
                    setJoystickInput(0, 0);
                    // Dead zone keeps the player from drifting while near center.
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
// Recompute canvas size, player position, and button bounds when browser size changes.

export function bindResizeHandler() {
     if (resizeHandlerBound) {
          return;
     }

     window.addEventListener("resize", () => {
          updateMiniGameCanvasSize();
          resetPlayerPosition();
          updateTouchControlBounds();
          updateMenuUiBounds();
     });

     setResizeHandlerBound(true);
}