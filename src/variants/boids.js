/* Boids: sixteen fireflies flocking, as on bytecode.news. */
export default function boids(layer, m) {
  var COUNT = 16, MIN_SPEED = 0.86, MAX_SPEED = 1.89;
  var NEIGHBOR = 132, SEPARATION = 34, EDGE = 42;
  var W = m.width, H = m.height;

  function seeded(seed) {
    var x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }
  function unit(x, y) {
    var l = Math.hypot(x, y);
    return l === 0 ? { x: 0, y: 0 } : { x: x / l, y: y / l };
  }
  function clamp(vx, vy) {
    var s = Math.hypot(vx, vy);
    if (s === 0) return { vx: MIN_SPEED, vy: 0 };
    var k = Math.min(MAX_SPEED, Math.max(MIN_SPEED, s)) / s;
    return { vx: vx * k, vy: vy * k };
  }

  var boids = [];
  for (var i = 0; i < COUNT; i++) {
    var angle = seeded(i + 501) * Math.PI * 2;
    var speed = MIN_SPEED + seeded(i + 901) * 0.55;
    var g = m.el('g', { 'class': 'masthead-boid' });
    m.el('circle', { r: 5.8, fill: m.pulse }, g);
    m.el('circle', { r: 1.9, 'class': 'masthead-spark' }, g);
    boids.push({
      id: i,
      phase: seeded(i + 1301) * Math.PI * 2,
      bias: 0.85 + seeded(i + 1701) * 0.45,
      x: EDGE + seeded(i + 1) * Math.max(1, W - EDGE * 2),
      y: EDGE + seeded(i + 101) * Math.max(1, H - EDGE * 2),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      el: g
    });
  }

  function place() {
    boids.forEach(function (b) {
      b.el.setAttribute('transform', 'translate(' + b.x.toFixed(2) + ' ' + b.y.toFixed(2) + ')');
    });
  }
  place();

  return {
    step: function (n) {
      var cx = W / 2, cy = H / 2;
      var next = boids.map(function (b) {
        var sx = 0, sy = 0, ax0 = 0, ay0 = 0, cx0 = 0, cy0 = 0, count = 0;
        boids.forEach(function (o) {
          if (o === b) return;
          var dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy);
          if (d < NEIGHBOR) { ax0 += o.vx; ay0 += o.vy; cx0 += o.x; cy0 += o.y; count++; }
          if (d > 0 && d < SEPARATION) { sx -= dx / d; sy -= dy / d; }
        });
        var ax = 0, ay = 0;
        if (count > 0) {
          var heading = unit(ax0 / count, ay0 / count);
          var toMass = unit(cx0 / count - b.x, cy0 / count - b.y);
          ax += heading.x * 0.03 + toMass.x * 0.028;
          ay += heading.y * 0.03 + toMass.y * 0.028;
        }
        ax += sx * 0.062;
        ay += sy * 0.062;
        var out = unit(b.x - cx, b.y - cy);
        ax += -out.y * 0.028;
        ay += out.x * 0.028;
        var wander = b.phase + n * 0.09 + b.id * 0.37;
        ax += Math.cos(wander) * 0.048 * b.bias;
        ay += Math.sin(wander * 1.07) * 0.043 * b.bias;
        if (b.x < EDGE) ax += 0.09;
        if (b.x > W - EDGE) ax -= 0.09;
        if (b.y < EDGE) ay += 0.075;
        if (b.y > H - EDGE) ay -= 0.075;
        var v = clamp(b.vx + ax, b.vy + ay);
        return { x: Math.min(W - 8, Math.max(8, b.x + v.vx)), y: Math.min(H - 8, Math.max(8, b.y + v.vy)), vx: v.vx, vy: v.vy };
      });
      next.forEach(function (s, i) { var b = boids[i]; b.x = s.x; b.y = s.y; b.vx = s.vx; b.vy = s.vy; });
      place();
    }
  };
}
