/* Corn maze: walking through a maze of corn, seen through the walker's eyes. The corn stands
   taller than you on either side, wall after wall in perspective, the near ones in stalks with
   leaves and tassels. The maze is a perfect one, carved by a random depth-first search; you go in
   at one corner and keep your right hand on the corn, turning at the corners and about at the
   dead ends, until you come out at the far corner. Then the view fades and you're at the start
   of another. The mazes come from the seed, so ?ambientSeed=<n> walks the same ones. A November
   animation. */

export var COLS = 10;
export var ROWS = 10;
/* Steps to walk a cell, and to turn a quarter. */
export var PACE = 32;
export var TURN = 26;
var FADE = 30;
/* The corn's height and the eye's, in cells; how far you can see, and where the stalks stop. */
var CORN = 0.78;
var EYE = 0.45;
var VIEW = 7;
var STALKS = 3.5;
var NEAR = 0.12;
/* The horizon, and the focal length, in the art's pixels. */
var HORIZON = 150;
var FOCAL = 330;
/* Points along a wall where its ragged top is set, and a stalk stands. */
var ALONG = 6;

/* A perfect maze carved by a random depth-first search: the cells in the order they're reached,
   each with the cell it was carved from (-1 for the first). Cells are numbered row by row. */
export function carve(cols, rows, rand) {
  var seen = new Array(cols * rows).fill(false), stack = [0], order = [{ cell: 0, from: -1 }];
  seen[0] = true;
  while (stack.length) {
    var i = stack[stack.length - 1], c = i % cols, r = Math.floor(i / cols), next = [];
    if (c > 0 && !seen[i - 1]) next.push(i - 1);
    if (c < cols - 1 && !seen[i + 1]) next.push(i + 1);
    if (r > 0 && !seen[i - cols]) next.push(i - cols);
    if (r < rows - 1 && !seen[i + cols]) next.push(i + cols);
    if (!next.length) { stack.pop(); continue; }
    var j = next[Math.floor(rand() * next.length)];
    seen[j] = true;
    order.push({ cell: j, from: i });
    stack.push(j);
  }
  return order;
}

/* The cells a walker visits keeping its right hand on the corn, from the top left (coming in
   from the left) to the bottom right. [links] lists each cell's open neighbours. */
export function follow(cols, rows, links) {
  // Headings: east, south, west, north.
  var DC = [1, 0, -1, 0], DR = [0, 1, 0, -1];
  var cell = 0, heading = 0, route = [0], end = cols * rows - 1;
  while (cell !== end && route.length < cols * rows * 4) {
    for (var turn = 1; turn >= -2; turn--) {
      var h = (heading + turn + 4) % 4, c = cell % cols + DC[h], r = Math.floor(cell / cols) + DR[h];
      if (c < 0 || r < 0 || c >= cols || r >= rows || links[cell].indexOf(r * cols + c) < 0) continue;
      heading = h;
      cell = r * cols + c;
      route.push(cell);
      break;
    }
  }
  return route;
}

/* The walls of corn still standing, as [x0, z0, x1, z1] on the ground (a cell is 1 across, x
   east and z south): the border, open at the way in (west of the first cell) and the way out
   (east of the last), and between every two cells not linked. */
export function walls(cols, rows, links) {
  var out = [[0, 0, cols, 0], [0, rows, cols, rows], [0, 1, 0, rows], [cols, 0, cols, rows - 1]];
  for (var i = 0; i < cols * rows; i++) {
    var c = i % cols, r = Math.floor(i / cols);
    if (c < cols - 1 && links[i].indexOf(i + 1) < 0) out.push([c + 1, r, c + 1, r + 1]);
    if (r < rows - 1 && links[i].indexOf(i + cols) < 0) out.push([c, r + 1, c + 1, r + 1]);
  }
  return out;
}

/* The walk, as legs one after another: { from: [x, z, heading], to: [x, z, heading], steps }.
   It starts just outside the way in, facing east, turns in place where the route turns (a
   quarter's worth of steps, or a half's at a dead end), and ends just outside the way out. */
export function schedule(cols, rows, route) {
  var legs = [], at = [-0.5, 0.5, 0];
  function go(x, z) {
    var heading = Math.atan2(z - at[1], x - at[0]), turn = heading - at[2];
    while (turn > Math.PI + 1e-9) turn -= Math.PI * 2;
    while (turn < -Math.PI + 1e-9) turn += Math.PI * 2;
    if (Math.abs(turn) > 1e-6) {
      // About at a dead end: right round, as the right hand on the corn leads.
      if (Math.abs(Math.abs(turn) - Math.PI) < 1e-6) turn = Math.PI;
      legs.push({ from: at, to: [at[0], at[1], at[2] + turn], steps: Math.round(TURN * Math.abs(turn) / (Math.PI / 2)) });
      at = [at[0], at[1], at[2] + turn];
    }
    legs.push({ from: at, to: [x, z, at[2]], steps: PACE });
    at = [x, z, at[2]];
  }
  route.forEach(function (i) { go(i % cols + 0.5, Math.floor(i / cols) + 0.5); });
  go(cols + 0.5, rows - 0.5);
  return legs;
}

/* Where the walker is [t] steps into [legs]: x, z and heading, a turn eased in and out. */
export function where(legs, t) {
  for (var i = 0; i < legs.length; i++) {
    var leg = legs[i];
    if (t < leg.steps) {
      var u = t / leg.steps;
      if (leg.from[2] !== leg.to[2]) u = (1 - Math.cos(Math.PI * u)) / 2;
      return [0, 1, 2].map(function (k) { return leg.from[k] + (leg.to[k] - leg.from[k]) * u; });
    }
    t -= leg.steps;
  }
  return legs[legs.length - 1].to.slice();
}

/* A leaf blade from node [n] on a stalk, [length] long, arching up and out to the side [dir]
   (1 right, -1 left; already squeezed for a stretched masthead) and drooping at its tip. */
export function blade(n, dir, length) {
  var L = length, x = n[0], y = n[1];
  function p(dx, dy) { return (x + dir * dx * L).toFixed(1) + ' ' + (y + dy * L).toFixed(1); }
  return 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'Q' + p(0.35, -0.55) + ' ' + p(0.95, -0.2) + 'Q' + p(0.4, -0.38) + ' ' + x.toFixed(1) + ' ' + (y + 0.06 * L).toFixed(1) + 'Z';
}

/* An ear of corn in its husk from node [n], [length] long, angled up and out to [dir], with the
   husk's tip curling off it. */
export function ear(n, dir, length) {
  var L = length, x = n[0], y = n[1];
  function p(dx, dy) { return (x + dir * dx * L).toFixed(1) + ' ' + (y + dy * L).toFixed(1); }
  return 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'Q' + p(0.45, -0.25) + ' ' + p(0.4, -0.9) + 'Q' + p(0.1, -0.5) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + 'Z' +
    'M' + p(0.4, -0.9) + 'Q' + p(0.45, -1.1) + ' ' + p(0.62, -1.08);
}

export default function cornmaze(layer, m) {
  var W = m.width;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  // A small seed's first draw is always about 0.24, so it's thrown away.
  rand();

  var g = m.el('g', { 'class': 'masthead-cornmaze' });
  m.el('path', { 'class': 'masthead-cornmaze-horizon', d: 'M0 ' + HORIZON + 'H' + W }, g);
  // A pool of walls in the order they're painted, each its face and its corn.
  var pool = [];
  var maze;

  function begin(n) {
    var links = [];
    for (var i = 0; i < COLS * ROWS; i++) links.push([]);
    carve(COLS, ROWS, rand).forEach(function (o) {
      if (o.from >= 0) { links[o.from].push(o.cell); links[o.cell].push(o.from); }
    });
    var legs = schedule(COLS, ROWS, follow(COLS, ROWS, links));
    maze = { walls: walls(COLS, ROWS, links), legs: legs, start: n, salt: rand() * 100, length: legs.reduce(function (a, l) { return a + l.steps; }, 0) };
    g.setAttribute('opacity', 1);
  }

  /* The corn's height at point [k] along wall [w]: ragged, but the same every time it's seen. */
  function height(w, k) {
    var x = Math.sin((w[0] + (w[2] - w[0]) * k / ALONG) * 12.9898 + (w[1] + (w[3] - w[1]) * k / ALONG) * 78.233 + maze.salt) * 43758.5453;
    return CORN * (0.88 + 0.18 * (x - Math.floor(x)));
  }

  function slot(i) {
    while (pool.length <= i) {
      pool.push({
        face: m.el('path', { 'class': 'masthead-cornmaze-wall' }, g),
        corn: m.el('path', { 'class': 'masthead-cornmaze-corn' }, g),
        leaves: m.el('path', { 'class': 'masthead-cornmaze-leaves' }, g),
        ears: m.el('path', { 'class': 'masthead-cornmaze-ears' }, g)
      });
    }
    return pool[i];
  }

  function draw(n) {
    var cam = where(maze.legs, n - maze.start), fx = Math.cos(cam[2]), fz = Math.sin(cam[2]);
    var squeeze = 1 / m.stretch(), focalX = FOCAL * squeeze;
    // Into the walker's view: how far to the right, and how far ahead.
    function view(x, z) { var dx = x - cam[0], dz = z - cam[1]; return [dx * -fz + dz * fx, dx * fx + dz * fz]; }
    function screen(side, depth, high) { return [W / 2 + focalX * side / depth, HORIZON - FOCAL * (high - EYE) / depth]; }
    function pt(p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }

    var seen = [];
    maze.walls.forEach(function (w) {
      var far = Math.hypot((w[0] + w[2]) / 2 - cam[0], (w[1] + w[3]) / 2 - cam[1]);
      if (far > VIEW) return;
      // Points along the wall, each with the corn's height there, those behind you cut away at
      // the near plane, so a wall beside you runs out of the side of the view.
      var pts = [];
      for (var k = 0; k <= ALONG; k++) {
        var t = k / ALONG, v = view(w[0] + (w[2] - w[0]) * t, w[1] + (w[3] - w[1]) * t);
        pts.push([v[0], v[1], height(w, k)]);
      }
      var kept = [];
      for (k = 0; k <= ALONG; k++) {
        var p = pts[k], q = pts[k + 1];
        if (p[1] >= NEAR) kept.push(p.concat(k > 0 && k < ALONG ? 1 : 0));
        if (q && (p[1] < NEAR) !== (q[1] < NEAR)) {
          var u = (NEAR - p[1]) / (q[1] - p[1]);
          kept.push([p[0] + (q[0] - p[0]) * u, NEAR, p[2] + (q[2] - p[2]) * u, 0]);
        }
      }
      if (kept.length >= 2) seen.push({ pts: kept, far: far });
    });
    // The painter's way: the farthest first, so the near corn hides what's behind it.
    seen.sort(function (p, q) { return q.far - p.far; });
    seen.forEach(function (s, i) {
      var it = slot(i), foot = s.pts.map(function (p) { return screen(p[0], p[1], 0); }), top = s.pts.map(function (p) { return screen(p[0], p[1], p[2]); });
      var ground = 'M' + foot.map(pt).join('L'), crown = 'M' + top.map(pt).join('L');
      it.face.setAttribute('d', ground + 'L' + top.slice().reverse().map(pt).join('L') + 'Z');
      var lines = ground + crown, blades = '', ears = '';
      // Near, a stalk at each point inside the wall: leaf blades arching out from it on
      // alternate sides, an ear in its husk, and a spray of tassel on top.
      s.pts.forEach(function (p, k) {
        if (s.far > STALKS || !p[3] || p[1] < NEAR * 2) return;
        var f = foot[k], c = top[k], tall = f[1] - c[1], side = k % 2 ? 1 : -1;
        lines += 'M' + pt(f) + 'L' + pt(c);
        [0.28, 0.5, 0.72].forEach(function (at, j) {
          blades += blade([f[0], f[1] - tall * at], (j % 2 ? -side : side) * squeeze, tall * (0.42 - at * 0.15));
        });
        ears += ear([f[0], f[1] - tall * 0.45], -side * squeeze, tall * 0.2);
        for (var t = -2; t <= 2; t++) lines += 'M' + pt(c) + 'l' + (t * tall * 0.035 * squeeze).toFixed(1) + ' ' + (-tall * (0.09 - Math.abs(t) * 0.015)).toFixed(1);
      });
      it.leaves.setAttribute('d', blades);
      it.ears.setAttribute('d', ears);
      it.corn.setAttribute('d', lines);
    });
    for (var i = seen.length; i < pool.length; i++) ['face', 'corn', 'leaves', 'ears'].forEach(function (k) { pool[i][k].setAttribute('d', ''); });
  }

  begin(0);
  draw(0);

  return {
    interval: 40,
    step: function (n) {
      var t = n - maze.start - maze.length;
      if (t >= FADE) begin(n);
      else if (t > 0) g.setAttribute('opacity', (1 - t / FADE).toFixed(2));
      draw(n);
    }
  };
}
