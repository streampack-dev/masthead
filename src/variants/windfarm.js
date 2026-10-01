/* Wind farm: turbines along low hills at the foot of the masthead, the nearer ones larger, their
   rotors turning in a wind that rises and falls; each turns at its own pace, as real ones do, and
   a gust reaches them one after another as it crosses. Most stand to either side of the name,
   the smaller, farther ones behind it. The farm and its wind come from the seed, so
   ?ambientSeed=<n> replays them. */
var GUST_SPEED = 5;

/* The turbines: where each stands, how tall, and how far off (0 far, 1 near). */
export function farm(rand, width) {
  var out = [], x = 30 + rand() * 40;
  while (x < width - 30) {
    var nearName = Math.abs(x - width / 2) < 260;
    var depth = nearName ? rand() * 0.3 : 0.3 + rand() * 0.7;
    out.push({ x: x, depth: depth, height: 60 + depth * 90, spin: 0.85 + rand() * 0.3, angle: rand() * 120 });
    x += 70 + rand() * 90;
  }
  return out.sort(function (a, b) { return a.depth - b.depth; });
}

/* The hills' height at [x]. */
export function hills(x, a, b) {
  return 292 - 10 * Math.sin(x * 0.006 + a) - 6 * Math.sin(x * 0.017 + b);
}

/* How hard the wind blows at [x] at step [n]: a slow rise and fall, and any gust passing. */
export function wind(x, n, gusts) {
  var w = 0.6 + 0.25 * Math.sin(n * 0.004) + 0.1 * Math.sin(n * 0.011 + 1.3);
  gusts.forEach(function (g) {
    var d = (x - g.x) / 180;
    w += g.strength * Math.exp(-d * d);
  });
  return Math.max(0.15, w);
}

export default function windfarm(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var a = rand() * 6.3, b = rand() * 6.3;
  var line = [];
  for (var x = 0; x <= W; x += 12) line.push((x ? 'L' : 'M') + x + ' ' + hills(x, a, b).toFixed(1));
  m.el('path', { 'class': 'masthead-windfarm-hills', d: line.join('') });

  var turbines = farm(rand, W).map(function (t) {
    var ground = hills(t.x, a, b) + 4 - t.depth * 6;
    var g = m.el('g', { 'class': 'masthead-windfarm-turbine', opacity: (0.45 + t.depth * 0.55).toFixed(2) });
    var r = t.height * 0.42;
    // A tapering tower, the nacelle at its top, and the rotor: three blades and a hub.
    m.el('path', { d: 'M-2.2 0L-1 ' + (-t.height).toFixed(1) + 'H1L2.2 0Z', 'class': 'masthead-windfarm-tower' }, g);
    var rotor = m.el('g', {}, g);
    var blades = [];
    for (var k = 0; k < 3; k++) {
      var at = k * 120;
      blades.push('M0 0' + 'Q' + (r * 0.08).toFixed(1) + ' ' + (-r * 0.5).toFixed(1) + ' 0 ' + (-r).toFixed(1) + 'Q' + (-r * 0.05).toFixed(1) + ' ' + (-r * 0.5).toFixed(1) + ' 0 0');
      m.el('path', { d: blades[k], transform: 'rotate(' + at + ')', 'class': 'masthead-windfarm-blade' }, rotor);
    }
    m.el('circle', { r: 2.2, 'class': 'masthead-windfarm-hub' }, rotor);
    t.ground = ground; t.g = g; t.rotor = rotor;
    return t;
  });

  var gusts = [], nextGust = 80;

  function draw() {
    var squeeze = (1 / m.stretch()).toFixed(4);
    turbines.forEach(function (t) {
      t.g.setAttribute('transform', 'translate(' + t.x.toFixed(1) + ' ' + t.ground.toFixed(1) + ') scale(' + squeeze + ' 1)');
      t.rotor.setAttribute('transform', 'translate(0 ' + (-t.height).toFixed(1) + ') rotate(' + t.angle.toFixed(1) + ')');
    });
  }
  draw();

  return {
    interval: 40,
    step: function (n) {
      if (--nextGust <= 0) {
        gusts.push({ x: -300, strength: 0.4 + rand() * 0.5 });
        nextGust = 250 + Math.floor(rand() * 400);
      }
      gusts = gusts.filter(function (g) { g.x += GUST_SPEED; return g.x < W + 300; });
      turbines.forEach(function (t) { t.angle = (t.angle + wind(t.x, n, gusts) * t.spin * 1.6) % 360; });
      draw();
    }
  };
}
