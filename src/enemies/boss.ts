import { Enemy, type EnemyDef } from './enemy';
import type { Game } from '../game/game';

/**
 * Bosses are enemies with their own brain. The base Enemy still handles
 * physics, statuses and taking hits; subclasses implement think() and may
 * override onBossStagger() to open a punish window.
 */
export abstract class Boss extends Enemy {
  abstract readonly displayName: string;
  /** Dialogue speaker id, so cutscene shots can find the boss. */
  speakerId = '';
  phase = 1;
  phases = 3;
  protected spawnX: number;
  protected spawnY: number;
  protected spawnZ: number;
  onDefeated: (() => void) | null = null;
  /** The fight waits for this before the AI starts. */
  awake = false;

  constructor(game: Game, def: EnemyDef, x: number, y: number, z: number, yaw = 0) {
    super(game, def, x, y, z, yaw);
    this.isBoss = true;
    this.scripted = true;
    this.state = 'idle';
    this.spawnX = x;
    this.spawnY = y;
    this.spawnZ = z;
  }

  get hpFrac(): number {
    return this.hp / this.maxHp;
  }

  /** Extra per-step logic outside the stun gate (minions, hazards). */
  updateBoss(_dt: number): void {
    /* optional */
  }

  /** Called when the player dies mid-fight: heal and go back to the start. */
  resetBoss(): void {
    if (!this.alive) return;
    this.hp = this.maxHp;
    this.phase = 1;
    this.status.clear();
    this.body.setPos(this.spawnX, this.spawnY, this.spawnZ);
    this.body.vx = this.body.vy = this.body.vz = 0;
    this.setState('idle');
    this.awake = false;
    this.onReset();
  }

  protected onReset(): void {
    /* subclasses */
  }

  override die(hit: Parameters<Enemy['die']>[0], reaction: Parameters<Enemy['die']>[1] = null): void {
    if (!this.alive) return;
    super.die(hit, reaction);
    this.game.shake(0.8, 0.8);
    this.game.slowmo(0.25, 1.5);
    this.game.sfx('bossRoar', this.x, this.y, this.z, 0.7);
    this.game.fx.shadowPoof(this.x, this.y + this.height * 0.5, this.z, 3);
    this.onDefeated?.();
  }

  override get removable(): boolean {
    return this.state === 'dead' && this.deadT > 2.5;
  }
}
