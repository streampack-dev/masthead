/* Life: Conway's Game of Life across the masthead, reseeded when it settles, as on bytecode.news.
   ?ambientSeed=<n> replays a board. */
export default function life(layer, m) {
  var COLUMNS = 200, ROWS = 53, DENSITY = 0.28, MIN_LIVE = 80, MAX_GENERATIONS = 520;
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
  var life = start(m.seed());
  var path = m.el('path', { 'class': 'masthead-life-cells' });

  function draw() {
    var cw = m.width / COLUMNS, ch = m.height / ROWS;
    var inset = Math.min(cw, ch) * 0.16, mw = (cw - inset * 2).toFixed(1), mh = (ch - inset * 2).toFixed(1);
    var d = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLUMNS; c++) {
        if (life.cells[r * COLUMNS + c]) {
          d.push('M' + (c * cw + inset).toFixed(1) + ' ' + (r * ch + inset).toFixed(1) + 'h' + mw + 'v' + mh + 'h-' + mw + 'Z');
        }
      }
    }
    path.setAttribute('d', d.join(''));
  }
  draw();

  return {
    interval: 145,
    step: function () {
      var cells = life.cells, next = new Uint8Array(cells.length), changed = 0, live = 0;
      for (var r = 0; r < ROWS; r++) {
        var up = r === 0 ? ROWS - 1 : r - 1, down = r === ROWS - 1 ? 0 : r + 1;
        for (var c = 0; c < COLUMNS; c++) {
          var left = c === 0 ? COLUMNS - 1 : c - 1, right = c === COLUMNS - 1 ? 0 : c + 1, i = r * COLUMNS + c;
          var n = cells[up * COLUMNS + left] + cells[up * COLUMNS + c] + cells[up * COLUMNS + right]
            + cells[r * COLUMNS + left] + cells[r * COLUMNS + right]
            + cells[down * COLUMNS + left] + cells[down * COLUMNS + c] + cells[down * COLUMNS + right];
          var alive = cells[i] === 1, lives = n === 3 || (alive && n === 2);
          if (lives) { next[i] = 1; live++; }
          if (lives !== alive) changed++;
        }
      }
      var generation = life.generation + 1;
      life = changed === 0 || live < MIN_LIVE || generation >= MAX_GENERATIONS
        ? start(life.seed + generation + 1)
        : { cells: next, seed: life.seed, generation: generation };
      draw();
    }
  };
}
