/* Pong wars: a field of squares split between two sides, and two balls, each living in the
   other side's ground. Every square a ball touches comes over to its side, and the ball bounces
   off it, so the border between them wanders back and forth forever, neither side ever quite
   winning. One side is a faint wash of the accent, the other the page itself, fainter still
   behind the name. The game comes from the seed, so ?ambientSeed=<n> replays it. */
export var COLS = 40, ROWS = 11;
var RADIUS = 7, SPEED = 3;

/* One step for [ball] over [cells]: squares of the other side that it touches come over to its
   side, and it bounces off them; then it bounces off the walls. Returns whether any came over. */
export function bounce(ball, cells, cw, ch, width, height) {
  var flipped = false;
  for (var a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    var x = ball.x + Math.cos(a) * RADIUS, y = ball.y + Math.sin(a) * RADIUS;
    var c = Math.floor(x / cw), r = Math.floor(y / ch);
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue;
    var i = r * COLS + c;
    if (cells[i] !== ball.side) {
      cells[i] = ball.side;
      flipped = true;
      if (Math.abs(Math.cos(a)) > Math.abs(Math.sin(a))) ball.vx = -Math.sign(Math.cos(a)) * Math.abs(ball.vx);
      else ball.vy = -Math.sign(Math.sin(a)) * Math.abs(ball.vy);
    }
  }
  if (ball.x + ball.vx > width - RADIUS || ball.x + ball.vx < RADIUS) ball.vx = -ball.vx;
  if (ball.y + ball.vy > height - RADIUS || ball.y + ball.vy < RADIUS) ball.vy = -ball.vy;
  ball.x += ball.vx;
  ball.y += ball.vy;
  return flipped;
}

export default function pongwars(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var cw = W / COLS, ch = H / ROWS;
  // The left half starts as one side, the right as the other.
  var cells = new Uint8Array(COLS * ROWS);
  for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS / 2; c++) cells[r * COLS + c] = 1;

  function behindName(c, r) {
    var nx = ((c + 0.5) * cw - W / 2) / (W * 0.25), ny = ((r + 0.5) * ch - H / 2) / (H * 0.28);
    return nx * nx + ny * ny < 1;
  }
  var rects = [];
  for (var k = 0; k < COLS * ROWS; k++) {
    var col = k % COLS, row = Math.floor(k / COLS);
    rects.push(m.el('rect', {
      'class': 'masthead-pongwars-cell', x: (col * cw + 1).toFixed(1), y: (row * ch + 1).toFixed(1),
      width: (cw - 2).toFixed(1), height: (ch - 2).toFixed(1), 'fill-opacity': 0
    }));
  }
  var shown = new Int8Array(COLS * ROWS).fill(-1);

  // Side 1's ball starts in side 0's ground (the right), and side 0's in side 1's (the left).
  function ball(side, x) {
    var a = (rand() * 0.6 + 0.2) * Math.PI / 2 * (rand() < 0.5 ? 1 : -1) + (rand() < 0.5 ? 0 : Math.PI);
    return { side: side, x: x, y: H * (0.25 + rand() * 0.5), vx: Math.cos(a) * SPEED, vy: Math.sin(a) * SPEED,
      el: m.el('circle', { r: RADIUS, 'class': 'masthead-pongwars-ball masthead-pongwars-ball-' + side }) };
  }
  var balls = [ball(1, W * 0.75), ball(0, W * 0.25)];

  function draw() {
    for (var i = 0; i < cells.length; i++) {
      if (cells[i] === shown[i]) continue;
      shown[i] = cells[i];
      rects[i].setAttribute('fill-opacity', cells[i] ? (behindName(i % COLS, Math.floor(i / COLS)) ? 0.45 : 1) : 0);
    }
    var squeeze = (1 / m.stretch()).toFixed(4);
    balls.forEach(function (b) {
      b.el.setAttribute('transform', 'translate(' + b.x.toFixed(1) + ' ' + b.y.toFixed(1) + ') scale(' + squeeze + ' 1)');
    });
  }
  draw();

  return {
    interval: 40,
    step: function () {
      balls.forEach(function (b) {
        bounce(b, cells, cw, ch, W, H);
        // A touch of drift keeps a ball from settling into a loop, and its speed steady.
        b.vx += (rand() - 0.5) * 0.04;
        b.vy += (rand() - 0.5) * 0.04;
        var s = Math.hypot(b.vx, b.vy);
        b.vx *= SPEED / s; b.vy *= SPEED / s;
        // Never too flat to cross the field, nor too steep.
        if (Math.abs(b.vx) < SPEED * 0.25) b.vx = Math.sign(b.vx || 1) * SPEED * 0.25;
        if (Math.abs(b.vy) < SPEED * 0.25) b.vy = Math.sign(b.vy || 1) * SPEED * 0.25;
      });
      draw();
    }
  };
}
