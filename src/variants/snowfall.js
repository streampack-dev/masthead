/* Snowfall: snow falling on a village along the foot of the masthead, and settling. Each flake
   that lands adds a grain to the snow where it lands, and a grain slides on to a lower
   neighbour wherever the snow is steeper than it will lie (45 degrees), as sand does. So the
   snow lies on the gentler roofs, rounds off at their edges, slides off the steep ones, and
   drifts against the walls below. After a while the snow stops, lies a while, and melts; then it
   snows again. The village and the flakes come from the seed, so ?ambientSeed=<n> replays them.
   A winter animation. */

export var GROUND = 312;
/* The width of a column of snow, the depth a flake adds, and the steepest the snow lies: a rise
   of a column's width over a column, 45 degrees. */
export var COLUMN = 3;
export var GRAIN = 0.6;
export var REPOSE = 3;
var FLAKES = 45;
/* Each flake drawn stands for many: this many unseen grains land a step as well. */
var UNSEEN = 3;
/* The snow stops at this mean depth, lies, and melts. */
var DEEP = 7;
var LIE = 250;
var MELT = 0.025;

/* A village across [width]: houses with gabled roofs and chimneys, and now and then a shop with
   a flat roof, shoulder to shoulder or with a yard between. */
export function village(rand, width) {
  var out = [], x = -10 + rand() * 20;
  while (x < width) {
    var w = 46 + rand() * 44, wall = 28 + rand() * 26, flat = rand() < 0.2;
    out.push({ x: x, w: w, wall: wall, roof: flat ? 0 : 16 + rand() * 18, chimney: !flat && rand() < 0.6 ? x + w * (rand() < 0.5 ? 0.22 : 0.68) : null });
    x += w + (rand() < 0.3 ? 14 + rand() * 30 : 2 + rand() * 4);
  }
  return out;
}

/* The height of the bare village (a y, the ground or a roof) at [x]. */
export function surface(houses, x) {
  var y = GROUND;
  houses.forEach(function (h) {
    if (x < h.x || x > h.x + h.w) return;
    var top = GROUND - h.wall, mid = h.x + h.w / 2;
    var roof = top - h.roof * (1 - Math.abs(x - mid) / (h.w / 2));
    if (h.chimney !== null && x >= h.chimney && x <= h.chimney + 7) roof = Math.min(roof, top - h.roof * (1 - Math.abs(h.chimney + 3.5 - mid) / (h.w / 2)) - 10);
    y = Math.min(y, roof);
  });
  return y;
}

/* Lands a grain in column [c] and lets it slide on, down the steepest way, while the snow there
   is steeper than [REPOSE]. A grain that slides off either end is gone. Returns where it stopped,
   or -1. */
export function settle(base, snow, c) {
  for (var guard = 0; guard < 400; guard++) {
    var top = base[c] - snow[c], best = -1, drop = REPOSE;
    for (var d = -1; d <= 1; d += 2) {
      var n = c + d;
      var fall = n < 0 || n >= base.length ? Infinity : base[n] - snow[n] - top;
      if (fall > drop) { drop = fall; best = n; }
    }
    if (drop === Infinity) return -1;
    if (best < 0) { snow[c] += GRAIN; return c; }
    c = best;
  }
  snow[c] += GRAIN;
  return c;
}

export default function snowfall(layer, m) {
  var W = m.width;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  // A small seed's first draw is always about 0.24, so it's thrown away.
  rand();

  var houses = village(rand, W);
  var cols = Math.ceil(W / COLUMN), base = new Float64Array(cols), snow = new Float64Array(cols);
  for (var c = 0; c < cols; c++) base[c] = surface(houses, (c + 0.5) * COLUMN);

  var g = m.el('g', { 'class': 'masthead-snowfall' });
  var lying = m.el('path', { 'class': 'masthead-snowfall-snow' }, g);
  var d = 'M0 ' + GROUND + 'H' + W;
  houses.forEach(function (h) {
    var top = GROUND - h.wall, x1 = h.x + h.w, mid = h.x + h.w / 2;
    d += 'M' + h.x.toFixed(1) + ' ' + GROUND + 'V' + top.toFixed(1) + (h.roof ? 'L' + mid.toFixed(1) + ' ' + (top - h.roof).toFixed(1) + 'L' + x1.toFixed(1) + ' ' + top.toFixed(1) : 'H' + x1.toFixed(1)) + 'V' + GROUND;
    if (h.chimney !== null) {
      var foot = surface([{ x: h.x, w: h.w, wall: h.wall, roof: h.roof, chimney: null }], h.chimney + 3.5);
      d += 'M' + h.chimney.toFixed(1) + ' ' + (foot + 2).toFixed(1) + 'V' + (foot - 10).toFixed(1) + 'h7V' + (foot + 2).toFixed(1);
    }
    // A door, and a window either side if there's room.
    d += 'M' + (mid - 4).toFixed(1) + ' ' + GROUND + 'v-14h8v14';
    if (h.w > 56 && h.wall > 32) {
      [h.x + h.w * 0.2, x1 - h.w * 0.2 - 8].forEach(function (x) { d += 'M' + x.toFixed(1) + ' ' + (top + 9).toFixed(1) + 'h8v8h-8z'; });
    }
  });
  m.el('path', { 'class': 'masthead-snowfall-village', d: d }, g);

  var flakes = [];
  for (var k = 0; k < FLAKES; k++) {
    flakes.push({ x: rand() * W, y: rand() * GROUND, r: 1 + rand() * 1.2, fall: 0.45 + rand() * 0.5, sway: rand() * 6.3, el: m.el('ellipse', { 'class': 'masthead-snowfall-flake' }, g) });
  }

  var phase = 'snow', since = 0;

  /* The snow lying: from the left, along the top of the snow where there's any, and back along
     the bare village under it. */
  function drawSnow() {
    var top = '', under = '';
    for (var c = 0; c < cols; c++) {
      var x = (c + 0.5) * COLUMN;
      // Drawn a little smoothed, so single grains don't stand up like teeth.
      var depth = (snow[Math.max(0, c - 1)] + snow[c] * 2 + snow[Math.min(cols - 1, c + 1)]) / 4;
      top += (c ? 'L' : 'M') + x.toFixed(1) + ' ' + (base[c] - Math.min(snow[c] + 0.6, depth)).toFixed(1);
      under = 'L' + x.toFixed(1) + ' ' + base[c].toFixed(1) + under;
    }
    lying.setAttribute('d', top + under + 'Z');
  }

  function drawFlakes() {
    var squeeze = 1 / m.stretch();
    flakes.forEach(function (f) {
      f.el.setAttribute('cx', f.x.toFixed(1));
      f.el.setAttribute('cy', f.y.toFixed(1));
      f.el.setAttribute('rx', (f.r * squeeze).toFixed(2));
      f.el.setAttribute('ry', f.r.toFixed(2));
      f.el.setAttribute('opacity', phase === 'snow' ? 1 : 0);
    });
  }

  drawSnow();
  drawFlakes();

  return {
    interval: 40,
    step: function (n) {
      since += 1;
      var mean = 0;
      for (var c = 0; c < cols; c++) mean += snow[c];
      mean /= cols;
      if (phase === 'snow') {
        flakes.forEach(function (f) {
          f.y += f.fall;
          f.x += Math.sin(n * 0.03 + f.sway) * 0.35;
          var col = Math.floor(f.x / COLUMN);
          if (col >= 0 && col < cols && f.y >= base[col] - snow[col]) {
            settle(base, snow, col);
            f.y = -4;
            f.x = rand() * W;
          } else if (col < 0 || col >= cols) {
            f.x = (f.x + W) % W;
          }
        });
        for (var u = 0; u < UNSEEN; u++) settle(base, snow, Math.floor(rand() * cols));
        if (mean >= DEEP) { phase = 'lie'; since = 0; }
      } else if (phase === 'lie') {
        if (since >= LIE) { phase = 'melt'; since = 0; }
      } else {
        for (c = 0; c < cols; c++) snow[c] = Math.max(0, snow[c] - MELT);
        if (mean <= 0) {
          phase = 'snow';
          since = 0;
          flakes.forEach(function (f) { f.y = -rand() * GROUND; });
        }
      }
      if (n % 2 === 0 || phase === 'melt') drawSnow();
      drawFlakes();
    }
  };
}
