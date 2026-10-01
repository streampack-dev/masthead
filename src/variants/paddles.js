/* Paddles: the first video game, two paddles and a ball, playing itself at an easy pace. The ball
   crosses the masthead, past the name and over the dashed net down the middle; each paddle
   follows it, not quite fast enough to always get there, so now and then a point is won and the
   scores at the top tick up. At eleven it starts again. The rallies come from the seed, so
   ?ambientSeed=<n> replays them. */
export var LEFT = 40, RIGHT = 1160, PADDLE = 56, BALL = 8;
var TOP = 10, BOTTOM = 310, SPEED = 5.5, CHASE = 2.6, WIN = 11;

/* The paddle's next y: toward where it thinks the ball will meet it, at its best speed. */
export function chase(paddleY, aim) {
  var d = aim - paddleY;
  return paddleY + Math.max(-CHASE, Math.min(CHASE, d));
}

/* Where the ball will cross [x], bouncing off the top and bottom on the way. */
export function landing(ball, x) {
  var t = (x - ball.x) / ball.vx;
  if (t < 0) return ball.y;
  var span = BOTTOM - TOP, y = ball.y - TOP + ball.vy * t;
  y = ((y % (2 * span)) + 2 * span) % (2 * span);
  return TOP + (y > span ? 2 * span - y : y);
}

export default function paddles(layer, m) {
  var W = m.width;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var net = [];
  for (var y = TOP; y < BOTTOM; y += 18) net.push('M' + W / 2 + ' ' + y + 'v9');
  m.el('path', { 'class': 'masthead-paddles-net', d: net.join('') });
  var scoreEls = [m.el('text', { 'class': 'masthead-paddles-score', y: 44, 'text-anchor': 'middle' }), m.el('text', { 'class': 'masthead-paddles-score', y: 44, 'text-anchor': 'middle' })];
  var paddleEls = [m.el('rect', { 'class': 'masthead-paddles-paddle', width: 7, height: PADDLE }), m.el('rect', { 'class': 'masthead-paddles-paddle', width: 7, height: PADDLE })];
  var ballEl = m.el('rect', { 'class': 'masthead-paddles-ball', width: BALL, height: BALL, x: -BALL / 2, y: -BALL / 2 });

  var scores = [0, 0], ys = [160, 160], ball, wait = 30;
  // Each paddle misjudges the ball by a little, differently each rally.
  var error = [0, 0];

  function serve(toward) {
    var a = (rand() - 0.5) * 0.9;
    ball = { x: W / 2, y: 60 + rand() * 200, vx: toward * SPEED * Math.cos(a), vy: SPEED * Math.sin(a) };
    error = [(rand() - 0.5) * 70, (rand() - 0.5) * 70];
  }
  serve(rand() < 0.5 ? -1 : 1);

  function draw() {
    var squeeze = (1 / m.stretch()).toFixed(4);
    paddleEls[0].setAttribute('x', LEFT - 7);
    paddleEls[1].setAttribute('x', RIGHT);
    ys.forEach(function (y, k) { paddleEls[k].setAttribute('y', (y - PADDLE / 2).toFixed(1)); });
    ballEl.setAttribute('transform', 'translate(' + ball.x.toFixed(1) + ' ' + ball.y.toFixed(1) + ') scale(' + squeeze + ' 1)');
    ballEl.setAttribute('opacity', wait > 0 ? 0 : 1);
    scoreEls.forEach(function (el, k) {
      el.textContent = String(scores[k]);
      el.setAttribute('transform', 'translate(' + (W / 2 + (k ? 1 : -1) * 200) + ' 0) scale(' + squeeze + ' 1)');
    });
  }
  draw();

  return {
    interval: 40,
    step: function () {
      if (wait > 0) { wait -= 1; draw(); return; }
      ball.x += ball.vx; ball.y += ball.vy;
      if (ball.y < TOP) { ball.y = 2 * TOP - ball.y; ball.vy = -ball.vy; }
      if (ball.y > BOTTOM) { ball.y = 2 * BOTTOM - ball.y; ball.vy = -ball.vy; }

      // The paddle the ball is heading for chases where it'll arrive; the other drifts back.
      var k = ball.vx < 0 ? 0 : 1;
      ys[k] = chase(ys[k], landing(ball, k ? RIGHT : LEFT) + error[k]);
      ys[1 - k] = chase(ys[1 - k], 160);

      var edge = k ? RIGHT : LEFT;
      if ((k === 0 && ball.x <= edge) || (k === 1 && ball.x >= edge)) {
        if (Math.abs(ball.y - ys[k]) <= PADDLE / 2 + BALL / 2) {
          // Returned: the further from the paddle's middle it hits, the steeper it goes back.
          var off = (ball.y - ys[k]) / (PADDLE / 2);
          var a = off * 0.75;
          ball.x = edge;
          ball.vx = (k ? -1 : 1) * SPEED * Math.cos(a);
          ball.vy = SPEED * Math.sin(a);
          error[1 - k] = (rand() - 0.5) * 70;
        } else {
          // Missed: a point to the other side, and a serve toward the one who missed.
          scores[1 - k] += 1;
          if (scores[1 - k] >= WIN) scores = [0, 0];
          serve(k ? 1 : -1);
          wait = 45;
        }
      }
      draw();
    }
  };
}
