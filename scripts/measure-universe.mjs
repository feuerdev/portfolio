import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// Serve the approved renderer at BASELINE_URL/js/space.js. Alternate seeded
// baseline/current samples on the same machine, without other browser tests.
const urls = { baseline: process.env.BASELINE_URL, current: process.env.PREVIEW_URL || 'http://127.0.0.1:5001/' };
assert.ok(urls.baseline, 'Set BASELINE_URL to a locally served copy of the approved renderer');
const sessions = Object.fromEntries(Object.keys(urls).map(name => [name, `portfolio-universe-performance-${name}-${process.pid}`]));
function browser(name, ...args) {
  const result = JSON.parse(execFileSync('agent-browser', ['--session', sessions[name], '--json', ...args], { encoding: 'utf8' }));
  assert.ok(result.success, result.error);
  return result.data;
}
const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * p)];
const summarize = ({ cpu, frames }) => ({ samples: cpu.length,
  cpuMedianMs: +percentile(cpu, .5).toFixed(3), cpuP95Ms: +percentile(cpu, .95).toFixed(3),
  frameP95Ms: +percentile(frames, .95).toFixed(3), framesOver25Ms: frames.filter(t => t > 25).length });

try {
  for (const name of Object.keys(urls)) browser(name, 'open', urls[name]);
  for (const [width, height] of [[1440, 900], [2560, 1440], [390, 844]]) {
    for (const reading of [false, true]) {
      const samples = {};
      for (const name of Object.keys(urls)) {
        samples[name] = { cpu: [], frames: [] };
        browser(name, 'set', 'viewport', String(width), String(height));
        browser(name, 'eval', `(async () => {
          const { createSpace } = await import('/js/space.js');
          const random = Math.random;
          let seed = 7341, space;
          try {
            Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
            space = createSpace(Math.min(1, Math.max(.45, ${width * height} / (1440 * 900))));
          } finally { Math.random = random; }
          const width = ${width}, height = ${height}, reading = ${reading};
          const canvas = document.createElement('canvas');
          canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
          canvas.width = width * 1.5; canvas.height = height * 1.5;
          document.body.replaceChildren(canvas);
          document.body.style.margin = '0';
          const context = canvas.getContext('2d');
          context.setTransform(1.5, 0, 0, 1.5, 0, 0);
          const cardRight = Math.max(72, (width - 1440) / 2 + 72) + 828;
          const centre = reading ? (width < 700 ? width * 1.09 : (cardRight + width) / 2) : width * .8;
          const shot = space.overview(reading ? 1.55 : 3.1, reading ? 1.1 : .1, centre / width, reading ? .5 : .43, reading ? .12 : .3);
          const wake = { x: 0, y: 0, fromX: 0, fromY: 0, radius: 110 };
          window.sampleUniverse = async () => {
            space.resetWake();
            const cpu = [], frames = [];
            let previous = 0;
            for (let n = -20; n < 120; n++) {
              const time = await new Promise(requestAnimationFrame);
              wake.fromX = centre + Math.sin((n - 1) * .027) * 190;
              wake.fromY = height * (reading ? .5 : .43) + Math.cos((n - 1) * .031) * 180;
              wake.x = centre + Math.sin(n * .027) * 190;
              wake.y = height * (reading ? .5 : .43) + Math.cos(n * .031) * 180;
              const started = performance.now();
              space.render(context, width, height, 3 + n / 60, .3 + n / 60 * .03, shot, -1, 1, width < 700 && reading ? .25 : 1, width < 700 ? undefined : wake, 1 / 60);
              if (n >= 0) { cpu.push(performance.now() - started); frames.push(time - previous); }
              previous = time;
            }
            return { cpu, frames };
          };
        })()`);
      }
      for (let run = 0; run < 3; run++) {
        for (const name of run % 2 ? ['current', 'baseline'] : ['baseline', 'current']) {
          const result = browser(name, 'eval', 'window.sampleUniverse()').result;
          samples[name].cpu.push(...result.cpu); samples[name].frames.push(...result.frames);
        }
      }
      console.log(JSON.stringify({ width, height, reading, backingScale: 1.5,
        baseline: summarize(samples.baseline), current: summarize(samples.current) }));
    }
  }
} finally {
  for (const name of Object.keys(sessions)) browser(name, 'close');
}
