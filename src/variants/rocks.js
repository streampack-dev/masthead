/* Rocks: the old asteroid-field game, playing itself, slowly. Jagged rocks drift and turn across
   the masthead, wrapping at its edges; a small ship off to one side of the name turns toward the
   nearest and fires now and then, and a rock it hits splits in two, the smallest into dust. When
   the field thins, more rocks drift in. The field comes from the seed, so ?ambientSeed=<n>
   replays it. */
export var SIZES = [34, 19, 10];
var SHOT_SPEED = 5, SHOT_LIFE = 70, MIN_ROCKS = 4, TURN = 0.04;

/* A rock's outline: [points] corners at ragged distances from its middle. */
export function outline(rand, size) {
  var corners = 9 + Math.floor(rand() * 3), d = [];
  for (var k = 0; k < corners; k++) {
    var a = k / corners * Math.PI * 2, r = size * (0.72 + rand() * 0.36);
    d.push((k ? 'L' : 'M') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1));
  }
  return d.join('') + 'Z';
}

export default function rocks(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var field = [], shots = [], dust = [];
  var rockLayer = m.el('g');
  var ship = { x: 0, y: 0, angle: 0, el: m.el('path', { 'class': 'masthead-rocks-ship', d: 'M12 0L-8 -7L-4 0L-8 7Z' }), cooldown: 60, moveAt: 0, tx: 0, ty: 0 };

  function rock(size, x, y) {
    var a = rand() * Math.PI * 2, speed = (0.25 + rand() * 0.35) * (1 + size * 0.5);
    field.push({
      size: size, x: x, y: y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      turn: (rand() - 0.5) * 0.02, angle: rand() * 6.3,
      el: m.el('path', { 'class': 'masthead-rocks-rock', d: outline(rand, SIZES[size]) }, rockLayer)
    });
  }
  /* Rocks drifting in from the edges, clear of the ship. */
  function wave() {
    for (var k = 0; k < 4; k++) rock(0, rand() < 0.5 ? -30 : W + 30, 20 + rand() * (H - 40));
  }
  wave();
  for (var k = 0; k < 2; k++) rock(1, rand() * W, rand() * H);

  /* Somewhere for the ship to sit: off to one side of the name. */
  function berth() {
    var side = rand() < 0.5 ? 1 : -1;
    ship.tx = W / 2 + side * (360 + rand() * 180);
    ship.ty = 60 + rand() * (H - 120);
  }
  berth();
  ship.x = ship.tx; ship.y = ship.ty;

  function wrap(o, margin) {
    if (o.x < -margin) o.x += W + margin * 2; else if (o.x > W + margin) o.x -= W + margin * 2;
    if (o.y < -margin) o.y += H + margin * 2; else if (o.y > H + margin) o.y -= H + margin * 2;
  }
  function remove(el) { if (el.parentNode) el.parentNode.removeChild(el); }

  function nearest() {
    var best = null, bestD = Infinity;
    field.forEach(function (r) {
      var d = Math.hypot(r.x - ship.x, r.y - ship.y);
      if (r.x > 0 && r.x < W && r.y > 0 && r.y < H && d < bestD) { best = r; bestD = d; }
    });
    return best;
  }

  function draw() {
    var squeeze = (1 / m.stretch()).toFixed(4);
    field.forEach(function (r) {
      r.el.setAttribute('transform', 'translate(' + r.x.toFixed(1) + ' ' + r.y.toFixed(1) + ') scale(' + squeeze + ' 1) rotate(' + (r.angle * 57.3).toFixed(1) + ')');
    });
    ship.el.setAttribute('transform', 'translate(' + ship.x.toFixed(1) + ' ' + ship.y.toFixed(1) + ') scale(' + squeeze + ' 1) rotate(' + (ship.angle * 57.3).toFixed(1) + ')');
  }
  draw();

  return {
    interval: 40,
    step: function (n) {
      field.forEach(function (r) { r.x += r.vx; r.y += r.vy; r.angle += r.turn; wrap(r, 40); });

      // The ship eases toward its berth, now and then finds another, and turns toward its target.
      if (n >= ship.moveAt) { berth(); ship.moveAt = n + 300 + Math.floor(rand() * 300); }
      ship.x += (ship.tx - ship.x) * 0.01;
      ship.y += (ship.ty - ship.y) * 0.01;
      var target = nearest();
      if (target) {
        // Lead the target a little: where it will be when a shot gets there.
        var t = Math.hypot(target.x - ship.x, target.y - ship.y) / SHOT_SPEED;
        var want = Math.atan2(target.y + target.vy * t - ship.y, target.x + target.vx * t - ship.x);
        var diff = Math.atan2(Math.sin(want - ship.angle), Math.cos(want - ship.angle));
        ship.angle += Math.max(-TURN, Math.min(TURN, diff));
        if (--ship.cooldown <= 0 && Math.abs(diff) < 0.1) {
          shots.push({ x: ship.x, y: ship.y, vx: Math.cos(ship.angle) * SHOT_SPEED, vy: Math.sin(ship.angle) * SHOT_SPEED, life: SHOT_LIFE,
            el: m.el('path', { 'class': 'masthead-rocks-shot' }) });
          ship.cooldown = 35 + Math.floor(rand() * 40);
        }
      }

      shots = shots.filter(function (s) {
        s.x += s.vx; s.y += s.vy; s.life -= 1;
        var hit = null;
        field.forEach(function (r) { if (!hit && Math.hypot(r.x - s.x, r.y - s.y) < SIZES[r.size] * 0.85) hit = r; });
        if (hit) {
          field.splice(field.indexOf(hit), 1);
          remove(hit.el);
          if (hit.size < SIZES.length - 1) { rock(hit.size + 1, hit.x, hit.y); rock(hit.size + 1, hit.x, hit.y); }
          for (var k = 0; k < 5; k++) {
            var a = rand() * 6.3;
            dust.push({ x: hit.x, y: hit.y, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2, life: 26, el: m.el('circle', { r: 1.2, 'class': 'masthead-rocks-dust' }) });
          }
        }
        if (hit || s.life <= 0 || s.x < 0 || s.x > W || s.y < 0 || s.y > H) { remove(s.el); return false; }
        s.el.setAttribute('d', 'M' + s.x.toFixed(1) + ' ' + s.y.toFixed(1) + 'l' + (-s.vx * 1.2).toFixed(1) + ' ' + (-s.vy * 1.2).toFixed(1));
        return true;
      });

      dust = dust.filter(function (d) {
        d.x += d.vx; d.y += d.vy; d.life -= 1;
        if (d.life <= 0) { remove(d.el); return false; }
        d.el.setAttribute('cx', d.x.toFixed(1)); d.el.setAttribute('cy', d.y.toFixed(1));
        d.el.setAttribute('opacity', (d.life / 26).toFixed(2));
        return true;
      });

      if (field.length < MIN_ROCKS) wave();
      draw();
    }
  };
}
