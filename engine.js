// ===== TURF ENGINE =====
// Game content for Turf: troops, buildings, crews and the fights built from them. The fight rules live in base.js (BASE);
// this file only hands it numbers. Works in Node (tests) and in the page (build.py inlines it after base.js).
const TURF = (() => {
const B = (typeof BASE !== 'undefined') ? BASE : require('./base.js');

// ---------- troops ----------
// role notes: prefer 'def' goes for defenses first; wallMult is how hard it hits fences.
const UNITS = {
 brawler:{name:'Brawler', look:'brawler', hp:150, atk:15, speed:1.7, range:.7, prefer:'any', wallMult:1.4, size:1,
  line:'Bats and fists. Cheap, fast, hits whatever is closest.'},
 shooter:{name:'Shooter', look:'shooter', hp:70, atk:12, speed:1.45, range:3.4, prefer:'any', wallMult:.6, size:1,
  line:'Pistol. Fires over fences. Keep him behind someone.'},
 bruiser:{name:'Bruiser', look:'bruiser', hp:620, atk:20, speed:.95, range:.8, prefer:'def', wallMult:1.8, size:5,
  line:'Big and slow. Walks straight at the guns and soaks the fire.'}
};
const ORDER = ['brawler', 'shooter', 'bruiser'];

// ---------- buildings ----------
// fp is the footprint in tiles; role is what the fight sim does with it (core, bld, tower, wall).
const BDEFS = {
 house:{name:'Main House', fp:[3, 3], role:'core', hp:650},
 rowhouse:{name:'Rowhouse', fp:[2, 3], role:'bld', hp:420},
 store:{name:'Corner Store', fp:[3, 2], role:'bld', hp:460},
 stash:{name:'Cash Stash', fp:[2, 2], role:'bld', hp:380},
 porch:{name:'Porch Gunner', fp:[2, 2], role:'tower', hp:420, range:5.2, dmg:10, rate:1.0},
 roof:{name:'Rooftop Shooter', fp:[2, 2], role:'tower', hp:360, range:6.5, dmg:11, rate:1.5},
 fence:{name:'Chain-link Fence', fp:[1, 1], role:'wall', hp:240},
 hustle:{name:'Corner Hustle', fp:[2, 2], role:'bld', hp:300},
 run:{name:'Supply Run', fp:[2, 2], role:'bld', hp:300},
 supstash:{name:'Supply Stash', fp:[2, 2], role:'bld', hp:380},
 gym:{name:'The Gym', fp:[3, 2], role:'bld', hp:480},
 pad:{name:'Crash Pad', fp:[2, 3], role:'bld', hp:420}
};

// ---------- rival crews ----------
const CREWS = [
 {id:'boombox', name:'The Boombox Kings', boss:'Pops Cassette', crew:'kb_crew', bossLook:'kb_boss',
  defender:{look:'kb_crew', hp:120, atk:7, speed:1.4, range:2.8}}
];

// ---------- the rescue: the Boombox Kings' block, the Viceroy held at the Main House ----------
function fenceRing(x0, y0, x1, y1, gaps){
 const out = [], skip = new Set(gaps.map(g => g.join(',')));
 for (let x = x0; x <= x1; x++){ out.push([x, y0]); out.push([x, y1]); }
 for (let y = y0 + 1; y < y1; y++){ out.push([x0, y]); out.push([x1, y]); }
 return out.filter(p => !skip.has(p.join(',')));
}
const RESCUE_BLOCK = (() => {
 const items = [
  {k:'house', x:12, y:12}, {k:'rowhouse', x:9, y:8}, {k:'rowhouse', x:17, y:8}, {k:'store', x:12, y:17},
  {k:'stash', x:9, y:15}, {k:'stash', x:18, y:15}, {k:'porch', x:12, y:9}, {k:'porch', x:16, y:12}, {k:'roof', x:15, y:15}];
 fenceRing(7, 6, 21, 20, [[14, 6], [7, 13], [21, 13], [14, 20]]).forEach(([x, y]) => items.push({k:'fence', x, y}));
 return items.map((it, i) => Object.assign({key:'r' + i}, it));
})();

// a fight item from a placed building: footprint and fight numbers from BDEFS
function fightItem(it){
 const d = BDEFS[it.k], f = d.fp;
 return {key:it.key, k:it.k, x:it.x, y:it.y, fw:f[0], fh:f[1], hp:d.hp, role:d.role, range:d.range || 0, dmg:d.dmg || 0, rate:d.rate || 1};
}
// an army line-up: {brawler:6, shooter:4, bruiser:2} -> attacker list grouped by type, in ORDER
function army(counts){
 const list = [];
 ORDER.forEach(k => { const u = UNITS[k]; for (let n = 0; n < (counts[k] || 0); n++) list.push({type:k, look:u.look, hp:u.hp, atk:u.atk, speed:u.speed, range:u.range, prefer:u.prefer, wallMult:u.wallMult}); });
 return list;
}
const RESCUE_ARMY = {brawler:6, shooter:4, bruiser:2};
function rescueRecipe(seed){
 const crew = CREWS[0], d = crew.defender;
 return {deployVer:B.DEPLOY_VER, seed:seed >>> 0, maxT:1800, guard:0, mode:'rescue',
  items:RESCUE_BLOCK.map(fightItem),
  attackers:army(RESCUE_ARMY),
  defenders:[0, 1, 2].map(() => ({look:d.look, hp:d.hp, atk:d.atk, speed:d.speed, range:d.range})),
  deploys:[]};
}
// stars: one for half the block down, one for the Main House down, one for everything down
function starsFor(r){ return (r.pct >= 50 ? 1 : 0) + (r.coreDown ? 1 : 0) + (r.allDown ? 1 : 0); }
// a report keeps the recipe (with the deploys and End tick the fight produced) so Watch can play it again
function reportFrom(R, result){
 return {at:0, simVer:B.SIM_VER, deployVer:B.DEPLOY_VER, mode:R.mode,
  recipe:Object.assign({}, R, {deploys:result.deploys, endAt:result.endAt || 0}),
  stars:starsFor(result), pct:result.pct, hash:result.hash};
}

// ---------- your block (v0.3) ----------
// cost is [Cash, Supplies] to place one. cap is how many you may own at Main House level 1, 2, 3 and 4.
const HOME = {
 house:{cap:[1, 1, 1, 1], cost:[0, 0], line:'Your first roof. Level it up to open more of the lot and raise every limit.'},
 hustle:{cap:[1, 2, 2, 3], cost:[150, 0], line:'A table on the corner. Pays Cash after every fight you run.'},
 run:{cap:[1, 2, 2, 3], cost:[150, 0], line:'A van that knows people. Brings Supplies after every fight you run.'},
 stash:{cap:[1, 1, 2, 2], cost:[0, 100], line:'Holds your Cash.'},
 supstash:{cap:[1, 1, 2, 2], cost:[100, 0], line:'Holds your Supplies.'},
 gym:{cap:[1, 1, 1, 1], cost:[200, 100], line:'Where the crew trains. Level 2 brings in Bruisers.'},
 pad:{cap:[1, 1, 2, 2], cost:[200, 100], line:'Beds for the crew. More beds, bigger crew.'},
 store:{cap:[0, 1, 1, 1], cost:[400, 200], line:'A corner store on your lot. 20% more Supplies from every fight.'},
 porch:{cap:[1, 2, 3, 4], cost:[0, 200], line:'A gunner behind sandbags. Covers the ground around him.'},
 roof:{cap:[0, 1, 2, 3], cost:[0, 350], line:'A shooter up high. Long reach, slower shots.'},
 fence:{cap:[24, 44, 64, 90], cost:[0, 10], line:'Chain-link. Slows anyone on foot.'}
};
const SHOP = ['hustle', 'run', 'stash', 'supstash', 'pad', 'store', 'porch', 'roof'];
const MAXLV = {house:4, fence:1}, HOUSE_UP = [null, [600, 400], [1500, 1000], [3500, 2500]];
const UNLOCKS = {brawler:1, shooter:1, bruiser:2};          // the Gym level that brings each fighter in
const TRAIN = {brawler:20, shooter:30, bruiser:150};        // Cash each
const SIZE = {brawler:1, shooter:1, bruiser:5};             // beds each
const START = {cash:500, sup:300, army:{brawler:6, shooter:4, bruiser:0}};
function maxLv(k){ return MAXLV[k] || 3; }
function trainCost(k){ return TRAIN[k]; }
// the price of the next level as [Cash, Supplies], or null at the top
function upgradeCost(k, lv){
 if (lv >= maxLv(k)) return null;
 if (k === 'house') return HOUSE_UP[lv];
 const c = HOME[k].cost; return [0, Math.round((c[0] + c[1] + 100) * lv * 1.2 / 10) * 10];
}
// the open part of the lot grows a ring with every Main House level
function lotsOpen(houseLv){ const n = Math.max(1, Math.min(4, houseLv | 0)) - 1; return {x0:10 - n, y0:9 - n, x1:18 + n, y1:17 + n}; }
function houseLv(block){ const h = block.find(i => i.k === 'house'); return h ? h.lv || 1 : 1; }
function count(block, k){ let n = 0; for (const i of block) if (i.k === k) n++; return n; }
function capFor(k, lv){ const c = HOME[k] && HOME[k].cap; return c ? c[Math.max(1, Math.min(4, lv)) - 1] : 0; }
function sumLv(block, k){ let n = 0; for (const i of block) if (i.k === k) n += i.lv || 1; return n; }
function storeCap(block){ return {cash:1000 + 1500 * sumLv(block, 'stash'), sup:1000 + 1500 * sumLv(block, 'supstash')}; }
function armyCap(block){ let n = 0; for (const i of block) if (i.k === 'pad') n += 14 + 6 * (i.lv || 1); return n; }
function armySize(a){ let n = 0; for (const k of ORDER) n += (a[k] || 0) * SIZE[k]; return n; }
function gymLv(block){ let n = 0; for (const i of block) if (i.k === 'gym') n = Math.max(n, i.lv || 1); return n; }
function payout(block){ return {cash:60 * sumLv(block, 'hustle'), sup:40 * sumLv(block, 'run')}; }
function lootFor(res, block){ const st = starsFor(res), bonus = count(block, 'store') ? 1.2 : 1;
 return {cash:Math.round(320 * res.pct / 100) + 40 * st, sup:Math.round(200 * res.pct / 100 * bonus)}; }
function starterBlock(){
 return [['house', 13, 12], ['gym', 10, 9], ['pad', 17, 9], ['stash', 10, 15], ['run', 13, 16], ['hustle', 16, 16], ['porch', 10, 12]]
  .map((a, i) => ({key:'b' + (i + 1), k:a[0], x:a[1], y:a[2], lv:1}));
}
// does building k fit with its corner at x, y: inside the open lot and on nothing else (its own old spot does not count)
function fitsAt(block, key, k, x, y){
 const f = BDEFS[k].fp, L = lotsOpen(houseLv(block));
 if (x < L.x0 || y < L.y0 || x + f[0] - 1 > L.x1 || y + f[1] - 1 > L.y1) return false;
 for (const i of block){ if (i.key === key) continue; const g = BDEFS[i.k].fp;
  if (x < i.x + g[0] && i.x < x + f[0] && y < i.y + g[1] && i.y < y + f[1]) return false; }
 return true;
}
function freeSpot(block, k){ const L = lotsOpen(houseLv(block));
 for (let y = L.y1; y >= L.y0; y--) for (let x = L.x0; x <= L.x1; x++) if (fitsAt(block, null, k, x, y)) return [x, y];
 return null; }
// every building must be reachable on foot from the street: fences and buildings block, and no building may be sealed in
function reachOk(block){
 const W = 28, solid = new Uint8Array(W * W), seen = new Uint8Array(W * W);
 for (const i of block){ const f = BDEFS[i.k].fp; for (let dx = 0; dx < f[0]; dx++) for (let dy = 0; dy < f[1]; dy++) solid[(i.y + dy) * W + i.x + dx] = 1; }
 const q = [0]; seen[0] = 1;
 while (q.length){ const c = q.pop(), x = c % W, y = (c - x) / W;
  for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]){ if (nx < 0 || ny < 0 || nx >= W || ny >= W) continue; const n = ny * W + nx; if (seen[n] || solid[n]) continue; seen[n] = 1; q.push(n); } }
 for (const i of block){ if (i.k === 'fence') continue; const f = BDEFS[i.k].fp; let ok = false;
  for (let dx = -1; dx <= f[0] && !ok; dx++) for (let dy = -1; dy <= f[1] && !ok; dy++){
   const edge = (dx === -1 || dx === f[0]) !== (dy === -1 || dy === f[1]); if (!edge) continue;
   const x = i.x + dx, y = i.y + dy; if (x >= 0 && y >= 0 && x < W && y < W && seen[y * W + x]) ok = true; }
  if (!ok) return false; }
 return true;
}
// a saved block made safe to use: known kinds only, whole numbers, inside the lot, nothing overlapping, a Main House present
function cleanBlock(list){
 if (!Array.isArray(list)) return null; const out = [];
 if (!list.some(i => i && i.k === 'house')) return null;
 const sorted = list.filter(i => i && BDEFS[i.k] && HOME[i.k]).sort((a, b) => (a.k === 'house' ? 0 : 1) - (b.k === 'house' ? 0 : 1));
 for (const i of sorted){ const it = {key:String(i.key || 'b' + out.length), k:i.k, x:i.x | 0, y:i.y | 0, lv:Math.max(1, Math.min(maxLv(i.k), i.lv | 0 || 1))};
  if (out.some(o => o.key === it.key)) continue;
  if (it.k === 'house'){ out.push(it); continue; }
  if (fitsAt(out, it.key, it.k, it.x, it.y)) out.push(it); }
 const h = out[0], f = BDEFS.house.fp, L = lotsOpen(h.lv); if (h.x < L.x0 || h.y < L.y0 || h.x + f[0] - 1 > L.x1 || h.y + f[1] - 1 > L.y1) return null;
 return out;
}
// a loot raid on the Boombox Kings with the crew you trained
function raidRecipe(seed, counts){
 const crew = CREWS[0], d = crew.defender;
 return {deployVer:B.DEPLOY_VER, seed:seed >>> 0, maxT:1800, guard:0, mode:'raid',
  items:RESCUE_BLOCK.map(fightItem), attackers:army(counts),
  defenders:[0, 1, 2].map(() => ({look:d.look, hp:d.hp, atk:d.atk, speed:d.speed, range:d.range})), deploys:[]};
}

return {UNITS, ORDER, BDEFS, CREWS, RESCUE_BLOCK, RESCUE_ARMY, fightItem, army, rescueRecipe, starsFor, reportFrom,
 HOME, SHOP, UNLOCKS, SIZE, START, maxLv, trainCost, upgradeCost, lotsOpen, houseLv, count, capFor, storeCap, armyCap, armySize, gymLv, payout, lootFor,
 starterBlock, fitsAt, freeSpot, reachOk, cleanBlock, raidRecipe};
})();
if (typeof module !== 'undefined') module.exports = TURF;
