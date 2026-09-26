/**
 * The world map: opens and closes in every realm without errors, renders its
 * aerial view inside a time budget, and puts Aster's marker where she stands.
 */
import { writeFileSync } from 'node:fs';

const REALMS = ['fen', 'sanctum', 'falls', 'frostworks', 'plains', 'keep'];

/** Saves the realm's tinted aerial image (with a labelled 20 m grid when `grid`). */
async function dumpAerial(h, name, grid = false) {
  const url = await h.eval((grid) => {
    const g = window.wyrm;
    const img = g.map.image;
    if (!img) return null;
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    if (grid) {
      const t = g.level.def.terrain;
      x.font = '10px sans-serif';
      for (let wx = Math.ceil(t.x0 / 20) * 20; wx <= t.x0 + t.sizeX; wx += 20) {
        for (let wz = Math.ceil(t.z0 / 20) * 20; wz <= t.z0 + t.sizeZ; wz += 20) {
          const [ix, iy] = g.map.imagePoint(wx, wz);
          x.fillStyle = 'rgba(200,0,0,.9)';
          x.fillRect(ix - 1, iy - 1, 3, 3);
          if (wx % 40 === 0 && wz % 40 === 0) { x.fillStyle = 'rgba(160,0,0,.95)'; x.fillText(`${wx},${wz}`, ix + 3, iy - 3); }
        }
      }
      // Existing props for reference: wardstones, arenas, goals.
      const dot = (wx, wz, col, r = 4) => { const [ix, iy] = g.map.imagePoint(wx, wz); x.fillStyle = col; x.beginPath(); x.arc(ix, iy, r, 0, 7); x.fill(); };
      for (const w of g.level.wardstones.values()) dot(w.x, w.z, '#6020ff', 5);
      for (const a of g.level.arenas) { const [ix, iy] = g.map.imagePoint(a.x, a.z); const [ex] = g.map.imagePoint(a.x + a.r, a.z); x.strokeStyle = '#f00'; x.beginPath(); x.arc(ix, iy, Math.abs(ex - ix), 0, 7); x.stroke(); }
      dot(g.level.def.spawn[0], g.level.def.spawn[1], '#00a000', 6);
    }
    return c.toDataURL('image/png');
  }, grid);
  if (url) writeFileSync(`scripts/out/${name}.png`, Buffer.from(url.split(',')[1], 'base64'));
  return !!url;
}

export default async function (h) {
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=fen&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  for (const lvl of REALMS) {
    if (lvl !== 'fen') {
      await h.eval((l) => window.wyrm.loadLevel(l, {}), lvl);
      await h.skipDialogue(6000);
      await h.wait(300);
    }
    // Stand somewhere recognisable: by the first Wardstone, facing along +x.
    await h.eval(() => {
      const g = window.wyrm;
      const w = [...g.level.wardstones.values()][0];
      if (w) g.player.place(w.x + 3, w.y + 0.1, w.z, Math.PI / 2);
      g.player.yaw = Math.PI / 2;
    });
    await h.wait(300);
    // How long one ordinary frame of this realm takes here, to judge the render against.
    const frame = await h.eval(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 < 1500) requestAnimationFrame(tick); else res((performance.now() - t0) / n); }; requestAnimationFrame(tick); }));
    const t0 = Date.now();
    await h.eval(() => window.wyrm.map.open());
    const wall = Date.now() - t0;
    await h.wait(400);
    const r = await h.eval(() => {
      const g = window.wyrm;
      const m = g.map;
      const d = m.debug();
      const aster = d.marks.find((k) => k.kind === 'aster');
      const [px, py] = m.imagePoint(g.player.x, g.player.z);
      return { state: g.state, active: m.active, ms: Math.round(d.ms), parts: Object.fromEntries(Object.entries(m.lastTimes).map(([k, v]) => [k, Math.round(v)])), w: d.w, h: d.h, marks: d.marks.length, kinds: [...new Set(d.marks.map((k) => k.kind))], aster: aster && [Math.round(aster.ix), Math.round(aster.iy)], player: [Math.round(px), Math.round(py)], dom: !!document.querySelector('.map-screen canvas') };
    });
    h.check(`${lvl}: the map opens with its aerial view and markers`, r.active && r.state === 'pause' && r.dom && r.w > 100 && r.h > 100 && r.kinds.includes('aster') && r.kinds.includes('ward'), JSON.stringify(r));
    // One render per realm visit, the whole realm at once: a few ms on a GPU, but
    // seconds in headless software GL on a busy machine. So the budget is counted
    // in the realm's own frames (it draws everything, and reads the picture back).
    h.check(`${lvl}: the aerial render stays inside its budget`, r.ms < Math.max(1500, frame * 10), `${r.ms} ms in-page (${JSON.stringify(r.parts)}), ${wall} ms wall, a frame here takes ${Math.round(frame)} ms`);
    await h.shot(`quests-map-${lvl}`);
    await dumpAerial(h, `quests-aerial-${lvl}`, !!process.env.GRID);
    await h.page.keyboard.press('KeyM');
    await h.wait(400);
    const c = await h.eval(() => ({ active: window.wyrm.map.active, state: window.wyrm.state, dom: !!document.querySelector('.map-screen') }));
    h.check(`${lvl}: M closes the map back into play`, !c.active && c.state === 'play' && !c.dom, JSON.stringify(c));
    const again = await h.eval(() => { const g = window.wyrm; const n = g.map.lastRenderMs; const t = performance.now(); g.map.open(); const ms = performance.now() - t; g.map.close(); return { ms: Math.round(ms), cached: g.map.lastRenderMs === n }; });
    h.check(`${lvl}: opening it again uses the cached picture`, again.cached && again.ms < 400, JSON.stringify(again));
  }
}

/**
 * The picture lines up with the world: a white slab and a black one laid in
 * the realm show up where the map says they are (the Keep's map is turned
 * round, so it is checked too). Then a click on an awakened Wardstone's
 * marker flies Aster there, and a tracked quest's target is marked.
 */
export async function align(h) {
  await h.page.addInitScript(() => localStorage.clear());
  for (const [lvl, a, b] of [['fen', [0, 0], [0, 122]], ['keep', [0, -58], [0, -153]]]) {
    await h.go(`?level=${lvl}&seed=5&quality=low&maxdt=0.1`, 2500);
    await h.skipDialogue(6000);
    const r = await h.eval(async ([a, b]) => {
      const g = window.wyrm;
      const { glow } = await import('/src/render/materials.ts');
      const { box } = await import('/src/render/shapes.ts');
      const put = ([x, z], c) => { const m = box(7, 0.4, 7, glow(c)); m.position.set(x, g.col.groundAt(x, z, 1e4, 0.2).y + 3, z); g.level.root.add(m); return m; };
      const ma = put(a, 0xffffff);
      const mb = put(b, 0x000000);
      g.map.cache = null;
      g.map.open();
      const img = g.map.image;
      const px = (x, z) => { const [ix, iy] = g.map.imagePoint(x, z); const d = img.getContext('2d').getImageData(Math.round(ix) - 2, Math.round(iy) - 2, 5, 5).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return s / (d.length / 4) / 3; };
      const out = { white: Math.round(px(...a)), black: Math.round(px(...b)) };
      g.map.close();
      g.level.root.remove(ma, mb);
      g.map.cache = null;
      return out;
    }, [a, b]);
    h.check(`${lvl}: slabs laid in the world show where the map puts them`, r.white > 150 && r.white - r.black > 110, JSON.stringify(r));
  }
  // Aster's marker, a flight from the map, and the quest mark.
  await h.go('?level=fen&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  const wards = await h.eval(() => [...window.wyrm.level.wardstones.keys()]);
  for (const id of wards.slice(0, 2)) {
    await h.eval((id) => { const g = window.wyrm; const w = g.level.wardstones.get(id); g.player.place(w.x + 1.5, w.y + 0.1, w.z, 0); }, id);
    await h.wait(1000);
  }
  await h.eval(() => { const g = window.wyrm; g.quests.start('fen-lanterns'); g.player.place(3, g.col.groundAt(3, 30, 1e4, 0.2).y + 0.05, 30, 0.7); });
  await h.wait(500);
  await h.eval(() => window.wyrm.map.open());
  await h.wait(500);
  const m = await h.eval((id) => {
    const g = window.wyrm;
    const d = g.map.debug();
    const aster = d.marks.find((k) => k.kind === 'aster');
    const [px, py] = g.map.imagePoint(g.player.x, g.player.z);
    const w = g.level.wardstones.get(id);
    const [sx, sy] = g.map.screenPoint(w.x, w.z);
    const r = document.querySelector('.map-view').getBoundingClientRect();
    return { aster: [aster.ix - px, aster.iy - py], quests: d.marks.filter((k) => k.kind === 'quest').map((k) => k.label), click: [r.left + sx, r.top + sy] };
  }, wards[0]);
  h.check('Aster\'s marker sits on her position', Math.abs(m.aster[0]) < 0.5 && Math.abs(m.aster[1]) < 0.5, JSON.stringify(m.aster));
  h.check('the tracked quest\'s targets are marked', m.quests.filter((q) => /lantern-flame/.test(q)).length === 2, JSON.stringify(m.quests));
  await h.page.mouse.click(m.click[0], m.click[1]);
  await h.wait(300);
  const pop = await h.eval(() => ({ text: document.querySelector('.map-pop')?.textContent ?? '', shown: document.querySelector('.map-pop')?.style.display !== 'none' }));
  h.check('clicking an awakened Wardstone offers a flight', pop.shown && /Fly here/.test(pop.text), JSON.stringify(pop));
  await h.shot('quests-map-flight');
  await h.eval(() => [...document.querySelectorAll('.map-pop button')].find((b) => /Fly here/.test(b.textContent))?.click());
  await h.wait(1800);
  const f = await h.eval((id) => { const g = window.wyrm; const w = g.level.wardstones.get(id); return { state: g.state, map: g.map.active, d: Math.hypot(g.player.x - w.x, g.player.z - w.z) }; }, wards[0]);
  h.check('the flight lands Aster by that Wardstone and play goes on', f.state === 'play' && !f.map && f.d < 4, JSON.stringify(f));
  // From the pause menu: the Map button, and closing goes back to the pause menu.
  await h.eval(() => window.wyrm.pause());
  await h.wait(300);
  await h.eval(() => [...document.querySelectorAll('.menu button')].find((b) => /^Map$/i.test(b.textContent.trim()))?.click());
  await h.wait(500);
  const p1 = await h.eval(() => ({ map: window.wyrm.map.active, state: window.wyrm.state }));
  await h.page.keyboard.press('Escape');
  await h.wait(500);
  const p2 = await h.eval(() => ({ map: window.wyrm.map.active, state: window.wyrm.state, pause: !!document.querySelector('.pause-menu') }));
  h.check('the pause menu opens the map, and Esc goes back to the pause menu', p1.map && p1.state === 'pause' && !p2.map && p2.pause, JSON.stringify({ p1, p2 }));
  // Touch: two fingers pinch to zoom, a tap on a marker opens its card.
  await h.eval(() => [...document.querySelectorAll('.menu button')].find((b) => /^Map$/i.test(b.textContent.trim()))?.click());
  await h.wait(400);
  const t = await h.eval((id) => {
    const g = window.wyrm;
    const v = document.querySelector('.map-view');
    const r = v.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const ev = (type, id, x, y) => v.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, isPrimary: id === 1 }));
    const s0 = g.map.s;
    ev('pointerdown', 1, cx - 30, cy);
    ev('pointerdown', 2, cx + 30, cy);
    for (let i = 1; i <= 6; i++) { ev('pointermove', 1, cx - 30 - i * 15, cy); ev('pointermove', 2, cx + 30 + i * 15, cy); }
    ev('pointerup', 1, cx - 120, cy);
    ev('pointerup', 2, cx + 120, cy);
    const s1 = g.map.s;
    const w = g.level.wardstones.get(id);
    const [sx, sy] = g.map.screenPoint(w.x, w.z);
    ev('pointerdown', 3, r.left + sx, r.top + sy);
    ev('pointerup', 3, r.left + sx, r.top + sy);
    const pop = document.querySelector('.map-pop');
    return { s0, s1, pop: pop?.style.display !== 'none' && /Fly here/.test(pop?.textContent ?? '') };
  }, wards[1]);
  h.check('on touch, a pinch zooms the map and a tap opens a marker', t.s1 > t.s0 * 1.5 && t.pop, JSON.stringify(t));
  await h.shot('quests-map-touch');
}

/** Screenshots of the map with a quest under way, for looking at (run with W=1280 H=720). */
export async function look(h) {
  await h.page.addInitScript(() => localStorage.clear());
  for (const lvl of (process.env.REALMS ?? 'fen,keep').split(',')) {
    await h.go(`?level=${lvl}&seed=5&quality=${process.env.Q ?? 'low'}&maxdt=0.1`, 2500);
    await h.skipDialogue(6000);
    await h.eval(() => {
      const g = window.wyrm;
      const ws = [...g.level.wardstones.values()];
      for (const w of ws.slice(0, 2)) g.save.found[`ward:${g.level.def.id}:${w.id}`] = true;
      g.save.found[`${g.level.def.id}:egg-${'x'}`] = true;
      const q = g.quests.defs.find((d) => d.realm === g.level.def.id);
      if (q) g.quests.start(q.id);
    });
    await h.wait(600);
    await h.eval(() => window.wyrm.map.open());
    await h.wait(800);
    await h.shot(`quests-map-look-${lvl}`);
  }
}

/**
 * Dev aid for placing things: REGIONS="fen:-60,-5,-30,25;plains:30,-25,60,5"
 * saves a close-up of each world rectangle of the aerial map, with a 5 m grid,
 * interactables (blue), hittables (red), arenas (magenta) and foes (orange).
 */
export async function survey(h) {
  const list = (process.env.REGIONS ?? 'fen:-60,-5,-30,25').split(';').map((s) => { const [lvl, r] = s.split(':'); return { lvl, r: r.split(',').map(Number) }; });
  await h.go(`?level=${list[0].lvl}&seed=5&quality=low&maxdt=0.1`, 2500);
  await h.skipDialogue(6000);
  let i = 0;
  for (const { lvl, r } of list) {
    await h.eval((l) => { const g = window.wyrm; if (g.level.def.id !== l) return g.loadLevel(l, {}); }, lvl);
    await h.skipDialogue(4000);
    await h.eval(() => { const g = window.wyrm; g.map.open(); g.map.close(); });
    const url = await h.eval(([x0, z0, x1, z1]) => {
      const g = window.wyrm;
      const m = g.map;
      const S = 10;
      const c = document.createElement('canvas');
      c.width = (x1 - x0) * S;
      c.height = (z1 - z0) * S;
      const x = c.getContext('2d');
      const img = m.image;
      const src = img.getContext('2d').getImageData(0, 0, img.width, img.height);
      const out = x.createImageData(c.width, c.height);
      // Screen x runs along -world x when +z is up.
      const east = m.imagePoint(0, 0)[0] < m.imagePoint(1, 0)[0];
      const toC = (wx, wz) => [east ? (wx - x0) * S : (x1 - wx) * S, (z1 - wz) * S];
      for (let py = 0; py < c.height; py++) for (let px = 0; px < c.width; px++) {
        const wx = east ? x0 + px / S : x1 - px / S;
        const wz = z1 - py / S;
        const [ix, iy] = m.imagePoint(wx, wz);
        const si = (Math.floor(iy) * img.width + Math.floor(ix)) * 4;
        const di = (py * c.width + px) * 4;
        for (let k = 0; k < 4; k++) out.data[di + k] = src.data[si + k];
      }
      x.putImageData(out, 0, 0);
      x.font = '11px sans-serif';
      for (let wx = Math.ceil(x0 / 5) * 5; wx <= x1; wx += 5) for (let wz = Math.ceil(z0 / 5) * 5; wz <= z1; wz += 5) {
        const [cx, cy] = toC(wx, wz);
        x.fillStyle = 'rgba(200,0,0,.8)';
        x.fillRect(cx - 1, cy - 1, 3, 3);
        if (wx % 10 === 0 && wz % 10 === 0) { x.fillStyle = 'rgba(120,0,0,.95)'; x.fillText(`${wx},${wz}`, cx + 3, cy - 3); }
      }
      const ring = (wx, wz, col, rr) => { const [cx, cy] = toC(wx, wz); x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.stroke(); };
      for (const it of g.level.interactables) ring(it.x, it.z, '#0040ff', 6);
      for (const hh of g.level.hittables) ring(hh.x, hh.z, '#ff2020', Math.max(3, hh.radius * S));
      for (const a of g.level.arenas) ring(a.x, a.z, '#ff00ff', a.r * S);
      for (const e of g.enemies) if (e.alive) ring(e.x, e.z, '#ffa000', 5);
      return c.toDataURL('image/png');
    }, r);
    writeFileSync(`scripts/out/quests-survey-${i++}-${lvl}.png`, Buffer.from(url.split(',')[1], 'base64'));
    console.log('survey', lvl, r.join(','));
  }
}
