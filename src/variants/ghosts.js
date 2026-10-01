/* Ghosts: friendly sheet ghosts dancing around the name, bobbing as they go, their hems
   rippling: round its sides, over the date and under the tagline, lingering at the sides and
   darting across the top and bottom, so they're seldom behind the words. Each fades in, dances a
   while, and fades away. Now and then one peeks up from the foot of the masthead, looks about, and
   sinks back. The ghosts come from the seed, so ?ambientSeed=<n> replays them. An October
   animation. */
var MAX_GHOSTS = 6, FADE = 30;

/* Where a ghost dancing round the name is, [angle] round its oval: the hem's point. */
export function round(angle, rx, ry, width) {
  return { x: width / 2 + Math.cos(angle) * rx, y: 170 + Math.sin(angle) * ry };
}

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
    var h = peek ? 60 : 34 + rand() * 20;
    var g = m.el('g', { 'class': 'masthead-ghosts-ghost', opacity: 0 });
    var body = m.el('path', { 'class': 'masthead-ghosts-sheet' }, g);
    var eyes = 'M' + (-h * 0.14).toFixed(1) + ' ' + (-h * 0.66).toFixed(1) + 'a' + (h * 0.05).toFixed(1) + ' ' + (h * 0.075).toFixed(1) + ' 0 1 0 0.1 0Z' +
      'M' + (h * 0.14).toFixed(1) + ' ' + (-h * 0.66).toFixed(1) + 'a' + (h * 0.05).toFixed(1) + ' ' + (h * 0.075).toFixed(1) + ' 0 1 0 0.1 0Z';
    m.el('path', { 'class': 'masthead-ghosts-face', d: eyes }, g);
    // An "oo" mouth.
    m.el('ellipse', { 'class': 'masthead-ghosts-face', cx: 0, cy: (-h * 0.46).toFixed(1), rx: (h * 0.05).toFixed(1), ry: (h * 0.07).toFixed(1) }, g);
    var o = {
      g: g, body: body, h: h, peek: peek, age: 0, phase: rand() * 6.3, bob: rand() * 6.3,
      life: peek ? 220 : 420 + Math.floor(rand() * 360),
      // Round the name: where on its oval, which way, how fast, and how wide its own oval is.
      angle: rand() * Math.PI * 2, spin: (rand() < 0.5 ? 1 : -1) * (0.004 + rand() * 0.003),
      rx: 450 + rand() * 100, ry: 114 + rand() * 12,
      x: peek ? 120 + rand() * (W - 240) : 0, y: peek ? H + 10 : 0, dx: 0
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
    var lean = o.peek ? Math.sin(o.age * 0.04) * 6 : Math.max(-12, Math.min(12, o.dx * 6));
    o.g.setAttribute('transform', 'translate(' + o.x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + (1 / m.stretch()).toFixed(4) + ' 1) rotate(' + lean.toFixed(1) + ')');
  }

  // Two are dancing already.
  for (var k = 0; k < 2; k++) {
    ghost(false);
    var o = haunting[k], at = round(o.angle, o.rx, o.ry, W);
    o.x = at.x; o.y = at.y; o.age = FADE;
    draw(o);
  }

  return {
    interval: 40,
    step: function (n) {
      if (n >= nextAt && haunting.length < MAX_GHOSTS) {
        ghost(rand() < 0.2);
        nextAt = n + 60 + Math.floor(rand() * 140);
      }
      haunting = haunting.filter(function (o) {
        o.age += 1;
        if (!o.peek) {
          // Slow at the sides, quicker across the top and bottom, where the words are.
          var across = 1 - Math.abs(Math.cos(o.angle));
          o.angle += o.spin * (1 + across * 1.6);
          var at = round(o.angle, o.rx, o.ry, W);
          o.dx = o.age > 1 ? at.x - o.x : 0;
          o.x = at.x; o.y = at.y;
        }
        if (o.age > o.life) { o.g.parentNode.removeChild(o.g); return false; }
        draw(o);
        return true;
      });
    }
  };
}
