/* SHARED JS */

/* ========================= */
/* MENU TOGGLE               */
/* ========================= */

const menuButton = document.querySelector(".menu-button");
const dropdownLow = document.getElementById("dropdownLow");

if (menuButton && dropdownLow) {
     menuButton.addEventListener("click", function () {
          dropdownLow.classList.toggle("menu-open");

          if (dropdownLow.classList.contains("menu-open")) {
               menuButton.textContent = "×";
          } else {
               menuButton.textContent = "+";
          }
     });
}

/* ========================= */
/* THEME / COLOR HELPERS     */
/* ========================= */

const rootStyles = getComputedStyle(document.documentElement);

const theme = {
     pink: rootStyles.getPropertyValue("--pink").trim(),
     red: rootStyles.getPropertyValue("--red").trim(),
     maroon: rootStyles.getPropertyValue("--maroon").trim(),
     peach: rootStyles.getPropertyValue("--peach").trim(),
     flamingo: rootStyles.getPropertyValue("--flamingo").trim(),
     yellow: rootStyles.getPropertyValue("--yellow").trim(),
     green: rootStyles.getPropertyValue("--green").trim(),
     teal: rootStyles.getPropertyValue("--teal").trim(),
     sky: rootStyles.getPropertyValue("--sky").trim(),
     blue: rootStyles.getPropertyValue("--blue").trim(),
     lavender: rootStyles.getPropertyValue("--lavender").trim(),
     violet: rootStyles.getPropertyValue("--violet").trim(),
     white: "#ffffff",
     white: "#ffffff",
     white: "#ffffff",
     white: "#ffffff",
     white: "#ffffff"
};

const sparklePalette = [
     theme.white,
     theme.pink,
     theme.red,
     theme.maroon,
     theme.peach,
     theme.flamingo,
     theme.yellow,
     theme.green,
     theme.teal,
     theme.sky,
     theme.blue,
     theme.lavender,
     theme.violet
];

const headerPalette = [
     theme.pink,
     theme.red,
     theme.maroon,
     theme.peach,
     theme.flamingo,
     theme.yellow,
     theme.green,
     theme.teal,
     theme.sky,
     theme.blue,
     theme.lavender,
     theme.violet
];

function randomNumber(min, max) {
     return Math.random() * (max - min) + min;
}

function randomWholeNumber(min, max) {
     return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(array) {
     return array[randomWholeNumber(0, array.length - 1)];
}

/* ========================= */
/* HEADER COLOR / GLOW       */
/* ========================= */

const marquee = document.querySelector(".marquee");
const marqueeOriginalText = marquee ? marquee.textContent : "";
let marqueeSpans = [];

function buildMarqueeSpans() {
     if (!marquee) {
          return;
     }

     marquee.innerHTML = "";
     marqueeSpans = [];

     for (let i = 0; i < marqueeOriginalText.length; i += 1) {
          const char = marqueeOriginalText[i];
          const span = document.createElement("span");
          span.textContent = char === " " ? "\u00A0" : char;
          marquee.appendChild(span);
          marqueeSpans.push(span);
     }
}

function applyGlowToElement(element, color) {
     if (!element) {
          return;
     }

     element.style.color = color;
     element.style.textShadow = `
          0 0 0.05rem ${color},
          0 0 0.25rem ${color}
     `;
}

function shuffleArray(array) {
     const shuffled = [...array];

     for (let i = shuffled.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
     }

     return shuffled;
}

function cycleMarqueeColors() {
     if (!marqueeSpans.length) {
          return;
     }

     const shuffledColors = shuffleArray(headerPalette);

     for (let i = 0; i < marqueeSpans.length; i += 1) {
          const color = shuffledColors[i % shuffledColors.length];
          applyGlowToElement(marqueeSpans[i], color);
     }
}

function startHeaderColorCycle() {
     buildMarqueeSpans();
     cycleMarqueeColors();

     window.setInterval(function () {
          cycleMarqueeColors();
     }, 900);
}

/* ========================= */
/* SPARKLE RAIN BG           */
/* ========================= */

const bgCanvas = document.getElementById("siteBgCanvas");
const bgCtx = bgCanvas ? bgCanvas.getContext("2d") : null;

const bgParticles = [];
let bgWidth = 0;
let bgHeight = 0;
let bgParticleCount = 0;
let resizeTimer = null;

/* ------------------------- */
/* CANVAS SETUP              */
/* ------------------------- */

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
     const screenArea = bgWidth * bgHeight;

     const density = 0.00015; // increase this for greater density

     bgParticleCount = Math.min(
          180,
          Math.floor(screenArea * density) // lets not break things
     );
}

/* ------------------------- */
/* BG PARTICLE FACTORY       */
/* ------------------------- */

function createBgParticle() {
     const x = Math.random() * bgWidth;

     return {
          x: x,
          baseX: x,
          y: Math.random() * bgHeight,
          char: Math.random() < 0.5 ? "✦" : "✧",

          color: randomItem(sparklePalette),
          size: randomNumber(12, 24),
          speed: randomNumber(0.2, 0.7),
          wobbleOffset: randomNumber(0, Math.PI * 2),
          wobbleSpeed: randomNumber(0.005, 0.02),
          wobbleAmount: randomNumber(5, 15),
          opacity: randomNumber(0.2, 1)
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

/* ------------------------- */
/* BG PARTICLE UPDATE        */
/* ------------------------- */

function updateBgParticles() {
     for (let i = 0; i < bgParticles.length; i += 1) {
          const p = bgParticles[i];

          p.y += p.speed;
          p.wobbleOffset += p.wobbleSpeed;
          p.x = p.baseX + Math.sin(p.wobbleOffset) * p.wobbleAmount;

          if (p.y > bgHeight + 24) {
               bgParticles[i] = createBgParticle();
               bgParticles[i].y = -20;
          }
     }
}

/* ------------------------- */
/* BG PARTICLE DRAW          */
/* ------------------------- */

function drawBackground() {
     bgCtx.clearRect(0, 0, bgWidth, bgHeight);
}

function drawBgParticles() {
     for (let i = 0; i < bgParticles.length; i += 1) {
          const p = bgParticles[i];

          bgCtx.save();
          bgCtx.globalAlpha = p.opacity;
          bgCtx.font = `${p.size}px Arial, Helvetica, sans-serif`;
          bgCtx.textAlign = "center";
          bgCtx.textBaseline = "middle";
          bgCtx.fillStyle = p.color;
          bgCtx.shadowBlur = 8;
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

/* ------------------------- */
/* RESIZE HANDLING           */
/* ------------------------- */

function handleResize() {
     window.clearTimeout(resizeTimer);

     resizeTimer = window.setTimeout(function () {
          setupSparkleRain();
     }, 150);
}

/* ========================= */
/* STARTUP                   */
/* ========================= */

startHeaderColorCycle();

if (bgCanvas && bgCtx) {
     setupSparkleRain();
     drawSparkleRain();
     window.addEventListener("resize", handleResize);
}