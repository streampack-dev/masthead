import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { variants } from '../src/variants.js';
import { find, run, serialize } from './fake.js';
import boids from '../src/variants/boids.js';
import circuit from '../src/variants/circuit.js';
import fractal from '../src/variants/fractal.js';
import life from '../src/variants/life.js';
import signalnoise from '../src/variants/signalnoise.js';
import solari, { COLS, OWN, ROWS, flaps, layout, wrap } from '../src/variants/solari.js';
import terrainflight from '../src/variants/terrainflight.js';

const all = { boids, fractal, life, signalnoise, solari, terrainflight };
const stepping = Object.keys(all);

describe('every variant', () => {
  it('is listed, and every listing has its file', async () => {
    const files = readdirSync(new URL('../src/variants/', import.meta.url))
      .map((f) => f.replace(/\.js$/, ''))
      .sort();
    assert.deepEqual(Object.keys(variants).sort(), files);
    for (const name of files) {
      assert.equal(typeof (await variants[name]()).default, 'function', name);
    }
  });

  for (const name of stepping) {
    const make = all[name];
    it(`${name} draws and runs a thousand steps`, () => {
      const { layer, art } = run(make, 1000);
      assert.ok(layer.children.length > 0);
      assert.equal(typeof art.step, 'function');
    });
  }

  // Solari's riffle and signal noise's bursts take Math.random and the clock; these take the seed.
  for (const name of ['boids', 'fractal', 'life', 'terrainflight']) {
    it(`${name} replays a run from its seed`, () => {
      const once = serialize(run(all[name], 300, { seed: 42 }).layer);
      assert.equal(serialize(run(all[name], 300, { seed: 42 }).layer), once);
    });
  }
});

describe('the circuit', () => {
  it('draws its board and four fireflies that move by SVG alone, so it takes no steps', () => {
    const { layer, art } = run(circuit, 0);
    assert.equal(art, undefined);
    assert.equal(find(layer, 'masthead-circuit-traces')[0].children.length, 9);
    assert.equal(find(layer, 'masthead-circuit-nodes')[0].children.length, 12);
    const runs = find(layer, 'masthead-circuit-fireflies')[0].children.map((g) => g.children[2].attrs);
    assert.equal(runs.length, 4);
    // Each is already on its way, so none waits at the board's corner for its turn.
    assert.ok(runs.every((a) => parseFloat(a.begin) <= 0 && a.repeatCount === 'indefinite'));
  });

  it('brings its own fade for the traces', () => {
    const defs = run(circuit, 0).layer.children[0];
    assert.equal(defs.tag, 'defs');
    assert.equal(defs.children[0].attrs.id, 'masthead-fade');
  });
});

describe('the solari board', () => {
  const rows = (board) => board.map((row) => row.join('').trimEnd()).filter(Boolean);

  it("shows deks in the flaps' alphabet: capitals, accents dropped, quotes and dashes plain", () => {
    assert.equal(flaps('Café crème – “quoted” naïve résumé?'), "CAFE CREME - 'QUOTED' NAIVE RESUME?");
    assert.equal(flaps('Tabs\tand  spaces… & more'), 'TABS AND SPACES... & MORE');
  });

  it('wraps a dek at words to one board, a long one cut at a word', () => {
    assert.deepEqual(wrap(flaps('Café crème – “quoted” naïve résumé?')), ["CAFE CREME - 'QUOTED'", 'NAIVE RESUME?']);
    const long = flaps(
      'Programming is a vocation, an art, and a job. Make any of those harder than they need ' +
        "to be, and your language survives exactly as long as it can't be replaced by something simpler."
    );
    assert.deepEqual(wrap(long), [
      'PROGRAMMING IS A VOCATION,',
      'AN ART, AND A JOB. MAKE',
      'ANY OF THOSE HARDER THAN',
      'THEY NEED TO BE, AND YOUR',
      'LANGUAGE SURVIVES...'
    ]);
  });

  it('lays lines out on a 26 by 5 board, centred top to bottom', () => {
    const board = layout(['BESIDE THE LEAD']);
    assert.equal(board.length, ROWS);
    assert.ok(board.every((row) => row.length === COLS));
    assert.equal(board[2].join('').trimEnd(), 'BESIDE THE LEAD');
    assert.deepEqual(rows(layout(OWN)), ['BYTECODE NEWS', 'TECHNICAL DISPATCH', 'SYSTEMS SIGNAL', 'BUILD INDEX']);
  });

  const glyphs = (layer) => rows(chunk(find(layer, 'masthead-solari-glyph').map((t) => t.textContent)));
  const chunk = (cells) => Array.from({ length: ROWS }, (_, r) => cells.slice(r * COLS, (r + 1) * COLS));

  it('starts blank, then riffles up a dek and settles', () => {
    assert.deepEqual(glyphs(run(solari, 0, { deks: ['Beside the lead'] }).layer), []);
    // 900 ms before the first riffle, then 12 frames plus a row each, at 58 ms.
    assert.deepEqual(glyphs(run(solari, 40, { deks: ['Beside the lead'] }).layer), ['BESIDE THE LEAD']);
  });

  it("keeps its own lines when there's no dek", () => {
    assert.deepEqual(glyphs(run(solari, 40).layer), OWN);
  });
});

describe('signal noise', () => {
  const band = (layer) => Number(find(layer, 'masthead-noise-band')[0].attrs.y);

  it('starts with its band on the screen, where the seed puts it', () => {
    for (const seed of [0, 1, 7, 42, 99999]) {
      const y = band(run(signalnoise, 0, { seed }).layer);
      assert.ok(y >= 0 && y <= 320 - 36, `seed ${seed}: ${y}`);
    }
  });

  it('rests on faint scanlines, one every six units', () => {
    const d = find(run(signalnoise, 0).layer, 'masthead-noise-scan')[0].attrs.d;
    assert.ok(d.startsWith('M0 2H1200v1H0Z'));
    assert.equal(d.match(/M/g).length, 53);
  });

  it('bursts within a second or three', () => {
    const { layer, art } = run(signalnoise, 0);
    const burst = find(layer, 'masthead-noise-burst')[0];
    let at = null;
    // A step every 70 ms, for 3.5 s.
    for (let i = 1; i <= 50 && at === null; i++) {
      art.step(i, i * 70);
      if (burst.children.length > 0) at = i * 70;
    }
    assert.ok(at !== null && at >= 900, `burst at ${at}`);
  });
});

describe('the fractal', () => {
  it('grows from three roots round the name, each tracing both ways', () => {
    const tips = find(run(fractal, 0).layer, 'masthead-fractal-tips')[0];
    assert.equal(tips.children.length, 6);
  });

  it('fills the masthead rather than one side of it', () => {
    // Grown once: no tips left. After a rest, it starts again.
    const { layer, art } = run(fractal, 0);
    const tips = find(layer, 'masthead-fractal-tips')[0];
    for (let i = 1; i <= 400 && tips.children.length > 0; i++) art.step(i, i * 92);
    const d = ['trunk', 'branches', 'twigs'].map((k) => find(layer, 'masthead-fractal-' + k)[0].attrs.d).join('');
    const xs = [...d.matchAll(/L(-?[\d.]+) /g)].map((m) => Number(m[1]));
    assert.ok(xs.length >= 600, `${xs.length} segments`);
    assert.ok(Math.min(...xs) < 250);
    assert.ok(Math.max(...xs) > 950);
  });
});
