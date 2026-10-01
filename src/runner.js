/* Runs a masthead animation in an art SVG (art.svg, drawn by the host so the circuit shows and
   moves without script). It picks a variant at random from the circuit and the variants it's
   given (?ambient=<name> picks one; ?ambientDebug=1 logs the choice), loads only that variant,
   and runs it. It pauses while the tab is hidden or the host says so, and with
   prefers-reduced-motion the circuit stays, still.

   Hosts call startMasthead(svg, options) once the art is in the page, and stop() on the handle
   when it leaves. Nothing here knows about any framework. */
import { variants as builtIn } from './variants.js';

var NS = 'http://www.w3.org/2000/svg';
var STEP_MS = 24;
export var WIDTH = 1200;
export var HEIGHT = 320;

/* One seed for the whole run, so the label can say how to see this run again (ui-pudl #97). */
function randomSeed() { return Math.floor(Math.random() * 0x7fffffff); }

/* options, all optional:
     variants: { name: () => Promise<module with default make(layer, m)> }; the built-in ones
       by default. A host serving the files itself (with fingerprinted addresses, say) passes its
       own loaders.
     name: the variant to run; else ?ambient=<name> if it's one, else one at random.
     seed: the run's seed; else ?ambientSeed=<n>, else random.
     search: the query string read for ambient, ambientSeed and ambientDebug (location.search).
     deks: () => string[], the front page's other posts' deks, for the variants that show them.
     paused: () => boolean, true while the host covers the masthead; call update() when it
       changes. The tab being hidden pauses it as well.
     frame: the element given data-masthead="<name>" and .masthead-paused, for host CSS (the
       SVG's parent by default).
     reducedMotion: overrides prefers-reduced-motion.
     debug: overrides ?ambientDebug=1, which logs the choice and shows the label in a
       p.masthead-debug in the frame.
   Returns { name, seed, label, update(), stop() }. */
export function startMasthead(svg, options) {
  options = options || {};
  var params = new URLSearchParams(options.search !== undefined ? options.search
    : typeof location !== 'undefined' ? location.search : '');
  var debug = options.debug !== undefined ? options.debug : params.get('ambientDebug') === '1';
  function log(message, detail) {
    if (debug) console.info('[masthead] ' + message, detail === undefined ? '' : detail);
  }

  var loaders = options.variants || builtIn;
  var frameEl = options.frame || svg.parentElement || svg;
  var circuit = svg.querySelector('.masthead-circuit');
  var reduced = options.reducedMotion !== undefined ? options.reducedMotion
    : !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var names = ['circuit'].concat(Object.keys(loaders));
  var asked = options.name !== undefined ? options.name : params.get('ambient');
  var name = reduced ? 'circuit'
    : names.indexOf(asked) >= 0 ? asked
    : names[Math.floor(Math.random() * names.length)];
  var seedAsked = parseInt(params.get('ambientSeed') || '', 10);
  var seed = options.seed !== undefined ? options.seed : isFinite(seedAsked) ? seedAsked : randomSeed();
  var label = 'Animation: ' + name + (name === 'circuit' ? '' : ' · seed ' + seed);

  frameEl.setAttribute('data-masthead', name);
  svg.setAttribute('data-masthead', name);
  var title = svg.querySelector(':scope > title');
  if (!title) title = svg.insertBefore(document.createElementNS(NS, 'title'), svg.firstChild);
  title.textContent = label;
  if (debug) {
    // ?ambientDebug=1 names the run in the masthead's corner too (ui-pudl #97).
    var tag = document.createElement('p');
    tag.className = 'masthead-debug';
    tag.setAttribute('aria-hidden', 'true');
    tag.textContent = label;
    frameEl.appendChild(tag);
  }
  log(reduced ? 'reduced motion: the circuit, still' : label, { from: names });

  var handle = { name: name, seed: seed, label: label, update: function () {}, stop: function () {} };
  if (reduced) {
    // Land on a frame with every firefly on its way, and stay there.
    svg.setCurrentTime(10);
    svg.pauseAnimations();
    return handle;
  }

  var art = null;
  var layer = null;
  var frame = null;
  var step = 0;
  var last = 0;
  var stopped = false;

  function paused() { return document.hidden || !!(options.paused && options.paused()); }

  function tick(time) {
    frame = null;
    if (stopped || paused() || !art) return;
    if (!last) last = time;
    if (time - last >= (art.interval || STEP_MS)) {
      step += 1;
      last = time;
      try {
        art.step(step, time);
      } catch (e) {
        log('the variant failed; keeping the circuit', e);
        art = null;
        if (layer) layer.remove();
        if (circuit) circuit.style.display = '';
        return;
      }
    }
    frame = requestAnimationFrame(tick);
  }

  function update() {
    if (stopped) return;
    var still = paused();
    frameEl.classList.toggle('masthead-paused', still);
    if (still) {
      if (frame) cancelAnimationFrame(frame);
      frame = null;
      svg.pauseAnimations();
    } else {
      svg.unpauseAnimations();
      if (art && !frame) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    }
  }

  function start(make) {
    if (stopped) return;
    layer = document.createElementNS(NS, 'g');
    layer.setAttribute('class', 'masthead-variant masthead-' + name);
    var m = {
      width: WIDTH,
      height: HEIGHT,
      pulse: 'url(#masthead-pulse)',
      seed: function () { return seed; },
      deks: function () { return options.deks ? options.deks() : []; },
      el: function (tag, attrs, parent) {
        var e = document.createElementNS(NS, tag);
        for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
        (parent || layer).appendChild(e);
        return e;
      }
    };
    var result;
    try {
      result = make(layer, m);
    } catch (e) {
      log('the variant failed to start; keeping the circuit', e);
      return;
    }
    if (circuit) circuit.style.display = 'none';
    svg.appendChild(layer);
    art = result && typeof result.step === 'function' ? result : null;
    update();
  }

  if (name !== 'circuit') {
    loaders[name]().then(function (module) {
      var make = module && (module.default || module);
      if (typeof make === 'function') start(make);
      else log(name + ' has no default export; keeping the circuit');
    }, function (e) {
      log('could not load ' + name + '; keeping the circuit', e);
    });
  }

  document.addEventListener('visibilitychange', update);
  update();

  handle.update = update;
  handle.stop = function () {
    if (stopped) return;
    stopped = true;
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    document.removeEventListener('visibilitychange', update);
    log('stopped');
  };
  return handle;
}
