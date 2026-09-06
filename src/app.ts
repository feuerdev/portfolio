type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void>; finished: Promise<void> };
};
const root = document.documentElement;
const control = document.querySelector<HTMLElement>('.mode-control');
const toggle = document.querySelector<HTMLButtonElement>('#mode-toggle');
const label = document.querySelector<HTMLElement>('#mode-label');
const mobileLabel = document.querySelector<HTMLElement>('#mode-label-mobile');
const status = document.querySelector<HTMLElement>('#mode-status');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let styleReady: Promise<void> | undefined;
let cleanup: (() => void) | undefined;
let busy = false;
let needsReload = false;

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
      toggle!.title = fancy ? 'Switch to plain HTML' : 'Switch to fancy mode';
      label!.textContent = fancy ? 'Back to plain HTML' : "Didn't this guy say he's a frontend dev?";
      if (mobileLabel) mobileLabel.textContent = fancy ? 'Plain HTML' : 'Fancy mode';
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
      const button = toggle.getBoundingClientRect();
      const x = button.left + button.width / 2;
      const y = button.top + button.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const transition = transitionDocument.startViewTransition(update);
      await transition.ready.then(() => {
        root.animate([
          { clipPath: `circle(0px at ${x}px ${y}px)` },
          { clipPath: `circle(${radius}px at ${x}px ${y}px)` }
        ], { duration: 850, easing: 'cubic-bezier(.65,0,.25,1)', pseudoElement: '::view-transition-new(root)' });
      }).catch(() => undefined);
      await transition.finished.catch(() => undefined);
    } else update();
    status.textContent = fancy ? 'Fancy mode on.' : 'Plain HTML mode on.';
  } catch {
    // Failed decorative downloads must not prevent reading the document.
    // Browsers retain failed module imports for this document. A fresh page can recover.
    needsReload = true;
    label.textContent = 'Reload to try fancy mode';
    if (mobileLabel) mobileLabel.textContent = 'Reload page';
    toggle.title = 'Reload to try fancy mode';
    status.textContent = 'Fancy mode could not load. Reconnect, then reload using this button.';
  } finally {
    busy = false;
    toggle.disabled = false;
    if (animate) toggle.focus({ preventScroll: true });
  }
}

if (control && toggle) {
  control.hidden = false;
  toggle.addEventListener('click', () => {
    if (needsReload) {
      const url = new URL(location.href);
      url.searchParams.set('mode', 'fancy');
      history.replaceState(history.state, '', url);
      location.reload();
    } else void setMode(!root.classList.contains('fancy'));
  });
  addEventListener('popstate', () => {
    const fancy = new URL(location.href).searchParams.get('mode') === 'fancy';
    if (fancy !== root.classList.contains('fancy')) void setMode(fancy, false, false);
  });
  if (new URL(location.href).searchParams.get('mode') === 'fancy') void setMode(true, false, false);
}
