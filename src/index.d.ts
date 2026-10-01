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
  /** The front page's other posts' deks, as the host gives them. Maybe none. */
  deks(): string[];
  /** Makes an SVG element in parent (the layer by default). */
  el(tag: string, attrs?: Record<string, string | number>, parent?: Element): SVGElement;
};

/** What make returns: step is called every interval ms (24 by default), or nothing if it's still. */
export type MastheadArt = { step(n: number, time: number): void; interval?: number } | void;

export type MastheadVariant = (layer: SVGGElement, m: MastheadContext) => MastheadArt;

export type MastheadLoaders = Record<string, () => Promise<{ default: MastheadVariant }>>;

export type MastheadOptions = {
  variants?: MastheadLoaders;
  name?: string;
  seed?: number;
  search?: string;
  deks?: () => string[];
  paused?: () => boolean;
  frame?: Element;
  reducedMotion?: boolean;
  debug?: boolean;
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
export function startMasthead(svg: SVGSVGElement, options?: MastheadOptions): MastheadHandle;
