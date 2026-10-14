'use strict';

/**
 * Jonas Joaquim Cossa — Portfolio Website
 * High-performance GSAP, ScrollTrigger, Lenis, and Video/Canvas scroll controller
 */

// Global reference to Lenis smooth scroll instance
let lenis = null;

// Reduced motion preference check
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// DOM Element references
const canvas = document.getElementById('bg-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const video = document.getElementById('bg-video');
const preloader = document.getElementById('preloader');
const preloaderBar = document.getElementById('preloader-bar');

// State flags and variables
let usingCanvas = false;
let frames = [];
let totalFrames = 136;
let currentFrameIndex = 0;
let rafDrawId = null;
let preloaderHidden = false;
let updateVideoScrub = null;
let siteStarted = false;

// Modal state
let currentProject = null;
let previousFocus = null;

/**
 * Resize canvas to match window dimensions and redraw current frame
 */
function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (usingCanvas && frames[currentFrameIndex]) {
    drawFrame(currentFrameIndex);
  }
}
window.addEventListener('resize', resizeCanvas);

/**
 * Draw frame on canvas with cover-fit aspect ratio
 * @param {number} index - Index of frame to draw
 */
function drawFrame(index) {
  if (!usingCanvas || !ctx || !frames || !frames.length) return;
  const clampedIndex = Math.max(0, Math.min(frames.length - 1, index));
  currentFrameIndex = clampedIndex;

  let img = frames[clampedIndex];
  if (!img || !img.complete || img.naturalWidth === 0) {
    // Look backwards for closest loaded frame
    for (let i = clampedIndex - 1; i >= 0; i--) {
      if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) {
        img = frames[i];
        break;
      }
    }
    // Or forwards if not found
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let i = clampedIndex + 1; i < frames.length; i++) {
        if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) {
          img = frames[i];
          break;
        }
      }
    }
  }
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = canvas.width / canvas.height;
  let dw, dh, dx, dy;

  if (canvasRatio > imgRatio) {
    dw = canvas.width;
    dh = dw / imgRatio;
  } else {
    dh = canvas.height;
    dw = dh * imgRatio;
  }

  dx = (canvas.width - dw) / 2;
  dy = (canvas.height - dh) / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, dx, dy, dw, dh);
}

/**
 * Request animation frame wrapper for smooth canvas rendering
 * @param {number} index - Index of frame to render
 */
function requestDrawFrame(index) {
  if (rafDrawId) cancelAnimationFrame(rafDrawId);
  rafDrawId = requestAnimationFrame(() => {
    drawFrame(index);
    rafDrawId = null;
  });
}

/**
 * Preloader exit animation
 */
function hidePreloader() {
  if (preloaderHidden) return;
  preloaderHidden = true;
  if (preloader) {
    preloader.classList.add('preloader--hidden');
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 800);
  }
}

/**
 * Open project modal with details and populate gallery
 * @param {Object} project - Project object from projects.json
 */
function openProjectModal(project) {
  currentProject = project;
  previousFocus = document.activeElement;

  const modal = document.getElementById('project-modal');
  const title = document.getElementById('modal-title');
  const meta = document.getElementById('modal-meta');
  const services = document.getElementById('modal-services');
  const desc = document.getElementById('modal-description');
  const gallery = document.getElementById('modal-gallery');

  if (!modal) return;

  if (title) title.textContent = project.titulo || '';
  if (meta) meta.textContent = (project.cliente || '') + (project.ano ? ' — ' + project.ano : '');
  if (services) {
    services.innerHTML = (project.servicos || [])
      .map((s) => '<span class="label">' + s + '</span>')
      .join('');
  }
  if (desc) desc.textContent = project.descricao || '';
  if (gallery) {
    gallery.innerHTML = (project.imagens || [])
      .map(
        (src) =>
          '<img src="' + encodeURI(src) + '" alt="' + (project.titulo || '') + '" loading="lazy">'
      )
      .join('');
  }

  modal.classList.add('modal--open');
  modal.setAttribute('aria-hidden', 'false');

  // Pause Lenis smooth scroll while modal is active
  if (typeof lenis !== 'undefined' && lenis) {
    lenis.stop();
  }

  const closeBtn = modal.querySelector('.modal__close');
  if (closeBtn) closeBtn.focus();
}

/**
 * Close project modal and restore focus and Lenis scroll
 */
function closeProjectModal() {
  const modal = document.getElementById('project-modal');
  if (!modal || !modal.classList.contains('modal--open')) return;

  modal.classList.remove('modal--open');
  modal.setAttribute('aria-hidden', 'true');

  // Resume Lenis smooth scroll
  if (typeof lenis !== 'undefined' && lenis) {
    lenis.start();
  }

  // Restore keyboard focus
  if (previousFocus && typeof previousFocus.focus === 'function') {
    previousFocus.focus();
  }
}

/**
 * Attach close triggers and focus trap to the modal
 */
function setupModalListeners() {
  const modalClose = document.querySelector('.modal__close');
  if (modalClose) {
    modalClose.addEventListener('click', closeProjectModal);
  }

  const modalBackdrop = document.querySelector('.modal__backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', closeProjectModal);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProjectModal();
    }
  });

  const modal = document.getElementById('project-modal');
  if (modal) {
    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusable = modal.querySelectorAll('button, [tabindex]:not([tabindex="-1"]), a[href], img');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }
}

/**
 * Render project cards in the grid and bind interactions
 * @param {Array} projects - Array of project objects
 */
function renderProjects(projects) {
  const grid = document.getElementById('projects-grid');
  if (!grid || !Array.isArray(projects)) return;
  grid.innerHTML = '';

  projects.forEach((project) => {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Abrir projecto: ' + project.titulo);

    card.innerHTML = `
      <div class="project-card__hint">
        <span>CLICA AQUI</span>
        <svg class="project-card__arrow" viewBox="0 0 30 30" fill="none" stroke="#E8191F" stroke-width="2" stroke-linecap="round">
          <path d="M15 5 C15 5, 10 15, 15 25" />
          <path d="M10 20 L15 25 L20 20" />
        </svg>
      </div>
      <div class="project-card__folder">
        <svg viewBox="0 0 200 160" class="folder-svg">
          <rect class="folder-back" x="5" y="30" width="190" height="125" rx="4" fill="#E0E0E0"/>
          <path class="folder-tab" d="M5 30 L5 15 Q5 5 15 5 L65 5 L80 30 Z" fill="#BDBDBD"/>
          <rect class="folder-accent" x="5" y="30" width="190" height="3" fill="#E8191F"/>
          <rect class="folder-front" x="5" y="33" width="190" height="122" rx="3" fill="#F2F2F2"/>
        </svg>
      </div>
      <h3 class="project-card__name">${project.titulo}</h3>
      <p class="project-card__meta micro-text">${project.ano} — ${(project.servicos || []).join(' · ')}</p>
      <p class="project-card__desc">${project.descricao || ''}</p>
    `;

    const openModal = () => openProjectModal(project);
    card.addEventListener('click', openModal);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal();
      }
    });

    grid.appendChild(card);
  });

  // Animate cards entrance if motion is not reduced
  if (!prefersReducedMotion && typeof gsap !== 'undefined') {
    gsap.from('.project-card', {
      y: 60,
      opacity: 0,
      stagger: 0.15,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#projects-grid',
        start: 'top 80%',
      },
    });
  }
}

/**
 * Fetch and load projects from projects.json
 */
function loadProjects() {
  fetch('projects.json')
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
      return r.json();
    })
    .then((projects) => renderProjects(projects))
    .catch((err) => {
      console.error('Falha ao carregar projects.json:', err);
    });
}

/**
 * Smoothly complete preloader and activate animations (guaranteed single-execution)
 */
function startSite() {
  if (siteStarted) return;
  siteStarted = true;

  if (preloaderBar) {
    preloaderBar.style.width = '100%';
  }

  if (usingCanvas) {
    drawFrame(0);
  }

  // Smooth transition before hiding preloader
  setTimeout(() => {
    hidePreloader();
    initAnimations();
  }, 180);
}

/**
 * Check if extracted canvas frames exist on the server
 * @returns {Promise<{available: boolean, folder: string}>}
 */
function checkFramesAvailable() {
  return new Promise((resolve) => {
    const deviceFolder = window.innerWidth < 768 ? 'mobile' : 'desktop';
    const testImg = new Image();
    testImg.onload = () => resolve({ available: true, folder: deviceFolder });
    testImg.onerror = () => {
      if (deviceFolder === 'mobile') {
        const desktopImg = new Image();
        desktopImg.onload = () => resolve({ available: true, folder: 'desktop' });
        desktopImg.onerror = () => resolve({ available: false, folder: 'desktop' });
        desktopImg.src = 'assets/frames/desktop/frame_0000.webp';
      } else {
        resolve({ available: false, folder: 'desktop' });
      }
    };
    testImg.src = `assets/frames/${deviceFolder}/frame_0000.webp`;

    // Maximum 800ms wait for frame verification
    setTimeout(() => {
      resolve({ available: true, folder: deviceFolder });
    }, 800);
  });
}

/**
 * Stream remaining frames in the background without blocking the UI
 * @param {string} folder - 'desktop' or 'mobile'
 * @param {number} count - Total frame count
 */
function loadRemainingFrames(folder, count) {
  for (let i = 1; i < count; i++) {
    const img = new Image();
    const frameNum = String(i).padStart(4, '0');
    img.src = `assets/frames/${folder}/frame_${frameNum}.webp`;
    img.onload = () => {
      frames[i] = img;
    };
  }
}

/**
 * Setup canvas frame playback with instant frame-0 unlock and background streaming
 * @param {string} folder - 'desktop' or 'mobile'
 */
function setupCanvas(folder) {
  usingCanvas = true;
  totalFrames = 136;
  frames = new Array(totalFrames);

  if (video) video.style.display = 'none';
  if (canvas) canvas.style.display = 'block';
  resizeCanvas();

  // Load the first frame immediately for display
  const firstFrame = new Image();
  firstFrame.src = `assets/frames/${folder}/frame_0000.webp`;

  firstFrame.onload = () => {
    frames[0] = firstFrame;
    drawFrame(0);
    startSite();
    loadRemainingFrames(folder, totalFrames);
  };

  firstFrame.onerror = () => {
    console.warn('Falha no frame inicial, a recorrer ao fallback de vídeo.');
    setupVideoFallback();
  };

  // Hard safety timeout: unlock the website regardless of slow network
  setTimeout(() => {
    if (!siteStarted) {
      console.warn('Timeout de segurança atingido. A desbloquear o site.');
      startSite();
      loadRemainingFrames(folder, totalFrames);
    }
  }, 1200);
}

/**
 * Setup video fallback playback when frames are not present
 */
function setupVideoFallback() {
  usingCanvas = false;
  if (canvas) canvas.style.display = 'none';
  if (video) {
    video.style.display = 'block';
    video.currentTime = 0;
  }

  let videoTargetTime = 0;
  let videoCurrentTime = 0;

  function updateVideoTime() {
    videoCurrentTime += (videoTargetTime - videoCurrentTime) * 0.1;
    if (Math.abs(videoCurrentTime - videoTargetTime) > 0.01 && video) {
      video.currentTime = videoCurrentTime;
    }
    requestAnimationFrame(updateVideoTime);
  }
  updateVideoTime();

  updateVideoScrub = (progress) => {
    if (video && video.duration) {
      videoTargetTime = progress * video.duration;
    }
  };

  if (video) {
    video.addEventListener('loadedmetadata', () => {
      video.currentTime = 0;
    });

    if (video.readyState >= 2) {
      startSite();
    } else {
      video.addEventListener('canplay', () => startSite(), { once: true });
      video.addEventListener('loadeddata', () => startSite(), { once: true });
      setTimeout(startSite, 1500);
    }
  } else {
    startSite();
  }
}

/**
 * Initialize main GSAP timelines, ScrollTrigger, and Lenis smooth scroll
 */
function initAnimations() {
  loadProjects();

  // Handle prefers-reduced-motion: show content statically and skip scroll-driven animations
  if (prefersReducedMotion) {
    const heroContent = document.querySelector('.hero__content');
    if (heroContent) {
      heroContent.style.opacity = '1';
      heroContent.style.transform = 'none';
      heroContent.style.visibility = 'visible';
    }
    const aboutContent = document.querySelector('.about__content');
    if (aboutContent) {
      aboutContent.style.opacity = '1';
      aboutContent.style.transform = 'none';
      aboutContent.style.visibility = 'visible';
    }
    document
      .querySelectorAll('.hero__name, .hero__labels, .about__heading, .about__body')
      .forEach((el) => {
        el.style.transform = 'none';
        el.style.opacity = '1';
      });
    return;
  }

  // 1. Lenis Smooth Scroll Initialization
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });

    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
    }

    if (typeof gsap !== 'undefined') {
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }
  }

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    return;
  }

  // 2. Video / Canvas Scroll-Scrubbing Mapping
  ScrollTrigger.create({
    trigger: '#inicio',
    start: 'top top',
    endTrigger: '#projectos',
    end: 'top top',
    scrub: 0.5,
    onUpdate: (self) => {
      if (usingCanvas && frames.length > 0) {
        const frameIndex = Math.round(self.progress * (frames.length - 1));
        requestDrawFrame(frameIndex);
      } else if (updateVideoScrub) {
        updateVideoScrub(self.progress);
      }
    },
  });

  // 3. Hero Text Horizontal Animation
  const heroTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#inicio',
      start: 'top top',
      end: '+=150%',
      pin: true,
      scrub: 1.2,
      id: 'hero',
    },
  });

  heroTl.to('.hero__scroll-cue', { opacity: 0, duration: 0.15 }, 0);
  heroTl.to('.hero__name', { x: '-120vw', ease: 'power1.in', duration: 0.6 }, 0.4);
  heroTl.to('.hero__labels', { x: '-130vw', ease: 'power1.in', duration: 0.6 }, 0.35);

  // 4. About Text Horizontal Animation
  const aboutTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#sobre',
      start: 'top top',
      end: '+=250%',
      pin: true,
      scrub: 1.2,
      id: 'about',
    },
  });

  aboutTl.fromTo('.about__heading', { x: '110vw' }, { x: '0vw', ease: 'power2.out', duration: 0.3 }, 0);
  aboutTl.fromTo('.about__body', { x: '120vw' }, { x: '0vw', ease: 'power2.out', duration: 0.3 }, 0.03);
  aboutTl.to('.about__heading', { x: '-110vw', ease: 'power1.in', duration: 0.35 }, 0.65);
  aboutTl.to('.about__body', { x: '-120vw', ease: 'power1.in', duration: 0.35 }, 0.62);

  // 5. Systems Section Cards Stagger Animation
  if (typeof gsap !== 'undefined') {
    gsap.from('.system-card', {
      y: 40,
      opacity: 0,
      stagger: 0.05,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#sistemas',
        start: 'top 80%',
      },
    });
  }
}

// ═══ INITIALIZATION FLOW ═══
function boot() {
  // Register GSAP plugins
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // Setup modal close and keyboard traps
  setupModalListeners();

  // Initial sizing for canvas
  resizeCanvas();

  // Check whether extracted video frames are present
  checkFramesAvailable().then((frameCheck) => {
    if (frameCheck.available) {
      setupCanvas(frameCheck.folder);
    } else {
      setupVideoFallback();
    }
  });

  // Ultimate safety fallback: unlock site under any circumstance after 2s
  setTimeout(() => {
    if (!siteStarted) {
      console.warn('Fallback global de inicialização acionado.');
      startSite();
    }
  }, 2000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

