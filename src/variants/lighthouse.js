/* Lighthouse: a lighthouse at night on a rocky headland at one end of the masthead, the sea in
   lines along the foot, and the lamp turning. Its beam is seen from the side: it swings out
   across the sea and sky toward the far side, shortens as it comes round toward you (the lamp
   flaring as it faces you), passes behind the tower going away, and swings out again. Stars
   come out one by one, and a strand or two of fog drifts by, lit as the beam passes through it.
   The end, the headland and the fog come from the seed, so ?ambientSeed=<n> replays them. A
   click swings the beam round to that side and holds it there a moment. */
export var STEP_MS = 40;
export var REVOLUTION = 300;
export var SEA = 262;
export var REACH = 1250;
export var SPREAD = 48;
var HOLD = 45;

/* The beam, a cone of light from the lamp at (lx, ly) turned to [angle] (0 straight out toward
   the far side, PI / 2 straight at the viewer), as a closed path seen from the side. [inward] is
   1 if the far side is to the right, -1 if left; [squeeze] keeps its end round as the masthead
   is stretched. Its far end is an ellipse, nearer (so larger and longer) as it faces the viewer;
   the sides are the tangents from the lamp to it, or just the ellipse when the lamp is inside. */
export function beam(lx, ly, angle, inward, squeeze) {
  var c = Math.cos(angle), s = Math.sin(angle), p = 1 + 0.3 * s;
  var X = REACH * c * p, b = SPREAD * p, a = Math.max(b * Math.abs(s) * squeeze, 0.5);
  var from = 0, span = Math.PI * 2, d = '';
  if (Math.abs(X) > a) {
    var t = Math.acos(-a / X);
    from = t;
    span = X > 0 ? -2 * t : 2 * Math.PI - 2 * t;
    d = 'M' + lx.toFixed(1) + ' ' + ly.toFixed(1);
  }
  for (var k = 0; k <= 12; k++) {
    var f = from + span * k / 12;
    d += (d ? 'L' : 'M') + (lx + inward * (X + a * Math.cos(f))).toFixed(1) + ' ' + (ly + b * Math.sin(f)).toFixed(1);
  }
  return { d: d + 'Z', x: X, reach: Math.abs(X) + a, spread: b };
}

/* How strongly the beam lights the point [d] out from the lamp toward the far side and [dy]
   above or below it, 0 to 1: inside the cone, brightest along its middle, fading with distance. */
export function lit(d, dy, angle) {
  var c = Math.cos(angle), p = 1 + 0.3 * Math.sin(angle), X = REACH * c * p;
  if (Math.abs(X) < 1 || d / X <= 0) return 0;
  var along = d / X;
  if (along > 1) return 0;
  var half = SPREAD * p * Math.max(along, 0.05);
  var across = dy / half;
  return Math.exp(-across * across * 1.5) * (1 - along * 0.7);
}

/* The headland's top, from the end of the masthead (u 0) out to where it meets the sea, rocky. */
export function headland(rand) {
  var pts = [[-12, 214], [0, 213], [24, 210], [48, 211], [74, 212], [96, 216], [108, 225], [118, 228],
    [130, 238], [142, 242], [154, 250], [166, 254], [178, 258], [190, SEA]];
  return pts.map(function (q, i) {
    return i < 1 || i === pts.length - 1 ? q : [q[0] + (rand() - 0.5) * 6, q[1] + (rand() - 0.5) * 4];
  });
}

/* The lighthouse, standing at the origin: a tapering tower with a door and windows, the gallery
   and its railing, the lantern room's glazing, and the roof. The lamp is at (0, LAMP). */
export var LAMP = -93;
export var TOWER = 'M-13 0L-9 -78H9L13 0' +
  'M-3 0V-8A3 3 0 0 1 3 -8V0M-1.5 -34h3v5h-3zM-1.5 -56h3v5h-3z' +
  'M-15 -78H15V-82H-15ZM-14 -82V-89M-7 -82V-89M0 -82V-89M7 -82V-89M14 -82V-89M-15 -89H15' +
  'M-7 -82V-102H7V-82M-2.5 -82V-102M2.5 -82V-102' +
  'M-9 -102H9L0 -112ZM0 -112V-116';

export default function lighthouse(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var inward = rand() < 0.5 ? 1 : -1, edge = inward > 0 ? 0 : W;
  var turning = rand() < 0.7 ? 1 : -1;
  var top = headland(rand);
  var standAt = 44 + rand() * 18;
  var ground = 211;
  top.forEach(function (q, i) {
    if (i && q[0] >= standAt && top[i - 1][0] < standAt) ground = top[i - 1][1] + (q[1] - top[i - 1][1]) * (standAt - top[i - 1][0]) / (q[0] - top[i - 1][0]);
  });

  // Stars, coming out one by one.
  var stars = [];
  for (var k = 0; k < 14; k++) {
    stars.push({ at: 10 + Math.floor(rand() * 500), base: 0.5 + rand() * 0.5, phase: rand() * 6.3,
      el: m.el('circle', { 'class': 'masthead-lighthouse-star', cx: (20 + rand() * (W - 40)).toFixed(1), cy: (12 + rand() * 90).toFixed(1), r: (1 + rand() * 0.9).toFixed(1), opacity: 0 }) });
  }

  // Fog: a strand or two, low across the sky, drifting.
  var fog = [];
  var strands = 1 + (rand() < 0.6 ? 1 : 0);
  for (var f = 0; f < strands; f++) {
    fog.push({ x: rand() * W, y: 112 + f * 26 + rand() * 14, w: 220 + rand() * 200, speed: (rand() < 0.5 ? -1 : 1) * (0.15 + rand() * 0.15),
      el: m.el('path', { 'class': 'masthead-lighthouse-fog' }) });
  }

  // The far sea, then the beam when it points away, behind the headland and tower.
  m.el('path', { 'class': 'masthead-lighthouse-horizon', d: 'M0 ' + (SEA - 10) + 'H' + W });
  var defs = m.el('defs');
  var grad = m.el('radialGradient', { id: 'masthead-lighthouse-light', gradientUnits: 'userSpaceOnUse' }, defs);
  [[0, 0.9], [0.12, 0.5], [0.45, 0.22], [1, 0]].forEach(function (s) {
    m.el('stop', { offset: s[0], 'stop-opacity': s[1], 'class': 'masthead-lighthouse-glow' }, grad);
  });
  var behind = m.el('g');
  var beamEl = m.el('path', { 'class': 'masthead-lighthouse-beam', fill: 'url(#masthead-lighthouse-light)' }, behind);

  // The headland, its foot at the water, and the lighthouse on it, kept in shape at its end.
  var land = m.el('g', { 'class': 'masthead-lighthouse-land' });
  var outline = top.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('') + 'L-12 ' + SEA + 'Z';
  m.el('path', { 'class': 'masthead-lighthouse-rock', d: outline }, land);
  m.el('path', { 'class': 'masthead-lighthouse-crag', d: 'M118 228L112 240L120 250M154 250L148 258M24 222L40 230L58 228M80 236L96 244' }, land);
  m.el('path', { 'class': 'masthead-lighthouse-tower', d: TOWER, transform: 'translate(' + standAt.toFixed(1) + ' ' + ground.toFixed(1) + ')' }, land);
  var front = m.el('g');
  var lamp = m.el('g', { 'class': 'masthead-lighthouse-lamp' });
  var lampGlow = m.el('circle', { r: 16, fill: m.pulse }, lamp);
  m.el('circle', { r: 2, 'class': 'masthead-spark' }, lamp);

  // The nearer sea, in front of the headland's foot.
  var waves = [0, 1, 2].map(function (k) {
    return { k: k, rest: SEA + 8 + k * 18, el: m.el('path', { 'class': 'masthead-lighthouse-wave', 'stroke-opacity': (0.4 + k * 0.25).toFixed(2) }) };
  });

  var angle = rand() * Math.PI * 2, speed = turning * Math.PI * 2 / REVOLUTION;
  var v = speed, goal = null, hold = 0, inFront = false;

  function lampAt() {
    return { x: edge + inward * standAt / m.stretch(), y: ground + LAMP };
  }

  function draw(n) {
    var squeeze = 1 / m.stretch(), at = lampAt();
    land.setAttribute('transform', 'translate(' + edge + ' 0) scale(' + (inward * squeeze).toFixed(4) + ' 1)');
    var shape = beam(at.x, at.y, angle, inward, squeeze), facing = Math.sin(angle);
    beamEl.setAttribute('d', shape.d);
    grad.setAttribute('cx', at.x.toFixed(1));
    grad.setAttribute('cy', at.y.toFixed(1));
    grad.setAttribute('r', Math.max(shape.reach, 20).toFixed(1));
    // Coming toward the viewer, the beam is in front of the tower; going away, behind it.
    if (facing > 0 !== inFront) {
      inFront = facing > 0;
      beamEl.parentNode.removeChild(beamEl);
      (inFront ? front : behind).appendChild(beamEl);
    }
    lamp.setAttribute('transform', 'translate(' + at.x.toFixed(1) + ' ' + at.y.toFixed(1) + ') scale(' + squeeze.toFixed(4) + ' 1)');
    lampGlow.setAttribute('opacity', (0.3 + 0.7 * Math.pow(Math.max(0, facing), 6)).toFixed(2));
    fog.forEach(function (o) {
      var mid = o.x + o.w / 2, glow = lit((mid - at.x) * inward, o.y - at.y, angle);
      var d = 'M' + o.x.toFixed(1) + ' ' + o.y.toFixed(1);
      for (var j = 1; j <= 6; j++) {
        d += 'Q' + (o.x + o.w * (j - 0.5) / 6).toFixed(1) + ' ' + (o.y - 4 + Math.sin(n * 0.02 + o.y + j) * 3).toFixed(1) + ' ' + (o.x + o.w * j / 6).toFixed(1) + ' ' + o.y.toFixed(1);
      }
      o.el.setAttribute('d', d);
      o.el.setAttribute('opacity', (0.3 + 0.7 * glow).toFixed(2));
    });
    waves.forEach(function (w) {
      var d = [];
      for (var x = 0; x <= W; x += 30) {
        d.push((x ? 'L' : 'M') + x + ' ' + (w.rest + Math.sin(x * 0.012 + n * 0.02 + w.k * 1.7) * (1 + w.k * 0.6) + Math.sin(x * 0.031 - n * 0.013 + w.k) * 0.6).toFixed(1));
      }
      w.el.setAttribute('d', d.join(''));
    });
  }

  function twinkle(n) {
    stars.forEach(function (s) {
      var up = Math.min(1, Math.max(0, (n - s.at) / 60));
      s.el.setAttribute('opacity', (up * s.base * (0.8 + 0.2 * Math.sin(n * 0.03 + s.phase))).toFixed(2));
    });
  }

  draw(0);

  return {
    interval: STEP_MS,
    // A click swings the beam round to the clicked side, broadside, and holds it a moment.
    poke: function (x) {
      var want = (x - lampAt().x) * inward >= 0 ? 0 : Math.PI;
      var ahead = ((want - angle) * turning) % (Math.PI * 2);
      if (ahead < 0) ahead += Math.PI * 2;
      if (ahead < 0.05) ahead += Math.PI * 2;
      goal = angle + turning * ahead;
      hold = 0;
    },
    step: function (n) {
      var accel = Math.abs(speed) / 20;
      if (goal !== null) {
        var left = (goal - angle) * turning;
        var want = Math.min(Math.abs(speed) * 3, Math.sqrt(2 * accel * Math.max(0, left)));
        var now = Math.abs(v);
        now += Math.max(-accel, Math.min(accel, want - now));
        if (left <= now || left <= 0.002) { angle = goal % (Math.PI * 2); v = 0; goal = null; hold = HOLD; }
        else { v = turning * now; angle += v; }
      } else if (hold > 0) {
        hold--;
      } else {
        v += Math.max(-accel, Math.min(accel, speed - v));
        angle = (angle + v) % (Math.PI * 2);
      }
      draw(n);
      if (n % 3 === 0) twinkle(n);
    }
  };
}
