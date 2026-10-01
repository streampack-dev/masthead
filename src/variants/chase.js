/* Chase: a fast, long-legged bird and the scruffy canine forever after it, along the foot of the
   masthead, in the snapping style of cutout animation. Mostly the bird blurs past in a puff of
   dust and the canine scrambles after; sometimes the bird stops dead and the canine skids past;
   sometimes the bird runs out of the frame and the canine, following, smacks into its edge; and
   sometimes the canine, stopped to catch its breath, meets an anvil from above or the train
   along its track. It always pops back up. And now and then it walks out to the middle, turns to
   the reader, and holds up a sign: "...not a coyote." Just then the bird blurs past behind it;
   the sign drops, and the chase is on. The acts come from the seed, so ?ambientSeed=<n> replays
   them. */

/* The canine, facing right, from its feet: a body, a long-snouted head with an ear, a tail. Its
   legs are drawn apart: standing, or a whirl when it runs. */
var DOG = 'M-24 -24a24 11 0 1 0 48 0a24 11 0 1 0 -48 0z' +
  'M-23 -27q-12 -2 -18 -14q8 6 18 8z';
var DOG_HEAD = 'M16 -34q2 -12 14 -10l16 6q2 4 -2 6l-14 2q-10 2 -14 -4z' +
  'M20 -42l-2 -14l9 10z';
/* Its head turned to the reader: both ears, both eyes, a nose and a muzzle. */
var DOG_FACE = 'M14 -40a12 11 0 1 0 24 0a12 11 0 1 0 -24 0z' +
  'M16 -47l-3 -14l9 8zM36 -47l3 -14l-9 8z';
var DOG_FACE_MARKS = 'M21 -43v0M31 -43v0M26 -37v0M21 -33q5 4 10 0';
var DOG_LEGS = 'M-14 -15L-16 0M-6 -15L-6 0M10 -15L10 0M16 -15L19 0';
/* Walking: each pair of legs apart, then together. */
var DOG_STEP = 'M-14 -15L-20 0M-6 -15L-2 0M10 -15L6 0M16 -15L22 0';
/* The bird, facing right, from its feet: a body, a long neck, a crested head with a beak, a tail. */
var BIRD = 'M-12 -40a12 7 0 1 0 24 0a12 7 0 1 0 -24 0z' +
  'M8 -44L14 -60M11 -66a5 5 0 1 0 10 0a5 5 0 1 0 -10 0z' +
  'M21 -66L33 -63L21 -61z' +
  'M14 -70l-6 -8M16 -71l-2 -9M18 -70l2 -8' +
  'M-12 -41l-18 -8M-12 -39l-18 -2M-11 -37l-16 5';
var BIRD_LEGS = 'M-4 -33L-8 0h6M2 -33L2 0h6';

/* Legs in a blur: spokes round a hub, turned a little each frame. */
export function whirl(cx, cy, r, frame) {
  var d = '';
  for (var k = 0; k < 6; k++) {
    var a = frame * 0.9 + k * Math.PI / 3;
    d += 'M' + cx + ' ' + cy + 'l' + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1);
  }
  return d;
}

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
var ACTS = ['chase', 'chase', 'chase', 'chase', 'skid', 'skid', 'edge', 'edge', 'anvil', 'train', 'sign'];
/* The canine's best speed, and the bird's. */
var DOG_RUN = 16, BIRD_RUN = 24;

export default function chase(layer, m) {
  var W = m.width, H = m.height, ground = H - 6;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  function solid(line) { return line.replace(/ /g, ' '); }

  var dustLayer = m.el('g', { 'class': 'masthead-chase-dust' });
  function figure(cls, body, head) {
    var g = m.el('g', { 'class': 'masthead-chase-' + cls, opacity: 0 });
    var inner = m.el('g', {}, g);
    m.el('path', { 'class': 'masthead-chase-piece', d: body }, inner);
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
    return { g: g, inner: inner, legs: legs, alarm: alarm, profile: profile, face: face, x: 0, dir: 1, sx: 1, sy: 1, mode: 'hidden' };
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
    f.g.setAttribute('opacity', f.mode === 'hidden' ? 0 : 1);
    f.g.setAttribute('transform', 'translate(' + f.x.toFixed(1) + ' ' + ground + ') scale(' + (f.dir * f.sx * squeeze).toFixed(4) + ' ' + f.sy.toFixed(3) + ')');
    var isDog = f === dog;
    // Running, legs blur: the canine's front pair and back pair each a whirl of their own, the
    // bird's trailing behind it. Walking, the canine's step.
    f.legs.setAttribute('d', f.mode === 'run'
      ? (isDog ? whirl(-19, -14, 16, n) + whirl(5, -14, 16, n + 1.7) : whirl(-22, -15, 16, n))
      : isDog ? (f.mode === 'walk' && n % 4 < 2 ? DOG_STEP : DOG_LEGS) : BIRD_LEGS);
    // Noticing: a "!" over its head, for a beat; skidding: leaning back hard.
    f.alarm.setAttribute('opacity', f.mode === 'look' ? 1 : 0);
    // Facing the reader: the front of its head instead of its profile.
    f.profile.setAttribute('opacity', f.mode === 'face' ? 0 : 1);
    f.face.setAttribute('opacity', f.mode === 'face' ? 1 : 0);
    f.inner.setAttribute('transform', f.mode === 'skid' ? 'rotate(-14)' : '');
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

  function draw(n) {
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
      if (!act) {
        if (--rest > 0) { draw(n); return; }
        act = { name: ACTS[Math.floor(rand() * ACTS.length)] };
        frame = 0;
      }
      if (acts[act.name](frame++, act)) { act = null; rest = 20 + Math.floor(rand() * 50); }
      draw(n);
    }
  };
}
