import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// Requires agent-browser and a running preview. No browser dependency in the site build.
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5001/';
const session = `portfolio-check-${process.pid}`;
function browser(...args) {
  const output = execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8' });
  const result = JSON.parse(output);
  assert.ok(result.success, result.error);
  return result.data;
}
const evaluate = code => browser('eval', code).result;
// Hold the transition callback to reproduce interaction races deterministically.
const holdTransition = () => evaluate('document.startViewTransition = update => { window.finishSwitch = update; return { ready: new Promise(resolve => window.readySwitch = resolve), finished: new Promise(resolve => window.endSwitch = resolve) }; }');
const finishTransition = () => {
  evaluate('window.finishSwitch(); window.readySwitch(); window.endSwitch()');
  browser('wait', '--fn', '!document.querySelector("#mode-toggle").disabled');
};
try {
  browser('open', base);
  browser('set', 'viewport', '1440', '1000');
  browser('set', 'media', 'light', 'no-preference');
  // Delay font completion without depending on network/cache speed.
  evaluate(`window.releaseFonts = [];
    const load = document.fonts.load.bind(document.fonts);
    document.fonts.load = (...args) => new Promise(resolve => window.releaseFonts.push(() => resolve(load(...args))));`);
  holdTransition();
  browser('click', '#mode-toggle');
  browser('wait', '--fn', 'document.styleSheets.length === 2');
  evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  assert.equal(evaluate('typeof window.finishSwitch'), 'undefined', 'The reveal must wait for font loading');
  evaluate('window.releaseFonts.forEach(release => release())');
  browser('wait', '--fn', 'typeof window.finishSwitch === "function"');
  assert.ok(evaluate('[...document.fonts].every(font => font.status === "loaded")'), 'Both font weights must be ready before the reveal');
  evaluate('window.finishSwitch(); window.readySwitch()');
  // Let initial resize/intersection observations settle, then compare rendered pixels.
  evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  const stillFrame = evaluate('document.querySelector("#curiosity").toDataURL()');
  evaluate('new Promise(resolve => setTimeout(resolve, 200))');
  assert.ok(evaluate('document.querySelector("#curiosity").toDataURL()') === stillFrame, 'The artwork must stay still during the reveal');
  evaluate('window.endSwitch()');
  browser('wait', '--fn', '!document.querySelector("#mode-toggle").disabled');
  evaluate('window.stillFrame = document.querySelector("#curiosity").toDataURL()');
  browser('wait', '--fn', 'document.querySelector("#curiosity").toDataURL() !== window.stillFrame');

  browser('open', base);
  browser('network', 'route', '**/*.woff2', '--abort');
  evaluate('document.startViewTransition = undefined');
  browser('click', '#mode-toggle');
  browser('wait', '--fn', '!document.querySelector("#mode-toggle").disabled');
  assert.ok(evaluate('[...document.fonts].some(font => font.status === "error")'), 'Exercise a real failed font download');
  assert.equal(browser('get', 'text', '#mode-status').text, 'Fancy mode on.', 'Failed fonts must still allow fancy mode without View Transitions');
  evaluate('window.stillFrame = document.querySelector("#curiosity").toDataURL()');
  browser('wait', '--fn', 'document.querySelector("#curiosity").toDataURL() !== window.stillFrame');
  browser('network', 'unroute', '**/*.woff2');

  browser('open', base);
  evaluate(`window.transitionWarnings = [];
    console.warn = (...args) => window.transitionWarnings.push(args[0]);
    document.startViewTransition = update => {
      update();
      return { ready: Promise.reject(new Error('Skipped for testing')), finished: Promise.resolve() };
    };`);
  browser('click', '#mode-toggle');
  browser('wait', '--fn', '!document.querySelector("#mode-toggle").disabled');
  assert.equal(evaluate('window.transitionWarnings.length'), 1, 'A skipped reveal must leave a diagnostic warning');
  assert.equal(browser('get', 'text', '#mode-status').text, 'Fancy mode on.', 'A skipped reveal must still complete the mode switch');
  evaluate('window.stillFrame = document.querySelector("#curiosity").toDataURL()');
  browser('wait', '--fn', 'document.querySelector("#curiosity").toDataURL() !== window.stillFrame');

  const entry = new URL(base);
  entry.searchParams.set('check', 'preserve');
  entry.hash = 'top';
  browser('open', entry.href);
  assert.equal(evaluate('document.querySelectorAll("article h3").length'), 6, 'Projects must support heading navigation');
  assert.equal(evaluate('performance.getEntriesByType("resource").filter(r => /\\.(png|webp|svg)$/.test(r.name) && !r.name.endsWith("/favicon.svg")).length'), 0, 'Plain mode must not fetch project artwork');
  browser('set', 'viewport', '390', '844');
  const headingTop = evaluate('document.querySelector("h1").getBoundingClientRect().top');
  const withoutControl = evaluate('document.querySelector(".mode-control").hidden = true; document.querySelector("h1").getBoundingClientRect().top');
  assert.equal(headingTop, withoutControl, 'The mobile switch must not push the introduction down');
  evaluate('document.querySelector(".mode-control").hidden = false');

  browser('set', 'offline', 'on');
  browser('click', '#mode-toggle');
  browser('wait', '--fn', '!document.querySelector("#mode-toggle").disabled');
  assert.equal(evaluate('document.documentElement.classList.contains("fancy")'), false);
  assert.match(browser('get', 'text', '#mode-status').text, /reload/i, 'A failed download must offer reload recovery');
  browser('set', 'offline', 'off');
  browser('click', '#mode-toggle');
  browser('wait', '--fn', 'document.documentElement.classList.contains("fancy")');
  assert.equal(evaluate('new URL(location.href).searchParams.get("mode")'), 'fancy');
  assert.equal(evaluate('new URL(location.href).searchParams.get("check")'), 'preserve');
  assert.equal(evaluate('location.hash'), '#top');

  // Capture the real transition keyframes to check the reveal starts at the clicked button.
  browser('set', 'media', 'light', 'no-preference');
  evaluate('window.transitionFrames = null; const original = Element.prototype.animate; Element.prototype.animate = function(frames, options) { if (options?.pseudoElement === "::view-transition-new(root)") window.transitionFrames = frames; return original.call(this, frames, options); };');
  const centre = evaluate('const r = document.querySelector("#mode-toggle").getBoundingClientRect(); ({x:r.x+r.width/2,y:r.y+r.height/2})');
  browser('click', '#mode-toggle');
  browser('wait', '--fn', '!document.querySelector("#mode-toggle").disabled');
  const frames = evaluate('window.transitionFrames');
  assert.ok(frames, 'Mode switching should animate from the control when View Transitions are supported');
  assert.equal(frames[0].clipPath, `circle(0px at ${centre.x}px ${centre.y}px)`);
  assert.equal(evaluate('document.documentElement.classList.contains("fancy")'), false);
  for (const width of [320, 390]) {
    browser('set', 'viewport', String(width), '700');
    browser('scrollintoview', '.footer a');
    assert.ok(evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile content must fit the viewport');
    assert.ok(evaluate('{ const a = document.querySelector(".footer a").getBoundingClientRect(); const b = document.querySelector("#mode-toggle").getBoundingClientRect(); a.right <= b.left || a.bottom <= b.top || a.top >= b.bottom; }'), 'The floating control must leave the footer link reachable');
  }
  browser('set', 'media', 'dark', 'reduced-motion');
  browser('click', '#mode-toggle');
  browser('wait', '--fn', '!document.querySelector("#mode-toggle").disabled');
  assert.equal(evaluate('document.documentElement.dataset.motion'), 'off');
  assert.equal(evaluate('document.querySelector(".motion-button").hidden'), true);
  assert.equal(evaluate('document.querySelectorAll(".project-art img").length'), 7, 'Repeated toggles must not duplicate artwork');

  browser('open', base);
  browser('set', 'media', 'light', 'no-preference');
  holdTransition();
  browser('click', '#mode-toggle');
  browser('wait', '--fn', 'typeof window.finishSwitch === "function"');
  browser('focus', '#contact a');
  finishTransition();
  assert.equal(evaluate('document.activeElement.getAttribute("href")'), 'mailto:jannik@feuer.dev', 'Finishing a switch must preserve a newly focused link');

  browser('open', base);
  browser('focus', '.skip-link');
  browser('press', 'Enter');
  holdTransition();
  browser('click', '#mode-toggle');
  browser('wait', '--fn', 'typeof window.finishSwitch === "function"');
  browser('back');
  browser('wait', '--fn', 'location.hash === ""');
  finishTransition();
  assert.equal(evaluate('new URL(location.href).searchParams.has("mode")'), false, 'A pending switch must not overwrite Back navigation');
  assert.equal(evaluate('document.documentElement.classList.contains("fancy")'), false);

  browser('open', new URL('privacy-policy.html', base).href);
  assert.equal(evaluate('document.title'), 'Privacy | Jannik Feuerhahn');
  assert.equal(evaluate('document.querySelectorAll("script, iframe").length'), 0);
  console.log('Browser checks passed: font readiness/failure, deferred motion, skipped transitions, mobile placement, offline recovery, URL state, transition origin, focus, Back navigation, headings, lazy artwork, reduced motion and privacy page.');
} finally {
  browser('set', 'offline', 'off');
  browser('close');
}
