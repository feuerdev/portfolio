import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5001/';
const session = `portfolio-title-${process.pid}`;
function browser(...args) {
  const result = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8' }));
  assert.ok(result.success, result.error);
  return result.data;
}
const evaluate = code => browser('eval', code).result;
try {
  browser('set', 'device', 'Pixel 7');
  browser('open', new URL('?mode=fancy', base).href);
  browser('wait', '--fn', 'document.documentElement.dataset.motion === "on" && !document.querySelector("#mode-toggle").disabled');
  const result = evaluate(`(async () => {
    const heading = document.querySelector('.hero h1'), words = [...heading.querySelectorAll('span')];
    const threshold = document.querySelector('.hero').offsetHeight * .85;
    let rootWrites = 0;
    const observer = new MutationObserver(records => rootWrites += records.length);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    const samples = [];
    for (const progress of [0, .1, .3, .6, .8, 1, .3, 0]) {
      scrollTo({ top: Math.round(threshold * progress), behavior: 'instant' });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      samples.push({ progress: Math.min(1, scrollY / threshold), opacity: Number(getComputedStyle(heading).opacity),
        x: words.map(word => { const transform = getComputedStyle(word).transform; return transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m41; }) });
    }
    observer.disconnect();
    return { samples, rootWrites, reach: innerWidth * .3 };
  })()`);
  for (const sample of result.samples) {
    assert.ok(Math.abs(sample.opacity - Math.max(0, 1 - sample.progress * 1.3)) < .002, 'Preserve title fade timing');
    assert.ok(Math.abs(sample.x[0] + sample.progress * result.reach) < .2, 'First name must split left');
    assert.ok(Math.abs(sample.x[1] - sample.progress * result.reach) < .2, 'Surname must split right');
  }
  assert.equal(result.rootWrites, 0, 'Title animation must not invalidate styles through an inherited root property');
  browser('set', 'viewport', '844', '390');
  const rotated = evaluate(`(async () => {
    scrollTo({ top: 200, behavior: 'instant' });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return { x: new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.hero h1 span')).transform).m41,
      expected: -Math.min(1, scrollY / (document.querySelector('.hero').offsetHeight * .85)) * innerWidth * .3 };
  })()`);
  assert.ok(Math.abs(rotated.x - rotated.expected) < .2, 'Name split must adapt to orientation width');
  browser('set', 'media', 'dark', 'reduced-motion');
  // CDP updates the preference but does not reliably deliver its change event.
  evaluate('document.dispatchEvent(new Event("visibilitychange")); true');
  browser('wait', '--fn', 'document.documentElement.dataset.motion === "off" && document.querySelector(".motion-button").hidden');
  assert.equal(evaluate('getComputedStyle(document.querySelector(".hero h1")).opacity'), '1');
  assert.equal(evaluate('document.querySelector(".hero h1 span").getAnimations().length'), 0, 'Reduced motion must clear title animations');
  browser('set', 'media', 'dark', 'no-preference');
  evaluate('document.dispatchEvent(new Event("visibilitychange")); true');
  browser('wait', '--fn', 'document.documentElement.dataset.motion === "on" && document.querySelector(".hero h1 span").getAnimations().length === 1');
  browser('click', '#mode-toggle');
  browser('wait', '--fn', '!document.documentElement.classList.contains("fancy") && !document.querySelector("#mode-toggle").disabled');
  assert.equal(evaluate('[...document.querySelectorAll(".hero h1, .hero h1 span")].every(node => node.getAnimations().length === 0 && node.style.willChange === "")'), true, 'Leaving fancy must clear animations and layer hints');
  assert.equal(browser('errors').errors.length, 0);
  console.log('Title checks passed: fade/split appearance, reversible scroll, no inherited root updates, reduced motion and cleanup. Phone cadence needs a new physical capture.');
} finally { browser('close'); }
