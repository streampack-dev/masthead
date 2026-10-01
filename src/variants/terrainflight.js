/* Terrain flight: ridgelines rolling toward you from the horizon, as on bytecode.news. */
export default function terrainflight(layer, m) {
  var COUNT = 7, SAMPLES = 18, HORIZON = 44, SPEED = 0.9;
  var W = m.width, H = m.height;
  function seeded(seed) { var x = Math.sin(seed * 91.345) * 24634.6345; return x - Math.floor(x); }
  function samples(id) {
    var out = [];
    for (var i = 0; i < SAMPLES; i++) {
      out.push(Math.sin(id * 0.29 + i * 0.58) * (16 + seeded(id + i) * 10)
        + Math.cos(id * 0.13 + i * 1.11) * (8 + seeded(id + i + 400) * 7)
        + Math.sin(id * 0.07 + i * 1.63) * 4);
    }
    return out;
  }
  function ridge(id, depth) {
    return { id: id, depth: depth, drift: seeded(id + 2000) * 2 - 1, roughness: 0.9 + seeded(id + 2400) * 0.35, samples: samples(id) };
  }
  var ridges = [];
  for (var i = 0; i < COUNT; i++) ridges.push(ridge(i + 1, i / COUNT));
  var nextId = COUNT + 1;

  m.el('path', { 'class': 'masthead-terrain-horizon', d: 'M 0 46 L ' + W + ' 46' });
  var drawn = [];
  for (var j = 0; j < COUNT; j++) {
    drawn.push({
      glow: m.el('path', { 'class': 'masthead-terrain-glow' }),
      line: m.el('path', { 'class': 'masthead-terrain-ridge' })
    });
  }

  function draw() {
    var cx = W / 2;
    ridges.forEach(function (r, k) {
      var depth = Math.max(0, r.depth);
      var perspective = Math.pow(depth, 1.45);
      var span = W * (0.24 + perspective * 1.28);
      var amplitude = 7 + Math.pow(depth, 1.8) * 118;
      var y = HORIZON + perspective * (H * 0.95);
      var step = span / (SAMPLES - 1);
      var x0 = cx - span / 2 + r.drift * 22 * perspective;
      var d = r.samples.map(function (s, i) {
        return (i === 0 ? 'M' : 'L') + ' ' + (x0 + i * step).toFixed(1) + ' ' + (y - s * amplitude * 0.02).toFixed(1);
      }).join(' ');
      var width = 1 + depth * 1.65;
      var p = drawn[k];
      p.glow.setAttribute('d', d);
      p.glow.setAttribute('opacity', Math.min(0.58, 0.12 + depth * 0.46).toFixed(3));
      p.glow.setAttribute('stroke-width', (width * 2.4).toFixed(2));
      p.line.setAttribute('d', d);
      p.line.setAttribute('opacity', Math.min(0.92, 0.28 + depth * 0.72).toFixed(3));
      p.line.setAttribute('stroke-width', width.toFixed(2));
    });
  }
  draw();

  return {
    interval: 32,
    step: function () {
      ridges = ridges
        .map(function (r) { r.depth += (0.016 + r.roughness * 0.004) * SPEED; return r; })
        .filter(function (r) { return r.depth < 1.16; });
      while (ridges.length < COUNT) ridges.unshift(ridge(nextId++, -0.18));
      ridges = ridges.slice(0, COUNT).sort(function (a, b) { return a.depth - b.depth; });
      draw();
    }
  };
}
