import assert from 'node:assert/strict';
import { titleProgress } from './title-state.mjs';
import { execFileSync } from 'node:child_process';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5001/';
const session = `portfolio-scroll-timing-${process.pid}`;
function browser(...args) {
  const result = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8' }));
  assert.ok(result.success, result.error);
  return result.data;
}
const evaluate = code => browser('eval', code).result;

try {
  browser('open', new URL('?mode=plain', base).href);
  browser('set', 'viewport', '390', '844');
  browser('set', 'media', 'light', 'no-preference');
  evaluate(`Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36', configurable: true });
    Object.defineProperty(navigator, 'vendor', { value: 'Google Inc.', configurable: true });
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true });`);
  browser('click', '#mode-toggle');
  browser('wait', '--fn', 'document.documentElement.dataset.motion === "on" && !document.querySelector("#mode-toggle").disabled && document.querySelector("#curiosity").style.opacity === "1"');
  const samples = evaluate(`(async () => {
    const context = document.querySelector('#curiosity').getContext('2d');
    const clear = context.clearRect.bind(context), arc = context.arc.bind(context);
    const frames = [];
    let current;
    context.clearRect = (...args) => {
      current = { y: scrollY, exit: ${titleProgress}, radius: null };
      frames.push(current); clear(...args);
    };
    context.arc = (...args) => { if (current && current.radius === null) current.radius = args[2]; arc(...args); };
    const threshold = document.querySelector('.hero').offsetHeight * .85;
    // Deliver changing native positions ahead of the pending scene frame. A
    // separate scroll RAF scheduled behind that frame must not delay its camera.
    for (let i = 0; i < 12; i++) {
      scrollTo({ top: Math.round(threshold * (i % 2 ? .55 : .15)), behavior: 'instant' });
      dispatchEvent(new Event('scroll'));
      await new Promise(requestAnimationFrame);
    }
    context.clearRect = clear; context.arc = arc;
    return { frames, threshold };
  })()`);
  assert.ok(samples.frames.length >= 10, 'Exercise consecutive scene frames while the native scroll position changes');
  assert.ok(samples.frames.every(frame => Math.abs(frame.exit - frame.y / samples.threshold) < .002),
    'Android Chrome must apply the current scroll position before drawing each universe frame');
  for (const frame of samples.frames) assert.ok(frame.radius > 0, 'Scroll updates must keep rendering the sun');
  const low = samples.frames.filter(frame => frame.y < samples.threshold * .3).map(frame => frame.radius);
  const high = samples.frames.filter(frame => frame.y > samples.threshold * .3).map(frame => frame.radius);
  assert.ok(Math.min(...high) > Math.max(...low), 'The camera zoom must match the same frame as the title and native position');
  assert.equal(browser('errors').errors.length, 0);
  console.log('Scroll timing checks passed: Android identification, current-frame title/camera response and continuous drawing. This emulates timing in Chromium, not physical phone scrolling.');
} finally {
  browser('close');
}
