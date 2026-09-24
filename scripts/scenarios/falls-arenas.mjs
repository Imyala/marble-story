// Stormspire Falls: every arena spawns its waves on solid ground and clears;
// the Gloom Totem wards its allies until it breaks.
import { boot, place, step, shot, skip } from './falls-lib.mjs';

const arenaInfo = (h, id) => h.eval((id) => {
  const g = window.wyrm;
  const a = g.level.arenas.find((x) => x.id === id);
  return {
    state: a.state, wave: a.wave, waves: a.waves.length,
    walls: a.walls.filter((w) => w.enabled).length,
    enemies: a.alive.filter((e) => e.alive).map((e) => {
      const gy = g.col.groundAt(e.x, e.z, e.y + 1, 0.3).y;
      return { id: e.def.id, st: e.state, x: +e.x.toFixed(1), y: +e.y.toFixed(1), z: +e.z.toFixed(1), above: +(e.y - gy).toFixed(2), warded: g.isWarded(e) };
    }),
  };
}, id);

export default async function (h) {
  await boot(h);
  await h.eval(() => { window.wyrm.player.invuln = true; });
  const centers = { bank: [2, 60], roost: [1, 194], totem: [26, 218] };
  for (const [id, [x, z]] of Object.entries(centers)) {
    await place(h, x + 0.5, z - 0.5, 0);
    await step(h, 0.5);
    await skip(h);
    let a = await arenaInfo(h, id);
    h.check(`${id}: arena starts`, a.state === 'active' && a.walls > 0, JSON.stringify({ state: a.state, walls: a.walls }));
    let waveOk = true;
    for (let w = 0; w < a.waves; w++) {
      await step(h, 1.4);
      await skip(h);
      a = await arenaInfo(h, id);
      const grounded = a.enemies.every((e) => (e.id === 'wisp' || e.id === 'stormWisp' ? e.above > 1 && e.above < 6 : Math.abs(e.above) < 0.4));
      console.log(`${id} wave ${a.wave + 1}/${a.waves}: ${JSON.stringify(a.enemies)}`);
      if (!grounded || a.enemies.length === 0) waveOk = false;
      if (w === 0) await shot(h, `arena-${id}`);
      if (id === 'totem' && w === 0) {
        // Warded foes take a third of the damage until the totem falls.
        const r = await h.eval(() => {
          const g = window.wyrm;
          const totem = g.enemies.find((e) => e.alive && e.def.id === 'totem');
          const grunt = g.enemies.filter((e) => e.alive && e.def.id === 'grunt').sort((a, b) => Math.hypot(a.x - totem.x, a.z - totem.z) - Math.hypot(b.x - totem.x, b.z - totem.z))[0];
          if (!grunt || !totem) return null;
          const warded = g.isWarded(grunt);
          const hp0 = grunt.hp;
          grunt.takeHit({ damage: 20, type: 'physical', dirX: 0, dirZ: 1, knockback: 0, launch: 0, stagger: 0, hitstop: 0, buildup: 0, heavy: false, spike: false, source: 'melee', move: 'test', fromPlayer: true, ox: grunt.x, oz: grunt.z - 1 });
          const d1 = hp0 - grunt.hp;
          totem.die(null);
          const hp1 = grunt.hp;
          grunt.takeHit({ damage: 20, type: 'physical', dirX: 0, dirZ: 1, knockback: 0, launch: 0, stagger: 0, hitstop: 0, buildup: 0, heavy: false, spike: false, source: 'melee', move: 'test2', fromPlayer: true, ox: grunt.x, oz: grunt.z - 1 });
          return { warded, d1, d2: hp1 - grunt.hp, after: g.isWarded(grunt) };
        });
        h.check('totem wards its allies', !!r && r.warded && r.d1 < r.d2 && !r.after, JSON.stringify(r));
      }
      // Finish the wave.
      await h.eval((id) => {
        const g = window.wyrm;
        const ar = g.level.arenas.find((x) => x.id === id);
        for (const e of ar.alive) if (e.alive) e.die(null);
      }, id);
    }
    await step(h, 1.6);
    a = await arenaInfo(h, id);
    h.check(`${id}: waves spawn on solid ground`, waveOk);
    h.check(`${id}: arena clears and drops its barrier`, a.state === 'cleared' && a.walls === 0, JSON.stringify({ state: a.state, walls: a.walls }));
  }

  // Roaming enemies stay where they belong (none fell or drowned at rest).
  await place(h, -4, -6, 0);
  await step(h, 40);
  const roam = await h.eval(() => window.wyrm.enemies.filter((e) => !e.alive || e.state === 'dead').length);
  const all = await h.eval(() => window.wyrm.enemies.filter((e) => e.alive).map((e) => `${e.def.id}@${e.x.toFixed(0)},${e.y.toFixed(0)},${e.z.toFixed(0)}`));
  console.log('roaming', all.join(' '));
  h.check('roaming enemies alive at rest', roam === 0 && all.length === 7, `${all.length} alive`);
}
