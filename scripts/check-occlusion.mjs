import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5001/';
const session = `portfolio-occlusion-${process.pid}`;
function browser(...args) {
  const result = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8' }));
  assert.ok(result.success, result.error);
  return result.data;
}

try {
  browser('open', base);
  const results = browser('eval', `(async () => {
    const { createSpace } = await import('/js/space.js');
    const empty = createSpace(0);
    // A single glowing band particle, with no knots or stars, at the back/front
    // of the sun depending on the camera. Exercise the actual canvas renderer.
    const random = Math.random;
    const values = [.25, 0, .5, .25, .5, .25, 1, 0, .99, 0];
    let index = 0, particle;
    try {
      Math.random = () => values[index++] ?? .25;
      particle = createSpace(1 / 4200);
    } finally { Math.random = random; }
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 600;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const compare = (yaw, pitch, opacity = 1) => {
      const shot = empty.overview(1.55, yaw, .5, .5, pitch);
      empty.render(context, 600, 600, 0, 0, shot, -1, 1, opacity);
      const baseline = context.getImageData(0, 0, 600, 600).data;
      particle.render(context, 600, 600, 0, 0, shot, -1, 1, opacity);
      const actual = context.getImageData(0, 0, 600, 600).data;
      const radius = .2 * 600 * 1.15 / 1.55;
      let inside = 0, outside = 0;
      for (let y = 0; y < 600; y++) for (let x = 0; x < 600; x++) {
        const offset = (y * 600 + x) * 4;
        const changed = [0, 1, 2, 3].some(c => actual[offset + c] !== baseline[offset + c]);
        if (!changed) continue;
        const distance = Math.hypot(x + .5 - 300, y + .5 - 300);
        if (distance < radius - 2) inside++;
        if (distance > radius + 2) outside++;
      }
      return { inside, outside };
    };
    return {
      rear: compare(Math.PI, .24),
      limb: compare(Math.PI + .34, .24),
      dimRear: compare(Math.PI, .24, .25),
      front: compare(0, -.24)
    };
  })()`).result;
  assert.equal(results.rear.inside, 0, 'The sun must hide particles behind its centre');
  assert.equal(results.limb.inside, 0, 'Rear particle glow must be clipped at the sun\'s edge');
  assert.ok(results.limb.outside > 0, 'Rear particles must remain visible outside the sun');
  assert.equal(results.dimRear.inside, 0, 'The dim mobile sun must also hide rear particles');
  assert.ok(results.front.inside > 0, 'Particles in front of the sun must remain visible');
  console.log('Occlusion checks passed: rear particles, glow at the edge, dim sun and foreground particles.');
} finally {
  browser('close');
}
