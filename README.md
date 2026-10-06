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
| `bats` | October: bats flapping across in loose, wavering flight, now and then a little flock. |
| `blockpeek` | Draft. Someone on the far side breaking a block to peer through at you, in the blocky style of the block-building games; a faint patch of wall shows around it. |
| `boids` | Sixteen fireflies flocking. |
| `bytecode` | The code rain in JVM bytecode: real instructions in hex, now and then one decoded. |
| `chase` | A fast bird and a canine forever after it along the foot of the masthead: skids, a smack into the frame's edge, an anvil, the train. It always pops back up. |
| `circuit` | Fireflies running the traces of a circuit board, moving by SVG alone. |
| `citydefense` | Missile defense playing itself, slowly: trails from above, counter-missiles bursting into rings, cities falling and rebuilt. |
| `deadline` | A writer at a desk on the left, in the jerky style of cutout animation: frantic typing, thinking, coffee, and now and then a head on the keyboard. |
| `duel` | Two fencers along the foot of the masthead, lunging, parrying and giving ground, back and forth: no touches, no winner. |
| `eyes` | October: eyes in the dark, opening, blinking, glancing about, and closing again. |
| `flowfield` | Draft. A slow current drifting across the masthead, like wind over water: faint strokes turning with it, a few motes riding it with short tails, livelier low. |
| `flyby` | A flight in through the solar system, like Voyager 1 in reverse: orbits and planets (far from scale) sweeping past on the way to the sun, then round again. |
| `football` | Draft. Football season: a player in pads running a play: a pass, caught or dropped (hands to the helmet), or a run with a hurdle over a diving defender. |
| `fractal` | A branching growth tracing round the name, resting when grown, then starting again. |
| `ghostrider` | A wireframe road ahead at a slow cruise, bending and rising gently, hills sliding aside on the bends. For Neil Peart. |
| `ghosts` | October: friendly sheet ghosts drifting and bobbing; now and then one peeks up from below. |
| `grass` | A field of grass along the foot of the masthead, the wind moving through it. |
| `graveyard` | October: a moon with clouds passing, headstones and bare trees, fog, a bat crossing the moon. |
| `lander` | A lunar lander flown by its autopilot: a slow descent, short burns, a gentle landing on the pad. |
| `life` | Conway's Game of Life, reseeded when it settles. |
| `paddles` | Two paddles and a ball, playing itself at an easy pace, scores ticking up to eleven. |
| `pongwars` | Two sides of a field of squares and a ball each, every square a ball touches coming over to its side; the border wanders forever. |
| `pumpkins` | October: a row of jack-o'-lanterns, their candles flickering. |
| `rocks` | Rocks drifting and turning; a small ship turns, fires, and splits them. |
| `ships` | Draft. Ships gliding across a low sea in outline: a liner trailing smoke, an aircraft carrier, a tall ship under sail, a sailboat bobbing. |
| `signalnoise` | Faint scanlines and a rolling band, with brief bursts of interference. |
| `solari` | A split-flap board showing the front page's other deks, riffling to the next every so often. |
| `spider` | October: a spider letting itself down on its thread and climbing back up; a cobweb in a corner. |
| `stix` | The C64 claim-the-field game playing itself: a marker cuts into the field, claiming the side without the wandering Stix, hatched. |
| `terrainflight` | Ridgelines rolling toward you from the horizon. |
| `train` | An ASCII-art train running along a track at the foot of the masthead, trailing smoke. |
| `triangles` | Draft. A low-poly mesh, breathing: its points drift on small orbits, and now and then a triangle or a few fill faintly and fade. |
| `truchet` | Draft. Truchet tiles: quarter-circle arcs winding paths across the masthead, one tile at a time easing round a quarter turn and rewiring them; now and then a glow runs along a path. |
| `water` | A still surface seen from just above; drops land and their rings spread and cross. |
| `windfarm` | Turbines along low hills, each turning at its own pace in a wind that rises and falls. |

Some are seasonal: they're picked at random only in their windows of the year (in the visitor's
own time), as `SEASONS` in `src/runner.js` lists them; the October ones above, for now. A window
is a month (`10`), a day every year (`'07-04'`), days every year (`'12-24..12-26'`, which may wrap
the year end), one dated day or range (`'2026-12-04..2026-12-12'`, for a feast that moves: list
the coming years), or a named occasion from `OCCASIONS` (`'halloween'`), so an occasion's dates
are written once. Variants can ask about an occasion too, with `m.during('halloween')`.

Animations listed in `DRAFTS` (`blockpeek`, `football`, `ships` and `triangles`, for now) are never picked at
Animations listed in `DRAFTS` (`blockpeek`, `flowfield`, `football` and `ships`, for now) are never picked at
random: they're still being worked on, and run only by name and on the demo page.
Animations listed in `DRAFTS` (`blockpeek`, `football`, `ships` and `truchet`, for now) are never
picked at random: they're still being worked on, and run only by name and on the demo page.

Animations that run all year weigh 1 when one is picked at random. A seasonal one weighs more the
shorter its window, so a short occasion is seen while it lasts: a month or longer weighs 1, a
week about 4, a single day 30 (`REFERENCE_DAYS` over the window's days). Where several of an
animation's windows are open, the shortest decides, so a lead-up window and the day itself build
to the day. A window may give its own weight instead, `{ when: '07-04', weight: 50 }`. Any
animation can still be asked for by name, and the demo page shows them all year.

On a page running them, `?ambient=<name>` picks one, `?ambientDate=YYYY-MM-DD` picks as on that
day, `?ambientSeed=<n>` replays a run, and `?ambientDebug=1` logs the choice and names the
animation and its seed in the masthead's corner. Only the chosen animation's file is fetched.

## Using it in a front end

1. **Get the files.** The package is `src/`. Releases are published to streampack's Nexus, which
   anyone can read. A Node front end routes the scope there in its `.npmrc`,
   `@streampack-dev:registry=https://nexus.streampack.dev/repository/npm-group/`, and depends on
   `"@streampack-dev/masthead": "^0.2.1"`. A front end serving static files copies `src/` from a
   release (ui-pudl's `just update-masthead` takes the GitHub tag).
2. **Put the art in the page,** inside the masthead, from `art.svg`: a blank SVG holding only the
   shared glow. (A host may draw the same `<svg class="masthead-art">` itself, empty; the runner
   adds the glow when it's missing.) The runner draws the chosen animation into it once that animation has loaded, so
   nothing shows first and is swapped out, and only the chosen animation's file is fetched.
   Without script, with reduced motion, or if the animation fails, the masthead stays blank. The
   art fills its container, so the host places it: a positioned masthead with the art behind its
   text.
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
   `.masthead-paused` while paused, for the host's own CSS. Clicking the masthead pokes the
   animation, if it has a fragment of its own (the block peeker mines where you click, and faster
   for a click on the block, boids scatter from a hawk, the bytecode rain
   bursts, a tunnel appears in the chase, a surge runs through the circuit, city defense fires
   where you click, the flow field takes an eddy, the flyby fires a burn, the fractal sprouts a root, ghostrider opens the throttle, a gust runs through
   the grass, life plants a pattern, a dolphin leaps from the sea under the ships, signal noise tears, the Solari board riffles on, the terrain
   banks, the train whistles, a ripple runs through the triangles, water skips a stone); the frame has `data-masthead-poke` while it
   does, for a cursor, say.
   Clicks on links, buttons and form controls in the masthead pass through untouched; a
   masthead that is itself a link home passes `poke: false`. A host serving the variant files
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
  // m.stretch(): how many times wider than tall one unit is drawn, as the masthead is now (1 at
  //   the art's own 1200 x 320). The art is stretched to fit, so text drawn with
  //   scale(1 / m.stretch(), 1) keeps its shape; read it as you draw, since it changes on resize.
  // m.deks(): the front page's other posts' deks, as the host gives them. Maybe none.
  // Build the elements here, once. Return { step(n, time) { ... }, interval: ms } to be called
  // every interval ms (24 by default) with the step count and the clock, moving what was built;
  // or return nothing if it's still, or animates by SVG or CSS itself.
  // Optionally add poke(x, y, n, time) to that, called when the masthead is clicked, with where
  // in the 1200 x 320 and the step count and clock: a fragment of the animation's own, played
  // out over the steps that follow.
}
```

Animations use no libraries and draw only into their layer. Colours come from the classes above
or from rules on `.masthead-<name>` in `masthead.css` using its `--_accent`, `--_bg`, `--_border`
and `--_surface`, never fixed values, so they follow each site's theme. Add tests in
`test/variants.test.js`: the fakes in `test/fake.js` run a variant without a browser.

## Working on it

```sh
just test      # node:test, no dependencies
just demo      # the demo page at http://localhost:8642
```

`just release` (or `just release minor`, `just release major`) bumps the version in
`package.json`, commits, tags `vX.Y.Z`, pushes `main` and the tag together, and publishes the tag
to Nexus (`just publish X.Y.Z` retries a publish). It runs only from `main`, up to date with
`origin/main` and clean, and changes nothing otherwise. `just full-release` is the same thing, under
the name the other streampack projects use for their whole release (which there also commits and
pushes the version). A front end moves to a release when it's
ready; a change to what `m` offers or what `startMasthead` takes is a minor version before 1.0,
and front ends follow it in turn.