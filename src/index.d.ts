/** What a variant's make(layer, m) is given. */
export type MastheadContext = {
  /** The art's viewBox: 1200 by 320, stretched to the masthead. */
  width: number;
  height: number;
  /** "url(#masthead-pulse)": the glow fill art.svg defines. */
  pulse: string;
  /** The run's seed, the same on every call. */
  seed(): number;
  /**
   * How many times wider than tall one unit of the art is drawn: 1 at the art's own 1200 x 320,
   * more on a wide, short masthead. Text drawn with scale(1 / stretch(), 1) keeps its shape.
   */
  stretch(): number;
  /** The day the run was picked for: today, or ?ambientDate=YYYY-MM-DD. */
  date(): Date;
  /** Whether an occasion (OCCASIONS) or window is open on the day the run is for. */
  during(occasion: SeasonWindow): boolean;
  /** The front page's other posts' deks, as the host gives them. Maybe none. */
  deks(): string[];
  /** Makes an SVG element in parent (the layer by default). */
  el(tag: string, attrs?: Record<string, string | number>, parent?: Element): SVGElement;
};

/**
 * What make returns: step is called every interval ms (24 by default), or nothing if it's still.
 * poke, if given, is called when the masthead is clicked, with where in the art's 1200 x 320, the
 * step count and the clock, for a fragment of the animation's own.
 */
export type MastheadArt = {
  step(n: number, time: number): void;
  interval?: number;
  poke?(x: number, y: number, n: number, time: number): void;
} | void;

export type MastheadVariant = (layer: SVGGElement, m: MastheadContext) => MastheadArt;

export type MastheadLoaders = Record<string, () => Promise<{ default: MastheadVariant }>>;

export type MastheadOptions = {
  variants?: MastheadLoaders;
  name?: string;
  seed?: number;
  /** The day to pick for; seasonal animations are picked only in their windows, by weight. */
  date?: Date;
  search?: string;
  deks?: () => string[];
  paused?: () => boolean;
  frame?: Element;
  reducedMotion?: boolean;
  debug?: boolean;
  /** false keeps clicks on the masthead from reaching the animation's poke. */
  poke?: boolean;
};

export type MastheadHandle = {
  name: string;
  seed: number;
  label: string;
  /** Call when what paused() returns changes. */
  update(): void;
  stop(): void;
};

export const WIDTH: number;
export const HEIGHT: number;
export const variants: MastheadLoaders;
/**
 * A window of the year: a month (1 to 12), `'MM-DD'`, `'MM-DD..MM-DD'` (may wrap the year end),
 * `'YYYY-MM-DD'` or `'YYYY-MM-DD..YYYY-MM-DD'`, an occasion's name, or one of those with its own
 * weight. All inclusive, in the visitor's own time.
 */
export type SeasonWindow = number | string | { when: number | string; weight?: number };
/** Named windows that seasons and variants (m.during) refer to. */
export const OCCASIONS: Record<string, SeasonWindow[]>;
/** The seasonal animations and their windows; an animation not listed runs all year. */
export const SEASONS: Record<string, SeasonWindow[]>;
/** Animations still being worked on: never picked at random, though they run by name. */
export const DRAFTS: string[];
/** A window of this many days or more weighs 1; a shorter one, this over its days. */
export const REFERENCE_DAYS: number;
/** Whether the occasion or window is open on the day. */
export function during(occasion: SeasonWindow, date: Date): boolean;
/** Each animation's weight on the day: 1 all year, 0 out of season, more for a short window. */
export function weights(names: string[], date: Date): Record<string, number>;
/** The animations that may be picked at random on the day. */
export function inSeason(names: string[], date: Date): string[];
/** One animation at random by weight on the day, or null if none may be picked. */
export function pick(names: string[], date: Date, random?: () => number): string | null;
/** Whether the window is one the runner understands. */
export function isWindow(win: unknown): boolean;
export function startMasthead(svg: SVGSVGElement, options?: MastheadOptions): MastheadHandle;
