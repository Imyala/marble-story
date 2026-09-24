// Progress through Eclipse Keep survives a reload: cleared arenas keep their
// gates open, the great door stays open, and the Wardstone is the start point.
export default async function (h) {
  await h.go('?level=keep&seed=1&quality=low&maxdt=0.25', 3000);
  await h.skipDialogue();
  await h.eval(() => {
    const g = window.wyrm;
    for (const k of ['arena:keep:gatehouse', 'arena:keep:hall', 'story:keep:seal-storm', 'story:keep:seal-flame', 'story:keep:seal-stone', 'story:keep:seal-frost', 'story:keep:door']) g.save.found[k] = true;
    g.save.level = 'keep';
    g.save.checkpoint = 'door';
    g.saveNow();
  });
  await h.go('?level=keep&seed=1&quality=low&maxdt=0.25&cp=door', 3000);
  await h.skipDialogue();
  for (let i = 0; i < 20; i++) {
    const t = await h.eval(() => window.wyrm.realTime);
    if (t > 4) break;
    await h.wait(500);
  }
  const r = await h.eval(() => {
    const g = window.wyrm;
    const gate = (sig) => { const q = g.level.props.find((p) => p.constructor.name === 'Gate' && p.signal === sig); return `${q.alive} op=${q.opening} y=${q.root.position.y.toFixed(2)} idx=${g.level.props.indexOf(q)}`; };
    return {
      fired: [...g.level.fired],
      bastion: gate('bastion-open'), door: gate('keep-door'), hall: gate('hall-open'),
      at: [Math.round(g.player.x), Math.round(g.player.z)], intro: g.state, t: g.realTime.toFixed(1),
    };
  });
  h.check('reload keeps the gatehouse, great door and hall gates open', r.bastion.startsWith('false') && r.door.startsWith('false') && r.hall.startsWith('false'), JSON.stringify(r));
  h.check('continuing starts at the Wardstone', Math.abs(r.at[1] + 136.5) < 1.5, JSON.stringify(r.at));
}
