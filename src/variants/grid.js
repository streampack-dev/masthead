/* Grid: a composition in the manner of De Stijl, in the theme's own tones rather than red, yellow
   and blue. The masthead is cut, by a recursive subdivision, into rectangles by straight lines of
   a few weights: a few heavy, most thin, and only thin ones, faded, behind the name. A few small
   blocks in the corners and low are toned: a faint tint, a hatching, a stronger tint. Every
   several seconds a line slides to a new place, the lines ending on it and the blocks it borders
   following; now and then a region is cut again by a line growing in from an edge, a cut is taken
   back, or a tone passes to a neighbouring block in a slow cross-fade. A click cuts the rectangle
   clicked with a new line across it. It all comes from the seed, so ?ambientSeed=<n> replays it. */
export var MIN_W = 44, MIN_H = 26;
var SLIDE = 45, GROW = 55, FADE = 75, REST_MIN = 90, REST_MAX = 180, MAX_CROSSING = 3, NEAR = 18;
var KINDS = ['tint', 'hatch', 'strong', 'tint'];

function ease(t) { return 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t))); }
function overlaps(a, b) { return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0; }

/* A region's rectangle, from the lines (or the masthead's edges) that bound it. */
export function box(node) { return { x0: node.x0.pos, x1: node.x1.pos, y0: node.y0.pos, y1: node.y1.pos }; }

/* A line's extent as a box with no width (or no height). */
export function span(line) {
  return line.v ? { x0: line.pos, x1: line.pos, y0: line.lo.pos, y1: line.hi.pos }
    : { x0: line.lo.pos, x1: line.hi.pos, y0: line.pos, y1: line.pos };
}

/* Whether [line] passes through [area]. */
export function crosses(line, area) {
  var s = span(line);
  return line.v ? s.x0 > area.x0 && s.x0 < area.x1 && s.y0 < area.y1 && s.y1 > area.y0
    : s.y0 > area.y0 && s.y0 < area.y1 && s.x0 < area.x1 && s.x1 > area.x0;
}

export default function grid(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  // The name's band: only thin lines cross it, and no tone comes near it.
  var NAME = { x0: W * 0.24, x1: W * 0.76, y0: H * 0.26, y1: H * 0.74 };
  var CLEAR = { x0: W * 0.2, x1: W * 0.8, y0: H * 0.2, y1: H * 0.8 };
  var MAX_TONE = W * H * 0.09;

  var defs = m.el('defs');
  var hatch = m.el('pattern', { id: 'masthead-grid-hatch', patternUnits: 'userSpaceOnUse', width: 7, height: 7 }, defs);
  m.el('rect', { 'class': 'masthead-grid-hatch-ground', width: 7, height: 7 }, hatch);
  m.el('path', { d: 'M-2 2L2 -2M0 7L7 0M5 9L9 5', 'class': 'masthead-grid-hatching' }, hatch);
  // The thin lines fade behind the name (the others never cross it). A mask works by brightness,
  // so its white is not a colour of the art: it's how much of each line shows.
  var fall = m.el('radialGradient', { id: 'masthead-grid-fall' }, defs);
  m.el('stop', { offset: '0.5', 'stop-color': '#fff', 'stop-opacity': '0.2' }, fall);
  m.el('stop', { offset: '0.78', 'stop-color': '#fff', 'stop-opacity': '1' }, fall);
  var mask = m.el('mask', { id: 'masthead-grid-fade', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs);
  m.el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#masthead-grid-fall)' }, mask);
  var toneLayer = m.el('g', { 'class': 'masthead-grid-tones' });
  var lineLayer = m.el('g', { 'class': 'masthead-grid-lines', mask: 'url(#masthead-grid-fade)' });
  var boldLayer = m.el('g', { 'class': 'masthead-grid-bold' });

  var root = { x0: { pos: 0 }, x1: { pos: W }, y0: { pos: 0 }, y1: { pos: H }, line: null };
  var lines = [], tones = [];

  function leaves(node, out) {
    out = out || [];
    if (!node.line) out.push(node);
    else { leaves(node.a, out); leaves(node.b, out); }
    return out;
  }
  function leafAt(x, y) {
    var node = root;
    while (node.line) node = (node.line.v ? x < node.line.pos : y < node.line.pos) ? node.a : node.b;
    return node;
  }
  function area(node) { var b = box(node); return (b.x1 - b.x0) * (b.y1 - b.y0); }
  function crossings() { return lines.filter(function (l) { return crosses(l, NAME); }).length; }
  function toned(leaf) { return tones.some(function (t) { return t.leaf === leaf || t.next === leaf; }); }
  function small(leaf) { var b = box(leaf); return area(leaf) <= MAX_TONE && b.x1 - b.x0 <= 280 && b.y1 - b.y0 <= 180; }
  /* Whether leaves [p] and [q] share a stretch of a line. */
  function adjacent(p, q) {
    var a = box(p), b = box(q);
    return ((q.x0 === p.x1 || q.x1 === p.x0) && b.y0 < a.y1 && b.y1 > a.y0) ||
      ((q.y0 === p.y1 || q.y1 === p.y0) && b.x0 < a.x1 && b.x1 > a.x0);
  }

  /* Cut [node] with a line at [pos], vertical if [v]. */
  function split(node, v, pos, weight) {
    var line = { v: v, pos: pos, lo: v ? node.y0 : node.x0, hi: v ? node.y1 : node.x1, weight: weight, grow: 1, from: 'lo', node: node };
    node.line = line;
    node.a = { x0: node.x0, x1: v ? line : node.x1, y0: node.y0, y1: v ? node.y1 : line, line: null };
    node.b = { x0: v ? line : node.x0, x1: node.x1, y0: v ? node.y0 : line, y1: node.y1, line: null };
    lines.push(line);
    return line;
  }
  function unsplit(node) {
    lines.splice(lines.indexOf(node.line), 1);
    node.line = null; node.a = null; node.b = null;
  }

  /* Whether the composition keeps its rules: no sliver of a rectangle, no more than [limit] lines
     through the name and only thin ones, and every tone clear of it. */
  function valid(limit) {
    var all = leaves(root);
    for (var i = 0; i < all.length; i++) {
      var b = box(all[i]);
      if (b.x1 - b.x0 < MIN_W || b.y1 - b.y0 < MIN_H) return false;
    }
    var through = 0;
    for (var k = 0; k < lines.length; k++) {
      if (!crosses(lines[k], NAME)) continue;
      if (lines[k].weight !== 'thin') return false;
      through++;
    }
    if (through > limit) return false;
    // Lines that meet or run side by side are in line or well apart, never a near miss.
    for (var p = 0; p < lines.length; p++) {
      for (var q = p + 1; q < lines.length; q++) {
        var l = lines[p], o = lines[q], gap = Math.abs(l.pos - o.pos);
        if (l.v === o.v && gap > 0.5 && gap < NEAR && l.lo.pos <= o.hi.pos && o.lo.pos <= l.hi.pos) return false;
      }
    }
    return tones.every(function (t) { return held(t.leaf) && (!t.next || held(t.next)); });
  }
  /* Whether a toned leaf is still clear of the name, and not grown large. */
  function held(leaf) { var b = box(leaf); return !overlaps(b, CLEAR) && b.x1 - b.x0 <= 340 && b.y1 - b.y0 <= 200; }

  /* A leaf to cut, the bigger the likelier, and those behind the name seldom. */
  function pickLeaf() {
    var all = leaves(root), weights = all.map(function (l) { return Math.pow(area(l), 1.6) * (overlaps(box(l), NAME) ? 0.25 : 1); });
    var total = weights.reduce(function (s, w) { return s + w; }, 0), r = rand() * total;
    for (var i = 0; i < all.length; i++) { r -= weights[i]; if (r <= 0) return all[i]; }
    return all[all.length - 1];
  }

  /* A cut of [leaf]: across its longer side, mostly near the middle, sometimes near an edge. */
  function cutOf(leaf) {
    var b = box(leaf), w = b.x1 - b.x0, h = b.y1 - b.y0;
    var v = rand() < w / (w + h * 1.6);
    if ((v ? w : h) < 2 * (v ? MIN_W : MIN_H)) v = !v;
    var lo = v ? b.x0 : b.y0, hi = v ? b.x1 : b.y1, min = v ? MIN_W : MIN_H;
    if (hi - lo < 2 * min) return null;
    var f = rand() < 0.4 ? (rand() < 0.5 ? 0.12 + rand() * 0.14 : 0.74 + rand() * 0.14) : 0.3 + rand() * 0.4;
    return { v: v, pos: Math.round(Math.min(hi - min, Math.max(lo + min, lo + (hi - lo) * f))) };
  }

  // The composition, again if it leaves no room for at least two tones.
  var chosen = [];
  for (var attempt = 0; attempt < 8 && chosen.length < 2; attempt++) {
    root.line = null; root.a = null; root.b = null;
    lines = [];
    compose();
    chosen = spots();
  }

  function compose() {
    var target = 12 + Math.floor(rand() * 6);
    for (var tries = 0; lines.length < target && tries < 400; tries++) {
      var leaf = pickLeaf(), cut = cutOf(leaf);
      if (!cut) continue;
      split(leaf, cut.v, cut.pos, 'thin');
      if (!valid(MAX_CROSSING)) unsplit(leaf);
    }
  }

  /* Places for the tones: small blocks away from the name, the corners and the low ones first,
     and apart from each other, as the coloured blocks are in the paintings. */
  function spots() {
    var out = [];
    leaves(root).filter(function (l) { return !overlaps(box(l), CLEAR) && small(l); }).map(function (l) {
      var b = box(l), cx = (b.x0 + b.x1) / 2 / W - 0.5, cy = (b.y0 + b.y1) / 2 / H - 0.5;
      return { leaf: l, score: Math.abs(cx) * 1.2 + cy * 0.5 + Math.abs(cy) * 0.4 + rand() * 0.35 };
    }).sort(function (a, b) { return b.score - a.score; }).forEach(function (s) {
      if (out.every(function (c) { return !adjacent(c, s.leaf); })) out.push(s.leaf);
    });
    return out;
  }

  var fewest = lines.length - 3, most = lines.length + 4;

  // A few heavy lines among the longest clear of the name, and a few of middle weight.
  var clear = lines.filter(function (l) { return !crosses(l, NAME); });
  clear.sort(function (a, b) { return (b.hi.pos - b.lo.pos) / (b.v ? H : W) - (a.hi.pos - a.lo.pos) / (a.v ? H : W); });
  var longest = clear.slice(0, 6);
  for (var h = 2 + (rand() < 0.4 ? 1 : 0); h > 0 && longest.length; h--) longest.splice(Math.floor(rand() * longest.length), 1)[0].weight = 'heavy';
  clear.filter(function (l) { return l.weight === 'thin'; }).forEach(function (l) { if (rand() < 0.35) l.weight = 'mid'; });

  // The tones.
  var count = Math.min(chosen.length, rand() < 0.2 ? 2 : rand() < 0.75 ? 3 : 4);
  for (var t = 0; t < count; t++) {
    var kind = KINDS[t];
    var el = m.el('rect', { 'class': 'masthead-grid-tone masthead-grid-' + kind }, toneLayer);
    var spare = m.el('rect', { 'class': 'masthead-grid-tone masthead-grid-' + kind, opacity: 0 }, toneLayer);
    if (kind === 'hatch') { el.setAttribute('fill', 'url(#masthead-grid-hatch)'); spare.setAttribute('fill', 'url(#masthead-grid-hatch)'); }
    tones.push({ kind: kind, leaf: chosen[t], next: null, el: el, spare: spare });
  }

  function drawRect(el, leaf) {
    var b = box(leaf);
    el.setAttribute('x', b.x0.toFixed(1)); el.setAttribute('y', b.y0.toFixed(1));
    el.setAttribute('width', (b.x1 - b.x0).toFixed(1)); el.setAttribute('height', (b.y1 - b.y0).toFixed(1));
  }
  function drawTone(tone) {
    drawRect(tone.el, tone.leaf);
    if (tone.next) drawRect(tone.spare, tone.next);
  }
  function drawLine(line) {
    if (!line.el) line.el = m.el('line', {}, line.weight === 'thin' ? lineLayer : boldLayer);
    var lo = line.lo.pos, hi = line.hi.pos, g = ease(line.grow);
    var a = line.from === 'hi' ? hi - (hi - lo) * g : lo, b = line.from === 'hi' ? hi : lo + (hi - lo) * g;
    var p = line.pos.toFixed(1);
    line.el.setAttribute('class', 'masthead-grid-line masthead-grid-' + line.weight + (line.grow < 1 ? ' masthead-grid-growing' : ''));
    line.el.setAttribute('x1', line.v ? p : a.toFixed(1)); line.el.setAttribute('x2', line.v ? p : b.toFixed(1));
    line.el.setAttribute('y1', line.v ? a.toFixed(1) : p); line.el.setAttribute('y2', line.v ? b.toFixed(1) : p);
  }
  tones.forEach(drawTone);
  lines.forEach(drawLine);

  function edgeOf(leaf, line) { return leaf.x0 === line || leaf.x1 === line || leaf.y0 === line || leaf.y1 === line; }

  /* Once its cut is across, a cut leaf's tone draws back into the half of it farther from the
     name, fading from the other half (at once, if another tone is fading). */
  function handDown(leaf) {
    var far = function (n) { var b = box(n); return Math.abs((b.x0 + b.x1) / 2 - W / 2) / W + Math.abs((b.y0 + b.y1) / 2 - H / 2) / H; };
    var child = far(leaf.a) >= far(leaf.b) ? leaf.a : leaf.b;
    tones.forEach(function (t) {
      if (t.next === leaf) { t.next = child; drawTone(t); }
      if (t.leaf !== leaf) return;
      if (fade) { t.leaf = child; drawTone(t); return; }
      t.next = child;
      t.spare.setAttribute('opacity', 0);
      drawTone(t);
      fade = { tone: t, t: 0 };
    });
  }

  var motion = null, fade = null, pending = null, rest = 60;

  function slide() {
    var limit = Math.max(MAX_CROSSING, crossings());
    for (var k = 0; k < 10; k++) {
      var line = lines[Math.floor(rand() * lines.length)];
      if (line.grow < 1) continue;
      var d = (line.v ? 30 + rand() * 130 : 14 + rand() * 46) * (rand() < 0.5 ? -1 : 1);
      var from = line.pos, to = Math.round(from + d);
      line.pos = to;
      var ok = valid(limit);
      line.pos = from;
      if (!ok) continue;
      motion = {
        kind: 'slide', line: line, from: from, to: to, t: 0,
        lines: lines.filter(function (l) { return l === line || l.lo === line || l.hi === line; }),
        tones: tones.filter(function (t) { return edgeOf(t.leaf, line) || (t.next && edgeOf(t.next, line)); })
      };
      return true;
    }
    return false;
  }

  function grow(leaf, cut, from, weight) {
    var line = split(leaf, cut.v, cut.pos, weight);
    line.grow = 0;
    line.from = from;
    drawLine(line);
    motion = { kind: 'grow', line: line, t: 0 };
  }

  function regrow() {
    var limit = Math.max(MAX_CROSSING, crossings());
    for (var k = 0; k < 10; k++) {
      var leaf = pickLeaf(), cut = cutOf(leaf);
      if (!cut) continue;
      split(leaf, cut.v, cut.pos, 'thin');
      var through = crosses(leaf.line, NAME), ok = valid(limit);
      unsplit(leaf);
      if (ok) { grow(leaf, cut, rand() < 0.5 ? 'lo' : 'hi', !through && rand() < 0.3 ? 'mid' : 'thin'); return true; }
    }
    return false;
  }

  /* Take back a cut with nothing on it: a line no other line ends on, neither side toned. */
  function retract() {
    var free = lines.filter(function (l) {
      return l.grow === 1 && l.weight !== 'heavy' && !l.node.a.line && !l.node.b.line && !toned(l.node.a) && !toned(l.node.b);
    });
    var named = free.filter(function (l) { return crosses(l, NAME); });
    if (named.length && crossings() > 2) free = named;
    if (!free.length) return false;
    var line = free[Math.floor(rand() * free.length)];
    line.from = rand() < 0.5 ? 'lo' : 'hi';
    motion = { kind: 'retract', line: line, t: 0 };
    return true;
  }

  /* A tone passes to a neighbouring block, clear of the name, in a slow cross-fade. */
  function moveTone() {
    if (!tones.length) return false;
    var tone = tones[Math.floor(rand() * tones.length)];
    var near = leaves(root).filter(function (l) {
      return adjacent(tone.leaf, l) && !toned(l) && !overlaps(box(l), CLEAR) && small(l) &&
        tones.every(function (o) { return o === tone || !adjacent(o.leaf, l); });
    });
    if (!near.length) return false;
    tone.next = near[Math.floor(rand() * near.length)];
    tone.spare.setAttribute('opacity', 0);
    drawTone(tone);
    fade = { tone: tone, t: 0 };
    return true;
  }

  function next() {
    var r = rand();
    if (lines.length > most) { if (retract()) return; }
    else if (lines.length < fewest) { if (regrow()) return; }
    else if (r < 0.14) { if (regrow()) return; }
    else if (r < 0.26) { if (retract()) return; }
    else if (r < 0.4) { if (moveTone()) return; }
    slide();
  }

  /* A click's cut: across the rectangle clicked, growing in from the edge nearer the click. */
  function cutAt(x, y) {
    var leaf = leafAt(x, y), b = box(leaf), w = b.x1 - b.x0, h = b.y1 - b.y0;
    var v = w * m.stretch() >= h;
    if ((v ? w : h) < 2 * (v ? MIN_W : MIN_H)) v = !v;
    var lo = v ? b.x0 : b.y0, hi = v ? b.x1 : b.y1, min = v ? MIN_W : MIN_H;
    if (hi - lo < 2 * min) return;
    var pos = Math.round(Math.min(hi - min, Math.max(lo + min, v ? x : y)));
    // Into line with a line close by, rather than a near miss.
    lines.forEach(function (l) { if (l.v === v && Math.abs(l.pos - pos) < NEAR && l.pos >= lo + min && l.pos <= hi - min) pos = l.pos; });
    var along = v ? y : x, from = along - (v ? b.y0 : b.x0) < (v ? b.y1 : b.x1) - along ? 'lo' : 'hi';
    grow(leaf, { v: v, pos: pos }, from, 'thin');
  }

  function advance() {
    var mo = motion;
    mo.t++;
    if (mo.kind === 'slide') {
      mo.line.pos = mo.from + (mo.to - mo.from) * ease(mo.t / SLIDE);
      mo.lines.forEach(drawLine);
      mo.tones.forEach(drawTone);
      if (mo.t >= SLIDE) { mo.line.pos = mo.to; mo.lines.forEach(drawLine); mo.tones.forEach(drawTone); motion = null; }
      return;
    }
    mo.line.grow = mo.kind === 'grow' ? mo.t / GROW : 1 - mo.t / GROW;
    if (mo.t >= GROW) {
      motion = null;
      if (mo.kind === 'retract') { mo.line.el.parentNode.removeChild(mo.line.el); unsplit(mo.line.node); return; }
      mo.line.grow = 1;
      handDown(mo.line.node);
    }
    drawLine(mo.line);
  }

  return {
    interval: 40,
    step: function () {
      if (motion) advance();
      if (fade) {
        var e = ease(++fade.t / FADE), tone = fade.tone;
        tone.el.setAttribute('opacity', (1 - e).toFixed(3));
        tone.spare.setAttribute('opacity', e.toFixed(3));
        if (fade.t >= FADE) {
          var old = tone.el;
          tone.el = tone.spare; tone.spare = old;
          tone.leaf = tone.next; tone.next = null;
          old.setAttribute('opacity', 0);
          fade = null;
        }
      }
      if (!motion && pending) { var p = pending; pending = null; cutAt(p[0], p[1]); return; }
      if (!motion && !fade && --rest <= 0) {
        next();
        rest = REST_MIN + Math.floor(rand() * (REST_MAX - REST_MIN));
      }
    },
    poke: function (x, y) {
      x = Math.min(W - 1, Math.max(1, x)); y = Math.min(H - 1, Math.max(1, y));
      if (motion) pending = [x, y]; else cutAt(x, y);
    }
  };
}
