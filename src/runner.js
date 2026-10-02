/* Runs a masthead animation in an art SVG (art.svg, drawn blank by the host). It picks a variant
   at random from those it's given (?ambient=<name> picks one; ?ambientDebug=1 logs the choice),
   loads only that one, and runs it, so the masthead stays blank until the chosen animation is
   ready and nothing is swapped out. It pauses while the tab is hidden or the host says so. With
   prefers-reduced-motion, or if the variant fails, the masthead stays blank. A variant that
   returns poke() is handed clicks on the masthead, for a fragment of its own.

   Hosts call startMasthead(svg, options) once the art is in the page, and stop() on the handle
   when it leaves. Nothing here knows about any framework.

   This file imports nothing, so a host serving it at a cached (fingerprinted) address loads it in
   one request. index.js's startMasthead is this with the built-in variants as the default; a
   host importing this file directly passes its own. */

var NS = 'http://www.w3.org/2000/svg';
var STEP_MS = 24;
export var WIDTH = 1200;
export var HEIGHT = 320;

/* The seasonal animations, and the months (1 to 12) they're picked in, in the visitor's own
   time. Out of season they aren't picked at random, but ?ambient=<name> still runs one. An
   animation not listed runs all year. */
export var SEASONS = {
  bats: [10],
  eyes: [10],
  ghosts: [10],
  graveyard: [10],
  pumpkins: [10],
  spider: [10]
};

/* The animations [names] that may be picked at random on [date]. */
export function inSeason(names, date) {
  var month = date.getMonth() + 1;
  return names.filter(function (name) { return !SEASONS[name] || SEASONS[name].indexOf(month) >= 0; });
}

/* ?ambientDate=YYYY-MM-DD, as a local date, or null. */
function dateAsked(value) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null;
}

/* One seed for the whole run, so the label can say how to see this run again (ui-pudl #97). */
function randomSeed() { return Math.floor(Math.random() * 0x7fffffff); }

/* options, all optional:
     variants: { name: () => Promise<module with default make(layer, m)> }. index.js gives the
       built-in ones by default; a host serving the files itself (with fingerprinted addresses,
       say) passes its own loaders. With none, the masthead stays blank.
     name: the variant to run; else ?ambient=<name> if it's one, else one at random.
     seed: the run's seed; else ?ambientSeed=<n>, else random.
     date: the day to pick for (seasonal animations); else ?ambientDate=YYYY-MM-DD, else today.
     search: the query string read for ambient, ambientSeed and ambientDebug (location.search).
     deks: () => string[], the front page's other posts' deks, for the variants that show them.
     paused: () => boolean, true while the host covers the masthead; call update() when it
       changes. The tab being hidden pauses it as well.
     frame: the element given data-masthead="<name>" and .masthead-paused, for host CSS (the
       SVG's parent by default).
     reducedMotion: overrides prefers-reduced-motion.
     poke: false keeps clicks on the masthead from reaching the variant (a masthead that is a
       link home, say). Clicks on links, buttons and form controls in it never do.
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

  var loaders = options.variants || {};
  var frameEl = options.frame || svg.parentElement || svg;
  var reduced = options.reducedMotion !== undefined ? options.reducedMotion
    : !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var all = Object.keys(loaders);
  var date = options.date || dateAsked(params.get('ambientDate')) || new Date();
  // Any animation can be asked for by name; a random pick is from those in season.
  var names = inSeason(all, date);
  var asked = options.name !== undefined ? options.name : params.get('ambient');
  var name = reduced || all.length === 0 ? 'none'
    : all.indexOf(asked) >= 0 ? asked
    : names.length ? names[Math.floor(Math.random() * names.length)] : 'none';
  var seedAsked = parseInt(params.get('ambientSeed') || '', 10);
  var seed = options.seed !== undefined ? options.seed : isFinite(seedAsked) ? seedAsked : randomSeed();
  var label = name === 'none' ? 'Animation: none' : 'Animation: ' + name + ' · seed ' + seed;

  // The glow the variants fill with (m.pulse). art.svg has it; a host drawing its own empty SVG
  // needn't.
  if (!svg.querySelector('#masthead-pulse')) {
    var defs = svg.appendChild(document.createElementNS(NS, 'defs'));
    var pulse = defs.appendChild(document.createElementNS(NS, 'radialGradient'));
    pulse.setAttribute('id', 'masthead-pulse');
    pulse.setAttribute('r', '70%');
    [['0%', '0.95'], ['38%', '0.42'], ['100%', '0']].forEach(function (s) {
      var stop = pulse.appendChild(document.createElementNS(NS, 'stop'));
      stop.setAttribute('offset', s[0]);
      stop.setAttribute('class', 'masthead-glow');
      stop.setAttribute('stop-opacity', s[1]);
    });
  }

  frameEl.setAttribute('data-masthead', name);
  svg.setAttribute('data-masthead', name);
  // No <title>: the art is decorative (aria-hidden), and a tooltip naming the run and its seed is
  // for whoever is debugging it, which ?ambientDebug=1 is for. One an earlier run left is removed.
  var title = svg.querySelector(':scope > title');
  if (title) svg.removeChild(title);
  if (debug) {
    // ?ambientDebug=1 names the run in the masthead's corner too (ui-pudl #97).
    var tag = document.createElement('p');
    tag.className = 'masthead-debug';
    tag.setAttribute('aria-hidden', 'true');
    tag.textContent = label;
    frameEl.appendChild(tag);
  }
  log(reduced ? 'reduced motion: none' : label, { from: names });

  var handle = { name: name, seed: seed, label: label, update: function () {}, stop: function () {} };
  if (name === 'none') return handle;

  var art = null;
  var layer = null;
  var frame = null;
  var step = 0;
  var last = 0;
  var stopped = false;

  /* How many times wider than tall one unit of the art is drawn: 1 at the art's own 1200 x 320,
     more on a wide, short masthead. Kept current as the masthead is resized. */
  var stretch = 1;
  function measure() {
    var box = svg.getBoundingClientRect();
    if (box.width > 0 && box.height > 0) stretch = (box.width / WIDTH) / (box.height / HEIGHT);
  }
  measure();
  var resizes = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
  if (resizes) resizes.observe(svg);

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
        log('the variant failed; leaving the masthead blank', e);
        art = null;
        if (layer) layer.remove();
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
      stretch: function () { return stretch; },
      date: function () { return new Date(date.getTime()); },
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
      log('the variant failed to start; leaving the masthead blank', e);
      return;
    }
    svg.appendChild(layer);
    art = result && typeof result.step === 'function' ? result : null;
    if (art && typeof art.poke === 'function' && options.poke !== false) {
      frameEl.setAttribute('data-masthead-poke', '');
      frameEl.addEventListener('click', poke);
    }
    update();
  }

  /* A click on the masthead, in the art's 1200 x 320, handed to the variant's poke(x, y, n,
     time). Clicks meant for something else (a link or control in the masthead, a right click,
     the end of a text selection, one outside the art) and clicks while paused are left alone.
     A poke that throws is logged and the animation carries on. */
  function poke(e) {
    if (stopped || !art || paused() || (e.button !== undefined && e.button !== 0)) return;
    if (e.target && e.target.closest && e.target.closest('a, button, input, select, textarea, label, summary, [role="button"], [role="link"]')) return;
    var selection = window.getSelection && window.getSelection();
    if (selection && !selection.isCollapsed) return;
    var box = svg.getBoundingClientRect();
    if (!(box.width > 0 && box.height > 0)) return;
    var x = (e.clientX - box.left) / box.width * WIDTH;
    var y = (e.clientY - box.top) / box.height * HEIGHT;
    if (x < 0 || y < 0 || x > WIDTH || y > HEIGHT) return;
    try {
      art.poke(x, y, step, performance.now());
    } catch (err) {
      log('the variant failed to take a poke', err);
    }
  }

  loaders[name]().then(function (module) {
    var make = module && (module.default || module);
    if (typeof make === 'function') start(make);
    else log(name + ' has no default export; leaving the masthead blank');
  }, function (e) {
    log('could not load ' + name + '; leaving the masthead blank', e);
  });

  document.addEventListener('visibilitychange', update);
  update();

  handle.update = update;
  handle.stop = function () {
    if (stopped) return;
    stopped = true;
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    document.removeEventListener('visibilitychange', update);
    frameEl.removeEventListener('click', poke);
    frameEl.removeAttribute('data-masthead-poke');
    if (resizes) resizes.disconnect();
    log('stopped');
  };
  return handle;
}
