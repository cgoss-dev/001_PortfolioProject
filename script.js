// NOTE: MAIN ROOT JS

// TROUBLESHOOTING
// alert("top of script");
// console.log("top of script");

// document.body.style.background = "lime";
// document.body.innerHTML = "<h1 style='color:black; font-size:48px;'>SCRIPT IS RUNNING</h1>";

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

function getTextSettings() {
     return {
          rainbowCycleSpeed: getCssNumber("--text-rainbow-cycle-speed", 900),
          glowCore: getCssValue("--glow-core") || "0 0 0.05rem",
          glowSoft: getCssValue("--glow-soft") || "0 0 0.25rem",
          glowWide: getCssValue("--glow-wide") || "0 0 0.75rem"
     };
}

function getGlowSettings() {
     return {
          bgParticleBlur: getCssNumber("--glow-particle-bg-blur", 12),
          gameParticleBlur: getCssNumber("--glow-particle-game-blur", 16),
          bungeeGlowBlur: getCssValue("--glow-bungee-core") || "0 0 0 transparent",
          bungeeShadowOffset1: getCssValue("--glow-bungee-shadow-offset-1") || "0 0 0 transparent",
          bungeeShadowOffset2: getCssValue("--glow-bungee-shadow-offset-2") || "0 0 0 transparent"
     };
}

function getSparkleSettings() {
     return {
          countMax: getCssNumber("--sparkle-count-max", 180),
          sizeMin: getCssNumber("--sparkle-size-min", 16),
          sizeMax: getCssNumber("--sparkle-size-max", 26),
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
     return [
          getCssColor("--rainbow-red"),
          getCssColor("--rainbow-orange"),
          getCssColor("--rainbow-yellow"),

          getCssColor("--rainbow-lime"),
          getCssColor("--rainbow-green"),
          getCssColor("--rainbow-mint"),

          getCssColor("--rainbow-cyan"),
          getCssColor("--rainbow-sky"),
          getCssColor("--rainbow-blue"),

          getCssColor("--rainbow-violet"),
          getCssColor("--rainbow-magenta"),
          getCssColor("--rainbow-rose")
     ].filter(Boolean);
}

function getSparklePalette() {
     return ["#ffffff"];
     // Background sparkles stay white, and game sparkles can still use rainbow palette separately.
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

function createColorEngine(colorsOrFactory) {
     // Shared color engine for marquee + sparkles, uses either an array of colors OR a function that returns an array of colors.

     let previousColor = null;
     // This remembers most recent single color used by .next().

     function resolvePalette() {
          const rawPalette = typeof colorsOrFactory === "function"
               ? colorsOrFactory()
               : colorsOrFactory;

          if (!Array.isArray(rawPalette)) {
               return [];
          }

          return rawPalette.filter(Boolean);
     }

     function avoidImmediateRepeatInBatch(colorBatch, previousColorForSlot, startIndex = 0) {
          if (colorBatch.length <= startIndex) {
               return;
          }

          if (colorBatch[startIndex] !== previousColorForSlot) {
               return;
          }

          let swapIndex = -1;

          for (let i = startIndex + 1; i < colorBatch.length; i += 1) {
               if (colorBatch[i] !== previousColorForSlot) {
                    swapIndex = i;
                    break;
               }
          }

          if (swapIndex !== -1) {
               const temp = colorBatch[startIndex];
               colorBatch[startIndex] = colorBatch[swapIndex];
               colorBatch[swapIndex] = temp;
          }
     }

     return {
          next() {
               const palette = resolvePalette();

               if (!palette.length) {
                    return undefined;
               }

               if (palette.length === 1) {
                    previousColor = palette[0];
                    return palette[0];
               }

               const nextColor = randomItemExcept(palette, previousColor);

               previousColor = nextColor;
               return nextColor;
          },

          nextCycle(count, previousCycleColors = []) {
               const palette = resolvePalette();

               if (!palette.length || count <= 0) {
                    return [];
               }

               if (palette.length === 1) {
                    return Array(count).fill(palette[0]);
               }

               const nextColors = [];
               let availableColors = shuffleArray(palette);
               let colorIndex = 0;

               for (let i = 0; i < count; i += 1) {
                    if (colorIndex >= availableColors.length) {
                         availableColors = shuffleArray(palette);
                         colorIndex = 0;
                    }

                    const previousColorForSlot = previousCycleColors[i] || null;

                    avoidImmediateRepeatInBatch(availableColors, previousColorForSlot, colorIndex);

                    const nextColor = availableColors[colorIndex];
                    colorIndex += 1;
                    nextColors.push(nextColor);
               }

               return nextColors;
          },

          nextCycleForText(text, previousCycleColors = []) {
               const palette = resolvePalette();

               if (!palette.length || !text) {
                    return [];
               }

               if (palette.length === 1) {
                    return Array(text.length).fill(palette[0]);
               }

               const nextColors = [];
               let usedColorsInWord = new Set();
               let availableColors = shuffleArray(palette);
               let colorIndex = 0;

               for (let i = 0; i < text.length; i += 1) {
                    const character = text[i];

                    if (/\s/.test(character)) {
                         usedColorsInWord.clear();
                         nextColors.push("");
                         continue;
                    }

                    if (usedColorsInWord.size >= palette.length) {
                         usedColorsInWord.clear();
                    }

                    let nextColor = null;
                    const previousColorForSlot = previousCycleColors[i] || null;

                    for (let attempts = 0; attempts < palette.length * 2; attempts += 1) {
                         if (colorIndex >= availableColors.length) {
                              availableColors = shuffleArray(palette);
                              colorIndex = 0;
                         }

                         avoidImmediateRepeatInBatch(availableColors, previousColorForSlot, colorIndex);

                         const candidateColor = availableColors[colorIndex];
                         colorIndex += 1;

                         if (!usedColorsInWord.has(candidateColor)) {
                              nextColor = candidateColor;
                              break;
                         }
                    }

                    if (!nextColor) {
                         const fallbackColors = palette.filter((color) => !usedColorsInWord.has(color));

                         nextColor = randomItemExcept(
                              fallbackColors.length ? fallbackColors : palette,
                              previousColorForSlot
                         );
                    }

                    usedColorsInWord.add(nextColor);
                    nextColors.push(nextColor);
               }

               return nextColors;
          },

          reset() {
               previousColor = null;
          }
     };
}

/* NOTE: GLOW */
/* Marquee and menu glyph share universal text-shadow glow style. */

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

const navButton = document.querySelector(".nav-button");
const dropdownLow = document.querySelector(".dropdown-low");
const navMenu = document.getElementById("navMenu");
const navButtonOpen = navButton ? navButton.querySelector(".nav-button-open") : null;
const navButtonClose = navButton ? navButton.querySelector(".nav-button-close") : null;

function syncNavButtonGlow() {
     if (!navButton) {
          return;
     }

     const currentColor = getCssColor(
          "--menu-button-color",
          getCssColor("--color-text", getCssColor("--color-text", "#ffffff"))
     );

     navButton.style.color = currentColor;
     navButton.style.webkitTextFillColor = "currentColor";
     navButton.style.textShadow = buildUniversalTextGlow(currentColor);

     if (navButtonOpen) {
          navButtonOpen.style.textShadow = buildUniversalTextGlow(currentColor);
     }

     if (navButtonClose) {
          navButtonClose.style.textShadow = buildUniversalTextGlow(currentColor);
     }
}

function openMenu() {
     if (!dropdownLow || !navButton) {
          return;
     }

     dropdownLow.classList.add("menu-open");
     navButton.setAttribute("aria-expanded", "true");
     syncNavButtonGlow();
}

function closeMenu() {
     if (!dropdownLow || !navButton) {
          return;
     }

     dropdownLow.classList.remove("menu-open");
     navButton.setAttribute("aria-expanded", "false");
     syncNavButtonGlow();
}

function toggleMenu() {
     if (!dropdownLow) {
          return;
     }

     if (dropdownLow.classList.contains("menu-open")) {
          closeMenu();
     } else {
          openMenu();
     }
}

if (navButton && dropdownLow) {
     navButton.addEventListener("click", function (event) {
          event.stopPropagation();
          toggleMenu();
     });

     navButton.addEventListener("mouseenter", function () {
          syncNavButtonGlow();
     });

     navButton.addEventListener("mouseleave", function () {
          syncNavButtonGlow();
     });

     navButton.addEventListener("focus", function () {
          syncNavButtonGlow();
     });

     navButton.addEventListener("blur", function () {
          syncNavButtonGlow();
     });
}

document.addEventListener("click", function (event) {
     if (!navButton || !dropdownLow) {
          return;
     }

     const clickedInsideDropdown = dropdownLow.contains(event.target);

     if (!clickedInsideDropdown) {
          closeMenu();
     }
});

document.addEventListener("keydown", function (event) {
     if (event.key === "Escape") {
          closeMenu();
     }
});

/* NOTE: TEXT */

const marqueeElements = Array.from(document.querySelectorAll(".marquee"));

const marqueeItems = marqueeElements.map(function (element) {
     const lineNodes = Array.from(element.querySelectorAll(".marquee-word, .marquee-break"));

     return {
          element: element,
          lineNodes: lineNodes,
          lineLetterSpans: [],
          visibleSpans: [],
          previousColorsByLine: []
     };
});

let headerColorCycleTimer = null;
let marqueeColorEngine = null;
let accentColorEngine = null;

/* MARQUEE FIT */
/* Marquee size gets reduced until longest line fits available width. */
/* Existing line structure is preserved here, so first name and last name stay stacked. */

function getMarqueeFitSettings() {
     const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

     return {
          maxFontSize: 4 * rootFontSize,
          minFontSize: 0.5 * rootFontSize,
          step: 1
     };
}

function resetMarqueeFitSize(marqueeElement) {
     if (!marqueeElement) {
          return;
     }

     marqueeElement.style.removeProperty("--marquee-fit-size");
}

function fitMarqueeToContainer(marqueeElement) {
     if (!marqueeElement) {
          return;
     }

     const fitSettings = getMarqueeFitSettings();

     resetMarqueeFitSize(marqueeElement);
     marqueeElement.style.setProperty("--marquee-fit-size", `${fitSettings.maxFontSize}px`);

     let currentSize = fitSettings.maxFontSize;

     while (currentSize > fitSettings.minFontSize) {
          const marqueeTooWide = marqueeElement.scrollWidth > marqueeElement.clientWidth;

          if (!marqueeTooWide) {
               break;
          }

          currentSize -= fitSettings.step;
          marqueeElement.style.setProperty("--marquee-fit-size", `${currentSize}px`);
     }
}

function fitAllMarquees() {
     if (!marqueeItems.length) {
          return;
     }

     for (let i = 0; i < marqueeItems.length; i += 1) {
          fitMarqueeToContainer(marqueeItems[i].element);
     }
}

function buildMarqueeSpans(marqueeItem) {
     if (!marqueeItem || !marqueeItem.element || !marqueeItem.lineNodes.length) {
          return;
     }

     marqueeItem.lineLetterSpans = [];
     marqueeItem.visibleSpans = [];
     marqueeItem.previousColorsByLine = [];

     for (let i = 0; i < marqueeItem.lineNodes.length; i += 1) {
          const lineNode = marqueeItem.lineNodes[i];
          const originalText = lineNode.textContent.trim();

          lineNode.innerHTML = "";

          const letterSpans = [];

          for (let j = 0; j < originalText.length; j += 1) {
               const char = originalText[j];
               const span = document.createElement("span");

               span.textContent = char === " " ? "\u00A0" : char;
               span.style.display = "inline-block";

               lineNode.appendChild(span);
               letterSpans.push(span);

               if (span.textContent !== "\u00A0") {
                    marqueeItem.visibleSpans.push(span);
               }
          }

          marqueeItem.lineLetterSpans.push(letterSpans);
          marqueeItem.previousColorsByLine.push([]);
     }
}

function applyGlowToElement(element, color) {
     if (!element || !color) {
          return;
     }

     element.style.color = color;
     element.style.textShadow = buildUniversalTextGlow(color);
}

function cycleMarqueeColors() {
     if (marqueeItems.length && marqueeColorEngine) {
          for (let i = 0; i < marqueeItems.length; i += 1) {
               const marqueeItem = marqueeItems[i];

               if (!marqueeItem.lineLetterSpans.length) {
                    continue;
               }

               for (let lineIndex = 0; lineIndex < marqueeItem.lineLetterSpans.length; lineIndex += 1) {
                    const lineSpans = marqueeItem.lineLetterSpans[lineIndex];
                    const text = lineSpans.map((span) => span.textContent === "\u00A0" ? " " : span.textContent).join("");
                    const previousColors = marqueeItem.previousColorsByLine[lineIndex] || [];
                    const nextColors = marqueeColorEngine.nextCycleForText(text, previousColors);

                    for (let j = 0; j < lineSpans.length; j += 1) {
                         const span = lineSpans[j];
                         const nextColor = nextColors[j];

                         applyGlowToElement(span, nextColor);
                    }

                    marqueeItem.previousColorsByLine[lineIndex] = nextColors;
               }
          }
     }

     if (accentColorEngine) {
          const nextAccentColor = accentColorEngine.next();

          if (nextAccentColor) {
               document.documentElement.style.setProperty("--color-rainbow", nextAccentColor);
               syncNavButtonGlow();
          }
     }
}

function startHeaderColorCycle() {
     accentColorEngine = createColorEngine(getRainbowPalette);

     if (marqueeItems.length) {
          marqueeColorEngine = createColorEngine(getRainbowPalette);

          for (let i = 0; i < marqueeItems.length; i += 1) {
               buildMarqueeSpans(marqueeItems[i]);
          }

          fitAllMarquees();
     }

     cycleMarqueeColors();

     window.clearInterval(headerColorCycleTimer);

     headerColorCycleTimer = window.setInterval(function () {
          cycleMarqueeColors();
     }, getTextSettings().rainbowCycleSpeed);
}

/* NOTE: CANVAS */

const siteBgCanvas = document.getElementById("siteBgCanvas");
const siteBgCtx = siteBgCanvas ? siteBgCanvas.getContext("2d") : null;

const bgParticles = [];
let bgWidth = 0;
let bgHeight = 0;
let bgParticleCount = 0;
let resizeTimer = null;

let sparkleColorEngine = null;

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

function createBgParticle(startAboveScreen = false) {
     const sparkleSettings = getSparkleSettings();
     const x = Math.random() * bgWidth;

     if (!sparkleColorEngine) {
          sparkleColorEngine = createColorEngine(getSparklePalette);
     }

     return {
          x: x,
          baseX: x,
          y: startAboveScreen
               ? sparkleSettings.respawnOffsetTop
               : Math.random() * bgHeight,
          char: Math.random() < 0.5 ? "✦" : "✧",
          color: sparkleColorEngine.next() || getCssColor("--color-rainbow", getCssColor("--color-text", "#ffffff")),
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
     if (!siteBgCanvas || !siteBgCtx) {
          return;
     }

     sparkleColorEngine = createColorEngine(getSparklePalette);

     resizeBgCanvasFromCss(siteBgCanvas);
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
               bgParticles[i] = createBgParticle(true);
          }
     }
}

function drawBackground() {
     if (!siteBgCtx) {
          return;
     }

     siteBgCtx.clearRect(0, 0, bgWidth, bgHeight);
}

function drawBgParticles() {
     if (!siteBgCtx) {
          return;
     }

     const glowSettings = getGlowSettings();

     for (let i = 0; i < bgParticles.length; i += 1) {
          const p = bgParticles[i];

          siteBgCtx.save();
          siteBgCtx.globalAlpha = p.opacity;
          siteBgCtx.font = `${p.size}px Arial, Helvetica, sans-serif`;
          siteBgCtx.textAlign = "center";
          siteBgCtx.textBaseline = "middle";
          siteBgCtx.fillStyle = p.color;
          siteBgCtx.shadowBlur = glowSettings.bgParticleBlur;
          siteBgCtx.shadowColor = p.color;
          siteBgCtx.fillText(p.char, p.x, p.y);
          siteBgCtx.restore();
     }
}

function drawSparkleRain() {
     if (!siteBgCanvas || !siteBgCtx) {
          return;
     }

     drawBackground();
     updateBgParticles();
     drawBgParticles();

     window.requestAnimationFrame(drawSparkleRain);
}

// NOTE: TAGLINE

const taglineBreaks = [
     "making CSS do weird stuff on purpose.",
     "weaponizing side projects.",
     "turning chaos into commits.",
     "nosy early, googles later.",
     "feedback in, better code out.",
     "gremlin in dev, professional in prod.",
     "unhinged energy, finished tickets.",
     "three raccoons in a trenchcoat.",
     "Sasquatch enthusiast.",
     "keyboard snob.",
];

function setRandomTaglineBreak() {
     const el = document.querySelector(".tagline-break");

     if (!el) {
          return;
     }

     const randomIndex = Math.floor(Math.random() * taglineBreaks.length);
     el.textContent = taglineBreaks[randomIndex];
}

/* NOTE: SHARED HELPERS FOR GAME PAGES */
/* Expose reusable site-wide helpers so module files can reuse same CSS/theme/math logic instead of redefining it in every game file. */

if (!window.SiteTheme) {
     window.SiteTheme = {};
}

Object.assign(window.SiteTheme, {
     getCssValue,
     getCssNumber,
     getCssColor,
     getTextSettings,
     getGlowSettings,
     getSparkleSettings,
     getRainbowPalette,
     createColorEngine,
     randomNumber,
     randomWholeNumber,
     randomItem,
     randomItemExcept,
     shuffleArray,
     fitMarqueeToContainer,
     fitAllMarquees
});

/* NOTE: STARTUP */

function handleResize() {
     window.clearTimeout(resizeTimer);

     resizeTimer = window.setTimeout(function () {
          setupSparkleRain();
          syncNavButtonGlow();
          fitAllMarquees();
          cycleMarqueeColors();
     }, 150);
}

startHeaderColorCycle();
setRandomTaglineBreak();
syncNavButtonGlow();
closeMenu();

if (siteBgCanvas && siteBgCtx) {
     setupSparkleRain();
     drawSparkleRain();
     window.addEventListener("resize", handleResize);
}



// /* TROUBLESHOOTING */

// alert("before header");
// startHeaderColorCycle();
// alert("after header");

// alert("before menu");
// syncNavButtonGlow();
// alert("after menu");

// alert("before canvas check");

// if (siteBgCanvas && siteBgCtx) {
//      alert("before sparkle setup");
//      setupSparkleRain();
//      alert("after sparkle setup");

//      alert("before sparkle draw");
//      drawSparkleRain();
//      alert("after sparkle draw");

//      window.addEventListener("resize", handleResize);
// }

// alert("end of startup");
