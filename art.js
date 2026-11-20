// ===== TURF ART =====
// Everything drawn in code: buildings, fences, the street around the block and the people, as lit boxes for village-iso.js.
// A box is [x, y, z, w, d, h, material]; a building is drawn in its own footprint with its front facing +y (toward the camera).
const ART = (() => {
const PEOPLE = (typeof MINI !== 'undefined') ? MINI : require('./figs.js');

const MATS = [ // [r, g, b, glow 0..1]
 [43, 45, 49, 0], [37, 39, 43, 0], [55, 56, 60, 0], [138, 132, 122, 0],      // 0 asphalt, 1 asphalt dark, 2 asphalt patch, 3 sidewalk
 [138, 59, 46, 0], [100, 42, 34, 0], [92, 104, 114, 0], [185, 178, 166, 0],  // 4 brick, 5 brick dark, 6 siding, 7 concrete
 [88, 86, 84, 0], [242, 162, 58, .7], [48, 44, 46, 0], [242, 162, 58, 1],    // 8 curb, 9 orange (tracer, life bar), 10 roof tar, 11 sodium glow
 [255, 236, 170, 1], [58, 60, 64, 0], [52, 70, 40, 0], [40, 56, 32, 0],      // 12 tracer, 13 steel, 14 yard grass, 15 grass dark
 [214, 210, 202, 0], [30, 40, 52, 0], [12, 12, 14, 0], [255, 190, 104, .85],  // 16 white trim, 17 dark glass, 18 black, 19 lit window
 [185, 163, 255, .08], [79, 107, 255, .1], [140, 34, 30, .9], [44, 32, 26, 0], // 20 lavender, 21 viceroy blue, 22 ember, 23 dark brown
 [128, 124, 130, 0], [176, 122, 90, 0], [30, 24, 22, 0], [112, 74, 52, 0],    // 24 smoke, 25 skin, 26 black hair, 27 skin deep
 [52, 54, 60, 0], [52, 70, 104, 0], [204, 160, 48, 0], [40, 140, 140, 0],     // 28 crew charcoal, 29 denim, 30 boombox mustard, 31 boombox teal
 [80, 230, 120, .85], [240, 64, 52, .85], [154, 163, 168, 0], [150, 118, 80, 0], // 32 fits, 33 blocked, 34 chain-link, 35 plywood
 [150, 134, 96, 0], [110, 36, 40, 0], [214, 170, 130, 0], [255, 90, 140, .8]    // 36 sandbag, 37 car maroon, 38 skin light, 39 neon pink
];

// ---------- buildings ----------
function blocks(k, lv, shape){
 const B = [], L = [], S = [], box = (x, y, z, w, d, h, m) => B.push([x, y, z, w, d, h, m]);
 const win = (x, y, z, w, h, lit) => { box(x - .03, y, z - .03, w + .06, .03, h + .06, 16); box(x, y + .01, z, w, .03, h, lit ? 19 : 17); };
 const sideWin = (x, y, z, d, h, lit) => { box(x, y - .03, z - .03, .03, d + .06, h + .06, 16); box(x + .01, y, z, .03, d, h, lit ? 19 : 17); };
 let top = 1;
 const sup = k === 'supstash'; if (sup) k = 'stash'; if (k === 'pad') k = 'rowhouse';
 if (k === 'house'){ // the Main House: two-story brick, flat roof with a parapet, stoop and porch lamp, a boombox on the step
  box(.25, .2, 0, 2.5, 2.3, 1.9, 4); box(.2, .15, 1.9, 2.6, 2.4, .12, 5);                       // walls, parapet cap
  box(.3, .25, 2.02, 2.4, .1, .14, 5); box(.3, 2.35, 2.02, 2.4, .1, .14, 5); box(.3, .25, 2.02, .1, 2.2, .14, 5); box(2.6, .25, 2.02, .1, 2.2, .14, 5);
  box(.4, .4, 1.92, 2.2, 2, .06, 10); box(1.9, .7, 2.0, .4, .35, .25, 13); box(1.95, .72, 2.25, .3, .3, .03, 8);  // roof tar, AC unit
  box(.25, 2.5, .62, 2.5, .03, .06, 5); box(.25, 2.5, 1.25, 2.5, .03, .08, 16);                  // brick bands
  win(.5, 2.5, .25, .45, .3, true); win(1.9, 2.5, .25, .45, .3, false); win(.5, 2.5, 1.35, .45, .38, true); win(1.25, 2.5, 1.35, .45, .38, false); win(1.9, 2.5, 1.35, .45, .38, true);
  sideWin(2.75, .6, .3, .45, .3, false); sideWin(2.75, 1.4, .3, .45, .3, true); sideWin(2.75, .6, 1.35, .45, .38, true); sideWin(2.75, 1.4, 1.35, .45, .38, false);
  box(1.2, 2.5, 0, .55, .04, .78, 23); box(1.17, 2.5, .78, .61, .05, .06, 16); box(1.62, 2.54, .35, .04, .02, .06, 9);   // door, lintel, knob
  box(1.0, 2.5, 0, 1, .45, .08, 7); box(1.05, 2.55, .08, .9, .35, .08, 7); box(1.1, 2.6, .16, .8, .25, .06, 7);      // stoop steps
  box(1.0, 2.88, .06, .05, .05, .55, 13); box(1.95, 2.88, .06, .05, .05, .55, 13); box(1.0, 2.88, .58, 1, .05, .04, 13);  // railing
  box(.98, 2.52, .9, .1, .08, .12, 13); box(1.0, 2.58, .9, .06, .04, .08, 11); L.push([1.03, 2.75, 1.0, 2.2]);             // porch lamp
  box(1.55, 2.62, .22, .3, .14, .17, 18); box(1.58, 2.75, .26, .09, .02, .09, 30); box(1.73, 2.75, .26, .09, .02, .09, 30); box(1.6, 2.62, .39, .26, .03, .03, 13);  // boombox
  top = 2.2;
 } else if (k === 'rowhouse'){ // a narrow brick rowhouse, cornice on top, fire escape on the side
  box(.15, .15, 0, 1.7, 2.6, 2.3, lv === 1 ? 5 : 4); box(.1, .1, 2.3, 1.8, 2.7, .1, 16); box(.1, 2.62, 2.15, 1.8, .14, .15, 16);  // walls, cornice
  box(.2, .2, 2.4, 1.6, 2.5, .04, 10);
  for (const z of [.3, 1.0, 1.65]){ win(.35, 2.75, z, .4, .42, (z * 10 | 0) % 2 === 0); win(1.2, 2.75, z, .4, .42, z > 1.5); }
  box(.85, 2.75, 0, .32, .04, .62, 23); box(.8, 2.75, 0, .45, .3, .07, 7);
  box(1.85, .5, .9, .25, 1.4, .04, 13); box(1.85, .5, 1.6, .25, 1.4, .04, 13); box(2.06, .5, .9, .03, 1.4, .3, 13); box(2.06, .5, 1.6, .03, 1.4, .3, 13);  // fire escape
  box(1.88, .6, .9, .2, .06, .7, 13);
  top = 2.45;
 } else if (k === 'store'){ // the corner store: teal awning, neon sign, a lit window full of shelves
  box(.15, .15, 0, 2.7, 1.6, 1.25, 6); box(.1, .1, 1.25, 2.8, 1.7, .12, 16); box(.2, .2, 1.37, 2.6, 1.5, .04, 10);
  box(.3, 1.75, .12, 1.4, .03, .75, 19); for (const z of [.3, .55]) box(.32, 1.74, z, 1.36, .05, .03, 23);   // window and shelves
  box(1.95, 1.75, 0, .5, .04, .9, 17); box(2.18, 1.79, .4, .04, .02, .1, 13);                               // glass door
  for (let i = 0; i < 6; i++) box(.15 + i * .45, 1.75, .98, .45, .45, .06, i % 2 ? 16 : 31);              // striped awning
  box(.6, 1.77, 1.05, .9, .04, .16, 18); box(.66, 1.8, 1.08, .78, .02, .1, 39); L.push([1.05, 2.1, 1.1, 1.6]);   // neon sign
  box(2.85, .4, .2, .04, 1.0, .6, 17);
  top = 1.45;
 } else if (k === 'stash'){ // a cinderblock garage: roll-up door half open, a crate of cash inside
  box(.12, .12, 0, 1.76, 1.6, .95, 7); box(.08, .08, .95, 1.84, 1.68, .08, 8);
  box(.35, 1.72, .38, 1.3, .03, .57, 13); for (let z = .45; z < .95; z += .1) box(.35, 1.74, z, 1.3, .02, .02, 8);   // roll-up door
  box(.4, 1.55, 0, 1.2, .15, .38, 18); box(.65, 1.45, 0, .7, .3, .25, 35); box(.7, 1.6, .25, .6, .1, .04, sup ? 36 : 32);
  if (sup){ box(.2, 1.8, 0, .32, .3, .3, 35); box(.24, 1.84, .3, .26, .24, .22, 36); box(1.5, 1.82, 0, .3, .28, .26, 35); }        // dark gap, crate, cash
  box(1.65, 1.72, .8, .15, .08, .1, 13); box(1.68, 1.78, .82, .09, .04, .05, 11); L.push([1.72, 1.95, .85, 1.3]);
  top = 1.05;
 } else if (k === 'porch'){ // a porch gunner: a sandbag nest on a slab (the gunman is a person, placed by the game at POSTS.porch)
  box(.1, .1, 0, 1.8, 1.8, .08, 7);
  const bag = (x, y, w, d) => { box(x, y, .08, w, d, .14, 36); box(x + .03, y + .03, .22, w - .06, d - .06, .12, 36); box(x + .06, y + .06, .34, w - .12, d - .12, .08, 36); };
  bag(.2, 1.35, 1.6, .38); bag(1.42, .35, .38, 1.0); bag(.2, .35, .38, 1.0);
  top = .9;
 } else if (k === 'roof'){ // a rooftop shooter: a narrow three-story walk-up, water tank (the shooter stands at POSTS.roof)
  box(.2, .2, 0, 1.6, 1.6, 2.9, 5); box(.15, .15, 2.9, 1.7, 1.7, .1, 16); box(.25, .25, 3.0, 1.5, 1.5, .03, 10);
  for (const z of [.35, 1.2, 2.05]){ win(.4, 1.8, z, .38, .45, z < 1); win(1.15, 1.8, z, .38, .45, z > 2); sideWin(1.8, .55, z, .4, .45, z > 1 && z < 2); }
  box(.75, 1.8, 0, .4, .04, .7, 23);
  box(.3, .3, 3.0, .08, .08, .45, 13); box(.75, .3, 3.0, .08, .08, .45, 13); box(.3, .75, 3.0, .08, .08, .45, 13); box(.75, .75, 3.0, .08, .08, .45, 13);
  box(.25, .25, 3.45, .65, .65, .5, 35); box(.22, .22, 3.95, .71, .71, .08, 10);                                 // water tank
  top = 3.6;
 } else if (k === 'gym'){ // the Gym: a cinderblock box with the door rolled up, a heavy bag inside, a barbell out front
  box(.15, .15, 0, 2.7, 1.55, 1.3, 7); box(.1, .1, 1.3, 2.8, 1.65, .1, 8); box(.2, .2, 1.4, 2.6, 1.45, .04, 10);
  box(.15, 1.7, 1.0, 2.7, .03, .12, 9);                                                              // painted stripe
  box(.4, 1.7, 0, 1.3, .03, .85, 18); box(.4, 1.72, .85, 1.3, .03, .1, 13);                           // open bay, rolled door
  box(.98, 1.6, .25, .16, .16, .5, 37); box(1.04, 1.66, .75, .04, .04, .12, 13);                      // heavy bag on its chain
  win(2.0, 1.7, .7, .55, .3, true); sideWin(2.85, .5, .7, .7, .3, false);
  box(1.95, 2.05, .09, .75, .04, .04, 13); for (const x of [1.95, 2.02, 2.6, 2.67]) box(x, 1.98, 0, .05, .18, .22, 18);   // barbell
  box(1.9, 1.75, .88, .12, .08, .1, 13); L.push([1.96, 2.0, .9, 1.5]);
  top = 1.5;
 } else if (k === 'hustle'){ // the Corner Hustle: a folding table under a striped tarp, a cooler and a crate
  box(.15, .15, 0, 1.7, 1.7, .05, 7);
  for (const [x, y] of [[.3, .4], [1.65, .4], [.3, 1.55], [1.65, 1.55]]) box(x, y, .05, .05, .05, 1.05, 13);
  for (let i = 0; i < 4; i++) box(.25 + i * .36, .35, 1.1, .36, 1.3, .05, i % 2 ? 16 : 31);
  box(.5, 1.0, .42, 1.0, .5, .04, 16); for (const [x, y] of [[.52, 1.02], [1.44, 1.02], [.52, 1.44], [1.44, 1.44]]) box(x, y, .05, .04, .04, .37, 13);   // table
  box(.6, 1.1, .46, .2, .14, .05, 32); box(.9, 1.15, .46, .2, .14, .05, 32); box(1.2, 1.1, .46, .16, .2, .1, 35);                                       // cash and goods
  box(.45, .5, .05, .4, .3, .28, 21); box(.45, .5, .33, .4, .3, .04, 16); box(1.2, .5, .05, .35, .35, .3, 35);                                           // cooler, crate
  box(.95, .95, 1.0, .08, .08, .08, 11); L.push([1.0, 1.2, .95, 1.6]);
  top = 1.2;
 } else if (k === 'run'){ // the Supply Run: a box van backed in, doors open, crates on the ground
  box(.3, .25, .16, 1.0, 1.25, .78, 16); box(.3, .25, .94, 1.0, 1.25, .04, 8);                        // cargo box
  box(.34, 1.5, .16, .92, .34, .5, 6); box(.36, 1.52, .66, .88, .3, .2, 17); box(.34, 1.84, .16, .92, .05, .2, 13);   // cab, windshield, bumper
  for (const [x, y] of [[.24, .45], [1.22, .45], [.24, 1.45], [1.22, 1.45]]) box(x, y, 0, .14, .32, .3, 18);          // wheels
  box(.3, .2, .16, .06, .06, .78, 13); box(1.24, .2, .16, .06, .06, .78, 13); box(.34, .22, .2, .92, .03, .7, 18);    // open back
  box(1.45, .3, 0, .36, .36, .3, 35); box(1.5, .35, .3, .26, .26, .24, 35); box(1.45, .8, 0, .34, .34, .28, 36); box(1.5, 1.3, 0, .3, .3, .2, 35);
  box(.4, 1.86, .3, .1, .03, .08, 12); box(1.1, 1.86, .3, .1, .03, .08, 12);
  top = 1.05;
 } else if (k === 'fence'){ // chain-link: posts, top rail and mesh, joined toward its neighbours (shape bits from wallShape)
  const sh = shape || 0, h = .62, post = (x, y) => { box(x - .04, y - .04, 0, .08, .08, h + .04, 13); box(x - .05, y - .05, h, .1, .1, .04, 13); };
  post(.5, .5);
  const run = (x, y, w, d) => { box(x, y, .06, w, d, h - .08, 34); box(x - .005, y - .005, h - .04, w + .01, d + .01, .03, 13); };
  if (sh & 1) run(.48, 0, .04, .5); if (sh & 4) run(.48, .5, .04, .5); if (sh & 2) run(.5, .48, .5, .04); if (sh & 8) run(0, .48, .5, .04);
  if (!sh) run(.15, .48, .7, .04);
  top = .7;
 }
 return {boxes:B, lights:L, smoke:S, top};
}
// a building knocked down: brick and board scattered on the slab
function rubble(fw, fh, k){
 const B = [], m = k === 'store' ? 6 : k === 'stash' ? 7 : k === 'fence' ? 34 : 4;
 if (k === 'fence'){ B.push([.2, .4, 0, .6, .1, .05, 34]); B.push([.45, .45, 0, .08, .08, .1, 13]); return B; }
 B.push([.1, .1, 0, fw - .2, fh - .2, .06, 8]);
 for (let i = 0; i < fw * fh * 3; i++){ const a = (i * 37 % 97) / 97, b = (i * 61 % 89) / 89; B.push([.2 + a * (fw - .6), .2 + b * (fh - .6), .06, .22 + (i % 3) * .08, .16 + (i % 2) * .1, .08 + (i % 4) * .05, i % 5 === 0 ? 35 : m]); }
 B.push([fw * .4, fh * .3, .06, .1, fh * .5, .12, 23]);
 return B;
}

// ---------- the street around the block ----------
// tile(x, y): the ground material for one grid tile. edge(): every box outside the grid (sidewalks, row houses, lamps, cars).
function tile(x, y){
 const inYard = x >= 7 && x <= 21 && y >= 6 && y <= 20, walk = x >= 5 && x <= 23 && y >= 4 && y <= 22;
 if (inYard){ const r = ((x * 73856093) ^ (y * 19349663)) >>> 0; return r % 7 === 0 ? 15 : (r % 3 === 0 ? 7 : 14); }
 if (walk) return 3;
 const r = ((x * 2654435761) ^ (y * 40503)) >>> 0; return r % 9 === 0 ? 2 : (r % 4 === 0 ? 1 : 0);
}
function edge(){
 const B = [], L = [], box = (x, y, z, w, d, h, m) => B.push([x, y, z, w, d, h, m]);
 // curb lines around the sidewalk, lane dashes on the street
 box(4.95, 3.95, 0, 19.1, .1, .1, 8); box(4.95, 22.95, 0, 19.1, .1, .1, 8); box(4.95, 3.95, 0, .1, 19.1, .1, 8); box(23.95, 3.95, 0, .1, 19.1, .1, 8);
 for (let i = 0; i < 28; i += 2){ box(i + .2, 1.95, .02, .9, .1, .01, 16); box(i + .2, 25.95, .02, .9, .1, .01, 16); box(1.95, i + .2, .02, .1, .9, .01, 16); box(25.95, i + .2, .02, .1, .9, .01, 16); }
 // streetlights at the sidewalk corners and midpoints: sodium glow pooling on the street
 [[5.3, 4.3], [23.7, 4.3], [5.3, 22.7], [23.7, 22.7], [14.5, 4.3], [14.5, 22.7], [5.3, 13.5], [23.7, 13.5]].forEach(([x, y]) => {
  box(x - .05, y - .05, 0, .1, .1, 1.6, 13); box(x - .05, y - .05, 1.6, .5, .1, .06, 13); box(x + .3, y - .08, 1.5, .22, .16, .1, 13); box(x + .32, y - .06, 1.46, .18, .12, .04, 11);
  L.push([x + .4, y, 1.3, 3.2]); });
 // parked cars along the far curbs
 const car = (x, y, rot, m) => { if (rot){ box(x, y, .1, .8, 1.7, .35, m); box(x + .08, y + .4, .45, .64, .8, .28, m); box(x + .1, y + .42, .47, .6, .76, .22, 17);
   [[x - .03, y + .2], [x + .73, y + .2], [x - .03, y + 1.25], [x + .73, y + 1.25]].forEach(([a, b]) => box(a, b, 0, .1, .28, .26, 18)); }
  else { box(x, y, .1, 1.7, .8, .35, m); box(x + .4, y + .08, .45, .8, .64, .28, m); box(x + .42, y + .1, .47, .76, .6, .22, 17);
   [[x + .2, y - .03], [x + .2, y + .73], [x + 1.25, y - .03], [x + 1.25, y + .73]].forEach(([a, b]) => box(a, b, 0, .28, .1, .26, 18)); } };
 car(9, 2.7, 0, 37); car(17.5, 2.7, 0, 13); car(3, 9, 1, 29); car(25.2, 16, 1, 37); car(20, 24.5, 0, 6);
 // the rest of the neighborhood: row houses facing the street on every side, past the map edge
 const row = (x, y, w, d, face, n) => { for (let i = 0; i < n; i++){ const hgt = 1.6 + ((i * 7 + x * 3) % 5) * .25, m = (i + x) % 3 === 0 ? 5 : (i % 2 ? 4 : 6);
   const ox = face === 'x' ? x : x + i * w, oy = face === 'x' ? y + i * d : y; box(ox, oy, 0, face === 'x' ? 2.4 : w - .1, face === 'x' ? d - .1 : 2.4, hgt, m); box(ox - .05, oy - .05, hgt, (face === 'x' ? 2.4 : w - .1) + .1, (face === 'x' ? d - .1 : 2.4) + .1, .1, 16);
   if (i % 2 === 0) L.push([ox + (face === 'x' ? 1.2 : w / 2), oy + (face === 'x' ? d / 2 : 1.2), hgt * .5, 1]); } };
 row(-2, -3.2, 2.2, 0, 'y', 15); row(-2, 28.8, 2.2, 0, 'y', 15); row(-3.2, -1, 0, 2.2, 'x', 14); row(28.8, -1, 0, 2.2, 'x', 14);
 return {boxes:B, lights:L};
}

// ---------- people ----------
// People are built in figs.js (MINI). detail: 0 far, 1 mid, 2 near.
function figure(look, frame, mode, detail){ return PEOPLE.fig(look, frame, mode, detail == null ? 1 : detail); }

// where a defender stands on a building: [x, y, z] inside its footprint
const POSTS = {porch:[1.0, .9, .08], roof:[1.25, 1.3, 3.03]};
return {MATS:MATS.concat(PEOPLE.EXTRA), blocks, rubble, tile, edge, figure, POSTS};
})();
if (typeof module !== 'undefined') module.exports = ART;
