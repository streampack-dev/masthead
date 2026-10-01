/* Lander: the old lunar-landing game, flown by its autopilot. A lander drifts in from the top,
   fires its engine in short bursts to slow its fall and steer, and settles gently on a flat pad
   in the jagged ground along the foot of the masthead. After a while on the pad it's a new
   descent over new ground. The ground and the approach come from the seed, so ?ambientSeed=<n>
   flies the same landings again. */
export var GRAVITY = 0.006, THRUST = 0.014, SIDE = 0.006;
var PAD_W = 70, REST = 110;

/* Ground across [width]: jagged hills between 250 and 310, with one flat pad. */
export function ground(rand, width) {
  var points = [], x = 0, padAt = 160 + rand() * (width - 320), pad = null;
  while (x <= width) {
    if (pad === null && x >= padAt) {
      var y = 275 + rand() * 25;
      pad = { x1: x, x2: x + PAD_W, y: y };
      points.push([x, y], [x + PAD_W, y]);
      x += PAD_W;
    } else {
      points.push([x, 250 + rand() * 60]);
    }
    x += 22 + rand() * 30;
  }
  return { points: points, pad: pad };
}

/* One step of the autopilot over [pad]: aim to be above its middle, and to come down slower the
   lower it gets, hovering while it's low and still off to one side. Returns which engines fire. */
export function pilot(s, pad) {
  var target = (pad.x1 + pad.x2) / 2, height = pad.y - s.y, off = target - s.x;
  var wantVx = Math.max(-1, Math.min(1, off * 0.006));
  var wantVy = Math.abs(off) > 20 && height < 70 ? 0 : Math.min(0.55, 0.08 + height * 0.004);
  return { main: s.vy > wantVy, left: s.vx < wantVx - 0.05, right: s.vx > wantVx + 0.05 };
}

export default function lander(layer, m) {
  var W = m.width;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var groundEl = m.el('path', { 'class': 'masthead-lander-ground' });
  var padEl = m.el('path', { 'class': 'masthead-lander-pad' });
  var ship = m.el('g', { 'class': 'masthead-lander-ship' });
  // The lander: a cabin on a descent stage, two splayed legs; its flame below.
  m.el('path', { d: 'M-5 -14h10l3 4v4h-16v-4zM-9 -6h18v4h-18zM-7 -2l-5 7M7 -2l5 7M-14 5h4M10 5h4' }, ship);
  var flame = m.el('path', { 'class': 'masthead-lander-flame', d: '' }, ship);

  var land, s, rest;
  function begin() {
    land = ground(rand, W);
    groundEl.setAttribute('d', land.points.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(''));
    padEl.setAttribute('d', 'M' + land.pad.x1.toFixed(1) + ' ' + (land.pad.y + 3).toFixed(1) + 'H' + land.pad.x2.toFixed(1));
    // It comes in from one side of the pad, a few hundred units off, drifting toward it.
    var side = rand() < 0.5 ? -1 : 1, mid = (land.pad.x1 + land.pad.x2) / 2;
    var x = Math.max(30, Math.min(W - 30, mid + side * (150 + rand() * 200)));
    s = { x: x, y: 12, vx: (mid - x > 0 ? 1 : -1) * (0.3 + rand() * 0.3), vy: 0.1, landed: false };
    rest = 0;
  }
  begin();

  function draw(burn, n) {
    ship.setAttribute('transform', 'translate(' + s.x.toFixed(1) + ' ' + s.y.toFixed(1) + ') scale(' + (1 / m.stretch()).toFixed(4) + ' 1)');
    var d = '';
    // The flame flickers: its length changes from step to step.
    if (burn.main) d += 'M-4 -2L0 ' + (6 + (n % 3) * 3) + 'L4 -2';
    if (burn.left) d += 'M-9 -4l-6 -1';
    if (burn.right) d += 'M9 -4l6 -1';
    flame.setAttribute('d', d);
  }
  draw({}, 0);

  return {
    interval: 40,
    step: function (n) {
      if (s.landed) {
        draw({}, n);
        if (++rest > REST) begin();
        return;
      }
      var burn = pilot(s, land.pad);
      s.vy += GRAVITY - (burn.main ? THRUST : 0);
      s.vx += (burn.left ? SIDE : 0) - (burn.right ? SIDE : 0);
      s.x += s.vx; s.y += s.vy;
      if (s.y >= land.pad.y - 5 && s.x > land.pad.x1 && s.x < land.pad.x2) {
        s.y = land.pad.y - 5; s.vx = 0; s.vy = 0; s.landed = true;
      } else if (s.y >= land.pad.y + 30) {
        // Missed the pad: in the ground, and a new descent.
        begin();
      }
      draw(burn, n);
    }
  };
}
