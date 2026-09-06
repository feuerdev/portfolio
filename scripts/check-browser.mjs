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
try {
  const entry = new URL(base);
  entry.searchParams.set('check', 'preserve');
  entry.hash = 'top';
  browser('open', entry.href);
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
  browser('open', new URL('privacy-policy.html', base).href);
  assert.equal(evaluate('document.title'), 'Privacy | Jannik Feuerhahn');
  assert.equal(evaluate('document.querySelectorAll("script, iframe").length'), 0);
  console.log('Browser checks passed: mobile placement, offline recovery, URL state, transition origin, reduced motion and privacy page.');
} finally {
  browser('set', 'offline', 'off');
  browser('close');
}
