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
  line:'Big and slow. Walks straight at the guns and soaks the fire.'},
 snatcher:{name:'Snatcher', look:'snatcher', hp:90, atk:11, speed:2.6, range:.6, prefer:'res', lootMult:2, wallMult:1, size:1,
  line:'Fast. Runs for the stash spots and hits them twice as hard.'},
 breacher:{name:'Breacher', look:'breacher', hp:60, atk:40, speed:2.2, range:.5, prefer:'wall', bomb:true, wallMult:10, splash:1.6, size:2,
  line:'Bolt cutters and a door charge. Blows open the nearest fence, and the fence next to it.'},
 medic:{name:'Street Medic', look:'medic', hp:200, atk:0, speed:1.35, range:0, prefer:'any', heal:14, healR:2.2, wallMult:0, size:5,
  line:'Patches up the crew around him. Never fights. Keep him behind the line.'},
 shotgunner:{name:'Shotgunner', look:'shotgunner', hp:110, atk:30, speed:1.4, range:2.2, prefer:'any', splash:1.5, wallMult:.8, size:3,
  line:'Short range, wide spread. Hits a building and everything packed around it.'},
 drone:{name:'Drone Kid', look:'drone', hp:160, atk:60, speed:1.25, range:.35, prefer:'def', fly:true, wallMult:0, size:4,
  line:'A hobby drone that flies over fences and drops on the guns. People on foot cannot reach it.'},
 biker:{name:'Biker', look:'biker', hp:380, atk:26, speed:2.4, range:.7, prefer:'def', jump:true, wallMult:1, size:4,
  line:'Dirt bike. Jumps fences and goes straight for the guns.'},
 heavy:{name:'Heavy', look:'heavy', hp:820, atk:30, speed:1.15, range:.8, prefer:'any', splash:1.3, wallMult:1.4, size:6,
  line:'Riot shield and a pipe. Soaks hits and knocks into everything around him.'}
};
const ORDER = ['brawler', 'shooter', 'bruiser', 'snatcher', 'breacher', 'medic', 'shotgunner', 'drone', 'biker', 'heavy'];

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
 pad:{name:'Crash Pad', fp:[2, 3], role:'bld', hp:420},
 pharmacy:{name:'Pharmacy', fp:[3, 2], role:'bld', hp:440},
 hardware:{name:'Hardware Store', fp:[3, 2], role:'bld', hp:460},
 studio:{name:'Recording Studio', fp:[2, 3], role:'bld', hp:420},
 workshop:{name:'Workshop', fp:[2, 2], role:'bld', hp:400},
 crewhouse:{name:'Crew House', fp:[3, 3], role:'bld', hp:520}
};

// ---------- rival crews ----------
const CREWS = [
 {id:'boombox', name:'The Boombox Kings', boss:'Pops Cassette', color:'gold', hl:1, turf:'Corner store and rowhouses. Cheap fences everywhere.',
  defender:{hp:120, atk:7, speed:1.4, range:2.8}, kinds:['store', 'rowhouse', 'rowhouse', 'stash', 'hustle'], fence:'double', guns:['porch', 'porch', 'roof']},
 {id:'goldnote', name:'Gold Note', boss:'Big Ledger', color:'green', hl:1, turf:'Fancy townhouses. Fat stashes and a hard Main House.',
  defender:{hp:130, atk:8, speed:1.4, range:2.8}, kinds:['stash', 'stash', 'supstash', 'rowhouse', 'rowhouse', 'pharmacy'], fence:'ring', houseHp:1.6, guns:['porch', 'roof', 'roof']},
 {id:'basement', name:'The Basement', boss:'Low End', color:'blue', hl:2, turf:'A studio warehouse. Shooters on every roof.',
  defender:{hp:140, atk:9, speed:1.4, range:3}, kinds:['studio', 'workshop', 'supstash', 'stash', 'run'], fence:'ring', guns:['roof', 'roof', 'porch', 'roof']},
 {id:'afterhours', name:'Afterhours', boss:'Neon', color:'red', hl:2, turf:'The nightclub strip. Long-reach shooters and bright lights.',
  defender:{hp:150, atk:9, speed:1.5, range:3.2}, kinds:['studio', 'store', 'rowhouse', 'hustle', 'stash'], fence:'ring', guns:['roof', 'roof', 'roof', 'porch']},
 {id:'yard', name:'The Yard', boss:'Deacon', color:'orange', hl:3, turf:'Vacant lots and garages. Fence mazes.',
  defender:{hp:170, atk:10, speed:1.4, range:2.8}, kinds:['hardware', 'workshop', 'run', 'stash', 'supstash', 'rowhouse'], fence:'maze', guns:['porch', 'porch', 'roof', 'porch']},
 {id:'chrometide', name:'Chrome Tide', boss:'Wheels', color:'teal', hl:4, turf:'Body shop and parking lot. More crew on defense, and fast.',
  defender:{hp:190, atk:11, speed:1.9, range:2.8}, kinds:['hardware', 'gym', 'run', 'run', 'stash', 'supstash', 'pad'], fence:'ring', extraDef:2, guns:['porch', 'roof', 'porch', 'roof']}
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
const LOOT = ['stash', 'supstash', 'store', 'hustle', 'run'];   // what a Snatcher runs for
function fightItem(it){
 const d = BDEFS[it.k], f = d.fp;
 return {key:it.key, k:it.k, x:it.x, y:it.y, fw:f[0], fh:f[1], hp:d.hp, role:d.role, range:d.range || 0, dmg:d.dmg || 0, rate:d.rate || 1, loot:LOOT.indexOf(it.k) >= 0};
}
// an army line-up: {brawler:6, shooter:4, bruiser:2} -> attacker list grouped by type, in ORDER
// research: one track per fighter kind, levels 1 to 5, instant; each level past 1 adds 10% health and 10% damage (healing for the medic)
const RESEARCH = {max:5, step:.1, base:{brawler:60, shooter:80, bruiser:300, snatcher:70, breacher:150, medic:320, shotgunner:220, drone:360, biker:320, heavy:450}};
function researchMult(lv){ return 1 + RESEARCH.step * (Math.max(1, Math.min(RESEARCH.max, lv | 0 || 1)) - 1); }
function researchCost(k, lv){ return lv >= RESEARCH.max ? null : [0, RESEARCH.base[k] * lv * lv]; }   // Supplies for the next level
function researchCap(block){ const l = lvOf(block, 'workshop'); return l ? l + 1 : 1; }                 // Workshop level 1 researches to 2, level 4 to 5
// ---------- bosses and items (v0.4.1) ----------
// Your three bosses join every fight you start (no beds, no training). Each is dropped like a fighter and has one ability per fight.
const BOSSES = {
 enforcer:{name:'The Enforcer', hp:1500, atk:42, speed:1.3, range:.9, prefer:'any', ability:{kind:'slam', r:3, len:60, mult:1.5, dmg:140}, abName:'Lights Out',
  line:'Walks through the front door. Lights Out: slams the ground, hurting everything close, and the crew around him hit harder for 6 seconds.'},
 deadeye:{name:'Deadeye', hp:720, atk:32, speed:1.5, range:4.6, prefer:'any', ability:{kind:'ghost', len:50, mult:1.8}, abName:'Ghost',
  line:'Shoots from a long way off. Ghost: nobody can see her for 5 seconds, and she fires harder.'},
 shotcaller:{name:'The Shot Caller', hp:950, atk:18, speed:1.4, range:3.2, prefer:'any', splash:1, ability:{kind:'hold', r:3.5, len:45}, abName:'Hold the Line',
  line:'Runs the crew from the middle. Hold the Line: nobody around her can fall for 4.5 seconds.'}
};
const BOSS_ORDER = ['enforcer', 'deadeye', 'shotcaller'];
// one-time items, made at your Corner Store with Supplies; each is cast with a tap on the block
const ITEMS = {
 hype:{name:'Hype Track', kind:'rage', r:3, len:80, mult:1.5, cost:120, store:1, line:'A boombox blast. Your crew inside the ring hit 50% harder for 8 seconds.'},
 firstaid:{name:'First Aid Run', kind:'heal', r:3, len:80, heal:22, cost:120, store:1, line:'Patches up your crew inside the ring for 8 seconds.'},
 firecracker:{name:'Firecracker Strike', kind:'strike', r:1.6, dmg:260, cost:150, store:1, line:'A big bang on one spot. Hurts buildings and anyone standing there.'},
 ladder:{name:'Ladder', kind:'jump', r:2.5, len:100, cost:90, store:2, line:'Your crew inside the ring go over fences instead of through them, for 10 seconds.'},
 blackout:{name:'Blackout', kind:'off', r:3, len:50, cost:160, store:2, line:'Cuts the power. Guns and people inside the ring stop for 5 seconds.'},
 smoke:{name:'Smoke', kind:'smoke', r:2.5, len:40, cost:140, store:3, line:'Their guns and people cannot see your crew inside the cloud for 4 seconds.'}
};
const ITEM_ORDER = ['hype', 'firstaid', 'firecracker', 'ladder', 'blackout', 'smoke'];
function kitCap(block){ const l = lvOf(block || [], 'store'); return l ? 1 + l : 0; }          // a Corner Store holds 2 items, 3 at level 2, 4 at level 3
function kitSize(kit){ let n = 0; for (const k of ITEM_ORDER) n += (kit && kit[k]) | 0; return n; }
function itemOpen(block, k){ return lvOf(block || [], 'store') >= ITEMS[k].store; }
function cleanKit(o){ const out = {}; ITEM_ORDER.forEach(k => { const v = o && o[k] | 0; if (v > 0) out[k] = Math.min(9, v); }); return out; }
function spellsFor(kit){ const out = {}; for (const k of ITEM_ORDER) if (kit && kit[k] > 0){ const it = ITEMS[k]; out[k] = {kind:it.kind, r:it.r, len:it.len || 0, mult:it.mult || 1, heal:it.heal || 0, dmg:it.dmg || 0}; } return out; }
// what you bring to a fight beyond your fighters: bosses (every fight but the rescue) and the items you made
function loadout(R, load){ if (!load) return R; R.attackers = R.attackers.concat(bossUnits(load.bosses || [])); R.kit = cleanKit(load.kit); R.spells = spellsFor(R.kit); return R; }
function bossUnits(ids){ return ids.filter(id => BOSSES[id]).map(id => { const b = BOSSES[id]; return {type:'boss', boss:id, hp:b.hp, atk:b.atk, speed:b.speed, range:b.range, prefer:b.prefer, wallMult:1, splash:b.splash || 0, fly:false, heal:0, healR:0, bomb:false, jump:false, lootMult:1, ability:Object.assign({}, b.ability)}; }); }
function army(counts, research){
 const list = [];
 ORDER.forEach(k => { const u = UNITS[k], m = researchMult(research && research[k]); for (let n = 0; n < (counts[k] || 0); n++) list.push({type:k, look:u.look, hp:Math.round(u.hp * m), atk:Math.round(u.atk * m * 10) / 10, speed:u.speed, range:u.range, prefer:u.prefer, wallMult:u.wallMult, splash:u.splash || 0, fly:!!u.fly, heal:Math.round((u.heal || 0) * m * 10) / 10, healR:u.healR || 0, bomb:!!u.bomb, jump:!!u.jump, lootMult:u.lootMult || 1}); });
 return list;
}
const RESCUE_ARMY = {brawler:6, shooter:4, bruiser:2};
function rescueRecipe(seed){
 const crew = CREWS[0], d = crew.defender;
 return {deployVer:B.DEPLOY_VER, rules:2, seed:seed >>> 0, maxT:1800, guard:0, mode:'rescue', crewColor:'gold',
  items:RESCUE_BLOCK.map(fightItem),
  attackers:army(RESCUE_ARMY),
  defenders:[0, 1, 2].map(() => ({look:'kb_crew', hp:d.hp, atk:d.atk, speed:d.speed, range:d.range})),
  deploys:[]};
}
// stars: one for half the block down, one for the Main House down, one for everything down
function starsFor(r){ return (r.pct >= 50 ? 1 : 0) + (r.coreDown ? 1 : 0) + (r.allDown ? 1 : 0); }
// a report keeps the recipe (with the deploys and End tick the fight produced) so Watch can play it again
function reportFrom(R, result){
 return {at:0, simVer:B.SIM_VER, deployVer:B.DEPLOY_VER, rules:2, mode:R.mode,
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
 pharmacy:{cap:[0, 1, 1, 1], cost:[500, 250], line:'Medicine and bandages. Some of the crew you send in come home patched up.'},
 hardware:{cap:[0, 0, 1, 1], cost:[700, 300], line:'Tools and lumber at cost. Everything you build or level up costs less.'},
 studio:{cap:[0, 0, 1, 1], cost:[600, 400], line:'Cuts records about your crew. More Rep from every fight.'},
 workshop:{cap:[0, 1, 1, 1], cost:[400, 300], line:'Where the crew works on its gear. Research makes every fighter of a kind tougher and harder hitting.'},
 crewhouse:{cap:[1, 1, 1, 1], cost:[300, 0], line:'Where friends\' crews will wait to back you up. Opens when the group goes online.'},
 porch:{cap:[1, 2, 3, 4], cost:[0, 200], line:'A gunner behind sandbags. Covers the ground around him.'},
 roof:{cap:[0, 1, 2, 3], cost:[0, 350], line:'A shooter up high. Long reach, slower shots.'},
 fence:{cap:[24, 44, 64, 90], cost:[0, 10], line:'Chain-link. Slows anyone on foot.'}
};
const SHOP = ['hustle', 'run', 'stash', 'supstash', 'pad', 'store', 'pharmacy', 'hardware', 'studio', 'workshop', 'crewhouse', 'porch', 'roof'];
const MAXLV = {house:4, fence:1, gym:5, workshop:4, crewhouse:1}, HOUSE_UP = [null, [600, 400], [1500, 1000], [3500, 2500]];
const UNLOCKS = {brawler:1, shooter:1, bruiser:2, snatcher:2, breacher:3, medic:3, shotgunner:4, drone:4, biker:5, heavy:5};   // the Gym level that brings each fighter in
const TRAIN = {brawler:20, shooter:30, bruiser:150, snatcher:25, breacher:60, medic:150, shotgunner:90, drone:160, biker:140, heavy:220};   // Cash each
const SIZE = {brawler:1, shooter:1, bruiser:5, snatcher:1, breacher:2, medic:5, shotgunner:3, drone:4, biker:4, heavy:6};   // beds each
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
// neighborhood bonuses, by the building's level
function lvOf(block, k){ let n = 0; for (const i of block) if (i.k === k) n = Math.max(n, i.lv || 1); return n; }
function priceCut(block){ const l = lvOf(block, 'hardware'); return l ? .1 + .05 * l : 0; }               // 15%, 20%, 25% off
function price(block, c){ const f = 1 - priceCut(block); return c.map(v => Math.round(v * f / 10) * 10); }
function patchShare(block){ const l = lvOf(block, 'pharmacy'); return l ? .15 + .1 * l : 0; }             // 25%, 35%, 45% come home
function patchedUp(block, spent){ const f = patchShare(block), out = {}; for (const k of ORDER) out[k] = Math.floor((spent[k] || 0) * f); return out; }
function repFor(res, block){ const st = starsFor(res), l = lvOf(block, 'studio'); return Math.round((st * 8 + Math.floor(res.pct / 10)) * (l ? 1.25 + .25 * l : 1)); }   // studio: x1.5, x1.75, x2
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
function raidRecipe(seed, counts, research, load){
 const crew = CREWS[0], d = crew.defender;
 return loadout({deployVer:B.DEPLOY_VER, rules:2, seed:seed >>> 0, maxT:1800, guard:0, mode:'raid', crewColor:'gold',
  items:RESCUE_BLOCK.map(fightItem), attackers:army(counts, research),
  defenders:[0, 1, 2].map(() => ({look:'kb_crew', hp:d.hp, atk:d.atk, speed:d.speed, range:d.range})), deploys:[]}, load);
}

// ---------- the streets (v0.4): 6 rival crews, 4 blocks each ----------
// Blocks are laid out by a fixed recipe per crew and block number, so every phone gets the same 24 blocks.
// g is the block's place in the run (0 to 23); a block opens when the one before it has a star and the Main House is high enough.
const CAMP = {crews:6, blocks:4};
function rng32(a){ return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function campG(ci, bi){ return ci * CAMP.blocks + bi; }
function campLayout(ci, bi, tryN){
 const c = CREWS[ci], g = campG(ci, bi), r = rng32(9001 + g * 131 + (tryN || 0) * 7), out = [];
 const taken = (x, y, w, h, pad) => out.some(o => { const f = BDEFS[o.k].fp; return x - pad < o.x + f[0] && o.x < x + w + pad && y - pad < o.y + f[1] && o.y < y + h + pad; });
 const put = (k, x, y) => { out.push({k, x, y}); return true; };
 const place = k => { const f = BDEFS[k].fp; for (let n = 0; n < 160; n++){ const x = 9 + Math.floor(r() * (12 - f[0] + 1)), y = 8 + Math.floor(r() * (12 - f[1] + 1)); if (!taken(x, y, f[0], f[1], 1)) return put(k, x, y); } return false; };
 put('house', 13, 12);
 const guns = c.guns.slice(0, Math.min(c.guns.length, 2 + bi)).concat(bi >= 3 ? ['porch'] : []);
 guns.forEach(place);
 c.kinds.slice(0, 3 + bi + (bi >= 2 ? 1 : 0)).forEach(place);
 const fence = new Set(), addF = (x, y) => { const key = x + ',' + y; if (fence.has(key) || taken(x, y, 1, 1, 0)) return; fence.add(key); };
 const ring = (x0, y0, x1, y1, gaps) => { const skip = new Set(gaps.map(p => p.join(','))); for (let x = x0; x <= x1; x++){ [y0, y1].forEach(y => { if (!skip.has(x + ',' + y)) addF(x, y); }); } for (let y = y0 + 1; y < y1; y++){ [x0, x1].forEach(x => { if (!skip.has(x + ',' + y)) addF(x, y); }); } };
 const gate = (a, b) => a + Math.floor(r() * (b - a));
 ring(7, 6, 21, 20, [[gate(9, 19), 6], [7, gate(8, 18)], [21, gate(8, 18)], [gate(9, 19), 20]]);
 if (c.fence === 'double' || bi >= 2) ring(11, 10, 17, 16, [[14, 10], [11, 13], [17, 13], [14, 16]]);
 if (c.fence === 'maze') for (let n = 0; n < 4 + bi; n++){ const hz = r() < .5, len = 3 + Math.floor(r() * 4), x = 8 + Math.floor(r() * 12), y = 7 + Math.floor(r() * 12); for (let j = 0; j < len; j++){ const fx = hz ? x + j : x, fy = hz ? y : y + j; if (fx <= 20 && fy <= 19) addF(fx, fy); } }
 fence.forEach(key => { const [x, y] = key.split(',').map(Number); if (x >= 0 && y >= 0 && x < 28 && y < 28) out.push({k:'fence', x, y}); });
 return out.map((it, i) => Object.assign({key:'c' + g + '_' + i}, it));
}
const CAMP_BLOCKS = {};
function campBlock(ci, bi){ const g = campG(ci, bi); if (CAMP_BLOCKS[g]) return CAMP_BLOCKS[g];
 for (let n = 0; n < 40; n++){ const b = campLayout(ci, bi, n); if (reachOk(b)) return (CAMP_BLOCKS[g] = b); }
 return (CAMP_BLOCKS[g] = campLayout(ci, bi, 0).filter(i => i.k !== 'fence'));
}
// the strength of a block: towers, the Main House and the people on defense grow along the run
// CAMP_POWER is found by camptune.js so a fair army 3-stars block 1 of a crew about half the time by day, falling to about 28% at block 4
const CAMP_POWER = [5.67, 4.41, 4.03, 2.57, 5.31, 4.31, 3.67, 2.33, 5.45, 4.12, 3.3, 2.16, 5.76, 4.1, 3.18, 1.95, 7.58, 5.99, 4.53, 2.79, 6.06, 4.99, 3.83, 2.54];
function campPower(ci, bi){ return CAMP_POWER[campG(ci, bi)]; }
const BOSS_DEF = {hp:6, atk:2.2, reach:1};
const NIGHT = {loot:.75, reach:.95};
function campRecipe(ci, bi, seed, counts, research, night, load){
 const c = CREWS[ci], m = campPower(ci, bi), reach = night ? NIGHT.reach : 1, d = c.defender;
 const items = campBlock(ci, bi).map(it => { const f = fightItem(it);
  if (f.role === 'tower'){ f.hp = Math.round(f.hp * m); f.dmg = Math.round(f.dmg * m * 10) / 10; f.range = Math.round(f.range * reach * 100) / 100; }
  else if (f.role === 'core') f.hp = Math.round(f.hp * m * (c.houseHp || 1));
  else if (f.role === 'wall') f.hp = Math.round(f.hp * (1 + .05 * campG(ci, bi)));
  else f.hp = Math.round(f.hp * (1 + (m - 1) * .5));
  return f; });
 const nd = 2 + bi + (c.extraDef || 0);
 // the crew's boss holds its last block: much tougher than the rest, and it hits hard
 const boss = bi === CAMP.blocks - 1 ? [{look:'boss:' + c.id, hero:true, hp:Math.round(d.hp * m * BOSS_DEF.hp), atk:Math.round(d.atk * m * BOSS_DEF.atk * 10) / 10, speed:d.speed, range:Math.round((d.range + BOSS_DEF.reach) * reach * 100) / 100}] : [];
 return loadout({deployVer:B.DEPLOY_VER, rules:2, seed:seed >>> 0, maxT:1800, guard:0, mode:'camp', camp:[ci, bi], night:night ? 1 : 0, crewColor:c.color,
  items, attackers:army(counts, research),
  defenders:boss.concat(Array.from({length:nd}, () => ({look:'def', hp:Math.round(d.hp * m), atk:Math.round(d.atk * m * 10) / 10, speed:d.speed, range:Math.round(d.range * reach * 100) / 100}))), deploys:[]}, load);
}
// what a block holds: you take your share of what is left, by how much of it you knocked down (less at night)
function campPool(ci, bi){ const g = campG(ci, bi); return {cash:400 + 300 * g, sup:250 + 190 * g}; }
function campLoot(res, ci, bi, took, night){ const p = campPool(ci, bi), t = took || [0, 0], f = res.pct / 100 * (night ? NIGHT.loot : 1);
 return {cash:Math.floor(Math.max(0, p.cash - (t[0] | 0)) * f), sup:Math.floor(Math.max(0, p.sup - (t[1] | 0)) * f)}; }
function campOpen(camp, block, ci, bi){
 if (houseLv(block || []) < CREWS[ci].hl) return false;
 const g = campG(ci, bi); if (!g) return true;
 const pc = Math.floor((g - 1) / CAMP.blocks), pb = (g - 1) % CAMP.blocks, prev = camp && camp[pc + '-' + pb];
 return !!(prev && prev.s > 0);
}
function cleanCamp(o){ const out = {}; if (!o || typeof o !== 'object') return out;
 for (let ci = 0; ci < CAMP.crews; ci++) for (let bi = 0; bi < CAMP.blocks; bi++){ const v = o[ci + '-' + bi]; if (!v || typeof v !== 'object') continue;
  const t = Array.isArray(v.t) ? v.t : [0, 0], p = campPool(ci, bi);
  out[ci + '-' + bi] = {s:Math.max(0, Math.min(3, v.s | 0)), t:[Math.max(0, Math.min(p.cash, t[0] | 0)), Math.max(0, Math.min(p.sup, t[1] | 0))]}; }
 return out; }

return {UNITS, ORDER, BDEFS, CREWS, RESCUE_BLOCK, RESCUE_ARMY, fightItem, army, rescueRecipe, starsFor, reportFrom,
 HOME, SHOP, UNLOCKS, SIZE, START, maxLv, trainCost, upgradeCost, lotsOpen, houseLv, count, capFor, storeCap, armyCap, armySize, gymLv, payout, lootFor,
 starterBlock, fitsAt, freeSpot, reachOk, cleanBlock, raidRecipe, RESEARCH, researchMult, researchCost, researchCap, lvOf, priceCut, price, patchShare, patchedUp, repFor,
 CAMP, CAMP_POWER, NIGHT, BOSS_DEF, campBlock,
 BOSSES, BOSS_ORDER, ITEMS, ITEM_ORDER, kitCap, kitSize, itemOpen, cleanKit, spellsFor, loadout, campRecipe, campPool, campLoot, campOpen, cleanCamp, campPower};
})();
if (typeof module !== 'undefined') module.exports = TURF;
