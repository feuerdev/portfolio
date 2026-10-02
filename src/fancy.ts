// Fetched only after the visitor opts into fancy mode.
import { clamp, createSpace } from './space.js';
import type { Shot } from './space.js';

const INTRO = 2.4, OPENING_DISTANCE = 3.1, READING_DISTANCE = 1.55;
const ease = (t: number) => { const x = clamp(t); return x * x * (3 - 2 * x); };

export function start(): { resumeMotion: () => void; cleanup: () => void } {
  const root = document.documentElement;
  const canvas = document.querySelector<HTMLCanvasElement>('#curiosity');
  const button = document.querySelector<HTMLButtonElement>('.motion-button');
  const hero = document.querySelector<HTMLElement>('.hero');
  const firstProject = document.querySelector<HTMLElement>('.project');
  const contents = [...document.querySelectorAll<HTMLElement>('.contents a')];
  const context = canvas?.getContext('2d');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const space = createSpace(clamp(innerWidth * innerHeight / (1440 * 900), .45, 1));
  let paused = false, frame = 0, scrollFrame = 0, previous = 0, phase = 0;
  let width = 0, height = 0, overviewX = .5, overviewY = .5, readingX = .5, readingY = .5, readingSunOpacity = 1;
  let exit = 0, zoom = 0, settleAt = 1, lastScroll = scrollY, turn = 0, yaw = 0, drift = 0, highlighted = -1;
  let ready = false, disposed = false, intro = motion.matches ? INTRO : 0;
  let pointerX = 0, pointerY = 0, rotationX = 0, rotationY = 0;
  document.querySelectorAll<HTMLTemplateElement>('.fancy-only template').forEach(template => {
    template.replaceWith(template.content.cloneNode(true));
  });

  function camera(): Shot {
    const progress = ease(zoom);
    // A low sideways orbit keeps the stream in view; reading drift stays small.
    let shot = space.overview(OPENING_DISTANCE * (READING_DISTANCE / OPENING_DISTANCE) ** progress,
      yaw + progress * (1.1 + Math.sin(drift * .8) * .05),
      overviewX + (readingX - overviewX) * progress, overviewY + (readingY - overviewY) * progress,
      .3 + progress * (-.18 + Math.sin(drift) * .025));
    shot = space.nudge(shot, rotationX, rotationY);
    const pull = 1 + (1 - ease(intro / INTRO)) * .8;
    return { ...shot, position: shot.target.map((value, i) => value + (shot.position[i] - value) * pull) as Shot['position'] };
  }
  function draw(): void {
    if (!context || !width) return;
    space.render(context, width, height, phase, turn, camera(), highlighted, intro / INTRO,
      1 + (readingSunOpacity - 1) * ease(zoom));
    if (canvas) canvas.style.opacity = String(ease(intro / .8));
  }
  function running(): boolean { return ready && !disposed && Boolean(context) && !paused && !motion.matches && !document.hidden; }
  function tick(time: number): void {
    if (!running()) { frame = 0; return; }
    const elapsed = Math.min(time - previous, 64) / 1000;
    phase += elapsed;
    // The stream always rotates; the reading camera only drifts while scrolling.
    turn += elapsed * .03;
    if (zoom === 0) yaw += elapsed * .015;
    intro = Math.min(INTRO, intro + elapsed);
    previous = time;
    rotationX += (pointerX - rotationX) * .05;
    rotationY += (pointerY - rotationY) * .05;
    draw();
    frame = requestAnimationFrame(tick);
  }
  function scrolled(): void {
    scrollFrame = 0;
    if (motion.matches || !hero) { lastScroll = scrollY; return; }
    exit = clamp(scrollY / (hero.offsetHeight * .85));
    zoom = clamp(scrollY / settleAt);
    if (ready && !paused) {
      const delta = Math.max(0, scrollY - settleAt) - Math.max(0, lastScroll - settleAt);
      turn += delta * .0002;
      drift += delta / height * .7;
    }
    lastScroll = scrollY;
    root.style.setProperty('--hero-exit', exit.toFixed(3));
    if (!running()) draw();
  }
  function onScroll(): void { if (!scrollFrame) scrollFrame = requestAnimationFrame(scrolled); }
  function sync(): void {
    if (motion.matches) { intro = INTRO; exit = zoom = 0; lastScroll = scrollY; root.style.removeProperty('--hero-exit'); } else scrolled();
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
    const card = firstProject?.getBoundingClientRect();
    settleAt = Math.max(1, scrollY + (card?.top ?? height) + (card?.height ?? 0) / 2 - height / 2);
    const sunRadius = .2 * Math.min(width, height) * 1.15 / READING_DISTANCE;
    const beside = width - (card?.right ?? width) > sunRadius * 2 + 64;
    readingX = beside ? ((card?.right ?? 0) + width) / (2 * width) : 1 + sunRadius * .3 / width;
    readingY = beside ? .5 : .35;
    readingSunOpacity = beside ? 1 : .25;
    const density = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    context.setTransform(density, 0, 0, density, 0, 0);
    scrolled();
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
