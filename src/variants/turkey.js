/* Turkey: the hand turkey, as children draw it. A pencil traces round a hand at one end of the
   masthead, the thumb for the head and the fingers for the tail; then it adds an eye, a beak, a
   wattle, marks on the feathers, a wing and legs. Its lines wobble a little, as a child's do. The
   drawing rests, fades, and another is drawn, the fingers spread a little differently. The hands
   and wobbles come from the seed, so ?ambientSeed=<n> replays them. A Thanksgiving animation. */

/* Pixels the pencil draws a step; steps the finished drawing rests, then fades. */
export var PENCIL = 4;
var REST = 140;
var FADE = 25;
var MARGIN = 175;
/* The thumb, the head, points up and out at this angle (radians from straight up). */
var THUMB = -0.92;

/* Points along a finger (or the thumb) from base point [b], at [angle] (radians from straight up,
   clockwise), [width] wide and [length] long: up its left side, round its tip, down its right. */
export function digit(b, angle, width, length) {
  var u = [Math.sin(angle), -Math.cos(angle)], v = [Math.cos(angle), Math.sin(angle)], h = width / 2, out = [];
  out.push([b[0] - v[0] * h, b[1] - v[1] * h]);
  for (var k = 0; k <= 8; k++) {
    var a = Math.PI * k / 8, c = Math.cos(a), s = Math.sin(a);
    // Round the tip, from the left side through the end to the right side.
    out.push([b[0] + u[0] * length - v[0] * h * c + u[0] * h * s, b[1] + u[1] * length - v[1] * h * c + u[1] * h * s]);
  }
  out.push([b[0] + v[0] * h, b[1] + v[1] * h]);
  return out;
}

/* The strokes of one drawing, in the order the pencil draws them, each a list of points: the
   hand's outline first. [spread] fans the fingers; [rand] wobbles every point a little. */
export function strokes(spread, rand) {
  var fingers = [[-27, -26, -0.42, 60], [-9, -30, -0.14, 70], [9, -30, 0.14, 66], [26, -26, 0.42, 52]];
  var outline = [[-30, 45], [-34, 20]].concat(digit([-34, 4], THUMB, 20, 46));
  var tips = [];
  fingers.forEach(function (f) {
    var a = f[2] * spread, pts = digit([f[0], f[1]], a, 16, f[3]);
    tips.push([f[0], f[1], a, f[3]]);
    outline = outline.concat(pts);
  });
  outline.push([36, -6], [32, 45]);
  // The head is the thumb: its tip is out at the upper left.
  var head = [-34 + Math.sin(THUMB) * 40, 4 - Math.cos(THUMB) * 40];
  var eye = [];
  for (var k = 0; k <= 10; k++) eye.push([head[0] + 3 + 2.4 * Math.cos(k * Math.PI / 5), head[1] + 1 + 2.4 * Math.sin(k * Math.PI / 5)]);
  var beak = [[head[0] - 8, head[1] - 6], [head[0] - 19, head[1] - 4], [head[0] - 8, head[1] + 1]];
  var wattle = [[head[0] - 9, head[1] + 1], [head[0] - 12, head[1] + 7], [head[0] - 8, head[1] + 12], [head[0] - 11, head[1] + 17]];
  var all = [outline, eye, beak, wattle];
  // A mark up each feather, and a chevron near its tip.
  tips.forEach(function (t) {
    var u = [Math.sin(t[2]), -Math.cos(t[2])], v = [Math.cos(t[2]), Math.sin(t[2])], c = [t[0] + u[0] * (t[3] - 14), t[1] + u[1] * (t[3] - 14)];
    all.push([[t[0] + u[0] * 6, t[1] + u[1] * 6], [t[0] + u[0] * (t[3] - 4), t[1] + u[1] * (t[3] - 4)]]);
    all.push([[c[0] - v[0] * 5 - u[0] * 4, c[1] - v[1] * 5 - u[1] * 4], c, [c[0] + v[0] * 5 - u[0] * 4, c[1] + v[1] * 5 - u[1] * 4]]);
  });
  // The wing: a teardrop on the body, its point swept back and down.
  var wing = [];
  for (k = 0; k <= 16; k++) {
    var a = Math.PI * 2 * k / 16, r = 1 - 0.35 * Math.max(0, Math.cos(a));
    wing.push([2 + 15 * Math.cos(a) * r * 1.3, 12 + 8 * Math.sin(a) + 5 * Math.max(0, Math.cos(a))]);
  }
  all.push(wing);
  [-12, 12].forEach(function (x) {
    all.push([[x, 45], [x - 2, 72]]);
    all.push([[x - 11, 80], [x - 2, 72], [x - 2, 82]]);
    all.push([[x - 2, 72], [x + 8, 79]]);
  });
  return all.map(function (s) {
    return s.map(function (p) { return [p[0] + (rand() - 0.5) * 2.2, p[1] + (rand() - 0.5) * 2.2]; });
  });
}

function length(pts) {
  var l = 0;
  for (var i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}

/* The first [ink] pixels of [pts], as path data, and where the pencil is. */
export function partial(pts, ink) {
  var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1), at = pts[0];
  for (var i = 1; i < pts.length && ink > 0; i++) {
    var seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]), u = Math.min(1, ink / (seg || 1));
    at = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u];
    d += 'L' + at[0].toFixed(1) + ' ' + at[1].toFixed(1);
    ink -= seg;
  }
  return { d: d, at: at };
}

export default function turkey(layer, m) {
  var W = m.width;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  // A small seed's first draw is always about 0.24, so it's thrown away.
  rand();

  // At the left end the head looks left; at the right end the drawing is turned to look right.
  var left = rand() < 0.5;
  var g = m.el('g', { 'class': 'masthead-turkey' });
  var art = m.el('g', {}, g);
  var pencil = m.el('path', { 'class': 'masthead-turkey-pencil', d: 'M0 0L4 -9L8 -7ZM4 -9L22 -48L30 -44L8 -7M22 -48L25 -55L33 -51L30 -44' }, g);
  var drawing;

  function begin() {
    while (art.children.length) art.removeChild(art.children[0]);
    var all = strokes(0.85 + rand() * 0.4, rand);
    drawing = { all: all, lengths: all.map(length), paths: all.map(function () { return m.el('path', { 'class': 'masthead-turkey-line', d: '' }, art); }), ink: 0, done: -1 };
    drawing.total = drawing.lengths.reduce(function (a, b) { return a + b; }, 0);
    g.setAttribute('opacity', 1);
  }

  function draw() {
    var squeeze = 1 / m.stretch(), flip = left ? 1 : -1;
    g.setAttribute('transform', 'translate(' + (left ? MARGIN : W - MARGIN) + ' 190) scale(' + (squeeze * flip).toFixed(4) + ' 1)');
    var ink = drawing.ink, at = null;
    drawing.all.forEach(function (pts, i) {
      if (ink <= 0) return;
      var p = partial(pts, ink);
      drawing.paths[i].setAttribute('d', p.d);
      if (ink < drawing.lengths[i]) at = p.at;
      ink -= drawing.lengths[i];
    });
    // Done, the pencil lifts away to the side.
    var lift = drawing.done < 0 ? 0 : 1;
    at = at || [70, 40];
    pencil.setAttribute('transform', 'translate(' + at[0].toFixed(1) + ' ' + (at[1] - lift * 6).toFixed(1) + ')');
    pencil.setAttribute('opacity', lift ? 0.4 : 1);
  }

  begin();
  draw();

  return {
    interval: 40,
    step: function (n) {
      if (drawing.ink < drawing.total) {
        drawing.ink += PENCIL;
      } else {
        if (drawing.done < 0) drawing.done = n;
        var t = n - drawing.done - REST;
        if (t >= FADE) begin();
        else if (t > 0) g.setAttribute('opacity', (1 - t / FADE).toFixed(2));
      }
      draw();
    }
  };
}
