import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5001/';
const session = `portfolio-scroll-${process.pid}`;
function browser(...args) {
  const result = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8' }));
  assert.ok(result.success, result.error);
  return result.data;
}
const evaluate = code => browser('eval', code).result;
const settle = () => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
const centre = id => {
  evaluate(`document.getElementById(${JSON.stringify(id)}).scrollIntoView({ block: 'center', behavior: 'instant' })`);
  settle();
  return evaluate('window.scene.sun');
};
const sameSun = (actual, expected) => {
  assert.ok(actual && expected, 'The sun must remain visible throughout the reading view');
  for (const key of ['x', 'y', 'radius']) assert.ok(Math.abs(actual[key] - expected[key]) < .1, `Sun ${key} must stay steady between projects`);
};
const matchingFraction = (points, reference, tolerance) => points.filter(point => reference.some(other => Math.hypot(point[0] - other[0], point[1] - other[1]) < tolerance)).length / points.length;

try {
  browser('open', new URL('?mode=fancy', base).href);
  browser('set', 'viewport', '1440', '900');
  browser('set', 'media', 'light', 'no-preference');
  browser('wait', '--fn', 'document.documentElement.classList.contains("fancy") && !document.querySelector("#mode-toggle").disabled');
  // Observe real canvas drawing, without exposing test state in the site itself.
  evaluate(`window.scene = { sun: null, points: [], stars: [] }; window.sunHistory = [];
    const context = document.querySelector('#curiosity').getContext('2d');
    const clear = context.clearRect.bind(context), arc = context.arc.bind(context), fill = context.fillRect.bind(context);
    context.clearRect = (...args) => {
      if (window.scene.sun) { window.sunHistory.push(window.scene.sun.radius); window.sunHistory = window.sunHistory.slice(-30); }
      window.scene = { sun: null, points: [], stars: [] }; clear(...args);
    };
    context.arc = (...args) => {
      if (!window.scene.sun) window.scene.sun = { x: args[0], y: args[1], radius: args[2], opacity: context.globalAlpha };
      arc(...args);
    };
    context.fillRect = (x, y, w, h) => {
      if (context.globalCompositeOperation === 'lighter' && w === h && w < 8) window.scene.points.push([x + w / 2, y + h / 2]);
      if (context.globalCompositeOperation === 'source-over' && w === 1.2 && h === 1.2) window.scene.stars.push([x, y]);
      fill(x, y, w, h);
    };`);
  browser('wait', '--fn', 'window.sunHistory.length === 30 && Math.max(...window.sunHistory) - Math.min(...window.sunHistory) < .00001');
  const opening = evaluate('window.scene.sun');
  const openingStars = evaluate('window.scene.stars.map(([x, y]) => [x - window.scene.sun.x, y - window.scene.sun.y])');
  const first = centre('keep-mcp');
  assert.ok(first, 'The reading view must keep the sun in view');
  assert.ok(first.x - first.radius > evaluate('document.querySelector(".project").getBoundingClientRect().right'), 'The bright sun must sit beside the desktop card');
  const firstStars = evaluate('window.scene.stars.map(([x, y]) => [x - window.scene.sun.x, y - window.scene.sun.y])');
  const beforeScroll = evaluate('window.scene.points');
  sameSun(centre('sponsor-detector'), first);
  assert.notDeepEqual(evaluate('window.scene.points'), beforeScroll, 'Scrolling through projects must rotate the particle field');
  const stillPoints = evaluate('window.scene.points');
  const stillStars = evaluate('window.scene.stars');
  evaluate('new Promise(resolve => setTimeout(resolve, 300))');
  const laterPoints = evaluate('window.scene.points');
  assert.deepEqual(evaluate('window.scene.stars'), stillStars, 'The camera must stay settled during automatic rotation');
  const failures = [];
  for (const check of [
    () => assert.ok(matchingFraction(laterPoints, stillPoints, .01) < .5, 'Particles must keep rotating when scrolling stops'),
    () => assert.ok(first.radius / opening.radius >= 1.95 && first.radius / opening.radius <= 2.05, 'The reading view should zoom to about twice the opening size'),
    () => assert.ok(matchingFraction(firstStars, openingStars, 15) < .5, 'The transition must change camera angle, not just zoom and framing')
  ]) { try { check(); } catch (error) { failures.push(error); } }
  if (failures.length) throw new AggregateError(failures, 'Reading-view iteration checks failed');
  sameSun(centre('raytracer'), first);
  assert.notDeepEqual(evaluate('window.scene.stars'), stillStars, 'Scrolling between projects should gently change the viewing angle while keeping the sun anchored');

  evaluate('document.querySelector(".motion-button").click()');
  evaluate('window.pausedScene = document.querySelector("#curiosity").toDataURL(); true');
  centre('big-pond');
  assert.equal(evaluate('document.querySelector("#curiosity").toDataURL() === window.pausedScene'), true, 'Pause must freeze rotation even while scrolling through projects');
  evaluate('scrollTo({ top: 0, behavior: "instant" })');
  settle();
  sameSun(evaluate('window.scene.sun'), opening);
  assert.equal(evaluate('document.querySelector("#curiosity").toDataURL() === window.pausedScene'), false, 'The zoom must reverse when returning to the introduction, even while paused');
  evaluate('document.querySelector(".motion-button").click()');
  centre('sponsor-detector');
  evaluate('window.resumedScene = document.querySelector("#curiosity").toDataURL(); true');
  browser('wait', '--fn', 'document.querySelector("#curiosity").toDataURL() !== window.resumedScene');

  for (const width of [1100, 700, 390, 320]) {
    browser('set', 'viewport', String(width), '844');
    settle();
    const sun = centre('sponsor-detector');
    assert.ok(sun.x > width && sun.x - sun.radius < width, 'Narrow layouts keep a partially cropped sun at the right edge');
    assert.ok(sun.opacity < .5, 'The cropped sun must be dimmer behind narrow cards');
    assert.ok(evaluate('document.documentElement.scrollWidth <= innerWidth'), 'The scene must not introduce horizontal overflow');
    sameSun(centre('raytracer'), sun);
  }
  browser('set', 'media', 'dark', 'reduced-motion');
  browser('open', base);
  browser('open', new URL('?mode=fancy#raytracer', base).href);
  browser('wait', '--fn', 'document.documentElement.dataset.motion === "off" && !document.querySelector("#mode-toggle").disabled');
  settle();
  evaluate('window.reducedScene = document.querySelector("#curiosity").toDataURL(); true');
  evaluate('document.querySelector("#keep-mcp").scrollIntoView({ block: "center", behavior: "instant" })');
  settle();
  assert.equal(evaluate('document.querySelector("#curiosity").toDataURL() === window.reducedScene'), true, 'Reduced motion must remain static while scrolling');
  assert.equal(evaluate('document.querySelector(".motion-button").hidden'), true);
  console.log('Scroll checks passed: steady sun, stronger zoom, camera orbit and scroll angle drift, continuous and scroll-driven rotation, pause, reverse zoom, narrow framing and reduced motion.');
} finally {
  browser('close');
}
