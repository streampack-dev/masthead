/* Night city: a slow, steady flight between wireframe towers at night, up among them, about
   half their height. The towers come out of the vanishing point and slide past and out at the
   sides, their feet dropping away below and their tops rising above, rows of lit windows on their
   faces, the odd warning light blinking on a roof; far below, the city floor's lights; far off, a
   skyline, a flare now and then, and a small flying car's light crossing. The towers, their
   windows and the cars come from the seed, so ?ambientSeed=<n> flies the same way again. A click
   banks the flight gently toward its side and sends a flying car streaking past there. */
/* Half the gap between the rows of towers, the camera's height above the city floor and the
   focal length, in the world's units (a storey is 0.2); the horizon on the screen, and how far
   ahead towers are drawn. */
export var AVENUE = 2.2, EYE = 2.6, FOCAL = 300, HORIZON = 104, FAR = 17, NEAR = 0.35;
/* The cruise, in units a step (of 40 ms): a tower passes on each side every two seconds or so. */
export var SPEED = 0.045;
/* Fainter with distance: a tower's band (or a window's) is the first of these it's nearer than. */
export var BANDS = [3.2, 6, 9.5, 13, Infinity];
/* A storey's height and a bay's width; how far off windows are drawn, half a window's width, and
   how many lights on the city floor. */
var STOREY = 0.2, BAY = 0.32, WINDOWS_TO = 11, PANE = 0.02, HAZE = 90;
var BANK = 3.5, BANK_STEPS = 120, STREAK_STEPS = 34;

export default function nightcity(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var view = m.el('g', { 'class': 'masthead-nightcity-view' });

  // The skyline far beyond the towers, low on the horizon.
  var sky = [], sx = 0;
  while (sx < W) {
    var bw = 6 + rand() * 16, bh = 3 + rand() * rand() * 22 * (0.4 + Math.abs(sx - W / 2) / W);
    sky.push('M' + sx.toFixed(1) + ' ' + HORIZON + 'V' + (HORIZON - bh).toFixed(1) + 'H' + (sx + bw).toFixed(1) + 'V' + HORIZON);
    sx += bw + rand() * 8;
  }
  m.el('path', { 'class': 'masthead-nightcity-skyline', d: sky.join('') }, view);
  var haze = m.el('path', { 'class': 'masthead-nightcity-haze' }, view);
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

  /* A face's lit windows, as (bay, storey) pairs: some floors dark all along, the rest lit here
     and there. */
  function lights(bays, storeys) {
    var lit = [], chance = 0.35 + rand() * 0.3;
    for (var f = 0; f < storeys; f++) {
      if (rand() < 0.35) continue;
      for (var k = 0; k < bays; k++) if (rand() < chance) lit.push(k, f);
    }
    return lit;
  }
  /* A tower on [side] (-1 left, 1 right) whose front is [z] ahead: its depth along the way, its
     width back from the gap, its height, and the lit windows on its face along the gap and on
     its front. */
  function tower(side, z) {
    var len = 1.1 + rand() * 0.9, deep = 0.6 + rand() * 0.6;
    var height = 1.4 + rand() * rand() * 4.6 + (rand() < 0.25 ? 1.8 : 0);
    var bays = Math.max(2, Math.round(len / BAY)), fronts = Math.max(2, Math.round(deep / BAY));
    var storeys = Math.floor((height - 0.1) / STOREY);
    return {
      side: side, z: z, len: len, deep: deep, height: height, bays: bays, fronts: fronts,
      lit: lights(bays, storeys), front: lights(fronts, storeys),
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
  /* The city floor's lights far below, scattered either side of the gap. */
  var floor = [];
  function speck(z) { return { x: (rand() < 0.5 ? -1 : 1) * (AVENUE + 0.3 + rand() * 22), z: z }; }
  for (var q = 0; q < HAZE; q++) floor.push(speck(3 + rand() * 40));

  var stretch = 1, bank = null, streak = null, car = null, nextCar = 140 + Math.floor(rand() * 200);
  var flareAt = 300 + Math.floor(rand() * 500), flareX = 0;

  function n(v) { return v.toFixed(1); }
  function px(x, z) { return W / 2 + x * FOCAL / (z * stretch); }
  function py(y, z) { return HORIZON + (EYE - y) * FOCAL / z; }
  function at(x, y, z) { return n(px(x, z)) + ' ' + n(py(y, z)); }
  function band(z) { var b = 0; while (z >= BANDS[b]) b++; return b; }
  function on(x, y) { return x > -4 && x < W + 4 && y > -4 && y < H + 4; }

  function draw(count) {
    stretch = m.stretch() || 1;
    var outs = [], wins = [], lit = [], specks = [];
    for (var b = 0; b < BANDS.length; b++) { outs.push([]); wins.push([]); }
    floor.forEach(function (p) {
      var x = px(p.x, p.z), y = py(0, p.z);
      if (y < H && x > 0 && x < W) specks.push('M' + n(x) + ' ' + n(y) + 'h0.1');
    });
    haze.setAttribute('d', specks.join(''));
    towers.forEach(function (t) {
      var z1 = t.z + t.len;
      if (z1 <= NEAR || t.z > FAR) return;
      var z0 = Math.max(t.z, NEAR), inner = t.side * AVENUE, outer = t.side * (AVENUE + t.deep);
      var b = band(z0), o = outs[b], h = t.height, k, y, x0, y0;
      // The face along the gap, closed: foot and roof running back, both its corners.
      o.push('M' + at(inner, 0, z0) + 'L' + at(inner, 0, z1) + 'L' + at(inner, h, z1) + 'L' + at(inner, h, z0) + 'Z');
      // The front, closed, while it's still ahead of you; and the roof, when you're above it.
      if (t.z >= NEAR) o.push('M' + at(inner, 0, z0) + 'L' + at(inner, h, z0) + 'L' + at(outer, h, z0) + 'L' + at(outer, 0, z0) + 'Z');
      if (h < EYE) o.push('M' + at(outer, h, z0) + 'L' + at(outer, h, z1) + 'L' + at(inner, h, z1));
      if (t.z >= WINDOWS_TO) return;
      // The windows, each a short dash on its face, projected as the face's corners are, so it
      // runs toward the vanishing point on the face along the gap and level on the front.
      for (k = 0; k < t.lit.length; k += 2) {
        var zc = t.z + (t.lit[k] + 0.5) * t.len / t.bays;
        if (zc - PANE < NEAR) continue;
        y = (t.lit[k + 1] + 0.5) * STOREY;
        x0 = px(inner, zc - PANE); y0 = py(y, zc - PANE);
        if (!on(x0, y0)) continue;
        wins[band(zc)].push('M' + n(x0) + ' ' + n(y0) + 'L' + at(inner, y, zc + PANE));
      }
      if (t.z >= NEAR) {
        for (k = 0; k < t.front.length; k += 2) {
          var xc = inner + t.side * (t.front[k] + 0.5) * t.deep / t.fronts;
          y = (t.front[k + 1] + 0.5) * STOREY;
          x0 = px(xc - PANE, t.z); y0 = py(y, t.z);
          if (!on(x0, y0)) continue;
          wins[b].push('M' + n(x0) + ' ' + n(y0) + 'H' + n(px(xc + PANE, t.z)));
        }
      }
      // The warning light on the roof, blinking now and then.
      if (t.beacon >= 0 && (count + t.beacon) % 90 < 9 && t.z >= NEAR) {
        lit.push('M' + at(inner + t.side * t.deep * 0.5, h, t.z + t.len * 0.5) + 'h0.1');
      }
    });
    for (b = 0; b < BANDS.length; b++) {
      outlines[b].setAttribute('d', outs[b].join(''));
      windows[b].setAttribute('d', wins[b].join(''));
    }
    beacons.setAttribute('d', lit.join(''));

    // The flying cars, a light and its short trail: one far off, crossing over the city, and one
    // streaking past when you click.
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
      // From far up the gap, past you on the side clicked, higher for a click higher up.
      var high = Math.max(0.6, Math.min(EYE * 2, EYE + (HORIZON - y) / 90));
      streak = { x: dir * AVENUE * 0.7, y: high, z: FAR };
    },
    step: function (count) {
      roll();
      burn(count);
      floor.forEach(function (p) {
        p.z -= SPEED;
        if (p.z < 3) { var fresh = speck(p.z + 40); p.x = fresh.x; p.z = fresh.z; }
      });
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
        car = { x: from * edge, vx: -from * (0.08 + rand() * 0.05), y: EYE + 0.4 + rand() * 0.8, z: far, edge: edge };
      }
      if (streak) {
        streak.z -= FAR / STREAK_STEPS;
        if (streak.z < NEAR) streak = null;
      }
      draw(count);
    }
  };
}
