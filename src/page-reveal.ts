// A short-lived, inert copy of the old view avoids native snapshot cancellation
// when mobile browser controls change the viewport during a mode switch.
type SnapshotSheet = CSSStyleSheet & { replaceSync: (source: string) => void };
type SnapshotRoot = ShadowRoot & { adoptedStyleSheets: CSSStyleSheet[] };
const cachedSheets = new Map<string, SnapshotSheet>();

export async function reveal(update: () => void, startMotion: () => void, x: number, y: number): Promise<void> {
  const root = document.documentElement;
  const oldBody = document.body;
  const copy = oldBody.cloneNode(true) as HTMLBodyElement;
  const host = document.createElement('div');
  host.className = 'page-reveal'; host.setAttribute('aria-hidden', 'true'); host.setAttribute('inert', '');
  const height = Math.max(innerHeight, screen.height), width = innerWidth;
  host.style.height = `${height}px`;
  host.style.background = root.classList.contains('fancy') ? getComputedStyle(root).backgroundColor : '#fff';
  const shadow = host.attachShadow({ mode: 'open' }) as SnapshotRoot;
  const content = document.createElement('div');
  content.className = root.className;
  content.style.position = 'absolute';
  content.style.top = `${-scrollY}px`; content.style.left = `${-scrollX}px`;
  content.style.width = `${root.clientWidth}px`;
  const bodyStyle = getComputedStyle(oldBody), rootStyle = getComputedStyle(root);
  content.style.font = bodyStyle.font; content.style.color = bodyStyle.color;
  content.style.setProperty('-webkit-font-smoothing', rootStyle.getPropertyValue('-webkit-font-smoothing'));
  content.style.setProperty('color-scheme', rootStyle.getPropertyValue('color-scheme'));
  for (const property of ['--space', '--ink', '--body', '--muted', '--line', '--link', '--accent', '--card', '--surface', '--gutter']) {
    content.style.setProperty(property, rootStyle.getPropertyValue(property));
  }
  content.append(copy); shadow.append(content);
  // Reuse loaded CSS without another request. Shadow DOM keeps the plain copy
  // out of the live page's fancy selectors while the underlying page changes.
  if ('adoptedStyleSheets' in shadow && 'replaceSync' in CSSStyleSheet.prototype) {
    const rootSize = rootStyle.fontSize;
    let cachedSheet = cachedSheets.get(rootSize);
    if (!cachedSheet) {
      cachedSheet = new CSSStyleSheet() as SnapshotSheet;
      const source = [...document.styleSheets].filter(sheet => sheet.href && /\/css\/(style|fancy)\.css(?:\?|$)/.test(sheet.href))
        .map(sheet => [...sheet.cssRules].map(rule => rule.cssText).join('\n')).join('\n');
      // Shadow DOM isolates selectors, but rem still follows the live root.
      // Freeze those units so changing mode cannot resize the old view's text.
      cachedSheet.replaceSync(source.replace(/(-?\d*\.?\d+)rem\b/g, (_, size) => `${Number(size) * parseFloat(rootSize)}px`));
      cachedSheets.set(rootSize, cachedSheet);
    }
    shadow.adoptedStyleSheets = [cachedSheet];
  } else {
    await Promise.all(['style', 'fancy'].map(name => new Promise<void>((resolve, reject) => {
      const link = document.createElement('link'); link.rel = 'stylesheet';
      link.href = new URL(`../css/${name}.css`, import.meta.url).href;
      link.onload = () => resolve(); link.onerror = () => reject(new Error('Reveal copy styles could not load.'));
      shadow.append(link);
    })));
  }
  const originalCanvases = [...oldBody.querySelectorAll<HTMLCanvasElement>('canvas')];
  const copiedCanvases = [...copy.querySelectorAll<HTMLCanvasElement>('canvas')];
  originalCanvases.forEach((canvas, index) => {
    if (canvas.clientWidth && canvas.clientHeight) copiedCanvases[index]?.getContext('2d')?.drawImage(canvas, 0, 0);
  });
  for (const selector of ['#name', '#name > span:first-child', '#name > span:last-child']) {
    const original = oldBody.querySelector<HTMLElement>(selector), captured = copy.querySelector<HTMLElement>(selector);
    if (original && captured) {
      const style = getComputedStyle(original);
      captured.style.transform = style.transform; captured.style.opacity = style.opacity;
    }
  }
  const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) + 4;
  const cutout = (r: number) => `radial-gradient(circle at ${x}px ${y}px, transparent ${r}px, #000 ${r + .75}px)`;
  const paint = (r: number) => { host.style.setProperty('mask-image', cutout(r)); };
  paint(0);
  oldBody.append(host);
  try {
    // Give the old view a painted frame before changing the live document.
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    update(); startMotion();
    // Avoid animated compound clip paths. Only this short-lived layer's mask
    // changes; no inherited root properties or permanent animation work.
    await new Promise<void>(resolve => {
      let startedAt: number | undefined;
      const frame = (now: number) => {
        if (startedAt === undefined) startedAt = now;
        const progress = Math.min(1, (now - startedAt) / 850);
        const eased = progress * progress * (3 - 2 * progress);
        paint(radius * eased);
        if (progress < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
  } finally { host.remove(); }
}
