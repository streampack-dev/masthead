import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { variants } from '../src/variants.js';
import { find, run, serialize } from './fake.js';
import boids from '../src/variants/boids.js';
import bytecode, { PROGRAMS, STREAMS } from '../src/variants/bytecode.js';
import circuit from '../src/variants/circuit.js';
import fractal from '../src/variants/fractal.js';
import life from '../src/variants/life.js';
import signalnoise from '../src/variants/signalnoise.js';
import solari, { COLS, OWN, ROWS, flaps, layout, wrap } from '../src/variants/solari.js';
import terrainflight from '../src/variants/terrainflight.js';
import train, { CARGO, ENGINE, car, rows } from '../src/variants/train.js';
import water, { GRID_H, GRID_W, drop, ripple } from '../src/variants/water.js';

const all = { boids, bytecode, fractal, life, signalnoise, solari, terrainflight, train, water };
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
  for (const name of ['boids', 'bytecode', 'fractal', 'life', 'terrainflight', 'train', 'water']) {
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

describe('the bytecode rain', () => {
  const glyphs = (layer) => find(layer, 'masthead-bytecode-glyph');

  it('rains real instructions, in hex, a class file header among them', () => {
    assert.deepEqual(STREAMS[0].slice(0, 4).map((b) => b.hex), ['CA', 'FE', 'BA', 'BE']);
    assert.equal(STREAMS[0][0].text, '0xCAFEBABE');
    // Every instruction's first byte carries how javap shows it; its operands don't.
    for (const program of PROGRAMS) {
      for (const instruction of program) assert.ok(instruction.bytes.length >= 1 && instruction.text);
    }
    const shown = new Set(glyphs(run(bytecode, 200).layer).map((t) => t.textContent).filter(Boolean));
    assert.ok([...shown].every((hex) => /^[0-9A-F]{2}$/.test(hex)), [...shown].join(' '));
  });

  it('is raining from the first frame, with a bright head in each running column', () => {
    const { layer } = run(bytecode, 0);
    assert.ok(glyphs(layer).filter((t) => Number(t.attrs['fill-opacity']) > 0).length > 100);
    const columns = find(layer, 'masthead-bytecode-column').length;
    // Most columns are mid-run at first; the rest are above or below the screen.
    assert.ok(find(layer, 'masthead-bytecode-head').length > columns / 2);
  });

  it('is faint behind the name', () => {
    const { layer } = run(bytecode, 300);
    const cols = find(layer, 'masthead-bytecode-column');
    // The middle column's middle rows, over a run.
    const middle = cols[Math.floor(cols.length / 2)].children.slice(6, 10).map((t) => Number(t.attrs['fill-opacity']));
    assert.ok(middle.every((o) => o <= 0.3), middle.join(' '));
  });

  it('keeps its glyphs in shape however the masthead is stretched, in as many columns as fit', () => {
    const wide = find(run(bytecode, 0, { stretch: 1.5 }).layer, 'masthead-bytecode-column');
    assert.match(wide[0].attrs.transform, /scale\(0\.6667 1\)$/);
    assert.equal(wide.length, 50);
    // A phone's masthead is narrower than the art: fewer columns, so they don't crowd.
    assert.equal(find(run(bytecode, 0, { stretch: 0.65 }).layer, 'masthead-bytecode-column').length, 22);
  });

  it('decodes an instruction beside its column now and then', () => {
    const { layer, art } = run(bytecode, 0);
    const note = find(layer, 'masthead-bytecode-note')[0];
    let seen = null;
    for (let i = 1; i <= 120 && !seen; i++) {
      art.step(i, i * 60);
      if (Number(note.attrs.opacity) > 0) seen = note.children[0].textContent;
    }
    const texts = PROGRAMS.flat().map((instruction) => instruction.text);
    assert.ok(seen && texts.includes(seen), String(seen));
  });
});

describe('the train', () => {
  it('is an engine at the front, its cars behind, each with its cargo on its side', () => {
    const lines = rows(['JVM 21', 'GC']);
    assert.equal(lines.length, ENGINE.length);
    assert.ok(lines[3].includes('JVM 21') && lines[3].includes('GC') && lines[3].includes('BYTECODE'));
    assert.ok(lines[3].indexOf('JVM 21') < lines[3].indexOf('GC'));
    // Every car is as wide as the next, so the train's rows line up.
    const sides = car('0xCAFEBABE').slice(2, 5).map((line) => line.trimEnd().replace(/=$/, '').length);
    assert.deepEqual(sides, [20, 20, 20]);
    for (const label of CARGO) assert.ok(label.length <= 18, label);
  });

  it('runs left to right along its track, below the name, trailing smoke', () => {
    const { layer, art } = run(train, 0);
    const cars = find(layer, 'masthead-train-cars')[0];
    const at = () => Number(/translate\((-?[\d.]+) /.exec(cars.attrs.transform)[1]);
    const y = Number(/translate\(-?[\d.]+ ([\d.]+)\)/.exec(cars.attrs.transform)[1]);
    const first = at();
    for (let i = 1; i <= 50; i++) art.step(i, i * 40);
    assert.ok(at() > first);
    assert.ok(y > 280, String(y));
    assert.ok(find(layer, 'masthead-train-smoke')[0].children.length > 0);
  });

  it('leaves the track empty for a while between trains, then another comes', () => {
    const { layer, art } = run(train, 0);
    const cars = find(layer, 'masthead-train-cars')[0];
    let gone = null, back = null;
    for (let i = 1; i <= 2000 && back === null; i++) {
      art.step(i, i * 40);
      const shown = cars.attrs.opacity !== '0';
      if (!shown && gone === null) gone = i;
      if (shown && gone !== null) back = i;
    }
    assert.ok(gone !== null && back !== null && (back - gone) * 40 >= 3000, `${gone} ${back}`);
  });
});

describe('the water', () => {
  it('rings out from a drop, and settles', () => {
    let now = new Float32Array(GRID_W * GRID_H), before = new Float32Array(GRID_W * GRID_H);
    const mid = 20 * GRID_W + 60;
    drop(now, 60, 20, 5);
    assert.ok(now[mid] < 0);
    for (let i = 0; i < 12; i++) [now, before] = ripple(now, before);
    // The ring has reached cells the drop didn't touch.
    assert.notEqual(now[20 * GRID_W + 70], 0);
    for (let i = 0; i < 1500; i++) [now, before] = ripple(now, before);
    assert.ok(Math.max(...now.map(Math.abs)) < 0.05);
  });

  it('draws its lines across the whole surface, moving from the first frame', () => {
    const { layer, art } = run(water, 0);
    const lines = find(layer, 'masthead-water-line');
    assert.equal(lines.length, 18);
    const first = lines[9].attrs.d;
    assert.ok(first.startsWith('M0.0 ') && /L1200\.0 /.test(first));
    art.step(1, 40);
    assert.notEqual(lines[9].attrs.d, first);
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
