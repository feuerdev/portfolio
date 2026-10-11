import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const publicDirectory = new URL('../public/', import.meta.url);

test('homepage links and assets work at both a custom domain and a Pages project URL', async () => {
  const html = await readFile(new URL('index.html', publicDirectory), 'utf8');
  const references = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]);

  for (const pathname of ['/', '/portfolio/']) {
    const base = new URL(pathname, 'https://example.test');
    for (const reference of references) {
      const target = new URL(reference, base);
      if (target.origin !== base.origin) continue;
      assert.ok(target.pathname.startsWith(base.pathname), `${reference} escapes the hosting path ${pathname}`);
      const relativePath = target.pathname.slice(base.pathname.length) || 'index.html';
      const file = new URL(relativePath, publicDirectory);
      assert.ok((await stat(file)).isFile(), `Missing local file: ${fileURLToPath(file)}`);
    }
  }
});

test('all existing policy and terms URLs have published HTML files', async () => {
  for (const name of ['privacy-policy.html', 'bigpond-privacy.html', 'bigpond-tos.html', 'impfalarm-privacy.html', 'impfalarm-tos.html']) {
    const html = await readFile(new URL(name, publicDirectory), 'utf8');
    assert.ok(/<(?:html|h[1-6]|p)[\s>]/i.test(html), `${name} must remain an HTML page`);
    assert.match(html, /<html lang="en">/, `${name} must declare its language`);
    assert.match(html, /<main[\s>]/, `${name} needs a main landmark`);
    assert.equal([...html.matchAll(/<h1[\s>]/g)].length, 1, `${name} needs one page heading`);
  }
});

test('the homepage works as a document without JavaScript', async () => {
  const html = await readFile(new URL('index.html', publicDirectory), 'utf8');
  assert.doesNotMatch(html, /href="javascript:|\sonclick=/i, 'Navigation must work without JavaScript');
  assert.match(html, /<main[\s>]/i, 'The primary content needs a main landmark');
  assert.match(html, /href="mailto:jannik@feuer.dev"/, 'Contact remains a native email link');
  for (const fragment of [...html.matchAll(/href="#([^"]+)"/g)].map(match => match[1])) {
    assert.ok(html.includes(`id="${fragment}"`), `Missing anchor target: ${fragment}`);
  }
});

test('the homepage defers third-party scripts and decorative media', async () => {
  const html = await readFile(new URL('index.html', publicDirectory), 'utf8');
  assert.doesNotMatch(html, /<(?:script|img|iframe)[^>]+src="https?:/i);
  assert.doesNotMatch(html, /<link[^>]+href="https?:[^>]+rel="stylesheet"|<link[^>]+rel="stylesheet"[^>]+href="https?:/i);
  const activeHtml = html.replace(/<template>[\s\S]*?<\/template>/g, '');
  assert.doesNotMatch(activeHtml, /<img[^>]+\ssrc=/i, 'Project artwork stays inert until opting into fancy mode');
});

test('homepage analytics identifies every project link and the four introduction links', async () => {
  const html = await readFile(new URL('index.html', publicDirectory), 'utf8');
  const projects = [...html.matchAll(/<article class="project" id="([^"]+)"[\s\S]*?<\/article>/g)];
  assert.equal(projects.length, 6);
  for (const [article, id] of projects) {
    for (const [anchor] of article.matchAll(/<a\s[^>]+>/g)) {
      assert.match(anchor, new RegExp(`data-goatcounter-click="project-${id}"`));
      assert.match(anchor, /data-goatcounter-title="[^"]+"/);
    }
  }
  const contact = html.match(/<p class="hero-links"[\s\S]*?<\/p>/)[0];
  assert.deepEqual([...contact.matchAll(/data-goatcounter-click="([^"]+)"/g)].map(match => match[1]), [
    'contact-email', 'contact-github', 'contact-linkedin', 'contact-resume',
  ]);
});

test('homepage CSP allows only the hosted tracker and this site’s collector', async () => {
  const html = await readFile(new URL('index.html', publicDirectory), 'utf8');
  const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  const directives = new Map(policy.split(';').map(value => {
    const [name, ...sources] = value.trim().split(/\s+/);
    return [name, sources];
  }));
  assert.deepEqual(directives.get('script-src'), ["'self'", 'https://gc.zgo.at/count.js']);
  assert.deepEqual(directives.get('connect-src'), ['https://feuerdev.goatcounter.com/count']);
  assert.deepEqual(directives.get('img-src'), ["'self'", 'data:', 'https://feuerdev.goatcounter.com/count']);
  for (const name of ['object-src', 'frame-src', 'base-uri', 'form-action']) {
    assert.deepEqual(directives.get(name), ["'none'"]);
  }
});
