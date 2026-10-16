/* Automaton: a one-dimensional cellular automaton drawn from the top down, as in the time-space
   pictures of the books on them: each step works out the next row of a rule and draws it under
   the last, and once the masthead is full the rows scroll up. A run picks a rule from RULES, the
   elementary ones by their numbers (30's chaos, 90's nested triangles, 110's structures) and
   three-colour totalistic codes, whose second live state is the third colour. Most start from a
   single cell anywhere across, as the pictures do; now and then one starts from a random row.
   After a while a new rule takes over, starting again from a single cell. About one run in three
   reads its rows as bits, as newscience does: three cells to a block, an octal digit in one of
   eight colours. A click flips the cell under it, so a pattern grows from there. The rules,
   starts and reading come from the seed, so ?ambientSeed=<n> replays a run. */

export var COLUMNS = 200;
export var ROWS = 53;
export var RUN = 420; // rows before the next rule takes over

/* The rules: { k: colours, n: number }. k 2 is an elementary rule by its Wolfram number; k 3 a
   totalistic code, the new cell's colour the code's base-3 digit at the sum of the three above.
   Only rules that leave empty space empty: one that lights a cell with nothing around it (45 or
   73, say) flips the whole background every row, stripes across the masthead. */
export var RULES = [
  { k: 2, n: 30 }, { k: 2, n: 90 }, { k: 2, n: 110 }, { k: 2, n: 150 }, { k: 2, n: 18 }, { k: 2, n: 54 }, { k: 2, n: 60 },
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

/* Whether the run from [seed] reads its rows as bits, as newscience reads Life: about one in
   three, from a hash of the seed of its own. */
export function bits(seed) {
  var v = Math.imul((seed >>> 0) ^ 0x510e527f, 0x297a2d39) >>> 0;
  v = Math.imul(v ^ (v >>> 15), 0x85ebca6b) >>> 0;
  return (v ^ (v >>> 13)) % 3 === 0;
}

/* In a run read as bits, the colour class of each octal digit, 1 to 7, as newscience has them: a
   paint for each channel (left cell red, middle green, right blue) and its mixes, 7 the theme's. */
export var DIGIT_CLASSES = [null, 'masthead-paint-fill-7', 'masthead-paint-fill-4', 'masthead-paint-fill-6',
  'masthead-paint-fill-1', 'masthead-paint-fill-9', 'masthead-paint-fill-3', 'masthead-automaton-all'];

export default function automaton(layer, m) {
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }
  // The first draws from nearby seeds are close together; past them, the rule chosen isn't.
  rand(); rand(); rand();
  var rh = m.height / ROWS, cw = m.width / COLUMNS;
  // Read as bits, a row is three times as many cells, three to a block, and only the two-colour
  // rules are drawn (three cells of three colours would be 27 digits).
  var octal = bits(m.seed()), cells = octal ? COLUMNS * 3 : COLUMNS;
  var rules = octal ? RULES.filter(function (r) { return r.k === 2; }) : RULES;
  var colours = octal ? 7 : 2;

  // A group for each row on screen and one more, each with a path per colour drawn, reused as
  // rows scroll off the top.
  var slots = [];
  for (var s = 0; s <= ROWS; s++) {
    var g = m.el('g', { 'class': 'masthead-automaton-row' }), paths = [];
    for (var k = 0; k < colours; k++) paths.push(m.el('path', {}, g));
    slots.push({ g: g, paths: paths });
  }

  var rule, paints, row, made = 0, ruleRows = 0;
  function begin(single) {
    rule = rules[Math.floor(rand() * rules.length)];
    // Two different paints from the palette, for the live colours.
    var a = 1 + Math.floor(rand() * 9), b;
    do { b = 1 + Math.floor(rand() * 9); } while (b === a);
    paints = [a, b];
    ruleRows = 0;
    var next = new Uint8Array(cells);
    // A single cell anywhere across, or rarely a random row, which fills the masthead edge to
    // edge, heavy behind the name.
    if (single || rand() < 0.85) next[Math.floor(rand() * cells)] = 1;
    else for (var i = 0; i < cells; i++) next[i] = Math.floor(rand() * rule.k);
    return next;
  }

  function block(i) { return 'M' + (i * cw).toFixed(1) + ' 0h' + cw.toFixed(1) + 'v' + (rh + 0.5).toFixed(2) + 'h-' + cw.toFixed(1) + 'Z'; }

  function put(row) {
    var slot = slots[made % slots.length];
    var d = slot.paths.map(function () { return ''; });
    for (var i = 0; i < COLUMNS; i++) {
      var v = octal ? (row[i * 3] << 2) | (row[i * 3 + 1] << 1) | row[i * 3 + 2] : row[i];
      if (v) d[v - 1] += block(i);
    }
    slot.paths.forEach(function (p, k) {
      p.setAttribute('d', d[k]);
      p.setAttribute('class', 'masthead-automaton-cells ' + (octal ? DIGIT_CLASSES[k + 1] : 'masthead-paint-fill-' + paints[k]));
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
      var c = Math.max(0, Math.min(cells - 1, Math.floor(x / (m.width / cells))));
      row[c] = row[c] ? 0 : 1;
      made--;
      put(row);
      place();
    }
  };
}
