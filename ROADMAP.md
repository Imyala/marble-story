# Wyrmling: First Flight — roadmap

Where the game stands, and what it would take to turn it into a complete,
50-hour adventure that is worth replaying.

## Where it stands today

**Act I is complete, and Act II has begun.** Aster, a violet hatchling raised
by fireflies, frees the four Wardens and breaks the Gloom's hold on Nyxa. Then
the Hollow King's roots split the Sanctum's lawn, and Aster, Flick and Nyxa go
down into **the Hollow Gate**, the glowing cavern hub of Act II, where four
sealed gates lead on. The first of them, opened by returning twelve dragon
eggs, leads to **the Mycelium Deep**, Act II's first full realm and its
Spore Mother; the other three open in the rounds ahead.

| Area | What exists |
| --- | --- |
| Realms | 8: Marshlight Fen, Warden Sanctum (Act I hub), Stormspire Falls, the Frostworks, Stonewild Plains, Eclipse Keep, the Hollow Gate (Act II hub) and the Mycelium Deep |
| Bosses | 6 multi-phase bosses (Bogmaw, Skrieka, Grolm, Graveljaw, Nyxa, Mycora the Spore Mother), each with a rematch once beaten |
| Foes | 19 kinds plus elites: the Gloom (grunts to Shade Drakes), and Act II's Spore family (sporelings, puffcaps) and Rootspawn (burrowing rootstalkers, thornspitters); a Bestiary page for each |
| Partner | Nyxa fights beside Aster after the Keep: follows, flanks, assists, Shadow Veil, a command key (strike / stay), puzzles for two dragons |
| Combat | Horn/Tail combo trees, launchers and juggles, perfect dodges and counters, lock-on, 4 elements × breath/burst/fury, 3 elemental reactions, style meter, Dragon Time |
| Movement | Run, jump, flap, glide and dive, charge, ledge grabs, vine climbing, updrafts, moving platforms, **swimming and diving** (Act II waters) |
| Exploration | 35 hidden eggs + 5 egg thieves, 32 lore letters, relics and shards (44 collectibles), 17 chests + 8 iron-bound chests, 6 flight-ring chains, puzzles of 13 kinds (the Deep adds bounce caps, glowthreads, spore vents and blight clouds) |
| Quests | A map of every realm (M), a quest log with a main-quest line worked out from the story (now through the Mycelium Deep), and 9 side quests (6 in Act I, 3 in Act II) |
| Power-ups | 4 shrines (Superflame, Supercharge, Invincibility), speed runes, critters and butterflies |
| Progression | 20 upgrades across 6 trees, heart and spirit shards, 9 scale sets; realm gates that open for eggs |
| Goals | 23 feats, 16 Skill Points, Dragon Medals and par times per realm |
| Replay | New Game+ Legend Runs (endless tiers), the Gloom Rift (endless waves), 6 Dragon Trials, boss rematches, 3 save slots, photo mode |
| Tools | Realm kits and a realm template (`src/world/kits.ts`) for building realms fast |
| Tech | Three.js + TypeScript, ~53,000 lines; each realm its own chunk, loaded on demand; versioned saves with migrations; 59 unit tests; 116 browser scenario scripts; playtests in CI on every push to main |

**Honest play-time estimate** (from level sizes and scripted routes, not from
playtesters):

- Main story, first time through: about **5.5–6 hours** (Act I, the Hollow
  Gate and the Mycelium Deep).
- Everything found, every quest, medal and Skill Point: about **14–16 hours**.
- Legend Runs, the Rift and the Trials add open-ended replay, realistically
  **5–10 more hours** for most players.

So a full-completion player gets roughly **20–26 hours** today. The 50-hour
game still needs most of Acts II–IV; the systems they need (kits, template,
quests, map, partner, swimming, opening gates, realms on demand, save
migrations, CI) are in place, so each new realm is mostly content work.

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

### Phase A — foundations for scale (mostly done)

Done: realm kits and a realm template, the world map and quest log, save slots,
browser playtests in CI, one chunk per realm loaded on demand (three.js in a
chunk of its own, unlocked realms prefetched in the background, a loading veil
with retry), and versioned saves with migrations (unreadable saves set aside).

Still to do:

- **A reachability check** that walks every secret's route automatically.
- **A homeworld map** above the realm maps.

### Phase B — Act II (the biggest single step toward 50 hours; started)

Done: the Hollow Gate hub (with its Burrowfolk, sealed gates, lake, ruins and
Glowcap Wood), Nyxa as a partner, swimming and diving, two hub side quests;
**the Mycelium Deep** (six areas, four new puzzle props, a side quest, three
Skill Points), its gate opening for twelve eggs through Mossa's rite, two new
foe families (Spores and Rootspawn), and **Mycora, the Spore Mother**.

Still to do:

- The three realms behind the other gates (the Drowned City, the Crystal
  Mine, the First Hatchery), a flight realm and a boss realm (the Root Heart).
- Swimming secrets retrofitted into the Fen and the Falls.
- 4–6 more foe families (root knights, eels, crystal things, ranged casters)
  and 3 more bosses.

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

- Boss scenarios can fail when several browsers run at once on a busy machine
  (they pass alone and in CI).
- The world map's first render of a realm is slow under software rendering
  (0.6–4 s headless); on a real GPU it is quick, and later opens are instant.
- Mycora's canopy phase tilts the camera up to keep her in view, and lock-on
  partly fights that tilt; a cutscene camera for her climb and fall would help.
  While she hangs in the canopy Nyxa fights the brood, not her.
- The Mycelium Deep's new fights, blight clouds and boss are tuned by scripted
  bots only; they need human playtests for pacing. Its busiest views draw
  about 325 calls (the Hollow Gate's about 326).
- `src/enemies/bosses/mycora.ts` is long (about 2,200 lines) and could be
  split into body, brain and grove.

## The rounds ahead

Each round below is sized like this one (a realm or a big system, built in
parallel by several engineers, tested in CI). Hours are what each adds to a
completionist's play time.

Done so far: round 5 (the Hollow Gate, swimming, Nyxa as partner, the map
and quest log, CI playtests) and round 6 (the Mycelium Deep, the Spore and
Rootspawn foes, Mycora, the first opening gate, realms on demand, save
migrations, the steep-slope and talk-camera fixes).

| Round | Focus | Adds |
| --- | --- | --- |
| 7 (next) | **The Drowned City**: a swimming realm with underwater routes, eels and a boss; underwater secrets added to the Fen and the Falls; the first flight realm (a timed updraft race) | ~2.5 h |
| 8 | **The Crystal Mine**: light-beam crystal puzzles, a mine-cart ride, a boss; Act II side quests for the Burrowfolk | ~2 h |
| 9 | **The First Hatchery** and **Act II's finale** (the Root Heart), a new move (wall-run), Act II's Skill Points, feats and medals, a balance pass | ~2.5 h |
| 10–13 | **Act III, The Violet Line**: a sky-island hub and four realms, the fifth breath (Spirit) with Spirit-only pockets retrofitted across Acts I–II, talismans (equippable perks) | ~10 h |
| 14–16 | **Act IV, Twin Moons**: the citadel between the moons, the Wardens' last stand, a multi-stage final boss, the epilogue, the true ending, and the Treasure Vault bonus realm at 100% eggs | ~7 h |
| Throughout | Composed music, cutscene camera, voiced barks, key remapping and accessibility, localization, playtests with a per-realm play-time log, and the replay extras (Daily Rift, time-trial ghosts, remix modes, cosmetics) | ~5 h replay |

That reaches about 30 hours of story, 10 of side content and 10 of completion:
the 50-hour target, with Legend Runs and the Rift on top.
