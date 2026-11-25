# Turf roadmap

A base-building and raiding game for the crew. Single-page PWA on GitHub Pages, built on the shared block engine
(base.js fight sim + village-iso.js renderer) first made for Ravenmarrow.

## Now
**v0.8.1 · Nov 25 2026 · Odds, and the corner in its place.**
- The Boombox corner was the first thing on the streets screen but is harder than the Kings' first three blocks (a crew of 5 and 5 can't win it; 10 and 10 wins only if they go in bunches). It now sits after the Boombox Kings' blocks and opens once you have a star on their third block.
- Every open block and the corner show your odds: a bar and a word (Easy, Good odds, Even, Tough, Long shot) with a percent. It's how often a crew like yours takes at least one star, dropped in two bunches near their Main House, worked out on your phone from a few quick practice fights with your actual crew, research, bosses and items, day or night. Dripping fighters in one at a time does worse, and the screen says so.
- The Viceroy explains both.

**v0.8.0 · Nov 25 2026 · Replays like a film, things that come down hard, and something to spend Cash on.**
- Cinematic replays (Caleb's idea): every replay now plays like a film. It opens on a crane shot around the block, then cuts between a chase behind your crew, a low side angle and a high angle. When a big building falls, it cuts to it in slow motion, and the last one gets the longest, slowest look. Letterbox bars; the buttons sit in the bottom bar. Overview switches back to the view from above (remembered), and touching the screen takes the camera for that replay.
- Things come down: a building that falls now shudders and breaks into pieces that fly out, tumble and settle in a cloud of dust, with sparks. The Supply Run van and the Lowrider go up in fire and black smoke. Fallen fighters drop where they stood. This happens in every fight, not only replays.
- Own the block: the 24 houses facing your lot are for sale from Main House level 2, one at a time, from 800 Cash rising 400 each to 10,000. Each one flies your crew's flag and pays rent in Supplies every hour, collected when you come home (up to 12 hours of it). Each house gives its price back in Supplies in about 40 hours. All 24 pay 3,240 Supplies an hour. At the top of Build.
- Flex, Cash only, each with a real payoff: Lowrider (5% more Cash from every fight you start, per level), Cookout Grill (5% more Supplies, per level), Neon Sign (your guns hit 10% harder when your block is hit or tested, per level), Hoop Court (your buildings 10% tougher, per level); both stack with the Block Party. Three levels each.
- The Viceroy explains both, and points you at the houses once you have the Cash.
- Fixed: with Reduce Motion turned on, fights and replays no longer freeze (the debris and slow-motion film are skipped for those players).
- Online: blocks with flex pieces need everyone on v0.8; older versions are asked to update before fighting.

**v0.7.6 · Nov 24 2026 · The corner works like the streets.** On the Boombox corner, whoever is still standing at the end now walks home, the same as on the streets. The corner never runs dry, so it pays loot and Rep 6 times a day; after that a run is practice, and the result screen says so. The Viceroy's lines match.

**v0.7.5 · Nov 24 2026 · The Viceroy explains.**
- Tap Cash, Supplies or Rep on your block and the Viceroy tells you, in his own words, where it comes from, what it buys and how much you can hold.
- Ask, next to Build, lists 15 topics: Cash, Supplies, Rep, your crew and beds, how a fight works, the streets, night fights, building, the Main House, Jobs, research, the Block Party, your crew online (what a crew code is, what is shared, what a hit costs), getting hit, and your fights. Most have a Show me button that takes you there.
- The first time you open each screen, he says what it is for. After that he stays quiet.
- After the first-run tips, he keeps walking you through: when you have the stars for the next Main House, a rank bonus to collect, a full stash, Run it back, going online, the Block Party, the Workshop, and your first time being hit. One at a time, each once.
- The first night fight waits while he explains the dark.
- One switch in Ask turns all his tips off or back on. Ask still answers either way.

**v0.7.4 · Nov 24 2026 · Sound, and a cleaner intro.**
- Music and sound effects, all made by the game itself in code: no audio files and no sound from the video clips.
- A loop for every scene: the intro and title (slow and dark, drums arrive on the third bar), your block (laid-back soul), each rival crew's turf (Boombox Kings old-school boom bap, Gold Note jazzy keys and upright bass, The Basement dusty and muffled, Afterhours club funk, The Yard slow and heavy with an organ, Chrome Tide West Coast funk with a sliding lead), online fights (half-time with deep 808s), and a quiet one after a fight. Night fights play the same loop, muffled.
- Effects: drops, boss arrivals and boss moves, items, the Flag whistle, gunfire, bursts, ricochets, the Leaf Blower, hits, buildings coming down, a fighter falling, traps, each star, a win or lose sting, building, leveling up, collecting a job, a soft tap on buttons, and a short buzz when something is not allowed. Replays have the fight sounds too.
- Nothing plays until you tap (phones require it). The sound button on the intro, title, story and home screens reads Tap for sound until then, then cycles Sound on, Effects only, Sound off. Your pick is remembered. Sound pauses when you leave the app.
- Intro: shot 3 is the new landscape clip. The flashes at the start of each shot are gone: each picture and clip now fades in over the one before instead of swapping, and a clip only shows once its first frame is drawn.

**v0.7.3 · Nov 24 2026 · Menus with pictures, and an update badge.**
- Tap the version badge to check for an update. If there is a newer build it installs it and reloads; if not, it says you have the newest version.
- Build: every row shows a small picture of what it builds, drawn from the game's own models (chain-link as see-through wire, gunners standing on the porch and roof). Counts sit next to the name; costs show as Cash and Supplies marks.
- Tapping a building on your block shows a big picture of it at the top.
- Jobs and today's jobs each have a picture (a star, a moon, a fighter, a boss, or the building the job is about), today's jobs have progress bars, and rewards show as money marks.
- Block Party rows have pictures too.

**v0.7.2 · Nov 24 2026 · Portraits in your crew color.** Your five bosses are painted in lavender; the game now recolors their clothes to whatever crew color you picked, on the phone, with no extra pictures. Skin, gold and the background stay as painted. Deadeye and Wheels have new paintings.

**v0.7.1 · Nov 24 2026 · Boss portraits.** The five bosses on the crew screen and the six rival bosses on the streets now show their painted faces. Eleven new pictures sit beside the page (boss-*.jpg) and are kept for offline play. If one is missing, the row shows without it.

**v0.7.0 · Nov 23 2026 · The Crew Online (Phase 5, part one) and the Flag.**
- Your crew online, from the streets: put in a name and a crew code. Everyone who types the same code is one crew. Codes are 4 to 12 letters and numbers, and capitals do not matter.
- Your block, name, color and Rep are shared with that crew. Nothing else leaves the phone.
- Hit a crew mate's real block, once an hour each. It is the block they built, with their Block Party upgrades, by day or night from your phone's clock. A Main House level 1 block is off limits.
- When you are hit, your own phone re-fights it, takes a small slice of your stashes (never more than 12%), and keeps the fight to watch under Hits on your block. A block that holds earns 5 Rep.
- The Rep board: the crew list, most Rep first.
- Online runs on Firebase with no extra download: plain web requests, anonymous sign-in, and rules that let a player write only their own record. Offline, the rest of the game works as before.
- Still to come in Phase 5: Crew House reinforcements from friends, and the same-color mix-up rule.

**The Flag (v0.6.1, shipped inside v0.7.0).** Every fight comes with two Flags. Pick the Flag card and tap one of their buildings: every fighter of yours within nine tiles drops what they were doing and goes for it, then picks their own targets again once it falls. Planted right on a fence, it sends them at that fence. Medics and Breachers keep their own jobs. A Flag nobody is close enough to hear is not spent. Flags show in replays.

**v0.6.0 · Nov 23 2026 · Gameplay pass.** Reasons to come back and keep climbing:
- Fighters still standing at the end of a fight walk home. Only the ones who fell are spent.
- Street blocks fill back up a little after every fight, so there is always something worth hitting.
- Run it back: three-star all four blocks of a crew and they return tougher with more loot, up to Round 5. Every round's stars count.
- Rep ranks, nine of them from New on the block to Legend of the block. Each rank pays a bonus.
- Jobs: three new ones every day (pay climbs for a week of showing up) and the Viceroy's list of 36 long jobs.
- The Main House needs stars as well as Cash: 8, 45 and 150 for levels 2, 3 and 4.
- The first crew is much easier: a new player who sends everyone in at the front wins the first block with nearly the whole crew walking home. A player with nobody and no money is sent six Brawlers.
- A first-run coach walks a new player from hiring a crew to the first street fight and spending the loot. Tips can be turned off, and back on from Jobs.

Still to come from the first outside playtest (Nov 23 2026): a cinematic replay with street-level shots.

v0.5.2 was art pass, part one. ** The painted logo is on the title screen and the app has its new icon. A new
player sees a short intro before the title: painted shots with one line each, silent, about 6 seconds a shot, with Skip; a tap
moves to the next shot. It plays once, and "Play the intro" on the title plays it again. Four of its five shots are in.

v0.5.1 finished Hold the Block: the Hustler and the Pilot, a skill per fighter at research level 3, and the Block Party board.

v0.5.0 brought the full defense set, traps, streetlights, fence levels, posted crews and captains, and Test your block.

v0.4.1 brought bosses, items and Your fights.
v0.4.0 brought the streets: six rival crews, 24 blocks, stars that open the next block, and Day or Night for street fights.

Earlier: your block (build, level up, fence, crew colors), ten fighters at the Gym, research at the Workshop, the Pharmacy,
Hardware Store and Recording Studio, Rep from every raid, and Pops Cassette at his store.

## Art queue
- Done Nov 23 2026: painted logo (logo.png; the block-letter wordmark stays as the fallback), app icon, intro shots 1, 2, 3 and 5.
- Still to come: intro shot 4 (the Viceroy at his window), portraits for the ten bosses, a place in the game for the fighter and boss paintings.
- Done Nov 20 2026: painted Viceroy portrait, title screen, rescue and keys scenes. Painted Brawler, Shooter, Bruiser and Pops Cassette exist and are waiting for a place in the game (troop info, boss intro).

## Plan (each phase is tried on a phone before the next)
1. **First Fight (v0.1):** hands-on troop drops, the rescue, Watch. *Shipped Nov 19 2026.*
2. **People (v0.2):** detailed miniature people, closer zoom. *Shipped Nov 20 2026.*
3. **Your Block:** part one *shipped Nov 20 2026 (v0.3)*: the first house, edit mode, Cash and Supplies, instant upgrades, house levels
   open the lot, your crew color, the Corner Store. Part two: the other seven troops, research, the Workshop, and the pharmacy,
   hardware store and recording studio.
4. **Hit the Streets (v0.4):** part one *shipped Nov 21 2026 (v0.4.0)*: 6 rival crews and 24 blocks, stars, loot, the Day or Night pick.
   Part two *shipped Nov 22 2026 (v0.4.1)*: the first 3 bosses, rival bosses, one-time items, Your fights with Watch, and a fight that survives the app closing.
5. **Hold the Block (v0.5):** part one *shipped Nov 22 2026 (v0.5.0)*: defenses, traps, streetlights, fence levels, posted crews and captains, Test your block. Part two *shipped Nov 22 2026 (v0.5.1)*: house and Block Party upgrades, a skill per fighter at research 3, the Hustler and the Pilot.
   Plan text: full defenses and traps, house crews and patrolling captains, upgrade effects, skills, bosses 4 and 5.
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
- **Checks:** turfcheck.js, turfsweep.js, campsweep.js and homesweep.js (run with node; camptune.js finds the block strengths campsweep checks), gates.py, proof1.py, proof_home.py, proof_flat.py, proof_streets.py, proof_bosses.py, proof_defense.py, proof_party.py, proof_intro.py (Playwright play-throughs;
  serve dist/ on localhost:8123 first).
- **To build:** bump VER and DATE in build.py, run `python3 build.py`, run the checks, then upload the changed files from dist/ over the
  ones at the top of the repo. index.html is generated: change the source files, never index.html itself.
- base.js is shared with Ravenmarrow. Its fight results for Ravenmarrow must not change.

## Version history
- v0.5.2 · Nov 23 2026: painted logo, new app icon, the intro (four shots of five).
- v0.5.1 · Nov 22 2026: Hold the Block part two. The Hustler and the Pilot, a skill per fighter at research level 3, the Block Party board, tougher crew at leveled-up Crash Pads.
- v0.5.0 · Nov 22 2026: Hold the Block part one. New defenses and traps, streetlights, fence levels, posted crews and captains, Test your block. Bosses scale with your Main House.
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
