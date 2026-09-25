export default async function (h) {
  const lvl = process.env.LVL ?? 'fen';
  await h.go(`?level=${lvl}&seed=5&quality=low&maxdt=0.1`, 2500);
  const r = await h.eval(([x0, x1, z0, z1, step]) => {
    const g = window.wyrm;
    const rows = [];
    for (let z = z1; z >= z0; z -= step) {
      let row = String(z).padStart(5) + ' ';
      for (let x = x0; x <= x1; x += step) {
        const gy = g.col.groundAt(x, z, 1e4, 0.1).y;
        const deep = g.isDeepWater(x, z, gy);
        row += gy < -1e3 ? ' ' : deep ? '~' : gy >= 9.5 ? String.fromCharCode(97 + Math.min(25, Math.floor((gy - 9.5) / 2))) : String(Math.max(0, Math.round(gy)));
      }
      rows.push(row);
    }
    return rows.join('\n') + `\nspawn ${JSON.stringify(g.level.def.spawn)} water ${g.waterLevel}`;
  }, JSON.parse(process.env.BOX ?? '[-60,60,-40,240,4]'));
  console.log(r);
}
