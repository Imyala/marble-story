export default async function (h) {
  await h.go('?level=fen&seed=7&quality=low', 3000);
  const r = await h.eval(async () => {
    const g = window.wyrm;
    const t0 = g.realTime; const p0 = performance.now();
    await new Promise((res) => setTimeout(res, 3000));
    return { gameSec: g.realTime - t0, realSec: (performance.now() - p0) / 1000 };
  });
  console.log(JSON.stringify(r));
}
