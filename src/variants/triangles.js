/* Triangles: a low-poly mesh, breathing. Points on a jittered grid, each cell split into two
   triangles along a diagonal the seed picks, every inner point drifting on its own small orbit so
   the whole mesh slowly shifts. Now and then a triangle, or a few neighbours, fills faintly and
   fades again. The edges stay faint behind the name and grow stronger low. A click sends a ripple
   out: the points pushed outward as it passes, the triangles under it lit faintly in a ring. */
export var COLS = 12, ROWS = 5;
var FILLS = 6, SPEED = 9, REACH = 1300, PUSH = 10;

/* The mesh for a seeded rand(): its points (rest position, orbit, and which way an edge point may
   move), its triangles as point indices, and its edges, each once. */
export function mesh(rand, W, H) {
  var cw = W / COLS, ch = H / ROWS, points = [], tris = [], edges = [];
  for (var r = 0; r <= ROWS; r++) {
    for (var c = 0; c <= COLS; c++) {
      var sideX = c === 0 || c === COLS, sideY = r === 0 || r === ROWS;
      // Edge points slide only along their edge, and corners stay put, so the mesh fills the frame.
      var jx = sideX ? 0 : (rand() - 0.5) * 0.44 * cw, jy = sideY ? 0 : (rand() - 0.5) * 0.44 * ch;
      points.push({
        x0: c * cw + jx, y0: r * ch + jy, x: c * cw + jx, y: r * ch + jy,
        mx: sideX ? 0 : 1, my: sideY ? 0 : 1,
        radius: 3 + rand() * 6, speed: (0.6 + rand() * 1.2) * Math.PI * 2 / 400,
        phase: rand() * Math.PI * 2, swell: rand() * Math.PI * 2, squash: 0.6 + rand() * 0.5
      });
    }
  }
  function at(c, r) { return r * (COLS + 1) + c; }
  function edge(a, b) { edges.push([a, b]); }
  for (r = 0; r <= ROWS; r++) for (c = 0; c < COLS; c++) edge(at(c, r), at(c + 1, r));
  for (r = 0; r < ROWS; r++) for (c = 0; c <= COLS; c++) edge(at(c, r), at(c, r + 1));
  for (r = 0; r < ROWS; r++) {
    for (c = 0; c < COLS; c++) {
      var a = at(c, r), b = at(c + 1, r), d = at(c, r + 1), e = at(c + 1, r + 1);
      if (rand() < 0.5) { tris.push([a, b, e], [a, e, d]); edge(a, e); }
      else { tris.push([a, b, d], [b, e, d]); edge(b, d); }
    }
  }
  return { points: points, tris: tris, edges: edges };
}

/* Twice the signed area of triangle t over points p: its sign is its winding, which a fold flips. */
export function winding(p, t) {
  var a = p[t[0]], b = p[t[1]], c = p[t[2]];
  return (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
}

/* The points where they are at step n: each on its orbit, and pushed outward where a ripple
   ({ x, y, n }, from a click at step n) is passing, if there is one. */
export function place(points, n, ripple) {
  var front = ripple ? (n - ripple.n) * SPEED : 0;
  var fade = ripple ? Math.max(0, 1 - front / REACH) : 0;
  points.forEach(function (p) {
    // Each orbit swells and shrinks slowly too, so the breathing never quite repeats.
    var a = p.phase + n * p.speed, r = p.radius * (0.65 + 0.35 * Math.sin(p.swell + n * 0.003));
    var dx = Math.cos(a) * r, dy = Math.sin(a) * r * p.squash;
    if (ripple) {
      var ox = p.x0 - ripple.x, oy = p.y0 - ripple.y, d = Math.hypot(ox, oy) || 1;
      var push = PUSH * fade * Math.exp(-Math.pow((d - front) / 40, 2));
      dx += ox / d * push;
      dy += oy / d * push;
    }
    p.x = p.x0 + dx * p.mx;
    p.y = p.y0 + dy * p.my;
  });
}

export default function triangles(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var net = mesh(rand, W, H), points = net.points, tris = net.tris;
  // How strong a place is: faint across the middle band, where the name sits, stronger low.
  function strength(y) {
    if (y < 96) return 0.55;
    if (y < 224) return 0.22;
    return y < 272 ? 0.7 : 1;
  }

  // The edges in bands by where they lie, one path each, faintest behind the name.
  var bands = [0.22, 0.55, 0.7, 1].map(function (s) {
    return { s: s, edges: [], el: null };
  });
  net.edges.forEach(function (e) {
    var y = (points[e[0]].y0 + points[e[1]].y0) / 2, s = strength(y);
    bands.forEach(function (b) { if (b.s === s) b.edges.push(e); });
  });
  var ring = m.el('path', { 'class': 'masthead-triangles-ring', opacity: 0 });
  var pool = [];
  for (var i = 0; i < FILLS; i++) pool.push({ el: m.el('polygon', { 'class': 'masthead-triangles-fill', opacity: 0 }), tri: -1, age: 0, life: 0, peak: 0 });
  bands.forEach(function (b) {
    b.el = m.el('path', { 'class': 'masthead-triangles-edge', opacity: b.s.toFixed(2) });
  });

  tris.forEach(function (t) {
    t.cx = (points[t[0]].x0 + points[t[1]].x0 + points[t[2]].x0) / 3;
    t.cy = (points[t[0]].y0 + points[t[1]].y0 + points[t[2]].y0) / 3;
  });

  var ripple = null, nextFill = 20;

  function xy(p) { return p.x.toFixed(1) + ' ' + p.y.toFixed(1); }
  function shape(t) { return xy(points[t[0]]) + ' ' + xy(points[t[1]]) + ' ' + xy(points[t[2]]); }

  function move(n) {
    place(points, n, ripple);
    if (ripple && (n - ripple.n) * SPEED > REACH) ripple = null;
  }

  function draw(n) {
    bands.forEach(function (b) {
      var d = '';
      b.edges.forEach(function (e) { d += 'M' + xy(points[e[0]]) + 'L' + xy(points[e[1]]); });
      b.el.setAttribute('d', d);
    });
    pool.forEach(function (f) {
      if (f.tri < 0) return;
      f.el.setAttribute('points', shape(tris[f.tri]));
    });
    if (ripple) {
      var front = (n - ripple.n) * SPEED, d = '';
      tris.forEach(function (t) {
        if (Math.abs(Math.hypot(t.cx - ripple.x, t.cy - ripple.y) - front) < 40) d += 'M' + shape(t) + 'Z';
      });
      ring.setAttribute('d', d);
      ring.setAttribute('opacity', (0.09 * Math.max(0, 1 - front / REACH)).toFixed(3));
    } else {
      ring.setAttribute('opacity', 0);
    }
  }

  /* A triangle lighting: in over 30 steps, held, out over 50. */
  function light(f, tri, delay) {
    f.tri = tri;
    f.age = -delay;
    f.life = 30 + 40 + Math.floor(rand() * 60) + 50;
    f.peak = 0.03 + 0.15 * strength(tris[tri].cy);
  }
  function fills() {
    pool.forEach(function (f) {
      if (f.tri < 0) return;
      f.age++;
      var o = f.age < 0 ? 0 : f.age < 30 ? f.age / 30 : f.age > f.life - 50 ? (f.life - f.age) / 50 : 1;
      f.el.setAttribute('opacity', (Math.max(0, o) * f.peak).toFixed(3));
      if (f.age >= f.life) { f.tri = -1; f.el.setAttribute('opacity', 0); }
    });
  }
  function cluster(n) {
    if (n < nextFill) return;
    nextFill = n + 60 + Math.floor(rand() * 140);
    var free = pool.filter(function (f) { return f.tri < 0; });
    if (!free.length) return;
    var first = Math.floor(rand() * tris.length), t0 = tris[first];
    light(free[0], first, 0);
    var near = [];
    tris.forEach(function (t, k) { if (k !== first && Math.hypot(t.cx - t0.cx, t.cy - t0.cy) < 90) near.push(k); });
    var more = Math.min(free.length - 1, Math.floor(rand() * 3));
    for (var j = 0; j < more && near.length; j++) light(free[j + 1], near.splice(Math.floor(rand() * near.length), 1)[0], 8 + j * 10);
  }

  move(0);
  draw(0);
  var last = 0;

  return {
    interval: 40,
    poke: function (x, y) {
      ripple = { x: x, y: y, n: last };
    },
    step: function (n) {
      last = n;
      cluster(n);
      fills();
      move(n);
      draw(n);
    }
  };
}
