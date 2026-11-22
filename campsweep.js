// Turf street sweep: a fair army (with your three bosses, no items) for each crew's Main House level, dropped by a simple script, against all 24 blocks by day and by night.
// Phase 3 target: block 1 of each crew 3-starred about 40 to 60% of the time by day, block 4 about 20 to 35%; night raises it about 10 points.
const B = require('./base.js'), T = require('./engine.js');
// what a player at each Main House level usually brings (beds full, Gym and research where the costs put them)
const FAIR = {
 1:{army:{brawler:10, shooter:6, bruiser:1}, res:{}},
 2:{army:{brawler:8, shooter:6, bruiser:1, snatcher:2, breacher:2, medic:0}, res:{brawler:2, shooter:2}},
 3:{army:{brawler:10, shooter:10, bruiser:2, breacher:3, medic:1, shotgunner:2, drone:1}, res:{brawler:3, shooter:3, bruiser:2}},
 4:{army:{brawler:10, shooter:10, bruiser:2, breacher:3, medic:1, shotgunner:3, drone:2, biker:1}, res:{brawler:4, shooter:4, bruiser:3, drone:2}}
};
function rngOf(a){ return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const SIDES = [[14.5, 23.2, 1, 0], [14.5, 3.8, 1, 0], [4.2, 13.5, 0, 1], [24.2, 13.5, 0, 1]];
// tanks first, then breachers, then the rest fanned out along one street; medics behind
const PLAN = ['enforcer', 'bruiser', 'heavy', 'biker', 'breacher', 'drone', 'brawler', 'snatcher', 'shotcaller', 'shotgunner', 'shooter', 'deadeye', 'medic'];
// bosses use their ability a set while after they land
function play(ci, bi, seed, night){
 const c = T.CREWS[ci], F = FAIR[c.hl], R = T.campRecipe(ci, bi, seed, F.army, F.res, night, {bosses:T.BOSS_ORDER, kit:{}});
 const r = rngOf(seed), [x0, y0, dx, dy] = SIDES[Math.floor(r() * 4)], shift = (r() - .5) * 6; let t = 1, n = 0;
 PLAN.forEach(k => R.attackers.forEach((a, i) => { if ((a.boss || a.type) !== k) return; const off = shift + ((n * 7) % 9 - 4) * .8 + (r() - .5) * 1.2; n++;
  let x = x0 + dx * off, y = y0 + dy * off; if (!B.canDrop(R, x, y)){ x = x0; y = y0; } R.deploys.push({i, x, y, t}); if (a.boss) R.deploys.push({ab:1, i, t:t + (a.boss === 'enforcer' ? 70 : a.boss === 'deadeye' ? 90 : 60)}); t += (k === 'bruiser' || k === 'heavy' || k === 'enforcer' ? 12 : 3) + Math.floor(r() * 3); }));
 return B.simRaid(R).result;
}
if (require.main !== module){ module.exports = {play}; return; }
const N = +(process.argv[2] || 40); let miss = 0;
for (let ci = 0; ci < 6; ci++){ const row = [];
 for (let bi = 0; bi < 4; bi++){ let d3 = 0, n3 = 0, d1 = 0, pc = 0;
  for (let s = 1; s <= N; s++){ const a = play(ci, bi, s * 7919 + bi, 0), b = play(ci, bi, s * 7919 + bi, 1); if (T.starsFor(a) === 3) d3++; if (T.starsFor(b) === 3) n3++; if (T.starsFor(a) > 0) d1++; pc += a.pct; }
  const D = Math.round(100 * d3 / N), Nn = Math.round(100 * n3 / N); row.push(`b${bi + 1} day ${String(D).padStart(3)}% night ${String(Nn).padStart(3)}% 1star ${Math.round(100 * d1 / N)}% avg ${Math.round(pc / N)}%`);
  if (bi === 0 && (D < 40 || D > 60)) miss++; if (bi === 3 && (D < 20 || D > 35)) miss++; }
 console.log(T.CREWS[ci].id.padEnd(11) + row.join(' | ')); }
console.log(miss ? 'campsweep: ' + miss + ' targets missed' : 'campsweep: street targets met');
process.exit(miss ? 1 : 0);
