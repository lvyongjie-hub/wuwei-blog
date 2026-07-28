import type { HomeIntroScene } from './home-intro-scene';

const INTRO_DURATION = 3200;
const STATIC_DURATION = 520;
const SCENE_DEADLINE = 1400;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const range = (value: number, start: number, end: number) =>
  clamp01((value - start) / (end - start));
const smooth = (value: number) => value * value * (3 - 2 * value);
const lerp = (start: number, end: number, value: number) => start + (end - start) * value;

function isHTMLElement(value: Element | null): value is HTMLElement {
  return value instanceof HTMLElement;
}

export function mountHomeIntro() {
  const root = document.documentElement;
  const overlay = document.querySelector<HTMLElement>('[data-home-intro-overlay]');
  const canvas = document.querySelector<HTMLCanvasElement>('[data-intro-canvas]');
  const backdrop = document.querySelector<HTMLElement>('[data-intro-backdrop]');
  const visual = document.querySelector<HTMLElement>('[data-intro-visual]');
  const plate = document.querySelector<HTMLElement>('[data-intro-plate]');
  const copy = document.querySelector<HTMLElement>('[data-intro-copy]');
  const skipButton = document.querySelector<HTMLButtonElement>('[data-intro-skip]');
  const siteShell = document.querySelector<HTMLElement>('.site-shell');
  const main = document.querySelector<HTMLElement>('#main-content');
  const replayButton = document.querySelector<HTMLButtonElement>('[data-intro-replay]');

  if (!overlay || !canvas || !backdrop || !visual || !plate || !copy || !skipButton || !siteShell) {
    root.dataset.homeIntro = 'seen';
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileViewport = window.matchMedia('(max-width: 720px), (pointer: coarse)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const pointer = { x: 0, y: 0 };

  let active = false;
  let animationFrame = 0;
  let safetyTimer = 0;
  let staticTimer = 0;
  let runToken = 0;
  let startedAt = 0;
  let timeOffset = 0;
  let scene: HomeIntroScene | undefined;
  let restoreFocus: HTMLElement | null = null;
  let targetRect: DOMRect | undefined;

  const selectTransitionTarget = () => {
    if (window.innerWidth <= 720) {
      return document.querySelector<HTMLElement>('.brand-mark')?.getBoundingClientRect();
    }
    const heroBookplate = replayButton?.getBoundingClientRect();
    if (heroBookplate && heroBookplate.top < window.innerHeight - 12 && heroBookplate.bottom > 12) {
      return heroBookplate;
    }
    return document.querySelector<HTMLElement>('.brand-mark')?.getBoundingClientRect();
  };

  const setPageObscured = (obscured: boolean) => {
    siteShell.inert = obscured;
    if (obscured) siteShell.setAttribute('aria-hidden', 'true');
    else siteShell.removeAttribute('aria-hidden');
  };

  const resetInlinePresentation = () => {
    root.style.removeProperty('--intro-page-reveal');
    plate.style.removeProperty('opacity');
    plate.style.removeProperty('transform');
    copy.style.removeProperty('opacity');
    copy.style.removeProperty('transform');
    backdrop.style.removeProperty('opacity');
    visual.style.removeProperty('opacity');
  };

  const finish = (focusMain = false) => {
    if (!active) return;
    active = false;
    runToken += 1;
    window.cancelAnimationFrame(animationFrame);
    window.clearTimeout(safetyTimer);
    window.clearTimeout(staticTimer);
    scene?.dispose();
    scene = undefined;
    canvas.removeAttribute('data-ready');
    overlay.dataset.active = 'false';
    overlay.dataset.phase = 'complete';
    overlay.dataset.renderer = 'fallback';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.inert = true;
    root.dataset.homeIntro = 'seen';
    setPageObscured(false);
    resetInlinePresentation();

    if (restoreFocus?.isConnected) {
      restoreFocus.focus({ preventScroll: true });
    } else if (focusMain && main) {
      main.tabIndex = -1;
      main.focus({ preventScroll: true });
      main.addEventListener('blur', () => main.removeAttribute('tabindex'), { once: true });
    }
    restoreFocus = null;
  };

  const updateDomPresentation = (progress: number) => {
    const plateProgress = smooth(range(progress, 0.66, 0.75));
    const copyProgress = smooth(range(progress, 0.53, 0.65));
    const exitProgress = smooth(range(progress, 0.72, 1));
    const plateFade = 1 - smooth(range(progress, 0.94, 1));
    const plateWidth = Math.max(plate.offsetWidth, 1);
    const destination = targetRect ?? selectTransitionTarget();
    const destinationX = destination
      ? destination.left + destination.width / 2 - window.innerWidth / 2
      : 0;
    const destinationY = destination
      ? destination.top + destination.height / 2 - window.innerHeight / 2
      : 0;
    const destinationScale = destination ? destination.width / plateWidth : 0.42;
    const scale = lerp(0.82 + plateProgress * 0.18, destinationScale, exitProgress);
    const rotation = lerp(-2.5, 2, exitProgress);

    plate.style.opacity = String(plateProgress * plateFade);
    plate.style.transform = `translate3d(calc(-50% + ${destinationX * exitProgress}px), calc(-50% + ${destinationY * exitProgress}px), 0) scale(${scale}) rotate(${rotation}deg)`;
    copy.style.opacity = String(copyProgress * (1 - smooth(range(exitProgress, 0.08, 0.64))));
    copy.style.transform = `translate3d(-50%, ${lerp(16, 0, copyProgress) - exitProgress * 14}px, 0)`;
    backdrop.style.opacity = String(1 - exitProgress);
    visual.style.opacity = String(1 - smooth(range(exitProgress, 0, 0.78)));
    root.style.setProperty('--intro-page-reveal', String(exitProgress));

    const phase =
      progress < 0.2 ? 'signal' : progress < 0.43 ? 'paper' : progress < 0.72 ? 'stamp' : 'reveal';
    if (overlay.dataset.phase !== phase) overlay.dataset.phase = phase;
  };

  const loadScene = async (token: number) => {
    try {
      const module = await import('./home-intro-scene');
      const loadedScene = await module.createHomeIntroScene(canvas, {
        mobile: mobileViewport.matches,
      });
      if (!active || token !== runToken || performance.now() - startedAt > SCENE_DEADLINE) {
        overlay.dataset.fallbackReason = active ? 'deadline' : 'inactive';
        loadedScene.dispose();
        return;
      }
      delete overlay.dataset.fallbackReason;
      scene = loadedScene;
      scene.render(clamp01((performance.now() - startedAt + timeOffset) / INTRO_DURATION), pointer);
      canvas.dataset.ready = 'true';
      overlay.dataset.renderer = 'webgl';
    } catch (error) {
      overlay.dataset.fallbackReason = 'webgl-error';
      console.warn('Home intro WebGL scene was unavailable; using the SVG fallback.', error);
      overlay.dataset.renderer = 'fallback';
    }
  };

  const play = (replay = false) => {
    if (active) return;
    active = true;
    runToken += 1;
    const token = runToken;
    startedAt = performance.now();
    timeOffset = 0;
    pointer.x = 0;
    pointer.y = 0;
    targetRect = selectTransitionTarget();
    restoreFocus = replay && isHTMLElement(document.activeElement) ? document.activeElement : null;

    resetInlinePresentation();
    overlay.dataset.active = 'true';
    overlay.dataset.phase = reduceMotion.matches ? 'static' : 'signal';
    overlay.dataset.renderer = 'fallback';
    delete overlay.dataset.fallbackReason;
    overlay.setAttribute('aria-hidden', 'false');
    overlay.inert = false;
    root.dataset.homeIntro = 'playing';
    setPageObscured(true);

    safetyTimer = window.setTimeout(() => finish(), 4800);

    if (reduceMotion.matches) {
      overlay.dataset.mode = 'static';
      plate.style.opacity = '1';
      copy.style.opacity = '1';
      staticTimer = window.setTimeout(() => finish(), STATIC_DURATION);
      return;
    }

    overlay.dataset.mode = 'motion';
    void loadScene(token);

    const tick = (now: number) => {
      if (!active || token !== runToken) return;
      const progress = clamp01((now - startedAt + timeOffset) / INTRO_DURATION);
      updateDomPresentation(progress);
      scene?.render(progress, pointer);
      if (progress >= 1) finish();
      else animationFrame = window.requestAnimationFrame(tick);
    };
    animationFrame = window.requestAnimationFrame(tick);
  };

  const accelerate = () => {
    if (!active || reduceMotion.matches) return;
    const elapsed = performance.now() - startedAt + timeOffset;
    const acceleratedPoint = INTRO_DURATION * 0.63;
    if (elapsed < acceleratedPoint) timeOffset += acceleratedPoint - elapsed;
  };

  skipButton.addEventListener('click', (event) => {
    event.stopPropagation();
    finish(true);
  });
  overlay.addEventListener('pointerdown', (event) => {
    if (event.target instanceof HTMLButtonElement) return;
    accelerate();
  });
  overlay.addEventListener('pointermove', (event) => {
    if (!active || !finePointer.matches) return;
    pointer.x = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
    pointer.y = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
  });
  overlay.addEventListener('pointerleave', () => {
    pointer.x = 0;
    pointer.y = 0;
  });
  replayButton?.addEventListener('click', () => play(true));
  document.addEventListener('keydown', (event) => {
    if (!active || event.key !== 'Escape') return;
    event.preventDefault();
    finish(true);
  });
  window.addEventListener('resize', () => {
    targetRect = selectTransitionTarget();
    scene?.resize();
  });

  if (root.dataset.homeIntro === 'pending') play();
}
