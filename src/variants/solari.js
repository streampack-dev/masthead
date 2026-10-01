/* Solari: a split-flap departures board that riffles and settles every so often, as on
   bytecode.news. It shows the deks of the front page's other posts (ui-pudl #81), as a board
   would: in capitals from a small alphabet, cut to one board. It starts blank, riffles up the
   first dek, and moves on to the next, in order, each time it riffles (ui-pudl #125). With no
   dek to show, it keeps its own lines. */
// It rests long enough to read a board, then moves on to the next dek (ui-pudl #125).
export var FRAME_MS = 58, RECYCLE_MS = 9000, FIRST_MS = 900, CYCLE = 12;
export var COLS = 26, ROWS = 5;
export var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,'?!&:/-_";
export var OWN = ['BYTECODE NEWS', 'TECHNICAL DISPATCH', 'SYSTEMS SIGNAL', 'BUILD INDEX'];

/* Text as the flaps can show it: capitals, accents dropped, quotes and dashes plain, and
   anything else a blank flap. */
export function flaps(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[‘’‚‛′“”„‟″"`]/g, "'")
    .replace(/[‐-―−]/g, '-')
    .replace(/…/g, '...')
    .toUpperCase()
    .split('').map(function (c) { return GLYPHS.indexOf(c) >= 0 ? c : ' '; }).join('')
    .replace(/\s+/g, ' ').trim();
}

/* Rows of at most COLS, broken at words, cut to one board: a last row that can't hold the
   rest ends at a word with "...". */
export function wrap(text) {
  var rows = [], row = '';
  text.split(' ').filter(Boolean).forEach(function (word) {
    word = word.slice(0, COLS);
    if (row && row.length + 1 + word.length > COLS) { rows.push(row); row = word; }
    else row = row ? row + ' ' + word : word;
  });
  if (row) rows.push(row);
  if (rows.length > ROWS) {
    rows = rows.slice(0, ROWS);
    var last = rows[ROWS - 1].split(' ');
    while (last.length > 1 && last.join(' ').length + 3 > COLS) last.pop();
    rows[ROWS - 1] = last.join(' ').slice(0, COLS - 3) + '...';
  }
  return rows;
}

/* The board's flaps for [lines], centred top to bottom. */
export function layout(lines) {
  var top = Math.floor((ROWS - lines.length) / 2), rows = [];
  for (var r = 0; r < ROWS; r++) {
    var line = lines[r - top] || '';
    var chars = [];
    for (var c = 0; c < COLS; c++) chars.push(line.charAt(c) || ' ');
    rows.push(chars);
  }
  return rows;
}

export default function solari(layer, m) {
  var deks = m.deks().map(flaps).filter(Boolean);
  // The seed picks where it starts, so ?ambientSeed=<n> replays the order too.
  var at = deks.length ? m.seed() % deks.length : 0;
  var target = layout(deks.length ? wrap(deks[at]) : OWN);
  var riffles = 0;

  var cw = m.width / (COLS + 4), ch = 34;
  var boardX = (m.width - cw * COLS) / 2, boardY = (m.height - ch * ROWS) / 2;
  var board = m.el('g', { 'class': 'masthead-solari-board', transform: 'translate(' + boardX.toFixed(1) + ' ' + boardY.toFixed(1) + ')' });
  var glyphs = target.map(function (chars, row) {
    var g = m.el('g', { transform: 'translate(0 ' + (row * ch).toFixed(1) + ')' }, board);
    return chars.map(function (settled, col) {
      var cell = m.el('g', { transform: 'translate(' + (col * cw).toFixed(1) + ' 0)' }, g);
      m.el('rect', { 'class': 'masthead-solari-cell', width: (cw - 4).toFixed(1), height: (ch - 4).toFixed(1), rx: 2 }, cell);
      m.el('path', { 'class': 'masthead-solari-hinge', d: 'M2 ' + (ch / 2 - 2).toFixed(1) + 'H' + (cw - 6).toFixed(1) }, cell);
      // Blank flaps at first: the first riffle brings up the first dek, as a board would.
      var t = m.el('text', { 'class': 'masthead-solari-glyph', x: (cw / 2 - 2).toFixed(1), y: 22, 'text-anchor': 'middle' }, cell);
      t.textContent = ' ';
      return t;
    });
  });

  /* Every flap riffles, row by row, settling from the left; frame < 0 shows the board settled. */
  function show(frame) {
    target.forEach(function (chars, row) {
      var f = Math.max(0, frame - row);
      chars.forEach(function (settled, i) {
        var settleAt = CYCLE - Math.min(6, Math.floor(i / 2));
        glyphs[row][i].textContent = frame < 0 || f >= settleAt ? settled
          : GLYPHS[(i * 13 + f * 7 + Math.floor(Math.random() * GLYPHS.length)) % GLYPHS.length];
      });
    });
  }

  var startedAt = null, cycleAt = null, lastFrame = 0, frame = -1;
  return {
    interval: FRAME_MS,
    step: function (n, now) {
      if (startedAt === null) { startedAt = now; cycleAt = now + FIRST_MS; }
      if (frame < 0) {
        if (now >= cycleAt) {
          // The first riffle settles on what the board shows; each after it, on the next dek.
          if (riffles++ > 0 && deks.length > 1) {
            at = (at + 1) % deks.length;
            target = layout(wrap(deks[at]));
          }
          frame = 0; lastFrame = now;
        }
        return;
      }
      if (now - lastFrame < FRAME_MS) return;
      lastFrame = now;
      frame += 1;
      if (frame >= CYCLE + ROWS) {
        show(-1);
        frame = -1;
        cycleAt = now + RECYCLE_MS;
        return;
      }
      show(frame);
    }
  };
}
