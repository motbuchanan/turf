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
 ok(T.upgradeCost('house', 1)[0] === 600 && T.upgradeCost('house', 4) === null && T.upgradeCost('fence', 1) === null && T.upgradeCost('gym', 3) === null, 'upgrade prices end at the top level');
 ok(T.armyCap(blk) === 20 && T.armySize({brawler:6, shooter:4, bruiser:2}) === 20, 'one Crash Pad sleeps the rescue crew');
 ok(T.gymLv(blk) === 1 && T.UNLOCKS.bruiser === 2, 'Bruisers need Gym level 2');
 const cap = T.storeCap(blk); ok(cap.cash === 2500 && cap.sup === 1000, 'starter storage');
 const loot = T.lootFor({pct:50, coreDown:false, allDown:false}, blk); ok(loot.cash === 200 && loot.sup === 100, 'loot scales with the damage done ' + JSON.stringify(loot));
 // a raid recipe is a normal deploy-mode fight and repeats exactly
 const Rr = Object.assign(T.raidRecipe(5, {brawler:8, shooter:4}), {deploys:[{i:0, x:14, y:23.5, t:1}, {i:1, x:14.5, y:23.5, t:3}, {i:8, x:14, y:24.3, t:9}]});
 const r1 = B.simRaid(Rr).result, r2 = B.simRaid(JSON.parse(JSON.stringify(Rr))).result; ok(r1.hash === r2.hash && Rr.attackers.length === 12 && Rr.mode === 'raid', 'a raid repeats exactly');
}
console.log(fails ? fails + ' FAILED' : 'turfcheck: all passed');
process.exit(fails ? 1 : 0);
