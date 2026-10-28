/* Manger: the stable at Bethlehem at one end of the masthead, in outline and at rest: the thatched
   roof on its posts, the child in the manger, Mary kneeling, Joseph with his staff, an ox and a
   donkey lying in the straw. Above it the star, its light slowly breathing, a long ray reaching
   down to the stable; a few far stars twinkle. Nothing else moves. The star's light and the far
   stars come from the seed, so ?ambientSeed=<n> replays them. A Christmas animation. */

var GROUND = 304;
var MARGIN = 200;
/* The star, above and a little to one side of the stable's middle. */
export var STAR = { x: 14, y: 50 };
var FAR_STARS = 9;
var RAYS = 12;

/* The stable and everyone in it, as path data about the middle of its floor: [roof], [frame],
   and the figures in [people] and [beasts]. */
export var SCENE = {
  frame: 'M-150 304H150' +
    'M-98 304V207M98 304V207',
  roof: 'M-122 210L0 158L122 210M-114 216L0 166L114 216' +
    'M-104 206l-3 9M-84 197l-3 9M-64 189l-3 9M-44 180l-3 9M-24 172l-3 9' +
    'M24 172l3 9M44 180l3 9M64 189l3 9M84 197l3 9M104 206l3 9',
  manger: 'M-26 270L-20 287H20L26 270Z' +
    'M-18 287L-10 304M-10 287L-18 304M18 287L10 304M10 287L18 304' +
    'M-24 270l-5 -6M-16 270l-2 -7M17 270l3 -7M24 270l5 -5',
  child: 'M-8 266A10 4.5 0 1 0 12 266A10 4.5 0 1 0 -8 266Z' +
    'M-8 263.5A3.8 3.8 0 1 0 -15.6 263.5A3.8 3.8 0 1 0 -8 263.5Z',
  mary: 'M-55 236A6.5 6.5 0 1 0 -42 236A6.5 6.5 0 1 0 -55 236Z' +
    'M-56 234C-62 248 -66 276 -74 304H-32C-34 290 -36 274 -40 262' +
    'M-56 234C-54 228 -46 226 -42 232C-40 238 -40 250 -40 262' +
    'M-40 258L-28 262',
  joseph: 'M48 221A7 7 0 1 0 62 221A7 7 0 1 0 48 221Z' +
    'M49 228C46 250 44 280 42 304H70C68 280 66 250 61 228' +
    'M49 226C52 233 58 233 61 226' +
    'M78 304L74 210C74 204 82 204 82 210' +
    'M66 250L76 246',
  ox: 'M70 292C70 282 102 280 112 286C116 290 114 300 108 302H74C70 300 70 296 70 292Z' +
    'M112 286C116 280 124 280 126 286C127 292 120 294 116 292' +
    'M118 281L114 274M124 281L128 274',
  donkey: 'M-72 292C-72 283 -100 281 -108 287C-112 292 -110 300 -104 302H-76C-72 300 -72 296 -72 292Z' +
    'M-108 287C-114 278 -124 280 -125 288C-124 293 -116 293 -112 291' +
    'M-117 279L-121 264L-114 277M-121 280L-128 266L-122 279'
};

/* The star: four long points and four short, as path data about its middle. */
export function star(long, short) {
  var d = '';
  for (var k = 0; k < 16; k++) {
    var a = -Math.PI / 2 + Math.PI * k / 8, l = k % 4 === 0 ? long : k % 2 === 0 ? short : long * 0.16;
    d += (k ? 'L' : 'M') + (l * Math.cos(a)).toFixed(1) + ' ' + (l * Math.sin(a)).toFixed(1);
  }
  return d + 'Z';
}

export default function manger(layer, m) {
  var W = m.width;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  // A small seed's first draw is always about 0.24, so it's thrown away.
  rand();

  var left = rand() < 0.5;
  var g = m.el('g', { 'class': 'masthead-manger' });
  var far = [];
  for (var k = 0; k < FAR_STARS; k++) {
    far.push({ el: m.el('path', { 'class': 'masthead-manger-far' }, g), x: (rand() - 0.5) * 300, y: 14 + rand() * 120, phase: rand() * 6.3, size: 1.2 + rand() * 1.4 });
  }
  var light = m.el('g', { 'class': 'masthead-manger-light' }, g);
  var glow = m.el('ellipse', { cx: STAR.x, cy: STAR.y, rx: 34, ry: 34, fill: m.pulse, 'class': 'masthead-manger-glow' }, light);
  var rays = m.el('path', { 'class': 'masthead-manger-rays' }, light);
  // The long ray down to the stable, from under the star to just above the roof's peak.
  m.el('path', { 'class': 'masthead-manger-beam', d: 'M' + STAR.x + ' ' + (STAR.y + 26) + 'L0 150' }, light);
  m.el('path', { 'class': 'masthead-manger-star', d: star(22, 10), transform: 'translate(' + STAR.x + ' ' + STAR.y + ')' }, g);
  ['roof', 'frame', 'manger', 'child', 'mary', 'joseph', 'ox', 'donkey'].forEach(function (part) {
    m.el('path', { 'class': 'masthead-manger-' + part, d: SCENE[part] }, g);
  });
  var turn = rand() * 6.3;

  function draw(n) {
    var squeeze = 1 / m.stretch();
    g.setAttribute('transform', 'translate(' + (left ? MARGIN : W - MARGIN) + ' 0) scale(' + squeeze.toFixed(4) + ' 1)');
    // The light breathes, slowly; the rays lengthen and shorten in turn round the star.
    var breath = 0.5 + 0.5 * Math.sin(n * 0.03 + turn);
    glow.setAttribute('opacity', (0.45 + 0.35 * breath).toFixed(2));
    var d = '';
    for (var k = 0; k < RAYS; k++) {
      var a = Math.PI * 2 * (k + 0.5) / RAYS, l = 30 + 10 * Math.sin(n * 0.04 + k * 1.7 + turn);
      d += 'M' + (STAR.x + 14 * Math.cos(a)).toFixed(1) + ' ' + (STAR.y + 14 * Math.sin(a)).toFixed(1) + 'L' + (STAR.x + l * Math.cos(a)).toFixed(1) + ' ' + (STAR.y + l * Math.sin(a)).toFixed(1);
    }
    rays.setAttribute('d', d);
    far.forEach(function (s) {
      var r = s.size * (0.5 + 0.5 * Math.sin(n * 0.05 + s.phase));
      s.el.setAttribute('d', 'M' + (s.x - r).toFixed(1) + ' ' + s.y.toFixed(1) + 'h' + (2 * r).toFixed(2) + 'M' + s.x.toFixed(1) + ' ' + (s.y - r).toFixed(1) + 'v' + (2 * r).toFixed(2));
    });
  }
  draw(0);

  return {
    interval: 50,
    step: function (n) { draw(n); }
  };
}
