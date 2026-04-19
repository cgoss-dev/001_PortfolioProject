// NOTE: INPUT SYSTEM
// Handles keyboard, pointer/touch movement, touch buttons, menu clicks, and resize binding.

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
     setLeftButtonPressed,
     setLeftButtonPointerId,
     setRightButtonPressed,
     setRightButtonPointerId
} from "./state.js";

// NOTE: UI MODE IMPORTS
// input.js should talk to ui_mode.js, not ui_draw.js.
// Input needs hitboxes/state transitions, not rendering functions.
import {
     updateMenuUiBounds,
     startNewGameRound,
     cycleDifficulty,
     toggleAllSound,
     isPointInsideMenuPanel,
     isGameWelcomeActive,
     getGameWelcomeUi,
     getGamePausedUi,
     dismissGameWelcomeToStart,
     dismissGameWelcomeToInstructionsMenu,
     dismissGameWelcomeToMenu,
     dismissGameWelcomeBackToMain
} from "./ui_mode.js";

// NOTE: EDGE CONTROLS
// Fixed edge spacing is defined here. Resize drift is prevented by anchoring from canvas edges here.
const touchControlLayout = {
     buttonEdgePaddingX: 5,
     buttonEdgePaddingY: 5,

     buttonGap: 5,

     // VISUAL EDGE BUFFER - Extra room is added here because drawn circles extend past raw rect size.
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

// CONTROL HIT CIRCLE
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

     if (isPointInsideRect(x, y, welcomeUi.instructionsButton)) {
          return "instructions";
     }

     if (isPointInsideRect(x, y, welcomeUi.menuButton)) {
          return "menu";
     }

     return null;
}

// NOTE: PAUSED BUTTON LOOKUP
// Pause marquee action word bounds are read from ui_mode state here.
function getPausedButtonAtPoint(x, y) {
     if (!gamePaused || gameMenuOpen || gameOver || gameWon) {
          return null;
     }

     const pausedUi = getGamePausedUi();

     if (isPointInsideRect(x, y, pausedUi.resumeButton)) {
          return "resume";
     }

     if (isPointInsideRect(x, y, pausedUi.instructionsButton)) {
          return "instructions";
     }

     if (isPointInsideRect(x, y, pausedUi.menuButton)) {
          return "menu";
     }

     return null;
}

// CURSOR SYNC
// Canvas cursor is swapped here when clickable areas are crossed.
function updateCanvasCursor(x, y) {
     if (!miniGameCanvas) {
          return;
     }

     let cursor = "default";

     // WELCOME CURSOR
     // Only action words are treated as clickable while welcome state is active.
     if (isGameWelcomeActive()) {
          if (getWelcomeButtonAtPoint(x, y)) {
               cursor = "pointer";
          }

     } else if (gamePaused && !gameMenuOpen && !gameOver && !gameWon) {
          if (getPausedButtonAtPoint(x, y)) {
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
     }

     miniGameCanvas.style.cursor = cursor;
}

function resetCanvasCursor() {
     if (!miniGameCanvas) {
          return;
     }

     miniGameCanvas.style.cursor = "default";
}

// NOTE: FULL-CANVAS TOUCH MOVEMENT
// This is the part that actually sends pointer position into shared game state.
// Without this setter call, touch/mouse movement will look dead even though events are firing.
function updateTouchMovementFromPointer(event) {
     const pos = getCanvasPointerPosition(event);

     // Normalized 0..1 target across the whole canvas.
     const nx = miniGameWidth > 0 ? (pos.x / miniGameWidth) : 0.5;
     const ny = miniGameHeight > 0 ? (pos.y / miniGameHeight) : 0.5;

     // Clamp just to be safe.
     const clampedX = Math.max(0, Math.min(1, nx));
     const clampedY = Math.max(0, Math.min(1, ny));

     setTouchMoveTarget(clampedX, clampedY, event.pointerId);
}

// NOTE: TOUCH RELEASE
// Releasing clears the movement target for the pointer that was controlling movement.
function clearTouchMovement(pointerId) {
     clearTouchMoveTarget(pointerId);

     if (miniGameCanvas?.hasPointerCapture(pointerId)) {
          miniGameCanvas.releasePointerCapture(pointerId);
     }
}

// TOUCH CONTROL LAYOUT

export function updateTouchControlBounds() {
     const leftButton = touchControls.leftButton;
     const rightButton = touchControls.rightButton;

     if (!leftButton || !rightButton) {
          return;
     }

     const buttonLeftRadius = (leftButton.width / 2) * touchControlLayout.buttonVisualScale;
     const buttonRightRadius = (rightButton.width / 2) * touchControlLayout.buttonVisualScale;

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
     const leftButton = touchControls.leftButton;
     const rightButton = touchControls.rightButton;

     if (leftButton) {
          leftButton.isPressed = false;
          leftButton.pointerId = null;
     }

     if (rightButton) {
          rightButton.isPressed = false;
          rightButton.pointerId = null;
     }

     // NOTE: MOVEMENT RESET
     // When a round/menu/welcome reset happens, touch movement should stop too.
     clearTouchMoveTarget(touchControls.touchMoveTarget.pointerId);

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
function closeMenuAndResetView(shouldUnpause = true) {
     setGameMenuOpen(false);
     setGameMenuView("main");
     resetCanvasCursor();

     // RETURN TO WELCOME BEFORE FIRST GAME
     // If the player has not started a round yet, closing the menu should
     // go back to the welcome screen instead of leaving the game in a
     // "not started but visible" state.
     if (!gameStarted) {
          dismissGameWelcomeBackToMain();
          return;
     }

     // OPTIONAL UNPAUSE
     // Some menu exits should resume gameplay, but Back can stay paused.
     if (shouldUnpause && gameStarted && !gameOver && !gameWon) {
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
               // NOTE: NEW GAME - RETURN TO WELCOME SCREEN
               setGameMenuOpen(false);
               dismissGameWelcomeBackToMain();
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
          // NOTE: BACK FROM INSTRUCTIONS - WELCOME SCREEN
          if (gameMenuView === "instructions") {
               setGameMenuOpen(false);
               dismissGameWelcomeBackToMain();
               return true;
          }

          // Normal behavior for other cases
          if (gameMenuView !== "main") {
               setGameMenuView("main");
          } else {
               // NOTE: BACK SHOULD NOT UNPAUSE
               // Closing from the Back button leaves the game paused.
               closeMenuAndResetView(false);
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

     // WELCOME KEY DISMISS
     // Enter starts game from welcome state here. Escape opens menu.
     if (isGameWelcomeActive()) {
          if (key === "space" || key === "enter") {
               dismissGameWelcomeToStart();
          } else if (key === "escape") {
               dismissGameWelcomeToMenu();
          }

          return;
     }

     // PAUSED MARQUEE KEY ACTIONS
     // Enter/space resumes from the paused marquee before reaching gameplay input.
     if (gamePaused && !gameMenuOpen && !gameOver && !gameWon) {
          if (key === "space" || key === "enter") {
               setGamePaused(false);
               return;
          }

          if (key === "escape") {
               setGameMenuOpen(true);
               setGameMenuView("main");
               return;
          }
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
     const leftButton = touchControls.leftButton;
     const rightButton = touchControls.rightButton;

     updateCanvasCursor(pos.x, pos.y);

     // WELCOME CLICK ACTIONS
     // Welcome actions are routed only through measured word bounds here.
     if (isGameWelcomeActive()) {
          const welcomeTarget = getWelcomeButtonAtPoint(pos.x, pos.y);

          if (welcomeTarget === "start") {
               dismissGameWelcomeToStart();
               event.preventDefault();
               return;
          }

          // WELCOME INSTRUCTIONS ROUTE
          // This opens the existing instructions submenu inside the menu system.
          if (welcomeTarget === "instructions") {
               dismissGameWelcomeToInstructionsMenu();
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

     // PAUSED MARQUEE CLICK ACTIONS
     // Resume/Tips/Menu are routed through measured word bounds here.
     if (gamePaused && !gameMenuOpen && !gameOver && !gameWon) {
          const pausedTarget = getPausedButtonAtPoint(pos.x, pos.y);

          if (pausedTarget === "resume") {
               setGamePaused(false);
               event.preventDefault();
               return;
          }

          if (pausedTarget === "instructions") {
               setGameMenuOpen(true);
               setGameMenuView("instructions");
               event.preventDefault();
               return;
          }

          if (pausedTarget === "menu") {
               setGameMenuOpen(true);
               setGameMenuView("main");
               event.preventDefault();
               return;
          }

          // While paused, clicks should not steer movement behind the marquee.
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

     // FULL-CANVAS TOUCH MOVE
     // Any touch that is not on the pause/menu buttons is used for movement.
     if (miniGameCanvas?.setPointerCapture) {
          miniGameCanvas.setPointerCapture(event.pointerId);
     }

     updateTouchMovementFromPointer(event);
     event.preventDefault();
}

function onPointerMove(event) {
     const pos = getCanvasPointerPosition(event);

     updateCanvasCursor(pos.x, pos.y);

     // WELCOME MOVE GATE
     // Control motion is ignored here until welcome state is dismissed.
     if (isGameWelcomeActive()) {
          return;
     }

     // NOTE: ACTIVE POINTER CHECK
     // Only the pointer that started movement is allowed to keep updating it.
     // This matters more on touchscreens, where multiple fingers can exist at once.
     if (
          touchControls.touchMoveTarget.isActive &&
          touchControls.touchMoveTarget.pointerId === event.pointerId
     ) {
          updateTouchMovementFromPointer(event);
          event.preventDefault();
     }
}

function onPointerUp(event) {
     // WELCOME RELEASE GATE
     // Control resets are skipped here while welcome state is active.
     if (isGameWelcomeActive()) {
          if (miniGameCanvas) {
               const pos = getCanvasPointerPosition(event);
               updateCanvasCursor(pos.x, pos.y);
          }
          return;
     }

     // Reset any control that belongs to this pointer.
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

// NOTE: RESIZE

function handleWindowResize() {
     // Canvas sizing itself is handled by ui_mode.js.
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