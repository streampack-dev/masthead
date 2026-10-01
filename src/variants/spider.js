/* Spider: a cobweb in a top corner, and a spider letting itself down on its thread from the top
   of the masthead, pausing to dangle and wave its legs, then climbing back up to come down
   somewhere else. Where it drops, and how far, come from the seed, so ?ambientSeed=<n> replays it.
   An October animation. */

/* A spider's body: a round abdomen, and a smaller head below it, as it hangs. */
export var BODY = 'M0 -6a6 6.5 0 1 0 0.1 0zM0 4.5a3.4 3.2 0 1 0 0.1 0z';

/* Its eight jointed legs, at [kick] (0 to 1), as lines. */
export function spider(kick) {
  var d = '';
  for (var k = 0; k < 4; k++) {
    var spread = (k - 1.5) * 4, wave = Math.sin(kick * Math.PI * 2 + k) * 1.5;
    [-1, 1].forEach(function (s) {
      d += 'M' + (s * 4) + ' ' + (spread * 0.6).toFixed(1) +
        'L' + (s * 11) + ' ' + (spread - 6 + wave).toFixed(1) +
        'L' + (s * 15) + ' ' + (spread * 1.6 + 4 + wave).toFixed(1);
    });
  }
  return d;
}

/* A cobweb in a corner at (x, 0), opening toward [side]: spokes, and threads strung between them. */
export function web(x, side) {
  var spokes = 7, rings = 5, len = 130, d = '';
  var angle = function (k) { return Math.PI / 2 * (k / (spokes - 1)); };
  for (var k = 0; k < spokes; k++) {
    var a = angle(k);
    d += 'M' + x + ' 0l' + (side * Math.cos(a) * len).toFixed(1) + ' ' + (Math.sin(a) * len * 0.7).toFixed(1);
  }
  for (var r = 1; r <= rings; r++) {
    var rad = len * r / (rings + 0.6);
    for (var j = 0; j < spokes; j++) {
      var p = [x + side * Math.cos(angle(j)) * rad, Math.sin(angle(j)) * rad * 0.7];
      // Threads sag a little between spokes.
      if (j === 0) { d += 'M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1); continue; }
      var q = [x + side * Math.cos(angle(j - 0.5)) * rad * 0.9, Math.sin(angle(j - 0.5)) * rad * 0.7 * 0.9];
      d += 'Q' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ' ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
    }
  }
  return d;
}

export default function spiderVariant(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var side = rand() < 0.5 ? 1 : -1;
  m.el('path', { 'class': 'masthead-spider-web', d: web(side > 0 ? 0 : W, side) });
  var thread = m.el('path', { 'class': 'masthead-spider-thread' });
  var body = m.el('g');
  var legs = m.el('path', { 'class': 'masthead-spider-legs' }, body);
  m.el('path', { 'class': 'masthead-spider-body', d: BODY }, body);

  // A drop: where along the top, how far down, how long it dangles.
  var s = { x: 0, y: -20, target: 0, state: 'down', wait: 0 };
  function drop() {
    s.x = 160 + rand() * (W - 320);
    s.target = 70 + rand() * (H - 150);
    s.y = -20;
    s.state = 'down';
  }
  drop();
  s.y = s.target * 0.6;

  function draw(n) {
    var kick = s.state === 'dangle' ? (n % 60) / 60 : (n % 20) / 20;
    thread.setAttribute('d', 'M' + s.x.toFixed(1) + ' 0V' + (s.y - 6).toFixed(1));
    // It sways a little on its thread while it dangles.
    var sway = s.state === 'dangle' ? Math.sin(n * 0.05) * 3 : 0;
    legs.setAttribute('d', spider(kick));
    body.setAttribute('transform', 'translate(' + (s.x + sway).toFixed(1) + ' ' + s.y.toFixed(1) + ') scale(' + (1.3 / m.stretch()).toFixed(4) + ' 1.3)');
  }
  draw(0);

  return {
    interval: 40,
    step: function (n) {
      if (s.state === 'down') {
        // Paying out its thread: quick at first, slowing as it nears where it stops.
        s.y += Math.max(0.4, (s.target - s.y) * 0.03);
        if (s.y >= s.target) { s.y = s.target; s.state = 'dangle'; s.wait = 120 + Math.floor(rand() * 200); }
      } else if (s.state === 'dangle') {
        if (--s.wait <= 0) s.state = 'up';
      } else if (s.state === 'up') {
        s.y -= 0.9;
        if (s.y < -20) { s.state = 'gone'; s.wait = 60 + Math.floor(rand() * 120); }
      } else if (--s.wait <= 0) {
        drop();
      }
      draw(n);
    }
  };
}
