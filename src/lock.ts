import { DurableObject } from 'cloudflare:workers';

const LOCK_KEY = "lock";

export interface LockState {
	ID: string
	Operation: string
	Info: string
	Who: string
	Version: string
	Created: string
	Path: string
}

export class Lock extends DurableObject {
	ctx: DurableObjectState;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.ctx = ctx;
	}

	// lock returns the existing lock id or undefined
	async lock(newLock: LockState): Promise<LockState | undefined> {
		const lock = await this.ctx.storage.get<LockState>(LOCK_KEY);
		if (lock) {
			return lock
		}
		await this.ctx.storage.put<LockState>(LOCK_KEY, newLock)
		return undefined
	}

	async getLock(): Promise<LockState | undefined> {
		return await this.ctx.storage.get<LockState>(LOCK_KEY)
	}

	// unlock deletes any existing lock
	async unlock(): Promise<void> {
		await this.ctx.storage.delete(LOCK_KEY);
	}
}
