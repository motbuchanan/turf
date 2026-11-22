# Turf roadmap

A base-building and raiding game for the crew. Single-page PWA on GitHub Pages, built on the shared block engine
(base.js fight sim + village-iso.js renderer) first made for Ravenmarrow.

## Now
**v0.4.1 · Nov 22 2026 · Hit the Streets, part two.** Your three bosses come on every fight you start: The Enforcer
(Lights Out: a ground slam, and the crew around him hit harder), Deadeye (Ghost: unseen for a few seconds, and she fires harder)
and The Shot Caller (Hold the Line: nobody around her can fall for a few seconds). Drop a boss like a fighter, then tap its card
again for its move. Each rival crew's boss now holds its last block. Six one-time items are made at your Corner Store with
Supplies: Hype Track, First Aid Run and Firecracker Strike, then Ladder and Blackout at store level 2, and Smoke at level 3.
Pick one in a fight and tap where it should land. Your fights keeps the last 30, each with Watch. A fight cut short by closing
the app plays out on the next start and counts once.

v0.4.0 brought the streets: six rival crews, 24 blocks, stars that open the next block, and Day or Night for street fights.

Earlier: your block (build, level up, fence, crew colors), ten fighters at the Gym, research at the Workshop, the Pharmacy,
Hardware Store and Recording Studio, Rep from every raid, and Pops Cassette at his store.

## Art queue
- A new logo. The block-letter wordmark is a stand-in.
- An intro animation built from generated art.
- A proper app icon.
- Done Nov 20 2026: painted Viceroy portrait, title screen, rescue and keys scenes. Painted Brawler, Shooter, Bruiser and Pops Cassette exist and are waiting for a place in the game (troop info, boss intro).

## Plan (each phase is tried on a phone before the next)
1. **First Fight (v0.1):** hands-on troop drops, the rescue, Watch. *Shipped Nov 19 2026.*
2. **People (v0.2):** detailed miniature people, closer zoom. *Shipped Nov 20 2026.*
3. **Your Block:** part one *shipped Nov 20 2026 (v0.3)*: the first house, edit mode, Cash and Supplies, instant upgrades, house levels
   open the lot, your crew color, the Corner Store. Part two: the other seven troops, research, the Workshop, and the pharmacy,
   hardware store and recording studio.
4. **Hit the Streets (v0.4):** part one *shipped Nov 21 2026 (v0.4.0)*: 6 rival crews and 24 blocks, stars, loot, the Day or Night pick.
   Part two *shipped Nov 22 2026 (v0.4.1)*: the first 3 bosses, rival bosses, one-time items, Your fights with Watch, and a fight that survives the app closing.
5. **Hold the Block (v0.5):** full defenses and traps, house crews and patrolling captains, upgrade effects, skills, bosses 4 and 5.
6. **The Crew Online (v0.6):** share blocks, attack each other, defensive replays, Rep board, Crew House reinforcements,
   day and night fights, and same-color confusion when two crews wear the same color.
7. **Release (v1.0):** How to Play, balance from the first week, full break-it.

## Later (after v1.0)
Later ranks (Molotov Thrower, Sniper, Sewer Runner, Armored Van, drones, super troops), side modes (street fights, rap
battles), new districts (downtown, rural).

## Locked decisions
- The mechanics a base-raider player already knows, where they expect them. Attack-first.
- No upgrade timers, no real money, no loot boxes.
- Fights are deterministic: a report saves the recipe (block, army, drops, seed) and Watch fights it again.
- Buildings are code-drawn blocks; people are code-drawn rounded figures. Big characters may get a made picture for their portrait (viceroy.png). Original characters only.
- People are rolled from one shared mix of skin tones, builds, hair and clothes. A crew is told apart only by its color and its turf.
- Light follows the phone's real clock everywhere except street fights, where you pick Day or Night.
- Ordinary clothing is neutral (black, grey, white, tan, denim) so the crew color is the only strong color on a person.

## Building it
The top of the repo is the live game plus everything needed to rebuild it.
- **Live game (what the site serves):** index.html, sw.js, manifest.json, icon-192.png, icon-512.png, viceroy.png, title.jpg, event-rescue.jpg, event-keys.jpg.
- **Source:** shell.html (page skeleton), style.css, base.js (fight sim, shared engine), engine.js (units, buildings, costs, blocks),
  figs.js (people), art.js (buildings and ground), village-iso.js (3D renderer), ui.js (screens), build.py.
- **Checks:** turfcheck.js, turfsweep.js and campsweep.js (run with node; camptune.js finds the block strengths campsweep checks), gates.py, proof1.py, proof_home.py, proof_flat.py, proof_streets.py, proof_bosses.py (Playwright play-throughs;
  serve dist/ on localhost:8123 first).
- **To build:** bump VER and DATE in build.py, run `python3 build.py`, run the checks, then upload the changed files from dist/ over the
  ones at the top of the repo. index.html is generated: change the source files, never index.html itself.
- base.js is shared with Ravenmarrow. Its fight results for Ravenmarrow must not change.

## Version history
- v0.4.1 · Nov 22 2026: bosses (The Enforcer, Deadeye, The Shot Caller) and rival bosses, six one-time items from the Corner Store, Your fights (last 30, Watch any), fights cut short by closing the app count once. A slow phone no longer shows a live fight seconds behind.
- v0.4.0 · Nov 21 2026: the streets. Six rival crews, 24 blocks, stars that open the next block, Day or Night for street fights, loot that runs down as you take it.
- v0.3.7 · Nov 21 2026: Pops Cassette, boss of the Boombox Kings, stands in his store's doorway (game model made from his painted portrait). The Biker wears a black jacket.
- v0.3.6 · Nov 20 2026: research. The Workshop researches every kind of fighter up to level 5 (instant, Supplies). The Crew House frame.
- v0.3.5 · Nov 20 2026: seven new fighters. Snatcher, Breacher, Street Medic, Shotgunner, Drone Kid, Biker and Heavy, each with its own kit and fight rules; the Gym goes to level 5; the troop bar scrolls.
- v0.3.4 · Nov 20 2026: neighborhood buildings. Pharmacy (some of the crew you send in come home patched up), Hardware Store (everything costs less), Recording Studio (more Rep). Rep is counted from every raid.
- v0.3.3 · Nov 20 2026: painted art. A painted title screen, painted scenes behind the Viceroy's story cards (the rescue, the keys to your house), and a painted Viceroy portrait.
- v0.3.2 · Nov 20 2026: first release in its own repo. Update checks now always reach the server, replays read from a save are checked before they play, and the source and checks ship alongside the game.
- v0.3.1 · Nov 20 2026: the Full screen button is also on the block screen, top right.
- v0.3 · Nov 20 2026: your own block (build, move, fence, level up), crew colors, training, loot raids, Full screen button.
- v0.2.1 · Nov 20 2026: smooth rounded people, a kit per fighter type, bullet streaks, troop cards drawn from the real people, portrait moved to viceroy.png.
- v0.2 · Nov 20 2026: People. Detailed miniatures, closer pinch zoom, sharper close shadows, brighter night.
- v0.1.1 · Nov 19 2026: the 3D renderer is now inside index.html (one file), and the flat-map notice says when the page was opened from a file.
- v0.1 · Nov 19 2026: First Fight.
