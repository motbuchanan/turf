# Turf roadmap

A base-building and raiding game for the crew. Single-page PWA on GitHub Pages, built on the shared block engine
(base.js fight sim + village-iso.js renderer) first made for Ravenmarrow.

## Now
**v0.3.3 · Nov 20 2026 · Your Block, part one.** Win the rescue and the Viceroy hands over a house. You pick crew colors,
place and move buildings, lay fence, level things up with Cash and Supplies (no waiting), train Brawlers, Shooters and
Bruisers at the Gym, and raid the Boombox Kings for loot. Corners and supply runs pay out after every fight. A Full screen
button (top right, on the title and on your block) hides the browser bars on Android; installed from the home screen, the game opens full screen.

Still to come in part two: the other seven fighters, research, the Workshop, and more neighborhood buildings
(pharmacy, hardware store, recording studio).

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
4. **Hit the Streets (v0.4):** 6 rival crews and 24 blocks, stars, loot, Rep, the first 3 bosses, one-time items, reports.
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
- Ordinary clothing is neutral (black, grey, white, tan, denim) so the crew color is the only strong color on a person.

## Building it
The top of the repo is the live game plus everything needed to rebuild it.
- **Live game (what the site serves):** index.html, sw.js, manifest.json, icon-192.png, icon-512.png, viceroy.png, title.jpg, event-rescue.jpg, event-keys.jpg.
- **Source:** shell.html (page skeleton), style.css, base.js (fight sim, shared engine), engine.js (units, buildings, costs, blocks),
  figs.js (people), art.js (buildings and ground), village-iso.js (3D renderer), ui.js (screens), build.py.
- **Checks:** turfcheck.js and turfsweep.js (run with node), gates.py, proof1.py, proof_home.py, proof_flat.py (Playwright play-throughs;
  serve dist/ on localhost:8123 first).
- **To build:** bump VER and DATE in build.py, run `python3 build.py`, run the checks, then upload the changed files from dist/ over the
  ones at the top of the repo. index.html is generated: change the source files, never index.html itself.
- base.js is shared with Ravenmarrow. Its fight results for Ravenmarrow must not change.

## Version history
- v0.3.3 · Nov 20 2026: painted art. A painted title screen, painted scenes behind the Viceroy's story cards (the rescue, the keys to your house), and a painted Viceroy portrait.
- v0.3.2 · Nov 20 2026: first release in its own repo. Update checks now always reach the server, replays read from a save are checked before they play, and the source and checks ship alongside the game.
- v0.3.1 · Nov 20 2026: the Full screen button is also on the block screen, top right.
- v0.3 · Nov 20 2026: your own block (build, move, fence, level up), crew colors, training, loot raids, Full screen button.
- v0.2.1 · Nov 20 2026: smooth rounded people, a kit per fighter type, bullet streaks, troop cards drawn from the real people, portrait moved to viceroy.png.
- v0.2 · Nov 20 2026: People. Detailed miniatures, closer pinch zoom, sharper close shadows, brighter night.
- v0.1.1 · Nov 19 2026: the 3D renderer is now inside index.html (one file), and the flat-map notice says when the page was opened from a file.
- v0.1 · Nov 19 2026: First Fight.
