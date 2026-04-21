// NOTE: INPUT SYSTEM
// Handles keyboard, pointer/touch movement, touch buttons, screen clicks, and resize binding.

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
     setTouchMoveTarget,
     clearTouchMoveTarget,
     setPauseButtonPressed,
     setPauseButtonPointerId
} from "./state.js";

import {
     updateMenuUiBounds,
     startNewGameRound,
     cycleObstaclesLevel,
     cycleMusicLevel,
     cycleSoundEffectsLevel,
     isPointInsideMenuPanel,
     isScreenWelcomeActive,
     isOverlayScreenActive,
     getScreenActionUi,
     getPausedActionUi,
     dismissScreenWelcomeToStart,
     dismissScreenWelcomeToInstructionsMenu,
     dismissScreenWelcomeToOptionsMenu,
     dismissMenuBackToPreviousScreen
} from "./ui_mode.js";

// EDGE CONTROLS
const touchControlLayout = {
     buttonEdgePaddingX: 5,
     buttonEdgePaddingY: 5,
     buttonGap: 10,
     buttonVisualScale: 1
};

// KEY HELPERS

function normalizeKeyName(key) {
     if (!key) {
          return "";
     }

     const lower = String(key).toLowerCase();

     if (lower === " ") {
          return "space";
     }

     if (lower === "esc") {
          return "escape";
     }

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

function isAnyScreenActive() {
     return isScreenWelcomeActive() || isOverlayScreenActive();
}

function setMenuViewAndRefresh(view) {
     setGameMenuView(view);
     updateMenuUiBounds();
}

function openScreenView(view, shouldPause = true) {
     setGameMenuOpen(true);
     setMenuViewAndRefresh(view);

     if (shouldPause && gameStarted && !gameOver && !gameWon) {
          setGamePaused(true);
     }
}

// CONTROL HIT CIRCLE

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

     return {
          x: ((event.clientX - rect.left) / safeWidth) * (miniGameWidth || safeWidth),
          y: ((event.clientY - rect.top) / safeHeight) * (miniGameHeight || safeHeight)
     };
}

// SCREEN BUTTON LOOKUP

function getMenuButtonAtPoint(x, y) {
     if (!gameMenuOpen) {
          return null;
     }

     if (!isPointInsideMenuPanel(x, y)) {
          return null;
     }

     if (gameMenuView === "options") {
          if (isPointInsideRect(x, y, gameMenuUi.obstaclesToggleButton)) {
               return "obstacles";
          }

          if (isPointInsideRect(x, y, gameMenuUi.musicToggleButton)) {
               return "music";
          }

          if (isPointInsideRect(x, y, gameMenuUi.soundEffectsToggleButton)) {
               return "sound_fx";
          }
     }

     if (isPointInsideRect(x, y, gameMenuUi.backButton)) {
          return "back";
     }

     return null;
}

function getScreenButtonAtPoint(x, y) {
     if (!isAnyScreenActive()) {
          return null;
     }

     const screenUi = getScreenActionUi();

     if (isPointInsideRect(x, y, screenUi.startButton)) {
          return "start";
     }

     if (isPointInsideRect(x, y, screenUi.instructionsButton)) {
          return "instructions";
     }

     if (isPointInsideRect(x, y, screenUi.menuButton)) {
          return "options";
     }

     return null;
}

function getPausedButtonAtPoint(x, y) {
     if (!gamePaused || gameMenuOpen || gameOver || gameWon) {
          return null;
     }

     const pausedUi = getPausedActionUi();

     if (isPointInsideRect(x, y, pausedUi.resumeButton)) {
          return "resume";
     }

     if (isPointInsideRect(x, y, pausedUi.instructionsButton)) {
          return "instructions";
     }

     if (isPointInsideRect(x, y, pausedUi.menuButton)) {
          return "options";
     }

     return null;
}

// CURSOR SYNC

function updateCanvasCursor(x, y) {
     if (!miniGameCanvas) {
          return;
     }

     let cursor = "default";

     if (isAnyScreenActive()) {
          if (getScreenButtonAtPoint(x, y)) {
               cursor = "pointer";
          }
     } else if (gamePaused && !gameMenuOpen && !gameOver && !gameWon) {
          if (getPausedButtonAtPoint(x, y)) {
               cursor = "pointer";
          }
     } else if (gameMenuOpen) {
          if (!isPointInsideMenuPanel(x, y) || getMenuButtonAtPoint(x, y)) {
               cursor = "pointer";
          }
     } else if (isPointInsideControlButton(x, y, touchControls.pauseButton)) {
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

// MOVEMENT

function updateTouchMovementFromPointer(event) {
     const pos = getCanvasPointerPosition(event);

     const nx = miniGameWidth > 0 ? (pos.x / miniGameWidth) : 0.5;
     const ny = miniGameHeight > 0 ? (pos.y / miniGameHeight) : 0.5;

     const clampedX = Math.max(0, Math.min(1, nx));
     const clampedY = Math.max(0, Math.min(1, ny));

     setTouchMoveTarget(clampedX, clampedY, event.pointerId);
}

function clearTouchMovement(pointerId) {
     clearTouchMoveTarget(pointerId);

     if (miniGameCanvas?.hasPointerCapture(pointerId)) {
          miniGameCanvas.releasePointerCapture(pointerId);
     }
}

// TOUCH CONTROL LAYOUT

export function updateTouchControlBounds() {
     const pauseButton = touchControls.pauseButton;

     if (!pauseButton) {
          return;
     }

     const pauseButtonRadius = (pauseButton.width / 2) * touchControlLayout.buttonVisualScale;
     const pauseButtonDiameter = pauseButtonRadius * 2;

     pauseButton.x = (miniGameWidth / 2) - (pauseButtonDiameter / 2);
     pauseButton.y =
          miniGameHeight -
          touchControlLayout.buttonEdgePaddingY -
          pauseButtonDiameter;
}

// TOUCH RESET

export function resetTouchControls() {
     const pauseButton = touchControls.pauseButton;

     if (pauseButton) {
          pauseButton.isPressed = false;
          pauseButton.pointerId = null;
     }

     clearTouchMoveTarget(touchControls.touchMoveTarget.pointerId);

     resetCanvasCursor();
     updateTouchControlBounds();
}

// BUTTON LABEL SYNC

export function updatePauseButtonState() {
     touchControls.pauseButton.label = "\u23EF\uFE0E";
}

// SCREEN CLOSE HELPER

function closeMenuToPreviousScreen() {
     dismissMenuBackToPreviousScreen();
     resetCanvasCursor();
}

// ROUND + SCREEN ACTIONS

function triggerPauseAction() {
     if (!gameStarted || gameOver || gameWon) {
          startNewGameRound();
          return;
     }

     if (gameMenuOpen) {
          closeMenuToPreviousScreen();
          return;
     }

     setGamePaused(!gamePaused);
}

function handleMenuClick(x, y) {
     if (!gameMenuOpen) {
          return false;
     }

     if (!isPointInsideMenuPanel(x, y)) {
          closeMenuToPreviousScreen();
          return true;
     }

     const target = getMenuButtonAtPoint(x, y);

     if (!target) {
          return true;
     }

     if (target === "obstacles") {
          cycleObstaclesLevel();
          updateMenuUiBounds();
          return true;
     }

     if (target === "music") {
          cycleMusicLevel();
          updateMenuUiBounds();
          return true;
     }

     if (target === "sound_fx") {
          cycleSoundEffectsLevel();
          updateMenuUiBounds();
          return true;
     }

     if (target === "back") {
          closeMenuToPreviousScreen();
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

     if (isAnyScreenActive()) {
          if (key === "space" || key === "enter") {
               dismissScreenWelcomeToStart();
          } else if (key === "escape") {
               dismissScreenWelcomeToOptionsMenu();
          }

          return;
     }

     if (gamePaused && !gameMenuOpen && !gameOver && !gameWon) {
          if (key === "space" || key === "enter") {
               setGamePaused(false);
               return;
          }

          if (key === "escape") {
               openScreenView("options", false);
               return;
          }
     }

     if (key === "escape") {
          if (gameMenuOpen) {
               closeMenuToPreviousScreen();
          } else {
               openScreenView("options");
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

function clearButtons(pointerId) {
     if (touchControls.pauseButton.pointerId === pointerId) {
          setPauseButtonPressed(false);
          setPauseButtonPointerId(null);
     }
}

// POINTER INPUT

function onPointerDown(event) {
     if (!miniGameCanvas) {
          return;
     }

     const pos = getCanvasPointerPosition(event);
     const pauseButton = touchControls.pauseButton;

     updateCanvasCursor(pos.x, pos.y);

     if (isAnyScreenActive()) {
          const screenTarget = getScreenButtonAtPoint(pos.x, pos.y);

          if (screenTarget === "start") {
               dismissScreenWelcomeToStart();
               event.preventDefault();
               return;
          }

          if (screenTarget === "instructions") {
               dismissScreenWelcomeToInstructionsMenu();
               event.preventDefault();
               return;
          }

          if (screenTarget === "options") {
               dismissScreenWelcomeToOptionsMenu();
               event.preventDefault();
               return;
          }

          return;
     }

     if (gamePaused && !gameMenuOpen && !gameOver && !gameWon) {
          const pausedTarget = getPausedButtonAtPoint(pos.x, pos.y);

          if (pausedTarget === "resume") {
               setGamePaused(false);
               event.preventDefault();
               return;
          }

          if (pausedTarget === "instructions") {
               openScreenView("instructions", false);
               event.preventDefault();
               return;
          }

          if (pausedTarget === "options") {
               openScreenView("options", false);
               event.preventDefault();
               return;
          }

          return;
     }

     if (handleMenuClick(pos.x, pos.y)) {
          event.preventDefault();
          return;
     }

     if (isPointInsideControlButton(pos.x, pos.y, pauseButton)) {
          setPauseButtonPressed(true);
          setPauseButtonPointerId(event.pointerId);
          triggerPauseAction();
          event.preventDefault();
          return;
     }

     if (miniGameCanvas?.setPointerCapture) {
          miniGameCanvas.setPointerCapture(event.pointerId);
     }

     updateTouchMovementFromPointer(event);
     event.preventDefault();
}

function onPointerMove(event) {
     const pos = getCanvasPointerPosition(event);

     updateCanvasCursor(pos.x, pos.y);

     if (isAnyScreenActive()) {
          return;
     }

     if (
          touchControls.touchMoveTarget.isActive &&
          touchControls.touchMoveTarget.pointerId === event.pointerId
     ) {
          updateTouchMovementFromPointer(event);
          event.preventDefault();
     }
}

function onPointerUp(event) {
     if (isAnyScreenActive()) {
          if (miniGameCanvas) {
               const pos = getCanvasPointerPosition(event);
               updateCanvasCursor(pos.x, pos.y);
          }

          return;
     }

     clearTouchMovement(event.pointerId);
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

// RESIZE

function handleWindowResize() {
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
