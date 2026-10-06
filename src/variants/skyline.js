/* Skyline: a city at night along the foot of the masthead, in outline: a row of buildings of
   varied heights and widths, some stepped back, some with a spire, a mast or a water tower, and a
   fainter, taller row behind. Windows light and go dark one at a time. Now and then a shower
   passes, faint rain slanting down, and during one, rarely, lightning: a thin bolt off to one side
   of the name and a soft brightening of the sky. The city and its weather come from the seed, so
   ?ambientSeed=<n> replays them. A click on a building lights a cluster of its windows; a click
   in the sky calls lightning down there. */
export var GROUND = 304;
export var DROPS = 40;
export var BOLT_STEPS = 8;
export var GLOW_STEPS = 30;
var SLANT = 0.3, LIT = 0.35, RAMP = 0.004;
// How the bolt flickers over its few steps, and how far the brightening goes.
var FLICKER = [0.9, 0.3, 0.85, 0.6, 0.4, 0.25, 0.12, 0.05], GLOW = 0.3;

/* A row of buildings across [width]: where each stands, how wide and tall, any setback, and what
   stands on its roof. The near row keeps low behind the name; the far row is taller. */
export function city(rand, width, far) {
  var out = [], x = -10 + rand() * 16;
  while (x < width) {
    var w = far ? 40 + rand() * 50 : 34 + rand() * 46;
    var nearName = Math.abs(x + w / 2 - width / 2) < 250;
    var h = far ? (nearName ? 60 + rand() * 90 : 80 + rand() * 90)
      : nearName ? 22 + rand() * 38 : rand() < 0.18 ? 110 + rand() * 40 : 36 + rand() * 66;
    var b = { x: x, w: w, h: h, setback: null, roof: null };
    if (h > 55 && rand() < 0.45) b.setback = { inset: w * (0.15 + rand() * 0.15), at: h * (0.55 + rand() * 0.2) };
    var r = rand();
    if (h > 85 && r < 0.5) b.roof = r < 0.25 ? 'spire' : 'mast';
    else if (!far && h < 85 && r < 0.3) b.roof = 'tank';
    out.push(b);
    // Mostly shoulder to shoulder; now and then a street or a little park.
    x += w + (rand() < 0.12 ? 18 + rand() * 24 : rand() * 6);
  }
  return out;
}

/* A building's outline, standing on [ground]. */
export function outline(b, ground) {
  var x0 = b.x, x1 = b.x + b.w, top = ground - b.h;
  if (!b.setback) return 'M' + x0.toFixed(1) + ' ' + ground + 'V' + top.toFixed(1) + 'H' + x1.toFixed(1) + 'V' + ground;
  var shoulder = ground - b.setback.at, i = b.setback.inset;
  return 'M' + x0.toFixed(1) + ' ' + ground + 'V' + shoulder.toFixed(1) + 'H' + (x0 + i).toFixed(1) + 'V' + top.toFixed(1) +
    'H' + (x1 - i).toFixed(1) + 'V' + shoulder.toFixed(1) + 'H' + x1.toFixed(1) + 'V' + ground;
}

/* A jagged bolt from the origin down [length], in its own units (drawn counter-scaled), with a
   short fork partway down. */
export function bolt(rand, length) {
  var x = 0, y = 0, d = 'M0 0', fork = '', forkAt = length * (0.3 + rand() * 0.3);
  while (y < length) {
    y = Math.min(length, y + 9 + rand() * 13);
    x += (rand() - 0.5) * 18;
    d += 'L' + x.toFixed(1) + ' ' + y.toFixed(1);
    if (!fork && y > forkAt) {
      var fx = x, fy = y, dir = rand() < 0.5 ? -1 : 1;
      fork = 'M' + fx.toFixed(1) + ' ' + fy.toFixed(1);
      for (var k = 0; k < 3; k++) {
        fx += dir * (5 + rand() * 9); fy += 7 + rand() * 9;
        fork += 'L' + fx.toFixed(1) + ' ' + fy.toFixed(1);
      }
    }
  }
  return d + fork;
}

export default function skyline(layer, m) {
  var W = m.width;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  // Back to front: the sky's glow, the bolt, the far row, the near row and its windows, the rain.
  // The glow is its own gradient, fading right out at its rim, so it has no edge.
  var sky = m.el('radialGradient', { id: 'masthead-skyline-sky' }, m.el('defs'));
  [['0%', '0.9'], ['45%', '0.35'], ['100%', '0']].forEach(function (s) {
    m.el('stop', { offset: s[0], 'class': 'masthead-glow', 'stop-opacity': s[1] }, sky);
  });
  var glow = m.el('ellipse', { 'class': 'masthead-skyline-glow', fill: 'url(#masthead-skyline-sky)', rx: 340, ry: 260, opacity: 0 });
  var boltEl = m.el('path', { 'class': 'masthead-skyline-bolt', opacity: 0 });
  var farEl = m.el('g', { 'class': 'masthead-skyline-far' });
  var nearEl = m.el('g', { 'class': 'masthead-skyline-near' });
  var windowEl = m.el('g', { 'class': 'masthead-skyline-windows' });
  var tanks = [];

  function roof(b, parent) {
    var top = GROUND - b.h, cx = b.x + b.w / 2;
    if (b.roof === 'spire') m.el('path', { 'class': 'masthead-skyline-roof', d: 'M' + (cx - 3).toFixed(1) + ' ' + top.toFixed(1) + 'L' + cx.toFixed(1) + ' ' + (top - b.h * 0.22).toFixed(1) + 'L' + (cx + 3).toFixed(1) + ' ' + top.toFixed(1) }, parent);
    if (b.roof === 'mast') m.el('path', { 'class': 'masthead-skyline-roof', d: 'M' + cx.toFixed(1) + ' ' + top.toFixed(1) + 'V' + (top - 18 - b.h * 0.12).toFixed(1) + 'M' + (cx - 4).toFixed(1) + ' ' + (top - 10).toFixed(1) + 'H' + (cx + 4).toFixed(1) }, parent);
    if (b.roof === 'tank') {
      // A wooden water tank on legs, kept in shape however the masthead is stretched.
      var g = m.el('g', { 'class': 'masthead-skyline-tank' }, parent);
      m.el('path', { d: 'M-4 0L-3 -7M4 0L3 -7M-5 -7H5V-16H-5ZM-6 -16L0 -21L6 -16', 'class': 'masthead-skyline-roof' }, g);
      tanks.push({ g: g, x: b.x + b.w * (0.25 + rand() * 0.5), y: top });
    }
  }

  city(rand, W, true).forEach(function (b) {
    m.el('path', { 'class': 'masthead-skyline-building', d: outline(b, GROUND) }, farEl);
    roof(b, farEl);
  });
  var near = city(rand, W, false);

  // The windows: a fixed scatter of places on each near building, about a third lit at a time.
  var windows = [];
  near.forEach(function (b) {
    m.el('path', { 'class': 'masthead-skyline-building', d: outline(b, GROUND) }, nearEl);
    roof(b, nearEl);
    b.windows = [];
    var cols = Math.floor((b.w - 6) / 9);
    var left = b.x + (b.w - cols * 9) / 2 + 3;
    for (var y = GROUND - 12; y > GROUND - b.h + 4; y -= 11) {
      var inset = b.setback && y < GROUND - b.setback.at + 4 ? Math.ceil(b.setback.inset / 9) : 0;
      for (var c = inset; c < cols - inset; c++) {
        if (rand() > 0.3) continue;
        var lit = rand() < LIT;
        var win = { x: left + c * 9, y: y, lit: lit,
          el: m.el('rect', { 'class': 'masthead-skyline-window', x: (left + c * 9).toFixed(1), y: y, width: 3, height: 4, opacity: lit ? 1 : 0 }, windowEl) };
        windows.push(win);
        b.windows.push(win);
      }
    }
  });
  function light(win, on) { win.lit = on; win.el.setAttribute('opacity', on ? 1 : 0); }

  m.el('path', { 'class': 'masthead-skyline-ground', d: 'M0 ' + GROUND + 'H' + W });
  // Wet street: a few short glints below the ground line that shimmer while it rains.
  var glints = [];
  for (var k = 0; k < 10; k++) {
    var gx = 30 + rand() * (W - 60), gy = GROUND + 4 + rand() * 10, gw = 8 + rand() * 18;
    glints.push(m.el('path', { 'class': 'masthead-skyline-glint', d: 'M' + gx.toFixed(1) + ' ' + gy.toFixed(1) + 'h' + gw.toFixed(1), opacity: 0 }));
  }

  // The rain: a fixed pool of streaks, as many falling as the shower is heavy.
  var wind = rand() < 0.5 ? -1 : 1;
  var rainEl = m.el('g', { 'class': 'masthead-skyline-rain' });
  var drops = [];
  for (var d = 0; d < DROPS; d++) drops.push({ falling: false, x: 0, y: 0, len: 0, speed: 0, el: m.el('path', { d: '' }, rainEl) });
  function spawn(drop, anywhere) {
    drop.falling = true;
    drop.len = 12 + rand() * 12;
    drop.speed = 9 + rand() * 4;
    drop.y = anywhere ? rand() * GROUND : -rand() * 60;
    drop.x = -80 + rand() * (W + 160);
  }

  var rain = 0, target = 0, nextWeather = 120 + Math.floor(rand() * 240), nextBolt = 150 + Math.floor(rand() * 300);
  var strike = null, lastStretch = 0;

  /* Lightning: a bolt from the top of the sky down to (x, y), and a soft glow round it. */
  function flash(x, y) {
    strike = { x: x, y: y, age: 0 };
    boltEl.setAttribute('d', bolt(rand, y));
    boltEl.setAttribute('transform', 'translate(' + x.toFixed(1) + ' 0) scale(' + (1 / m.stretch()).toFixed(4) + ' 1)');
    glow.setAttribute('cx', x.toFixed(1));
    glow.setAttribute('cy', (y * 0.6).toFixed(1));
  }

  function draw() {
    var s = m.stretch();
    if (s !== lastStretch) {
      lastStretch = s;
      tanks.forEach(function (t) { t.g.setAttribute('transform', 'translate(' + t.x.toFixed(1) + ' ' + t.y.toFixed(1) + ') scale(' + (1 / s).toFixed(4) + ' 1)'); });
    }
    var lean = wind * SLANT / s;
    drops.forEach(function (drop) {
      drop.el.setAttribute('d', drop.falling
        ? 'M' + drop.x.toFixed(1) + ' ' + drop.y.toFixed(1) + 'l' + (-lean * drop.len).toFixed(1) + ' ' + (-drop.len).toFixed(1) : '');
    });
  }
  draw();

  return {
    interval: 50,
    step: function (n) {
      // Showers come and go: a dry spell, then rain easing in, falling a while, and easing off.
      if (--nextWeather <= 0) {
        if (target === 0) { target = 0.55 + rand() * 0.45; nextWeather = 700 + Math.floor(rand() * 1000); }
        else { target = 0; nextWeather = 900 + Math.floor(rand() * 1500); }
      }
      rain += Math.max(-RAMP, Math.min(RAMP, target - rain));
      var lean = wind * SLANT / m.stretch();
      var heavy = Math.round(rain * DROPS);
      drops.forEach(function (drop, i) {
        if (drop.falling) {
          drop.y += drop.speed;
          drop.x += lean * drop.speed;
          if (drop.y - drop.len > GROUND) drop.falling = false;
        }
        if (!drop.falling && i < heavy && rand() < 0.08) spawn(drop, false);
      });
      if (n % 4 === 0) {
        glints.forEach(function (g, i) {
          g.setAttribute('opacity', rain > 0.05 ? (rain * (0.4 + 0.6 * Math.abs(Math.sin(n * 0.03 + i * 1.7)))).toFixed(2) : 0);
        });
      }

      // Lightning, rarely, and only in a good shower: off to one side of the name.
      if (rain > 0.5 && --nextBolt <= 0) {
        flash(rand() < 0.5 ? 60 + rand() * 240 : W - 300 + rand() * 240, 150 + rand() * 70);
        nextBolt = 400 + Math.floor(rand() * 800);
      }
      if (strike) {
        var t = strike.age++;
        boltEl.setAttribute('opacity', t < BOLT_STEPS ? FLICKER[t] : 0);
        var g = Math.max(0, 1 - t / GLOW_STEPS);
        g = t < 2 ? (t + 1) / 3 : g * g;
        glow.setAttribute('opacity', (GLOW * g).toFixed(3));
        nearEl.setAttribute('opacity', (0.85 + 0.15 * g).toFixed(3));
        farEl.setAttribute('opacity', (0.85 + 0.15 * g).toFixed(3));
        if (t >= GLOW_STEPS) strike = null;
      }

      // A window goes dark or comes on, every half second or so.
      if (windows.length && n % 9 === 0) {
        var win = windows[Math.floor(rand() * windows.length)];
        if (win.lit) light(win, false);
        else if (rand() < LIT / (1 - LIT)) light(win, true);
      }
      draw();
    },
    // A click on a near building lights the windows round it; anywhere else, lightning there.
    poke: function (x, y) {
      var hit = null;
      near.forEach(function (b) { if (x >= b.x && x <= b.x + b.w && y >= GROUND - b.h - 4 && y <= GROUND + 4) hit = b; });
      if (hit && hit.windows.length) {
        hit.windows.slice().sort(function (a, b) {
          return Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y);
        }).slice(0, 8).forEach(function (win) { light(win, true); });
        return;
      }
      if (!hit) flash(x, Math.max(60, Math.min(y, GROUND - 10)));
    }
  };
}
