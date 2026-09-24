// Audits Eclipse Keep's placements: props, enemies and collectibles must sit
// on real ground, and nothing may start inside the void.
export default async function (h) {
  await h.go('?level=keep&seed=1&quality=low&maxdt=0.25', 3000);
  await h.skipDialogue();
  await h.wait(1500);
  const r = await h.eval(() => {
    const g = window.wyrm;
    const out = [];
    const bad = [];
    for (const p of g.level.props) {
      const name = p.constructor.name;
      if (!('x' in p) || !('z' in p) || !('y' in p)) continue;
      if (['Ambient', 'Flames', 'Janitor', 'Trigger', 'Barrier', 'Arena', 'Updraft'].includes(name)) continue;
      const gy = g.col.groundAt(p.x, p.z, p.y + 0.6, 0.3).y;
      const floating = !(gy > -1e3) || Math.abs(gy - p.y) > 0.6;
      const row = `${name} (${p.x.toFixed(1)}, ${p.y.toFixed(2)}, ${p.z.toFixed(1)}) ground=${gy > -1e3 ? gy.toFixed(2) : 'void'}`;
      out.push(row);
      if (floating && name !== 'Collectible' && name !== 'PressurePlate') bad.push(row);
      if (name === 'Collectible' && !(gy > -1e3)) bad.push(row);
    }
    for (const e of g.enemies) {
      const gy = g.col.groundAt(e.x, e.z, e.y + 1, 0.3).y;
      const row = `enemy ${e.def.id} (${e.x.toFixed(1)}, ${e.y.toFixed(2)}, ${e.z.toFixed(1)}) alive=${e.alive} ground=${gy > -1e3 ? gy.toFixed(2) : 'void'}`;
      out.push(row);
      if (!e.alive || !(gy > -1e3)) bad.push(row);
    }
    const ws = [...g.level.wardstones.values()].map((w) => `wardstone ${w.id} (${w.x.toFixed(1)}, ${w.y.toFixed(2)}, ${w.z.toFixed(1)})`);
    return { out, bad, ws };
  });
  console.log(r.out.join('\n'));
  console.log(r.ws.join('\n'));
  h.check('every prop and enemy sits on real ground', r.bad.length === 0, '\n  ' + r.bad.join('\n  '));
}
