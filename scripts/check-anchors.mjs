import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5001/';
const session = `portfolio-anchors-${process.pid}`;
function browser(...args) {
  const result = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8' }));
  assert.ok(result.success, result.error);
  return result.data;
}
const evaluate = code => browser('eval', code).result;
const ready = () => browser('wait', '--fn', 'document.documentElement.classList.contains("fancy") && !document.querySelector("#mode-toggle").disabled');
function openFancy(hash = '') {
  // Fresh URLs open plain. Activate in place to check that switching preserves
  // the project reached by a direct link.
  browser('open', base);
  browser('open', new URL(`?mode=fancy${hash}`, base).href);
  assert.equal(evaluate('document.documentElement.classList.contains("fancy")'), false, 'Direct URLs must open plain');
  if (hash) {
    assert.equal(evaluate('location.hash'), hash);
    assert.ok(evaluate(`{ const r = document.querySelector(${JSON.stringify(hash)}).getBoundingClientRect(); r.bottom > 0 && r.top < innerHeight; }`), 'A direct plain URL must bring the requested project into view');
  }
  evaluate('document.querySelector("#mode-toggle").click()');
  ready();
}
const navigate = () => evaluate(`(async () => {
  const start = scrollY, frames = [];
  document.querySelector('.contents a[href="#raytracer"]').click();
  for (let n = 0; n < 90; n++) { await new Promise(requestAnimationFrame); frames.push(scrollY); }
  const target = document.querySelector('#raytracer');
  return { start, frames, hash: location.hash, top: target.getBoundingClientRect().top,
    margin: parseFloat(getComputedStyle(target).scrollMarginTop) };
})()`);

try {
  browser('open', base);
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    browser('set', 'viewport', String(width), String(height));
    browser('set', 'media', 'light', 'no-preference');
    openFancy();
    const smooth = navigate(), end = smooth.frames.at(-1);
    assert.equal(smooth.hash, '#raytracer', 'Anchor navigation must retain native URL fragments');
    assert.ok(smooth.frames.some(y => y > smooth.start + 2 && y < end - 2), 'Anchor links must pass through intermediate scroll positions');
    assert.ok(Math.abs(smooth.top - smooth.margin) < 2, 'Anchor destinations must respect the project scroll margin');
    browser('back');
    browser('wait', '--fn', 'location.hash === ""');
    assert.equal(evaluate('document.documentElement.classList.contains("fancy")'), true, 'Back must keep the presentation selected in this visit');
    assert.equal(evaluate('new URL(location.href).searchParams.has("mode")'), false);

    openFancy('#keyboards');
    const arrival = evaluate(`(async () => {
      const positions = [];
      for (let n = 0; n < 12; n++) { await new Promise(requestAnimationFrame); positions.push(scrollY); }
      return { positions, top: document.querySelector('#keyboards').getBoundingClientRect().top,
        margin: parseFloat(getComputedStyle(document.querySelector('#keyboards')).scrollMarginTop) };
    })()`);
    assert.equal(new Set(arrival.positions).size, 1, 'Direct project URLs must arrive without a scrolling tail');
    assert.equal(evaluate('location.hash'), '#keyboards', 'Activating fancy must preserve the direct link');

    browser('set', 'media', 'dark', 'reduced-motion');
    openFancy();
    const reduced = navigate();
    assert.equal(new Set(reduced.frames).size, 1, 'Reduced motion must jump without scrolling animation');
    assert.equal(reduced.hash, '#raytracer', 'Reduced motion must still navigate to the project');
  }
  assert.equal(browser('errors').errors.length, 0, 'Anchor navigation must not cause page errors');
  console.log('Anchor checks passed: smooth desktop/mobile journeys, hashes, Back, direct URLs and reduced motion.');
} finally {
  browser('close');
}
