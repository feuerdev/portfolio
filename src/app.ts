import { start as startFrontendTeaser } from './frontend-teaser.js';

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void>; finished: Promise<void> };
};
const root = document.documentElement;
const inlineControl = document.querySelector<HTMLElement>('.frontend-control');
const controls = document.querySelector<HTMLElement>('.mode-control');
const toggle = document.querySelector<HTMLButtonElement>('#mode-toggle');
const back = document.querySelector<HTMLButtonElement>('#plain-toggle');
const fallback = document.querySelector<HTMLElement>('.frontend-fallback');
const status = document.querySelector<HTMLElement>('#mode-status');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const initialURL = new URL(location.href);
// Presentation belongs to this page visit, never to its shareable URL.
if (initialURL.searchParams.has('mode')) {
  initialURL.searchParams.delete('mode');
  history.replaceState(history.state, '', initialURL);
}
let styleReady: Promise<void> | undefined;
let cleanup: (() => void) | undefined;
let busy = false;
let needsReload = false;
let pendingMode: boolean | undefined;
let teaser: ReturnType<typeof startFrontendTeaser> | undefined;

function loadStyles(): Promise<void> {
  if (!styleReady) {
    styleReady = new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = new URL('../css/fancy.css', import.meta.url).href;
      link.onload = () => resolve();
      link.onerror = () => {
        link.remove();
        styleReady = undefined;
        reject(new Error('The fancy stylesheet could not be loaded.'));
      };
      document.head.append(link);
    });
  }
  return styleReady;
}

async function setMode(fancy: boolean, animate = true): Promise<void> {
  if (!toggle || !back || !inlineControl || !controls || !status) return;
  if (busy) { pendingMode = fancy; return; }
  busy = true;
  toggle.disabled = back.disabled = true;
  teaser?.setActive(false);
  try {
    let enhancement: typeof import('./fancy.js') | undefined;
    let artwork: ReturnType<typeof import('./fancy.js').start> | undefined;
    let motionStarted = false;
    const resumeArtwork = () => {
      if (!motionStarted && pendingMode === undefined && artwork) {
        motionStarted = true; artwork.resumeMotion();
      }
    };
    if (fancy) {
      const loaded = await Promise.all([loadStyles(), import('./fancy.js')]);
      enhancement = loaded[1];
      // Request both faces before capturing the new view, avoiding a mid-reveal font swap.
      // A failed font download can still use the stylesheet's sans-serif fallback.
      await Promise.allSettled([400, 500].map(weight => document.fonts.load(`${weight} 18px "Plex Sans"`)));
    }
    const anchor = [...document.querySelectorAll<HTMLElement>('main section[id], main article[id]')]
      .reverse().find(section => section.getBoundingClientRect().top <= 24);
    const atTop = scrollY < 100;
    const update = () => {
      if (pendingMode !== undefined) return;
      cleanup?.();
      cleanup = undefined;
      root.classList.toggle('fancy', fancy);
      inlineControl!.hidden = fancy;
      controls!.hidden = !fancy;
      if (fallback) fallback.hidden = !fancy;
      if (fancy && enhancement) {
        // Formation starts with the wipe and continues after the page is revealed.
        artwork = enhancement.start();
        cleanup = artwork.cleanup;
      }
      // Position mode switches and direct links immediately, even when CSS smooths anchors.
      if (atTop) scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      else anchor?.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
    };
    const transitionDocument = document as TransitionDocument;
    const mobileReveal = innerWidth <= 700 || matchMedia('(pointer: coarse)').matches;
    if (animate && !reducedMotion.matches && mobileReveal) {
      const localReveal = await import('./page-reveal.js');
      const button = (fancy ? toggle : back).getBoundingClientRect();
      root.dataset.revealResult = 'running'; delete root.dataset.revealReason;
      await localReveal.reveal(update, resumeArtwork, button.left + button.width / 2, button.top + button.height / 2);
      root.dataset.revealResult = 'finished';
    } else if (animate && !reducedMotion.matches && transitionDocument.startViewTransition) {
      const button = (fancy ? toggle : back).getBoundingClientRect();
      const x = button.left + button.width / 2;
      const y = button.top + button.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.style.setProperty('--mode-reveal-x', `${x}px`);
      root.style.setProperty('--mode-reveal-y', `${y}px`);
      root.style.setProperty('--mode-reveal-radius', `${radius}px`);
      root.dataset.modeTransition = '';
      root.dataset.revealResult = 'starting';
      delete root.dataset.revealReason;
      const transition = transitionDocument.startViewTransition(update);
      await transition.ready.then(() => {
        // CSS creates the wipe with the snapshot; the live canvas forms alongside it.
        root.dataset.revealResult = 'running';
        resumeArtwork();
      }).catch(error => {
        root.dataset.revealResult = 'skipped';
        root.dataset.revealReason = error instanceof Error ? error.message : String(error);
        console.warn('Portfolio reveal animation was skipped.', error);
      });
      await transition.finished.catch(error => console.warn('Portfolio view transition did not finish normally.', error));
      if (root.dataset.revealResult === 'running') root.dataset.revealResult = 'finished';
    } else {
      root.dataset.revealResult = !animate ? 'not-requested' : reducedMotion.matches ? 'reduced-motion' : 'unsupported';
      delete root.dataset.revealReason;
      update();
    }
    // Also start motion when the transition is unavailable or skipped.
    resumeArtwork();
    status.textContent = fancy ? 'Fancy mode on.' : 'Plain HTML mode on.';
  } catch (error) {
    root.dataset.revealResult = 'failed';
    root.dataset.revealReason = error instanceof Error ? error.message : String(error);
    // Failed decorative downloads must not prevent reading the document.
    // Browsers retain failed module imports for this document. A fresh page can recover.
    needsReload = true;
    toggle.title = 'Reload to try fancy mode';
    toggle.setAttribute('aria-label', 'Frontend — reload to try fancy mode');
    status.textContent = 'Fancy mode could not load. Reconnect, then reload using this button.';
  } finally {
    delete root.dataset.modeTransition;
    for (const property of ['--mode-reveal-x', '--mode-reveal-y', '--mode-reveal-radius']) root.style.removeProperty(property);
    busy = false;
    toggle.disabled = back.disabled = false;
    teaser?.setActive(!root.classList.contains('fancy'));
    if (pendingMode !== undefined) {
      const nextMode = pendingMode;
      pendingMode = undefined;
      void setMode(nextMode, false);
    } else if (animate && document.activeElement === document.body) {
      (root.classList.contains('fancy') ? back : toggle).focus({ preventScroll: true });
    }
  }
}

if (inlineControl && controls && toggle && back) {
  inlineControl.hidden = false;
  if (fallback) fallback.hidden = true;
  teaser = startFrontendTeaser(toggle);
  teaser.setActive(true);
  toggle.addEventListener('click', () => {
    if (needsReload) {
      location.reload();
    } else void setMode(true);
  });
  back.addEventListener('click', () => { void setMode(false); });
}
