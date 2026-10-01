import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { variants } from '../src/variants.js';
import { SEASONS, inSeason } from '../src/runner.js';
import bats, { bat } from '../src/variants/bats.js';
import eyes, { openness } from '../src/variants/eyes.js';
import ghosts, { sheet } from '../src/variants/ghosts.js';
import graveyard, { tree } from '../src/variants/graveyard.js';
import pumpkins, { FACES } from '../src/variants/pumpkins.js';
import spider, { spider as spiderShape, web } from '../src/variants/spider.js';
import { find, run, serialize } from './fake.js';
import boids from '../src/variants/boids.js';
import bytecode, { OCTOBER, PROGRAMS, STREAMS } from '../src/variants/bytecode.js';
import circuit from '../src/variants/circuit.js';
import citydefense, { BASES, CITIES, GROUND, intercept } from '../src/variants/citydefense.js';
import grass, { wind as grassWind } from '../src/variants/grass.js';
import lander, { GRAVITY, SIDE, THRUST, ground, pilot } from '../src/variants/lander.js';
import paddles, { LEFT, RIGHT, landing } from '../src/variants/paddles.js';
import rocks, { SIZES, outline } from '../src/variants/rocks.js';
import pongwars, { COLS as WAR_COLS, ROWS as WAR_ROWS, bounce } from '../src/variants/pongwars.js';
import stix, { GH, GW, claim, field, route } from '../src/variants/stix.js';
import windfarm, { farm, wind as farmWind } from '../src/variants/windfarm.js';
import fractal from '../src/variants/fractal.js';
import ghostrider, { DRAW, MAX_CURVE, SPEED, course, project } from '../src/variants/ghostrider.js';
import life from '../src/variants/life.js';
import signalnoise from '../src/variants/signalnoise.js';
import solari, { COLS, OWN, ROWS, flaps, layout, wrap } from '../src/variants/solari.js';
import terrainflight from '../src/variants/terrainflight.js';
import train, { CARGO, ENGINE, car, rows } from '../src/variants/train.js';
import water, { GRID_H, GRID_W, drop, ripple } from '../src/variants/water.js';

const all = { bats, boids, bytecode, eyes, ghosts, graveyard, pumpkins, spider, citydefense, fractal, ghostrider, grass, lander, paddles, pongwars, rocks, stix, windfarm, life, signalnoise, solari, terrainflight, train, water };
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
  for (const name of ['bats', 'boids', 'bytecode', 'eyes', 'ghosts', 'graveyard', 'pumpkins', 'spider', 'citydefense', 'fractal', 'ghostrider', 'grass', 'lander', 'paddles', 'pongwars', 'rocks', 'stix', 'windfarm', 'life', 'terrainflight', 'train', 'water']) {
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

describe('the seasons', () => {
  const names = Object.keys(variants);

  it('keeps the October animations to October, and the rest to all year', () => {
    const october = inSeason(names, new Date(2026, 9, 31));
    const may = inSeason(names, new Date(2026, 4, 1));
    for (const name of ['bats', 'eyes', 'ghosts', 'graveyard', 'pumpkins', 'spider']) {
      assert.ok(october.includes(name) && !may.includes(name), name);
    }
    assert.ok(may.includes('boids') && october.includes('boids'));
    assert.equal(october.length, names.length);
  });

  it('lists only animations there are', () => {
    for (const name of Object.keys(SEASONS)) assert.ok(names.includes(name), name);
  });
});

describe('the bytecode rain', () => {
  it('runs to 0xDEADBEEF in October, and not otherwise', () => {
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
    assert.equal(find(layer, 'masthead-ghosts-ghost').length, 1);
    let came = false, went = false, before = 1;
    for (let i = 1; i <= 4000; i++) {
      art.step(i, i * 40);
      const now = find(layer, 'masthead-ghosts-ghost').length;
      if (now > before) came = true;
      if (now < before) went = true;
      before = now;
    }
    assert.ok(came && went);
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

  it('sets a graveyard under the moon, a bat crossing it now and then', () => {
    let r = 3;
    assert.match(tree(() => ((r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 0x100000000), 100), /^M/);
    const { layer, art } = run(graveyard, 0);
    assert.ok(find(layer, 'masthead-graveyard-stone').length >= 8);
    const batEl = find(layer, 'masthead-graveyard-bat')[0];
    let crossed = false;
    for (let i = 1; i <= 1500 && !crossed; i++) { art.step(i, i * 50); crossed = batEl.attrs.opacity === '1'; }
    assert.ok(crossed);
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
