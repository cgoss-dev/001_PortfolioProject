// NOTE: BASE JS

/* NOTE: THEME */
/* Read control-center values from CSS so visual settings only live in one place */

function getCssValue(variableName) {
     return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

function getCssNumber(variableName, fallback = 0) {
     const rawValue = getCssValue(variableName);
     const value = Number(rawValue);
     return Number.isNaN(value) ? fallback : value;
}

function getCssColor(variableName, fallback = "#ffffff") {
     const value = getCssValue(variableName);
     return value || fallback;
}

function getThemeColors() {
     return {
          pink: getCssColor("--pink"),
          red: getCssColor("--red"),
          maroon: getCssColor("--maroon"),
          peach: getCssColor("--peach"),
          flamingo: getCssColor("--flamingo"),
          yellow: getCssColor("--yellow"),
          green: getCssColor("--green"),
          teal: getCssColor("--teal"),
          sky: getCssColor("--sky"),
          blue: getCssColor("--blue"),
          lavender: getCssColor("--lavender"),
          violet: getCssColor("--violet"),
          white: getCssColor("--text-color", "#ffffff")
     };
}

function getTextSettings() {
     return {
          rainbowCycleSpeed: getCssNumber("--text-rainbow-cycle-speed", 900),
          glowCore: getCssValue("--glow-core") || "0 0 0.06rem",
          glowSoft: getCssValue("--glow-soft") || "0 0 0.25rem",
          glowWide: getCssValue("--glow-wide") || "0 0 0.9rem"
     };
}

function getGlowSettings() {
     return {
          particleBlur: getCssNumber("--glow-particle-blur", 8),
          bungeeGlowBlur: getCssValue("--bungee-glow-blur") || "0 0 0.375rem",
          bungeeShadowOffset1: getCssValue("--bungee-shadow-offset-1") || "0.125rem 0.125rem 0 rgba(0, 0, 0, 0.8)",
          bungeeShadowOffset2: getCssValue("--bungee-shadow-offset-2") || "0.25rem 0.25rem 0 rgba(0, 0, 0, 0.6)"
     };
}

function getSparkleSettings() {
     return {
          countMax: getCssNumber("--sparkle-count-max", 180),
          sizeMin: getCssNumber("--sparkle-size-min", 12),
          sizeMax: getCssNumber("--sparkle-size-max", 24),
          speedMin: getCssNumber("--sparkle-speed-min", 0.2),
          speedMax: getCssNumber("--sparkle-speed-max", 0.7),
          density: getCssNumber("--sparkle-density", 0.00015),
          wobbleSpeedMin: getCssNumber("--sparkle-wobble-speed-min", 0.005),
          wobbleSpeedMax: getCssNumber("--sparkle-wobble-speed-max", 0.02),
          wobbleAmountMin: getCssNumber("--sparkle-wobble-amount-min", 5),
          wobbleAmountMax: getCssNumber("--sparkle-wobble-amount-max", 15),
          opacityMin: getCssNumber("--sparkle-opacity-min", 0.2),
          opacityMax: getCssNumber("--sparkle-opacity-max", 1),
          respawnOffsetTop: getCssNumber("--sparkle-respawn-offset-top", -20),
          respawnOffsetBottom: getCssNumber("--sparkle-respawn-offset-bottom", 24)
     };
}

function getRainbowPalette() {
     const theme = getThemeColors();

     return [
          getCssColor("--rainbow-color-1", theme.pink),
          getCssColor("--rainbow-color-2", theme.red),
          getCssColor("--rainbow-color-3", theme.maroon),
          getCssColor("--rainbow-color-4", theme.peach),
          getCssColor("--rainbow-color-5", theme.flamingo),
          getCssColor("--rainbow-color-6", theme.yellow),
          getCssColor("--rainbow-color-7", theme.green),
          getCssColor("--rainbow-color-8", theme.teal),
          getCssColor("--rainbow-color-9", theme.sky),
          getCssColor("--rainbow-color-10", theme.blue),
          getCssColor("--rainbow-color-11", theme.lavender),
          getCssColor("--rainbow-color-12", theme.violet)
     ];
}

function getSparklePalette() {
     const theme = getThemeColors();

     return [
          getCssColor("--sparkle-color-1", theme.white),
          getCssColor("--sparkle-color-2", theme.pink),
          getCssColor("--sparkle-color-3", theme.red),
          getCssColor("--sparkle-color-4", theme.maroon),
          getCssColor("--sparkle-color-5", theme.peach),
          getCssColor("--sparkle-color-6", theme.flamingo),
          getCssColor("--sparkle-color-7", theme.yellow),
          getCssColor("--sparkle-color-8", theme.green),
          getCssColor("--sparkle-color-9", theme.teal),
          getCssColor("--sparkle-color-10", theme.sky),
          getCssColor("--sparkle-color-11", theme.blue),
          getCssColor("--sparkle-color-12", theme.lavender),
          getCssColor("--sparkle-color-13", theme.violet)
     ];
}

/* NOTE: UTILITIES */

function randomNumber(min, max) {
     return Math.random() * (max - min) + min;
}

function randomWholeNumber(min, max) {
     return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(array) {
     return array[randomWholeNumber(0, array.length - 1)];
}

function randomItemExcept(array, previousItem) {
     if (!array.length) {
          return undefined;
     }

     if (array.length === 1) {
          return array[0];
     }

     let nextItem = randomItem(array);

     while (nextItem === previousItem) {
          nextItem = randomItem(array);
     }

     return nextItem;
}

function shuffleArray(array) {
     const shuffled = [...array];

     for (let i = shuffled.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
     }

     return shuffled;
}

/* NOTE: GLOW BUILDERS */
/* marquee can use the universal box-shadow style glow */
/* menu glyph uses the old bungee-style shadow trick because that font needs extra help */

function buildUniversalTextGlow(color) {
     const textSettings = getTextSettings();

     return `
          ${textSettings.glowCore} ${color},
          ${textSettings.glowSoft} ${color},
          ${textSettings.glowWide} ${color}
     `;
}

function buildBungeeGlyphGlow(color) {
     const glowSettings = getGlowSettings();

     return `
          ${glowSettings.bungeeGlowBlur} ${color},
          ${glowSettings.bungeeShadowOffset1},
          ${glowSettings.bungeeShadowOffset2}
     `;
}

/* NOTE: MENU */

const menuButton = document.querySelector(".menu-button");
const dropdownLow = document.getElementById("dropdownLow");

function syncMenuButtonGlow() {
     if (!menuButton) {
          return;
     }

     const currentColor = getCssColor("--menu-button-color", getCssColor("--text-color", "#ffffff"));

     menuButton.style.color = currentColor;
     menuButton.style.webkitTextFillColor = currentColor;
     menuButton.style.textShadow = buildBungeeGlyphGlow(currentColor);
}

if (menuButton && dropdownLow) {
     menuButton.addEventListener("click", function () {
          dropdownLow.classList.toggle("menu-open");

          if (dropdownLow.classList.contains("menu-open")) {
               menuButton.textContent = "×";
          } else {
               menuButton.textContent = "+";
          }

          syncMenuButtonGlow();
     });

     menuButton.addEventListener("mouseenter", function () {
          syncMenuButtonGlow();
     });

     menuButton.addEventListener("mouseleave", function () {
          syncMenuButtonGlow();
     });

     menuButton.addEventListener("focus", function () {
          syncMenuButtonGlow();
     });

     menuButton.addEventListener("blur", function () {
          syncMenuButtonGlow();
     });
}

document.addEventListener("click", function (event) {
     if (!menuButton || !dropdownLow) {
          return;
     }

     const clickedInsideButton = menuButton.contains(event.target);
     const clickedInsideMenu = dropdownLow.contains(event.target);

     if (!clickedInsideButton && !clickedInsideMenu) {
          dropdownLow.classList.remove("menu-open");
          menuButton.textContent = "+";
          syncMenuButtonGlow();
     }
});

document.addEventListener("keydown", function (event) {
     if (event.key === "Escape") {
          if (dropdownLow && dropdownLow.classList.contains("menu-open")) {
               dropdownLow.classList.remove("menu-open");
               menuButton.textContent = "+";
               syncMenuButtonGlow();
          }
     }
});

/* NOTE: TEXT */

const marquee = document.querySelector(".marquee");
const marqueeOriginalText = marquee ? marquee.textContent : "";
let marqueeSpans = [];
let headerColorCycleTimer = null;
let previousMarqueeColors = [];
// Stores the last color used for each letter position.

function buildMarqueeSpans() {
     if (!marquee) {
          return;
     }

     marquee.innerHTML = "";
     marqueeSpans = [];
     previousMarqueeColors = [];
     // Reset old span/color memory whenever we rebuild the marquee.

     for (let i = 0; i < marqueeOriginalText.length; i += 1) {
          const char = marqueeOriginalText[i];
          const span = document.createElement("span");

          span.textContent = char === " " ? "\u00A0" : char;
          // Convert normal spaces between words into non-breaking spaces so spacing stays visible in spans.

          marquee.appendChild(span);
          marqueeSpans.push(span);
     }
}

function applyGlowToElement(element, color) {
     if (!element) {
          return;
     }

     element.style.color = color;
     element.style.textShadow = buildUniversalTextGlow(color);
}

function cycleMarqueeColors() {
     if (!marqueeSpans.length) {
          return;
     }

     let availableColors = shuffleArray(getRainbowPalette());
     // Shuffle once at the start of each cycle.

     const nextMarqueeColors = [];
     // New storage array for next cycle.

     let colorIndex = 0;
     // Tracks which color from availableColors we are currently assigning.

     for (let i = 0; i < marqueeSpans.length; i += 1) {
          const span = marqueeSpans[i];

          if (span.textContent === "\u00A0") {
               nextMarqueeColors[i] = null;
               continue;
          }
          // Spaces do not get colored and do not consume a rainbow color.

          if (colorIndex >= availableColors.length) {
               availableColors = shuffleArray(getRainbowPalette());
               colorIndex = 0;
          }
          // If we run out of rainbow colors, reshuffle and start a new batch, incase colors<letters.

          const previousColor = previousMarqueeColors[i] || null;
          // Get previous color for this exact letter position.

          if (availableColors[colorIndex] === previousColor) {
               let swapIndex = -1;
               // If next color would repeat this letter's previous color, LOOK for a different color later in the shuffled list...

               for (let j = colorIndex + 1; j < availableColors.length; j += 1) {
                    if (availableColors[j] !== previousColor) {
                         swapIndex = j;
                         break;
                    }
               }

               if (swapIndex !== -1) {
                    const temp = availableColors[colorIndex];
                    availableColors[colorIndex] = availableColors[swapIndex];
                    availableColors[swapIndex] = temp;
               }
               // Then, SWAP repeated color with a later one to avoid same-letter immediate repeats.
          }

          const nextColor = availableColors[colorIndex];
          // Take the current color from this cycle's shuffled rainbow list.

          colorIndex += 1;
          // Move to the next unused color for the next visible letter.

          nextMarqueeColors[i] = nextColor;
          // Save new color into this cycle's memory array.

          applyGlowToElement(span, nextColor);
          // Apply color to current letter.
     }

     previousMarqueeColors = nextMarqueeColors;
     // Replace old memory with new cycle's colors.
}
function startHeaderColorCycle() {
     if (!marquee) {
          return;
     }

     buildMarqueeSpans();
     cycleMarqueeColors();

     window.clearInterval(headerColorCycleTimer);

     headerColorCycleTimer = window.setInterval(function () {
          cycleMarqueeColors();
     }, getTextSettings().rainbowCycleSpeed);
}

/* NOTE: CANVAS */

const bgCanvas = document.getElementById("siteBgCanvas");
const bgCtx = bgCanvas ? bgCanvas.getContext("2d") : null;

const bgParticles = [];
let bgWidth = 0;
let bgHeight = 0;
let bgParticleCount = 0;
let resizeTimer = null;

/* NOTE: CANVAS */

function resizeBgCanvasFromCss(canvas) {
     if (!canvas) {
          return;
     }

     const rect = canvas.getBoundingClientRect();
     const dpr = window.devicePixelRatio || 1;

     canvas.width = Math.round(rect.width * dpr);
     canvas.height = Math.round(rect.height * dpr);

     const ctx = canvas.getContext("2d");

     if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
     }

     bgWidth = rect.width;
     bgHeight = rect.height;
}

function setBgParticleCount() {
     const sparkleSettings = getSparkleSettings();
     const screenArea = bgWidth * bgHeight;

     bgParticleCount = Math.min(
          sparkleSettings.countMax,
          Math.floor(screenArea * sparkleSettings.density)
     );
}

/* NOTE: PARTICLES */

function createBgParticle() {
     const sparkleSettings = getSparkleSettings();
     const sparklePalette = getSparklePalette();
     const x = Math.random() * bgWidth;

     return {
          x: x,
          baseX: x,
          y: Math.random() * bgHeight,
          char: Math.random() < 0.5 ? "✦" : "✧",
          color: randomItem(sparklePalette),
          size: randomNumber(sparkleSettings.sizeMin, sparkleSettings.sizeMax),
          speed: randomNumber(sparkleSettings.speedMin, sparkleSettings.speedMax),
          wobbleOffset: randomNumber(0, Math.PI * 2),
          wobbleSpeed: randomNumber(sparkleSettings.wobbleSpeedMin, sparkleSettings.wobbleSpeedMax),
          wobbleAmount: randomNumber(sparkleSettings.wobbleAmountMin, sparkleSettings.wobbleAmountMax),
          opacity: randomNumber(sparkleSettings.opacityMin, sparkleSettings.opacityMax)
     };
}

function initBgParticles(count) {
     bgParticles.length = 0;

     for (let i = 0; i < count; i += 1) {
          bgParticles.push(createBgParticle());
     }
}

function setupSparkleRain() {
     if (!bgCanvas || !bgCtx) {
          return;
     }

     resizeBgCanvasFromCss(bgCanvas);
     setBgParticleCount();
     initBgParticles(bgParticleCount);
}

function updateBgParticles() {
     const sparkleSettings = getSparkleSettings();

     for (let i = 0; i < bgParticles.length; i += 1) {
          const p = bgParticles[i];

          p.y += p.speed;
          p.wobbleOffset += p.wobbleSpeed;
          p.x = p.baseX + Math.sin(p.wobbleOffset) * p.wobbleAmount;

          if (p.y > bgHeight + sparkleSettings.respawnOffsetBottom) {
               bgParticles[i] = createBgParticle();
               bgParticles[i].y = sparkleSettings.respawnOffsetTop;
          }
     }
}

function drawBackground() {
     bgCtx.clearRect(0, 0, bgWidth, bgHeight);
}

function drawBgParticles() {
     const glowSettings = getGlowSettings();

     for (let i = 0; i < bgParticles.length; i += 1) {
          const p = bgParticles[i];

          bgCtx.save();
          bgCtx.globalAlpha = p.opacity;
          bgCtx.font = `${p.size}px Arial, Helvetica, sans-serif`;
          bgCtx.textAlign = "center";
          bgCtx.textBaseline = "middle";
          bgCtx.fillStyle = p.color;
          bgCtx.shadowBlur = glowSettings.particleBlur;
          bgCtx.shadowColor = p.color;
          bgCtx.fillText(p.char, p.x, p.y);
          bgCtx.restore();
     }
}

function drawSparkleRain() {
     if (!bgCanvas || !bgCtx) {
          return;
     }

     drawBackground();
     updateBgParticles();
     drawBgParticles();

     window.requestAnimationFrame(drawSparkleRain);
}

/* NOTE: RESIZE */

function handleResize() {
     window.clearTimeout(resizeTimer);

     resizeTimer = window.setTimeout(function () {
          setupSparkleRain();
          syncMenuButtonGlow();
     }, 150);
}

/* NOTE: STARTUP */

startHeaderColorCycle();
syncMenuButtonGlow();

if (bgCanvas && bgCtx) {
     setupSparkleRain();
     drawSparkleRain();
     window.addEventListener("resize", handleResize);
}