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

// TODO replace this with a Proxy?
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
export class ProjectWrapper {
	projectName: string;
	env: Env;
	stub: DurableObjectStub<Project>;
	constructor(projectName: string, env: Env) {
		this.projectName = projectName;
		this.env = env;
		const objectId = env.PROJECT.idFromName(this.projectName);
		this.stub = env.PROJECT.get(objectId);
	}

	async lock(newLock: LockState): Promise<LockState | undefined> {
		return this.stub.lock(newLock);
	}

	async getLock(): Promise<LockState | undefined> {
		return this.stub.getLock();
	}

	async unlock(): Promise<void> {
		return this.stub.unlock();
	}

	async get(): Promise<R2ObjectBody | null> {
		return this.env.STATES.get(this.projectName)
	}

	async put(data: ReadableStream | null): Promise<R2Object | null> {
		return this.env.STATES.put(this.projectName, data);
	}

	async delete(): Promise<void> {
		await this.env.STATES.delete(this.projectName);
		return this.stub.unlock();
	}
}

export class Project extends DurableObject {
	ctx: DurableObjectState;
	env: Env;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.ctx = ctx;
		this.env = env;
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
