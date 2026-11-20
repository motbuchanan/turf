// base.js · the reusable base-building engine (grid, footprints, placement, wall joins, paths, seeded random).
// No game names live here: every game hands in its own building defs, unlock table and starter template.
// Ravenmarrow 3.0 · Nov 18 2026
const BASE = (() => {
'use strict';
const W = 28, H = 28;   // grid size in tiles

// seeded random: mulberry32. Every sim and every replay draws from this, never Math.random
function rng(seed){ let a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// defs: {kind: {fp:[w,h]}}; an item is {k, x, y}
function fpOf(defs, k){ const d = defs[k]; return d && d.fp ? d.fp : [1, 1]; }
function cells(defs, it){ const f = fpOf(defs, it.k), o = []; for (let y = 0; y < f[1]; y++) for (let x = 0; x < f[0]; x++) o.push([it.x + x, it.y + y]); return o; }
// the grid as an array of item indexes (-1 empty)
function grid(layout, defs, w, h){ w = w || W; h = h || H; const g = new Int16Array(w * h).fill(-1);
 (layout.items || []).forEach((it, i) => cells(defs, it).forEach(([x, y]) => { if (x >= 0 && y >= 0 && x < w && y < h) g[y * w + x] = i; }));
 return {w, h, g, at(x, y){ return x < 0 || y < 0 || x >= w || y >= h ? -2 : g[y * w + x]; }}; }
// can this item sit here? (ignoring the item at index skip, the one being moved)
function fits(layout, it, defs, skip){ const gr = grid(layout, defs);
 return cells(defs, it).every(([x, y]) => { const v = gr.at(x, y); return v === -1 || (skip !== undefined && v === skip); }); }

// walls join to wall neighbours: bit 1 north, 2 east, 4 south, 8 west
function wallShape(layout, x, y){ const set = new Set((layout.items || []).filter(i => i.k === 'wall').map(i => i.x + ',' + i.y));
 return (set.has(x + ',' + (y - 1)) ? 1 : 0) | (set.has((x + 1) + ',' + y) ? 2 : 0) | (set.has(x + ',' + (y + 1)) ? 4 : 0) | (set.has((x - 1) + ',' + y) ? 8 : 0); }

// starter layout from a template the game supplies: {items:[{k,x,y}], ring:[x0,y0,x1,y1], gate:[[x,y],...]}
// counts: how many walls the unlock table allows. Anything that would overlap is dropped, never stacked
function starterLayout(defs, tpl, wallCount){
 const L = {v:1, items:[]};
 tpl.items.forEach(it => { const c = {k:it.k, x:it.x, y:it.y}; if (fits(L, c, defs)) L.items.push(c); });
 const [x0, y0, x1, y1] = tpl.ring, gate = new Set((tpl.gate || []).map(p => p[0] + ',' + p[1])), ring = [];
 for (let x = x0; x <= x1; x++){ ring.push([x, y0]); }
 for (let y = y0 + 1; y <= y1; y++){ ring.push([x1, y]); }
 for (let x = x1 - 1; x >= x0; x--){ ring.push([x, y1]); }
 for (let y = y1 - 1; y > y0; y--){ ring.push([x0, y]); }
 let n = 0; for (const [x, y] of ring){ if (n >= wallCount) break; if (gate.has(x + ',' + y)) continue; const c = {k:'wall', x, y}; if (fits(L, c, defs)){ L.items.push(c); n++; } }
 return L; }

// tile-centre of an item's footprint
function centre(defs, it){ const f = fpOf(defs, it.k); return [it.x + f[0] / 2, it.y + f[1] / 2]; }

// shortest walk on the tile grid (4 ways), passable(x, y) decides; the start and goal tiles are always allowed. Returns [[x,y],...] or null
function path(gr, from, to, passable){
 const w = gr.w, h = gr.h, key = (x, y) => y * w + x, prev = new Int32Array(w * h).fill(-1), seen = new Uint8Array(w * h);
 const ok = (x, y) => x >= 0 && y >= 0 && x < w && y < h && ((x === to[0] && y === to[1]) || passable(x, y));
 if (from[0] < 0 || from[1] < 0 || from[0] >= w || from[1] >= h) return null;
 const q = [from]; seen[key(from[0], from[1])] = 1;
 for (let qi = 0; qi < q.length; qi++){ const [x, y] = q[qi];
  if (x === to[0] && y === to[1]){ const out = []; let k = key(x, y); while (k !== -1){ out.push([k % w, Math.floor(k / w)]); k = prev[k]; } return out.reverse(); }
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const nx = x + dx, ny = y + dy; if (!ok(nx, ny) || seen[key(nx, ny)]) continue; seen[key(nx, ny)] = 1; prev[key(nx, ny)] = key(x, y); q.push([nx, ny]); } }
 return null; }

// can anything walk in from the edge of the map to touch this item? (raiders and villagers need a way in)
function reachable(layout, defs, it){
 const gr = grid(layout, defs), w = gr.w, h = gr.h, seen = new Uint8Array(w * h), q = [];
 for (let x = 0; x < w; x++) for (const y of [0, h - 1]) if (gr.at(x, y) === -1 && !seen[y * w + x]){ seen[y * w + x] = 1; q.push([x, y]); }
 for (let y = 0; y < h; y++) for (const x of [0, w - 1]) if (gr.at(x, y) === -1 && !seen[y * w + x]){ seen[y * w + x] = 1; q.push([x, y]); }
 const touch = new Set(); const f = fpOf(defs, it.k);
 for (let x = it.x - 1; x <= it.x + f[0]; x++) for (let y = it.y - 1; y <= it.y + f[1]; y++){ const inX = x >= it.x && x < it.x + f[0], inY = y >= it.y && y < it.y + f[1]; if ((inX && !inY) || (inY && !inX)) touch.add(x + ',' + y); }
 for (let i = 0; i < q.length; i++){ const [x, y] = q[i]; if (touch.has(x + ',' + y)) return true;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const nx = x + dx, ny = y + dy; if (gr.at(nx, ny) !== -1 || seen[ny * w + nx]) continue; seen[ny * w + nx] = 1; q.push([nx, ny]); } }
 return false; }
// a layout the game can accept: on the grid, nothing overlapping, counts within max, every required kind present, the key building reachable
// max: {kind: n}; need: [kinds]; key: the kind that must be reachable. Returns {ok, why, k}
function validLayout(layout, defs, max, need, key){
 const items = layout.items || [], seen = new Set(), count = {};
 for (const it of items){ const f = fpOf(defs, it.k);
  if (!Number.isInteger(it.x) || !Number.isInteger(it.y) || it.x < 0 || it.y < 0 || it.x + f[0] > W || it.y + f[1] > H) return {ok:false, why:'bounds', k:it.k};
  for (const [x, y] of cells(defs, it)){ const c = x + ',' + y; if (seen.has(c)) return {ok:false, why:'overlap', k:it.k}; seen.add(c); }
  count[it.k] = (count[it.k] || 0) + 1; }
 for (const k in count) if (max[k] != null && count[k] > max[k]) return {ok:false, why:'count', k};
 for (const k of need || []) if (!count[k]) return {ok:false, why:'missing', k};
 if (key){ const it = items.find(i => i.k === key); if (it && !reachable(layout, defs, it)) return {ok:false, why:'sealed', k:key}; }
 return {ok:true}; }

// ---------- RAID SIM (v3.3): a raid fought on a layout, worked out tick by tick from a recipe ----------
// The recipe holds everything the fight needs (numbers already worked out by the game), so a replay years later
// comes out the same. Fixed 10 ticks a second, seeded random only, plain arithmetic and sqrt (same on every phone).
// recipe: {simVer, seed, items:[{key,k,x,y,fw,fh,hp,role:'core'|'bld'|'wall'|'tower'|'trap'|'plot',range,dmg,rate}],
//  attackers:[{look,hp,atk,def,speed,range,fly,prefer:'any'|'def',wallMult,splash}],
//  defenders:[{look,hp,atk,def,speed,range,hero}], guard:0..1 (damage cut for defenders inside the walls)}
// Turf (Nov 19 2026): R.deploys turns on hands-on attacks. Each attacker waits off the map until a deploy {i, x, y, t} puts it
// at (x, y) on tick t; raidStart() runs the fight one tick at a time so a player can add deploys while it runs, and simRaid()
// with the saved deploys plays the same fight again. Without R.deploys every line below behaves exactly as before.
// Deploy mode also: the fight runs past the core going down (stars are scored by the game), ends when every scoring building
// is down, when R.endAt is reached (the player pressed End), or when every attacker is placed and down. R.maxT sets the length.
const SIM_VER = 1, DEPLOY_VER = 1, TICK = .1, MAXT = 900;
function raidStart(R, opt){
 opt = opt || {};
 const dep = Array.isArray(R.deploys), maxT = R.maxT || MAXT;
 const rand = rng(R.seed >>> 0), r4 = v => Math.round(v * 10000) / 10000;
 const items = R.items.map((it, i) => ({i, key:it.key, k:it.k, x:it.x, y:it.y, fw:it.fw, fh:it.fh, role:it.role, max:it.hp || 0, hp:it.hp || 0, range:it.range || 0, dmg:it.dmg || 0, rate:it.rate || 1, cd:0, dealt:0, hit:new Set()}));
 const solid = items.filter(b => b.role !== 'plot' && b.role !== 'trap');
 const scoring = items.filter(b => b.role === 'core' || b.role === 'bld' || b.role === 'tower');
 const totalHp = scoring.reduce((s, b) => s + b.max, 0) || 1;
 const occ = new Int16Array(W * H).fill(-1);
 solid.forEach(b => { for (let y = b.y; y < b.y + b.fh; y++) for (let x = b.x; x < b.x + b.fw; x++) if (x >= 0 && y >= 0 && x < W && y < H) occ[y * W + x] = b.i; });
 const core = items.find(b => b.role === 'core');
 // spawn: one side of the map, chosen by the seed
 const units = [];
 if (dep) R.attackers.forEach((a, n) => {
  units.push({id:n, side:'a', look:a.look, x:0, y:0, hp:a.hp, max:a.hp, atk:a.atk, def:a.def || 0, speed:a.speed, range:a.range, fly:!!a.fly, prefer:a.prefer || 'any', wallMult:a.wallMult || 1, splash:a.splash || 0,
   delay:0, wait:true, cd:Math.floor(rand() * 8), tgt:null, path:null, pi:0, mode:0, face:2, dealt:0, alive:true}); });
 else { const side = Math.floor(rand() * 4);
 R.attackers.forEach((a, n) => { const t = Math.floor(rand() * 16) - 8 + W / 2, e = .3;
  const p = side === 0 ? [t, e] : side === 1 ? [W - e, t] : side === 2 ? [t, H - e] : [e, t];
  units.push({id:n, side:'a', look:a.look, x:r4(p[0]), y:r4(p[1]), hp:a.hp, max:a.hp, atk:a.atk, def:a.def || 0, speed:a.speed, range:a.range, fly:!!a.fly, prefer:a.prefer || 'any', wallMult:a.wallMult || 1, splash:a.splash || 0,
   delay:Math.floor(n * 3), cd:Math.floor(rand() * 8), tgt:null, path:null, pi:0, mode:0, face:0, dealt:0, alive:true}); }); }
 const posts = [];
 const cx = core ? core.x + core.fw / 2 : W / 2, cy = core ? core.y + core.fh + .6 : H / 2;
 R.defenders.forEach((d, n) => { const ang = n * 7 % 12, ox = ((ang % 4) - 1.5) * .7, oy = (Math.floor(ang / 4) - .5) * .7;
  units.push({id:100 + n, side:'d', look:d.look, hero:!!d.hero, x:r4(cx + ox), y:r4(cy + oy), px:r4(cx + ox), py:r4(cy + oy), hp:d.hp, max:d.hp, atk:d.atk, def:d.def || 0, speed:d.speed, range:d.range,
   cd:Math.floor(rand() * 8), delay:0, tgt:null, mode:2, face:2, dealt:0, alive:true}); });
 const guard = R.guard || 0;
 const dist2rect = (u, b) => { const dx = Math.max(b.x - u.x, 0, u.x - (b.x + b.fw)), dy = Math.max(b.y - u.y, 0, u.y - (b.y + b.fh)); return Math.sqrt(dx * dx + dy * dy); };
 const dist = (a, b) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
 const hurt = (target, amount) => { const d = Math.max(1, amount * 60 / (60 + (target.def || 0))); target.hp = r4(target.hp - d); return d; };
 // a walk from tile s to any tile within reach of building b: free tiles cost 1, standing walls cost 6 (they get broken), buildings block
 function route(u, b){
  const sx = Math.max(0, Math.min(W - 1, Math.floor(u.x))), sy = Math.max(0, Math.min(H - 1, Math.floor(u.y))), N = W * H;
  const cost = new Float64Array(N).fill(1e9), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N), heap = [];
  const push = (c, k) => { heap.push([c, k]); let i = heap.length - 1; while (i){ const p = (i - 1) >> 1; if (heap[p][0] < heap[i][0] || (heap[p][0] === heap[i][0] && heap[p][1] <= heap[i][1])) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length){ heap[0] = last; let i = 0; for (;;){ const l = 2 * i + 1, r = l + 1; let m = i;
   if (l < heap.length && (heap[l][0] < heap[m][0] || (heap[l][0] === heap[m][0] && heap[l][1] < heap[m][1]))) m = l; if (r < heap.length && (heap[r][0] < heap[m][0] || (heap[r][0] === heap[m][0] && heap[r][1] < heap[m][1]))) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  const reach = u.range + (dep ? .05 : .5);   // deploy mode walks all the way into attack reach (the wider .5 left ranged troops parked just short)
  cost[sy * W + sx] = 0; push(0, sy * W + sx);
  while (heap.length){ const [c, k] = pop(); if (done[k]) continue; done[k] = 1; const x = k % W, y = (k - x) / W;
   if (dist2rect({x:x + .5, y:y + .5}, b) <= reach){ const out = []; let q = k; while (q !== -1){ out.push([q % W + .5, Math.floor(q / W) + .5]); q = prev[q]; } return out.reverse(); }
   for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const nk = ny * W + nx, o = occ[nk];
    let step = 1; if (o >= 0){ const ob = items[o]; if (!(ob.hp > 0)) step = 1; else if (ob.role === 'wall') step = 6; else continue; }
    if (c + step < cost[nk]){ cost[nk] = c + step; prev[nk] = k; push(c + step, nk); } } }
  return null; }
 function pickTarget(u){
  let best = null, bd = 1e9;
  const pool = scoring.filter(b => b.hp > 0), defs = pool.filter(b => b.role === 'tower');
  const list = u.prefer === 'def' && defs.length ? defs : pool;
  for (const b of list){ const d = dist2rect(u, b); if (d < bd - 1e-9){ bd = d; best = b; } }
  return best; }
 const frames = [], shots = [];
 let t = 0, over = null;
 const snap = () => { if (!opt.record){ if (dep) shots.length = 0; return; } frames.push({u:units.map(u => [u.id, r4(u.x), r4(u.y), Math.max(0, Math.round(u.hp)), u.mode, u.face, u.alive && u.delay <= 0 && !u.wait ? 1 : 0]), b:items.map(b => Math.max(0, Math.round(b.hp))), s:shots.splice(0)}); };
 // deploys waiting for their tick (sorted by tick, stable), how many are on the map, and the End tick if the player pressed End
 const queue = dep ? R.deploys.map(d => ({i:d.i | 0, x:+d.x, y:+d.y, t:Math.max(1, d.t | 0)})).sort((a, b) => a.t - b.t) : [];
 let qi = 0, endAt = dep ? (R.endAt | 0) : 0;
 const placeDue = () => { while (qi < queue.length && queue[qi].t <= t){ const d = queue[qi++], u = units[d.i];
  if (!u || u.side !== 'a' || !u.wait){ d.skip = true; continue; }
  u.wait = false; u.x = r4(Math.max(0, Math.min(W - .01, d.x))); u.y = r4(Math.max(0, Math.min(H - .01, d.y))); } };
 const faceTo = (u, x, y) => { const dx = x - u.x, dy = y - u.y; u.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 0 : 2); };
 snap();
 t = 1;
 function step(){
  if (over || t > maxT) return false;
  if (dep) placeDue();
  const live = units.filter(u => u.alive && u.delay <= 0 && !u.wait);
  const att = live.filter(u => u.side === 'a'), def = live.filter(u => u.side === 'd');
  // towers fire at the nearest raider in range
  for (const b of items){ if (b.role !== 'tower' || !(b.hp > 0)) continue; if (b.cd > 0){ b.cd--; continue; }
   let tg = null, td = 1e9; for (const a of att){ const d = dist2rect(a, b); if (d <= b.range && d < td - 1e-9){ td = d; tg = a; } }
   if (tg){ b.dealt += hurt(tg, b.dmg); b.cd = Math.round(b.rate / TICK); shots.push([b.x + b.fw / 2, b.y + b.fh / 2, tg.x, tg.y, 0]); } }
  // traps hurt each raider once as they cross
  for (const b of items){ if (b.role !== 'trap') continue; for (const a of att){ if (a.fly || b.hit.has(a.id)) continue; if (a.x >= b.x && a.x <= b.x + b.fw && a.y >= b.y && a.y <= b.y + b.fh){ b.hit.add(a.id); b.dealt += hurt(a, b.dmg); shots.push([a.x, a.y, a.x, a.y, 2]); } } }
  // defenders: engage the nearest raider near the Hall, otherwise go back to post
  for (const u of def){ let tg = null, td = 1e9; for (const a of att){ if (!(a.hp > 0)) continue; const d = dist(u, a), dp = Math.sqrt((a.x - u.px) * (a.x - u.px) + (a.y - u.py) * (a.y - u.py)); if (dp < 7 && d < td - 1e-9){ td = d; tg = a; } }
   if (u.cd > 0) u.cd--;
   if (tg){ faceTo(u, tg.x, tg.y);
    if (td <= u.range + .35){ u.mode = 1; if (!u.cd){ u.dealt += hurt(tg, u.atk); u.cd = 8; if (u.range > 1.2) shots.push([u.x, u.y, tg.x, tg.y, 1]); } }
    else { u.mode = 0; const k = Math.min(1, u.speed * TICK / td); u.x = r4(u.x + (tg.x - u.x) * k); u.y = r4(u.y + (tg.y - u.y) * k); } }
   else { const d = Math.sqrt((u.px - u.x) * (u.px - u.x) + (u.py - u.y) * (u.py - u.y)); if (d > .05){ u.mode = 0; faceTo(u, u.px, u.py); const k = Math.min(1, u.speed * TICK / d); u.x = r4(u.x + (u.px - u.x) * k); u.y = r4(u.y + (u.py - u.y) * k); } else { u.mode = 2; u.face = 2; } } }
  // raiders: fight a defender in their face, else walk to the target, breaking walls in the way
  for (const u of att){ if (!(u.hp > 0)) continue; if (u.cd > 0) u.cd--;
   let foe = null, fd = 1e9; for (const d of def){ if (!(d.hp > 0)) continue; const dd = dist(u, d); if (dd < Math.max(1.1, u.range + .3) && dd < fd - 1e-9){ fd = dd; foe = d; } }
   if (foe){ faceTo(u, foe.x, foe.y); u.mode = 1; if (!u.cd){ u.dealt += hurt(foe, u.atk * (1 - guard)); u.cd = 8; if (u.range > 1.2) shots.push([u.x, u.y, foe.x, foe.y, 3]); } continue; }
   if (!u.tgt || !(u.tgt.hp > 0)){ u.tgt = pickTarget(u); u.path = null; if (!u.tgt) continue; }
   const b = u.tgt, d = dist2rect(u, b);
   if (d <= u.range + .05){ u.mode = 1; faceTo(u, b.x + b.fw / 2, b.y + b.fh / 2); if (!u.cd){ const dmg = hurt(b, u.atk); u.dealt += dmg; u.cd = 8; if (u.range > 1.2) shots.push([u.x, u.y, b.x + b.fw / 2, b.y + b.fh / 2, 3]);
     if (u.splash) for (const o of scoring){ if (o !== b && o.hp > 0 && dist2rect({x:b.x + b.fw / 2, y:b.y + b.fh / 2}, o) < u.splash) hurt(o, u.atk * .4); } } continue; }
   if (u.fly){ u.mode = 0; const tx = b.x + b.fw / 2, ty = b.y + b.fh / 2, dd = Math.sqrt((tx - u.x) * (tx - u.x) + (ty - u.y) * (ty - u.y)); faceTo(u, tx, ty); const k = Math.min(1, u.speed * TICK / dd); u.x = r4(u.x + (tx - u.x) * k); u.y = r4(u.y + (ty - u.y) * k); continue; }
   if (!u.path){ u.path = route(u, b); u.pi = 0; if (!u.path){ u.tgt = null; continue; } }
   const n = u.path[Math.min(u.pi, u.path.length - 1)], o = occ[Math.floor(n[1]) * W + Math.floor(n[0])];
   if (o >= 0 && items[o].hp > 0 && items[o].role === 'wall'){ const w = items[o]; u.mode = 1; faceTo(u, n[0], n[1]); if (!u.cd){ u.dealt += hurt(w, u.atk * u.wallMult); u.cd = 8; if (!(w.hp > 0)) u.path = null; } continue; }
   const dd = Math.sqrt((n[0] - u.x) * (n[0] - u.x) + (n[1] - u.y) * (n[1] - u.y));
   if (dd < .06){ u.pi++; if (u.pi >= u.path.length) u.path = null; continue; }
   u.mode = 0; faceTo(u, n[0], n[1]); const k = Math.min(1, u.speed * TICK / dd); u.x = r4(u.x + (n[0] - u.x) * k); u.y = r4(u.y + (n[1] - u.y) * k); }
  // deaths, arrivals
  for (const u of units){ if (u.wait) continue; if (u.delay > 0){ u.delay--; continue; } if (u.alive && !(u.hp > 0)){ u.alive = false; u.hp = 0; } }
  for (const b of items) if (b.hp < 0) b.hp = 0;
  if (!dep){
   if (core && !(core.hp > 0)) over = 'core';
   else if (!units.some(u => u.side === 'a' && (u.alive || u.delay > 0))) over = 'cleared'; }
  else {
   if (!scoring.some(b => b.hp > 0)) over = 'all';
   else if (endAt && t >= endAt) over = 'end';
   else if (qi >= queue.length && !units.some(u => u.side === 'a' && (u.wait || u.alive))) over = 'cleared'; }
  snap();
  t++;
  return true;
 }
 // live play: put attacker i at (x, y) on the next tick. False if it is already placed or queued, or the fight is over.
 function deploy(i, x, y){
  const u = units[i]; if (!dep || over || t > maxT || !u || u.side !== 'a' || !u.wait) return false;
  for (let k = qi; k < queue.length; k++) if (queue[k].i === i) return false;
  queue.push({i, x:r4(x), y:r4(y), t}); return true; }
 function end(){ if (dep && !over && !endAt) endAt = t; }
 function result(){
 const lost = scoring.reduce((s, b) => s + (b.max - Math.max(0, b.hp)), 0), pct = Math.round(100 * lost / totalHp);
 const coreDown = !!core && !(core.hp > 0), win = !coreDown && pct < 50;
 // the defender who did the most: a hero, a band, or a tower
 let best = null; units.filter(u => u.side === 'd').forEach(u => { if (!best || u.dealt > best.dealt) best = {look:u.look, hero:u.hero, dealt:u.dealt}; });
 items.filter(b => b.role === 'tower' || b.role === 'trap').forEach(b => { if (!best || b.dealt > best.dealt) best = {k:b.k, dealt:b.dealt}; });
 const result = {simVer:SIM_VER, win, pct, coreDown, ticks:t - 1, ended:over || 'time', kills:units.filter(u => u.side === 'a' && !u.alive).length, raiders:R.attackers.length,
  defendersLeft:units.filter(u => u.side === 'd' && u.alive).map(u => u.id - 100), defHp:units.filter(u => u.side === 'd').map(u => u.alive ? Math.round(u.hp) : 0), attHp:units.filter(u => u.side === 'a').map(u => u.alive ? Math.round(u.hp) : 0), best:best ? {look:best.look, k:best.k, hero:best.hero, dealt:Math.round(best.dealt)} : null};
 // a fingerprint of the whole fight, for the same-recipe-same-fight test
 let h = 2166136261 >>> 0; const mix = v => { h = Math.imul(h ^ (Math.round(v * 1000) | 0), 16777619) >>> 0; };
 units.forEach(u => { mix(u.x); mix(u.y); mix(u.hp); mix(u.dealt); }); items.forEach(b => mix(b.hp)); mix(t);
 result.hash = h;
 if (dep){ result.deployVer = DEPLOY_VER; result.allDown = !scoring.some(b => b.hp > 0); result.endAt = over === 'end' ? endAt : 0;
  result.deploys = queue.slice(0, qi).filter(d => !d.skip).map(d => ({i:d.i, x:d.x, y:d.y, t:d.t})); }
 return result;
 }
 return {step, deploy, end, result, frames, done:() => !!over || t > maxT, tick:() => t, units, items,
  frame:() => frames[frames.length - 1], placed:i => !!units[i] && units[i].side === 'a' && !units[i].wait};
}
function simRaid(R, opt){ const s = raidStart(R, opt); while (s.step()); return {result:s.result(), frames:s.frames}; }
// where a hand drop is allowed: on the map and not on or right beside any building or fence (traps stay hidden, so they don't count)
function canDrop(R, x, y){
 if (!(x >= 0 && y >= 0 && x < W && y < H)) return false;
 const ix = Math.floor(x), iy = Math.floor(y);
 for (const b of R.items){ if (b.role === 'trap' || b.role === 'plot') continue;
  if (ix >= b.x - 1 && ix <= b.x + b.fw && iy >= b.y - 1 && iy <= b.y + b.fh) return false; }
 return true; }
function dropZone(R){ const out = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!canDrop(R, x + .5, y + .5)) out.push([x, y]); return out; }

return {W, H, rng, path, reachable, validLayout, simRaid, raidStart, canDrop, dropZone, SIM_VER, DEPLOY_VER, TICK, fpOf, cells, grid, fits, wallShape, starterLayout, centre};
})();
if (typeof module !== 'undefined') module.exports = BASE;
