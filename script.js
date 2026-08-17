// Prevent the browser from restoring scroll position on reload/navigation
if ('scrollRestoration' in history) {
  try { history.scrollRestoration = 'manual'; } catch (e) {}
}

// Lenis isn't created until inside the try block below, but the reload/
// back-forward handlers need to reach it once it exists so they can reset
// Lenis's own tracked scroll target — not just the native scroll position —
// otherwise Lenis can "correct" the page back to its old position on the
// next animation frame, causing a visible jump-then-glide-back glitch.
let lenisInstance = null;

function resetScrollToTop() {
  if (lenisInstance) {
    lenisInstance.scrollTo(0, { immediate: true, force: true });
  } else {
    window.scrollTo(0, 0);
  }
}

// Ensure we start at the top when the page is (re)loaded
window.scrollTo(0, 0);
window.addEventListener('beforeunload', () => window.scrollTo(0, 0));
// Handle bfcache/back-forward and normal load: ensure top position
window.addEventListener('pageshow', (evt) => {
  if (evt.persisted) {
    resetScrollToTop();
    setTimeout(resetScrollToTop, 0);
  }
});
window.addEventListener('load', () => resetScrollToTop());

try {
  gsap.registerPlugin(SplitText, CustomEase, ScrollTrigger);
  CustomEase.create("hop", "0.8, 0, 0.1, 1");

  const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true,
  smoothTouch: true,
  touchMultiplier: 1.5,
  infinite: false,
});

lenisInstance = lenis;

lenis.on("scroll", ScrollTrigger.update);
// Pause Lenis while the tab is hidden so background/off-screen tabs
// don't keep burning CPU every frame.
requestAnimationFrame(function raf(time) {
  if (!document.hidden) lenis.raf(time);
  requestAnimationFrame(raf);
});

const ROTATING_WORDS = ["Architecture", "Interiors", "Master Planning", "Design consultancy", "Design Studio llp"];

const preloader = document.querySelector(".preloader");
const preloaderCounter = document.querySelector(".preloader-counter h1");
const preloaderWord = document.querySelector(
  ".preloader-header-row:nth-child(2) h1",
);

// Show the first rotating word immediately instead of the original HTML text
if (preloaderWord && Array.isArray(ROTATING_WORDS) && ROTATING_WORDS.length) {
  preloaderWord.textContent = ROTATING_WORDS[0];
}

const heroRows = gsap.utils.toArray(".hero-header-row");
const heroHeadings = gsap.utils.toArray(".hero-header-row h1");
const heroImageFrame = document.querySelector(".hero-header-img");
const heroImages = gsap.utils.toArray(".hero-header-img > *");

const counter = { progress: 0 };
const wordCycle = { progress: 0 };
const imageCycle = { progress: 0 };

let activeWord = 0;
let activeImage = 0;

const headingSplits = heroHeadings.map((heading) =>
  SplitText.create(heading, {
    type: "words",
    mask: "words",
    wordsClass: "word",
  }),
);

headingSplits.forEach((split, rowIndex) => {
  gsap.set(split.words, { x: rowIndex === 1 ? "100%" : "-100%" });
});

gsap.set("nav", { y: -300 });

const rootFontSize = parseFloat(
  getComputedStyle(document.documentElement).fontSize,
);
const leftEdgeOffset =
  2.5 * rootFontSize - heroImageFrame.getBoundingClientRect().left;

gsap.set(heroImageFrame, { x: leftEdgeOffset });

function renderCounter() {
  const value = Math.round(counter.progress);
  preloaderCounter.textContent = String(value).padStart(3, "0");
}

function renderWord() {
  const index = Math.round(wordCycle.progress);
  if (index === activeWord) return;
  activeWord = index;
  preloaderWord.innerText = ROTATING_WORDS[index];
}

function renderImage() {
  const index = Math.round(imageCycle.progress) % heroImages.length;
  if (index === activeImage) return;
  activeImage = index;
  heroImages.forEach((image, imageIndex) => {
    image.style.opacity = imageIndex === index ? 1 : 0;
  });
}

function expandImageToFullscreen() {
  heroRows.forEach((row) => {
    gsap.set(row, {
      flex: "none",
      height: row.getBoundingClientRect().height,
    });
  });

  const frame = heroImageFrame.getBoundingClientRect();

  gsap.set(heroImageFrame, {
    position: "fixed",
    top: frame.top,
    left: frame.left,
    width: frame.width,
    height: frame.height,
    x: 0,
    y: 0,
    zIndex: -1,
  });

  gsap.to(heroImageFrame, {
    top: 0,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    duration: 1.25,
    ease: "hop",
  });
}

const skipIntro = window.__rlxSkipIntro === true;

function runIntro() {
  if (skipIntro) {
    // Arrived via transition or back/forward: skip the preloader intro.
    if (preloader) preloader.style.display = "none";
    if (heroImageFrame) gsap.set(heroImageFrame, { x: 0 });
    gsap.set("nav", { y: 0 });
    gsap.set(".hero-footer p", { opacity: 1 });
    if (headingSplits) headingSplits.forEach(function (sp) { if (sp && sp.words) gsap.set(sp.words, { x: "0%" }); });
    if (heroImages && heroImages.length) {
      // Match first-load: state: show the last element (the hero video) and it plays.
      var heroVideo = heroImages[heroImages.length - 1];
      heroImages.forEach(function (im, i) { im.style.opacity = im === heroVideo ? 1 : 0; });
      if (heroVideo && heroVideo.tagName === "VIDEO" && heroVideo.muted) {
        try { var hvPlay = heroVideo.play(); if (hvPlay && hvPlay.catch) hvPlay.catch(function () {}); } catch (e2) {}
      }
      if (typeof expandImageToFullscreen === "function") expandImageToFullscreen();
    }
    // defer so module-level vars (slides, settings, etc.) are initialized first
    setTimeout(initScrollAnimations, 0);
    return;
  }

  var tl = gsap.timeline({ delay: 0.5 });

  tl.to(counter, { progress: 100, duration: 3, ease: "none", onUpdate: renderCounter });

  tl.to(heroImageFrame, { x: 0, duration: 3, ease: "none" }, 0);

  tl.to(wordCycle, {
    progress: ROTATING_WORDS.length - 1,
    duration: 3,
    ease: "none",
    onUpdate: renderWord,
  }, 0);

  tl.to(imageCycle, {
    progress: heroImages.length * 3 - 1,
    duration: 3,
    ease: "none",
    onUpdate: renderImage,
  }, 0);

  tl.to(
    [".preloader-header", ".preloader-counter", ".preloader-footer-copy"],
    { opacity: 0, duration: 0.25 },
    "+=0.35",
  );

  tl.to(preloader, {
    clipPath: "polygon(0% 0%, 100% 0, 100% 0%, 0% 0%)",
    duration: 1,
    ease: "hop",
    onComplete: () => preloader.remove(),
  });

  tl.to(".word", {
    x: "0%",
    duration: 1.25,
    ease: "power3.out",
    onComplete: expandImageToFullscreen,
  }, "-=0.5");

  tl.to(".hero-footer p", { opacity: 1, duration: 1, ease: "power3.out" }, "<");

  tl.to("nav", { y: 0, duration: 1, ease: "power3.out" }, "<");

  tl.call(initScrollAnimations);
}

runIntro();

let sliderReadyDispatched = false;

function initScrollAnimations() {
  ScrollTrigger.create({
    trigger: ".slider",
    start: "top top",
    end: "+=250%",
    pin: true, invalidatedOnRefresh: true,
    scrub: 1,
    snap: {
      snapTo: 1 / (slides.length - 1),
      duration: 0.5,
      ease: "power1.inOut",
    },
    onUpdate: (self) => {
      scrollTarget = 1 + self.progress * (slides.length - 1);

      if (!sliderReadyDispatched && self.progress >= 0.6) {
        sliderReadyDispatched = true;
        window.dispatchEvent(new CustomEvent("sliderReady"));
      }
    },
    onLeave: () => {
      window.dispatchEvent(new CustomEvent("sliderFinished"));
    },
  });

  ScrollTrigger.refresh();
}

/* ===== Slider Section ===== */

const settings = {
  scrollSensitivity: 1200,
  smoothness: 0.05,
  bufferSlides: 3,
  imageShift: 25,
  copyShift: 15,
  titleHold: 0.1,
  imageZoom: 1.25,
  revealOverlap: 0.5,
};

const slides = [
  {
    title: "Hospitality",
    tags: ["Villas &amp; Estates", "Private &amp; Bespoke", "Form &amp; Context"],
    accent: "#dce9e1",
    link: "hospitality.html",
  },
  {
    title: "Residential",
    tags: ["Editorial &amp; Portrait", "Concept &amp; Series", "Art &amp; Direction"],
    accent: "#f5a97a",
    link: "residential.html",
  },
  {
    title: "Master-Planning",
    tags: ["LAND-USE &amp; VISION", "SPACE &amp; CONNECTIVITY", "SUSTAINABILITY &amp; GROWTH"],
    accent: "#b7e0a0",
    link: "/stillpose/",
  },
  {
    title: "Interior Design Consultancy",
    tags: ["CONCEPT &amp; PLANNING", "AESTHETICS &amp; COMFORT", "DETAILS &amp; CRAFTSMANSHIP"],
    accent: "#c9a97a",
    link: "interior.html",
  },
  {
    title: "About us",
    tags: ["CREATIVITY &amp; STRATEGY", "SHAPING SPACES", "BUILDING LEGACIES"],
    accent: "#e8e8e8",
    link: "about-us.html",
  },
];

const columns = {
  left: { el: document.querySelector(".left"), visibleSlides: new Map() },
  right: { el: document.querySelector(".right"), visibleSlides: new Map() },
};

let scrollPosition = 1;
let scrollTarget = 1;
let lastTouchY = 0;

function createSlide(side, index) {
  const slideIndex = ((index % slides.length) + slides.length) % slides.length;
  const data = slides[slideIndex];

  const el = document.createElement("div");
  el.className = "slide";
  el.style.zIndex = index;
  const titleClass = /Master-Planning|Interior Design Consultancy/.test(data.title)
    ? "slide-title slide-title--condensed"
    : "slide-title";
  const buttonLabel = data.title === "About us" ? "Learn More" : "View Full Project";
  el.innerHTML = `
    <img src="assets/slide_img_${side}_${slideIndex + 1}.jpg" alt="" loading="lazy" decoding="async" />
    <div class="overlay"></div>
    <div class="copy" style="color:${data.accent}">
      <div class="slide-tags">${data.tags.join("<br />")}</div>
      <div class="${titleClass}">${data.title}</div>
      <a href="${data.link}" class="slide-link">${buttonLabel}</a>
    </div>
  `;

  columns[side].el.appendChild(el);
  columns[side].visibleSlides.set(index, el);
}

function getRevealShape(side, revealAmount) {
  const d =
    Math.max(0, Math.min(1, revealAmount)) * (100 + settings.revealOverlap);
  return side === "left"
    ? `polygon(0% ${100 - d}%, 100% ${100 - d}%, 100% 100%, 0% 100%)`
    : `polygon(0% 0%, 100% 0%, 100% ${d}%, 0% ${d}%)`;
}

function getTitlePosition(slideProgress) {
  const fromCenter = slideProgress - 1;
  const past = Math.abs(fromCenter) - settings.titleHold;
  if (past <= 0) return 1;
  const t = past / (1 - settings.titleHold);
  return 1 + Math.sign(fromCenter) * t * t * (3 - 2 * t);
}

function updateSlider() {
  const first = Math.max(
    0,
    Math.floor(scrollPosition) - settings.bufferSlides,
  );
  const last = Math.min(
    slides.length - 1,
    Math.floor(scrollPosition) + settings.bufferSlides + 1,
  );

  for (const side of ["left", "right"]) {
    const visibleSlides = columns[side].visibleSlides;
    const driftDirection = side === "left" ? 1 : -1;

    for (let i = first; i <= last; i++) {
      if (!visibleSlides.has(i)) createSlide(side, i);
    }

    for (const [index, el] of visibleSlides) {
      if (index < first || index > last) {
        el.remove();
        visibleSlides.delete(index);
        continue;
      }

      const revealAmount = scrollPosition - index;
      const slideProgress = Math.max(0, Math.min(2, revealAmount));

      el.style.clipPath = getRevealShape(side, revealAmount);

      const imageDrift =
        (1 - slideProgress) * settings.imageShift * driftDirection;
      el.querySelector("img").style.transform =
        `translateY(${imageDrift}%) scale(${settings.imageZoom})`;

      const titleDrift =
        (1 - getTitlePosition(slideProgress)) *
        settings.copyShift *
        driftDirection;
      el.querySelector(".copy").style.transform = `translateY(${titleDrift}%)`;
    }
  }
}

function animateSlider() {
  requestAnimationFrame(animateSlider);
  // Skip the per-frame DOM/transform work while the tab is hidden.
  if (document.hidden) return;
  scrollPosition += (scrollTarget - scrollPosition) * settings.smoothness;
  updateSlider();
}

animateSlider();

// Overlay menu behavior
(() => {
  const navToggler = document.querySelector('.nav-toggler');
  const navContent = document.querySelector('.nav-content');
  if (!navToggler || !navContent) return;

  let splitDone = false;
  function ensureSplit() {
    if (splitDone || !window.SplitText) return;
    try {
      SplitText.create('.nav-items a', { type: 'lines', mask: 'lines', linesClass: 'line' });
      splitDone = true;
    } catch (e) {}
  }

  navToggler.addEventListener('click', () => {
    const willOpen = !navContent.classList.contains('open');
    navToggler.classList.toggle('open');
    navContent.classList.toggle('open');
    if (willOpen) {
      ensureSplit();
      if (window.SplitText) {
        gsap.fromTo(
          '.nav-items a .line',
          { y: '100%' },
          { y: '0%', duration: 0.7, stagger: 0.06, ease: 'power3.out', delay: 0.55 }
        );
      }
    }
  });
})();

// Resume autoplay videos when the page is restored from the back/forward cache,
// otherwise the browser pauses them and they never restart.
function rlxResumeVideos() {
  document.querySelectorAll("video").forEach(function (v) {
    try {
      if (v.muted && v.paused) {
        var pr = v.play();
        if (pr && pr.catch) pr.catch(function () {});
      }
    } catch (e2) {}
  });
}
// Retry over the first few seconds so it catches the video the moment it is ready.
var rlxRetry = 0;
function rlxScheduleResume() {
  rlxResumeVideos();
  if (rlxRetry < 8) {
    rlxRetry++;
    setTimeout(rlxScheduleResume, 500);
  }
}
window.addEventListener("pageshow", rlxScheduleResume);
window.addEventListener("load", rlxScheduleResume);
document.addEventListener("visibilitychange", function () {
  if (!document.hidden) { rlxRetry = 0; rlxScheduleResume(); }
});

} catch (e) {
  console.error('Animation scripts failed:', e);
  const preloader = document.querySelector('.preloader');
  if (preloader) preloader.remove();
}

// RLX: keep pin distances in sync with the mobile viewport (address bar)
(function () {
  function refresh() { if (window.ScrollTrigger) { try { ScrollTrigger.refresh(); } catch (e) {} } }
  window.addEventListener("load", refresh);
  window.addEventListener("resize", refresh);
})();
// RLX viewport-safe pin refresh
(function(){function rf(){if(window.ScrollTrigger){try{ScrollTrigger.refresh();}catch(e){}}}window.addEventListener('load',rf);window.addEventListener('resize',rf);})();
