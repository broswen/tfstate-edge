// Make sure we export the States Durable Object class
import {authenticate, BasicAuth, parseBasicAuth} from "@/authentication";

export { States } from "./states";

export type Env = {
  STATES: DurableObjectNamespace
  KEYS: KVNamespace
  STATES_BUCKET: R2Bucket
  ENVIRONMENT: string
}

const STATES = 'states'

export async function handleRequest(request: Request, env: Env) {
  const url = new URL(request.url)

  //check for Authorization header
  const auth = request.headers.get('Authorization')
  if (auth === null) {
    return new Response('not authorized', {status: 401})
  }
  //parse Authorization header
  let creds: BasicAuth
  try {
    creds = parseBasicAuth(auth)
  } catch (e) {
    return new Response(e.message, {status: 401})
  }

  //authenticate Basic Authorization credentials
  const valid = await authenticate(creds, env.KEYS)
  if (!valid && env.ENVIRONMENT !== 'dev') {
    return new Response('not authorized', {status: 401})
  }

  //prevent empty project names
  if (url.pathname === '/') {
    return new Response('path must include project name', {status: 400})
  }

  const objId = env.STATES.idFromName(STATES)
  const obj = env.STATES.get(objId)
  return obj.fetch(request)
}

const worker: ExportedHandler<Env> = { fetch: handleRequest };
export default worker;
