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
  }
});
