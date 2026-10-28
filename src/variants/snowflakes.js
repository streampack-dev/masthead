/* Snowflakes: snow crystals growing either side of the name, by Clifford Reiter's model (2005).
   Each cell of a hexagonal grid holds water; a cell at 1 or more is ice. Ice and its neighbours
   are receptive: they keep their water and take in a little more (gamma) from the air. The other
   cells pass their water about, each toward the average of its six neighbours (alpha), and the
   far edge is held at the air's own level (beta). From one frozen cell it grows six arms, the same
   in every direction because the grid is; beta and gamma decide whether they're thin stars,
   ferns, broad plates or lace, so no two flakes are alike. A grown flake rests, fades, and
   another grows with others. The settings come from the seed, so ?ambientSeed=<n> replays them.
   A winter animation. */

/* The grid's radius in cells, and the distance between cells. */
export var RADIUS = 40;
var SPACE = 2.2;
export var ALPHA = 1;
/* Pairs of beta and gamma that grow a snowflake: stars, ferns, plates and lace. */
export var KINDS = [[0.4, 0.001], [0.35, 0.001], [0.65, 0.001], [0.8, 0.002], [0.95, 0.0001], [0.5, 0.005], [0.4, 0.0001]];
/* Steps a flake takes to grow; at most this many iterations a step; then it rests and fades. */
export var GROW = 500;
var MOST = 4;
var REST = 150;
var FADE = 40;
/* The six neighbours, in axial co-ordinates. */
var AROUND = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

/* A flake's grid: the cells within [radius] of the middle (axial co-ordinates), their neighbours
   (-1 off the grid), and the water in each. */
export function grid(radius, beta) {
  var cells = [], at = {};
  for (var q = -radius; q <= radius; q++) {
    for (var r = -radius; r <= radius; r++) {
      if (Math.abs(q + r) > radius) continue;
      at[q + ',' + r] = cells.length;
      cells.push([q, r]);
    }
  }
  var near = new Int32Array(cells.length * 6);
  cells.forEach(function (c, i) {
    AROUND.forEach(function (d, k) {
      var j = at[(c[0] + d[0]) + ',' + (c[1] + d[1])];
      near[i * 6 + k] = j === undefined ? -1 : j;
    });
  });
  var water = new Float64Array(cells.length).fill(beta);
  var ice = new Uint8Array(cells.length);
  var middle = at['0,0'];
  water[middle] = 1;
  ice[middle] = 1;
  return { cells: cells, near: near, water: water, ice: ice, still: new Float64Array(cells.length), kept: new Float64Array(cells.length), radius: radius, reach: 0 };
}

/* One step of Reiter's model on grid [g]. Returns the cells that froze. */
export function grow(g, alpha, beta, gamma) {
  var n = g.cells.length, near = g.near, water = g.water, ice = g.ice, still = g.still, kept = g.kept;
  for (var i = 0; i < n; i++) {
    var receptive = ice[i];
    for (var k = 0; k < 6 && !receptive; k++) { var j = near[i * 6 + k]; if (j >= 0 && ice[j]) receptive = 1; }
    if (receptive) { still[i] = 0; kept[i] = water[i] + gamma; } else { still[i] = water[i]; kept[i] = 0; }
  }
  var froze = [];
  for (i = 0; i < n; i++) {
    var sum = 0;
    for (k = 0; k < 6; k++) { j = near[i * 6 + k]; sum += j < 0 ? beta : still[j]; }
    // The edge of the grid is the open air.
    var c = g.cells[i], far = Math.max(Math.abs(c[0]), Math.abs(c[1]), Math.abs(c[0] + c[1]));
    water[i] = far === g.radius ? beta : still[i] + alpha / 2 * (sum / 6 - still[i]) + kept[i];
    if (!ice[i] && water[i] >= 1) {
      ice[i] = 1;
      froze.push(i);
      g.reach = Math.max(g.reach, far);
    }
  }
  return froze;
}

export default function snowflakes(layer, m) {
  var W = m.width;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  // A small seed's first draw is always about 0.24, so it's thrown away.
  rand();

  var HEX = '';
  for (var k = 0; k < 6; k++) {
    var a = Math.PI / 3 * k + Math.PI / 6, b = Math.PI / 3 * (k + 1) + Math.PI / 6, h = SPACE / Math.sqrt(3) * 0.92;
    HEX += 'l' + (h * (Math.cos(b) - Math.cos(a))).toFixed(2) + ' ' + (h * (Math.sin(b) - Math.sin(a))).toFixed(2);
  }

  function flake(x, start) {
    var g = m.el('g', { 'class': 'masthead-snowflakes-flake' });
    return { x: x, g: g, start: start };
  }
  var flakes = [flake(170, 0), flake(W - 170, -Math.floor((GROW + REST + FADE) / 2))];

  function begin(f, n) {
    while (f.g.children.length) f.g.removeChild(f.g.children[0]);
    var kind = KINDS[Math.floor(rand() * KINDS.length)];
    f.beta = kind[0];
    f.gamma = kind[1];
    f.grid = grid(RADIUS, f.beta);
    f.start = n;
    f.done = -1;
    f.y = 150 + rand() * 20;
    f.g.setAttribute('opacity', 1);
    // A slight turn of its own, so two flakes don't stand the same way.
    f.turn = (rand() - 0.5) * 30;
    paint(f, [f.grid.cells.length >> 1]);
  }

  /* The cells that froze, drawn as small hexagons. */
  function paint(f, froze) {
    if (!froze.length) return;
    var d = '';
    froze.forEach(function (i) {
      var c = f.grid.cells[i], x = SPACE * (c[0] + c[1] / 2), y = SPACE * c[1] * Math.sqrt(3) / 2, h = SPACE / Math.sqrt(3) * 0.92;
      d += 'M' + (x + h * Math.cos(Math.PI / 6)).toFixed(2) + ' ' + (y + h * Math.sin(Math.PI / 6)).toFixed(2) + HEX + 'z';
    });
    m.el('path', { 'class': 'masthead-snowflakes-ice', d: d }, f.g);
  }

  function place(f) {
    f.g.setAttribute('transform', 'translate(' + f.x + ' ' + f.y.toFixed(1) + ') scale(' + (1 / m.stretch()).toFixed(4) + ' 1) rotate(' + f.turn.toFixed(1) + ')');
  }

  flakes.forEach(function (f) { if (f.start >= 0) begin(f, 0); else f.g.setAttribute('opacity', 0); });
  flakes.forEach(function (f) { if (f.grid) place(f); });

  return {
    interval: 40,
    step: function (n) {
      flakes.forEach(function (f) {
        if (!f.grid) { if (n >= -f.start) begin(f, n); else return; }
        var age = n - f.start;
        if (f.done < 0) {
          // Grown to the pace of the clock, not of the model: every flake takes about as long.
          var want = RADIUS * 0.92 * Math.min(1, age / GROW), froze = [];
          for (var i = 0; i < MOST && f.grid.reach < want; i++) froze = froze.concat(grow(f.grid, ALPHA, f.beta, f.gamma));
          paint(f, froze);
          if (f.grid.reach >= RADIUS * 0.92 - 1 || age > GROW * 3) f.done = n;
        } else {
          var t = n - f.done - REST;
          if (t >= FADE) begin(f, n);
          else if (t > 0) f.g.setAttribute('opacity', (1 - t / FADE).toFixed(2));
        }
        place(f);
      });
    }
  };
}
