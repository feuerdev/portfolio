type Visitors = {
  setActive(value: boolean): void;
  clear(): void;
  tick(now: number, originX: number, originY: number): void;
};

export function start(): Visitors {
  let active = false, hasPointer = false;
  let pointerX = 0, pointerY = 0;
  let nextVisit = 0;
  let visit: {
    canvas: HTMLCanvasElement; paint: CanvasRenderingContext2D; startedAt: number;
    originX: number; originY: number; distance: number; directionX: number; directionY: number;
  } | undefined;
  const colours = ['83, 116, 159', '174, 113, 57', '107, 133, 169'];

  function clear(): void {
    visit?.canvas.remove();
    visit = undefined;
    nextVisit = performance.now() + 1000 + Math.random() * 1200;
  }

  function pointer(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    pointerX = event.clientX; pointerY = event.clientY;
    hasPointer = true;
  }

  function leave(): void { hasPointer = false; clear(); }

  return {
    clear,
    setActive(value: boolean): void {
      if (active === value) return;
      active = value;
      if (active) {
        nextVisit = performance.now() + 800;
        document.addEventListener('pointermove', pointer, { passive: true });
        document.addEventListener('pointerleave', leave);
        document.addEventListener('pointerdown', clear, { passive: true });
        document.addEventListener('keydown', clear);
        addEventListener('scroll', clear, { passive: true });
      } else {
        document.removeEventListener('pointermove', pointer);
        document.removeEventListener('pointerleave', leave);
        document.removeEventListener('pointerdown', clear);
        document.removeEventListener('keydown', clear);
        removeEventListener('scroll', clear);
        leave();
      }
    },
    tick(now: number, originX: number, originY: number): void {
      if (!active || !hasPointer) return;
      if (!visit && now >= nextVisit) {
        const dx = pointerX - originX, dy = pointerY - originY;
        const distance = Math.hypot(dx, dy);
        if (distance < 48) { clear(); return; }
        const canvas = document.createElement('canvas');
        const paint = canvas.getContext('2d');
        if (!paint) { clear(); return; }
        canvas.className = 'rift-visitors';
        canvas.setAttribute('aria-hidden', 'true');
        const ratio = Math.min(devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(innerWidth * ratio);
        canvas.height = Math.round(innerHeight * ratio);
        paint.setTransform(ratio, 0, 0, ratio, 0, 0);
        document.body.append(canvas);
        visit = { canvas, paint, startedAt: now, originX, originY, distance, directionX: dx / distance, directionY: dy / distance };
      }
      if (!visit) return;
      const progress = (now - visit.startedAt) / 3200;
      if (progress >= 1) { clear(); return; }
      const { paint, distance, directionX, directionY } = visit;
      paint.clearRect(0, 0, innerWidth, innerHeight);
      for (let index = 0; index < colours.length; index++) {
        const phase = Math.max(0, Math.min(1, (progress - index * .035) / .93));
        const periapsis = 8 + index * 3;
        const major = (distance + periapsis) / 2;
        const eccentricity = (distance - periapsis) / (distance + periapsis);
        const meanAngle = phase * Math.PI * 2;
        let angle = Math.PI;
        for (let iteration = 0; iteration < 8; iteration++) {
          angle -= (angle - eccentricity * Math.sin(angle) - meanAngle) / (1 - eccentricity * Math.cos(angle));
        }
        const along = major * (eccentricity - Math.cos(angle));
        const across = Math.sqrt(distance * periapsis) * Math.sin(angle);
        const x = visit.originX + along * directionX - across * directionY;
        const y = visit.originY + along * directionY + across * directionX;
        const alpha = Math.min(1, phase * 12, (1 - phase) * 12) * .65;
        paint.fillStyle = `rgba(${colours[index]},${alpha})`;
        paint.beginPath(); paint.arc(x, y, index === 0 ? 1.1 : .8, 0, Math.PI * 2); paint.fill();
      }
    }
  };
}
