import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5001/';
const session = `portfolio-rift-${process.pid}`;
function browser(...args) {
  const result = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8' }));
  assert.ok(result.success, result.error);
  return result.data;
}
const evaluate = code => browser('eval', code).result;
const settled = () => browser('wait', '--fn', '!document.querySelector("#mode-toggle").disabled && !document.querySelector(".page-reveal")');
const pause = ms => evaluate(`new Promise(resolve => setTimeout(resolve, ${ms}))`);
const drawing = () => evaluate('document.querySelector(".frontend-particles").toDataURL()');
const fresh = () => {
  browser('open', base);
  return evaluate('(() => { const r = document.querySelector("#mode-toggle").getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()');
};
const move = ([x, y], dx, dy, pointerType = 'mouse') =>
  evaluate(`document.dispatchEvent(new PointerEvent('pointermove', { pointerType: '${pointerType}', clientX: ${x + dx}, clientY: ${y + dy} }))`);
const strayInk = () => evaluate(`(() => {
  const canvas = document.querySelector('.frontend-particles');
  const { data, width, height } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  const alpha = (x, y) => data[(y * width + x) * 4 + 3];
  let stray = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const index = (y * width + x) * 4;
    const rim = Math.hypot(data[index] - 80, data[index + 1] - 153, data[index + 2] - 207) < 40;
    if (alpha(x, y) <= 40 || alpha(x, y) === 255 || rim) continue;
    let near = false;
    for (let dy = -4; dy <= 4 && !near; dy++) for (let dx = -4; dx <= 4 && !near; dx++) {
      const nx = x + dx, ny = y + dy;
      near = nx >= 0 && ny >= 0 && nx < width && ny < height && alpha(nx, ny) === 255;
    }
    if (!near) stray++;
  }
  return stray;
})()`);

try {
  browser('set', 'viewport', '1440', '1000');
  browser('set', 'media', 'light', 'no-preference');
  let rift = fresh();
  assert.equal(evaluate('matchMedia("(any-hover: hover) and (any-pointer: fine)").matches'), true, 'The check needs a fine, hover-capable pointer');
  for (const [dx, dy] of [[0, 0], [60, 40], [-300, -200]]) {
    if (dx || dy) move(rift, dx, dy);
    pause(800);
    const stray = Math.max(...Array.from({ length: 5 }, () => strayInk()));
    assert.equal(stray, 0, `Stars must stay inside the opening (${stray} stray pixels at ${dx},${dy})`);
  }

  browser('set', 'media', 'light', 'reduced-motion');
  rift = fresh();
  move(rift, 0, -240);
  const still = drawing();
  pause(600);
  assert.equal(drawing(), still, 'Reduced motion keeps a still drawing that ignores the pointer');
  browser('click', '#mode-toggle'); settled();
  browser('click', '#plain-toggle'); settled();
  const instant = evaluate(`(async () => {
    const started = performance.now();
    document.querySelector('#mode-toggle').click();
    while (!document.documentElement.classList.contains('fancy')) await new Promise(requestAnimationFrame);
    return performance.now() - started;
  })()`);
  assert.ok(instant < 300, `Reduced motion must skip the pull-in (${Math.round(instant)}ms)`);

  browser('set', 'media', 'light', 'no-preference');
  rift = fresh();
  browser('click', '#mode-toggle'); settled();
  browser('click', '#plain-toggle'); settled();
  const pulled = evaluate(`(async () => {
    const started = performance.now();
    document.querySelector('#mode-toggle').click();
    while (document.documentElement.dataset.revealResult !== 'running' && !document.documentElement.classList.contains('fancy')) await new Promise(requestAnimationFrame);
    return performance.now() - started;
  })()`);
  assert.ok(pulled >= 300, `The pull-in must finish before the reveal starts (${Math.round(pulled)}ms)`);
  settled();
  move(rift, 0, -240);
  const stopped = drawing();
  pause(600);
  assert.equal(drawing(), stopped, 'The teaser must stop in fancy mode');

  console.log('Rift checks passed: stars inside the opening, reduced motion, pull-in before reveal and fancy-mode stop. Growth and stretch toward the pointer need visual review.');
} finally {
  try { browser('close'); } catch {}
}
