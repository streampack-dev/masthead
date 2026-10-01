/* Graveyard: a full moon to one side of the name, thin clouds drifting across it, and along the
   foot of the masthead a low hill of headstones and bare trees with fog curling between them; now
   and then a bat crosses the moon, and a little ghost rises from behind a headstone, looks about
   over the top, and sinks back. The scene comes from the seed, so ?ambientSeed=<n> replays it.
   An October animation. */

/* A small bat against the moon, its wings at [flap] (-1 down to 1 up). */
function bat(flap) {
  return 'M0 -2L-5 -3Q-10 ' + (-4 - flap * 4).toFixed(1) + ' -14 ' + (-3 - flap * 6).toFixed(1) + 'Q-11 0 -8 1Q-5 0 0 2Q5 0 8 1Q11 0 14 ' + (-3 - flap * 6).toFixed(1) +
    'Q10 ' + (-4 - flap * 4).toFixed(1) + ' 5 -3Z';
}

/* A bare tree [h] tall at the origin: a trunk forking into thinning branches. */
export function tree(rand, h) {
  var d = '';
  function branch(x, y, angle, len, depth) {
    var x2 = x + Math.sin(angle) * len, y2 = y - Math.cos(angle) * len;
    d += 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1);
    if (depth === 0) return;
    var forks = depth > 2 ? 2 : 2 + (rand() < 0.4 ? 1 : 0);
    for (var k = 0; k < forks; k++) {
      branch(x2, y2, angle + (k / (forks - 1) - 0.5) * (0.9 + rand() * 0.5), len * (0.62 + rand() * 0.15), depth - 1);
    }
  }
  branch(0, 0, (rand() - 0.5) * 0.15, h * 0.38, 4);
  return d;
}

export default function graveyard(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  // The moon, to one side of the name, with a few craters.
  var side = rand() < 0.5 ? -1 : 1, moon = { x: W / 2 + side * (380 + rand() * 120), y: 78, r: 40 };
  var moonEl = m.el('g', { 'class': 'masthead-graveyard-moon' });
  m.el('circle', { r: moon.r * 1.6, fill: m.pulse, 'class': 'masthead-graveyard-halo' }, moonEl);
  m.el('circle', { r: moon.r, 'class': 'masthead-graveyard-face' }, moonEl);
  m.el('path', { 'class': 'masthead-graveyard-crater', d: 'M-12 -10a7 7 0 1 0 0.1 0zM14 4a5 5 0 1 0 0.1 0zM-4 16a4 4 0 1 0 0.1 0z' }, moonEl);

  // Clouds: thin wisps, drifting slowly across.
  var clouds = [];
  for (var c = 0; c < 3; c++) {
    clouds.push({ x: rand() * W, y: 40 + rand() * 80, w: 90 + rand() * 120, speed: 0.12 + rand() * 0.15,
      el: m.el('path', { 'class': 'masthead-graveyard-cloud' }) });
  }

  // The hill, and on it headstones and two bare trees.
  var hill = function (x) { return H - 18 - 10 * Math.sin(x * 0.005 + 1) - 5 * Math.sin(x * 0.013); };
  var line = [];
  for (var x = 0; x <= W; x += 12) line.push((x ? 'L' : 'M') + x + ' ' + hill(x).toFixed(1));
  m.el('path', { 'class': 'masthead-graveyard-hill', d: line.join('') });
  // The little ghost: behind the stones, and hidden below the ground, so it rises from behind one.
  var ground = ['M0 0H' + W];
  for (var gx = W; gx >= 0; gx -= 12) ground.push('L' + gx + ' ' + (hill(gx) + 3).toFixed(1));
  var defs = m.el('defs');
  m.el('path', { d: ground.join('') + 'Z' }, m.el('clipPath', { id: 'masthead-graveyard-ground' }, defs));
  var peekLayer = m.el('g', { 'clip-path': 'url(#masthead-graveyard-ground)' });
  var peeker = m.el('g', { 'class': 'masthead-graveyard-ghost', opacity: 0 }, peekLayer);
  m.el('path', { 'class': 'masthead-graveyard-sheet', d: 'M-8 -16A8 8 0 0 1 8 -16L9 0Q7 3 4.5 0Q2 3 0 0Q-2 3 -4.5 0Q-7 3 -9 0Z' }, peeker);
  var peekEyes = m.el('path', { 'class': 'masthead-graveyard-eyes' }, peeker);
  var headstones = [];

  var sx = 40 + rand() * 40;
  while (sx < W - 40) {
    var y = hill(sx) + 3, h = 16 + rand() * 12, w = 12 + rand() * 6, kind = rand();
    var d = kind < 0.6
      // A rounded headstone, leaning a little.
      ? 'M' + (-w / 2) + ' 0V' + (-h + w / 2).toFixed(1) + 'A' + (w / 2) + ' ' + (w / 2) + ' 0 0 1 ' + (w / 2) + ' ' + (-h + w / 2).toFixed(1) + 'V0'
      : kind < 0.85
        // A cross.
        ? 'M0 0V' + (-h - 6).toFixed(1) + 'M-6 ' + (-h + 2).toFixed(1) + 'H6'
        // A flat slab.
        : 'M' + (-w * 0.7) + ' 0V-7H' + (w * 0.7) + 'V0';
    var g = m.el('g', { transform: 'translate(' + sx.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ((rand() - 0.5) * 10).toFixed(1) + ')' });
    m.el('path', { 'class': 'masthead-graveyard-stone', d: d }, g);
    if (kind < 0.6) headstones.push({ x: sx, y: y, h: h });
    sx += 45 + rand() * 70;
  }
  [W / 2 + side * -(300 + rand() * 120), W / 2 + side * (180 + rand() * 60)].forEach(function (tx) {
    m.el('path', { 'class': 'masthead-graveyard-tree', d: tree(rand, 90 + rand() * 40), transform: 'translate(' + tx.toFixed(1) + ' ' + hill(tx).toFixed(1) + ')' });
  });

  // Fog: long, faint wisps along the ground, drifting.
  var fog = [];
  for (var f = 0; f < 4; f++) {
    fog.push({ x: rand() * W, y: H - 14 - rand() * 26, w: 200 + rand() * 260, speed: (rand() < 0.5 ? -1 : 1) * (0.2 + rand() * 0.25),
      el: m.el('path', { 'class': 'masthead-graveyard-fog' }) });
  }

  var batEl = m.el('path', { 'class': 'masthead-graveyard-bat', opacity: 0 });
  var flight = null, nextBat = 200;
  var peek = null, nextPeek = 80 + Math.floor(rand() * 120), RISE = 30, LOOK = 110;

  /* The little ghost: rising from the ground behind its stone until its head clears the top,
     glancing one way and the other, then sinking back. */
  function drawPeek(n) {
    if (!peek) { peeker.setAttribute('opacity', 0); return; }
    var t = peek.age, total = RISE * 2 + LOOK;
    var up = t < RISE ? t / RISE : t < RISE + LOOK ? 1 : Math.max(0, (total - t) / RISE);
    up = (1 - Math.cos(Math.PI * up)) / 2;
    var hem = peek.stone.y + 26 - up * (peek.stone.h + 14);
    peeker.setAttribute('opacity', 1);
    peeker.setAttribute('transform', 'translate(' + (peek.stone.x + peek.side * 3).toFixed(1) + ' ' + hem.toFixed(1) + ') scale(' + (1 / m.stretch()).toFixed(4) + ' 1)');
    var look = t > RISE && t < RISE + LOOK ? Math.round(Math.sin((t - RISE) * 0.06) * 2) : 0;
    peekEyes.setAttribute('d', 'M' + (-3.2 + look) + ' -16a1.3 1.9 0 1 0 0.1 0zM' + (3.2 + look) + ' -16a1.3 1.9 0 1 0 0.1 0z');
  }

  function wisp(o, wave) {
    var d = 'M' + o.x.toFixed(1) + ' ' + o.y.toFixed(1);
    for (var k = 1; k <= 6; k++) {
      d += 'Q' + (o.x + o.w * (k - 0.5) / 6).toFixed(1) + ' ' + (o.y - 4 + Math.sin(wave + k) * 3).toFixed(1) + ' ' + (o.x + o.w * k / 6).toFixed(1) + ' ' + o.y.toFixed(1);
    }
    return d;
  }

  function draw(n) {
    var squeeze = 1 / m.stretch();
    moonEl.setAttribute('transform', 'translate(' + moon.x.toFixed(1) + ' ' + moon.y + ') scale(' + squeeze.toFixed(4) + ' 1)');
    clouds.forEach(function (c) { c.el.setAttribute('d', wisp(c, n * 0.01)); });
    fog.forEach(function (o) { o.el.setAttribute('d', wisp(o, n * 0.02 + o.y)); });
    if (flight) {
      batEl.setAttribute('d', bat(Math.sin(n * 0.32)));
      batEl.setAttribute('transform', 'translate(' + flight.x.toFixed(1) + ' ' + (flight.y + Math.sin(n * 0.08) * 6).toFixed(1) + ') scale(' + (squeeze * flight.dir).toFixed(4) + ' 1)');
    }
  }
  draw(0);

  return {
    interval: 50,
    step: function (n) {
      clouds.forEach(function (c) { c.x += c.speed; if (c.x > W + 20) c.x = -c.w - 20; });
      fog.forEach(function (o) {
        o.x += o.speed;
        if (o.speed > 0 && o.x > W + 20) o.x = -o.w - 20;
        if (o.speed < 0 && o.x + o.w < -20) o.x = W + 20;
      });
      // Now and then the little ghost peeks over a headstone.
      if (!peek && headstones.length && --nextPeek <= 0) {
        peek = { stone: headstones[Math.floor(rand() * headstones.length)], age: 0, side: rand() < 0.5 ? -1 : 1 };
      }
      if (peek && ++peek.age > RISE * 2 + LOOK) { peek = null; nextPeek = 150 + Math.floor(rand() * 300); }
      drawPeek(n);
      // Now and then a bat crosses the moon.
      if (!flight && --nextBat <= 0) {
        var dir = rand() < 0.5 ? 1 : -1;
        flight = { dir: dir, x: dir > 0 ? moon.x - 200 : moon.x + 200, y: moon.y + (rand() - 0.5) * 30 };
        batEl.setAttribute('opacity', 1);
      }
      if (flight) {
        flight.x += flight.dir * 1.8;
        if (Math.abs(flight.x - moon.x) > 210) { flight = null; batEl.setAttribute('opacity', 0); nextBat = 300 + Math.floor(rand() * 400); }
      }
      draw(n);
    }
  };
}
