import { PARTICLE_COLOURS } from './particle-palette.js';

type Teaser = { setActive(value: boolean): void; pullIn(): Promise<void> };
const PAD_Y = 34, PAD_LEFT = 56, PAD_RIGHT = 110, TAU = Math.PI * 2;
const REACH = 200, LEAN = 9, GROWTH = .3, PARALLAX = 2;
const RIM = '80, 153, 207';
const STAR_COLOURS = PARTICLE_COLOURS.map(colour => colour.split(',').map(channel => 255 - Number(channel)).join(', '));
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

export function start(button: HTMLButtonElement): Teaser | undefined {
  const canvas = button.querySelector<HTMLCanvasElement>('.frontend-particles');
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return;
  const surface = canvas, paint = context;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const stars = Array.from({ length: 90 }, (_, index) => ({
    angle: Math.random() * TAU,
    distance: Math.sqrt(Math.random()) * 1.05,
    depth: Math.random(),
    size: index % 17 === 0 ? 1 : .25 + Math.random() * .5,
    alpha: .35 + Math.random() * .55,
    colour: index % STAR_COLOURS.length
  }));
  let active = false, visible = true, hovered = false, focused = false, emphasis = 0;
  let width = 0, height = 0, wordWidth = 0, wordHeight = 0, centerX = 0, centerY = 0;
  let frame = 0, previous = 0, time = 0, breathing = 0;
  let documentX = 0, documentY = 0;
  let pointer: { x: number; y: number } | undefined;
  let tidal = 0, leanX = 0, leanY = 0, lookX = 0, lookY = 0;
  let pull: { startedAt: number; finish(): void } | undefined;

  function measure(): void {
    const rect = button.getBoundingClientRect();
    wordWidth = button.clientWidth; wordHeight = button.clientHeight;
    const left = Math.max(0, Math.min(PAD_LEFT, rect.left - 3));
    const right = Math.max(0, Math.min(PAD_RIGHT, innerWidth - rect.right - 3));
    centerX = left + wordWidth / 2; centerY = PAD_Y + wordHeight / 2;
    documentX = rect.left + wordWidth / 2 + scrollX;
    documentY = rect.top + wordHeight / 2 + scrollY;
    width = wordWidth + left + right; height = wordHeight + PAD_Y * 2;
    surface.style.left = `${-left}px`; surface.style.top = `${-PAD_Y}px`;
    surface.style.width = `${width}px`; surface.style.height = `${height}px`;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    surface.width = Math.round(width * ratio); surface.height = Math.round(height * ratio);
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function opening(): { left: number; right: number; top: number } {
    const depth = 1 + tidal * .6;
    const breath = reduced.matches ? 0 : (.5 + .5 * Math.sin(breathing * .92)) * depth;
    const grow = 1 + tidal * GROWTH + emphasis * .06;
    return {
      left: Math.min((wordWidth * .5 + 6 + breath * 13) * grow, centerX - 12),
      right: Math.min(wordWidth * (1.08 + breath * .12) * grow, width - centerX - 12),
      top: (Math.min(14, wordHeight * .6) + breath * 5) * grow
    };
  }

  function aperture(): void {
    const { left: x, right, top: y } = opening();
    const depth = 1 + tidal * .6;
    const ripple = reduced.matches ? 0 : (Math.sin(breathing * 1.73) * 1.2 + Math.sin(breathing * 2.63) * .6) * depth;
    const at = (px: number, py: number): [number, number] => {
      const toward = (px * leanX + py * leanY) / (Math.hypot(px, py) || 1);
      const stretch = tidal * LEAN * Math.max(0, toward) ** 2;
      return [centerX + px + leanX * stretch, centerY + py + leanY * stretch];
    };
    paint.beginPath();
    paint.moveTo(...at(-x, 1));
    paint.bezierCurveTo(...at(-x * .98, -y * .68 + ripple), ...at(-x * .47, -y * .81), ...at(x * .02, -y));
    paint.bezierCurveTo(...at(right * .37, -y * 1.6 - ripple), ...at(right * .6, -y * .86), ...at(right, -y * .92 + ripple));
    paint.bezierCurveTo(...at(right * .73, -y * .26), ...at(right * .88, y * .31), ...at(right * .47, y * .57));
    paint.bezierCurveTo(...at(x * .69, y * 1.15), ...at(x * .39, y * .71), ...at(-x * .06, y * .94));
    paint.bezierCurveTo(...at(-x * .64, y * .95), ...at(-x * .92, y * .65), ...at(-x, 1));
    paint.closePath();
  }

  function interior(collapse: number): void {
    const { left, right, top } = opening();
    for (const star of stars) {
      const angle = star.angle + time * (.04 + (1.05 - star.distance) * .1) + collapse * 2.4;
      const distance = star.distance * (1 - collapse * .9);
      const cosine = Math.cos(angle);
      const px = centerX + cosine * distance * (cosine < 0 ? left : right) - lookX * PARALLAX * (.3 + star.depth * .7);
      const py = centerY + Math.sin(angle) * distance * top - lookY * PARALLAX * (.3 + star.depth * .7);
      const alpha = star.alpha * (1 - collapse * .5);
      const colour = STAR_COLOURS[star.colour];
      if (star.size === 1) {
        const glow = paint.createRadialGradient(px, py, 0, px, py, 2.6);
        glow.addColorStop(0, `rgba(${colour},${alpha * .45})`);
        glow.addColorStop(1, `rgba(${colour},0)`);
        paint.fillStyle = glow; paint.fillRect(px - 2.6, py - 2.6, 5.2, 5.2);
      }
      paint.fillStyle = `rgba(${colour},${alpha})`;
      paint.beginPath(); paint.arc(px, py, star.size, 0, TAU); paint.fill();
    }
  }

  function draw(collapse = 0): void {
    paint.clearRect(0, 0, width, height);
    aperture();
    paint.fillStyle = '#fff';
    paint.fill();
    paint.save();
    paint.clip();
    interior(collapse);
    paint.restore();
    aperture();
    paint.lineJoin = 'round';
    paint.strokeStyle = `rgba(${RIM},.22)`;
    paint.lineWidth = 4;
    paint.stroke();
    paint.strokeStyle = `rgba(${RIM},.9)`;
    paint.lineWidth = 1.2;
    paint.stroke();
  }

  function finishPull(): void {
    const current = pull;
    pull = undefined;
    current?.finish();
  }

  function tick(now: number): void {
    const dt = Math.max(0, Math.min(.05, (now - previous) / 1000));
    const target = hovered || focused ? 1 : 0;
    const ease = 1 - Math.exp(-dt * 4);
    emphasis += (target - emphasis) * (1 - Math.exp(-dt * 5));
    time += dt * (1 + emphasis * 1.4);
    breathing += dt;
    const dx = pointer ? pointer.x - (documentX - scrollX) : 0, dy = pointer ? pointer.y - (documentY - scrollY) : 0;
    const distance = Math.hypot(dx, dy);
    const proximity = pointer && distance > 0 ? Math.max(0, 1 - distance / REACH) : 0;
    if (proximity) { leanX = dx / distance; leanY = dy / distance; }
    tidal += (proximity - tidal) * ease;
    lookX += ((pointer ? clamp(dx / 400, -1, 1) : 0) - lookX) * ease;
    lookY += ((pointer ? clamp(dy / 300, -1, 1) : 0) - lookY) * ease;
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
    if (running && fine.matches && !pull) {
      document.addEventListener('pointermove', move, { passive: true });
      document.addEventListener('pointerout', leave);
    } else {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerout', leave);
      pointer = undefined;
    }
    if (!running) {
      cancelAnimationFrame(frame);
      frame = 0;
      finishPull();
      emphasis = tidal = lookX = lookY = 0;
      if (active && width && visible) draw();
    } else if (!frame) {
      previous = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  function move(event: PointerEvent): void {
    pointer = event.pointerType === 'mouse' ? { x: event.clientX, y: event.clientY } : undefined;
  }

  function leave(event: PointerEvent): void {
    if (!event.relatedTarget) pointer = undefined;
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
      await new Promise<void>(finish => { pull = { startedAt: performance.now(), finish }; });
    }
  };
}
