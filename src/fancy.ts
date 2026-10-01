// Fetched only after the visitor opts into fancy mode.
import { blend, clamp, createSpace } from './space.js';
import type { Shot } from './space.js';

const INTRO = 2.4;
const ease = (t: number) => { const x = clamp(t); return x * x * (3 - 2 * x); };

export function start(): { resumeMotion: () => void; cleanup: () => void } {
  const root = document.documentElement;
  const canvas = document.querySelector<HTMLCanvasElement>('#curiosity');
  const button = document.querySelector<HTMLButtonElement>('.motion-button');
  const hero = document.querySelector<HTMLElement>('.hero');
  const projects = [...document.querySelectorAll<HTMLElement>('.project')];
  const contents = [...document.querySelectorAll<HTMLElement>('.contents a')];
  const context = canvas?.getContext('2d');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const space = createSpace(clamp(innerWidth * innerHeight / (1440 * 900), .45, 1));
  let paused = false, frame = 0, scrollFrame = 0, previous = 0, phase = 0;
  let width = 0, height = 0, overviewX = .5, overviewY = .5, tourX = .5, tourY = .5, exit = 0, highlighted = -1;
  let ready = false, disposed = false, intro = motion.matches ? INTRO : 0;
  let pointerX = 0, pointerY = 0, rotationX = 0, rotationY = 0;
  document.querySelectorAll<HTMLTemplateElement>('.fancy-only template').forEach(template => {
    template.replaceWith(template.content.cloneNode(true));
  });

  function camera(): Shot {
    const places = space.positions(phase), heroEnd = (hero?.offsetHeight ?? innerHeight) * .85;
    const overview = (amount: number) => space.overview(amount, phase * .015, overviewX, overviewY - Math.min(amount * heroEnd / innerHeight, .3));
    const visit = (index: number) => space.visit(index, places, tourX, tourY);
    let shot = overview(exit);
    if (exit >= .25 && !motion.matches) {
      const offsets = projects.map(item => { const box = item.getBoundingClientRect(); return box.top + box.height / 2 - innerHeight / 2; });
      if (offsets[0] > 0) {
        shot = blend(overview(exit), visit(0), ease((scrollY - heroEnd * .25) / (scrollY + offsets[0] - heroEnd * .25)));
      } else {
        let index = 0;
        while (index < offsets.length - 1 && offsets[index + 1] <= 0) index++;
        shot = index === offsets.length - 1 ? visit(index)
          : blend(visit(index), visit(index + 1), ease(-offsets[index] / (offsets[index + 1] - offsets[index]) * 1.6 - .3));
      }
    }
    shot = space.nudge(shot, rotationX, rotationY);
    const pull = 1 + (1 - ease(intro / INTRO)) * .8;
    return { ...shot, position: shot.target.map((value, i) => value + (shot.position[i] - value) * pull) as Shot['position'] };
  }
  function draw(): void {
    if (!context || !width) return;
    space.render(context, width, height, phase, camera(), highlighted, intro / INTRO);
    if (canvas) canvas.style.opacity = String(ease(intro / .8));
  }
  function running(): boolean { return ready && !disposed && Boolean(context) && !paused && !motion.matches && !document.hidden; }
  function tick(time: number): void {
    if (!running()) { frame = 0; return; }
    const elapsed = Math.min(time - previous, 64) / 1000;
    phase += elapsed;
    intro = Math.min(INTRO, intro + elapsed);
    previous = time;
    rotationX += (pointerX - rotationX) * .05;
    rotationY += (pointerY - rotationY) * .05;
    draw();
    frame = requestAnimationFrame(tick);
  }
  function scrolled(): void {
    scrollFrame = 0;
    if (motion.matches || !hero) return;
    exit = clamp(scrollY / (hero.offsetHeight * .85));
    root.style.setProperty('--hero-exit', exit.toFixed(3));
    if (!running()) draw();
  }
  function onScroll(): void { if (!scrollFrame) scrollFrame = requestAnimationFrame(scrolled); }
  function sync(): void {
    if (motion.matches) { intro = INTRO; exit = 0; root.style.removeProperty('--hero-exit'); } else scrolled();
    root.dataset.motion = !paused && !motion.matches ? 'on' : 'off';
    if (button) { button.hidden = motion.matches || !context; button.title = paused ? 'Play motion' : 'Pause motion'; button.setAttribute('aria-pressed', String(paused)); }
    if (!running()) { cancelAnimationFrame(frame); frame = 0; draw(); }
    else if (!frame) { previous = performance.now(); frame = requestAnimationFrame(tick); }
  }
  function resize(): void {
    if (!canvas || !context) return;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const style = getComputedStyle(canvas);
    const read = (name: string, fallback: number) => parseFloat(style.getPropertyValue(name)) || fallback;
    overviewX = read('--orb-x', .5); overviewY = read('--orb-y', .5);
    tourX = read('--tour-x', .5); tourY = read('--tour-y', .5);
    const density = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    context.setTransform(density, 0, 0, density, 0, 0);
    draw();
  }
  function pointer(event: PointerEvent): void {
    if (!running() || event.pointerType !== 'mouse') return;
    pointerX = (event.clientX / innerWidth - .5) * 1.2;
    pointerY = (event.clientY / innerHeight - .5) * .8;
  }
  function highlight(event: Event): void {
    highlighted = event.type === 'pointerenter' || event.type === 'focus' ? contents.indexOf(event.currentTarget as HTMLElement) : -1;
    if (!running()) draw();
  }
  function toggleMotion(): void { paused = !paused; sync(); }
  const dimensions = new ResizeObserver(resize);
  if (canvas) dimensions.observe(canvas);
  addEventListener('pointermove', pointer, { passive: true });
  addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  button?.addEventListener('click', toggleMotion);
  for (const link of contents) for (const type of ['pointerenter', 'pointerleave', 'focus', 'blur']) link.addEventListener(type, highlight);
  resize();
  sync();
  function cleanup(): void {
    disposed = true;
    cancelAnimationFrame(frame); cancelAnimationFrame(scrollFrame);
    dimensions.disconnect();
    removeEventListener('pointermove', pointer); removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', sync);
    motion.removeEventListener('change', sync);
    button?.removeEventListener('click', toggleMotion);
    for (const link of contents) for (const type of ['pointerenter', 'pointerleave', 'focus', 'blur']) link.removeEventListener(type, highlight);
    root.style.removeProperty('--hero-exit');
    canvas?.style.removeProperty('opacity');
    delete root.dataset.motion;
    if (button) { button.hidden = true; button.setAttribute('aria-pressed', 'false'); }
  }
  return {
    resumeMotion: () => { if (!disposed) { ready = true; sync(); } },
    cleanup
  };
}
