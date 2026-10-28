/* Corn maze: a maze of hedges at one end of the masthead that builds itself and is then solved.
   A random depth-first search carves it a cell at a time, so it's a perfect maze, one way through
   between any two cells. A walker goes in at the top left and keeps its right hand on the hedge,
   leaving a trail, until it comes out at the bottom right; then the maze fades and another grows.
   The mazes come from the seed, so ?ambientSeed=<n> replays them. A November animation. */

export var COLS = 12;
export var ROWS = 12;
export var CELL = 21;
var TOP = 34;
var MARGIN = 40;
/* Steps the walker takes to cross a cell; steps the solved maze rests, then fades. */
export var PACE = 5;
var REST = 75;
var FADE = 25;

/* A perfect maze carved by a random depth-first search: the cells in the order they're reached,
   each with the cell it was carved from (-1 for the first). Cells are numbered row by row. */
export function carve(cols, rows, rand) {
  var seen = new Array(cols * rows).fill(false), stack = [0], order = [{ cell: 0, from: -1 }];
  seen[0] = true;
  while (stack.length) {
    var i = stack[stack.length - 1], c = i % cols, r = Math.floor(i / cols), next = [];
    if (c > 0 && !seen[i - 1]) next.push(i - 1);
    if (c < cols - 1 && !seen[i + 1]) next.push(i + 1);
    if (r > 0 && !seen[i - cols]) next.push(i - cols);
    if (r < rows - 1 && !seen[i + cols]) next.push(i + cols);
    if (!next.length) { stack.pop(); continue; }
    var j = next[Math.floor(rand() * next.length)];
    seen[j] = true;
    order.push({ cell: j, from: i });
    stack.push(j);
  }
  return order;
}

/* Whether the passage between neighbouring cells [a] and [b] is open, given the carved [links]. */
function open(links, a, b) { return links[a].indexOf(b) >= 0; }

/* The cells a walker visits keeping its right hand on the hedge, from the top left (coming in
   from the left) to the bottom right. [links] lists each cell's open neighbours. */
export function follow(cols, rows, links) {
  // Headings: east, south, west, north.
  var DC = [1, 0, -1, 0], DR = [0, 1, 0, -1];
  var cell = 0, heading = 0, route = [0], end = cols * rows - 1;
  while (cell !== end && route.length < cols * rows * 4) {
    for (var turn = 1; turn >= -2; turn--) {
      var h = (heading + turn + 4) % 4, c = cell % cols + DC[h], r = Math.floor(cell / cols) + DR[h];
      if (c < 0 || r < 0 || c >= cols || r >= rows || !open(links, cell, r * cols + c)) continue;
      heading = h;
      cell = r * cols + c;
      route.push(cell);
      break;
    }
  }
  return route;
}

export default function cornmaze(layer, m) {
  var W = m.width;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  // A small seed's first draw is always about 0.24, so it's thrown away.
  rand();

  var left = rand() < 0.5;
  var g = m.el('g', { 'class': 'masthead-cornmaze' });
  var hedges = m.el('path', { 'class': 'masthead-cornmaze-hedge' }, g);
  var trail = m.el('path', { 'class': 'masthead-cornmaze-trail' }, g);
  var head = m.el('circle', { 'class': 'masthead-cornmaze-walker', r: 4 }, g);
  var x0 = left ? 0 : -COLS * CELL;
  var maze;

  function centre(i) { return [x0 + (i % COLS + 0.5) * CELL, TOP + (Math.floor(i / COLS) + 0.5) * CELL]; }

  function begin(n) {
    var links = [];
    for (var i = 0; i < COLS * ROWS; i++) links.push([]);
    maze = { order: carve(COLS, ROWS, rand), links: links, carved: 0, route: null, walked: 0, start: n, done: -1 };
    trail.setAttribute('d', '');
    g.setAttribute('opacity', 1);
    draw();
  }

  /* Every hedge still standing: the border, open at the way in and the way out, and the walls
     between cells that aren't linked yet. */
  function draw() {
    var d = 'M' + x0 + ' ' + (TOP + CELL) + 'V' + (TOP + ROWS * CELL) + 'H' + (x0 + COLS * CELL) + 'V' + (TOP + (ROWS - 1) * CELL) +
      'M' + x0 + ' ' + TOP + 'H' + (x0 + COLS * CELL) + 'V' + (TOP + (ROWS - 1) * CELL);
    for (var i = 0; i < COLS * ROWS; i++) {
      var c = i % COLS, r = Math.floor(i / COLS), x = x0 + c * CELL, y = TOP + r * CELL;
      if (c < COLS - 1 && !open(maze.links, i, i + 1)) d += 'M' + (x + CELL) + ' ' + y + 'v' + CELL;
      if (r < ROWS - 1 && !open(maze.links, i, i + COLS)) d += 'M' + x + ' ' + (y + CELL) + 'h' + CELL;
    }
    hedges.setAttribute('d', d);
  }

  function place(n) {
    var squeeze = 1 / m.stretch();
    g.setAttribute('transform', 'translate(' + (left ? MARGIN : W - MARGIN) + ' 0) scale(' + squeeze.toFixed(4) + ' 1)');
    var at;
    if (maze.carved < maze.order.length) {
      at = centre(maze.order[Math.max(0, maze.carved - 1)].cell);
    } else if (maze.route) {
      // Between two cells of the route, eased, and the trail drawn up to here.
      var k = Math.min(maze.route.length - 1, Math.floor(maze.walked / PACE)), u = (maze.walked % PACE) / PACE;
      var a = centre(maze.route[k]), b = centre(maze.route[Math.min(k + 1, maze.route.length - 1)]);
      at = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
      trail.setAttribute('d', 'M' + (x0 - CELL / 2) + ' ' + (TOP + CELL / 2) + maze.route.slice(0, k + 1).map(function (i) { var p = centre(i); return 'L' + p[0] + ' ' + p[1]; }).join('') + 'L' + at[0].toFixed(1) + ' ' + at[1].toFixed(1));
    }
    head.setAttribute('cx', at[0].toFixed(1));
    head.setAttribute('cy', at[1].toFixed(1));
  }

  begin(0);
  place(0);

  return {
    interval: 40,
    step: function (n) {
      if (maze.carved < maze.order.length) {
        var o = maze.order[maze.carved++];
        if (o.from >= 0) { maze.links[o.from].push(o.cell); maze.links[o.cell].push(o.from); draw(); }
        if (maze.carved === maze.order.length) maze.route = follow(COLS, ROWS, maze.links);
      } else if (maze.walked < (maze.route.length - 1) * PACE) {
        maze.walked += 1;
      } else {
        if (maze.done < 0) maze.done = n;
        var t = n - maze.done - REST;
        if (t >= FADE) { begin(n); }
        else if (t > 0) g.setAttribute('opacity', (1 - t / FADE).toFixed(2));
      }
      place(n);
    }
  };
}
