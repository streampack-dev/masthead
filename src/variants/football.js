/* Football: a player in pads crossing a field along the foot of the masthead, running a play. A
   receiver runs a route and a ball arcs in from behind him: usually he catches it and runs on;
   sometimes it bounces off his hands and tumbles away, and he stops, hands on his helmet. Or a
   runner carries the ball, and a defender coming the other way dives at him; he hurdles the dive,
   and the defender slides, gets up and jogs off. Then an empty field for a while. The plays come
   from the seed, so ?ambientSeed=<n> replays them. It takes no clicks. */
export var GROUND = 300;
var STEP_MS = 40;
var RUN = 2.6;
export var FLIGHT = 46;
var THIGH = 12, SHIN = 12, UPPER = 9, FORE = 8;
/* Players are drawn this much larger than their joints' units, so they can be made out. */
export var SIZE = 1.35;

/* A ball in flight from (x0, y0) to (x1, y1) over FLIGHT steps, peaking [peak] above the higher
   end: where it is at step [k], and the angle it points along its path. */
export function arc(x0, y0, x1, y1, peak, k) {
  var t = Math.max(0, Math.min(1, k / FLIGHT));
  var top = Math.min(y0, y1) - peak;
  // A parabola through both ends and the top: y = a t^2 + b t + y0.
  var a = 2 * (y0 + y1) - 4 * top, b = 4 * top - 3 * y0 - y1;
  var y = a * t * t + b * t + y0;
  var x = x0 + (x1 - x0) * t;
  var dy = (2 * a * t + b) / FLIGHT, dx = (x1 - x0) / FLIGHT;
  return { x: x, y: y, angle: Math.atan2(dy, dx) * 180 / Math.PI };
}

/* A player's joints, facing right with feet at y 0, for a stride at [phase] and a [pose]: 'run',
   'carry' (the ball tucked), 'reach' (arms up for a catch), 'hands' (hands on the helmet),
   'tuck' (knees up, over a dive), 'stand'. */
export function joints(phase, pose) {
  var hip = [0, -24], shoulder = [1, -40];
  var still = pose === 'stand' || pose === 'hands';
  function leg(p) {
    if (pose === 'tuck') return { knee: [hip[0] + 8, hip[1] + 4], foot: [hip[0] - 2, hip[1] + 9] };
    var swing = still ? 0.12 * Math.sign(Math.sin(p) || 1) : Math.sin(p) * 0.75;
    var bend = still ? 0 : Math.max(0, -Math.cos(p)) * 1.1;
    var knee = [hip[0] + Math.sin(swing) * THIGH, hip[1] + Math.cos(swing) * THIGH];
    return { knee: knee, foot: [knee[0] + Math.sin(swing - bend) * SHIN, knee[1] + Math.cos(swing - bend) * SHIN] };
  }
  function arm(p, front) {
    if (pose === 'reach') return { elbow: [shoulder[0] + 6, shoulder[1] - 6], hand: [shoulder[0] + 13, shoulder[1] - 12] };
    if (pose === 'hands') return { elbow: [shoulder[0] + (front ? 11 : -10), shoulder[1] - 3], hand: [shoulder[0] + (front ? 6 : -2), shoulder[1] - 13] };
    if (pose === 'carry' && front) return { elbow: [shoulder[0] + 2, shoulder[1] + 8], hand: [shoulder[0] + 7, shoulder[1] + 5] };
    var swing = still ? 0.1 : -Math.sin(p) * 0.9;
    var elbow = [shoulder[0] + Math.sin(swing) * UPPER, shoulder[1] + Math.cos(swing) * UPPER];
    return { elbow: elbow, hand: [elbow[0] + Math.sin(swing + 1.2) * FORE, elbow[1] + Math.cos(swing + 1.2) * FORE] };
  }
  return {
    hip: hip,
    shoulder: shoulder,
    head: [shoulder[0] + 2, shoulder[1] - 8],
    legs: [leg(phase), leg(phase + Math.PI)],
    arms: [arm(phase + Math.PI, true), arm(phase, false)]
  };
}

function f(n) { return n.toFixed(1); }

/* The player's body as one path: legs, torso and arms; the pads and helmet are drawn apart. */
export function bodyPath(j) {
  var d = 'M' + f(j.hip[0]) + ' ' + f(j.hip[1]) + 'L' + f(j.shoulder[0]) + ' ' + f(j.shoulder[1]);
  j.legs.forEach(function (l) { d += 'M' + f(j.hip[0]) + ' ' + f(j.hip[1]) + 'L' + f(l.knee[0]) + ' ' + f(l.knee[1]) + 'L' + f(l.foot[0]) + ' ' + f(l.foot[1]); });
  j.arms.forEach(function (a) { d += 'M' + f(j.shoulder[0]) + ' ' + f(j.shoulder[1] + 2) + 'L' + f(a.elbow[0]) + ' ' + f(a.elbow[1]) + 'L' + f(a.hand[0]) + ' ' + f(a.hand[1]); });
  return d;
}

export default function football(layer, m) {
  var W = m.width;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  // The field, side on: the ground, and yard lines as short marks along it.
  var marks = 'M0 ' + GROUND + 'H' + W;
  for (var x = 30; x < W; x += 60) marks += 'M' + x + ' ' + GROUND + 'V' + (GROUND + 6);
  m.el('path', { 'class': 'masthead-football-field', d: marks });

  function player() {
    var g = m.el('g', { 'class': 'masthead-football-player', opacity: 0 });
    return {
      g: g,
      // The pads and helmet first, so arms (on the helmet, say) are drawn over them.
      pads: m.el('path', { 'class': 'masthead-football-pads', d: 'M-9 -37Q-10 -45 1 -46Q12 -45 11 -37Z' }, g),
      helmet: m.el('circle', { 'class': 'masthead-football-helmet', r: 5.5 }, g),
      mask: m.el('path', { 'class': 'masthead-football-mask' }, g),
      body: m.el('path', { 'class': 'masthead-football-body' }, g),
      x: 0, lift: 0, tilt: 0, dir: 1, phase: 0, pose: 'run', mode: 'off', t: 0
    };
  }
  var runner = player(), defender = player();
  var ball = m.el('g', { 'class': 'masthead-football-ball', opacity: 0 });
  m.el('ellipse', { rx: 6, ry: 3.6 }, ball);
  m.el('path', { d: 'M-2.5 0H2.5M-1.5 -1V1M0 -1V1M1.5 -1V1' }, ball);

  var play = null, rest = 40;
  var ballAt = null;

  function drawPlayer(p) {
    if (p.mode === 'off') { p.g.setAttribute('opacity', 0); return; }
    var j = joints(p.phase, p.pose);
    p.body.setAttribute('d', bodyPath(j));
    p.helmet.setAttribute('cx', f(j.head[0]));
    p.helmet.setAttribute('cy', f(j.head[1]));
    p.mask.setAttribute('d', 'M' + f(j.head[0] + 4) + ' ' + f(j.head[1] - 2) + 'V' + f(j.head[1] + 3) + 'H' + f(j.head[0] + 1));
    p.g.setAttribute('opacity', 1);
    p.g.setAttribute('transform', 'translate(' + f(p.x) + ' ' + f(GROUND - p.lift) + ') scale(' + (SIZE * p.dir / m.stretch()).toFixed(4) + ' ' + SIZE + ') rotate(' + f(p.tilt) + ')');
  }

  /* Where the carried ball sits: in the front hand, in the art. */
  function inHand(p) {
    var j = joints(p.phase, p.pose), hand = j.arms[0].hand;
    return { x: p.x + p.dir * SIZE * hand[0] / m.stretch(), y: GROUND - p.lift + SIZE * hand[1] };
  }

  function drawBall() {
    if (!ballAt) { ball.setAttribute('opacity', 0); return; }
    ball.setAttribute('opacity', 1);
    ball.setAttribute('transform', 'translate(' + f(ballAt.x) + ' ' + f(ballAt.y) + ') scale(' + (SIZE / m.stretch()).toFixed(4) + ' ' + SIZE + ') rotate(' + f(ballAt.angle || 0) + ')');
  }

  function start() {
    var dir = rand() < 0.5 ? 1 : -1;
    var from = dir > 0 ? -40 : W + 40;
    runner.mode = 'run'; runner.dir = dir; runner.x = from; runner.lift = 0; runner.tilt = 0; runner.t = 0;
    runner.phase = rand() * 6;
    if (rand() < 0.55) {
      // A pass: caught somewhere in the middle third, from a quarterback off the masthead behind.
      var catchX = W * (0.33 + rand() * 0.34);
      var steps = Math.abs(catchX - from) / RUN;
      play = { kind: 'pass', catchAt: Math.round(steps), throwAt: Math.round(steps) - FLIGHT, caught: rand() < 0.72, from: { x: from - dir * 220, y: 250 } };
      runner.pose = 'run';
    } else {
      play = { kind: 'run', meet: W * (0.3 + rand() * 0.4) };
      runner.pose = 'carry';
      defender.mode = 'run'; defender.dir = -dir; defender.x = dir > 0 ? W + 40 : -40; defender.lift = 0; defender.tilt = 0;
      defender.pose = 'run'; defender.phase = rand() * 6; defender.t = 0;
    }
    play.t = 0;
  }

  function stride(p, speed) {
    p.x += p.dir * speed;
    p.phase += speed * 0.11;
  }

  function offField(p) { return p.x < -60 || p.x > W + 60; }

  function stepPass() {
    var k = play.t;
    if (runner.mode === 'run') stride(runner, RUN);
    if (k === play.throwAt) play.flying = 0;
    if (play.flying !== undefined && play.flying !== null) {
      // Aimed at where his hands will be when it gets there.
      var to = { x: runner.x + runner.dir * RUN * (FLIGHT - play.flying), y: GROUND - 52 * SIZE };
      if (play.flying === 0) play.to = to;
      ballAt = arc(play.from.x, play.from.y, play.to.x, play.to.y, 70, play.flying);
      if (play.flying > FLIGHT - 10) runner.pose = 'reach';
      play.flying++;
      if (play.flying > FLIGHT) {
        play.flying = null;
        if (play.caught) { runner.pose = 'carry'; play.held = true; }
        else {
          runner.pose = 'run';
          play.loose = { x: ballAt.x, y: ballAt.y, vx: runner.dir * 1.6, vy: -2.2, spin: runner.dir * 14, angle: ballAt.angle };
          runner.mode = 'stop';
          runner.t = 0;
        }
      }
    }
    if (play.held) { var h = inHand(runner); ballAt = { x: h.x, y: h.y, angle: -20 }; }
    if (play.loose) {
      var b = play.loose;
      b.vy += 0.22; b.x += b.vx; b.y += b.vy; b.angle += b.spin;
      if (b.y > GROUND - 3.5) { b.y = GROUND - 3.5; b.vy = -b.vy * 0.45; b.vx *= 0.7; b.spin *= 0.6; if (Math.abs(b.vy) < 0.5) b.vy = 0; }
      ballAt = { x: b.x, y: b.y, angle: b.angle };
      if (Math.abs(b.vx) < 0.05 && b.vy === 0) b.still = (b.still || 0) + 1;
    }
    if (runner.mode === 'stop') {
      // He pulls up, hands on his helmet, then jogs off the way he was going.
      runner.t++;
      if (runner.t < 12) stride(runner, RUN * (1 - runner.t / 12));
      else if (runner.t < 60) runner.pose = 'hands';
      else { runner.mode = 'run'; runner.pose = 'run'; }
    }
    var done = offField(runner) && (!play.loose || play.loose.still > 30 || play.loose.x < -20 || play.loose.x > W + 20);
    if (offField(runner) && play.held) ballAt = null;
    return done;
  }

  function stepRun() {
    // The runner carries on; the defender comes on, dives when they meet, and he hurdles it.
    var gap = (defender.x - runner.x) * runner.dir;
    if (runner.mode === 'run') {
      stride(runner, RUN);
      if (gap < 70 && gap > 0 && !play.hurdle) play.hurdle = 0;
      if (play.hurdle !== undefined && play.hurdle !== null) {
        var t = play.hurdle / 22;
        runner.lift = Math.sin(Math.PI * Math.min(1, t)) * 30;
        runner.pose = t < 1 ? 'tuck' : 'carry';
        play.hurdle++;
        if (t >= 1) { runner.lift = 0; play.hurdle = null; play.cleared = true; }
      }
    }
    if (defender.mode === 'run') {
      stride(defender, RUN * 0.9);
      if (gap < 55 && gap > 0) { defender.mode = 'dive'; defender.t = 0; }
    } else if (defender.mode === 'dive') {
      defender.t++;
      defender.tilt = Math.min(85, defender.t * 8.5);
      defender.x += defender.dir * Math.max(0, 3 - defender.t * 0.15);
      defender.pose = 'stand';
      if (defender.t > 34) { defender.mode = 'up'; defender.t = 0; }
    } else if (defender.mode === 'up') {
      defender.t++;
      defender.tilt = Math.max(0, 85 - defender.t * 7);
      if (defender.tilt === 0 && defender.t > 20) { defender.mode = 'jog'; defender.pose = 'run'; }
    } else if (defender.mode === 'jog') {
      stride(defender, RUN * 0.6);
    }
    var h = inHand(runner);
    ballAt = offField(runner) ? null : { x: h.x, y: h.y, angle: -20 };
    return offField(runner) && (defender.mode === 'off' || offField(defender));
  }

  return {
    interval: STEP_MS,
    step: function () {
      if (!play) {
        if (--rest <= 0) start();
      } else {
        play.t++;
        var done = play.kind === 'pass' ? stepPass() : stepRun();
        if (done || play.t > 2400) {
          runner.mode = 'off'; defender.mode = 'off'; ballAt = null; play = null;
          rest = 90 + Math.floor(rand() * 110);
        }
      }
      drawPlayer(runner);
      drawPlayer(defender);
      drawBall();
    }
  };
}
