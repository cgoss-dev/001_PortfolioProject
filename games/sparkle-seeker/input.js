// NOTE: INPUT SYSTEM
// Handles keyboard, pointer, touch joystick, touch buttons, menu clicks, and resize binding.

import {
     miniGameCanvas,
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

     // NOTE:
     // miniGameWidth / miniGameHeight may still be 0 during early startup.
     // If that happens, fall back to the visible canvas size from the DOM rect
     // so pointer math still works on first interaction.
     return {
          x: ((event.clientX - rect.left) / safeWidth) * (miniGameWidth || safeWidth),
          y: ((event.clientY - rect.top) / safeHeight) * (miniGameHeight || safeHeight)
     };
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
     leftButton.y = joystick.centerY - (leftButton.height / 2);

     rightButton.width = 64;
     rightButton.height = 64;
     rightButton.x = miniGameWidth - 82;
     rightButton.y = joystick.centerY - (rightButton.height / 2);
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
// Converts pointer position into:
// - knob position (visual)
// - normalized movement input (-1 to 1)

function updateJoystickFromPointer(event) {
     const joystick = touchControls.joystick;
     const pos = getCanvasPointerPosition(event);

     // Offset from joystick center
     const dx = pos.x - joystick.centerX;
     const dy = pos.y - joystick.centerY;

     // Distance from center (how far the thumb moved)
     const distance = Math.sqrt((dx * dx) + (dy * dy));
     const max = joystick.baseRadius;

     // Clamp movement so knob never leaves the base circle
     const clamped = Math.min(distance, max);

     // Convert direction into angle (smooth diagonal movement)
     const angle = Math.atan2(dy, dx);

     // Convert back into x/y using the clamped distance
     const x = Math.cos(angle) * clamped;
     const y = Math.sin(angle) * clamped;

     // Move the visible knob
     setJoystickKnobOffset(x, y);

     // Normalize input (-1 to 1 range)
     const nx = x / max;
     const ny = y / max;

     // NOTE:
     // Instead of sqrt(nx*nx + ny*ny), we can reuse clamped/max
     const magnitude = clamped / max;

     // NOTE: DEADZONE
     // Very tiny movements near the center are usually accidental.
     // We do not want full movement there.
     if (magnitude < joystick.deadZone) {
          // NOTE: SOFT CENTER
          // Instead of snapping straight to zero forever,
          // gently scale small motion near the center.
          const scale = magnitude / joystick.deadZone;
          setJoystickInput(nx * scale, ny * scale);
          return;
     }

     // NOTE: SMOOTH RAMP
     // Scale movement smoothly after leaving the deadzone.
     const adjustedMagnitude = (magnitude - joystick.deadZone) / (1 - joystick.deadZone);
     const safeMagnitude = Math.max(0, Math.min(1, adjustedMagnitude));

     setJoystickInput(nx * safeMagnitude, ny * safeMagnitude);
}

// NOTE: JOYSTICK RESET
// When touch ends, fully reset joystick state

function clearJoystick(pointerId) {
     const joystick = touchControls.joystick;

     // Only the pointer that started this joystick can release it
     if (joystick.pointerId !== pointerId) {
          return;
     }

     setJoystickActive(false);
     setJoystickPointerId(null);
     setJoystickKnobOffset(0, 0);
     setJoystickInput(0, 0);

     // Release pointer capture so future touches work normally
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

     // NOTE: JOYSTICK ACTIVATE
     // Only activate if touch starts inside joystick base
     if (isPointInsideCircle(pos.x, pos.y, joystick.centerX, joystick.centerY, joystick.baseRadius)) {
          setJoystickActive(true);
          setJoystickPointerId(event.pointerId);

          // Immediately update knob so it feels responsive on first touch
          updateJoystickFromPointer(event);

          // Lock this pointer to the canvas
          // Prevents losing control if finger drifts outside
          if (miniGameCanvas?.setPointerCapture) {
               miniGameCanvas.setPointerCapture(event.pointerId);
          }

          event.preventDefault();
     }
}

function onPointerMove(event) {
     const joystick = touchControls.joystick;

     // Only the active pointer can move the joystick
     if (joystick.isActive && joystick.pointerId === event.pointerId) {
          updateJoystickFromPointer(event);
          event.preventDefault();
     }
}

function onPointerUp(event) {
     // Reset controls tied to this pointer
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

function handleWindowResize() {
     // Canvas sizing is handled by ui.js.
     // This file only refreshes input-related layout after the size changes.
     updateTouchControlBounds();
     updateMenuUiBounds();
}

export function bindResizeHandler() {
     if (resizeHandlerBound) {
          return;
     }

     window.addEventListener("resize", handleWindowResize);
     setResizeHandlerBound(true);
}