/* Bytecode: the Matrix's code rain, in JVM bytecode. Each column runs down through real
   instruction sequences, a byte at a time in hex, with a bright head and a fading trail; one of
   them is a class file's header, 0xCAFEBABE. Now and then an instruction is decoded beside its
   column, as a disassembler would show it. The rain is faint behind the name, and the glyphs keep
   their shape however the masthead is stretched. ?ambientSeed=<n> replays a run. */

/* Instructions as javac writes them: their bytes, and how javap would show them. */
function op(bytes, text) { return { bytes: bytes, text: text }; }

export var PROGRAMS = [
  // A class file's header: the magic number, then version 65.0 (Java 21).
  [op([0xca, 0xfe, 0xba, 0xbe], '0xCAFEBABE'), op([0x00, 0x00], 'minor_version 0'), op([0x00, 0x41], 'major_version 65')],
  // public static void main(String[] args) { System.out.println("Hello, world"); }
  [op([0xb2, 0x00, 0x07], 'getstatic #7'), op([0x12, 0x0d], 'ldc #13'), op([0xb6, 0x00, 0x0f], 'invokevirtual #15'), op([0xb1], 'return')],
  // A constructor: super().
  [op([0x2a], 'aload_0'), op([0xb7, 0x00, 0x01], 'invokespecial #1'), op([0xb1], 'return')],
  // int sum(int n) { int s = 0; for (int i = 0; i < n; i++) s += i; return s; }
  [op([0x03], 'iconst_0'), op([0x3c], 'istore_1'), op([0x03], 'iconst_0'), op([0x3d], 'istore_2'),
    op([0x1c], 'iload_2'), op([0x1a], 'iload_0'), op([0xa2, 0x00, 0x0d], 'if_icmpge +13'),
    op([0x1b], 'iload_1'), op([0x1c], 'iload_2'), op([0x60], 'iadd'), op([0x3c], 'istore_1'),
    op([0x84, 0x02, 0x01], 'iinc 2, 1'), op([0xa7, 0xff, 0xf4], 'goto -12'), op([0x1b], 'iload_1'), op([0xac], 'ireturn')],
  // A getter.
  [op([0x2a], 'aload_0'), op([0xb4, 0x00, 0x0b], 'getfield #11'), op([0xb0], 'areturn')],
  // var list = new ArrayList<>(); list.add(x);
  [op([0xbb, 0x00, 0x02], 'new #2'), op([0x59], 'dup'), op([0xb7, 0x00, 0x03], 'invokespecial #3'),
    op([0x4c], 'astore_1'), op([0x2b], 'aload_1'), op([0x2a], 'aload_0'),
    op([0xb9, 0x00, 0x04, 0x02], 'invokeinterface #4, 2'), op([0x57], 'pop'), op([0xb1], 'return')]
];

var ROWS = 16, ROW_H = 19;
var NOTE_MS = 1800;

/* The program's bytes, each with the instruction it starts, if it starts one. */
function stream(program) {
  var out = [];
  program.forEach(function (instruction) {
    instruction.bytes.forEach(function (b, i) {
      out.push({ hex: (b < 16 ? '0' : '') + b.toString(16).toUpperCase(), text: i === 0 ? instruction.text : null });
    });
  });
  return out;
}
export var STREAMS = PROGRAMS.map(stream);

/* In October, the rain also runs to 0xDEADBEEF, the hex that has marked dead memory for decades. */
export var OCTOBER = stream([op([0xde, 0xad, 0xbe, 0xef], '0xDEADBEEF'), op([0xde, 0xad, 0xbe, 0xef], '0xDEADBEEF')]);

export default function bytecode(layer, m) {
  var W = m.width, H = m.height;
  var streams = m.date && m.date().getMonth() === 9 ? STREAMS.concat([OCTOBER, OCTOBER]) : STREAMS;
  var rs = (m.seed() >>> 0) || 1;
  function rand() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; }

  // Behind the name, the rain is faint.
  function behindName(x, y) {
    var nx = (x - W / 2) / (W * 0.27), ny = (y - H / 2) / (H * 0.3);
    return nx * nx + ny * ny < 1;
  }

  var top = (H - ROWS * ROW_H) / 2 + ROW_H - 4;
  var stretch, count, spacing, columns;
  var rain = m.el('g');

  /* As many columns as fit without crowding at the masthead's shape now: a column of two hex
     digits needs about 36 units at the art's own shape, fewer as it's stretched wider. */
  function columnsFor(s) { return Math.max(14, Math.min(56, Math.round(s * 1200 / 36))); }

  function build() {
    stretch = m.stretch();
    count = columnsFor(stretch);
    spacing = W / count;
    columns = [];
    while (rain.firstChild) rain.removeChild(rain.firstChild);
    for (var c = 0; c < count; c++) column(c);
    columns.forEach(place);
    columns.forEach(fill);
  }

  function column(c) {
    var x = spacing * (c + 0.5);
    var g = m.el('g', { 'class': 'masthead-bytecode-column' }, rain);
    var cells = [];
    for (var r = 0; r < ROWS; r++) {
      var y = top + r * ROW_H;
      var t = m.el('text', { x: 0, y: y.toFixed(1), 'text-anchor': 'middle', 'class': 'masthead-bytecode-glyph', 'fill-opacity': 0 }, g);
      t.textContent = '';
      cells.push({ el: t, opacity: 0, head: false, weight: behindName(x, y) ? 0.3 : 1 });
    }
    var col = { x: x, g: g, cells: cells, head: 0, speed: 0, length: 0, wait: 0, program: 0, at: 0, last: null };
    columns.push(col);
    start(col, true);
  }
  var noteGroup = m.el('g', { 'class': 'masthead-bytecode-note', opacity: 0 });
  var noteText = m.el('text', { x: 0, y: 0 }, noteGroup);
  var note = null, nextNoteAt = null;

  function start(col, first) {
    col.speed = 0.16 + rand() * 0.3;
    col.length = 6 + Math.floor(rand() * 10);
    col.program = Math.floor(rand() * streams.length);
    col.at = Math.floor(rand() * streams[col.program].length);
    // At first the screen is already raining; later a column waits a little before its next run.
    col.head = first ? rand() * (ROWS + col.length) - col.length : -1 - rand() * 4;
    col.wait = first ? 0 : Math.floor(rand() * 30);
  }

  /* The column's next byte, running on through its program and round again. */
  function next(col) {
    var bytes = streams[col.program];
    var b = bytes[col.at];
    col.at = (col.at + 1) % bytes.length;
    if (b.text) col.last = b.text;
    return b;
  }

  function place(col) {
    col.g.setAttribute('transform', 'translate(' + col.x.toFixed(1) + ' 0) scale(' + (1 / stretch).toFixed(4) + ' 1)');
  }

  /* Fill what the column shows at first, so the rain is there from the start. */
  function fill(col) {
    for (var r = Math.max(0, Math.floor(col.head - col.length)); r <= Math.min(ROWS - 1, Math.floor(col.head)); r++) {
      col.cells[r].el.textContent = next(col).hex;
    }
    draw(col);
  }

  function draw(col) {
    var headRow = Math.floor(col.head);
    col.cells.forEach(function (cell, r) {
      var age = col.head - r;
      var opacity = age < 0 || age > col.length ? 0 : (1 - age / col.length) * cell.weight;
      opacity = Math.round(opacity * 20) / 20;
      if (opacity !== cell.opacity) { cell.el.setAttribute('fill-opacity', opacity); cell.opacity = opacity; }
      var head = r === headRow;
      if (head !== cell.head) {
        cell.el.setAttribute('class', head ? 'masthead-bytecode-glyph masthead-bytecode-head' : 'masthead-bytecode-glyph');
        cell.head = head;
      }
    });
  }

  function advance(col) {
    if (col.wait > 0) { col.wait--; return; }
    var before = Math.floor(col.head);
    col.head += col.speed;
    // Each row the head reaches takes the next byte.
    for (var r = before + 1; r <= Math.floor(col.head); r++) {
      if (r >= 0 && r < ROWS) col.cells[r].el.textContent = next(col).hex;
    }
    // Now and then a byte in the trail flickers to another.
    if (rand() < 0.04) {
      var flick = Math.floor(col.head - rand() * col.length);
      if (flick >= 0 && flick < ROWS) col.cells[flick].el.textContent = streams[Math.floor(rand() * streams.length)][0].hex;
    }
    if (col.head - col.length > ROWS) start(col, false);
  }

  /* One instruction decoded beside a column whose head is clear of the name. */
  function decode(now) {
    var tries = 0;
    while (tries++ < count) {
      var col = columns[Math.floor(rand() * count)];
      var row = Math.floor(col.head);
      if (!col.last || row < 1 || row >= ROWS - 1) continue;
      var x = col.x + spacing * 0.6, y = top + row * ROW_H;
      if (behindName(x, y) || x > W - 160) continue;
      noteText.textContent = col.last;
      note = { x: x, y: y, at: now };
      return;
    }
  }

  function showNote(now) {
    if (!note) return;
    var left = 1 - (now - note.at) / NOTE_MS;
    if (left <= 0) { note = null; noteGroup.setAttribute('opacity', 0); return; }
    noteGroup.setAttribute('opacity', left.toFixed(2));
    noteGroup.setAttribute('transform', 'translate(' + note.x.toFixed(1) + ' ' + note.y.toFixed(1) + ') scale(' + (1 / stretch).toFixed(4) + ' 1)');
  }

  build();

  return {
    interval: 60,
    step: function (n, now) {
      var s = m.stretch();
      if (columnsFor(s) !== count) build();
      else if (s !== stretch) { stretch = s; columns.forEach(place); }
      columns.forEach(function (col) { advance(col); draw(col); });
      if (nextNoteAt === null) nextNoteAt = now + 1200 + rand() * 1500;
      if (!note && now >= nextNoteAt) {
        decode(now);
        nextNoteAt = now + NOTE_MS + 1500 + rand() * 2500;
      }
      showNote(now);
    }
  };
}
