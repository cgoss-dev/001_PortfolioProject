<img width="1019" height="596" alt="Goss_FEWS-217_Wireframe" src="https://github.com/user-attachments/assets/bc3ac524-81df-4a40-bdfc-0d21c0246c9e" />

# PORTFOLIO PROJECT
Digital footprint, games, resources.
-    https://gameaccessibilityguidelines.com/
-    https://uxdesign.cc/designing-accessible-video-games-f4c9824a9182
-    https://medium.com/@ruthieee/5-big-ideas-for-designing-accessible-video-games-e403a2c5d4d7
-    https://www.w3.org/TR/wcag-3.0/
-    https://guides.lib.umich.edu/c.php?g=282989&p=7652278

<br><br>

### MASSIVE REFACTOR
**game_engine.js**
Main game loop, startup flow, state transitions, and top-level orchestration.<br>

**ui.js**
All HUD, menus, overlays, menu layout, and menu click/touch handling.<br>

**config.js**
Player-facing settings, game options, accessibility toggles, audio settings, and shared tunables.<br>

**input.js**
Player movement input only, including keyboard, pointer, and touch movement controls.<br>

**particle_engine.js**
Spawning, updating, collecting, and drawing sparkles, friends, enemies, and bursts.<br>

**player.js**
Player state helpers, movement/update behavior, and player rendering.<br>

**vars.js**
Shared runtime data, canvas references, mutable arrays/flags, and simple setters only.<br>

**win_rules_conditions.js**
Win logic, level/progression rules, score thresholds, and progression-related screen/help copy.<br>

### A11Y OPTIONS
-    Sound: music/sfx (off-min-low-med-max).
-    Colorblind: Deuteranope, Protanope, Tritanope, Monochrome
-    Movement: freetouch, joystick, dpad.
<br><br>
