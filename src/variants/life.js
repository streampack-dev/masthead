/* Life: Conway's Game of Life across the masthead, reseeded when it settles, as on bytecode.news.
   ?ambientSeed=<n> replays a board. A click clears a patch and plants one of PLANTS there, each
   click the next. About one run in three colours each cell by how long it has lived, from the
   paint palette: newborn, young, grown and old (BANDS), so gliders show as bright fronts and still
   lifes settle into the last colour. */

/* What a click plants, as rows of live (O) and dead cells around the click: four gliders flying
   out from it, an acorn and an R-pentomino, the last two long-lived methuselahs. */
export var PLANTS = [
  [
    'OOO.......OOO',
    'O...........O',
    '.O.........O.',
    '.............',
    '.O.........O.',
    'O...........O',
    'OOO.......OOO'
  ],
  ['.O.....', '...O...', 'OO..OOO'],
  ['.OO', 'OO.', '.O.']
];
var CLEAR = 9;

/* The ages (in generations) where each colour band starts, and the paint for each: cadmium yellow
   for the newborn, then orange, rose, and ultramarine for the old. */
export var BANDS = [1, 2, 5, 20];
export var BAND_PAINTS = [3, 2, 9, 7];

/* The band of a live cell of [age]: 0 for the newborn up to BANDS.length - 1. */
export function band(age) {
  var b = 0;
  while (b + 1 < BANDS.length && age >= BANDS[b + 1]) b++;
  return b;
}

/* Whether the run from [seed] is coloured by age: about one in three, from a hash of the seed of
   its own, so the board is the same either way. */
export function coloured(seed) {
  var v = Math.imul((seed >>> 0) ^ 0x3c6ef372, 0x297a2d39) >>> 0;
  v = Math.imul(v ^ (v >>> 15), 0x85ebca6b) >>> 0;
  return (v ^ (v >>> 13)) % 3 === 0;
}

export default function life(layer, m) {
  var COLUMNS = 200, ROWS = 53, DENSITY = 0.28, MIN_LIVE = 80, MAX_GENERATIONS = 520;
  function unit(seed, index) {
    var v = (seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
    v = Math.imul(v ^ (v >>> 16), 0x21f0aaad);
    v = Math.imul(v ^ (v >>> 15), 0x735a2d97);
    return ((v ^ (v >>> 15)) >>> 0) / 0x100000000;
  }
  function start(seed) {
    var cells = new Uint8Array(COLUMNS * ROWS), ages = new Uint16Array(cells.length);
    for (var i = 0; i < cells.length; i++) if (unit(seed, i) < DENSITY) { cells[i] = 1; ages[i] = 1; }
    return { cells: cells, ages: ages, seed: seed, generation: 0 };
  }
  var life = start(m.seed());
  var aged = coloured(m.seed());
  var paths = (aged ? BAND_PAINTS : [0]).map(function (paint) {
    return m.el('path', { 'class': 'masthead-life-cells' + (paint ? ' masthead-paint-fill-' + paint : '') });
  });

  function draw() {
    var cw = m.width / COLUMNS, ch = m.height / ROWS;
    var inset = Math.min(cw, ch) * 0.16, mw = (cw - inset * 2).toFixed(1), mh = (ch - inset * 2).toFixed(1);
    var d = paths.map(function () { return []; });
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLUMNS; c++) {
        var i = r * COLUMNS + c;
        if (life.cells[i]) {
          d[aged ? band(life.ages[i]) : 0].push('M' + (c * cw + inset).toFixed(1) + ' ' + (r * ch + inset).toFixed(1) + 'h' + mw + 'v' + mh + 'h-' + mw + 'Z');
        }
      }
    }
    paths.forEach(function (path, k) { path.setAttribute('d', d[k].join('')); });
  }
  draw();
  var planted = 0;

  return {
    interval: 145,
    poke: function (x, y) {
      var c0 = Math.floor(x / (m.width / COLUMNS)), r0 = Math.floor(y / (m.height / ROWS));
      var plant = PLANTS[planted++ % PLANTS.length];
      var cells = life.cells, ages = life.ages;
      function at(r, c) { return ((r % ROWS) + ROWS) % ROWS * COLUMNS + ((c % COLUMNS) + COLUMNS) % COLUMNS; }
      for (var dr = -CLEAR; dr <= CLEAR; dr++) {
        for (var dc = -CLEAR * 2; dc <= CLEAR * 2; dc++) { cells[at(r0 + dr, c0 + dc)] = 0; ages[at(r0 + dr, c0 + dc)] = 0; }
      }
      var top = r0 - Math.floor(plant.length / 2), left = c0 - Math.floor(plant[0].length / 2);
      plant.forEach(function (row, r) {
        for (var c = 0; c < row.length; c++) if (row[c] === 'O') { cells[at(top + r, left + c)] = 1; ages[at(top + r, left + c)] = 1; }
      });
      life.generation = 0;
      draw();
    },
    step: function () {
      var cells = life.cells, ages = life.ages, next = new Uint8Array(cells.length), nextAges = new Uint16Array(cells.length), changed = 0, live = 0;
      for (var r = 0; r < ROWS; r++) {
        var up = r === 0 ? ROWS - 1 : r - 1, down = r === ROWS - 1 ? 0 : r + 1;
        for (var c = 0; c < COLUMNS; c++) {
          var left = c === 0 ? COLUMNS - 1 : c - 1, right = c === COLUMNS - 1 ? 0 : c + 1, i = r * COLUMNS + c;
          var n = cells[up * COLUMNS + left] + cells[up * COLUMNS + c] + cells[up * COLUMNS + right]
            + cells[r * COLUMNS + left] + cells[r * COLUMNS + right]
            + cells[down * COLUMNS + left] + cells[down * COLUMNS + c] + cells[down * COLUMNS + right];
          var alive = cells[i] === 1, lives = n === 3 || (alive && n === 2);
          if (lives) { next[i] = 1; nextAges[i] = alive ? Math.min(ages[i] + 1, 65535) : 1; live++; }
          if (lives !== alive) changed++;
        }
      }
      var generation = life.generation + 1;
      life = changed === 0 || live < MIN_LIVE || generation >= MAX_GENERATIONS
        ? start(life.seed + generation + 1)
        : { cells: next, ages: nextAges, seed: life.seed, generation: generation };
      draw();
    }
  };
}
