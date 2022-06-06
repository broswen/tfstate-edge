export interface BasicAuth {
    username: string,
    password: string
}

export interface Permissions {
    username: string
    password: string
    projects: string[]
}

//validate a username and password exist and match in the KEYS KV Namespace
export async function authenticate(auth: BasicAuth, project: string, KEYS: KVNamespace): Promise<boolean> {
    const perms = await KEYS.get<Permissions>(auth.username, 'json')
    if (perms === null) {
        return false
    }
    if (!perms.projects.includes(project)) {
        return false
    }
    return perms.password === auth.password
}

//parses Basic Auth header into BasicAuth object
//throws an error if the header is malformed
export function parseBasicAuth(auth: string): BasicAuth {
    const authParts = auth.split(' ')
    if (authParts.length !== 2) {
        throw Error('bad Authorization header')
    }
    const [username, password] = atob(authParts[1]).split(':')
    return {
        username,
        password
    }
}
