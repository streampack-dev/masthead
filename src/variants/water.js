/* Water: a still surface seen from just above, drawn as lines across it, that drops land on now
   and then. Their rings spread, cross and fade, over a slow swell that never quite settles. The
   drops come from the seed, so ?ambientSeed=<n> replays where and when they land. */
export var GRID_W = 120, GRID_H = 40, LINES = 18;
var DAMPING = 0.986;

/* One step of the ripple equation: each cell's next height is half its neighbours' sum less its
   last height, damped. [heights] holds the last two frames; returns them swapped. */
export function ripple(now, before) {
  for (var y = 1; y < GRID_H - 1; y++) {
    for (var x = 1; x < GRID_W - 1; x++) {
      var i = y * GRID_W + x;
      before[i] = ((now[i - 1] + now[i + 1] + now[i - GRID_W] + now[i + GRID_W]) / 2 - before[i]) * DAMPING;
    }
  }
  return [before, now];
}

/* A drop at (x, y): a small dip, rounded so it rings rather than spikes. */
export function drop(heights, x, y, depth) {
  for (var dy = -2; dy <= 2; dy++) {
    for (var dx = -2; dx <= 2; dx++) {
      var cx = x + dx, cy = y + dy;
      if (cx < 1 || cy < 1 || cx >= GRID_W - 1 || cy >= GRID_H - 1) continue;
      var falloff = 1 - Math.hypot(dx, dy) / 3;
      if (falloff > 0) heights[cy * GRID_W + cx] -= depth * falloff;
    }
  }
}

export default function water(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var now = new Float32Array(GRID_W * GRID_H), before = new Float32Array(GRID_W * GRID_H);
  var cellW = W / (GRID_W - 1), cellH = H / (GRID_H - 1);
  var lines = [];
  for (var l = 0; l < LINES; l++) {
    // Lines bunch toward the top, as a surface seen at a low angle does.
    var depth = (l + 0.5) / LINES;
    var row = Math.round(1 + Math.pow(depth, 1.35) * (GRID_H - 3));
    lines.push({ row: row, depth: depth, el: m.el('path', { 'class': 'masthead-water-line', 'stroke-opacity': (0.35 + depth * 0.65).toFixed(2) }) });
  }

  // A few drops already ringing, so the surface is moving from the first frame.
  for (var d = 0; d < 3; d++) drop(now, 6 + Math.floor(rand() * (GRID_W - 12)), 4 + Math.floor(rand() * (GRID_H - 8)), 3 + rand() * 3);
  var nextDrop = null;

  function draw(time) {
    var t = time / 1000;
    lines.forEach(function (line) {
      var y0 = line.row * cellH, d = [];
      // Nearer lines move more: the swell and the rings both grow toward the viewer.
      var lift = 4 + line.depth * 10;
      for (var x = 0; x < GRID_W; x++) {
        var h = now[line.row * GRID_W + x];
        var swell = Math.sin(x * 0.11 + t * 0.9 + line.row * 0.5) * 0.35 + Math.sin(x * 0.047 - t * 0.6) * 0.25;
        d.push((x === 0 ? 'M' : 'L') + (x * cellW).toFixed(1) + ' ' + (y0 + (h + swell) * lift).toFixed(1));
      }
      line.el.setAttribute('d', d.join(''));
    });
  }
  draw(0);

  return {
    interval: 40,
    step: function (n, time) {
      if (nextDrop === null) nextDrop = time + 300 + rand() * 900;
      if (time >= nextDrop) {
        drop(now, 4 + Math.floor(rand() * (GRID_W - 8)), 3 + Math.floor(rand() * (GRID_H - 6)), 2.5 + rand() * 4);
        nextDrop = time + 400 + rand() * 1600;
      }
      var swapped = ripple(now, before);
      now = swapped[0];
      before = swapped[1];
      draw(time);
    }
  };
}
