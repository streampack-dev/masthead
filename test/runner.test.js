import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { element } from './fake.js';
import { startMasthead } from '../src/runner.js';

/* Just enough of a browser for startMasthead: an svg without the SMIL pause API, as in some
   newer engines, and a requestAnimationFrame that counts its calls. */
function browser() {
  const saved = {};
  const page = { frames: 0 };
  const globals = {
    document: {
      hidden: false,
      createElementNS: (ns, tag) => element(tag),
      createElement: (tag) => element(tag),
      addEventListener() {},
      removeEventListener() {}
    },
    window: {},
    requestAnimationFrame: () => ++page.frames,
    cancelAnimationFrame() {}
  };
  for (const k in globals) {
    saved[k] = Object.getOwnPropertyDescriptor(globalThis, k);
    Object.defineProperty(globalThis, k, { value: globals[k], configurable: true, writable: true });
  }
  page.restore = () => {
    for (const k in saved) {
      if (saved[k]) Object.defineProperty(globalThis, k, saved[k]);
      else delete globalThis[k];
    }
  };
  return page;
}

function svgWithoutSmil() {
  const svg = element('svg');
  svg.querySelector = () => null;
  svg.getBoundingClientRect = () => ({ width: 1200, height: 320, left: 0, top: 0 });
  svg.parentElement = element('div');
  svg.parentElement.classList = { toggle() {} };
  return svg;
}

describe('a browser without SVG pauseAnimations', () => {
  let page;
  beforeEach(() => { page = browser(); });
  afterEach(() => page.restore());

  for (const paused of [false, true]) {
    it(`starts the masthead ${paused ? 'paused' : 'running'}`, async () => {
      const handle = startMasthead(svgWithoutSmil(), {
        search: '',
        name: 'x',
        seed: 1,
        reducedMotion: false,
        paused: () => paused,
        variants: { x: () => Promise.resolve({ default: () => ({ step() {} }) }) }
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.equal(page.frames, paused ? 0 : 1);
      handle.stop();
    });
  }
});
