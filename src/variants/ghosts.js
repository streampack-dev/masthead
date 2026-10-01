/* Ghosts: friendly sheet ghosts drifting across the masthead, bobbing as they go, their hems
   rippling; each fades in, wanders a while, and fades away. Now and then one peeks up from the
   foot of the masthead, looks about, and sinks back. The ghosts come from the seed, so
   ?ambientSeed=<n> replays them. An October animation. */
var MAX_GHOSTS = 3, FADE = 30;

/* A sheet ghost [h] tall: a dome, sides, and a hem that ripples with [phase]; its eyes and mouth
   are drawn apart. */
export function sheet(phase, h) {
  var w = h * 0.36, top = -h, d = 'M' + (-w).toFixed(1) + ' ' + (top + w).toFixed(1) +
    'A' + w.toFixed(1) + ' ' + w.toFixed(1) + ' 0 0 1 ' + w.toFixed(1) + ' ' + (top + w).toFixed(1) + 'L' + (w * 1.08).toFixed(1) + ' 0';
  // The hem: four scallops, rippling.
  for (var k = 4; k > 0; k--) {
    var x0 = -w * 1.08 + (k - 1) * (w * 2.16 / 4), x1 = x0 + w * 2.16 / 4;
    var dip = h * 0.09 * (1 + 0.5 * Math.sin(phase + k * 1.3));
    d += 'Q' + ((x0 + x1) / 2).toFixed(1) + ' ' + dip.toFixed(1) + ' ' + x0.toFixed(1) + ' ' + (k > 1 ? (-h * 0.03 * Math.sin(phase + k)).toFixed(1) : '0');
  }
  return d + 'Z';
}

export default function ghosts(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var haunting = [], nextAt = 0;

  function ghost(peek) {
    var h = peek ? 60 : 40 + rand() * 40;
    var g = m.el('g', { 'class': 'masthead-ghosts-ghost', opacity: 0 });
    var body = m.el('path', { 'class': 'masthead-ghosts-sheet' }, g);
    var eyes = 'M' + (-h * 0.14).toFixed(1) + ' ' + (-h * 0.66).toFixed(1) + 'a' + (h * 0.05).toFixed(1) + ' ' + (h * 0.075).toFixed(1) + ' 0 1 0 0.1 0Z' +
      'M' + (h * 0.14).toFixed(1) + ' ' + (-h * 0.66).toFixed(1) + 'a' + (h * 0.05).toFixed(1) + ' ' + (h * 0.075).toFixed(1) + ' 0 1 0 0.1 0Z';
    m.el('path', { 'class': 'masthead-ghosts-face', d: eyes }, g);
    // An "oo" mouth.
    m.el('ellipse', { 'class': 'masthead-ghosts-face', cx: 0, cy: (-h * 0.46).toFixed(1), rx: (h * 0.05).toFixed(1), ry: (h * 0.07).toFixed(1) }, g);
    var dir = rand() < 0.5 ? 1 : -1;
    var o = {
      g: g, body: body, h: h, peek: peek, age: 0, phase: rand() * 6.3, bob: rand() * 6.3,
      life: peek ? 220 : 380 + Math.floor(rand() * 300),
      x: peek ? 120 + rand() * (W - 240) : 60 + rand() * (W - 120),
      y: peek ? H + 10 : 70 + h * 0.5 + rand() * (H - 140 - h * 0.5),
      vx: peek ? 0 : dir * (0.25 + rand() * 0.35)
    };
    haunting.push(o);
  }

  function draw(o) {
    var fade = Math.min(1, o.age / FADE, (o.life - o.age) / FADE);
    o.g.setAttribute('opacity', Math.max(0, fade).toFixed(2));
    o.body.setAttribute('d', sheet(o.phase + o.age * 0.12, o.h));
    var y = o.y + Math.sin(o.age * 0.05 + o.bob) * 6;
    // A peeking ghost rises from below the foot, looks about, and sinks back.
    if (o.peek) y = H + 10 - o.h * 0.75 * Math.sin(Math.PI * Math.min(1, o.age / o.life));
    var lean = o.peek ? Math.sin(o.age * 0.04) * 6 : o.vx * 10;
    o.g.setAttribute('transform', 'translate(' + o.x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + (1 / m.stretch()).toFixed(4) + ' 1) rotate(' + lean.toFixed(1) + ')');
  }

  ghost(false);
  haunting[0].age = FADE;
  draw(haunting[0]);

  return {
    interval: 40,
    step: function (n) {
      if (n >= nextAt && haunting.length < MAX_GHOSTS) {
        ghost(rand() < 0.2);
        nextAt = n + 120 + Math.floor(rand() * 220);
      }
      haunting = haunting.filter(function (o) {
        o.age += 1;
        o.x += o.vx;
        if (o.age > o.life) { o.g.parentNode.removeChild(o.g); return false; }
        draw(o);
        return true;
      });
    }
  };
}
