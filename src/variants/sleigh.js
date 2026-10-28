/* Sleigh: a full moon high at one end of a starry sky, and now and then a sleigh and its team of
   reindeer flying across it, climbing gently as they pass over the moon's face. The reindeer leap
   as they run, legs reaching out and tucking under, each a little after the one ahead; the
   driver sits up in front of a sack. The flights come from the seed, so ?ambientSeed=<n> replays
   them. A December animation. */

var MOON_R = 50;
var MOON_Y = 84;
var STARS = 14;
/* Pixels a step the team flies, and radians a step its stride goes round. */
export var SPEED = 2;
export var STRIDE = 0.22;
var DEER = 4;
/* How much larger than its outlines the team is drawn. */
var SIZE = 1.35;
var GAP = 30;
/* From the back of the sleigh to the leading deer's nose. */
var LENGTH = (34 + GAP * (DEER - 1) + 50) * SIZE;

/* A reindeer facing right at [phase] in its leap, as path data about its middle: body, neck,
   head, antlers, tail, and legs that reach out (front forward, hind back) and tuck under. */
export function reindeer(phase) {
  var reach = (1 + Math.sin(phase)) / 2;
  function leg(x, from, to) {
    var a = (from + (to - from) * reach) * Math.PI / 180, knee = [x + 5 * Math.sin(a), 3 + 5 * Math.cos(a)];
    // The lower leg folds back at the knee as the leg tucks.
    var b = a - (1 - reach) * (x > 0 ? 1.2 : -1.2);
    return 'M' + x + ' 3L' + knee[0].toFixed(1) + ' ' + knee[1].toFixed(1) + 'L' + (knee[0] + 5 * Math.sin(b)).toFixed(1) + ' ' + (knee[1] + 5 * Math.cos(b)).toFixed(1);
  }
  return 'M-9 0C-9 -4 8 -5 9 -1C9 3 -6 4 -9 0Z' +
    'M7 -2L11 -9L16 -9L16.5 -7L12 -6.5L9.5 -0.5' +
    'M11.5 -9L10 -14L7.5 -16M10.5 -12.5L13 -15M10 -14L11 -17.5' +
    'M-9 -1L-11.5 -3' +
    leg(6, -25, 65) + leg(4, -10, 50) + leg(-6, 20, -60) + leg(-8, 30, -45);
}

/* The sleigh facing right, its runners curling up at the front, the driver in front of the
   sack, as path data, its middle at the origin. */
export var SLEIGH = 'M-22 8H14C20 8 22 4 20 0' +
  'M-16 8V4M8 8V4' +
  'M-22 4H16L18 -4H-10C-14 -4 -18 -8 -22 -10Z' +
  'M-18 -9C-20 -18 -6 -20 -7 -6' +
  'M4 -4V-10C4 -14 12 -14 12 -10V-4' +
  'M8 -14.5A3 3 0 1 1 8.01 -14.5' +
  'M5 -17L9 -25L12 -17Z';

export default function sleigh(layer, m) {
  var W = m.width;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  // A small seed's first draw is always about 0.24, so it's thrown away.
  rand();

  var moonX = rand() < 0.5 ? 210 + rand() * 60 : W - 210 - rand() * 60;
  var stars = [];
  for (var k = 0; k < STARS; k++) {
    var sx = rand() * W, sy = 12 + rand() * 90;
    if (Math.hypot(sx - moonX, sy - MOON_Y) < MOON_R + 20) { k--; continue; }
    stars.push({ el: m.el('path', { 'class': 'masthead-sleigh-star' }), x: sx, y: sy, phase: rand() * 6.3, size: 1.5 + rand() * 1.5 });
  }
  var moon = m.el('ellipse', { 'class': 'masthead-sleigh-moon', cy: MOON_Y, ry: MOON_R });
  var team = m.el('g', { 'class': 'masthead-sleigh-team', opacity: 0 });
  var traces = m.el('path', { 'class': 'masthead-sleigh-traces' }, team);
  var body = m.el('path', { 'class': 'masthead-sleigh-sleigh', d: SLEIGH }, team);
  var deer = [];
  for (k = 0; k < DEER; k++) deer.push(m.el('path', { 'class': 'masthead-sleigh-deer' }, team));

  var flight = null, nextAt = 40 + Math.floor(rand() * 60);

  /* A flight across: from one side to the other, climbing gently, over the moon's face. */
  function launch() {
    var dir = rand() < 0.5 ? 1 : -1;
    // The team runs ahead of the sleigh, so it starts with the leading deer just out of sight.
    flight = { dir: dir, x: dir > 0 ? -LENGTH : W + LENGTH, lift: 0.05 + rand() * 0.03, over: (rand() - 0.5) * MOON_R * 0.8 };
  }

  /* Where the sleigh is at [x]: on a straight, gentle climb that passes the moon's middle (give
     or take) as it goes by. */
  function height(f, x) { return MOON_Y + f.over - (x - moonX) * f.dir * f.lift; }

  function draw(n) {
    var squeeze = 1 / m.stretch();
    moon.setAttribute('cx', moonX.toFixed(1));
    moon.setAttribute('rx', (MOON_R * squeeze).toFixed(2));
    stars.forEach(function (s) {
      var r = s.size * (0.6 + 0.4 * Math.sin(n * 0.05 + s.phase)), w = r * squeeze;
      s.el.setAttribute('d', 'M' + (s.x - w).toFixed(1) + ' ' + s.y.toFixed(1) + 'h' + (2 * w).toFixed(2) + 'M' + s.x.toFixed(1) + ' ' + (s.y - r).toFixed(1) + 'v' + (2 * r).toFixed(2));
    });
    if (!flight) { team.setAttribute('opacity', 0); return; }
    team.setAttribute('opacity', 1);
    var f = flight, y = height(f, f.x);
    team.setAttribute('transform', 'translate(' + f.x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + (f.dir * squeeze * SIZE).toFixed(4) + ' ' + SIZE + ')');
    // In the team's own frame, facing right: the sleigh at the origin, the deer ahead of it,
    // each leaping a little after the one ahead and bobbing with its leap.
    var line = '';
    deer.forEach(function (el, i) {
      var phase = n * STRIDE - (DEER - 1 - i) * 0.6, dx = 34 + i * GAP, dy = -6 - Math.cos(phase) * 2.5 - i * 1.2;
      el.setAttribute('d', reindeer(phase));
      el.setAttribute('transform', 'translate(' + dx + ' ' + dy.toFixed(1) + ')');
      line += (i ? 'L' : 'M14 -2L') + (dx - 6) + ' ' + (dy + 1).toFixed(1) + 'M' + (dx + 6) + ' ' + (dy - 1).toFixed(1);
    });
    traces.setAttribute('d', line);
  }

  draw(0);

  return {
    interval: 40,
    step: function (n) {
      if (!flight && n >= nextAt) launch();
      if (flight) {
        flight.x += flight.dir * SPEED;
        // Gone once the sleigh, at the back, is out of sight.
        if (flight.dir > 0 ? flight.x > W + 30 : flight.x < -30) { flight = null; nextAt = n + 250 + Math.floor(rand() * 350); }
      }
      draw(n);
    }
  };
}
