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
     isPointInsideMenuPanel,
     isGameWelcomeActive,
     getGameWelcomeUi,
     dismissGameWelcomeToStart,
     dismissGameWelcomeToMenu
} from "./ui.js";

// NOTE: EDGE CONTROLS
// Fixed edge spacing is defined here. Resize drift is prevented by anchoring from canvas edges here.
const touchControlLayout = {
     joystickEdgePaddingX: 2,
     joystickEdgePaddingY: 2,

     buttonEdgePaddingX: 5,
     buttonEdgePaddingY: 5,

     buttonGap: 16,

     // VISUAL EDGE BUFFER
     // Extra room is added here because drawn circles extend past raw rect size.
     joystickVisualScale: 1,
     buttonVisualScale: 1.25
};

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

// NOTE: CONTROL HIT CIRCLE
// Visual draw radius is matched here so click feel stays consistent.
function isPointInsideControlButton(x, y, button) {
     if (!button) {
          return false;
     }

     const centerX = button.x + (button.width / 2);
     const centerY = button.y + (button.height / 2);
     const hitRadius = (button.width / 2) * touchControlLayout.buttonVisualScale;

     return isPointInsideCircle(x, y, centerX, centerY, hitRadius);
}

function getCanvasPointerPosition(event) {
     if (!miniGameCanvas) {
          return { x: 0, y: 0 };
     }

     const rect = miniGameCanvas.getBoundingClientRect();
     const safeWidth = rect.width || 1;
     const safeHeight = rect.height || 1;

     // miniGameWidth / miniGameHeight may still be 0 during early startup.
     // If that happens, fallback is pulled from visible canvas size from DOM rect so pointer math still works on first interaction.
     return {
          x: ((event.clientX - rect.left) / safeWidth) * (miniGameWidth || safeWidth),
          y: ((event.clientY - rect.top) / safeHeight) * (miniGameHeight || safeHeight)
     };
}

// NOTE: MENU BUTTON LOOKUP
// Active menu item is detected from pointer position here.
function getMenuButtonAtPoint(x, y) {
     if (!gameMenuOpen) {
          return null;
     }

     if (!isPointInsideMenuPanel(x, y)) {
          return null;
     }

     if (gameMenuView === "main") {
          if (isPointInsideRect(x, y, gameMenuUi.newGameButton)) {
               return gameMenuUi.newGameButton;
          }

          if (isPointInsideRect(x, y, gameMenuUi.instructionsButton)) {
               return gameMenuUi.instructionsButton;
          }

          if (isPointInsideRect(x, y, gameMenuUi.difficultyButton)) {
               return gameMenuUi.difficultyButton;
          }

          if (isPointInsideRect(x, y, gameMenuUi.soundButton)) {
               return gameMenuUi.soundButton;
          }
     }

     if (isPointInsideRect(x, y, gameMenuUi.backButton)) {
          return gameMenuUi.backButton;
     }

     return null;
}

// NOTE: WELCOME BUTTON LOOKUP
// Welcome action word bounds are read from ui state here.
function getWelcomeButtonAtPoint(x, y) {
     if (!isGameWelcomeActive()) {
          return null;
     }

     const welcomeUi = getGameWelcomeUi();

     if (isPointInsideRect(x, y, welcomeUi.startButton)) {
          return "start";
     }

     if (isPointInsideRect(x, y, welcomeUi.menuButton)) {
          return "menu";
     }

     return null;
}

// NOTE: CURSOR SYNC
// Canvas cursor is swapped here when clickable areas are crossed.
function updateCanvasCursor(x, y) {
     if (!miniGameCanvas) {
          return;
     }

     let cursor = "default";

     // NOTE: WELCOME CURSOR
     // Only action words are treated as clickable while welcome state is active.
     if (isGameWelcomeActive()) {
          if (getWelcomeButtonAtPoint(x, y)) {
               cursor = "pointer";
          }

     } else if (gameMenuOpen) {
          if (!isPointInsideMenuPanel(x, y)) {
               cursor = "pointer";
          } else if (getMenuButtonAtPoint(x, y)) {
               cursor = "pointer";
          }
     } else if (isPointInsideControlButton(x, y, touchControls.leftButton)) {
          cursor = "pointer";
     } else if (isPointInsideControlButton(x, y, touchControls.rightButton)) {
          cursor = "pointer";
     } else if (
          isPointInsideCircle(
               x,
               y,
               touchControls.joystick.centerX,
               touchControls.joystick.centerY,
               touchControls.joystick.baseRadius
          )
     ) {
          cursor = "pointer";
     }

     miniGameCanvas.style.cursor = cursor;
}

function resetCanvasCursor() {
     if (!miniGameCanvas) {
          return;
     }

     miniGameCanvas.style.cursor = "default";
}

// TOUCH CONTROL LAYOUT

export function updateTouchControlBounds() {
     const joystick = touchControls.joystick;
     const leftButton = touchControls.leftButton;
     const rightButton = touchControls.rightButton;

     if (!joystick || !leftButton || !rightButton) {
          return;
     }

     const joystickEdgeRadius = joystick.baseRadius * touchControlLayout.joystickVisualScale;
     const buttonLeftRadius = (leftButton.width / 2) * touchControlLayout.buttonVisualScale;
     const buttonRightRadius = (rightButton.width / 2) * touchControlLayout.buttonVisualScale;

     // JOYSTICK EDGE ANCHOR
     // Position is measured from left and bottom canvas edges here. Same spacing is preserved during resize here.
     joystick.centerX = touchControlLayout.joystickEdgePaddingX + joystickEdgeRadius;
     joystick.centerY = miniGameHeight - touchControlLayout.joystickEdgePaddingY - joystickEdgeRadius;

     // RIGHT BUTTON EDGE ANCHOR
     // Position is measured from right and bottom canvas edges here. Same spacing is preserved during resize here.
     rightButton.x = miniGameWidth - touchControlLayout.buttonEdgePaddingX - (buttonRightRadius * 2);
     rightButton.y = miniGameHeight - touchControlLayout.buttonEdgePaddingY - (buttonRightRadius * 2);

     // LEFT BUTTON EDGE ANCHOR
     // Gap is measured from right button here. Bottom alignment is matched here.
     leftButton.x = rightButton.x - touchControlLayout.buttonGap - (buttonLeftRadius * 2);
     leftButton.y = rightButton.y;
}

// TOUCH RESET

export function resetTouchControls() {
     const joystick = touchControls.joystick;
     const leftButton = touchControls.leftButton;
     const rightButton = touchControls.rightButton;

     if (joystick) {
          joystick.knobX = 0;
          joystick.knobY = 0;
          joystick.pointerId = null;
          joystick.isActive = false;
     }

     if (leftButton) {
          leftButton.isPressed = false;
          leftButton.pointerId = null;
     }

     if (rightButton) {
          rightButton.isPressed = false;
          rightButton.pointerId = null;
     }

     resetCanvasCursor();

     // EDGE LAYOUT REFRESH
     // Fresh edge anchors are applied here after reset.
     updateTouchControlBounds();
}

// BUTTON LABEL SYNC

export function updatePauseButtonState() {
     touchControls.leftButton.label = "\u23EF\uFE0E";
     touchControls.rightButton.label = "\u2630\uFE0E";
}

// MENU CLOSE HELPER
// Menu has 2 separate pieces of state:
// 1. gameMenuOpen = whether menu is visible
// 2. gameMenuView = which screen inside menu is showing
// If only menu is closed, old screen will be remembered and reopened next time.
// This helper makes sure every close resets back to main menu.
function closeMenuAndResetView() {
     setGameMenuOpen(false);
     setGameMenuView("main");
     resetCanvasCursor();

     // If player is mid-game and not in a win/lose state, closing menu should also unpause gameplay.
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

     // If pause/play button is pressed while menu is open,
     // treat it as a full menu close and reset back to main menu.
     if (gameMenuOpen) {
          closeMenuAndResetView();
          return;
     }

     setGamePaused(!gamePaused);
}

function triggerMenuAction() {
     if (gameMenuOpen) {
          // If menu is open on a submenu like "instructions",
          // first menu-button press returns to main menu.
          if (gameMenuView !== "main") {
               setGameMenuView("main");
               return;
          }

          // If already on main menu, pressing menu button closes it fully.
          closeMenuAndResetView();
          return;
     }

     // Always open fresh on main menu screen.
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

     // Clicking outside menu panel closes it completely
     // and resets view so next open starts at main.
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
          // - from main menu -> close menu fully
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

     // NOTE: WELCOME KEY DISMISS
     // Enter starts game from welcome state here. Escape opens menu.
     if (isGameWelcomeActive()) {
          if (key === "space" || key === "enter") {
               dismissGameWelcomeToStart();
          } else if (key === "escape") {
               dismissGameWelcomeToMenu();
          }

          return;
     }

     if (key === "escape") {
          if (gameMenuOpen) {
               if (gameMenuView !== "main") {
                    setGameMenuView("main");
               } else {
                    closeMenuAndResetView();
               }
          } else {
               // ESC always opens to main menu, never last submenu.
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

     // Distance from center (how far thumb moved)
     const distance = Math.sqrt((dx * dx) + (dy * dy));
     const max = joystick.baseRadius;

     // Clamp movement so knob never leaves base circle
     const clamped = Math.min(distance, max);

     // Convert direction into angle (smooth diagonal movement)
     const angle = Math.atan2(dy, dx);

     // Convert back into x/y using clamped distance
     const x = Math.cos(angle) * clamped;
     const y = Math.sin(angle) * clamped;

     // Move visible knob
     setJoystickKnobOffset(x, y);

     // Normalize input (-1 to 1 range)
     const nx = x / max;
     const ny = y / max;

     // Instead of sqrt(nx*nx + ny*ny), clamped/max can be reused.
     const magnitude = clamped / max;

     // DEADZONE
     // Very tiny movements near center are usually accidental.
     if (magnitude < joystick.deadZone) {
          // SOFT CENTER
          // Instead of snapping instantly to zero,
          // small movement is scaled down near center.
          const scale = magnitude / joystick.deadZone;
          setJoystickInput(nx * scale, ny * scale);
          return;
     }

     // SMOOTH RAMP
     // Movement is scaled smoothly after leaving deadzone.
     const adjustedMagnitude = (magnitude - joystick.deadZone) / (1 - joystick.deadZone);
     const safeMagnitude = Math.max(0, Math.min(1, adjustedMagnitude));

     setJoystickInput(nx * safeMagnitude, ny * safeMagnitude);
}

// JOYSTICK RESET
// When touch ends, joystick state is fully reset.

function clearJoystick(pointerId) {
     const joystick = touchControls.joystick;

     // Only pointer that started this joystick can release it.
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

     updateCanvasCursor(pos.x, pos.y);

     // NOTE: WELCOME CLICK ACTIONS
     // Welcome actions are routed only through measured word bounds here.
     if (isGameWelcomeActive()) {
          const welcomeTarget = getWelcomeButtonAtPoint(pos.x, pos.y);

          if (welcomeTarget === "start") {
               dismissGameWelcomeToStart();
               event.preventDefault();
               return;
          }

          if (welcomeTarget === "menu") {
               dismissGameWelcomeToMenu();
               event.preventDefault();
               return;
          }

          return;
     }

     if (handleMenuClick(pos.x, pos.y)) {
          event.preventDefault();
          return;
     }

     if (isPointInsideControlButton(pos.x, pos.y, leftButton)) {
          setLeftButtonPressed(true);
          setLeftButtonPointerId(event.pointerId);
          triggerPauseAction();
          event.preventDefault();
          return;
     }

     if (isPointInsideControlButton(pos.x, pos.y, rightButton)) {
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

          // Lock this pointer to canvas so control is not lost
          // if finger drifts slightly outside.
          if (miniGameCanvas?.setPointerCapture) {
               miniGameCanvas.setPointerCapture(event.pointerId);
          }

          event.preventDefault();
     }
}

function onPointerMove(event) {
     const joystick = touchControls.joystick;
     const pos = getCanvasPointerPosition(event);

     updateCanvasCursor(pos.x, pos.y);

     // NOTE: WELCOME MOVE GATE
     // Control motion is ignored here until welcome state is dismissed.
     if (isGameWelcomeActive()) {
          return;
     }

     // Only active pointer can move joystick.
     if (joystick.isActive && joystick.pointerId === event.pointerId) {
          updateJoystickFromPointer(event);
          event.preventDefault();
     }
}

function onPointerUp(event) {
     // NOTE: WELCOME RELEASE GATE
     // Control resets are skipped here while welcome state is active.
     if (isGameWelcomeActive()) {
          if (miniGameCanvas) {
               const pos = getCanvasPointerPosition(event);
               updateCanvasCursor(pos.x, pos.y);
          }
          return;
     }

     // Reset any control that belongs to this pointer.
     clearJoystick(event.pointerId);
     clearButtons(event.pointerId);

     if (miniGameCanvas) {
          const pos = getCanvasPointerPosition(event);
          updateCanvasCursor(pos.x, pos.y);
     }
}

function onPointerLeave() {
     resetCanvasCursor();
}

export function bindPointerInput() {
     if (!miniGameCanvas || pointerInputBound) {
          return;
     }

     miniGameCanvas.style.touchAction = "none";
     resetCanvasCursor();

     miniGameCanvas.addEventListener("pointerdown", onPointerDown, { passive: false });
     miniGameCanvas.addEventListener("pointermove", onPointerMove, { passive: false });
     miniGameCanvas.addEventListener("pointerup", onPointerUp);
     miniGameCanvas.addEventListener("pointercancel", onPointerUp);
     miniGameCanvas.addEventListener("pointerleave", onPointerLeave);

     setPointerInputBound(true);
}

// NOTE: RESIZE

function handleWindowResize() {
     // Canvas sizing itself is handled by ui.js.
     // This file only refreshes input layout after size changes.
     updateTouchControlBounds();
     updateMenuUiBounds();
     resetCanvasCursor();
}

export function bindResizeHandler() {
     if (resizeHandlerBound) {
          return;
     }

     window.addEventListener("resize", handleWindowResize);
     setResizeHandlerBound(true);
}