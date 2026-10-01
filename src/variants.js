/* The variants, by name, each loaded only when chosen. A variant is a module whose default export
   is make(layer, m); see the README. Adding one is adding its file and its line here. */
export var variants = {
  boids: function () { return import('./variants/boids.js'); },
  fractal: function () { return import('./variants/fractal.js'); },
  life: function () { return import('./variants/life.js'); },
  signalnoise: function () { return import('./variants/signalnoise.js'); },
  solari: function () { return import('./variants/solari.js'); },
  terrainflight: function () { return import('./variants/terrainflight.js'); }
};
