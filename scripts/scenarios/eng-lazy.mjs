/**
 * Realms load on demand (src/levels/index.ts): the title fetches only the
 * Fen; ?level= boots every realm; a portal, the Wardgate and Continue each
 * wait (on black, with a "Loading..." veil) for a realm whose code has not
 * arrived yet; a realm that will not load says so, offers Try again, Stay
 * here and Reload, and never leaves the game stuck mid-fade.
 *   node scripts/play.mjs eng-lazy          (all of it)
 *   node scripts/play.mjs eng-lazy:fail     (one part: title, levels, portal, wardgate, resume, fail)
 */
import { act2Save } from './hollow-lib.mjs';

const Q = '&seed=3&quality=low&maxdt=0.1';
/** Realm files fetched so far: modules under src/levels on the dev server, chunks named after them in a build. */
const realmFiles = (h) => h.eval(() => [...new Set(performance.getEntriesByType('resource').map((e) => e.name.match(/\/src\/levels\/(\w+)\.ts|\/assets\/(\w+)-[\w-]+\.js/)).filter(Boolean).map((m) => m[1] ?? m[2]))]);
/** A realm's code on the dev server (src/levels/<id>.ts) or in a build (assets/<id>-<hash>.js). */
const realmUrl = (id) => `**/{src/levels/${id}.ts*,assets/${id}-*.js}`;
const loaded = (h, id) => h.eval((id) => window.wyrmDebug.levels.loaded(id), id);
const status = (h) => h.eval(() => {
  const g = window.wyrm;
  return { level: g.level?.def.id ?? null, state: g.state, veil: document.querySelector('.load-veil')?.className ?? '', veilText: document.querySelector('.load-veil')?.textContent?.trim() ?? '', fade: Number(document.querySelector('.fade')?.style.opacity || 0) };
});
/**
 * Holds back a realm's module (the chunk is slow to arrive, however long the
 * page has been idle) until the returned function lets it through.
 */
async function slow(h, id) {
  let open;
  const gate = new Promise((res) => { open = res; });
  await h.page.route(realmUrl(id), async (r) => { await gate; await r.continue().catch(() => {}); });
  return async () => {
    open();
    await h.page.unroute(realmUrl(id));
  };
}
/** Clicks a button on the loading veil by its words. */
const veilButton = (h, text) => h.eval((t) => { const b = [...document.querySelectorAll('.load-veil button')].find((e) => e.textContent === t); b?.click(); return !!b; }, text);
/** Waits (game time) until `test(status)` holds, up to `secs`. */
async function until(h, test, secs = 12) {
  for (let t = 0; t < secs; t += 0.25) {
    const s = await status(h);
    if (test(s)) return s;
    await h.wait(250);
  }
  return status(h);
}
/** Seeds the save before every page load from here on. */
const useSave = (h, save) => h.page.addInitScript((s) => {
  localStorage.clear();
  localStorage.setItem('wyrmling.save.v1', JSON.stringify(s));
}, save);

/** Boot to the title: only the Fen (behind the title) is fetched, even after the page goes idle. */
export async function title(h) {
  await h.page.addInitScript(() => localStorage.clear());
  await h.go(`?${Q.slice(1)}`, 3000);
  const t = await h.page.locator('.title-screen h1').textContent();
  await h.wait(2500);
  const files = await realmFiles(h);
  const others = await h.eval(() => window.wyrmDebug.levels.ids.filter((id) => id !== 'fen' && window.wyrmDebug.levels.loaded(id)));
  h.check('boots to the title over the Fen', t === 'WYRMLING' && (await status(h)).level === 'fen', t);
  const realms = await h.eval(() => window.wyrmDebug.levels.ids);
  h.check('only the Fen\'s realm code is fetched for the title', JSON.stringify(files.filter((f) => realms.includes(f))) === '["fen"]' && others.length === 0, JSON.stringify({ files, others }));
  await h.shot('eng-lazy-title');
}

/** ?level= boots every realm (and an unknown id lands somewhere safe). */
export async function levels(h) {
  const ids = await (async () => {
    await h.go(`?level=fen${Q}`, 2000);
    return h.eval(() => window.wyrmDebug.levels.ids);
  })();
  for (const id of ids) {
    await h.go(`?level=${id}${Q}`, 1500);
    const s = await until(h, (s) => s.level === id && (s.state === 'play' || s.state === 'dialogue'));
    h.check(`?level=${id} loads the realm`, s.level === id && (s.state === 'play' || s.state === 'dialogue'), JSON.stringify(s));
  }
  await h.go(`?level=nowhere${Q}`, 1500);
  const s = await until(h, (s) => s.level !== null && s.state === 'play');
  h.check('an unknown realm id lands somewhere safe', s.level === 'fen' || s.level === 'sanctum', JSON.stringify(s));
}

/** A portal into a realm whose code is still on its way: black, "Loading...", then in. */
export async function portal(h) {
  const save = act2Save();
  await useSave(h, save);
  const letThrough = await slow(h, 'sanctum');
  // The Fen, finished: its portal home to the Sanctum stands by Bogmaw's arena.
  await h.go(`?level=fen${Q}`, 1500);
  await until(h, (s) => s.level === 'fen');
  await h.skipDialogue(4000);
  const before = await loaded(h, 'sanctum');
  const went = await h.eval(() => {
    const g = window.wyrm;
    const p = g.level.interactables.find((i) => i.target === 'sanctum');
    if (!p) return false;
    g.player.place(p.x, g.col.groundAt(p.x, p.z + 2.5, 1e4, 0.2).y + 0.05, p.z + 2.5, Math.PI);
    p.interact();
    return true;
  });
  const held = await until(h, (s) => s.state === 'transition' && /Loading Warden Sanctum/.test(s.veilText), 6);
  await h.shot('eng-lazy-loading');
  h.check('the Sanctum\'s code had not arrived when Aster stepped through', went && !before, JSON.stringify({ went, before }));
  h.check('the portal holds on black with a "Loading Warden Sanctum..." veil', held.state === 'transition' && held.fade > 0.95 && /Loading Warden Sanctum/.test(held.veilText), JSON.stringify(held));
  await h.wait(1500);
  const still = await status(h);
  h.check('and keeps holding while the code is on its way', still.state === 'transition' && still.level === 'fen', JSON.stringify(still));
  await letThrough();
  const s = await until(h, (s) => s.level === 'sanctum' && s.state !== 'transition', 20);
  h.check('then it arrives, is built, and the fade lands in the Sanctum', s.level === 'sanctum' && s.state !== 'transition' && s.fade < 0.05 && !/on/.test(s.veil), JSON.stringify(s));
}

/** The Wardgate to a realm not fetched yet. */
export async function wardgate(h) {
  await useSave(h, act2Save());
  const letThrough = await slow(h, 'keep');
  await h.go(`?level=sanctum${Q}`, 1500);
  await until(h, (s) => s.level === 'sanctum');
  await h.skipDialogue(6000);
  const before = await loaded(h, 'keep');
  await h.eval(() => window.wyrm.menus.showTravel());
  await h.page.locator('.levels button', { hasText: 'Eclipse Keep' }).click();
  const held = await until(h, (s) => s.state === 'transition' && /Loading Eclipse Keep/.test(s.veilText), 6);
  const savedWhileLoading = await h.eval(() => window.wyrm.save.level);
  await letThrough();
  const s = await until(h, (s) => s.level === 'keep' && s.state !== 'transition', 20);
  h.check('the Wardgate waits for Eclipse Keep\'s code, then goes', !before && held.state === 'transition' && held.level === 'sanctum' && s.level === 'keep' && s.fade < 0.05, JSON.stringify({ before, held, s }));
  const saved = await h.eval(() => window.wyrm.save.level);
  h.check('and the save moves on only once it has arrived', savedWhileLoading === 'sanctum' && saved === 'keep', JSON.stringify({ savedWhileLoading, saved }));
}

/** Continue from the title into a realm not fetched yet (another slot's journey). */
export async function resume(h) {
  const save = act2Save();
  save.level = 'frostworks';
  await useSave(h, save);
  const letThrough = await slow(h, 'frostworks');
  await h.go(`?${Q.slice(1)}`, 2500);
  await h.page.locator('.menu-list button', { hasText: 'Continue' }).click();
  const held = await until(h, (s) => s.state === 'transition' && /Loading The Frostworks/.test(s.veilText), 6);
  await letThrough();
  const s = await until(h, (s) => s.level === 'frostworks' && s.state !== 'transition', 20);
  h.check('Continue waits for the Frostworks\' code, then plays', held.state === 'transition' && held.level === 'fen' && s.level === 'frostworks' && (s.state === 'play' || s.state === 'dialogue'), JSON.stringify({ held, s }));
}

/** A realm that will not load: a clear message, Try again, Stay here, Reload; never stuck on black. */
export async function fail(h) {
  await useSave(h, act2Save());
  // The module arrives broken, as from a stale deploy (a module that throws rejects its import like a failed fetch).
  await h.page.route(realmUrl('plains'), (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: 'throw new Error("this build\'s Stonewild Plains is gone")' }));
  await h.go(`?level=sanctum${Q}`, 1500);
  await until(h, (s) => s.level === 'sanctum');
  await h.skipDialogue(6000);
  await h.eval(() => window.wyrm.menus.showTravel());
  await h.page.locator('.levels button', { hasText: 'Stonewild Plains' }).click();
  const failed = await until(h, (s) => /failed/.test(s.veil), 8);
  const buttons = await h.eval(() => [...document.querySelectorAll('.load-veil button')].map((b) => b.textContent));
  await h.shot('eng-lazy-failed');
  h.check('a realm that will not load says so plainly', /failed/.test(failed.veil) && /Stonewild Plains could not be loaded/.test(failed.veilText) && failed.state === 'transition', JSON.stringify(failed));
  h.check('offering Try again, Stay here and Reload', JSON.stringify(buttons) === '["Try again","Stay here","Reload the page"]', JSON.stringify(buttons));
  // Try again: the browser remembers the broken module, so it fails again, and says a reload is the cure.
  await veilButton(h, 'Try again');
  const again = await until(h, (s) => /Still shut/.test(s.veilText), 6);
  h.check('trying again fails again, and points at reloading', /Still shut/.test(again.veilText), JSON.stringify(again));
  // Stay here: back in the Sanctum, playing, nothing stuck on black.
  await veilButton(h, 'Stay here');
  const back = await until(h, (s) => s.state === 'play' && s.fade < 0.05, 6);
  h.check('Stay here fades back into the Sanctum, playing', back.level === 'sanctum' && back.state === 'play' && back.fade < 0.05 && !/on/.test(back.veil), JSON.stringify(back));
  const lvl = await h.eval(() => window.wyrm.save.level);
  h.check('the save still says the Sanctum', lvl === 'sanctum', lvl);
  // The keyboard works the veil too: Esc stays.
  await h.eval(() => window.wyrm.travel('plains'));
  await until(h, (s) => /failed/.test(s.veil), 8);
  await h.page.keyboard.press('Escape');
  const esc = await until(h, (s) => s.state === 'play' && s.fade < 0.05, 6);
  h.check('Esc on the veil stays too', esc.level === 'sanctum' && esc.state === 'play', JSON.stringify(esc));
  // A reload (the deploy fixed) and it loads.
  await h.page.unroute(realmUrl('plains'));
  await h.go(`?level=sanctum${Q}`, 1500);
  await until(h, (s) => s.level === 'sanctum');
  await h.skipDialogue(6000);
  await h.eval(() => window.wyrm.travel('plains'));
  const ok = await until(h, (s) => s.level === 'plains' && s.state !== 'transition', 20);
  h.check('after a reload the realm loads', ok.level === 'plains', JSON.stringify(ok));
}

export default async function (h) {
  await title(h);
  await levels(h);
  await portal(h);
  await wardgate(h);
  await resume(h);
  await fail(h);
}
