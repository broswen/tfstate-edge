import {Env} from "@/index";

export interface StateLock {
  ID: string
  Operation: string
  Info: string
  Who: string
  Version: string
  Created: string
  Path: string
}

export class States implements DurableObject {
  env: Env
  constructor(private readonly state: DurableObjectState, private readonly env: Env) {
    this.env = env
  }

  async fetch(request: Request) {
    //assuming request was properly authorized by worker
    const url = new URL(request.url)
    //project key is just the path without the leading forward slash
    const key = url.pathname.slice(1)
    //a lock is just a key and value where key is the project key and value is the body of the LOCK request
    let lock: string | undefined = await this.state.storage?.get<string>(key)
    switch (request.method) {
      case 'GET':
        //return state from R2 or 404 if does not exist
        const object = await this.env.STATES_BUCKET.get(key)
        if (object === null) {
          return new Response('not found', {status: 404})
        }
        return new Response(object.body)
        break
      case 'POST':
        if (lock !== undefined) {
          //check query parameter ID matches existing lock ID
          const lockData: StateLock = JSON.parse(lock) as StateLock
          const lockID = url.searchParams.get('ID')
          if (lockData.ID !== lockID) {
            //lock IDs don't match
            return new Response('lock mismatch', {status: 400})
          }
        }
        //save state to R2
        await this.env.STATES_BUCKET.put(key, request.body)
        return new Response('ok')
        break
      case 'LOCK':
        //attempts to lock a project, returns lock data if it exists
        if (lock !== undefined) {
          return new Response(lock, {status: 423})
        }
        lock = await request.text() || 'locked'
        await this.state.storage?.put(key,  lock)
        return new Response('ok')
        break
      case 'UNLOCK':
        //deletes project lock
        await this.state.storage?.delete(key)
        return new Response('ok')
        break
      case 'DELETE':
        //deletes project lock and state from R2
        await this.state.storage?.delete(key)
        await this.env.STATES_BUCKET.delete(key)
        return new Response('ok')
        break
      default:
        return new Response('not allowed', {status: 405})
    }
  }
}
