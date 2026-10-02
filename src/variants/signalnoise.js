/* Signal noise: brief bursts of interference lines, at random intervals, as on bytecode.news.
   ?ambientSeed=<n> replays the bursts. Between them it rests on a screen waiting for a signal:
   faint scanlines, and a dim band rolling down them (ui-pudl #98). A click tears the signal
   there: a longer burst gathered round the click's height, the band jumping to it. */
export default function signalnoise(layer, m) {
  // Frequent, longish and strong enough to see through the art's fade (ui-pudl #98).
  var MIN_IDLE = 900, IDLE_SPAN = 2600, MIN_BURST = 120, BURST_SPAN = 200;
  var W = m.width, H = m.height;
  function unit(seed, salt) {
    var v = (seed ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0;
    v = Math.imul(v ^ (v >>> 16), 0x21f0aaad);
    v = Math.imul(v ^ (v >>> 15), 0x735a2d97);
    return ((v ^ (v >>> 15)) >>> 0) / 0x100000000;
  }
  function next(seed) { return (Math.imul(seed, 1664525) + 1013904223) >>> 0; }
  function range(seed, salt, min, span) { return min + unit(seed, salt) * span; }

  var seed = m.seed();
  var active = false, burstEndsAt = 0, nextBurstAt = null, tear = null;

  var scan = [];
  for (var sy = 2; sy < H; sy += 6) scan.push('M0 ' + sy + 'H' + W + 'v1H0Z');
  m.el('path', { 'class': 'masthead-noise-scan', d: scan.join('') });
  // The band starts on the screen, somewhere the seed picks, so the resting look shows from the
  // first frame rather than after the band rolls in from above.
  var BAND = 36, bandY = Math.floor(unit(seed, 11) * (H - BAND));
  var band = m.el('rect', { 'class': 'masthead-noise-band', x: 0, y: bandY, width: W, height: BAND });
  var burst = m.el('g', { 'class': 'masthead-noise-burst' });

  function roll() {
    bandY = bandY > H ? -BAND : bandY + 1.5;
    band.setAttribute('y', bandY.toFixed(1));
  }
  function clear() { while (burst.firstChild) burst.removeChild(burst.firstChild); }
  function drawLines() {
    clear();
    var count = Math.floor(range(seed, 2, 3, 10));
    for (var l = 0; l < count; l++) {
      var salt = l * 17;
      var y = (tear === null ? range(seed, salt + 4, 0, H) : Math.max(0, Math.min(H - 6, tear + range(seed, salt + 4, -50, 100)))).toFixed(1);
      var h = range(seed, salt + 5, 1.2, 4.8).toFixed(1);
      var g = m.el('g', { opacity: range(seed, salt + 9, 0.5, 0.3).toFixed(3) }, burst);
      m.el('rect', { 'class': 'masthead-noise-line', x: 0, y: y, width: W, height: h }, g);
      var pieces = Math.floor(range(seed, salt + 3, 1, 5));
      for (var p = 0; p < pieces; p++) {
        var ps = salt + p * 5;
        m.el('rect', {
          'class': 'masthead-noise-fragment',
          x: range(seed, ps + 8, -W * 0.08, W * 1.04).toFixed(1), y: y,
          width: range(seed, ps + 7, W * 0.06, W * 0.36).toFixed(1), height: h,
          opacity: range(seed, ps + 6, 0.5, 0.4).toFixed(2)
        }, g);
      }
    }
  }

  return {
    interval: 70,
    poke: function (x, y, n, now) {
      tear = y;
      bandY = Math.max(-BAND / 2, y - BAND / 2);
      band.setAttribute('y', bandY.toFixed(1));
      seed = next(seed);
      active = true;
      burstEndsAt = now + 450 + range(seed, 10, 0, 250);
      drawLines();
    },
    step: function (n, now) {
      roll();
      if (nextBurstAt === null) nextBurstAt = now + range(seed, 1, MIN_IDLE, IDLE_SPAN);
      if (active && now < burstEndsAt) { seed = next(seed); drawLines(); return; }
      if (active) {
        seed = next(seed);
        active = false;
        tear = null;
        clear();
        nextBurstAt = now + range(seed, 1, MIN_IDLE, IDLE_SPAN);
        return;
      }
      if (now >= nextBurstAt) {
        seed = next(seed);
        active = true;
        burstEndsAt = now + range(seed, 10, MIN_BURST, BURST_SPAN);
        drawLines();
      }
    }
  };
}
