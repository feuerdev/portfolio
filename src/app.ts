type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};
const root = document.documentElement;
const control = document.querySelector<HTMLElement>('.mode-control');
const toggle = document.querySelector<HTMLButtonElement>('#mode-toggle');
const label = document.querySelector<HTMLElement>('#mode-label');
const status = document.querySelector<HTMLElement>('#mode-status');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let styleReady: Promise<void> | undefined;
let cleanup: (() => void) | undefined;
let busy = false;

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

async function setMode(fancy: boolean, updateURL = true, animate = true): Promise<void> {
  if (busy || !toggle || !label || !status) return;
  busy = true;
  toggle.disabled = true;
  try {
    let enhancement: typeof import('./fancy.js') | undefined;
    if (fancy) {
      const loaded = await Promise.all([loadStyles(), import('./fancy.js')]);
      enhancement = loaded[1];
    }
    const linkedAnchor = !updateURL && location.hash ? document.getElementById(location.hash.slice(1)) : null;
    const anchor = linkedAnchor ?? [...document.querySelectorAll<HTMLElement>('main section[id], main article[id]')]
      .reverse().find(section => section.getBoundingClientRect().top <= 24);
    const atTop = scrollY < 100 && !linkedAnchor;
    const update = () => {
      cleanup?.();
      cleanup = undefined;
      root.classList.toggle('fancy', fancy);
      toggle!.setAttribute('aria-pressed', String(fancy));
      label!.textContent = fancy ? 'Back to plain HTML' : 'Fancy mode?';
      if (fancy && enhancement) cleanup = enhancement.start();
      if (updateURL) {
        const url = new URL(location.href);
        if (fancy) url.searchParams.set('mode', 'fancy');
        else url.searchParams.delete('mode');
        history.replaceState(history.state, '', url);
      }
      if (atTop) scrollTo({ top: 0, behavior: 'auto' });
      else anchor?.scrollIntoView({ block: 'start', behavior: 'auto' });
    };
    const transitionDocument = document as TransitionDocument;
    if (animate && !reducedMotion.matches && transitionDocument.startViewTransition) {
      await transitionDocument.startViewTransition(update).finished.catch(() => undefined);
    } else update();
    status.textContent = fancy ? 'Fancy mode on.' : 'Plain HTML mode on.';
  } catch {
    // Failed decorative downloads must not prevent reading the document.
    label.textContent = 'Try fancy mode again';
    status.textContent = 'Fancy mode could not load. Please try again when connected.';
  } finally {
    busy = false;
    toggle.disabled = false;
    if (animate) toggle.focus({ preventScroll: true });
  }
}

if (control && toggle) {
  control.hidden = false;
  toggle.addEventListener('click', () => void setMode(!root.classList.contains('fancy')));
  addEventListener('popstate', () => {
    const fancy = new URL(location.href).searchParams.get('mode') === 'fancy';
    if (fancy !== root.classList.contains('fancy')) void setMode(fancy, false, false);
  });
  if (new URL(location.href).searchParams.get('mode') === 'fancy') void setMode(true, false, false);
}
