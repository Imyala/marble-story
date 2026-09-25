# Wyrmling: First Flight — roadmap

Where the game stands, and what it would take to turn it into a complete,
50-hour adventure that is worth replaying.

## Where it stands today

**One complete act of a story:** Aster, a violet hatchling raised by fireflies,
frees the four Wardens and breaks the Gloom's hold on Nyxa. The ending already
sets up more: the Hollow King is still out there ("far below Veyra, something
hollow laughed"), and the twin moons are drifting apart.

| Area | What exists |
| --- | --- |
| Realms | 6: Marshlight Fen, Warden Sanctum (the hub), Stormspire Falls, the Frostworks, Stonewild Plains, the Shadow Keep |
| Bosses | 5 multi-phase bosses (Bogmaw, Skrieka, Grolm, Graveljaw, Nyxa), each with a rematch once beaten |
| Foes | 15 kinds (grunts to Shade Drakes) plus elites; a Bestiary page for each |
| Combat | Horn/Tail combo trees, launchers and juggles, perfect dodges and counters, lock-on, 4 elements × breath/burst/fury, 3 elemental reactions, style meter, Dragon Time |
| Movement | Run, jump, flap, glide and dive, charge, ledge grabs, vine climbing, updrafts, moving platforms |
| Exploration | 28 hidden eggs + 4 egg thieves, 24 lore letters, relics and shards (38 collectibles), 13 chests + 6 iron-bound chests, 3 flight-ring chains, puzzles of 8 kinds |
| Power-ups | 4 shrines (Superflame, Supercharge, Invincibility), speed runes, critters and butterflies |
| Progression | 20 upgrades across 6 trees, heart and spirit shards, 8 scale sets |
| Goals | 20 feats, 13 Skill Points, Dragon Medals and par times per realm |
| Replay | New Game+ Legend Runs (endless tiers), the Gloom Rift (endless waves), 6 Dragon Trials, boss rematches, 3 save slots, photo mode |
| Tech | Three.js + TypeScript, ~35,000 lines; 40 unit tests; 77 browser scenario scripts that play the game |

**Honest play-time estimate** (from level sizes and scripted routes, not from
playtesters):

- Main story, first time through: about **4–5 hours**.
- Everything found, every medal and Skill Point: about **9–11 hours**.
- Legend Runs, the Rift and the Trials add open-ended replay, realistically
  **5–10 more hours** for most players.

So a full-completion player gets roughly **15–20 hours** today. A 50-hour game
needs about **ten times the story** plus deeper side content. That is mostly a
content problem; the systems to build it on are largely in place.

## What a complete 50-hour game looks like

| Slice | Hours | How |
| --- | --- | --- |
| Main story (4 acts) | 28–32 | ~22 realms at 60–90 minutes each, 10+ bosses |
| Side content | 8–10 | Side quests, flight realms, mini-games, a secret bonus realm |
| Completion | 8–10 | Collectibles, Skill Points, medals and par times in every realm |
| Replay (optional) | open-ended | Legend Runs, the Rift, Trials, time trials, remix modes |

### Story shape

1. **Act I — First Flight** (today's game, polished): the Fen, the Sanctum,
   the four Wardens, Nyxa. About 5 hours.
2. **Act II — The Hollow Below:** the twin moons part and the ground opens.
   Aster and a recovered Nyxa (now a playable partner) follow the Hollow King's
   roots underground: fungal caverns, a drowned city, a crystal mine, and an
   ancient hatchery. Aster learns a new move per homeworld (swim/dive, wall-run).
   About 9 hours.
3. **Act III — The Violet Line:** the relics' story (the last dragon who learned
   every breath and hungered for a fifth). Sky islands, a desert of glass, a
   storm sea, the Wardens' old academy. Aster learns the fifth breath, Spirit,
   which reopens sealed places in every earlier realm. About 9 hours.
4. **Act IV — Twin Moons:** the Hollow King's citadel between the moons, with
   the Wardens' last stand and a multi-stage finale. About 6 hours.

Each act is a **homeworld** in the classic style: a hub with 4–6 realms, a flight
realm, a boss realm, and a "wardgate" that needs eggs or gems, so exploration
matters for progress, not only for completion.

## Roadmap

### Phase A — foundations for scale (next)

- **A content pipeline.** Today every realm is hand-written code. Before
  building 16 more, add:
  - a realm template (paths, arenas, secret pockets and set dressing from a
    compact description);
  - reusable room kits (ruins, caves, towns);
  - a validation pass that checks every secret is reachable.
- **World map and quest log.** A map screen per homeworld showing realms,
  Wardstones, found and missing secrets, and active quests.
- **Split the bundle.** One file per realm (the build is 1.4 MB today), and a
  loading screen that streams realm code and assets.
- **Save versioning.** Migrations as the save format grows (slots are done).
- **Regression in CI.** Run the browser scenarios headlessly on every push,
  and fix the flaky Sanctum bridge-jump scenario.

### Phase B — Act II (the biggest single step toward 50 hours)

- A new homeworld hub (the Hollow Gate) and 5 realms, a flight realm and a boss.
- **Nyxa as a partner:** a second dragon who fights beside Aster, with combo
  assists and a switch for puzzles that need two.
- New movement: **swimming and diving** (the drowned city), which also opens
  underwater secrets in the Fen and the Falls.
- 6–8 new foe families (burrowers, hollow knights, fungal swarms, ranged
  casters) and 3 new bosses.

### Phase C — Act III and the fifth breath

- The second homeworld: sky islands, glass desert, storm sea, academy.
- **Spirit breath:** reveals hidden paths and phases through Gloom walls.
  Earlier realms gain Spirit-only pockets (a reason to revisit, metroidvania
  style).
- Talismans: equippable perks from bosses and quests (build variety for replays).

### Phase D — Act IV and the finale

- The citadel between the moons; a Warden-assisted multi-stage final boss.
- Epilogue, post-game realm (a "treasure vault" bonus world unlocked at
  100% eggs) and the true ending for full completion.

### Phase E — side content (running alongside B–D)

- **Side quests** from NPCs in each hub (fetch, escort, race, find the lost…),
  tracked in the quest log.
- **Flight realms:** timed flying courses (rings, targets, chases), one per
  homeworld.
- **Mini-games:** critter herding, gem-mine carts, a Dragon Time shooting
  gallery.

### Phase F — replayability (partly done)

Done: Legend Runs (NG+ with endless tiers), the Gloom Rift, Trials, Skill
Points, medals, par times, boss rematches, save slots.

Next:

- **Daily Rift:** the same seeded waves for everyone on a given day, with a
  local best.
- **Time-trial ghosts:** race your best run through a realm.
- **Remix modes:** a randomizer (shuffled eggs and upgrades), one-hit mode,
  no-upgrade mode, mirror realms.
- **More cosmetics:** trails, Flick hats, horn styles, earned from feats and
  Legend tiers.
- **Achievements page** gathering feats, Skill Points and medals in one place.

### Phase G — presentation and polish (continuous)

- Composed music per homeworld, and stingers for bosses, secrets and level-ups.
- Authored models (glTF) for heroes and bosses where the procedural ones fall
  short; facial animation for dialogue.
- Cutscene camera tool for story beats; voiced barks.
- Accessibility: key/button remapping, colour-blind palettes, subtitle size,
  hold-to-toggle options.
- Localization-ready text tables.

### Phase H — balance and QA

- Playtests of each act with a play-time log per realm, to tune pacing
  toward the targets above.
- A difficulty curve pass across the 4 acts and Legend tiers.
- Performance budgets per realm (draw calls under ~450, 60 fps on mid-range
  laptops at medium).

## Known issues and tech debt

- The `fs-sanctum:library` scenario's bridge jump is timing-sensitive and
  often fails (older builds too); the game itself is fine.
- Boss scenarios can fail when several browsers run at once on a busy machine.
- Realm code is large, hand-placed and hard to rearrange; Phase A's template
  work is what makes 16 more realms practical.
- The single JavaScript bundle (1.4 MB) should be split per realm.

## Suggested next round

1. Realm template and room kits (Phase A), proven by rebuilding one small side
   area with them.
2. World map and quest log.
3. First Act II realm (the Hollow Gate hub) with swimming.
4. Nyxa as a partner in combat.
5. Browser scenarios in CI.
