// ===== TURF PEOPLE · v2 smooth · Nov 20 2026 =====
// Code-drawn people made of rounded shapes: limbs are capsules between real joints, heads and bodies are ellipsoids,
// hard things (none yet) can still be boxes. One person is about 36 units tall (1 unit = 1/64 of a map tile) and faces +y.
// person(seed, gang) rolls a look from ONE shared pool: skin tone, build, hair and clothes are drawn the same way for
// every crew. The only thing a crew changes is its color, worn on one or two items.
// build(spec, frame, mode, lod): lod 0 = far (body, head, weapon), 1 = mid (hands, face, kit), 2 = near (eyes, brows, small things).
const MINI = (() => {
const EXTRA = [], M = {};
const def = (n, r, g, b, glow) => { M[n] = 40 + EXTRA.length; EXTRA.push([r, g, b, glow || 0]); };
const SKIN = [[88, 57, 43], [108, 71, 51], [124, 83, 58], [150, 105, 74], [176, 128, 93], [199, 153, 114], [221, 180, 143], [237, 205, 173]];
SKIN.forEach((c, i) => { def('s' + i, c[0], c[1], c[2]); def('sd' + i, Math.round(c[0] * .8), Math.round(c[1] * .78), Math.round(c[2] * .78)); });
def('hBlack', 40, 34, 34); def('hDark', 62, 43, 32); def('hBrown', 90, 58, 36); def('hAuburn', 124, 54, 30); def('hBlonde', 198, 162, 98); def('hGrey', 152, 150, 148);
def('eye', 234, 232, 226);
def('heather', 128, 130, 137); def('cream', 222, 214, 196); def('navy', 34, 42, 74); def('ltdenim', 112, 142, 178); def('olive', 86, 92, 58);
def('khaki', 176, 154, 112); def('brown', 98, 70, 48); def('burgundy', 112, 34, 44); def('forest', 38, 78, 56);
def('red', 190, 44, 40); def('orange', 226, 122, 40); def('green', 60, 150, 80); def('gold', 214, 172, 60); def('silver', 182, 186, 192);
def('tan', 188, 142, 86); def('sole', 236, 234, 228); def('pink', 222, 124, 152); def('ink', 30, 32, 38);
def('lavD', 132, 114, 204); def('tealD', 26, 98, 98); def('jet', 38, 38, 44); def('stone', 160, 156, 148); def('wrap', 228, 224, 214);
// colors already in ART.MATS
Object.assign(M, {white:16, black:18, charcoal:28, denim:29, mustard:30, teal:31, lav:20, blue:21, steel:13, wood:35, glow:11, flash:12});


function build(p, frame, mode, lod){
 lod = lod == null ? 2 : lod;
 const P = [];
 const E = (c, rx, ry, rz, m, t) => { if ((t | 0) <= lod && m != null) P.push(['e', c[0], c[1], c[2], rx, ry, rz, m]); };
 const C = (a, b, ra, rb, m, t) => { if ((t | 0) <= lod && m != null) P.push(['c', a[0], a[1], a[2], b[0], b[1], b[2], ra, rb, m]); };
 const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
 const add = (a, d, k) => [a[0] + d[0] * k, a[1] + d[1] * k, a[2] + d[2] * k];
 const sk = M['s' + p.skin], sd = M['sd' + p.skin], hair = M[p.hairC], G = M[p.gang], GD = M[p.gangD] || G;
 const huge = p.build === 'huge', heavy = p.build === 'heavy', slim = p.build === 'slim', fem = p.sex === 'f';
 const g = huge ? 1.3 : heavy ? 1.17 : slim ? .9 : 1;                              // girth
 const sx = (fem ? 4.1 : 4.6) * (huge ? 1.22 : heavy ? 1.1 : slim ? .95 : 1);      // shoulder joint, half width
 const hx = (fem ? 2.15 : 1.95) * (huge ? 1.25 : heavy ? 1.12 : 1);                // hip joint, half width
 const far = lod === 0, walk = mode === 'walk', work = mode === 'work', f = frame & 3, beat = work && !!(frame & 2);
 const tool = p.tool, club = tool === 'bat' || tool === 'sledge', on = k => p.gangOn.indexOf(k) >= 0;

 // ---------- legs: thigh angle and knee bend per leg, hips dropped so the lower foot stands on the ground ----------
 let la, lk, ra, rk;
 if (walk){ const W = [[.5, .1, -.42, .3], [.12, .05, .2, 1.0], [-.42, .3, .5, .1], [.2, 1.0, .12, .05]][f]; la = W[0]; lk = W[1]; ra = W[2]; rk = W[3]; }
 else if (work){ la = .36; lk = .32; ra = -.32; rk = .12; }
 else { la = .04; lk = .05; ra = -.03; rk = .04; }
 const TH = 8, SH = 7.4, AZ = 2.1;
 const legPts = (s, a, k) => { const knee = [s * (hx + .15), Math.sin(a) * TH, -Math.cos(a) * TH]; return {hip:[s * hx, 0, 0], knee, ank:[s * (hx + .3), knee[1] + Math.sin(a - k) * SH, knee[2] - Math.cos(a - k) * SH]}; };
 const LL = legPts(-1, la, lk), RL = legPts(1, ra, rk), hipZ = AZ - Math.min(LL.ank[2], RL.ank[2]), up = q => [q[0], q[1], q[2] + hipZ];
 const bot = p.bottom, Pm = M[bot.c], P2 = M[bot.c2 || bot.c], sh = p.shoes, SC = M[sh.c], SS = M[sh.sole || 'sole'];
 const leg = (J, s) => {
  const hip = up(J.hip), knee = up(J.knee), ank = up(J.ank), w = (bot.t === 'sweats' || bot.t === 'cargo') ? 1.12 : bot.t === 'leggings' ? .9 : 1;
  C(hip, knee, 2.05 * g * w, 1.6 * g * w, Pm);
  if (bot.t === 'shorts'){ C(knee, ank, 1.3 * g, 1.0 * g, sk); C(mix(knee, ank, .62), ank, 1.12 * g, 1.06 * g, M.white, 1); C(mix(hip, knee, .82), add(knee, [0, 0, 1], .2), 1.9 * g, 1.85 * g, Pm, 1); }
  else { C(knee, ank, 1.5 * g * w, 1.22 * g * w, Pm);
   if (bot.t === 'jeans' && sh.t !== 'boots') C(mix(knee, ank, .88), ank, 1.3 * g, 1.3 * g, P2, 2);
   if (bot.t === 'cargo') E(add(mix(hip, knee, .55), [s, 0, 0], 1.75 * g), .7, 1.35, 1.7, P2, 1);
   if (bot.t === 'sweats' || bot.t === 'track') C(add(hip, [s, 0, 0], 1.95 * g * w), add(ank, [s, 0, 0], 1.15 * g * w), .3, .3, P2, 2); }
  const fz = ank[2] - AZ;
  if (sh.t === 'boots' || sh.t === 'high') C(add(ank, [0, 0, 1], sh.t === 'boots' ? 3.2 : 1.8), ank, 1.82 * g * w, 1.6 * g * w, SC, 1);
  E([ank[0], ank[1] + 1.15, fz + 1.3], 1.45 * g, 2.65, 1.3, SC);
  E([ank[0], ank[1] + 1.2, fz + .5], 1.6 * g, 2.85, .55, SS, 1);
  E([ank[0], ank[1] + 3.05, fz + 1.05], 1.2 * g, .85, .8, M[sh.toe] || SS, 2);
 };
 leg(LL, -1); leg(RL, 1);

 // ---------- body ----------
 const top = p.top, T = M[top.c], T2 = M[top.c2 || 'white'], T3 = M[top.c3 || 'ink'], TT = on('top') ? G : T;
 const puff = top.t === 'puffer' || top.t === 'vest', bulk = puff ? 1.2 : top.t === 'hoodie' ? 1.1 : 1;
 const bare = top.t === 'tank' || top.t === 'jersey' || top.t === 'vest';
 const open = top.t === 'bomber' || top.t === 'flannel' || top.t === 'denimjkt' || top.t === 'suit';
 const lean = work ? (club ? 1.1 : .6) : walk ? .5 : 0;
 const PZ = hipZ + .6, WZ = hipZ + 4.2, CZ = hipZ + 8.2, SZ = hipZ + 10.4;
 const ww = (fem ? 3.3 : 3.7) * g, cw = sx * .92 + .6, td = (fem ? 2.35 : 2.5) * g, belly = (heavy || huge) ? 1.22 : 1;
 const inner = open ? T2 : TT, cry = td * 1.12 * bulk;
 const chestF = dz => lean * .7 + cry * Math.sqrt(Math.max(.05, 1 - (dz / 3.9) * (dz / 3.9)));    // front of the chest at a height above its middle
 E([0, 0, PZ], hx + 1.9 * g, td * 1.02, 2.7, Pm);
 if (top.t === 'longtee' || top.t === 'hoodie' || puff) E([0, lean * .1, PZ + 1.1], hx + 2.05 * g * bulk, td * 1.08 * bulk, 2.3, inner);
 if (puff){ const seam = on('top') ? GD : T3; E([0, lean * .3, WZ], ww * 1.08, td * belly * 1.08, 3.8, seam); E([0, lean * .7, CZ], cw * 1.1, td * 1.2, 3.8, seam);
  for (let n = 0; n < 4; n++) E([0, lean * (.15 + .2 * n), hipZ + 2.4 + n * 2.55], (ww + (cw - ww) * n / 3) * bulk, td * (n < 2 ? belly : 1.1) * bulk, 1.62, TT, far ? 3 : 0);
  if (far){ E([0, lean * .3, WZ], ww * bulk, td * belly * bulk, 3.9, TT); E([0, lean * .7, CZ], cw * bulk, cry, 3.9, TT); } }
 else { E([0, lean * .3 + (belly - 1) * 1.6, WZ], ww * bulk, td * bulk * belly, 3.9, inner); E([0, lean * .7, CZ], cw * bulk, cry, 3.9, inner); }
 if (top.t === 'vest') C([-sx + 2.2, lean, SZ + .2], [sx - 2.2, lean, SZ + .2], 1.95 * g, 1.95 * g, TT); else C([-sx + .5, lean, SZ], [sx - .5, lean, SZ], 1.75 * g * bulk, 1.75 * g * bulk, bare ? sk : inner);
 if (fem && !puff && !far) for (const s of [-1, 1]) E([s * 1.55, chestF(.3) - 1.05, CZ + .3], 1.5, 1.2, 1.35, inner, 1);
 const ob = top.t === 'suit' ? .3 : .8;
 if (open){ E([0, lean * .3 - ob, WZ], ww * 1.1, td * 1.06 * belly, 4, TT); E([0, lean * .7 - ob - .05, CZ], cw * 1.09, cry * 1.03, 4.05, TT);
  C([-sx + .4, lean - .3, SZ], [sx - .4, lean - .3, SZ], 1.9 * g, 1.9 * g, TT); E([0, lean - 1.5, SZ + 1.25], 2.4, 1.3, 1.0, top.t === 'bomber' ? T3 : TT, 1);
  if (top.t === 'bomber') E([0, lean * .2 - .8, WZ - 3.1], ww * 1.12, td * 1.08, .8, T3, 1);
  if (top.t === 'flannel') for (const z of [WZ - 1.2, WZ + 1.6, CZ + .6]) E([0, lean * .5 - .85, z], (z > WZ + 1 ? cw * 1.1 : ww * 1.115), td * 1.1 * (z > WZ + 1 ? 1.1 : belly), .28, T3, 2); }
 if (top.t === 'hoodie'){ if (p.hat !== 'hood') E([0, lean - 2.7, SZ + .9], 2.9, 1.9, 2.0, TT); E([0, lean * .3 + td * bulk * .9, WZ - .6], 2.5, .6, 1.35, TT, 1);
  E([0, lean * .1, WZ - 3.2], ww * bulk * 1.03, td * bulk * 1.05, .8, TT, 1);
  for (const s of [-1, 1]) C([s * .8, chestF(1.9) + .1, CZ + 1.9], [s * .9, chestF(-1) + .15, CZ - 1], .16, .16, M.white, 2); }
 if (top.t === 'track'){ E([0, lean * .7, CZ + .3], cw * 1.02, cry * 1.03, .6, T2, 1); E([0, lean - .2, SZ + 1.15], 1.9, 1.75, .9, TT, 1); E([0, lean * .1, WZ - 3.1], ww * 1.03, td * 1.05, .7, T3, 2); }
 if (top.t === 'jersey'){ E([0, lean * .15, WZ - 3], ww * 1.03, td * 1.05, .55, T2, 1); E([0, lean * .9, SZ + .2], 2.3, 2.1, .45, T2, 2); }
 if (top.t === 'vest') E([0, lean - .6, SZ + 1.2], 2.5, 2.0, 1.1, TT, 1);
 if (p.ruffle){ const rf = [[-.55, 2.6, 1.15], [.6, 1.7, 1.2], [-.5, .8, 1.1], [.5, -.1, 1], [-.35, -1, .85], [.3, -1.8, .7]]; rf.forEach((q, n) => E([q[0], chestF(q[1]) + .3, CZ + q[1]], q[2], .6, .62, M.eye, n < 4 ? 1 : 2)); E([0, lean + 1.2, SZ + 1.05], 1.5, 1.1, .6, M.eye, 1); }
 if (p.cape){ E([0, lean * .5 - td - 1.5, hipZ + 1.6], cw * 1.28, .6, 9.8, M.blue); E([0, lean - 1.7, SZ + 1.7], 2.7, 1.3, 1.8, M.blue, 1); }
 if (p.guitar){ const gy = lean * .5 - td - 2.5; E([0, gy, hipZ + 4.4], 3, .8, 2.7, M.lavD); E([0, gy, hipZ + 7.9], 2.3, .8, 2.1, M.lavD); E([0, gy - .5, hipZ + 5.2], 1, .5, 1, M.ink, 2);
  C([.4, gy, hipZ + 9.6], [3.6, gy, hipZ + 20], .42, .4, M.brown); E([3.8, gy, hipZ + 20.8], .75, .45, 1.1, M.ink, 1); }
 if (p.tied) for (const z of [WZ + 1.6, CZ + .2]) E([0, lean * .5 - .3, z], cw * 1.16, cry * 1.12, .5, M.tan);
 if (on('neck')){ E([0, lean + .15, SZ + .95], 2.0, 1.95, .85, G); E([0, chestF(1.9) + .1, CZ + 1.9], 1.55, .55, 1.45, G, 1); }
 if (on('flag')) E([hx + 1.75 * g, .7, PZ - 1.7], .45, .95, 2.4, G, 1);
 if (p.chain){ E([0, lean * .95, SZ + .3], 2.25, 2.15, .22, M.gold, 2); E([0, chestF(.9) + .25, CZ + .9], .5, .32, .62, M.gold, 2); }
 if (p.pack) E([0, lean * .5 - td * bulk - 1.3, CZ - .7], 2.9, 1.7, 3.9, M[p.pack]);
 if (p.bag){ const b0 = [sx - 1, lean + td * .7, SZ + .7], b1 = [0, chestF(-.4) + .25, CZ - .4], b2 = [-(hx + 1.5 * g), td * .8, PZ + 1.4];
  C(b0, b1, .3, .3, M.ink, 1); C(b1, b2, .3, .3, M.ink, 1); E([-(hx + 1.9 * g), .9, PZ + .5], 1.25, 1.7, 1.6, M.ink, 1); }

 // ---------- arms: shoulder, elbow and wrist are real joints, so a pose is just angles ----------
 const sleeve = bare ? 'none' : (top.t === 'tee' || top.t === 'longtee') ? 'short' : top.t === 'flannel' ? 'rolled' : 'long';
 const AT = TT, UA = 5.6, FA = 5.2, ag = g * (puff && !bare ? 1.25 : 1);
 const dir = (s, phi, al) => [s * Math.sin(al), Math.sin(phi) * Math.cos(al), -Math.cos(phi) * Math.cos(al)];
 const arm = (s, phi, al, phi2, al2) => {
  const S = [s * sx, lean, SZ - .2], d1 = dir(s, phi, al), EL = add(S, d1, UA), d2 = dir(s, phi2, al2), WR = add(EL, d2, FA), H = add(WR, d2, 1);
  E(S, 1.85 * ag, 1.8 * ag, 1.8 * ag, sleeve === 'none' ? sk : AT, 1);
  if (sleeve === 'short'){ C(S, mix(S, EL, .5), 1.9 * ag, 1.62 * ag, AT); C(mix(S, EL, .35), EL, 1.3 * g, 1.1 * g, sk); }
  else C(S, EL, 1.45 * ag, 1.2 * ag, sleeve === 'none' ? sk : AT);
  C(EL, WR, 1.18 * ag, .92 * ag, sleeve === 'long' ? AT : sk);
  if (sleeve === 'long' && (top.t === 'hoodie' || top.t === 'bomber' || top.t === 'track' || puff)) C(mix(EL, WR, .86), WR, 1.02 * ag, 1.02 * ag, top.t === 'hoodie' ? AT : T3, 2);
  if (p.ruffle) E(WR, 1.3, 1.3, .8, M.white, 1);
  if (p.wraps) C(mix(EL, WR, .55), WR, 1.02 * g, .95 * g, M.wrap, 1);
  E(H, .95, 1, 1.15, p.wraps ? M.wrap : sk, far ? 0 : 0);
  if (on('armband') && s > 0) C(mix(S, EL, .4), mix(S, EL, .62), 1.55 * ag, 1.5 * ag, G, 1);
  if (p.watch && s < 0 && sleeve !== 'long') C(mix(EL, WR, .9), WR, 1.02 * g, 1.02 * g, M.gold, 2);
  return {H, d2};
 };
 const swing = walk ? [.55, .1, -.5, -.1][f] : 0;
 let A;
 if (p.tied){ arm(-1, -.35, -.1, -.75, -.7); arm(1, -.35, -.1, -.75, -.7); }
 else if (work && tool === 'pistol'){ A = arm(1, 1.5, -.14, 1.57, -.1); arm(-1, 1.36, -.3, 1.5, -.72); }
 else if (work && club){ A = beat ? arm(1, 1.2, .05, 1.5, -.1) : arm(1, 3.3, .15, 3.0, 0); arm(-1, .55, .1, 1.7, -.3); }
 else if (club){ A = arm(1, .1, .1, 2.45, 0); arm(-1, walk ? -swing : .06, .12, walk ? -swing + .5 : .3, .06); }
 else if (walk){ A = arm(1, swing, .1, swing + .5, .05); arm(-1, -swing, .1, -swing + .5, .05); }
 else if (p.pose === 'pocket' && top.t === 'hoodie'){ arm(1, .12, .1, .95, -.55); arm(-1, .12, .1, .95, -.55); }
 else { A = arm(1, .06, .12, .3, .06); arm(-1, .06, .12, .3, .06); }
 // ---------- what they carry (drawn bigger from far away so each kind reads in a crowd) ----------
 if (A && club){ const k = far ? 1.7 : 1, pb = work ? (beat ? 1.45 : 3.9) : 3.75, d = [0, Math.sin(pb), -Math.cos(pb)], b0 = add(A.H, d, -1.3);
  if (tool === 'bat'){ C(b0, add(A.H, d, 13.5), .36 * k, .64 * k, M.wood); E(b0, .52 * k, .52 * k, .52 * k, M.wood, 2); C(add(A.H, d, -.9), add(A.H, d, 2.2), .4, .4, M.ink, 2); }
  else { const tip = add(A.H, d, 15.5); C(b0, tip, .4 * k, .4 * k, M.wood); P.push([tip[0] - 2 * k, tip[1] - 1.25 * k, tip[2] - 1.25 * k, 4 * k, 2.5 * k, 2.5 * k, M.steel]); } }
 if (A && tool === 'pistol'){ const k = far ? 1.8 : 1, d = A.d2, dn = [0, d[2], -d[1]];
  C(add(A.H, d, .2), add(A.H, d, 3.9 * k), .5 * k, .45 * k, M.steel); C(A.H, add(A.H, dn, 1.6), .42, .4, M.black, 1);
  if (work && beat){ E(add(A.H, d, 5.2 * k), .9, 1.4, .9, M.glow); E(add(A.H, d, 6.6 * k), .45, .9, .45, M.flash, 1); } }

 // ---------- head ----------
 const HC = [0, lean * 1.15 + .25, SZ + 4.7], hr = [2.38, 2.68, 3.0];
 C([0, lean, SZ + .9], [0, HC[1] - .2, HC[2] - 2.1], 1.3 * (heavy || huge ? 1.25 : 1), 1.15, sd, 1);
 E(HC, hr[0], hr[1], hr[2], sk);
 E([0, HC[1] + .42, HC[2] - 1.65], 1.95, 2.15, 1.8, sk, 1);
 const surf = (x, dz) => HC[1] + hr[1] * Math.sqrt(Math.max(.02, 1 - (x / hr[0]) * (x / hr[0]) - (dz / hr[2]) * (dz / hr[2])));
 const masked = on('mask'), dark = p.hairC === 'hBlonde' || p.hairC === 'hGrey' ? M.hBrown : M.hBlack;
 for (const s of [-1, 1]){
  E([s * hr[0] * .98, HC[1] - .2, HC[2] - .3], .45, .7, .95, sd, 1);
  const ey = surf(1.02, -.1), ez = HC[2] - .1;
  if (lod === 1) E([s * 1.02, ey - .06, ez], .42, .2, .34, M.hBlack, 1);
  E([s * 1.02, ey - .1, ez], .5, .22, .33, M.eye, 2); E([s * .99, ey + .04, ez], .27, .2, .29, M.hBlack, 2);
  E([s * 1.06, surf(1.06, .72) - .04, HC[2] + .72], .78, .22, .2, dark, 2);
  if (p.earring) E([s * hr[0], HC[1] - .2, HC[2] - 1.35], .26, .26, .32, M.gold, 2);
  if (p.glasses){ if (p.glasses === 'shades') E([s * 1.02, ey + .16, ez], .66, .14, .46, M.black, 1); C([s * .35, ey + .3, ez + .2], [s * 1.7, ey + .12, ez + .25], .1, .1, M.ink, 2); C([s * 1.7, ey + .12, ez + .25], [s * hr[0], HC[1] - .2, ez + .3], .09, .09, M.ink, 2); }
 }
 if (!masked){ E([0, surf(0, -.8) + .05, HC[2] - .8], .42, .55, .72, sk, 1); E([0, HC[1] + 2.5, HC[2] - 2.02], .85, .22, .18, p.lip ? M.burgundy : sd, 2); }
 if (p.beard === 'full'){ E([0, HC[1] + .4, HC[2] - 2.15], 2.12, 2.28, 1.66, hair, 1); E([0, HC[1] + 2.64, HC[2] - 1.5], 1, .3, .28, hair, 2); }
 if (p.beard === 'goatee'){ E([0, HC[1] + 2.05, HC[2] - 2.8], .85, .7, .85, hair, 1); E([0, HC[1] + 2.64, HC[2] - 1.5], 1, .3, .28, hair, 2); }
 if (p.beard === 'stache') E([0, HC[1] + 2.66, HC[2] - 1.5], 1.05, .32, .3, hair, 1);
 if (masked) E([0, HC[1] + .4, HC[2] - 1.55], 2.3, 2.55, 1.7, G, 1);

 // ---------- hair (the top is skipped under a hat) ----------
 const hat = p.hat, covered = hat === 'cap' || hat === 'capback' || hat === 'beanie' || hat === 'hood' || hat === 'durag' || hat === 'bucket', hs = p.hair;
 const skull = (dz, grow, m) => E([0, HC[1] - .5, HC[2] + .75 + dz], hr[0] + .2 + grow, hr[1] + .22 + grow, hr[2] + .1 + grow * .7 - dz * .5, m);
 if (hat !== 'hood'){
  if (!covered){
   if (hs === 'buzz' || hs === 'braids' || hs === 'bun' || hs === 'ponytail' || hs === 'puffs' || hs === 'locs' || hs === 'long' || hs === 'bob' || hs === 'pomp') skull(0, hs === 'buzz' ? -.05 : .08, hair);
   if (hs === 'fade') skull(.9, 0, hair);
   if (hs === 'curlytop'){ skull(.9, 0, hair); E([0, HC[1] + .1, HC[2] + 3], 2.25, 2.5, 1.5, hair); }
   if (hs === 'pomp') E([0, HC[1] + 1.1, HC[2] + 2.9], 2.2, 2.3, 1.6, hair);
   if (hs === 'afro') E([0, HC[1] - 1.6, HC[2] + 1.5], 4.2, 4.1, 3.9, hair);
   if (hs === 'bun') E([0, HC[1] - 2, HC[2] + 3.1], 1.5, 1.5, 1.4, hair);
   if (hs === 'puffs') for (const s of [-1, 1]) E([s * 2.6, HC[1] - 1.2, HC[2] + 2.7], 1.75, 1.75, 1.75, hair);
   if (hs === 'braids') for (let n = 0; n < 5; n++) C([-2 + n, HC[1] + 1.6, HC[2] + 2.9 - Math.abs(n - 2) * .35], [-2.2 + n * 1.1, HC[1] - 2.9, HC[2] + 1.9 - Math.abs(n - 2) * .4], .3, .3, M.hBlack, 2);
  } else if (hs === 'afro') E([0, HC[1] - 2, HC[2] - .2], 3.6, 3.2, 2.6, hair, 1);
  if (hs === 'locs' || hs === 'braids'){ const n = hs === 'locs' ? 9 : 5, r = hs === 'locs' ? .55 : .4;
   for (let k = 0; k < n; k++){ const a = Math.PI * (1.05 + .9 * k / (n - 1)), c = Math.cos(a), sn = Math.sin(a), len = (hs === 'locs' ? 6.4 : 5) + ((k * 7) % 3) * .7;
    C([c * 2.3, HC[1] - .3 + sn * 2.5, HC[2] + 1.2], [c * 2.95, HC[1] - .4 + sn * 3.1, HC[2] + 1.2 - len], r, r * .85, hair, k % 2 ? 1 : 0); }
   if (hs === 'locs') for (const s of [-1, 1]) C([s * 2.2, HC[1] + 1.2, HC[2] + 1.6], [s * 2.75, HC[1] + 1.5, HC[2] - 3.4], .5, .42, hair, 1); }
  if (hs === 'long'){ E([0, HC[1] - 2.3, HC[2] - 2.7], 2.9, 1.5, 4.7, hair); for (const s of [-1, 1]) C([s * 2.35, HC[1] + .6, HC[2] + 1.4], [s * 2.9, HC[1] + .9, HC[2] - 5], .75, .6, hair, 1); }
  if (hs === 'bob') E([0, HC[1] - .9, HC[2] - .9], 3.1, 3, 2.6, hair);
  if (hs === 'ponytail'){ C([0, HC[1] - 2.9, HC[2] + 1.6], [0, HC[1] - 4.7, HC[2] - 3.4], .95, .45, hair); E([0, HC[1] - 3, HC[2] + 1.5], 1.05, .8, .5, M.black, 2); }
 }
 // ---------- hats ----------
 const HT = on('hat') ? G : M[p.hatC || 'jet'], HT2 = on('hat') ? GD : M[p.hatC2 || p.hatC || 'jet'];
 if (hat === 'cap' || hat === 'capback'){ E([0, HC[1] - .35, HC[2] + 1.25], hr[0] + .45, hr[1] + .45, 2.75, HT); E([0, HC[1] + (hat === 'cap' ? 3.3 : -3.7), HC[2] + .95], 2.45, 2.05, .32, HT2); E([0, HC[1] - .35, HC[2] + 4], .4, .4, .22, HT2, 2); }
 if (hat === 'beanie'){ E([0, HC[1] - .4, HC[2] + 1.35], hr[0] + .5, hr[1] + .5, 3, HT); E([0, HC[1] - .4, HC[2] + .8], hr[0] + .74, hr[1] + .74, .85, HT2, 1); }
 if (hat === 'bucket'){ E([0, HC[1] - .35, HC[2] + 1.3], hr[0] + .45, hr[1] + .45, 2.75, HT); E([0, HC[1] - .2, HC[2] + 1.1], 4.2, 4.4, .36, HT2); }
 if (hat === 'durag'){ E([0, HC[1] - .5, HC[2] + .85], hr[0] + .3, hr[1] + .32, hr[2] + .05, HT); C([0, HC[1] - 2.9, HC[2] - .2], [0, HC[1] - 3.5, HC[2] - 3.6], .85, .4, HT, 1); }
 if (hat === 'hood'){ E([0, HC[1] - 1.3, HC[2] + .3], hr[0] + .9, hr[1] + .85, hr[2] + .7, TT); E([0, HC[1] - 2.6, HC[2] + 1.2], 2.3, 2.1, 2.3, TT, 1); }
 if (hat === 'headband'){ E([0, HC[1], HC[2] + .95], hr[0] * .953 + .3, hr[1] * .953 + .3, .58, HT);
  C([-.4, HC[1] - 3, HC[2] + .9], [-1.5, HC[1] - 4.3, HC[2] - 1.3], .42, .22, HT2, 1); C([.3, HC[1] - 3, HC[2] + .9], [1, HC[1] - 4.6, HC[2] - .5], .42, .22, HT2, 2); }

 const K = p.h / 64 * 1.06;
 for (const q of P){ if (typeof q[0] === 'number'){ for (let k = 0; k < 6; k++) q[k] *= K; continue; } const n = q[0] === 'e' ? 6 : 8; for (let k = 1; k <= n; k++) q[k] *= K; }
 P.seg = lod === 2 ? 10 : lod === 1 ? 7 : 5;
 return P;
}
// ---------- one shared pool for every crew, plus a kit for each kind of fighter ----------
function rng(seed){ let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const GANGS = {lav:['lav', 'lavD'], teal:['teal', 'tealD'], red:['red', 'burgundy'], gold:['mustard', 'brown'], green:['green', 'forest'], orange:['orange', 'brown'], blue:['blue', 'navy']};
const NEUTRAL = ['jet', 'jet', 'charcoal', 'heather', 'white', 'cream', 'khaki', 'brown', 'stone', 'tan'];   // nothing here can be mistaken for a crew color
function person(seed, gang, role){
 const r = rng(seed * 2654435761 >>> 0), pick = a => a[Math.floor(r() * a.length)], chance = q => r() < q;
 const g = GANGS[gang] || GANGS.lav, neutral = () => pick(NEUTRAL);
 const p = {gang:g[0], gangD:g[1], gangOn:[]};
 // who they are: the same roll for every crew and every kind of fighter
 p.skin = Math.floor(r() * 8); p.sex = chance(.5) ? 'f' : 'm';
 p.build = pick(['slim', 'avg', 'avg', 'avg', 'heavy']); p.h = (.95 + r() * .1) * (p.sex === 'f' ? .97 : 1);
 p.hairC = pick(['hBlack', 'hBlack', 'hBlack', 'hDark', 'hDark', 'hBrown', 'hAuburn', 'hBlonde', 'hGrey']);
 p.hair = pick(p.sex === 'f' ? ['long', 'bob', 'bun', 'ponytail', 'puffs', 'locs', 'braids', 'afro', 'fade'] : ['fade', 'fade', 'buzz', 'curlytop', 'afro', 'locs', 'braids', 'buzz', 'long']);
 if (p.sex === 'm') p.beard = pick([null, null, null, 'full', 'goatee', 'stache']); else p.lip = chance(.4);
 p.glasses = chance(.14) ? pick(['shades', 'clear']) : null; p.earring = chance(p.sex === 'f' ? .5 : .2); p.chain = chance(.25); p.watch = chance(.3);
 const jeans = () => pick([{t:'jeans', c:'denim', c2:'ltdenim'}, {t:'jeans', c:'ltdenim', c2:'eye'}, {t:'jeans', c:'ink', c2:'charcoal'}, {t:'jeans', c:'jet', c2:'charcoal'}]);
 const cargo = () => pick([{t:'cargo', c:'olive', c2:'forest'}, {t:'cargo', c:'khaki', c2:'brown'}, {t:'cargo', c:'jet', c2:'charcoal'}, {t:'cargo', c:'stone', c2:'heather'}]);
 const soft = t => ({t, c:pick(['heather', 'jet', 'charcoal', 'stone']), c2:pick(['white', 'ink', 'silver'])});
 const low = () => pick([{t:'low', c:'white', sole:'sole', toe:'sole'}, {t:'low', c:'jet', sole:'sole'}, {t:'low', c:'heather', sole:'sole'}, {t:'high', c:'white', sole:'sole'}, {t:'high', c:'jet', sole:'sole'}]);
 const boots = () => pick([{t:'boots', c:'tan', sole:'brown', toe:'tan'}, {t:'boots', c:'jet', sole:'ink', toe:'jet'}]);
 p.hatC = pick(['jet', 'charcoal', 'heather', 'stone']); p.hatC2 = p.hatC;
 if (role === 'brawler'){            // bare arms, wrapped hands, crew-color tank and headband, a bat
  if (p.build === 'heavy') p.build = 'avg';
  p.top = {t:pick(['tank', 'tank', 'jersey']), c:'jet', c2:'white'}; p.gangOn = ['top', 'hat']; p.hat = 'headband'; p.wraps = true;
  p.bottom = pick([soft('sweats'), soft('shorts'), jeans()]); p.shoes = low(); p.tool = 'bat'; p.glasses = null;
 } else if (role === 'shooter'){     // crew-color hoodie with the hood up or a cap, a bag across the chest, a pistol
  if (p.build === 'heavy') p.build = 'avg';
  p.top = {t:'hoodie', c:'jet'}; p.gangOn = ['top']; p.hat = pick(['hood', 'hood', 'cap', 'capback']); p.bag = true;
  p.bottom = pick([jeans(), jeans(), cargo(), soft('track')]); p.shoes = low(); p.tool = 'pistol';
 } else if (role === 'bruiser'){     // huge, a crew-color puffer vest over bare arms, a beanie, work boots, a sledgehammer
  p.build = 'huge'; p.h = 1.17 + r() * .05;
  p.top = {t:'vest', c:'jet', c3:'ink'}; p.gangOn = ['top']; p.hat = pick(['beanie', 'beanie', 'durag', null]); if (p.hair !== 'locs' && p.hair !== 'braids' && !p.hat) p.hair = 'buzz';
  p.bottom = pick([cargo(), cargo(), jeans()]); p.shoes = boots(); p.tool = 'sledge';
 } else {                            // everyone else on the block
  const tt = pick(['tee', 'longtee', 'hoodie', 'hoodie', 'puffer', 'bomber', 'track', 'jersey', 'flannel', 'denimjkt', 'tank']);
  p.top = {t:tt, c:neutral(), c2:pick(['white', 'cream', 'heather', 'jet']), c3:'ink'};
  if (tt === 'denimjkt') p.top.c = pick(['denim', 'ltdenim', 'jet']);
  if (tt === 'flannel'){ p.top.c = pick(['brown', 'heather', 'khaki', 'charcoal']); p.top.c3 = p.top.c === 'charcoal' ? 'heather' : 'ink'; }
  p.bottom = pick(tt === 'jersey' || tt === 'tank' ? [soft('shorts'), soft('sweats'), jeans()] : [jeans(), jeans(), cargo(), soft('sweats'), soft('track'), soft('shorts'), p.sex === 'f' ? {t:'leggings', c:'jet'} : jeans()]);
  p.shoes = chance(.25) ? boots() : low();
  p.hat = pick([null, null, null, null, 'cap', 'capback', 'beanie', 'durag', 'headband', 'bucket', tt === 'hoodie' ? 'hood' : null]);
  if (chance(.12)) p.pack = pick(['jet', 'khaki', 'charcoal']);
  if (chance(.3)) p.pose = 'pocket';
  const big = ['neck'];
  if (p.hat && p.hat !== 'hood') big.push('hat', 'hat');
  if (tt === 'tee' || tt === 'longtee' || tt === 'hoodie' || tt === 'track' || tt === 'jersey' || tt === 'tank' || tt === 'puffer') big.push('top', 'top', 'top');
  p.gangOn.push(pick(big)); if (chance(.5)) p.gangOn.push(pick(['armband', 'flag']));
 }
 return p;
}
// ---------- named people, and a cache so a fight does not rebuild the same pose every frame ----------
const VICEROY = {skin:4, sex:'m', build:'slim', h:1.06, hairC:'hBlack', hair:'pomp', beard:'stache', earring:true, gang:'lav', gangD:'lavD', gangOn:[],
 top:{t:'suit', c:'lav', c2:'cream', c3:'blue'}, bottom:{t:'slacks', c:'lav'}, shoes:{t:'boots', c:'blue', sole:'ink', toe:'blue'}, ruffle:true, cape:true, guitar:true};
const NAMED = {viceroy:VICEROY, viceroy_tied:Object.assign({}, VICEROY, {guitar:false, tied:true})};
const SPECS = new Map(), CACHE = new Map();
// a look is a name ('viceroy') or 'm|seed|crew color|role'
function spec(look){ let p = SPECS.get(look); if (!p){ if (NAMED[look]) p = NAMED[look]; else { const a = String(look).split('|'); p = person(+a[1] || 1, a[2] || 'lav', a[3] || null); } SPECS.set(look, p); } return p; }
function fig(look, frame, mode, lod){
 const k = look + '|' + (frame & 3) + '|' + mode + '|' + lod; let b = CACHE.get(k);
 if (!b){ if (CACHE.size > 1200) CACHE.clear(); b = build(spec(look), frame & 3, mode, lod); CACHE.set(k, b); }
 return b; }
return {EXTRA, M, build, person, GANGS, spec, fig};
})();
if (typeof module !== 'undefined') module.exports = MINI;
