// Fetched only after the visitor opts into fancy mode.
export function start(): () => void {
  const root = document.documentElement;
  const canvas = document.querySelector<HTMLCanvasElement>('#curiosity');
  const button = document.querySelector<HTMLButtonElement>('.motion-button');
  const context = canvas?.getContext('2d');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const dark = matchMedia('(prefers-color-scheme: dark)');
  let paused = false, visible = true, frame = 0, previous = 0, phase = 0, width = 0;
  let pointerX = 0, pointerY = 0, rotationX = 0, rotationY = 0;
  document.querySelectorAll<HTMLImageElement>('img[data-src]').forEach(image => {
    if (!image.getAttribute('src')) image.src = image.dataset.src!;
  });
  const revealTargets = [...document.querySelectorAll<HTMLElement>('.project, .about, .contact')];
  const reveal = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        (entry.target as HTMLElement).dataset.reveal = 'visible';
        reveal!.unobserve(entry.target);
      }
    });
  }, { threshold: .08 }) : undefined;
  revealTargets.forEach(element => {
    if (reveal) {
      element.dataset.reveal = element.getBoundingClientRect().top < innerHeight ? 'visible' : 'waiting';
      reveal.observe(element);
    }
  });
  const points: [number, number, number][] = [];
  for (let u = 0; u < 76; u++) {
    for (let v = 0; v < 32; v++) {
      const a = u / 76 * Math.PI * 2, b = v / 32 * Math.PI * 2;
      const radius = .93 + .38 * Math.cos(b);
      points.push([radius * Math.cos(a), radius * Math.sin(a), .38 * Math.sin(b)]);
    }
  }
  function draw(): void {
    if (!context || !width) return;
    context.clearRect(0, 0, width, width);
    const tilt = .9 + rotationY, turn = phase * .12 + rotationX;
    const cx = Math.cos(tilt), sx = Math.sin(tilt), cy = Math.cos(turn), sy = Math.sin(turn);
    const projected = points.map(([x, y, z]) => {
      const y1 = y * cx - z * sx, z1 = y * sx + z * cx;
      const x2 = x * cy + z1 * sy, z2 = -x * sy + z1 * cy;
      const perspective = 3.6 / (3.6 - z2);
      return { x: width / 2 + x2 * width * .29 * perspective,
        y: width / 2 + y1 * width * .29 * perspective, z: z2, perspective };
    }).sort((a, b) => a.z - b.z);
    for (const point of projected) {
      const depth = (point.z + 1.4) / 2.8;
      const lightness = dark.matches ? 30 + depth * 40 : 28 + depth * 23;
      context.fillStyle = `hsla(${13 + depth * 17}, 91%, ${lightness}%, ${.3 + depth * .7})`;
      context.beginPath();
      context.arc(point.x, point.y, Math.max(.7, width * .0024 * point.perspective), 0, Math.PI * 2);
      context.fill();
    }
  }
  function running(): boolean { return Boolean(context) && !paused && !motion.matches && visible && !document.hidden; }
  function tick(time: number): void {
    if (!running()) { frame = 0; return; }
    if (time - previous >= 32) {
      phase += Math.min(time - previous, 64) / 1000;
      previous = time;
      rotationX += (pointerX - rotationX) * .06;
      rotationY += (pointerY - rotationY) * .06;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function sync(): void {
    root.dataset.motion = !paused && !motion.matches ? 'on' : 'off';
    if (button) { button.hidden = motion.matches || !context; button.textContent = paused ? 'Play motion' : 'Pause motion'; }
    if (!running()) { cancelAnimationFrame(frame); frame = 0; draw(); }
    else if (!frame) { previous = performance.now(); frame = requestAnimationFrame(tick); }
  }
  function resize(): void {
    if (!canvas || !context) return;
    width = canvas.getBoundingClientRect().width;
    const scale = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(width * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    draw();
  }
  function pointer(event: PointerEvent): void {
    if (!running() || event.pointerType !== 'mouse') return;
    pointerX = (event.clientX / innerWidth - .5) * .7;
    pointerY = (event.clientY / innerHeight - .5) * .5;
  }
  function toggleMotion(): void { paused = !paused; sync(); }
  const inView = canvas && 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  }) : undefined;
  if (canvas) inView?.observe(canvas);
  const dimensions = canvas && 'ResizeObserver' in window ? new ResizeObserver(resize) : undefined;
  if (canvas) dimensions?.observe(canvas);
  addEventListener('resize', resize);
  addEventListener('pointermove', pointer, { passive: true });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  dark.addEventListener('change', draw);
  button?.addEventListener('click', toggleMotion);
  resize();
  sync();
  return () => {
    cancelAnimationFrame(frame);
    reveal?.disconnect(); inView?.disconnect(); dimensions?.disconnect();
    removeEventListener('resize', resize); removeEventListener('pointermove', pointer);
    document.removeEventListener('visibilitychange', sync);
    motion.removeEventListener('change', sync); dark.removeEventListener('change', draw);
    button?.removeEventListener('click', toggleMotion);
    revealTargets.forEach(element => delete element.dataset.reveal);
    delete root.dataset.motion;
    if (button) button.hidden = true;
  };
}
