/* Fir tree: a Christmas tree growing at one end of the masthead, then trimmed. The trunk rises;
   tiers of branches unfold from it as it passes them, drooping a little, shorter toward the top,
   each with twigs along it. Then the lights go on it one by one, the baubles are hung, and the
   star goes on top. The lights twinkle in a wave climbing the tree: a lit bulb is filled and
   glows, an unlit one is only its outline, so they don't rely on colour. It stands a while,
   fades, and another grows. The trees come from the seed, so ?ambientSeed=<n> replays them. A
   December animation. */

var FOOT = 304;
var TOP = 62;
var MARGIN = 170;
/* Steps the tree takes to grow, to trim, to stand, and to fade. */
export var GROW = 260;
export var TRIM = 120;
var STAND = 600;
var FADE = 30;
var BULBS = 26;
var BAUBLES = 9;
/* The baubles' paints: cadmium red, cadmium yellow, cerulean, quinacridone rose. */
var PAINTS = [1, 3, 6, 9];

/* The tree's segments, each a line from [x0, y0] to [x1, y1] that starts to grow at [start] and
   takes [take] steps, of kind 0 (trunk), 1 (branch) or 2 (twig); and the points along the
   branches where it can be trimmed. */
export function fir(rand) {
  var segs = [], spots = [], tiers = 9 + Math.floor(rand() * 3), wide = 72 + rand() * 18;
  segs.push({ x0: 0, y0: FOOT, x1: 0, y1: TOP, start: 0, take: 110, kind: 0 });
  for (var i = 0; i < tiers; i++) {
    var u = i / (tiers - 1), y = FOOT - 30 - u * (FOOT - 30 - TOP - 16) + (rand() - 0.5) * 6;
    // The trunk passes this height at this step.
    var at = 110 * (FOOT - y) / (FOOT - TOP);
    var length = wide * Math.pow(1 - u, 0.95) + 10;
    [-1, 1].forEach(function (side) {
      var droop = 0.25 + rand() * 0.15, x1 = side * length, y1 = y + length * droop;
      segs.push({ x0: 0, y0: y, x1: x1, y1: y1, start: at, take: 50, kind: 1 });
      for (var k = 1; k <= 3; k++) {
        var f = k / 4, bx = x1 * f, by = y + (y1 - y) * f, twig = length * 0.32 * (1 - f * 0.6);
        // Twigs reach out and down, both sides of the branch.
        segs.push({ x0: bx, y0: by, x1: bx + side * twig * 0.7, y1: by - twig * 0.35, start: at + 50 * f, take: 25, kind: 2 });
        segs.push({ x0: bx, y0: by, x1: bx + side * twig * 0.75, y1: by + twig * 0.65, start: at + 50 * f, take: 25, kind: 2 });
        spots.push([bx + side * twig * 0.5, by + twig * 0.4]);
      }
      spots.push([x1, y1]);
    });
  }
  return { segs: segs, spots: spots };
}

/* A five-pointed star of radius [r] about the origin, as path data. */
export function star(r) {
  var d = '';
  for (var k = 0; k < 10; k++) {
    var a = -Math.PI / 2 + Math.PI * k / 5, l = k % 2 ? r * 0.42 : r;
    d += (k ? 'L' : 'M') + (l * Math.cos(a)).toFixed(1) + ' ' + (l * Math.sin(a)).toFixed(1);
  }
  return d + 'Z';
}

export default function firtree(layer, m) {
  var W = m.width;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  // A small seed's first draw is always about 0.24, so it's thrown away.
  rand();

  var left = rand() < 0.5;
  var g = m.el('g', { 'class': 'masthead-firtree' });
  var parts = [0, 1, 2].map(function (k) { return m.el('path', { 'class': 'masthead-firtree-' + ['trunk', 'branches', 'twigs'][k] }, g); });
  var trim = m.el('g', {}, g);
  var tree;

  function begin(n) {
    while (trim.children.length) trim.removeChild(trim.children[0]);
    var f = fir(rand), spots = f.spots.slice(), items = [];
    // Bulbs and baubles go on spots drawn at random, the star last.
    function take() { return spots.splice(Math.floor(rand() * spots.length), 1)[0]; }
    for (var i = 0; i < BULBS && spots.length; i++) {
      var p = take(), at = m.el('g', { opacity: 0 }, trim);
      items.push({
        el: at, kind: 'bulb', y: p[1],
        glow: m.el('ellipse', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), rx: 7, ry: 7, fill: m.pulse, 'class': 'masthead-firtree-glow' }, at),
        bulb: m.el('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 2.2, 'class': 'masthead-firtree-bulb' }, at)
      });
    }
    for (i = 0; i < BAUBLES && spots.length; i++) {
      p = take();
      var paint = PAINTS[Math.floor(rand() * PAINTS.length)];
      at = m.el('g', { opacity: 0 }, trim);
      m.el('path', { 'class': 'masthead-firtree-hook', d: 'M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + 'v4' }, at);
      m.el('circle', { cx: p[0].toFixed(1), cy: (p[1] + 8.5).toFixed(1), r: 4.5, 'class': 'masthead-firtree-bauble masthead-paint-fill-' + paint }, at);
      items.push({ el: at, kind: 'bauble' });
    }
    // Shuffle the order they go on in, so the tree is trimmed all over at once.
    for (i = items.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = items[i]; items[i] = items[j]; items[j] = t; }
    at = m.el('g', { opacity: 0 }, trim);
    m.el('ellipse', { cx: 0, cy: TOP - 4, rx: 16, ry: 16, fill: m.pulse, 'class': 'masthead-firtree-glow' }, at);
    m.el('path', { 'class': 'masthead-firtree-star', d: star(10), transform: 'translate(0 ' + (TOP - 4) + ')' }, at);
    items.push({ el: at, kind: 'star' });
    tree = { segs: f.segs, items: items, start: n };
    g.setAttribute('opacity', 1);
  }

  function draw(n) {
    var age = n - tree.start, squeeze = 1 / m.stretch();
    g.setAttribute('transform', 'translate(' + (left ? MARGIN : W - MARGIN) + ' 0) scale(' + squeeze.toFixed(4) + ' 1)');
    if (age <= GROW + 1) {
      var d = ['', '', ''];
      tree.segs.forEach(function (s) {
        var u = Math.max(0, Math.min(1, (age - s.start) / s.take));
        if (u <= 0) return;
        d[s.kind] += 'M' + s.x0.toFixed(1) + ' ' + s.y0.toFixed(1) + 'L' + (s.x0 + (s.x1 - s.x0) * u).toFixed(1) + ' ' + (s.y0 + (s.y1 - s.y0) * u).toFixed(1);
      });
      parts.forEach(function (p, k) { p.setAttribute('d', d[k]); });
    }
    var trimmed = Math.floor((age - GROW) / TRIM * tree.items.length);
    tree.items.forEach(function (it, i) {
      if (i >= trimmed) { it.el.setAttribute('opacity', 0); return; }
      it.el.setAttribute('opacity', 1);
      if (it.kind !== 'bulb') return;
      // A wave climbing the tree: a bulb is lit while the wave is near its height.
      var lit = Math.sin(n * 0.09 + it.y * 0.05) > -0.2;
      it.bulb.setAttribute('class', 'masthead-firtree-bulb' + (lit ? ' masthead-firtree-lit' : ''));
      it.glow.setAttribute('opacity', lit ? 0.8 : 0);
    });
  }

  begin(0);
  draw(0);

  return {
    interval: 40,
    step: function (n) {
      var age = n - tree.start, t = age - GROW - TRIM - STAND;
      if (t >= FADE) { begin(n); age = 0; }
      else if (t > 0) g.setAttribute('opacity', (1 - t / FADE).toFixed(2));
      draw(n);
    }
  };
}
