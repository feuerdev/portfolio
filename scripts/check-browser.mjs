import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// Requires agent-browser and a running preview. No browser dependency in the site build.
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5001/';
const session = `portfolio-check-${process.pid}`;
function browser(...args) {
  const result = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8' }));
  assert.ok(result.success, result.error);
  return result.data;
}
const evaluate = code => browser('eval', code).result;
const settled = () => browser('wait', '--fn', '!document.querySelector("#mode-toggle").disabled && !document.querySelector(".page-reveal")');
const holdTransition = () => evaluate('document.startViewTransition = update => { window.finishSwitch = update; return { ready: new Promise(resolve => window.readySwitch = resolve), finished: new Promise(resolve => window.endSwitch = resolve) }; }');
const finishTransition = () => {
  evaluate('window.finishSwitch(); window.readySwitch(); window.endSwitch()');
  settled();
};
try {
  browser('set', 'viewport', '1440', '1000');
  browser('set', 'media', 'light', 'no-preference');
  browser('open', base);
  assert.equal(evaluate('document.documentElement.classList.contains("fancy")'), false);
  assert.equal(evaluate('document.querySelectorAll("article h3").length'), 6);
  assert.equal(evaluate('performance.getEntriesByType("resource").filter(r => /\\.(png|webp|svg|woff2)$/.test(r.name) && !r.name.endsWith("/favicon.svg")).length'), 0, 'Plain mode must not fetch project artwork or fancy fonts');
  assert.equal(evaluate('performance.getEntriesByType("resource").some(r => ["fancy.js", "space.js", "page-reveal.js"].includes(new URL(r.name).pathname.split("/").at(-1)))'), false, 'Plain mode must not load the full scene');

  // Fonts must be ready before capture, while formation overlaps the reveal.
  evaluate(`window.releaseFonts = [];
    const load = document.fonts.load.bind(document.fonts);
    document.fonts.load = (...args) => new Promise(resolve => window.releaseFonts.push(() => resolve(load(...args))));`);
  holdTransition();
  browser('click', '#mode-toggle');
  browser('wait', '--fn', 'document.styleSheets.length === 2');
  assert.equal(evaluate('typeof window.finishSwitch'), 'undefined');
  evaluate('window.releaseFonts.forEach(release => release())');
  browser('wait', '--fn', 'typeof window.finishSwitch === "function"');
  assert.ok(evaluate('[...document.fonts].every(font => font.status === "loaded")'));
  evaluate('window.finishSwitch(); window.readySwitch()');
  evaluate('window.capture = document.querySelector("#curiosity").toDataURL()');
  browser('wait', '--fn', 'document.querySelector("#curiosity").toDataURL() !== window.capture');
  assert.equal(evaluate('document.querySelector("#mode-toggle").disabled'), true, 'Formation should already run while the reveal is unfinished');
  evaluate('window.endSwitch()');
  settled();
  assert.equal(evaluate('document.activeElement.id'), 'plain-toggle', 'Keyboard focus must move to the available return action');

  browser('open', base);
  browser('network', 'route', '**/*.woff2', '--abort');
  evaluate('document.startViewTransition = undefined');
  browser('click', '#mode-toggle');
  settled();
  assert.ok(evaluate('[...document.fonts].some(font => font.status === "error")'));
  assert.equal(browser('get', 'text', '#mode-status').text, 'Fancy mode on.');
  evaluate('window.capture = document.querySelector("#curiosity").toDataURL()');
  browser('wait', '--fn', 'document.querySelector("#curiosity").toDataURL() !== window.capture');
  browser('network', 'unroute', '**/*.woff2');

  browser('open', base);
  evaluate(`window.transitionWarnings = [];
    console.warn = (...args) => window.transitionWarnings.push(args[0]);
    document.startViewTransition = update => {
      update();
      return { ready: Promise.reject(new Error('Viewport size changed')), finished: Promise.resolve() };
    };`);
  browser('click', '#mode-toggle');
  settled();
  assert.equal(evaluate('window.transitionWarnings.length'), 1);
  assert.equal(evaluate('document.documentElement.dataset.revealResult'), 'skipped');
  assert.equal(browser('get', 'text', '#mode-status').text, 'Fancy mode on.');

  const entry = new URL(base);
  entry.searchParams.set('mode', 'fancy'); entry.searchParams.set('check', 'preserve'); entry.hash = 'keep-mcp';
  browser('set', 'viewport', '390', '400');
  browser('open', entry.href);
  assert.equal(evaluate('document.documentElement.classList.contains("fancy")'), false, 'Legacy fancy URLs must start plain');
  assert.equal(evaluate('new URL(location.href).searchParams.has("mode")'), false);
  assert.equal(evaluate('new URL(location.href).searchParams.get("check")'), 'preserve');
  assert.equal(evaluate('location.hash'), '#keep-mcp');
  evaluate('document.querySelector("#mode-toggle").click()');
  settled();
  assert.ok(Math.abs(evaluate('document.querySelector("#keep-mcp").getBoundingClientRect().top - parseFloat(getComputedStyle(document.querySelector("#keep-mcp")).scrollMarginTop)')) < 2, 'Mode changes should retain the current project');
  assert.equal(evaluate('new URL(location.href).searchParams.has("mode")'), false);
  browser('reload');
  browser('wait', '--fn', '!document.querySelector(".frontend-control").hidden');
  assert.equal(evaluate('document.documentElement.classList.contains("fancy")'), false, 'Refresh must start plain');
  assert.equal(evaluate('location.hash'), '#keep-mcp');

  browser('set', 'viewport', '1440', '1000');
  browser('open', base);
  browser('set', 'offline', 'on');
  browser('click', '#mode-toggle');
  settled();
  assert.equal(evaluate('document.documentElement.classList.contains("fancy")'), false);
  assert.match(browser('get', 'text', '#mode-status').text, /reload/i);
  browser('set', 'offline', 'off');
  browser('click', '#mode-toggle');
  browser('wait', '--fn', '!document.querySelector(".frontend-control").hidden');
  assert.equal(evaluate('document.documentElement.classList.contains("fancy")'), false, 'Recovery reload must also start plain');
  browser('click', '#mode-toggle');
  settled();
  assert.equal(evaluate('document.documentElement.classList.contains("fancy")'), true);

  // A real desktop capture must create its circular wipe and clean up afterwards.
  browser('click', '#plain-toggle'); settled();
  const native = evaluate(`(async () => {
    document.querySelector('#mode-toggle').click();
    for (let n = 0; n < 60; n++) {
      await new Promise(requestAnimationFrame);
      if (document.documentElement.dataset.revealResult === 'running') {
        const style = getComputedStyle(document.documentElement, '::view-transition-new(root)');
        return { name: style.animationName, clip: style.clipPath };
      }
    }
    return null;
  })()`);
  assert.equal(native?.name, 'portfolio-reveal');
  assert.match(native.clip, /circle/);
  settled();
  assert.equal(evaluate('document.documentElement.hasAttribute("data-mode-transition")'), false);
  assert.equal(evaluate('document.documentElement.style.length'), 0, 'Reveal coordinates must not leak onto the root');

  // Reproduce the real phone failure: viewport resize during the mobile wipe.
  browser('set', 'viewport', '411', '783');
  browser('open', base);
  const mask = evaluate(`(async () => {
    document.startViewTransition = () => { throw new Error('Native capture must not run on mobile'); };
    document.querySelector('#mode-toggle').click();
    for (let n = 0; n < 90; n++) {
      await new Promise(requestAnimationFrame);
      const layer = document.querySelector('.page-reveal');
      if (layer && document.documentElement.classList.contains('fancy')) {
        const masks = [];
        for (let frame = 0; frame < 8; frame++) {
          await new Promise(requestAnimationFrame);
          masks.push(getComputedStyle(layer).maskImage);
        }
        return { masks, hidden: layer.getAttribute('aria-hidden'), inert: layer.hasAttribute('inert') };
      }
    }
    return null;
  })()`);
  assert.ok(new Set(mask?.masks).size > 2, 'Mobile reveal must actually advance through intermediate circles');
  assert.match(mask.masks[0], /radial-gradient/);
  assert.equal(mask.hidden, 'true'); assert.equal(mask.inert, true);
  browser('set', 'viewport', '411', '720');
  settled();
  assert.equal(evaluate('document.documentElement.dataset.revealResult'), 'finished', 'Changing viewport must not abort the mobile reveal');
  assert.equal(evaluate('document.activeElement.id'), 'plain-toggle');
  browser('click', '.motion-button');
  assert.equal(evaluate('document.documentElement.dataset.motion'), 'off');
  assert.equal(evaluate('document.querySelector(".motion-button").getAttribute("aria-label")'), 'Play motion');
  browser('click', '.motion-button');
  assert.equal(evaluate('document.documentElement.dataset.motion'), 'on');
  browser('click', '#plain-toggle'); settled();
  assert.equal(evaluate('document.activeElement.id'), 'mode-toggle');

  for (const width of [320, 390]) {
    browser('set', 'viewport', String(width), '700');
    browser('click', '#mode-toggle'); settled();
    browser('scrollintoview', '.footer a');
    assert.ok(evaluate('document.documentElement.scrollWidth <= innerWidth'));
    assert.ok(evaluate('{ const a = document.querySelector(".footer a").getBoundingClientRect(); const b = document.querySelector("#plain-toggle").getBoundingClientRect(); a.right <= b.left || a.bottom <= b.top || a.top >= b.bottom; }'), 'The return action must not block Privacy');
    browser('click', '#plain-toggle'); settled();
    assert.equal(evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  }
  assert.equal(evaluate('document.querySelectorAll(".project-art img").length'), 7, 'Switching must not duplicate artwork');
  browser('set', 'media', 'dark', 'reduced-motion');
  evaluate('document.querySelector("#mode-toggle").click()'); settled();
  assert.equal(evaluate('document.documentElement.dataset.motion'), 'off');
  assert.equal(evaluate('document.querySelector(".motion-button").hidden'), true);
  assert.equal(evaluate('document.documentElement.dataset.revealResult'), 'reduced-motion');
  assert.equal(evaluate('document.querySelector(".page-reveal")'), null);
  browser('click', '#plain-toggle'); settled();

  browser('set', 'viewport', '1440', '1000');
  browser('set', 'media', 'light', 'no-preference');
  browser('open', base); holdTransition();
  browser('click', '#mode-toggle');
  browser('wait', '--fn', 'typeof window.finishSwitch === "function"');
  browser('focus', '#contact a'); finishTransition();
  assert.equal(evaluate('document.activeElement.getAttribute("href")'), 'mailto:jannik@feuer.dev', 'Finishing a switch must preserve a newly focused link');

  browser('network', 'route', '**/js/app.js', '--abort');
  browser('open', base);
  assert.equal(evaluate('document.querySelector(".frontend-control").hidden'), true);
  assert.equal(evaluate('getComputedStyle(document.querySelector(".frontend-fallback")).display'), 'inline');
  assert.equal(evaluate('document.querySelectorAll("article h3").length'), 6);
  browser('network', 'unroute', '**/js/app.js');
  browser('open', new URL('privacy-policy.html', base).href);
  assert.equal(evaluate('document.title'), 'Privacy | Jannik Feuerhahn');
  assert.equal(evaluate('document.querySelectorAll("script, iframe").length'), 0);
  console.log('Browser checks passed: lazy entry, font readiness/failure, formation during reveal, skipped native capture, plain refresh/legacy URLs, offline recovery, native/mobile wipe, viewport resizing, focus, repeated switches, mobile overflow, Pause, reduced motion and script failure.');
} finally {
  browser('set', 'offline', 'off'); browser('close');
}
