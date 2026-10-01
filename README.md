# masthead

The masthead animations for [bytecode.news](https://bytecode.news), for any front end.

**See them:** <https://streampack-dev.github.io/masthead/> runs every animation at full strength.

bytecode.news is the backend, and its front ends vary: [ui-pudl](https://github.com/streampack-dev/ui-pudl),
[ui-nextjs](https://github.com/streampack-dev/ui-nextjs) and whatever comes next. The animations
live here, written once, in plain JavaScript with no framework and no build step. Each front end
only puts the art on its page and starts the runner.

## The animations

| Name | What it is |
|---|---|
| `circuit` | Fireflies running a circuit board. It lives in `art.svg` and moves by SVG alone, so it shows without script; it's also what reduced motion gets, still. |
| `boids` | Sixteen fireflies flocking. |
| `fractal` | A branching growth tracing round the name, resting when grown, then starting again. |
| `life` | Conway's Game of Life, reseeded when it settles. |
| `signalnoise` | Faint scanlines and a rolling band, with brief bursts of interference. |
| `solari` | A split-flap board showing the front page's other deks, riffling to the next every so often. |
| `terrainflight` | Ridgelines rolling toward you from the horizon. |

On a page running them, `?ambient=<name>` picks one, `?ambientSeed=<n>` replays a run (the art's
title names the seed) and `?ambientDebug=1` logs the choice.

## Using it in a front end

1. **Get the files.** The package is `src/`. A Node front end depends on a tag:
   `"@streampack-dev/masthead": "github:streampack-dev/masthead#v0.1.1"`. A front end serving
   static files copies `src/` from a release.
2. **Put the art in the page,** inside the masthead, from `art.svg`. Rendering it on the server
   means the circuit shows before (or without) script. The art fills its container, so the host
   places it: a positioned masthead with the art behind its text.
3. **Load `masthead.css`, and give it your theme** on the masthead or any ancestor:

   ```css
   .masthead {
     --masthead-accent: var(--accent);
     --masthead-bg: var(--bg);
     --masthead-border: var(--border);
     --masthead-surface: var(--surface-alt);
     --masthead-mono: var(--mono);
     --masthead-strength: 0.55; /* faint behind the name; 1 is full */
   }
   ```

4. **Start it** once the art is in the page, and stop it when the masthead leaves:

   ```js
   import { startMasthead } from '@streampack-dev/masthead';

   const masthead = startMasthead(document.querySelector('svg.masthead-art'), {
     deks: () => [...document.querySelectorAll('.more-stories .dek')].map((p) => p.textContent),
     paused: () => drawerIsOpen(),   // optional; the hidden tab pauses it too
   });
   // when paused() would answer differently: masthead.update()
   // when the masthead leaves the page: masthead.stop()
   ```

   The runner sets `data-masthead="<name>"` on the SVG and its parent (or `frame`), and
   `.masthead-paused` while paused, for the host's own CSS. A host serving the variant files
   under its own addresses (fingerprinted, say) passes `variants: { name: () => import(url) }`.
   `src/index.d.ts` has the full options.

## Writing an animation

Add `src/variants/<name>.js` (name in a-z, 0-9 and -) and its line in `src/variants.js`:

```js
export default function name(layer, m) {
  // layer: an empty SVG <g> in the 1200 x 320 viewBox, stretched to the masthead.
  // m.width, m.height: 1200 and 320.
  // m.el(tag, attrs, parent): makes an SVG element in parent (default layer).
  // m.pulse: 'url(#masthead-pulse)', the glow fill. Classes .masthead-spark (a solid dot in the
  //   accent) and .masthead-trace (a faint line) give the theme's colours.
  // m.seed(): the run's seed, the same on every call. Take randomness from it, so a run replays.
  // m.deks(): the front page's other posts' deks, as the host gives them. Maybe none.
  // Build the elements here, once. Return { step(n, time) { ... }, interval: ms } to be called
  // every interval ms (24 by default) with the step count and the clock, moving what was built;
  // or return nothing if it's still, or animates by SVG or CSS itself.
}
```

Animations use no libraries and draw only into their layer. Colours come from the classes above
or from rules on `.masthead-<name>` in `masthead.css` using its `--_accent`, `--_bg`, `--_border`
and `--_surface`, never fixed values, so they follow each site's theme. Add tests in
`test/variants.test.js`: the fakes in `test/fake.js` run a variant without a browser.

## Working on it

```sh
npm test       # node:test, no dependencies
npm run demo   # the demo page at http://localhost:8642
```

Releases are tags, `vX.Y.Z`, with `package.json`'s version to match. A front end moves to a release
when it's ready; a change to what `m` offers or what `startMasthead` takes is a minor version
before 1.0, and front ends follow it in turn.
