/* Truchet: a grid of quarter-circle tiles, each two arcs joining the midpoints of its edges, that
   together wind continuous paths across the masthead. Every second or so one tile turns a quarter,
   easing round, and rewires the paths through it. Tiles behind the name are faint, those low down
   brighter and turned more often; now and then a soft glow runs along one connected path. The
   turns come from the seed, so ?ambientSeed=<n> replays them. A click turns the tile under it,
   and the turn ripples out to its neighbours. */
export var ROWS = 6, TURN_STEPS = 16, TRACE_STEPS = 125, TRACE_TILES = 16;

/* Which edges a tile joins, by orientation (its quarter turns, mod 2): edges are 0 top, 1 right,
   2 bottom, 3 left. Orientation 0 joins top to left and bottom to right; a quarter turn clockwise
   gives orientation 1, top to right and bottom to left. */
export var JOINS = [[3, 2, 1, 0], [1, 0, 3, 2]];
var STEP = [[0, -1], [1, 0], [0, 1], [-1, 0]];

/* The columns that keep tiles about square on screen at [stretch], with ROWS rows in [w] x [h]. */
export function columns(w, h, stretch) {
  return Math.max(4, Math.round(w * (stretch || 1) / (h / ROWS)));
}

/* The run of tiles a path takes from tile (c, r), entering by edge [side], through [turns] (each
   tile's quarter turns, row by row): [{ c, r, from, to }], until it leaves the grid, closes on
   itself or reaches [max] tiles. */
export function follow(turns, cols, rows, c, r, side, max) {
  var out = [], seen = {};
  while (out.length < max && c >= 0 && r >= 0 && c < cols && r < rows) {
    var key = (r * cols + c) * 4 + side;
    if (seen[key]) break;
    seen[key] = true;
    var to = JOINS[turns[r * cols + c] & 1][side];
    out.push({ c: c, r: r, from: side, to: to });
    c += STEP[to][0];
    r += STEP[to][1];
    side = (to + 2) % 4;
  }
  return out;
}

/* How strongly a tile in row [r] shows: faint in the band behind the name, brightest low. */
export function strength(r, rows) {
  var f = (r + 0.5) / rows, band = Math.exp(-Math.pow((f - 0.45) / 0.2, 2));
  return (0.85 - 0.58 * band) * (0.8 + 0.2 * f);
}

function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

// The two arcs of a tile in its own square, -1 to 1 each way, at orientation 0.
var ARCS = 'M0 -1A1 1 0 0 1 -1 0M0 1A1 1 0 0 1 1 0';

export default function truchet(layer, m) {
  var W = m.width, H = m.height, seed = m.seed() >>> 0;
  var rs = seed || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  function unit(index) {
    var v = (seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
    v = Math.imul(v ^ (v >>> 16), 0x21f0aaad);
    v = Math.imul(v ^ (v >>> 15), 0x735a2d97);
    return ((v ^ (v >>> 15)) >>> 0) / 0x100000000;
  }

  var cols, tw, th, turns, tiles, turning, queue, glow, line, trace;
  var nextTurn = 0, nextTrace = 120 + Math.floor(rand() * 120);

  function place(i, angle) {
    var c = i % cols, r = Math.floor(i / cols);
    tiles[i].setAttribute('transform', 'translate(' + ((c + 0.5) * tw).toFixed(1) + ' ' + ((r + 0.5) * th).toFixed(1)
      + ') scale(' + (tw / 2).toFixed(2) + ' ' + (th / 2).toFixed(2) + ') rotate(' + angle.toFixed(1) + ')');
  }

  /* The grid, for the masthead's shape now; built again if that changes much. */
  function build() {
    while (layer.firstChild) layer.removeChild(layer.firstChild);
    cols = columns(W, H, m.stretch());
    tw = W / cols;
    th = H / ROWS;
    turns = [];
    tiles = [];
    turning = [];
    queue = [];
    trace = null;
    for (var r = 0; r < ROWS; r++) {
      var g = m.el('g', { 'class': 'masthead-truchet-row', opacity: strength(r, ROWS).toFixed(2) });
      for (var c = 0; c < cols; c++) {
        var i = r * cols + c;
        turns.push(Math.floor(unit(i) * 4));
        tiles.push(m.el('path', { 'class': 'masthead-truchet-tile', d: ARCS }, g));
        place(i, turns[i] * 90);
      }
    }
    glow = m.el('path', { 'class': 'masthead-truchet-glow', pathLength: 1, opacity: 0 });
    line = m.el('path', { 'class': 'masthead-truchet-lit', pathLength: 1, opacity: 0 });
  }
  build();

  function busy(i) {
    for (var k = 0; k < turning.length; k++) if (turning[k].i === i) return true;
    return false;
  }

  function turn(i, n) {
    if (busy(i)) return;
    if (trace && trace.tiles[i]) endTrace();
    turning.push({ i: i, from: turns[i], start: n });
    turns[i] = (turns[i] + 1) % 4;
    tiles[i].setAttribute('class', 'masthead-truchet-tile masthead-truchet-turning');
  }

  /* A tile picked at random, more often low down, never one already turning. */
  function pickTile() {
    for (var tries = 0; tries < 20; tries++) {
      var i = Math.floor(rand() * cols * ROWS), r = Math.floor(i / cols);
      if (rand() < 0.3 + 0.7 * r / (ROWS - 1) && !busy(i)) return i;
    }
    return -1;
  }

  function endTrace() {
    trace = null;
    glow.setAttribute('opacity', 0);
    line.setAttribute('opacity', 0);
  }

  /* A glow along a path from a low tile, if it runs long enough to be worth it. */
  function startTrace(n) {
    for (var tries = 0; tries < 6; tries++) {
      var c = Math.floor(rand() * cols), r = ROWS - 1 - Math.floor(rand() * 2), side = Math.floor(rand() * 4);
      var run = follow(turns, cols, ROWS, c, r, side, TRACE_TILES);
      var clear = run.every(function (t) { return !busy(t.r * cols + t.c); });
      if (run.length < 5 || !clear) continue;
      var mid = [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]], d = [], set = {};
      run.forEach(function (t, k) {
        var a = mid[t.from], b = mid[t.to];
        var cx = (a[0] === 0.5 ? b[0] : a[0]), cy = (a[1] === 0.5 ? b[1] : a[1]);
        var sweep = (a[0] - cx) * (b[1] - cy) - (a[1] - cy) * (b[0] - cx) > 0 ? 1 : 0;
        if (k === 0) d.push('M' + ((t.c + a[0]) * tw).toFixed(1) + ' ' + ((t.r + a[1]) * th).toFixed(1));
        d.push('A' + (tw / 2).toFixed(1) + ' ' + (th / 2).toFixed(1) + ' 0 0 ' + sweep + ' '
          + ((t.c + b[0]) * tw).toFixed(1) + ' ' + ((t.r + b[1]) * th).toFixed(1));
        set[t.r * cols + t.c] = true;
      });
      glow.setAttribute('d', d.join(''));
      line.setAttribute('d', d.join(''));
      trace = { start: n, tiles: set, lit: Math.min(0.5, 2.4 / run.length) };
      return;
    }
  }

  function drawTrace(n) {
    var t = (n - trace.start) / TRACE_STEPS;
    if (t >= 1) { endTrace(); return; }
    var lit = trace.lit, head = -t * (1 + lit) + lit;
    var fade = Math.min(1, t * 6, (1 - t) * 6);
    [glow, line].forEach(function (e) {
      e.setAttribute('stroke-dasharray', lit.toFixed(3) + ' 3');
      e.setAttribute('stroke-dashoffset', head.toFixed(3));
      e.setAttribute('opacity', fade.toFixed(2));
    });
  }

  return {
    interval: 40,
    poke: function (x, y, n) {
      var c = Math.min(cols - 1, Math.max(0, Math.floor(x / tw))), r = Math.min(ROWS - 1, Math.max(0, Math.floor(y / th)));
      turn(r * cols + c, n);
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          var cc = c + dc, rr = r + dr;
          if ((dr || dc) && cc >= 0 && rr >= 0 && cc < cols && rr < ROWS) {
            queue.push({ i: rr * cols + cc, at: n + (dr && dc ? 12 : 6) });
          }
        }
      }
    },
    step: function (n) {
      if (n % 25 === 0 && !turning.length && !queue.length && columns(W, H, m.stretch()) !== cols) build();
      queue = queue.filter(function (q) {
        if (q.at > n) return true;
        turn(q.i, n);
        return false;
      });
      if (n >= nextTurn) {
        var i = pickTile();
        if (i >= 0) turn(i, n);
        nextTurn = n + 22 + Math.floor(rand() * 14);
      }
      turning = turning.filter(function (t) {
        var p = Math.min(1, (n - t.start) / TURN_STEPS);
        place(t.i, (t.from + ease(p)) * 90);
        if (p < 1) return true;
        place(t.i, turns[t.i] * 90);
        tiles[t.i].setAttribute('class', 'masthead-truchet-tile');
        return false;
      });
      if (!trace && n >= nextTrace) {
        startTrace(n);
        nextTrace = n + 220 + Math.floor(rand() * 160);
      }
      if (trace) drawTrace(n);
    }
  };
}
