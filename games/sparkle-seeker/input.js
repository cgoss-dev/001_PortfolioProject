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
     decreaseObstaclesLevel,
     increaseObstaclesLevel,
     decreaseMusicLevel,
     increaseMusicLevel,
     decreaseSoundEffectsLevel,
     increaseSoundEffectsLevel,
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
     buttonSize: 60,
     buttonEdgePaddingX: 10,
     buttonEdgePaddingY: 10,
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

function capturePointer(pointerId) {
     if (!miniGameCanvas?.setPointerCapture) {
          return;
     }

     miniGameCanvas.setPointerCapture(pointerId);
}

function releasePointer(pointerId) {
     if (!miniGameCanvas?.hasPointerCapture?.(pointerId)) {
          return;
     }

     miniGameCanvas.releasePointerCapture(pointerId);
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
          if (isPointInsideRect(x, y, gameMenuUi.obstaclesDecreaseButton)) {
               return "obstacles_decrease";
          }

          if (isPointInsideRect(x, y, gameMenuUi.obstaclesIncreaseButton)) {
               return "obstacles_increase";
          }

          if (isPointInsideRect(x, y, gameMenuUi.musicDecreaseButton)) {
               return "music_decrease";
          }

          if (isPointInsideRect(x, y, gameMenuUi.musicIncreaseButton)) {
               return "music_increase";
          }

          if (isPointInsideRect(x, y, gameMenuUi.soundEffectsDecreaseButton)) {
               return "sound_fx_decrease";
          }

          if (isPointInsideRect(x, y, gameMenuUi.soundEffectsIncreaseButton)) {
               return "sound_fx_increase";
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

// TOUCH CONTROL LAYOUT

export function updateTouchControlBounds() {
     const pauseButton = touchControls.pauseButton;

     if (!pauseButton) {
          return;
     }

     const buttonDiameter = touchControlLayout.buttonSize * touchControlLayout.buttonVisualScale;

     pauseButton.x = (miniGameWidth / 2) - (buttonDiameter / 2);
     pauseButton.y =
          miniGameHeight -
          touchControlLayout.buttonEdgePaddingY -
          buttonDiameter;
     pauseButton.width = buttonDiameter;
     pauseButton.height = buttonDiameter;
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

     if (target === "obstacles_decrease") {
          decreaseObstaclesLevel();
          updateMenuUiBounds();
          return true;
     }

     if (target === "obstacles_increase") {
          increaseObstaclesLevel();
          updateMenuUiBounds();
          return true;
     }

     if (target === "music_decrease") {
          decreaseMusicLevel();
          updateMenuUiBounds();
          return true;
     }

     if (target === "music_increase") {
          increaseMusicLevel();
          updateMenuUiBounds();
          return true;
     }

     if (target === "sound_fx_decrease") {
          decreaseSoundEffectsLevel();
          updateMenuUiBounds();
          return true;
     }

     if (target === "sound_fx_increase") {
          increaseSoundEffectsLevel();
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
          key === "arrowleft" ||
          key === "arrowdown" ||
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

     event.preventDefault();

     const pos = getCanvasPointerPosition(event);

     updateCanvasCursor(pos.x, pos.y);

     if (isAnyScreenActive()) {
          const screenTarget = getScreenButtonAtPoint(pos.x, pos.y);

          if (screenTarget === "start") {
               dismissScreenWelcomeToStart();
               return;
          }

          if (screenTarget === "instructions") {
               dismissScreenWelcomeToInstructionsMenu();
               return;
          }

          if (screenTarget === "options") {
               dismissScreenWelcomeToOptionsMenu();
               return;
          }

          return;
     }

     if (gamePaused && !gameMenuOpen && !gameOver && !gameWon) {
          const pausedTarget = getPausedButtonAtPoint(pos.x, pos.y);

          if (pausedTarget === "resume") {
               setGamePaused(false);
               return;
          }

          if (pausedTarget === "instructions") {
               openScreenView("instructions", false);
               return;
          }

          if (pausedTarget === "options") {
               openScreenView("options", false);
               return;
          }

          return;
     }

     if (handleMenuClick(pos.x, pos.y)) {
          return;
     }

     if (isPointInsideControlButton(pos.x, pos.y, touchControls.pauseButton)) {
          setPauseButtonPressed(true);
          setPauseButtonPointerId(event.pointerId);
          capturePointer(event.pointerId);
          triggerPauseAction();
          return;
     }

     if (!gameStarted || gamePaused || gameMenuOpen || gameOver || gameWon) {
          return;
     }

     setTouchMoveTarget(pos.x, pos.y, event.pointerId);
     capturePointer(event.pointerId);
}

function onPointerMove(event) {
     event.preventDefault();

     const pos = getCanvasPointerPosition(event);
     updateCanvasCursor(pos.x, pos.y);

     if (touchControls.touchMoveTarget.pointerId === event.pointerId) {
          setTouchMoveTarget(pos.x, pos.y, event.pointerId);
     }
}

function onPointerUp(event) {
     event.preventDefault();

     clearButtons(event.pointerId);
     clearTouchMoveTarget(event.pointerId);
     releasePointer(event.pointerId);

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
     miniGameCanvas.addEventListener("pointerup", onPointerUp, { passive: false });
     miniGameCanvas.addEventListener("pointercancel", onPointerUp, { passive: false });
     miniGameCanvas.addEventListener("pointerleave", onPointerLeave);

     setPointerInputBound(true);
}

// NOTE: RESIZE

let resizeLayoutCallback = null;
let resizeFrameId = 0;

function runResizeLayout() {
     resizeFrameId = 0;

     if (resizeLayoutCallback) {
          resizeLayoutCallback();
     } else {
          updateTouchControlBounds();
          updateMenuUiBounds();
     }

     resetCanvasCursor();
}

function handleWindowResize() {
     if (resizeFrameId) {
          cancelAnimationFrame(resizeFrameId);
     }

     resizeFrameId = requestAnimationFrame(runResizeLayout);
}

export function bindResizeHandler(callback = null) {
     if (callback) {
          resizeLayoutCallback = callback;
     }

     if (resizeHandlerBound) {
          return;
     }

     window.addEventListener("resize", handleWindowResize);
     window.addEventListener("orientationchange", handleWindowResize);
     window.visualViewport?.addEventListener("resize", handleWindowResize);

     setResizeHandlerBound(true);
}
