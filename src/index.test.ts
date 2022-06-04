import {Env, handleRequest} from "@/index";

let env: Env

beforeAll(() => {
  env= getMiniflareBindings()
})

test('empty Authorization should return 401', async () => {
  const res = await handleRequest(new Request('http://localhost/test'), env);
  expect(res.status).toBe(401);
  expect(await res.text()).toBe('not authorized')
});

test('malformed Authorization returns 400', async () => {
  const res = await handleRequest(new Request('http://localhost/test', {headers: {Authorization: 'bad'}}), env);
  expect(res.status).toBe(401);
});