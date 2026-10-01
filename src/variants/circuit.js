/* Circuit: fireflies running the traces of a circuit board, as on bytecode.news. It moves by SVG
   alone; pausing the art pauses it. A click sends a surge from the nearest trace: sparks run
   both ways along it, jump to every trace they cross, and light the board behind them as they
   go, which fades once they've run out. Only the surge takes steps. */
var TRACES = [
  'M60 248H216V172H394V126H598V84H856V126H1108',
  'M128 84H332V152H518V210H698V178H902V214H1090',
  'M184 274H308V226H468V266H682V214H874V250H1038',
  'M92 154H246V110H430V154H650V118H842V152H1044',
  'M758 62V252',
  'M468 126V266',
  'M902 126V250',
  'M246 110V248',
  'M1038 214V250'
];
var NODES = [
  [216, 172], [394, 126], [598, 84], [856, 126], [332, 152], [518, 210],
  [698, 178], [902, 214], [308, 226], [468, 266], [682, 214], [874, 250]
];
/* A firefly per long trace: its glow, its spark, and how long one run takes. Each starts part way
   along (a negative begin), so none waits in the corner for its turn. */
var FIREFLIES = [
  { trace: 0, glow: 8.4, spark: 2.2, begin: 0, dur: 14 },
  { trace: 1, glow: 7.2, spark: 1.9, begin: -2.5, dur: 18 },
  { trace: 2, glow: 6.8, spark: 1.8, begin: -5, dur: 16 },
  { trace: 3, glow: 6.5, spark: 1.7, begin: -7.5, dur: 20 }
];

/* Each trace as its corners, the length run to each, and where other traces cross or meet it:
   how far along this one, which, and how far along that one. */
export var WIRES = TRACES.map(function (d) {
  var points = [], x = 0, y = 0;
  d.replace(/([MHV])(\d+)(?: (\d+))?/g, function (_, cmd, a, b) {
    if (cmd === 'M') { x = +a; y = +b; }
    if (cmd === 'H') x = +a;
    if (cmd === 'V') y = +a;
    points.push([x, y]);
  });
  var at = [0];
  for (var i = 1; i < points.length; i++) at.push(at[i - 1] + Math.abs(points[i][0] - points[i - 1][0]) + Math.abs(points[i][1] - points[i - 1][1]));
  return { points: points, at: at, length: at[at.length - 1], joins: [] };
});

/* The point on [wire] nearest (x, y): how far along it, and how far off. */
export function nearest(wire, x, y) {
  var best = { s: 0, d: Infinity };
  for (var i = 1; i < wire.points.length; i++) {
    var a = wire.points[i - 1], b = wire.points[i], len = wire.at[i] - wire.at[i - 1];
    var t = len === 0 ? 0 : Math.max(0, Math.min(1, ((x - a[0]) * (b[0] - a[0]) + (y - a[1]) * (b[1] - a[1])) / (len * len)));
    var px = a[0] + (b[0] - a[0]) * t, py = a[1] + (b[1] - a[1]) * t, d = Math.hypot(x - px, y - py);
    if (d < best.d) best = { s: wire.at[i - 1] + len * t, d: d };
  }
  return best;
}

/* Where [wire] is, [s] along it. */
export function along(wire, s) {
  for (var i = 1; i < wire.points.length; i++) {
    if (s <= wire.at[i] || i === wire.points.length - 1) {
      var a = wire.points[i - 1], b = wire.points[i], len = wire.at[i] - wire.at[i - 1];
      var t = len === 0 ? 0 : Math.max(0, Math.min(1, (s - wire.at[i - 1]) / len));
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
  }
}

/* The stretch of [wire] between [from] and [to] along it, as path data. */
function stretch(wire, from, to) {
  var lo = Math.min(from, to), hi = Math.max(from, to), start = along(wire, lo), d = 'M' + start[0].toFixed(1) + ' ' + start[1].toFixed(1);
  for (var i = 1; i < wire.points.length; i++) {
    if (wire.at[i] > lo && wire.at[i] < hi) d += 'L' + wire.points[i][0] + ' ' + wire.points[i][1];
  }
  var end = along(wire, hi);
  return d + 'L' + end[0].toFixed(1) + ' ' + end[1].toFixed(1);
}

/* Where a level piece of one trace and an upright piece of another cross or meet, if they do. */
function cross(a, b, c, d) {
  if (a[1] !== b[1] || c[0] !== d[0]) return null;
  var x = c[0], y = a[1];
  var inA = x >= Math.min(a[0], b[0]) && x <= Math.max(a[0], b[0]);
  var inC = y >= Math.min(c[1], d[1]) && y <= Math.max(c[1], d[1]);
  return inA && inC ? [x, y] : null;
}

WIRES.forEach(function (wire, w) {
  WIRES.forEach(function (other, o) {
    if (o === w) return;
    for (var i = 1; i < wire.points.length; i++) {
      for (var k = 1; k < other.points.length; k++) {
        var a = wire.points[i - 1], b = wire.points[i], c = other.points[k - 1], d = other.points[k];
        var p = cross(a, b, c, d) || cross(c, d, a, b);
        if (!p) continue;
        var s = nearest(wire, p[0], p[1]).s;
        if (wire.joins.some(function (j) { return j.wire === o && Math.abs(j.s - s) < 1; })) continue;
        wire.joins.push({ s: s, wire: o, to: nearest(other, p[0], p[1]).s });
      }
    }
  });
});

var SURGE_SPEED = 16, SURGE_FADE = 30;

export default function circuit(layer, m) {
  // The traces fade out toward both ends.
  var defs = m.el('defs');
  var fade = m.el('linearGradient', { id: 'masthead-fade', x1: '0%', y1: '0%', x2: '100%', y2: '0%' }, defs);
  [[0, 0], [18, 0.65], [82, 0.65], [100, 0]].forEach(function (stop) {
    m.el('stop', { offset: stop[0] + '%', 'stop-color': 'currentColor', 'stop-opacity': stop[1] }, fade);
  });

  var traces = m.el('g', { 'class': 'masthead-circuit-traces' });
  TRACES.forEach(function (d) { m.el('path', { d: d }, traces); });
  var nodes = m.el('g', { 'class': 'masthead-circuit-nodes' });
  NODES.forEach(function (n) { m.el('circle', { cx: n[0], cy: n[1], r: 3.2 }, nodes); });
  var fireflies = m.el('g', { 'class': 'masthead-circuit-fireflies' });
  FIREFLIES.forEach(function (f) {
    var g = m.el('g', {}, fireflies);
    m.el('circle', { r: f.glow, fill: m.pulse }, g);
    m.el('circle', { r: f.spark, 'class': 'masthead-spark' }, g);
    m.el('animateMotion', {
      begin: f.begin + 's',
      dur: f.dur + 's',
      repeatCount: 'indefinite',
      path: TRACES[f.trace]
    }, g);
  });

  var surgeLayer = m.el('g', { 'class': 'masthead-circuit-surge' });
  var sparks = [];

  /* A spark from [s] on wire [w], running toward [dir], its lit trail behind it; [seen] is the
     traces its surge has reached. */
  function spark(w, s, dir, seen) {
    var g = m.el('g', {}, surgeLayer);
    sparks.push({
      w: w, from: s, s: s, dir: dir, done: 0, seen: seen,
      trail: m.el('path', { 'class': 'masthead-circuit-lit' }, g),
      head: m.el('circle', { r: 6, fill: m.pulse }, g),
      g: g
    });
  }

  /* A spark run on: past any join to a trace the surge hasn't reached, it sends sparks both
     ways along that one too. At the end of its trace it stops, and its trail fades. */
  function run(p) {
    var wire = WIRES[p.w];
    if (p.done) {
      p.done += 1;
      p.g.setAttribute('opacity', Math.max(0, 1 - p.done / SURGE_FADE).toFixed(2));
      return p.done < SURGE_FADE;
    }
    var next = Math.max(0, Math.min(wire.length, p.s + p.dir * SURGE_SPEED));
    wire.joins.forEach(function (j) {
      if (p.seen[j.wire] || (j.s - p.s) * p.dir < 0 || (j.s - next) * p.dir > 0) return;
      p.seen[j.wire] = true;
      spark(j.wire, j.to, 1, p.seen);
      spark(j.wire, j.to, -1, p.seen);
    });
    p.s = next;
    var at = along(wire, p.s);
    p.head.setAttribute('cx', at[0].toFixed(1));
    p.head.setAttribute('cy', at[1].toFixed(1));
    p.trail.setAttribute('d', stretch(wire, p.from, p.s));
    if (p.s === 0 || p.s === wire.length) { p.done = 1; p.head.setAttribute('r', 0); }
    return true;
  }

  return {
    poke: function (x, y) {
      var best = null;
      WIRES.forEach(function (wire, w) {
        var here = nearest(wire, x, y);
        if (!best || here.d < best.d) best = { w: w, s: here.s, d: here.d };
      });
      var seen = {};
      seen[best.w] = true;
      spark(best.w, best.s, 1, seen);
      spark(best.w, best.s, -1, seen);
    },
    step: function () {
      if (!sparks.length) return;
      var running = sparks;
      sparks = [];
      var kept = running.filter(function (p) {
        if (run(p)) return true;
        surgeLayer.removeChild(p.g);
        return false;
      });
      sparks = kept.concat(sparks);
    }
  };
}
