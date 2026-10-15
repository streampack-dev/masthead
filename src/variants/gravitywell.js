/* Gravitywell: space as a sheet, drawn as a grid of lines in perspective, flown over slowly at the
   scale of a galaxy. Where a black hole sits the sheet drops away into a deep funnel, the lines
   bending down into it till the bottom drops out; stars are shallow dimples.
   The grid scrolls toward you and the wells pass under or beside you, the camera drifting from
   side to side. Where the wells are comes from the seed, so ?ambientSeed=<n> replays a flight. A
   click drops a small mass on the sheet there, which dimples it and passes under in its turn.

   The math is kept light: the sheet is a sum of wells, each flat beyond its reach; the grid is
   polylines through a pinhole, sampled more finely only near a well's throat. */

export var SPACING = 1.25; // between grid lines, in the sheet's units
export var CAM_H = 3; // the camera above the flat sheet
export var FOCAL = 500;
export var NEAR = 3; // nothing nearer is drawn
export var FAR = 28;
export var CAP = 16; // the deepest a throat goes
export var SPEED = 0.035; // per step
var DRIFT = 5; // how far the camera wanders to either side
var GROW = 24; // steps for a dropped mass to settle

/* The kinds of well: its mass, how soft its throat is, and how far it reaches before the sheet is
   flat again. */
export var KINDS = {
  hole: { mass: 18, soft: 1, reach: 12 },
  star: { mass: 1.2, soft: 1, reach: 5 },
  dropped: { mass: 2.5, soft: 0.8, reach: 6 }
};

/* How far one well drops the sheet at [d] from its centre: mass / distance, softened at the throat
   and lifted so it is 0 at its reach and beyond. [grown] (0 to 1) scales it, for a dropped mass. */
export function dip(kind, d, grown) {
  var k = KINDS[kind];
  if (d >= k.reach) return 0;
  var g = grown === undefined ? 1 : grown;
  return g * k.mass * (1 / Math.sqrt(d * d + k.soft * k.soft) - 1 / Math.sqrt(k.reach * k.reach + k.soft * k.soft));
}

/* The sheet's height at (x, z): 0 where it's flat, down to -CAP. */
export function height(wells, x, z) {
  var h = 0;
  for (var i = 0; i < wells.length; i++) {
    var w = wells[i], dx = x - w.x, dz = z - w.z;
    h -= dip(w.kind, Math.sqrt(dx * dx + dz * dz), w.grown);
  }
  return Math.max(-CAP, h);
}

/* Where the camera is across the sheet when it has come [z] along it. */
export function camX(z) {
  return DRIFT * Math.sin(z / 37);
}

/* A point on the sheet as the camera at (cx, CAM_H, cz) sees it, looking along z: its place on the
   art (x squeezed by [stretch]), or null nearer than NEAR. [cy] is the horizon. */
export function project(x, h, z, cx, cz, width, cy, stretch) {
  var depth = z - cz;
  if (depth < NEAR) return null;
  return {
    x: width / 2 + (FOCAL * (x - cx)) / depth / stretch,
    y: cy + (FOCAL * (CAM_H - h)) / depth,
    depth: depth
  };
}

/* The wells from [from] to [to] along the flight, one every 12 to 22 units: black holes and stars,
   mostly off to the sides, now and then right on the camera's way. Centres sit on grid crossings,
   so a line runs down each throat. */
export function wellsAlong(rand, from, to) {
  var out = [], z = from;
  for (;;) {
    z += 12 + rand() * 10;
    if (z > to) return out;
    var kind = rand() < 0.35 ? 'hole' : 'star';
    var off = rand() < 0.2 ? rand() * 2 : 6 + rand() * 8;
    var x = camX(z) + (rand() < 0.5 ? -off : off);
    out.push({ kind: kind, x: Math.round(x / SPACING) * SPACING, z: Math.round(z / SPACING) * SPACING, grown: 1 });
  }
}

/* Positions from [lo] to [hi]: every [step], and every 0.25 within 3 of each of [centres]. */
export function samples(lo, hi, step, centres) {
  var out = [];
  for (var v = lo; v <= hi; v += step) out.push(v);
  centres.forEach(function (c) {
    for (var f = Math.max(lo, c - 3); f <= Math.min(hi, c + 3); f += 0.25) out.push(f);
  });
  out.push(hi);
  return out.sort(function (a, b) { return a - b; });
}

export default function gravitywell(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  var cy = H * 0.16;

  var along = m.el('path', { 'class': 'masthead-gravitywell-grid masthead-gravitywell-along' });
  var acrossLayer = m.el('g', { 'class': 'masthead-gravitywell-grid' });
  var across = [];
  for (var i = 0; i < Math.ceil(FAR / SPACING) + 1; i++) across.push(m.el('path', {}, acrossLayer));

  var cz = 0;
  var wells = wellsAlong(rand, cz - 10, cz + FAR + 10);
  var planned = cz + FAR + 10;

  // Where a line at x (or z) passes within 3 of a well, it is sampled finely there.
  function near(coord, of, other) {
    return wells.filter(function (w) { return Math.abs(w[other] - coord) < 3; }).map(function (w) { return w[of]; });
  }

  function line(points) {
    var d = '', pen = false;
    points.forEach(function (p) {
      if (!p) { pen = false; return; }
      d += (pen ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
      pen = true;
    });
    return d;
  }

  function draw() {
    var s = m.stretch(), cx = camX(cz);
    var at = function (x, z) { return project(x, height(wells, x, z), z, cx, cz, W, cy, s); };
    var halfFar = (W / 2) * s * FAR / FOCAL + SPACING;

    // Lines across the flight, every SPACING along it, each as wide as the view at its depth.
    var first = Math.ceil((cz + NEAR) / SPACING) * SPACING;
    across.forEach(function (el, k) {
      var z = first + k * SPACING, depth = z - cz;
      if (depth > FAR) { el.setAttribute('d', ''); return; }
      var half = (W / 2) * s * depth / FOCAL + SPACING;
      var xs = samples(cx - half, cx + half, Math.max(0.5, half / 24), near(z, 'x', 'z'));
      el.setAttribute('d', line(xs.map(function (x) { return at(x, z); })));
      // Far lines fade into the distance.
      el.setAttribute('opacity', Math.max(0, Math.min(1, 1.4 - 1.3 * depth / FAR)).toFixed(2));
    });

    // Lines along the flight, every SPACING across it, to the far edge.
    var d = '';
    for (var x = Math.ceil((cx - halfFar) / SPACING) * SPACING; x <= cx + halfFar; x += SPACING) {
      // From where it comes into view at the side; nearer than that it's off the edge.
      var from = Math.max(cz + NEAR, cz + (Math.abs(x - cx) - SPACING) * FOCAL / ((W / 2) * s));
      if (from >= cz + FAR) continue;
      var zs = samples(from, cz + FAR, 1, near(x, 'z', 'x'));
      d += line(zs.map(function (z) { return at(x, z); }));
    }
    along.setAttribute('d', d);
  }

  draw();

  return {
    interval: 40,
    step: function () {
      cz += SPEED;
      wells.forEach(function (w) {
        if (w.grown < 1) w.grown = Math.min(1, w.grown + 1 / GROW);
      });
      // Wells passed and out of reach behind go; new ones come in beyond the far edge.
      wells = wells.filter(function (w) { return w.z > cz - KINDS[w.kind].reach; });
      if (planned < cz + FAR + 10) {
        wells = wells.concat(wellsAlong(rand, planned, planned + 40));
        planned += 40;
      }
      draw();
    },
    poke: function (x, y) {
      // The point on the flat sheet under the click; above the horizon, as far off as it's drawn.
      var s = m.stretch();
      var depth = y > cy + 1 ? Math.min(FAR, Math.max(NEAR + 2, (FOCAL * CAM_H) / (y - cy))) : FAR;
      var wx = camX(cz) + ((x - W / 2) * s * depth) / FOCAL;
      wells.push({ kind: 'dropped', x: wx, z: cz + depth, grown: 0 });
    }
  };
}
