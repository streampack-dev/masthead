/* Fractal: a branching growth tracing round the name, resting when grown, then starting again, as
   on bytecode.news. ?ambientSeed=<n> replays a growth. A click sprouts a new root there, three
   tips branching out from it, and wakes a resting growth to grow it. */
export default function fractal(layer, m) {
  // A growth that dies young, as many do in the bands above and below the name, rests only
  // briefly before the next starts (ui-pudl #98). It grows from ROOTS points spread round the
  // name, each tracing both ways, so it fills the masthead rather than one side of it
  // (ui-pudl #126).
  var ROOTS = 3, MAX_SEGMENTS = 1400, MAX_TIPS = 32, EDGE = 12, REST_MS = 10000, SHORT = 400, SHORT_REST_MS = 1500;
  var W = m.width, H = m.height;
  function nextRandom(s) { return (Math.imul(s, 1664525) + 1013904223) >>> 0; }
  function unit(s) { return s / 0x100000000; }
  function norm(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
  function excluded(x, y) {
    var nx = (x - W / 2) / (W * 0.245), ny = (y - H / 2) / (H * 0.295);
    return nx * nx + ny * ny < 1;
  }
  function tangentNear(p, angle) {
    var rx = W * 0.255, ry = H * 0.31;
    var theta = Math.atan2((p.y - H / 2) / ry, (p.x - W / 2) / rx);
    var t = Math.atan2(ry * Math.cos(theta), -rx * Math.sin(theta)), back = norm(t + Math.PI);
    return Math.abs(norm(t - angle)) <= Math.abs(norm(back - angle)) ? t : back;
  }
  function start(seed) {
    var rs = nextRandom(seed >>> 0 || 1);
    var first = unit(rs) * Math.PI * 2;
    var rx = W * 0.265, ry = H * 0.325, tips = [], id = 1;
    for (var r = 0; r < ROOTS; r++) {
      rs = nextRandom(rs);
      // Evenly round the name, each nudged so the roots don't sit at fixed points.
      var theta = first + r * Math.PI * 2 / ROOTS + (unit(rs) - 0.5) * 0.5;
      rs = nextRandom(rs);
      var x = W / 2 + Math.cos(theta) * rx, y = H / 2 + Math.sin(theta) * ry;
      var t = Math.atan2(ry * Math.cos(theta), -rx * Math.sin(theta));
      var energy = 76 + unit(rs) * 28;
      tips.push({ angle: t, depth: 0, energy: energy, id: id++, x: x, y: y });
      tips.push({ angle: norm(t + Math.PI), depth: 0, energy: energy, id: id++, x: x, y: y });
    }
    return { complete: false, generation: 0, nextId: id, random: rs, segments: [], tips: tips };
  }
  function grow(st) {
    var rs = st.random, nextId = st.nextId, segments = st.segments.slice(), tips = [];
    function rand() { rs = nextRandom(rs); return unit(rs); }
    st.tips.forEach(function (tip) {
      if (segments.length >= MAX_SEGMENTS || tip.energy <= 0) return;
      var len = 5.5 + rand() * 4.5;
      var angle = norm(tip.angle + (rand() - 0.5) * 0.34);
      var x = tip.x + Math.cos(angle) * len, y = tip.y + Math.sin(angle) * len;
      if (excluded(x, y)) {
        angle = norm(tangentNear(tip, angle) + (rand() - 0.5) * 0.14);
        var radial = Math.atan2(tip.y - H / 2, tip.x - W / 2);
        x = tip.x + Math.cos(angle) * len + Math.cos(radial) * 1.8;
        y = tip.y + Math.sin(angle) * len + Math.sin(radial) * 1.8;
      }
      if (x < EDGE || x > W - EDGE || y < EDGE || y > H - EDGE || excluded(x, y)) return;
      segments.push({ depth: tip.depth, x1: tip.x, y1: tip.y, x2: x, y2: y });
      nextId++;
      var remaining = tip.energy - 1;
      var nextTip = { angle: angle, depth: tip.depth, energy: remaining, id: tip.id, x: x, y: y };
      if (remaining > 0) tips.push(nextTip);
      var chance = tip.depth < 2 ? 0.07 : 0.036;
      if (remaining > 22 && tips.length < MAX_TIPS && rand() < chance) {
        var dir = rand() < 0.5 ? -1 : 1, div = 0.42 + rand() * 0.42;
        nextTip.angle = norm(angle - dir * div * 0.28);
        tips.push({ angle: norm(angle + dir * div), depth: tip.depth + 1, energy: remaining * (0.58 + rand() * 0.16), id: nextId, x: x, y: y });
        nextId++;
      }
    });
    return {
      complete: segments.length >= MAX_SEGMENTS || tips.length === 0,
      generation: st.generation + 1, nextId: nextId, random: rs,
      segments: segments.slice(0, MAX_SEGMENTS), tips: tips.slice(0, MAX_TIPS)
    };
  }

  var glow = m.el('path', { 'class': 'masthead-fractal-glow' });
  var trunk = m.el('path', { 'class': 'masthead-fractal-trunk' });
  var branches = m.el('path', { 'class': 'masthead-fractal-branches' });
  var twigs = m.el('path', { 'class': 'masthead-fractal-twigs' });
  var tipLayer = m.el('g', { 'class': 'masthead-fractal-tips' });
  var state = start(m.seed());
  var restedAt = null;

  function segs(filter) {
    return state.segments.filter(filter).map(function (s) {
      return 'M' + s.x1.toFixed(1) + ' ' + s.y1.toFixed(1) + 'L' + s.x2.toFixed(1) + ' ' + s.y2.toFixed(1);
    }).join('');
  }
  function draw() {
    var t = segs(function (s) { return s.depth === 0; });
    var b = segs(function (s) { return s.depth > 0 && s.depth < 3; });
    var w = segs(function (s) { return s.depth >= 3; });
    glow.setAttribute('d', t + b + w);
    trunk.setAttribute('d', t);
    branches.setAttribute('d', b);
    twigs.setAttribute('d', w);
    while (tipLayer.firstChild) tipLayer.removeChild(tipLayer.firstChild);
    state.tips.forEach(function (tip) {
      var g = m.el('g', { transform: 'translate(' + tip.x.toFixed(1) + ' ' + tip.y.toFixed(1) + ')' }, tipLayer);
      m.el('circle', { r: 5.2, fill: m.pulse }, g);
      m.el('circle', { r: 1.25, 'class': 'masthead-spark' }, g);
    });
  }
  draw();

  /* A root at (x, y), or the nearest point outside the name if that's in it, of three tips
     spread round it. Room is made for it by letting the oldest growth go. */
  function sprout(x, y) {
    x = Math.min(W - EDGE - 1, Math.max(EDGE + 1, x));
    y = Math.min(H - EDGE - 1, Math.max(EDGE + 1, y));
    if (excluded(x, y)) {
      var nx = (x - W / 2) / (W * 0.25), ny = (y - H / 2) / (H * 0.3);
      if (nx === 0 && ny === 0) ny = -1;
      var k = Math.hypot(nx, ny);
      x = W / 2 + nx / k * W * 0.26;
      y = H / 2 + ny / k * H * 0.31;
    }
    var rs = nextRandom(state.random ^ Math.round(x * 31 + y));
    var first = unit(rs) * Math.PI * 2, id = state.nextId, burst = [];
    for (var t = 0; t < 3; t++) {
      rs = nextRandom(rs);
      burst.push({ angle: norm(first + t * Math.PI * 2 / 3), depth: 0, energy: 50 + unit(rs) * 24, id: id++, x: x, y: y });
    }
    var room = MAX_SEGMENTS - 240;
    state = {
      complete: false, generation: state.generation, nextId: id, random: rs,
      segments: state.segments.length > room ? state.segments.slice(state.segments.length - room) : state.segments,
      tips: burst.concat(state.tips).slice(0, MAX_TIPS)
    };
    restedAt = null;
    draw();
  }

  return {
    interval: 92,
    poke: function (x, y) { sprout(x, y); },
    step: function (n, time) {
      if (state.complete) {
        if (restedAt === null) restedAt = time;
        if (time - restedAt >= (state.segments.length < SHORT ? SHORT_REST_MS : REST_MS)) {
          restedAt = null;
          state = start(state.random + state.generation + 1);
          draw();
        }
        return;
      }
      state = grow(state);
      draw();
    }
  };
}
