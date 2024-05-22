import { DurableObject } from "cloudflare:workers";
import { LockState } from './lock';
import { authenticate, BasicAuth, parseBasicAuth } from './authentication';
export { Lock } from "./lock";


export default {
	fetch: async function(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const method = request.method;
		const url = new URL(request.url);
		const project = url.pathname.slice(1);

		if (project === "") {
			return new Response("project name not specified", {status: 400})
		}

		const auth = request.headers.get("Authorization");
		if (!auth) {
			return new Response("not authorized", {status: 401})
		}
		let creds: BasicAuth
		try {
			creds = parseBasicAuth(auth)
		} catch (e) {
			return new Response("failed to parse basic auth", {status: 401})
		}

		const authorized = await authenticate(creds, project, env.USERS);
		if (!authorized) {
			return new Response("not authorized", {status: 403})
		}

		const objectId = env.LOCK.idFromName(project);
		const stub = env.LOCK.get(objectId);


		if (method === "GET") {
			let state = await env.STATES.get(project)
			if (state) {
				return new Response(state.body);
			}
			return new Response("not found", {status: 404});
		}

		if (method === "POST") {
			let lock = await stub.getLock();
			const lockId = url.searchParams.get("ID");
			if (lock && lock.ID !== lockId) {
				return new Response("lock mismatch", {status: 400});
			}

			await env.STATES.put(project, request.body);
			return new Response("ok");
		}

		if (method === "LOCK") {
			const lockState = await request.json<LockState>();
			let lock = await stub.lock(lockState);
			if (lock) {
				return new Response(JSON.stringify(lock), {status: 423});
			}
			return new Response("ok");
		}

		if (method === "UNLOCK") {
			await stub.unlock()
			return new Response("ok");
		}

		if (method === "DELETE") {
			await stub.unlock()
			await env.STATES.delete(project);
			return new Response("ok");
		}

		return new Response("not allowed", {status: 405});
	}
};
