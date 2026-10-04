import assert from 'node:assert/strict';
import { titleProgress } from './title-state.mjs';
import { execFileSync } from 'node:child_process';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5001/';
const session = `portfolio-mobile-viewport-${process.pid}`;
function browser(...args) {
  const result = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8' }));
  assert.ok(result.success, result.error);
  return result.data;
}
const evaluate = code => browser('eval', code).result;
try {
  browser('set', 'device', 'Pixel 7');
  browser('open', new URL('?mode=fancy', base).href);
  evaluate('document.querySelector("#mode-toggle").click()');
  browser('wait', '--fn', 'document.documentElement.dataset.motion === "on" && !document.querySelector("#mode-toggle").disabled && document.querySelector("#curiosity").style.opacity === "1"');
  evaluate(`window.sunGeometry = null;
    const context = document.querySelector('#curiosity').getContext('2d');
    const originalArc = context.arc.bind(context);
    context.arc = (...args) => { window.sunGeometry = args.slice(0, 3); originalArc(...args); };
    scrollTo({ top: 250, behavior: 'instant' });
    true;`);
  evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  evaluate('document.querySelector(".motion-button").click(); true;');
  const measure = `(() => {
    const canvas = document.querySelector('#curiosity');
    return { height: canvas.clientHeight, width: canvas.clientWidth, backingHeight: canvas.height,
      sun: window.sunGeometry, scroll: scrollY, title: ${titleProgress}, pixels: canvas.toDataURL() };
  })()`;
  const before = evaluate(measure);
  // Model the visible fixed container losing 80px to browser controls while
  // the document/large viewport stays unchanged. Desktop emulation has no toolbar.
  evaluate('document.querySelector(".hero-art").style.bottom = "80px"; true;');
  evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  const withControls = evaluate(measure);
  assert.equal(withControls.scroll, before.scroll, 'Isolate viewport resizing from native page movement');
  assert.equal(withControls.height, before.height, 'Browser controls must not resize the universe canvas');
  assert.equal(withControls.backingHeight, before.backingHeight, 'Toolbar motion must not reallocate the canvas');
  assert.deepEqual(withControls.sun, before.sun, 'Toolbar motion must not change camera framing or zoom');
  assert.equal(withControls.title, before.title, 'Toolbar motion must not split the title further');
  assert.equal(withControls.pixels, before.pixels, 'A paused universe must stay identical when controls change');
  evaluate('document.querySelector(".hero-art").style.removeProperty("bottom"); true;');
  browser('set', 'viewport', '844', '390');
  browser('wait', '--fn', 'document.querySelector("#curiosity").clientWidth === innerWidth && document.querySelector("#curiosity").clientHeight === innerHeight');
  assert.equal(browser('errors').errors.length, 0);
  console.log('Mobile viewport checks passed: stable canvas/camera/title under simulated toolbar insets, plus real orientation resizing. Android toolbar behavior still needs phone review.');
} finally { browser('close'); }
