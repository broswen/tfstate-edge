const { STATES } = getMiniflareBindings();

const id = STATES.newUniqueId()
const stub = STATES.get(id)

beforeAll(async () => {
  const storage = await getMiniflareDurableObjectStorage(id);
});

test("should return 404", async () => {
  const res = await stub.fetch(new Request("http://localhost/test"));
  expect(res.status).toBe(404)
});

test("should save and return state", async () => {
  let res = await stub.fetch(new Request("http://localhost/test"), {method: 'POST', body: 'state'});
  expect(res.status).toBe(200)
  res = await stub.fetch(new Request("http://localhost/test"), {method: 'GET'});
  expect(res.status).toBe(200)
  expect(await res.text()).toBe('state')
  res = await stub.fetch(new Request("http://localhost/test"), {method: 'DELETE'});
  expect(res.status).toBe(200)
  res = await stub.fetch(new Request("http://localhost/test"), {method: 'GET'});
  expect(res.status).toBe(404)
});

test("test locking", async () => {
  let res = await stub.fetch(new Request("http://localhost/test"), {method: 'LOCK'});
  expect(res.status).toBe(200)
  res = await stub.fetch(new Request("http://localhost/test"), {method: 'LOCK'});
  expect(res.status).toBe(423)
  res = await stub.fetch(new Request("http://localhost/test"), {method: 'UNLOCK'});
  expect(res.status).toBe(200)
});