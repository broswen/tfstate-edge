export interface BasicAuth {
    username: string,
    password: string
}

//validate a username and password exist and match in the KEYS KV Namespace
export async function authenticate(auth: BasicAuth, KEYS: KVNamespace): Promise<boolean> {
    const resp = await KEYS.get(auth.username)
    if (resp === null) {
        return false
    }
    return auth.password === resp
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
