// Stormspire Falls: every secret is reachable the way it is meant to be, and
// the two locked ones really need Lightning and Earth.
import { boot, place, step, snap, shot, hop, glideJump, hold, releaseAll, summary, clearArenas } from './falls-lib.mjs';

const found = (h, id) => h.eval((id) => !!window.wyrm.save.found[`falls:${id}`], id);
const where = (h, id) => h.eval((id) => {
  const c = window.wyrm.level.props.find((p) => p.id === `falls:${id}`);
  return c ? [c.x, c.y, c.z] : null;
}, id);

export default async function (h) {
  await boot(h);
  await clearArenas(h);
  await h.eval(() => { window.wyrm.player.invuln = true; });
  const want = (n) => !process.env.ONLY || process.env.ONLY.split(',').includes(n);

  if (want('heart1')) {
    // Up the lookout stones, then glide through the waterfall to the hidden ledge.
    const heart = await where(h, 'heart1');
    console.log('heart1 at', JSON.stringify(heart));
    await place(h, -12.5, -5, -2.2);
    const stones = [[-15, -7, 5.6], [-18.5, -9.5, 7.1], [-22, -7.5, 8.6], [-25, -4.5, 10.1]];
    let ok = true;
    for (const [x, z, top] of stones) {
      const s = await hop(h, x, z, { flap: true, brake: 0.5 });
      const e = s[s.length - 1];
      console.log(`stone ${x},${z}: ${JSON.stringify(e)}`);
      if (!(e.g && e.y > top - 0.3)) ok = false;
    }
    h.check('climb the lookout stones', ok);
    await h.eval(([x, z]) => { const g = window.wyrm; const p = g.player; const y = Math.atan2(x - p.x, z - p.z); p.yaw = y; g.cam.snapBehind(y, 0.2); }, [heart[0], heart[2]]);
    await shot(h, 'secret-veil-view');
    let s = await glideJump(h, 1.3);
    await releaseAll(h);
    s = s.concat(await (async () => { const out = []; for (let i = 0; i < 12; i++) { await step(h, 0.1); out.push(await snap(h)); } return out; })());
    const got = await found(h, 'heart1');
    h.check('glide behind the waterfall for heart1', got, summary(s));
    await shot(h, 'secret-veil');
  }

  if (want('relic3')) {
    // The shrine roof: a jump and flap onto the broken column, then a hop across.
    await place(h, 3.8, 147.5, -Math.PI / 2);
    let s = await hop(h, 1.4, 147.5, { flap: true, brake: 0.4 });
    let e = s[s.length - 1];
    h.check('jump+flap onto the broken column', e.g && e.y > 23.8, summary(s));
    s = await hop(h, -4, 146, { brake: 3.2 });
    e = s[s.length - 1];
    await hop(h, -4, 146, { brake: 0.3 });
    h.check('hop onto the shrine roof for relic3', await found(h, 'relic3'), summary(s));
    // From the roof the rim is out of reach, so the torch gate cannot be skipped.
    await place(h, -1, 149, 0);
    const roof = await snap(h);
    s = await glideJump(h, 2.0);
    await releaseAll(h);
    await step(h, 1);
    e = await snap(h);
    h.check('the crater rim is out of reach from the roof', e.y < 23 && e.z < 159.2, `roof ${JSON.stringify(roof)} -> ${JSON.stringify(e)} ${summary(s)}`);
  }

  if (want('mana1')) {
    // The side trail of crumbles to the ledge by the great waterfall.
    await place(h, 0, 181, 0);
    const trail = [[-4.8, 179.8], [-9.6, 178.4], [-14.4, 177], [-20.2, 176.2]];
    let ok = true;
    for (const [x, z] of trail) {
      const s = await hop(h, x, z, { brake: 1.0 });
      const e = s[s.length - 1];
      console.log(`crumble ${x},${z}: ${JSON.stringify(e)}`);
      if (!(e.g && e.y > 20.5)) ok = false;
    }
    await hop(h, -20.2, 176.2, { brake: 0.2 });
    h.check('crumble trail to mana1', ok && await found(h, 'mana1'));
    await shot(h, 'secret-cascade');
  }

  if (want('relic1')) {
    // Rim crags on the spire: a low one, then the tall one.
    const relic = await where(h, 'relic1');
    await place(h, 12.5, 239, 1.5);
    await h.eval(() => { const g = window.wyrm; g.save.found['story:falls:skrieka'] = true; });
    const lowA = [16.4 * Math.sin(1.62), 243 + 16.4 * Math.cos(1.62)];
    let s = await hop(h, lowA[0], lowA[1], { flap: true, brake: 0.4 });
    let e = s[s.length - 1];
    h.check('jump+flap onto the low crag', e.g && e.y > 37, summary(s));
    s = await hop(h, relic[0], relic[2], { flap: true, brake: 0.4 });
    e = s[s.length - 1];
    h.check('then the tall crag for relic1', await found(h, 'relic1'), summary(s));
    await shot(h, 'secret-crag');
    // Anything the boss trigger started, stop it.
    await h.eval(() => { const g = window.wyrm; if (g.boss) { g.boss.alive = false; g.boss.dispose(); g.enemies = g.enemies.filter((x) => x !== g.boss); g.boss = null; g.hud.bossBar(null); } if (g.state === 'dialogue') g.dialogue.advance(); });
  }

  if (want('gated')) {
    // Earth grotto: fire and horns do nothing to cracked stone.
    const grot = await h.eval(() => window.wyrm.level.hittables.filter((x) => x.kind === 'rock').map((x) => [x.x, x.y, x.z, x.alive]));
    console.log('rock gate', JSON.stringify(grot));
    const [gx, , gz] = grot[0];
    await place(h, gx + 3.5, gz, -Math.PI / 2);
    await hold(h, 'KeyK', 1.2);
    for (let i = 0; i < 4; i++) { await h.page.keyboard.press('KeyJ'); await step(h, 0.3); }
    await h.page.keyboard.press('KeyU');
    await step(h, 1.0);
    let alive = await h.eval(() => window.wyrm.level.hittables.find((x) => x.kind === 'rock').alive);
    h.check('fire cannot break the cracked stone', alive === true);
    h.check('mana2 is sealed without Earth', !(await found(h, 'mana2')));
    // With Earth, a Boulder breaks it.
    await h.eval(() => { const g = window.wyrm; g.learnElement('earth'); g.player.mana = 100; });
    await place(h, gx + 4, gz, -Math.PI / 2);
    await h.page.keyboard.press('KeyU');
    await step(h, 1.2);
    await h.eval(() => { window.wyrm.player.mana = 100; });
    await h.page.keyboard.press('KeyU');
    await step(h, 1.2);
    alive = await h.eval(() => window.wyrm.level.hittables.find((x) => x.kind === 'rock').alive);
    h.check('an Earth Boulder breaks it', alive === false);
    // Walk in through the broken doorway.
    await place(h, gx + 3, gz, -Math.PI / 2);
    await h.page.keyboard.down('KeyW');
    await step(h, 0.6);
    await h.page.keyboard.up('KeyW');
    await step(h, 0.3);
    h.check('mana2 collected after Earth', await found(h, 'mana2'), JSON.stringify(await snap(h)));

    // Storm vault: the crystal wants a spark.
    const sw = await h.eval(() => window.wyrm.level.hittables.filter((x) => x.constructor.name === 'Switch').map((x) => [x.x, x.y, x.z, x.kind]));
    console.log('switch', JSON.stringify(sw));
    const [cx, , cz] = sw[0];
    await h.eval(() => { const g = window.wyrm; g.player.element = 'fire'; g.hud.elementChanged('fire'); });
    await place(h, cx, cz + 3.5, Math.PI);
    await hold(h, 'KeyK', 1.0);
    let vault = await h.eval(() => window.wyrm.level.hittables.find((x) => x.signal === 'falls-vault').alive);
    h.check('fire does not wake the storm crystal', vault === true);
    await place(h, 24, 211, Math.PI);
    await step(h, 0.3);
    h.check('heart2 is sealed without Lightning', !(await found(h, 'heart2')));
    await h.eval(() => { const g = window.wyrm; g.learnElement('lightning'); g.player.mana = 100; });
    await place(h, cx, cz + 3.5, Math.PI);
    await hold(h, 'KeyK', 1.0);
    await step(h, 2.0);
    vault = await h.eval(() => window.wyrm.level.hittables.find((x) => x.signal === 'falls-vault').alive);
    h.check('lightning opens the storm vault', vault === false);
    await place(h, 24, 212, Math.PI);
    await h.page.keyboard.down('KeyW');
    await step(h, 0.6);
    await h.page.keyboard.up('KeyW');
    await step(h, 0.3);
    h.check('heart2 collected after Lightning', await found(h, 'heart2'), JSON.stringify(await snap(h)));
    await shot(h, 'secret-vault');
  }
  const all = await h.eval(() => Object.keys(window.wyrm.save.found).filter((k) => k.startsWith('falls:')));
  console.log('found', all.join(' '));
}
