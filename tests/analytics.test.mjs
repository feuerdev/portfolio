import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

const source = (await readFile(new URL('../public/js/analytics.js', import.meta.url), 'utf8'))
  .replace(/^export /gm, '');
const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');

function page({ url = 'https://feuer.dev/?private=secret&utm_source=secret#secret', navigator = {}, windowDNT, visibility = 'visible', referrer = 'https://example.org/private?secret=1#secret' } = {}) {
  const scripts = [];
  const hits = [];
  const links = [...html.matchAll(/<a[^>]+data-goatcounter-click="([^"]+)"[^>]+data-goatcounter-title="([^"]+)"/g)].map(([, path, title]) => {
    const link = new EventTarget();
    link.dataset = { goatcounterClick: path, goatcounterTitle: title };
    return link;
  });
  const document = Object.assign(new EventTarget(), {
    title: 'Jannik Feuerhahn | Software engineer', referrer, visibilityState: visibility,
    head: { append: script => scripts.push(script) },
    createElement: () => ({ dataset: {} }),
    querySelectorAll: () => links,
  });
  const context = vm.createContext({ document, navigator, location: new URL(url), URL });
  context.window = context;
  context.doNotTrack = windowDNT;
  vm.runInContext(source, context);
  function load() {
    assert.equal(scripts.length, 1, 'The tracker must be loaded asynchronously on production');
    const counter = context.goatcounter;
    assert.equal(counter.no_onload, true, 'Sanitization must precede the first hit');
    Object.assign(counter, {
      get_data: (vars = {}) => ({
        p: vars.path ?? context.location.pathname + context.location.search,
        t: vars.title ?? document.title,
        r: vars.referrer ?? document.referrer,
        e: !!vars.event, s: 1440, b: 0, q: context.location.search,
        ...(vars.no_session ? { ns: vars.no_session } : {}),
      }),
      count: vars => hits.push(counter.get_data(vars)),
    });
    scripts[0].onload();
  }
  return { context, document, scripts, hits, links, load };
}

test('DNT and GPC prevent even the tracker download', () => {
  for (const navigator of [{ doNotTrack: '1' }, { doNotTrack: 'yes' }, { globalPrivacyControl: true }]) {
    assert.equal(page({ navigator }).scripts.length, 0);
  }
  assert.equal(page({ windowDNT: '1' }).scripts.length, 0);
  assert.equal(page({ navigator: { doNotTrack: '0' }, windowDNT: '1' }).scripts.length, 0);
  const optedOut = page({ windowDNT: '1' });
  optedOut.context.countEvent('contact-email', 'Email');
  assert.equal(optedOut.hits.length, 0);
});

test('only the production homepage loads the hosted tracker', () => {
  for (const url of ['http://127.0.0.1:5001/', 'https://feuerdev.github.io/portfolio/', 'https://preview.example/', 'https://feuer.dev/privacy-policy.html', 'http://feuer.dev/']) {
    assert.equal(page({ url }).scripts.length, 0, url);
  }
  for (const url of ['https://feuer.dev/', 'https://feuer.dev/index.html']) {
    const current = page({ url });
    assert.equal(current.scripts.length, 1);
    assert.equal(current.scripts[0].src, 'https://gc.zgo.at/count.js');
    assert.equal(current.scripts[0].dataset.goatcounter, 'https://feuerdev.goatcounter.com/count');
    assert.equal(current.scripts[0].async, true);
    assert.equal(current.scripts[0].referrerPolicy, 'no-referrer');
  }
});

test('visits strip queries, fragments and referring paths before transmission', () => {
  const current = page();
  current.load();
  assert.equal(current.hits.length, 1);
  const hit = current.hits[0];
  assert.equal(hit.p, '/');
  assert.equal(hit.q, '');
  assert.equal(hit.r, 'https://example.org');
  assert.equal(hit.e, false);
  assert.equal(hit.s, 1440);
  assert.equal(hit.ns, undefined);
  assert.doesNotMatch(JSON.stringify(hit), /secret|private|utm_/);
  for (const referrer of ['', 'not a URL', 'file:///private', 'https://example.org:8443/private']) {
    const other = page({ referrer });
    other.load();
    assert.equal(other.hits[0].r, referrer.startsWith('https:') ? 'https://example.org:8443' : '');
  }
});

test('a hidden load counts once when visible, even after later tab switches', () => {
  const current = page({ visibility: 'hidden' });
  current.load();
  assert.equal(current.hits.length, 0);
  current.document.visibilityState = 'visible';
  current.document.dispatchEvent(new Event('visibilitychange'));
  current.document.visibilityState = 'hidden';
  current.document.dispatchEvent(new Event('visibilitychange'));
  current.document.visibilityState = 'visible';
  current.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(current.hits.length, 1);
});

test('every project/contact activation uses its stable event and leaves navigation alone', () => {
  const current = page();
  current.load();
  for (const link of current.links) {
    const click = new Event('click', { cancelable: true });
    assert.equal(link.dispatchEvent(click), true);
    const hit = current.hits.at(-1);
    assert.equal(hit.p, link.dataset.goatcounterClick);
    assert.equal(hit.t, link.dataset.goatcounterTitle);
    assert.equal(hit.e, true);
    assert.equal(hit.r, '');
    assert.equal(hit.q, '');
    assert.equal(hit.ns, undefined);
  }
  const count = current.hits.length;
  current.links[0].dispatchEvent(Object.assign(new Event('auxclick'), { button: 2 }));
  assert.equal(current.hits.length, count, 'Right-click is not link activation');
  current.links[0].dispatchEvent(Object.assign(new Event('auxclick'), { button: 1 }));
  assert.equal(current.hits.length, count + 1, 'Middle-click activates a native link');
});

test('mode events keep the original page count and session deduplication', () => {
  const current = page();
  current.load();
  current.document.dispatchEvent(new CustomEvent('portfolio-mode-change', { detail: true }));
  current.document.dispatchEvent(new CustomEvent('portfolio-mode-change', { detail: false }));
  assert.equal(current.hits.filter(hit => !hit.e).length, 1);
  assert.deepEqual(current.hits.slice(1).map(hit => hit.p), ['mode-fancy', 'mode-plain']);
  assert.ok(current.hits.every(hit => hit.ns === undefined));
});

test('early clicks and tracker errors never throw or queue events', () => {
  const current = page();
  assert.doesNotThrow(() => current.context.countEvent('contact-email', 'Email'));
  current.load();
  assert.equal(current.hits.length, 1, 'The early event must not be replayed');
  current.context.goatcounter.count = () => { throw new Error('blocked'); };
  assert.doesNotThrow(() => current.context.countEvent('mode-fancy', 'Fancy mode'));
  assert.equal(current.links[0].dispatchEvent(new Event('click', { cancelable: true })), true);
});

test('privacy preferences are rechecked if they change during or after loading', () => {
  const during = page();
  during.context.navigator.globalPrivacyControl = true;
  during.load();
  assert.equal(during.hits.length, 0);
  const after = page();
  after.load();
  after.context.navigator.doNotTrack = '1';
  after.links[0].dispatchEvent(new Event('click'));
  after.context.countEvent('mode-fancy', 'Fancy mode');
  assert.equal(after.hits.length, 1);
});
