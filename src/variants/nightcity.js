/* Night city: a slow, steady flight down an avenue between wireframe towers at night. The towers
   come out of the vanishing point low in the middle and slide past and out at the sides, rows of
   lit windows on their faces, the odd warning light blinking on a roof; far off, a skyline, a
   flare now and then, and a small flying car's light crossing. The towers, their windows and the
   cars come from the seed, so ?ambientSeed=<n> flies the same street again. A click banks the
   flight gently toward its side and sends a flying car streaking past there. */
/* The avenue's half width, the camera's height and the focal length, in the world's units (a
   storey is about 0.16); the horizon on the screen, and how far ahead towers are drawn. */
export var AVENUE = 2.2, EYE = 0.16, FOCAL = 300, HORIZON = 238, FAR = 17, NEAR = 0.35;
/* The cruise, in units a step (of 40 ms): a tower passes on each side every two seconds or so. */
export var SPEED = 0.045;
/* Fainter with distance: a tower's band (or a window's) is the first of these it's nearer than. */
export var BANDS = [3.2, 6, 9.5, 13, Infinity];
var STOREY = 0.16, BAY = 0.3, WINDOWS_TO = 11, LANE_GAP = 1.1;
var BANK = 3.5, BANK_STEPS = 120, STREAK_STEPS = 34;

export default function nightcity(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var view = m.el('g', { 'class': 'masthead-nightcity-view' });

  // The skyline far beyond the avenue's end, low on the horizon, and the curbs running to it.
  var sky = [], sx = 0;
  while (sx < W) {
    var bw = 6 + rand() * 16, bh = 3 + rand() * rand() * 22 * (0.4 + Math.abs(sx - W / 2) / W);
    sky.push('M' + sx.toFixed(1) + ' ' + HORIZON + 'V' + (HORIZON - bh).toFixed(1) + 'H' + (sx + bw).toFixed(1) + 'V' + HORIZON);
    sx += bw + rand() * 8;
  }
  m.el('path', { 'class': 'masthead-nightcity-skyline', d: sky.join('') }, view);
  var curbs = m.el('path', { 'class': 'masthead-nightcity-curb' }, view);
  var lanes = m.el('path', { 'class': 'masthead-nightcity-lane' }, view);
  var flare = m.el('path', { 'class': 'masthead-nightcity-flare', opacity: 0 }, view);

  var outlines = [], windows = [];
  for (var b = 0; b < BANDS.length; b++) {
    var g = m.el('g', { 'class': 'masthead-nightcity-band masthead-nightcity-band-' + b }, view);
    outlines.push(m.el('path', { 'class': 'masthead-nightcity-tower' }, g));
    windows.push(m.el('path', { 'class': 'masthead-nightcity-windows' }, g));
  }
  var beacons = m.el('path', { 'class': 'masthead-nightcity-beacon' }, view);
  var cars = m.el('path', { 'class': 'masthead-nightcity-car' }, view);
  var farCar = m.el('path', { 'class': 'masthead-nightcity-far-car' }, view);

  /* A tower on [side] (-1 left, 1 right) whose front is [z] ahead: its depth along the street,
     its width back from the curb, its height, and its lit windows on the face along the avenue,
     as (bay, storey) pairs. */
  function tower(side, z) {
    var len = 1.1 + rand() * 0.9, deep = 0.5 + rand() * 0.6;
    var height = 1.2 + rand() * rand() * 3.4 + (rand() < 0.2 ? 1.2 : 0);
    var bays = Math.max(2, Math.round(len / BAY)), storeys = Math.floor((height - 0.12) / STOREY);
    var lit = [], chance = 0.16 + rand() * 0.25;
    for (var f = 0; f < storeys; f++) {
      // Some floors are dark all along; the rest lit here and there.
      if (rand() < 0.3) continue;
      for (var k = 0; k < bays; k++) if (rand() < chance * 1.6) lit.push(k, f);
    }
    return {
      side: side, z: z, len: len, deep: deep, height: height, bays: bays, lit: lit,
      beacon: rand() < 0.45 ? Math.floor(rand() * 90) : -1
    };
  }
  var towers = [];
  [-1, 1].forEach(function (side) {
    var z = 0.4 + rand() * 1.2;
    while (z < FAR + 1) {
      var t = tower(side, z);
      towers.push(t);
      z += t.len + 0.35 + rand() * 0.7;
    }
  });
  /* The farthest tower's back on each side, so a recycled one goes in behind it. */
  function back(side) {
    var most = 0;
    towers.forEach(function (t) { if (t.side === side) most = Math.max(most, t.z + t.len); });
    return most;
  }

  var travelled = 0, stretch = 1, bank = null, streak = null, car = null, nextCar = 140 + Math.floor(rand() * 200);
  var flareAt = 300 + Math.floor(rand() * 500), flareX = 0;

  function n(v) { return v.toFixed(1); }
  function px(x, z) { return W / 2 + x * FOCAL / (z * stretch); }
  function py(y, z) { return HORIZON + (EYE - y) * FOCAL / z; }
  function at(x, y, z) { return n(px(x, z)) + ' ' + n(py(y, z)); }
  function band(z) { var b = 0; while (z >= BANDS[b]) b++; return b; }

  function draw(count) {
    var now = m.stretch() || 1;
    if (now !== stretch || !count) {
      stretch = now;
      curbs.setAttribute('d', 'M' + at(-AVENUE, 0, NEAR) + 'L' + at(-AVENUE, 0, 200) + 'M' + at(AVENUE, 0, NEAR) + 'L' + at(AVENUE, 0, 200));
    }
    var outs = [], wins = [], lights = [];
    for (var b = 0; b < BANDS.length; b++) { outs.push([]); wins.push([]); }
    // The lane markings, slipping toward you along the avenue.
    var marks = [], first = LANE_GAP - travelled % LANE_GAP;
    for (var z = first; z < 12; z += LANE_GAP) {
      if (z < NEAR) continue;
      for (var lane = -1; lane <= 1; lane += 2) marks.push('M' + at(lane * AVENUE / 3, 0, z) + 'L' + at(lane * AVENUE / 3, 0, z + 0.4));
    }
    lanes.setAttribute('d', marks.join(''));
    towers.forEach(function (t) {
      var z1 = t.z + t.len;
      if (z1 <= NEAR || t.z > FAR) return;
      var z0 = Math.max(t.z, NEAR), inner = t.side * AVENUE, outer = t.side * (AVENUE + t.deep);
      var b = band(z0), o = outs[b], h = t.height;
      // The face along the avenue: its foot and roof running back, and its far corner.
      o.push('M' + at(inner, 0, z0) + 'L' + at(inner, 0, z1) + 'V' + n(py(h, z1)) + 'L' + at(inner, h, z0));
      // The front face, while it's still ahead of you: its near corner, roof and outer corner.
      if (t.z >= NEAR) o.push('M' + at(inner, 0, z0) + 'V' + n(py(h, z0)) + 'H' + n(px(outer, z0)) + 'V' + n(py(0, z0)));
      if (t.z < WINDOWS_TO) {
        var half = t.len / t.bays * 0.09;
        for (var k = 0; k < t.lit.length; k += 2) {
          var zc = t.z + (t.lit[k] + 0.5) * t.len / t.bays, y = (t.lit[k + 1] + 0.55) * STOREY;
          if (zc - half < NEAR) continue;
          var ya = py(y, zc - half);
          if (ya < -10 || ya > H + 10) continue;
          wins[band(zc)].push('M' + at(inner, y, zc - half) + 'L' + at(inner, y, zc + half));
        }
      }
      // The warning light on the roof, blinking now and then.
      if (t.beacon >= 0 && (count + t.beacon) % 90 < 9 && t.z >= NEAR) {
        var bx = px(inner + t.side * t.deep * 0.5, t.z + t.len * 0.5), by = py(h, t.z + t.len * 0.5);
        lights.push('M' + n(bx) + ' ' + n(by) + 'h0.1');
      }
    });
    for (b = 0; b < BANDS.length; b++) {
      outlines[b].setAttribute('d', outs[b].join(''));
      windows[b].setAttribute('d', wins[b].join(''));
    }
    beacons.setAttribute('d', lights.join(''));

    // The flying cars, a light and its short trail: one far off, crossing low over the city, and
    // one streaking past when you click.
    cars.setAttribute('d', streak && streak.z > NEAR ? 'M' + at(streak.x, streak.y, streak.z) + 'L' + at(streak.x, streak.y, streak.z + 1.6) : '');
    farCar.setAttribute('d', car ? 'M' + at(car.x, car.y, car.z) + 'L' + at(car.x - car.vx * 14, car.y, car.z) : '');
  }

  function roll() {
    if (!bank) return;
    bank.age += 1;
    var t = bank.age / BANK_STEPS;
    if (t >= 1) { bank = null; view.setAttribute('transform', ''); return; }
    var angle = bank.dir * BANK * Math.sin(Math.PI * t) * Math.sin(Math.PI * t);
    view.setAttribute('transform', 'rotate(' + angle.toFixed(2) + ' ' + W / 2 + ' ' + HORIZON + ')');
  }

  /* A flare far off on the horizon to one side, flickering up and dying away. */
  function burn(count) {
    if (count === flareAt) {
      flareX = (rand() < 0.5 ? 0.12 : 0.88) * W + (rand() - 0.5) * 120;
      var y = HORIZON - 14 - rand() * 10, d = [];
      for (var i = 0; i < 6; i++) {
        var a = i * Math.PI / 3 + 0.3;
        d.push('M' + n(flareX + Math.cos(a) * 2) + ' ' + n(y + Math.sin(a) * 2) + 'L' + n(flareX + Math.cos(a) * 7) + ' ' + n(y + Math.sin(a) * 7));
      }
      flare.setAttribute('d', d.join('') + 'M' + n(flareX) + ' ' + n(y) + 'V' + HORIZON);
    }
    var age = count - flareAt;
    if (age >= 0 && age <= 80) flare.setAttribute('opacity', (Math.sin(Math.PI * age / 80) * (0.7 + 0.3 * Math.sin(age * 0.9))).toFixed(2));
    if (age > 80) { flare.setAttribute('opacity', 0); flareAt = count + 400 + Math.floor(rand() * 700); }
  }

  draw(0);

  return {
    interval: 40,
    poke: function (x, y) {
      var dir = x < W / 2 ? -1 : 1;
      bank = { dir: -dir, age: 0 };
      // From far up the avenue, past you on the side clicked, about as high as the click.
      var high = Math.max(0.35, Math.min(2.4, EYE + (HORIZON - y) / 120 + 0.6));
      streak = { x: dir * AVENUE * 0.7, y: high, z: FAR };
    },
    step: function (count) {
      roll();
      burn(count);
      travelled += SPEED;
      towers.forEach(function (t) {
        t.z -= SPEED;
        if (t.z + t.len < NEAR) {
          var fresh = tower(t.side, back(t.side) + 0.35 + rand() * 0.7);
          for (var key in fresh) t[key] = fresh[key];
        }
      });
      if (car) {
        // Far enough off that you don't gain on it: it only crosses, from one side out the other.
        car.x += car.vx;
        if (car.x * (car.vx > 0 ? 1 : -1) > car.edge) { car = null; nextCar = count + 200 + Math.floor(rand() * 500); }
      } else if (count >= nextCar) {
        var from = rand() < 0.5 ? -1 : 1, far = 10 + rand() * 5, edge = far * W / 2 / FOCAL + 1;
        car = { x: from * edge, vx: -from * (0.08 + rand() * 0.05), y: 0.5 + rand() * 0.6, z: far, edge: edge };
      }
      if (streak) {
        streak.z -= FAR / STREAK_STEPS;
        if (streak.z < NEAR) streak = null;
      }
      draw(count);
    }
  };
}
