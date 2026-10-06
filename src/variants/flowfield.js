/* Flow field: a slow current across the masthead, like wind over water or iron filings in a
   drifting field. A faint scatter of short strokes turns to follow it, and a few motes ride it,
   trailing short tails, born and fading. The current is a few sines of x, y and the step, so its
   pattern drifts too. It runs strongest low, below the tagline, and faintest behind the name.
   The field's shape and the motes come from the seed, so ?ambientSeed=<n> replays a run. A click
   drops an eddy there that swirls the current for a few seconds and dies away.

   The field is worked out on screen, not in the stretched art, so a stroke at 45 degrees looks
   it however wide the masthead is drawn: x is taken times m.stretch(), and a direction is drawn
   back into the art with its x divided by it. */
export var MOTES = 40, TAIL = 12, STROKE = 13;
var SPEED = 2, EDDY_STEPS = 110, EDDY_RADIUS = 70;

/* How strongly a height shows, 0 to 1: full below the tagline, faint behind the name, a little
   more along the top. */
export function weight(y) {
  if (y >= 236) return 1;
  if (y >= 206) return 0.16 + 0.84 * (y - 206) / 30;
  if (y >= 70) return 0.16;
  if (y >= 40) return 0.16 + 0.2 * (70 - y) / 30;
  return 0.36;
}

/* The field's own shape, from [rand]: the waves' sizes, slants, speeds and phases. */
export function shape(rand) {
  var waves = [];
  for (var k = 0; k < 3; k++) {
    waves.push({
      kx: (0.003 + rand() * 0.006) * (rand() < 0.5 ? -1 : 1),
      ky: (0.006 + rand() * 0.012) * (rand() < 0.5 ? -1 : 1),
      w: (0.004 + rand() * 0.006) * (rand() < 0.5 ? -1 : 1),
      p: rand() * 6.283,
      a: [0.75, 0.5, 0.3][k]
    });
  }
  return { drift: (rand() - 0.5) * 0.6, waves: waves };
}

/* The current's direction at screen point (sx, y) at step [n], as a unit vector { x, y } on
   screen, with any [eddies] (each { x, y, strength, spin }, at screen x) swirling it. */
export function current(field, sx, y, n, eddies) {
  var a = field.drift + 0.25 * Math.sin(n * 0.0021);
  field.waves.forEach(function (wv) { a += wv.a * Math.sin(sx * wv.kx + y * wv.ky + n * wv.w + wv.p); });
  // Flattened a little, so it runs across more than up and down, as wind over water does.
  var vx = Math.cos(a), vy = Math.sin(a) * 0.6;
  (eddies || []).forEach(function (e) {
    var dx = sx - e.x, dy = y - e.y, d2 = dx * dx + dy * dy;
    var d = Math.sqrt(d2) || 1;
    var pull = e.strength * 3 * Math.exp(-d2 / (EDDY_RADIUS * EDDY_RADIUS));
    vx += -dy / d * e.spin * pull;
    vy += dx / d * e.spin * pull;
  });
  var len = Math.sqrt(vx * vx + vy * vy) || 1;
  return { x: vx / len, y: vy / len };
}

export default function flowfield(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var field = shape(rand);

  // The strokes: a jittered grid, closer together low. Three bands, each one path.
  var rows = [16, 44, 84, 124, 164, 204, 234, 254, 274, 294, 312];
  var bands = [0, 1, 2].map(function (k) {
    return { el: m.el('path', { 'class': 'masthead-flowfield-grid masthead-flowfield-band-' + k }), points: [] };
  });
  rows.forEach(function (ry) {
    var cols = ry >= 230 ? 64 : 40, band = ry >= 230 ? 2 : ry < 60 ? 1 : 0;
    for (var c = 0; c < cols; c++) {
      bands[band].points.push({ x: (c + 0.2 + rand() * 0.6) * W / cols, y: ry + (rand() - 0.5) * 10, len: STROKE * (0.7 + rand() * 0.6) });
    }
  });

  // The motes: mostly born low, a few anywhere (where the name dims them).
  var motes = [];
  function birth(mote, n, x, y) {
    mote.x = x !== undefined ? x : rand() * W;
    mote.y = y !== undefined ? y : rand() < 0.75 ? 228 + rand() * 90 : 10 + rand() * 300;
    mote.age = 0;
    mote.life = 90 + Math.floor(rand() * 140);
    mote.speed = SPEED * (0.7 + rand() * 0.6);
    mote.trail = [mote.x, mote.y];
  }
  for (var i = 0; i < MOTES; i++) {
    var mote = { el: m.el('path', { 'class': 'masthead-flowfield-mote', 'stroke-opacity': '0' }) };
    birth(mote, 0);
    // Staggered, so they don't all fade together.
    mote.age = Math.floor(rand() * mote.life * 0.8);
    motes.push(mote);
  }

  var eddies = [];

  function drawGrid(n, s) {
    var screenEddies = eddies.map(function (e) { return { x: e.x * s, y: e.y, strength: e.strength, spin: e.spin }; });
    bands.forEach(function (band) {
      var d = [];
      band.points.forEach(function (p) {
        var v = current(field, p.x * s, p.y, n, screenEddies);
        var hx = v.x * p.len / 2 / s, hy = v.y * p.len / 2;
        d.push('M' + (p.x - hx).toFixed(1) + ' ' + (p.y - hy).toFixed(1) + 'l' + (2 * hx).toFixed(1) + ' ' + (2 * hy).toFixed(1));
      });
      band.el.setAttribute('d', d.join(''));
    });
    return screenEddies;
  }

  function moveMotes(n, s, screenEddies) {
    motes.forEach(function (mt) {
      mt.age++;
      var v = current(field, mt.x * s, mt.y, n, screenEddies);
      mt.x += v.x * mt.speed / s;
      mt.y += v.y * mt.speed;
      if (mt.age > mt.life || mt.x < -20 || mt.x > W + 20 || mt.y < -10 || mt.y > H + 10) {
        birth(mt, n);
        mt.el.setAttribute('stroke-opacity', '0');
        return;
      }
      mt.trail.push(mt.x, mt.y);
      if (mt.trail.length > TAIL * 2) mt.trail.splice(0, 2);
      var d = 'M' + mt.trail[0].toFixed(1) + ' ' + mt.trail[1].toFixed(1);
      for (var k = 2; k < mt.trail.length; k += 2) d += 'L' + mt.trail[k].toFixed(1) + ' ' + mt.trail[k + 1].toFixed(1);
      mt.el.setAttribute('d', d);
      var fade = Math.min(1, mt.age / 20, (mt.life - mt.age) / 30);
      mt.el.setAttribute('stroke-opacity', (Math.max(0, fade) * weight(mt.y)).toFixed(2));
    });
  }

  drawGrid(0, m.stretch());

  return {
    interval: 40,
    step: function (n) {
      eddies = eddies.filter(function (e) { e.strength = Math.max(0, 1 - (n - e.born) / EDDY_STEPS); return e.strength > 0; });
      var s = m.stretch();
      // The strokes turn slowly; every other step is enough, unless an eddy is swirling them.
      var screenEddies = (n % 2 === 0 || eddies.length) ? drawGrid(n, s)
        : eddies.map(function (e) { return { x: e.x * s, y: e.y, strength: e.strength, spin: e.spin }; });
      moveMotes(n, s, screenEddies);
    },
    poke: function (x, y, n) {
      var spin = eddies.length % 2 ? -1 : 1;
      eddies.push({ x: x, y: y, born: n, strength: 1, spin: spin });
      if (eddies.length > 4) eddies.shift();
      // A few motes are caught up in it, so the swirl shows.
      for (var k = 0; k < 5; k++) {
        var mt = motes[(n + k * 7) % MOTES], ang = k * 1.2566;
        birth(mt, n, x + Math.cos(ang) * 30 / m.stretch(), y + Math.sin(ang) * 30);
        mt.life = 80 + k * 10;
        mt.age = 10;
      }
    }
  };
}
