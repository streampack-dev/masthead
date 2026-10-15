/* Menorah: a Hanukkah menorah at one end of the masthead, in outline: eight branches and the
   raised shamash. The shamash is lit first, then tonight's candles one by one, the newest (the
   leftmost) first; candles are set in from the right, a night at a time. The night comes from the
   day: the first day of the hanukkah occasion has one candle and the eighth has eight. A Hebrew
   day starts at sundown, so the window runs a day past the eighth night, and that last day keeps
   all eight. Run out of season (by name, or on the demo page), it has all eight. The flames
   flicker, each in its own way; a click is a breath of air that bends them away from it. The end
   and the flickers come from the seed, so ?ambientSeed=<n> replays them. */

/* Each branch's distance from the stem, left to right; the shamash is on the stem. */
export var SLOTS = [-120, -90, -60, -30, 30, 60, 90, 120];
export var CUP = 150;
export var SHAMASH_CUP = 120;
var CANDLE = 32;
var FOOT = 308;
/* Steps (of 50 ms) before the shamash is lit, and between one candle's lighting and the next. */
export var FIRST = 10;
export var GAP = 24;

var FLAME = 'M0 0c-4.5 0 -6 -5 -3.5 -9.5c1.5 -3 3.5 -5.5 3.5 -10.5c1.5 4.5 3.5 7.5 4.5 10.5c1.5 4.5 0 9.5 -4.5 9.5z';

/* How many candles burn on [date]: the day of the hanukkah window it falls on, at most eight; eight
   out of season. [during] is m.during. */
export function candles(date, during) {
  if (!during || !during('hanukkah', date)) return 8;
  var n = 1;
  while (n < 8 && during('hanukkah', new Date(date.getFullYear(), date.getMonth(), date.getDate() - n, 12))) n++;
  return n;
}

/* The branches (indexes into SLOTS) that hold candles on night [n], in the order they're lit:
   set in from the right, lit from the left. */
export function order(n) {
  var out = [];
  for (var i = 8 - n; i < 8; i++) out.push(i);
  return out;
}

export default function menorah(layer, m) {
  var W = m.width;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var cx = rand() < 0.5 ? 175 : W - 175;
  var g = m.el('g', { 'class': 'masthead-menorah-menorah' });

  // The branches as nested arcs from the stem, the stem, the foot, and a cup on every branch.
  var metal = 'M0 ' + SHAMASH_CUP + 'V284M-50 ' + FOOT + 'L-14 284H14L50 ' + FOOT + 'ZM-62 ' + FOOT + 'H62';
  [30, 60, 90, 120].forEach(function (d) {
    metal += 'M' + -d + ' ' + CUP + 'A' + d + ' ' + d * 0.75 + ' 0 0 0 ' + d + ' ' + CUP;
  });
  SLOTS.concat([0]).forEach(function (x) {
    var y = x === 0 ? SHAMASH_CUP : CUP;
    metal += 'M' + (x - 8) + ' ' + y + 'L' + (x - 5) + ' ' + (y + 5) + 'H' + (x + 5) + 'L' + (x + 8) + ' ' + y + 'Z';
  });
  m.el('path', { 'class': 'masthead-menorah-metal', d: metal }, g);

  function candle(x, cup) {
    var top = cup - CANDLE;
    m.el('rect', { 'class': 'masthead-menorah-candle', x: x - 4, y: top, width: 8, height: CANDLE }, g);
    m.el('path', { 'class': 'masthead-menorah-wick', d: 'M' + x + ' ' + top + 'v-4' }, g);
    var at = m.el('g', { 'class': 'masthead-menorah-light', opacity: 0 }, g);
    var glow = m.el('ellipse', { cx: x, cy: top - 14, rx: 16, ry: 20, fill: m.pulse, 'class': 'masthead-menorah-glow' }, at);
    var flame = m.el('path', { 'class': 'masthead-menorah-flame', d: FLAME }, at);
    return { x: x, top: top - 3, at: at, glow: glow, flame: flame, lit: -1, phase: rand() * 6.3, rate: 0.18 + rand() * 0.14 };
  }

  var night = candles(m.date(), m.during);
  var shamash = candle(0, SHAMASH_CUP);
  shamash.lit = FIRST;
  var lights = [shamash];
  order(night).forEach(function (i, k) {
    var c = candle(SLOTS[i], CUP);
    c.lit = FIRST + (k + 1) * GAP;
    lights.push(c);
  });

  var breath = 0, from = 0;

  function draw(n) {
    var squeeze = 1 / m.stretch();
    g.setAttribute('transform', 'translate(' + cx + ' 0) scale(' + squeeze.toFixed(4) + ' 1)');
    lights.forEach(function (c) {
      if (n < c.lit) return;
      // Struck: the flame grows to its height over a few steps, then flickers as the pumpkins' do.
      var grown = Math.min(1, (n - c.lit + 1) / 6);
      var f = 0.78 + 0.1 * Math.sin(n * c.rate + c.phase) + 0.07 * Math.sin(n * c.rate * 2.7 + c.phase * 2) + 0.05 * Math.sin(n * 0.9 + c.phase * 3);
      // A breath bends the flame away from where it came from, less the further off it is.
      var dx = cx + c.x / squeeze - from;
      var bend = -(dx < 0 ? -1 : 1) * 28 * breath * Math.exp(-Math.abs(dx) / 400);
      c.at.setAttribute('opacity', grown.toFixed(2));
      c.flame.setAttribute('transform', 'translate(' + c.x + ' ' + c.top + ') skewX(' + bend.toFixed(1) + ') scale(' + (0.9 + 0.1 * f).toFixed(3) + ' ' + (grown * f).toFixed(3) + ')');
      c.glow.setAttribute('opacity', (f * 0.7).toFixed(2));
    });
  }
  draw(0);

  return {
    interval: 50,
    step: function (n) {
      breath *= 0.94;
      draw(n);
    },
    poke: function (x) {
      breath = 1;
      from = x;
    }
  };
}
