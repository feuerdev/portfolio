import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5001/';
const session = `portfolio-images-${process.pid}`;
function browser(...args) {
  const result = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8' }));
  assert.ok(result.success, result.error);
  return result.data;
}
const evaluate = code => browser('eval', code).result;

try {
  browser('open', new URL('?mode=fancy', base).href);
  evaluate('document.querySelector("#mode-toggle").click()');
  browser('wait', '--fn', 'document.documentElement.classList.contains("fancy") && !document.querySelector("#mode-toggle").disabled');
  evaluate(`(async () => {
    const images = Array.from(document.querySelectorAll('.project-art img'));
    images.forEach(image => image.loading = 'eager');
    await Promise.all(images.map(image => image.decode()));
  })()`);
  const failures = [];
  for (const width of [1440, 700, 390, 320]) {
    browser('set', 'viewport', String(width), '900');
    const artwork = evaluate(`Array.from(document.querySelectorAll('.project')).map(project => {
      const media = project.querySelector('.project-art').getBoundingClientRect();
      const card = project.getBoundingClientRect();
      const picturesContained = Array.from(project.querySelectorAll('.project-art > img')).every(image => {
        const picture = image.getBoundingClientRect();
        return picture.top >= media.top - 1 && picture.bottom <= media.bottom + 1;
      });
      return { id: project.id, height: media.height, picturesContained, contained: media.left >= card.left && media.right <= card.right,
        images: Array.from(project.querySelectorAll('img')).map(image => ({ src: image.getAttribute('src'),
          height: image.getBoundingClientRect().height, naturalHeight: image.naturalHeight })) };
    })`);
    for (const check of [
      () => assert.ok(Math.max(...artwork.map(item => item.height)) - Math.min(...artwork.map(item => item.height)) < 1,
        `${width}px: project imagery must share a consistent visual area`),
      () => assert.ok(artwork.every(item => item.contained), `${width}px: artwork must stay inside its card`),
      () => assert.ok(artwork.every(item => item.picturesContained), `${width}px: pictures must not spill into other cards`),
      () => assert.ok(evaluate('document.documentElement.scrollWidth <= innerWidth'), `${width}px: no horizontal overflow`),
      () => assert.ok(artwork.find(item => item.id === 'raytracer').images[0].height <= 338,
        `${width}px: the old raytracer capture must not be enlarged`),
      () => assert.ok(width > 700 || artwork.every(item => item.height <= 260), `${width}px: images should not dominate the mobile viewport`)
    ]) { try { check(); } catch (error) { failures.push(error); } }
  }
  const replacements = evaluate("['keep-mcp', 'sponsor-detector'].map(id => document.getElementById(id).querySelector('img').getAttribute('src'))");
  try { assert.ok(replacements.every(src => src.endsWith('.webp')), 'Both placeholder diagrams must be replaced by real captures'); }
  catch (error) { failures.push(error); }
  if (failures.length) throw new AggregateError(failures, 'Project imagery checks failed');
  console.log('Image checks passed: consistent media areas, card containment, mobile sizing, real captures and no raytracer enlargement.');
} finally { browser('close'); }
