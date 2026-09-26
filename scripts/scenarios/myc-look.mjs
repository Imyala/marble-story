/**
 * The Mycelium Deep: loads cleanly, holds what it should, and screenshots every area.
 *   node scripts/play.mjs myc-look            (load checks, then every view)
 *   node scripts/play.mjs myc-look:start      (load checks only, with the arrival conversation)
 *   node scripts/play.mjs myc-look:views      (views only)
 */
import { boot, place, step, shot, skip, vista, useSave, mycSave, noPartner } from './myc-lib.mjs';

/** Stands Aster at (x, z) facing yaw, the camera behind at `pitch`, and takes a clean shot; returns draw calls. */
async function view(h, name, x, z, yaw, pitch = 0.3, y) {
  await place(h, x, z, yaw, y, pitch);
  await step(h, 0.8);
  // A story beat on arrival: past it, and back where we were.
  if ((await h.eval(() => window.wyrm.state)) !== 'play') {
    await skip(h);
    await place(h, x, z, yaw, y, pitch);
    await step(h, 0.5);
  }
  const calls = await h.eval(() => { window.__draw(); return window.wyrm.renderer.gl.info.render.calls; });
  await shot(h, `myc-${name}`, false);
  return calls;
}

export async function start(h) {
  await useSave(h, mycSave({ intro: true }));
  await h.go('?level=mycelium&seed=4&quality=low&maxdt=0.1', 3500);
  const s = await h.state();
  h.check('the Mycelium Deep loads', s.level === 'mycelium', JSON.stringify(s));
  const st = await h.eval(() => window.wyrm.state);
  h.check('the arrival conversation plays', st === 'dialogue', st);
  await h.skipDialogue(8000);
  await h.wait(300);
  const info = await h.eval(() => {
    const g = window.wyrm;
    const sec = {};
    for (const q of g.level.secrets) sec[q.kind] = (sec[q.kind] ?? 0) + 1;
    const chests = g.level.props.filter((p) => p.constructor.name === 'Chest');
    const count = (n) => g.level.props.filter((p) => p.constructor.name === n).length;
    return {
      state: g.state, sec, chests: chests.length, iron: chests.filter((c) => c.iron).length, arenas: g.level.arenas.map((a) => a.id),
      breakables: g.level.hittables.filter((x) => x.constructor.name === 'Breakable').length, wards: [...g.level.wardstones.keys()],
      critters: count('Critter'), caps: count('BounceCap'), lifts: count('LiftCap'), vents: count('SporeVent'), threads: count('Glowthread'),
      clouds: count('BlightCloud'), foragers: count('Forager'), shrines: count('PowerShrine'), rings: count('GlideCourse'),
      gems: g.gems.reduce((n, x) => n + x.value, 0), music: g.level.def.music, sky: g.level.def.sky.fog,
    };
  });
  console.log(JSON.stringify(info));
  h.check('in play after the arrival', info.state === 'play', info.state);
  h.check('five eggs (one with a thief), four letters, two relics, a heart shard', info.sec.egg === 5 && info.sec.letter === 4 && info.sec.relic === 2 && info.sec.heart === 1, JSON.stringify(info.sec));
  h.check('three chests, one iron-bound', info.chests === 3 && info.iron === 1, `${info.chests}/${info.iron}`);
  h.check('six fights (four on the way, two off it)', info.arenas.length === 6, info.arenas.join(','));
  h.check('four Wardstones, critters, plenty to smash', info.wards.length === 4 && info.critters >= 4 && info.breakables >= 30, JSON.stringify(info));
  h.check('every kind of spore puzzle', info.caps >= 4 && info.lifts >= 1 && info.vents >= 4 && info.threads >= 4 && info.clouds >= 5, JSON.stringify(info));
  h.check('four foragers in the Market, a shrine, the glide rings', info.foragers === 4 && info.shrines === 1 && info.rings === 1, JSON.stringify(info));
}

export async function views(h) {
  await boot(h);
  await noPartner(h);
  const calls = {};
  calls.spawn = await view(h, 'spawn', 0, -3, 0, 0.22);
  calls.sporefall = await view(h, 'sporefall', 2, 6, 0.15, 0.18);
  calls.mother = await view(h, 'motherstalk', -2, 14, -0.8, 0.12);
  calls.pools = await view(h, 'pools', 36, 18, 1.0, 0.25);
  calls.chasm = await view(h, 'capstair', 0, 52, 0, 0.05);
  calls.caps = await view(h, 'capstair-caps', 2, 76, -0.35, -0.05);
  calls.top = await view(h, 'capstair-top', 3, 101, Math.PI, 0.35);
  calls.gate = await view(h, 'garden-gate', 4, 99.5, 0, 0.25);
  calls.garden = await view(h, 'garden', 0, 109, 0, 0.2);
  calls.terrace = await view(h, 'terrace', -2, 140, Math.PI / 2, 0.25);
  calls.bridge = await view(h, 'bridge', 10, 140, Math.PI / 2, 0.2);
  calls.west = await view(h, 'west-wing', -22, 116, -Math.PI / 2, 0.15);
  calls.east = await view(h, 'east-wing', 20, 112, Math.PI / 2, 0.2);
  calls.descent = await view(h, 'descent', 50, 146, 0.6, 0.3);
  calls.market = await view(h, 'market', 58, 161, 0, 0.25);
  calls.thornpit = await view(h, 'thornpit', 78, 172, Math.PI / 2, 0.2);
  calls.blightrow = await view(h, 'blightrow', 62, 164, Math.PI * 0.75, 0.25);
  calls.rootchoke = await view(h, 'rootchoke', 40, 184, -Math.PI * 0.6, 0.2);
  calls.hollow = await view(h, 'strangled', 24, 175, Math.PI, 0.3);
  await vista(h, 'vista-sporefall', [18, 12, -6], [-6, 6, 26]);
  await vista(h, 'vista-capstair', [0, 22, 48], [0, 12, 90]);
  await vista(h, 'vista-threadworks', [0, 34, 98], [0, 24, 130]);
  await vista(h, 'vista-market', [47, 28, 163], [62, 16, 180]);
  await vista(h, 'vista-grove', [0, 20, 196], [0, 10, 240]);
  calls.mouth = await view(h, 'grove-mouth', 12, 194, -0.9, 0.2);
  calls.grove = await view(h, 'grove', 5, 198.5, -0.25, 0.12);
  console.log('draw calls', JSON.stringify(calls));
  const max = Math.max(...Object.values(calls));
  // The budget of the Act II caves: the Hollow Gate's busiest view draws about 326.
  h.check('draw calls stay in budget (< 340 at every view)', max < 340, `${max}`);
}

export default async function (h) {
  await start(h);
  await views(h);
}
