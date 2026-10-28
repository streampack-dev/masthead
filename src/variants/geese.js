/* Geese: a skein of geese flying a V across the top of the masthead, one flight at a time. Each
   goose keeps a slot behind and to one side of the goose ahead, so the V wavers and holds; the
   arms are seldom even. Now and then the leader drops back to the end of the shorter arm and the
   next goose takes the point, and the V re-forms. A follower beats its wings in step with the
   wake it flies in: its beat lags the leader's by the distance behind it, as real formation
   fliers do. The flights come from the seed, so ?ambientSeed=<n> replays them. A November
   animation. */

/* The V's half-angle, and the distance between a goose and the goose ahead of it. */
export var ANGLE = 12 * Math.PI / 180;
export var SPACING = 56;
/* Pixels a step the skein flies, and radians a step its wings beat. */
export var SPEED = 1.8;
export var BEAT = 0.3;
/* How much larger than its outline a goose is drawn. */
var SIZE = 1.35;

/* Where the goose at [rank] on arm [side] (-1 above, 1 below) flies, from the point, for a skein
   flying in [dir] (1 to the right). */
export function slot(rank, side, dir) {
  return { x: -dir * rank * SPACING * Math.cos(ANGLE), y: side * rank * SPACING * Math.sin(ANGLE) };
}

/* A goose facing right with its wings at [flap] (-1 down to 1 up): body, long neck, bill, and
   two wings, the far one shorter. */
export function goose(flap) {
  function wing(root, back, rise) {
    var tip = -1 - rise * flap;
    return 'M' + root + ' -1Q' + (root - 1) + ' ' + (-1 + (tip + 1) * 0.6).toFixed(1) + ' ' + (root - back) + ' ' + tip.toFixed(1);
  }
  return 'M-9 0C-6 -3 2 -3 5 -1C2 2.5 -6 2.5 -9 0ZM-9 0L-12 -1.5M5 -1L12 -3.5L15.5 -3.6' + wing(1, 6, 15) + wing(-1, 5, 11);
}

export default function geese(layer, m) {
  var W = m.width;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  // A small seed's first draw is always about 0.24, so it's thrown away.
  rand();

  var skein = null, nextAt = 0;
  var g = m.el('g', { 'class': 'masthead-geese' });

  /* A new flight: seven to nine geese, the arms uneven, at its own height and heading. */
  function launch(n) {
    var count = 7 + Math.floor(rand() * 3), dir = rand() < 0.5 ? 1 : -1;
    // Arms of three or four, seldom even, so the V keeps above the name.
    var above = Math.min(4, Math.max(count - 5, Math.floor((count - 1) / 2) + (rand() < 0.4 ? 0 : rand() < 0.5 ? -1 : 1)));
    var birds = [];
    for (var i = 0; i < count; i++) {
      birds.push({ el: m.el('path', { 'class': 'masthead-geese-goose' }, g), x: 0, y: 0, wobble: rand() * 6.3, phase: rand() * 0.6 });
    }
    skein = {
      dir: dir, x: dir > 0 ? -40 : W + 40, y: 0, base: 56 + rand() * 6, drift: rand() * 6.3,
      lead: birds[0], arms: [birds.slice(1, 1 + above), birds.slice(1 + above)], all: birds,
      swapAt: n + 260 + Math.floor(rand() * 200)
    };
    skein.y = skein.base;
    place(skein, true);
  }

  function targets(s) {
    var out = [{ b: s.lead, x: s.x, y: s.y, side: 0 }];
    s.arms.forEach(function (arm, a) {
      arm.forEach(function (b, k) {
        var side = a === 0 ? -1 : 1, o = slot(k + 1, side, s.dir);
        out.push({ b: b, x: s.x + o.x, y: s.y + o.y, side: side });
      });
    });
    return out;
  }

  /* Each goose eases toward its slot, never faster than a goose would slip back or catch up, and
     one far from its slot passes outside its arm, not through it; [at] puts it straight there. */
  function place(s, at) {
    targets(s).forEach(function (t) {
      if (at) { t.b.x = t.x; t.b.y = t.y; return; }
      var far = Math.abs(t.x - t.b.x);
      var dx = t.x - t.b.x, dy = t.y + t.side * Math.min(22, far * 0.3) - t.b.y, d = Math.hypot(dx, dy), k = Math.min(0.05, 0.9 / (d || 1));
      t.b.x += s.dir * SPEED + dx * k;
      t.b.y += dy * k;
    });
  }

  /* The point drops back to the end of the shorter arm; the first of the longer arm leads. */
  function swap(s) {
    var short = s.arms[0].length <= s.arms[1].length ? 0 : 1, long = 1 - short;
    if (s.arms[long].length === 0) return;
    s.arms[short].push(s.lead);
    s.lead = s.arms[long].shift();
  }

  function draw(n) {
    var squeeze = 1 / m.stretch();
    skein.all.forEach(function (b) {
      // A follower's beat lags the leader's by its distance behind, so it flaps in the wake.
      var behind = (skein.x - b.x) * skein.dir;
      var flap = Math.sin(n * BEAT - behind * BEAT / SPEED + b.phase);
      var y = b.y + Math.sin(n * 0.05 + b.wobble) * 1.6;
      b.el.setAttribute('d', goose(flap));
      b.el.setAttribute('transform', 'translate(' + b.x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + (skein.dir * squeeze * SIZE).toFixed(4) + ' ' + SIZE + ')');
    });
  }

  launch(0);
  // The first is already on its way across.
  skein.x += skein.dir * W * 0.3;
  skein.y = skein.base;
  place(skein, true);
  draw(0);

  return {
    interval: 40,
    step: function (n) {
      if (!skein) {
        if (n < nextAt) return;
        launch(n);
      }
      var s = skein;
      s.x += s.dir * SPEED;
      s.y = s.base + Math.sin(n * 0.012 + s.drift) * 9;
      if (n >= s.swapAt) { swap(s); s.swapAt = n + 380 + Math.floor(rand() * 260); }
      place(s, false);
      draw(n);
      // Gone when the last goose is past the far side; the next flight comes after a while.
      var tail = Math.min.apply(null, s.all.map(function (b) { return b.x * s.dir; }));
      if ((s.dir > 0 && tail > W + 40) || (s.dir < 0 && -tail < -40)) {
        s.all.forEach(function (b) { g.removeChild(b.el); });
        skein = null;
        nextAt = n + 60 + Math.floor(rand() * 160);
      }
    }
  };
}
