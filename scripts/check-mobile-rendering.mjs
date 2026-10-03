import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5001/';
const session = `portfolio-mobile-rendering-${process.pid}`;
function browser(...args) {
  const result = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8' }));
  assert.ok(result.success, result.error);
  return result.data;
}
const evaluate = code => browser('eval', code).result;
try {
  browser('set', 'viewport', '390', '844');
  browser('open', new URL('?mode=plain', base).href);
  evaluate(`window.originalMedia = matchMedia;
    window.mouseMedia = originalMedia('(width: 0px)');
    window.hasMouse = false;
    Object.defineProperty(mouseMedia, 'matches', { get: () => hasMouse });
    window.matchMedia = query => query.includes('any-pointer: fine') ? mouseMedia : originalMedia(query);
    Object.defineProperty(window, 'devicePixelRatio', { value: 3 }); true;`);
  browser('click', '#mode-toggle');
  browser('wait', '--fn', 'document.documentElement.dataset.motion === "on" && !document.querySelector("#mode-toggle").disabled');
  const dimensions = evaluate(`(() => {
    const canvas = document.querySelector('#curiosity');
    return { width: canvas.width, height: canvas.height, cssWidth: canvas.clientWidth, cssHeight: canvas.clientHeight };
  })()`);
  const physics = evaluate(`(async () => {
    const { createSpace } = await import('/js/space.js');
    const random = Math.random, values = [.25, 0, .5, .25, .5, .25, 1, 0, .99, 0];
    let index = 0, space;
    try { Math.random = () => values[index++] ?? .25; space = createSpace(1 / 4200, false); }
    finally { Math.random = random; }
    const context = document.createElement('canvas').getContext('2d');
    let point;
    const image = context.drawImage.bind(context);
    context.drawImage = (sprite, x, y, w, h) => { point = [x + w / 2, y + h / 2]; image(sprite, x, y, w, h); };
    const shot = space.overview(1.55, 0, .5, .5, -.24);
    const render = wake => { space.render(context, 600, 600, 1, 0, shot, -1, 1, 1, wake, 1 / 60); return [...point]; };
    const baseline = render();
    const wake = { fromX: baseline[0] - 70, fromY: baseline[1] - 25, x: baseline[0] + 50, y: baseline[1] - 25, radius: 110 };
    render(wake);
    const disabled = render();
    space.setPointerEnabled?.(true);
    render(wake);
    const enabled = render();
    space.setPointerEnabled?.(false);
    const reset = render();
    return { baseline, disabled, enabled, reset };
  })()`);
  const failures = [];
  if (dimensions.width !== Math.round(dimensions.cssWidth * 1.5) || dimensions.height !== Math.round(dimensions.cssHeight * 1.5)) failures.push('Touch-only canvas must retain the original 1.5x backing-resolution cap');
  if (JSON.stringify(physics.disabled) !== JSON.stringify(physics.baseline)) failures.push('Disabled pointer physics must ignore wake forces');
  if (Math.hypot(...physics.enabled.map((v, i) => v - physics.baseline[i])) < 1) failures.push('Connecting a mouse must enable pointer physics');
  if (JSON.stringify(physics.reset) !== JSON.stringify(physics.baseline)) failures.push('Disabling pointer physics must discard residual displacement');
  assert.deepEqual(failures, []);
  evaluate('window.hasMouse = true; mouseMedia.dispatchEvent(new Event("change"));');
  browser('wait', '--fn', 'document.querySelector("#curiosity").width === Math.round(document.querySelector("#curiosity").clientWidth * 1.5)');
  evaluate('window.hasMouse = false; mouseMedia.dispatchEvent(new Event("change"));');
  browser('wait', '--fn', 'document.querySelector("#curiosity").width === Math.round(document.querySelector("#curiosity").clientWidth * 1.5)');
  assert.equal(browser('errors').errors.length, 0);
  console.log('Mobile rendering checks passed: original resolution, inactive physics, mouse connection and cleanup. Physical touch scrolling still needs phone review.');
} finally { browser('close'); }
