// NOTE: 6 - INPUT
// Keyboard, pointer, touch, pause-button, menu-hitbox, and resize binding for Sparkle Seeker.
//
// Owned here:
// - keyboard movement input
// - pointer/touch movement target updates
// - pause button interaction
// - welcome / paused / menu click handling
// - one-time event binding
// - touch control reset
// - keyboard menu navigation
//
// NOT owned here:
// - game loop / round transitions
// - shared state storage
// - player movement math
// - menu rendering / layout math
//
// Newbie note:
// - This file should answer "what happens when the player presses or taps?"
// - If code stores flags/arrays, it belongs in `3_Vars.js`.
// - If code draws buttons, it belongs in `9_UI.js`.
// - If code decides win/lose flow, it belongs in `2_GameEngine.js`.

import {
     miniGameCanvas,
     keys,
     gameStarted,
     gamePaused,
     gameMenuOpen,
     gameMenuView,
     gameOver,
     gameWon,
     gameMenuUi,
     touchControls,
     screenActionUi,
     pausedActionUi,
     pointerInputBound,
     keyboardInputBound,
     resizeHandlerBound,
     welcomeSelectionIndex,
     pausedSelectionIndex,
     tipsSelectionIndex,
     optionsSelection,

     setTouchMoveTarget,
     clearTouchMoveTarget,
     setPauseButtonPressed,
     setPauseButtonPointerId,
     setPointerInputBound,
     setKeyboardInputBound,
     setResizeHandlerBound,
     setGamePaused,
     setGameMenuView,
     setWelcomeSelectionIndex,
     setPausedSelectionIndex,
     setTipsSelectionIndex,
     setOptionsSelectionRow,
     setOptionsSelectionCol
} from "./3_Vars.js";

import {
     dismissScreenWelcomeToStart,
     dismissScreenWelcomeToTipsMenu,
     dismissScreenWelcomeToOptionsMenu,
     dismissPausedToTipsMenu,
     dismissPausedToOptionsMenu,
     dismissMenuBackToPreviousScreen,
     showScreenWelcome,
     isScreenWelcomeActive,
     isOverlayScreenActive,
     startNewGameRound,
     decreaseHarmfulLevel,
     increaseHarmfulLevel,
     decreaseMusicLevel,
     increaseMusicLevel,
     decreaseSoundEffectsLevel,
     increaseSoundEffectsLevel
} from "./2_GameEngine.js";

import {
     syncUiBounds
} from "./9_UI.js";

function isPointInsideBox(x, y, box) {
     return box && x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
}

function getCanvasPoint(event) {
     if (!miniGameCanvas) {
          return { x: 0, y: 0 };
     }

     const rect = miniGameCanvas.getBoundingClientRect();

     return {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
     };
}

function preventPointerDefault(event) {
     if (event.pointerType === "touch") {
          event.preventDefault();
     }
}

function isPrimaryPointer(event) {
     return event.isPrimary !== false;
}

function isPausedOverlayActive() {
     return gameStarted && gamePaused && !gameMenuOpen && !gameOver && !gameWon;
}

function isTipsDetailView() {
     return (
          gameMenuView === "tips_how_to_play" ||
          gameMenuView === "tips_help_effects" ||
          gameMenuView === "tips_harm_effects"
     );
}

function isOptionsView() {
     return gameMenuView === "options";
}

function isTipsListView() {
     return gameMenuView === "tips";
}

function isUiNavigationActive() {
     return isScreenWelcomeActive() || isOverlayScreenActive() || isPausedOverlayActive() || gameMenuOpen;
}

function isPreviousMenuKey(event) {
     return event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "a" || event.key === "A" || event.key === "w" || event.key === "W";
}

function isNextMenuKey(event) {
     return event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "d" || event.key === "D" || event.key === "s" || event.key === "S";
}

function isLeftKey(event) {
     return event.key === "ArrowLeft" || event.key === "a" || event.key === "A";
}

function isRightKey(event) {
     return event.key === "ArrowRight" || event.key === "d" || event.key === "D";
}

function isUpKey(event) {
     return event.key === "ArrowUp" || event.key === "w" || event.key === "W";
}

function isDownKey(event) {
     return event.key === "ArrowDown" || event.key === "s" || event.key === "S";
}

function isEnterKey(event) {
     return event.key === "Enter";
}

function isEscapeKey(event) {
     return event.key === "Escape";
}

function isSpaceKey(event) {
     return event.key === " " || event.key === "Spacebar" || event.code === "Space";
}

function clamp(value, min, max) {
     return Math.max(min, Math.min(max, value));
}

function setStoredKeyState(event, isPressed) {
     keys[event.key] = isPressed;
     keys[event.key.toLowerCase()] = isPressed;
}

function releasePauseButton(pointerId = touchControls.pauseButton.pointerId) {
     if (pointerId !== null && touchControls.pauseButton.pointerId !== pointerId) {
          return;
     }

     setPauseButtonPressed(false);
     setPauseButtonPointerId(null);
}

function clearPointerMove(pointerId = touchControls.touchMoveTarget.pointerId) {
     if (pointerId === null) {
          touchControls.touchMoveTarget.pointerId = null;
          touchControls.touchMoveTarget.isActive = false;
          return;
     }

     clearTouchMoveTarget(pointerId);
}

function closeMenuAndRefresh() {
     dismissMenuBackToPreviousScreen();
     syncUiBounds();
}

function activateOptionAdjustment(optionName, direction) {
     if (optionName === "harmful") {
          direction < 0 ? decreaseHarmfulLevel() : increaseHarmfulLevel();
     }

     if (optionName === "music") {
          direction < 0 ? decreaseMusicLevel() : increaseMusicLevel();
     }

     if (optionName === "soundEffects") {
          direction < 0 ? decreaseSoundEffectsLevel() : increaseSoundEffectsLevel();
     }

     syncUiBounds();
}

export function resetTouchControls() {
     touchControls.touchMoveTarget.x = 0;
     touchControls.touchMoveTarget.y = 0;
     touchControls.touchMoveTarget.pointerId = null;
     touchControls.touchMoveTarget.isActive = false;

     setPauseButtonPressed(false);
     setPauseButtonPointerId(null);
}

export function updateTouchControlBounds() {
     syncUiBounds();
}

function handleWelcomeOrResultPointerDown(x, y) {
     if (!isScreenWelcomeActive() && !isOverlayScreenActive()) {
          return false;
     }

     if (isPointInsideBox(x, y, screenActionUi.startButton)) {
          setWelcomeSelectionIndex(0);

          if (isOverlayScreenActive()) {
               startNewGameRound();
          } else {
               dismissScreenWelcomeToStart();
          }

          return true;
     }

     if (isScreenWelcomeActive() && isPointInsideBox(x, y, screenActionUi.tipsButton)) {
          setWelcomeSelectionIndex(1);
          dismissScreenWelcomeToTipsMenu();
          return true;
     }

     if (isScreenWelcomeActive() && isPointInsideBox(x, y, screenActionUi.menuButton)) {
          setWelcomeSelectionIndex(2);
          dismissScreenWelcomeToOptionsMenu();
          return true;
     }

     return true;
}

function handlePausedOverlayPointerDown(x, y) {
     if (!isPausedOverlayActive()) {
          return false;
     }

     if (isPointInsideBox(x, y, pausedActionUi.resumeButton)) {
          setPausedSelectionIndex(0);
          setGamePaused(false);
          syncUiBounds();
          return true;
     }

     if (isPointInsideBox(x, y, pausedActionUi.tipsButton)) {
          setPausedSelectionIndex(1);
          dismissPausedToTipsMenu();
          return true;
     }

     if (isPointInsideBox(x, y, pausedActionUi.menuButton)) {
          setPausedSelectionIndex(2);
          dismissPausedToOptionsMenu();
          return true;
     }

     return true;
}

function handleTipsMenuPointerDown(x, y) {
     if (!isTipsListView()) {
          return false;
     }

     if (isPointInsideBox(x, y, gameMenuUi.backButton)) {
          setTipsSelectionIndex(3);
          closeMenuAndRefresh();
          return true;
     }

     if (isPointInsideBox(x, y, gameMenuUi.tipsHowToPlayButton)) {
          setTipsSelectionIndex(0);
          setGameMenuView("tips_how_to_play");
          syncUiBounds();
          return true;
     }

     if (isPointInsideBox(x, y, gameMenuUi.tipsHelpEffectsButton)) {
          setTipsSelectionIndex(1);
          setGameMenuView("tips_help_effects");
          syncUiBounds();
          return true;
     }

     if (isPointInsideBox(x, y, gameMenuUi.tipsHarmEffectsButton)) {
          setTipsSelectionIndex(2);
          setGameMenuView("tips_harm_effects");
          syncUiBounds();
          return true;
     }

     return true;
}

function handleTipsDetailPointerDown(x, y) {
     if (!isTipsDetailView()) {
          return false;
     }

     if (isPointInsideBox(x, y, gameMenuUi.backButton)) {
          setGameMenuView("tips");
          syncUiBounds();
          return true;
     }

     return true;
}

function handleOptionsPointerDown(x, y) {
     if (!isOptionsView()) {
          return false;
     }

     if (isPointInsideBox(x, y, gameMenuUi.backButton)) {
          setOptionsSelectionRow(3);
          closeMenuAndRefresh();
          return true;
     }

     if (isPointInsideBox(x, y, gameMenuUi.harmfulDecreaseButton)) {
          setOptionsSelectionRow(0);
          setOptionsSelectionCol(0);
          decreaseHarmfulLevel();
          syncUiBounds();
          return true;
     }

     if (isPointInsideBox(x, y, gameMenuUi.harmfulIncreaseButton)) {
          setOptionsSelectionRow(0);
          setOptionsSelectionCol(1);
          increaseHarmfulLevel();
          syncUiBounds();
          return true;
     }

     if (isPointInsideBox(x, y, gameMenuUi.musicDecreaseButton)) {
          setOptionsSelectionRow(1);
          setOptionsSelectionCol(0);
          decreaseMusicLevel();
          syncUiBounds();
          return true;
     }

     if (isPointInsideBox(x, y, gameMenuUi.musicIncreaseButton)) {
          setOptionsSelectionRow(1);
          setOptionsSelectionCol(1);
          increaseMusicLevel();
          syncUiBounds();
          return true;
     }

     if (isPointInsideBox(x, y, gameMenuUi.soundEffectsDecreaseButton)) {
          setOptionsSelectionRow(2);
          setOptionsSelectionCol(0);
          decreaseSoundEffectsLevel();
          syncUiBounds();
          return true;
     }

     if (isPointInsideBox(x, y, gameMenuUi.soundEffectsIncreaseButton)) {
          setOptionsSelectionRow(2);
          setOptionsSelectionCol(1);
          increaseSoundEffectsLevel();
          syncUiBounds();
          return true;
     }

     return true;
}

function handleMenuPointerDown(x, y) {
     if (!gameMenuOpen) {
          return false;
     }

     if (handleTipsMenuPointerDown(x, y)) {
          return true;
     }

     if (handleTipsDetailPointerDown(x, y)) {
          return true;
     }

     if (handleOptionsPointerDown(x, y)) {
          return true;
     }

     if (isPointInsideBox(x, y, gameMenuUi.backButton)) {
          closeMenuAndRefresh();
          return true;
     }

     return true;
}

function handlePauseButtonPointerDown(event, x, y) {
     const button = touchControls.pauseButton;

     if (!isPointInsideBox(x, y, button)) {
          return false;
     }

     setPauseButtonPressed(true);
     setPauseButtonPointerId(event.pointerId);
     preventPointerDefault(event);
     return true;
}

function handlePauseButtonPointerUp(event, x, y) {
     const button = touchControls.pauseButton;

     if (touchControls.pauseButton.pointerId !== event.pointerId) {
          return false;
     }

     const releasedInside = isPointInsideBox(x, y, button);

     releasePauseButton(event.pointerId);

     if (!releasedInside) {
          return true;
     }

     setGamePaused(!gamePaused);
     syncUiBounds();
     return true;
}

function beginPointerMove(event, x, y) {
     setTouchMoveTarget(x, y, event.pointerId);
     preventPointerDefault(event);
     return true;
}

function updatePointerMove(event, x, y) {
     if (touchControls.touchMoveTarget.pointerId !== event.pointerId) {
          return false;
     }

     setTouchMoveTarget(x, y, event.pointerId);
     preventPointerDefault(event);
     return true;
}

function endPointerMove(event) {
     if (touchControls.touchMoveTarget.pointerId !== event.pointerId) {
          return false;
     }

     clearPointerMove(event.pointerId);
     preventPointerDefault(event);
     return true;
}

function activateWelcomeSelection() {
     const selection = isOverlayScreenActive() ? 0 : welcomeSelectionIndex;

     if (selection === 0) {
          isOverlayScreenActive() ? startNewGameRound() : dismissScreenWelcomeToStart();
     }

     if (selection === 1 && isScreenWelcomeActive()) {
          dismissScreenWelcomeToTipsMenu();
     }

     if (selection === 2 && isScreenWelcomeActive()) {
          dismissScreenWelcomeToOptionsMenu();
     }
}

function activatePausedSelection() {
     if (pausedSelectionIndex === 0) {
          setGamePaused(false);
          syncUiBounds();
     }

     if (pausedSelectionIndex === 1) {
          dismissPausedToTipsMenu();
     }

     if (pausedSelectionIndex === 2) {
          dismissPausedToOptionsMenu();
     }
}

function activateTipsSelection() {
     if (tipsSelectionIndex === 0) {
          setGameMenuView("tips_how_to_play");
          syncUiBounds();
     }

     if (tipsSelectionIndex === 1) {
          setGameMenuView("tips_help_effects");
          syncUiBounds();
     }

     if (tipsSelectionIndex === 2) {
          setGameMenuView("tips_harm_effects");
          syncUiBounds();
     }

     if (tipsSelectionIndex === 3) {
          closeMenuAndRefresh();
     }
}

function activateOptionsSelection() {
     if (optionsSelection.row === 3) {
          closeMenuAndRefresh();
          return;
     }

     const optionName =
          optionsSelection.row === 0 ? "harmful" :
          optionsSelection.row === 1 ? "music" :
          "soundEffects";

     const direction = optionsSelection.col === 0 ? -1 : 1;
     activateOptionAdjustment(optionName, direction);
}

function handleWelcomeNavigation(event) {
     if (!isScreenWelcomeActive() && !isOverlayScreenActive()) {
          return false;
     }

     if (isEscapeKey(event)) {
          event.preventDefault();
          return true;
     }

     if (isEnterKey(event)) {
          event.preventDefault();
          activateWelcomeSelection();
          return true;
     }

     if (isOverlayScreenActive()) {
          setWelcomeSelectionIndex(0);
          return true;
     }

     if (isPreviousMenuKey(event)) {
          event.preventDefault();
          setWelcomeSelectionIndex(clamp(welcomeSelectionIndex - 1, 0, 2));
          return true;
     }

     if (isNextMenuKey(event)) {
          event.preventDefault();
          setWelcomeSelectionIndex(clamp(welcomeSelectionIndex + 1, 0, 2));
          return true;
     }

     return false;
}

function handlePausedNavigation(event) {
     if (!isPausedOverlayActive()) {
          return false;
     }

     if (isEscapeKey(event)) {
          event.preventDefault();
          setGamePaused(false);
          syncUiBounds();
          return true;
     }

     if (isEnterKey(event)) {
          event.preventDefault();
          activatePausedSelection();
          return true;
     }

     if (isPreviousMenuKey(event)) {
          event.preventDefault();
          setPausedSelectionIndex(clamp(pausedSelectionIndex - 1, 0, 2));
          return true;
     }

     if (isNextMenuKey(event)) {
          event.preventDefault();
          setPausedSelectionIndex(clamp(pausedSelectionIndex + 1, 0, 2));
          return true;
     }

     return false;
}

function handleTipsNavigation(event) {
     if (!gameMenuOpen) {
          return false;
     }

     if (isEscapeKey(event)) {
          event.preventDefault();

          if (isTipsDetailView()) {
               setGameMenuView("tips");
               syncUiBounds();
          } else {
               closeMenuAndRefresh();
          }

          return true;
     }

     if (isTipsDetailView()) {
          if (isEnterKey(event)) {
               event.preventDefault();
               setGameMenuView("tips");
               syncUiBounds();
               return true;
          }

          return false;
     }

     if (!isTipsListView()) {
          return false;
     }

     if (isEnterKey(event)) {
          event.preventDefault();
          activateTipsSelection();
          return true;
     }

     if (isPreviousMenuKey(event)) {
          event.preventDefault();
          setTipsSelectionIndex(clamp(tipsSelectionIndex - 1, 0, 3));
          return true;
     }

     if (isNextMenuKey(event)) {
          event.preventDefault();
          setTipsSelectionIndex(clamp(tipsSelectionIndex + 1, 0, 3));
          return true;
     }

     return false;
}

function handleOptionsNavigation(event) {
     if (!gameMenuOpen || !isOptionsView()) {
          return false;
     }

     if (isEscapeKey(event)) {
          event.preventDefault();
          closeMenuAndRefresh();
          return true;
     }

     if (isEnterKey(event)) {
          event.preventDefault();
          activateOptionsSelection();
          return true;
     }

     if (isUpKey(event)) {
          event.preventDefault();
          setOptionsSelectionRow(clamp(optionsSelection.row - 1, 0, 3));

          if (optionsSelection.row === 3) {
               setOptionsSelectionCol(0);
          }

          return true;
     }

     if (isDownKey(event)) {
          event.preventDefault();
          setOptionsSelectionRow(clamp(optionsSelection.row + 1, 0, 3));

          if (optionsSelection.row === 3) {
               setOptionsSelectionCol(0);
          }

          return true;
     }

     if (optionsSelection.row < 3 && isLeftKey(event)) {
          event.preventDefault();
          setOptionsSelectionCol(0);
          activateOptionsSelection();
          return true;
     }

     if (optionsSelection.row < 3 && isRightKey(event)) {
          event.preventDefault();
          setOptionsSelectionCol(1);
          activateOptionsSelection();
          return true;
     }

     return false;
}

function handleUiNavigationKeyDown(event) {
     if (!isUiNavigationActive()) {
          return false;
     }

     return (
          handleWelcomeNavigation(event) ||
          handlePausedNavigation(event) ||
          handleTipsNavigation(event) ||
          handleOptionsNavigation(event)
     );
}

function handleKeyDown(event) {
     if (handleUiNavigationKeyDown(event)) {
          return;
     }

     setStoredKeyState(event, true);

     if (isEscapeKey(event)) {
          if (gameMenuOpen) {
               dismissMenuBackToPreviousScreen();
               syncUiBounds();
               return;
          }

          if (isScreenWelcomeActive()) {
               return;
          }

          if (!gameStarted || gameOver || gameWon) {
               showScreenWelcome();
               syncUiBounds();
               return;
          }

          setGamePaused(!gamePaused);
          syncUiBounds();
          return;
     }

     if (isSpaceKey(event)) {
          if (!gameStarted || gameMenuOpen || gameOver || gameWon || isScreenWelcomeActive()) {
               return;
          }

          event.preventDefault();
          setGamePaused(!gamePaused);
          syncUiBounds();
          return;
     }

     if (event.key.toLowerCase() === "p" && gameStarted && !gameMenuOpen && !gameOver && !gameWon) {
          setGamePaused(!gamePaused);
          syncUiBounds();
     }
}

function handleKeyUp(event) {
     setStoredKeyState(event, false);
}

function handlePointerDown(event) {
     if (!miniGameCanvas || !isPrimaryPointer(event)) {
          return;
     }

     const { x, y } = getCanvasPoint(event);

     if (handleWelcomeOrResultPointerDown(x, y)) {
          return;
     }

     if (handlePausedOverlayPointerDown(x, y)) {
          return;
     }

     if (handleMenuPointerDown(x, y)) {
          return;
     }

     if (!gameStarted || gamePaused || gameOver || gameWon) {
          return;
     }

     if (handlePauseButtonPointerDown(event, x, y)) {
          return;
     }

     beginPointerMove(event, x, y);
}

function handlePointerMove(event) {
     if (!miniGameCanvas || !isPrimaryPointer(event)) {
          return;
     }

     const { x, y } = getCanvasPoint(event);
     updatePointerMove(event, x, y);
}

function handlePointerUp(event) {
     if (!miniGameCanvas || !isPrimaryPointer(event)) {
          return;
     }

     const { x, y } = getCanvasPoint(event);

     if (handlePauseButtonPointerUp(event, x, y)) {
          return;
     }

     endPointerMove(event);
}

function handlePointerCancel(event) {
     if (!isPrimaryPointer(event)) {
          return;
     }

     releasePauseButton(event.pointerId);
     endPointerMove(event);
}

export function bindKeyboardInput() {
     if (keyboardInputBound) {
          return;
     }

     window.addEventListener("keydown", handleKeyDown);
     window.addEventListener("keyup", handleKeyUp);

     setKeyboardInputBound(true);
}

export function bindPointerInput() {
     if (pointerInputBound || !miniGameCanvas) {
          return;
     }

     miniGameCanvas.style.touchAction = "none";

     miniGameCanvas.addEventListener("pointerdown", handlePointerDown);
     window.addEventListener("pointermove", handlePointerMove, { passive: false });
     window.addEventListener("pointerup", handlePointerUp, { passive: false });
     window.addEventListener("pointercancel", handlePointerCancel, { passive: false });

     setPointerInputBound(true);
}

export function bindResizeHandler(onResize) {
     if (resizeHandlerBound) {
          return;
     }

     window.addEventListener("resize", () => {
          onResize();
     });

     setResizeHandlerBound(true);
}
