/* Leaves: autumn leaves falling and piling up along the foot of the masthead. A leaf doesn't drop
   straight: it swings from side to side as it sinks, gliding fastest through the middle of a
   swing and slowing at the ends, tilted with its motion; now and then one tumbles end over end
   instead. Where they land they stay, in a low heap; when the heap is full the oldest fade away.
   Now and then a gust runs through, carrying the falling ones and lifting a few off the heap. The
   leaves are maple, oak and elm, in autumn paints, so their shapes tell them apart as well. The
   falls and gusts come from the seed, so ?ambientSeed=<n> replays them. A November animation. */

/* Each kind's outline, stem down, about 16 high, with its midrib. */
export var KINDS = {
  maple: 'M0 7L0 4L-2 5L-3 3L-7 3L-5 0L-8 -3L-4 -3L-4 -6L-1 -4L0 -8L1 -4L4 -6L4 -3L8 -3L5 0L7 3L3 3L2 5L0 4ZM0 4V-6M0 1L-5 -2M0 1L5 -2',
  oak: 'M0 7V4C-2 4 -4 3 -3 1.5C-5 1.5 -5 -1 -3 -1C-5 -2 -4 -5 -2 -4C-2 -6 -1 -7.5 0 -8C1 -7.5 2 -6 2 -4C4 -5 5 -2 3 -1C5 -1 5 1.5 3 1.5C4 3 2 4 0 4ZM0 4V-6',
  elm: 'M0 7V4C-4 3 -5 -2 0 -8C5 -2 4 3 0 4ZM0 4V-6M0 1L-3 -1M0 -2L2.5 -4'
};
/* The paints the leaves take: cadmium red, cadmium orange, cadmium yellow, and now and then a
   last green one. */
export var PAINTS = [1, 2, 3, 1, 2, 3, 4];
export var MAX_FALLING = 9;
export var MAX_RESTING = 70;
/* The ground, and the width of the heap's columns. */
export var GROUND = 314;
var COLUMN = 20;

/* How fast a leaf sinks at [theta] in its swing, as a share of its full rate: fastest through the
   middle (cos 0), slowest at the ends, where it all but hangs. */
export function sink(theta) {
  var c = Math.cos(theta);
  return 0.3 + 0.7 * c * c;
}

export default function leaves(layer, m) {
  var W = m.width;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  // A small seed's first draw is always about 0.24, so it's thrown away.
  rand();
  var names = Object.keys(KINDS);

  var g = m.el('g', { 'class': 'masthead-leaves' });
  var falling = [], resting = [], heap = new Array(Math.ceil(W / COLUMN) + 1).fill(0);
  var nextAt = 0, gust = null, gustAt = 300 + Math.floor(rand() * 400);
  var breeze = rand() * 6.3;

  function ground(x) {
    var i = Math.max(0, Math.min(heap.length - 1, Math.floor(x / COLUMN)));
    return GROUND - heap[i];
  }

  function shape() {
    var paint = PAINTS[Math.floor(rand() * PAINTS.length)];
    return m.el('path', {
      'class': 'masthead-leaves-leaf masthead-paint-fill-' + paint + ' masthead-paint-stroke-' + paint,
      d: KINDS[names[Math.floor(rand() * names.length)]]
    }, g);
  }

  /* A leaf let go at [x], [y], already moving at [vx], [vy]. */
  function fly(el, x, y, vx, vy) {
    falling.push({
      el: el, x: x, y: y, vx: vx, vy: vy, size: 1.1 + rand() * 0.6,
      theta: rand() * 6.3, rate: 0.045 + rand() * 0.035, swing: 14 + rand() * 18, fall: 0.5 + rand() * 0.35,
      tumble: rand() < 0.25, turn: rand() * 360, spin: (rand() < 0.5 ? -1 : 1) * (2 + rand() * 2)
    });
  }

  function wind(n) {
    var w = 0.18 * Math.sin(n * 0.004 + breeze);
    if (gust) w += gust.dir * gust.strength * 2.2;
    return w;
  }

  function settle(f) {
    var i = Math.max(0, Math.min(heap.length - 1, Math.floor(f.x / COLUMN)));
    heap[i] = Math.min(22, heap[i] + 1.6);
    // On the ground a leaf lies nearly flat: seen from the side, a short sliver of itself.
    resting.push({ el: f.el, x: f.x, y: ground(f.x) + 1.5, col: i, angle: (rand() - 0.5) * 40 + (rand() < 0.5 ? 0 : 180), flat: 0.35 + rand() * 0.2, size: f.size, fade: -1 });
    if (resting.filter(function (r) { return r.fade < 0; }).length > MAX_RESTING) {
      var oldest = resting.find(function (r) { return r.fade < 0; });
      oldest.fade = 1;
    }
  }

  function draw() {
    var squeeze = 1 / m.stretch();
    falling.forEach(function (f) {
      var tilt = f.tumble ? f.turn : 35 * Math.cos(f.theta);
      f.el.setAttribute('transform', 'translate(' + f.x.toFixed(1) + ' ' + f.y.toFixed(1) + ') scale(' + (squeeze * f.size).toFixed(4) + ' ' + f.size.toFixed(3) + ') rotate(' + tilt.toFixed(1) + ')');
    });
    resting.forEach(function (r) {
      r.el.setAttribute('transform', 'translate(' + r.x.toFixed(1) + ' ' + r.y.toFixed(1) + ') scale(' + (squeeze * r.size).toFixed(4) + ' ' + (r.size * r.flat).toFixed(3) + ') rotate(' + r.angle.toFixed(1) + ')');
    });
  }

  // A few already on their way down, and a few already on the ground.
  for (var k = 0; k < 4; k++) fly(shape(), rand() * W, 20 + rand() * 220, 0, 0);
  for (k = 0; k < 6; k++) settle({ el: shape(), x: 30 + rand() * (W - 60), size: 1.1 + rand() * 0.6 });
  draw();

  return {
    interval: 40,
    step: function (n) {
      if (n >= nextAt && falling.length < MAX_FALLING) {
        fly(shape(), rand() * W, -14, 0, 0);
        nextAt = n + 30 + Math.floor(rand() * 70);
      }
      if (!gust && n >= gustAt) gust = { dir: rand() < 0.5 ? 1 : -1, age: 0, length: 110 + Math.floor(rand() * 60), strength: 0 };
      if (gust) {
        gust.age += 1;
        gust.strength = Math.sin(Math.PI * gust.age / gust.length);
        // It lifts a leaf off the heap now and then while it blows.
        if (gust.strength > 0.5 && rand() < gust.strength * 0.08 && falling.length < MAX_FALLING + 4) {
          var lifted = resting.filter(function (r) { return r.fade < 0; });
          if (lifted.length) {
            var r = lifted[Math.floor(rand() * lifted.length)];
            resting.splice(resting.indexOf(r), 1);
            heap[r.col] = Math.max(0, heap[r.col] - 1.6);
            fly(r.el, r.x, r.y - 4, gust.dir * (1 + rand()), -(1.2 + rand() * 1.2));
          }
        }
        if (gust.age >= gust.length) { gust = null; gustAt = n + 450 + Math.floor(rand() * 450); }
      }

      var w = wind(n);
      falling = falling.filter(function (f) {
        f.theta += f.rate;
        f.vx += (w - f.vx) * 0.03;
        f.vy *= 0.96;
        f.turn += f.spin;
        f.x += f.vx + f.swing * f.rate * Math.cos(f.theta);
        f.y += f.vy + f.fall * sink(f.theta);
        if (f.x < -30 || f.x > W + 30) { g.removeChild(f.el); return false; }
        if (f.vy > -0.2 && f.y >= ground(f.x)) { settle(f); return false; }
        return true;
      });
      resting = resting.filter(function (r) {
        if (r.fade < 0) return true;
        r.fade -= 0.03;
        if (r.fade <= 0) {
          g.removeChild(r.el);
          heap[r.col] = Math.max(0, heap[r.col] - 1.6);
          return false;
        }
        r.el.setAttribute('opacity', r.fade.toFixed(2));
        return true;
      });
      draw();
    }
  };
}
