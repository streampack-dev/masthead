/* Ghostrider (for Neil Peart): a wireframe road ahead of you, bending and rising gently, drawn as
   the old arcade racers drew theirs: segments of road projected toward a high horizon, so it
   fans out around and below the name. Rumble ticks, centre dashes and roadside posts pass at a
   slow cruise, and the hills on the horizon slide aside as the road bends. The course comes from
   the seed, so ?ambientSeed=<n> drives the same road again. */
/* A segment is SEG of a road width long; DRAW of them reach the horizon. */
export var SEG = 0.3, DRAW = 260;
/* Beyond DETAIL road widths the ticks, dashes and posts would crowd into a smear, so only the
   edges go on to the horizon. */
var DETAIL = 12;
var NEAR = 0.9, HORIZON = 82, DEPTH = 300, ROAD = 560, PARALLAX = 2400;
/* The cruise, in segments a step (of 40 ms): two road widths a second. */
export var SPEED = 0.08 / SEG;
export var MAX_CURVE = 0.02;
var MIN_CURVE = 0.006, MAX_SLOPE = 0.006;

function ease(t) { return t <= 0 ? 0 : t >= 1 ? 1 : (1 - Math.cos(Math.PI * t)) / 2; }

/* The road, segment by segment: how much each bends (the change in its heading, per road width
   travelled) and how high it is. Sections of straight, bend and hill ease in, hold and ease out,
   one after another for as far as you drive. */
export function course(rand) {
  var curves = [], heights = [0];
  function section() {
    var length = Math.round((20 + rand() * 40) / SEG);
    var curve = rand() < 0.35 ? 0 : (rand() < 0.5 ? -1 : 1) * (MIN_CURVE + rand() * (MAX_CURVE - MIN_CURVE));
    var slope = rand() < 0.5 ? 0 : (rand() * 2 - 1) * MAX_SLOPE;
    for (var s = 0; s < length; s++) {
      var p = s / length, k = Math.min(ease(p / 0.25), ease((1 - p) / 0.25));
      curves.push(curve * k);
      heights.push(heights[heights.length - 1] + slope * k * SEG);
    }
  }
  function grow(i) { while (curves.length <= i + 1) section(); }
  return {
    curve: function (i) { grow(i); return curves[i]; },
    height: function (i) { grow(i); return heights[i]; }
  };
}

/* The segments in view from [cz] (how far along the road you are), nearest first, each with its
   centre, its half width and its height on the screen, or hidden when a rise ahead hides it. */
export function project(road, cz, width) {
  var base = Math.floor(cz), f = cz - base;
  var camera = road.height(base) * (1 - f) + road.height(base + 1) * f + 1;
  var out = [], clip = Infinity;
  // The bends add up along the road from where you are, in road widths aside, and are projected
  // with the rest, so a bend sweeps the whole road rather than hooking at the horizon. Blending
  // the sums from this segment and the next keeps the far road from jumping as you pass each one.
  var xa = 0, dxa = 0, xb = 0, dxb = 0;
  for (var k = 0; k < DRAW; k++) {
    var i = base + k, dz = (i - cz) * SEG;
    var bend = road.curve(i) * SEG * SEG;
    xa += dxa; dxa += bend;
    if (k > 0) { xb += dxb; dxb += bend; }
    if (dz < NEAR) continue;
    var scale = 1 / dz;
    var y = HORIZON + DEPTH * (camera - road.height(i)) * scale;
    var x = width / 2 + (xa * (1 - f) + xb * f) * ROAD * scale;
    var hidden = y >= clip;
    if (!hidden) clip = y;
    out.push({ i: i, x: x, y: y, w: ROAD * scale, scale: scale, hidden: hidden });
  }
  return out;
}

export default function ghostrider(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  // The hills on the horizon: a long, gently rolling line, its phases the seed's.
  var a = rand() * 6.3, b = rand() * 6.3, c = rand() * 6.3;
  function hill(u) {
    return 16 + 9 * Math.sin(u * 2 * Math.PI / 820 + a) + 5 * Math.sin(u * 2 * Math.PI / 310 + b) + 2.5 * Math.sin(u * 2 * Math.PI / 130 + c);
  }
  var road = course(rand);

  var hills = m.el('path', { 'class': 'masthead-ghostrider-hills' });
  m.el('path', { 'class': 'masthead-ghostrider-horizon', d: 'M0 ' + HORIZON + 'H' + W });
  var edges = m.el('path', { 'class': 'masthead-ghostrider-edge' });
  var rumble = m.el('path', { 'class': 'masthead-ghostrider-rumble' });
  var dashes = m.el('path', { 'class': 'masthead-ghostrider-dash' });
  var posts = m.el('path', { 'class': 'masthead-ghostrider-post' });

  var cz = 0, scenery = 0;

  function n(v) { return v.toFixed(1); }

  function draw() {
    var d = [];
    for (var x = 0; x <= W; x += 12) d.push((x === 0 ? 'M' : 'L') + x + ' ' + n(HORIZON - hill(x + scenery)));
    hills.setAttribute('d', d.join(''));

    var segs = project(road, cz, W);
    var left = [], right = [], ticks = [], dash = [], post = [];
    var drawing = false;
    segs.forEach(function (s, k) {
      if (s.hidden || s.y > H + 40) { drawing = false; return; }
      var cmd = drawing ? 'L' : 'M';
      left.push(cmd + n(s.x - s.w) + ' ' + n(s.y));
      right.push(cmd + n(s.x + s.w) + ' ' + n(s.y));
      drawing = true;
      var next = segs[k + 1];
      if (s.scale < 1 / DETAIL) return;
      if (s.i % 2 === 0) {
        ticks.push('M' + n(s.x - s.w * 1.1) + ' ' + n(s.y) + 'H' + n(s.x - s.w) + 'M' + n(s.x + s.w) + ' ' + n(s.y) + 'H' + n(s.x + s.w * 1.1));
      }
      if (s.i % 4 < 2 && next && !next.hidden) dash.push('M' + n(s.x) + ' ' + n(s.y) + 'L' + n(next.x) + ' ' + n(next.y));
      if (s.i % 12 === 0) {
        var h = 46 * s.scale;
        post.push('M' + n(s.x - s.w * 1.35) + ' ' + n(s.y) + 'v' + n(-h) + 'M' + n(s.x + s.w * 1.35) + ' ' + n(s.y) + 'v' + n(-h));
      }
    });
    edges.setAttribute('d', left.join('') + right.join(''));
    rumble.setAttribute('d', ticks.join(''));
    dashes.setAttribute('d', dash.join(''));
    posts.setAttribute('d', post.join(''));
  }
  draw();

  return {
    interval: 40,
    step: function () {
      // The hills slide against the bend you're in, as a turning view does.
      scenery += road.curve(Math.floor(cz)) * SPEED * SEG * PARALLAX;
      cz += SPEED;
      draw();
    }
  };
}
