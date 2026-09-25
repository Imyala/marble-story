import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Builder } from '../world/level';
import type { QuestDef, QuestSpot } from '../game/quests';
import { Talker, type Prop, type Torch } from '../entities/props';
import { ImpModel, type EnemyPose } from '../enemies/models';
import { SPEAKERS } from '../game/story';
import { mat, glow } from '../render/materials';
import { makeCyl } from '../world/collision';
import type { DragonLook } from '../player/dragonRig';

/**
 * Side quests for Act I: one from the folk of each realm, placed here rather
 * than in the realm files. Each realm's builder below stands its quest giver
 * off the main path, and keeps the quest's things in the world in step with
 * the quest: lantern-flames to find, a named Gloom to beat, gates to race
 * through, braziers to light, goats to lead home.
 *
 * Quest items are small glowing props of their own (not Collectibles), so no
 * realm's secret count changes. Progress lives in `SaveData.quests`.
 */

// Who talks, for the dialogue box.
Object.assign(SPEAKERS, {
  wick: { name: 'Old Wick', color: '#ffe38a' },
  quillon: { name: 'Quillon', color: '#c8d4f0' },
  hesper: { name: 'Keeper Hesper', color: '#f4c890' },
  brisa: { name: 'Old Brisa', color: '#8ad8c8' },
  maud: { name: 'Maud', color: '#cfe0f0' },
  tamsin: { name: 'Tamsin of the Vale', color: '#e8c070' },
  brine: { name: 'Old Brine', color: '#e8b890' },
});

/** Where everything stands (the builders nudge givers onto clear ground nearby). */
const AT = {
  wick: { level: 'fen', x: -38.2, z: 6.8, label: 'Old Wick' },
  jarA: { level: 'fen', x: 7.4, z: 57.4, label: 'A lantern-flame' },
  jarB: { level: 'fen', x: 31.5, z: 132.8, label: 'A lantern-flame' },
  snig: { level: 'fen', x: 24.5, z: 97.5, label: 'Snig' },
  quillon: { level: 'sanctum', x: -39.6, z: 30.4, label: 'Quillon' },
  hesper: { level: 'sanctum', x: -40.2, z: -3.2, label: 'Keeper Hesper' },
  page: { level: 'sanctum', x: 34.6, z: -36.0, label: 'The lost page' },
  brisa: { level: 'falls', x: 17.4, z: 0.8, label: 'Old Brisa' },
  raceStart: { level: 'falls', x: 13.6, z: -2.6, label: 'The first gate' },
  maud: { level: 'frostworks', x: -12.2, z: 45.0, label: 'Maud' },
  camp: { level: 'frostworks', x: -32.2, z: 58.2, label: 'The cutters\' fire' },
  tamsin: { level: 'plains', x: 45.4, z: -6.6, label: 'Tamsin' },
  pen: { level: 'plains', x: 43, z: -1, label: 'The goat pen' },
  brine: { level: 'keep', x: -5.2, z: 0.6, label: 'Old Brine' },
  gristle: { level: 'keep', x: 13, z: -112, label: 'Sergeant Gristle' },
  nest: { level: 'keep', x: -27.6, z: -158.2, label: 'Nyxa\'s nest' },
} satisfies Record<string, QuestSpot>;

/** The Windstair Run: [x, z, yaw] of each gate, from Brisa's bridge to the Windward Bank. */
const RACE: [number, number, number][] = [
  [13.6, -2.6, -Math.PI / 2], [1.2, 3.6, -0.63], [1.5, 18, 0.49], [4.8, 27.1, -0.1], [0.5, 34, -0.73], [-4.1, 41.4, -0.17], [-0.7, 50.3, 0.57],
];
/** Seconds to beat (Brisa's record). */
const RACE_LIMIT = 15;
let lastRun = 0;

/** Tamsin's goats: where each wandered off to, and its spot in the pen. */
const GOATS: { id: string; name: string; x: number; z: number; slot: [number, number] }[] = [
  { id: 'goat-clover', name: 'Clover', x: -40, z: 66, slot: [41, -1.6] },
  { id: 'goat-nettle', name: 'Nettle', x: 33, z: 84, slot: [43.6, 0.2] },
  { id: 'goat-duchess', name: 'Duchess', x: -22, z: 86, slot: [45.6, -1.8] },
];

/** The cutters' four braziers round their camp. */
const HEARTHS: [number, number][] = [[-28.6, 51.8], [-38.8, 52.4], [-39.2, 63.8], [-29.4, 65.4]];

/** Named foes the quests send Aster after. */
const NAMED = new WeakMap<object, string>();
const isNamed = (ref: unknown, id: string) => !!ref && typeof ref === 'object' && NAMED.get(ref) === id;

// ---------------------------------------------------------------------------
// The quests
// ---------------------------------------------------------------------------

export const SIDE_QUESTS: QuestDef[] = [
  {
    id: 'fen-lanterns', title: 'Old Wick\'s Lanterns', giver: 'Old Wick, lamplighter', realm: 'fen', giverAt: AT.wick,
    desc: 'The Gloom stole three flames out of Old Wick\'s lanterns. Two were dropped in the marsh; a Gloomling called Snig licked the third and ran off with it.',
    steps: [
      { text: 'Find two of Wick\'s lost lantern-flames ({n}/{goal})', on: { event: 'item', id: /^jar-[ab]$/, count: 2 },
        at: (g) => [AT.jarA, AT.jarB].filter((_, i) => !g.quests.hasItem('fen-lanterns', i ? 'jar-b' : 'jar-a')) },
      { text: 'Snig licked the last flame: defeat Snig at the Drowned Mill', on: { event: 'kill', test: (d) => isNamed(d.ref, 'snig') }, at: [AT.snig] },
      { text: 'Pick up the flame Snig dropped', on: { event: 'item', id: 'jar-c' }, at: [AT.snig] },
      { text: 'Bring the lantern-flames home to Old Wick', on: { event: 'talk', id: 'wick' }, at: [AT.wick] },
    ],
    reward: {
      gems: 80,
      page: { title: 'The Lamplighters\' Song', from: 'Old Wick', text: 'Light the first for the ones who wander. Light the second for the ones who wait. Light the third for the ones who never came home, and leave the door on the latch, in case.' },
    },
  },
  {
    id: 'sanctum-overdue', title: 'Long Overdue', giver: 'Quillon, Keeper of Scrolls', realm: 'sanctum', giverAt: AT.quillon,
    desc: 'Quillon saved the Hatchery Roll from the burnt library. It belongs with Keeper Hesper, and Hesper, it turns out, has a book of his.',
    steps: [
      { text: 'Take the Hatchery Roll to Keeper Hesper in the hatchery, over the west bridge', on: { event: 'talk', id: 'hesper' }, at: [AT.hesper] },
      { text: 'Find the Roll\'s last page: the wind took it toward the Stargazers\' islets', on: { event: 'item', id: 'roll-page' }, at: [AT.page] },
      { text: 'Bring the page to Keeper Hesper', on: { event: 'talk', id: 'hesper' }, at: [AT.hesper] },
      { text: 'Return Hesper\'s long-overdue Book of Lullabies to Quillon', on: { event: 'talk', id: 'quillon' }, at: [AT.quillon] },
    ],
    reward: {
      gems: 70,
      page: { title: 'The Hatchery Roll, Last Page', from: 'Keeper Hesper', text: 'Forty-one eggs in the warm sand. The Wardens drew lots for names by the fire. Lot drawn for the violet egg, in Emberhold\'s own claw: ASTER. He said it looked like a flower that refused to close.' },
    },
  },
  {
    id: 'falls-race', title: 'The Windstair Run', giver: 'Old Brisa, ferrywoman', realm: 'falls', giverAt: AT.brisa,
    desc: 'Nobody has ever beaten Old Brisa\'s time on the Windstair Run: across her bridge, over the rope bridges, and up to the Windward Bank.',
    steps: [
      { text: `Run through every gate to the Windward Bank inside ${RACE_LIMIT} seconds`, on: { event: 'signal', id: 'brisa-run' }, at: [AT.raceStart] },
      { text: 'Tell Old Brisa her record has fallen', on: { event: 'talk', id: 'brisa' }, at: [AT.brisa] },
    ],
    reward: {
      gems: 100,
      page: { title: 'The Ferry Bell', from: 'Old Brisa', text: 'Ring once, the ferry is leaving. Ring twice, the ferry is back. Ring three times and somebody is showing off on the rope bridges again, and it is probably me.' },
    },
  },
  {
    id: 'frost-hearths', title: 'Warm Hands', giver: 'Maud, head cutter', realm: 'frostworks', giverAt: AT.maud,
    desc: 'The Gloom ate the ice-cutters\' biscuits, sat round their fire and let it go out. The cutters are hiding in the cold. Pim has lost the feeling in his tail.',
    steps: [
      { text: 'Drive the Gloom from the cutters\' camp', done: (g) => campClear(g), at: [AT.camp] },
      { text: 'Light the cutters\' four cold braziers with fire ({n}/{goal})', on: { event: 'item', id: /^hearth-\d$/, count: 4 },
        at: (g) => HEARTHS.filter((_, i) => !g.quests.hasItem('frost-hearths', `hearth-${i}`)).map(([x, z]) => ({ level: 'frostworks', x, z, label: 'A cold brazier' })) },
      { text: 'Tell Maud the camp is warm again', on: { event: 'talk', id: 'maud' }, at: [AT.maud] },
    ],
    reward: {
      gems: 90,
      page: { title: 'Tally Board, New Entry', from: 'Maud, head cutter', text: 'Blocks cut this week: none. Fires lit by a violet dragon: four. Biscuits saved: six (hidden in the ice, where the Gloom never look). Pim\'s tail: fine. It is fine. Stop asking.' },
    },
  },
  {
    id: 'plains-goats', title: 'Three Goats Gone', giver: 'Tamsin of the Vale', realm: 'plains', giverAt: AT.tamsin,
    desc: 'Clover, Nettle and Duchess went to see what the humming was, out past the old walls of the meadow. Tamsin would like them back, opinions and all.',
    steps: [
      { text: 'Find Tamsin\'s goats in the meadow and lead them home to the pen ({n}/{goal})', on: { event: 'item', id: /^goat-/, count: 3 },
        at: (g) => goatSpots(g) },
      { text: 'Tell Tamsin her goats are home', on: { event: 'talk', id: 'tamsin' }, at: [AT.tamsin] },
    ],
    reward: { gems: 110 },
  },
  {
    id: 'keep-cake', title: 'Honey Cake for Nyxa', giver: 'Old Brine, keep cook', realm: 'keep', giverAt: AT.brine,
    desc: 'Old Brine baked a honey cake for Nyxa. Sergeant Gristle, the greediest Shade Knight in the Keep, pinched it with his gauntlets.',
    steps: [
      { text: 'Find Sergeant Gristle in the Court of Seals and take back the cake', on: { event: 'kill', test: (d) => isNamed(d.ref, 'gristle') }, at: [AT.gristle] },
      { text: 'Pick up the honey-cake basket', on: { event: 'item', id: 'cake' }, at: [AT.gristle] },
      { text: 'Leave the basket in Nyxa\'s nest, off the side of the Hall of Umbra', on: { event: 'signal', id: 'brine-nest' }, at: [AT.nest] },
    ],
    reward: {
      gems: 150,
      page: { title: 'Old Brine\'s Honey Cake', from: 'Old Brine, keep cook', text: 'One: take the honey from the wisps. They will not notice; they are wisps. Two: flour, and whatever the knights have not sat on. Three: bake it on the brazier while nobody is looking. Four: give it to somebody who has forgotten what kindness tastes like. Repeat until they remember.' },
    },
  },
];

const def = (id: string) => SIDE_QUESTS.find((q) => q.id === id)!;

/** No Gloom left that was posted by the cutters' fire. */
function campClear(g: Game): boolean {
  if (g.level?.def.id !== 'frostworks') return false;
  return !g.enemies.some((e) => e.alive && Math.hypot(e.homeX - AT.camp.x, e.homeZ - AT.camp.z) < 10);
}

/** Where the goats not yet home are (live, while in the Plains). */
function goatSpots(g: Game): QuestSpot[] {
  const live = g.level?.def.id === 'plains' ? g.level.props.filter((p): p is QuestGoat => p instanceof QuestGoat && p.mode !== 'home') : null;
  if (live) return live.map((q) => ({ level: 'plains', x: q.x, z: q.z, label: q.name }));
  return GOATS.filter((q) => !g.quests.hasItem('plains-goats', q.id)).map((q) => ({ level: 'plains', x: q.x, z: q.z, label: q.name }));
}

// ---------------------------------------------------------------------------
// Placing them
// ---------------------------------------------------------------------------

/** Places the current realm's quest givers and quest items (after its own build). */
export function buildSideQuests(b: Builder): void {
  b.game.quests.clearHooks();
  fell.clear();
  BUILD[b.level.def.id]?.(b);
}

const BUILD: Record<string, (b: Builder) => void> = {
  fen: buildFen,
  sanctum: buildSanctum,
  falls: buildFalls,
  frostworks: buildFrost,
  plains: buildPlains,
  keep: buildKeep,
};

/** The quest's current step, -1 before it starts, the step count once done. */
const stepOf = (g: Game, id: string) => (g.quests.isDone(id) ? def(id).steps.length : g.quests.step(id));

function buildFen(b: Builder): void {
  const g = b.game;
  const Q = 'fen-lanterns';
  const stage = new Stage(g, Q);
  b.level.props.push(stage);
  const talk = () => {
    const s = stepOf(g, Q);
    if (s < 0) {
      g.say([
        { who: 'wick', text: 'Aster? Little Aster? Glimmer\'s hatchling? Look at you. You\'ve gone and got ENORMOUS.' },
        { who: 'flick', text: 'Old Wick! We read your log. The lanterns went dark, the frogs stopped singing...' },
        { who: 'wick', text: 'And then the Gloom came and stole my flames. Three of them, right out of the glass. Who steals a flame?' },
        { who: 'wick', text: 'Two they dropped in the marsh, I\'d wager. Flames don\'t agree with a Gloomling\'s tummy. One by the fishing jetty, one out in the east bog.' },
        { who: 'wick', text: 'The third one... a little fellow called Snig LICKED it. Then he ran off to the old mill, hiccuping sparks.' },
        { who: 'aster', text: 'We\'ll get all three back.' },
        { who: 'wick', text: 'Bless your scales. Bring them home and I\'ll light the causeway so bright the Gloom will need a hat.' },
      ], () => g.quests.start(Q));
    } else if (s < 3) {
      g.say([{ who: 'wick', text: s === 0 ? 'One by the fishing jetty, one out in the east bog. They\'ll be glowing. Flames are terrible at hiding.' : 'Mind the one in Snig. It\'s probably sticky.' }]);
    } else if (s === 3) {
      g.say([
        { who: 'wick', text: 'My flames! All three! Oh, look at them wriggle.' },
        { who: 'wick', text: 'Snig licked this one? It tastes of... no. No, I won\'t ask.' },
        { who: 'wick', text: 'Here, for your trouble. And the song we sing when the lamps come on. Glimmer used to hum it over your egg.' },
      ], () => g.quests.notify('talk', { id: 'wick' }));
    } else {
      g.say([{ who: 'wick', text: 'Causeway\'s never been brighter. The frogs are singing again. Badly, but singing.' }]);
    }
  };
  const w = placeFolk(b, 'wick', 'firefly', AT.wick.x, AT.wick.z, 'Talk to Old Wick', talk, 3);
  addGlyph(b, Q, 'wick', w.x, w.y + 2.4, w.z);
  stage.item('jar-a', 'flame', AT.jarA.x, AT.jarA.z, 'A lantern-flame', (s) => s === 0, 5);
  stage.item('jar-b', 'flame', AT.jarB.x, AT.jarB.z, 'A lantern-flame', (s) => s === 0);
  stage.named('snig', 'grunt', 'Snig', AT.snig.x, AT.snig.z, Math.PI, (s) => s === 1, 'jar-c',
    'That\'s Snig! He\'s glowing from the inside. That can\'t be healthy.');
  stage.item('jar-c', 'flame', AT.snig.x, AT.snig.z, 'Snig\'s lantern-flame', (s) => s === 2);
  stage.sync();
}

function buildSanctum(b: Builder): void {
  const g = b.game;
  const Q = 'sanctum-overdue';
  const stage = new Stage(g, Q);
  b.level.props.push(stage);
  const quillon = () => {
    const s = stepOf(g, Q);
    if (s < 0) {
      g.say([
        { who: 'quillon', text: 'Ah! A reader! Wipe your claws. No, the other claws. Thank you.' },
        { who: 'quillon', text: 'I am Quillon, Keeper of Scrolls. I have spent twelve years sorting ash. Most of it was poetry, which is honestly an improvement.' },
        { who: 'quillon', text: 'But THIS survived. The Hatchery Roll: every egg ever laid in the Sanctum, in the Keeper\'s own claw. It belongs with Keeper Hesper, in the hatchery over the west bridge.' },
        { who: 'flick', text: 'Is it overdue?' },
        { who: 'quillon', text: 'It is TWELVE YEARS overdue. Take it to her, please. And while you are there, ask her about the Book of Lullabies. She will know.' },
      ], () => g.quests.start(Q));
    } else if (s < 3) {
      g.say([{ who: 'quillon', text: 'Hesper will be in the hatchery, counting the nests. She always counts the nests.' }]);
    } else if (s === 3) {
      g.say([
        { who: 'quillon', text: 'The Book of Lullabies! Two hundred and... never mind the number. The fine is waived. The fine is EMOTIONALLY waived.' },
        { who: 'quillon', text: 'Take this for your trouble. And do come back. Nobody ever comes back to a library. It is very sad.' },
      ], () => g.quests.notify('talk', { id: 'quillon' }));
    } else {
      g.say([{ who: 'quillon', text: 'I have started a new shelf: Things Aster Brought Back. It is my favourite shelf.' }]);
    }
  };
  const hesper = () => {
    const s = stepOf(g, Q);
    if (s === 0) {
      g.say([
        { who: 'hesper', text: 'The Roll? Quillon found the Roll?' },
        { who: 'hesper', text: '...Oh. The last page is gone. The wind took it the night of the fire, off toward the Stargazers\' rocks. It had the last eggs on it.' },
        { who: 'hesper', text: 'Yours too, little one. Would you find it for me? I would like to finish the Roll properly.' },
      ], () => g.quests.notify('talk', { id: 'hesper' }));
    } else if (s === 1) {
      g.say([{ who: 'hesper', text: 'South-east, past the little islets. Pages fly, but they never fly far from the stars.' }]);
    } else if (s === 2) {
      g.say([
        { who: 'hesper', text: 'That\'s it. Forty-one eggs, and at the bottom, the violet one. And the name the Wardens drew for you by lot...' },
        { who: 'hesper', text: 'Aster. It says Aster. Well! The fireflies and the Wardens agree on something.' },
        { who: 'flick', text: 'We picked it first. For the record.' },
        { who: 'hesper', text: 'Now, before Quillon sends another letter: his Book of Lullabies. I borrowed it before you hatched. Don\'t let him fine you.' },
      ], () => g.quests.notify('talk', { id: 'hesper' }));
    } else {
      g.say([{ who: 'hesper', text: 'Forty-one nests. One came home. I count that one twice.' }]);
    }
  };
  const q = placeDragon(b, 'quillon', QUILLON, AT.quillon.x, AT.quillon.z, 'Talk to Quillon', quillon);
  addGlyph(b, Q, 'quillon', q.x, q.y + 2.9, q.z);
  const h = placeDragon(b, 'hesper', HESPER, AT.hesper.x, AT.hesper.z, 'Talk to Keeper Hesper', hesper);
  addGlyph(b, Q, 'hesper', h.x, h.y + 3.0, h.z);
  stage.item('roll-page', 'page', AT.page.x, AT.page.z, 'The Hatchery Roll\'s last page', (s) => s === 1, 5);
  stage.sync();
}

function buildFalls(b: Builder): void {
  const g = b.game;
  const Q = 'falls-race';
  const stage = new Stage(g, Q);
  b.level.props.push(stage);
  const talk = () => {
    const s = stepOf(g, Q);
    if (s < 0) {
      g.say([
        { who: 'brisa', text: 'A dragon! On MY landing! Mind the nets. And the fish. And the other nets.' },
        { who: 'brisa', text: 'No crossings today, the river\'s running backwards again. So I sit here and remember my glory days.' },
        { who: 'brisa', text: 'When I was young we ran the Windstair Run: over my bridge, over the rope bridges, all the way up to the Windward Bank. Nobody ever beat my time.' },
        { who: 'flick', text: 'What was your time?' },
        { who: 'brisa', text: `${RACE_LIMIT} seconds. Well. Fifteen and a bit. The wind was behind me. Go on, youngster, show me what legs are for. Every gate, mind, or it doesn't count!` },
      ], () => g.quests.start(Q));
    } else if (s === 0) {
      g.say([{ who: 'brisa', text: 'The first gate\'s at the end of my bridge. The clock starts when you go through it. Charging helps. So does not falling off.' }]);
    } else if (s === 1) {
      g.say([
        { who: 'brisa', text: `Never. NEVER. In ${lastRun ? lastRun.toFixed(1) : 'HOW many'} seconds?` },
        { who: 'brisa', text: 'Hah! Well, the record is yours, and so is this. It was my mother\'s. She said anyone faster than me should have it, and she was very sure nobody would be.' },
      ], () => g.quests.notify('talk', { id: 'brisa' }));
    } else {
      g.say([{ who: 'brisa', text: 'Record holder! Don\'t let it go to your horns. I\'m training again. Slowly. With snacks.' }]);
    }
  };
  const w = placeDragon(b, 'brisa', BRISA, AT.brisa.x, AT.brisa.z, 'Talk to Old Brisa', talk, 2.5);
  addGlyph(b, Q, 'brisa', w.x, w.y + 2.8, w.z);
  stage.add((s) => s === 0, () => {
    const course = new RaceCourse(g, RACE, RACE_LIMIT, (secs) => {
      lastRun = secs;
      g.hud.flick('We did it! Faster than Brisa! Let\'s go and gloat. Nicely.', 5);
      g.quests.notify('signal', { id: 'brisa-run' });
    });
    b.level.props.push(course);
    return course;
  });
  stage.sync();
}

function buildFrost(b: Builder): void {
  const g = b.game;
  const Q = 'frost-hearths';
  const stage = new Stage(g, Q);
  b.level.props.push(stage);
  const talk = () => {
    const s = stepOf(g, Q);
    if (s < 0) {
      g.say([
        { who: 'maud', text: 'Psst! Dragon! Over here, behind the... well, behind me. I\'m Maud. Head cutter. Of a crew of cutters who are currently hiding.' },
        { who: 'maud', text: 'The Gloom walked into our camp, ate every biscuit we had and sat round our fire. Then they let it go OUT. Who lets a fire go out? In the FROSTWORKS?' },
        { who: 'maud', text: 'Pim\'s lost the feeling in his tail. He says it\'s fine. It is not fine.' },
        { who: 'aster', text: 'I\'ll clear them out and get your fire going.' },
        { who: 'maud', text: 'Light our four braziers round the camp while you\'re at it. They keep the frost off. And the Gloom, it turns out, which is a nice bonus.' },
      ], () => g.quests.start(Q));
    } else if (s === 0) {
      g.say([{ who: 'maud', text: 'They\'re still over at our fire, across the bridge. I can hear them chewing.' }]);
    } else if (s === 1) {
      g.say([{ who: 'maud', text: 'Four braziers, round the edge of the camp. Fire breath. Whoosh. You know the drill.' }]);
    } else if (s === 2) {
      g.say([
        { who: 'maud', text: 'Is that... warmth? I remember warmth! Lads! LADS! Back to the camp!' },
        { who: 'maud', text: 'Pim says thank you. He says it through chattering teeth, but he means it. Here: gems, and the good biscuits. We hid them in the ice.' },
      ], () => g.quests.notify('talk', { id: 'maud' }));
    } else {
      g.say([{ who: 'maud', text: 'Camp\'s cosy again. Pim can feel his tail. He wishes he couldn\'t; he sat on the brazier.' }]);
    }
  };
  const m = placeDragon(b, 'maud', MAUD, AT.maud.x, AT.maud.z, 'Talk to Maud', talk, 3);
  addGlyph(b, Q, 'maud', m.x, m.y + 2.7, m.z);
  // The braziers: lit for good once counted, and noticed when fire lights them during the lighting step.
  const torches: Torch[] = HEARTHS.map(([x, z], i) => b.torch(x, z, 'quest-hearths', stepOf(g, Q) > 1 || g.quests.hasItem(Q, `hearth-${i}`)));
  b.level.props.push({
    update: () => {
      if (stepOf(g, Q) !== 1) return;
      torches.forEach((t, i) => {
        if (t.lit && !g.quests.hasItem(Q, `hearth-${i}`)) g.quests.pickItem(Q, `hearth-${i}`);
      });
    },
  });
  stage.sync();
}

function buildPlains(b: Builder): void {
  const g = b.game;
  const Q = 'plains-goats';
  const stage = new Stage(g, Q);
  b.level.props.push(stage);
  const talk = () => {
    const s = stepOf(g, Q);
    if (s < 0) {
      g.say([
        { who: 'tamsin', text: 'Oh! A dragon! Have you seen three goats? About so big, terrible attitudes, answer to Clover, Nettle and Duchess?' },
        { who: 'tamsin', text: 'They went to see what the humming was, out in the meadow past the old wall. I told them not to. Goats never listen. Goats are ninety percent opinions.' },
        { who: 'flick', text: 'We\'ll find them!' },
        { who: 'tamsin', text: 'Walk up to one and it\'ll follow you. They love anything that looks like trouble. Lead them back to the pen here, would you? Mind the holes.' },
      ], () => g.quests.start(Q));
    } else if (s === 0) {
      g.say([{ who: 'tamsin', text: 'Clover likes the high ground, Nettle eats anything she shouldn\'t, and Duchess likes being fetched. All three are out in the meadow.' }]);
    } else if (s === 1) {
      g.say([
        { who: 'tamsin', text: 'Clover! Nettle! Duchess! You rotten, wonderful beasts.' },
        { who: 'tamsin', text: 'I don\'t have much, but the Vale pays its debts. And if the ground starts humming again, I\'m sending YOU.' },
      ], () => g.quests.notify('talk', { id: 'tamsin' }));
    } else {
      g.say([{ who: 'tamsin', text: 'Duchess has forgiven you. Nettle ate the gate. Clover is on the roof. Everything is back to normal.' }]);
    }
  };
  const t = placeDragon(b, 'tamsin', TAMSIN, AT.tamsin.x, AT.tamsin.z, 'Talk to Tamsin', talk, 2.5);
  addGlyph(b, Q, 'tamsin', t.x, t.y + 2.6, t.z);
  // The goats: out in the meadow once the quest is taken, in the pen once home.
  for (const q of GOATS) {
    stage.add((s) => s >= 0, () => {
      const home = g.quests.isDone(Q) || g.quests.hasItem(Q, q.id);
      const goat = new QuestGoat(g, Q, q.id, q.name, q.x, q.z, q.slot, home);
      b.level.props.push(goat);
      return goat;
    });
  }
  stage.sync();
}

function buildKeep(b: Builder): void {
  const g = b.game;
  const Q = 'keep-cake';
  const stage = new Stage(g, Q);
  b.level.props.push(stage);
  const talk = () => {
    const s = stepOf(g, Q);
    if (s < 0) {
      g.say([
        { who: 'brine', text: 'Don\'t hit me, love, I\'m the cook! Old Brine. I only ever fought turnips, and the turnips won.' },
        { who: 'flick', text: 'A Gloomling... cook?' },
        { who: 'brine', text: 'Somebody has to feed the knights. Gruel, gruel, gruel. The King doesn\'t eat at all, which I take personally.' },
        { who: 'brine', text: 'I baked a honey cake for Nyxa. She\'s a sweet thing under all that shadow, you know. And Sergeant Gristle, the greediest Shade Knight in the Keep, pinched it. With his GAUNTLETS.' },
        { who: 'aster', text: 'I\'ll get it back.' },
        { who: 'brine', text: 'He\'ll be skulking about the Court of Seals, crumbs on his helmet. Take the cake to her nest, off the side of the Hall of Umbra. Just leave it there. She\'ll know who it\'s from.' },
      ], () => g.quests.start(Q));
    } else if (s < 3) {
      g.say([{ who: 'brine', text: s === 0 ? 'Gristle\'s the one with crumbs on his helmet. Can\'t miss him. Well, you can, he dodges. Don\'t miss him.' : 'Her nest is off the east... no, the WEST side of the Hall of Umbra. Past the little rocks. Mind the drop.' }]);
    } else {
      g.say([{ who: 'brine', text: 'She\'ll find it. Somebody ought to look after that girl. Might as well be a cook and a dragon.' }]);
    }
  };
  const c = placeFolk(b, 'brine', 'cook', AT.brine.x, AT.brine.z, 'Talk to Old Brine', talk, 2.5);
  addGlyph(b, Q, 'brine', c.x, c.y + 2.3, c.z);
  stage.named('gristle', 'knight', 'Sergeant Gristle', AT.gristle.x, AT.gristle.z, 0, (s) => s === 0, 'cake',
    'That knight has crumbs all down his front. That\'s Gristle!');
  stage.item('cake', 'cake', AT.gristle.x, AT.gristle.z, 'Nyxa\'s honey cake', (s) => s === 1);
  b.trigger(AT.nest.x, AT.nest.z, 2.8, () => {
    if (stepOf(g, Q) !== 2) return;
    g.say([
      { who: 'aster', text: 'There. Right by the candles, where she\'ll see it.' },
      { who: 'flick', text: 'It smells amazing. I\'m not going to eat it. I\'m just going to hover here and think about it.' },
    ], () => g.quests.notify('signal', { id: 'brine-nest' }));
  }, false);
  stage.sync();
}

// ---------------------------------------------------------------------------
// Givers
// ---------------------------------------------------------------------------

const QUILLON: DragonLook = { body: 0x7a8aa0, belly: 0xd8d0b8, horn: 0xe8e0c8, membrane: 0x9aa8c0, eye: 0xffd070, spikes: 0xe8e0c8, scale: 1.25, hornStyle: 'curled', tailStyle: 'fan', slender: 0.55, beard: true };
const HESPER: DragonLook = { body: 0xc88a5a, belly: 0xf4dca8, horn: 0xf0e0c0, membrane: 0xe8a878, eye: 0x7ad0a0, spikes: 0xf0e0c0, scale: 1.3, hornStyle: 'swept', tailStyle: 'fan', slender: 0.6 };
const BRISA: DragonLook = { body: 0x3a7a78, belly: 0xc8d8b0, horn: 0xd8c8a0, membrane: 0x5aa0a0, eye: 0xffc040, spikes: 0xd8c8a0, scale: 1.2, hornStyle: 'curled', tailStyle: 'arrow', slender: 0.15, beard: true };
const MAUD: DragonLook = { body: 0x8aa0b8, belly: 0xe8eef4, horn: 0x5a5048, membrane: 0x6a8aa8, eye: 0xff9a40, spikes: 0x5a5048, scale: 1.15, hornStyle: 'crown', tailStyle: 'club', slender: 0.05 };
const TAMSIN: DragonLook = { body: 0xb87a40, belly: 0xf0d8a0, horn: 0x6a5038, membrane: 0xd89a58, eye: 0x60c060, spikes: 0x6a5038, scale: 1.1, hornStyle: 'swept', tailStyle: 'arrow', slender: 0.35 };

/**
 * Clear, level, dry ground near (x, z), searching outward to `reach`: off
 * the water, out of hazards and fights, and not on top of anything else.
 */
function clearSpot(b: Builder, x: number, z: number, reach = 4): [number, number, number] {
  const lv = b.level;
  const col = b.col;
  for (let r = 0; r <= reach; r += 0.75) {
    const n = r === 0 ? 1 : Math.max(6, Math.round(r * 7));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const px = x + Math.sin(a) * r;
      const pz = z + Math.cos(a) * r;
      const y = col.groundAt(px, pz, 1e4, 0.4).y;
      if (y < -1e3 || y < lv.waterLevel + 0.3) continue;
      if ([[1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]].some(([dx, dz]) => Math.abs(col.groundAt(px + dx!, pz + dz!, y + 1, 0.3).y - y) > 0.45)) continue;
      if (b.game.inHazard(px, y + 0.1, pz)) continue;
      if (lv.interactables.some((it) => Math.hypot(it.x - px, it.z - pz) < 3)) continue;
      if (lv.hittables.some((h) => Math.hypot(h.x - px, h.z - pz) < h.radius + 1.3)) continue;
      if (lv.arenas.some((ar) => Math.hypot(ar.x - px, ar.z - pz) < ar.r + 2)) continue;
      return [px, y, pz];
    }
  }
  return [x, b.y(x, z), z];
}

/** Faces a giver toward where Aster usually comes from: the realm's start. */
function faceIn(b: Builder, x: number, z: number): number {
  const [sx, sz] = b.level.def.spawn;
  return Math.atan2(sx - x, sz - z);
}

/** A dragon quest giver. */
function placeDragon(b: Builder, id: string, look: DragonLook, x0: number, z0: number, label: string, talk: () => void, reach = 4): { x: number; y: number; z: number } {
  const [x, y, z] = clearSpot(b, x0, z0, reach);
  b.npc(id, look, x, z, faceIn(b, x, z), label, talk);
  return { x, y, z };
}

/** A quest giver who is not a dragon: a firefly elder or a Gloomling cook. */
function placeFolk(b: Builder, id: string, kind: 'firefly' | 'cook', x0: number, z0: number, label: string, talk: () => void, reach = 4): { x: number; y: number; z: number } {
  const [x, y, z] = clearSpot(b, x0, z0, reach);
  const folk = new Folk(b.game, id, kind, x, y, z, faceIn(b, x, z));
  b.level.props.push(folk);
  const t = new Talker(b.game, x, y, z, label, talk);
  b.level.props.push(t);
  b.level.interactables.push(t);
  if (kind === 'cook') b.col.add(makeCyl(x, z, 0.6, y, y + 1.4));
  return { x, y, z };
}

/**
 * A little figure who is not a dragon. Turns toward Aster when she comes
 * near, and bobs along while talking.
 */
class Folk implements Prop {
  private root = new THREE.Group();
  private wings: THREE.Mesh[] = [];
  private imp: ImpModel | null = null;
  private pose: EnemyPose = { state: 'idle', t: 0, speed: 0, attack: null, windup: 0, frozen: false, shocked: false, dead: false, deadT: 0, airborne: false, guard: false, flipped: false };
  private t = Math.random() * 5;
  private yaw: number;

  constructor(private game: Game, readonly id: string, private kind: 'firefly' | 'cook', readonly x: number, readonly y: number, readonly z: number, yaw: number) {
    this.yaw = yaw;
    if (kind === 'firefly') this.firefly();
    else this.cook();
    this.root.position.set(x, y, z);
    game.level!.root.add(this.root);
  }

  /** Old Wick: a firefly of great age, in a lamplighter's cap. */
  private firefly(): void {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat(0x3a2a14, { rough: 0.6 }));
    body.scale.set(1, 1, 1.4);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), glow(0xffd860));
    tail.position.set(0, -0.04, -0.34);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 12), glow(0xffe070, 0.1, true));
    halo.position.copy(tail.position);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), mat(0x2a1e10, { rough: 0.6 }));
    head.position.set(0, 0.06, 0.3);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.22, 10), mat(0x7a2a20, { rough: 0.8 }));
    cap.position.set(0, 0.26, 0.3);
    cap.rotation.x = -0.2;
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 12), mat(0x7a2a20, { rough: 0.8 }));
    brim.position.set(0, 0.16, 0.31);
    const lens = mat(0xf0e0a0, { rough: 0.2, metal: 0.8 });
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), glow(0xffffff));
      eye.position.set(s * 0.06, 0.09, 0.42);
      const spec = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 5, 12), lens);
      spec.position.set(s * 0.06, 0.09, 0.44);
      this.root.add(eye, spec);
    }
    const wm = new THREE.MeshBasicMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.34, 12), wm);
      w.scale.set(1, 0.45, 1);
      w.position.set(s * 0.28, 0.14, -0.04);
      w.rotation.x = -Math.PI / 2;
      this.root.add(w);
      this.wings.push(w);
    }
    // His lamplighter's pole, with a flame of his own at the tip.
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.1, 6), mat(0x5a4028, { rough: 0.9 }));
    pole.position.set(0.3, -0.25, 0.25);
    pole.rotation.z = 0.35;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), glow(0xffb040));
    tip.position.set(0.12, 0.26, 0.25);
    this.root.add(body, tail, halo, head, cap, brim, pole, tip);
  }

  /** Old Brine: a round old Gloomling in an apron, with her good pot. */
  private cook(): void {
    this.imp = new ImpModel({ skin: 0x6a5e70, belly: 0xd8c8a8, eye: 0xffc860, scale: 0.92, bulk: 1, ears: 'short', weapon: 'none', offhand: 'none' });
    this.root.add(this.imp.root);
    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.06), mat(0xf0ead8, { rough: 0.9 }));
    apron.position.set(0, 0.62, 0.36);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.36, 12), mat(0x3a3440, { rough: 0.4, metal: 0.6 }));
    pot.position.set(0.75, 0.18, 0.2);
    const stew = new THREE.Mesh(new THREE.CircleGeometry(0.27, 12), glow(0xe0a050));
    stew.rotation.x = -Math.PI / 2;
    stew.position.set(0.75, 0.35, 0.2);
    const ladle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6), mat(0x8a8a90, { rough: 0.3, metal: 0.8 }));
    ladle.position.set(0.72, 0.5, 0.18);
    ladle.rotation.z = -0.4;
    this.root.add(apron, pot, stew, ladle);
    this.root.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
  }

  update(dt: number): void {
    const g = this.game;
    this.t += dt;
    const p = g.player.body;
    const d = Math.hypot(p.x - this.x, p.z - this.z);
    if (d < 9) {
      const want = Math.atan2(p.x - this.x, p.z - this.z);
      let diff = want - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.yaw += diff * Math.min(1, dt * 2.5);
    }
    this.root.rotation.y = this.yaw;
    const talking = g.dialogueSpeaker === this.id;
    if (this.kind === 'firefly') {
      this.root.position.y = this.y + 1.5 + Math.sin(this.t * 2.2) * 0.12 + (talking ? Math.abs(Math.sin(this.t * 9)) * 0.06 : 0);
      this.wings.forEach((w, i) => { w.rotation.z = Math.sin(this.t * 38) * 0.8 * (i ? 1 : -1); });
      if (Math.random() < dt * 6) g.fx.sparkle(this.x, this.root.position.y - 0.1, this.z, 0xffe070, 1);
    } else if (this.imp) {
      this.pose.t += dt;
      this.pose.state = 'idle';
      this.imp.update(dt, this.pose);
      if (talking) this.root.position.y = this.y + Math.abs(Math.sin(this.t * 8)) * 0.05;
    }
  }
}

/**
 * The gold mark over a giver: "!" while their quest waits to be taken, a
 * turning diamond while the current step is to talk to them.
 */
function addGlyph(b: Builder, questId: string, npcId: string, x: number, y: number, z: number): void {
  const g = b.game;
  const root = new THREE.Group();
  const m = glow(0xffd860);
  const bang = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), m);
  bar.position.y = 0.32;
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), m);
  bang.add(bar, dot);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), m);
  gem.scale.y = 1.4;
  gem.position.y = 0.2;
  root.add(bang, gem);
  root.position.set(x, y, z);
  b.level.root.add(root);
  const q = def(questId);
  let t = Math.random() * 3;
  b.level.props.push({
    update: (dt: number) => {
      t += dt;
      const Q = g.quests;
      let mode: 'new' | 'talk' | null = null;
      if (!Q.isStarted(questId)) mode = Q.available(q) ? 'new' : null;
      else if (!Q.isDone(questId)) {
        const on = q.steps[Q.step(questId)]?.on;
        mode = on?.event === 'talk' && on.id === npcId ? 'talk' : null;
      }
      root.visible = !!mode && g.dialogueSpeaker !== npcId;
      bang.visible = mode === 'new';
      gem.visible = mode === 'talk';
      root.position.y = y + Math.sin(t * 2.4) * 0.12;
      root.rotation.y = t * 1.6;
    },
  });
}

// ---------------------------------------------------------------------------
// Quest things in the world
// ---------------------------------------------------------------------------

interface Removable {
  remove(): void;
}

/**
 * Keeps a realm's quest things in step with the quest: each is made when its
 * step comes round and taken away when it is no longer wanted.
 */
class Stage implements Prop {
  private things: { want: (step: number) => boolean; make: () => Removable; live: Removable | null }[] = [];

  constructor(private game: Game, private questId: string) {
    game.quests.onStep(questId, () => this.sync());
  }

  add(want: (step: number) => boolean, make: () => Removable): void {
    this.things.push({ want, make, live: null });
  }

  /**
   * A quest item to pick up, placed while `want` holds and it has not been
   * taken: where a named foe carrying it fell this visit, or else at (x, z).
   */
  item(id: string, kind: ItemKind, x0: number, z0: number, label: string, want: (step: number) => boolean, fromY?: number): void {
    const g = this.game;
    this.add((s) => want(s) && !g.quests.hasItem(this.questId, id), () => {
      const f = fell.get(id);
      const [x, z] = f ? [f[0], f[2]] : [x0, z0];
      const top = f ? f[1] + 2 : fromY ?? 1e4;
      const gy = g.col.groundAt(x, z, top, 0.2).y;
      const y = gy > -1e3 ? gy : f?.[1] ?? 0;
      const it = new QuestItem(g, this.questId, id, kind, x, y, z, label);
      g.level!.props.push(it);
      return it;
    });
  }

  /**
   * A named elite, out while `want` holds. It carries quest item `drop`: the
   * item step places it where the foe fell (after a reload, at its post).
   */
  named(id: string, type: string, name: string, x: number, z: number, yaw: number, want: (step: number) => boolean,
    drop: string, spotted: string): void {
    const g = this.game;
    this.add(want, () => {
      const y = g.col.groundAt(x, z, 1e4, 0.3).y;
      const e = g.spawnEnemy(type, x, y + 0.05, z, yaw, false);
      e.makeElite();
      NAMED.set(e, id);
      const plate = nameplate(name);
      plate.position.y = e.def.height + 1.1;
      e.model.root.add(plate);
      let seen = false;
      const watch: Prop = {
        update: () => {
          if (!e.alive) return;
          fell.set(drop, [e.x, e.y, e.z]);
          if (seen) return;
          const p = g.player.body;
          if (Math.hypot(p.x - e.x, p.z - e.z) < 16) {
            seen = true;
            g.hud.flick(spotted, 5);
          }
        },
      };
      g.level!.props.push(watch);
      return { remove: () => { if (e.alive) { e.alive = false; e.state = 'dead'; e.deadT = 1; } } };
    });
  }

  sync(): void {
    const g = this.game;
    const s = g.quests.isDone(this.questId) ? 99 : g.quests.step(this.questId);
    for (const t of this.things) {
      const w = t.want(s);
      if (w && !t.live) t.live = t.make();
      else if (!w && t.live) {
        t.live.remove();
        t.live = null;
      }
    }
  }

  update(): void {
    /* synced on quest steps */
  }
}

/** Where a named foe carrying a quest item was last seen alive this visit, by item id. */
const fell = new Map<string, [number, number, number]>();

type ItemKind = 'flame' | 'page' | 'cake';

/** A small glowing thing a quest wants found. Not a Collectible: secret counts stay as they are. */
class QuestItem implements Prop, Removable {
  private root = new THREE.Group();
  private t = Math.random() * 6;
  taken = false;
  gone = false;

  constructor(private game: Game, readonly quest: string, readonly id: string, readonly kind: ItemKind,
    readonly x: number, readonly y: number, readonly z: number, private label: string) {
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 20), glow(0xffe8a0, 0.35, true));
    beacon.position.y = -0.95;
    this.root.add(beacon);
    if (kind === 'flame') {
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 12, 1, true), mat(0xd8f0ff, { rough: 0.1, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 12), mat(0x6a4a2a, { rough: 0.7 }));
      lid.position.y = 0.23;
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), glow(0xffb040));
      flame.scale.y = 1.5;
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), glow(0xfff8d0));
      this.root.add(glass, lid, flame, core);
    } else if (kind === 'page') {
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.6), mat(0xf0e2c0, { rough: 0.9, emissive: 0x6a5a30, emissiveIntensity: 0.3, side: THREE.DoubleSide }));
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.66), glow(0xffd070, 0.6, true));
      edge.position.z = -0.01;
      this.root.add(sheet, edge);
    } else {
      const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.22, 12), mat(0x9a6a3a, { rough: 0.9 }));
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 5, 16, Math.PI), mat(0x7a5028, { rough: 0.9 }));
      handle.position.y = 0.1;
      const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 14), mat(0xe8a040, { rough: 0.6, emissive: 0xa05a10, emissiveIntensity: 0.5 }));
      cake.position.y = 0.16;
      this.root.add(basket, handle, cake);
    }
    this.root.position.set(x, y + 1.1, z);
    game.level!.root.add(this.root);
  }

  update(dt: number): void {
    if (this.taken || this.gone) return;
    const g = this.game;
    this.t += dt;
    this.root.position.y = this.y + 1.1 + Math.sin(this.t * 2.4) * 0.14;
    this.root.rotation.y += dt * (this.kind === 'page' ? 0.9 : 1.6);
    if (this.kind === 'page') this.root.rotation.z = Math.sin(this.t * 1.7) * 0.25;
    if (Math.random() < dt * 5) g.fx.sparkle(this.x, this.y + 1.1, this.z, this.kind === 'flame' ? 0xffc060 : 0xffe8a0, 1);
    const p = g.player.body;
    if (g.player.alive && Math.hypot(p.x - this.x, p.y + 0.6 - (this.y + 1.1), p.z - this.z) < 1.7) this.take();
  }

  private take(): void {
    const g = this.game;
    this.taken = true;
    g.level?.root.remove(this.root);
    g.fx.motes(this.x, this.y + 1.1, this.z, 0xffe8a0, 24);
    g.sfx(this.kind === 'page' ? 'page' : 'relic', this.x, this.y, this.z, 1.1);
    g.toast(`Found: ${this.label}`, 'good');
    g.quests.pickItem(this.quest, this.id);
  }

  remove(): void {
    this.gone = true;
    this.game.level?.root.remove(this.root);
  }
}

/** A name floating over a foe. */
function nameplate(text: string): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 96;
  const x = c.getContext('2d')!;
  x.font = 'bold 44px Palatino, "Palatino Linotype", Georgia, serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.lineWidth = 9;
  x.strokeStyle = 'rgba(24,10,34,.92)';
  x.strokeText(text, 256, 48);
  x.fillStyle = '#ffd870';
  x.fillText(text, 256, 48);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(3.6, 0.68, 1);
  s.renderOrder = 8;
  return s;
}

/**
 * The Windstair Run: gates in a line from Brisa's bridge up the rope bridges.
 * The clock starts at the first gate; every gate in order, inside the limit.
 */
class RaceCourse implements Prop, Removable {
  private gates: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; x: number; y: number; z: number; nx: number; nz: number }[] = [];
  private next = 0;
  private t = 0;
  private prev = new THREE.Vector3();
  private hud: HTMLDivElement;
  private live = true;

  constructor(private game: Game, pts: [number, number, number][], private limit: number, private onWin: (secs: number) => void) {
    for (const [x, z, yaw] of pts) {
      const y = game.col.groundAt(x, z, 1e4, 0.3).y + 1.9;
      const m = new THREE.MeshBasicMaterial({ color: 0x7af0e0, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.13, 8, 32), m);
      ring.position.set(x, y, z);
      ring.rotation.y = yaw;
      game.level!.root.add(ring);
      this.gates.push({ mesh: ring, mat: m, x, y, z, nx: Math.sin(yaw), nz: Math.cos(yaw) });
    }
    this.hud = document.createElement('div');
    this.hud.className = 'toast good';
    this.hud.style.cssText = 'position:absolute;left:50%;top:7%;transform:translateX(-50%);font-size:16px;display:none;';
    game.hud.root.appendChild(this.hud);
    this.paint();
  }

  private paint(): void {
    this.gates.forEach((r, i) => {
      r.mat.color.setHex(i === this.next ? 0xffffff : i < this.next ? 0x6a8aff : 0x7af0e0);
      r.mat.opacity = i < this.next ? 0.25 : i === this.next ? 0.9 : 0.55;
    });
  }

  private reset(msg: string): void {
    this.next = 0;
    this.hud.style.display = 'none';
    this.game.toast(msg, 'warn');
    this.game.audio.play('uiBack');
    this.paint();
  }

  update(dt: number): void {
    if (!this.live) return;
    const g = this.game;
    const p = g.player.body;
    const cy = p.y + 0.6;
    if (this.next > 0) {
      this.t += dt;
      const left = this.limit - this.t;
      this.hud.style.display = '';
      this.hud.innerHTML = `Windstair Run &middot; gate ${this.next}/${this.gates.length} &middot; ${Math.max(0, left).toFixed(1)}s`;
      if (left <= 0 || !g.player.alive) this.reset('Too slow! Brisa\'s record stands. Back to the first gate.');
    }
    const r = this.gates[this.next];
    if (r) {
      r.mesh.rotation.z += dt * 1.5;
      r.mesh.scale.setScalar(1 + Math.sin(g.time * 6) * 0.05);
      const a = (this.prev.x - r.x) * r.nx + (this.prev.z - r.z) * r.nz;
      const b = (p.x - r.x) * r.nx + (p.z - r.z) * r.nz;
      const near = Math.hypot(p.x - r.x, p.z - r.z) < 2.8 && Math.abs(cy - r.y) < 2.8;
      if (near && (Math.sign(a) !== Math.sign(b) || Math.abs(b) < 0.6)) {
        if (this.next === 0) {
          this.t = 0;
          g.toast(`Go! ${this.limit} seconds to the Windward Bank!`, 'info');
        }
        g.audio.play('gem', 1 + this.next * 0.1, 0.9);
        g.fx.ring(r.x, r.y - 1.4, r.z, 0.5, 3, 0x7af0e0, 0.3);
        this.next++;
        if (this.next >= this.gates.length) {
          const secs = this.t;
          this.next = 0;
          this.hud.style.display = 'none';
          if (secs <= this.limit) {
            g.hud.bigText('RECORD!', 0x7af0e0);
            g.audio.play('unlock');
            g.style.bonus(40);
            this.onWin(secs);
          } else this.reset('So close! Try again from the first gate.');
        }
        this.paint();
      }
    }
    this.prev.set(p.x, cy, p.z);
  }

  remove(): void {
    this.live = false;
    this.hud.remove();
    for (const r of this.gates) this.game.level?.root.remove(r.mesh);
  }

  dispose(): void {
    this.hud.remove();
  }
}

/**
 * One of Tamsin's goats: grazes where it strayed until Aster comes close,
 * then follows her (leaping gaps a dragon glides over), waits if she runs
 * too far ahead, and trots into the pen once it is near.
 */
class QuestGoat implements Prop, Removable {
  x: number;
  y: number;
  z: number;
  mode: 'lost' | 'follow' | 'wait' | 'home';
  private root = new THREE.Group();
  private head = new THREE.Group();
  private legs: THREE.Mesh[] = [];
  private yaw = Math.random() * 6;
  private t = Math.random() * 5;
  private stuck = 0;
  private leap: { x0: number; y0: number; z0: number; x1: number; y1: number; z1: number; t: number } | null = null;
  private bleatT = 0;
  private gone = false;

  constructor(private game: Game, private quest: string, readonly id: string, readonly name: string, private homeX: number, private homeZ: number,
    private slot: [number, number], home: boolean) {
    this.mode = home ? 'home' : 'lost';
    [this.x, this.z] = home ? slot : [homeX, homeZ];
    this.y = game.col.groundAt(this.x, this.z, 1e4, 0.2).y;
    const coat = mat(0xd8c8a8, { rough: 1, flat: true });
    const dark = mat(0x5a4a3a, { rough: 0.8 });
    const horn = mat(0xe8dcc0, { rough: 0.6 });
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), coat);
    body.scale.set(0.55, 0.48, 0.8);
    body.position.y = 0.62;
    this.root.add(body);
    this.head.position.set(0, 0.86, 0.42);
    const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), coat);
    skull.scale.set(0.26, 0.26, 0.36);
    skull.position.z = 0.1;
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 5), dark);
    beard.position.set(0, -0.16, 0.2);
    beard.rotation.x = Math.PI;
    this.head.add(skull, beard);
    for (const s of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.3, 5), horn);
      h.position.set(s * 0.08, 0.16, 0.02);
      h.rotation.x = -0.6;
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.07), coat);
      ear.position.set(s * 0.15, 0.06, 0.02);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), mat(0x1a1410, { rough: 0.3 }));
      eye.position.set(s * 0.1, 0.05, 0.22);
      this.head.add(h, ear, eye);
    }
    this.root.add(this.head);
    for (const [lx, lz] of [[0.16, 0.26], [-0.16, 0.26], [0.16, -0.26], [-0.16, -0.26]] as const) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.42, 5), dark);
      leg.position.set(lx, 0.21, lz);
      this.legs.push(leg);
      this.root.add(leg);
    }
    // A little bell, so they read as somebody's goats and not wild ones.
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0xe0b040, { rough: 0.3, metal: 0.8 }));
    bell.position.set(0, 0.62, 0.52);
    this.root.add(bell);
    this.root.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
    this.root.position.set(this.x, this.y, this.z);
    game.level!.root.add(this.root);
  }

  private ok(x: number, z: number, fromY: number): number | null {
    const g = this.game;
    const gy = g.col.groundAt(x, z, fromY + 1.3, 0.3).y;
    if (gy < -1e3 || gy < fromY - 2.2) return null;
    if (g.isDeepWater(x, z, gy) || g.inHazard(x, gy + 0.1, z)) return null;
    return gy;
  }

  update(dt: number): void {
    if (this.gone) return;
    const g = this.game;
    this.t += dt;
    this.bleatT -= dt;
    const p = g.player.body;
    const d = Math.hypot(p.x - this.x, p.z - this.z);
    let moving = 0;
    if (this.leap) {
      const L = this.leap;
      L.t = Math.min(1, L.t + dt / 0.7);
      this.x = L.x0 + (L.x1 - L.x0) * L.t;
      this.z = L.z0 + (L.z1 - L.z0) * L.t;
      this.y = L.y0 + (L.y1 - L.y0) * L.t + Math.sin(L.t * Math.PI) * 2.2;
      if (L.t >= 1) this.leap = null;
      moving = 1;
    } else if (this.mode === 'lost') {
      if (d < 5 && g.player.alive) {
        this.mode = 'follow';
        this.bleat();
        g.toast(`${this.name} trots after you, looking smug.`, 'info');
      }
    } else if (this.mode === 'wait') {
      if (d < 10) this.mode = 'follow';
      else if (this.bleatT <= 0) this.bleat(3.5);
    } else if (this.mode === 'follow') {
      if (Math.hypot(this.x - AT.pen.x, this.z - AT.pen.z) < 8) {
        this.mode = 'home';
        this.bleat();
        g.toast(`${this.name} is home!`, 'good');
        g.quests.pickItem(this.quest, this.id);
      } else if (d > 30) {
        this.mode = 'wait';
        g.hud.flick(`Aster, wait! ${this.name} can't keep up!`, 4);
      } else if (d > 2.8) {
        const sp = Math.min(7.8, 2 + (d - 2.8) * 1.3);
        const nx = this.x + ((p.x - this.x) / d) * sp * dt;
        const nz = this.z + ((p.z - this.z) / d) * sp * dt;
        const gy = this.ok(nx, nz, this.y);
        if (gy !== null && gy < this.y + 1.2) {
          this.x = nx;
          this.z = nz;
          this.y += (gy - this.y) * Math.min(1, dt * 12);
          this.stuck = 0;
          moving = sp;
        } else this.stuck += dt;
        this.yaw = Math.atan2(p.x - this.x, p.z - this.z);
        // Goats jump. Blocked for a moment, it bounds over to land behind Aster.
        if (this.stuck > 1.2 && p.grounded) {
          const bx = p.x - Math.sin(g.player.yaw) * 1.8;
          const bz = p.z - Math.cos(g.player.yaw) * 1.8;
          const by = this.ok(bx, bz, p.y + 1);
          if (by !== null) {
            this.leap = { x0: this.x, y0: this.y, z0: this.z, x1: bx, y1: by, z1: bz, t: 0 };
            this.stuck = 0;
            this.bleat();
          }
        }
      }
    } else {
      // Home: amble to its spot in the pen.
      const [sx, sz] = this.slot;
      const dd = Math.hypot(sx - this.x, sz - this.z);
      if (dd > 0.3) {
        const step = Math.min(dd, 2.2 * dt);
        this.x += ((sx - this.x) / dd) * step;
        this.z += ((sz - this.z) / dd) * step;
        const gy = g.col.groundAt(this.x, this.z, this.y + 1.5, 0.2).y;
        if (gy > -1e3) this.y = gy;
        this.yaw = Math.atan2(sx - this.x, sz - this.z);
        moving = 2;
      } else this.yaw += Math.sin(this.t * 0.4) * dt * 0.5;
    }
    // Lost in the water or off a cliff: back to where it strayed.
    if (this.y < g.killY + 2 || (this.mode !== 'home' && !this.leap && g.isDeepWater(this.x, this.z, this.y))) {
      [this.x, this.z] = [this.homeX, this.homeZ];
      this.y = g.col.groundAt(this.x, this.z, 1e4, 0.2).y;
      this.mode = 'lost';
      g.toast(`${this.name} bolted back to where you found her.`, 'warn');
    }
    this.root.position.set(this.x, this.y, this.z);
    this.root.rotation.y = this.yaw;
    const k = moving ? Math.min(1, moving / 5) : 0;
    this.legs.forEach((l, i) => { l.rotation.x = Math.sin(this.t * 14 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.6 * k; });
    this.head.rotation.x = moving ? 0 : 0.5 + Math.sin(this.t * 1.3) * 0.25;
  }

  private bleat(gap = 1.5): void {
    this.bleatT = gap;
    this.game.sfx('bleat', this.x, this.y, this.z, 1.25 + (this.name.length % 3) * 0.08, 0.9);
  }

  remove(): void {
    this.gone = true;
    this.game.level?.root.remove(this.root);
  }
}
