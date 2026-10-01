/* The specimen page: every variant, each in a masthead-shaped stage, paused while off screen. */
import { startMasthead, variants } from '../src/index.js';

var BLURBS = {
  circuit: 'Fireflies running the traces of a circuit board.',
  boids: 'Sixteen fireflies flocking.',
  bytecode: 'The code rain in JVM bytecode: real instructions in hex, now and then one decoded.',
  fractal: 'A branching growth tracing round the name, resting when grown, then starting again.',
  life: "Conway's Game of Life, reseeded when it settles.",
  signalnoise: 'Faint scanlines and a rolling band, with brief bursts of interference.',
  solari: "A split-flap board showing the front page's deks, riffling to the next every so often.",
  terrainflight: 'Ridgelines rolling toward you from the horizon.'
};

/* What a front page's other posts might say, for Solari. */
var DEKS = [
  'Virtual threads, one year on: what changed in the services that adopted them',
  'A gentle introduction to property-based testing',
  'Why your build is slow, and the three flags that fix most of it',
  'Café crème and the Unicode normalization forms'
];

var page = document.documentElement;
var body = document.body;
var reducedAsked = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
var playAnyway = false;

function read(key) { try { return localStorage.getItem('masthead-demo-' + key); } catch (e) { return null; } }
function keep(key, value) { try { localStorage.setItem('masthead-demo-' + key, value); } catch (e) { /* fine */ } }

/* Theme, strength, accent and the name, remembered per viewer. */
var theme = document.getElementById('theme');
var strength = document.getElementById('strength');
var strengthOut = document.getElementById('strength-out');
var accent = document.getElementById('accent');
var withText = document.getElementById('text');
var shape = document.getElementById('shape');

function applyTheme() {
  if (theme.value === 'auto') page.removeAttribute('data-theme');
  else page.setAttribute('data-theme', theme.value);
  if (!read('accent')) accent.value = toHex(getComputedStyle(body).getPropertyValue('--accent').trim());
}
function applyStrength() {
  body.style.setProperty('--masthead-strength', strength.value);
  strengthOut.textContent = Number(strength.value).toFixed(2);
}
function toHex(color) {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : '#a8401c';
}

theme.value = read('theme') || 'auto';
strength.value = read('strength') || '1';
withText.checked = read('text') === '1';
shape.value = read('shape') || 'art';
body.classList.toggle('site-shape', shape.value === 'site');
body.classList.toggle('with-text', withText.checked);
if (read('accent')) {
  accent.value = read('accent');
  body.style.setProperty('--accent-picked', accent.value);
}
applyTheme();
applyStrength();

theme.addEventListener('change', function () { keep('theme', theme.value); applyTheme(); });
strength.addEventListener('input', function () { keep('strength', strength.value); applyStrength(); });
accent.addEventListener('input', function () {
  keep('accent', accent.value);
  body.style.setProperty('--accent-picked', accent.value);
});
shape.addEventListener('change', function () {
  keep('shape', shape.value);
  body.classList.toggle('site-shape', shape.value === 'site');
});
withText.addEventListener('change', function () {
  keep('text', withText.checked ? '1' : '');
  body.classList.toggle('with-text', withText.checked);
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

/* The specimens. */
var main = document.getElementById('specimens');
var specimens = [];
var today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

function specimen(name, art) {
  var figure = document.createElement('figure');
  figure.className = 'specimen';
  figure.id = name;
  figure.innerHTML =
    '<figcaption class="specimen-head"><div><h2></h2><p class="specimen-blurb"></p></div>' +
    '<div class="specimen-tools"><span class="specimen-seed"></span>' +
    '<button type="button" data-act="replay">Replay</button><button type="button" data-act="seed">New seed</button>' +
    '</div></figcaption>' +
    '<div class="stage"><div class="stage-text"><p class="stage-date"></p>' +
    '<p class="stage-name">bytecode<span>.</span>news</p>' +
    '<p class="stage-tagline">Programming News &amp; Technical Writing</p></div></div>';
  figure.querySelector('h2').textContent = name;
  figure.querySelector('.specimen-blurb').textContent = BLURBS[name] || '';
  figure.querySelector('.stage-date').textContent = today;
  main.appendChild(figure);

  var stage = figure.querySelector('.stage');
  var seedLabel = figure.querySelector('.specimen-seed');
  var s = { name: name, stage: stage, visible: false, handle: null, seed: undefined };

  s.start = function (seed) {
    if (s.handle) s.handle.stop();
    var old = stage.querySelector('svg');
    if (old) old.remove();
    stage.insertAdjacentHTML('afterbegin', art);
    s.handle = startMasthead(stage.querySelector('svg'), {
      name: name,
      seed: seed,
      deks: function () { return DEKS; },
      paused: function () { return !s.visible; },
      reducedMotion: reducedAsked && !playAnyway
    });
    s.seed = s.handle.seed;
    seedLabel.textContent = 'seed ' + s.seed;
  };

  figure.addEventListener('click', function (e) {
    var act = e.target.getAttribute && e.target.getAttribute('data-act');
    if (act === 'replay') s.start(s.seed);
    if (act === 'seed') s.start(Math.floor(Math.random() * 0x7fffffff));
  });
  specimens.push(s);
  return s;
}

/* Animations off screen rest, so a long page doesn't run seven at once. */
var watcher = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    var s = specimens.find(function (x) { return x.stage === entry.target; });
    if (!s) return;
    s.visible = entry.isIntersecting;
    if (s.handle) s.handle.update();
  });
}, { rootMargin: '64px' });

if (reducedAsked) {
  var notice = document.getElementById('reduced');
  notice.hidden = false;
  document.getElementById('play-anyway').addEventListener('click', function () {
    playAnyway = true;
    notice.hidden = true;
    specimens.forEach(function (s) { s.start(s.seed); });
  });
}

fetch(new URL('../src/art.svg', import.meta.url))
  .then(function (r) { return r.text(); })
  .then(function (art) {
    Object.keys(variants).forEach(function (name) {
      var s = specimen(name, art);
      watcher.observe(s.stage);
      s.start();
    });
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  });
