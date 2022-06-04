import {authenticate, parseBasicAuth} from "@/authentication";
import {Env} from "@/index";

let env: Env

beforeAll(() => {
    env = getMiniflareBindings()
})

test('malformed header throws error', () => {
    expect(() => {parseBasicAuth('something')}).toThrowError()
})

test('successful parse', () => {
    const header = `Basic ${btoa('user:pass')}`
    expect(parseBasicAuth(header)).toStrictEqual({username: 'user', password: 'pass'})
})

test('unauthorized', async () => {
    const creds = {username: 'user', password: 'pass'}
    expect(await authenticate(creds, env.KEYS)).toBeFalsy()
})