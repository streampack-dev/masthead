/* Blockpeek: a player on the far side of the masthead, in the blocky style of the block-building
   games, breaking a block to peer through at you. Only a faint patch of the wall shows, around
   the block being worked on: cracks spread over it, stage by stage, until it pops out, and a
   blocky head looks through the hole, glances about, blinks, and ducks away. The block goes back,
   or the one beside it is broken next; then a pause, and somewhere else. Holes are in the low
   rows, or to the sides, away from the name. The spots and the cracks come from the seed, so
   ?ambientSeed=<n> replays them. A click on the block being mined helps break it; a click on the
   hole while someone's looking makes them duck; a click anywhere else has them mine there. */
export var BLOCK = 44;
export var STAGES = 10;
var STEP_MS = 40;
var STAGE_STEPS = 13;

/* The phases of a visit, in order, and how many steps each takes (mining is per stage). */
var APPEAR = 20, POP = 8, PEEK = 110, DUCK = 14, PLACE = 10, FADE = 20;

/* Where holes may be, as block centres in the art, for a masthead stretched [stretch] times: the
   bottom two rows anywhere, and higher rows only well to the sides of the name. Blocks are
   squares on screen, so a block is BLOCK / stretch wide in the art. */
export function candidates(stretch, width, height) {
  var bw = BLOCK / stretch;
  var cols = Math.floor(width / bw), rows = Math.floor(height / BLOCK);
  var out = [];
  for (var r = 1; r < rows; r++) {
    for (var c = 1; c < cols - 1; c++) {
      var x = (c + 0.5) * bw, y = (r + 0.5) * BLOCK;
      var low = r >= rows - 2;
      var aside = Math.abs(x - width / 2) > width * 0.3;
      if (low || aside) out.push({ x: x, y: y });
    }
  }
  return out;
}

/* The block whose centre is nearest the art's (x, y). */
export function cellAt(x, y, stretch, height) {
  var bw = BLOCK / stretch;
  var rows = Math.floor(height / BLOCK);
  var c = Math.max(0, Math.floor(x / bw)), r = Math.min(rows - 1, Math.max(0, Math.floor(y / BLOCK)));
  return { x: (c + 0.5) * bw, y: (r + 0.5) * BLOCK };
}

/* A block's cracks: STAGES groups of short segments in the block's own square (-16..16), each
   stage's reaching further from the middle, as a pick's cracks do. */
export function cracks(rand) {
  var h = BLOCK / 2 - 2, stages = [];
  var tips = [[0, 0]];
  for (var s = 0; s < STAGES; s++) {
    var segs = [];
    var grow = tips.splice(0, tips.length);
    grow.forEach(function (tip) {
      var branches = s < 1 || rand() < 0.3 ? 2 : 1;
      for (var b = 0; b < branches; b++) {
        var a = rand() * Math.PI * 2, len = 3 + rand() * 3;
        var x = Math.max(-h, Math.min(h, tip[0] + Math.cos(a) * len));
        var y = Math.max(-h, Math.min(h, tip[1] + Math.sin(a) * len));
        segs.push([tip[0], tip[1], x, y]);
        tips.push([x, y]);
      }
    });
    // Keep it a crack, not a thicket.
    while (tips.length > 4) tips.splice(Math.floor(rand() * tips.length), 1);
    stages.push(segs);
  }
  return stages;
}

function square(half) {
  return 'M' + -half + ' ' + -half + 'H' + half + 'V' + half + 'H' + -half + 'Z';
}

export default function blockpeek(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var half = BLOCK / 2;
  var patch = m.el('g', { 'class': 'masthead-blockpeek-patch', opacity: 0 });
  // The neighbours: faint outlines, fainter toward the patch's edge.
  for (var dy = -1; dy <= 1; dy++) {
    for (var dx = -2; dx <= 2; dx++) {
      if (!dx && !dy) continue;
      var far = Math.max(Math.abs(dx), Math.abs(dy));
      m.el('path', { 'class': 'masthead-blockpeek-wall', d: square(half - 0.5), transform: 'translate(' + dx * BLOCK + ' ' + dy * BLOCK + ')', opacity: far > 1 ? 0.3 : 0.6 }, patch);
    }
  }
  var block = m.el('path', { 'class': 'masthead-blockpeek-block', d: square(half - 0.5) }, patch);
  var crackPath = m.el('path', { 'class': 'masthead-blockpeek-crack' }, patch);
  var hole = m.el('g', { 'class': 'masthead-blockpeek-hole', opacity: 0 }, patch);
  m.el('path', { d: square(half - 0.5) + square(half - 6) + 'M' + -(half - 0.5) + ' ' + -(half - 0.5) + 'L' + -(half - 6) + ' ' + -(half - 6) +
    'M' + (half - 0.5) + ' ' + -(half - 0.5) + 'L' + (half - 6) + ' ' + -(half - 6) + 'M' + (half - 0.5) + ' ' + (half - 0.5) + 'L' + (half - 6) + ' ' + (half - 6) +
    'M' + -(half - 0.5) + ' ' + (half - 0.5) + 'L' + -(half - 6) + ' ' + (half - 6) }, hole);
  var head = m.el('g', { 'class': 'masthead-blockpeek-head', opacity: 0 }, patch);
  // A face that fills most of the hole, eyes two of its eight "pixels" wide, as in the games.
  var face = BLOCK * 0.3, px = face / 4;
  m.el('path', { 'class': 'masthead-blockpeek-face', d: square(face) }, head);
  var eyes = [-1, 1].map(function () { return m.el('rect', { 'class': 'masthead-blockpeek-eye', width: px * 2, height: px }, head); });
  var placed = m.el('path', { 'class': 'masthead-blockpeek-block', d: square(half - 0.5), opacity: 0 }, patch);

  var stages = [];
  var spot = null;
  var phase = 'rest', t = 0, wait = 30 + Math.floor(rand() * 40);
  var stage = 0, stageT = 0, rate = 1;
  var look = 0, blink = 0;

  function chooseSpot() {
    var all = candidates(m.stretch(), W, H);
    return all[Math.floor(rand() * all.length)];
  }

  function begin(at) {
    spot = at;
    stages = cracks(rand);
    stage = 0; stageT = 0; rate = 1;
    phase = 'appear'; t = 0;
  }

  function drawCracks() {
    var d = [];
    for (var s = 0; s < stage; s++) {
      stages[s].forEach(function (g) { d.push('M' + g[0].toFixed(1) + ' ' + g[1].toFixed(1) + 'L' + g[2].toFixed(1) + ' ' + g[3].toFixed(1)); });
    }
    crackPath.setAttribute('d', d.join(''));
    crackPath.setAttribute('stroke-width', (0.6 + stage * 0.07).toFixed(2));
  }

  function draw() {
    if (!spot) { patch.setAttribute('opacity', 0); return; }
    patch.setAttribute('transform', 'translate(' + spot.x.toFixed(1) + ' ' + spot.y.toFixed(1) + ') scale(' + (1 / m.stretch()).toFixed(4) + ' 1)');
    var seen = phase === 'appear' ? t / APPEAR : phase === 'fade' ? 1 - t / FADE : phase === 'rest' ? 0 : 1;
    patch.setAttribute('opacity', Math.max(0, Math.min(1, seen)).toFixed(2));
    var broken = phase === 'pop' || phase === 'peek' || phase === 'duck';
    block.setAttribute('opacity', broken || phase === 'place' ? 0 : 1);
    crackPath.setAttribute('opacity', broken || phase === 'place' || phase === 'fade' ? 0 : 1);
    hole.setAttribute('opacity', broken ? (phase === 'pop' ? (t / POP).toFixed(2) : 1) : phase === 'place' ? (1 - t / PLACE).toFixed(2) : 0);
    var placing = phase === 'place' ? 0.5 + 0.5 * t / PLACE : 0;
    placed.setAttribute('opacity', phase === 'place' ? 1 : 0);
    placed.setAttribute('transform', 'scale(' + placing.toFixed(3) + ')');
    // The head comes up close in the hole, and backs off as it ducks.
    var shown = phase === 'peek' ? Math.min(1, t / 10) : phase === 'duck' ? 1 - t / DUCK : 0;
    head.setAttribute('opacity', shown.toFixed(2));
    head.setAttribute('transform', 'scale(' + (0.7 + 0.3 * shown).toFixed(3) + ')');
    var shut = blink > 0;
    eyes.forEach(function (eye, i) {
      eye.setAttribute('x', ((i ? 1 : -3) * px + look * px * 0.6).toFixed(1));
      eye.setAttribute('y', (shut ? px * 0.4 : 0).toFixed(1));
      eye.setAttribute('height', (shut ? px * 0.25 : px).toFixed(1));
    });
  }

  function peekStep() {
    // Glance at you, left, right, back at you; blink now and then.
    var at = t / PEEK;
    look = at < 0.25 ? 0 : at < 0.45 ? -1 : at < 0.65 ? 1 : 0;
    if (blink > 0) blink--;
    else if (t === 30 || t === 80 || rand() < 0.01) blink = 4;
  }

  function step() {
    t++;
    if (phase === 'rest') {
      if (t >= wait) begin(chooseSpot());
    } else if (phase === 'appear') {
      if (t >= APPEAR) { phase = 'mine'; t = 0; }
    } else if (phase === 'mine') {
      stageT += rate;
      if (stageT >= STAGE_STEPS) {
        stageT = 0;
        stage++;
        drawCracks();
        if (stage >= STAGES) { phase = 'pop'; t = 0; }
      }
    } else if (phase === 'pop') {
      if (t >= POP) { phase = 'peek'; t = 0; look = 0; }
    } else if (phase === 'peek') {
      peekStep();
      if (t >= PEEK) { phase = 'duck'; t = 0; }
    } else if (phase === 'duck') {
      if (t >= DUCK) {
        // Now and then the player breaks the block beside this one next; otherwise it goes back.
        if (rand() < 0.35) {
          var bw = BLOCK / m.stretch();
          var next = { x: spot.x + (rand() < 0.5 ? -bw : bw), y: spot.y };
          if (next.x > bw && next.x < W - bw) { phase = 'place'; t = 0; spot.next = next; return; }
        }
        phase = 'place'; t = 0;
      }
    } else if (phase === 'place') {
      if (t >= PLACE) {
        if (spot.next) { var n = spot.next; begin(n); phase = 'mine'; t = 0; }
        else { phase = 'fade'; t = 0; }
      }
    } else if (phase === 'fade') {
      if (t >= FADE) { phase = 'rest'; t = 0; spot = null; wait = 80 + Math.floor(rand() * 120); }
    }
  }

  drawCracks();
  draw();

  return {
    interval: STEP_MS,
    poke: function (x, y) {
      var bw = BLOCK / m.stretch();
      var on = spot && Math.abs(x - spot.x) <= bw / 2 && Math.abs(y - spot.y) <= half;
      if (on && (phase === 'mine' || phase === 'appear')) {
        // A hand from this side: a stage at once, and quicker mining for the rest.
        phase = 'mine';
        stage = Math.min(STAGES - 1, stage + 1);
        stageT = STAGE_STEPS - 1;
        rate = Math.min(4, rate + 0.75);
        drawCracks();
      } else if (on && (phase === 'pop' || phase === 'peek')) {
        phase = 'duck'; t = 0;
      } else {
        // Over there, then: the cracks here heal, and mining starts where you clicked.
        begin(cellAt(x, y, m.stretch(), H));
        phase = 'mine';
        drawCracks();
      }
      draw();
    },
    step: function () {
      step();
      draw();
    }
  };
}
