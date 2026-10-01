/* Eyes: pairs of eyes in the dark, opening here and there, blinking, glancing about (now and then
   at the name), and closing again to open somewhere else. Mostly around the edges, a few small
   ones nearer the name. The eyes and where they look come from the seed, so ?ambientSeed=<n>
   replays them. An October animation. */
export var PAIRS = 7;
var OPENING = 8;

/* How open a pair is at [age] steps into a life of [life]: opening, open (with any blinks), then
   closing. 0 is shut, 1 wide open. */
export function openness(age, life, blinks) {
  if (age < 0 || age > life) return 0;
  var o = Math.min(1, age / OPENING, (life - age) / OPENING);
  for (var k = 0; k < blinks.length; k++) {
    var d = Math.abs(age - blinks[k]);
    if (d < 4) o = Math.min(o, d / 4);
  }
  return o;
}

export default function eyes(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  function behindName(x, y) {
    var nx = (x - W / 2) / (W * 0.3), ny = (y - H / 2) / (H * 0.32);
    return nx * nx + ny * ny < 1;
  }

  var pairs = [];
  for (var k = 0; k < PAIRS; k++) {
    var g = m.el('g', { 'class': 'masthead-eyes-pair', opacity: 0 });
    var sides = [-1, 1].map(function (side) {
      var eye = m.el('g', {}, g);
      m.el('ellipse', { 'class': 'masthead-eyes-white', rx: 7, ry: 4.5 }, eye);
      var pupil = m.el('circle', { 'class': 'masthead-eyes-pupil', r: 2.4 }, eye);
      return { side: side, el: eye, pupil: pupil };
    });
    pairs.push({ el: g, sides: sides, age: 0, life: 0, wait: Math.floor(rand() * 120) });
  }

  function place(p) {
    // Somewhere in the dark: mostly clear of the name; the few nearer it are small.
    var x, y, tries = 0;
    do { x = 40 + rand() * (W - 80); y = 30 + rand() * (H - 60); } while (behindName(x, y) && rand() < 0.85 && tries++ < 20);
    p.x = x; p.y = y;
    p.size = behindName(x, y) ? 0.7 : 0.9 + rand() * 0.8;
    p.life = 120 + Math.floor(rand() * 160);
    p.age = 0;
    p.blinks = [];
    for (var b = 0; b < 1 + Math.floor(rand() * 3); b++) p.blinks.push(20 + Math.floor(rand() * (p.life - 40)));
    // Where it looks, and when it glances somewhere else.
    p.look = []; p.lookAt = 0;
    var t = 0;
    while (t < p.life) {
      var atName = rand() < 0.3;
      var lx = atName ? Math.sign(W / 2 - x) : rand() * 2 - 1, ly = atName ? Math.sign(H / 2 - y) * 0.4 : rand() * 1.2 - 0.6;
      p.look.push({ at: t, x: lx, y: ly });
      t += 30 + Math.floor(rand() * 60);
    }
  }

  function draw(p) {
    var o = openness(p.age, p.life, p.blinks);
    p.el.setAttribute('opacity', o > 0 ? 1 : 0);
    if (o <= 0) return;
    var s = p.size, squeeze = 1 / m.stretch();
    p.el.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ') scale(' + (s * squeeze).toFixed(4) + ' ' + s.toFixed(3) + ')');
    // The pupils glide toward where it's looking.
    var look = p.look[0];
    for (var k = 0; k < p.look.length; k++) if (p.look[k].at <= p.age) look = p.look[k];
    p.px = p.px === undefined ? look.x : p.px + (look.x - p.px) * 0.15;
    p.py = p.py === undefined ? look.y : p.py + (look.y - p.py) * 0.15;
    p.sides.forEach(function (e) {
      // Shutting is the eye squashing toward its middle, as a lid closing.
      e.el.setAttribute('transform', 'translate(' + (e.side * 10) + ' 0) scale(1 ' + o.toFixed(3) + ')');
      e.pupil.setAttribute('cx', (p.px * 3.6).toFixed(2));
      e.pupil.setAttribute('cy', (p.py * 1.8).toFixed(2));
    });
  }

  // A few are already open at first, part way through their lives.
  pairs.slice(0, 3).forEach(function (p) { p.wait = 0; place(p); p.age = OPENING + Math.floor(rand() * 40); draw(p); });

  return {
    interval: 40,
    step: function () {
      pairs.forEach(function (p) {
        if (p.wait > 0) { if (--p.wait === 0) place(p); return; }
        p.age += 1;
        if (p.age > p.life) { p.el.setAttribute('opacity', 0); p.wait = 40 + Math.floor(rand() * 160); p.px = p.py = undefined; return; }
        draw(p);
      });
    }
  };
}
