export type Vector = [number, number, number];
export type Shot = { position: Vector; target: Vector; x: number; y: number };
export type PointerWake = { x: number; y: number; fromX: number; fromY: number; radius: number };

const TAU = Math.PI * 2, UP: Vector = [0, 1, 0], SUN = .2, BAND = 1, INCLINE = .24, KNOTS = 6;
const COLOURS = ['255, 255, 255', '214, 228, 255', '130, 172, 255', '255, 172, 88', '255, 216, 164'];
const LEVELS = [.35, .55, .75, 1];
const sub = (a: Vector, b: Vector): Vector => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const plus = (a: Vector, b: Vector): Vector => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const times = (a: Vector, s: number): Vector => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vector, b: Vector) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vector, b: Vector): Vector => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vector): Vector => times(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const gaussian = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(TAU * Math.random());
const pick = (weights: number[]) => { let r = Math.random() * weights.reduce((a, b) => a + b), i = 0; while ((r -= weights[i]) > 0) i++; return i; };

function bandPoint(angle: number, radius: number, height: number): Vector {
  const z = radius * Math.sin(angle);
  return [radius * Math.cos(angle), height * Math.cos(INCLINE) - z * Math.sin(INCLINE), height * Math.sin(INCLINE) + z * Math.cos(INCLINE)];
}
const knotAngle = (index: number) => index / KNOTS * TAU + .6;

export function createSpace(amount: number, pointerEnabled = true) {
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
  // Per particle: orbital phase, radial displacement and height, plus their velocities.
  let offsets: Float32Array | undefined, velocities: Float32Array | undefined, awake: Uint8Array | undefined;
  function setPointerEnabled(enabled: boolean): void {
    if (enabled && !offsets) {
      offsets = new Float32Array(count * 3);
      velocities = new Float32Array(count * 3);
      awake = new Uint8Array(count);
    } else if (!enabled) {
      offsets = velocities = awake = undefined;
    }
  }
  setPointerEnabled(pointerEnabled);
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
    // A wider, dimmer sky shares the star pass, without glow sprites or wake physics.
    .concat(Array.from({ length: Math.round(5400 * amount) }, () => ({ direction: unit([gaussian(), gaussian(), gaussian()]), level: 4 + pick([5.5, 3, 1.5]) })))
    .sort((p, q) => p.level - q.level);
  const starFills = [.12, .22, .32, .42, .3, .44, .59].map(alpha => `rgba(214, 226, 255, ${alpha})`);

  function positions(turn: number): Vector[] {
    return Array.from({ length: KNOTS }, (_, index) => bandPoint(knotAngle(index) + turn, BAND, 0));
  }
  function overview(distance: number, yaw: number, x: number, y: number, pitch = .3): Shot {
    return { position: times([Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw)], distance), target: [0, 0, 0], x, y };
  }
  function nudge(shot: Shot, x: number, y: number): Shot {
    const forward = unit(sub(shot.target, shot.position)), right = unit(cross(forward, UP)), up = cross(right, forward);
    const reach = Math.hypot(...sub(shot.target, shot.position)) * .14;
    return { ...shot, position: plus(shot.position, plus(times(right, x * reach), times(up, -y * reach))) };
  }

  function render(context: CanvasRenderingContext2D, width: number, height: number, phase: number, turn: number, shot: Shot, highlight: number, formation: number, sunOpacity = 1, pointer?: PointerWake, elapsed = 0): void {
    const focal = Math.min(width, height) * 1.15, cx = width * shot.x, cy = height * shot.y;
    const forward = unit(sub(shot.target, shot.position)), right = unit(cross(forward, UP)), up = cross(right, forward);
    const [px, py, pz] = shot.position;
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';

    const sun = sub([0, 0, 0], shot.position), sunZ = dot(sun, forward);
    const sunX = cx + dot(sun, right) / sunZ * focal, sunY = cy - dot(sun, up) / sunZ * focal;
    const sunRadius = SUN * focal / sunZ;
    const hiddenSkyRadiusSquared = (sunRadius + 4) ** 2;
    const skyCos = Math.cos(turn * .12), skySin = Math.sin(turn * .12);

    let style = -1;
    for (const star of stars) {
      const background = star.level >= 4;
      const [a, b, c] = star.direction;
      const x = background ? a * skyCos + c * skySin : a;
      const y = b, depthAxis = background ? c * skyCos - a * skySin : c;
      const z = x * forward[0] + y * forward[1] + depthAxis * forward[2];
      if (z < .05) continue;
      const sx = cx + (x * right[0] + y * right[1] + depthAxis * right[2]) / z * focal;
      const sy = cy - (x * up[0] + y * up[1] + depthAxis * up[2]) / z * focal;
      if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
      const size = background ? (star.level === 6 ? 2.2 : star.level === 5 ? 1.6 : 1.15) : 1.2;
      // Four pixels include the entire dot, even at the dim sun's edge.
      if (sunZ > SUN && (sx - sunX) ** 2 + (sy - sunY) ** 2 <= hiddenSkyRadiusSquared) continue;
      if (star.level !== style) { context.fillStyle = starFills[star.level]; style = star.level; }
      context.fillRect(sx, sy, size, size);
    }

    const outsideSun = new Path2D();
    if (sunZ > SUN) {
      const x = sunX, y = sunY, radius = sunRadius;
      outsideSun.rect(0, 0, width, height);
      outsideSun.moveTo(x + radius, y);
      outsideSun.arc(x, y, radius, 0, TAU);
      context.globalAlpha = sunOpacity;
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
      context.globalAlpha = 1;
    }

    context.globalCompositeOperation = 'lighter';
    const cosI = Math.cos(INCLINE), sinI = Math.sin(INCLINE);
    const centres = positions(turn), forming = formation < 1;
    const [fx, fy, fz] = forward, [rx, ry, rz] = right, [ux, uy, uz] = up;
    const dt = offsets ? clamp(elapsed, 0, .064) : 0;
    const flowDecay = dt ? Math.exp(-.65 * dt) : 1, knotDecay = dt ? Math.exp(-1.1 * dt) : 1;
    const spring = 1.8, damping = .85, frequency = Math.sqrt(spring * spring - damping * damping);
    const decay = dt ? Math.exp(-damping * dt) : 1, oscillation = dt ? Math.cos(frequency * dt) : 1, sway = dt ? Math.sin(frequency * dt) / frequency : 0;
    let highlightX = 0, highlightY = 0, highlightZ = 0, highlightCount = 0;
    const stepX = pointer ? pointer.x - pointer.fromX : 0, stepY = pointer ? pointer.y - pointer.fromY : 0;
    const pathSquared = stepX * stepX + stepY * stepY;
    const wake = !forming && dt > 0 && pointer && pathSquared > .01 ? pointer : undefined;
    const radiusSquared = wake ? wake.radius * wake.radius : 1;
    const inversePath = wake ? 1 / Math.sqrt(pathSquared) : 0;
    style = -1;
    for (let i = 0; i < count; i++) {
      const o = i * 3, knot = knots[i];
      if (awake && offsets && velocities && awake[i] && dt > 0) {
        // Drag settles orbital speed but retains the new phase/spacing. Only
        // radial/vertical scatter returns toward the stream's overall shape.
        const drag = knot < 0 ? .65 : 1.1, orbitDecay = knot < 0 ? flowDecay : knotDecay;
        const phase = offsets[o] + velocities[o] * (1 - orbitDecay) / drag;
        offsets[o] = knot < 0 ? phase % TAU : clamp(phase, -.24, .24);
        velocities[o] *= orbitDecay;
        let energy = velocities[o] * velocities[o];
        for (let axis = 1; axis < 3; axis++) {
          const j = o + axis, offset = offsets[j], velocity = velocities[j];
          offsets[j] = (offset * oscillation + (velocity + damping * offset) * sway) * decay;
          velocities[j] = (velocity * oscillation - (damping * velocity + spring * spring * offset) * sway) * decay;
          const limit = axis === 1 ? .35 : .22;
          if (Math.abs(offsets[j]) > limit) { offsets[j] = clamp(offsets[j], -limit, limit); velocities[j] *= .5; }
          energy += offsets[j] * offsets[j] + velocities[j] * velocities[j];
        }
        if (energy < .000001) {
          awake[i] = 0;
          velocities[o] = velocities[o + 1] = velocities[o + 2] = 0;
          offsets[o + 1] = offsets[o + 2] = 0;
        }
      }
      const orbit = offsets ? offsets[o] : 0, radial = offsets ? offsets[o + 1] : 0, vertical = offsets ? offsets[o + 2] : 0;
      let x: number, y: number, z: number, cosA: number, sinA: number, radius: number;
      if (knot < 0) {
        const angle = base[o] + turn + orbit, height = base[o + 2] + vertical;
        radius = base[o + 1] + radial;
        cosA = Math.cos(angle); sinA = Math.sin(angle);
        const flat = radius * sinA;
        x = radius * cosA;
        y = height * cosI - flat * sinI;
        z = height * sinI + flat * cosI;
      } else {
        const centre = centres[knot];
        cosA = centre[0] / BAND;
        sinA = (centre[2] * cosI - centre[1] * sinI) / BAND;
        if (orbit !== 0) {
          const c = Math.cos(orbit), s = Math.sin(orbit), originalCos = cosA;
          cosA = originalCos * c - sinA * s; sinA = sinA * c + originalCos * s;
        }
        radius = BAND + radial;
        x = radius * cosA + base[o];
        y = vertical * cosI - radius * sinA * sinI + base[o + 1];
        z = vertical * sinI + radius * sinA * cosI + base[o + 2];
      }
      if (forming) {
        const t = clamp((formation - delays[i]) / .6), eased = t * t * (3 - 2 * t);
        x = origin[o] + (x - origin[o]) * eased; y = origin[o + 1] + (y - origin[o + 1]) * eased; z = origin[o + 2] + (z - origin[o + 2]) * eased;
      }
      if (highlight >= 0 && knot === highlight) { highlightX += x; highlightY += y; highlightZ += z; highlightCount++; }
      const dx = x - px, dy = y - py, dz = z - pz, depth = dx * fx + dy * fy + dz * fz;
      if (depth < .04) continue;
      const sx = cx + (dx * rx + dy * ry + dz * rz) / depth * focal, sy = cy - (dx * ux + dy * uy + dz * uz) / depth * focal;
      if (wake && velocities && awake) {
        // A swept brush transfers movement into velocity, including behind text.
        // Stopping/leaving the pointer supplies no further force.
        const along = clamp(((sx - wake.fromX) * stepX + (sy - wake.fromY) * stepY) / pathSquared);
        const ox = sx - wake.fromX - along * stepX, oy = sy - wake.fromY - along * stepY;
        const distanceSquared = ox * ox + oy * oy;
        if (distanceSquared < radiusSquared) {
          const falloff = 1 - distanceSquared / radiusSquared;
          const side = (oy * stepX - ox * stepY) * inversePath / wake.radius;
          const carryX = stepX - stepY * side * .65, carryY = stepY + stepX * side * .65;
          const impulse = 2.4 * falloff * falloff * clamp(sunZ / depth, .35, 1) * depth / focal;
          const pushX = (rx * carryX - ux * carryY) * impulse;
          const pushY = (ry * carryX - uy * carryY) * impulse;
          const pushZ = (rz * carryX - uz * carryY) * impulse;
          const flatPush = pushZ * cosI - pushY * sinI;
          velocities[o] = clamp(velocities[o] + (-pushX * sinA + flatPush * cosA) / Math.max(radius, .5), -.7, .7);
          velocities[o + 1] = clamp(velocities[o + 1] + pushX * cosA + flatPush * sinA, -.65, .65);
          velocities[o + 2] = clamp(velocities[o + 2] + pushY * cosI + pushZ * sinI, -.4, .4);
          awake[i] = 1;
        }
      }
      const lit = knot >= 0 && knot === highlight ? 1.6 : 1;
      const size = Math.min(60, sizes[i] * focal / depth * (.8 + .2 * Math.sin(phase * 2.2 + twinkles[i])) * lit);
      if (sx < -size * 4 || sy < -size * 4 || sx > width + size * 4 || sy > height + size * 4) continue;
      let clipped = false;
      if (sunZ > SUN && depth > sunZ) {
        // Cull fully hidden sprites; only clip the few that cross the limb.
        // Include the entire glow, not just the particle's centre.
        const reach = (size > 7 ? size : glows[i] ? Math.max(size * 4, 6) : Math.max(size, .9)) * Math.SQRT2;
        const distanceSquared = (sx - sunX) ** 2 + (sy - sunY) ** 2;
        if (sunRadius > reach && distanceSquared < (sunRadius - reach) ** 2) continue;
        if (distanceSquared < (sunRadius + reach) ** 2) {
          context.save();
          context.clip(outsideSun, 'evenodd');
          clipped = true;
        }
      }
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
      if (clipped) { context.restore(); style = -1; }
    }
    context.globalCompositeOperation = 'source-over';

    if (highlight >= 0 && !forming) {
      const centre: Vector = highlightCount ? [highlightX / highlightCount, highlightY / highlightCount, highlightZ / highlightCount] : centres[highlight];
      const d = sub(centre, shot.position), z = dot(d, forward);
      if (z > .1) {
        context.strokeStyle = '#a9c8ff';
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(cx + dot(d, right) / z * focal, cy - dot(d, up) / z * focal, Math.max(.11 * focal / z, 18), 0, TAU);
        context.stroke();
      }
    }
  }

  function resetWake(): void { offsets?.fill(0); velocities?.fill(0); awake?.fill(0); }
  return { overview, nudge, render, resetWake, setPointerEnabled };
}
