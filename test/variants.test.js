import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { variants } from '../src/variants.js';
import { DRAFTS, OCCASIONS, REFERENCE_DAYS, SEASONS, during, inSeason, isWindow, pick, weights } from '../src/runner.js';
import bats, { bat, flight } from '../src/variants/bats.js';
import eyes, { openness } from '../src/variants/eyes.js';
import duel, { POSES, STUB, breaks, crossing, facepalms, figure, mixPose } from '../src/variants/duel.js';
import deadline, { ANVIL, POSES as DESK_POSES, SCENES, anvilAt, writer } from '../src/variants/deadline.js';
import ghosts, { round, sheet } from '../src/variants/ghosts.js';
import graveyard, { tree } from '../src/variants/graveyard.js';
import pumpkins, { FACES } from '../src/variants/pumpkins.js';
import spider, { spider as spiderShape, web } from '../src/variants/spider.js';
import { find, run, serialize } from './fake.js';
import boids from '../src/variants/boids.js';
import bytecode, { OCTOBER, PROGRAMS, STREAMS } from '../src/variants/bytecode.js';
import circuit, { WIRES, along } from '../src/variants/circuit.js';
import chase, { blurLegs, scramble, SPLAY, TUNNEL_WAIT, tunnelExpires } from '../src/variants/chase.js';
import citydefense, { BASES, CITIES, GROUND, intercept } from '../src/variants/citydefense.js';
import grass, { wind as grassWind, pokeGusts } from '../src/variants/grass.js';
import lander, { GRAVITY, SIDE, THRUST, ground, pilot } from '../src/variants/lander.js';
import paddles, { LEFT, RIGHT, landing } from '../src/variants/paddles.js';
import rocks, { SIZES, outline } from '../src/variants/rocks.js';
import pongwars, { COLS as WAR_COLS, ROWS as WAR_ROWS, bounce } from '../src/variants/pongwars.js';
import stix, { GH, GW, claim, field, route } from '../src/variants/stix.js';
import windfarm, { farm, wind as farmWind } from '../src/variants/windfarm.js';
import flowfield, { MOTES, current as flowCurrent, shape as flowShape, weight as flowWeight } from '../src/variants/flowfield.js';
import flyby, { FOCAL, PLANETS, layout as flybyLayout, project as flybyProject, speed as flybySpeed } from '../src/variants/flyby.js';
import football, { FLIGHT, GROUND as FIELD, arc, joints } from '../src/variants/football.js';
import fractal from '../src/variants/fractal.js';
import ghostrider, { BOOST, DRAW, MAX_CURVE, SPEED, course, project } from '../src/variants/ghostrider.js';
import nightcity from '../src/variants/nightcity.js';
import life, { PLANTS } from '../src/variants/life.js';
import signalnoise from '../src/variants/signalnoise.js';
import solari, { COLS, OWN, ROWS, flaps, layout, wrap } from '../src/variants/solari.js';
import terrainflight from '../src/variants/terrainflight.js';
import train, { CARGO, ENGINE, car, rows } from '../src/variants/train.js';
import triangles, { COLS as TRI_COLS, ROWS as TRI_ROWS, mesh, place, winding } from '../src/variants/triangles.js';
import truchet, { JOINS, ROWS as TRUCHET_ROWS, TURN_STEPS, columns, follow, strength as truchetStrength } from '../src/variants/truchet.js';
import water, { GRID_H, GRID_W, drop, ripple, skips } from '../src/variants/water.js';
import blockpeek, { BLOCK, STAGES, candidates, cellAt, cracks } from '../src/variants/blockpeek.js';
import skyline, { BOLT_STEPS, DROPS, GLOW_STEPS, GROUND as STREET, bolt, city } from '../src/variants/skyline.js';
import ships, { HORIZON, KINDS, LEAP_HEIGHT, LEAP_STEPS, MAX_SHIPS, NEAR, leap } from '../src/variants/ships.js';

const all = { bats, blockpeek, boids, bytecode, chase, circuit, deadline, duel, eyes, ghosts, graveyard, pumpkins, spider, citydefense, flyby, football, fractal, ghostrider, grass, lander, paddles, pongwars, rocks, ships, stix, windfarm, life, signalnoise, solari, terrainflight, train, triangles, water };
const all = { bats, blockpeek, boids, bytecode, chase, circuit, deadline, duel, eyes, ghosts, graveyard, pumpkins, spider, citydefense, flyby, football, fractal, ghostrider, grass, lander, paddles, pongwars, rocks, ships, stix, windfarm, life, signalnoise, solari, terrainflight, train, truchet, water };
const all = { bats, blockpeek, boids, bytecode, chase, circuit, deadline, duel, eyes, ghosts, graveyard, pumpkins, spider, citydefense, flowfield, flyby, football, fractal, ghostrider, grass, lander, paddles, pongwars, rocks, ships, stix, windfarm, life, signalnoise, solari, terrainflight, train, water };
const all = { bats, blockpeek, boids, bytecode, chase, circuit, deadline, duel, eyes, ghosts, graveyard, pumpkins, spider, citydefense, flyby, football, fractal, ghostrider, grass, lander, paddles, pongwars, rocks, ships, skyline, stix, windfarm, life, signalnoise, solari, terrainflight, train, water };
const all = { bats, blockpeek, boids, bytecode, chase, circuit, deadline, duel, eyes, ghosts, graveyard, pumpkins, spider, citydefense, flyby, football, fractal, ghostrider, grass, lander, nightcity, paddles, pongwars, rocks, ships, stix, windfarm, life, signalnoise, solari, terrainflight, train, water };
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
  for (const name of ['bats', 'blockpeek', 'boids', 'bytecode', 'chase', 'deadline', 'duel', 'eyes', 'ghosts', 'graveyard', 'pumpkins', 'spider', 'citydefense', 'flyby', 'football', 'fractal', 'ghostrider', 'grass', 'lander', 'paddles', 'pongwars', 'rocks', 'ships', 'stix', 'windfarm', 'life', 'terrainflight', 'train', 'triangles', 'water']) {
  for (const name of ['bats', 'blockpeek', 'boids', 'bytecode', 'chase', 'deadline', 'duel', 'eyes', 'ghosts', 'graveyard', 'pumpkins', 'spider', 'citydefense', 'flyby', 'football', 'fractal', 'ghostrider', 'grass', 'lander', 'paddles', 'pongwars', 'rocks', 'ships', 'stix', 'windfarm', 'life', 'terrainflight', 'train', 'truchet', 'water']) {
  for (const name of ['bats', 'blockpeek', 'boids', 'bytecode', 'chase', 'deadline', 'duel', 'eyes', 'ghosts', 'graveyard', 'pumpkins', 'spider', 'citydefense', 'flowfield', 'flyby', 'football', 'fractal', 'ghostrider', 'grass', 'lander', 'paddles', 'pongwars', 'rocks', 'ships', 'stix', 'windfarm', 'life', 'terrainflight', 'train', 'water']) {
  for (const name of ['bats', 'blockpeek', 'boids', 'bytecode', 'chase', 'deadline', 'duel', 'eyes', 'ghosts', 'graveyard', 'pumpkins', 'spider', 'citydefense', 'flyby', 'football', 'fractal', 'ghostrider', 'grass', 'lander', 'paddles', 'pongwars', 'rocks', 'ships', 'skyline', 'stix', 'windfarm', 'life', 'terrainflight', 'train', 'water']) {
  for (const name of ['bats', 'blockpeek', 'boids', 'bytecode', 'chase', 'deadline', 'duel', 'eyes', 'ghosts', 'graveyard', 'pumpkins', 'spider', 'citydefense', 'flyby', 'football', 'fractal', 'ghostrider', 'grass', 'lander', 'nightcity', 'paddles', 'pongwars', 'rocks', 'ships', 'stix', 'windfarm', 'life', 'terrainflight', 'train', 'water']) {
    it(`${name} replays a run from its seed`, () => {
      const once = serialize(run(all[name], 300, { seed: 42 }).layer);
      assert.equal(serialize(run(all[name], 300, { seed: 42 }).layer), once);
    });
  }
});

describe('flowfield', () => {
  it('is strongest low and faintest behind the name', () => {
    assert.equal(flowWeight(300), 1);
    assert.ok(flowWeight(160) < 0.2 && flowWeight(10) < 0.5 && flowWeight(10) > flowWeight(160));
  });

  it('gives a unit direction everywhere, swirling round an eddy', () => {
    let s = 9;
    const field = flowShape(() => ((s = (s * 16807) % 2147483647) / 2147483647));
    for (const [x, y] of [[0, 0], [700, 160], [2400, 320]]) {
      const v = flowCurrent(field, x, y, 123, []);
      assert.ok(Math.abs(Math.hypot(v.x, v.y) - 1) < 1e-9);
    }
    // Right beside a strong eddy, the current runs round it, not toward it.
    const v = flowCurrent(field, 520, 200, 0, [{ x: 500, y: 200, strength: 1, spin: 1 }]);
    assert.ok(Math.abs(v.x) < 0.5 && v.y > 0.8, JSON.stringify(v));
  });

  it('keeps its motes few, and keeps the length of its strokes on screen however the masthead is stretched', () => {
    const { layer } = run(flowfield, 50);
    assert.equal(find(layer, 'masthead-flowfield-mote').length, MOTES);
    const angles = (stretch) => {
      const p = find(run(flowfield, 2, { stretch }).layer, 'masthead-flowfield-grid')[2];
      return [...p.attrs.d.matchAll(/l(-?[\d.]+) (-?[\d.]+)/g)].slice(0, 5).map((m) => [Number(m[1]) * stretch, Number(m[2])]);
    };
    // Stretched, the field is sampled at other screen points, so only the lengths on screen are compared.
    const one = angles(1), two = angles(2);
    one.concat(two).forEach(([dx, dy]) => assert.ok(Math.hypot(dx, dy) > 8 && Math.hypot(dx, dy) < 18, `${dx} ${dy}`));
  });
});

describe('a poke', () => {
  const poking = Object.keys(all).filter((name) => run(all[name], 0).art && run(all[name], 0).art.poke);

  it('is taken by the first eleven animations', () => {
    const first = ['boids', 'bytecode', 'circuit', 'fractal', 'ghostrider', 'life', 'signalnoise', 'solari', 'terrainflight', 'train', 'water'];
    for (const name of first) assert.ok(poking.includes(name), name);
  });

  for (const name of poking) {
    it(`${name} takes pokes anywhere, mid-run, and runs on`, () => {
      const { art } = run(all[name], 50);
      for (const [x, y] of [[0, 0], [600, 160], [1200, 320], [37.5, 301.2]]) art.poke(x, y, 50, 50 * 40);
      for (let i = 51; i <= 1000; i++) art.step(i, i * 40);
    });
  }

  it('scatters the flock from it, faster for a while, and leaves a ring there', () => {
    const { layer, art } = run(boids, 100);
    const at = (g) => /translate\(([\d.]+) ([\d.]+)\)/.exec(g.attrs.transform).slice(1).map(Number);
    const flock = find(layer, 'masthead-boid');
    const [x, y] = at(flock[0]);
    const near = flock.filter((g) => Math.hypot(at(g)[0] - x, at(g)[1] - y) < 200);
    const before = near.map((g) => Math.hypot(at(g)[0] - x, at(g)[1] - y));
    art.poke(x, y, 100, 2400);
    const ring = find(layer, 'masthead-boids-hawk')[0];
    assert.equal(ring.attrs.cx, x.toFixed(1));
    assert.ok(Number(ring.attrs.opacity) > 0);
    for (let i = 101; i <= 110; i++) art.step(i, i * 24);
    const after = near.map((g) => Math.hypot(at(g)[0] - x, at(g)[1] - y));
    assert.ok(after.every((d, i) => d > before[i]), `${before} -> ${after}`);
    for (let i = 111; i <= 140; i++) art.step(i, i * 24);
    assert.equal(ring.attrs.opacity, '0');
  });

  it('plants the next of its patterns in life, in a cleared patch', () => {
    const { layer, art } = run(life, 10);
    const cells = find(layer, 'masthead-life-cells')[0];
    const live = (x0, x1, y0, y1) => [...cells.attrs.d.matchAll(/M([\d.]+) ([\d.]+)/g)]
      .map((m) => [Number(m[1]), Number(m[2])])
      .filter(([x, y]) => x >= x0 && x < x1 && y >= y0 && y < y1).length;
    for (const plant of PLANTS) {
      art.poke(600, 160, 10, 1450);
      const planted = plant.join('').split('O').length - 1;
      assert.equal(live(600 - 6 * 9, 600 + 6 * 9, 160 - 6 * 9, 160 + 6 * 9), planted);
    }
  });

  it('sprouts a root in the fractal where it lands, or beside the name, and wakes a resting growth', () => {
    const { layer, art } = run(fractal, 0);
    const tips = find(layer, 'masthead-fractal-tips')[0];
    let i = 1;
    for (; i <= 400 && tips.children.length > 0; i++) art.step(i, i * 92);
    assert.equal(tips.children.length, 0);
    art.poke(100, 60, i, i * 92);
    assert.equal(tips.children.length, 3);
    assert.ok(tips.children.every((g) => g.attrs.transform === 'translate(100.0 60.0)'));
    const grown = () => find(layer, 'masthead-fractal-glow')[0].attrs.d.split('M').length;
    const before = grown();
    for (let k = 1; k <= 20; k++) art.step(i + k, (i + k) * 92);
    assert.ok(grown() > before + 20, `${before} -> ${grown()}`);
    art.poke(600, 160, i + 20, (i + 20) * 92);
    const [x, y] = /translate\(([\d.]+) ([\d.]+)\)/.exec(tips.children[0].attrs.transform).slice(1).map(Number);
    assert.ok(Math.hypot((x - 600) / 300, (y - 160) / 94) >= 1, `${x} ${y}`);
  });

  it('surges through every trace on the circuit board, then fades', () => {
    const { layer, art } = run(circuit, 0);
    const surge = find(layer, 'masthead-circuit-surge')[0];
    const near = along(WIRES[4], 100);
    art.poke(near[0] + 3, near[1], 0, 0);
    assert.equal(surge.children.length, 2);
    const seen = new Set(surge.children);
    for (let i = 1; i <= 200; i++) {
      art.step(i, i * 24);
      surge.children.forEach((g) => seen.add(g));
    }
    assert.equal(seen.size, WIRES.length * 2);
    assert.equal(surge.children.length, 0);
  });

  it('opens the throttle on the road, then eases back to the cruise', () => {
    const { layer, art } = run(ghostrider, 0);
    const posts = find(layer, 'masthead-ghostrider-post')[0];
    const quiet = run(ghostrider, 0);
    const quietPosts = find(quiet.layer, 'masthead-ghostrider-post')[0];
    art.poke(600, 160, 0, 0);
    for (let i = 1; i <= 10; i++) { art.step(i, i * 40); quiet.art.step(i, i * 40); }
    assert.notEqual(posts.attrs.d, quietPosts.attrs.d);
    assert.ok(BOOST > 1 && SPEED > 0);
    for (let i = 11; i <= 600; i++) art.step(i, i * 40);
  });

  it('blows the train whistle, or calls the next train in when the track is empty', () => {
    const { layer, art } = run(train, 0);
    const smoke = find(layer, 'masthead-train-smoke')[0];
    for (let i = 1; i <= 20; i++) art.step(i, i * 40);
    art.poke(600, 300, 20, 800);
    assert.ok(smoke.children.some((p) => p.textContent.includes('TOOT!')));
    const cars = find(layer, 'masthead-train-cars')[0];
    let i = 21;
    for (; i <= 2000 && cars.attrs.opacity !== '0'; i++) art.step(i, i * 40);
    art.poke(600, 300, i, i * 40);
    art.step(i + 1, (i + 1) * 40);
    art.step(i + 2, (i + 2) * 40);
    assert.equal(cars.attrs.opacity, '1');
  });

  it('riffles the solari board on to the next dek now, in a wave from the flap clicked', () => {
    const deks = ['Beside the lead', 'The second story'];
    const { layer, art } = run(solari, 40, { deks });
    const cells = () => find(layer, 'masthead-solari-glyph').map((t) => t.textContent);
    const before = cells();
    art.poke(80, 110, 40, 40 * 58);
    art.step(41, 41 * 58);
    art.step(42, 42 * 58);
    const riffling = cells();
    assert.notEqual(riffling[0], before[0]);
    assert.equal(riffling[COLS * ROWS - 1], before[COLS * ROWS - 1]);
    for (let i = 43; i <= 120; i++) art.step(i, i * 58);
    const shown = rowsOf(cells());
    assert.ok(shown.join(' ').includes('STORY') || shown.join(' ').includes('LEAD'), shown.join('|'));
    assert.notDeepEqual(cells(), before);
  });

  it('bursts the bytecode rain from it, and decodes the instruction there', () => {
    const { layer, art } = run(bytecode, 50);
    art.poke(60, 40, 50, 3000);
    const note = find(layer, 'masthead-bytecode-note')[0];
    assert.ok(Number(note.attrs.opacity) > 0);
    assert.ok(PROGRAMS.flat().some((ins) => ins.text === note.children[0].textContent));
    const head = find(layer, 'masthead-bytecode-head');
    assert.ok(head.length > 0);
  });

  it('tears the signal round the height clicked, the band jumping there', () => {
    const { layer, art } = run(signalnoise, 0);
    art.poke(600, 250, 0, 0);
    assert.equal(Number(find(layer, 'masthead-noise-band')[0].attrs.y), 232);
    const lines = find(layer, 'masthead-noise-line').map((r) => Number(r.attrs.y));
    assert.ok(lines.length >= 3 && lines.every((y) => y >= 200 && y <= 314), lines.join(' '));
    for (let i = 1; i <= 20; i++) art.step(i, i * 70);
    assert.equal(find(layer, 'masthead-noise-burst')[0].children.length, 0);
  });

  it('sends a gust both ways from where the grass is clicked, laying it down away from there', () => {
    // Each blade's base and tip, from its curve.
    const blades = (layer) => find(layer, 'masthead-grass-blades').flatMap((p) =>
      [...p.attrs.d.matchAll(/M(-?[\d.]+) (-?[\d.]+)Q-?[\d.]+ -?[\d.]+ (-?[\d.]+) -?[\d.]+/g)].map((b) => ({ x: Number(b[1]), lean: Number(b[3]) - Number(b[1]) })));
    const still = run(grass, 0, { seed: 4 }), blown = run(grass, 0, { seed: 4 });
    blown.art.poke(600, 300, 0, 0);
    for (let i = 1; i <= 8; i++) { still.art.step(i, i * 50); blown.art.step(i, i * 50); }
    const a = blades(still.layer), b = blades(blown.layer);
    let right = 0, left = 0;
    a.forEach((bl, k) => {
      if (bl.x > 680 && bl.x < 760) right += b[k].lean - bl.lean;
      if (bl.x > 440 && bl.x < 520) left += b[k].lean - bl.lean;
    });
    assert.ok(right > 20 && left < -20, `right ${right}, left ${left}`);
    const [out, back] = pokeGusts(600);
    assert.ok(out.v > 0 && out.strength > 0 && back.v < 0 && back.strength < 0);
  });

  it('fires a counter-missile from the nearest base to where the sky is clicked, bursting there', () => {
    const { layer, art } = run(citydefense, 0, { seed: 3 });
    art.poke(420, 150, 0, 0);
    const trail = find(layer, 'masthead-citydefense-counter').at(-1);
    art.step(1, 40);
    assert.match(trail.attrs.d, new RegExp('^M600 ' + (GROUND - 9) + 'L'));
    let burst = null;
    for (let i = 2; i <= 80 && !burst; i++) {
      art.step(i, i * 40);
      burst = find(layer, 'masthead-citydefense-burst').find((b) => Math.abs(Number(b.attrs.cx) - 420) < 0.5 && Math.abs(Number(b.attrs.cy) - 150) < 0.5);
    }
    assert.ok(burst, 'it burst where clicked');
    // Clicked at the ground, it bursts above it, never in it.
    art.poke(80, 319, 80, 0);
    const low = find(layer, 'masthead-citydefense-counter').at(-1);
    art.step(81, 81 * 40);
    const end = /L(-?[\d.]+) (-?[\d.]+)$/.exec(low.attrs.d);
    assert.match(low.attrs.d, new RegExp('^M70 ' + (GROUND - 9) + 'L'));
    assert.ok(Number(end[2]) < GROUND - 9, 'it climbs toward a point above the ground');
  });

  it('drops an eddy in the flow field where clicked, swirling the strokes there, then dies away', () => {
    // The strokes near (600, 270), each as its direction.
    const near = (layer) => find(layer, 'masthead-flowfield-grid').flatMap((p) =>
      [...p.attrs.d.matchAll(/M(-?[\d.]+) (-?[\d.]+)l(-?[\d.]+) (-?[\d.]+)/g)].map((s) => s.slice(1).map(Number)))
      .filter(([x, y, dx, dy]) => Math.hypot(x + dx / 2 - 600, y + dy / 2 - 270) < 50);
    const still = run(flowfield, 10, { seed: 5 }), swirled = run(flowfield, 10, { seed: 5 });
    swirled.art.poke(600, 270, 10, 400);
    for (let i = 11; i <= 14; i++) { still.art.step(i, i * 40); swirled.art.step(i, i * 40); }
    const a = near(still.layer), b = near(swirled.layer);
    assert.ok(a.length >= 4);
    const turned = a.filter((s, k) => Math.abs(Math.atan2(s[3], s[2]) - Math.atan2(b[k][3], b[k][2])) > 0.3).length;
    assert.ok(turned >= a.length / 2, `${turned} of ${a.length} turned`);
    for (let i = 15; i <= 200; i++) { still.art.step(i, i * 40); swirled.art.step(i, i * 40); }
    assert.deepEqual(near(swirled.layer), near(still.layer));
  });

  it('banks the terrain toward the side clicked, then levels out', () => {
    const { layer, art } = run(terrainflight, 0);
    const view = find(layer, 'masthead-terrain-view')[0];
    art.poke(1000, 160, 0, 0);
    for (let i = 1; i <= 55; i++) art.step(i, i * 32);
    assert.ok(Number(/rotate\((-?[\d.]+)/.exec(view.attrs.transform)[1]) < -5);
    art.poke(100, 160, 55, 55 * 32);
    for (let i = 56; i <= 110; i++) art.step(i, i * 32);
    assert.ok(Number(/rotate\((-?[\d.]+)/.exec(view.attrs.transform)[1]) > 5);
    for (let i = 111; i <= 200; i++) art.step(i, i * 32);
    assert.equal(view.attrs.transform, '');
  });

  it('skips a stone across the water, shorter and lighter each time, toward the open side', () => {
    const from = skips(10, 30);
    assert.ok(from.length >= 3 && from.every((s) => s.x > 10 && s.y < 30));
    for (let k = 1; k < from.length; k++) {
      assert.ok(from[k].depth < from[k - 1].depth && from[k].after > from[k - 1].after);
      assert.ok(from[k].x - from[k - 1].x <= from[0].x - 10);
    }
    assert.ok(skips(110, 30).every((s) => s.x < 110));
    assert.ok(skips(60, 4).length === 0);
  });
});

const rowsOf = (cells) => Array.from({ length: ROWS }, (_, r) => cells.slice(r * COLS, (r + 1) * COLS).join('').trim()).filter(Boolean);

describe('the circuit', () => {
  it('draws its board and four fireflies that move by SVG alone, its steps idle until a surge', () => {
    const { layer, art } = run(circuit, 0);
    const before = serialize(layer);
    for (let i = 1; i <= 50; i++) art.step(i, i * 24);
    assert.equal(serialize(layer), before);
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

describe('the seasons', () => {
  const names = Object.keys(variants);
  // Noon, local time, as ?ambientDate gives it.
  const day = (y, m, d) => new Date(y, m - 1, d, 12);

  it('keeps the Halloween animations to October, and the rest to all year', () => {
    const october = inSeason(names, day(2026, 10, 31));
    const may = inSeason(names, day(2026, 5, 1));
    for (const name of ['bats', 'eyes', 'ghosts', 'graveyard', 'pumpkins', 'spider']) {
      assert.ok(october.includes(name) && !may.includes(name), name);
    }
    assert.ok(may.includes('boids') && october.includes('boids'));
    // In October every animation may be picked but the drafts (and those out of season).
    assert.equal(october.length, names.filter((n) => !DRAFTS.includes(n) && (!SEASONS[n] || during(SEASONS[n][0], day(2026, 10, 31)))).length);
    // A month is long enough that October's animations simply join the pool.
    assert.equal(weights(['bats', 'boids'], day(2026, 10, 15)).bats, 1);
  });

  it('never picks a draft at random, in or out of season', () => {
    // An animation made a draft drops out of the picking at once.
    DRAFTS.push('boids');
    try {
      assert.ok(!inSeason(names, day(2027, 6, 1)).includes('boids'));
      assert.equal(weights(['boids'], day(2027, 6, 1)).boids, 0);
    } finally {
      DRAFTS.pop();
    }
    assert.ok(inSeason(names, day(2027, 6, 1)).includes('boids'));
    for (const d of [day(2026, 10, 4), day(2027, 6, 1), day(2027, 1, 15)]) {
      const picked = inSeason(names, d);
      for (const name of DRAFTS) assert.ok(!picked.includes(name), name);
      for (let i = 0; i < 50; i++) assert.ok(!DRAFTS.includes(pick(names, d)));
    }
    for (const name of DRAFTS) assert.ok(names.includes(name), name);
  });

  it('lists only animations there are, in windows it understands', () => {
    for (const name of Object.keys(SEASONS)) {
      assert.ok(names.includes(name), name);
      for (const win of SEASONS[name]) assert.ok(isWindow(win), `${name}: ${JSON.stringify(win)}`);
    }
    for (const [name, wins] of Object.entries(OCCASIONS)) {
      for (const win of wins) assert.ok(isWindow(win), `${name}: ${JSON.stringify(win)}`);
    }
  });

  it('knows a window when it sees one, and not otherwise', () => {
    for (const win of [10, '07-04', '02-29', '12-24..12-26', '12-31..01-01', '2026-12-04',
      '2026-12-04..2026-12-12', 'halloween', { when: '07-04', weight: 50 }]) {
      assert.ok(isWindow(win), JSON.stringify(win));
    }
    for (const win of [0, 13, 2.5, '13-01', '02-30', '7-4', '2026-02-29', '2026-12-12..2026-12-04',
      '01-01..02-01..03-01', 'nowhen', { when: '07-04', weight: -1 }, null]) {
      assert.ok(!isWindow(win), JSON.stringify(win));
    }
  });

  it('opens each kind of window on its days, inclusive, and not a day either side', () => {
    const open = (win, y, m, d) => during(win, day(y, m, d));
    assert.ok(open('07-04', 2027, 7, 4) && !open('07-04', 2027, 7, 3) && !open('07-04', 2027, 7, 5));
    assert.ok(open('12-24..12-26', 2026, 12, 24) && open('12-24..12-26', 2026, 12, 26));
    assert.ok(!open('12-24..12-26', 2026, 12, 23) && !open('12-24..12-26', 2026, 12, 27));
    // Over the year end, from either side of it.
    assert.ok(open('12-30..01-02', 2026, 12, 31) && open('12-30..01-02', 2027, 1, 2));
    assert.ok(!open('12-30..01-02', 2027, 1, 3) && !open('12-30..01-02', 2026, 12, 29));
    // Once, on its own dates only; a dated range may cross the year end too.
    assert.ok(open('2027-12-24..2028-01-01', 2027, 12, 24) && open('2027-12-24..2028-01-01', 2028, 1, 1));
    assert.ok(!open('2027-12-24..2028-01-01', 2028, 12, 24) && !open('2027-12-24..2028-01-01', 2028, 1, 2));
    assert.ok(open('2026-12-04', 2026, 12, 4) && !open('2026-12-04', 2027, 12, 4));
    assert.ok(open(2, 2028, 2, 29) && !open(2, 2028, 3, 1));
  });

  it('weighs a window by how short it is, the shortest open one deciding, or by its own weight', () => {
    const was = { ...SEASONS };
    try {
      SEASONS.boids = ['06-27..07-04', '07-04'];
      SEASONS.life = ['2026-12-04..2026-12-11'];
      SEASONS.water = [{ when: '07-04', weight: 2 }];
      assert.equal(weights(['boids'], day(2027, 6, 28)).boids, REFERENCE_DAYS / 8);
      assert.equal(weights(['boids'], day(2027, 7, 4)).boids, REFERENCE_DAYS);
      assert.equal(weights(['boids'], day(2027, 7, 5)).boids, 0);
      assert.equal(weights(['life'], day(2026, 12, 8)).life, REFERENCE_DAYS / 8);
      assert.equal(weights(['water'], day(2027, 7, 4)).water, 2);
      assert.equal(weights(['grass'], day(2027, 7, 4)).grass, 1);
    } finally {
      for (const k of Object.keys(SEASONS)) delete SEASONS[k];
      Object.assign(SEASONS, was);
    }
  });

  it('picks by weight: a one-day occasion\'s animation more often than not, nothing out of season', () => {
    const was = { ...SEASONS };
    try {
      SEASONS.boids = ['07-04'];
      let s = 1;
      const random = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000; };
      let picked = 0;
      for (let i = 0; i < 2000; i++) if (pick(names, day(2027, 7, 4), random) === 'boids') picked++;
      const others = names.filter((n) => !SEASONS[n]).length;
      const expected = REFERENCE_DAYS / (REFERENCE_DAYS + others);
      assert.ok(Math.abs(picked / 2000 - expected) < 0.05, `${picked / 2000} vs ${expected}`);
      for (let i = 0; i < 200; i++) assert.notEqual(pick(names, day(2027, 7, 5), random), 'boids');
      assert.equal(pick(['bats'], day(2027, 5, 1)), null);
    } finally {
      for (const k of Object.keys(SEASONS)) delete SEASONS[k];
      Object.assign(SEASONS, was);
    }
  });
});

describe('the bytecode rain', () => {
  it('runs to 0xDEADBEEF at Halloween, and not otherwise', () => {
    assert.deepEqual(OCTOBER.slice(0, 4).map((b) => b.hex), ['DE', 'AD', 'BE', 'EF']);
    const shown = (date) => {
      const { layer } = run(bytecode, 2000, { date, seed: 11 });
      return find(layer, 'masthead-bytecode-glyph').map((t) => t.textContent).join(' ');
    };
    // No other program has a 0xDE byte, so DE on the board is the dead beef.
    assert.ok(PROGRAMS.flat().every((instruction) => !instruction.bytes.includes(0xde)));
    assert.match(shown(new Date(2026, 9, 15)), /\bDE\b/);
    assert.doesNotMatch(shown(new Date(2026, 4, 15)), /\bDE\b/);
  });

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

describe('city defense', () => {
  it('aims where a counter-missile meets the missile, not where the missile is', () => {
    const missile = { x: 300, y: 0, vx: 0.2, vy: 0.5 };
    const at = intercept(600, GROUND - 9, missile);
    const t = (at.y - missile.y) / missile.vy;
    assert.ok(Math.abs(Math.hypot(at.x - 600, at.y - (GROUND - 9)) / 4.2 - t) <= 1.5);
    assert.ok(at.y > 0 && at.y < GROUND - 20);
  });

  it('stands its cities and bases along the foot, clear of the name', () => {
    const { layer } = run(citydefense, 0);
    assert.equal(find(layer, 'masthead-citydefense-city').length, CITIES.length);
    assert.equal(find(layer, 'masthead-citydefense-base').length, BASES.length);
    assert.ok(GROUND > 290);
  });

  it('fires back, bursts, and loses a city now and then, rebuilding when most are gone', () => {
    const { layer, art } = run(citydefense, 0, { seed: 3 });
    let bursts = 0, fell = false, rebuilt = false;
    for (let i = 1; i <= 20000 && !rebuilt; i++) {
      art.step(i, i * 40);
      bursts = Math.max(bursts, find(layer, 'masthead-citydefense-burst').length);
      const rubble = find(layer, 'masthead-citydefense-rubble').length;
      if (rubble > 0) fell = true;
      if (fell && rubble === 0) rebuilt = true;
    }
    assert.ok(bursts > 0 && fell && rebuilt);
  });
});

describe('the lander', () => {
  // The lander's own physics, flown by its pilot until it's down.
  function fly(seed) {
    let r = seed;
    const rand = () => ((r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 0x100000000);
    const land = ground(rand, 1200), mid = (land.pad.x1 + land.pad.x2) / 2;
    const s = { x: mid + (seed % 2 ? 1 : -1) * 320, y: 12, vx: 0, vy: 0.1 };
    for (let i = 0; i < 4000; i++) {
      const burn = pilot(s, land.pad);
      s.vy += GRAVITY - (burn.main ? THRUST : 0);
      s.vx += (burn.left ? SIDE : 0) - (burn.right ? SIDE : 0);
      s.x += s.vx; s.y += s.vy;
      if (s.y >= land.pad.y - 5) return { s, land, steps: i };
    }
    return null;
  }

  it('makes flat ground for its pad among jagged hills', () => {
    let r = 4;
    const land = ground(() => ((r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 0x100000000), 1200);
    assert.ok(land.pad.x2 - land.pad.x1 >= 60);
    assert.ok(land.points.every(([, y]) => y >= 250 && y <= 310));
  });

  it('comes down gently on the pad, every time', () => {
    for (const seed of [1, 2, 3, 7, 42, 99, 123, 555]) {
      const flown = fly(seed);
      assert.ok(flown, `seed ${seed} never came down`);
      const { s, land } = flown;
      assert.ok(s.x > land.pad.x1 && s.x < land.pad.x2, `seed ${seed}: x ${s.x.toFixed(1)}`);
      assert.ok(s.vy < 0.2 && Math.abs(s.vx) < 0.3, `seed ${seed}: ${s.vx.toFixed(2)}, ${s.vy.toFixed(2)}`);
    }
  });
});

describe('rocks', () => {
  it('draws ragged rocks, and splits one the ship hits into two smaller', () => {
    let r = 9;
    assert.match(outline(() => ((r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 0x100000000), SIZES[0]), /^M.*Z$/);
    const { layer, art } = run(rocks, 0, { seed: 5 });
    const count = () => find(layer, 'masthead-rocks-rock').length;
    const start = count();
    let more = false, shots = false;
    for (let i = 1; i <= 3000 && !more; i++) {
      art.step(i, i * 40);
      if (find(layer, 'masthead-rocks-shot').length) shots = true;
      if (count() > start) more = true;
    }
    assert.ok(shots && more);
  });
});

describe('paddles', () => {
  it('knows where the ball will reach a paddle, off the walls', () => {
    assert.equal(landing({ x: 600, y: 100, vx: 5, vy: 0 }, RIGHT), 100);
    // Down 280 over the crossing: to the bottom (310) and back up.
    const y = landing({ x: 600, y: 100, vx: 5, vy: 2.5 }, RIGHT);
    assert.ok(Math.abs(y - (310 - (100 + 280 - 310))) < 1e-9, String(y));
  });

  it('rallies, and now and then a point is won', () => {
    const { layer, art } = run(paddles, 0);
    const score = () => find(layer, 'masthead-paddles-score').map((t) => t.textContent).join(':');
    const first = score();
    let changed = false;
    const ball = find(layer, 'masthead-paddles-ball')[0];
    for (let i = 1; i <= 15000 && !changed; i++) {
      art.step(i, i * 40);
      const x = Number(/translate\((-?[\d.]+)/.exec(ball.attrs.transform)[1]);
      assert.ok(x >= LEFT - 10 && x <= RIGHT + 10);
      changed = score() !== first;
    }
    assert.ok(changed);
  });
});

describe('grass', () => {
  it('leans with the wind, more where a gust is passing', () => {
    const calm = grassWind(600, 0, []);
    assert.ok(calm > 0);
    assert.ok(grassWind(600, 0, [{ x: 600, strength: 0.2 }]) > calm + 0.15);
    assert.ok(grassWind(600, 0, [{ x: 1500, strength: 0.4 }]) < calm + 0.01);
  });

  it('grows along the foot of the masthead and sways', () => {
    const { layer, art } = run(grass, 0);
    const blades = find(layer, 'masthead-grass-blades');
    assert.equal(blades.length, 3);
    const first = blades[2].attrs.d;
    const tips = [...first.matchAll(/ (-?[\d.]+) (-?[\d.]+)M|(-?[\d.]+)$/g)];
    assert.ok(tips.length > 50);
    for (let i = 1; i <= 20; i++) art.step(i, i * 50);
    assert.notEqual(blades[2].attrs.d, first);
  });
});

describe('the wind farm', () => {
  it('stands its turbines along the foot, the ones behind the name small and far', () => {
    let r = 6;
    const turbines = farm(() => ((r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 0x100000000), 1200);
    assert.ok(turbines.length >= 6);
    for (const t of turbines.filter((t) => Math.abs(t.x - 600) < 260)) assert.ok(t.depth <= 0.3);
  });

  it('turns faster as a gust reaches it', () => {
    assert.ok(farmWind(300, 0, [{ x: 300, strength: 0.6 }]) > farmWind(300, 0, []) + 0.5);
  });

  it('turns its rotors, keeping their shape however the masthead is stretched', () => {
    const { layer, art } = run(windfarm, 0, { stretch: 1.5 });
    const turbine = find(layer, 'masthead-windfarm-turbine')[0];
    assert.match(turbine.attrs.transform, /scale\(0\.6667 1\)$/);
    const rotor = turbine.children[1];
    const before = rotor.attrs.transform;
    art.step(1, 40);
    assert.notEqual(rotor.attrs.transform, before);
  });
});

describe('pong wars', () => {
  it('brings a square it touches over to its side, and bounces off it', () => {
    const cells = new Uint8Array(WAR_COLS * WAR_ROWS);
    const ball = { side: 1, x: 45, y: 45, vx: 3, vy: 0 };
    cells[1 * WAR_COLS + 1] = 0;
    bounce(ball, cells, 30, 30, 1200, 330);
    assert.ok(cells.some((c) => c === 1));
  });

  it('never lets either side win: both hold ground after a long while', () => {
    const { layer, art } = run(pongwars, 0, { seed: 4 });
    for (let i = 1; i <= 12000; i++) art.step(i, i * 40);
    const shown = find(layer, 'masthead-pongwars-cell').filter((r) => Number(r.attrs['fill-opacity']) > 0).length;
    const share = shown / (WAR_COLS * WAR_ROWS);
    assert.ok(share > 0.2 && share < 0.8, String(share));
  });
});

describe('stix', () => {
  it('claims the side of a closed cut without the Stix', () => {
    const cells = field();
    // A cut straight down the field at column 30, from the top border to the bottom.
    for (let y = 1; y < GH - 1; y++) cells[y * GW + 30] = 2;
    claim(cells, 80, 16);
    assert.equal(cells[16 * GW + 10], 1);
    assert.equal(cells[16 * GW + 80], 0);
    assert.equal(cells[16 * GW + 30], 1);
  });

  it('finds its way along the claimed ground', () => {
    const cells = field();
    const path = route(cells, (GH - 1) * GW + 60, GW + 0);
    assert.ok(path && path.every((i) => cells[i] === 1));
  });

  it('cuts, claims, and starts again when the field is mostly claimed', () => {
    const { layer, art } = run(stix, 0, { seed: 7 });
    const ground = find(layer, 'masthead-stix-claimed')[0];
    let grew = 0, cleared = false, last = ground.attrs.d;
    for (let i = 1; i <= 20000 && !cleared; i++) {
      art.step(i, i * 40);
      if (ground.attrs.d !== last) {
        if (ground.attrs.d.length < last.length / 3) cleared = true; else grew++;
        last = ground.attrs.d;
      }
    }
    assert.ok(grew > 5 && cleared, `${grew} ${cleared}`);
  });
});

describe('october', () => {
  it('opens eyes, blinks them, and closes them', () => {
    assert.equal(openness(0, 100, []), 0);
    assert.equal(openness(50, 100, []), 1);
    assert.equal(openness(50, 100, [50]), 0);
    assert.equal(openness(101, 100, []), 0);
    const { layer, art } = run(eyes, 0);
    const open = () => find(layer, 'masthead-eyes-pair').filter((p) => p.attrs.opacity === '1').length;
    assert.ok(open() >= 1);
    let changed = false;
    for (let i = 1; i <= 600 && !changed; i++) { const before = open(); art.step(i, i * 40); changed = open() !== before; }
    assert.ok(changed);
  });

  it('flaps bats across, wings up and down', () => {
    assert.notEqual(bat(1), bat(-1));
    const { layer, art } = run(bats, 0);
    assert.ok(find(layer, 'masthead-bats-bat').length >= 1);
    let most = 0;
    for (let i = 1; i <= 2000; i++) { art.step(i, i * 40); most = Math.max(most, find(layer, 'masthead-bats-bat').length); }
    assert.ok(most >= 2 && most <= 6);
  });

  it('ripples a ghost\'s hem, fades ghosts in and away', () => {
    assert.notEqual(sheet(0, 60), sheet(1, 60));
    assert.match(sheet(0, 60), /^M.*Z$/);
    const { layer, art } = run(ghosts, 0);
    assert.equal(find(layer, 'masthead-ghosts-ghost').length, 2);
    let came = false, went = false, before = 2, most = 0;
    for (let i = 1; i <= 4000; i++) {
      art.step(i, i * 40);
      const now = find(layer, 'masthead-ghosts-ghost').length;
      if (now > before) came = true;
      if (now < before) went = true;
      before = now;
      most = Math.max(most, now);
    }
    assert.ok(came && went && most >= 4 && most <= 6, String(most));
  });

  // The words: the date, the name and the tagline, roughly, in the art's units.
  const behindWords = (x, top, bottom) => Math.abs(x - 600) < 260 && bottom > 85 && top < 235;

  it('dances its ghosts round the name, seldom behind the words', () => {
    let behind = 0, total = 0;
    for (let a = 0; a < Math.PI * 2; a += 0.01) {
      const at = round(a, 450, 114, 1200);
      // Weighted by how long a ghost lingers there: quicker across the top and bottom.
      const weight = 1 / (1 + (1 - Math.abs(Math.cos(a))) * 1.6);
      total += weight;
      if (behindWords(at.x, at.y - 40, at.y)) behind += weight;
    }
    assert.ok(behind / total < 0.1, String(behind / total));
  });

  it('flies its bats above and below the name, bowing away as they pass', () => {
    for (const base of [50, 75, 250, 275]) {
      for (let x = 0; x <= 1200; x += 20) assert.ok(!behindWords(x, flight(x, base, 1200) - 12, flight(x, base, 1200) + 12), `${base} at ${x}`);
    }
    assert.ok(flight(600, 60, 1200) < flight(100, 60, 1200));
    assert.ok(flight(600, 260, 1200) > flight(100, 260, 1200));
  });

  it('flickers a row of carved pumpkins along the foot', () => {
    assert.equal(FACES.length, 4);
    const { layer, art } = run(pumpkins, 0);
    const faces = find(layer, 'masthead-pumpkins-face');
    assert.ok(faces.length >= 5);
    const before = faces.map((f) => f.attrs['fill-opacity']).join();
    art.step(1, 50);
    assert.notEqual(faces.map((f) => f.attrs['fill-opacity']).join(), before);
  });

  it('lets a spider down from its web and up again', () => {
    // Eight legs.
    assert.equal(spiderShape(0).split('M').length - 1, 8);
    assert.match(web(0, 1), /^M/);
    const { layer, art } = run(spider, 0);
    const thread = find(layer, 'masthead-spider-thread')[0];
    const length = () => Number(/V(-?[\d.]+)/.exec(thread.attrs.d)[1]);
    let longest = 0, shortened = false;
    for (let i = 1; i <= 2000; i++) {
      art.step(i, i * 40);
      const l = length();
      if (l < longest - 20) shortened = true;
      longest = Math.max(longest, l);
    }
    assert.ok(longest > 60 && shortened);
  });

  it('sets a graveyard under the moon, a bat crossing it and a ghost peeking now and then', () => {
    let r = 3;
    assert.match(tree(() => ((r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 0x100000000), 100), /^M/);
    const { layer, art } = run(graveyard, 0);
    assert.ok(find(layer, 'masthead-graveyard-stone').length >= 8);
    const batEl = find(layer, 'masthead-graveyard-bat')[0];
    const peeker = find(layer, 'masthead-graveyard-ghost')[0];
    let crossed = false, peeked = false;
    for (let i = 1; i <= 1500 && !(crossed && peeked); i++) {
      art.step(i, i * 50);
      crossed = crossed || batEl.attrs.opacity === '1';
      peeked = peeked || peeker.attrs.opacity === '1';
    }
    assert.ok(crossed && peeked);
  });
});

describe('the chase', () => {
  it('blurs the running bird\'s legs into a wheel: curved strokes turning inside a faint rim', () => {
    const one = blurLegs(-2, -16, 16, 16, 1), two = blurLegs(-2, -16, 16, 16, 2);
    assert.notEqual(one.strokes, two.strokes);
    assert.equal(one.rim, two.rim);
    // Arcs, not spokes: three curved strokes and a foot on the ground.
    assert.equal((one.strokes.match(/A/g) || []).length, 3);
    assert.match(one.strokes, /M-?[\d.]+ 0h7$/);
    // Three speed streaks trailing behind the wheel (behind is -x, facing right), each a length of its own.
    const streaks = [...one.streaks.matchAll(/M(-?[\d.]+) (-?[\d.]+)h(-\d+)/g)];
    assert.equal(streaks.length, 3);
    for (const [, x, , h] of streaks) assert.ok(Number(x) <= -2 - 16 * 0.9 - 3 + 0.01 && Number(h) <= -10, one.streaks);
    assert.notEqual(one.streaks, blurLegs(-2, -16, 16, 16, 3).streaks);

    const { layer, art } = run(chase, 0, { seed: 3 });
    const bird = find(layer, 'masthead-chase-bird')[0];
    const [blur] = find(bird, 'masthead-chase-blur'), [legs] = find(bird, 'masthead-chase-legs');
    const [streakEl] = find(bird, 'masthead-chase-streaks');
    let blurred = false;
    for (let i = 1; i <= 400; i++) {
      art.step(i, i * 60);
      const arcs = /A/.test(legs.attrs.d);
      // The rim shows exactly when the legs are a blur.
      assert.equal(blur.attrs.opacity === '1', arcs, `step ${i}`);
      assert.equal(streakEl.attrs.opacity === '1', arcs, `step ${i}`);
      blurred = blurred || arcs;
    }
    assert.ok(blurred);
  });

  it('scrambles the running canine\'s legs: four jointed legs, as far as legs go, never through the ground', () => {
    const hips = [[-14, -15], [-6, -15], [10, -15], [16, -15]];
    assert.equal(scramble(hips, 5, 6), scramble(hips, 5, 6));
    assert.notEqual(scramble(hips, 5, 6), scramble(hips, 6, 6));
    for (let n = 0; n < 500; n++) {
      const floor = 5 + (n % 4);
      const legs = scramble(hips, n, floor).split('M').filter(Boolean).map((leg) => leg.split('L').map((p) => p.split(' ').map(Number)));
      assert.equal(legs.length, 4);
      legs.forEach(([hip, knee, foot], k) => {
        assert.deepEqual(hip, hips[k]);
        // The thigh within SPLAY of straight down, toward head or tail; the foot never below the ground.
        const angle = Math.atan2(knee[0] - hip[0], knee[1] - hip[1]);
        assert.ok(Math.abs(angle) <= SPLAY + 0.01, `frame ${n}, leg ${k}: ${angle}`);
        assert.ok(foot[1] <= floor + 0.05, `frame ${n}, leg ${k}: foot at ${foot[1]}`);
      });
    }

    const { layer, art } = run(chase, 0, { seed: 3 });
    const dog = find(layer, 'masthead-chase-dog')[0];
    const [legs] = find(dog, 'masthead-chase-legs'), inner = dog.children[0];
    let scrambled = false;
    for (let i = 1; i <= 2000 && !scrambled; i++) {
      art.step(i, i * 60);
      // Scrambling, it's off the ground, and its feet reach down to it.
      const lift = /translate\(0 -(\d+)\)/.exec(inner.attrs.transform || '');
      if (lift && (legs.attrs.d.match(/L/g) || []).length === 8) scrambled = Number(lift[1]) >= 5 && Number(lift[1]) <= 8;
    }
    assert.ok(scrambled);
  });

  it('draws a hungry canine, its ribs showing, and no ribs on the bird', () => {
    const { layer } = run(chase, 0);
    assert.equal(find(find(layer, 'masthead-chase-dog')[0], 'masthead-chase-ribs').length, 1);
    assert.equal(find(find(layer, 'masthead-chase-bird')[0], 'masthead-chase-ribs').length, 0);
  });

  it('puts a tunnel where it\'s clicked: the bird runs into it and is gone, the canine smacks into it', () => {
    const { layer, art } = run(chase, 0, { seed: 3 });
    const tunnel = find(layer, 'masthead-chase-tunnel')[0];
    const bird = find(layer, 'masthead-chase-bird')[0], dog = find(layer, 'masthead-chase-dog')[0];
    const sign = find(layer, 'masthead-chase-sign')[0];
    const x = (el) => Number(/translate\((-?[\d.]+)/.exec(el.attrs.transform)[1]);
    assert.equal(tunnel.attrs.opacity, '0');
    art.poke(400, 200, 0, 0);
    assert.equal(tunnel.attrs.opacity, '1');
    art.poke(600, 10, 0, 0);
    assert.equal(x(tunnel), 600, 'a second click moves it, and only where along the ground matters');

    const dustLayer = find(layer, 'masthead-chase-dust')[0];
    let swallowed = false, smacked = false, gone = false, dust = new Set(dustLayer.children);
    for (let i = 1; i <= 20000 && !gone; i++) {
      // Keep a tunnel there until the canine has smacked into one.
      if (!smacked && tunnel.attrs.opacity === '0') art.poke(600, 0, i, 0);
      const before = bird.attrs.opacity === '1' ? x(bird) : null;
      // Its nose, 40 ahead of it at full width, wherever it faces.
      const nose = () => { const k = Number(/scale\((-?[\d.]+)/.exec(dog.attrs.transform)[1]); return x(dog) + 40 * k; };
      const noseBefore = dog.attrs.opacity === '1' ? nose() : null;
      art.step(i, i * 60);
      // The bird vanishes in the middle of the frame, at the tunnel, not at an edge.
      if (before !== null && bird.attrs.opacity === '0' && Math.abs(before - 600) < 30) swallowed = true;
      // Once it's in, its dust stops: none new until the canine comes, but the puff at the mouth.
      const fresh = dustLayer.children.filter((c) => !dust.has(c));
      if (swallowed && !smacked && dog.attrs.opacity === '0') {
        for (const c of fresh) assert.ok(Math.abs(Number(c.attrs.cx) - 600) < 1, `step ${i}: dust at ${c.attrs.cx}`);
      }
      dust = new Set(dustLayer.children);
      const sx = Math.abs(Number(/scale\((-?[\d.]+)/.exec(dog.attrs.transform)[1]));
      // It meets the rock at the middle of the tunnel, where the bird went in.
      if (sx < 0.3 && dog.attrs.opacity === '1' && !smacked) {
        // Squashed up, its nose to the middle of the tunnel, and got there running, not by a jump.
        assert.ok(Math.abs(nose() - 600) <= 2, `nose at ${nose()}`);
        assert.ok(noseBefore !== null && Math.abs(nose() - noseBefore) <= 20, `nose from ${noseBefore} to ${nose()}`);
        smacked = true;
      }
      // It never goes in: whenever it's out of sight, it's off the edge of the frame.
      if (dog.attrs.opacity === '0' && x(dog) > 0 && x(dog) < 1200) assert.ok(!smacked || Math.abs(x(dog) - 600) > 100, `step ${i}`);
      if (smacked && tunnel.attrs.opacity === '0') gone = true;
      if (smacked) assert.equal(sign.attrs.opacity === '1' && !gone, false);
    }
    assert.ok(swallowed, 'the bird ran into the tunnel');
    assert.ok(smacked, 'the canine smacked into it');
    assert.ok(gone, 'and then it faded');
  });

  it('never leaves a tunnel lying about: it waits a while, and is gone within 24 seconds of the click', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { layer, art } = run(chase, 0, { seed });
      const tunnel = find(layer, 'masthead-chase-tunnel')[0];
      for (let i = 1; i <= 50; i++) art.step(i, i * 60);
      art.poke(300 + seed * 20, 0, 50, 0);
      let at = null;
      for (let i = 51; i <= 450 && at === null; i++) {
        art.step(i, i * 60);
        if (tunnel.attrs.opacity === '0') at = i - 50;
      }
      assert.ok(at !== null && at <= 400, `seed ${seed}: gone after ${at}`);
    }
  });

  it('fades a tunnel nothing runs into after 20 seconds or so, but never mid-smack', () => {
    assert.equal(TUNNEL_WAIT * 60 >= 18000 && TUNNEL_WAIT * 60 <= 22000, true);
    assert.equal(tunnelExpires(TUNNEL_WAIT, false), false);
    assert.equal(tunnelExpires(TUNNEL_WAIT + 1, false), true);
    assert.equal(tunnelExpires(TUNNEL_WAIT + 1, true), false);
  });

  it('holds up a sign now and then, its words the right way round', () => {
    const sign = find(run(chase, 0).layer, 'masthead-chase-sign')[0];
    assert.equal(sign.children[1].textContent, '\u2026not a coyote.');
  });

  it('plays every act, the canine always popping back to its own shape', () => {
    const { layer, art } = run(chase, 0, { seed: 3 });
    const dog = find(layer, 'masthead-chase-dog')[0];
    const seen = { flat: false, splat: false, alarm: false, train: false, anvil: false, sign: false };
    const sign = find(layer, 'masthead-chase-sign')[0];
    const train = find(layer, 'masthead-chase-train')[0], anvil = find(layer, 'masthead-chase-anvil')[0];
    const alarm = dog.children[0].children.find((c) => (c.attrs.class || '').includes('alarm'));
    for (let i = 1; i <= 40000; i++) {
      art.step(i, i * 60);
      const scale = /scale\((-?[\d.]+) (-?[\d.]+)\)/.exec(dog.attrs.transform);
      const sx = Math.abs(Number(scale[1])), sy = Number(scale[2]);
      if (sy < 0.2) seen.flat = true;
      if (sx < 0.3) seen.splat = true;
      if (alarm.attrs.opacity === '1') seen.alarm = true;
      if (train.attrs.opacity === '1') seen.train = true;
      if (anvil.attrs.opacity === '1') seen.anvil = true;
      if (sign.attrs.opacity === '1') seen.sign = true;
      // Whenever it's out of sight it's back to its own shape.
      if (dog.attrs.opacity === '0') assert.ok(Math.abs(sy - 1) < 1e-9 && Math.abs(sx - 1) < 1e-9, `step ${i}`);
    }
    assert.deepEqual(seen, { flat: true, splat: true, alarm: true, train: true, anvil: true, sign: true });
  });
});

describe('deadline', () => {
  it('types with both hands on the keyboard, and rests its head on it in despair', () => {
    for (const name of ['typeA', 'typeB']) {
      const w = writer(DESK_POSES[name]);
      for (const hand of [w.near[2], w.far[2]]) assert.ok(hand[0] >= 48 && hand[0] <= 94 && hand[1] >= -34 && hand[1] <= -22, `${name}: ${hand}`);
    }
    const slump = writer(DESK_POSES.slump);
    assert.ok(slump.head[0] > 50 && slump.head[0] < 94 && slump.head[1] > -48, String(slump.head));
    // Hands rest on the desk, never through it.
    for (const pose of Object.values(DESK_POSES)) {
      const w = writer(pose);
      for (const hand of [w.near[2], w.far[2]]) assert.ok(hand[1] <= -22, String(hand));
    }
  });

  it('snaps from pose to pose, holding each, and despairs now and then', () => {
    let r = 4;
    const rand = () => ((r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 0x100000000);
    assert.equal(SCENES.despair(rand).filter((b) => b[2] === 'bang').length >= 2, true);
    const { layer, art } = run(deadline, 0, { seed: 6 });
    const bang = find(layer, 'masthead-deadline-bang')[0];
    const screen = find(layer, 'masthead-deadline-screen')[0];
    let banged = false, wrote = false;
    for (let i = 1; i <= 4000 && !(banged && wrote); i++) {
      art.step(i, i * 90);
      banged = banged || bang.attrs.opacity === '1';
      wrote = wrote || (screen.attrs.d || '').length > 0;
    }
    assert.ok(banged && wrote);
  });
});

describe('deadline\'s anvil', () => {
  it('falls faster and faster, flattens everything, and lets it pop back up', () => {
    const ys = [0, 1, 2, 3, 4, 5, 6].map((f) => anvilAt(f).y);
    for (let k = 2; k < ys.length; k++) assert.ok(ys[k] - ys[k - 1] > ys[k - 1] - ys[k - 2]);
    const landed = anvilAt(ANVIL.fall);
    assert.ok(landed.impact && landed.height === ANVIL.squash);
    assert.equal(anvilAt(ANVIL.fall + ANVIL.flat).shown, false);
    assert.equal(anvilAt(ANVIL.fall + ANVIL.flat + ANVIL.pop.length), null);
    assert.equal(ANVIL.pop.at(-1), 1);
  });

  it('drops now and then, flattening the desk and the writer, and they come back as they were', () => {
    const { layer, art } = run(deadline, 0, { seed: 6 });
    const world = layer.children[0].children[0];
    let flattened = false, restored = false;
    for (let i = 1; i <= 20000 && !restored; i++) {
      art.step(i, i * 70);
      const t = world.attrs.transform || '';
      if (t.includes('scale(1 ' + ANVIL.squash + ')')) flattened = true;
      if (flattened && t === '') restored = true;
    }
    assert.ok(flattened && restored);
  });
});

describe('the duel', () => {
  // A lunge by a fencer facing right at [attX] against one facing left at [defX].
  const exchange = (attack, parry, attX, defX) => {
    const A = figure(POSES[attack]), D = figure(POSES[parry]);
    const at = (p) => [attX + p[0], p[1]], mirrored = (p) => [defX - p[0], p[1]];
    return { meet: crossing(at(A.hand), at(A.tip), mirrored(D.hand), mirrored(D.tip)), reach: at(A.tip)[0], body: defX };
  };

  it('meets a lunge with a parry, blade on blade, high and low', () => {
    for (const [attack, parry] of [['lungeHigh', 'parryHigh'], ['lungeLow', 'parryLow']]) {
      const { meet } = exchange(attack, parry, 10, 96);
      assert.ok(meet, attack);
    }
  });

  it('never lands a touch', () => {
    for (const attack of ['lungeHigh', 'lungeLow']) {
      const { reach, body } = exchange(attack, 'parryHigh', 10, 96);
      assert.ok(reach < body - 6, `${attack} reaches ${reach.toFixed(1)}`);
    }
  });

  it('keeps its fencers standing: feet on the ground, head above the hips', () => {
    for (const name of Object.keys(POSES)) {
      for (const t of [0, 0.5, 1]) {
        const f = figure(mixPose(POSES.guard, POSES[name], t));
        assert.ok(f.head[1] < -50 && f.head[1] > -80, name);
        for (const limb of f.limbs.slice(0, 2)) assert.ok(limb[2][1] <= 0 && limb[2][1] >= -5, name);
      }
    }
  });

  it('swings wildly from the fencer nearer a click, and the other parries it over its head', () => {
    for (const [clickX, swinger] of [[400, 0], [800, 1]]) {
      const { layer, art } = run(duel, 0, { seed: 9 });
      const fencers = find(layer, 'masthead-duel-fencer'), spark = find(layer, 'masthead-duel-spark')[0];
      const head = (k) => [Number(fencers[k].children[1].attrs.cx), Number(fencers[k].children[1].attrs.cy)];
      const blade = (k) => fencers[k].children[2].attrs.d.match(/-?[\d.]+/g).slice(0, 4).map(Number);
      for (let i = 1; i <= 37; i++) art.step(i, i * 40);
      const before = head(swinger);
      art.poke(clickX, 200, 37, 0);
      art.step(38, 38 * 40);
      // Cut in mid-phrase, nobody jumps.
      assert.ok(Math.hypot(head(swinger)[0] - before[0], head(swinger)[1] - before[1]) < 4, 'no jump');
      let woundUp = false, parried = false, sparked = false;
      for (let i = 39; i <= 38 + 30; i++) {
        art.step(i, i * 40);
        const [hx, hy, tx, ty] = blade(swinger), facing = swinger ? -1 : 1;
        // Cocked back over its shoulder: the tip behind the hand and well above it.
        if ((tx - hx) * facing < -10 && ty < hy - 20) woundUp = true;
        // The other's sword hand over its own head.
        const other = 1 - swinger, [ohx, ohy] = blade(other);
        if (woundUp && ohy < head(other)[1]) parried = true;
        if (parried && spark.attrs.opacity === '1.00') sparked = true;
      }
      assert.ok(woundUp && parried && sparked, `${clickX}: wound up ${woundUp}, parried ${parried}, spark ${sparked}`);
    }
  });

  it('breaks the swinger\'s blade on about one wild swing in three; it stares or facepalms, drops the stub and draws another', () => {
    const rate = Array.from({ length: 300 }, (_, n) => breaks(9, n)).filter(Boolean).length / 300;
    assert.ok(rate > 0.25 && rate < 0.42, String(rate));
    assert.equal(breaks(9, 2), breaks(9, 2));

    const { layer, art } = run(duel, 0, { seed: 9 });
    const fencers = find(layer, 'masthead-duel-fencer'), pieces = find(layer, 'masthead-duel-piece');
    const length = (k) => { const [hx, hy, tx, ty] = fencers[k].children[2].attrs.d.match(/-?[\d.]+/g).slice(0, 4).map(Number); return Math.hypot(tx - hx, ty - hy); };
    const flat = (el) => { const e = el.attrs.opacity !== '0' && el.attrs.d ? el.attrs.d.match(/-?[\d.]+/g).map(Number) : null; return !!e && Math.abs(e[1] - 310.5) < 0.2 && Math.abs(e[3] - 310.5) < 0.2; };
    // The free hand: the end of the last limb drawn. How near it comes to the face.
    const palmToFace = () => {
      const pts = fencers[0].children[0].attrs.d.split('M').filter(Boolean).at(-1).split('L').map((q) => q.split(' ').map(Number));
      const head = fencers[0].children[1].attrs;
      return Math.hypot(pts.at(-1)[0] - Number(head.cx), pts.at(-1)[1] - Number(head.cy));
    };
    let i = 30, seenBreak = false, seenWhole = false, seenPalm = false, seenStare = false;
    for (let k = 1; k <= i; k++) art.step(k, k * 40);
    for (let n = 0; n < 6; n++) {
      art.poke(400, 200, i, 0);
      const lengths = [], landed = [false, false];
      let nearest = Infinity, landedAt = null, palmAt = null;
      for (let k = 0; k < 190; k++) {
        i++; art.step(i, i * 40);
        lengths.push(length(0));
        nearest = Math.min(nearest, palmToFace());
        if (palmAt === null && palmToFace() < 8) palmAt = k;
        pieces.forEach((el, j) => { if (flat(el)) landed[j] = true; });
        if (landedAt === null && landed[0]) landedAt = k;
      }
      if (breaks(9, n) && facepalms(9, n)) {
        seenPalm = true;
        assert.ok(nearest < 8, `click ${n}: hand to face, ${nearest}`);
        // Only once the broken end is down.
        assert.ok(landedAt !== null && palmAt > landedAt, `click ${n}: landed ${landedAt}, facepalm ${palmAt}`);
      }
      else { if (breaks(9, n)) seenStare = true; assert.ok(nearest > 10, `click ${n}: no facepalm, ${nearest}`); }
      const stub = lengths.findIndex((l) => Math.abs(l - 42 * STUB) < 0.5);
      if (breaks(9, n)) {
        seenBreak = true;
        // A stub, then nothing in hand, then a blade drawn out to full length, growing all the way.
        const empty = lengths.findIndex((l, j) => j > stub && l < 0.5);
        const whole = lengths.findIndex((l, j) => j > empty && l > 41.5);
        assert.ok(stub >= 0 && empty > stub && whole > empty, `click ${n}: stub ${stub}, empty ${empty}, whole ${whole}`);
        for (let j = empty + 1; j <= whole; j++) assert.ok(lengths[j] >= lengths[j - 1] - 1e-9, `click ${n}: drawn out steadily`);
        assert.ok(lengths.slice(whole, whole + 3).some((l) => l > 41.5) && whole - empty > 4, `click ${n}: drawn, not popped in`);
        assert.ok(landed[0] && landed[1], `click ${n}: the broken end and the stub both on the ground`);
      } else {
        seenWhole = true;
        assert.ok(Math.min(...lengths) > 41.5, `click ${n}: whole, ${Math.min(...lengths)}`);
      }
      // Back in guard, the blade is whole.
      assert.ok(Math.abs(length(0) - 42) < 0.5, `click ${n}: ${length(0)}`);
    }
    assert.ok(seenBreak && seenWhole && seenPalm && seenStare);
  });

  it('fences back and forth across the masthead without either passing the other, and without end', () => {
    const { layer, art } = run(duel, 0, { seed: 9 });
    const group = layer.children[1];
    const fencers = find(layer, 'masthead-duel-fencer');
    let lo = Infinity, hi = -Infinity, sparks = 0;
    const spark = find(layer, 'masthead-duel-spark')[0];
    for (let i = 1; i <= 20000; i++) {
      art.step(i, i * 40);
      const mid = Number(/translate\((-?[\d.]+)/.exec(group.attrs.transform)[1]);
      lo = Math.min(lo, mid); hi = Math.max(hi, mid);
      if (spark.attrs.opacity === '1.00') sparks++;
      // The left fencer's head stays left of the right one's.
      const heads = fencers.map((f) => Number(f.children[1].attrs.cx));
      assert.ok(heads[0] < heads[1], `step ${i}`);
    }
    assert.ok(lo > 60 && hi < 1140, `${lo} ${hi}`);
    assert.ok(hi - lo > 150, `travels ${lo} to ${hi}`);
    assert.ok(sparks > 50, String(sparks));
  });
});

describe('nightcity', () => {
  const points = (d) => [...(d || '').matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);

  it('draws into a fixed set of elements, however long it flies', () => {
    const { layer, art } = run(nightcity, 0);
    const count = serialize(layer).split('[').length;
    for (let i = 1; i <= 3000; i++) art.step(i, i * 40);
    assert.equal(serialize(layer).split('[').length, count);
  });

  it('draws the brightest windows, the nearest, only off to the sides of the name', () => {
    const { layer, art } = run(nightcity, 0, { seed: 3 });
    for (let i = 1; i <= 1500; i++) {
      art.step(i, i * 40);
      const g = find(layer, 'masthead-nightcity-band-0')[0];
      const win = find(g, 'masthead-nightcity-windows')[0];
      for (const [x] of points(win.attrs.d)) assert.ok(Math.abs(x - 600) > 200, `${x} at ${i}`);
    }
  });

  it('banks toward the side clicked and sends a car past on that side, out of the frame', () => {
    const { layer, art } = run(nightcity, 0);
    const view = find(layer, 'masthead-nightcity-view')[0];
    const car = find(layer, 'masthead-nightcity-car')[0];
    art.poke(1000, 120, 0, 0);
    let last = 600;
    for (let i = 1; i <= 25; i++) {
      art.step(i, i * 40);
      const [x] = points(car.attrs.d)[0];
      assert.ok(x > last, `${x} after ${last}`);
      last = x;
    }
    assert.ok(Number(/rotate\((-?[\d.]+)/.exec(view.attrs.transform)[1]) < -1);
    for (let i = 26; i <= 200; i++) art.step(i, i * 40);
    assert.equal(view.attrs.transform, '');
    art.poke(100, 120, 200, 200 * 40);
    art.step(201, 201 * 40);
    assert.ok(points(car.attrs.d)[0][0] < 600);
  });
});

describe('ghostrider', () => {
  const road = (curve, height = () => 0) => ({ curve: () => curve, height });
  const seeded = (seed) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 0x100000000);

  it('runs a straight road to the middle of the horizon, narrowing as it goes', () => {
    const segs = project(road(0), 0.5, 1200);
    // All but the few nearer than the screen's foot.
    assert.ok(segs.length > DRAW - 6);
    assert.ok(segs.every((s) => s.x === 600 && !s.hidden));
    for (let k = 1; k < segs.length; k++) {
      assert.ok(segs[k].y < segs[k - 1].y && segs[k].w < segs[k - 1].w);
    }
    // It vanishes just under the horizon, a quarter of the way down, clear of the name.
    assert.ok(segs.at(-1).y < 90);
  });

  it('bends the far road aside, the near road staying ahead of you', () => {
    const segs = project(road(MAX_CURVE), 3.2, 1200);
    const near = segs.find((s) => s.y <= 320);
    assert.ok(Math.abs(near.x - 600) < 10, String(near.x));
    assert.ok(segs.at(-1).x > 800);
    // A sweep, not a hook at the horizon: by the name's height it has already moved aside.
    const atName = segs.find((s) => s.y < 170);
    assert.ok(atName.x > 610, String(atName.x));
  });

  it("hides what's beyond a rise", () => {
    // Up, then down beyond segment 20.
    const segs = project(road(0, (i) => (i < 40 ? i * 0.01 : 0.4 - (i - 40) * 0.015)), 0, 1200);
    assert.ok(segs.some((s) => s.hidden));
  });

  it('drives smoothly: the far road moves a little each step, never jumps', () => {
    const r = course(seeded(5));
    let last = project(r, 0, 1200);
    for (let cz = SPEED; cz < 600; cz += SPEED) {
      const now = project(r, cz, 1200);
      // The same segment, a step on.
      const s = now.find((x) => x.i === last.at(-2).i);
      assert.ok(s && Math.abs(s.x - last.at(-2).x) < 12, `at ${cz.toFixed(2)}`);
      last = now;
    }
  });

  it('keeps its bends gentle and its course the same for the same seed', () => {
    const a = course(seeded(9)), b = course(seeded(9));
    for (let i = 0; i < 2000; i++) {
      assert.ok(Math.abs(a.curve(i)) <= MAX_CURVE);
      assert.equal(a.curve(i), b.curve(i));
    }
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

describe('the triangles', () => {
  const seeded = (seed) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 0x100000000; };

  it('meshes the whole frame, each cell two triangles, each edge once', () => {
    const { points, tris, edges } = mesh(seeded(5), 1200, 320);
    assert.equal(points.length, (TRI_COLS + 1) * (TRI_ROWS + 1));
    assert.equal(tris.length, TRI_COLS * TRI_ROWS * 2);
    const keys = edges.map(([a, b]) => Math.min(a, b) + '-' + Math.max(a, b));
    assert.equal(new Set(keys).size, keys.length);
    for (const t of tris) for (let i = 0; i < 3; i++) {
      const a = t[i], b = t[(i + 1) % 3];
      assert.ok(keys.includes(Math.min(a, b) + '-' + Math.max(a, b)));
    }
    const xs = points.map((p) => p.x0), ys = points.map((p) => p.y0);
    assert.deepEqual([Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)], [0, 1200, 0, 320]);
  });

  it('breathes without ever folding a triangle, even rippled', () => {
    for (const seed of [1, 7, 42, 99, 1234]) {
      const { points, tris } = mesh(seeded(seed), 1200, 320);
      const rest = tris.map((t) => Math.sign(winding(points.map((p) => ({ x: p.x0, y: p.y0 })), t)));
      for (let n = 0; n <= 4000; n += 3) {
        const at = Math.floor(n / 150) * 150;
        place(points, n, { x: (at * 37) % 1200, y: (at * 13) % 320, n: at });
        tris.forEach((t, i) => assert.equal(Math.sign(winding(points, t)), rest[i], `seed ${seed}, step ${n}`));
      }
    }
  });

  it('moves from the first step', () => {
    const { layer, art } = run(triangles, 0);
    const edges = () => find(layer, 'masthead-triangles-edge').map((e) => e.attrs.d).join('');
    const first = edges();
    art.step(1, 40);
    assert.notEqual(edges(), first);
  });

  it('lights a triangle now and then, faintly', () => {
    const { layer, art } = run(triangles, 0);
    const fills = find(layer, 'masthead-triangles-fill');
    let most = 0;
    for (let n = 1; n <= 1000; n++) {
      art.step(n, n * 40);
      for (const f of fills) most = Math.max(most, Number(f.attrs.opacity));
    }
    assert.ok(most > 0.05 && most <= 0.3, String(most));
  });

  it('sends a ring of lit triangles out from a click, and settles', () => {
    const { layer, art } = run(triangles, 10);
    const ring = find(layer, 'masthead-triangles-ring')[0];
    assert.equal(ring.attrs.opacity, '0');
    art.poke(600, 160, 10, 400);
    art.step(11, 440);
    art.step(12, 480);
    assert.ok(Number(ring.attrs.opacity) > 0 && ring.attrs.d.length > 0);
    for (let n = 13; n <= 300; n++) art.step(n, n * 40);
    assert.equal(ring.attrs.opacity, '0');
describe('truchet', () => {
  const angle = (tile) => Number(/rotate\(([-\d.]+)\)/.exec(tile.attrs.transform)[1]);

  it('joins each edge to one other, both ways, in either orientation', () => {
    for (const joins of JOINS) {
      joins.forEach((to, from) => { assert.notEqual(to, from); assert.equal(joins[to], from); });
    }
  });

  it('keeps its tiles about square on screen, however wide the masthead', () => {
    const h = 320 / TRUCHET_ROWS;
    for (const stretch of [1, 1.6, 3]) {
      const w = 1200 / columns(1200, 320, stretch) * stretch;
      assert.ok(Math.abs(w / h - 1) < 0.1, `${stretch}: ${w} x ${h}`);
    }
    const { layer } = run(truchet, 0, { stretch: 2 });
    assert.equal(find(layer, 'masthead-truchet-tile').length, columns(1200, 320, 2) * TRUCHET_ROWS);
  });

  it('follows a path tile to tile, entering each by the edge the last left by', () => {
    const cols = 8, turns = Array.from({ length: cols * TRUCHET_ROWS }, (_, i) => (i * 7) % 4);
    const path = follow(turns, cols, TRUCHET_ROWS, 3, 5, 2, 40);
    assert.ok(path.length > 1);
    for (let k = 1; k < path.length; k++) {
      const a = path[k - 1], b = path[k];
      assert.equal(Math.abs(a.c - b.c) + Math.abs(a.r - b.r), 1);
      assert.equal(b.from, (a.to + 2) % 4);
    }
  });

  it('is fainter behind the name than at the foot', () => {
    assert.ok(truchetStrength(2, TRUCHET_ROWS) < 0.5);
    assert.ok(truchetStrength(TRUCHET_ROWS - 1, TRUCHET_ROWS) > truchetStrength(0, TRUCHET_ROWS));
  });

  it('turns one tile at a time, a quarter, easing round to rest', () => {
    const { layer, art } = run(truchet, 0);
    const tiles = find(layer, 'masthead-truchet-tile');
    const before = tiles.map(angle);
    let most = 0;
    for (let n = 1; n <= 600; n++) {
      art.step(n, n * 40);
      most = Math.max(most, find(layer, 'masthead-truchet-turning').length);
    }
    assert.equal(most, 1);
    const turned = tiles.filter((t, i) => angle(t) % 90 !== 0 || angle(t) !== before[i]);
    assert.ok(turned.length >= 10, `${turned.length} turned`);
    assert.ok(tiles.every((t) => angle(t) % 90 === 0 || t.attrs.class.includes('turning')));
  });

  it('turns the tile poked, then its neighbours', () => {
    const { layer, art } = run(truchet, 0);
    const tiles = find(layer, 'masthead-truchet-tile');
    const cols = tiles.length / TRUCHET_ROWS, tw = 1200 / cols, th = 320 / TRUCHET_ROWS;
    const at = 3 * cols + 10, before = tiles.map(angle);
    art.poke(10.5 * tw, 3.5 * th, 0, 0);
    art.step(1, 40);
    assert.notEqual(angle(tiles[at]), before[at]);
    for (let n = 2; n <= 12 + TURN_STEPS + 2; n++) art.step(n, n * 40);
    for (const i of [at - cols - 1, at - 1, at + 1, at + cols, at + cols + 1]) assert.equal(angle(tiles[i]) % 360, (before[i] + 90) % 360, `tile ${i}`);
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

describe('the ships', () => {
  const at = (g) => /translate\((-?[\d.]+) (-?[\d.]+)\)/.exec(g.attrs.transform).slice(1).map(Number);

  it('sail on the sea, a few at a time, every kind in a long enough run', () => {
    const { layer, art } = run(ships, 0, { seed: 5 });
    const seen = new Set();
    for (let n = 1; n <= 20000; n++) {
      art.step(n, n * 40);
      if (n % 50) continue;
      const fleet = find(layer, 'masthead-ships-ship');
      assert.ok(fleet.length <= MAX_SHIPS, `${fleet.length} ships at ${n}`);
      for (const g of fleet) {
        const [, y] = at(g);
        assert.ok(y > HORIZON && y < NEAR, `${g.attrs.class} at y ${y}`);
        seen.add(g.attrs.class.split(' ').pop().replace('masthead-ships-', ''));
      }
    }
    assert.deepEqual([...seen].sort(), Object.keys(KINDS).sort());
  });

  it('trail smoke from a liner, which drifts up and fades', () => {
    const { layer, art } = run(ships, 0, { seed: 5 });
    let puff = null, n = 0;
    while (!puff && n < 20000) {
      n++;
      art.step(n, n * 40);
      puff = find(layer, 'masthead-ships-puff').at(-1) || null;
    }
    assert.ok(puff, 'a liner smoked');
    const y0 = Number(puff.attrs.cy), o0 = Number(puff.attrs.opacity);
    for (let k = 1; k <= 30; k++) art.step(n + k, (n + k) * 40);
    assert.ok(Number(puff.attrs.cy) < y0 && Number(puff.attrs.opacity) < o0);
  });

  it('leaps a dolphin from the water and back in', () => {
    assert.deepEqual([leap(0).y, leap(1).y].map((y) => Math.abs(y)), [0, 0]);
    assert.equal(leap(0.5).y, -LEAP_HEIGHT);
    assert.ok(leap(0.1).angle < 0 && leap(0.9).angle > 0, 'nose up, then down');
  });

  it('sends a dolphin from the water below a poke, with a splash in and out', () => {
    const { layer, art } = run(ships, 10);
    art.poke(400, 60, 10, 400);
    const dolphin = find(layer, 'masthead-ships-dolphin')[0];
    const [x0, y0] = at(dolphin);
    assert.ok(Math.abs(x0 - 400) < 80 && y0 > HORIZON, `${x0}, ${y0}`);
    assert.equal(find(layer, 'masthead-ships-splash').length, 1);
    for (let n = 11; n <= 10 + LEAP_STEPS / 2; n++) art.step(n, n * 40);
    assert.ok(at(dolphin)[1] < y0 - LEAP_HEIGHT / 2, 'in the air');
    for (let n = 11 + LEAP_STEPS / 2; n <= 10 + LEAP_STEPS; n++) art.step(n, n * 40);
    assert.equal(find(layer, 'masthead-ships-dolphin').length, 0);
    // The splash going in has faded by now; the one coming out is where it lands, on along.
    const out = find(layer, 'masthead-ships-splash');
    assert.equal(out.length, 1);
    assert.ok(Number(out[0].attrs.cx) > x0 + 60, `${out[0].attrs.cx} after ${x0}`);
    for (let n = 11 + LEAP_STEPS; n <= 40 + LEAP_STEPS; n++) art.step(n, n * 40);
    assert.equal(find(layer, 'masthead-ships-splash').length, 0);
  });

  it('keeps to three dolphins at once', () => {
    const { layer, art } = run(ships, 10);
    for (let i = 0; i < 6; i++) art.poke(100 + i * 150, 200, 10, 400);
    assert.equal(find(layer, 'masthead-ships-dolphin').length, 3);
  });
});

describe('the skyline', () => {
  const lcg = (r) => () => ((r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 0x100000000);

  it('stands its buildings shoulder to shoulder across the foot, low behind the name', () => {
    for (const seed of [1, 7, 42]) {
      const near = city(lcg(seed), 1200, false);
      assert.ok(near[0].x <= 10 && near.at(-1).x + near.at(-1).w >= 1200);
      for (const b of near.filter((b) => Math.abs(b.x + b.w / 2 - 600) < 250)) assert.ok(b.h <= 60, `${b.h} behind the name`);
      for (const b of city(lcg(seed), 1200, true)) assert.ok(STREET - b.h > 120, 'the far row stays below the top of the name');
    }
  });

  it('draws every building and window on the ground, windows inside their walls', () => {
    const { layer } = run(skyline, 0);
    for (const p of find(layer, 'masthead-skyline-building')) assert.match(p.attrs.d, new RegExp('^M[\\d.-]+ ' + STREET + 'V.*V' + STREET + '$'));
    const windows = find(layer, 'masthead-skyline-window');
    assert.ok(windows.length > 40);
    for (const w of windows) assert.ok(Number(w.attrs.y) + 4 < STREET && Number(w.attrs.y) > 160);
  });

  it('lights and darkens windows one at a time, about a third lit', () => {
    const { layer, art } = run(skyline, 0);
    const lit = () => find(layer, 'masthead-skyline-window').filter((w) => w.attrs.opacity === '1').length;
    const total = find(layer, 'masthead-skyline-window').length;
    let changes = 0, before = lit();
    for (let n = 1; n <= 2000; n++) {
      art.step(n, n * 50);
      const now = lit();
      assert.ok(Math.abs(now - before) <= 1);
      if (now !== before) changes++;
      before = now;
    }
    assert.ok(changes > 50, `${changes} changes`);
    assert.ok(before > total * 0.15 && before < total * 0.6, `${before} of ${total}`);
  });

  it('rains in showers that come and go, slanting the same way at any stretch', () => {
    const { layer, art } = run(skyline, 0, { seed: 3, stretch: 2 });
    const falling = () => find(layer, 'masthead-skyline-rain')[0].children.filter((d) => d.attrs.d);
    let most = 0, dryAfter = false;
    for (let n = 1; n <= 12000; n++) {
      art.step(n, n * 50);
      const now = falling().length;
      if (most > 20 && now === 0) dryAfter = true;
      most = Math.max(most, now);
    }
    assert.ok(most > 20 && most <= DROPS && dryAfter);
    const slants = (stretch) => {
      const { layer, art } = run(skyline, 0, { seed: 3, stretch });
      for (let n = 1; n <= 600; n++) art.step(n, n * 50);
      return find(layer, 'masthead-skyline-rain')[0].children.filter((d) => d.attrs.d)
        .map((d) => d.attrs.d.split('l')[1].split(' ').map(Number)).map(([dx, dy]) => dx / dy * stretch);
    };
    for (const s of [...slants(1), ...slants(2)]) assert.ok(Math.abs(Math.abs(s) - 0.3) < 0.02, s);
  });

  it('strikes lightning now and then in a shower, briefly, off to the side of the name', () => {
    const { layer, art } = run(skyline, 0, { seed: 3 });
    const boltEl = find(layer, 'masthead-skyline-bolt')[0], glow = find(layer, 'masthead-skyline-glow')[0];
    const strikes = [];
    let lit = 0;
    for (let n = 1; n <= 40000; n++) {
      art.step(n, n * 50);
      if (Number(boltEl.attrs.opacity) > 0) {
        lit++;
        if (!strikes.length || n - strikes.at(-1) > GLOW_STEPS) strikes.push(n);
        const x = Number(/translate\(([\d.]+)/.exec(boltEl.attrs.transform)[1]);
        assert.ok(Math.abs(x - 600) > 280, `a bolt at ${x}`);
      }
      assert.ok(Number(glow.attrs.opacity) <= 0.3);
    }
    assert.ok(strikes.length >= 2, `${strikes.length} strikes`);
    for (let i = 1; i < strikes.length; i++) assert.ok(strikes[i] - strikes[i - 1] >= 400, '20 seconds at least between strikes');
    assert.ok(lit <= strikes.length * BOLT_STEPS);
    assert.ok(strikes.length < 40000 / 400);
  });

  it('draws a bolt downward to its end, with a fork', () => {
    const d = bolt(lcg(5), 180);
    const ys = [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => Number(m[2]));
    assert.equal(Math.max(...ys.slice(0, ys.indexOf(180) + 1)), 180);
    assert.equal(d.split('M').length - 1, 2);
  });

  it('lights the windows round a click on a building, and calls lightning to a click in the sky', () => {
    const { layer, art } = run(skyline, 10);
    const windows = find(layer, 'masthead-skyline-window');
    windows.forEach((w) => { w.attrs.opacity = '0'; });
    const w = windows[0];
    art.poke(Number(w.attrs.x) + 1, Number(w.attrs.y) + 2, 10, 500);
    assert.ok(windows.filter((v) => v.attrs.opacity === '1').length >= 1);
    assert.ok(windows.indexOf(w) >= 0 && w.attrs.opacity === '1');
    const boltEl = find(layer, 'masthead-skyline-bolt')[0];
    art.poke(600, 40, 10, 500);
    art.step(11, 550);
    assert.ok(Number(boltEl.attrs.opacity) > 0);
    assert.match(boltEl.attrs.transform, /^translate\(600\.0 0\)/);
    for (let n = 12; n <= 12 + GLOW_STEPS; n++) art.step(n, n * 50);
    assert.equal(boltEl.attrs.opacity, '0');
    assert.equal(find(layer, 'masthead-skyline-glow')[0].attrs.opacity, '0.000');
  });
});

describe('the block peek', () => {
  const where = (layer) => {
    const patch = find(layer, 'masthead-blockpeek-patch')[0];
    const t = /translate\((-?[\d.]+) (-?[\d.]+)\)/.exec(patch.attrs.transform || '');
    return { shown: Number(patch.attrs.opacity), x: t && Number(t[1]), y: t && Number(t[2]) };
  };
  const opacity = (layer, cls) => Number(find(layer, cls)[0].attrs.opacity);
  const rows = Math.floor(320 / BLOCK);

  it('keeps holes low, or to the sides of the name, at any stretch', () => {
    for (const stretch of [1, 1.6, 3]) {
      const spots = candidates(stretch, 1200, 320);
      assert.ok(spots.length > 10);
      for (const s of spots) {
        assert.ok(s.y >= (rows - 2) * BLOCK || Math.abs(s.x - 600) > 360, `${s.x}, ${s.y}`);
      }
    }
    assert.deepEqual(cellAt(10, 10, 1, 320), { x: BLOCK / 2, y: BLOCK / 2 });
  });

  it('cracks a block in stages, inside the block', () => {
    let s = 3;
    const stages = cracks(() => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000; });
    assert.equal(stages.length, STAGES);
    for (const stage of stages) {
      assert.ok(stage.length >= 1);
      for (const seg of stage) for (const v of seg) assert.ok(Math.abs(v) <= BLOCK / 2, String(v));
    }
  });

  it('breaks a block, a face peers through and ducks away, and the wall fades', () => {
    const { layer, art } = run(blockpeek, 0, { seed: 9 });
    const seen = { patch: false, hole: false, head: false, gone: false };
    for (let n = 1; n <= 4000; n++) {
      art.step(n, n * 40);
      const at = where(layer);
      if (at.shown > 0.9) {
        seen.patch = true;
        assert.ok(at.y >= (rows - 2) * BLOCK || Math.abs(at.x - 600) > 360 - BLOCK, `${at.x}, ${at.y}`);
      }
      if (opacity(layer, 'masthead-blockpeek-hole') === 1) seen.hole = true;
      if (opacity(layer, 'masthead-blockpeek-head') > 0.9) seen.head = true;
      if (seen.head && at.shown === 0) seen.gone = true;
    }
    assert.deepEqual(seen, { patch: true, hole: true, head: true, gone: true });
  });

  const untilMining = (art, layer) => {
    for (let n = 1; n <= 2000; n++) {
      art.step(n, n * 40);
      if (where(layer).shown >= 1 && find(layer, 'masthead-blockpeek-crack')[0].attrs.d) return n;
    }
    throw new Error('never mined');
  };
  const untilBroken = (art, layer, from, poke) => {
    for (let n = from + 1; n <= from + 2000; n++) {
      if (poke && n % 10 === 0) { const at = where(layer); art.poke(at.x, at.y, n, n * 40); }
      art.step(n, n * 40);
      if (opacity(layer, 'masthead-blockpeek-hole') > 0) return n - from;
    }
    throw new Error('never broke');
  };

  it('breaks the block sooner for clicks on it', () => {
    const left = run(blockpeek, 0, { seed: 4 });
    const alone = untilBroken(left.art, left.layer, untilMining(left.art, left.layer), false);
    const right = run(blockpeek, 0, { seed: 4 });
    const helped = untilBroken(right.art, right.layer, untilMining(right.art, right.layer), true);
    assert.ok(helped < alone / 2, `${helped} steps helped, ${alone} alone`);
  });

  it('mines where you click instead, the cracks there starting afresh', () => {
    const { layer, art } = run(blockpeek, 0, { seed: 4 });
    const n = untilMining(art, layer);
    art.poke(1100, 40, n, n * 40);
    const at = where(layer);
    assert.deepEqual([at.x, at.y], [cellAt(1100, 40, 1, 320).x, BLOCK / 2]);
    assert.equal(find(layer, 'masthead-blockpeek-crack')[0].attrs.d, '');
  });

  it('has the face duck when you click the hole', () => {
    const { layer, art } = run(blockpeek, 0, { seed: 9 });
    let n = 0;
    while (opacity(layer, 'masthead-blockpeek-head') < 0.9 && n < 4000) { n++; art.step(n, n * 40); }
    const at = where(layer);
    art.poke(at.x, at.y, n, n * 40);
    for (let k = 1; k <= 20; k++) art.step(n + k, (n + k) * 40);
    assert.equal(opacity(layer, 'masthead-blockpeek-head'), 0);
  });
});

describe('football', () => {
  const at = (g) => {
    const t = /translate\((-?[\d.]+) (-?[\d.]+)\).*rotate\((-?[\d.]+)\)/.exec(g.attrs.transform || '');
    return t ? { x: Number(t[1]), y: Number(t[2]), tilt: Number(t[3]) } : null;
  };
  // Seeds from the whole range, as real runs have, rather than small ones.
  const seeds = Array.from({ length: 12 }, (_, i) => Math.imul(i + 1, 2654435761) >>> 1);

  it('is in season through the football season, and weighs as a long season does', () => {
    const day = (y, m, d) => new Date(y, m - 1, d, 12);
    // Its season, as the football occasion has it; while it's a draft, it isn't picked at all.
    assert.ok(during('football', day(2026, 10, 4)) && during('football', day(2027, 2, 14)));
    assert.ok(!during('football', day(2027, 6, 1)));
    assert.deepEqual(SEASONS.football, ['football']);
  });

  it('throws a ball from one end to the other, over the top', () => {
    const a = arc(0, 250, 300, 230, 70, 0), b = arc(0, 250, 300, 230, 70, FLIGHT), mid = arc(0, 250, 300, 230, 70, FLIGHT / 2);
    assert.deepEqual([a.x, a.y, b.x, Math.round(b.y)], [0, 250, 300, 230]);
    assert.ok(mid.y < 230 - 50, String(mid.y));
  });

  it('stands its players on their feet, reaching up for a catch and hands up to the helmet', () => {
    const stand = joints(0, 'stand');
    for (const leg of stand.legs) assert.ok(Math.abs(leg.foot[1]) < 0.5, String(leg.foot[1]));
    for (const arm of joints(0, 'reach').arms) assert.ok(arm.hand[1] < stand.shoulder[1]);
    for (const arm of joints(0, 'hands').arms) assert.ok(arm.hand[1] < stand.head[1]);
  });

  it('takes no clicks', () => {
    assert.equal(run(football, 0).art.poke, undefined);
  });

  it('plays passes, caught and dropped, and runs with a hurdle over a diving defender', () => {
    const seen = { caught: false, dropped: false, hurdle: false, dive: false };
    for (const seed of seeds) {
      const { layer, art } = run(football, 0, { seed });
      for (let n = 1; n <= 2500; n++) {
        art.step(n, n * 40);
        const [runner, defender] = find(layer, 'masthead-football-player');
        const ball = find(layer, 'masthead-football-ball')[0];
        const r = at(runner), d = at(defender), b = at(ball);
        if (r && runner.attrs.opacity === '1') {
          assert.ok(r.y >= FIELD - 40 && r.y <= FIELD, `the runner at ${r.y}`);
          if (r.y < FIELD - 20) seen.hurdle = true;
        }
        if (d && defender.attrs.opacity === '1' && d.tilt > 60) seen.dive = true;
        if (b && ball.attrs.opacity === '1' && r && defender.attrs.opacity !== '1') {
          if (b.y > FIELD - 6) seen.dropped = true;
          else if (Math.abs(b.x - r.x) < 20 && b.y > FIELD - 60) seen.caught = true;
        }
      }
    }
    assert.deepEqual(seen, { caught: true, dropped: true, hurdle: true, dive: true });
  });
});

describe('the flyby', () => {
  const seeded = (seed) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 0x100000000; };

  it('puts each planet on its own orbit, in order out from the sun', () => {
    const planets = flybyLayout(seeded(3));
    planets.forEach((p, i) => {
      assert.ok(Math.abs(Math.hypot(p.x, p.z) - PLANETS[i].r) < 1e-9, `planet ${i}`);
      assert.ok(p.z > 0, 'on the near side, so the flight passes it');
    });
  });

  it('sees what is ahead, smaller with distance, and nothing behind', () => {
    const near = flybyProject(0.22, 0, 1, 3, 1200, 100, 1), far = flybyProject(0.22, 0, -2, 3, 1200, 100, 1);
    // The point straight ahead of the camera, below it on the plane, is centred and below the horizon.
    assert.equal(near.x, 600);
    assert.ok(near.y > 100 && far.y > 100 && far.y < near.y, `${near.y} ${far.y}`);
    assert.equal(flybyProject(0, 0, 4, 3, 1200, 100, 1), null);
    // A stretched masthead squeezes x, so circles stay round.
    assert.ok(Math.abs(flybyProject(1.22, 0, 0, 3, 1200, 100, 2).x - 600 - FOCAL / 3 / 2) < 1e-9);
  });

  it('falls in faster nearer the sun', () => {
    assert.ok(flybySpeed(0.5) > flybySpeed(3) && flybySpeed(3) > flybySpeed(6));
  });

  it('flies in to the sun and past it, then starts again from the outside, planets placed afresh', () => {
    const { layer, art } = run(flyby, 0, { seed: 8 });
    const discs = () => find(layer, 'masthead-flyby-disc').map((d) => d.attrs.cx).join(',');
    const scene = find(layer, 'masthead-flyby-scene')[0];
    const first = discs();
    let faded = false, restarted = false;
    for (let n = 1; n <= 4000 && !restarted; n++) {
      art.step(n, n * 40);
      if (Number(scene.attrs.opacity) < 0.05 && n > 100) faded = true;
      if (faded && Number(scene.attrs.opacity) > 0.5) restarted = true;
    }
    assert.ok(faded && restarted, `faded ${faded}, restarted ${restarted}`);
    assert.notEqual(discs(), first);
  });

  it('takes a burn from a click, and gets there sooner', () => {
    const steps = (pokes) => {
      const { layer, art } = run(flyby, 0, { seed: 8 });
      const sun = find(layer, 'masthead-flyby-sun')[0];
      for (let n = 1; n <= 5000; n++) {
        if (pokes && n % 40 === 0) art.poke(600, 160, n, n * 40);
        art.step(n, n * 40);
        if (sun.attrs.opacity === '0') return n;
      }
      return Infinity;
    };
    assert.ok(steps(true) < steps(false) * 0.7);
  });
});
