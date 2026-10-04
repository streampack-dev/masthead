/* Ships: a low sea along the foot of the masthead, and ships gliding across it in outline, the
   farther ones smaller, slower and fainter: a liner trailing smoke, an aircraft carrier, a tall
   ship under sail, a sailboat bobbing. A few at a time, with stretches of open sea between. The
   ships and their crossings come from the seed, so ?ambientSeed=<n> replays them. A click sends a
   dolphin leaping from the water below it, with a splash going in and coming out. */
export var HORIZON = 252;
export var NEAR = 304;
export var MAX_SHIPS = 3;
var STEP_MS = 40;

/* The ships, drawn facing right with the waterline at y 0 and about 100 units long at scale 1:
   each a hull and its parts, as paths, and where its smoke (if any) comes from. */
export var KINDS = {
  liner: {
    speed: 0.55,
    parts: [
      'M-52 0L50 0L58 -12L-56 -12Z',
      'M-40 -12V-20H34V-12',
      'M-30 -20V-27H22V-20',
      'M-14 -27L-12 -38H-4L-2 -27',
      'M6 -27L8 -38H16L18 -27',
      'M-36 -16H30'
    ],
    funnels: [[-8, -38], [12, -38]]
  },
  carrier: {
    speed: 0.45,
    parts: [
      'M-58 0L52 0L60 -9L-60 -9Z',
      'M-64 -9H66L62 -12H-60Z',
      'M18 -12V-24H30V-12',
      'M24 -24V-34',
      'M20 -30H28'
    ]
  },
  tallship: {
    speed: 0.4,
    parts: [
      'M-40 -8Q-30 3 0 3Q30 3 42 -9L-42 -9Z',
      'M42 -9L60 -18',
      'M-22 -9V-58M0 -9V-66M20 -9V-56',
      'M-34 -16Q-22 -20 -10 -16L-11 -30Q-22 -34 -33 -30Z',
      'M-33 -34Q-22 -38 -11 -34L-12 -48Q-22 -51 -32 -48Z',
      'M-12 -18Q0 -23 12 -18L11 -34Q0 -38 -11 -34Z',
      'M-11 -38Q0 -42 11 -38L10 -54Q0 -57 -10 -54Z',
      'M9 -16Q20 -20 31 -16L30 -30Q20 -34 10 -30Z',
      'M10 -34Q20 -38 30 -34L29 -46Q20 -49 11 -46Z',
      'M22 -52L56 -18'
    ]
  },
  sailboat: {
    speed: 0.35,
    parts: [
      'M-16 -5Q-12 2 0 2Q12 2 18 -6L-18 -6Z',
      'M-2 -6V-40',
      'M-1 -38Q12 -24 14 -8H-1Z',
      'M-3 -36Q-12 -22 -15 -8H-3Z'
    ],
    // Drawn larger than to scale beside a liner, so it can be made out.
    size: 1.7,
    bob: true
  }
};
var ORDER = ['liner', 'carrier', 'tallship', 'sailboat'];

/* The sea's height above its rest at [x] on wave line [k] at step [n]: slow, long swells. */
export function swell(x, k, n) {
  return Math.sin(x * 0.012 + n * 0.02 + k * 1.7) * (1.2 + k * 0.6) + Math.sin(x * 0.031 - n * 0.013 + k) * 0.6;
}

/* A dolphin's leap, [t] from 0 (leaving the water) to 1 (back in): how far along it is from where
   it left, how high, and the angle it's pointing, so it noses up, arcs over and dives. */
export var LEAP_SPAN = 120, LEAP_HEIGHT = 70, LEAP_STEPS = 42;
export function leap(t) {
  var x = t * LEAP_SPAN;
  var y = -4 * LEAP_HEIGHT * t * (1 - t);
  var slope = -4 * LEAP_HEIGHT * (1 - 2 * t) / LEAP_SPAN;
  return { x: x, y: y, angle: Math.atan(slope) * 180 / Math.PI };
}

/* A dolphin facing right, nose at the right: its body and beak, dorsal fin, flipper and flukes. */
export var DOLPHIN = 'M-24 0Q-10 -9 12 -6Q20 -5 24 -2L31 -1L24 1Q14 5 0 4Q-14 3 -24 0Z' +
  'M-3 -7L3 -16L8 -6M6 3L1 10L-2 3M-24 0L-33 -6L-30 0L-33 6Z';

/* How far off a ship is (0 at the horizon, 1 nearest), and so where it sits and how big. */
export function placed(depth) {
  return {
    y: HORIZON + 6 + depth * (NEAR - HORIZON - 10),
    scale: 0.45 + depth * 0.85,
    opacity: 0.4 + depth * 0.6
  };
}

export default function ships(layer, m) {
  var W = m.width;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  m.el('path', { 'class': 'masthead-ships-horizon', d: 'M0 ' + HORIZON + 'H' + W });
  var waves = [0, 1, 2].map(function (k) {
    return { k: k, rest: HORIZON + 14 + k * 20, el: m.el('path', { 'class': 'masthead-ships-wave', 'stroke-opacity': (0.35 + k * 0.25).toFixed(2) }) };
  });
  var fleetLayer = m.el('g', { 'class': 'masthead-ships-fleet' });
  var smokeLayer = m.el('g', { 'class': 'masthead-ships-smoke' });
  var podLayer = m.el('g', { 'class': 'masthead-ships-pod' });

  var fleet = [];
  var puffs = [];
  var dolphins = [];
  var splashes = [];
  var nextShip = 0;
  var lastKind = null;

  function launch(midway) {
    var kinds = ORDER.filter(function (k) { return k !== lastKind; });
    var kind = kinds[Math.floor(rand() * kinds.length)];
    lastKind = kind;
    // Depths apart from the ships already out, so they pass in front of and behind each other.
    var depth = rand();
    for (var tries = 0; tries < 4 && fleet.some(function (s) { return Math.abs(s.depth - depth) < 0.2; }); tries++) depth = rand();
    var at = placed(depth);
    at.scale *= KINDS[kind].size || 1;
    var dir = rand() < 0.5 ? 1 : -1;
    var length = 130 * at.scale;
    var ship = {
      kind: kind,
      def: KINDS[kind],
      depth: depth,
      at: at,
      dir: dir,
      x: midway ? 150 + rand() * (W - 300) : dir > 0 ? -length : W + length,
      speed: KINDS[kind].speed * (0.6 + depth * 0.7),
      phase: rand() * 6.3,
      g: m.el('g', { 'class': 'masthead-ships-ship masthead-ships-' + kind, opacity: at.opacity.toFixed(2) }, fleetLayer)
    };
    ship.def.parts.forEach(function (d) { m.el('path', { d: d }, ship.g); });
    fleet.push(ship);
    // Nearer ships are drawn over farther ones: the fleet in depth order, nearest last.
    fleet.sort(function (a, b) { return a.depth - b.depth; });
    fleet.forEach(function (s) { remove(s.g); fleetLayer.appendChild(s.g); });
    return ship;
  }

  function puff(ship, n) {
    (ship.def.funnels || []).forEach(function (f) {
      var s = ship.at.scale;
      puffs.push({
        x: ship.x + ship.dir * f[0] * s / m.stretch(),
        y: ship.at.y + f[1] * s,
        r: 1.5 * s + 1,
        born: n,
        drift: -ship.dir * 0.12,
        el: m.el('circle', { 'class': 'masthead-ships-puff' }, smokeLayer)
      });
    });
  }

  function remove(el) { if (el.parentNode) el.parentNode.removeChild(el); }

  function drawSea(n) {
    waves.forEach(function (w) {
      var d = [];
      for (var x = 0; x <= W; x += 30) d.push((x ? 'L' : 'M') + x + ' ' + (w.rest + swell(x, w.k, n)).toFixed(1));
      w.el.setAttribute('d', d.join(''));
    });
  }

  function drawShip(ship, n) {
    var bob = Math.sin(n * 0.05 + ship.phase) * (0.6 + ship.depth * 1.2);
    var tilt = ship.def.bob ? Math.sin(n * 0.04 + ship.phase) * 4 + 3 : Math.sin(n * 0.03 + ship.phase) * 0.6;
    var squeeze = 1 / m.stretch();
    ship.g.setAttribute('transform', 'translate(' + ship.x.toFixed(1) + ' ' + (ship.at.y + bob).toFixed(1) + ') scale(' +
      (ship.dir * squeeze * ship.at.scale).toFixed(4) + ' ' + ship.at.scale.toFixed(3) + ') rotate(' + (-tilt).toFixed(2) + ')');
  }

  function drawDolphin(d, n) {
    var t = Math.min(1, (n - d.born) / LEAP_STEPS);
    var p = leap(t);
    var squeeze = 1 / m.stretch();
    d.el.setAttribute('transform', 'translate(' + (d.x + d.dir * p.x * squeeze).toFixed(1) + ' ' + (d.y + p.y).toFixed(1) + ') scale(' +
      (d.dir * squeeze).toFixed(4) + ' 1) rotate(' + p.angle.toFixed(1) + ')');
  }

  function splash(x, y, n) {
    splashes.push({ x: x, y: y, born: n, el: m.el('ellipse', { 'class': 'masthead-ships-splash', cx: x.toFixed(1), cy: y.toFixed(1) }, podLayer) });
  }

  // Open with a ship or two already out, so the sea isn't empty at first.
  launch(true);
  if (rand() < 0.6) launch(true);
  nextShip = 150 + Math.floor(rand() * 250);
  drawSea(0);
  fleet.forEach(function (s) { drawShip(s, 0); });

  var last = 0;
  return {
    interval: STEP_MS,
    poke: function (x) {
      if (dolphins.length >= 3) return;
      var dir = x < W / 2 ? 1 : -1;
      var start = Math.max(20, Math.min(W - 20, x - dir * LEAP_SPAN / 2 / m.stretch()));
      var y = NEAR - 8;
      var el = m.el('path', { 'class': 'masthead-ships-dolphin', d: DOLPHIN }, podLayer);
      var d = { x: start, y: y, dir: dir, born: last, el: el };
      dolphins.push(d);
      drawDolphin(d, last);
      splash(start, y, last);
    },
    step: function (n) {
      last = n;
      for (var i = fleet.length - 1; i >= 0; i--) {
        var ship = fleet[i];
        ship.x += ship.dir * ship.speed;
        var length = 140 * ship.at.scale;
        if ((ship.dir > 0 && ship.x > W + length) || (ship.dir < 0 && ship.x < -length)) {
          remove(ship.g);
          fleet.splice(i, 1);
          continue;
        }
        if (ship.def.funnels && n % 18 === 0) puff(ship, n);
        drawShip(ship, n);
      }
      if (--nextShip <= 0) {
        if (fleet.length < MAX_SHIPS) launch(false);
        nextShip = 220 + Math.floor(rand() * 420);
      }

      for (var p = puffs.length - 1; p >= 0; p--) {
        var puffAt = puffs[p], age = n - puffAt.born;
        if (age > 90) { remove(puffAt.el); puffs.splice(p, 1); continue; }
        puffAt.x += puffAt.drift;
        puffAt.y -= 0.18;
        puffAt.el.setAttribute('cx', puffAt.x.toFixed(1));
        puffAt.el.setAttribute('cy', puffAt.y.toFixed(1));
        puffAt.el.setAttribute('r', (puffAt.r + age * 0.06).toFixed(2));
        puffAt.el.setAttribute('opacity', (0.6 * (1 - age / 90)).toFixed(2));
      }

      for (var k = dolphins.length - 1; k >= 0; k--) {
        var d = dolphins[k];
        drawDolphin(d, n);
        if (n - d.born >= LEAP_STEPS) {
          splash(d.x + d.dir * LEAP_SPAN / m.stretch(), d.y, n);
          remove(d.el);
          dolphins.splice(k, 1);
        }
      }
      for (var s = splashes.length - 1; s >= 0; s--) {
        var sp = splashes[s], sAge = n - sp.born;
        if (sAge > 24) { remove(sp.el); splashes.splice(s, 1); continue; }
        sp.el.setAttribute('rx', ((4 + sAge * 1.1) / m.stretch()).toFixed(2));
        sp.el.setAttribute('ry', (1.5 + sAge * 0.25).toFixed(2));
        sp.el.setAttribute('opacity', (1 - sAge / 24).toFixed(2));
      }
      drawSea(n);
    }
  };
}
