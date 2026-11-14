import { PARTICLE_COLOURS } from './particle-palette.js';
import { start as startVisitors } from './rift-visitors.js';

type Teaser = { setActive(value: boolean): void; pullIn(): Promise<void> };
const PAD_Y = 30, TAU = Math.PI * 2;
const PAPER_COLOURS = ['89, 102, 123', '67, 101, 148', '65, 108, 166', '161, 102, 48', '179, 129, 73'];
const INVERTED_COLOURS = [...PARTICLE_COLOURS, ...PAPER_COLOURS].map(colour => colour.split(',').map(channel => 255 - Number(channel)).join(', '));

export function start(button: HTMLButtonElement): Teaser | undefined {
  const canvas = button.querySelector<HTMLCanvasElement>('.frontend-particles');
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return;
  const surface = canvas, paint = context;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const visitors = startVisitors();
  const particles = Array.from({ length: 220 }, (_, index) => ({
    phase: Math.random() * TAU,
    depth: Math.random(),
    lane: Math.random(),
    size: index % 29 === 0 ? 1.05 : .24 + Math.random() * .45,
    colour: index % PARTICLE_COLOURS.length
  }));
  let active = false, visible = true, hovered = false, focused = false, emphasis = 0;
  let width = 0, height = 0, wordWidth = 0, wordHeight = 0, centerX = 0, centerY = 0;
  let frame = 0, previous = 0, time = 0;
  let documentX = 0, documentY = 0, breathing = 0;
  let pull: { startedAt: number; finish(): void } | undefined;

  function measure(): void {
    const rect = button.getBoundingClientRect();
    wordWidth = button.clientWidth; wordHeight = button.clientHeight;
    const left = Math.max(0, Math.min(36, rect.left - 3));
    const right = Math.max(0, Math.min(78, innerWidth - rect.right - 3));
    centerX = left + wordWidth / 2; centerY = PAD_Y + wordHeight / 2;
    documentX = rect.left + wordWidth / 2 + scrollX;
    documentY = rect.top + wordHeight / 2 + scrollY;
    width = wordWidth + left + right; height = wordHeight + PAD_Y * 2;
    surface.style.left = `${-left}px`; surface.style.top = `${-PAD_Y}px`;
    surface.style.width = `${width}px`; surface.style.height = `${height}px`;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    surface.width = Math.round(width * ratio); surface.height = Math.round(height * ratio);
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
    visitors.clear();
    draw();
  }

  function aperture(scale: number): void {
    const breath = reduced.matches ? 0 : .5 + .5 * Math.sin(breathing * .92);
    const ripple = reduced.matches ? 0 : Math.sin(breathing * 1.73) * 1.2 + Math.sin(breathing * 2.63) * .6;
    const x = (wordWidth * .5 + breath * 13) * scale;
    const y = (Math.min(12, wordHeight * .5) + breath * 5) * scale;
    const right = Math.min(wordWidth * (1.04 + breath * .12), width - centerX - 10) * scale;
    paint.beginPath();
    paint.moveTo(centerX - x, centerY + 1);
    paint.bezierCurveTo(centerX - x * .98, centerY - y * .68 + ripple, centerX - x * .47, centerY - y * .81, centerX + x * .02, centerY - y);
    paint.bezierCurveTo(centerX + right * .37, centerY - y * 1.6 - ripple, centerX + right * .6, centerY - y * .86, centerX + right, centerY - y * .92 + ripple);
    paint.bezierCurveTo(centerX + right * .73, centerY - y * .26, centerX + right * .88, centerY + y * .31, centerX + right * .47, centerY + y * .57);
    paint.bezierCurveTo(centerX + x * .69, centerY + y * 1.15, centerX + x * .39, centerY + y * .71, centerX - x * .06, centerY + y * .94);
    paint.bezierCurveTo(centerX - x * .64, centerY + y * .95, centerX - x * .92, centerY + y * .65, centerX - x, centerY + 1);
    paint.closePath();
    paint.fill();
  }

  function disk(front: boolean, collapse: number): void {
    for (const particle of particles) {
      const depth = ((particle.depth - time * .045) % 1 + 1) % 1;
      const angle = particle.phase + time * (.21 + particle.depth * .18) + collapse * 1.8;
      const sine = Math.sin(angle), cosine = Math.cos(angle);
      if ((sine > 0) !== front) continue;
      const radius = (wordWidth * .52 + depth * 38) * (1 - emphasis * .1) * (1 - collapse * .8);
      const x = cosine * radius * (cosine < 0 ? .86 : 1.27);
      const y = sine * (Math.min(11, wordHeight * .53) + depth * 7) - cosine * radius * .17 + (particle.lane - .5) * (1 + depth * 5);
      const px = centerX + x, py = centerY + y * (1 - collapse * .7);
      const edge = Math.max(0, Math.min(1, (width - px) / 12, px / 7));
      const inside = Math.hypot(x / (x > 0 ? Math.min(wordWidth * .85, width - centerX - 9) : wordWidth * .52), (y + x * .11) / (wordHeight * .58)) < 1;
      const alpha = edge * (.25 + (1 - depth) * .5) * Math.min(1, depth * 12, (1 - depth) * 9) * (1 - collapse);
      const colour = INVERTED_COLOURS[particle.colour + (inside ? 0 : PARTICLE_COLOURS.length)];
      if (particle.size > 1) {
        const glow = paint.createRadialGradient(px, py, 0, px, py, 3.2);
        glow.addColorStop(0, `rgba(${colour},${alpha * .5})`);
        glow.addColorStop(1, `rgba(${colour},0)`);
        paint.fillStyle = glow; paint.fillRect(px - 3.2, py - 3.2, 6.4, 6.4);
      }
      paint.fillStyle = `rgba(${colour},${alpha * (1 + emphasis * .3)})`;
      paint.beginPath(); paint.arc(px, py, particle.size, 0, TAU); paint.fill();
    }
  }

  function draw(collapse = 0): void {
    paint.clearRect(0, 0, width, height);
    disk(false, collapse);
    for (let layer = 5; layer > 0; layer--) {
      paint.fillStyle = `rgba(247, 242, 233,${.018 + (6 - layer) * .013})`;
      aperture(1 + layer * .035);
    }
    paint.fillStyle = '#fff';
    aperture(1);
    disk(true, collapse);
  }

  function finishPull(): void {
    const current = pull;
    pull = undefined;
    current?.finish();
  }

  function tick(now: number): void {
    const dt = Math.max(0, Math.min(.05, (now - previous) / 1000));
    const target = hovered || focused ? 1 : 0;
    emphasis += (target - emphasis) * (1 - Math.exp(-dt * 5));
    time += dt * (1 + emphasis * 1.4);
    breathing += dt;
    visitors.tick(now, documentX - scrollX, documentY - scrollY);
    if (pull) {
      const progress = Math.max(0, Math.min(1, (now - pull.startedAt) / 320));
      draw(progress * progress);
      if (progress === 1) {
        frame = 0;
        finishPull();
        return;
      }
    } else draw();
    previous = now;
    frame = requestAnimationFrame(tick);
  }

  function sync(): void {
    const running = active && visible && !document.hidden && !reduced.matches;
    visitors.setActive(running && fine.matches && !pull);
    if (!running) {
      cancelAnimationFrame(frame);
      frame = 0;
      finishPull();
      emphasis = 0;
      if (active && width && visible) draw();
    } else if (!frame) {
      previous = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  button.addEventListener('pointerenter', event => { hovered = fine.matches && event.pointerType === 'mouse'; });
  button.addEventListener('pointerleave', () => { hovered = false; });
  button.addEventListener('focus', () => { focused = button.matches(':focus-visible'); });
  button.addEventListener('blur', () => { focused = false; });
  fine.addEventListener('change', () => { hovered = false; sync(); });
  const resize = new ResizeObserver(() => { if (active) measure(); });
  resize.observe(button);
  const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { rootMargin: '40px' });
  visibility.observe(button);
  addEventListener('resize', () => { if (active) measure(); }, { passive: true });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  button.classList.add('has-aperture');
  return {
    setActive(value: boolean): void {
      active = value;
      if (active) measure();
      sync();
    },
    async pullIn(): Promise<void> {
      if (!frame) return;
      visitors.setActive(false);
      await new Promise<void>(finish => { pull = { startedAt: performance.now(), finish }; });
    }
  };
}
