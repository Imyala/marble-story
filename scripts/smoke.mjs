/**
 * Headless smoke test: boots the game in a real browser, drives it with
 * keyboard input, and asserts that nothing throws and that the simulation
 * actually advances. Screenshots land in scripts/out/.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.env.GAME_URL ?? 'http://localhost:4173/';
const OUT = 'scripts/out';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.marble, null, { timeout: 10000 });
await page.waitForTimeout(600);

const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const hold = async (key, ms) => {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
};
const state = () => page.evaluate(() => {
  const g = window.marble;
  return {
    map: g.mapId,
    x: Math.round(g.player.body.x),
    y: Math.round(g.player.body.y),
    state: g.player.body.state,
    level: g.player.level,
    exp: g.player.exp,
    hp: Math.round(g.player.hp),
    maxHp: g.player.stats.maxHp,
    mesos: g.player.inventory.mesos,
    mobs: g.world.livingMobs().length,
    drops: g.world.drops.length,
    kills: g.player.killCount,
    job: g.player.jobId,
  };
});

const results = [];
const check = (label, ok, detail = '') => {
  results.push({ label, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`);
};

const start = await state();
check('boots into the starting town', start.map === 'tidewatch', JSON.stringify(start));
check('spawns monsters only outside town', start.mobs === 0, `mobs=${start.mobs}`);
await shot('01-town');

// Walking.
await hold('ArrowRight', 900);
const walked = await state();
check('walks right', walked.x > start.x + 100, `x ${start.x} -> ${walked.x}`);

// Jumping.
await page.keyboard.press('Alt');
await page.waitForTimeout(120);
const midJump = await state();
check('jumps', midJump.state === 'jump' || midJump.state === 'fall', midJump.state);
await page.waitForTimeout(700);

// Talk to an NPC: walk to Mira and press Up.
await page.evaluate(() => { window.marble.player.body.x = 400; });
await page.waitForTimeout(200);
await page.keyboard.press('ArrowUp');
await page.waitForTimeout(300);
const dialogueOpen = await page.evaluate(() => window.marble.world.map.npcs.length > 0);
check('town has NPCs to talk to', dialogueOpen);
await shot('02-dialogue');
await page.keyboard.press('Escape');

// Windows.
for (const [key, name] of [['i', 'inventory'], ['a', 'stats'], ['s', 'skills'], ['q', 'quests']]) {
  await page.keyboard.press(key);
  await page.waitForTimeout(180);
}
await shot('03-windows');
await page.keyboard.press('Escape');
await page.waitForTimeout(150);

// Travel east into the first hunting map.
await page.evaluate(() => window.marble.warpTo('snail_meadow', 'west'));
await page.waitForTimeout(900);
const field = await state();
check('warps to the hunting map', field.map === 'snail_meadow', field.map);
check('hunting map spawns monsters', field.mobs > 0, `mobs=${field.mobs}`);

// Monsters must settle onto footholds rather than hovering in mid-air.
await page.waitForTimeout(1200);
const floating = await page.evaluate(() => {
  const g = window.marble;
  return g.world.livingMobs()
    .filter((m) => m.alive && m.def.move !== 'fly' && m.body.fh === null)
    .map((m) => `${m.def.id}@${Math.round(m.body.x)},${Math.round(m.body.y)}:${m.body.state}`);
});
check('no monsters left floating', floating.length === 0, floating.slice(0, 5).join(' '));
await shot('04-field');

// Fight: give the character enough attack to actually kill things, then swing.
await page.evaluate(() => {
  const g = window.marble;
  g.player.base.str = 60;
  g.player.recompute();
});
for (let i = 0; i < 40; i++) {
  await page.evaluate(() => {
    const g = window.marble;
    // Walk onto the nearest monster so the attack box contains it.
    const mob = g.world.livingMobs().find((m) => m.alive);
    if (mob) {
      g.player.body.x = mob.body.x - 30;
      g.player.body.y = mob.body.y;
      g.player.body.facing = 1;
    }
  });
  await hold('Control', 90);
  await page.waitForTimeout(60);
}
const fought = await state();
check('kills monsters', fought.kills > 0, `kills=${fought.kills}`);
check('gains EXP or levels', fought.exp > 0 || fought.level > start.level,
      `lvl ${fought.level} exp ${fought.exp}`);
check('monsters drop loot', fought.drops > 0 || fought.mesos > start.mesos,
      `drops=${fought.drops} mesos=${fought.mesos}`);
await shot('05-combat');

// Pick the loot up.
await page.evaluate(() => {
  const g = window.marble;
  const drop = g.world.drops.find((d) => d.landed);
  if (drop) { g.player.body.x = drop.x; g.player.body.y = drop.y; }
});
await page.waitForTimeout(120);
await page.keyboard.press('z');
await page.waitForTimeout(200);
const looted = await state();
check('picks up drops', looted.mesos > start.mesos || looted.drops < fought.drops,
      `mesos ${start.mesos} -> ${looted.mesos}`);

// Respawn timer: kill everything, confirm the map refills.
await page.evaluate(() => {
  for (const m of window.marble.world.livingMobs()) m.takeDamage(999999, 0);
});
await page.waitForTimeout(400);
const cleared = await state();
await page.waitForTimeout(9000);
const refilled = await state();
check('monsters respawn', refilled.mobs > cleared.mobs, `${cleared.mobs} -> ${refilled.mobs}`);

// Level up far enough to take a job, then advance.
await page.evaluate(() => {
  const g = window.marble;
  g.player.gainExp(5000, { next: () => 0.5, int: (a) => a, range: (a) => a, chance: () => false, pick: (x) => x[0], variance: () => 1, sign: () => 1 });
});
await page.waitForTimeout(200);
const levelled = await page.evaluate(() => {
  const g = window.marble;
  g.player.base.str = 40;
  g.player.recompute();
  const ok = g.player.advanceTo(100);
  return { ok: ok.ok, job: g.player.jobId, sp: g.player.sp, level: g.player.level };
});
check('job advancement works', levelled.ok && levelled.job === 100, JSON.stringify(levelled));
check('advancement grants SP', levelled.sp > 0, `sp=${levelled.sp}`);

// Skills.
const skilled = await page.evaluate(() => {
  const g = window.marble;
  const learned = g.player.learnSkill('power_strike');
  return { learned, level: g.player.skillLevelOf('power_strike') };
});
check('learns a job skill', skilled.learned && skilled.level === 1, JSON.stringify(skilled));

// Equipment.
const equipped = await page.evaluate(() => {
  const g = window.marble;
  const before = g.player.stats.watk;
  g.player.inventory.addItem('wooden_sword', 1, g.world.rng ?? { next: () => 0.5, variance: () => 1, int: (a) => a, range: (a) => a, chance: () => false, pick: (x) => x[0], sign: () => 1 });
  const idx = g.player.inventory.tabs.equip.findIndex((s) => s?.kind === 'equip' && s.inst.itemId === 'wooden_sword');
  g.player.base.str = 60;
  g.player.recompute();
  const res = g.player.inventory.equip(idx, (id) => g.player.canWear(id));
  g.player.recompute();
  return { ok: res.ok, before, after: g.player.stats.watk };
});
check('equipping a better weapon raises attack', equipped.ok && equipped.after > equipped.before,
      `watk ${equipped.before} -> ${equipped.after}`);

// Save round-trip.
const saved = await page.evaluate(() => {
  window.marble.saveGame(false);
  return !!localStorage.getItem('marble-story.save.v1');
});
check('writes a save', saved);

await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.marble, null, { timeout: 10000 });
await page.waitForTimeout(500);
const reloaded = await state();
check('restores the save on reload', reloaded.job === 100 && reloaded.level >= levelled.level,
      JSON.stringify(reloaded));
await shot('06-reloaded');

// Death and respawn.
await page.evaluate(() => {
  const g = window.marble;
  g.player.takeDamage(g.player.stats.maxHp + 999);
});
await page.waitForTimeout(1400);
const died = await page.evaluate(() => window.marble.player.dead);
check('death is handled', died === true);
await shot('07-death');

await page.evaluate(() => window.marble.player.revive());
await page.waitForTimeout(300);
const revived = await page.evaluate(() => !window.marble.player.dead);
check('revive works', revived);

check('no runtime errors', errors.length === 0, errors.slice(0, 5).join(' | '));

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
