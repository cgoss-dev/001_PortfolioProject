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

// KEY HELPERS

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

     // miniGameWidth / miniGameHeight may still be 0 during early startup.
     // If that happens, fall back to the visible canvas size from the DOM rect so pointer math still works on first interaction.
     return {
          x: ((event.clientX - rect.left) / safeWidth) * (miniGameWidth || safeWidth),
          y: ((event.clientY - rect.top) / safeHeight) * (miniGameHeight || safeHeight)
     };
}

// TOUCH CONTROL LAYOUT

export function updateTouchControlBounds() {
     const joystick = touchControls.joystick;
     const leftButton = touchControls.leftButton;
     const rightButton = touchControls.rightButton;

     // CONTROL SCALE
     const controlScaleBase = Math.min(miniGameWidth, miniGameHeight);

     // Static joystick.
     const joystickBaseRadius = Math.max(36, Math.min(56, controlScaleBase * 0.10));
     // Mobile joystick.
     const joystickThumbRadius = Math.max(22, Math.min(38, joystickBaseRadius * 0.5)); 

     const buttonSize = Math.max(40, Math.min(56, controlScaleBase * 0.10));

     // Base edge spacing
     const edgePadding = Math.max(20, Math.min(32, controlScaleBase * 0.05));

     // Independent spacing controls used here
     const joystickEdgePadding = edgePadding * 0.5;
     const buttonEdgePadding = edgePadding * 0.5;

     const buttonGap = Math.max(4, Math.min(10, controlScaleBase * 0.01));

     // JOYSTICK SIZE + POSITION
     joystick.baseRadius = joystickBaseRadius;
     joystick.thumbRadius = joystickThumbRadius;

     joystick.centerX = joystickEdgePadding + joystick.baseRadius;
     joystick.centerY = miniGameHeight - joystickEdgePadding - joystick.baseRadius;

     // BUTTON SIZE
     leftButton.width = buttonSize;
     leftButton.height = buttonSize;

     rightButton.width = buttonSize;
     rightButton.height = buttonSize;

     // BUTTON POSITION
     // Button group pulled closer to right canvas edge using reduced padding.
     // Vertical alignment tied to joystick outer circle.

     leftButton.x = miniGameWidth - buttonEdgePadding - (buttonSize * 2) - buttonGap;
     leftButton.y = joystick.centerY + joystick.baseRadius - leftButton.height;

     rightButton.x = miniGameWidth - buttonEdgePadding - buttonSize;
     rightButton.y = joystick.centerY - joystick.baseRadius;
}

// TOUCH RESET

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

// BUTTON LABEL SYNC

export function updatePauseButtonState() {
     touchControls.leftButton.label = "\u23EF\uFE0E";
     touchControls.rightButton.label = "\u2630\uFE0E";
}

// MENU CLOSE HELPER
// The menu has 2 separate pieces of state:
// 1. gameMenuOpen = whether the menu is visible
// 2. gameMenuView = which screen inside the menu is showing
// If we only close the menu, it will remember the old screen and reopen there next time.
// This helper makes sure every close resets back to the main menu.
function closeMenuAndResetView() {
     setGameMenuOpen(false);
     setGameMenuView("main");

     // If the player is mid-game and not in a win/lose state, closing the menu should also unpause gameplay.
     if (gameStarted && !gameOver && !gameWon) {
          setGamePaused(false);
     }
}

// ROUND + MENU ACTIONS

function triggerPauseAction() {
     if (!gameStarted || gameOver || gameWon) {
          startNewGameRound();
          return;
     }

     // If the pause/play button is pressed while the menu is open,
     // treat it as a full menu close and reset back to the main menu.
     if (gameMenuOpen) {
          closeMenuAndResetView();
          return;
     }

     setGamePaused(!gamePaused);
}

function triggerMenuAction() {
     if (gameMenuOpen) {
          // If the menu is open on a submenu like "instructions",
          // the first menu-button press returns to the main menu.
          if (gameMenuView !== "main") {
               setGameMenuView("main");
               return;
          }

          // If already on the main menu, pressing the menu button closes it fully.
          closeMenuAndResetView();
          return;
     }

     // Always open fresh on the main menu screen.
     setGameMenuOpen(true);
     setGameMenuView("main");

     if (gameStarted && !gameOver && !gameWon) {
          setGamePaused(true);
     }
}

function handleMenuClick(x, y) {
     if (!gameMenuOpen) {
          return false;
     }

     // Clicking outside the menu panel closes it completely
     // and resets the view so the next open starts at main.
     if (!isPointInsideMenuPanel(x, y)) {
          closeMenuAndResetView();
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
          // Back behaves in two different ways:
          // - from a submenu -> return to main menu
          // - from main menu -> close the menu fully
          if (gameMenuView !== "main") {
               setGameMenuView("main");
          } else {
               closeMenuAndResetView();
          }

          return true;
     }

     return true;
}

// KEYBOARD INPUT

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
                    closeMenuAndResetView();
               }
          } else {
               // ESC always opens to the main menu, never the last submenu.
               setGameMenuOpen(true);
               setGameMenuView("main");

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

// JOYSTICK MATH
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

     // Instead of sqrt(nx*nx + ny*ny), we can reuse clamped/max.
     const magnitude = clamped / max;

     // DEADZONE
     // Very tiny movements near the center are usually accidental.
     if (magnitude < joystick.deadZone) {
          // SOFT CENTER
          // Instead of snapping instantly to zero,
          // scale small movement down near the center.
          const scale = magnitude / joystick.deadZone;
          setJoystickInput(nx * scale, ny * scale);
          return;
     }

     // SMOOTH RAMP
     // Scale movement smoothly after leaving the deadzone.
     const adjustedMagnitude = (magnitude - joystick.deadZone) / (1 - joystick.deadZone);
     const safeMagnitude = Math.max(0, Math.min(1, adjustedMagnitude));

     setJoystickInput(nx * safeMagnitude, ny * safeMagnitude);
}

// JOYSTICK RESET
// When touch ends, fully reset joystick state

function clearJoystick(pointerId) {
     const joystick = touchControls.joystick;

     // Only the pointer that started this joystick can release it.
     if (joystick.pointerId !== pointerId) {
          return;
     }

     setJoystickActive(false);
     setJoystickPointerId(null);
     setJoystickKnobOffset(0, 0);
     setJoystickInput(0, 0);

     // Release pointer capture so future touches work normally.
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

// POINTER INPUT

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

     // JOYSTICK ACTIVATE
     // Only activate if touch starts inside joystick base.
     if (isPointInsideCircle(pos.x, pos.y, joystick.centerX, joystick.centerY, joystick.baseRadius)) {
          setJoystickActive(true);
          setJoystickPointerId(event.pointerId);

          // Immediately update knob so it feels responsive on first touch.
          updateJoystickFromPointer(event);

          // Lock this pointer to the canvas so we do not lose control
          // if the finger drifts slightly outside.
          if (miniGameCanvas?.setPointerCapture) {
               miniGameCanvas.setPointerCapture(event.pointerId);
          }

          event.preventDefault();
     }
}

function onPointerMove(event) {
     const joystick = touchControls.joystick;

     // Only the active pointer can move the joystick.
     if (joystick.isActive && joystick.pointerId === event.pointerId) {
          updateJoystickFromPointer(event);
          event.preventDefault();
     }
}

function onPointerUp(event) {
     // Reset any control that belongs to this pointer.
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
     // Canvas sizing itself is handled by ui.js.
     // This file only refreshes input layout after the size changes.
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