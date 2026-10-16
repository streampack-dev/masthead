/* Newscience: Conway's Game of Life, read as bits. The board is three times as wide as it's drawn:
   each row of three cells is one octal digit, shown as one block in one of eight colours, 000
   blank. One bit per colour channel, so a block's colour says which of its three cells live: the
   left one is red, the middle green, the right blue, and the mixes are yellow, magenta and cyan;
   all three is the theme's own colour. A glider becomes a small block of changing colour moving
   across. Reseeded when it settles; ?ambientSeed=<n> replays a board. A click clears a patch and
   plants one of PLANTS there, each click the next. */

export var COLUMNS = 600; // cells across: 200 blocks of three
export var ROWS = 53;
var DENSITY = 0.28, MIN_LIVE = 240, MAX_GENERATIONS = 520, CLEAR = 9;

/* What a click plants (as rows of live O and dead cells), as life plants: four gliders flying out,
   an acorn and an R-pentomino. */
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

/* The colour class of each digit, 1 to 7: a paint for each channel and its mixes, the theme's own
   colour for 7 (in masthead.css, so a host can change them). */
export var DIGIT_CLASSES = [null,
  'masthead-paint-fill-7', // 001 blue: ultramarine
  'masthead-paint-fill-4', // 010 green: sap green
  'masthead-paint-fill-6', // 011 cyan: cerulean
  'masthead-paint-fill-1', // 100 red: cadmium red
  'masthead-paint-fill-9', // 101 magenta: quinacridone rose
  'masthead-paint-fill-3', // 110 yellow: cadmium yellow
  'masthead-newscience-all' // 111
];

/* The digit at block [b] of row [r]: its three cells, left to right, as the bits 4, 2 and 1. */
export function digit(cells, r, b) {
  var i = r * COLUMNS + b * 3;
  return (cells[i] << 2) | (cells[i + 1] << 1) | cells[i + 2];
}

/* One generation of Life on a [columns] by [rows] torus: the next cells, and how many changed and
   live. */
export function generation(cells, columns, rows) {
  var next = new Uint8Array(cells.length), changed = 0, live = 0;
  for (var r = 0; r < rows; r++) {
    var up = (r === 0 ? rows - 1 : r - 1) * columns, here = r * columns, down = (r === rows - 1 ? 0 : r + 1) * columns;
    for (var c = 0; c < columns; c++) {
      var left = c === 0 ? columns - 1 : c - 1, right = c === columns - 1 ? 0 : c + 1;
      var n = cells[up + left] + cells[up + c] + cells[up + right] + cells[here + left] + cells[here + right]
        + cells[down + left] + cells[down + c] + cells[down + right];
      var alive = cells[here + c] === 1, lives = n === 3 || (alive && n === 2);
      if (lives) { next[here + c] = 1; live++; }
      if (lives !== alive) changed++;
    }
  }
  return { cells: next, changed: changed, live: live };
}

export default function newscience(layer, m) {
  function unit(seed, index) {
    var v = (seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
    v = Math.imul(v ^ (v >>> 16), 0x21f0aaad);
    v = Math.imul(v ^ (v >>> 15), 0x735a2d97);
    return ((v ^ (v >>> 15)) >>> 0) / 0x100000000;
  }
  function start(seed) {
    var cells = new Uint8Array(COLUMNS * ROWS);
    for (var i = 0; i < cells.length; i++) if (unit(seed, i) < DENSITY) cells[i] = 1;
    return { cells: cells, seed: seed, generation: 0 };
  }
  var board = start(m.seed());
  var paths = DIGIT_CLASSES.map(function (cls) { return cls ? m.el('path', { 'class': 'masthead-newscience-blocks ' + cls }) : null; });
  var BLOCKS = COLUMNS / 3;

  function draw() {
    var bw = m.width / BLOCKS, bh = m.height / ROWS;
    var inset = Math.min(bw, bh) * 0.08, w = (bw - inset * 2).toFixed(1), h = (bh - inset * 2).toFixed(1);
    var d = DIGIT_CLASSES.map(function () { return []; });
    for (var r = 0; r < ROWS; r++) {
      for (var b = 0; b < BLOCKS; b++) {
        var v = digit(board.cells, r, b);
        if (v) d[v].push('M' + (b * bw + inset).toFixed(1) + ' ' + (r * bh + inset).toFixed(1) + 'h' + w + 'v' + h + 'h-' + w + 'Z');
      }
    }
    for (var k = 1; k < paths.length; k++) paths[k].setAttribute('d', d[k].join(''));
  }
  draw();
  var planted = 0;

  return {
    interval: 145,
    poke: function (x, y) {
      var c0 = Math.floor(x / (m.width / COLUMNS)), r0 = Math.floor(y / (m.height / ROWS));
      var plant = PLANTS[planted++ % PLANTS.length], cells = board.cells;
      function at(r, c) { return ((r % ROWS) + ROWS) % ROWS * COLUMNS + ((c % COLUMNS) + COLUMNS) % COLUMNS; }
      // The patch cleared is as wide on screen as life's, so three times as many cells across.
      for (var dr = -CLEAR; dr <= CLEAR; dr++) {
        for (var dc = -CLEAR * 6; dc <= CLEAR * 6; dc++) cells[at(r0 + dr, c0 + dc)] = 0;
      }
      var top = r0 - Math.floor(plant.length / 2), left = c0 - Math.floor(plant[0].length / 2);
      plant.forEach(function (row, r) {
        for (var c = 0; c < row.length; c++) if (row[c] === 'O') cells[at(top + r, left + c)] = 1;
      });
      board.generation = 0;
      draw();
    },
    step: function () {
      var next = generation(board.cells, COLUMNS, ROWS), count = board.generation + 1;
      board = next.changed === 0 || next.live < MIN_LIVE || count >= MAX_GENERATIONS
        ? start(board.seed + count + 1)
        : { cells: next.cells, seed: board.seed, generation: count };
      draw();
    }
  };
}
