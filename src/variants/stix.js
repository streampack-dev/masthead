/* Stix: the C64 claim-the-field game, playing itself. The Stix, a line bouncing about the open
   field and trailing fading copies of itself, wanders; a marker on the claimed edge cuts a line
   into the open, turns, and comes back to the edge, and the side of its cut without the Stix is
   claimed, hatched. If the Stix touches the cut before it's closed, the cut is lost. When most of
   the field is claimed it's cleared and begins again. The game comes from the seed, so
   ?ambientSeed=<n> replays it. */
export var GW = 120, GH = 32;
var FREE = 0, CLAIMED = 1, CUT = 2;
var TRAILS = 12, STIX_SPEED = 2.4, MARKER_EVERY = 2, FULL = 0.72;

/* A field with only its border claimed. */
export function field() {
  var cells = new Uint8Array(GW * GH);
  for (var x = 0; x < GW; x++) { cells[x] = CLAIMED; cells[(GH - 1) * GW + x] = CLAIMED; }
  for (var y = 0; y < GH; y++) { cells[y * GW] = CLAIMED; cells[y * GW + GW - 1] = CLAIMED; }
  return cells;
}

/* Close a cut: it's claimed, and so is every open cell not reachable from (sx, sy), where the
   Stix is. Returns how many cells were claimed. */
export function claim(cells, sx, sy) {
  var reach = new Uint8Array(cells.length), stack = [sy * GW + sx], claimed = 0;
  if (cells[stack[0]] === FREE) reach[stack[0]] = 1; else stack = [];
  while (stack.length) {
    var i = stack.pop(), x = i % GW, y = (i - x) / GW;
    [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(function (n) {
      var j = n[1] * GW + n[0];
      if (n[0] >= 0 && n[0] < GW && n[1] >= 0 && n[1] < GH && !reach[j] && cells[j] === FREE) { reach[j] = 1; stack.push(j); }
    });
  }
  for (var k = 0; k < cells.length; k++) {
    if (cells[k] === CUT || (cells[k] === FREE && !reach[k])) { cells[k] = CLAIMED; claimed++; }
  }
  return claimed;
}

/* The shortest way across claimed cells from [from] to [to], as cell indexes. */
export function route(cells, from, to) {
  var prev = new Int32Array(cells.length).fill(-1), queue = [from], head = 0;
  prev[from] = from;
  while (head < queue.length) {
    var i = queue[head++];
    if (i === to) break;
    var x = i % GW, y = (i - x) / GW;
    [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(function (n) {
      var j = n[1] * GW + n[0];
      if (n[0] >= 0 && n[0] < GW && n[1] >= 0 && n[1] < GH && prev[j] < 0 && cells[j] === CLAIMED) { prev[j] = i; queue.push(j); }
    });
  }
  if (prev[to] < 0) return null;
  var path = [to];
  while (path[0] !== from) path.unshift(prev[path[0]]);
  return path;
}

export default function stix(layer, m) {
  var W = m.width, H = m.height, cw = W / GW, ch = H / GH;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  // Claimed ground is hatched, as the C64 drew it, rather than filled.
  var defs = m.el('defs');
  var hatch = m.el('pattern', { id: 'masthead-stix-hatch', patternUnits: 'userSpaceOnUse', width: 8, height: 8 }, defs);
  m.el('path', { d: 'M-2 2L2 -2M0 8L8 0M6 10L10 6', 'class': 'masthead-stix-hatching' }, hatch);
  var ground = m.el('path', { 'class': 'masthead-stix-claimed', fill: 'url(#masthead-stix-hatch)' });
  m.el('rect', { 'class': 'masthead-stix-border', x: cw / 2, y: ch / 2, width: W - cw, height: H - ch });
  var cutEl = m.el('path', { 'class': 'masthead-stix-cut' });
  var trailEls = [];
  for (var t = 0; t < TRAILS; t++) {
    trailEls.push(m.el('path', { 'class': 'masthead-stix-line', 'stroke-opacity': (1 - t / TRAILS).toFixed(2) }));
  }
  var markerEl = m.el('path', { 'class': 'masthead-stix-marker', d: 'M0 -5L5 0L0 5L-5 0Z' });

  var cells, line, history, marker, plan, rest;

  function reset() {
    cells = field();
    line = [
      { x: W * (0.3 + rand() * 0.4), y: H * (0.3 + rand() * 0.4), vx: (rand() - 0.5) * 2 * STIX_SPEED, vy: (rand() - 0.5) * 2 * STIX_SPEED },
      { x: W * (0.3 + rand() * 0.4), y: H * (0.3 + rand() * 0.4), vx: (rand() - 0.5) * 2 * STIX_SPEED, vy: (rand() - 0.5) * 2 * STIX_SPEED }
    ];
    history = [];
    marker = { at: GW * (GH - 1) + Math.floor(GW / 2) };
    plan = null;
    rest = 0;
    drawGround();
  }

  function cellAt(x, y) {
    var cx = Math.floor(x / cw), cy = Math.floor(y / ch);
    if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) return CLAIMED;
    return cells[cy * GW + cx];
  }

  /* The Stix's ends bounce off claimed ground. */
  function move(end) {
    var nx = end.x + end.vx, ny = end.y + end.vy;
    var blockedX = cellAt(nx, end.y) === CLAIMED, blockedY = cellAt(end.x, ny) === CLAIMED;
    if (blockedX) end.vx = -end.vx;
    if (blockedY) end.vy = -end.vy;
    if (!blockedX && !blockedY && cellAt(nx, ny) === CLAIMED) { end.vx = -end.vx; end.vy = -end.vy; }
    end.x += end.vx; end.y += end.vy;
    // A wobble, so it wanders as the Stix does.
    end.vx += (rand() - 0.5) * 0.3; end.vy += (rand() - 0.5) * 0.3;
    var s = Math.hypot(end.vx, end.vy) || 1;
    end.vx *= STIX_SPEED / s; end.vy *= STIX_SPEED / s;
  }

  /* An open cell along the Stix, to claim from. */
  function stixCell() {
    for (var k = 0; k <= 24; k++) {
      var f = k / 24, x = line[0].x + (line[1].x - line[0].x) * f, y = line[0].y + (line[1].y - line[0].y) * f;
      if (cellAt(x, y) === FREE) return Math.floor(y / ch) * GW + Math.floor(x / cw);
    }
    return null;
  }

  function touchesCut() {
    for (var k = 0; k <= 24; k++) {
      var f = k / 24;
      if (cellAt(line[0].x + (line[1].x - line[0].x) * f, line[0].y + (line[1].y - line[0].y) * f) === CUT) return true;
    }
    return false;
  }

  /* The next cut: from a claimed cell on the open field's edge, in, across, and back out. */
  function nextPlan() {
    var edges = [];
    for (var i = 0; i < cells.length; i++) {
      if (cells[i] !== CLAIMED) continue;
      var x = i % GW, y = (i - x) / GW;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        var nx = x + d[0], ny = y + d[1];
        if (nx > 0 && ny > 0 && nx < GW - 1 && ny < GH - 1 && cells[ny * GW + nx] === FREE) edges.push({ i: i, d: d });
      });
    }
    if (!edges.length) return null;
    var start = edges[Math.floor(rand() * edges.length)];
    var path = route(cells, marker.at, start.i);
    if (!path) return null;
    var turn = rand() < 0.5 ? 1 : -1, across = [start.d[1] * turn, -start.d[0] * turn];
    return { walk: path.slice(1), d: start.d, across: across, legs: [5 + Math.floor(rand() * 12), 12 + Math.floor(rand() * 34)], leg: 0, run: 0, cut: [] };
  }

  /* The marker's next cell: along the claimed ground to its start, then cutting in. */
  function advance() {
    if (!plan) { plan = nextPlan(); if (!plan) return; }
    if (plan.walk.length) { marker.at = plan.walk.shift(); return; }
    var x = marker.at % GW, y = (marker.at - x) / GW;
    var dir = plan.leg === 0 ? plan.d : plan.leg === 1 ? plan.across : [-plan.d[0], -plan.d[1]];
    var nx = x + dir[0], ny = y + dir[1], j = ny * GW + nx;
    if (nx < 0 || ny < 0 || nx >= GW || ny >= GH || cells[j] === CUT) { lose(); return; }
    if (cells[j] === CLAIMED) {
      if (plan.cut.length) {
        // Closed: the side without the Stix is claimed.
        marker.at = j;
        var open = stixCell();
        if (open !== null) claim(cells, open % GW, (open - open % GW) / GW);
        else plan.cut.forEach(function (c) { cells[c] = CLAIMED; });
        settle();
        plan = null;
        drawGround();
        return;
      }
      plan = null;
      return;
    }
    cells[j] = CUT;
    plan.cut.push(j);
    marker.at = j;
    plan.run += 1;
    if (plan.leg < 2 && plan.run >= plan.legs[plan.leg]) { plan.leg += 1; plan.run = 0; }
  }

  /* The Stix touched the cut: it's lost, and the marker goes back to where it began. */
  function lose() {
    if (!plan) return;
    plan.cut.forEach(function (j) { cells[j] = FREE; });
    var x = plan.cut.length ? plan.cut[0] : marker.at;
    // Back to the claimed cell the cut left from.
    var cx = x % GW, cy = (x - cx) / GW;
    marker.at = (cy - plan.d[1]) * GW + (cx - plan.d[0]);
    plan = null;
  }

  /* After a claim, an end of the Stix that's now in claimed ground moves back toward the other. */
  function settle() {
    for (var k = 0; k < 2; k++) {
      var end = line[k], other = line[1 - k], tries = 0;
      while (cellAt(end.x, end.y) === CLAIMED && tries++ < 200) { end.x += (other.x - end.x) * 0.05; end.y += (other.y - end.y) * 0.05; }
    }
  }

  function drawGround() {
    var d = [];
    for (var y = 1; y < GH - 1; y++) {
      var x = 1;
      while (x < GW - 1) {
        if (cells[y * GW + x] !== CLAIMED) { x++; continue; }
        var from = x;
        while (x < GW - 1 && cells[y * GW + x] === CLAIMED) x++;
        d.push('M' + (from * cw).toFixed(1) + ' ' + (y * ch).toFixed(1) + 'H' + (x * cw).toFixed(1) + 'V' + ((y + 1) * ch).toFixed(1) + 'H' + (from * cw).toFixed(1) + 'Z');
      }
    }
    ground.setAttribute('d', d.join(''));
  }

  function centre(i) { var x = i % GW, y = (i - x) / GW; return [(x + 0.5) * cw, (y + 0.5) * ch]; }

  function draw(n) {
    // The fading copies are a few steps apart, so they read as copies rather than a smear.
    if (n % 3 === 0) history.unshift('M' + line[0].x.toFixed(1) + ' ' + line[0].y.toFixed(1) + 'L' + line[1].x.toFixed(1) + ' ' + line[1].y.toFixed(1));
    if (history.length > TRAILS) history.pop();
    trailEls.forEach(function (el, k) { el.setAttribute('d', history[k] || ''); });
    cutEl.setAttribute('d', plan && plan.cut.length ? plan.cut.map(function (j, k) { var c = centre(j); return (k ? 'L' : 'M') + c[0].toFixed(1) + ' ' + c[1].toFixed(1); }).join('') : '');
    var c = centre(marker.at);
    markerEl.setAttribute('transform', 'translate(' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + ') scale(' + (1 / m.stretch()).toFixed(4) + ' 1)');
  }

  reset();
  draw(0);

  function claimedShare() {
    var n = 0;
    for (var i = 0; i < cells.length; i++) if (cells[i] === CLAIMED) n++;
    return n / cells.length;
  }

  return {
    interval: 40,
    step: function (n) {
      if (rest > 0) { if (--rest === 0) reset(); draw(n); return; }
      move(line[0]); move(line[1]);
      if (n % MARKER_EVERY === 0) advance();
      if (plan && plan.cut.length && touchesCut()) lose();
      if (claimedShare() >= FULL) rest = 90;
      draw(n);
    }
  };
}
