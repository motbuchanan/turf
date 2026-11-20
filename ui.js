// ===== TURF UI =====
// Screens: title, the Viceroy's story cards, the hands-on attack (the rescue and loot raids), the result, Watch, and your own block.
(function(){
'use strict';
const B = BASE, T = TURF, $ = id => document.getElementById(id);
const SAVE_KEY = 'turf.save.v1';
const DEFAULT_SAVE = {v:1, rescued:false, best:0, tries:0, reports:[], block:null, cash:0, sup:0, color:'lav', army:{brawler:0, shooter:0, bruiser:0}, nk:20, fs:false};
const GANG_PICK = ['lav', 'teal', 'red', 'green', 'orange', 'blue'];   // gold belongs to the Boombox Kings

// ---------- save (guarded: a phone that blocks storage still plays, it just forgets) ----------
let memSave = null;
function loadSave(){
 let raw = null; try { raw = localStorage.getItem(SAVE_KEY); } catch (e){}
 let s = {}; try { s = raw ? JSON.parse(raw) || {} : (memSave || {}); } catch (e){ s = {}; }
 const out = Object.assign(JSON.parse(JSON.stringify(DEFAULT_SAVE)), s);
 const okRep = r => r && r.recipe && ['items', 'attackers', 'defenders', 'deploys'].every(k => Array.isArray(r.recipe[k]));
 out.reports = Array.isArray(out.reports) ? out.reports.filter(okRep).slice(0, 10) : [];
 // anything a save holds is checked before use: a block that fits the rules, whole numbers, a color that exists
 out.block = T.cleanBlock(out.block);
 if (!out.army || typeof out.army !== 'object') out.army = {}; T.ORDER.forEach(k => out.army[k] = Math.max(0, Math.min(99, out.army[k] | 0)));
 out.cash = Math.max(0, Math.min(999999, out.cash | 0)); out.sup = Math.max(0, Math.min(999999, out.sup | 0)); out.nk = Math.max(20, out.nk | 0);
 if (GANG_PICK.indexOf(out.color) < 0) out.color = 'lav';
 return out;
}
function saveGame(){ memSave = save; try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e){} }
let save = loadSave();

// ---------- toast ----------
let toastT = 0;
function toast(msg, ms, onTap){ const t = $('toast'); t.textContent = msg; t.classList.add('on'); t.classList.toggle('act', !!onTap); t.onclick = onTap || null;
 clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on', 'act'), ms || 1800); }
$('badge').onclick = () => toast('Turf v' + VER + ' · ' + BUILD_DATE);

// ---------- layers ----------
function show(id){ ['title', 'story', 'hud', 'result', 'watch', 'home'].forEach(k => $(k).classList.toggle('on', k === id)); }

// ---------- the wordmark: TURF in chunky blocks, like the buildings ----------
function wordmark(){
 const G = {T:['11111', '00100', '00100', '00100', '00100'], U:['10001', '10001', '10001', '10001', '01110'], R:['11110', '10001', '11110', '10010', '10001'], F:['11111', '10000', '11110', '10000', '10000']};
 let s = '', x = 0;
 for (const ch of 'TURF'){ G[ch].forEach((row, y) => [...row].forEach((c, i) => { if (c === '1'){ const px = x + i * 10, py = y * 10;
   s += `<rect x="${px + 2}" y="${py + 2}" width="9" height="9" fill="#5a2620"/><rect x="${px}" y="${py}" width="9" height="9" fill="${ch === 'U' ? '#b9a3ff' : '#f2a23a'}"/>`; } })); x += 58; }
 return `<svg viewBox="0 0 232 52" role="img" aria-label="Turf">${s}</svg>`;
}
$('title').querySelector('h1').innerHTML = wordmark();

// ---------- troop icons for the bar: the same person the game draws, seen from the front as flat shapes ----------
function miniIcon(look, size){
 const P = MINI.fig(look, 0, 'idle', 1), cv = document.createElement('canvas'), d = Math.min(2, window.devicePixelRatio || 1), px = Math.round(size * d);
 cv.width = cv.height = px; cv.style.width = cv.style.height = size + 'px'; cv.setAttribute('aria-hidden', 'true');
 const c = cv.getContext('2d'), col = m => { const q = ART.MATS[m] || [120, 120, 120]; return 'rgb(' + q[0] + ',' + q[1] + ',' + q[2] + ')'; };
 const S = px / .8, ox = px * .56, oy = px * .985;
 const items = P.map(q => ({q, y:typeof q[0] === 'number' ? q[1] + q[4] / 2 : q[0] === 'e' ? q[2] : (q[2] + q[5]) / 2})).sort((a, b) => a.y - b.y);
 for (const it of items){ const q = it.q;
  if (q[0] === 'e'){ c.fillStyle = col(q[7]); c.beginPath(); c.ellipse(ox - q[1] * S, oy - q[3] * S, q[4] * S, q[6] * S, 0, 0, 7); c.fill(); }
  else if (q[0] === 'c'){ c.strokeStyle = col(q[9]); c.lineCap = 'round'; c.lineWidth = (q[7] + q[8]) * S; c.beginPath(); c.moveTo(ox - q[1] * S, oy - q[3] * S); c.lineTo(ox - q[4] * S, oy - q[6] * S); c.stroke(); }
  else { c.fillStyle = col(q[6]); c.fillRect(ox - (q[0] + q[3]) * S, oy - (q[2] + q[5]) * S, q[3] * S, q[5] * S); } }
 return cv;
}
const iconLook = k => 'm|' + {brawler:3, shooter:8, bruiser:21}[k] + '|' + MY_CREW + '|' + k;

// ---------- the map: 3D renderer, or a flat canvas when WebGL2 is missing ----------
const PALETTE = {sunC:[[.46, .44, .62], [1.0, .9, .76]], amb:[[.27, .27, .36], [.46, .46, .5]], sky:[[.07, .07, .13], [.33, .36, .44]], bg:[[.05, .05, .08], [.15, .16, .19]], torch:[1.35, .55]};
const EDGE = ART.edge();
let gl3d = false;
const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
// people get simpler as the camera pulls back: full detail up close, body blocks only when the whole block is on screen
function detail(){ const z = gl3d ? VIL.view().zoom : 9; return z < 3.4 ? 2 : z < 8 ? 1 : 0; }
function figFn(look, frame, mode){ return ART.figure(look, frame, mode, detail()); }
let MY_CREW = save.color;
function mountMap(){
 gl3d = !!(window.VIL && VIL.mount($('stage'), {mats:ART.MATS, figure:figFn, palette:PALETTE, shotMats:[9, 9, 22, 12], reduce, onGround, onTap:() => {}}));
 if (!gl3d){ $('fb').style.display = 'block'; $('nogl').style.display = 'block';
  if (location.protocol !== 'https:' && location.protocol !== 'http:') $('noglMsg').textContent = "Opened from a file, so the 3D block may not draw. Open Turf from its web address for the full look."; setTimeout(() => $('nogl').style.display = 'none', 6000); FB.init(); }
}

// scene parts from a block: buildings standing, or rubble once they are knocked down. The block on screen is either a rival's or your own.
let BLOCK = [], PARTS = [], RUBBLE = [], fenceSet = new Set(), blockKind = 'enemy', crewColor = 'gold', vicOn = true, lastDown = '';
function fenceShape(x, y){ return (fenceSet.has(x + ',' + (y - 1)) ? 1 : 0) | (fenceSet.has((x + 1) + ',' + y) ? 2 : 0) | (fenceSet.has(x + ',' + (y + 1)) ? 4 : 0) | (fenceSet.has((x - 1) + ',' + y) ? 8 : 0); }
function setBlock(list, kind){
 BLOCK = list; blockKind = kind; crewColor = kind === 'home' ? MY_CREW : 'gold';
 fenceSet = new Set(BLOCK.filter(i => i.k === 'fence').map(i => i.x + ',' + i.y));
 PARTS = BLOCK.map((it, n) => { const d = T.BDEFS[it.k], a = ART.blocks(it.k, n % 2, it.k === 'fence' ? fenceShape(it.x, it.y) : 0);
  return {id:it.key, key:it.key, k:it.k, x:it.x, y:it.y, fw:d.fp[0], fh:d.fp[1], boxes:a.boxes, lights:a.lights, smoke:a.smoke, top:a.top, tap:kind === 'home'}; });
 RUBBLE = kind === 'home' ? [] : PARTS.map(p => Object.assign({}, p, {boxes:ART.rubble(p.fw, p.fh, p.k), lights:[], smoke:[], top:.3}));
 lastDown = 'x';
}
setBlock(T.RESCUE_BLOCK, 'enemy');
let viceroyFree = false;
function viceroyActor(){
 if (!viceroyFree) return {route:[[12.35, 15.35, 0]], fig:(fr, mode) => figFn('viceroy_tied', fr, 'idle'), faceAt:0};
 return {route:[[12.35, 15.35, 0], [12.35, 16.5, 0], [14.5, 16.5, 0], [14.5, 21.4, 0]], fig:(fr, mode) => figFn('viceroy', fr, mode), speed:1.1, waitEnd:[1.5, 4]};
}
// the part of the yard your Main House level has not opened yet is left as a dark, empty lot
function homeTile(x, y){ const L = T.lotsOpen(T.houseLv(BLOCK));
 if (x >= 7 && x <= 21 && y >= 6 && y <= 20 && (x < L.x0 || x > L.x1 || y < L.y0 || y > L.y1)){ const r = ((x * 73856093) ^ (y * 19349663)) >>> 0; return r % 3 === 0 ? 23 : (r % 5 === 0 ? 15 : 1); }
 return ART.tile(x, y); }
const HANG = {house:2, gym:2, pad:1, hustle:1};   // how many of your people stand out front
function solidAt(x, y){ return BLOCK.some(i => { const f = T.BDEFS[i.k].fp; return x >= i.x && x < i.x + f[0] && y >= i.y && y < i.y + f[1]; }); }
function sceneFor(down){
 const home = blockKind === 'home', parts = PARTS.map((p, i) => down && down[i] ? RUBBLE[i] : p), actors = !home && vicOn ? [viceroyActor()] : [];
 // the people on the porches and the roof: they stand at their post until their building falls
 PARTS.forEach((p, i) => { const post = ART.POSTS[p.k]; if (!post || (down && down[i])) return; const look = 'm|' + (900 + i) + '|' + crewColor + '|shooter';
  actors.push({route:[[p.x + post[0], p.y + post[1], post[2]]], faceAt:0, fig:fr => figFn(look, 0, 'work')}); });
 if (home) PARTS.forEach((p, i) => { for (let j = 0; j < (HANG[p.k] || 0); j++){ const x = p.x + .55 + j * .95, y = p.y + p.fh + .4; if (solidAt(Math.floor(x), Math.floor(y))) continue;
   const look = 'm|' + (300 + i * 7 + j) + '|' + MY_CREW + '|' + T.ORDER[(i + j) % 2]; actors.push({route:[[x, y, 0]], faceAt:0, fig:fr => figFn(look, fr, 'idle')}); } });
 return {w:28, h:28, tile:home ? homeTile : ART.tile, edge:EDGE, parts, actors};
}
function paint(down){ const key = down ? down.join('') : ''; if (key === lastDown && gl3d) return; lastDown = key;
 if (gl3d) VIL.update(sceneFor(down)); else FB.scene(down); }

// ---------- flat fallback map (no WebGL2): top-down tiles, buildings and people ----------
const FB = (() => {
 let cv, cx, down = null, frame = null, zoneT = 0, zone = null;
 const col = m => { const c = ART.MATS[m] || [80, 80, 80]; return `rgb(${c[0]},${c[1]},${c[2]})`; };
 
 function size(){ const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = r.width * d; cv.height = r.height * d; }
 function view(){ const s = Math.min(cv.width, cv.height) / 28, ox = (cv.width - s * 28) / 2, oy = (cv.height - s * 28) / 2; return {s, ox, oy}; }
 function draw(){
  if (!cv) return; const {s, ox, oy} = view(); cx.fillStyle = '#0e0f12'; cx.fillRect(0, 0, cv.width, cv.height);
  for (let y = 0; y < 28; y++) for (let x = 0; x < 28; x++){ cx.fillStyle = col((blockKind === 'home' ? homeTile : ART.tile)(x, y)); cx.fillRect(ox + x * s, oy + y * s, s + .5, s + .5); }
  if (zone && zoneT > 0){ cx.fillStyle = 'rgba(240,64,52,.35)'; zone.forEach(([x, y]) => cx.fillRect(ox + x * s, oy + y * s, s, s)); }
  PARTS.forEach((p, i) => { const dead = down && down[i]; cx.fillStyle = dead ? '#3a3633' : p.k === 'fence' ? '#9aa3a8' : p.k === 'porch' || p.k === 'roof' ? '#cca030' : p.k === 'house' ? '#8a3b2e' : p.k === 'gym' || p.k === 'stash' || p.k === 'supstash' ? '#8f8a80' : p.k === 'hustle' || p.k === 'run' ? '#2f8c8c' : '#6a3a30';
   const pad = p.k === 'fence' ? s * .3 : s * .08; cx.fillRect(ox + p.x * s + pad, oy + p.y * s + pad, p.fw * s - pad * 2, p.fh * s - pad * 2); });
  if (frame) frame.u.forEach(u => { if (!u[6]) return; const meta = units[u[0]] || {}; cx.fillStyle = meta.side === 'd' ? '#cca030' : '#b9a3ff'; cx.beginPath(); cx.arc(ox + u[1] * s, oy + u[2] * s, s * (meta.type === 'bruiser' ? .42 : .3), 0, 7); cx.fill(); });
  if (blockKind === 'enemy' && vicOn){ cx.fillStyle = viceroyFree ? '#b9a3ff' : '#6f60b0'; cx.fillRect(ox + 12 * s, oy + 15 * s, s * .7, s * .7); }
  if (blockKind === 'home'){ const q = PARTS.find(p => p.key === homeSel); if (q){ cx.strokeStyle = '#ffecaa'; cx.lineWidth = Math.max(2, s * .12); cx.strokeRect(ox + q.x * s, oy + q.y * s, q.fw * s, q.fh * s); } }
 }
 function loop(){ requestAnimationFrame(loop); if (zoneT > 0) zoneT -= 1 / 60; draw(); }
 return {
  init(){ cv = $('fb'); cx = cv.getContext('2d'); size(); window.addEventListener('resize', size);
   cv.addEventListener('pointerup', e => { const r = cv.getBoundingClientRect(), d = cv.width / r.width, {s, ox, oy} = view(); onGround(((e.clientX - r.left) * d - ox) / s, ((e.clientY - r.top) * d - oy) / s); });
   loop(); },
  scene(d){ down = d; }, frame(f){ frame = f; }, flash(z){ zone = z; zoneT = 1.2; }
 };
})();

// ---------- story cards ----------
let storyQ = [], storyDone = null;
// each story beat can show a painted scene behind the card: [file, where to keep in frame when a tall screen crops it]
const SCENES = {rescue:['event-rescue.jpg', '50% 42%'], keys:['event-keys.jpg', '45% 28%']};
function story(lines, done, scene){ storyQ = lines.slice(); storyDone = done; show('story'); cam('viceroy');
 const im = $('storyPic'), sc = SCENES[scene];
 if (sc){ im.hidden = false; im.style.objectPosition = sc[1]; if (!im.src.endsWith(sc[0])) im.src = sc[0]; } else { im.hidden = true; im.removeAttribute('src'); }
 nextCard(); }
$('storyPic').onerror = () => { $('storyPic').hidden = true; };
$('titlePic').onerror = () => { $('titlePic').hidden = true; };
function nextCard(){ if (!storyQ.length){ const d = storyDone; storyDone = null; d && d(); return; } $('card').querySelector('.say').textContent = storyQ.shift(); }
// the Viceroy's portrait is a picture file (viceroy.png) uploaded beside the page; until it is there, the card shows no picture
(function(){ const im = $('faceImg'), box = $('card').querySelector('.face'); im.onload = () => { box.hidden = false; }; im.onerror = () => { box.hidden = true; }; im.src = 'viceroy.png'; })();
$('story').addEventListener('click', nextCard);
const INTRO = ["Well, well. A face I don't know, on a night I could use one.",
 "Those Boombox boys have me boxed in. Clear me a path and I'll make it worth your while.",
 "Pick your crew below. Tap the street to send them in."];
const WIN = "Darling, that was a performance. You've earned a roof. Come see me.";
const LOSE = "Not tonight. Catch your breath and run it again. I'm not going anywhere.";
const NEXT = "The house on the next block is yours now. Pick your colors and build it up. Then go collect what the Boombox boys owe us.";

// ---------- the attack ----------
let R = null, sim = null, units = {}, items = [], counts = {}, sel = null, queued = {}, raf = 0, acc = 0, lastT = 0, coreAt = 0, finished = false, zone = null, lastReport = null;
// every fighter is one person: the look is rolled from the fight's seed, so a replay shows the same faces
function meta(Rx){ const u = {}, base = (Rx.seed % 99991) * 37;
 Rx.attackers.forEach((a, i) => u[i] = {look:'m|' + (base + i + 1) + '|' + MY_CREW + '|' + a.type, type:a.type, max:a.hp, side:'a', barZ:a.type === 'bruiser' ? .9 : .76});
 Rx.defenders.forEach((d, i) => u[100 + i] = {look:'m|' + (base + 500 + i) + '|' + (Rx.crewColor || 'gold') + '|shooter', type:'shooter', max:d.hp, side:'d', barZ:.76});
 const it = Rx.items.map(b => { const p = PARTS.find(q => q.key === b.key); return {key:b.key, x:b.x, y:b.y, fw:b.fw, fh:b.fh, top:p ? p.top : 1, max:b.role === 'wall' ? 0 : b.hp}; }); return {u, it}; }
function buildBar(){
 const bar = $('bar'); bar.innerHTML = '';
 T.ORDER.forEach(k => { if (!counts[k]) return; const b = document.createElement('button'); b.className = 'troop'; b.dataset.k = k;
  b.innerHTML = `<span class="n">x${counts[k]}</span><span class="nm">${T.UNITS[k].name}</span>`; b.insertBefore(miniIcon(iconLook(k), 74), b.lastChild);
  b.onclick = e => { e.stopPropagation(); if (!counts[k]) return; sel = k; refreshBar(); }; bar.appendChild(b); });
 refreshBar();
}
function refreshBar(){ $('bar').querySelectorAll('.troop').forEach(b => { const k = b.dataset.k; b.classList.toggle('sel', k === sel); b.classList.toggle('out', !counts[k]); b.querySelector('.n').textContent = 'x' + counts[k]; }); }
function startAttack(recipe){
 R = recipe; setBlock(T.RESCUE_BLOCK, 'enemy'); vicOn = R.mode === 'rescue'; if (gl3d) VIL.edit(null);
 sim = B.raidStart(R, {record:true}); finished = false; coreAt = 0; queued = {}; acc = 0; lastT = 0; viceroyFree = false; lastDown = 'x';
 counts = {}; R.attackers.forEach(a => counts[a.type] = (counts[a.type] || 0) + 1); sel = T.ORDER.find(k => counts[k]) || null;
 const m = meta(R); units = m.u; items = m.it; zone = B.dropZone(R);
 paint(null); buildBar(); setStars($('hudStars'), 0); $('pct').textContent = '0%'; $('clock').textContent = clock(0);
 $('tip').style.opacity = 1; $('tip').textContent = 'Pick a troop, then tap the street';
 if (gl3d) VIL.battle({live:true, frames:sim.frames, tick:B.TICK, units, items, speed:1, follow:false});
 cam('attack');
 if (gl3d && !sidewaysTold && innerWidth < innerHeight){ sidewaysTold = true; setTimeout(() => toast('Turn your phone sideways to see the whole block', 2600), 400); }
 show('hud'); cancelAnimationFrame(raf); raf = requestAnimationFrame(run);
}
function run(now){
 raf = requestAnimationFrame(run);
 const dt = Math.min(.25, (now - (lastT || now)) / 1000); lastT = now; acc += dt;   // rAF pauses with the screen off, so a locked phone pauses the fight
 let n = 0; while (acc >= B.TICK && n < 4 && !finished){ acc -= B.TICK; n++; if (!sim.step()){ finish(); break; } afterTick(); }
 if (sim.done() && !finished) finish();
}
function afterTick(){
 const f = sim.frame(); if (!gl3d) FB.frame(f);
 const t = sim.tick() - 1; $('clock').textContent = clock(t);
 const down = items.map((b, i) => b.max > 0 ? f.b[i] <= 0 : f.b[i] <= 0);
 paint(down);
 let lost = 0, total = 0; items.forEach((b, i) => { if (!b.max) return; total += b.max; lost += b.max - Math.max(0, f.b[i]); });
 const pct = Math.round(100 * lost / (total || 1)), coreI = R.items.findIndex(b => b.role === 'core'), coreDown = f.b[coreI] <= 0;
 $('pct').textContent = pct + '%'; setStars($('hudStars'), (pct >= 50 ? 1 : 0) + (coreDown ? 1 : 0) + (pct >= 100 ? 1 : 0));
 if (coreDown && !coreAt){ coreAt = t; if (R.mode === 'rescue'){ viceroyFree = true; lastDown = 'x'; paint(down); toast('The Viceroy is free'); } }
 if (coreAt && R.mode === 'rescue' && t - coreAt === 25) sim.end();   // the rescue wraps up a moment after the house falls
}
function clock(t){ const left = Math.max(0, Math.ceil((R ? R.maxT : 1800) / 10 - t / 10)); return Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); }
function setStars(el, n){ el.querySelectorAll('i').forEach((s, i) => s.classList.toggle('on', i < n)); }
function onGround(x, y){
 if ($('home').classList.contains('on')){ homeGround(x, y); return; }
 if (!sim || finished || !$('hud').classList.contains('on')) return;
 if (!sel || !counts[sel]){ $('bar').classList.remove('nudge'); void $('bar').offsetWidth; $('bar').classList.add('nudge'); toast('Pick a troop first'); return; }
 if (!B.canDrop(R, x, y)){ if (gl3d) VIL.flashZone(zone); else FB.flash(zone); toast('Too close to their block. Drop on the street.'); return; }
 const i = R.attackers.findIndex((a, j) => a.type === sel && !queued[j] && !sim.placed(j));
 if (i < 0 || !sim.deploy(i, x, y)) return;
 queued[i] = 1; counts[sel]--; if (!counts[sel]) sel = T.ORDER.find(k => counts[k]) || null; refreshBar();
 $('tip').style.opacity = 0;
}
$('endBtn').onclick = e => { e.stopPropagation(); if (sim && !finished) sim.end(); };
function finish(){
 if (finished) return; finished = true; cancelAnimationFrame(raf); if (gl3d) VIL.battleEnd();
 const res = sim.result(), stars = T.starsFor(res), won = R.mode === 'rescue' ? res.coreDown : stars > 0;
 lastReport = T.reportFrom(R, res); lastReport.at = Date.now();
 save.tries++; save.best = Math.max(save.best, stars); if (won && R.mode === 'rescue') save.rescued = true;
 if (R.mode === 'raid' && save.block){   // the people you sent in are spent, the rest come home; loot and the corners pay out
  R.attackers.forEach((a, j) => { if (queued[j] || sim.placed(j)) save.army[a.type] = Math.max(0, (save.army[a.type] | 0) - 1); });
  const loot = T.lootFor(res, save.block), p = T.payout(save.block); lastReport.gain = addRes(loot.cash + p.cash, loot.sup + p.sup); }
 save.reports.unshift(lastReport); save.reports = save.reports.slice(0, 10); saveGame();
 setTimeout(() => showResult(res, stars, won), 900);
}
function showResult(res, stars, won){
 const raid = !!(lastReport && lastReport.recipe.mode === 'raid'), g = lastReport && lastReport.gain;
 $('resTitle').textContent = raid ? (won ? 'You hit the Boombox Kings' : 'They held the block') : (won ? 'The Viceroy is out' : 'They held the house');
 setStars($('resStars'), stars); $('resPct').textContent = res.pct + '% of the block knocked down' + (g ? '. You came home with ' + g.cash + ' Cash and ' + g.sup + ' Supplies.' : '');
 const again = () => raid ? startAttack(T.raidRecipe(seed(), save.army)) : startAttack(T.rescueRecipe(seed()));
 $('resNext').textContent = raid ? 'Back to your block' : won ? 'Talk to the Viceroy' : 'Try again';
 $('resNext').onclick = () => raid ? toHome() : won ? story([WIN, NEXT], toHome, 'keys') : again();
 $('resAgain').textContent = raid ? 'Hit them again' : 'Run it again'; $('resAgain').onclick = again;
 $('resAgain').style.display = (raid ? T.armySize(save.army) > 0 : won && !save.block) ? '' : 'none';
 show('result');
}
$('resWatch').onclick = () => watch(lastReport);
function seed(){ return (Date.now() ^ (Math.random() * 4294967296)) >>> 0; }

// ---------- Watch: the saved recipe fought again, frame by frame ----------
let wSpeed = 1, wPaused = false, wFrames = null, wI = 0, wRaf = 0;
function watch(rep){
 if (!rep) return; const Rw = JSON.parse(JSON.stringify(rep.recipe)); setBlock(T.RESCUE_BLOCK, 'enemy'); vicOn = Rw.mode === 'rescue'; if (gl3d) VIL.edit(null);
 const out = B.simRaid(Rw, {record:true}), m = meta(Rw);
 wFrames = out.frames; units = m.u; items = m.it; viceroyFree = false; lastDown = 'x'; paint(null); wSpeed = 1; wPaused = false;
 $('wPlay').textContent = 'Pause'; $('wSpeed').textContent = '2x'; $('watchLbl').textContent = 'Replay · ' + rep.stars + (rep.stars === 1 ? ' star' : ' stars');
 const onTick = i => { const f = wFrames[i], down = items.map((b, j) => f.b[j] <= 0), coreI = Rw.items.findIndex(b => b.role === 'core');
  if (vicOn && f.b[coreI] <= 0 && !viceroyFree){ viceroyFree = true; lastDown = 'x'; } paint(down); };
 show('watch'); cam('watch');
 if (gl3d){ VIL.battle({frames:wFrames, tick:B.TICK, units, items, speed:1, follow:true, zoom:VIL.view().zoom, onTick, onEnd:endWatch}); }
 else { wI = 0; cancelAnimationFrame(wRaf); let a = 0, lt = 0; const step = now => { wRaf = requestAnimationFrame(step); const dt = Math.min(.25, (now - (lt || now)) / 1000); lt = now; if (wPaused) return; a += dt * wSpeed;
   while (a >= B.TICK){ a -= B.TICK; wI++; if (wI >= wFrames.length){ cancelAnimationFrame(wRaf); endWatch(); return; } FB.frame(wFrames[wI]); onTick(wI); } }; wRaf = requestAnimationFrame(step); }
}
function endWatch(){ if (!$('watch').classList.contains('on')) return; if (lastReport) showResult({pct:lastReport.pct}, lastReport.stars, lastReport.recipe.mode === 'rescue' ? lastReport.stars >= 2 : lastReport.stars > 0); else toTitle(); }
$('wPlay').onclick = () => { wPaused = !wPaused; $('wPlay').textContent = wPaused ? 'Play' : 'Pause'; if (gl3d) VIL.battleSpeed(wPaused ? 0 : wSpeed); };
$('wSpeed').onclick = () => { wSpeed = wSpeed === 1 ? 2 : 1; $('wSpeed').textContent = wSpeed === 1 ? '2x' : '1x'; if (gl3d && !wPaused) VIL.battleSpeed(wSpeed); };
$('wSkip').onclick = () => { if (gl3d) VIL.battleSkip(); else { cancelAnimationFrame(wRaf); endWatch(); } };

// ---------- camera framing for each screen (3D only; the flat map always shows the whole grid) ----------
// zoom is half the view height in tiles, so a tall phone needs a bigger zoom to fit the same width. Held upright, the attack
// opens on the near corner of the block (the south and east streets) at a size where people read; turned sideways the whole block fits.
function cam(k){ if (!gl3d) return; const r = $('stage').getBoundingClientRect(), asp = (r.width || 1) / (r.height || 1), tall = asp < 1;
 const L = T.lotsOpen(save.block ? T.houseLv(save.block) : 1), n = L.x1 - L.x0 + 1;
 const C = {home:{tx:(L.x0 + L.x1 + 1) / 2 + .4, ty:(L.y0 + L.y1 + 1) / 2 + .6, zoom:tall ? Math.max(5.2, n * .6 / asp) : n * .42 + 1.6}, title:{tx:14, ty:14.6, zoom:Math.max(10.5, 13 / asp)}, viceroy:{tx:12.9, ty:15.9, zoom:1.15},
  attack:tall ? {tx:17.2, ty:19.2, zoom:Math.max(7.6, 6.6 / asp)} : {tx:14.4, ty:15.6, zoom:7.6}, watch:tall ? {tx:15.5, ty:17.5, zoom:Math.max(7.6, 7.6 / asp)} : {tx:14.2, ty:15.2, zoom:7.6}}[k];
 VIL.view(C); }
let sidewaysTold = false;
// ---------- full screen: one tap hides the browser bars (Android Chrome and desktop; an iPhone only gets this by installing the app) ----------
const fsEl = document.documentElement, fsCan = !!(fsEl.requestFullscreen || fsEl.webkitRequestFullscreen);
const standalone = !!((window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches)) || navigator.standalone);
const fsOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function fsEnter(){ try { const p = (fsEl.requestFullscreen || fsEl.webkitRequestFullscreen).call(fsEl); if (p && p.catch) p.catch(() => {}); } catch (e){} }
function fsLeave(){ try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e){} }
$('fsBtn').hidden = !fsCan || standalone;
$('fsBtn').onclick = e => { e.stopPropagation(); if (fsOn()){ save.fs = false; fsLeave(); } else { save.fs = true; fsEnter(); } saveGame(); };
['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => { const t = fsOn() ? 'Leave full screen' : 'Full screen'; $('fsBtn').querySelector('span').textContent = t; $('fsBtn').setAttribute('aria-label', t); }));
// ---------- title ----------
function toTitle(){
 if (gl3d){ VIL.battle(null); VIL.edit(null); } setBlock(T.RESCUE_BLOCK, 'enemy'); vicOn = true; viceroyFree = !!save.rescued; paint(null);
 $('goBtn').textContent = save.rescued ? 'Go to your block' : 'Start';
 $('watchBtn').hidden = !save.reports.length;
 show('title'); cam('title');
}
$('goBtn').onclick = () => { if (save.fs && fsCan && !standalone && !fsOn()) fsEnter(); if (save.rescued) toHome(); else story(INTRO, () => startAttack(T.rescueRecipe(seed())), 'rescue'); };
$('watchBtn').onclick = () => { lastReport = save.reports[0]; try { watch(lastReport); } catch (e){ save.reports = []; saveGame(); toTitle(); toast("That replay can't be played"); } };

// ---------- your block: build, level up, train a crew ----------
let homeSel = null, fenceMode = null, sheetKind = null, firstHome = false;
const item = key => save.block ? save.block.find(i => i.key === key) : null;
const costText = c => !c ? '' : (c[0] ? c[0] + ' Cash' : '') + (c[0] && c[1] ? ' + ' : '') + (c[1] ? c[1] + ' Supplies' : '') || 'Free';
const has = c => save.cash >= c[0] && save.sup >= c[1];
function pay(c){ save.cash -= c[0]; save.sup -= c[1]; }
// stashes cap what you can hold; returns what actually went in
function addRes(cash, sup){ const cap = T.storeCap(save.block), c0 = save.cash, s0 = save.sup;
 save.cash = Math.max(c0, Math.min(cap.cash, c0 + cash)); save.sup = Math.max(s0, Math.min(cap.sup, s0 + sup)); return {cash:save.cash - c0, sup:save.sup - s0}; }
function gangHex(c){ const m = ART.MATS[MINI.M[MINI.GANGS[c][0]]] || [185, 163, 255]; return 'rgb(' + m[0] + ',' + m[1] + ',' + m[2] + ')'; }
function homeHud(){
 const cap = T.storeCap(save.block); $('hCash').textContent = save.cash; $('hSup').textContent = save.sup;
 $('hCash').parentNode.classList.toggle('full', save.cash >= cap.cash); $('hSup').parentNode.classList.toggle('full', save.sup >= cap.sup);
 $('hArmy').textContent = T.armySize(save.army) + '/' + T.armyCap(save.block); $('hCrew').querySelector('.ic').style.background = gangHex(MY_CREW);
 const hint = $('hHint'); hint.hidden = !fenceMode;
 if (fenceMode){ const left = T.capFor('fence', T.houseLv(save.block)) - T.count(save.block, 'fence');
  $('hHintTxt').textContent = fenceMode === 'paint' ? (gl3d ? 'Drag to lay fence. ' : 'Tap to lay fence. ') + left + ' left.' : (gl3d ? 'Drag over fence to take it down.' : 'Tap fence to take it down.'); }
}
function homePaint(){ setBlock(save.block, 'home'); if (gl3d){ VIL.update(sceneFor(null)); VIL.select(homeSel); } else FB.scene(null); homeHud(); }
function setEdit(){ if (gl3d){ VIL.edit(fenceMode || 'move', HANDLERS); VIL.select(homeSel); } }
const HANDLERS = {
 movable:key => key === homeSel && !fenceMode,
 canPlace:(key, x, y) => { const it = item(key); return !!it && T.fitsAt(save.block, key, it.k, x, y); },
 place:(key, x, y) => moveTo(key, x, y),
 reject:() => toast("It doesn't fit there"),
 select:key => selectItem(key == null ? null : key, true),
 ring:key => { if (key !== homeSel) return 0; const it = item(key), d = it && T.BDEFS[it.k]; return d && d.range || 0; },
 paint:(x, y) => fenceAt(x, y, true), erase:(x, y) => fenceAt(x, y, false)
};
function selectItem(key, fromMap){
 if (!$('home').classList.contains('on')) return;
 homeSel = key && item(key) ? key : null; if (!fromMap && gl3d) VIL.select(homeSel);
 if (homeSel) openSheet('info'); else if (sheetKind === 'info') closeSheet();
}
function moveTo(key, x, y){ const it = item(key); if (!it) return; const ox = it.x, oy = it.y; it.x = x; it.y = y;
 if (!T.reachOk(save.block)){ it.x = ox; it.y = oy; toast('That would wall something in'); } else saveGame();
 homePaint(); }
function fenceAt(x, y, add){
 const b = save.block, i = b.findIndex(q => q.k === 'fence' && q.x === x && q.y === y);
 if (add){ if (i >= 0) return; const c = T.HOME.fence.cost;
  if (!T.fitsAt(b, null, 'fence', x, y)) return;
  if (T.count(b, 'fence') >= T.capFor('fence', T.houseLv(b))){ toast('No more fence at this house level'); return; }
  if (!has(c)){ toast('Fence costs ' + costText(c) + ' a piece'); return; }
  b.push({key:'f' + x + '_' + y, k:'fence', x, y, lv:1});
  if (!T.reachOk(b)){ b.pop(); toast('That would wall something in'); return; }
  pay(c); }
 else { if (i < 0) return; b.splice(i, 1); addRes(0, T.HOME.fence.cost[1]); }
 saveGame(); homePaint();
}
function buy(k){
 const b = save.block, c = T.HOME[k].cost, lv = T.houseLv(b);
 if (T.count(b, k) >= T.capFor(k, lv)){ toast(T.capFor(k, lv) ? 'Level up the Main House for more' : 'Opens at Main House level 2'); return; }
 if (!has(c)){ toast('Needs ' + costText(c)); return; }
 const spot = T.freeSpot(b, k); if (!spot){ toast('No room on the lot. Move things or level up the Main House.'); return; }
 const it = {key:'b' + (save.nk++), k, x:spot[0], y:spot[1], lv:1}; b.push(it);
 if (!T.reachOk(b)){ b.pop(); toast('No spot that leaves a way in. Move a fence first.'); return; }
 pay(c); saveGame(); homeSel = it.key; homePaint(); openSheet('info'); focusOn(it.x + 1, it.y + 1);
 toast(gl3d ? 'Placed. Drag it where you want it.' : 'Placed. Tap an open spot to move it.', 2400);
}
function levelUp(key){
 const it = item(key); if (!it) return; const c = T.upgradeCost(it.k, it.lv); if (!c) return;
 if (!has(c)){ toast('Needs ' + costText(c)); return; }
 pay(c); it.lv++; saveGame(); homePaint(); openSheet('info');
 if (it.k === 'house'){ cam('home'); toast('The lot got bigger. New limits on everything.', 2600); } else toast(T.BDEFS[it.k].name + ' is level ' + it.lv);
}
function train(k, n){
 const a = save.army;
 if (n < 0){ if (a[k] > 0){ a[k]--; saveGame(); } }
 else {
  if (T.gymLv(save.block) < T.UNLOCKS[k]){ toast('Level the Gym to ' + T.UNLOCKS[k] + ' first'); return; }
  if (T.armySize(a) + T.SIZE[k] > T.armyCap(save.block)){ toast('No beds left. Level up the Crash Pad.'); return; }
  const c = [T.trainCost(k), 0]; if (!has(c)){ toast('Needs ' + costText(c)); return; }
  pay(c); a[k]++; saveGame(); }
 homeHud(); openSheet('crew');
}
function setColor(c){ if (!MINI.GANGS[c] || c === 'gold') return; save.color = MY_CREW = c; saveGame(); homePaint(); openSheet('crew'); }
function statLine(it){
 const k = it.k, lv = it.lv, b = save.block;
 if (k === 'house'){ const L = T.lotsOpen(lv), n = L.x1 - L.x0 + 1; return 'Your lot is ' + n + ' by ' + n + '.' + (lv < T.maxLv(k) ? ' The next level opens ' + (n + 2) + ' by ' + (n + 2) + '.' : ''); }
 if (k === 'hustle') return 'Pays ' + 60 * lv + ' Cash after every fight.';
 if (k === 'run') return 'Brings ' + 40 * lv + ' Supplies after every fight.';
 if (k === 'stash') return 'Holds ' + 1500 * lv + ' Cash. You can hold ' + T.storeCap(b).cash + ' in all.';
 if (k === 'supstash') return 'Holds ' + 1500 * lv + ' Supplies. You can hold ' + T.storeCap(b).sup + ' in all.';
 if (k === 'pad') return 'Sleeps ' + (14 + 6 * lv) + '.';
 if (k === 'gym') return 'Trains ' + T.ORDER.filter(u => T.UNLOCKS[u] <= lv).map(u => T.UNITS[u].name + 's').join(', ') + '.';
 if (k === 'porch' || k === 'roof') return 'Reaches ' + T.BDEFS[k].range + ' tiles. Guards the block once rivals can hit back.';
 if (k === 'fence') return T.count(b, 'fence') + ' of ' + T.capFor('fence', T.houseLv(b)) + ' pieces up.';
 return '';
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c]));
function openSheet(kind){
 const body = $('sheetBody'); let h = ''; sheetKind = kind;
 if (kind === 'info'){ const it = item(homeSel); if (!it){ closeSheet(); return; } const d = T.BDEFS[it.k], c = T.upgradeCost(it.k, it.lv);
  h = '<h3>' + esc(d.name) + (it.k === 'fence' ? '' : '<span>Level ' + it.lv + '</span>') + '</h3><p>' + esc(T.HOME[it.k].line) + '</p><p class="stat">' + esc(statLine(it)) + '</p>';
  if (it.k === 'fence') h += '<button class="btn" data-act="unfence">Take it down, ' + T.HOME.fence.cost[1] + ' Supplies back</button>';
  else { h += c ? '<button class="btn main' + (has(c) ? '' : ' no') + '" data-act="up">Level up for ' + costText(c) + '</button>' : '<p class="stat">Top level.</p>';
   h += '<p>' + (gl3d ? 'Drag it to move it.' : 'Tap an open spot to move it there.') + '</p>'; } }
 else if (kind === 'shop'){ const b = save.block, lv = T.houseLv(b);
  h = '<h3>Build</h3><div class="rows">';
  const fn = T.count(b, 'fence'), fc = T.capFor('fence', lv);
  h += '<div class="row"><span class="mid"><span class="nm">Chain-link Fence</span><br><span class="sub">' + fn + ' of ' + fc + ' up. ' + T.HOME.fence.cost[1] + ' Supplies a piece.</span></span><button class="mini" data-act="lay">Lay</button><button class="mini" data-act="pull">Take down</button></div>';

  T.SHOP.forEach(k => { const n = T.count(b, k), cap = T.capFor(k, lv), c = T.HOME[k].cost, off = n >= cap || !has(c);
   h += '<button class="row' + (off ? ' no' : '') + '" data-buy="' + k + '"><span class="mid"><span class="nm">' + esc(T.BDEFS[k].name) + '</span><br><span class="sub">' + esc(T.HOME[k].line) + '</span></span><span class="pr">' + (cap ? n + ' of ' + cap + '<br>' + costText(c) : 'House level 2') + '</span></button>'; });
  h += '</div>'; }
 else if (kind === 'crew'){ const a = save.army, g = T.gymLv(save.block);
  h = '<h3>Your crew<span>' + T.armySize(a) + ' of ' + T.armyCap(save.block) + ' beds</span></h3><p>Colors are the only thing that marks your people.</p><div class="sw">';
  GANG_PICK.forEach(c => { h += '<button data-col="' + c + '" class="' + (c === MY_CREW ? 'on' : '') + '" style="background:' + gangHex(c) + '" aria-label="' + c + '"></button>'; });
  h += '</div><div class="rows">';
  T.ORDER.forEach(k => { const u = T.UNITS[k], open = g >= T.UNLOCKS[k];
   h += '<div class="row' + (open ? '' : ' no') + '" data-unit="' + k + '"><span class="mid"><span class="nm">' + esc(u.name) + ' x' + (a[k] || 0) + '</span><br><span class="sub">' + (open ? esc(u.line) + ' ' + T.SIZE[k] + (T.SIZE[k] === 1 ? ' bed.' : ' beds.') : 'Comes in at Gym level ' + T.UNLOCKS[k] + '.') + '</span></span>'
    + (open ? '<button class="mini" data-train="' + k + '" data-n="-1" aria-label="Let one ' + esc(u.name) + ' go">-</button><button class="mini" data-train="' + k + '" data-n="1">+ ' + T.trainCost(k) + '</button>' : '') + '</div>'; });
  h += '</div>'; }
 body.innerHTML = h;
 if (kind === 'crew') body.querySelectorAll('[data-unit]').forEach(r => r.insertBefore(miniIcon(iconLook(r.dataset.unit), 64), r.firstChild));
 $('sheet').hidden = false; $('home').classList.add('sheeton');
}
function closeSheet(){ sheetKind = null; $('sheet').hidden = true; $('home').classList.remove('sheeton'); }
$('sheetX').onclick = () => { const was = sheetKind; closeSheet(); if (was === 'info'){ homeSel = null; if (gl3d) VIL.select(null); else FB.scene(null); } };
$('sheetBody').addEventListener('click', e => {
 const t = e.target.closest('[data-buy],[data-act],[data-train],[data-col]'); if (!t) return;
 if (t.dataset.buy) buy(t.dataset.buy);
 else if (t.dataset.train) train(t.dataset.train, +t.dataset.n);
 else if (t.dataset.col) setColor(t.dataset.col);
 else if (t.dataset.act === 'up') levelUp(homeSel);
 else if (t.dataset.act === 'unfence'){ const it = item(homeSel); if (it){ homeSel = null; closeSheet(); fenceAt(it.x, it.y, false); } }
 else if (t.dataset.act === 'lay' || t.dataset.act === 'pull'){ fenceMode = t.dataset.act === 'lay' ? 'paint' : 'erase'; homeSel = null; closeSheet(); setEdit(); homeHud();
  if (gl3d) toast('Two fingers move the map while you work on fence', 2600); }
});
$('hHintDone').onclick = () => { fenceMode = null; setEdit(); homeHud(); };
$('hBuild').onclick = () => openSheet('shop');
$('hTrain').onclick = $('hCrew').onclick = () => openSheet('crew');
$('hAttack').onclick = () => { if (!T.armySize(save.army)){ toast('Train a crew first'); openSheet('crew'); return; } startAttack(T.raidRecipe(seed(), save.army)); };
// the flat map has no dragging: tap a building to pick it, then tap an open spot to move it there
function homeGround(gx, gy){
 const x = Math.floor(gx), y = Math.floor(gy);
 if (fenceMode){ fenceAt(x, y, fenceMode === 'paint'); return; }
 const p = PARTS.find(q => x >= q.x && x < q.x + q.fw && y >= q.y && y < q.y + q.fh);
 if (p){ selectItem(p.key); FB.scene(null); return; }
 const it = item(homeSel); if (it && T.fitsAt(save.block, it.key, it.k, x, y)){ moveTo(it.key, x, y); return; }
 selectItem(null);
}
// slide the camera so a spot on the lot sits clear of the sheet
function focusOn(x, y){ if (!gl3d) return; const v = VIL.view(), r = $('stage').getBoundingClientRect(), tall = r.width < r.height;
 const p = VIL.project(x, y, 0), a = VIL.project(x + 1, y, 0), b = VIL.project(x, y + 1, 0); if (!p || !a || !b) return;
 const ex = p[0] - (tall ? r.width * .5 : r.width * .27), ey = p[1] - (tall ? r.height * .36 : r.height * .5);
 const j11 = a[0] - p[0], j21 = a[1] - p[1], j12 = b[0] - p[0], j22 = b[1] - p[1], det = j11 * j22 - j12 * j21; if (!det) return;
 VIL.view({tx:v.tx + (j22 * ex - j12 * ey) / det, ty:v.ty + (-j21 * ex + j11 * ey) / det, zoom:v.zoom}); }
function toHome(){
 if (!save.block){ save.block = T.starterBlock(); save.cash = T.START.cash; save.sup = T.START.sup; save.army = Object.assign({}, T.START.army); save.nk = 20; saveGame(); firstHome = true; }
 if (gl3d) VIL.battle(null); homeSel = null; fenceMode = null; closeSheet(); show('home'); homePaint(); setEdit(); cam('home');
 if (firstHome){ firstHome = false; openSheet('crew'); }
}

// ---------- updates: a new build on the server prompts a reload ----------
function checkUpdate(){
 fetch('sw.js', {cache:'no-store'}).then(r => r.ok ? r.text() : '').then(t => { const m = t.match(/turf-v([\d.]+)/); if (m && m[1] !== VER){ toast('New version ' + m[1] + ', tap to reload', 12000, () => location.reload()); if ('serviceWorker' in navigator) swUpdate(); } }).catch(() => {});
}
function bust(){
 // the version buster: if the page on the server is newer than this copy, load it once
 try { if (sessionStorage.getItem('turf.bust') === VER) return; } catch (e){}
 fetch(location.pathname, {cache:'no-store'}).then(r => r.ok ? r.text() : '').then(t => { const m = t.match(/<meta name="build" content="([^"]+)"/);
  if (m && m[1] !== VER){ try { sessionStorage.setItem('turf.bust', VER); } catch (e){} location.replace(location.pathname + '?v=' + m[1]); } }).catch(() => {});
}
// ask the browser to look for a newer service worker now, not whenever it gets around to it
function swUpdate(){ try { navigator.serviceWorker.getRegistration().then(r => { if (r) r.update().catch(() => {}); }).catch(() => {}); } catch (e){} }
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').then(swUpdate).catch(() => {});
if (location.protocol.startsWith('http')){ bust(); checkUpdate(); document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(); }); }

// ---------- go ----------
mountMap(); toTitle();
// test hook (used by the headless proof): read-only peeks at the fight
window.TURF_TEST = {block:() => JSON.parse(JSON.stringify(save.block)), home:() => ({cash:save.cash, sup:save.sup, army:Object.assign({}, save.army), sel:homeSel, sheet:sheetKind, fence:fenceMode, color:MY_CREW, lv:save.block ? T.houseLv(save.block) : 0, n:save.block ? save.block.length : 0}),
 state:() => ({screen:['title', 'story', 'hud', 'result', 'watch', 'home'].find(k => $(k).classList.contains('on')), tick:sim ? sim.tick() : 0, counts:Object.assign({}, counts), sel, finished, gl3d, reports:save.reports.length}),
 toScreen:(x, y, z) => gl3d ? VIL.project(x, y, z || 0) : null, result:() => sim ? sim.result() : null};
})();
