/* Train: an ASCII-art train running along a track at the foot of the masthead, below the name,
   trailing smoke, its wheels' rods turning. Between trains the track waits, empty. Each train's
   cars, cargo and pace come from the seed, so ?ambientSeed=<n> replays them. */

/* The engine, front to the right, as it runs left to right; its stack is at STACK. */
export var ENGINE = [
  ' _______            ||  ',
  '|  [ ]  |___________||__ ',
  '|       |               |\\',
  '|       |   BYTECODE    | \\',
  '|_______|_______________|__>',
  '  (o)(o)   (O)=(O)=(O)     '
];
var STACK = 20;
var ENGINE_W = Math.max.apply(null, ENGINE.map(function (line) { return line.length; }));
var RODS = ['  (o)(o)   (O)=(O)=(O)     ', '  (o)(o)   (O)-(O)-(O)     '];

export var CARGO = ['JVM 21', '0xCAFEBABE', 'javac', 'BYTES', 'NEWS', 'invokedynamic', 'STACK', 'HEAP', 'GC', 'JIT'];
var CAR_W = 20;

/* A car with [label] painted on its side, coupled to whatever follows it. */
export function car(label) {
  var inner = CAR_W - 2;
  var left = Math.floor((inner - label.length) / 2);
  var painted = ' '.repeat(left) + label + ' '.repeat(inner - left - label.length);
  return [
    '',
    ' ' + '_'.repeat(inner) + '  ',
    '|' + ' '.repeat(inner) + '| ',
    '|' + painted + '|=',
    '|' + '_'.repeat(inner) + '|=',
    '   (o)(o)    (o)(o)  '
  ];
}

/* The train's rows: its cars, then the engine. Every piece is padded to its own width. */
export function rows(cars) {
  var pieces = cars.map(car).concat([ENGINE]);
  var out = [];
  for (var r = 0; r < ENGINE.length; r++) {
    out.push(pieces.map(function (piece) {
      var width = Math.max.apply(null, piece.map(function (line) { return line.length; }));
      var line = piece[r] || '';
      return line + ' '.repeat(width - line.length);
    }).join(''));
  }
  return out;
}

var FONT = 12, LINE = 12, CHAR = FONT * 0.6;

/* Text as drawn: SVG collapses runs of spaces, which would undo the art, but not no-break spaces. */
function solid(line) { return line.replace(/ /g, '\u00a0'); }

export default function train(layer, m) {
  var W = m.width, H = m.height;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  var base = H - 12;
  // The track: rails, and sleepers every so often.
  var sleepers = [];
  for (var x = 4; x < W; x += 16) sleepers.push('M' + x + ' ' + (base + 3) + 'v5');
  m.el('path', { 'class': 'masthead-train-track', d: 'M0 ' + (base + 4) + 'H' + W + sleepers.join('') });

  var group = m.el('g', { 'class': 'masthead-train-cars' });
  var texts = ENGINE.map(function (_, r) {
    var t = m.el('text', { x: 0, y: (r - ENGINE.length + 1) * LINE }, group);
    t.textContent = '';
    return t;
  });
  var smoke = m.el('g', { 'class': 'masthead-train-smoke' });
  var puffs = [];

  var running = null, nextAt = null, rod = 0;

  function depart(now) {
    var count = 2 + Math.floor(rand() * 3), cars = [];
    for (var c = 0; c < count; c++) cars.push(CARGO[Math.floor(rand() * CARGO.length)]);
    var lines = rows(cars);
    lines.forEach(function (line, r) { texts[r].textContent = solid(line); });
    var length = lines[0].length, carsWidth = length - ENGINE_W;
    running = {
      cars: cars, length: length, stack: carsWidth + STACK, x: null, speed: 2.4 + rand() * 1.4, started: now,
      // The wheels' row up to the engine's, so the engine's rods can turn.
      wheels: lines[ENGINE.length - 1].slice(0, carsWidth)
    };
  }

  function draw() {
    var stretch = m.stretch();
    if (!running) { group.setAttribute('opacity', 0); return; }
    group.setAttribute('opacity', 1);
    group.setAttribute('transform', 'translate(' + running.x.toFixed(1) + ' ' + base + ') scale(' + (1 / stretch).toFixed(4) + ' 1)');
  }

  function puff(stretch) {
    var x = running.x + (running.stack + 1) * CHAR / stretch;
    var p = m.el('text', { 'class': 'masthead-train-puff' }, smoke);
    p.textContent = solid(rand() < 0.5 ? '( )' : '(  )');
    puffs.push({ el: p, x: x, y: base - ENGINE.length * LINE + 2, age: 0, drift: 0.3 + rand() * 0.5 });
  }

  function blow(stretch) {
    puffs = puffs.filter(function (p) {
      p.age += 1;
      p.y -= 0.9;
      p.x -= p.drift;
      if (p.age > 70 || p.y < 150) { smoke.removeChild(p.el); return false; }
      p.el.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ') scale(' + (1 / stretch).toFixed(4) + ' 1)');
      p.el.setAttribute('fill-opacity', (0.8 * (1 - p.age / 70)).toFixed(2));
      return true;
    });
  }

  // The first train is coming in already.
  depart(0);
  running.x = -running.length * CHAR / m.stretch() * 0.6;
  draw();

  return {
    interval: 40,
    step: function (n, now) {
      var stretch = m.stretch();
      if (!running) {
        if (nextAt === null) nextAt = now + 3500 + rand() * 6000;
        if (now >= nextAt) { nextAt = null; depart(now); }
      }
      if (running) {
        var width = running.length * CHAR / stretch;
        if (running.x === null) running.x = -width - 10;
        running.x += running.speed;
        if (n % 6 === 0) {
          rod = 1 - rod;
          texts[ENGINE.length - 1].textContent = solid(running.wheels + RODS[rod]);
        }
        if (n % 9 === 0 && puffs.length < 10) puff(stretch);
        if (running.x > W + 10) { running = null; }
      }
      blow(stretch);
      draw();
    }
  };
}
