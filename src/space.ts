export type Vector = [number, number, number];
export type Shot = { position: Vector; target: Vector; x: number; y: number };

const TAU = Math.PI * 2, UP: Vector = [0, 1, 0], SUN = .2, BAND = 1, INCLINE = .24, SPIN = .03, KNOTS = 6;
const COLOURS = ['255, 255, 255', '214, 228, 255', '130, 172, 255', '255, 172, 88', '255, 216, 164'];
const LEVELS = [.35, .55, .75, 1];
const sub = (a: Vector, b: Vector): Vector => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const plus = (a: Vector, b: Vector): Vector => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const times = (a: Vector, s: number): Vector => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vector, b: Vector) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vector, b: Vector): Vector => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vector): Vector => times(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const mix = (a: Vector, b: Vector, t: number): Vector => plus(a, times(sub(b, a), t));
export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const gaussian = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(TAU * Math.random());
const pick = (weights: number[]) => { let r = Math.random() * weights.reduce((a, b) => a + b), i = 0; while ((r -= weights[i]) > 0) i++; return i; };

function bandPoint(angle: number, radius: number, height: number): Vector {
  const z = radius * Math.sin(angle);
  return [radius * Math.cos(angle), height * Math.cos(INCLINE) - z * Math.sin(INCLINE), height * Math.sin(INCLINE) + z * Math.cos(INCLINE)];
}
const knotAngle = (index: number) => index / KNOTS * TAU + .6;

export function blend(a: Shot, b: Shot, t: number): Shot {
  const from = sub(a.position, a.target), to = sub(b.position, b.target);
  const near = Math.hypot(...from), far = Math.hypot(...to), target = mix(a.target, b.target, t);
  const direction = unit(mix(times(from, 1 / near), times(to, 1 / far), t));
  return { position: plus(target, times(direction, near * (far / near) ** t)), target, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function createSpace(amount: number) {
  type Seed = { a: number; b: number; c: number; knot: number; size: number; colour: number; level: number; glow: boolean };
  const seeds: Seed[] = [];
  const density = (angle: number) => .3 + .7 * (.5 + .5 * Math.sin(angle * 3 + 1.3)) * (.6 + .4 * Math.sin(angle * 7 + .4));
  for (let n = Math.round(4200 * amount); n > 0;) {
    const angle = Math.random() * TAU;
    if (Math.random() > density(angle)) continue;
    const spread = .07 + .05 * Math.sin(angle * 2);
    seeds.push({ a: angle, b: BAND + gaussian() * spread, c: gaussian() * .022, knot: -1, size: .0016 + Math.random() ** 4 * .006,
      colour: pick([5, 4, 1.4, 1.2, .8]), level: pick([3, 3, 2, 1]), glow: Math.random() < .045 });
    n--;
  }
  for (let knot = 0; knot < KNOTS; knot++) {
    for (let n = Math.round(260 * amount); n > 0; n--) {
      seeds.push({ a: gaussian() * .045, b: gaussian() * .03, c: gaussian() * .045, knot, size: .0016 + Math.random() ** 3 * .006,
        colour: knot % 2 ? pick([3, 3, 3, 0, .5]) : pick([3, 2, .4, 3, 1]), level: pick([1, 2, 3, 3]), glow: Math.random() < .08 });
    }
  }
  seeds.sort((p, q) => Number(p.glow) - Number(q.glow) || p.colour - q.colour || p.level - q.level);
  const count = seeds.length;
  const base = new Float32Array(count * 3), origin = new Float32Array(count * 3);
  const knots = new Int8Array(count), sizes = new Float32Array(count), styles = new Uint8Array(count), glows = new Uint8Array(count);
  const delays = new Float32Array(count), twinkles = new Float32Array(count);
  seeds.forEach((seed, i) => {
    base.set([seed.a, seed.b, seed.c], i * 3);
    origin.set(times(unit([gaussian(), gaussian(), gaussian()]), 1.6 + Math.random() * 2.6), i * 3);
    knots[i] = seed.knot; sizes[i] = seed.size; styles[i] = seed.colour * LEVELS.length + seed.level; glows[i] = Number(seed.glow);
    delays[i] = Math.random() * .4; twinkles[i] = Math.random() * TAU;
  });
  const fills = COLOURS.flatMap(colour => LEVELS.map(level => `rgba(${colour}, ${level})`));
  const sprite = (stops: [number, string][]) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const paint = canvas.getContext('2d');
    if (paint) {
      const gradient = paint.createRadialGradient(32, 32, 0, 32, 32, 32);
      stops.forEach(([stop, colour]) => gradient.addColorStop(stop, colour));
      paint.fillStyle = gradient;
      paint.fillRect(0, 0, 64, 64);
    }
    return canvas;
  };
  const glowSprites = COLOURS.map(colour => sprite([[0, `rgba(${colour}, .9)`], [.18, `rgba(${colour}, .35)`], [1, `rgba(${colour}, 0)`]]));
  const dotSprites = COLOURS.flatMap(colour => LEVELS.map(level => sprite([[0, `rgba(${colour}, ${level})`], [.7, `rgba(${colour}, ${level})`], [1, `rgba(${colour}, 0)`]])));
  const bokehSprites = COLOURS.map(colour => sprite([[0, `rgba(${colour}, .28)`], [.75, `rgba(${colour}, .2)`], [1, `rgba(${colour}, 0)`]]));
  const stars = Array.from({ length: Math.round(700 * amount) }, () => ({ direction: unit([gaussian(), gaussian(), gaussian()]), level: pick([5, 3, 1.5, .6]) }))
    .sort((p, q) => p.level - q.level);

  function positions(phase: number): Vector[] {
    return Array.from({ length: KNOTS }, (_, index) => bandPoint(knotAngle(index) + phase * SPIN, BAND, 0));
  }
  function overview(exit: number, yaw: number, x: number, y: number): Shot {
    const pitch = .3 + exit * .72, distance = 3.1 - exit * 1.15;
    return { position: times([Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw)], distance), target: [0, 0, 0], x, y };
  }
  function visit(index: number, places: Vector[], x: number, y: number): Shot {
    const target = places[index], outward = unit(target), along = unit(cross(UP, outward));
    return { position: plus(target, plus(plus(times(outward, .3), times(UP, .12)), times(along, -.26))), target, x, y };
  }
  function nudge(shot: Shot, x: number, y: number): Shot {
    const forward = unit(sub(shot.target, shot.position)), right = unit(cross(forward, UP)), up = cross(right, forward);
    const reach = Math.hypot(...sub(shot.target, shot.position)) * .14;
    return { ...shot, position: plus(shot.position, plus(times(right, x * reach), times(up, -y * reach))) };
  }

  function render(context: CanvasRenderingContext2D, width: number, height: number, phase: number, shot: Shot, highlight: number, formation: number): void {
    const focal = Math.min(width, height) * 1.15, cx = width * shot.x, cy = height * shot.y;
    const forward = unit(sub(shot.target, shot.position)), right = unit(cross(forward, UP)), up = cross(right, forward);
    const [px, py, pz] = shot.position;
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';

    let style = -1;
    for (const star of stars) {
      const z = dot(star.direction, forward);
      if (z < .05) continue;
      const next = Math.round(star.level);
      if (next !== style) { context.fillStyle = `rgba(214, 226, 255, ${.12 + next * .1})`; style = next; }
      context.fillRect(cx + dot(star.direction, right) / z * focal, cy - dot(star.direction, up) / z * focal, 1.2, 1.2);
    }

    const sun = sub([0, 0, 0], shot.position), sunZ = dot(sun, forward);
    if (sunZ > SUN) {
      const x = cx + dot(sun, right) / sunZ * focal, y = cy - dot(sun, up) / sunZ * focal, radius = SUN * focal / sunZ;
      context.globalCompositeOperation = 'lighter';
      for (const [reach, colour] of [[7, 'rgba(255, 150, 60, .1)'], [2.3, 'rgba(255, 190, 100, .42)']] as const) {
        const glow = context.createRadialGradient(x, y, radius * .8, x, y, radius * reach);
        glow.addColorStop(0, colour);
        glow.addColorStop(1, 'rgba(255, 150, 60, 0)');
        context.fillStyle = glow;
        context.fillRect(x - radius * reach, y - radius * reach, radius * reach * 2, radius * reach * 2);
      }
      context.globalCompositeOperation = 'source-over';
      const disc = context.createRadialGradient(x, y, 0, x, y, radius);
      disc.addColorStop(0, '#fffbe8');
      disc.addColorStop(.72, '#fff0bd');
      disc.addColorStop(.94, '#ffd685');
      disc.addColorStop(1, '#ffbf5c');
      context.fillStyle = disc;
      context.beginPath();
      context.arc(x, y, radius, 0, TAU);
      context.fill();
    }

    context.globalCompositeOperation = 'lighter';
    const turn = phase * SPIN, cosI = Math.cos(INCLINE), sinI = Math.sin(INCLINE);
    const centres = positions(phase), forming = formation < 1;
    const [fx, fy, fz] = forward, [rx, ry, rz] = right, [ux, uy, uz] = up;
    style = -1;
    for (let i = 0; i < count; i++) {
      const o = i * 3, knot = knots[i];
      let x: number, y: number, z: number;
      if (knot < 0) {
        const angle = base[o] + turn, radius = base[o + 1], flat = radius * Math.sin(angle);
        x = radius * Math.cos(angle);
        y = base[o + 2] * cosI - flat * sinI;
        z = base[o + 2] * sinI + flat * cosI;
      } else {
        const centre = centres[knot];
        x = centre[0] + base[o]; y = centre[1] + base[o + 1]; z = centre[2] + base[o + 2];
      }
      if (forming) {
        const t = clamp((formation - delays[i]) / .6), eased = t * t * (3 - 2 * t);
        x = origin[o] + (x - origin[o]) * eased; y = origin[o + 1] + (y - origin[o + 1]) * eased; z = origin[o + 2] + (z - origin[o + 2]) * eased;
      }
      const dx = x - px, dy = y - py, dz = z - pz, depth = dx * fx + dy * fy + dz * fz;
      if (depth < .04) continue;
      const sx = cx + (dx * rx + dy * ry + dz * rz) / depth * focal, sy = cy - (dx * ux + dy * uy + dz * uz) / depth * focal;
      const lit = knot >= 0 && knot === highlight ? 1.6 : 1;
      const size = Math.min(60, sizes[i] * focal / depth * (.8 + .2 * Math.sin(phase * 2.2 + twinkles[i])) * lit);
      if (sx < -size * 4 || sy < -size * 4 || sx > width + size * 4 || sy > height + size * 4) continue;
      if (size > 7) {
        context.drawImage(bokehSprites[Math.floor(styles[i] / LEVELS.length)], sx - size, sy - size, size * 2, size * 2);
      } else if (glows[i]) {
        const reach = Math.max(size * 4, 6);
        context.drawImage(glowSprites[Math.floor(styles[i] / LEVELS.length)], sx - reach, sy - reach, reach * 2, reach * 2);
      } else if (size > 2.2) {
        context.drawImage(dotSprites[styles[i]], sx - size / 1.4, sy - size / 1.4, size * 1.43, size * 1.43);
      } else {
        if (styles[i] !== style) { style = styles[i]; context.fillStyle = fills[style]; }
        const dotSize = Math.max(.9, size);
        context.fillRect(sx - dotSize / 2, sy - dotSize / 2, dotSize, dotSize);
      }
    }
    context.globalCompositeOperation = 'source-over';

    if (highlight >= 0 && !forming) {
      const d = sub(centres[highlight], shot.position), z = dot(d, forward);
      if (z > .1) {
        context.strokeStyle = '#a9c8ff';
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(cx + dot(d, right) / z * focal, cy - dot(d, up) / z * focal, Math.max(.11 * focal / z, 18), 0, TAU);
        context.stroke();
      }
    }
  }

  return { positions, overview, visit, nudge, render };
}
