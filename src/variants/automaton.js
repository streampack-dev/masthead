/* Automaton: a one-dimensional cellular automaton drawn from the top down, as in the time-space
   pictures of the books on them: each step works out the next row of a rule and draws it under
   the last, and once the masthead is full the rows scroll up. A run picks a rule from RULES, the
   elementary ones by their numbers (30's chaos, 90's nested triangles, 110's structures) and
   three-colour totalistic codes, whose second live state is the third colour. Most start from a
   single cell, as the pictures do; now and then one starts from a random row. After a while a new
   rule takes over, starting again from a single cell. A click flips the cell at that column,
   so a pattern grows from there. The rules and starts come from the seed, so ?ambientSeed=<n>
   replays a run. */

export var COLUMNS = 200;
export var ROWS = 53;
export var RUN = 420; // rows before the next rule takes over

/* The rules: { k: colours, n: number }. k 2 is an elementary rule by its Wolfram number; k 3 a
   totalistic code, the new cell's colour the code's base-3 digit at the sum of the three above. */
export var RULES = [
  { k: 2, n: 30 }, { k: 2, n: 90 }, { k: 2, n: 110 }, { k: 2, n: 150 }, { k: 2, n: 45 }, { k: 2, n: 73 },
  { k: 3, n: 1599 }, { k: 3, n: 1635 }
];

/* The row after [row] under [rule], the ends wrapping round. */
export function nextRow(row, rule) {
  var n = row.length, out = new Uint8Array(n);
  for (var i = 0; i < n; i++) {
    var l = row[(i + n - 1) % n], c = row[i], r = row[(i + 1) % n];
    out[i] = rule.k === 2
      ? (rule.n >> ((l << 2) | (c << 1) | r)) & 1
      : Math.floor(rule.n / Math.pow(3, l + c + r)) % 3;
  }
  return out;
}

export default function automaton(layer, m) {
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  // The first draws from nearby seeds are close together; past them, the rule chosen isn't.
  rand(); rand(); rand();
  var rh = m.height / ROWS, cw = m.width / COLUMNS;

  // A group for each row on screen and one more, each with a path per live colour, reused as rows
  // scroll off the top.
  var slots = [];
  for (var s = 0; s <= ROWS; s++) {
    var g = m.el('g', { 'class': 'masthead-automaton-row' });
    slots.push({ g: g, paths: [m.el('path', {}, g), m.el('path', {}, g)] });
  }

  var rule, paints, row, made = 0, ruleRows = 0;
  function begin(single) {
    rule = RULES[Math.floor(rand() * RULES.length)];
    // Two different paints from the palette, for the live colours.
    var a = 1 + Math.floor(rand() * 9), b;
    do { b = 1 + Math.floor(rand() * 9); } while (b === a);
    paints = [a, b];
    ruleRows = 0;
    var next = new Uint8Array(COLUMNS);
    // A random row fills the masthead edge to edge, heavy behind the name, so it's the rare start.
    if (single || rand() < 0.85) next[COLUMNS >> 1] = 1;
    else for (var i = 0; i < COLUMNS; i++) next[i] = Math.floor(rand() * rule.k);
    return next;
  }

  function put(cells) {
    var slot = slots[made % slots.length];
    var d = ['', ''];
    for (var i = 0; i < COLUMNS; i++) {
      if (cells[i]) d[cells[i] - 1] += 'M' + (i * cw).toFixed(1) + ' 0h' + cw.toFixed(1) + 'v' + (rh + 0.5).toFixed(2) + 'h-' + cw.toFixed(1) + 'Z';
    }
    slot.paths.forEach(function (p, k) {
      p.setAttribute('d', d[k]);
      p.setAttribute('class', 'masthead-automaton-cells masthead-paint-fill-' + paints[k]);
    });
    made++;
  }

  // Rows sit from the top, each drawn half a unit into the next so no seam shows between them;
  // once there are more than fit, the newest is at the foot.
  function place() {
    var first = Math.max(0, made - ROWS);
    for (var n = Math.max(0, made - slots.length); n < made; n++) {
      slots[n % slots.length].g.setAttribute('transform', 'translate(0 ' + ((n - first) * rh).toFixed(2) + ')');
    }
  }

  row = begin(false);
  put(row);
  place();

  return {
    interval: 150,
    step: function () {
      ruleRows++;
      var next = nextRow(row, rule);
      // A row that has died out, or a rule that has run its time, hands on to a new one.
      var empty = next.every(function (v) { return v === 0; });
      if (empty || ruleRows >= RUN) next = begin(true);
      row = next;
      put(row);
      place();
    },
    poke: function (x) {
      var c = Math.max(0, Math.min(COLUMNS - 1, Math.floor(x / cw)));
      row[c] = row[c] ? 0 : 1;
      made--;
      put(row);
      place();
    }
  };
}
