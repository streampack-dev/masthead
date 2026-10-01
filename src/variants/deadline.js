/* Deadline: a writer at a desk on the left of the masthead, in the jerky style of paper cutout
   animation: flat pieces on hinges, snapping from pose to pose and holding, with no movement in
   between. The writer types in frantic bursts (the screen filling line by line), stops to think,
   leans back, sips coffee, and now and then brings their head down on the keyboard, a few times,
   the monitor jumping and gibberish appearing on the screen. The screen clears when it's full.
   The routine comes from the seed, so ?ambientSeed=<n> replays it. */

/* Poses: how far the body leans forward and the head tilts (degrees), how open the jaw is, and
   where each hand is from the shoulder; the elbows bend to reach. Every pose is held, never eased
   into. */
export var POSES = {
  typeA: { lean: 12, head: 10, near: [48, 20], far: [40, 24], jaw: 0 },
  typeB: { lean: 14, head: 14, near: [42, 22], far: [47, 19], jaw: 3 },
  think: { lean: 4, head: -6, near: [12, -12], far: [40, 26], jaw: 0 },
  slump: { lean: 40, head: 70, near: [30, 15], far: [22, 15], jaw: 6 },
  rear: { lean: -6, head: -18, near: [12, -34], far: [6, -30], jaw: 8 },
  back: { lean: -18, head: -10, near: [-8, -34], far: [-14, -28], jaw: 0 },
  sip: { lean: 2, head: -10, near: [16, -8], far: [40, 26], jaw: 2 }
};

/* The routine's scenes: each a list of [pose, steps held], at a few steps a frame. */
export var SCENES = {
  type: function (rand) {
    var out = [], n = 10 + Math.floor(rand() * 14);
    for (var k = 0; k < n; k++) out.push([k % 2 ? 'typeB' : 'typeA', 2 + Math.floor(rand() * 2), 'key']);
    return out;
  },
  think: function (rand) { return [['think', 30 + Math.floor(rand() * 30)]]; },
  despair: function (rand) {
    var out = [['rear', 8]], n = 2 + Math.floor(rand() * 2);
    for (var k = 0; k < n; k++) out.push(['slump', 5, 'bang'], ['rear', 6]);
    out.push(['slump', 22], ['typeA', 6]);
    return out;
  },
  back: function (rand) { return [['back', 30 + Math.floor(rand() * 20)]]; },
  coffee: function () { return [['sip', 26], ['typeA', 4]]; }
};

var R = Math.PI / 180;
function rot(p, a) { return [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)]; }
function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }

var UPPER = 30, FORE = 30;

/* The elbow between [from] and [to], bent downward, on an upper arm and forearm of their lengths. */
function elbow(from, to) {
  var dx = to[0] - from[0], dy = to[1] - from[1], d = Math.min(Math.hypot(dx, dy), UPPER + FORE - 0.01);
  var a = Math.atan2(dy, dx), b = Math.acos(Math.max(-1, Math.min(1, (UPPER * UPPER + d * d - FORE * FORE) / (2 * UPPER * d))));
  return [from[0] + Math.cos(a + b) * UPPER, from[1] + Math.sin(a + b) * UPPER];
}

/* The writer in [pose], seated at (0, 0), the seat: where each piece goes, facing right. */
export function writer(pose) {
  var hip = [0, 0];
  var neck = add(hip, rot([0, -62], pose.lean * R));
  var head = add(neck, rot([0, -20], (pose.lean + pose.head) * R));
  var shoulder = add(hip, rot([0, -52], pose.lean * R));
  function arm(at) {
    var hand = add(shoulder, at);
    return [shoulder, elbow(shoulder, hand), hand];
  }
  return { hip: hip, neck: neck, head: head, near: arm(pose.near), far: arm(pose.far), jaw: pose.jaw, lean: pose.lean, tilt: pose.lean + pose.head };
}

export default function deadline(layer, m) {
  var H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  // The whole scene: a desk with its monitor, keyboard and mug, the chair, and the writer.
  var scene = m.el('g', { 'class': 'masthead-deadline' });
  var desk = m.el('g', {}, scene);
  // The desk's top is at -25, a little above the seat; the floor is at 50, the masthead's foot.
  m.el('path', { 'class': 'masthead-deadline-piece', d: 'M38 -25H230V-19H38ZM46 -19V50M222 -19V50' }, desk);
  var monitor = m.el('g', {}, desk);
  m.el('path', { 'class': 'masthead-deadline-piece', d: 'M115 -31h30v6h-30zM125 -31v-6h10v6M86 -117h90v80h-90z' }, monitor);
  var screen = m.el('path', { 'class': 'masthead-deadline-screen' }, monitor);
  var keyboard = m.el('path', { 'class': 'masthead-deadline-piece', d: 'M50 -31h44l-3 6h-44z' }, desk);
  m.el('path', { 'class': 'masthead-deadline-piece', d: 'M196 -27h14v-16h-14zM210 -39q7 0 7 5t-7 5' }, desk);
  // The chair, behind the writer.
  m.el('path', { 'class': 'masthead-deadline-piece', d: 'M-30 2h50v6h-50zM-28 8v42M14 8v42M-30 2l-8 -70h8l8 66' }, scene);

  var body = m.el('g', {}, scene);
  var farArm = m.el('path', { 'class': 'masthead-deadline-limb' }, body);
  var legs = m.el('path', { 'class': 'masthead-deadline-limb', d: 'M0 0L38 2L42 48L54 50' }, body);
  var torso = m.el('path', { 'class': 'masthead-deadline-piece' }, body);
  var headEl = m.el('g', {}, body);
  m.el('path', { 'class': 'masthead-deadline-piece', d: 'M-13 -20a14 15 0 1 1 28 4l2 8l-4 2l1 6q-6 4 -14 2l-2 -4q-11 -2 -11 -18z' }, headEl);
  m.el('circle', { 'class': 'masthead-deadline-eye', cx: 7, cy: -24, r: 2 }, headEl);
  var jawEl = m.el('path', { 'class': 'masthead-deadline-piece', d: 'M2 -2l12 0l-2 6h-9z' }, headEl);
  m.el('path', { 'class': 'masthead-deadline-hair', d: 'M-13 -22q2 -16 18 -16q10 0 12 8q-6 -4 -12 -2q-8 2 -18 10z' }, headEl);
  var nearArm = m.el('path', { 'class': 'masthead-deadline-limb' }, body);
  var mug = m.el('path', { 'class': 'masthead-deadline-piece', d: 'M-6 -10h12v12h-12zM6 -7q5 0 5 4t-5 4' }, body);
  var bang = m.el('path', { 'class': 'masthead-deadline-bang', opacity: 0 }, scene);

  var lines = [], plan = [], hold = 0, pose = POSES.typeA, shake = 0, bangAge = 99;

  function writeLine(gibberish) {
    if (lines.length >= 9) lines = [];
    var w = gibberish ? 74 : 20 + rand() * 54;
    lines.push({ w: w, jag: gibberish });
  }
  function drawScreen() {
    screen.setAttribute('d', lines.map(function (l, k) {
      var y = -108 + k * 8;
      if (!l.jag) return 'M94 ' + y + 'h' + l.w.toFixed(1);
      var d = 'M94 ' + y;
      for (var x = 0; x < l.w; x += 4) d += 'l4 ' + (x % 8 ? 3 : -3);
      return d;
    }).join(''));
  }

  function next() {
    if (!plan.length) {
      var r = rand(), name = r < 0.45 ? 'type' : r < 0.6 ? 'think' : r < 0.75 ? 'despair' : r < 0.88 ? 'back' : 'coffee';
      plan = SCENES[name](rand);
    }
    var beat = plan.shift();
    pose = POSES[beat[0]];
    hold = beat[1];
    if (beat[2] === 'key' && rand() < 0.35) writeLine(false);
    if (beat[2] === 'bang') { shake = 3; bangAge = 0; writeLine(true); }
  }

  function draw() {
    var w = writer(pose), squeeze = 1 / m.stretch();
    // On the left, standing on the masthead's foot; it keeps its shape however it's stretched.
    scene.setAttribute('transform', 'translate(70 ' + (H - 50) + ') scale(' + squeeze.toFixed(4) + ' 1)');
    var jump = shake > 0 ? (shake % 2 ? -3 : 2) : 0;
    monitor.setAttribute('transform', 'translate(0 ' + jump + ')');
    keyboard.setAttribute('transform', 'translate(0 ' + (shake > 0 ? 1.5 : 0) + ')');
    function limb(a) { return 'M' + a[0][0].toFixed(1) + ' ' + a[0][1].toFixed(1) + 'L' + a[1][0].toFixed(1) + ' ' + a[1][1].toFixed(1) + 'L' + a[2][0].toFixed(1) + ' ' + a[2][1].toFixed(1); }
    // The torso: a flat slab from hip to neck, a little wider at the shoulders.
    var up = rot([0, -1], w.lean * R), side = [-up[1], up[0]];
    var t = [add(w.hip, [side[0] * -10, side[1] * -10]), add(w.hip, [side[0] * 10, side[1] * 10]), add(w.neck, [side[0] * 13, side[1] * 13]), add(w.neck, [side[0] * -11, side[1] * -11])];
    torso.setAttribute('d', 'M' + t.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L') + 'Z');
    farArm.setAttribute('d', limb(w.far));
    nearArm.setAttribute('d', limb(w.near));
    headEl.setAttribute('transform', 'translate(' + w.neck[0].toFixed(1) + ' ' + w.neck[1].toFixed(1) + ') rotate(' + w.tilt.toFixed(1) + ')');
    jawEl.setAttribute('transform', 'translate(0 ' + w.jaw + ')');
    var holding = pose === POSES.sip;
    mug.setAttribute('opacity', holding ? 1 : 0);
    mug.setAttribute('transform', 'translate(' + w.near[2][0].toFixed(1) + ' ' + w.near[2][1].toFixed(1) + ')');
    drawScreen();
    // A burst where the head meets the keyboard.
    bang.setAttribute('opacity', bangAge < 6 ? 1 : 0);
    if (bangAge === 0) bang.setAttribute('d', 'M58 -40l-8 -10M68 -44l0 -12M78 -40l8 -10M50 -32l-10 0M88 -32l10 0');
  }

  next();
  draw();

  return {
    // Cutout animation moves in held frames, a few a second, not smoothly.
    interval: 90,
    step: function () {
      if (shake > 0) shake -= 1;
      bangAge += 1;
      if (--hold <= 0) next();
      draw();
    }
  };
}
