// NOTE: INPUT SYSTEM
// Handles keyboard, pointer, touch joystick, touch buttons, menu clicks, and resize binding.

import {
     miniGameCanvas,
     miniGameCtx,
     miniGameWidth,
     miniGameHeight,
     keys,
     touchControls,
     gameStarted,
     gamePaused,
     gameMenuOpen,
     gameMenuView,
     gameOver,
     gameWon,
     gameMenuUi,
     keyboardInputBound,
     pointerInputBound,
     resizeHandlerBound,

     setKeyboardInputBound,
     setPointerInputBound,
     setResizeHandlerBound,
     setGamePaused,
     setGameMenuOpen,
     setGameMenuView,
     setJoystickActive,
     setJoystickPointerId,
     setJoystickKnobOffset,
     setJoystickInput,
     setLeftButtonPressed,
     setLeftButtonPointerId,
     setRightButtonPressed,
     setRightButtonPointerId
} from "./state.js";

import {
     updateMenuUiBounds,
     startNewGameRound,
     cycleDifficulty,
     toggleAllSound,
     isPointInsideMenuPanel
} from "./ui.js";

// NOTE: KEY HELPERS

function normalizeKeyName(key) {
     if (!key) {
          return "";
     }

     const lower = String(key).toLowerCase();

     if (lower === " ") return "space";
     if (lower === "esc") return "escape";

     return lower;
}

function isPointInsideRect(x, y, rect) {
     return (
          x >= rect.x &&
          x <= rect.x + rect.width &&
          y >= rect.y &&
          y <= rect.y + rect.height
     );
}

function isPointInsideCircle(px, py, cx, cy, radius) {
     const dx = px - cx;
     const dy = py - cy;
     return (dx * dx + dy * dy) <= radius * radius;
}

function getCanvasPointerPosition(event) {
     if (!miniGameCanvas) {
          return { x: 0, y: 0 };
     }

     const rect = miniGameCanvas.getBoundingClientRect();
     const safeWidth = rect.width || 1;
     const safeHeight = rect.height || 1;

     return {
          x: ((event.clientX - rect.left) / safeWidth) * miniGameWidth,
          y: ((event.clientY - rect.top) / safeHeight) * miniGameHeight
     };
}

// NOTE: CANVAS RESIZE

export function resizeMiniGameCanvasFromCss() {
     if (!miniGameCanvas || !miniGameCtx) {
          return;
     }

     const rect = miniGameCanvas.getBoundingClientRect();
     const dpr = window.devicePixelRatio || 1;

     miniGameCanvas.width = Math.round(rect.width * dpr);
     miniGameCanvas.height = Math.round(rect.height * dpr);
     miniGameCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function handleWindowResize() {
     resizeMiniGameCanvasFromCss();
     updateTouchControlBounds();
     updateMenuUiBounds();
}

// NOTE: TOUCH CONTROL LAYOUT

export function updateTouchControlBounds() {
     const joystick = touchControls.joystick;
     const leftButton = touchControls.leftButton;
     const rightButton = touchControls.rightButton;

     joystick.centerX = Math.max(96, joystick.baseRadius + 24);
     joystick.centerY = Math.max(96, miniGameHeight - joystick.baseRadius - 24);

     leftButton.width = 64;
     leftButton.height = 64;
     leftButton.x = miniGameWidth - 156;
     leftButton.y = miniGameHeight - 96;

     rightButton.width = 64;
     rightButton.height = 64;
     rightButton.x = miniGameWidth - 82;
     rightButton.y = miniGameHeight - 96;
}

// NOTE: TOUCH RESET

export function resetTouchControls() {
     setJoystickActive(false);
     setJoystickPointerId(null);
     setJoystickKnobOffset(0, 0);
     setJoystickInput(0, 0);

     setLeftButtonPressed(false);
     setLeftButtonPointerId(null);

     setRightButtonPressed(false);
     setRightButtonPointerId(null);
}

// NOTE: BUTTON LABEL SYNC

export function updatePauseButtonState() {
     touchControls.leftButton.label = "\u23EF\uFE0E";
     touchControls.rightButton.label = "\u2630\uFE0E";
}

// NOTE: ROUND + MENU ACTIONS

function triggerPauseAction() {
     if (!gameStarted || gameOver || gameWon) {
          startNewGameRound();
          return;
     }

     if (gameMenuOpen) {
          setGameMenuOpen(false);
          setGameMenuView("main");
          setGamePaused(false);
          return;
     }

     setGamePaused(!gamePaused);
}

function triggerMenuAction() {
     if (gameMenuOpen) {
          if (gameMenuView !== "main") {
               setGameMenuView("main");
               return;
          }

          setGameMenuOpen(false);

          if (gameStarted && !gameOver && !gameWon) {
               setGamePaused(false);
          }

          return;
     }

     setGameMenuOpen(true);

     if (gameStarted && !gameOver && !gameWon) {
          setGamePaused(true);
     }
}

function handleMenuClick(x, y) {
     if (!gameMenuOpen) {
          return false;
     }

     if (!isPointInsideMenuPanel(x, y)) {
          setGameMenuOpen(false);

          if (gameStarted && !gameOver && !gameWon) {
               setGamePaused(false);
          }

          return true;
     }

     if (gameMenuView === "main") {
          if (isPointInsideRect(x, y, gameMenuUi.newGameButton)) {
               startNewGameRound();
               return true;
          }

          if (isPointInsideRect(x, y, gameMenuUi.instructionsButton)) {
               setGameMenuView("instructions");
               return true;
          }

          if (isPointInsideRect(x, y, gameMenuUi.difficultyButton)) {
               cycleDifficulty();
               return true;
          }

          if (isPointInsideRect(x, y, gameMenuUi.soundButton)) {
               toggleAllSound();
               return true;
          }
     }

     if (isPointInsideRect(x, y, gameMenuUi.backButton)) {
          if (gameMenuView !== "main") {
               setGameMenuView("main");
          } else {
               setGameMenuOpen(false);

               if (gameStarted && !gameOver && !gameWon) {
                    setGamePaused(false);
               }
          }

          return true;
     }

     return true;
}

// NOTE: KEYBOARD INPUT

function onKeyDown(event) {
     const key = normalizeKeyName(event.key);
     keys[key] = true;

     if (
          key === "w" ||
          key === "a" ||
          key === "s" ||
          key === "d" ||
          key === "arrowup" ||
          key === "arrowdown" ||
          key === "arrowleft" ||
          key === "arrowright" ||
          key === "space" ||
          key === "enter" ||
          key === "escape"
     ) {
          event.preventDefault();
     }

     if (key === "escape") {
          if (gameMenuOpen) {
               if (gameMenuView !== "main") {
                    setGameMenuView("main");
               } else {
                    setGameMenuOpen(false);

                    if (gameStarted && !gameOver && !gameWon) {
                         setGamePaused(false);
                    }
               }
          } else {
               setGameMenuOpen(true);

               if (gameStarted && !gameOver && !gameWon) {
                    setGamePaused(true);
               }
          }

          return;
     }

     if (key === "space" || key === "enter") {
          triggerPauseAction();
     }
}

function onKeyUp(event) {
     const key = normalizeKeyName(event.key);
     keys[key] = false;
}

export function bindKeyboardInput() {
     if (keyboardInputBound) {
          return;
     }

     window.addEventListener("keydown", onKeyDown);
     window.addEventListener("keyup", onKeyUp);
     setKeyboardInputBound(true);
}

// NOTE: JOYSTICK MATH

function updateJoystickFromPointer(event) {
     const joystick = touchControls.joystick;
     const pos = getCanvasPointerPosition(event);

     const dx = pos.x - joystick.centerX;
     const dy = pos.y - joystick.centerY;

     const distance = Math.sqrt((dx * dx) + (dy * dy));
     const max = joystick.baseRadius;

     const clamped = Math.min(distance, max);
     const angle = Math.atan2(dy, dx);

     const x = Math.cos(angle) * clamped;
     const y = Math.sin(angle) * clamped;

     setJoystickKnobOffset(x, y);

     const nx = x / max;
     const ny = y / max;
     const magnitude = Math.sqrt((nx * nx) + (ny * ny));

     if (magnitude < joystick.deadZone) {
          setJoystickInput(0, 0);
     } else {
          setJoystickInput(nx, ny);
     }
}

function clearJoystick(pointerId) {
     const joystick = touchControls.joystick;

     if (joystick.pointerId !== pointerId) {
          return;
     }

     setJoystickActive(false);
     setJoystickPointerId(null);
     setJoystickKnobOffset(0, 0);
     setJoystickInput(0, 0);

     if (miniGameCanvas?.hasPointerCapture(pointerId)) {
          miniGameCanvas.releasePointerCapture(pointerId);
     }
}

function clearButtons(pointerId) {
     if (touchControls.leftButton.pointerId === pointerId) {
          setLeftButtonPressed(false);
          setLeftButtonPointerId(null);
     }

     if (touchControls.rightButton.pointerId === pointerId) {
          setRightButtonPressed(false);
          setRightButtonPointerId(null);
     }
}

// NOTE: POINTER INPUT

function onPointerDown(event) {
     if (!miniGameCanvas) {
          return;
     }

     const pos = getCanvasPointerPosition(event);
     const joystick = touchControls.joystick;
     const leftButton = touchControls.leftButton;
     const rightButton = touchControls.rightButton;

     if (handleMenuClick(pos.x, pos.y)) {
          event.preventDefault();
          return;
     }

     if (isPointInsideRect(pos.x, pos.y, leftButton)) {
          setLeftButtonPressed(true);
          setLeftButtonPointerId(event.pointerId);
          triggerPauseAction();
          event.preventDefault();
          return;
     }

     if (isPointInsideRect(pos.x, pos.y, rightButton)) {
          setRightButtonPressed(true);
          setRightButtonPointerId(event.pointerId);
          triggerMenuAction();
          event.preventDefault();
          return;
     }

     if (isPointInsideCircle(pos.x, pos.y, joystick.centerX, joystick.centerY, joystick.baseRadius)) {
          setJoystickActive(true);
          setJoystickPointerId(event.pointerId);
          updateJoystickFromPointer(event);
          miniGameCanvas.setPointerCapture(event.pointerId);
          event.preventDefault();
     }
}

function onPointerMove(event) {
     const joystick = touchControls.joystick;

     if (joystick.isActive && joystick.pointerId === event.pointerId) {
          updateJoystickFromPointer(event);
          event.preventDefault();
     }
}

function onPointerUp(event) {
     clearJoystick(event.pointerId);
     clearButtons(event.pointerId);
}

export function bindPointerInput() {
     if (!miniGameCanvas || pointerInputBound) {
          return;
     }

     miniGameCanvas.style.touchAction = "none";

     miniGameCanvas.addEventListener("pointerdown", onPointerDown, { passive: false });
     miniGameCanvas.addEventListener("pointermove", onPointerMove, { passive: false });
     miniGameCanvas.addEventListener("pointerup", onPointerUp);
     miniGameCanvas.addEventListener("pointercancel", onPointerUp);
     miniGameCanvas.addEventListener("pointerleave", onPointerUp);

     setPointerInputBound(true);
}

// NOTE: RESIZE

export function bindResizeHandler() {
     if (resizeHandlerBound) {
          return;
     }

     window.addEventListener("resize", handleWindowResize);
     setResizeHandlerBound(true);
}