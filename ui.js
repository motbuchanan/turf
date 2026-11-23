// ===== TURF UI =====
// Screens: title, the Viceroy's story cards, the hands-on attack (the rescue and loot raids), the result, Watch, and your own block.
(function(){
'use strict';
const B = BASE, T = TURF, $ = id => document.getElementById(id);
const SAVE_KEY = 'turf.save.v1';
const DEFAULT_SAVE = {v:1, rescued:false, best:0, tries:0, reports:[], block:null, cash:0, sup:0, color:'lav', army:{brawler:0, shooter:0, bruiser:0}, nk:20, fs:false, rep:0, research:{}, camp:{}, night:false, kit:{}, party:{}};
const GANG_PICK = ['lav', 'teal', 'red', 'green', 'orange', 'blue'];   // gold belongs to the Boombox Kings

// ---------- save (guarded: a phone that blocks storage still plays, it just forgets) ----------
let memSave = null;
function loadSave(){
 let raw = null; try { raw = localStorage.getItem(SAVE_KEY); } catch (e){}
 let s = {}; try { s = raw ? JSON.parse(raw) || {} : (memSave || {}); } catch (e){ s = {}; }
 const out = Object.assign(JSON.parse(JSON.stringify(DEFAULT_SAVE)), s);
 const okRep = r => r && r.recipe && ['items', 'attackers', 'defenders', 'deploys'].every(k => Array.isArray(r.recipe[k])) && (r.recipe.mode !== 'camp' || (Array.isArray(r.recipe.camp) && T.CREWS[r.recipe.camp[0]] && r.recipe.camp[1] >= 0 && r.recipe.camp[1] < T.CAMP.blocks));
 out.reports = Array.isArray(out.reports) ? out.reports.filter(okRep).slice(0, 30) : [];
 // anything a save holds is checked before use: a block that fits the rules, whole numbers, a color that exists
 out.block = T.cleanBlock(out.block);
 if (out.block){ const cap = T.storeCap(out.block); out.cash = Math.min(out.cash | 0, cap.cash); out.sup = Math.min(out.sup | 0, cap.sup); }
 if (!out.army || typeof out.army !== 'object') out.army = {}; T.ORDER.forEach(k => out.army[k] = Math.max(0, Math.min(99, out.army[k] | 0)));
 out.cash = Math.max(0, Math.min(999999, out.cash | 0)); out.sup = Math.max(0, Math.min(999999, out.sup | 0)); out.nk = Math.max(20, out.nk | 0); out.rep = Math.max(0, Math.min(999999, out.rep | 0));
 const rs = out.research && typeof out.research === 'object' ? out.research : {}; out.research = {}; T.ORDER.forEach(k => { const v = rs[k] | 0; if (v > 1) out.research[k] = Math.min(T.RESEARCH.max, v); });
 if (GANG_PICK.indexOf(out.color) < 0) out.color = 'lav';
 out.camp = T.cleanCamp(out.camp); out.night = out.night === true; out.kit = T.cleanKit(out.kit); out.party = T.cleanParty(out.party);
 delete out.pending;
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
// the painted logo (logo.png, uploaded beside the page) replaces the block wordmark once it has loaded
(function(){ const im = new Image(); im.alt = 'Turf'; im.onload = () => { const h = $('title').querySelector('h1'); h.innerHTML = ''; h.appendChild(im); h.classList.add('painted'); }; im.src = 'logo.png'; })();

// ---------- the intro: five painted shots, one line each, about 30 seconds, always skippable and always silent ----------
// Files sit beside the page: intro-N.jpg (the still) and intro-N.mp4 (the clip). A shot whose still is missing is left out;
// a shot whose clip is missing or will not play shows the still with a slow push in.
// Only shots whose files are in the repo are listed, so nothing is asked for that is not there. Shot 4 ('They boxed him in his own house.',
// intro-4.jpg and intro-4.mp4) goes back in between 3 and 5 when its art is done.
// each shot: file number, its line, and the point of the picture to keep in view when it is zoomed to fill more of the screen
const INTRO_SHOTS = [[1, 'Every block belongs to somebody.', '50% 58%'], [2, 'This one belonged to the Viceroy.', '44% 45%'], [3, 'Then the Boombox Kings came for it.', '50% 34%'],
 [5, 'Tonight, somebody new walks up the street.', '50% 50%']];
const INTRO_KEY = 'turf.intro.v1', SHOT_MS = 6000;
let introList = [], introAt = -1, introT = 0, introDone = null;
function introSeen(){ try { return localStorage.getItem(INTRO_KEY) === '1'; } catch (e){ return true; } }
// find which shots have a still; calls back with the list (possibly empty)
function introFind(cb){ let left = INTRO_SHOTS.length; const ok = [];
 INTRO_SHOTS.forEach(([n, line, focus], i) => { const im = new Image(); const fin = good => { if (good) ok[i] = {n, line, focus, ar:im.naturalWidth / im.naturalHeight}; if (!--left) cb(ok.filter(Boolean)); };
  im.onload = () => fin(true); im.onerror = () => fin(false); im.src = 'intro-' + n + '.jpg'; }); }
function introPlay(done){ introDone = done || null;
 introFind(list => { if (!list.length){ introEnd(); return; } introList = list; $('introPips').innerHTML = list.map(() => '<i></i>').join(''); $('intro').hidden = false; introShot(0); }); }
function introShot(i){ clearTimeout(introT); if (i >= introList.length){ introEnd(); return; } introAt = i; const s = introList[i], pic = $('introPic'), vid = $('introVid'), src = 'intro-' + s.n + '.jpg';
 introFit(); $('introBg').src = src; pic.classList.remove('push'); pic.src = src; pic.hidden = false; void pic.offsetWidth; pic.classList.add('push');
 vid.hidden = true; vid.oncanplay = () => { if (introAt !== i) return; const p = vid.play(); if (p && p.then) p.then(() => { if (introAt === i){ vid.hidden = false; pic.hidden = true; } }).catch(() => {}); };
 vid.onerror = () => {}; vid.muted = true; vid.src = 'intro-' + s.n + '.mp4'; try { vid.load(); } catch (e){}
 $('introCap').textContent = s.line; $('introCap').classList.remove('in'); void $('introCap').offsetWidth; $('introCap').classList.add('in');
 [...$('introPips').children].forEach((p, k) => p.className = k < i ? 'done' : k === i ? 'now' : '');
 introT = setTimeout(() => introShot(i + 1), SHOT_MS); }
// a wide picture on an upright phone (or a tall one on a phone held sideways) is zoomed in toward its focus point, up to 1.7 times,
// so it fills more of the screen; the blurred copy behind fills the rest
function introFit(){ const s = introList[introAt]; if (!s) return; const va = innerWidth / innerHeight, z = Math.max(1, Math.min(1.7, s.ar > va ? s.ar / va : va / s.ar)), f = $('introFrame');
 f.style.transformOrigin = s.focus; f.style.transform = 'scale(' + z.toFixed(3) + ')'; }
addEventListener('resize', introFit);
function introEnd(){ clearTimeout(introT); introAt = -1; const vid = $('introVid'); try { vid.pause(); vid.removeAttribute('src'); vid.load(); } catch (e){}
 $('intro').hidden = true; try { localStorage.setItem(INTRO_KEY, '1'); } catch (e){} $('introBtn').hidden = false; const d = introDone; introDone = null; if (d) d(); }
$('introSkip').onclick = e => { e.stopPropagation(); introEnd(); };
$('intro').onclick = () => { if (introAt >= 0) introShot(introAt + 1); };   // a tap moves to the next shot
$('introBtn').onclick = () => introPlay();

// ---------- troop icons for the bar: the same person the game draws, seen from the front as flat shapes ----------
function miniIcon(look, size){
 const P = MINI.fig(look, 0, 'idle', 1), cv = document.createElement('canvas'), d = Math.min(2, window.devicePixelRatio || 1), px = Math.round(size * d);
 cv.width = cv.height = px; cv.style.width = cv.style.height = size + 'px'; cv.setAttribute('aria-hidden', 'true');
 const c = cv.getContext('2d'), col = m => { const q = ART.MATS[m] || [120, 120, 120]; return 'rgb(' + q[0] + ',' + q[1] + ',' + q[2] + ')'; };
 let S = px / .8, ox = px * .56, oy = px * .985;
 if (/\|drone$/.test(look)){   // the drone floats high and small: frame it to fill the card
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; const ext = (x, z, r) => { x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); z0 = Math.min(z0, z - r); z1 = Math.max(z1, z + r); };
  for (const q of P){ if (typeof q[0] === 'number'){ ext(q[0], q[2], 0); ext(q[0] + q[3], q[2] + q[5], 0); } else if (q[0] === 'e') ext(q[1], q[3], Math.max(q[4], q[6])); else { ext(q[1], q[3], q[7]); ext(q[4], q[6], q[8]); } }
  S = px * .8 / Math.max(x1 - x0, z1 - z0); ox = px / 2 + (x0 + x1) / 2 * S; oy = px / 2 + (z0 + z1) / 2 * S; }
 const items = P.map(q => ({q, y:typeof q[0] === 'number' ? q[1] + q[4] / 2 : q[0] === 'e' ? q[2] : (q[2] + q[5]) / 2})).sort((a, b) => a.y - b.y);
 for (const it of items){ const q = it.q;
  if (q[0] === 'e'){ c.fillStyle = col(q[7]); c.beginPath(); c.ellipse(ox - q[1] * S, oy - q[3] * S, q[4] * S, q[6] * S, 0, 0, 7); c.fill(); }
  else if (q[0] === 'c'){ c.strokeStyle = col(q[9]); c.lineCap = 'round'; c.lineWidth = (q[7] + q[8]) * S; c.beginPath(); c.moveTo(ox - q[1] * S, oy - q[3] * S); c.lineTo(ox - q[4] * S, oy - q[6] * S); c.stroke(); }
  else { c.fillStyle = col(q[6]); c.fillRect(ox - (q[0] + q[3]) * S, oy - (q[2] + q[5]) * S, q[3] * S, q[5] * S); } }
 return cv;
}
const ICON_SEED = {brawler:3, shooter:8, bruiser:21, snatcher:4, breacher:6, medic:7, shotgunner:9, drone:10, biker:12, heavy:14};
const iconLook = k => 'm|' + (ICON_SEED[k] || 1) + '|' + MY_CREW + '|' + k;

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
let BLOCK = [], PARTS = [], RUBBLE = [], OPEN = [], fenceSet = new Set(), blockKind = 'enemy', crewColor = 'gold', vicOn = true, lastDown = '';
function fenceShape(x, y){ return (fenceSet.has(x + ',' + (y - 1)) ? 1 : 0) | (fenceSet.has((x + 1) + ',' + y) ? 2 : 0) | (fenceSet.has(x + ',' + (y + 1)) ? 4 : 0) | (fenceSet.has((x - 1) + ',' + y) ? 8 : 0); }
function setBlock(list, kind, color){
 BLOCK = list; blockKind = kind; crewColor = kind === 'home' ? MY_CREW : color || 'gold';
 fenceSet = new Set(BLOCK.filter(i => i.k === 'fence').map(i => i.x + ',' + i.y));
 // kinds: 'home' (your block, editable), 'own' (your block in a practice fight), 'enemy' (a rival's: their traps stay hidden until they go off)
 PARTS = BLOCK.map((it, n) => { const d = T.BDEFS[it.k], a = ART.blocks(it.k, it.k === 'fence' ? it.lv || 1 : n % 2, it.k === 'fence' ? fenceShape(it.x, it.y) : 0), hidden = kind === 'enemy' && d.role === 'trap';
  return {id:it.key, key:it.key, k:it.k, x:it.x, y:it.y, fw:d.fp[0], fh:d.fp[1], boxes:hidden ? [] : a.boxes, lights:a.lights, smoke:a.smoke, top:a.top, tap:kind === 'home'}; });
 RUBBLE = kind === 'home' ? [] : PARTS.map(p => Object.assign({}, p, {boxes:ART.rubble(p.fw, p.fh, p.k), lights:[], smoke:[], top:.3}));
 OPEN = PARTS.map(p => { if (p.k !== 'popup') return null; const a = ART.blocks('popupOpen', 0, 0); return Object.assign({}, p, {boxes:a.boxes, lights:a.lights, top:a.top}); });
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
 const home = blockKind === 'home', parts = PARTS.map((p, i) => down && down[i] === 'open' ? OPEN[i] || p : down && down[i] ? RUBBLE[i] : p), actors = !home && vicOn ? [viceroyActor()] : [];
 // Pops Cassette, boss of the Boombox Kings, watches from his store's doorway until the store goes down
 if (!home && crewColor === 'gold'){ const si = PARTS.findIndex(p => p.k === 'store'); if (si >= 0 && !(down && down[si])){ const s0 = PARTS[si]; actors.push({route:[[s0.x - .45, s0.y + s0.fh + .25, 0]], faceAt:0, fig:fr => figFn('pops', fr, 'idle')}); } }
 // the people on the porches and the roof: they stand at their post until their building falls
 PARTS.forEach((p, i) => { const post = ART.POSTS[p.k]; if (!post || (down && down[i])) return; const look = 'm|' + (900 + i) + '|' + crewColor + '|shooter';
  actors.push({route:[[p.x + post[0], p.y + post[1], post[2]]], faceAt:0, fig:fr => figFn(look, 0, 'work')}); });
 if (home) PARTS.forEach((p, i) => { for (let j = 0; j < (HANG[p.k] || 0); j++){ const x = p.x + .55 + j * .95, y = p.y + p.fh + .4; if (solidAt(Math.floor(x), Math.floor(y))) continue;
   const look = 'm|' + (300 + i * 7 + j) + '|' + MY_CREW + '|' + T.ORDER[(i + j) % 2]; actors.push({route:[[x, y, 0]], faceAt:0, fig:fr => figFn(look, fr, 'idle')}); } });
 return {w:28, h:28, tile:home ? homeTile : ART.tile, edge:EDGE, parts, actors};
}
// what is down on a frame: buildings at 0, traps once they went off; streetlights never
// a Pop-up Window that has opened (and still stands) is 'open'
function downOf(list, f){ return list.map((b, i) => b.role === 'trap' ? !!(f.tr && f.tr.indexOf(i) >= 0) : b.role === 'plot' ? false : f.b[i] <= 0 ? true : f.pu && f.pu.indexOf(i) >= 0 ? 'open' : false); }
function paint(down){ const key = down ? down.map(d => d === 'open' ? 'o' : d ? 1 : 0).join('') : ''; if (key === lastDown && gl3d) return; lastDown = key;
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
  PARTS.forEach((p, i) => { const dead = down && down[i] === true; if (!p.boxes.length && !dead) return; if (T.BDEFS[p.k].role === 'plot') return; cx.fillStyle = dead ? '#3a3633' : p.k === 'fence' ? '#9aa3a8' : p.k === 'porch' || p.k === 'roof' ? '#cca030' : p.k === 'house' ? '#8a3b2e' : p.k === 'gym' || p.k === 'stash' || p.k === 'supstash' ? '#8f8a80' : p.k === 'hustle' || p.k === 'run' ? '#2f8c8c' : '#6a3a30';
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
function meta(Rx){ const u = {}, base = (Rx.seed % 99991) * 37, AC = Rx.attColor || MY_CREW;
 Rx.attackers.forEach((a, i) => u[i] = a.boss ? {look:'hero|' + a.boss + '|' + AC, type:'boss', max:a.hp, side:'a', barZ:a.boss === 'enforcer' ? .98 : .8}
  : a.swarm ? {look:'m|' + (base + i + 1) + '|' + AC + '|drone', type:'drone', max:a.hp, side:'a', fly:true, barZ:.5}
  : {look:'m|' + (base + i + 1) + '|' + AC + '|' + a.type, type:a.type, max:a.hp, side:'a', fly:a.type === 'drone', barZ:a.type === 'bruiser' || a.type === 'heavy' ? .92 : a.type === 'biker' ? .98 : .76});
 Rx.defenders.forEach((d, i) => u[100 + i] = {look:/^boss:/.test(d.look || '') ? d.look : 'm|' + (base + 500 + i) + '|' + (Rx.crewColor || 'gold') + '|shooter', type:'shooter', max:d.hp, side:'d', barZ:.8});
 const it = Rx.items.map(b => { const p = PARTS.find(q => q.key === b.key); return {key:b.key, x:b.x, y:b.y, fw:b.fw, fh:b.fh, top:p ? p.top : 1, max:b.role === 'wall' ? 0 : b.hp}; }); return {u, it}; }
// the bar: your fighters, then bosses, then items. A boss on the block turns its card into its ability button.
// keys: a fighter kind ('brawler'), a boss ('b:enforcer') or an item ('i:hype')
const BAR_ORDER = () => T.ORDER.concat(T.BOSS_ORDER.map(k => 'b:' + k), T.ITEM_ORDER.map(k => 'i:' + k));
function barName(k){ return k[1] === ':' ? (k[0] === 'b' ? T.BOSSES[k.slice(2)].name.replace(/^The /, '') : T.ITEMS[k.slice(2)].name) : T.UNITS[k].name; }
function bossIndex(id){ return R ? R.attackers.findIndex(a => a.boss === id) : -1; }
function buildBar(){
 const bar = $('bar'); bar.innerHTML = '';
 BAR_ORDER().forEach(k => { if (!counts[k]) return; const b = document.createElement('button'); b.className = 'troop' + (k[1] === ':' ? (k[0] === 'b' ? ' boss' : ' item') : ''); b.dataset.k = k;
  b.innerHTML = `<span class="n">x${counts[k]}</span><span class="nm">${barName(k)}</span>`;
  b.insertBefore(k[0] === 'i' && k[1] === ':' ? itemIcon(k.slice(2)) : miniIcon(k[1] === ':' ? 'hero|' + k.slice(2) + '|' + MY_CREW : iconLook(k), 74), b.lastChild);
  b.onclick = e => { e.stopPropagation(); barTap(k); }; bar.appendChild(b); });
 refreshBar();
}
function barTap(k){
 if (k[0] === 'b' && k[1] === ':'){ const i = bossIndex(k.slice(2));   // a boss already on the block: use the ability
  if (i >= 0 && (queued[i] || sim.placed(i))){ if (abUsed[i] || finished) return; if (!sim.placed(i)){ toast('One moment, still on the way in'); return; }
   if (sim.ability(i)){ abUsed[i] = 1; savePending(true); const A = R.attackers[i].ability, u = sim.units[i]; if (A.kind === 'slam' || A.kind === 'hold') pushRing({x:u.x, y:u.y, r:A.r, t0:sim.tick(), t1:sim.tick() + (A.kind === 'slam' ? 10 : A.len), m:A.kind === 'slam' ? 9 : 12, follow:A.kind === 'hold' ? i : null}); toast(T.BOSSES[k.slice(2)].abName); refreshBar(); }
   else if (R.attackers[i].ability.kind === 'bounce' && sim.units[i] && sim.units[i].alive) toast('No guns in reach yet');
   else { abUsed[i] = 1; refreshBar(); }
   return; } }
 if (!counts[k]) return; sel = k; refreshBar(); }
function refreshBar(){ $('bar').querySelectorAll('.troop').forEach(b => { const k = b.dataset.k, boss = k[0] === 'b' && k[1] === ':', i = boss ? bossIndex(k.slice(2)) : -1, onField = boss && i >= 0 && (queued[i] || sim.placed(i));
  b.classList.toggle('sel', k === sel); b.classList.toggle('out', onField ? !!abUsed[i] || (sim.units[i] && !sim.units[i].alive) : !counts[k]); b.classList.toggle('ready', onField && !abUsed[i] && !(sim.units[i] && !sim.units[i].alive));
  b.querySelector('.n').textContent = onField ? '' : 'x' + counts[k]; b.querySelector('.nm').textContent = onField ? T.BOSSES[k.slice(2)].abName : barName(k); });
 if (sel !== barShown){ barShown = sel; const c = sel && $('bar').querySelector('.troop[data-k="' + sel + '"]'); if (c && c.scrollIntoView) c.scrollIntoView({block:'nearest', inline:'nearest'}); } }
let barShown = null;
// after a drop: the next fighter, then a boss still waiting; never an item (those are only picked by hand)
function nextSel(){ return T.ORDER.find(k => counts[k]) || T.BOSS_ORDER.map(k => 'b:' + k).find(k => counts[k]) || null; }
// item cards get a flat badge: a ring in the item's color with a one-letter mark (no emoji, no stock icons)
const ITEM_LOOK = {hype:['#f0c64a', 'H'], firstaid:['#5fc27a', '+'], firecracker:['#e2603a', 'F'], ladder:['#c99b5a', 'L'], blackout:['#7d8fb8', 'B'], smoke:['#b8bcc4', 'S']};
function itemIcon(k){ const cv = document.createElement('canvas'), d = Math.min(2, window.devicePixelRatio || 1), px = Math.round(74 * d); cv.width = cv.height = px; cv.style.width = cv.style.height = '74px';
 const c = cv.getContext('2d'), L = ITEM_LOOK[k]; c.scale(d, d); c.strokeStyle = L[0]; c.lineWidth = 5; c.setLineDash([7, 4]); c.beginPath(); c.arc(37, 40, 24, 0, 7); c.stroke();
 c.setLineDash([]); c.fillStyle = L[0]; c.font = '800 26px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(L[1], 37, 41); return cv; }
// rings on the ground while an item or ability is working (live and in replays): [{x, y, r, t0, t1, m, follow}]
let rings = [], abUsed = {};
function pushRing(r){ rings.push(r); if (gl3d) VIL.rings(rings); }
const RING_M = {rage:9, heal:33, strike:9, jump:9, off:13, smoke:13};
function ringsOf(Rx){ const out = []; (Rx.deploys || []).forEach(d => { if (d.c && Rx.spells && Rx.spells[d.c]){ const sp = Rx.spells[d.c]; out.push({x:d.x, y:d.y, r:sp.r, t0:d.t, t1:d.t + (sp.len || 8), m:RING_M[sp.kind] || 9}); }
  if (d.ab){ const A = Rx.attackers[d.i] && Rx.attackers[d.i].ability; if (A && (A.kind === 'slam' || A.kind === 'hold')) out.push({x:0, y:0, r:A.r, t0:d.t, t1:d.t + (A.kind === 'slam' ? 10 : A.len), m:A.kind === 'slam' ? 9 : 12, follow:d.i}); } }); return out; }
// the block a fight is on, rebuilt from its recipe (so Watch shows the block exactly as it was fought)
function blockOf(Rx){ return Rx.items.map(b => ({key:b.key, k:b.k, x:b.x, y:b.y, lv:b.lv || 1})); }
// street fights are day or night by your pick; everything else follows the phone's clock
function lightFor(Rx){ if (gl3d) VIL.setHour(Rx && Rx.mode === 'camp' ? (Rx.night ? 22.5 : 13) : null); }
function startAttack(recipe){
 R = recipe; setBlock(blockOf(R), R.mode === 'practice' ? 'own' : 'enemy', R.crewColor); vicOn = R.mode === 'rescue'; lightFor(R); if (gl3d) VIL.edit(null);
 sim = B.raidStart(R, {record:true}); finished = false; coreAt = 0; queued = {}; acc = 0; lastT = 0; viceroyFree = false; lastDown = 'x';
 counts = {}; R.attackers.forEach(a => { if (a.swarm) return; const k = a.boss ? 'b:' + a.boss : a.type; counts[k] = (counts[k] || 0) + 1; }); for (const k in (R.kit || {})) counts['i:' + k] = R.kit[k];
 sel = nextSel(); barShown = null; rings = []; abUsed = {};
 const m = meta(R); units = m.u; items = m.it; zone = B.dropZone(R);
 paint(null); buildBar(); setStars($('hudStars'), 0); $('pct').textContent = '0%'; $('clock').textContent = clock(0);
 $('tip').style.opacity = 1; $('tip').textContent = 'Pick a troop, then tap the street';
 if (gl3d){ VIL.battle({live:true, frames:sim.frames, tick:B.TICK, units, items, speed:1, follow:false}); VIL.rings(rings); }
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
 if (rings.length) rings.forEach(r => { if (r.follow != null){ const u = sim.units[r.follow]; if (u){ r.x = u.x; r.y = u.y; } } });
 if (sim.tick() % 10 === 0) refreshBar();
 savePending();
 const t = sim.tick() - 1; $('clock').textContent = clock(t);
 const down = downOf(R.items, f);
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
 if (sel[0] === 'i' && sel[1] === ':'){ const c = sel.slice(2), sp = R.spells[c];   // items land anywhere on the block
  if (!(x >= 0 && y >= 0 && x < B.W && y < B.H)){ toast('Tap on the block itself'); return; }
  if (!sim.cast(c, x, y)) return; pushRing({x, y, r:sp.r, t0:sim.tick(), t1:sim.tick() + (sp.len || 8), m:RING_M[sp.kind] || 9});
  counts[sel]--; if (!counts[sel]) sel = nextSel(); refreshBar(); $('tip').style.opacity = 0; savePending(true); return; }
 if (!B.canDrop(R, x, y)){ if (gl3d) VIL.flashZone(zone); else FB.flash(zone); toast('Too close to their block. Drop on the street.'); return; }
 const boss = sel[0] === 'b' && sel[1] === ':' ? sel.slice(2) : null;
 const i = R.attackers.findIndex((a, j) => (boss ? a.boss === boss : a.type === sel && !a.boss) && !queued[j] && !sim.placed(j));
 if (i < 0 || !sim.deploy(i, x, y)) return;
 queued[i] = 1; counts[sel]--; if (!counts[sel]) sel = nextSel(); refreshBar(); savePending(true);
 $('tip').style.opacity = 0;
}
$('endBtn').onclick = e => { e.stopPropagation(); if (sim && !finished){ sim.end(); savePending(true); } };
function finish(){
 if (finished) return; finished = true; cancelAnimationFrame(raf); if (gl3d) VIL.battleEnd();
 const res = sim.result(), out = settle(R, res);
 setTimeout(() => showResult(res, out.stars, out.won), 900);
}
// count a finished fight, exactly once: stars, spent fighters and items, loot, Rep, the street record, the report
function settle(Rx, res){
 // a street or corner fight only counts if at least one fighter went in: bosses alone (or End at once) earn no stars, loot or Rep
 const noCrew = Rx.mode !== 'rescue' && !(res.deploys || []).some(d => !d.c && !d.ab && Rx.attackers[d.i] && !Rx.attackers[d.i].boss);
 const stars = noCrew ? 0 : T.starsFor(res), won = Rx.mode === 'rescue' ? res.coreDown : stars > 0;
 lastReport = T.reportFrom(Rx, res); lastReport.at = Date.now(); if (noCrew){ lastReport.stars = 0; lastReport.noCrew = true; }
 save.tries++; save.best = Math.max(save.best, stars); if (won && Rx.mode === 'rescue') save.rescued = true;
 if ((Rx.mode === 'raid' || Rx.mode === 'camp') && save.block){   // the people you sent in are spent, the rest come home; loot and the corners pay out
  const sent = new Set((res.deploys || []).filter(d => !d.c && !d.ab).map(d => d.i)), spent = {};
  Rx.attackers.forEach((a, j) => { if (a.boss || a.swarm || !sent.has(j)) return; save.army[a.type] = Math.max(0, (save.army[a.type] | 0) - 1); spent[a.type] = (spent[a.type] || 0) + 1; });
  (res.deploys || []).forEach(d => { if (d.c && save.kit[d.c] > 0){ save.kit[d.c]--; if (!save.kit[d.c]) delete save.kit[d.c]; } });   // items used are gone
  const back = T.patchedUp(save.block, spent); let nb = 0;   // the pharmacy patches some of them up: they come home, beds allowing
  for (const k of T.ORDER) for (let n = 0; n < back[k]; n++) if (T.armySize(save.army) + T.SIZE[k] <= T.armyCap(save.block)){ save.army[k]++; nb++; }
  const landed = (res.deploys || []).some(d => !d.c && !d.ab && Rx.attackers[d.i] && !Rx.attackers[d.i].boss);   // no fighter went in (End pressed at once, or bosses alone): nothing is paid
  let loot = landed ? T.lootFor(res, save.block) : {cash:0, sup:0};
  if (Rx.mode === 'camp'){ const key = Rx.camp[0] + '-' + Rx.camp[1], was = save.camp[key] || {s:0, t:[0, 0]};   // you take your share of what is left on that block
   loot = landed ? T.campLoot(res, Rx.camp[0], Rx.camp[1], was.t, Rx.night) : {cash:0, sup:0}; }
  const got = addRes(loot.cash, loot.sup);   // what fit in your stashes; a block only loses what you actually carried home
  if (Rx.mode === 'camp'){ const key = Rx.camp[0] + '-' + Rx.camp[1], was = save.camp[key] || {s:0, t:[0, 0]};
   save.camp[key] = {s:Math.max(was.s, landed ? stars : 0), t:[was.t[0] + got.cash, was.t[1] + got.sup]}; lastReport.firstTake = !was.s && stars > 0; }
  const p = landed ? T.payout(save.block) : {cash:0, sup:0}, pg = addRes(p.cash, p.sup); lastReport.gain = {cash:got.cash + pg.cash, sup:got.sup + pg.sup};
  const rp = landed ? T.repFor(res, save.block) : 0; save.rep += rp; lastReport.gain.rep = rp; lastReport.gain.back = nb; }
 save.reports.unshift(lastReport); save.reports = save.reports.slice(0, 30); saveGame(); clearPending();
 return {stars, won};
}
// a fight in progress is saved every 2 seconds; if the app closes, the next start plays it out from there and counts it once
// it is kept under its own key so the big save is not rewritten mid-fight; written on every drop, item, move and End, and every 5 seconds
const PEND_KEY = 'turf.pending.v1';
function savePending(now){ if (!sim || finished || !R || R.mode === 'rescue') return; if (!now && sim.tick() % 50) return;
 const dep = sim.queued(); if (!dep.length) return;
 const p = {at:Date.now(), simVer:B.SIM_VER, deployVer:B.DEPLOY_VER, recipe:Object.assign({}, R, {deploys:dep, endAt:sim.endAt()})};
 try { localStorage.setItem(PEND_KEY, JSON.stringify(p)); } catch (e){ memPend = p; } }
let memPend = null;
function loadPending(){ let raw = null; try { raw = localStorage.getItem(PEND_KEY); } catch (e){} let p = null; try { p = raw ? JSON.parse(raw) : memPend; } catch (e){ p = null; } return p; }
function clearPending(){ memPend = null; try { localStorage.removeItem(PEND_KEY); } catch (e){} }
function cleanPending(p){ if (!p || typeof p !== 'object' || !p.recipe) return null; const r = p.recipe; if (p.simVer !== B.SIM_VER || p.deployVer !== B.DEPLOY_VER) return null;
 if (!['items', 'attackers', 'defenders', 'deploys'].every(k => Array.isArray(r[k])) || (r.mode !== 'raid' && r.mode !== 'camp')) return null;
 if (r.mode === 'camp' && !(Array.isArray(r.camp) && r.camp[0] >= 0 && r.camp[0] < T.CAMP.crews && r.camp[1] >= 0 && r.camp[1] < T.CAMP.blocks)) return null;
 return {at:+p.at || 0, recipe:r}; }
function settlePending(){ const p = cleanPending(loadPending()); clearPending(); if (!p) return null;
 try { const res = B.simRaid(JSON.parse(JSON.stringify(p.recipe))).result; return settle(p.recipe, res); } catch (e){ return null; } }
function showResult(res, stars, won){
 const mode = lastReport && lastReport.recipe.mode, camp = mode === 'camp', raid = mode === 'raid' || camp, g = lastReport && lastReport.gain;
 const crew = camp ? T.CREWS[lastReport.recipe.camp[0]] : T.CREWS[0];
 $('resTitle').textContent = raid ? (won ? 'You hit ' + crew.name : crew.name + ' held the block') : (won ? 'The Viceroy is out' : 'They held the house');
 setStars($('resStars'), stars); $('resPct').textContent = lastReport && lastReport.noCrew ? 'Nobody from your crew went in, so this one does not count. Bosses back the crew up; they do not take a block alone.' : res.pct + '% of the block knocked down' + (g ? '. You came home with ' + g.cash + ' Cash, ' + g.sup + ' Supplies and ' + (g.rep || 0) + ' Rep.' + (g.back ? ' The pharmacy patched up ' + g.back + ' of your crew.' : '') : '');
 const Rl = lastReport && lastReport.recipe;
 const again = () => camp ? startAttack(T.campRecipe(Rl.camp[0], Rl.camp[1], seed(), save.army, save.research, !!Rl.night, myLoad())) : raid ? startAttack(T.raidRecipe(seed(), save.army, save.research, myLoad(true))) : startAttack(T.rescueRecipe(seed()));
 $('resNext').textContent = camp ? 'Back to the streets' : raid ? 'Back to your block' : won ? 'Talk to the Viceroy' : 'Try again';
 $('resNext').onclick = () => camp ? (toHome(), openSheet('streets')) : raid ? toHome() : won ? story([WIN, NEXT], toHome, 'keys') : again();
 if (camp && lastReport.firstTake && lastReport.recipe.camp[1] === T.CAMP.blocks - 1) setTimeout(() => toast('That was the last of ' + crew.name + ' turf', 2600), 600);
 $('resAgain').textContent = raid ? 'Hit them again' : 'Run it again'; $('resAgain').onclick = again;
 $('resAgain').style.display = (raid ? T.armySize(save.army) > 0 : won && !save.block) ? '' : 'none';
 practiceRep = null; $('resWatch').onclick = resWatchReal; show('result');
}
$('resWatch').onclick = () => watch(lastReport);
const resWatchReal = $('resWatch').onclick;
function seed(){ return (Date.now() ^ (Math.random() * 4294967296)) >>> 0; }

// ---------- Watch: the saved recipe fought again, frame by frame ----------
let wSpeed = 1, wPaused = false, wFrames = null, wI = 0, wRaf = 0;
function watch(rep){
 if (!rep) return; const Rw = JSON.parse(JSON.stringify(rep.recipe)); setBlock(blockOf(Rw), Rw.mode === 'practice' ? 'own' : 'enemy', Rw.crewColor); vicOn = Rw.mode === 'rescue'; lightFor(Rw); if (gl3d) VIL.edit(null);
 const out = B.simRaid(Rw, {record:true}), m = meta(Rw); { const pt = partyText(Rw.party); if (pt) setTimeout(() => toast(pt, 2600), 500); }
 wFrames = out.frames; units = m.u; items = m.it; viceroyFree = false; lastDown = 'x'; paint(null); wSpeed = 1; wPaused = false;
 $('wPlay').textContent = 'Pause'; $('wSpeed').textContent = '2x'; $('watchLbl').textContent = 'Replay · ' + rep.stars + (rep.stars === 1 ? ' star' : ' stars');
 const onTick = i => { const f = wFrames[i], down = downOf(Rw.items, f), coreI = Rw.items.findIndex(b => b.role === 'core');
  if (vicOn && f.b[coreI] <= 0 && !viceroyFree){ viceroyFree = true; lastDown = 'x'; } paint(down); };
 show('watch'); cam('watch');
 const wr = ringsOf(Rw);
 const onTick2 = i => { onTick(i); if (wr.length){ const f = wFrames[i]; wr.forEach(r => { if (r.follow != null){ const u = f.u.find(q => q[0] === r.follow); if (u){ r.x = u[1]; r.y = u[2]; } } }); } };
 if (gl3d){ VIL.battle({frames:wFrames, tick:B.TICK, units, items, speed:1, follow:true, zoom:VIL.view().zoom, onTick:onTick2, onEnd:endWatch}); VIL.rings(wr); }
 else { wI = 0; cancelAnimationFrame(wRaf); let a = 0, lt = 0; const step = now => { wRaf = requestAnimationFrame(step); const dt = Math.min(.25, (now - (lt || now)) / 1000); lt = now; if (wPaused) return; a += dt * wSpeed;
   while (a >= B.TICK){ a -= B.TICK; wI++; if (wI >= wFrames.length){ cancelAnimationFrame(wRaf); endWatch(); return; } FB.frame(wFrames[wI]); onTick(wI); } }; wRaf = requestAnimationFrame(step); }
}
let watchFromList = false, practiceRep = null;
// Test my block: a rival crew built for your Main House level hits your own layout; you watch, nothing is lost or gained
function practice(){ if (!save.block) return; const Rp = T.practiceRecipe(save.block, seed(), MY_CREW, T.blockBonuses(save)), res = B.simRaid(JSON.parse(JSON.stringify(Rp))).result;
 practiceRep = T.reportFrom(Rp, res); closeSheet(); try { watch(practiceRep); } catch (e){ practiceRep = null; toast("The test couldn't run"); toHome(); } }
function showPractice(){ const r = practiceRep, held = !r.coreDown;
 $('resTitle').textContent = held ? 'Your block held' : 'They took your Main House'; setStars($('resStars'), r.stars);
 $('resPct').textContent = 'Their crew knocked down ' + r.pct + '% of your block for ' + r.stars + (r.stars === 1 ? ' star' : ' stars') + (held ? ', but your Main House held' : '') + '. Practice: nothing was lost.';
 $('resNext').textContent = 'Back to your block'; $('resNext').onclick = () => { practiceRep = null; toHome(); };
 $('resAgain').textContent = 'Test again'; $('resAgain').style.display = ''; $('resAgain').onclick = practice;
 $('resWatch').onclick = () => watch(practiceRep); show('result'); }
function endWatch(){ if (!$('watch').classList.contains('on')) return; if (watchFromList){ watchFromList = false; toHome(); openSheet('fights'); return; } if (practiceRep){ showPractice(); return; } if (lastReport) showResult({pct:lastReport.pct}, lastReport.stars, lastReport.recipe.mode === 'rescue' ? lastReport.stars >= 2 : lastReport.stars > 0); else toTitle(); }
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
 if (gl3d){ VIL.battle(null); VIL.edit(null); } lightFor(null); setBlock(T.RESCUE_BLOCK, 'enemy'); vicOn = true; viceroyFree = !!save.rescued; paint(null);
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
 $('hRep').textContent = save.rep; $('hArmy').textContent = T.armySize(save.army) + '/' + T.armyCap(save.block); $('hCrew').querySelector('.ic').style.background = gangHex(MY_CREW);
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
// a fence taken down gives back its 10 Supplies and half of what its levels cost
function fenceRefund(f){ let n = T.HOME.fence.cost[1]; for (let l = 1; l < (f.lv || 1); l++) n += Math.floor(T.upgradeCost('fence', l)[1] / 2); return n; }
function fenceAt(x, y, add){
 const b = save.block, i = b.findIndex(q => q.k === 'fence' && q.x === x && q.y === y);
 if (add){ if (i >= 0) return; const c = T.HOME.fence.cost;
  if (!T.fitsAt(b, null, 'fence', x, y)) return;
  if (T.count(b, 'fence') >= T.capFor('fence', T.houseLv(b))){ toast('No more fence at this house level'); return; }
  if (!has(c)){ toast('Fence costs ' + costText(c) + ' a piece'); return; }
  b.push({key:'f' + x + '_' + y, k:'fence', x, y, lv:1});
  if (!T.reachOk(b)){ b.pop(); toast('That would wall something in'); return; }
  pay(c); }
 else { if (i < 0) return; const back = fenceRefund(b[i]); b.splice(i, 1); addRes(0, back); }
 saveGame(); homePaint();
}
function buy(k){
 const b = save.block, c = T.price(save.block, T.HOME[k].cost), lv = T.houseLv(b);
 if (T.count(b, k) >= T.capFor(k, lv)){ toast(T.capFor(k, lv) ? 'Level up the Main House for more' : 'Opens at Main House level 2'); return; }
 if (!has(c)){ toast('Needs ' + costText(c)); return; }
 const spot = T.freeSpot(b, k); if (!spot){ toast('No room on the lot. Move things or level up the Main House.'); return; }
 const it = {key:'b' + (save.nk++), k, x:spot[0], y:spot[1], lv:1}; b.push(it);
 if (!T.reachOk(b)){ b.pop(); toast('No spot that leaves a way in. Move a fence first.'); return; }
 pay(c); saveGame(); homeSel = it.key; homePaint(); openSheet('info'); focusOn(it.x + 1, it.y + 1);
 toast(gl3d ? 'Placed. Drag it where you want it.' : 'Placed. Tap an open spot to move it.', 2400);
}
// every fence piece at this one's level goes up one, if you can pay for all of them
function levelFences(key){ const it = item(key); if (!it || it.k !== 'fence' || it.lv >= T.houseLv(save.block)) return; const lv = it.lv || 1, list = save.block.filter(f => f.k === 'fence' && (f.lv || 1) === lv);
 const c = [0, T.price(save.block, T.upgradeCost('fence', lv))[1] * list.length]; if (!has(c)){ toast('Needs ' + costText(c)); return; }
 pay(c); list.forEach(f => f.lv = lv + 1); saveGame(); homePaint(); openSheet('info'); toast(list.length + ' pieces are ' + T.fenceName(lv + 1) + ' now'); }
function levelUp(key){
 const it = item(key); if (!it) return; if (it.k === 'fence' && it.lv >= T.houseLv(save.block)){ toast('Level the Main House first'); return; } const c0 = T.upgradeCost(it.k, it.lv); if (!c0) return; const c = T.price(save.block, c0);
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
// what a block's Block Party gives, in a line (shown on the board and when a fight on that block starts)
function partyText(p){ const out = []; if (p && p.watch) out.push('guns +' + 6 * p.watch + '%'); if (p && p.cookout) out.push('crew health +' + 10 * p.cookout + '%'); if (p && p.mural) out.push('buildings +' + 8 * p.mural + '%'); return out.length ? 'Block Party: ' + out.join(', ') : ''; }
function partyUp(k){ const lv = (save.party[k] | 0), c = T.partyCost(k, lv); if (!c || !T.partyOpen(save.block, lv)) return;
 if (!has(c)){ toast('Needs ' + costText(c)); return; } pay(c); save.party[k] = lv + 1; saveGame(); homeHud(); openSheet('party'); toast(T.PARTY[k].name + ' is level ' + (lv + 1)); }
function make(k){
 const it = T.ITEMS[k]; if (!it || !T.itemOpen(save.block, k)) return;
 if (T.kitSize(save.kit) >= T.kitCap(save.block)){ toast('No room. Level up the Corner Store to carry more.'); return; }
 const c = [0, it.cost]; if (!has(c)){ toast('Needs ' + costText(c)); return; }
 pay(c); save.kit[k] = (save.kit[k] | 0) + 1; saveGame(); toast(it.name + ' made'); homeHud(); openSheet('crew'); }
function ago(at){ const m = Math.round((Date.now() - at) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; }
function research(k){
 const lv = save.research[k] || 1, c = T.researchCost(k, lv);
 if (!c || lv >= T.researchCap(save.block)) return;
 if (!has(c)){ toast('Needs ' + costText(c)); return; }
 pay(c); save.research[k] = lv + 1; saveGame(); homeHud(); openSheet('lab'); toast(lv + 1 === T.SKILL_LV ? T.UNITS[k].name + 's learned ' + T.SKILLS[k].name : T.UNITS[k].name + 's are level ' + (lv + 1));
}
function setColor(c){ if (!MINI.GANGS[c] || c === 'gold') return; save.color = MY_CREW = c; saveGame(); homePaint(); openSheet('crew'); }
function statLine(it){
 const k = it.k, lv = it.lv, b = save.block;
 if (k === 'house'){ const L = T.lotsOpen(lv), n = L.x1 - L.x0 + 1; return 'Your lot is ' + n + ' by ' + n + '.' + (lv < T.maxLv(k) ? ' The next level opens ' + (n + 2) + ' by ' + (n + 2) + '.' : ''); }
 if (k === 'hustle') return 'Pays ' + 60 * lv + ' Cash after every fight.';
 if (k === 'run') return 'Brings ' + 40 * lv + ' Supplies after every fight.';
 if (k === 'stash') return 'Holds ' + 1500 * lv + ' Cash. You can hold ' + T.storeCap(b).cash + ' in all.';
 if (k === 'supstash') return 'Holds ' + 1500 * lv + ' Supplies. You can hold ' + T.storeCap(b).sup + ' in all.';
 if (k === 'pad') return 'Sleeps ' + (14 + 6 * lv) + '.' + (lv > 1 ? ' Crew posted here on defense are ' + 12 * (lv - 1) + '% tougher.' : ' Level it up and the crew posted here on defense get tougher.');
 if (k === 'gym') return 'Trains ' + T.ORDER.filter(u => T.UNLOCKS[u] <= lv).map(u => T.UNITS[u].name + 's').join(', ') + '.';
 if (k === 'workshop') return 'Researches up to level ' + T.researchCap(b) + '.';
 if (k === 'crewhouse') return 'Empty for now. Friends can send fighters once the group is online.';
 if (k === 'pharmacy') return Math.round(T.patchShare(b) * 100) + '% of the crew you send in come home patched up.';
 if (k === 'hardware') return 'Everything you build or level up costs ' + Math.round(T.priceCut(b) * 100) + '% less.';
 if (k === 'studio') return 'Rep from every fight times ' + (1.25 + .25 * lv) + '.';
 if (T.BDEFS[k].role === 'tower' || T.BDEFS[k].role === 'trap'){ const f = T.homeStats(b, it, T.blockBonuses(save)), d = T.BDEFS[k];
  if (k === 'blower') return 'Reaches ' + f.range + ' tiles. Drones near it crawl.';
  if (d.role === 'tower') return 'Reaches ' + f.range + ' tiles' + (f.minR ? ' (not closer than ' + f.minR + ')' : '') + '. Hits for ' + f.dmg + (f.splash ? ' all around where it lands' : '') + ' every ' + Math.round((f.rate + .1) * 10) / 10 + ' s. ' + (f.air === 0 ? 'Cannot hit drones.' : f.air === 2 ? 'Drones only.' : 'Hits drones too.') + (f.hide ? ' Hidden until someone is within ' + f.hide + '.' : '');
  if (k === 'nail') return 'Hits for ' + f.dmg + ' around it.'; if (k === 'kite') return 'Hits one drone for ' + f.dmg + '.';
  if (k === 'manhole') return 'Takes up to ' + f.cap + ' beds of small fighters out of the fight.'; return T.BDEFS.closet.n + ' of your crew wait inside.'; }
 if (k === 'light') return 'Keeps the guns within ' + T.LIGHT_R + ' tiles at full reach at night.';
 if (k === 'fence') return T.fenceName(lv) + ', ' + T.FENCE_HP[Math.min(3, lv - 1)] + ' health. ' + T.count(b, 'fence') + ' of ' + T.capFor('fence', T.houseLv(b)) + ' pieces up.';
 return '';
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c]));
function openSheet(kind){
 const body = $('sheetBody'); let h = ''; sheetKind = kind;
 if (kind === 'info'){ const it = item(homeSel); if (!it){ closeSheet(); return; } const d = T.BDEFS[it.k], c0 = T.upgradeCost(it.k, it.lv), c = c0 && T.price(save.block, c0);
  h = '<h3>' + esc(it.k === 'fence' ? T.fenceName(it.lv) : d.name) + (it.k === 'fence' ? '' : '<span>Level ' + it.lv + '</span>') + '</h3><p>' + esc(T.HOME[it.k].line) + '</p><p class="stat">' + esc(statLine(it)) + '</p>';
  if (it.k === 'house') h += '<button class="btn" data-act="party">Block Party board</button>';
  if (it.k === 'fence'){ const hl = T.houseLv(save.block), fc = it.lv < hl && T.upgradeCost('fence', it.lv), same = save.block.filter(f => f.k === 'fence' && (f.lv || 1) === (it.lv || 1)).length;
   if (fc){ const one = T.price(save.block, fc), all = [0, one[1] * same];
    h += '<button class="btn main' + (has(one) ? '' : ' no') + '" data-act="up">Make it ' + esc(T.fenceName(it.lv + 1)) + ' for ' + costText(one) + '</button>';
    if (same > 1) h += '<button class="btn' + (has(all) ? '' : ' no') + '" data-act="upall">All ' + same + ' ' + esc(T.fenceName(it.lv)) + ' pieces for ' + costText(all) + '</button>'; }
   else if (it.lv < 4) h += '<p class="stat">' + esc(T.fenceName(it.lv + 1)) + ' comes in at Main House level ' + (it.lv + 1) + '.</p>';
   if (it.lv >= 4) h += '<p class="stat">Top level.</p>';
   h += '<button class="btn" data-act="unfence">Take it down, ' + fenceRefund(it) + ' Supplies back</button>'; }
  else { h += c ? '<button class="btn main' + (has(c) ? '' : ' no') + '" data-act="up">Level up for ' + costText(c) + '</button>' : '<p class="stat">Top level.</p>';
   if (it.k === 'workshop') h += '<button class="btn" data-act="lab">Research</button>';
   h += '<p>' + (gl3d ? 'Drag it to move it.' : 'Tap an open spot to move it there.') + '</p>'; } }
 else if (kind === 'shop'){ const b = save.block, lv = T.houseLv(b);
  h = '<h3>Build</h3><div>';
  const fn = T.count(b, 'fence'), fc = T.capFor('fence', lv);
  h += '</div><h4>Fences</h4><div class="rows"><div class="row"><span class="mid"><span class="nm">Fence</span><br><span class="sub">' + fn + ' of ' + fc + ' up. ' + T.HOME.fence.cost[1] + ' Supplies a piece.</span></span><button class="mini" data-act="lay">Lay</button><button class="mini" data-act="pull">Take down</button></div>';

  const GROUPS = ['Money and crew', 'Defenses', 'Traps and lights'], GROUP = k => T.BDEFS[k].role === 'tower' ? GROUPS[1] : T.BDEFS[k].role === 'trap' || k === 'light' ? GROUPS[2] : GROUPS[0];
  let lastG = '';
  T.SHOP.slice().sort((a, b2) => GROUPS.indexOf(GROUP(a)) - GROUPS.indexOf(GROUP(b2))).forEach(k => { const n = T.count(b, k), cap = T.capFor(k, lv), c = T.price(b, T.HOME[k].cost), off = n >= cap || !has(c);
   if (GROUP(k) !== lastG){ lastG = GROUP(k); h += '</div><h4>' + lastG + '</h4><div class="rows">'; }
   h += '<button class="row' + (off ? ' no' : '') + '" data-buy="' + k + '"><span class="mid"><span class="nm">' + esc(T.BDEFS[k].name) + '</span><br><span class="sub">' + esc(T.HOME[k].line) + '</span></span><span class="pr">' + (cap ? n + ' of ' + cap + '<br>' + costText(c) : 'House level ' + (T.HOME[k].cap.indexOf(1) + 1)) + '</span></button>'; });
  h += '</div>'; }
 else if (kind === 'party'){ const bo = T.blockBonuses(save);
  h = '<h3>Block Party</h3><p>Things the whole neighborhood chips in on. They make your whole block harder to hit.</p><div class="rows">';
  T.PARTY_ORDER.forEach(k => { const p = T.PARTY[k], lv = bo.party[k] | 0, c = T.partyCost(k, lv), open = c && T.partyOpen(save.block, lv), can = open && has(c);
   h += '<div class="row' + (can ? '' : ' no') + '"><span class="mid"><span class="nm">' + esc(p.name) + ' ' + lv + ' of 3</span><br><span class="sub">' + esc(p.line) + ' ' + (!c ? 'Top level.' : !open ? 'Level ' + (lv + 1) + ' needs Main House level ' + (lv + 2) + '.' : 'Next for ' + costText(c) + '.') + '</span></span>'
    + (open ? '<button class="mini" data-party="' + k + '">+ ' + c[0] + '</button>' : '') + '</div>'; });
  h += '</div><p class="stat">' + esc(partyText(bo.party) || 'Nothing yet.') + '</p>'; }
 else if (kind === 'lab'){ const cap = T.researchCap(save.block), g = T.gymLv(save.block);
  h = '<h3>Research<span>up to level ' + cap + '</span></h3><p>Every fighter of a kind gets it, now and from then on. Each level adds 10% health and damage. Level 3 adds a skill.</p><div class="rows">';
  T.ORDER.filter(k => g >= T.UNLOCKS[k]).forEach(k => { const lv = save.research[k] || 1, c = T.researchCost(k, lv), can = c && lv < cap;
   h += '<div class="row' + (can ? '' : ' no') + '" data-unit="' + k + '"><span class="mid"><span class="nm">' + esc(T.UNITS[k].name) + ' Lv ' + lv + '</span><br><span class="sub">' + (!c ? 'Top level.' : lv >= cap ? 'Level up the Workshop to go further.' : 'Next: Lv ' + (lv + 1) + ' for ' + costText(c) + '.') + '<br>' + (lv >= T.SKILL_LV ? 'Has ' : 'At Lv ' + T.SKILL_LV + ': ') + esc(T.SKILLS[k].name) + '. ' + esc(T.SKILLS[k].line) + '</span></span>'
    + (can ? '<button class="mini" data-lab="' + k + '">Lv ' + (lv + 1) + '</button>' : '') + '</div>'; });
  h += '</div>'; }
 else if (kind === 'streets'){ let got = 0; for (const k in save.camp) got += save.camp[k].s;
  h = '<h3>The streets<span>' + got + ' of ' + T.CAMP.crews * T.CAMP.blocks * 3 + ' stars</span></h3>';
  h += '<div class="tod"><button data-tod="day" class="' + (save.night ? '' : 'on') + '">Day</button><button data-tod="night" class="' + (save.night ? 'on' : '') + '">Night</button></div>';
  h += '<p class="stat">' + (save.night ? 'Night: their guns reach a little less. 75% of the loot.' : 'Day: full loot, full reach.') + '</p><div class="rows">';
  h += '<button class="row" data-hit="-1"><span class="mid"><span class="nm">The Boombox corner</span><br><span class="sub">Loot for your crew, any time. Bosses sit this one out.</span></span></button>';
  T.CREWS.forEach((c, ci) => { const hl = T.houseLv(save.block || []) >= c.hl;
   h += '<div class="crewhd"><i style="background:' + gangHex(c.color) + '"></i><span class="mid"><span class="nm">' + esc(c.name) + '</span><br><span class="sub">' + esc(hl ? c.turf : 'Opens at Main House level ' + c.hl + '.') + '</span></span></div><div class="blocks">';
   for (let bi = 0; bi < T.CAMP.blocks; bi++){ const v = save.camp[ci + '-' + bi], open = T.campOpen(save.camp, save.block, ci, bi), st = v ? v.s : 0;
    const p = T.campPool(ci, bi), t = v ? v.t : [0, 0], left = Math.max(0, p.cash - t[0]) + Math.max(0, p.sup - t[1]);
    h += '<button class="blk' + (open ? '' : ' no') + '" data-hit="' + ci + '" data-b="' + bi + '"' + (open ? '' : ' aria-disabled="true"') + '><span class="nm">' + (bi === T.CAMP.blocks - 1 ? esc(c.boss) : 'Block ' + (bi + 1)) + '</span><span class="st">' + [0, 1, 2].map(n => '<i class="' + (n < st ? 'on' : '') + '"></i>').join('') + '</span><span class="sub">' + (open ? (left ? left + ' loot left' : 'Picked clean') : 'Locked') + '</span></button>'; }
   h += '</div>'; });
  h += '<button class="row" data-act="practice"><span class="mid"><span class="nm">Test your block</span><br><span class="sub">A rival crew your size hits your own block while you watch. Nothing is lost.</span></span></button>';
  h += '<button class="row" data-act="fights"><span class="mid"><span class="nm">Your fights</span><br><span class="sub">' + (save.reports.length ? 'The last ' + Math.min(30, save.reports.length) + ' you started. Watch any of them again.' : 'None yet. Every fight you start is kept here.') + '</span></span></button>';
  h += '</div><p>Each block opens once the one before it has a star. A block keeps what you take: hit it again and there is less to carry home.</p>'; }
 else if (kind === 'crew'){ const a = save.army, g = T.gymLv(save.block);
  h = '<h3>Your crew<span>' + T.armySize(a) + ' of ' + T.armyCap(save.block) + ' beds</span></h3><p>Colors are the only thing that marks your people.</p><div class="sw">';
  GANG_PICK.forEach(c => { h += '<button data-col="' + c + '" class="' + (c === MY_CREW ? 'on' : '') + '" style="background:' + gangHex(c) + '" aria-label="' + c + '"></button>'; });
  h += '</div><div class="rows">';
  T.ORDER.forEach(k => { const u = T.UNITS[k], open = g >= T.UNLOCKS[k];
   h += '<div class="row' + (open ? '' : ' no') + '" data-unit="' + k + '"><span class="mid"><span class="nm">' + esc(u.name) + (save.research[k] > 1 ? ' Lv ' + save.research[k] : '') + ' x' + (a[k] || 0) + '</span><br><span class="sub">' + (open ? esc(u.line) + ' ' + T.SIZE[k] + (T.SIZE[k] === 1 ? ' bed.' : ' beds.') : 'Comes in at Gym level ' + T.UNLOCKS[k] + '.') + '</span></span>'
    + (open ? '<button class="mini" data-train="' + k + '" data-n="-1" aria-label="Let one ' + esc(u.name) + ' go">-</button><button class="mini" data-train="' + k + '" data-n="1">+ ' + T.trainCost(k) + '</button>' : '') + '</div>'; });
  h += '</div><h4>Bosses</h4><p>They come on every street fight. No beds, no training. Drop one, then tap its card again for its move.</p><div class="rows">';
  T.BOSS_ORDER.forEach(k => { const b = T.BOSSES[k], open = T.bossOpen(k, T.houseLv(save.block)); h += '<div class="row' + (open ? '' : ' no') + '" data-boss="' + k + '"><span class="mid"><span class="nm">' + esc(b.name) + '</span><br><span class="sub">' + esc(open ? b.line : 'Joins at Main House level ' + b.open + '.') + '</span></span></div>'; });
  const cap = T.kitCap(save.block), have = T.kitSize(save.kit);
  h += '</div><h4>Items<span>' + have + ' of ' + cap + '</span></h4>';
  if (!cap) h += '<p>Items are made at a Corner Store on your lot. Build one to make them.</p>';
  else { h += '<p>Made with Supplies, used once. Pick one in a fight and tap the block where it should land.</p><div class="rows">';
   T.ITEM_ORDER.forEach(k => { const it = T.ITEMS[k], open = T.itemOpen(save.block, k);
    h += '<div class="row' + (open ? '' : ' no') + '" data-item="' + k + '"><span class="mid"><span class="nm">' + esc(it.name) + ' x' + (save.kit[k] | 0) + '</span><br><span class="sub">' + (open ? esc(it.line) : 'Comes in at Corner Store level ' + it.store + '.') + '</span></span>'
     + (open ? '<button class="mini" data-make="' + k + '">+ ' + it.cost + '</button>' : '') + '</div>'; });
   h += '</div>'; } }
 else if (kind === 'fights'){
  h = '<h3>Your fights<span>' + save.reports.length + '</span></h3>';
  if (!save.reports.length) h += '<p>Nothing yet. Every fight you start is kept here so you can watch it again.</p>';
  else { h += '<div class="rows">'; save.reports.forEach((r, i) => { const R2 = r.recipe, who = R2.mode === 'camp' ? T.CREWS[R2.camp[0]].name + ', ' + (R2.camp[1] === T.CAMP.blocks - 1 ? T.CREWS[R2.camp[0]].boss : 'block ' + (R2.camp[1] + 1)) + (R2.night ? ', night' : ', day') : R2.mode === 'raid' ? 'The Boombox corner' : 'The rescue';
   h += '<div class="row"><span class="mid"><span class="nm">' + esc(who) + '</span><br><span class="sub">' + r.stars + (r.stars === 1 ? ' star, ' : ' stars, ') + r.pct + '%' + (r.gain ? ', ' + r.gain.cash + ' Cash, ' + r.gain.sup + ' Supplies' : '') + (r.at ? ', ' + ago(r.at) : '') + '</span></span><button class="mini" data-watch="' + i + '">Watch</button></div>'; });
   h += '</div>'; } }
 body.innerHTML = h;
 if (kind === 'crew' || kind === 'lab') body.querySelectorAll('[data-unit]').forEach(r => r.insertBefore(miniIcon(iconLook(r.dataset.unit), 64), r.firstChild));
 body.querySelectorAll('[data-boss]').forEach(r => r.insertBefore(miniIcon('hero|' + r.dataset.boss + '|' + MY_CREW, 64), r.firstChild));
 body.querySelectorAll('[data-item]').forEach(r => { const c = itemIcon(r.dataset.item); c.style.width = c.style.height = '64px'; r.insertBefore(c, r.firstChild); });
 $('sheet').hidden = false; $('home').classList.add('sheeton');
}
function closeSheet(){ sheetKind = null; $('sheet').hidden = true; $('home').classList.remove('sheeton'); }
$('sheetX').onclick = () => { const was = sheetKind; closeSheet(); if (was === 'info'){ homeSel = null; if (gl3d) VIL.select(null); else FB.scene(null); } };
$('sheetBody').addEventListener('click', e => {
 const t = e.target.closest('[data-buy],[data-act],[data-train],[data-col],[data-lab],[data-hit],[data-tod],[data-make],[data-watch],[data-party]'); if (!t) return;
 if (t.dataset.party){ partyUp(t.dataset.party); return; }
 if (t.dataset.act === 'party'){ openSheet('party'); return; }
 if (t.dataset.make){ make(t.dataset.make); return; }
 if (t.dataset.watch){ const r = save.reports[+t.dataset.watch]; if (!r) return; closeSheet(); watchFromList = true; try { watch(r); } catch (e){ watchFromList = false; toast("That replay can't be played"); toHome(); } return; }
 if (t.dataset.act === 'fights'){ openSheet('fights'); return; }
 if (t.dataset.act === 'practice'){ practice(); return; }
 if (t.dataset.tod){ save.night = t.dataset.tod === 'night'; saveGame(); openSheet('streets'); return; }
 if (t.dataset.hit){ hit(+t.dataset.hit, +(t.dataset.b || 0)); return; }
 if (t.dataset.lab){ research(t.dataset.lab); return; }
 if (t.dataset.act === 'lab'){ openSheet('lab'); return; }
 if (t.dataset.buy) buy(t.dataset.buy);
 else if (t.dataset.train) train(t.dataset.train, +t.dataset.n);
 else if (t.dataset.col) setColor(t.dataset.col);
 else if (t.dataset.act === 'up') levelUp(homeSel);
 else if (t.dataset.act === 'upall') levelFences(homeSel);
 else if (t.dataset.act === 'unfence'){ const it = item(homeSel); if (it){ homeSel = null; closeSheet(); fenceAt(it.x, it.y, false); } }
 else if (t.dataset.act === 'lay' || t.dataset.act === 'pull'){ fenceMode = t.dataset.act === 'lay' ? 'paint' : 'erase'; homeSel = null; closeSheet(); setEdit(); homeHud();
  if (gl3d) toast('Two fingers move the map while you work on fence', 2600); }
});
$('hHintDone').onclick = () => { fenceMode = null; setEdit(); homeHud(); };
$('hBuild').onclick = () => openSheet('shop');
$('hTrain').onclick = $('hCrew').onclick = () => openSheet('crew');
$('hAttack').onclick = () => openSheet('streets');
function hit(ci, bi){
 if (!T.armySize(save.army)){ toast('Train a crew first'); openSheet('crew'); return; }
 if (ci >= 0 && !T.campOpen(save.camp, save.block, ci, bi)){ toast(T.houseLv(save.block || []) < T.CREWS[ci].hl ? 'Opens at Main House level ' + T.CREWS[ci].hl : 'Get a star on the block before it first'); return; }
 closeSheet();
 if (ci < 0){ startAttack(T.raidRecipe(seed(), save.army, save.research, myLoad(true))); return; }
 startAttack(T.campRecipe(ci, bi, seed(), save.army, save.research, save.night, myLoad())); }
// what you bring besides fighters: your bosses and every item you have made
// the Boombox corner is your crew's loot run: bosses sit that one out (it never runs dry, so they would farm it for free)
function myLoad(corner){ return {bosses:corner ? [] : T.BOSS_ORDER, kit:Object.assign({}, save.kit), hl:T.houseLv(save.block || [])}; }
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
 if (gl3d) VIL.battle(null); lightFor(null); homeSel = null; fenceMode = null; closeSheet(); show('home'); homePaint(); setEdit(); cam('home');
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
mountMap();
// a brand new player sees the intro once, before the title; after that it is a button on the title
if (!introSeen() && !save.rescued && !save.tries) introPlay(); else introFind(list => { $('introBtn').hidden = !list.length; });
{ const done = settlePending(); toTitle(); if (done) setTimeout(() => toast('Your last fight played out while you were away: ' + done.stars + (done.stars === 1 ? ' star' : ' stars'), 3200), 900); }
// test hook (used by the headless proof): read-only peeks at the fight
window.TURF_TEST = {block:() => JSON.parse(JSON.stringify(save.block)), home:() => ({cash:save.cash, sup:save.sup, army:Object.assign({}, save.army), sel:homeSel, sheet:sheetKind, fence:fenceMode, color:MY_CREW, lv:save.block ? T.houseLv(save.block) : 0, n:save.block ? save.block.length : 0}),
 state:() => ({screen:['title', 'story', 'hud', 'result', 'watch', 'home'].find(k => $(k).classList.contains('on')), tick:sim ? sim.tick() : 0, counts:Object.assign({}, counts), sel, finished, gl3d, reports:save.reports.length}),
 camp:() => JSON.parse(JSON.stringify({camp:save.camp, night:save.night})), hit, intro:() => ({on:!$('intro').hidden, at:introAt, shots:introList.map(s => s.n), video:!$('introVid').hidden}), icon:(l, n) => miniIcon(l, n), select:k => { selectItem(k, true); openSheet('info'); },
 toScreen:(x, y, z) => gl3d ? VIL.project(x, y, z || 0) : null, result:() => sim ? sim.result() : null};
})();
