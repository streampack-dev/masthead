/* Drips: wet paint in real colours gathered along the top edge, and now and then a drip letting
   go: it runs down fast at first, then slows and thickens, a round bead swelling at its tip, until
   it stops, and stays. Now and then a bead lets go and falls, leaving a spot lower down. Most
   drips are short; only now and then a long one runs down past the name. Once enough has run,
   the paint fades and a fresh band gathers. The colours are the paint palette in masthead.css
   (--masthead-paint-1 to -9), by class, so a site can change them, and where paint overlaps it
   mixes as pigment does. It all comes from the seed, so ?ambientSeed=<n> replays it. A click
   splatters paint there, and a drip or two runs down from the splash. */
export var PAINTS = 9;
export var MOVING = 3;
export var CAP = 260;
export var GROW = 40, REST = 50, FADE = 90;
export var LONG = 0.07;
var TOP = -4;

/* How far down a drip has run, 0 to 1, at [u] of its time: fast at first, slowing to a stop. */
export function fall(u) { u = Math.min(1, Math.max(0, u)); return 1 - Math.pow(1 - u, 2.6); }

function f(v) { return v.toFixed(1); }

/* A drip's outline as one path, so it never overlaps itself: a flare where it leaves the paint
   above (half-width [flare]), a body of half-width [w] narrowing a little, and the round bead of
   radius [r] at its tip, [len] below [y0]. Widths are divided by [s], the stretch, so the bead
   stays round on screen. */
export function dripPath(x, y0, len, w, r, flare, lean, s) {
  var tx = x + lean / s, ty = y0 + len;
  var wt = Math.min(w * 0.72, r * 0.85);
  var yb = ty - r * Math.sqrt(1 - (wt / r) * (wt / r));
  var fh = Math.max(0, Math.min(12, len * 0.4, yb - y0));
  return 'M' + f(x - flare / s) + ' ' + f(y0 - 5) +
    'Q' + f(x - w / s) + ' ' + f(y0 - 1) + ' ' + f(x - w / s) + ' ' + f(y0 + fh) +
    'L' + f(tx - wt / s) + ' ' + f(yb) +
    'A' + f(r / s) + ' ' + f(r) + ' 0 1 0 ' + f(tx + wt / s) + ' ' + f(yb) +
    'L' + f(x + w / s) + ' ' + f(y0 + fh) +
    'Q' + f(x + w / s) + ' ' + f(y0 - 1) + ' ' + f(x + flare / s) + ' ' + f(y0 - 5) + 'Z';
}

/* How deep a pool of the band hangs at [x], [grow] of the way gathered: round at its ends,
   wavering along its edge. */
export function edge(pool, x, grow) {
  var t = (x - pool.x0) / (pool.x1 - pool.x0);
  if (t <= 0 || t >= 1) return 0;
  var wob = 0.78 + 0.16 * Math.sin(x * pool.f1 + pool.p1) + 0.1 * Math.sin(x * pool.f2 + pool.p2);
  return pool.depth * Math.pow(Math.sin(Math.PI * t), 0.45) * wob * grow;
}

export default function drips(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  function paint(not) {
    var p;
    do { p = 1 + Math.floor(rand() * PAINTS); } while (p === not);
    return p;
  }

  // The wet paint: a group for each colour, so one colour runs together and two mix (see
  // masthead.css).
  var wet, groups, pools, moving, waiting, falling, count, started, target, phase, phaseAt, nextAt;

  /* A shape of [kind] in paint [p]. */
  function add(tag, kind, p, attrs) {
    count += 1;
    attrs['class'] = 'masthead-drips-' + kind;
    return m.el(tag, attrs, groups[p]);
  }

  /* A fresh band along the top: pools of paint, each overlapping the next a little. */
  function begin(n) {
    if (wet) layer.removeChild(wet);
    wet = m.el('g', { 'class': 'masthead-drips-wet' });
    groups = [null];
    for (var g = 1; g <= PAINTS; g++) groups.push(m.el('g', { 'class': 'masthead-drips-paint masthead-drips-paint-' + g }, wet));
    pools = [];
    moving = [];
    waiting = [];
    falling = [];
    count = 0;
    started = 0;
    target = 22 + Math.floor(rand() * 9);
    phase = 'grow';
    phaseAt = n;
    nextAt = n + GROW + 10 + Math.floor(rand() * 20);
    // The pools' colours dealt from the whole palette, shuffled, so each band has most of them.
    var x = -20 - rand() * 30, last = 0, deck = [];
    while (x < W + 10) {
      var len = 90 + rand() * 170;
      if (!deck.length) {
        for (var c = 1; c <= PAINTS; c++) deck.splice(Math.floor(rand() * (deck.length + 1)), 0, c);
        if (deck[deck.length - 1] === last) deck.unshift(deck.pop());
      }
      var p = deck.pop();
      last = p;
      pools.push({
        x0: x, x1: x + len, p: p, depth: 9 + rand() * 13,
        f1: 0.02 + rand() * 0.03, p1: rand() * 6.3, f2: 0.07 + rand() * 0.06, p2: rand() * 6.3,
        el: add('path', 'band', p, {})
      });
      // Mostly overlapping the next, where the colours mix; now and then a little gap.
      x += len - (rand() < 0.2 ? -6 - rand() * 14 : 15 + rand() * 35);
    }
    band(0);
  }

  function band(grow) {
    pools.forEach(function (pool) {
      var d = 'M' + f(pool.x0) + ' ' + TOP;
      for (var x = pool.x0; x < pool.x1; x += 8) d += 'L' + f(x) + ' ' + f(edge(pool, x, grow));
      pool.el.setAttribute('d', d + 'L' + f(pool.x1) + ' ' + TOP + 'Z');
    });
  }

  function draw(drip, s) {
    drip.el.setAttribute('d', dripPath(drip.x, drip.y0, drip.len, drip.wNow, drip.r, drip.flare * (0.7 + 0.3 * drip.p), drip.lean * drip.p, s));
  }

  /* A drip of paint [p] at x, from y0, running [len] down at most. */
  function drip(x, y0, p, w, len, flare, detach) {
    var d = {
      x: x, y0: y0, paint: p, p: 0, w: w, wNow: w * 0.8, r0: w * (1.3 + rand() * 0.3), len: 0,
      target: Math.max(4, Math.min(len, H - 10 - y0)), flare: flare, lean: (rand() - 0.5) * Math.min(len, 120) * 0.05,
      age: 0, detach: detach, el: add('path', 'drip', p, {})
    };
    d.r = d.r0 * 0.65;
    d.dur = 45 + d.target * 0.55;
    draw(d, m.stretch());
    moving.push(d);
    return d;
  }

  /* One drip letting go of the band: mostly short, now and then a long one. */
  function release() {
    var x, pool, tries = 0;
    do {
      x = 12 + rand() * (W - 24);
      pool = null;
      for (var i = pools.length - 1; i >= 0; i--) {
        var t = (x - pools[i].x0) / (pools[i].x1 - pools[i].x0);
        if (t > 0.15 && t < 0.85) { pool = pools[i]; break; }
      }
    } while (!pool && ++tries < 6);
    if (!pool) return;
    var w = 2.4 + rand() * 2.8;
    var long = rand() < LONG;
    var len = long ? 150 + rand() * 110 : 18 + rand() * rand() * 95;
    drip(x, edge(pool, x, 1) - 1, pool.p, w, len, w * (2.6 + rand() * 1.2), len > 30 && rand() < 0.3);
    started += 1;
  }

  /* A bead letting go of a stopped drip: the drip's tip shrinks back and a drop falls. */
  function letGo(d, s) {
    var tipX = d.x + d.lean / s, tipY = d.y0 + d.len;
    var r = d.r * 0.8;
    d.r = Math.max(d.wNow * 0.9, d.r * 0.55);
    draw(d, s);
    falling.push({
      x: tipX, y: tipY, vy: 0.4, r: r, land: Math.min(H - 8, tipY + 30 + rand() * 110), p: d.paint,
      el: add('ellipse', 'drop', d.paint, { cx: f(tipX), cy: f(tipY), rx: f(r / s), ry: f(r) })
    });
  }

  /* A drop landing: a spot, and a speck or two thrown off. */
  function land(drop, s) {
    drop.el.setAttribute('class', 'masthead-drips-spot');
    drop.el.setAttribute('cy', f(drop.land));
    drop.el.setAttribute('rx', f(drop.r * 1.35 / s));
    drop.el.setAttribute('ry', f(drop.r * 1.05));
    var specks = 1 + Math.floor(rand() * 3);
    for (var k = 0; k < specks; k++) {
      var a = Math.PI + rand() * Math.PI, dist = drop.r * 1.6 + 2 + rand() * 8, sz = 0.7 + rand() * 1.1;
      add('ellipse', 'spot', drop.p, { cx: f(drop.x + Math.cos(a) * dist / s), cy: f(drop.land + Math.sin(a) * dist * 0.6), rx: f(sz / s), ry: f(sz) });
    }
  }

  begin(0);

  return {
    interval: 40,
    poke: function (x, y, n) {
      // A masthead painted full is wiped for a fresh band instead.
      if (count >= CAP) {
        if (phase !== 'fade') { phase = 'fade'; phaseAt = n; }
        return;
      }
      var s = m.stretch(), p = paint(0), other = rand() < 0.35 ? paint(p) : p;
      var r = 7 + rand() * 5;
      add('ellipse', 'splat', p, { cx: f(x), cy: f(y), rx: f(r / s), ry: f(r) });
      var k = 8 + Math.floor(rand() * 6);
      for (var i = 0; i < k; i++) {
        var a = rand() * Math.PI * 2, dist = r * 0.8 + 2 + rand() * rand() * 40;
        var sz = Math.max(0.9, (1.2 + rand() * 3.4) * (1.2 - dist / 60));
        add('ellipse', 'splat', i % 3 === 2 ? other : p, { cx: f(x + Math.cos(a) * dist / s), cy: f(y + Math.sin(a) * dist), rx: f(sz / s), ry: f(sz) });
      }
      var runs = rand() < 0.5 ? 2 : 1;
      for (var j = 0; j < runs; j++) {
        var w = 1.8 + rand() * 1.6, y0 = y + r * 0.6;
        if (y0 < H - 16) drip(x + (rand() - 0.5) * r / s, y0, p, w, 16 + rand() * 50, w * 1.8, false);
      }
    },
    step: function (n) {
      var s = m.stretch();
      if (phase === 'grow') {
        var g = Math.min(1, (n - phaseAt) / GROW);
        band(1 - Math.pow(1 - g, 2));
        if (g >= 1) phase = 'paint';
      }
      if (phase === 'fade') {
        var o = 1 - (n - phaseAt) / FADE;
        if (o <= 0) { begin(n); return; }
        wet.setAttribute('opacity', o.toFixed(3));
        return;
      }
      var full = started >= target || count >= CAP;
      if (!full && phase !== 'grow' && n >= nextAt && moving.length < MOVING) {
        release();
        nextAt = n + 25 + Math.floor(rand() * 25);
      }
      for (var i = moving.length - 1; i >= 0; i--) {
        var d = moving[i];
        d.age += 1;
        d.p = fall(d.age / d.dur);
        d.len = d.target * d.p;
        d.wNow = d.w * (0.8 + 0.3 * d.p);
        d.r = d.r0 * (0.65 + 0.45 * d.p);
        draw(d, s);
        if (d.age >= d.dur) {
          moving.splice(i, 1);
          if (d.detach) waiting.push({ drip: d, at: n + 15 + Math.floor(rand() * 40) });
        }
      }
      for (var w = waiting.length - 1; w >= 0; w--) {
        if (n >= waiting[w].at) { letGo(waiting[w].drip, s); waiting.splice(w, 1); }
      }
      for (var k = falling.length - 1; k >= 0; k--) {
        var drop = falling[k];
        drop.vy += 0.5;
        drop.y += drop.vy;
        if (drop.y >= drop.land) { land(drop, s); falling.splice(k, 1); continue; }
        var stretchY = 1 + Math.min(0.5, drop.vy * 0.05);
        drop.el.setAttribute('cy', f(drop.y));
        drop.el.setAttribute('rx', f(drop.r / stretchY / s));
        drop.el.setAttribute('ry', f(drop.r * stretchY));
      }
      if (full && phase === 'paint' && !moving.length && !waiting.length && !falling.length) {
        phase = 'rest';
        phaseAt = n;
      }
      if (phase === 'rest' && n - phaseAt >= REST) {
        phase = 'fade';
        phaseAt = n;
      }
    }
  };
}
