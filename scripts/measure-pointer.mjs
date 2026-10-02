import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// Paired, seeded renderer measurements. Browser CPU timings exclude GPU completion;
// frame intervals capture scheduling/presentation pressure. Run without other tests.
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5001/';
const session = `portfolio-pointer-performance-${process.pid}`;
function browser(...args) {
  const result = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8' }));
  assert.ok(result.success, result.error);
  return result.data;
}

try {
  browser('open', base);
  for (const [width, height] of [[1440, 900], [2560, 1440]]) {
    browser('set', 'viewport', String(width), String(height));
    for (const reading of [false, true]) {
      const result = browser('eval', `(async () => {
        const { createSpace } = await import('/js/space.js');
        const random = Math.random;
        let seed = 7341, space;
        try {
          Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
          space = createSpace(1);
        } finally { Math.random = random; }
        const width = ${width}, height = ${height}, reading = ${reading};
        const canvas = document.createElement('canvas');
        canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
        canvas.width = width * 1.5; canvas.height = height * 1.5;
        document.body.replaceChildren(canvas);
        document.body.style.margin = '0';
        const context = canvas.getContext('2d');
        context.setTransform(1.5, 0, 0, 1.5, 0, 0);
        const cardLeft = Math.max(72, (width - 1440) / 2 + 72), cardRight = cardLeft + 828;
        const centre = reading ? (cardRight + width) / 2 : width * .8;
        const shot = space.overview(reading ? 1.55 : 3.1, reading ? 1.1 : .1, centre / width, reading ? .5 : .43, reading ? .12 : .3);
        // Sweep movement through the stream; there are no content exclusions.
        const wake = { x: 0, y: 0, fromX: 0, fromY: 0, radius: 110 };
        let clips = 0;
        const clip = context.clip.bind(context);
        context.clip = (...args) => { clips++; clip(...args); };
        const samples = { inactive: { cpu: [], frames: [], clips: [] }, active: { cpu: [], frames: [], clips: [] } };
        const sample = async active => {
          space.resetWake();
          const values = samples[active ? 'active' : 'inactive'];
          let previous = 0;
          for (let n = -30; n < 180; n++) {
            const time = await new Promise(requestAnimationFrame);
            wake.fromX = centre + Math.sin((n - 1) * .027) * 190;
            wake.fromY = height * (reading ? .5 : .43) + Math.cos((n - 1) * .031) * 180;
            wake.x = centre + Math.sin(n * .027) * 190;
            wake.y = height * (reading ? .5 : .43) + Math.cos(n * .031) * 180;
            clips = 0;
            const started = performance.now();
            space.render(context, width, height, 3 + n / 60, .3 + n / 60 * .03, shot, -1, 1, 1, active ? wake : undefined, 1 / 60);
            const cpu = performance.now() - started;
            if (n >= 0) { values.cpu.push(cpu); values.frames.push(time - previous); values.clips.push(clips); }
            previous = time;
          }
        };
        for (let run = 0; run < 3; run++) {
          await sample(run % 2 === 1);
          await sample(run % 2 === 0);
        }
        const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * p)];
        const summarize = values => ({ samples: values.cpu.length,
          cpuMedianMs: +percentile(values.cpu, .5).toFixed(3), cpuP95Ms: +percentile(values.cpu, .95).toFixed(3),
          frameP95Ms: +percentile(values.frames, .95).toFixed(3), framesOver25Ms: values.frames.filter(t => t > 25).length,
          clipsMean: +(values.clips.reduce((a, b) => a + b, 0) / values.clips.length).toFixed(2) });
        return { width, height, reading, density: 1.5, inactive: summarize(samples.inactive), active: summarize(samples.active) };
      })()`).result;
      console.log(JSON.stringify(result));
    }
  }
} finally {
  browser('close');
}
