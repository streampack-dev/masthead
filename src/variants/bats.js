/* Bats: bats flapping across the masthead in loose, wavering flight, a few at a time and now and
   then a little flock, the nearer ones larger and quicker. They fly above the date or below the
   tagline, bowing further away as they pass the name, so they're seldom behind the words. The
   flights come from the seed, so ?ambientSeed=<n> replays them. An October animation. */
var MAX_BATS = 6;

/* A bat's height at [x] on a flight at [base]: above or below the name, bowing away from it as
   it passes. */
export function flight(x, base, width) {
  var d = (x - width / 2) / 300, away = 34 * Math.exp(-d * d);
  return base < 160 ? base - away * (base / 80) : base + away * ((320 - base) / 70);
}

/* A bat's outline with its wings at [flap] (-1 down to 1 up): a small body, and wings whose
   trailing edges scallop between their finger bones. */
export function bat(flap) {
  var lift = flap * 9, tip = flap * 12;
  function wing(s) {
    return 'M' + (s * 3) + ' -1' +
      'Q' + (s * 9) + ' ' + (-4 - lift).toFixed(1) + ' ' + (s * 18) + ' ' + (-3 - tip).toFixed(1) +
      'Q' + (s * 16) + ' ' + (1 - tip * 0.4).toFixed(1) + ' ' + (s * 13) + ' ' + (2 - tip * 0.3).toFixed(1) +
      'Q' + (s * 11) + ' ' + (0 - tip * 0.2).toFixed(1) + ' ' + (s * 8) + ' ' + (3 - tip * 0.15).toFixed(1) +
      'Q' + (s * 6) + ' 1 ' + (s * 3) + ' 3Z';
  }
  return wing(-1) + wing(1) + 'M-2.5 -2Q0 -5 2.5 -2L2 3Q0 5 -2 3ZM-2 -3L-3 -6L-1 -4ZM2 -3L3 -6L1 -4Z';
}

export default function bats(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var flying = [], nextAt = 0;

  function launch(n) {
    var flock = rand() < 0.25 ? 3 + Math.floor(rand() * 3) : 1;
    // Above the date or below the tagline.
    var dir = rand() < 0.5 ? 1 : -1, y = rand() < 0.5 ? 50 + rand() * 25 : 250 + rand() * 25;
    for (var k = 0; k < flock && flying.length < MAX_BATS; k++) {
      var depth = 0.5 + rand() * 0.6;
      flying.push({
        x: dir > 0 ? -30 - k * (20 + rand() * 30) : W + 30 + k * (20 + rand() * 30),
        base: y + (rand() - 0.5) * 20, dir: dir,
        speed: (1.2 + rand() * 0.8) * depth, size: depth * 1.6,
        // Bats flit: a slow drift up and down, with quicker wobbles over it.
        drift: rand() * 6.3, wobble: rand() * 6.3, rate: 0.28 + rand() * 0.1, phase: rand() * 6.3,
        el: m.el('path', { 'class': 'masthead-bats-bat', opacity: (0.55 + depth * 0.4).toFixed(2) })
      });
    }
    nextAt = n + 50 + Math.floor(rand() * 140);
  }

  function draw(n) {
    var squeeze = 1 / m.stretch();
    flying.forEach(function (b) {
      var flap = Math.sin(n * b.rate + b.phase);
      b.el.setAttribute('d', bat(flap));
      var y = flight(b.x, b.base, W) + Math.sin(n * 0.02 + b.drift) * 10 + Math.sin(n * 0.11 + b.wobble) * 4;
      b.el.setAttribute('transform', 'translate(' + b.x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + (b.size * squeeze * b.dir).toFixed(4) + ' ' + b.size.toFixed(3) + ')');
    });
  }

  launch(0);
  // The first is already on its way across.
  flying.forEach(function (b) { b.x += b.dir * W * 0.35; });
  draw(0);

  return {
    interval: 40,
    step: function (n) {
      if (n >= nextAt) launch(n);
      flying = flying.filter(function (b) {
        b.x += b.dir * b.speed;
        // Gone off the far side (a flock's stragglers start well off the near one).
        if ((b.dir > 0 && b.x > W + 80) || (b.dir < 0 && b.x < -80)) { b.el.parentNode.removeChild(b.el); return false; }
        return true;
      });
      draw(n);
    }
  };
}
