import { PARTICLE_COLOURS } from './particle-palette.js';

type Particle = { x: number; y: number; vx: number; vy: number; ox: number; oy: number; fx: number; fy: number; age: number; life: number; size: number; colour: number };
const PAD_X = 56, PAD_Y = 36, TAU = Math.PI * 2;
// On white paper the same warm/cool dust needs darker ink to remain visible.
const PAPER_COLOURS = ['112, 77, 45', '66, 104, 163', '80, 119, 174', '180, 107, 32', '202, 142, 69'];

export function start(button: HTMLButtonElement): { setActive: (value: boolean) => void } {
  const canvas = button.querySelector<HTMLCanvasElement>('.frontend-particles');
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return { setActive: () => {} };
  const surface = canvas, paint = context;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  // Bake the same small radial halos as the universe; keep the dot cores sharp.
  const halos = [...PARTICLE_COLOURS, ...PAPER_COLOURS].map(colour => {
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 32;
    const brush = sprite.getContext('2d');
    if (brush) {
      const glow = brush.createRadialGradient(16, 16, 0, 16, 16, 16);
      glow.addColorStop(0, `rgba(${colour},.7)`);
      glow.addColorStop(.2, `rgba(${colour},.2)`);
      glow.addColorStop(1, `rgba(${colour},0)`);
      brush.fillStyle = glow; brush.fillRect(0, 0, 32, 32);
    }
    return sprite;
  });
  const particles: Particle[] = Array.from({ length: 48 }, (_, index) => ({
    x: 0, y: 0, vx: 0, vy: 0, ox: 0, oy: 0, fx: 0, fy: 0, age: 0, life: 1,
    size: index % 13 === 0 ? 1.15 : .35 + Math.random() * .6, colour: index % PARTICLE_COLOURS.length
  }));
  const stars = Array.from({ length: 18 }, () => ({ x: Math.random(), y: Math.random(), size: .3 + Math.random() * .45 }));
  let active = false, visible = true, listening = false;
  let width = 0, height = 0, wordWidth = 0, wordHeight = 0, paddingX = PAD_X, left = 0, documentTop = 0;
  let frame = 0, previous = 0, time = 0;
  let pointerInside = false, moved = false, px = 0, py = 0, fromX = 0, fromY = 0;

  function reset(particle: Particle, warm = false): void {
    const angle = Math.random() * TAU;
    particle.x = paddingX + wordWidth * (.08 + Math.random() * .84);
    particle.y = PAD_Y + wordHeight * (.3 + Math.random() * .4);
    particle.vx = Math.cos(angle) * (12 + Math.random() * 14);
    particle.vy = Math.sin(angle) * (5 + Math.random() * 8);
    particle.life = 2.4 + Math.random() * 2;
    particle.age = warm ? Math.random() * particle.life : 0;
    particle.x += particle.vx * particle.age; particle.y += particle.vy * particle.age;
    particle.ox = particle.oy = particle.fx = particle.fy = 0;
  }
  function measure(): void {
    const rect = button.getBoundingClientRect();
    wordWidth = button.clientWidth; wordHeight = button.clientHeight;
    // Bound the canvas itself, not just its pixels, to avoid horizontal overflow.
    paddingX = Math.max(0, Math.min(PAD_X, rect.left + button.clientLeft - 4));
    const right = Math.max(0, Math.min(PAD_X, innerWidth - rect.left - button.clientLeft - wordWidth - 4));
    left = rect.left + button.clientLeft - paddingX;
    documentTop = scrollY + rect.top + button.clientTop - PAD_Y;
    width = wordWidth + paddingX + right; height = wordHeight + PAD_Y * 2;
    surface.style.left = `${-paddingX}px`; surface.style.width = `${width}px`;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    surface.width = Math.round(width * ratio); surface.height = Math.round(height * ratio);
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
    for (const particle of particles) reset(particle, true);
    draw();
  }
  function draw(): void {
    paint.clearRect(0, 0, width, height);
    paint.fillStyle = 'rgba(214,228,255,.6)';
    paint.beginPath();
    for (const star of stars) {
      const x = paddingX + 3 + star.x * Math.max(0, wordWidth - 6);
      const y = PAD_Y + 3 + star.y * Math.max(0, wordHeight - 6);
      paint.moveTo(x + star.size, y); paint.arc(x, y, star.size, 0, TAU);
    }
    paint.fill();
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const x = particle.x + particle.ox;
      const y = particle.y + particle.oy + Math.sin(time * 1.4 + i) * particle.age * .6;
      const life = particle.age / particle.life;
      const alpha = Math.min(1, life * 6) * (1 - life) * .9;
      const inside = x > paddingX && x < paddingX + wordWidth && y > PAD_Y && y < PAD_Y + wordHeight;
      if (i % 13 === 0) {
        const reach = particle.size * 3.5;
        paint.globalAlpha = alpha;
        paint.drawImage(halos[particle.colour + (inside ? 0 : PARTICLE_COLOURS.length)], x - reach, y - reach, reach * 2, reach * 2);
        paint.globalAlpha = 1;
      }
      paint.fillStyle = `rgba(${(inside ? PARTICLE_COLOURS : PAPER_COLOURS)[particle.colour]},${alpha})`;
      paint.beginPath(); paint.arc(x, y, particle.size, 0, TAU); paint.fill();
    }
  }
  function tick(now: number): void {
    const dt = Math.min(.05, (now - previous) / 1000); previous = now; time += dt;
    const dx = px - fromX, dy = py - fromY, length = dx * dx + dy * dy;
    const force = moved && length > .01;
    const damping = Math.exp(-dt * 5);
    for (const particle of particles) {
      particle.age += dt;
      if (particle.age >= particle.life) reset(particle);
      particle.x += particle.vx * dt; particle.y += particle.vy * dt;
      if (force) {
        const x = particle.x + particle.ox, y = particle.y + particle.oy;
        const t = Math.max(0, Math.min(1, ((x - fromX) * dx + (y - fromY) * dy) / length));
        const awayX = x - (fromX + dx * t), awayY = y - (fromY + dy * t);
        const distance = Math.hypot(awayX, awayY);
        if (distance < 42) {
          const strength = (1 - distance / 42) * Math.min(1, Math.sqrt(length) / 12);
          particle.fx += (awayX / (distance || 1) * 80 + dx * 3) * strength;
          particle.fy += (awayY / (distance || 1) * 80 + dy * 3) * strength;
          particle.fx = Math.max(-160, Math.min(160, particle.fx));
          particle.fy = Math.max(-160, Math.min(160, particle.fy));
        }
      }
      particle.fx = (particle.fx - particle.ox * dt * 16) * damping;
      particle.fy = (particle.fy - particle.oy * dt * 16) * damping;
      particle.ox += particle.fx * dt; particle.oy += particle.fy * dt;
    }
    fromX = px; fromY = py; moved = false;
    draw(); frame = requestAnimationFrame(tick);
  }
  function pointer(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    const x = event.clientX - left, y = event.clientY + scrollY - documentTop;
    if (x < 0 || x > width || y < 0 || y > height) { pointerInside = moved = false; return; }
    px = x; py = y;
    if (pointerInside) moved = true;
    else { fromX = x; fromY = y; }
    pointerInside = true;
  }
  function sync(): void {
    const running = active && visible && !document.hidden && !reduced.matches;
    if (!running) { cancelAnimationFrame(frame); frame = 0; pointerInside = moved = false; }
    else if (!frame) { previous = performance.now(); frame = requestAnimationFrame(tick); }
    const listen = running && fine.matches;
    if (listen !== listening) {
      if (listen) addEventListener('pointermove', pointer, { passive: true });
      else removeEventListener('pointermove', pointer);
      listening = listen;
    }
    if (active && !running && width) draw();
  }
  const resize = new ResizeObserver(() => { if (active) measure(); });
  resize.observe(button);
  const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { rootMargin: '40px' });
  visibility.observe(button);
  addEventListener('resize', () => { if (active) measure(); }, { passive: true });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  fine.addEventListener('change', sync);
  return { setActive(value: boolean): void {
    active = value;
    if (active) measure();
    sync();
  } };
}
