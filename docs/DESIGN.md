# Marble Story — Systems Deep Dive & Design Document

> A ground-up reconstruction of the mechanics that make a MapleStory-style
> 2D side-scrolling MMORPG work, followed by the architecture we use to
> replicate them.
>
> **Scope note:** we replicate *systems and mechanics* (foothold physics, the
> damage formula, AP/SP progression, job advancement, drop tables). All art,
> audio, names, and story content in this repo are original. No Nexon assets or
> data files are used or required.

---

## Part 0 — What kind of game is this, exactly?

MapleStory is a **2D side-scrolling MMORPG**. That hyphenate matters, because
its design pulls from two traditions that normally don't mix:

| From the platformer | From the MMORPG |
| --- | --- |
| Precise jump arcs, slopes, drop-through platforms, ladders | Levels 1–200, EXP grind, stat points |
| Screen-space combat — you hit what's in front of you | Job trees, skill books, buffs, cooldowns |
| Maps are hand-placed geometry, not procedural | Persistent inventory, mesos, equipment upgrades |
| Twitch inputs, i-frames, knockback | Drop tables, spawn timers, quests, NPCs |

The result is a game where **movement is the combat**. You are never standing
still trading turns; you're jumping onto a slope, landing into a mob pack,
firing a multi-target skill, and drifting back out. Every system below exists
to serve that loop.

**The core loop, stated plainly:**

```
enter map → clear mobs → collect drops + EXP → level up
   → spend AP/SP → mobs die faster → move to a higher-level map
       → hit a job advancement gate → unlock a new movement/attack verb
           → the whole game feels different → repeat
```

The genius of the progression is that **job advancements change your verbs, not
just your numbers**. A 1st-job warrior walks and swings. A 2nd-job warrior has a
charge. A 3rd-job warrior has a multi-target rush. The map you hated at level 30
is trivial at level 70 not because your damage tripled, but because you now
*traverse* it differently.

---

## Part 1 — World structure

### 1.1 The map graph

The world is not an open world. It is a **directed graph of discrete maps**,
each one a fixed-size 2D rectangle, connected by **portals**. There is no
seamless streaming — you touch a portal, the screen fades, you are somewhere
else. This is enormously freeing for design: every map is a hand-authored,
fully-known space.

Maps come in a small number of archetypes:

| Archetype | Purpose | Mobs? | Traits |
| --- | --- | --- | --- |
| **Town** | Safe hub | No | NPCs, shops, storage, healer, job instructor, save point |
| **Field / hunting ground** | The grind | Yes | Chained horizontally into "corridors" outward from a town |
| **Dungeon interior** | Denser grind | Yes, harder | Often vertical, multi-branch, deeper = better EXP |
| **Boss arena** | Set-piece | One big one | Single entrance, often an entry requirement |
| **Transit** | Flavor + gating | Sometimes | Ships, taxis, elevators — usually cost mesos |

Field maps radiate from towns in **numbered chains** (`Town → Forest I →
Forest II → Forest III → Deep Forest`), with mob level climbing ~3–8 levels per
step. This gives players a legible difficulty gradient they can walk along
without a quest log telling them where to go — you push outward until mobs stop
dying quickly, then you turn around.

### 1.2 The continents

The classic world is a set of themed regions, each keyed to a starting job and
a visual identity:

- **Starter island** — level 1–10 tutorial region. One town, a handful of trivial
  mobs (snails, slimes), and a one-way boat out. You leave and never return.
- **Central grassland town** — the bowman town. Wide open fields, low-level mobs,
  the de-facto "main hub" because it's central on the world map.
- **Forest town** — the magician town. Vertical, treetop platforms, high-jump
  navigation puzzles.
- **Mountain town** — the warrior town. Cliffs, caves, blunt geometry.
- **City** — the thief town. Urban, subway dungeon below it, the classic
  low-level grind corridors.
- **Port town** — the pirate town. Docks, ships, the transit hub to other
  continents.
- **Desert / snow / sky / underwater regions** — mid-to-late game, each with a
  gimmick (sandstorms, ice physics, swimming, wind currents).

Our replication keeps this shape exactly, with original names and geography.

### 1.3 Map data model

This is the single most important data structure in the game. A map is:

```
Map {
  id, name, returnMapId, forcedReturnMapId
  bounds:      { left, top, right, bottom }   // world-space rect
  vrBounds:    camera clamp rect (often inset from bounds)
  town:        bool                            // no mobs, safe
  footholds:   Foothold[]                      // THE collision geometry
  ladders:     LadderRope[]
  portals:     Portal[]
  spawns:      MobSpawn[]
  npcs:        NpcPlacement[]
  layers:      BackgroundLayer[]               // parallax
  bgm:         string
  mobRate:     number                          // spawn density multiplier
}
```

#### Footholds — the key insight

MapleStory does **not** use a tile grid or an AABB collision mesh. Collision is
a **linked list of line segments** called *footholds*:

```
Foothold {
  id
  x1, y1, x2, y2       // endpoints, left-to-right
  prev, next           // ids of adjacent footholds in the same chain
  layer                // z-layer group; entities only collide within a layer
  forceStart           // walls / one-way
}
```

Consequences that fall out of this design, all of which we reproduce:

1. **Slopes are free.** A foothold from `(0,100)` to `(100,80)` is a ramp. The
   character's `y` is derived from its `x` along the segment. No stair-stepping,
   no tile snapping.
2. **Platforms are one-way by default.** You collide with a foothold only when
   falling onto it from above (`vy > 0` and you crossed its line this frame).
   Jumping through from below is automatic. **Down + Jump** drops you through.
3. **Walking off an edge is a state transition.** As you walk, you follow
   `next`/`prev`. When you run past the end of a chain and there is no `next`,
   you enter the falling state. This is why MapleStory characters walk smoothly
   across a bumpy chain of segments and then cleanly drop off the last one.
4. **Layers separate overlapping geometry.** A bridge over a road is two
   foothold chains on different layers; you only collide within your own layer.
   Portals and ladders move you between layers.

This is genuinely a better model than tiles for this genre and we implement it
faithfully — it's `src/physics/foothold.ts`.

#### Ladders and ropes

```
LadderRope { x, y1, y2, isLadder }
```

A vertical line you can attach to. Attach by pressing **Up** while overlapping
it, or **Down** while standing on a foothold directly above its top. While
attached: gravity off, vertical movement at climb speed, jump detaches with a
sideways impulse. Ladders and ropes differ only in climb animation and a small
speed difference.

#### Portals

```
Portal { id, name, x, y, type, targetMapId, targetPortalName }
```

Types: `spawn` (where you appear), `visible` (arrow shown, press Up),
`hidden` (invisible, walk into it), `scripted` (runs a check first — quest
gate, entry fee, level requirement), `townwarp` (returns you to the town).

Portal linkage is by **name**, not coordinate — `Forest I:west` targets
`Town:east`. This means map geometry can be edited without breaking links.

### 1.4 Mob spawn points

```
MobSpawn { mobId, x, y, fh, respawnMs, mobTime, count }
```

Spawns are **fixed points**, not random. Each spawn point holds one mob; when
that mob dies, a timer starts and the same mob respawns at the same spot. This
is why experienced players run fixed "circuits" around a map — the spawn layout
*is* the level design. `mobRate` scales how many spawn points are active.

Boss spawns use `mobTime` (a long, often hours-long, respawn) instead.

---

## Part 2 — Physics and movement

Movement feel is the thing most clones get wrong. The numbers below are the
shape of the real thing, expressed in our units (pixels, seconds).

### 2.1 Constants

| Constant | Value | Meaning |
| --- | --- | --- |
| `GRAVITY` | 2000 px/s² | Downward accel while airborne |
| `TERMINAL_VY` | 670 px/s | Fall speed cap |
| `WALK_SPEED` | 125 px/s @ 100 speed | Base ground speed |
| `JUMP_SPEED` | 620 px/s | Initial upward velocity (apex ~96px) |
| `WALK_ACCEL` | 1400 px/s² | Ground acceleration |
| `WALK_DRAG` | 2500 px/s² | Ground deceleration when no input |
| `AIR_ACCEL` | 500 px/s² | Air control (deliberately weak) |
| `CLIMB_SPEED` | 110 px/s | Ladder/rope |
| `SPEED_CAP` | 140 | Max effective speed stat |
| `JUMP_CAP` | 123 | Max effective jump stat |

`speed` and `jump` are **character stats** (100 = base) modified by equipment
and buffs, so `actualWalk = WALK_SPEED * speed/100`.

### 2.2 The movement state machine

```
        ┌──────────────────────────────────────────┐
        ▼                                          │
   ┌─────────┐  walk off edge / jump   ┌─────────┐ │ land on foothold
   │ GROUND  │────────────────────────▶│   AIR   │─┘
   │ stand   │                         │ jump    │
   │ walk    │◀────────────────────────│ fall    │
   │ prone   │      land               └─────────┘
   └─────────┘                              ▲ │
        │ up/down on ladder                 │ │ jump off
        ▼                                   │ ▼
   ┌─────────┐───────────────────────────────┘
   │ CLIMB   │
   └─────────┘
        │
   ┌─────────┐   knockback from damage (brief, uncontrollable)
   │ STAGGER │
   └─────────┘
```

**Prone** (Down while grounded) matters: it's the dodge. Many attacks pass over
a prone character, and prone is how you interact with some objects.

**Knockback** on taking damage is a fixed horizontal impulse away from the
attacker plus a small hop, with control locked for ~0.3s. It is the primary
source of death in this genre — you get hit near a ledge, get knocked off, and
fall into a mob pack. Knockback can be resisted by a stance-type skill.

### 2.3 Landing resolution (the important bit)

Each frame, for an airborne entity moving from `(x0,y0)` to `(x1,y1)`:

1. If `vy <= 0` (moving up), skip — you pass through platforms from below.
2. For every foothold in the entity's layer whose x-range overlaps `[x0,x1]`:
   - Compute the foothold's `y` at the entity's `x1`.
   - If `y0 <= fhY + EPSILON` and `y1 >= fhY` — we crossed the line downward.
3. Pick the **highest** such foothold (smallest y) — the first one we'd hit.
4. Snap `y = fhY`, `vy = 0`, set `groundedFh = fh`, enter GROUND state.

Walking on the ground each frame:

1. `x += vx * dt`
2. Walk the foothold chain: while `x` is past `fh.x2`, `fh = fh.next`; while
   past `fh.x1`, `fh = fh.prev`. If the chain ends → enter AIR (fall off).
3. `y = fh.yAt(x)` — snap to the segment. **This is what makes slopes work.**

---

## Part 3 — Character stats

### 3.1 The four base stats

| Stat | Primary for | Effects |
| --- | --- | --- |
| **STR** | Warrior, Pirate(str) | Damage for str weapons; +HP on some jobs |
| **DEX** | Bowman, Pirate(dex) | Damage for dex weapons; **accuracy**; secondary for warriors |
| **INT** | Magician | Magic damage; **max MP**; magic defense |
| **LUK** | Thief | Damage for luk weapons; **avoidability**; secondary crit |

Every level grants **5 AP** (ability points) to distribute. At level 200 with no
resets you have ~995 + starting 25 = ~1020 points. This is the long-tail
progression: a level-150 character is mostly a pile of AP.

### 3.2 Derived stats

```
maxHP    = base per job per level (+ HP-increase skill, + equip)
maxMP    = base per job per level (+ INT contribution, + equip)
accuracy = f(DEX, LUK)                → hit chance vs mob avoidability
avoid    = f(LUK, DEX)                → dodge chance vs mob accuracy
watk     = Σ equipment weapon attack  → physical damage
matk     = Σ equipment magic attack   → magic damage
wdef/mdef= Σ equipment defense        → flat damage reduction
speed    = 100 + Σ equip (cap 140)
jump     = 100 + Σ equip (cap 123)
critRate, critDamage, ignoreDefense, bossDamage, elementalBonus…
```

HP/MP growth per level is **job-dependent** and this is a defining balance
lever: a warrior gains ~24–28 HP/level, a magician ~10–14 HP but ~22 MP.
Advancing to 2nd job grants a large one-time HP/MP bonus.

### 3.3 Job requirements

Job advancement is **gated by level + a stat threshold + an NPC quest**:

| Advancement | Level | Requirement |
| --- | --- | --- |
| 1st job | 8–10 | Base stat ≥ 20 (e.g. STR 35 for warrior), talk to instructor |
| 2nd job | 30 | Stat ≥ ~60–80, complete a proof-of-strength trial |
| 3rd job | 70 | Trial + a collected item |
| 4th job | 120 | Trial |

Each advancement grants SP, unlocks a new skill tree, raises HP/MP, and — the
real payoff — **a new movement or attack verb**.

---

## Part 4 — Job system

### 4.1 The five branches

```
                          ┌─ Warrior ──┬─ Fighter    ─ Crusader   ─ Hero
                          │            ├─ Page       ─ White Kt   ─ Paladin
                          │            └─ Spearman   ─ Dragon Kt  ─ Dark Kt
                          │
                          ├─ Magician ─┬─ F/P Wizard ─ F/P Mage   ─ F/P Arch
                          │            ├─ I/L Wizard ─ I/L Mage   ─ I/L Arch
   Beginner ──────────────┤            └─ Cleric     ─ Priest     ─ Bishop
   (lv 1-10)              │
                          ├─ Bowman ───┬─ Hunter     ─ Ranger     ─ Bowmaster
                          │            └─ Crossbowm. ─ Sniper     ─ Marksman
                          │
                          ├─ Thief ────┬─ Assassin   ─ Hermit     ─ Night Lord
                          │            └─ Bandit     ─ Chief Bnd  ─ Shadower
                          │
                          └─ Pirate ───┬─ Brawler    ─ Marauder   ─ Buccaneer
                                       └─ Gunslinger ─ Outlaw     ─ Corsair
```

Our replication uses the same five-branch, four-tier shape with original class
names (`docs/CLASSES.md` and `src/data/jobs.ts`).

### 4.2 Skills

```
Skill {
  id, name, jobId, maxLevel, masterLevel
  type: passive | active_attack | active_buff | active_summon | movement
  levels: [{ mpCost, damagePercent, attackCount, mobCount, duration,
             cooldownMs, hitRate, x, y }]   // one entry per skill level
  animation, element, weaponRequirement
}
```

Key properties:

- **SP is spent per-skill, per-level.** 3 SP per level-up (1st job onward).
- **Max level vs master level.** A skill caps at `maxLevel` normally; a mastery
  book raises it to `masterLevel` (this is a 4th-job mechanic).
- **`damagePercent`** is the whole balance system. A skill at 100% deals exactly
  your basic-attack damage. A 2nd-job skill might be 130% × 2 hits on 3 mobs.
- **`mobCount` / `attackCount`** — how many targets, how many hits each. Damage
  is rolled **independently per hit**, so a 3-hit skill has less variance than a
  1-hit skill of the same total.
- **Buffs** apply a timed stat delta and must be re-cast (the "buff dance" that
  defines the moment-to-moment rhythm of high-level play).

---

## Part 5 — Combat math

This is the heart of the game and where a clone lives or dies. Here is the real
shape of it.

### 5.1 Basic attack damage range

Physical damage depends on which stats your **weapon** scales with:

```
primary   = the weapon's main stat  (STR for swords, DEX for bows, …)
secondary = the weapon's off stat   (DEX for swords, STR for bows, …)

maxDamage = (primary * mult + secondary) * watk / 100
minDamage = (primary * mult * 0.9 * mastery + secondary) * watk / 100
```

where:

- `mult` is a **weapon-class multiplier**: 1H sword 4.0, 2H sword 4.6, spear
  /polearm 4.9 (3.0 when swung the "wrong" way), bow 3.4, claw 3.6, gun 3.6,
  wand/staff (magic) n/a.
- `mastery` is your weapon mastery skill level as a fraction (0.10 → 0.90+).
  **Mastery does not raise your max damage — it raises your min.** This is the
  single most misunderstood mechanic in the game and the reason mastery skills
  feel so good: your damage stops being a coin flip.

Magic damage is different — it scales off INT and MATK with a nonlinear curve,
and the spell's own `damagePercent` and element matter more than weapon class.

### 5.2 Applying it to a hit

```
1. roll        = uniform(minDamage, maxDamage)
2. skill       = roll * skill.damagePercent / 100
3. defense     = skill - mob.wdef * 0.5 * (1 - ignoreDefense)
4. element     = defense * elementalModifier(skill.element, mob.resist)
                 // immune 0.0 | strong 0.5 | normal 1.0 | weak 1.5
5. critical    = (rand < critRate) ? element * critDamage : element
6. leveldiff   = element * levelPenalty(playerLevel, mobLevel)
7. final       = max(1, floor(leveldiff))
```

**Level penalty** is the invisible hand that keeps you on-level. If the mob is
higher level than you, you deal less damage *and* miss more. If you're far
above the mob, EXP is slashed. Together these define the "correct" hunting map
for your level, without a single line of UI telling you so.

### 5.3 Did it even hit?

```
hitChance = clamp( accuracy / (mobAvoid * 1.84 + 1.0)
                   - levelDelta * 0.05, 0.05, 1.00 )
```

Missing feels terrible, so accuracy is the stat that gates you out of maps more
harshly than damage does. A player with enough damage but not enough accuracy
whiffs 40% of swings and simply cannot hunt there.

### 5.4 Taking damage

```
raw       = mob.pad * randomFactor
afterDef  = raw - player.wdef * 0.5
afterMDef = (magic) raw - player.mdef * 0.6
final     = max(1, afterDef)  → HP -= final
                              → knockback impulse
                              → i-frames ~0.7s
```

Touch damage (walking into a mob) is a huge fraction of incoming damage in this
genre — mobs don't need attacks to hurt you, contact is enough.

### 5.5 Death

You do not lose items. You lose **EXP** — a percentage of the EXP toward your
current level (scaling with level, reduced/eliminated by a charm item). You
respawn at the map's `returnMapId`. This is a soft penalty that makes risky
maps *feel* risky without being punishing enough to quit over.

---

## Part 6 — EXP and the level curve

### 6.1 The table

EXP-to-next-level is a hand-tuned table, not a formula, with deliberate
inflection points where the curve jerks upward — right at the job advancement
levels (30, 70, 120). Shape:

| Level | EXP to next | Notes |
| --- | --- | --- |
| 1 | 15 | seconds |
| 10 | 220 | 1st job done |
| 30 | 15,000 | 2nd job wall |
| 50 | 95,000 | |
| 70 | 380,000 | 3rd job wall |
| 100 | 1,700,000 | |
| 120 | 4,900,000 | 4th job wall |
| 150 | 22,000,000 | |
| 199 | 2,207,026,470 | the famous grind |

We generate a curve of this exact character in `src/data/expTable.ts` — piecewise
exponential with the inflections preserved.

### 6.2 EXP from a kill

```
gained = mob.exp
       * levelDifferenceModifier(playerLevel, mobLevel)
       * partyBonus
       * rateMultipliers (events, buffs)
```

`levelDifferenceModifier` is the leash:

| `playerLevel - mobLevel` | Modifier |
| --- | --- |
| ≤ -5 (mob much higher) | 1.2 (bonus, but you'll die) |
| -4 … +4 | 1.0 |
| +5 … +9 | 1.0 → 0.6 ramp |
| +10 … +19 | 0.6 → 0.2 ramp |
| ≥ +20 | 0.05 |

This is why you *must* keep moving to harder maps. The game never tells you;
your EXP bar just stops moving.

---

## Part 7 — Monsters

```
Mob {
  id, name, level, maxHP, maxMP, exp
  pad (physical attack), mad, pdef, mdef
  acc, avoid, speed
  element, resistances: { fire, ice, lightning, poison, holy }
  aggroType: passive | aggressive | aggro-on-hit
  moveType:  stationary | walk | jump | fly
  bodyAttack: bool           // does touching it hurt?
  knockbackHP                // damage needed to stagger it
  boss: bool, undead: bool
  drops: DropEntry[]
  respawnMs
}
```

### 7.1 Mob AI

Deliberately simple, and that simplicity is a feature — mobs are *terrain*, not
opponents. The state machine:

```
IDLE (stand, ~1-3s)
  → pick direction → MOVE (walk along foothold chain until edge or wall)
  → occasionally JUMP (if moveType allows)
  → if aggressive and player within aggroRange → CHASE (move toward player)
  → on damage → STAGGER (if damage >= knockbackHP) then CHASE
  → HP <= 0 → DIE (death animation, then drop roll, then despawn, then timer)
```

Flying mobs ignore footholds entirely and bob within the map bounds.

### 7.2 Drops

Each mob has a **drop table**:

```
DropEntry { itemId | 'meso', chance (0..1), minQty, maxQty }
```

On death, roll every entry independently. Mesos are almost always dropped
(`chance ~0.7`) with an amount scaled to mob level. Drops spawn as physical
items that arc out of the corpse, land on a foothold, and expire after ~2
minutes. **Items must be walked over and picked up** — this is a deliberate
friction that makes clearing a map a two-pass activity.

Rare equipment drops sit at 0.1%–1%, which is what makes them worth talking
about in chat. The gap between "common junk" and "the one good drop" is 3
orders of magnitude, and that gap is the entire economy.

---

## Part 8 — Items and inventory

### 8.1 Categories and the five tabs

| Tab | Holds |
| --- | --- |
| **EQUIP** | Weapons, armor, accessories — each instance has *its own stats* |
| **USE** | Potions, scrolls, arrows, throwing stars — stackable |
| **SETUP** | Chairs, decorations |
| **ETC** | Quest items, crafting materials, mob junk — stackable |
| **CASH** | Cosmetic / premium |

Each tab has independent slot capacity (starts 24, expandable). Slot pressure is
a real resource — this is why the ETC tab full of monster drops is a constant
low-grade nuisance and why players make trips back to town.

### 8.2 Equipment slots

```
hat, faceAcc, eyeAcc, earring, top, bottom, overall, shoes, gloves,
cape, shield, weapon, pendant, belt, ring1..ring4, medal, badge
```

`overall` occupies both `top` and `bottom`. `shield` is blocked by two-handed
weapons.

### 8.3 The equipment instance model — why this matters

An equipment item is **not** just an id. Every drop is a unique instance:

```
EquipInstance {
  itemId, uuid
  str, dex, int, luk, watk, matk, wdef, mdef, acc, avoid, speed, jump, hp, mp
  upgradeSlots      // remaining scroll slots
  upgradeCount      // successful scrolls applied
  level, reqLevel, reqStr/Dex/Int/Luk, reqJob
}
```

When an equip drops, its stats are **randomized around the base** (±~10%). Then:

- **Scrolls** consume an upgrade slot and, on success (10%–100% depending on the
  scroll), add stats. On failure the slot is consumed anyway, and cursed scrolls
  can destroy the item outright.
- This produces a **gambling loop** on top of the drop loop. A base item with
  7 slots that scrolls perfectly is worth orders of magnitude more than the same
  item scrolled badly. This, not the drop table, is where the economy lives.

We implement instance stats + scrolling because without them equipment is just
a linear power number and the whole item game evaporates.

### 8.4 Consumables

Potions restore flat or percentage HP/MP with a short cooldown. The HP/MP potion
economy is a genuine constraint at low levels — a meaningful fraction of grinding
income goes straight back into potions, which is what makes mesos matter before
you can afford equipment.

---

## Part 9 — NPCs, quests, shops

### 9.1 Dialogue

NPC conversations are a small **scripted state machine**:

```
say(text) → next
askYesNo(text) → branch
askMenu([options]) → branch
askNumber / askText
giveItem / takeItem / giveExp / giveMeso / gainSP
openShop / openStorage
warp(mapId)
```

Job instructors, quest givers, shopkeepers, and storage keepers are all this
same machine with different scripts.

### 9.2 Quests

```
Quest {
  id, name, npcStartId, npcEndId
  requirements: { minLevel, maxLevel, job[], completedQuests[], items[] }
  objectives:   { kill: {mobId: count}, collect: {itemId: count} }
  rewards:      { exp, meso, items[], sp, fame }
  state:        NOT_STARTED | IN_PROGRESS | COMPLETE
}
```

Most quests are "kill 20 of X" / "collect 30 of Y" — deliberately. The quest
system's real job is not narrative; it's to **point players at the right map for
their level** and to convert the ETC-tab junk into a reason to keep grinding.
Story exists in a small number of hand-crafted questlines; the rest is scaffolding.

### 9.3 Shops

Buy at list price, sell at ~a fraction of it. Shops are the meso sink and the
floor of the economy — they set the minimum value of every drop.

---

## Part 10 — UI

```
┌──────────────────────────────────────────────────────────────┐
│ [minimap]                                        [buff icons]│
│  name                                                        │
│  ▭▭▭▭▭▭                                                      │
│                                                              │
│                       G A M E   V I E W                      │
│                                                              │
│                                                              │
│ [chat/system log            ]              [ inventory ]     │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ HP ███████░░░  MP ██████░░░  EXP ████░░░░░░  Lv.42       │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

Windows: **Stat (AP)**, **Skill (SP)**, **Inventory (5 tabs)**, **Equipment**,
**Quest log**, **Keybindings**, **World map**, **Minimap**.

Default keys (and ours):
`←/→` move, `Alt` jump, `Ctrl` attack, `↑` up/portal/ladder, `↓` prone/down-jump,
`Z` pick up, `I` inventory, `S` skills, `A`/`K` stats, `Q` quests, `M` minimap.

---

## Part 10.5 — The front end

Before a player ever sees a map, the genre asks three questions in a fixed
order, and the order is doing real work:

1. **Which world?** Parallel servers, grouped by ruleset — a self-found ladder
   where nothing can be traded, and an open-market one where it can. Choosing
   here is choosing an economy, which is why it comes first and why it is not
   easily reversible.
2. **Which character?** A grid of slots, most of them empty. Slots are the
   pitch for alt characters: the empty ones are an invitation, and the filled
   ones are a record of what you have already invested.
3. **Which class?** A card grid on one side, a detail panel on the other —
   portrait, category, tagline, and a small stat table (origin, how it moves,
   what stat it scales from). The table matters more than the prose: it is the
   only place a new player learns that a class is a *movement* style as much as
   a damage style.

Only then does the world load. We reproduce all three (`src/ui/screens.ts`,
driven by `src/app.ts`), with one addition: alongside the five branch classes
there is a **classic** option that starts you as a Novice with no class at all
and defers the choice to an instructor at level 10 — the original progression,
which our job tree still implements underneath.

Character storage follows from this: an account holds worlds, a world holds
slots, a slot holds one character (`src/game/profile.ts`).

## Part 11 — Our architecture

### 11.1 Module map

```
src/
  main.ts                  bootstrap, canvas, game instance
  engine/
    loop.ts                fixed-timestep accumulator (60 Hz sim, free render)
    input.ts               keyboard state + edge detection + rebinding
    camera.ts              follow + clamp to vrBounds + parallax transform
    renderer.ts            layered canvas 2D draw list
    rng.ts                 seedable PRNG (deterministic tests)
    events.ts              typed event bus
  physics/
    foothold.ts            foothold chains, yAt(), chain walking, landing
    body.ts                movement state machine, gravity, knockback
    ladder.ts              attach/detach/climb
  game/
    stats.ts               base/derived stat computation
    combat.ts              THE damage formula, hit chance, elements, crits
    character.ts           player entity: state, AP/SP, level-up, job advance
    mob.ts                 mob entity + AI state machine
    drops.ts               drop rolls, ground items, pickup
    inventory.ts           5 tabs, stacking, equip/unequip, slot rules
    equipment.ts           instance stats, randomization, scrolling
    skills.ts              skill effects, cooldowns, buffs
    quests.ts              objective tracking, state machine
    npc.ts                 dialogue state machine, shops
    world.ts               map loading, portals, spawn management
    save.ts                serialize/deserialize to localStorage
  data/
    expTable.ts            level 1..200 curve
    jobs.ts                job tree, HP/MP growth, requirements
    skills.ts              skill definitions with per-level tables
    items.ts               item database
    mobs.ts                mob database + drop tables
    maps/*.ts              map definitions
  ui/
    hud.ts, windows/*.ts   HP/MP/EXP bar, inventory, stats, skills, minimap
  art/
    sprites.ts             procedural sprite generation (original art)
```

### 11.2 Non-negotiable technical decisions

1. **Fixed timestep, 60 Hz.** Physics determinism matters for a platformer.
   Render interpolates between sim frames.
2. **Data-driven everything.** Mobs, items, skills, maps are plain data objects.
   Tuning must never require touching logic.
3. **Seedable RNG.** Damage rolls, drop rolls, and mob AI all pull from an
   injectable PRNG so the combat math is unit-testable.
4. **No engine dependency.** Canvas 2D, TypeScript, zero runtime deps. The
   foothold system is too specific for an off-the-shelf physics engine, and
   fighting one would cost more than writing it.
5. **Original procedural art.** Sprites are generated at runtime from code so the
   repo needs no asset pipeline and no third-party art.
6. **Single-player first, multiplayer-shaped.** All state changes go through
   explicit systems so a client/server split stays possible later.

### 11.3 Build order

| Phase | Deliverable |
| --- | --- |
| **1** | Engine loop, input, camera, renderer, foothold physics, one map — *walk, jump, climb, feel right* |
| **2** | Stats, EXP table, combat formula, mobs + AI, damage numbers, death/respawn |
| **3** | Items, drops, pickup, inventory, equipment + instance stats, mesos |
| **4** | Jobs, AP/SP, skills, job advancement, buffs |
| **5** | Multiple maps, portals, NPCs, dialogue, shops, quests |
| **6** | UI windows, minimap, save/load |
| **7** | Content pass: the full map graph, mob roster, item DB, questlines |
| **8** | Story layer — *yours* |

Phase 8 is deliberately left empty. Everything above it is the machine; the
story is what you put into it.

---

## Appendix — where the implementation deviates

Every clone makes simplifications. These are ours, and why.

**Magic damage uses the same formula as physical.** Section 5.1 describes magic
as a separate nonlinear curve. We unify it: a wand or staff is a weapon class
with a multiplier, INT is its primary stat, LUK its secondary, and MATK
substitutes for WATK. One formula is far easier to balance and to test, and the
spell's own `damagePercent` and element carry the class identity anyway.

**Storage is inventory expansion.** Rather than a second parallel inventory,
the keeper NPC sells +8 slots per tab. This engages the same slot-pressure
mechanic — the thing that actually drives the behaviour — without a whole
second window.

**Scrolls apply to the equipped item in their target slot.** The real game
drags a scroll onto an item. Without drag-and-drop, targeting what you are
wearing preserves the decision (which item do I gamble on?) with a click.

**Ring slots are four, everything else is one.** Matching convention, but there
are no face/eye accessory items in the database yet — the slots exist and are
drawn, waiting for content.

**3rd and 4th job skill trees are not populated.** Jobs, requirements, HP/MP
bonuses and advancement all exist for all four tiers. Only the 1st and 2nd tier
*skills* are written. Extending is mechanical: add entries to `src/data/skills.ts`
with the matching `jobId`.

**No party, guild, trade, or chat.** Single-player. Every state change already
routes through an explicit system rather than mutating globals, so a
client/server split remains possible, but nothing here is networked.

**No audio.** The `bgm` field exists in the map model and is unused.

### Tuning constants that differ from the doc

- `JUMP_SPEED` is 620, not 555 — a ~96px apex gives map authoring a cleaner
  vertical clearance budget than ~77px did.
- Ground mass under a foothold fades out over 220px rather than ending in a
  hard edge, purely a rendering choice.
