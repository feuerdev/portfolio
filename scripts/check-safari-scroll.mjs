import assert from 'node:assert/strict';
import { titleProgress } from './title-state.mjs';
import { execFileSync } from 'node:child_process';

const base = new URL('?mode=plain', process.env.PREVIEW_URL || 'http://127.0.0.1:5001/').href;
const session = `portfolio-safari-scroll-${process.pid}`;
const safari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15';
function browser(...args) {
  const result = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8' }));
  assert.ok(result.success, result.error);
  return result.data;
}
const evaluate = code => browser('eval', code).result;
const exit = () => evaluate(titleProgress);
const settle = () => browser('wait', '--fn', `Math.abs(${titleProgress} - Math.min(1, scrollY / (document.querySelector(".hero").offsetHeight * .85))) < .002`);
function open(asSafari, touchPoints = 0) {
  browser('open', base);
  browser('wait', '--fn', '!document.querySelector(".mode-control").hidden');
  browser('set', 'viewport', '1440', '900');
  browser('set', 'media', 'light', 'no-preference');
  if (asSafari) evaluate(`Object.defineProperty(navigator, 'userAgent', { value: ${JSON.stringify(safari)}, configurable: true });
    Object.defineProperty(navigator, 'vendor', { value: 'Apple Computer, Inc.', configurable: true });
    Object.defineProperty(navigator, 'maxTouchPoints', { value: ${touchPoints}, configurable: true });`);
  browser('click', '#mode-toggle');
  browser('wait', '--fn', 'document.documentElement.classList.contains("fancy") && !document.querySelector("#mode-toggle").disabled');
  evaluate('scrollTo({ top: 0, behavior: "instant" })');
  settle();
  evaluate(`window.scrollScene = { radius: null, history: [] };
    { const context = document.querySelector('#curiosity').getContext('2d');
      const clear = context.clearRect.bind(context), arc = context.arc.bind(context);
      context.clearRect = (...args) => {
        if (window.scrollScene.radius !== null) window.scrollScene.history.push(window.scrollScene.radius);
        window.scrollScene.history = window.scrollScene.history.slice(-20);
        window.scrollScene.radius = null; clear(...args);
      };
      context.arc = (...args) => {
        if (window.scrollScene.radius === null) window.scrollScene.radius = args[2];
        arc(...args);
      };
    }`);
  browser('wait', '--fn', 'window.scrollScene.history.length === 20 && Math.max(...window.scrollScene.history) - Math.min(...window.scrollScene.history) < .00001');
}
// Sample inside the browser so CLI round trips cannot hide intermediate frames.
const step = () => evaluate(`(async () => {
  const target = Math.round(document.querySelector('.hero').offsetHeight * .85 * .4);
  scrollTo({ top: target, behavior: 'instant' });
  const native = scrollY, radiusBefore = window.scrollScene.radius, samples = [];
  for (let i = 0; i < 24; i++) {
    await new Promise(requestAnimationFrame);
    samples.push({ time: performance.now(), radius: window.scrollScene.radius, exit: ${titleProgress} });
  }
  return { native, target, radiusBefore, expected: target / (document.querySelector('.hero').offsetHeight * .85), samples };
})()`);

try {
  open(true);
  const stepped = step();
  assert.equal(stepped.native, stepped.target, 'Smoothing must preserve native page scrolling');
  assert.ok(stepped.samples.slice(0, 5).some(sample => sample.exit > .001 && sample.exit < stepped.expected * .95),
    'Desktop Safari must interpolate a discrete scroll step over multiple frames');
  assert.ok(stepped.samples.slice(0, 5).some(sample => sample.radius > stepped.radiusBefore + .1 && sample.radius < stepped.samples.at(-1).radius - .1),
    'The camera zoom must also interpolate the discrete scroll step');
  assert.ok(stepped.samples.every((sample, i) => !i || sample.exit >= stepped.samples[i - 1].exit), 'Smoothing must not overshoot or reverse');
  assert.ok(Math.abs(stepped.samples.at(-1).exit - stepped.expected) < .002, 'Smoothing must settle promptly after input stops');

  // Reverse before settling. A new target must replace the old one.
  evaluate('scrollTo({ top: 450, behavior: "instant" })');
  evaluate('scrollTo({ top: 0, behavior: "instant" })');
  settle();
  assert.equal(exit(), 0, 'Returning to the top must fully restore the hero');
  browser('click', '.motion-button');
  step();
  assert.ok(Math.abs(exit() - stepped.expected) < .002, 'Paused zoom/name splitting must follow reading position without a smoothing tail');
  evaluate('window.stillCanvas = document.querySelector("#curiosity").toDataURL(); true');
  evaluate('new Promise(resolve => setTimeout(resolve, 100))');
  assert.equal(evaluate('document.querySelector("#curiosity").toDataURL() === window.stillCanvas'), true, 'Pause must stop continuous rendering');
  browser('click', '#mode-toggle');
  browser('wait', '--fn', '!document.documentElement.classList.contains("fancy") && !document.querySelector("#mode-toggle").disabled');
  assert.equal(evaluate('document.querySelector(".hero h1 span").getAnimations().length'), 0, 'Cleanup must remove scroll effects');

  browser('open', base);
  browser('wait', '--fn', '!document.querySelector(".mode-control").hidden');
  browser('set', 'media', 'dark', 'reduced-motion');
  evaluate(`Object.defineProperty(navigator, 'userAgent', { value: ${JSON.stringify(safari)}, configurable: true });
    Object.defineProperty(navigator, 'vendor', { value: 'Apple Computer, Inc.', configurable: true });`);
  browser('click', '#mode-toggle');
  browser('wait', '--fn', 'document.documentElement.dataset.motion === "off" && document.querySelector(".motion-button").hidden');
  evaluate('scrollTo({ top: 600, behavior: "instant" })');
  evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  assert.equal(evaluate('document.querySelector(".hero h1 span").getAnimations().length'), 0, 'Reduced motion must disable scroll effects');
  browser('set', 'media', 'light', 'no-preference');
  // Resuming a visible page must also resync after a motion preference change.
  evaluate('document.dispatchEvent(new Event("visibilitychange"))');
  assert.ok(evaluate(`Math.abs(${titleProgress} - Math.min(1, scrollY / (document.querySelector(".hero").offsetHeight * .85))) < .002`),
    'Resuming motion must restore framing at the current reading position');
  open(false);
  const chrome = step();
  assert.ok(chrome.samples.slice(0, 2).some(sample => Math.abs(sample.exit - chrome.expected) < .002), 'Other browsers must keep direct scroll response');
  open(true, 5);
  const ipad = step();
  assert.ok(ipad.samples.slice(0, 2).some(sample => Math.abs(sample.exit - ipad.expected) < .002), 'iPad desktop user agents must keep direct scroll response');
  assert.equal(browser('errors').errors.length, 0, 'No page errors');
  console.log('Safari scroll checks passed: interpolation, native scrolling, settling, reverse, Pause, reduced motion, cleanup and unchanged Chromium response.');
} catch (error) {
  console.error(evaluate('({ url: location.href, fancy: document.documentElement.classList.contains("fancy"), status: document.querySelector("#mode-status")?.textContent, reduced: matchMedia("(prefers-reduced-motion: reduce)").matches })'), browser('errors'));
  throw error;
} finally { browser('close'); }
