import { startMasthead as start } from './runner.js';
import { variants } from './variants.js';

export { WIDTH, HEIGHT, DRAFTS, OCCASIONS, SEASONS, REFERENCE_DAYS, during, inSeason, isWindow, pick, weights } from './runner.js';
export { variants };

/* The runner, with the built-in variants unless options.variants says otherwise. */
export function startMasthead(svg, options) {
  var o = Object.assign({}, options);
  if (!o.variants) o.variants = variants;
  return start(svg, o);
}
