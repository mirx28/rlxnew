// spotlight.js - Telescope Scroll Animation
// Uses CDN-loaded globals: gsap, ScrollTrigger, Lenis

try {
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  const config = {
  gap: 0.08,
  speed: 0.3,
  arcRadius: 500,
};

const spotlightItems = [
  { name: "Great", img: "assets/img_1.jpg" },
  { name: "architecture", img: "assets/img_2.jpg" },
  { name: "whispers", img: "assets/img_3.jpg" },
  { name: "forever", img: "assets/img_4.jpg" },
  { name: "while", img: "assets/img_5.jpg" },
  { name: "ordinary", img: "assets/img_6.jpg" },
  { name: "buildings", img: "assets/img_7.jpg" },
  { name: "simply", img: "assets/img_8.jpg" },
  { name: "occupy", img: "assets/img_9.jpg" },
  { name: "space", img: "assets/img_10.jpg" },
];

const titlesContainer = document.querySelector(".spotlight-titles");
const imagesContainer = document.querySelector(".spotlight-images");
const spotlightHeader = document.querySelector(".spotlight-header");
const titlesContainerElement = document.querySelector(
  ".spotlight-titles-container"
);
const introTextElements = document.querySelectorAll(".spotlight-intro-text");
const imageElements = [];

spotlightItems.forEach((item, index) => {
  const titleElement = document.createElement("h1");
  titleElement.textContent = item.name;
  if (index === 0) titleElement.style.opacity = "1";
  titlesContainer.appendChild(titleElement);

  const imgWrapper = document.createElement("div");
  imgWrapper.className = "spotlight-img";
  const imgElement = document.createElement("img");
  imgElement.src = item.img;
  imgElement.loading = 'lazy';
  imgElement.decoding = 'async';
  imgElement.alt = "";
  imgWrapper.appendChild(imgElement);
  imagesContainer.appendChild(imgWrapper);
  imageElements.push(imgWrapper);
});

const titleElements = titlesContainer.querySelectorAll("h1");
let currentActiveIndex = 0;

const containerWidth = window.innerWidth * 0.3;
const containerHeight = window.innerHeight;
const arcStartX = containerWidth - 220;
const arcStartY = -200;
const arcEndY = containerHeight + 200;
const arcControlPointX = arcStartX + config.arcRadius;
const arcControlPointY = containerHeight / 2;

function getBezierPosition(t) {
  const x =
    (1 - t) * (1 - t) * arcStartX +
    2 * (1 - t) * t * arcControlPointX +
    t * t * arcStartX;
  const y =
    (1 - t) * (1 - t) * arcStartY +
    2 * (1 - t) * t * arcControlPointY +
    t * t * arcEndY;
  return { x, y };
}

function getImgProgressState(index, overallProgress) {
  const startTime = index * config.gap;
  const endTime = startTime + config.speed;

  if (overallProgress < startTime) return -1;
  if (overallProgress > endTime) return 2;

  return (overallProgress - startTime) / config.speed;
}

imageElements.forEach((img) => gsap.set(img, { opacity: 0 }));

let spotlightInitialized = false;

function initSpotlight() {
  if (spotlightInitialized) return;
  spotlightInitialized = true;

  ScrollTrigger.create({
    trigger: ".spotlight",
    start: "top top",
    end: `+=${window.innerHeight * 10}px`,
    pin: true, invalidatedOnRefresh: true,
    pinSpacing: true,
    scrub: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const progress = self.progress;

      if (progress <= 0.2) {
      const animationProgress = progress / 0.2;

      const moveDistance = window.innerWidth * 0.55;
      gsap.set(introTextElements[0], {
        x: -animationProgress * moveDistance,
      });
      gsap.set(introTextElements[1], {
        x: animationProgress * moveDistance,
      });
      gsap.set(introTextElements[0], { opacity: 1 });
      gsap.set(introTextElements[1], { opacity: 1 });

      gsap.set(".spotlight-bg-img", {
        transform: `scale(${animationProgress})`,
      });
      gsap.set(".spotlight-bg-img img", {
        transform: `scale(${1.5 - animationProgress * 0.5})`,
      });

      imageElements.forEach((img) => gsap.set(img, { opacity: 0 }));
      spotlightHeader.style.opacity = "0";
      gsap.set(titlesContainerElement, {
        "--before-opacity": "0",
        "--after-opacity": "0",
      });
    } else if (progress > 0.2 && progress <= 0.25) {
      gsap.set(".spotlight-bg-img", { transform: "scale(1)" });
      gsap.set(".spotlight-bg-img img", { transform: "scale(1)" });

      gsap.set(introTextElements[0], { opacity: 0 });
      gsap.set(introTextElements[1], { opacity: 0 });

      imageElements.forEach((img) => gsap.set(img, { opacity: 0 }));
      spotlightHeader.style.opacity = "1";
      gsap.set(titlesContainerElement, {
        "--before-opacity": "1",
        "--after-opacity": "1",
      });
    } else if (progress > 0.25 && progress <= 0.95) {
      gsap.set(".spotlight-bg-img", { transform: "scale(1)" });
      gsap.set(".spotlight-bg-img img", { transform: "scale(1)" });

      gsap.set(introTextElements[0], { opacity: 0 });
      gsap.set(introTextElements[1], { opacity: 0 });

      spotlightHeader.style.opacity = "1";
      gsap.set(titlesContainerElement, {
        "--before-opacity": "1",
        "--after-opacity": "1",
      });

      const switchProgress = (progress - 0.25) / 0.7;
      const viewportHeight = window.innerHeight;
      const titlesContainerHeight = titlesContainer.scrollHeight;
      const startPosition = viewportHeight;
      const targetPosition = -titlesContainerHeight;
      const totalDistance = startPosition - targetPosition;
      const currentY = startPosition - switchProgress * totalDistance;

      gsap.set(".spotlight-titles", {
        transform: `translateY(${currentY}px)`,
      });

      imageElements.forEach((img, index) => {
        const imageProgress = getImgProgressState(index, switchProgress);

        if (imageProgress < 0 || imageProgress > 1) {
          gsap.set(img, { opacity: 0 });
        } else {
          const pos = getBezierPosition(imageProgress);
          gsap.set(img, {
            x: pos.x - 100,
            y: pos.y - 75,
            opacity: 1,
          });
        }
      });

      const viewportMiddle = viewportHeight / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;

      titleElements.forEach((title, index) => {
        const titleRect = title.getBoundingClientRect();
        const titleCenter = titleRect.top + titleRect.height / 2;
        const distanceFromCenter = Math.abs(titleCenter - viewportMiddle);

        if (distanceFromCenter < closestDistance) {
          closestDistance = distanceFromCenter;
          closestIndex = index;
        }
      });

      if (closestIndex !== currentActiveIndex) {
        if (titleElements[currentActiveIndex]) {
          titleElements[currentActiveIndex].style.opacity = "0.25";
        }
        titleElements[closestIndex].style.opacity = "1";
        document.querySelector(".spotlight-bg-img img").src =
          spotlightItems[closestIndex].img;
        currentActiveIndex = closestIndex;
      }
    } else if (progress > 0.95) {
      spotlightHeader.style.opacity = "0";
      gsap.set(titlesContainerElement, {
        "--before-opacity": "0",
        "--after-opacity": "0",
      });
    }
  },
});
}

function ensureSpotlightReady() {
  initSpotlight();
  ScrollTrigger.refresh();
}

window.addEventListener("sliderReady", ensureSpotlightReady, { once: true });
window.addEventListener("sliderFinished", ensureSpotlightReady, { once: true });
} catch (e) {
  console.error('Spotlight script failed:', e);
  const preloader = document.querySelector('.preloader');
  if (preloader) preloader.remove();
}
// RLX viewport-safe pin refresh
(function(){function rf(){if(window.ScrollTrigger){try{ScrollTrigger.refresh();}catch(e){}}}window.addEventListener('load',rf);window.addEventListener('resize',rf);})();
