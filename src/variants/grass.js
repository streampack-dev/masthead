/* Grass: a field of grass along the foot of the masthead, the wind moving through it. Slow swells
   lean the blades one way and let them back, and now and then a gust runs across the field,
   bending each blade as it passes. Nearer blades are taller and stronger; a few carry seed
   heads. The field and its gusts come from the seed, so ?ambientSeed=<n> replays them. */
export var BLADES = 360;
var GUST_SPEED = 7, GUST_WIDTH = 160;

/* How far the wind leans a blade at [x] at step [n]: a slow swell, and any gusts passing. */
export function wind(x, n, gusts) {
  var lean = 0.09 + 0.07 * Math.sin(x * 0.004 - n * 0.02) + 0.035 * Math.sin(x * 0.013 - n * 0.047);
  gusts.forEach(function (g) {
    var d = (x - g.x) / GUST_WIDTH;
    lean += g.strength * Math.exp(-d * d);
  });
  return lean;
}

export default function grass(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  // Three depths of blade: far ones short and faint, near ones tall and strong.
  var depths = [0, 1, 2].map(function (k) {
    return { path: m.el('path', { 'class': 'masthead-grass-blades masthead-grass-depth-' + k }), blades: [] };
  });
  var heads = m.el('path', { 'class': 'masthead-grass-heads' });
  for (var b = 0; b < BLADES; b++) {
    var depth = Math.floor(rand() * 3);
    depths[depth].blades.push({
      x: rand() * W, base: H + 2 - depth * 4,
      height: (26 + rand() * 30) * (0.6 + depth * 0.3),
      stiffness: 0.7 + rand() * 0.6, phase: rand() * 6.3,
      head: depth === 2 && rand() < 0.12
    });
  }

  var gusts = [], nextGust = 60;

  function draw(n) {
    var tips = [];
    depths.forEach(function (layerAt) {
      var d = [];
      layerAt.blades.forEach(function (bl) {
        // The blade bends from its base: a curve whose tip is pushed aside by the wind, and which
        // shortens a little as it leans.
        var lean = (wind(bl.x, n, gusts) + 0.02 * Math.sin(n * 0.09 + bl.phase)) / bl.stiffness;
        var dx = bl.height * Math.sin(lean), dy = bl.height * Math.cos(lean);
        var tx = bl.x + dx, ty = bl.base - dy;
        d.push('M' + bl.x.toFixed(1) + ' ' + bl.base + 'Q' + bl.x.toFixed(1) + ' ' + (bl.base - dy * 0.6).toFixed(1) + ' ' + tx.toFixed(1) + ' ' + ty.toFixed(1));
        if (bl.head) tips.push('M' + tx.toFixed(1) + ' ' + ty.toFixed(1) + 'l' + (dx * 0.12).toFixed(1) + ' ' + (-dy * 0.12).toFixed(1));
      });
      layerAt.path.setAttribute('d', d.join(''));
    });
    heads.setAttribute('d', tips.join(''));
  }
  draw(0);

  return {
    interval: 50,
    step: function (n) {
      if (--nextGust <= 0) {
        gusts.push({ x: -GUST_WIDTH * 2, strength: 0.12 + rand() * 0.16 });
        nextGust = 140 + Math.floor(rand() * 260);
      }
      gusts = gusts.filter(function (g) { g.x += GUST_SPEED; return g.x < W + GUST_WIDTH * 2; });
      draw(n);
    }
  };
}
