import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Builder } from '../world/level';
import { mat, matUnique, glow } from '../render/materials';
import type { Prop } from './props';

/**
 * Twin plates: two pressure plates that answer only to two dragons standing
 * on them at the same moment, one each. Aster takes one; Nyxa, told to stay
 * ("hold G" near the other plate), takes the other. Boulders and frozen foes
 * do nothing here: the glyphs are dragon wings.
 *
 * Once both are held together the pair locks down, lit, and the level hears
 * `signal` (once). A lone dragon on one plate gets a hint from Nyxa, or from
 * Flick when Nyxa is not along.
 */

const ASTER = 0xf5c46b;
const NYXA = 0xc070ff;
const IDLE = 0x5a4a78;

type Who = 'aster' | 'nyxa' | null;

interface Plate {
  x: number;
  y: number;
  z: number;
  top: THREE.Mesh;
  topMat: THREE.MeshStandardMaterial;
  glyph: THREE.MeshBasicMaterial;
  gem: THREE.Mesh;
  gemMat: THREE.MeshBasicMaterial;
  who: Who;
  /** Eased 0..1 press depth, for the plate sinking. */
  press: number;
}

export class TwinPlates implements Prop {
  readonly plates: [Plate, Plate];
  solved = false;
  private t = 0;
  private aloneT = 0;
  private nyxaAloneT = 0;
  private hintCd = 0;
  private hints = 0;
  private linkT = 0;
  private linkK = 0;

  constructor(private game: Game, a: [number, number, number], b: [number, number, number], readonly signal: string) {
    this.plates = [this.build(a[0], a[1], a[2]), this.build(b[0], b[1], b[2])];
  }

  private build(x: number, y: number, z: number): Plate {
    const root = this.game.level!.root;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.7, 0.2, 18), mat(0x3a3446, { rough: 0.9, flat: true }));
    base.position.set(x, y + 0.1, z);
    base.receiveShadow = true;
    root.add(base);
    const topMat = matUnique(0x4e4262, { rough: 0.55, emissive: NYXA, emissiveIntensity: 0.1 });
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.22, 18), topMat);
    top.position.set(x, y + 0.26, z);
    top.receiveShadow = true;
    root.add(top);
    // A dragon's wing glyph: a ring with two swept vanes.
    const glyph = glow(IDLE, 0.85, true);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.78, 28), glyph);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, y + 0.385, z);
    root.add(ring);
    for (const s of [-1, 1]) {
      const vane = new THREE.Mesh(new THREE.CircleGeometry(0.42, 3), glyph);
      vane.rotation.set(-Math.PI / 2, 0, s * 0.5 + Math.PI / 2);
      vane.scale.set(1, 0.38, 1);
      vane.position.set(x + s * 0.24, y + 0.39, z);
      root.add(vane);
    }
    // A shard that floats over the plate: dim until a dragon stands below it.
    const gemMat = glow(IDLE, 0.9, true);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), gemMat);
    gem.scale.set(1, 1.7, 1);
    gem.position.set(x, y + 2.6, z);
    root.add(gem);
    return { x, y, z, top, topMat, glyph, gem, gemMat, who: null, press: 0 };
  }

  /** Who is standing on this plate right now (Aster wins a tie). */
  private occupant(pl: Plate): Who {
    const g = this.game;
    const b = g.player.body;
    if (g.player.alive && Math.hypot(b.x - pl.x, b.z - pl.z) < 1.35 && b.y > pl.y - 0.6 && b.y < pl.y + 0.9 && (b.grounded || b.y < pl.y + 0.5)) return 'aster';
    if (g.partner.standingOn(pl.x, pl.y, pl.z, 1.45)) return 'nyxa';
    return null;
  }

  /** The middle of a plate nobody (or only Nyxa) is standing on, near (x, z): where Nyxa goes when told to stay. */
  freeSpot(x: number, z: number, r: number): { x: number; y: number; z: number } | null {
    if (this.solved) return null;
    let best: Plate | null = null;
    let bd = r;
    for (const pl of this.plates) {
      if (pl.who === 'aster') continue;
      const d = Math.hypot(pl.x - x, pl.z - z);
      if (d < bd) {
        bd = d;
        best = pl;
      }
    }
    return best ? { x: best.x, y: best.y, z: best.z } : null;
  }

  update(dt: number): void {
    const g = this.game;
    this.t += dt;
    this.hintCd = Math.max(0, this.hintCd - dt);
    if (!this.solved) {
      for (const pl of this.plates) {
        const who = this.occupant(pl);
        if (who !== pl.who) {
          g.sfx('switch', pl.x, pl.y, pl.z, who ? 0.75 : 0.5, 0.7);
          if (who) g.fx.ring(pl.x, pl.y + 0.4, pl.z, 0.4, 1.6, who === 'aster' ? ASTER : NYXA, 0.35);
          pl.who = who;
        }
      }
      const [a, b] = this.plates;
      if (a.who && b.who && a.who !== b.who) this.solve();
      else this.lonely(dt);
    }
    // Plates sink under a dragon, glyphs and shards take the dragon's color.
    for (const pl of this.plates) {
      const down = this.solved || pl.who ? 1 : 0;
      pl.press += (down - pl.press) * Math.min(1, dt * 10);
      pl.top.position.y = pl.y + 0.26 - pl.press * 0.12;
      const col = this.solved ? 0xe8d0ff : pl.who === 'aster' ? ASTER : pl.who === 'nyxa' ? NYXA : IDLE;
      pl.glyph.color.setHex(col);
      pl.gemMat.color.setHex(col);
      pl.topMat.emissive.setHex(pl.who === 'aster' ? ASTER : NYXA);
      pl.topMat.emissiveIntensity = this.solved ? 0.55 : pl.who ? 0.45 : 0.1 + 0.05 * Math.sin(this.t * 2);
      pl.gem.position.y = pl.y + 2.6 + Math.sin(this.t * 1.6 + pl.x) * 0.12;
      pl.gem.rotation.y += dt * (this.solved ? 0.6 : pl.who ? 2.4 : 0.8);
    }
  }

  /** One plate held, the other empty: motes drift from the held plate to its twin, and someone offers a hint. */
  private lonely(dt: number): void {
    const g = this.game;
    const [a, b] = this.plates;
    const held = a.who ? a : b.who ? b : null;
    const other = held === a ? b : a;
    if (held && !other.who) {
      this.linkT -= dt;
      this.linkK = (this.linkK + dt * 0.45) % 1;
      if (this.linkT <= 0) {
        this.linkT = 0.07;
        const k = this.linkK;
        const x = held.x + (other.x - held.x) * k;
        const z = held.z + (other.z - held.z) * k;
        const y = held.y + (other.y - held.y) * k + 1.1 + Math.sin(k * Math.PI) * 1.2;
        g.fx.emit(x, y, z, { count: 1, speed: 0.3, life: [0.5, 0.8], size: [0.14, 0.22], sizeEnd: 0, color: held.who === 'aster' ? ASTER : NYXA, bright: 2, gravity: -0.3 });
      }
    }
    this.aloneT = held?.who === 'aster' && !other.who ? this.aloneT + dt : 0;
    this.nyxaAloneT = held?.who === 'nyxa' && !other.who ? this.nyxaAloneT + dt : 0;
    if (this.hintCd > 0 || g.state !== 'play') return;
    if (this.aloneT > 1.4) {
      this.hintCd = 22;
      const p = g.partner;
      if (p.present) {
        p.say(this.hints++ === 0
          ? 'Two plates, and each wants a dragon. Walk me over to the other one and hold G. I\'ll stand on it.'
          : 'The other plate, Aster. Bring me there, hold G, and come back to this one.', 6, true);
      } else if (g.save.levelsDone.keep) {
        g.hud.flick('These plates want two dragons standing on them at once. Nyxa could hold one, if she weren\'t home. (Options: Nyxa fights beside you.)', 7);
      } else {
        g.hud.flick('These plates want two dragons standing on them at once. We\'re one dragon short. I don\'t count, apparently.', 6);
      }
    } else if (this.nyxaAloneT > 2.5) {
      this.hintCd = 22;
      g.partner.say('I\'m on mine. Yours is the other one.', 4, true);
    }
  }

  private solve(): void {
    const g = this.game;
    this.solved = true;
    g.sfx('unlock', this.plates[0].x, this.plates[0].y, this.plates[0].z);
    for (const pl of this.plates) {
      g.fx.ring(pl.x, pl.y + 0.4, pl.z, 0.3, 3, 0xe0b0ff, 0.6);
      g.fx.motes(pl.x, pl.y + 1.2, pl.z, 0xe8d0ff, 26);
    }
    g.partner.say('Together, then.', 3, true);
    g.level?.emit(this.signal);
  }
}

/**
 * Twin plates at `a` and `bPos` (x, z): `signal` fires once both are pressed
 * at the same moment, one by Aster and one by Nyxa. Place them where Nyxa can
 * walk (or shadow-step) to the second plate, within sight of each other.
 */
export function twinPlates(b: Builder, a: [number, number], bPos: [number, number], signal: string): TwinPlates {
  const t = new TwinPlates(b.game, [a[0], b.y(a[0], a[1]), a[1]], [bPos[0], b.y(bPos[0], bPos[1]), bPos[1]], signal);
  b.level.props.push(t);
  return t;
}
