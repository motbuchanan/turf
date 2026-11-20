// Turf balance sweep: plays scripted drop patterns over many seeds and reports how often each one wins.
// Phase 1 target: the rescue (Main House down) is won by a sensible 6-drop attack at least 90% of the time
// from any side, and lost by a single Brawler.
const B = require('./base.js'), T = require('./engine.js');
const SIDES = {south:[14.5, 23.2, 1, 0], north:[14.5, 3.8, 1, 0], west:[4.2, 13.5, 0, 1], east:[24.2, 13.5, 0, 1]};
function play(seed, picks, side){
 const R = T.rescueRecipe(seed), [x0, y0, dx, dy] = SIDES[side], used = {}, deploys = [];
 picks.forEach(([type, t], n) => { const i = R.attackers.findIndex((a, j) => a.type === type && !used[j]); if (i < 0) return; used[i] = 1;
  const off = (n % 3 - 1) * .9; deploys.push({i, x:x0 + dx * off, y:y0 + dy * off, t}); });
 R.deploys = deploys; return B.simRaid(R).result;
}
const P = {
 six:[['bruiser', 1], ['bruiser', 4], ['brawler', 25], ['brawler', 27], ['shooter', 45], ['shooter', 47]],
 one:[['brawler', 1]],
 all:[['bruiser', 1], ['bruiser', 4], ...[0, 1, 2, 3, 4, 5].map(n => ['brawler', 20 + n * 2]), ...[0, 1, 2, 3].map(n => ['shooter', 40 + n * 2])]
};
let fails = 0; const N = 60;
for (const name in P) for (const side in SIDES){
 let core = 0, stars = 0, ticks = 0, long = 0;
 for (let s = 1; s <= N; s++){ const r = play(s * 7919, P[name], side); if (r.coreDown) core++; stars += T.starsFor(r); ticks += r.ticks; if (r.ticks > 1800) long++; }
 const rate = Math.round(100 * core / N);
 let pc=0; console.log(`${name.padEnd(4)} ${side.padEnd(5)} Main House down ${String(rate).padStart(3)}%  avg stars ${(stars / N).toFixed(1)}  avg ${(ticks / N / 10).toFixed(0)}s`);
 if (name === 'six' && rate < 90) fails++;
 if (name === 'one' && rate > 0) fails++;
 if (long) fails++;
}
console.log(fails ? fails + ' targets missed' : 'turfsweep: rescue targets met');
process.exit(fails ? 1 : 0);
