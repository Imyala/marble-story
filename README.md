# Marble Story

A 2D side-scrolling MMORPG-style action RPG, built from scratch in TypeScript
and Canvas 2D with **zero runtime dependencies**.

It is a ground-up reconstruction of the systems that make the genre work —
foothold physics, the damage formula, AP/SP progression, job advancement, drop
tables, equipment instances and scrolling — with original art, original class
and place names, and no story yet. The story is the part you write.

**Play it: https://imyala.github.io/marble-story/**

```bash
npm install
npm run dev      # play at http://localhost:5173
```

The site is built and published by `.github/workflows/pages.yml` on every push.
It also ships `marble-story.html` — the whole game as one self-contained file
you can download and open offline.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck, then a production build into `dist/` |
| `npm test` | Unit tests (physics, combat math, data integrity) |
| `npm run check` | Typecheck + unit tests |
| `npm run smoke` | Builds, serves, and drives the real game in a headless browser |
| `npm run build:artifact` | Packages the game into one self-contained HTML file |

Append `?seed=123` to the URL to fix the world RNG — damage rolls, drop rolls
and monster AI all become reproducible, which is how the smoke test stays
stable and how a "this never drops" report becomes debuggable.

## Controls

| | |
| --- | --- |
| Move / climb | Arrow keys |
| Jump | `Alt` or `Space` |
| Drop through a platform | `Down` + `Alt` |
| Attack | `Ctrl` |
| Skills | `1` – `8` |
| Pick up | `Z` |
| HP / MP potion | `X` / `C` |
| Enter portal, talk to NPC | `Up` |
| Character / Inventory / Equipment | `A` / `I` / `E` |
| Skills / Quests / World map | `S` / `Q` / `M` |
| Close windows | `Esc` |
| Controls reference | `F1` |
| Save now | `Ctrl+S` (it also autosaves) |
| Delete save, new character | `Ctrl+Shift+R` |

## What's implemented

**Movement** — foothold line-segment collision with slopes, one-way platforms,
down-jump, walls, chain-walking off ledges, ladders and ropes, knockback,
i-frames, coyote time. Fixed 60 Hz simulation with interpolated rendering.

**Combat** — the full damage pipeline: weapon-class multipliers, mastery that
raises minimum damage only, defense, elemental resistances, criticals, and the
level-difference penalty. Accuracy vs. avoidability decides whether a swing
lands at all. Monsters have their own AI, aggro, stagger thresholds and contact
damage.

**Progression** — levels 1–200 on a hand-shaped EXP curve with walls at the job
advancement levels, 5 AP and 3 SP per level, a five-branch four-tier job tree,
and skills defined as per-level tables rather than formulas.

**Items** — every dropped equip is a unique instance with rolled stats and its
own upgrade slots; scrolls gamble on those slots. Five inventory tabs with real
slot pressure, drop tables, ground-item physics, shops, and mesos.

**World** — ten hand-authored maps across three regions, connected by named
portals, with spawn points on respawn timers, NPCs with scripted dialogue,
quests that inject themselves into NPC conversations, and localStorage saves.

**Art** — every sprite, tile, icon and backdrop is drawn procedurally from code.
There is no asset pipeline and no third-party art.

## Layout

```
docs/DESIGN.md      the systems deep dive everything here was built from
src/engine/         loop, input, camera, renderer, RNG, event bus
src/physics/        foothold collision, movement state machine, ladders
src/game/           stats, combat, player, mobs, drops, inventory, quests,
                    NPCs, world, save
src/data/           EXP table, jobs, skills, items, mobs, maps
src/ui/             immediate-mode toolkit, HUD, windows
src/art/            procedural character, monster, terrain, icon, scenery art
src/render/         scene composition
tests/              physics, combat, and data-integrity tests
scripts/smoke.mjs   headless browser test that actually plays the game
```

Start with `docs/DESIGN.md`. It explains what each system is for and why it is
shaped the way it is; the code follows it closely.

## Where to take it next

The engine is finished enough that content is now the bottleneck — which is the
right place to be. `src/data/` is entirely plain data: adding a monster, an
item, a skill or a map means adding an object, not writing logic. The design
doc's build order ends at Phase 8, deliberately empty, because that is the story.

Not yet built: 3rd and 4th job skill trees (the 1st and 2nd tier trees are in,
and the pattern is mechanical to extend), party/guild systems, and audio.

## A note on originality

The *mechanics* here are a study of a genre — foothold collision, AP/SP, damage
formulas. Everything expressive is original: the art is generated from code, and
the classes, monsters, items, places and characters are this project's own. No
assets or data from any commercial game are used or required.
