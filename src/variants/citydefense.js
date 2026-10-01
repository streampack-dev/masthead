/* City defense: the old missile-defense game, playing itself, slowly. Missiles draw their trails
   down from the top toward the cities along the foot of the masthead; the bases between them fire
   back, and each counter-missile bursts into a ring that takes out what it touches. Not every
   shot finds its mark, so now and then a city falls; when most have fallen, they're rebuilt and
   it starts again. The game comes from the seed, so ?ambientSeed=<n> replays it. */
export var GROUND = 306;
export var CITIES = [190, 300, 410, 790, 900, 1010];
export var BASES = [70, 600, 1130];
var FALL = 0.55, COUNTER = 4.2, BURST = 30, BURST_STEPS = 34, MAX_INCOMING = 4;

/* Where to aim at a missile from (bx, by): the point on its path a counter-missile reaches just
   as the missile does, found by stepping along its path. */
export function intercept(bx, by, m) {
  for (var t = 0; t < 2000; t++) {
    var x = m.x + m.vx * t, y = m.y + m.vy * t;
    if (y >= GROUND - 20) return null;
    if (Math.hypot(x - bx, y - by) / COUNTER <= t) return { x: x, y: y };
  }
  return null;
}

export default function citydefense(layer, m) {
  var W = m.width;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  m.el('path', { 'class': 'masthead-citydefense-ground', d: 'M0 ' + GROUND + 'H' + W });
  // The bases: low mounds, each with its launcher.
  BASES.forEach(function (x) {
    m.el('path', { 'class': 'masthead-citydefense-base', d: 'M' + (x - 26) + ' ' + GROUND + 'L' + (x - 10) + ' ' + (GROUND - 9) + 'H' + (x + 10) + 'L' + (x + 26) + ' ' + GROUND });
  });
  var cities = CITIES.map(function (x) {
    var el = m.el('path', { 'class': 'masthead-citydefense-city' });
    return { x: x, el: el, standing: true };
  });
  function drawCity(city) {
    var x = city.x;
    city.el.setAttribute('d', city.standing
      // A little skyline: towers of a few heights.
      ? 'M' + (x - 20) + ' ' + GROUND + 'v-8h6v-6h6v10h4v-14h6v8h6v-4h6v' + 14 + 'Z'
      // Rubble.
      : 'M' + (x - 20) + ' ' + GROUND + 'l6 -3l5 2l6 -4l7 3l6 -2l10 4Z');
    city.el.setAttribute('class', city.standing ? 'masthead-citydefense-city' : 'masthead-citydefense-city masthead-citydefense-rubble');
  }
  cities.forEach(drawCity);

  var skyEl = m.el('g');
  var incoming = [], counters = [], bursts = [];
  var nextLaunch = 20, rebuildAt = null;

  function launch() {
    var targets = cities.filter(function (c) { return c.standing; }).map(function (c) { return c.x; }).concat(BASES);
    var tx = targets[Math.floor(rand() * targets.length)] + (rand() - 0.5) * 30;
    var sx = 40 + rand() * (W - 80);
    var len = Math.hypot(tx - sx, GROUND), speed = FALL * (0.8 + rand() * 0.5);
    var mi = {
      sx: sx, sy: -4, x: sx, y: -4, vx: (tx - sx) / len * speed, vy: GROUND / len * speed,
      // The defense notices it after a moment, and doesn't always aim true.
      noticeIn: 25 + Math.floor(rand() * 45), aimError: rand() < 0.22 ? (rand() < 0.5 ? -1 : 1) * (40 + rand() * 30) : 0,
      el: m.el('path', { 'class': 'masthead-citydefense-trail' }, skyEl),
      head: m.el('circle', { r: 1.8, 'class': 'masthead-spark' }, skyEl), alive: true
    };
    incoming.push(mi);
  }

  function fire(mi) {
    var best = null;
    BASES.forEach(function (bx) {
      var at = intercept(bx, GROUND - 9, mi);
      if (at && (!best || Math.abs(bx - at.x) < Math.abs(best.bx - best.at.x))) best = { bx: bx, at: at };
    });
    if (!best) return;
    var tx = best.at.x + mi.aimError, ty = best.at.y;
    var len = Math.hypot(tx - best.bx, ty - (GROUND - 9));
    counters.push({
      sx: best.bx, sy: GROUND - 9, x: best.bx, y: GROUND - 9, tx: tx, ty: ty,
      vx: (tx - best.bx) / len * COUNTER, vy: (ty - (GROUND - 9)) / len * COUNTER, steps: Math.ceil(len / COUNTER),
      el: m.el('path', { 'class': 'masthead-citydefense-counter' }, skyEl)
    });
  }

  function burst(x, y, size) {
    bursts.push({ x: x, y: y, size: size, age: 0, el: m.el('circle', { 'class': 'masthead-citydefense-burst', cx: x.toFixed(1), cy: y.toFixed(1), r: 0 }, skyEl) });
  }
  function remove(el) { if (el.parentNode) el.parentNode.removeChild(el); }

  return {
    interval: 40,
    step: function () {
      if (rebuildAt !== null) {
        if (--rebuildAt <= 0) { rebuildAt = null; cities.forEach(function (c) { c.standing = true; drawCity(c); }); }
      } else if (--nextLaunch <= 0 && incoming.length < MAX_INCOMING) {
        launch();
        nextLaunch = 40 + Math.floor(rand() * 60);
      }

      incoming.forEach(function (mi) {
        mi.x += mi.vx; mi.y += mi.vy;
        if (--mi.noticeIn === 0) fire(mi);
        mi.el.setAttribute('d', 'M' + mi.sx.toFixed(1) + ' ' + mi.sy.toFixed(1) + 'L' + mi.x.toFixed(1) + ' ' + mi.y.toFixed(1));
        mi.head.setAttribute('cx', mi.x.toFixed(1));
        mi.head.setAttribute('cy', mi.y.toFixed(1));
        if (mi.y >= GROUND) {
          mi.alive = false;
          burst(mi.x, GROUND, 22);
          cities.forEach(function (c) { if (c.standing && Math.abs(c.x - mi.x) < 26) { c.standing = false; drawCity(c); } });
        }
      });

      counters = counters.filter(function (c) {
        c.x += c.vx; c.y += c.vy;
        c.el.setAttribute('d', 'M' + c.sx + ' ' + c.sy + 'L' + c.x.toFixed(1) + ' ' + c.y.toFixed(1));
        if (--c.steps > 0) return true;
        remove(c.el);
        burst(c.tx, c.ty, BURST);
        return false;
      });

      bursts = bursts.filter(function (b) {
        b.age += 1;
        var p = b.age / BURST_STEPS, r = b.size * Math.sin(Math.PI * Math.min(1, p));
        b.el.setAttribute('r', r.toFixed(1));
        b.el.setAttribute('opacity', (1 - p * 0.6).toFixed(2));
        // A ring takes out any missile inside it.
        incoming.forEach(function (mi) {
          if (mi.alive && Math.hypot(mi.x - b.x, mi.y - b.y) < r) { mi.alive = false; }
        });
        if (b.age < BURST_STEPS) return true;
        remove(b.el);
        return false;
      });

      incoming = incoming.filter(function (mi) {
        if (mi.alive) return true;
        remove(mi.el); remove(mi.head);
        return false;
      });

      // When most of the cities have fallen, a pause, and they're rebuilt.
      if (rebuildAt === null && cities.filter(function (c) { return c.standing; }).length <= 2) rebuildAt = 120;
    }
  };
}
