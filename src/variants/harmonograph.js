/* Harmonograph: the curve a pen draws on a table swung by damped pendulums, one either side of the
   name. Each figure draws itself as one slow line, spiralling inward as the pendulums die down,
   holds a moment, fades, and a new set of pendulums starts; the two sides take turns. The
   pendulums' frequencies sit near small whole ratios, a little detuned so the figure precesses.
   They come from the seed, so ?ambientSeed=<n> replays a run. A click on a side gives that
   pendulum a small push, changing the figure from there on, or starts a new one if it's resting.

   Kept cheap: a figure is a handful of paths, and only the newest is added to, a few points a
   step. */

export var POINTS = 3200; // points in one drawing
export var PER_STEP = 4; // points drawn each step
export var CHUNK = 320; // points per path
export var SPAN = 84; // pendulum time over one drawing
export var HOLD = 110; // steps a finished figure holds
export var FADE = 70; // steps it takes to fade
export var REST = 30; // steps empty before the next
export var RADIUS = 118;
var MARGIN = 34;

// Frequency pairs near small whole ratios: x's pendulum and y's.
var RATIOS = [[1, 2], [2, 1], [2, 3], [3, 2], [3, 4], [4, 3], [1, 3], [3, 1]];

/* A set of pendulums from [rand]: two swinging x, two swinging y, all damped. */
export function pendulums(rand) {
  var pair = RATIOS[Math.floor(rand() * RATIOS.length)];
  var scale = 2.2 / Math.max(pair[0], pair[1]);
  function detune() { return 1 + (rand() - 0.5) * 0.024; }
  function swing(f) {
    return { a: 0.3 + rand() * 0.7, f: f * scale * detune(), p: rand() * Math.PI * 2, d: 0.012 + rand() * 0.009, t0: 0 };
  }
  var x = [swing(pair[0]), swing(pair[1])], y = [swing(pair[1]), swing(pair[0])];
  [x, y].forEach(function (axis) {
    var sum = axis[0].a + axis[1].a;
    axis.forEach(function (s) { s.a /= sum; });
  });
  return { x: x, y: y };
}

/* Where the pen is at pendulum time [t], from -1 to 1 on each axis. */
export function pen(set, t) {
  function sum(axis) {
    var v = 0;
    for (var i = 0; i < axis.length; i++) {
      var s = axis[i], u = t - s.t0;
      if (u >= 0) v += s.a * Math.sin(s.f * u + s.p) * Math.exp(-s.d * u);
    }
    return v;
  }
  return { x: sum(set.x), y: sum(set.y) };
}

export default function harmonograph(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  function side(which, delay) {
    var g = m.el('g', { 'class': 'masthead-harmonograph-figure' });
    var lines = m.el('g', { 'class': 'masthead-harmonograph-line' }, g);
    var glow = m.el('circle', { r: 6, fill: m.pulse, opacity: 0, 'class': 'masthead-harmonograph-glow' }, g);
    var tip = m.el('circle', { r: 1.4, opacity: 0, 'class': 'masthead-spark masthead-harmonograph-tip' }, g);
    return { which: which, g: g, lines: lines, glow: glow, tip: tip, wait: delay, phase: 'rest', set: null };
  }
  var sides = [side(-1, 0), side(1, (POINTS / PER_STEP + HOLD + FADE + REST) / 2)];

  function begin(s) {
    while (s.lines.firstChild) s.lines.removeChild(s.lines.firstChild);
    s.set = pendulums(rand);
    s.drawn = 0;
    s.path = null;
    s.d = '';
    s.count = 0;
    s.age = 0;
    s.phase = 'draw';
    s.g.setAttribute('opacity', 1);
  }

  // Where a figure sits: hugging its edge, its width kept to its height however the art is stretched.
  function centre(s, stretch) {
    var off = MARGIN + RADIUS / stretch;
    return s.which < 0 ? off : W - off;
  }

  function draw(s, stretch) {
    var cx = centre(s, stretch);
    s.lines.setAttribute('transform', 'translate(' + cx.toFixed(1) + ' ' + H / 2 + ') scale(' + (1 / stretch).toFixed(4) + ' 1)');
    for (var k = 0; k < PER_STEP && s.drawn <= POINTS; k++) {
      var p = pen(s.set, (s.drawn / POINTS) * SPAN);
      var xy = (p.x * RADIUS).toFixed(1) + ' ' + (p.y * RADIUS).toFixed(1);
      if (!s.path || s.count >= CHUNK) {
        // A new path, starting where the last ended, so the line stays one line.
        s.d = s.path ? 'M' + s.last + 'L' + xy : 'M' + xy;
        s.path = m.el('path', {}, s.lines);
        s.count = 0;
      } else s.d += 'L' + xy;
      s.count++;
      s.last = xy;
      s.at = p;
      s.drawn++;
    }
    s.path.setAttribute('d', s.d);
    var tx = (cx + (s.at.x * RADIUS) / stretch).toFixed(1), ty = (H / 2 + s.at.y * RADIUS).toFixed(1);
    var shown = s.drawn <= POINTS ? 1 : 0;
    [s.glow, s.tip].forEach(function (c) {
      c.setAttribute('cx', tx);
      c.setAttribute('cy', ty);
      c.setAttribute('opacity', shown);
    });
  }

  function step(s) {
    var stretch = m.stretch();
    if (s.phase === 'rest') {
      if (s.wait-- <= 0) begin(s); else return;
    }
    if (s.phase === 'draw') {
      draw(s, stretch);
      if (s.drawn > POINTS) s.phase = 'hold';
      return;
    }
    s.lines.setAttribute('transform', 'translate(' + centre(s, stretch).toFixed(1) + ' ' + H / 2 + ') scale(' + (1 / stretch).toFixed(4) + ' 1)');
    s.age++;
    if (s.age > HOLD) s.g.setAttribute('opacity', Math.max(0, 1 - (s.age - HOLD) / FADE).toFixed(3));
    if (s.age >= HOLD + FADE) {
      while (s.lines.firstChild) s.lines.removeChild(s.lines.firstChild);
      s.phase = 'rest';
      s.wait = REST;
    }
  }

  /* A push on the pendulums: a new swing on each axis starting now from rest, so the line goes on
     unbroken and bends away from where it was going. */
  function push(s) {
    var t = (s.drawn / POINTS) * SPAN, a = 0.18 + rand() * 0.12;
    ['x', 'y'].forEach(function (axis, i) {
      var base = s.set[axis][i];
      // As big as the swing has died down to, so a push late on is still a small one.
      s.set[axis].push({ a: a * Math.exp(-base.d * t) * (rand() < 0.5 ? -1 : 1), f: base.f, p: 0, d: base.d * 0.8, t0: t });
    });
  }

  return {
    interval: 40,
    poke: function (x) {
      var s = sides[x < W / 2 ? 0 : 1];
      if (s.phase === 'draw' && s.set.x.length < 8) push(s);
      else if (s.phase !== 'draw') { begin(s); draw(s, m.stretch()); }
    },
    step: function () {
      step(sides[0]);
      step(sides[1]);
    }
  };
}
