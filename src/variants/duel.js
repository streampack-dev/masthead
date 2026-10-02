/* Duel: two fencers along the foot of the masthead, below the name, fencing back and forth across
   it and never finishing. One presses, stepping in and lunging; the other gives ground and
   parries, high or low, the blades meeting with a spark, and often answers with a riposte; then
   they reset, and sometimes the other takes the attack. Now and then they pause and salute. No
   touches, no winner. (With a nod to a certain duel atop some cliffs.) The bout comes from the
   seed, so ?ambientSeed=<n> replays it. A click makes the nearer fencer forget its training: a
   huge wind-up and a full-bodied swing, edge first, which the other, unimpressed, parries over
   its head; and sometimes the swinger's blade snaps, the end of it tumbling away, and it stares
   at what's left. */

/* Poses, for a fencer facing right, from its middle at the ground: where each foot is (and how
   high it's lifted), how high the hips are, how far the body leans forward, where the sword hand
   is from the shoulder, and the blade's angle (0 straight ahead, negative raised). */
export var POSES = {
  guard: { front: 14, back: -14, lift: 0, backLift: 0, hip: 32, lean: 0.06, hand: [14, 6], blade: -0.25 },
  stepIn: { front: 24, back: -12, lift: 4, backLift: 0, hip: 31, lean: 0.08, hand: [14, 6], blade: -0.22 },
  stepBack: { front: 12, back: -24, lift: 0, backLift: 4, hip: 31, lean: 0.02, hand: [13, 5], blade: -0.28 },
  lungeHigh: { front: 36, back: -20, lift: 0, backLift: 0, hip: 24, lean: 0.3, hand: [26, 0], blade: -0.06 },
  lungeLow: { front: 36, back: -20, lift: 0, backLift: 0, hip: 23, lean: 0.34, hand: [24, 12], blade: 0.22 },
  parryHigh: { front: 12, back: -17, lift: 0, backLift: 0, hip: 30, lean: -0.05, hand: [12, 7], blade: -1.15 },
  parryLow: { front: 12, back: -17, lift: 0, backLift: 0, hip: 29, lean: -0.02, hand: [12, 13], blade: 1.0 },
  salute: { front: 9, back: -9, lift: 0, backLift: 0, hip: 33, lean: 0, hand: [4, -16], blade: -1.5708 },
  // Not fencing at all: the sword cocked back over the shoulder, the whole body behind the swing,
  // and the follow-through.
  windUp: { front: 16, back: -16, lift: 0, backLift: 0, hip: 31, lean: -0.28, hand: [-6, -14], blade: -2.5 },
  swing: { front: 38, back: -20, lift: 0, backLift: 3, hip: 23, lean: 0.52, hand: [26, -6], blade: -0.55 },
  // Staring at what's left of a broken blade, held up before its face.
  stare: { front: 12, back: -14, lift: 0, backLift: 0, hip: 32, lean: 0.04, hand: [8, -2], blade: -1.3 },
  // The answer to it: the blade held flat over the head.
  parryHead: { front: 10, back: -18, lift: 0, backLift: 0, hip: 28, lean: -0.1, hand: [10, -16], blade: -0.2 }
};
var THIGH = 19, SHIN = 19, TORSO = 26, UPPER = 13, FORE = 13, BLADE = 42, GAP = 92;
/* How much of a broken blade is left in the hand. */
export var STUB = 0.3;

/* Whether the [n]th click's swing breaks the blade, for a run of [seed]: about one in three, the
   same every time, and apart from the bout's own randomness so a seed replays the same bout. */
export function breaks(seed, n) {
  var x = Math.imul(((seed >>> 0) ^ Math.imul(n + 1, 0x9e3779b9)) >>> 0, 2246822519) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 3266489917) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) % 3 === 0;
}

function lerp(a, b, t) { return a + (b - a) * t; }
export function mixPose(a, b, t) {
  var out = {};
  for (var k in a) out[k] = k === 'hand' ? [lerp(a.hand[0], b.hand[0], t), lerp(a.hand[1], b.hand[1], t)] : lerp(a[k], b[k], t);
  return out;
}

/* The joint between [from] and [to] on two bones of [l1] and [l2], bent toward [bend] (1 or -1). */
function joint(from, to, l1, l2, bend) {
  var dx = to[0] - from[0], dy = to[1] - from[1], d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01);
  var a = Math.atan2(dy, dx), cos = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  var b = Math.acos(Math.max(-1, Math.min(1, cos)));
  return [from[0] + Math.cos(a - bend * b) * l1, from[1] + Math.sin(a - bend * b) * l1];
}

/* A fencer in [pose], facing right from (0, 0) at the ground: its limbs as line segments, its
   head, and its blade from hilt to tip. */
export function figure(p) {
  var hip = [0, -p.hip];
  var shoulder = [Math.sin(p.lean) * TORSO, -p.hip - Math.cos(p.lean) * TORSO];
  var head = [shoulder[0] + Math.sin(p.lean) * 8, shoulder[1] - Math.cos(p.lean) * 8];
  var front = [p.front, -p.lift], back = [p.back, -p.backLift];
  var hand = [shoulder[0] + p.hand[0], shoulder[1] + p.hand[1]];
  var tip = [hand[0] + Math.cos(p.blade) * BLADE, hand[1] + Math.sin(p.blade) * BLADE];
  return {
    limbs: [
      [hip, joint(hip, front, THIGH, SHIN, -1), front],
      [hip, joint(hip, back, THIGH, SHIN, -1), back],
      [hip, shoulder],
      [shoulder, joint(shoulder, hand, UPPER, FORE, -1), hand],
      // The other arm, raised behind for balance.
      [shoulder, [shoulder[0] - 9, shoulder[1] + 3], [shoulder[0] - 14, shoulder[1] - 8]]
    ],
    head: head, hand: hand, tip: tip
  };
}

/* Where two blades cross, if they do. */
export function crossing(a1, a2, b1, b2) {
  var d = (a2[0] - a1[0]) * (b2[1] - b1[1]) - (a2[1] - a1[1]) * (b2[0] - b1[0]);
  if (Math.abs(d) < 1e-9) return null;
  var t = ((b1[0] - a1[0]) * (b2[1] - b1[1]) - (b1[1] - a1[1]) * (b2[0] - b1[0])) / d;
  var u = ((b1[0] - a1[0]) * (a2[1] - a1[1]) - (b1[1] - a1[1]) * (a2[0] - a1[0])) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [a1[0] + (a2[0] - a1[0]) * t, a1[1] + (a2[1] - a1[1]) * t] : null;
}

export default function duel(layer, m) {
  var W = m.width, H = m.height, ground = H - 8;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  m.el('path', { 'class': 'masthead-duel-ground', d: 'M0 ' + ground + 'H' + W });
  var group = m.el('g');
  var fencers = [0, 1].map(function (k) {
    var g = m.el('g', { 'class': 'masthead-duel-fencer masthead-duel-fencer-' + k }, group);
    return {
      g: g, body: m.el('path', { 'class': 'masthead-duel-body' }, g),
      head: m.el('circle', { r: 6, 'class': 'masthead-duel-head' }, g),
      blade: m.el('path', { 'class': 'masthead-duel-blade' }, g)
    };
  });
  var spark = m.el('path', { 'class': 'masthead-duel-spark', opacity: 0 }, group);
  // The broken end of a blade, in the masthead's own coordinates, so it falls where it falls
  // however the fencers move on.
  var pieceEl = m.el('path', { 'class': 'masthead-duel-blade masthead-duel-piece', opacity: 0 });
  var seed = m.seed() >>> 0, pokes = 0, broken = [false, false], piece = null, lastBlades = null, lastMid = 0;

  // Where each fencer stands (the left one faces right, the other left), and in what pose.
  var state = { a: { x: W / 2 - GAP / 2, pose: POSES.guard }, b: { x: W / 2 + GAP / 2, pose: POSES.guard } };
  var from = state, plan = [], step = 0, sparkAge = 99;

  function key(dur, aPose, aX, bPose, bX, clash, extra) {
    var k = { dur: dur, a: { pose: POSES[aPose], x: aX }, b: { pose: POSES[bPose], x: bX }, clash: clash };
    for (var e in extra || {}) k[e] = extra[e];
    plan.push(k);
  }

  /* The next phrase of the bout: the attacker steps in, lunges high or low, the other parries
     (and maybe ripostes), and they reset. Near an edge, the one with its back to it attacks. */
  function phrase() {
    var a = state.a.x, b = state.b.x;
    var left = a < 160 ? true : b > W - 160 ? false : rand() < 0.5;
    // Moving forward for whoever attacks: right for the left fencer, left for the other.
    var dir = left ? 1 : -1, steps = 1 + Math.floor(rand() * 2);
    function pose(attacker, defender) { return left ? [attacker, defender] : [defender, attacker]; }
    for (var s = 0; s < steps; s++) {
      var p1 = pose('stepIn', 'stepBack');
      key(8, p1[0], a + dir * 6, p1[1], b + dir * 6);
      a += dir * 12; b += dir * 12;
      key(8, 'guard', a, 'guard', b);
    }
    var high = rand() < 0.5, p2 = pose(high ? 'lungeHigh' : 'lungeLow', high ? 'parryHigh' : 'parryLow');
    key(10, p2[0], left ? a + 10 : a - 4, p2[1], left ? b + 4 : b - 10, true);
    key(5, p2[0], left ? a + 10 : a - 4, p2[1], left ? b + 4 : b - 10);
    if (rand() < 0.6) {
      // A riposte: the defender answers, the attacker parries.
      var high2 = rand() < 0.5, p3 = pose(high2 ? 'parryHigh' : 'parryLow', high2 ? 'lungeHigh' : 'lungeLow');
      key(10, p3[0], left ? a - 2 : a + 10, p3[1], left ? b - 10 : b + 2, true);
      key(5, p3[0], left ? a - 2 : a + 10, p3[1], left ? b - 10 : b + 2);
    }
    key(12, 'guard', a, 'guard', b);
    if (rand() < 0.1) { key(16, 'salute', a, 'salute', b); key(30, 'salute', a, 'salute', b); key(16, 'guard', a, 'guard', b); }
    key(10 + Math.floor(rand() * 25), 'guard', a, 'guard', b);
  }

  function ease(t) { return t * t * (3 - 2 * t); }

  /* Where the fencers are now, partway from one key to the next. */
  function current() {
    var cur = plan[0], t = cur ? ease(Math.min(1, step / cur.dur)) : 1;
    return cur ? {
      a: { pose: mixPose(from.a.pose, cur.a.pose, t), x: lerp(from.a.x, cur.a.x, t) },
      b: { pose: mixPose(from.b.pose, cur.b.pose, t), x: lerp(from.b.x, cur.b.x, t) }
    } : state;
  }

  /* The haymaker: [left] (the left fencer, or the right) winds up and swings, the other parries
     over its head, the swinger recoils, and both come back to guard. */
  function haymaker(left, snaps) {
    var a = state.a.x, b = state.b.x, dir = left ? 1 : -1;
    function pose(attacker, defender) { return left ? [attacker, defender] : [defender, attacker]; }
    var p = pose('windUp', 'guard');
    key(12, p[0], a, p[1], b);
    p = pose('swing', 'parryHead');
    key(6, p[0], a + dir * 10, p[1], b + dir * 4, true, snaps ? { snap: left ? 0 : 1 } : null);
    key(8, p[0], a + dir * 10, p[1], b + dir * 4);
    if (snaps) {
      // It looks at what it has left, for a long moment.
      p = pose('stare', 'guard');
      key(10, p[0], a + dir * 4, p[1], b + dir * 2);
      key(26, p[0], a + dir * 4, p[1], b + dir * 2);
    }
    p = pose('stepBack', 'guard');
    key(10, p[0], a - dir * 4, p[1], b + dir * 2);
    // Back in guard, whole again: a fresh blade, the way cartoons have one.
    key(14, 'guard', a, 'guard', b, false, { mend: true });
    key(16, 'guard', a, 'guard', b);
  }

  /* The [k]th fencer's blade breaks: what's past the stub goes tumbling, up and away from the
     other fencer, turning over as it falls. */
  function snap(k) {
    broken[k] = true;
    var squeeze = 1 / m.stretch(), hand = lastBlades[k][0], tip = lastBlades[k][1], facing = k ? -1 : 1;
    var art = function (q) { return [lastMid + q[0] * squeeze, ground + q[1]]; };
    var from = art([hand[0] + (tip[0] - hand[0]) * STUB, hand[1] + (tip[1] - hand[1]) * STUB]), to = art(tip);
    piece = {
      x: (from[0] + to[0]) / 2, y: (from[1] + to[1]) / 2, len: BLADE * (1 - STUB),
      angle: Math.atan2(tip[1] - hand[1], tip[0] - hand[0]),
      vx: -facing * 1.6, vy: -5, spin: 0.38 * facing, down: false, age: 0
    };
  }

  function drawPiece() {
    if (!piece) { pieceEl.setAttribute('opacity', 0); return; }
    if (!piece.down) {
      piece.x += piece.vx; piece.y += piece.vy; piece.vy += 0.4; piece.angle += piece.spin;
      // It lands flat, on the ground, and lies there.
      if (piece.y >= ground - 1.5) { piece.y = ground - 1.5; piece.angle = 0; piece.down = true; }
    } else piece.age += 1;
    if (piece.age > 70) { piece = null; pieceEl.setAttribute('opacity', 0); return; }
    var squeeze = 1 / m.stretch(), hx = Math.cos(piece.angle) * piece.len / 2 * squeeze, hy = Math.sin(piece.angle) * piece.len / 2;
    pieceEl.setAttribute('d', 'M' + (piece.x - hx).toFixed(1) + ' ' + (piece.y - hy).toFixed(1) + 'L' + (piece.x + hx).toFixed(1) + ' ' + (piece.y + hy).toFixed(1));
    pieceEl.setAttribute('opacity', piece.age < 55 ? 1 : (1 - (piece.age - 55) / 15).toFixed(2));
  }

  function draw() {
    var now = current();
    var mid = (now.a.x + now.b.x) / 2;
    // Both fencers are drawn in one group about their middle, so they keep their shape however the
    // masthead is stretched and their blades still meet.
    group.setAttribute('transform', 'translate(' + mid.toFixed(1) + ' ' + ground + ') scale(' + (1 / m.stretch()).toFixed(4) + ' 1)');
    var blades = [];
    [now.a, now.b].forEach(function (f, k) {
      var fig = figure(f.pose), facing = k ? -1 : 1, ox = f.x - mid;
      function pt(p) { return [ox + facing * p[0], p[1]]; }
      var d = fig.limbs.map(function (l) { return l.map(function (p, j) { var q = pt(p); return (j ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(''); }).join('');
      var hand = pt(fig.hand), tip = pt(fig.tip), head = pt(fig.head);
      if (broken[k]) tip = [hand[0] + (tip[0] - hand[0]) * STUB, hand[1] + (tip[1] - hand[1]) * STUB];
      fencers[k].body.setAttribute('d', d);
      fencers[k].head.setAttribute('cx', head[0].toFixed(1));
      fencers[k].head.setAttribute('cy', head[1].toFixed(1));
      // The blade, and a small guard across it at the hilt.
      var gx = Math.sin(f.pose.blade) * 4 * facing, gy = Math.cos(f.pose.blade) * 4;
      fencers[k].blade.setAttribute('d', 'M' + hand[0].toFixed(1) + ' ' + hand[1].toFixed(1) + 'L' + tip[0].toFixed(1) + ' ' + tip[1].toFixed(1) +
        'M' + (hand[0] - gx).toFixed(1) + ' ' + (hand[1] + gy).toFixed(1) + 'L' + (hand[0] + gx).toFixed(1) + ' ' + (hand[1] - gy).toFixed(1));
      blades.push([hand, pt(fig.tip)]);
    });
    lastBlades = blades; lastMid = mid;
    if (sparkAge === 0) {
      var at = crossing(blades[0][0], blades[0][1], blades[1][0], blades[1][1]) ||
        [(blades[0][1][0] + blades[1][1][0]) / 2, (blades[0][1][1] + blades[1][1][1]) / 2];
      spark.setAttribute('d', 'M' + (at[0] - 5).toFixed(1) + ' ' + at[1].toFixed(1) + 'h10M' + at[0].toFixed(1) + ' ' + (at[1] - 5).toFixed(1) + 'v10' +
        'M' + (at[0] - 3.5).toFixed(1) + ' ' + (at[1] - 3.5).toFixed(1) + 'l7 7M' + (at[0] - 3.5).toFixed(1) + ' ' + (at[1] + 3.5).toFixed(1) + 'l7 -7');
    }
    spark.setAttribute('opacity', sparkAge < 8 ? (1 - sparkAge / 8).toFixed(2) : 0);
  }

  phrase();
  draw();

  return {
    interval: 40,
    step: function () {
      sparkAge += 1;
      step += 1;
      var cur = plan[0];
      if (step >= cur.dur) {
        if (cur.clash) sparkAge = 0;
        if (cur.snap !== undefined) snap(cur.snap);
        if (cur.mend) broken = [false, false];
        state = { a: cur.a, b: cur.b };
        from = state;
        plan.shift();
        step = 0;
        if (!plan.length) phrase();
      }
      draw();
      drawPiece();
    },
    // A click: the fencer nearer it, as drawn, takes its great swing, cutting short the phrase.
    poke: function (x) {
      var now = current(), mid = (now.a.x + now.b.x) / 2, squeeze = 1 / m.stretch();
      var ax = mid + (now.a.x - mid) * squeeze, bx = mid + (now.b.x - mid) * squeeze;
      from = now; state = now; plan = []; step = 0;
      // A blade broken by the last click is whole again for this one.
      broken = [false, false];
      haymaker(Math.abs(x - ax) <= Math.abs(x - bx), breaks(seed, pokes++));
    }
  };
}
