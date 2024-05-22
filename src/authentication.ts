import { Project, ProjectWrapper } from './project'

export interface BasicAuth {
    username: string
    password: string
}

export interface Permissions {
    username: string
    password: string
    projects: string[]
}

export type AuthResult = AuthSuccess | AuthFailure

interface AuthSuccess {
	authorized: true,
	project: ProjectWrapper
}

interface AuthFailure {
	authorized: false,
	project: undefined
}

//validate a username and password exist and match in the KEYS KV Namespace
export async function authenticate(auth: BasicAuth, project: string, env: Env): Promise<AuthResult> {
    const perms = await env.USERS.get<Permissions>(auth.username, "json");
    if (!perms) {
        return {authorized: false, project: undefined};
    }
    if (!perms.projects.includes(project)) {
			return {authorized: false, project: undefined};
    }

		if (perms.password !== auth.password) {
			return {authorized: false, project: undefined};
		}

		const objectId = env.PROJECT.idFromName(project);
		const stub = new ProjectWrapper(project, env.PROJECT.get(objectId));
		return {
			authorized: true,
			project: stub
		}
}

//parses Basic Auth header into BasicAuth object
//throws an error if the header is malformed
export function parseBasicAuth(auth: string): BasicAuth {
    const authParts = auth.split(" ");
    if (authParts.length !== 2) {
        throw Error('bad Authorization header');
    }
    const [username, password] = atob(authParts[1]).split(":");
    return {
        username,
        password
    };
}
