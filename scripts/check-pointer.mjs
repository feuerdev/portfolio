import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5001/';
const session = `portfolio-pointer-${process.pid}`;
function browser(...args) {
  const result = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8' }));
  assert.ok(result.success, result.error);
  return result.data;
}
const evaluate = code => browser('eval', code).result;

try {
  browser('open', base);
  const result = evaluate(`(async () => {
    const { createSpace } = await import('/js/space.js');
    const random = Math.random;
    const values = [.25, 0, .5, .25, .5, .25, 1, 0, .99, 0];
    let index = 0, space;
    try {
      Math.random = () => values[index++] ?? .25;
      space = createSpace(1 / 4200);
    } finally { Math.random = random; }
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 600;
    const context = canvas.getContext('2d');
    let point;
    const image = context.drawImage.bind(context);
    context.drawImage = (sprite, x, y, w, h) => {
      point = [x + w / 2, y + h / 2, w, h];
      image(sprite, x, y, w, h);
    };
    const shot = space.overview(1.55, 0, .5, .5, -.24);
    const render = (wake, elapsed = 0) => {
      space.render(context, 600, 600, 1, 0, shot, -1, 1, 1, wake, elapsed);
      return [...point];
    };
    const baseline = render();
    // Sweep through a real particle. It should keep moving after input ends,
    // with ordinary sprite brightness and no content-dependent exclusion.
    const wake = { fromX: baseline[0] - 70, fromY: baseline[1] - 25,
      x: baseline[0] + 50, y: baseline[1] - 25, radius: 110 };
    render(wake, 1 / 60);
    const displaced = render(undefined, 1 / 60);
    const drifting = render(undefined, 1 / 60);
    const frozen = render();
    const stationary = render({ ...wake, fromX: wake.x, fromY: wake.y });
    for (let n = 0; n < 600; n++) render(undefined, 1 / 60);
    const settled = render();
    for (let n = 0; n < 120; n++) render(undefined, 1 / 60);
    return { baseline, displaced, drifting, frozen, stationary, settled, later: render() };
  })()`);
  assert.ok(result.displaced[0] > result.baseline[0] + 1, 'A moving pointer must give particles momentum');
  assert.ok(result.drifting[0] > result.displaced[0], 'Particles must keep drifting after the pointer stops');
  assert.deepEqual(result.frozen, result.drifting, 'Drawing without elapsed time must freeze the wake');
  assert.deepEqual(result.stationary, result.frozen, 'A stationary pointer must not create a force bubble');
  assert.ok(Math.abs(result.displaced[2] - result.baseline[2]) < result.baseline[2] * .05, 'The wake must not add a hover size boost');
  assert.ok(Math.hypot(result.settled[0] - result.baseline[0], result.settled[1] - result.baseline[1]) > 5, 'A swipe must leave particles in a new orbital position');
  assert.ok(Math.hypot(result.later[0] - result.settled[0], result.later[1] - result.settled[1]) < .5, 'Orbital speed must settle without restoring the old spacing');

  browser('set', 'viewport', '1440', '900');
  browser('set', 'media', 'light', 'no-preference');
  browser('open', new URL('?mode=fancy', base).href);
  browser('wait', '--fn', 'document.documentElement.dataset.motion === "on" && !document.querySelector("#mode-toggle").disabled');
  evaluate(`document.querySelector('.project').scrollIntoView({ block: 'center', behavior: 'instant' });
    window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 1140, clientY: 340 }));
    window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 1270, clientY: 340 }));`);
  // Allow the wake to move before freezing it.
  evaluate('new Promise(resolve => setTimeout(resolve, 400))');
  browser('focus', '.motion-button');
  browser('press', 'Space');
  const paused = evaluate('window.pointerPaused = document.querySelector("#curiosity").toDataURL()');
  evaluate(`window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 1100, clientY: 600 }));
    document.documentElement.dispatchEvent(new PointerEvent('pointerleave'));
    window.dispatchEvent(new Event('blur'));`);
  evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  assert.equal(evaluate('document.querySelector("#curiosity").toDataURL()'), paused, 'Pointer movement/departure must not redraw a paused scene');
  browser('press', 'Space');
  evaluate(`window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 1270, clientY: 340 }));`);
  browser('wait', '--fn', 'document.querySelector("#curiosity").toDataURL() !== window.pointerPaused');
  browser('set', 'media', 'dark', 'reduced-motion');
  const reduced = evaluate('document.querySelector("#curiosity").toDataURL()');
  evaluate(`window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 1250, clientY: 350 }));`);
  evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  assert.equal(evaluate('document.querySelector("#curiosity").toDataURL()'), reduced, 'Reduced motion must ignore the pointer');
  browser('set', 'viewport', '390', '844');
  browser('set', 'media', 'light', 'no-preference');
  browser('open', new URL('?mode=fancy', base).href);
  browser('wait', '--fn', 'document.documentElement.dataset.motion === "on" && !document.querySelector("#mode-toggle").disabled');
  evaluate('new Promise(resolve => setTimeout(resolve, 2600))');
  // Hold only the animation timestamp, leaving actual frames and pointer listeners
  // running. Ordinary rotation must not hide a touch-triggered scene change.
  evaluate(`window.nativeFrame = requestAnimationFrame;
    const fixedTime = performance.now();
    window.requestAnimationFrame = callback => window.nativeFrame(() => callback(fixedTime));
    new Promise(resolve => window.nativeFrame(() => window.nativeFrame(() => window.nativeFrame(resolve))));`);
  const touch = evaluate('document.querySelector("#curiosity").toDataURL()');
  evaluate(`window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'touch', clientX: 300, clientY: 240 }));`);
  evaluate('new Promise(resolve => window.nativeFrame(() => window.nativeFrame(resolve)))');
  assert.equal(evaluate('document.querySelector("#curiosity").toDataURL()'), touch, 'Touch input must leave the scene unchanged');
  evaluate('window.requestAnimationFrame = window.nativeFrame');
  browser('click', '#mode-toggle');
  browser('wait', '--fn', '!document.documentElement.classList.contains("fancy") && !document.querySelector("#mode-toggle").disabled');
  const plain = evaluate('document.querySelector("#curiosity").toDataURL()');
  evaluate(`window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 300, clientY: 240 }));`);
  assert.equal(evaluate('document.querySelector("#curiosity").toDataURL()'), plain, 'Leaving fancy mode must stop pointer rendering');
  console.log('Pointer checks passed: orbital momentum, lasting spacing, speed settling, stationary pointer, Pause/resume, reduced motion, touch and cleanup.');
} finally {
  browser('close');
}
