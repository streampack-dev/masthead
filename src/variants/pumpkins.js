/* Pumpkins: a row of jack-o'-lanterns along the foot of the masthead, of different sizes and
   faces, the candles inside them flickering, each in its own way. The row and its faces come from
   the seed, so ?ambientSeed=<n> replays it. An October animation. */

/* Carved faces, drawn at a pumpkin 40 wide: eyes, nose and mouth as shapes. */
export var FACES = [
  // Triangle eyes and nose, a jagged grin.
  'M-12 -22l6 -9l6 9zM6 -22l6 -9l6 9zM-3 -15l3 -5l3 5zM-15 -10h30l-3 7l-4 -4l-4 5l-4 -5l-4 5l-4 -5l-4 4z',
  // Round eyes, a crescent smile.
  'M-9 -24a4 4 0 1 0 0.1 0zM9 -24a4 4 0 1 0 0.1 0zM-14 -11q14 12 28 0q-14 6 -28 0z',
  // Slanted eyes, square-toothed grin.
  'M-15 -27l10 4l-2 4l-8 -2zM15 -27l-10 4l2 4l8 -2zM-2 -16h4l-2 -4zM-14 -11h28v6h-6v-3h-4v3h-8v-3h-4v3h-6z',
  // Surprised: round eyes, an "o".
  'M-9 -25a4.5 5 0 1 0 0.1 0zM9 -25a4.5 5 0 1 0 0.1 0zM0 -13a4 5 0 1 0 0.1 0z'
];

export default function pumpkins(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var row = [], x = 70 + rand() * 60;
  while (x < W - 60) {
    var size = 0.8 + rand() * 0.7;
    var g = m.el('g', { 'class': 'masthead-pumpkins-pumpkin' });
    // A glow behind the face, the body in lobes, a stem, and the carved face lit from inside.
    var glow = m.el('ellipse', { cx: 0, cy: -18, rx: 26, ry: 18, fill: m.pulse, 'class': 'masthead-pumpkins-glow' }, g);
    m.el('path', { 'class': 'masthead-pumpkins-body', d: 'M0 -38c-14 0 -22 9 -22 19s8 19 22 19s22 -9 22 -19s-8 -19 -22 -19zM-8 -37c-6 4 -8 12 -8 18s2 14 8 18M8 -37c6 4 8 12 8 18s-2 14 -8 18' }, g);
    m.el('path', { 'class': 'masthead-pumpkins-stem', d: 'M-2 -37l1 -7q3 -2 4 1l-1 6' }, g);
    var face = m.el('path', { 'class': 'masthead-pumpkins-face', d: FACES[Math.floor(rand() * FACES.length)] }, g);
    row.push({ x: x, size: size, g: g, glow: glow, face: face, phase: rand() * 6.3, rate: 0.15 + rand() * 0.15 });
    x += 50 * size + 60 + rand() * 120;
  }

  function draw(n) {
    var squeeze = 1 / m.stretch();
    row.forEach(function (p) {
      p.g.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + (H - 4) + ') scale(' + (p.size * squeeze).toFixed(4) + ' ' + p.size.toFixed(3) + ')');
      // A candle's flicker: a steady glow, with quicker, smaller wavers over it.
      var f = 0.72 + 0.14 * Math.sin(n * p.rate + p.phase) + 0.08 * Math.sin(n * p.rate * 2.7 + p.phase * 2) + 0.06 * Math.sin(n * 0.9 + p.phase * 3);
      p.face.setAttribute('fill-opacity', f.toFixed(2));
      p.glow.setAttribute('opacity', (f * 0.7).toFixed(2));
    });
  }
  draw(0);

  return {
    interval: 50,
    step: function (n) { draw(n); }
  };
}
