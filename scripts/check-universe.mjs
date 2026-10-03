import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5001/';
const session = `portfolio-universe-${process.pid}`;
function browser(...args) {
  const result = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8' }));
  assert.ok(result.success, result.error);
  return result.data;
}

try {
  browser('open', base);
  const results = browser('eval', `(async () => {
    const { createSpace } = await import('/js/space.js');
    const random = Math.random;
    let seed = 7341, space, mobileSpace;
    try {
      Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
      space = createSpace(1);
      seed = 7341;
      mobileSpace = createSpace(.45);
    } finally { Math.random = random; }
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const fill = context.fillRect.bind(context);
    let points = [], sun;
    context.fillRect = (x, y, w, h) => {
      if (context.globalCompositeOperation === 'source-over' && w === h && w < 2 && w !== 1.2) {
        const alpha = Number(context.fillStyle.match(/,\\s*([\\d.]+)\\)$/)?.[1] ?? 1);
        points.push({ x, y, alpha, size: w });
      }
      fill(x, y, w, h);
    };
    const sample = (width, height, reading, turn) => {
      canvas.width = width; canvas.height = height;
      const x = reading ? (width === 390 ? 1.09 : .8125) : .8;
      const shot = space.overview(reading ? 1.55 : 3.1, reading ? 1.1 : .1, x, reading ? .5 : .43, reading ? .12 : .3);
      sun = { x: width * x, y: height * (reading ? .5 : .43), radius: .2 * Math.min(width, height) * 1.15 / (reading ? 1.55 : 3.1) };
      points = [];
      (width === 390 ? mobileSpace : space).render(context, width, height, 3, turn, shot, -1, 1, width === 390 && reading ? .25 : 1);
      const visible = points.filter(p => p.x >= 0 && p.y >= 0 && p.x < width && p.y < height);
      return { visible, submitted: points.length, sun, quadrants: [0, 1, 2, 3].map(q => visible.filter(p => (p.x >= width / 2 ? 1 : 0) + (p.y >= height / 2 ? 2 : 0) === q).length) };
    };
    return { opening: sample(1440, 900, false, .3), reading: sample(1440, 900, true, .3),
      rotated: sample(1440, 900, true, .5), repeat: sample(1440, 900, true, .3), mobile: sample(390, 844, true, .3) };
  })()`).result;
  for (const name of ['opening', 'reading', 'mobile']) {
    const scene = results[name];
    assert.ok(scene.visible.length >= (name === 'mobile' ? 20 : 60), `${name}: dim background particles should fill the wider sky`);
    assert.ok(scene.quadrants.every(n => n >= 3), `${name}: background particles should reach all four quarters`);
    assert.ok(scene.visible.every(p => p.alpha <= .3), `${name}: the backdrop must stay faded`);
    assert.equal(scene.submitted, scene.visible.length, `${name}: offscreen background particles should be culled`);
    assert.ok(scene.visible.every(p => {
      const x = Math.max(p.x, Math.min(scene.sun.x, p.x + p.size));
      const y = Math.max(p.y, Math.min(scene.sun.y, p.y + p.size));
      return Math.hypot(x - scene.sun.x, y - scene.sun.y) > scene.sun.radius;
    }), `${name}: the entire background dot must stay outside the sun`);
  }
  assert.notDeepEqual(results.reading.visible, results.rotated.visible, 'The wider backdrop should gently follow universe rotation');
  assert.deepEqual(results.reading.visible, results.repeat.visible, 'Frozen scene inputs should keep the backdrop still');
  console.log('Universe checks passed: wide, faded backdrop, viewport culling, sun occlusion and gentle rotation.');
} finally {
  browser('close');
}
