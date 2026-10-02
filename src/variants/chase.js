/* Chase: a fast, long-legged bird and the scruffy canine forever after it, along the foot of the
   masthead, in the snapping style of cutout animation. Mostly the bird blurs past in a puff of
   dust and the canine scrambles after; sometimes the bird stops dead and the canine skids past;
   sometimes the bird runs out of the frame and the canine, following, smacks into its edge; and
   sometimes the canine, stopped to catch its breath, meets an anvil from above or the train
   along its track. It always pops back up. And now and then it walks out to the middle, turns to
   the reader, and holds up a sign: "...not a coyote." Just then the bird blurs past behind it;
   the sign drops, and the chase is on. The acts come from the seed, so ?ambientSeed=<n> replays
   them. A click puts a tunnel on the ground there: the bird runs into it and is gone, and the
   canine, running into it after, finds it painted on solid rock. */

/* The canine, facing right, from its feet: a body, a long-snouted head with an ear, a tail. It's
   hungry: a bony, hunched back, its belly tucked up between haunch and chest, its ribs showing.
   Its legs are drawn apart: standing, walking, or a scramble when it runs. */
var DOG = 'M-24 -25C-24 -31 -16 -32 -8 -30C0 -29 8 -33 14 -34C20 -34 24 -30 23 -25C22 -18 19 -14 14 -14' +
  'L8 -14C4 -16 2 -23 -4 -23C-9 -23 -10 -16 -12 -14L-20 -14C-23 -15 -24 -19 -24 -25z' +
  'M-23 -27q-12 -2 -18 -14q8 6 18 8z';
var DOG_HEAD = 'M16 -34q2 -12 14 -10l16 6q2 4 -2 6l-14 2q-10 2 -14 -4z' +
  'M20 -42l-2 -14l9 10z';
/* Its head turned to the reader: both ears, both eyes, a nose and a muzzle. */
var DOG_FACE = 'M14 -40a12 11 0 1 0 24 0a12 11 0 1 0 -24 0z' +
  'M16 -47l-3 -14l9 8zM36 -47l3 -14l-9 8z';
var DOG_FACE_MARKS = 'M21 -43v0M31 -43v0M26 -37v0M21 -33q5 4 10 0';
var DOG_RIBS = 'M8 -30q-2 4 0 9M12 -31q-2 5 0 11M16 -31q-2 4 0 10';
/* Standing: jointed, as a dog's legs are. The hind legs angle back to the hock and down to the
   paw; the front legs come down to a bent wrist; each ends in a paw, pointing forward. */
var DOG_LEGS = 'M-19 -15L-23 -5L-21 0h4M-14 -15L-17 -5L-15 0h4' +
  'M9 -15L9 -4L11 0h3M15 -15L16 -4L18 0h3';
/* Walking: each pair of legs apart, then together. */
var DOG_STEP = 'M-19 -15L-26 -6L-25 0h4M-14 -15L-13 -5L-10 0h4' +
  'M9 -15L6 -4L6 0h4M15 -15L19 -5L22 0h3';
/* The bird, facing right, from its feet: a body, a long neck, a crested head with a beak, a tail. */
var BIRD = 'M-12 -40a12 7 0 1 0 24 0a12 7 0 1 0 -24 0z' +
  'M8 -44L14 -60M11 -66a5 5 0 1 0 10 0a5 5 0 1 0 -10 0z' +
  'M21 -66L33 -63L21 -61z' +
  'M14 -70l-6 -8M16 -71l-2 -9M18 -70l2 -8' +
  'M-12 -41l-18 -8M-12 -39l-18 -2M-11 -37l-16 5';
var BIRD_LEGS = 'M-4 -33L-8 0h6M2 -33L2 0h6';

/* A number in [0, 1) from [n] and [k], the same every time: the legs' randomness, kept apart from
   the seed's, so ?ambientSeed=<n> replays the same acts whatever the legs do. */
function hash(n, k) {
  var x = Math.imul((n * 8 + k + 1) >>> 0, 2654435761) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 2246822519) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 3266489917) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 0x100000000;
}

/* The bird's legs in a blur: a wheel of motion trailing under its body. Curved strokes of different
   lengths turn round inside the wheel's rim, a step each frame, and a foot touches the ground
   now behind, now ahead. Arcs read as motion where straight spokes read as a star. Behind the
   wheel, three speed streaks, each a different length every frame. Returns the strokes and,
   apart, the rim and the streaks, which are drawn lighter. */
export function blurLegs(cx, cy, rx, ry, frame) {
  var strokes = '';
  var spans = [1.9, 1.3, 0.8];
  for (var k = 0; k < 3; k++) {
    var a0 = frame * 1.1 + k * 2.1, a1 = a0 + spans[k], f = 0.95 - k * 0.2;
    strokes += 'M' + (cx + Math.cos(a0) * rx * f).toFixed(1) + ' ' + (cy + Math.sin(a0) * ry * f).toFixed(1) +
      'A' + (rx * f).toFixed(1) + ' ' + (ry * f).toFixed(1) + ' 0 0 1 ' +
      (cx + Math.cos(a1) * rx * f).toFixed(1) + ' ' + (cy + Math.sin(a1) * ry * f).toFixed(1);
  }
  var foot = cx + (frame % 2 ? -0.6 : 0.3) * rx;
  strokes += 'M' + (foot - 3).toFixed(1) + ' 0h7';
  var rim = 'M' + (cx - rx) + ' ' + cy + 'a' + rx + ' ' + ry + ' 0 1 0 ' + (2 * rx) + ' 0a' + rx + ' ' + ry + ' 0 1 0 ' + (-2 * rx) + ' 0';
  var streaks = '';
  [-0.55, 0, 0.5].forEach(function (y, k) {
    var from = cx - rx * (y ? 0.9 : 1) - 3, len = 10 + Math.round(hash(frame, 20 + k) * 10);
    streaks += 'M' + from.toFixed(1) + ' ' + (cy + y * ry).toFixed(1) + 'h' + (-len);
  });
  return { strokes: strokes, rim: rim, streaks: streaks };
}

/* The canine's legs in a scramble: each from its hip, at an angle drawn afresh every frame, but
   only as far as a leg goes (SPLAY either side of straight down, toward its head or its tail),
   bent at a knee, and longer or shorter, so a foot is off the ground now and then. A foot that
   would go through the ground ([floor] below the hips' zero) stops on it. */
export var SPLAY = 80 * Math.PI / 180;
export function scramble(hips, frame, floor) {
  var d = '';
  for (var k = 0; k < hips.length; k++) {
    var a = (hash(frame, k) * 2 - 1) * SPLAY;
    var thigh = 9 + hash(frame, k + 4) * 3, shin = thigh + 1;
    var bend = 0.4 + hash(frame, k + 8) * 0.5;
    var kx = hips[k][0] + Math.sin(a) * thigh, ky = hips[k][1] + Math.cos(a) * thigh;
    var down = Math.cos(a - bend);
    if (down > 0 && ky + down * shin > floor) shin = (floor - ky) / down;
    var fx = kx + Math.sin(a - bend) * shin, fy = ky + Math.cos(a - bend) * shin;
    d += 'M' + hips[k][0] + ' ' + hips[k][1] + 'L' + kx.toFixed(1) + ' ' + ky.toFixed(1) + 'L' + fx.toFixed(1) + ' ' + fy.toFixed(1);
  }
  return d;
}
var DOG_HIPS = [[-19, -15], [-14, -15], [9, -15], [15, -15]];

/* A short train, as the train animation draws it, coming along the track. */
var TRAIN = [
  ' _______            ||  ',
  '|  [ ]  |___________||__ ',
  '|       |               |\\',
  '|       |   BYTECODE    | \\',
  '|_______|_______________|__>',
  '  (o)(o)   (O)=(O)=(O)     '
];
var ANVIL_PATH = 'M-30 0H30V-6H16V-16H36V-28H-34Q-46 -26 -56 -21Q-45 -18 -34 -16H-16V-6H-30Z';
/* A tunnel mouth in the rock, as painted, from the ground: the rock round it, and the dark way in,
   tall enough for the bird. */
var TUNNEL_ROCK = 'M-46 0V-58Q-48 -100 0 -104Q48 -100 46 -58V0z';
var TUNNEL_MOUTH = 'M-30 0V-64A30 26 0 0 1 30 -64V0z';
var TUNNEL_CRACKS = 'M-40 -70l6 4M-38 -40l5 -2M36 -78l-5 5M38 -30l-6 1M-14 -98l3 5M12 -96l-2 6';
var TUNNEL_HALF = 46;
/* How long a tunnel waits for someone to run into it before it fades, in steps of 60 ms. */
var TUNNEL_WAIT = 330;
var ACTS = ['chase', 'chase', 'chase', 'chase', 'skid', 'skid', 'edge', 'edge', 'anvil', 'train', 'sign'];
/* The canine's best speed, and the bird's. */
var DOG_RUN = 16, BIRD_RUN = 24;

export default function chase(layer, m) {
  var W = m.width, H = m.height, ground = H - 6;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  function solid(line) { return line.replace(/ /g, ' '); }

  var dustLayer = m.el('g', { 'class': 'masthead-chase-dust' });
  // The tunnel, behind the cast, there only once the masthead is clicked.
  var tunnelEl = m.el('g', { 'class': 'masthead-chase-tunnel', opacity: 0 });
  m.el('path', { 'class': 'masthead-chase-piece', d: TUNNEL_ROCK }, tunnelEl);
  m.el('path', { 'class': 'masthead-chase-tunnel-mouth', d: TUNNEL_MOUTH }, tunnelEl);
  m.el('path', { 'class': 'masthead-chase-ribs', d: TUNNEL_CRACKS }, tunnelEl);
  var tunnel = null;
  function figure(cls, body, head) {
    var g = m.el('g', { 'class': 'masthead-chase-' + cls, opacity: 0 });
    var inner = m.el('g', {}, g);
    // The bird's blur is drawn first, behind the body, as speed leaves it behind.
    var blur = m.el('path', { 'class': 'masthead-chase-blur', opacity: 0 }, inner);
    var streaks = m.el('path', { 'class': 'masthead-chase-streaks', opacity: 0 }, inner);
    m.el('path', { 'class': 'masthead-chase-piece', d: body }, inner);
    if (cls === 'dog') m.el('path', { 'class': 'masthead-chase-ribs', d: DOG_RIBS }, inner);
    var legs = m.el('path', { 'class': 'masthead-chase-legs' }, inner);
    // The head in profile, and (for the canine) turned to the reader.
    var profile = m.el('g', {}, inner);
    if (head) m.el('path', { 'class': 'masthead-chase-piece', d: head }, profile);
    m.el('circle', { 'class': 'masthead-chase-eye', cx: cls === 'dog' ? 30 : 17, cy: cls === 'dog' ? -38 : -67, r: 1.8 }, profile);
    var face = m.el('g', { opacity: 0 }, inner);
    if (cls === 'dog') {
      m.el('path', { 'class': 'masthead-chase-piece', d: DOG_FACE }, face);
      m.el('path', { 'class': 'masthead-chase-marks', d: DOG_FACE_MARKS }, face);
    }
    // A cartoon "!" over its head, when it notices what's coming.
    var alarm = m.el('path', { 'class': 'masthead-chase-alarm', d: 'M28 -78v-14M28 -70v0', opacity: 0 }, inner);
    return { g: g, inner: inner, legs: legs, blur: blur, streaks: streaks, alarm: alarm, profile: profile, face: face, x: 0, dir: 1, sx: 1, sy: 1, mode: 'hidden' };
  }
  var bird = figure('bird', BIRD), dog = figure('dog', DOG, DOG_HEAD);
  var stars = m.el('path', { 'class': 'masthead-chase-stars', opacity: 0 });
  var anvil = m.el('path', { 'class': 'masthead-chase-anvil', d: ANVIL_PATH, opacity: 0 });
  var train = m.el('g', { 'class': 'masthead-chase-train', opacity: 0 });
  TRAIN.forEach(function (line, r) { m.el('text', { x: 0, y: (r - TRAIN.length + 1) * 12 }, train).textContent = solid(line); });
  var trainWidth = TRAIN[4].length * 7.2;
  // The sign the canine holds up: a board on a stick, its words never mirrored.
  var sign = m.el('g', { 'class': 'masthead-chase-sign', opacity: 0 });
  m.el('path', { 'class': 'masthead-chase-piece', d: 'M-90 -76h180v38h-180zM0 -38v30' }, sign);
  m.el('text', { 'class': 'masthead-chase-words', x: 0, y: -51, 'text-anchor': 'middle' }, sign).textContent = '\u2026not a coyote.';

  var dust = [], act = null, frame = 0, rest = 10;

  function puff(x, size) {
    dust.push({ el: m.el('circle', { cx: x.toFixed(1), cy: (ground - 6).toFixed(1), r: size }, dustLayer), age: 0, size: size });
  }

  function place(f, n) {
    var squeeze = 1 / m.stretch();
    f.g.setAttribute('opacity', f.mode === 'hidden' || f.under ? 0 : 1);
    f.g.setAttribute('transform', 'translate(' + f.x.toFixed(1) + ' ' + ground + ') scale(' + (f.dir * f.sx * squeeze).toFixed(4) + ' ' + f.sy.toFixed(3) + ')');
    var isDog = f === dog;
    // Running, the bird's legs are a blur under it and the canine's a scramble. Walking, the
    // canine's step.
    // The blur trails behind the bird, wider than it's tall, as if left behind by its speed.
    var blurred = f.mode === 'run' && !isDog ? blurLegs(-13, -17, 19, 15, n) : null;
    // Scrambling, the canine is off the ground, bobbing, which gives its legs room to flail.
    var lift = f.mode === 'run' && isDog ? 5 + Math.round(hash(n, 12) * 3) : 0;
    f.legs.setAttribute('d', blurred ? blurred.strokes
      : f.mode === 'run' ? scramble(DOG_HIPS, n, lift)
      : isDog ? (f.mode === 'walk' && n % 4 < 2 ? DOG_STEP : DOG_LEGS) : BIRD_LEGS);
    f.blur.setAttribute('opacity', blurred ? 1 : 0);
    f.streaks.setAttribute('opacity', blurred ? 1 : 0);
    if (blurred) { f.blur.setAttribute('d', blurred.rim); f.streaks.setAttribute('d', blurred.streaks); }
    // Noticing: a "!" over its head, for a beat; skidding: leaning back hard.
    f.alarm.setAttribute('opacity', f.mode === 'look' ? 1 : 0);
    // Facing the reader: the front of its head instead of its profile.
    f.profile.setAttribute('opacity', f.mode === 'face' ? 0 : 1);
    f.face.setAttribute('opacity', f.mode === 'face' ? 1 : 0);
    f.inner.setAttribute('transform', f.mode === 'skid' ? 'rotate(-14)' : lift ? 'translate(0 ' + -lift + ')' : '');
  }

  /* Each act: a function of its frame that moves the cast and says when it's done. */
  var acts = {
    chase: function (f, a) {
      if (f === 0) {
        a.dir = rand() < 0.5 ? 1 : -1;
        bird.dir = dog.dir = a.dir; bird.mode = 'run'; dog.mode = 'hidden';
        bird.x = a.dir > 0 ? -40 : W + 40;
        a.gap = 12 + Math.floor(rand() * 18);
      }
      if (bird.mode === 'run') {
        bird.x += a.dir * BIRD_RUN;
        if (f % 3 === 0) puff(bird.x - a.dir * 20, 6 + rand() * 4);
        if ((a.dir > 0 && bird.x > W + 60) || (a.dir < 0 && bird.x < -60)) { bird.mode = 'hidden'; a.goneAt = f; }
      }
      if (a.goneAt !== undefined && f === a.goneAt + a.gap) { dog.mode = 'run'; dog.x = a.dir > 0 ? -50 : W + 50; }
      if (dog.mode === 'run') {
        dog.x += a.dir * DOG_RUN;
        if (f % 4 === 0) puff(dog.x - a.dir * 26, 4 + rand() * 3);
        if ((a.dir > 0 && dog.x > W + 70) || (a.dir < 0 && dog.x < -70)) { dog.mode = 'hidden'; return true; }
      }
      return false;
    },
    skid: function (f, a) {
      if (f === 0) {
        a.dir = rand() < 0.5 ? 1 : -1;
        a.stop = a.dir > 0 ? 260 + rand() * 200 : W - 260 - rand() * 200;
        bird.dir = dog.dir = a.dir; bird.mode = 'run'; dog.mode = 'hidden';
        bird.x = a.dir > 0 ? -40 : W + 40; a.stage = 'in';
      }
      if (a.stage === 'in') {
        bird.x += a.dir * BIRD_RUN;
        if ((a.dir > 0 && bird.x >= a.stop) || (a.dir < 0 && bird.x <= a.stop)) {
          bird.x = a.stop; bird.mode = 'stand'; a.stage = 'wait'; a.at = f;
          dog.mode = 'run'; dog.x = a.dir > 0 ? -50 : W + 50;
        }
      } else if (a.stage === 'wait') {
        dog.x += a.dir * (DOG_RUN + 1);
        if (f % 4 === 0) puff(dog.x - a.dir * 26, 4);
        if ((a.dir > 0 && dog.x >= bird.x - 10) || (a.dir < 0 && dog.x <= bird.x + 10)) { a.stage = 'skid'; a.speed = DOG_RUN + 1; dog.mode = 'skid'; }
      } else if (a.stage === 'skid') {
        // Too fast to stop: it skids past, raising dust, while the bird is off the other way.
        dog.x += a.dir * a.speed; a.speed *= 0.86;
        puff(dog.x - a.dir * 10, 3 + rand() * 4);
        if (bird.mode === 'stand') { bird.mode = 'run'; bird.dir = -a.dir; }
        if (a.speed < 0.6) { dog.mode = 'look'; a.stage = 'look'; a.at = f; }
      } else if (a.stage === 'look') {
        if (f - a.at > 22) { dog.mode = 'run'; dog.dir = -a.dir; a.stage = 'after'; }
      } else if (a.stage === 'after') {
        dog.x -= a.dir * DOG_RUN;
        if (f % 4 === 0) puff(dog.x + a.dir * 26, 4);
      }
      if (bird.mode === 'run' && a.stage !== 'in') {
        bird.x += bird.dir * BIRD_RUN;
        if (bird.x < -60 || bird.x > W + 60) bird.mode = 'hidden';
      }
      if (a.stage === 'after' && (dog.x < -70 || dog.x > W + 70)) { dog.mode = 'hidden'; return true; }
      return false;
    },
    edge: function (f, a) {
      if (f === 0) {
        a.dir = rand() < 0.5 ? 1 : -1;
        bird.dir = dog.dir = a.dir; bird.mode = 'run'; dog.mode = 'run';
        bird.x = a.dir > 0 ? -40 : W + 40; dog.x = bird.x - a.dir * 260; a.stage = 'run';
        a.edge = a.dir > 0 ? W - 2 : 2;
      }
      if (bird.mode === 'run') { bird.x += a.dir * 22; if (bird.x < -60 || bird.x > W + 60) bird.mode = 'hidden'; }
      if (a.stage === 'run') {
        dog.x += a.dir * DOG_RUN;
        if (f % 4 === 0) puff(dog.x - a.dir * 26, 4);
        // The bird ran out of the frame; the canine runs into it, nose first.
        if ((a.dir > 0 && dog.x + 44 >= a.edge) || (a.dir < 0 && dog.x - 44 <= a.edge)) {
          a.stage = 'splat'; a.at = f; dog.mode = 'stand'; dog.sx = 0.25; dog.x = a.edge - a.dir * 11;
        }
      } else if (a.stage === 'splat') {
        if (f - a.at > 16) { a.stage = 'dizzy'; a.at = f; dog.sx = 1; dog.x = a.edge - a.dir * 48; }
      } else if (a.stage === 'dizzy') {
        stars.setAttribute('opacity', 1);
        var sx = dog.x + a.dir * 24, sy = ground - 58, d = '';
        for (var k = 0; k < 3; k++) {
          var ang = (f - a.at) * 0.35 + k * 2.1;
          var px = sx + Math.cos(ang) * 16, py = sy + Math.sin(ang) * 5;
          d += 'M' + (px - 3).toFixed(1) + ' ' + py.toFixed(1) + 'h6M' + px.toFixed(1) + ' ' + (py - 3).toFixed(1) + 'v6';
        }
        stars.setAttribute('d', d);
        if (f - a.at > 30) { stars.setAttribute('opacity', 0); a.stage = 'back'; dog.dir = -a.dir; dog.mode = 'walk'; }
      } else if (a.stage === 'back') {
        // Trudging back the way it came, a little unsteady.
        dog.x -= a.dir * 4;
        dog.sy = 1 + (f % 6 < 3 ? 0.04 : -0.04);
        if (dog.x < -70 || dog.x > W + 70) { dog.mode = 'hidden'; dog.sy = 1; return true; }
      }
      return false;
    },
    anvil: function (f, a) {
      if (f === 0) {
        a.dir = rand() < 0.5 ? 1 : -1; dog.dir = a.dir; dog.mode = 'run'; bird.mode = 'hidden';
        dog.x = a.dir > 0 ? -50 : W + 50; a.stop = a.dir > 0 ? 200 + rand() * 250 : W - 200 - rand() * 250; a.stage = 'in';
      }
      if (a.stage === 'in') {
        dog.x += a.dir * DOG_RUN;
        if (f % 4 === 0) puff(dog.x - a.dir * 26, 4);
        if ((a.dir > 0 && dog.x >= a.stop) || (a.dir < 0 && dog.x <= a.stop)) { dog.mode = 'stand'; a.stage = 'pant'; a.at = f; }
      } else if (a.stage === 'pant') {
        dog.sy = 1 + ((f - a.at) % 8 < 4 ? 0.05 : 0);
        if (f - a.at > 18) { dog.mode = 'look'; a.stage = 'fall'; a.at = f; }
      } else if (a.stage === 'fall') {
        var t = (f - a.at) / 7, top = -40, pile = ground - 8;
        anvil.setAttribute('opacity', 1);
        anvil.setAttribute('transform', 'translate(' + dog.x.toFixed(1) + ' ' + (top + (pile - top) * t * t).toFixed(1) + ')');
        if (t >= 1) { dog.sy = 0.15; dog.mode = 'stand'; a.stage = 'flat'; a.at = f; puff(dog.x - 30, 8); puff(dog.x + 30, 8); }
      } else if (a.stage === 'flat') {
        if (f - a.at > 26) { anvil.setAttribute('opacity', 0); a.stage = 'pop'; a.at = f; }
      } else if (a.stage === 'pop') {
        dog.sy = [1.25, 0.9, 1][Math.min(2, f - a.at)];
        if (f - a.at > 6) { a.stage = 'limp'; dog.mode = 'walk'; }
      } else if (a.stage === 'limp') {
        dog.x += a.dir * 3;
        dog.sy = f % 6 < 3 ? 0.94 : 1;
        if (dog.x < -70 || dog.x > W + 70) { dog.mode = 'hidden'; dog.sy = 1; return true; }
      }
      return false;
    },
    sign: function (f, a) {
      var squeeze = 1 / m.stretch();
      /* The sign, held up ([up] 1), or fallen flat on its back ([up] near 0). */
      function hold(up, bob) {
        sign.setAttribute('transform', 'translate(' + a.signX.toFixed(1) + ' ' + (ground + bob) + ') scale(' + squeeze.toFixed(4) + ' ' + up.toFixed(3) + ')');
      }
      if (f === 0) {
        // Out to just short of the middle, so the sign it holds out is under the name.
        a.dir = rand() < 0.5 ? 1 : -1; dog.dir = a.dir; dog.mode = 'walk'; bird.mode = 'hidden';
        dog.x = a.dir > 0 ? -50 : W + 50; a.stop = W / 2 - a.dir * (110 + rand() * 40); a.stage = 'in';
      }
      if (a.stage === 'in') {
        dog.x += a.dir * 6;
        if ((a.dir > 0 && dog.x >= a.stop) || (a.dir < 0 && dog.x <= a.stop)) { dog.mode = 'stand'; a.stage = 'turn'; a.at = f; }
      } else if (a.stage === 'turn') {
        // It turns to the reader, and lets that sink in.
        if (f - a.at === 4) dog.mode = 'face';
        if (f - a.at > 16) { a.stage = 'sign'; a.at = f; a.signX = dog.x + a.dir * 128 * squeeze; }
      } else if (a.stage === 'sign') {
        sign.setAttribute('opacity', 1);
        hold(1, (f - a.at) % 12 < 6 ? 0 : 1);
        // Just then, the bird, behind it, from the way it came.
        if (f - a.at === 46) { bird.mode = 'run'; bird.dir = a.dir; bird.x = a.dir > 0 ? -40 : W + 40; }
        if (bird.mode === 'run') {
          bird.x += a.dir * BIRD_RUN;
          if (f % 2 === 0) puff(bird.x - a.dir * 20, 7 + rand() * 4);
          if ((a.dir > 0 && bird.x > dog.x) || (a.dir < 0 && bird.x < dog.x)) { dog.mode = 'look'; a.stage = 'drop'; a.at = f; }
        }
      } else if (a.stage === 'drop' || a.stage === 'after') {
        bird.x += a.dir * BIRD_RUN;
        if (bird.x < -60 || bird.x > W + 60) bird.mode = 'hidden';
        // The sign topples over flat, and lies there a moment.
        var t = f - a.at;
        hold(Math.max(0.06, Math.cos(Math.min(1, t / 4) * Math.PI / 2)), 0);
        sign.setAttribute('opacity', t < 30 ? 1 : Math.max(0, 1 - (t - 30) / 12));
        if (a.stage === 'drop' && t > 8) { a.stage = 'after'; dog.mode = 'run'; }
        if (a.stage === 'after') {
          dog.x += a.dir * DOG_RUN;
          if (f % 4 === 0) puff(dog.x - a.dir * 26, 4);
        }
        if (a.stage === 'after' && (dog.x < -70 || dog.x > W + 70) && t > 42) {
          dog.mode = 'hidden'; sign.setAttribute('opacity', 0); return true;
        }
      }
      return false;
    },
    // Not an act the seed picks: the canine, running after the bird, into the tunnel it went into.
    smack: function (f, a) {
      var squeeze = 1 / m.stretch(), face = a.tx - a.dir * (TUNNEL_HALF * squeeze + 6);
      if (f === 0) {
        // Whatever act it cut short leaves nothing behind.
        [sign, anvil, train, stars].forEach(function (e) { e.setAttribute('opacity', 0); });
        dog.mode = 'stand'; dog.dir = a.dir; dog.sx = 0.25; dog.sy = 1; dog.x = face; bird.mode = 'hidden';
        a.stage = 'splat'; puff(face, 6);
      }
      if (a.stage === 'splat') {
        if (f > 16) {
          a.stage = 'dizzy'; a.at = f; dog.sx = 1; dog.x = face - a.dir * 37;
          // Solid rock, it turns out; the painting fades, its work done.
          if (tunnel === a.tunnel) tunnel.fading = 0;
        }
      } else if (a.stage === 'dizzy') {
        stars.setAttribute('opacity', 1);
        var sx = dog.x + a.dir * 24, sy = ground - 58, d = '';
        for (var k = 0; k < 3; k++) {
          var ang = (f - a.at) * 0.35 + k * 2.1;
          var px = sx + Math.cos(ang) * 16, py = sy + Math.sin(ang) * 5;
          d += 'M' + (px - 3).toFixed(1) + ' ' + py.toFixed(1) + 'h6M' + px.toFixed(1) + ' ' + (py - 3).toFixed(1) + 'v6';
        }
        stars.setAttribute('d', d);
        if (f - a.at > 30) { stars.setAttribute('opacity', 0); a.stage = 'back'; dog.dir = -a.dir; dog.mode = 'walk'; }
      } else if (a.stage === 'back') {
        dog.x -= a.dir * 4;
        dog.sy = 1 + (f % 6 < 3 ? 0.04 : -0.04);
        if (dog.x < -70 || dog.x > W + 70) { dog.mode = 'hidden'; dog.sy = 1; return true; }
      }
      return false;
    },
    train: function (f, a) {
      if (f === 0) {
        dog.dir = 1; dog.mode = 'run'; bird.mode = 'hidden';
        dog.x = W + 50; dog.dir = -1; a.stop = W * 0.3 + rand() * W * 0.35; a.stage = 'in';
      }
      var squeeze = 1 / m.stretch();
      if (a.stage === 'in') {
        dog.x -= DOG_RUN;
        if (f % 4 === 0) puff(dog.x + 26, 4);
        if (dog.x <= a.stop) { dog.mode = 'stand'; a.stage = 'pant'; a.at = f; }
      } else if (a.stage === 'pant') {
        dog.sy = 1 + ((f - a.at) % 8 < 4 ? 0.05 : 0);
        // It turns to see the train coming from behind.
        if (f - a.at > 14) { dog.mode = 'look'; a.stage = 'train'; a.tx = -trainWidth * squeeze - 20; }
      } else if (a.stage === 'train' || a.stage === 'flat') {
        // The train comes from behind, along the track, and doesn't stop.
        a.tx += 9;
        train.setAttribute('opacity', 1);
        train.setAttribute('transform', 'translate(' + a.tx.toFixed(1) + ' ' + ground + ') scale(' + squeeze.toFixed(4) + ' 1)');
        if (a.stage === 'train' && a.tx + trainWidth * squeeze >= dog.x - 20) { dog.sy = 0.12; dog.mode = 'stand'; a.stage = 'flat'; }
        if (a.tx > W + 20) { train.setAttribute('opacity', 0); a.stage = 'peel'; a.at = f; }
      } else if (a.stage === 'peel') {
        dog.sy = [0.3, 0.6, 1.2, 0.95, 1][Math.min(4, f - a.at)];
        if (f - a.at > 8) { a.stage = 'limp'; dog.mode = 'walk'; dog.dir = 1; }
      } else if (a.stage === 'limp') {
        dog.x += 3;
        dog.sy = f % 6 < 3 ? 0.94 : 1;
        if (dog.x > W + 70) { dog.mode = 'hidden'; dog.sy = 1; return true; }
      }
      return false;
    }
  };

  /* Whether [f] passed [x] this step, going no further than a step goes. */
  function passed(f, x, reach) {
    return Math.abs(f.x - f.px) <= reach && (f.px - x) * (f.x - x) <= 0 && f.x !== f.px;
  }

  /* The tunnel's part in a step: it swallows the running bird, and the running canine smacks
     into it, which ends whatever act was on. */
  function tunnelStep() {
    if (!tunnel) return;
    tunnel.age += 1;
    if (tunnel.fading === undefined && tunnel.age > TUNNEL_WAIT && !(act && act.name === 'smack')) tunnel.fading = 0;
    if (tunnel.fading !== undefined) {
      if (++tunnel.fading > 20) tunnel = null;
      return;
    }
    if (bird.mode === 'run' && !bird.under && passed(bird, tunnel.x, BIRD_RUN + 4)) {
      bird.under = true;
      puff(tunnel.x, 9);
    }
    var squeeze = 1 / m.stretch(), nose = dog.x + dog.dir * 40 * squeeze, mouth = tunnel.x - dog.dir * TUNNEL_HALF * squeeze;
    var was = dog.px + dog.dir * 40 * squeeze;
    if (dog.mode === 'run' && Math.abs(dog.x - dog.px) <= DOG_RUN + 2 && (was - mouth) * (nose - mouth) <= 0 && nose !== was) {
      act = { name: 'smack', tx: tunnel.x, dir: dog.dir, tunnel: tunnel };
      frame = 0;
      acts.smack(frame++, act);
    }
  }

  function draw(n) {
    if (tunnel) {
      tunnelEl.setAttribute('opacity', tunnel.fading === undefined ? 1 : Math.max(0, 1 - tunnel.fading / 20).toFixed(2));
      tunnelEl.setAttribute('transform', 'translate(' + tunnel.x.toFixed(1) + ' ' + ground + ') scale(' + (1 / m.stretch()).toFixed(4) + ' 1)');
    } else tunnelEl.setAttribute('opacity', 0);
    place(bird, n);
    place(dog, n);
    dust = dust.filter(function (p) {
      p.age += 1;
      if (p.age > 16) { dustLayer.removeChild(p.el); return false; }
      p.el.setAttribute('r', (p.size + p.age * 0.6).toFixed(1));
      p.el.setAttribute('fill-opacity', (0.5 * (1 - p.age / 16)).toFixed(2));
      return true;
    });
  }
  draw(0);

  return {
    interval: 60,
    step: function (n) {
      bird.px = bird.x; dog.px = dog.x;
      if (!act) {
        if (--rest > 0) { tunnelStep(); draw(n); return; }
        act = { name: ACTS[Math.floor(rand() * ACTS.length)] };
        frame = 0;
        bird.under = false;
      }
      if (acts[act.name](frame++, act)) { act = null; bird.under = false; rest = 20 + Math.floor(rand() * 50); }
      else tunnelStep();
      draw(n);
    },
    // A click: a tunnel there, on the ground, or the one there is moved.
    poke: function (x) {
      tunnel = { x: Math.max(TUNNEL_HALF, Math.min(W - TUNNEL_HALF, x)), age: 0 };
      draw(frame);
    }
  };
}
