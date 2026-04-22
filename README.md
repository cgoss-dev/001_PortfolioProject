<img width="1019" height="596" alt="Goss_FEWS-217_Wireframe" src="https://github.com/user-attachments/assets/bc3ac524-81df-4a40-bdfc-0d21c0246c9e" />

# PORTFOLIO PROJECT
Digital footprint, games, resources.
<br><br>

### TO DO
-    Flesh out menu options.
     -    Sound: music/sfx (on/off)(volume: min-x-med-x-max).
     -    Colorblind: Deuteranope, Protanope, Tritanope, Monochrome
-    🐞 Mobile landscape mode bug.
<br><br>

## NOTES
export const effectHelpful = [
     { name: "shield", label: "SHIELD", char: "\u2B21\uFE0E", effect: "blockNextHarmfulCollision", durationSeconds: 0, lastsUntilUsed: true, penalty: 0 }, // ⬡︎
     { name: "cure", label: "CURE", char: "\u271A\uFE0E", effect: "blockNextHarmfulStatus", durationSeconds: 0, lastsUntilUsed: true, penalty: 0 }, // ✚︎
     { name: "luck", label: "LUCK", char: "\u2618\uFE0E", effect: "doubleSparkleScore", durationSeconds: 8, lastsUntilUsed: false, penalty: 0 }, // ☘︎
     { name: "magnet", label: "MAGNET", char: "\u2316\uFE0E", effect: "pullSparklesToPlayer", durationSeconds: 8, lastsUntilUsed: false, penalty: 0 }, // ⌖︎
     { name: "slowmo", label: "SLOWMO", char: "\u29D6\uFE0E", effect: "halveObjectFallSpeed", durationSeconds: 10, lastsUntilUsed: false, penalty: 0 } // ⧖︎
];

export const effectHarmful = [
     { name: "freeze", label: "FREEZE", char: "\u2744\uFE0E", effect: "freezePlayerMovement", durationSeconds: 3, lastsUntilUsed: false, penalty: 1 }, // ❄︎
     { name: "surge", label: "SURGE", char: "\u26A1\uFE0E", effect: "doubleObjectFallSpeed", durationSeconds: 5, lastsUntilUsed: false, penalty: 1 }, // ⚡︎
     { name: "daze", label: "DAZE", char: "\u2300\uFE0E", effect: "reversePlayerMovement", durationSeconds: 8, lastsUntilUsed: false, penalty: 1 }, // ⌀︎
     { name: "glass", label: "GLASS", char: "\u26A0\uFE0E", effect: "nextHitExtraDamage", durationSeconds: 10, lastsUntilUsed: false, penalty: 1 }, // ⚠︎
     { name: "fog", label: "FOG", char: "\u224B\uFE0E", effect: "limitVisionAroundPlayer", durationSeconds: 6, lastsUntilUsed: false, penalty: 1 } // ≋︎
];