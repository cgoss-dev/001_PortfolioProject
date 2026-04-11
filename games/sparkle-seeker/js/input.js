// NOTE: IMPORTS

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
     gameMenuUi,
     touchControls,
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
     updateMiniGameCanvasSize,
     startNewGameRound
} from "./loop.js";

import {
     isPointInsideMenuPanel,
     updateMenuUiBounds,
     cycleDifficulty,
     toggleAllSound
} from "./ui.js";

import {
     resetPlayerPosition
} from "./systems/player.js";

export function resetJoystickState() {
     const j = touchControls.joystick;
     j.knobX = j.knobY = j.inputX = j.inputY = 0;
     j.isActive = false;
     j.pointerId = null;
}

export function resetTouchButtons() {
     touchControls.leftButton.isPressed = false;
     touchControls.leftButton.pointerId = null;
     touchControls.rightButton.isPressed = false;
     touchControls.rightButton.pointerId = null;
}

export function resetTouchControls() {
     resetJoystickState();
     resetTouchButtons();
}

export function isPointInsideCircle(x, y, cx, cy, r) {
     const dx = x - cx;
     const dy = y - cy;
     return Math.sqrt(dx * dx + dy * dy) <= r;
}

export function isPointInsideRect(x, y, r) {
     return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
}