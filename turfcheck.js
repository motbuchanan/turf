// Turf logic checks: deploy-mode fights are repeatable, live play matches the replay, drops respect the no-drop zone.
const B = require('./base.js'), T = require('./engine.js');
let fails = 0; const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } };
const R0 = T.rescueRecipe(77);
// 1. a recipe with deploys run twice gives the same fight
const drops = [{i:10, x:14.5, y:23, t:1}, {i:11, x:15.5, y:23, t:5}, {i:0, x:13.5, y:23.5, t:20}, {i:1, x:14.5, y:23.5, t:22}, {i:6, x:14, y:24, t:40}, {i:7, x:15, y:24, t:42}];
const Ra = Object.assign({}, R0, {deploys:drops});
const a = B.simRaid(Ra).result, b = B.simRaid(JSON.parse(JSON.stringify(Ra))).result;
ok(a.hash === b.hash && a.ticks === b.ticks, 'same recipe, same fight');
// 2. live play (deploys added between ticks) matches simRaid with the deploys it produced
const L = B.raidStart(T.rescueRecipe(77), {record:true});
const byTick = {}; drops.forEach(d => (byTick[d.t] = byTick[d.t] || []).push(d));
while (!L.done()){ const t = L.tick(); (byTick[t] || []).forEach(d => L.deploy(d.i, d.x, d.y)); if (t === 900) L.end(); L.step(); }
const lr = L.result(), replay = B.simRaid(Object.assign({}, T.rescueRecipe(77), {deploys:lr.deploys, endAt:lr.endAt}), {record:true});
ok(lr.hash === replay.result.hash, 'live run matches replay (' + lr.hash + ' vs ' + replay.result.hash + ')');
ok(L.frames.length === replay.frames.length, 'same number of frames');
ok(lr.deploys.length === drops.length, 'every deploy recorded');
// 3. a placed troop can't be placed twice
const L2 = B.raidStart(T.rescueRecipe(5)); ok(L2.deploy(0, 2, 2) === true, 'first drop ok'); ok(L2.deploy(0, 3, 3) === false, 'second drop of same troop refused');
// 4. the no-drop zone
ok(!B.canDrop(R0, 13, 13), 'no drop on the Main House'); ok(!B.canDrop(R0, 14.5, 21.5), 'no drop next to a fence');
ok(B.canDrop(R0, 14.5, 23), 'drop on the street'); ok(!B.canDrop(R0, -1, 5), 'no drop off the map');
// 5. End ends the fight on that tick, and the replay honours it
const L3 = B.raidStart(T.rescueRecipe(9)); L3.deploy(0, 14.5, 23); for (let n = 0; n < 50; n++) L3.step(); L3.end(); while (L3.step()); const r3 = L3.result();
ok(r3.ended === 'end' && r3.endAt === 51, 'End stops the fight (' + r3.ended + ' ' + r3.endAt + ')');
ok(B.simRaid(Object.assign({}, T.rescueRecipe(9), {deploys:r3.deploys, endAt:r3.endAt})).result.hash === r3.hash, 'ended fight replays');
// 6. round-trip through JSON (what a saved report does)
const rep = T.reportFrom(T.rescueRecipe(77), lr), back = JSON.parse(JSON.stringify(rep));
ok(B.simRaid(back.recipe).result.hash === lr.hash, 'saved report replays');
// 7. the rescue block is a legal layout (on the map, nothing overlapping)
const defs = {}; for (const k in T.BDEFS) defs[k] = {fp:T.BDEFS[k].fp};
const v = B.validLayout({items:T.RESCUE_BLOCK}, defs, {}, ['house'], 'house'); ok(v.ok, 'rescue block layout ' + JSON.stringify(v));
// ---------- v0.3: your block ----------
{ const blk = T.starterBlock();
 ok(T.reachOk(blk) && blk.every(i => T.fitsAt(blk, i.key, i.k, i.x, i.y)), 'starter block is legal');
 ok(JSON.stringify(T.cleanBlock(JSON.parse(JSON.stringify(blk)))) === JSON.stringify(blk), 'a clean block survives cleaning unchanged');
 ok(T.cleanBlock(null) === null && T.cleanBlock('x') === null && T.cleanBlock([{k:'gym', x:10, y:9}]) === null, 'no block or no Main House loads as no block (the game then hands out the starter)');
 // junk from a tampered or older save is dropped, never trusted
 const junk = T.cleanBlock(blk.concat([{k:'nuke', x:1, y:1}, {key:'z1', k:'stash', x:13, y:12, lv:1}, {key:'z2', k:'stash', x:2, y:2, lv:1}, {key:'z3', k:'hustle', x:16.7, y:'14', lv:99}, null]));
 ok(junk.length === blk.length + 1 && junk[junk.length - 1].lv === 3 && junk[junk.length - 1].x === 16, 'unknown kinds, overlaps and out-of-lot items are dropped; numbers are made whole and capped');
 // a sealed-in building fails the layout check
 const sealed = blk.slice(); for (let x = 12; x <= 16; x++) for (let y = 11; y <= 15; y++) if (x === 12 || x === 16 || y === 11 || y === 15) sealed.push({key:'f' + x + '_' + y, k:'fence', x, y, lv:1});
 ok(!T.reachOk(sealed), 'a Main House fenced in on every side fails');
 ok(T.reachOk(sealed.filter(i => i.key !== 'f16_13')), 'one gap beside the house makes it legal again');
 ok(!T.reachOk(sealed.filter(i => i.key !== 'f16_15')), 'a gap at the corner does not count: nobody squeezes through diagonally');
 // lots, limits and prices
 ok(T.lotsOpen(1).x1 - T.lotsOpen(1).x0 === 8 && T.lotsOpen(4).x0 === 7 && T.lotsOpen(4).y1 === 20 && T.lotsOpen(9).x0 === 7, 'the lot is 9 wide at level 1 and fills the yard at level 4');
 ok(!T.fitsAt(blk, null, 'stash', 9, 12) && T.fitsAt(blk, null, 'stash', 13, 10) && !T.fitsAt(blk, null, 'stash', 13, 12), 'placing: outside the lot no, open ground yes, on the house no');
 ok(T.capFor('store', 1) === 0 && T.capFor('store', 2) === 1 && T.capFor('roof', 1) === 0, 'the Corner Store and Rooftop Shooter open at house level 2');
 ok(T.upgradeCost('house', 1)[0] === 600 && T.upgradeCost('house', 4) === null && T.upgradeCost('fence', 1) === null && T.upgradeCost('gym', 5) === null && T.upgradeCost('gym', 3) !== null, 'upgrade prices end at the top level');
 ok(T.armyCap(blk) === 20 && T.armySize({brawler:6, shooter:4, bruiser:2}) === 20, 'one Crash Pad sleeps the rescue crew');
 ok(T.gymLv(blk) === 1 && T.UNLOCKS.bruiser === 2, 'Bruisers need Gym level 2');
 const cap = T.storeCap(blk); ok(cap.cash === 2500 && cap.sup === 1000, 'starter storage');
 const loot = T.lootFor({pct:50, coreDown:false, allDown:false}, blk); ok(loot.cash === 200 && loot.sup === 100, 'loot scales with the damage done ' + JSON.stringify(loot));
 // a raid recipe is a normal deploy-mode fight and repeats exactly
 const Rr = Object.assign(T.raidRecipe(5, {brawler:8, shooter:4}), {deploys:[{i:0, x:14, y:23.5, t:1}, {i:1, x:14.5, y:23.5, t:3}, {i:8, x:14, y:24.3, t:9}]});
 const r1 = B.simRaid(Rr).result, r2 = B.simRaid(JSON.parse(JSON.stringify(Rr))).result; ok(r1.hash === r2.hash && Rr.attackers.length === 12 && Rr.mode === 'raid', 'a raid repeats exactly');
}
// ---------- v0.3.4: neighborhood buildings ----------
{ const b = T.starterBlock(); b[0].lv = 3;
 ok(T.priceCut(b) === 0 && JSON.stringify(T.price(b, [600, 400])) === '[600,400]', 'no hardware store, full price');
 b.push({key:'h', k:'hardware', x:15, y:9, lv:1}); ok(Math.abs(T.priceCut(b) - .15) < 1e-9 && JSON.stringify(T.price(b, [600, 400])) === '[510,340]', 'hardware store level 1: 15% off');
 b[b.length - 1].lv = 3; ok(Math.abs(T.priceCut(b) - .25) < 1e-9, 'hardware store level 3: 25% off');
 ok(Object.values(T.patchedUp(b, {brawler:8, shooter:4})).every(v => v === 0), 'no pharmacy, nobody comes back');
 b.push({key:'p', k:'pharmacy', x:9, y:7, lv:1}); { const pu = T.patchedUp(b, {brawler:8, shooter:4, bruiser:1}); ok(pu.brawler === 2 && pu.shooter === 1 && pu.bruiser === 0, 'pharmacy level 1: a quarter of each kind, rounded down'); }
 const r = {pct:60, coreDown:true, allDown:false}, base = T.repFor(r, b); b.push({key:'s', k:'studio', x:19, y:13, lv:1});
 ok(base === 22 && T.repFor(r, b) === 33, 'Rep: 2 stars and 60% is 22, the studio makes it 33');
 ok(T.capFor('hardware', 2) === 0 && T.capFor('hardware', 3) === 1 && T.capFor('pharmacy', 2) === 1 && T.capFor('studio', 3) === 1, 'unlock levels');
 ok(T.cleanBlock(JSON.parse(JSON.stringify(b.filter(i => i.k !== 'studio')))) !== null, 'blocks with the new buildings survive cleaning');
}
// ---------- v0.3.5: the seven new fighters, one fight each on the Boombox block ----------
{ const solo = (counts, drops, ticks) => { const R = T.raidRecipe(11, counts); R.deploys = drops.map((d, i) => ({i, x:d[0], y:d[1], t:1})); const s = B.raidStart(R, {}); for (let n = 0; n < (ticks || 2000) && s.step(); n++); return s; };
 const items0 = T.raidRecipe(11, {}).items;
 let s = solo({snatcher:1}, [[14, 23.5]], 12); ok(s.units[0].tgt && s.units[0].tgt.loot, 'Snatcher goes for a loot building first');
 s = solo({breacher:1}, [[14, 23.5]]); const broke = s.items.filter(b => b.role === 'wall' && !(b.hp > 0)).length;
 ok(!s.units[0].alive && broke >= 2, 'Breacher is spent and opens at least two fences (' + broke + ')');
 s = solo({biker:1}, [[14, 23.5]]); ok(s.items.filter(b => b.role === 'wall').every(b => b.hp === b.max), 'Biker never breaks a fence');
 ok(s.units[0].dealt > 0, 'Biker reaches and hits a target');
 s = solo({drone:1}, [[14, 23.5]], 30); ok(s.units[0].tgt && s.units[0].tgt.role === 'tower', 'Drone Kid goes for a gun first');
 s = solo({brawler:4, medic:1}, [[13.6, 23.5], [14, 23.5], [14.4, 23.5], [14.8, 23.5], [14, 24.6]]); ok(s.units[4].dealt > 0, 'Street Medic heals (' + Math.round(s.units[4].dealt) + ' hp)');
 const r = solo({medic:1}, [[14, 23.5]], 3000).result(); ok(r.ended === 'cleared' && r.ticks < 20, 'a lone Street Medic does not hold the fight open');
 s = solo({shotgunner:3}, [[13.5, 23.5], [14, 23.5], [14.5, 23.5]]); ok(s.result().pct > 0, 'Shotgunners do damage');
 s = solo({heavy:2}, [[13.5, 23.5], [14.5, 23.5]]); ok(s.result().pct > 0, 'Heavies do damage');
 ok(T.ORDER.length === 10 && T.ORDER.every(k => T.UNITS[k] && T.UNLOCKS[k] && T.SIZE[k] && T.trainCost(k)), 'ten fighters, each with an unlock, beds and a price');
 const R1 = Object.assign(T.raidRecipe(9, {brawler:3, breacher:1, medic:1, drone:1, biker:1, heavy:1, snatcher:2, shotgunner:1}), {deploys:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({i, x:13 + i * .3, y:23.5, t:1 + i * 4}))});
 ok(B.simRaid(R1).result.hash === B.simRaid(JSON.parse(JSON.stringify(R1))).result.hash, 'a mixed raid with every new fighter repeats exactly');
}
// ---------- v0.3.6: research ----------
{ const b = T.starterBlock();
 ok(T.researchCap(b) === 1, 'no Workshop, nothing to research');
 b[0].lv = 2; b.push({key:'w', k:'workshop', x:16, y:12, lv:1}); ok(T.researchCap(b) === 2, 'Workshop level 1 researches to level 2');
 b[b.length - 1].lv = 4; ok(T.researchCap(b) === 5 && T.maxLv('workshop') === 4, 'Workshop level 4 researches to level 5, its top');
 ok(JSON.stringify(T.researchCost('brawler', 1)) === '[0,60]' && JSON.stringify(T.researchCost('brawler', 4)) === '[0,960]' && T.researchCost('brawler', 5) === null, 'research costs Supplies and ends at level 5');
 const a1 = T.army({brawler:1, medic:1}), a3 = T.army({brawler:1, medic:1}, {brawler:3, medic:5});
 ok(a1[0].hp === 150 && a3[0].hp === 180 && a3[0].atk === 18 && a3[1].heal === 19.6, 'level 3 Brawler: 180 hp, 18 damage; level 5 Medic heals 19.6');
 ok(JSON.stringify(T.army({brawler:2, shooter:1}, {})) === JSON.stringify(T.army({brawler:2, shooter:1})), 'no research, same fighters as before');
 const R = T.raidRecipe(4, {brawler:2}, {brawler:2}); ok(R.attackers[0].hp === 165, 'a raid uses the researched stats');
 ok(T.capFor('crewhouse', 1) === 1 && T.maxLv('crewhouse') === 1, 'one Crew House, no levels yet');
}
// ---------- v0.4: the streets ----------
{ ok(T.CREWS.length === 6 && new Set(T.CREWS.map(c => c.color)).size === 6, 'six rival crews, each its own color');
 let allOk = true, keys = new Set(), inLot = true;
 for (let ci = 0; ci < 6; ci++) for (let bi = 0; bi < 4; bi++){ const b = T.campBlock(ci, bi); if (!T.reachOk(b) || !b.some(i => i.k === 'house') || b.filter(i => T.BDEFS[i.k].role === 'tower').length < 2) allOk = false;
  b.forEach(i => { keys.add(i.key); if (i.x < 7 || i.x > 21 || i.y < 6 || i.y > 20) inLot = false; }); }
 ok(allOk, 'all 24 street blocks have a Main House, at least two guns, and a way in to every building');
 ok(inLot, 'every street block stays inside its fence line, clear of the streets you drop on');
 ok(JSON.stringify(T.campBlock(3, 2)) === JSON.stringify(require('./engine.js').campBlock(3, 2)), 'a street block is the same every time');
 const day = T.campRecipe(2, 1, 5, {brawler:4}, {}, false), night = T.campRecipe(2, 1, 5, {brawler:4}, {}, true);
 const tw = r => r.items.find(i => i.role === 'tower');
 ok(Math.abs(tw(night).range - tw(day).range * T.NIGHT.reach) < .02 && night.defenders[0].range < day.defenders[0].range, 'at night their guns and people reach less');
 ok(night.night === 1 && day.night === 0 && night.crewColor === 'blue', 'the recipe carries day or night and the crew color');
 const half = {pct:50}, l1 = T.campLoot(half, 0, 0, [0, 0], false), l2 = T.campLoot(half, 0, 0, [l1.cash, l1.sup], false), ln = T.campLoot(half, 0, 0, [0, 0], true);
 ok(l2.cash < l1.cash && ln.cash === Math.floor(T.campPool(0, 0).cash * .5 * .75), 'a block keeps what you took, and night pays 75%');
 const home1 = T.starterBlock(); ok(T.campOpen({}, home1, 0, 0) && !T.campOpen({}, home1, 0, 1), 'the first block is open, the second waits for a star');
 ok(T.campOpen({'0-0':{s:1, t:[0, 0]}}, home1, 0, 1) && !T.campOpen({'1-3':{s:3, t:[0, 0]}}, home1, 2, 0), 'a star opens the next block; the Main House level gates a crew');
 const c = T.cleanCamp({'0-0':{s:9, t:[-5, 1e9]}, '9-9':{s:1}, '1-2':'x', '2-3':{s:2.7, t:'no'}});
 ok(JSON.stringify(c) === JSON.stringify({'0-0':{s:3, t:[0, T.campPool(0, 0).sup]}, '2-3':{s:2, t:[0, 0]}}), 'a saved street record is cleaned: stars 0 to 3, takes inside the pool, unknown blocks dropped');
 const R = Object.assign(T.campRecipe(5, 3, 77, {brawler:6, bruiser:2, drone:1}, {}, true), {deploys:[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => ({i, x:12 + i * .4, y:23.4, t:1 + i * 3}))});
 ok(B.simRaid(R).result.hash === B.simRaid(JSON.parse(JSON.stringify(R))).result.hash, 'a night street fight repeats exactly');
}
// ---------- v0.4.1: bosses and items ----------
{ const base = () => { const R = T.campRecipe(0, 0, 11, {brawler:6, shooter:4}, {}, false, {bosses:T.BOSS_ORDER, kit:{hype:2, firstaid:1, firecracker:1, ladder:1, blackout:1, smoke:1}}); return R; };
 const drops = R => R.attackers.map((a, i) => ({i, x:12 + (i % 8) * .5, y:23.4, t:1 + i * 2}));
 const run = (R, extra) => { R.deploys = drops(R).concat(extra || []); return B.simRaid(R); };
 const R0 = base(); ok(R0.attackers.filter(a => a.type === 'boss').length === 3 && Object.keys(R0.spells).length === 6, 'a street fight brings all three bosses and the items you made');
 ok(T.rescueRecipe(3).attackers.every(a => a.type !== 'boss'), 'the rescue is fought without bosses');
 const plain = run(base()).result, fire = run(base(), [{c:'firecracker', x:14.5, y:13.5, t:2}]).result;
 ok(fire.pct > plain.pct || fire.hash !== plain.hash, 'a Firecracker Strike changes the fight');
 const R1 = base(); R1.deploys = drops(R1).concat([{c:'firecracker', x:14.5, y:13.5, t:2}, {c:'firecracker', x:10, y:10, t:3}]); const r1 = B.simRaid(R1).result;
 ok(r1.deploys.filter(d => d.c === 'firecracker').length === 1, 'you can only use as many of an item as you brought');
 const R2 = base(); const bi = R2.attackers.findIndex(a => a.boss === 'enforcer'); R2.deploys = drops(R2).concat([{ab:1, i:bi, t:60}, {ab:1, i:bi, t:90}]); const r2 = B.simRaid(R2).result;
 ok(r2.deploys.filter(d => d.ab).length === 1, 'a boss uses its move once per fight');
 const R3 = base(); R3.deploys = [{ab:1, i:bi, t:5}]; ok(B.simRaid(R3).result.deploys.length === 0, 'a boss still off the block cannot use its move');
 // Blackout: a raider standing by a gun is not shot while the power is out
 const lone = (extra, kit) => { const R = T.campRecipe(0, 0, 4, {bruiser:1}, {}, false, {bosses:[], kit:kit || {}}); const g = R.items.find(i => i.role === 'tower');
  R.defenders = []; R.items = R.items.filter(i => i.role !== 'wall'); R.deploys = [{i:0, x:g.x - 2.2, y:g.y + .5, t:1}].concat(extra || []); R.maxT = 60; const o = B.simRaid(R, {record:true}); return {r:o.result, g, left:o.frames[o.frames.length - 1].b.reduce((x, y) => x + y, 0)}; };
 const a = lone(), gx = a.g; const b = lone([{c:'blackout', x:gx.x + 1, y:gx.y + 1, t:1}], {blackout:1}), sm = lone([{c:'smoke', x:gx.x - 2.2, y:gx.y + .5, t:1}], {smoke:1});
 ok(b.r.attHp[0] > a.r.attHp[0], 'Blackout stops their guns for a while');
 ok(sm.r.attHp[0] > a.r.attHp[0], 'Smoke hides your crew from their guns');
 const h = lone([{c:'firstaid', x:gx.x - 2.2, y:gx.y + .5, t:1}], {firstaid:1}); ok(h.r.attHp[0] > a.r.attHp[0], 'First Aid Run patches your crew up');
 const hy = lone([{c:'hype', x:gx.x - 2.2, y:gx.y + .5, t:1}], {hype:1}); ok(hy.left < a.left, 'Hype Track makes your crew hit harder');
 // Hold the Line: nobody near the Shot Caller falls while it lasts
 const hold = ab => { const R = T.campRecipe(0, 0, 8, {brawler:3}, {}, false, {bosses:['shotcaller'], kit:{}}); R.maxT = 400;
  R.deploys = [0, 1, 2, 3].map(i => ({i, x:14 + i * .3, y:22.5, t:1})).concat(ab ? [{ab:1, i:3, t:20}] : []); return B.simRaid(R, {record:true}); };
 const h0 = hold(false), h1 = hold(true), alive = (o, tk) => { const f = o.frames[Math.min(tk, o.frames.length - 1)]; return f.u.filter(u => u[0] < 100 && u[6]).length; };
 ok(alive(h1, 60) > alive(h0, 60), 'Hold the Line keeps the crew around her standing');
 const R4 = base(); R4.deploys = drops(R4).concat([{c:'hype', x:14, y:19, t:30}, {c:'ladder', x:14, y:20, t:20}, {ab:1, i:R4.attackers.findIndex(a => a.boss === 'deadeye'), t:80}]);
 const r4 = B.simRaid(R4).result, r4b = B.simRaid(JSON.parse(JSON.stringify(Object.assign({}, R4, {deploys:r4.deploys})))).result;
 ok(r4.hash === r4b.hash, 'a fight with items and moves replays exactly from its saved deploys');
 const camp3 = T.campRecipe(2, 3, 1, {brawler:2}, {}, false, {bosses:[]}); ok(camp3.defenders[0].hero && camp3.defenders[0].look === 'boss:basement' && T.campRecipe(2, 2, 1, {brawler:2}, {}, false).defenders.every(d => !d.hero), 'each crew\'s boss holds only its last block');
 ok(JSON.stringify(T.cleanKit({hype:3.9, smoke:-1, nope:4, ladder:20})) === JSON.stringify({hype:3, ladder:9}), 'saved items are cleaned');
 ok(T.kitCap([]) === 0 && T.kitCap([{k:'store', lv:2}]) === 3, 'a Corner Store holds 2 items, more as it levels');
}
console.log(fails ? fails + ' FAILED' : 'turfcheck: all passed');
process.exit(fails ? 1 : 0);
