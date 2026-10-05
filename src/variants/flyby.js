/* Flyby: a solar system flown through inward, like Voyager 1 in reverse or a comet falling toward
   the sun. The orbits are drawn as lines in the plane below, the planets (nowhere near to scale)
   sit near the way in and sweep past and off the edge as they're reached, and the sun grows ahead
   until it too swings by. Past it, the view fades and the flight starts again from the outside,
   the planets placed afresh. Where the planets sit comes from the seed, so ?ambientSeed=<n> replays
   a flight. A click fires a short burn.

   The math is kept light: one straight flight path, circles in one plane projected through a
   pinhole, a few hundred points a frame. */

/* The planets, inside out: orbit radius and size, in the same made-up units (1 is about Earth's
   orbit, squeezed so the outer planets aren't far off the edge), and whether it has a ring. */
export var PLANETS = [
  { r: 0.45, size: 0.012 },
  { r: 0.75, size: 0.019 },
  { r: 1.05, size: 0.02 },
  { r: 1.45, size: 0.015 },
  { r: 2.4, size: 0.055 },
  { r: 3.3, size: 0.048, ring: true },
  { r: 4.3, size: 0.032 },
  { r: 5.3, size: 0.031 }
];

export var START = 6.4; // where a flight starts, on the way in
export var END = -0.9; // and where it's done, past the sun
export var HEIGHT = 0.32; // the camera above the plane
export var OFFSET = 0.22; // and to the side of the sun
export var FOCAL = 330;
export var NEAR = 0.04;
var SEGMENTS = 96;
var BASE_SPEED = 0.006;
var FADE = 60;

/* Where the planets are on one flight: near the way in (within [reach] of the path, alternating
   sides), each at a point on its own orbit. */
export function layout(rand) {
  var side = rand() < 0.5 ? 1 : -1;
  return PLANETS.map(function (p) {
    side = -side;
    var x = OFFSET + side * (0.12 + rand() * 0.3) * Math.min(1, p.r);
    x = Math.max(-p.r * 0.95, Math.min(p.r * 0.95, x));
    return { r: p.r, size: p.size, ring: !!p.ring, x: x, z: Math.sqrt(p.r * p.r - x * x) };
  });
}

/* A point in space as the camera at (OFFSET, HEIGHT, cz) sees it, looking toward the sun: its
   place on the art (x squeezed by [stretch] so circles stay round) and how far ahead it is, or null
   behind the near plane. [cy] is where the horizon sits. */
export function project(x, y, z, cz, width, cy, stretch) {
  var depth = cz - z;
  if (depth < NEAR) return null;
  return {
    x: width / 2 + (FOCAL * (x - OFFSET)) / depth / stretch,
    y: cy - (FOCAL * (y - HEIGHT)) / depth,
    depth: depth
  };
}

/* How fast the camera falls in at [cz]: faster nearer the sun, as anything falling toward it is. */
export function speed(cz) {
  return BASE_SPEED * (1 + 0.6 / Math.max(0.25, Math.abs(cz)));
}

export default function flyby(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  var cy = H * 0.5;

  // Stars, far enough off to stay put however far the camera goes.
  var stars = m.el('g', { 'class': 'masthead-flyby-stars' });
  for (var i = 0; i < 60; i++) {
    m.el('circle', { cx: (rand() * W).toFixed(1), cy: (rand() * H).toFixed(1), r: (0.5 + rand() * 0.9).toFixed(2) }, stars);
  }
  var scene = m.el('g', { 'class': 'masthead-flyby-scene' });
  var orbits = PLANETS.map(function () { return m.el('path', { 'class': 'masthead-flyby-orbit' }, scene); });
  var sunGlow = m.el('ellipse', { fill: m.pulse, 'class': 'masthead-flyby-glow' }, scene);
  var sun = m.el('ellipse', { 'class': 'masthead-flyby-sun' }, scene);
  var bodies = PLANETS.map(function (p) {
    var g = m.el('g', { 'class': 'masthead-flyby-planet' }, scene);
    return {
      g: g,
      ring: p.ring ? m.el('ellipse', { 'class': 'masthead-flyby-ring' }, g) : null,
      disc: m.el('ellipse', { 'class': 'masthead-flyby-disc' }, g)
    };
  });

  var planets, cz, burn;
  function begin() {
    planets = layout(rand);
    cz = START;
    burn = 0;
  }
  begin();

  function orbitPath(r, s) {
    var d = '', pen = false;
    for (var k = 0; k <= SEGMENTS; k++) {
      var a = (k / SEGMENTS) * Math.PI * 2;
      var p = project(r * Math.sin(a), 0, r * Math.cos(a), cz, W, cy, s);
      if (!p) { pen = false; continue; }
      d += (pen ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
      pen = true;
    }
    return d;
  }

  function place(el, p, radius, s) {
    el.setAttribute('cx', p.x.toFixed(1));
    el.setAttribute('cy', p.y.toFixed(1));
    el.setAttribute('rx', (radius / s).toFixed(2));
    el.setAttribute('ry', radius.toFixed(2));
  }

  function draw() {
    var s = m.stretch();
    var progress = (START - cz) / (START - END);
    var fade = Math.min(1, (START - cz) / (BASE_SPEED * FADE), (cz - END) / (BASE_SPEED * FADE * 2));
    scene.setAttribute('opacity', Math.max(0, fade).toFixed(3));

    planets.forEach(function (p, i) {
      orbits[i].setAttribute('d', orbitPath(p.r, s));
      var b = bodies[i];
      var at = project(p.x, 0, p.z, cz, W, cy, s);
      if (!at) { b.g.setAttribute('opacity', 0); return; }
      var radius = Math.min(70, (FOCAL * p.size) / at.depth);
      b.g.setAttribute('opacity', Math.min(1, 0.35 + 1.5 / at.depth).toFixed(2));
      place(b.disc, at, Math.max(0.8, radius), s);
      if (b.ring) {
        b.ring.setAttribute('cx', at.x.toFixed(1));
        b.ring.setAttribute('cy', at.y.toFixed(1));
        b.ring.setAttribute('rx', ((radius * 2.3) / s).toFixed(2));
        b.ring.setAttribute('ry', (radius * 0.55).toFixed(2));
      }
    });

    var sunAt = project(0, 0, 0, cz, W, cy, s);
    if (sunAt) {
      var sr = Math.min(160, (FOCAL * 0.07) / sunAt.depth);
      place(sun, sunAt, Math.max(1.2, sr), s);
      place(sunGlow, sunAt, Math.max(6, Math.min(120, sr * 2.4)), s);
      sun.setAttribute('opacity', 1);
      sunGlow.setAttribute('opacity', Math.min(0.7, 0.2 + progress * 0.6).toFixed(2));
    } else {
      sun.setAttribute('opacity', 0);
      sunGlow.setAttribute('opacity', 0);
    }
  }
  draw();

  return {
    interval: 40,
    poke: function () {
      burn = Math.min(4, burn + 2.5);
    },
    step: function () {
      cz -= speed(cz) * (1 + burn);
      burn = Math.max(0, burn - 0.03);
      if (cz <= END) begin();
      draw();
    }
  };
}
