/* Circuit: fireflies running the traces of a circuit board, as on bytecode.news. It moves by SVG
   alone, so it returns no step; pausing the art pauses it. */
var TRACES = [
  'M60 248H216V172H394V126H598V84H856V126H1108',
  'M128 84H332V152H518V210H698V178H902V214H1090',
  'M184 274H308V226H468V266H682V214H874V250H1038',
  'M92 154H246V110H430V154H650V118H842V152H1044',
  'M758 62V252',
  'M468 126V266',
  'M902 126V250',
  'M246 110V248',
  'M1038 214V250'
];
var NODES = [
  [216, 172], [394, 126], [598, 84], [856, 126], [332, 152], [518, 210],
  [698, 178], [902, 214], [308, 226], [468, 266], [682, 214], [874, 250]
];
/* A firefly per long trace: its glow, its spark, and how long one run takes. Each starts part way
   along (a negative begin), so none waits in the corner for its turn. */
var FIREFLIES = [
  { trace: 0, glow: 8.4, spark: 2.2, begin: 0, dur: 14 },
  { trace: 1, glow: 7.2, spark: 1.9, begin: -2.5, dur: 18 },
  { trace: 2, glow: 6.8, spark: 1.8, begin: -5, dur: 16 },
  { trace: 3, glow: 6.5, spark: 1.7, begin: -7.5, dur: 20 }
];

export default function circuit(layer, m) {
  // The traces fade out toward both ends.
  var defs = m.el('defs');
  var fade = m.el('linearGradient', { id: 'masthead-fade', x1: '0%', y1: '0%', x2: '100%', y2: '0%' }, defs);
  [[0, 0], [18, 0.65], [82, 0.65], [100, 0]].forEach(function (stop) {
    m.el('stop', { offset: stop[0] + '%', 'stop-color': 'currentColor', 'stop-opacity': stop[1] }, fade);
  });

  var traces = m.el('g', { 'class': 'masthead-circuit-traces' });
  TRACES.forEach(function (d) { m.el('path', { d: d }, traces); });
  var nodes = m.el('g', { 'class': 'masthead-circuit-nodes' });
  NODES.forEach(function (n) { m.el('circle', { cx: n[0], cy: n[1], r: 3.2 }, nodes); });
  var fireflies = m.el('g', { 'class': 'masthead-circuit-fireflies' });
  FIREFLIES.forEach(function (f) {
    var g = m.el('g', {}, fireflies);
    m.el('circle', { r: f.glow, fill: m.pulse }, g);
    m.el('circle', { r: f.spark, 'class': 'masthead-spark' }, g);
    m.el('animateMotion', {
      begin: f.begin + 's',
      dur: f.dur + 's',
      repeatCount: 'indefinite',
      path: TRACES[f.trace]
    }, g);
  });
}
