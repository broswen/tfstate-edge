import { DurableObject } from "cloudflare:workers";
import { LockState } from './project';
import { authenticate, BasicAuth, parseBasicAuth } from './authentication';
export { Project } from "./project";


export default {
	fetch: async function(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const method = request.method;
		const url = new URL(request.url);
		const projectName = url.pathname.slice(1);

		env.ANALYTICS.writeDataPoint({
			blobs: [method, projectName, request.headers.get("User-Agent")],
			doubles: [],
			indexes: [projectName]
		});

		if (projectName === "") {
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

		const authResult = await authenticate(creds, projectName, env);
		if (!authResult.authorized) {
			return new Response("not authorized", {status: 403})
		}

		if (method === "GET") {
			let state = await authResult.project.get();
			if (state) {
				return new Response(state.body);
			}
			return new Response("not found", {status: 404});
		}

		if (method === "POST") {
			let lock = await authResult.project.getLock();
			const lockId = url.searchParams.get("ID");
			if (lock && lock.ID !== lockId) {
				return new Response("lock mismatch", {status: 400});
			}

			await authResult.project.put(request.body);
			return new Response("ok");
		}

		if (method === "LOCK") {
			const lockState = await request.json<LockState>();
			let lock = await authResult.project.lock(lockState);
			if (lock) {
				return new Response(JSON.stringify(lock), {status: 423});
			}
			return new Response("ok");
		}

		if (method === "UNLOCK") {
			await authResult.project.unlock();
			return new Response("ok");
		}

		if (method === "DELETE") {
			await authResult.project.delete()
			return new Response("ok");
		}

		return new Response("not allowed", {status: 405});
	}
};
