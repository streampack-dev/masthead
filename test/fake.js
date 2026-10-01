/* Just enough of an SVG element for a variant to draw into, and the m its make() is given, so the
   variants run under node:test without a browser. */
export function element(tag) {
  return {
    tag: tag,
    attrs: {},
    children: [],
    textContent: '',
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k]; },
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
    removeChild(c) { this.children.splice(this.children.indexOf(c), 1); return c; },
    get firstChild() { return this.children[0] || null; }
  };
}

export function context(layer, opts) {
  opts = opts || {};
  return {
    width: 1200,
    height: 320,
    pulse: 'url(#masthead-pulse)',
    seed: () => (opts.seed === undefined ? 7 : opts.seed),
    stretch: () => opts.stretch || 1,
    deks: () => opts.deks || [],
    el(tag, attrs, parent) {
      const e = element(tag);
      for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
      (parent || layer).appendChild(e);
      return e;
    }
  };
}

/* The variant drawn, then stepped n times at its interval (if it steps); returns the layer and
   what make gave. */
export function run(make, n, opts) {
  const layer = element('g');
  const art = make(layer, context(layer, opts));
  const interval = (art && art.interval) || 24;
  for (let i = 1; art && i <= n; i++) art.step(i, i * interval);
  return { layer, art };
}

/* Every element under root with the class, depth first. */
export function find(root, cls) {
  const out = [];
  (function walk(e) {
    if ((e.attrs.class || '').split(' ').includes(cls)) out.push(e);
    e.children.forEach(walk);
  })(root);
  return out;
}

export function serialize(e) {
  return e.tag + JSON.stringify(e.attrs) + e.textContent + '[' + e.children.map(serialize).join(',') + ']';
}
