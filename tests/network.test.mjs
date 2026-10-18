import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeServer, parseAmount, request } from '../src/lib/network.ts';

test('release API addresses require HTTPS and cannot contain credentials or a path', () => {
  assert.equal(normalizeServer(' https://api.example.com/ ', false), 'https://api.example.com');
  assert.equal(normalizeServer('http://192.168.1.20:3002', true), 'http://192.168.1.20:3002');
  for (const value of ['http://api.example.com', 'https://user:secret@api.example.com', 'https://api.example.com/api', 'https://api.example.com?token=secret']) {
    assert.throws(() => normalizeServer(value, false));
  }
});
test('mobile money input handles decimal keyboards and rejects fractional paisa', () => {
  assert.equal(parseAmount('12,50'), 12.5);
  assert.equal(parseAmount('0.01'), 0.01);
  assert.equal(parseAmount('10000000'), 10000000);
  for (const value of ['0', '-1', '1.001', '10000000.01', '', '1e2', '1,234.50']) assert.throws(() => parseAmount(value));
});
test('native requests use bearer auth without browser cookies', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.example.com/api/customers');
    assert.equal(options.headers.Authorization, 'Bearer token');
    assert.equal(options.headers['X-Gurrai-Client'], 'native');
    assert.equal(options.credentials, 'omit');
    return new Response(JSON.stringify([]));
  });
  assert.deepEqual(await request('https://api.example.com', '/customers', 'token'), []);
});
test('failed and repeated writes preserve their idempotency reference', async t => {
  const body = { id: 'same-entry-id', amount: 10, type: 'payment' };
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    calls.push(options.body);
    if (calls.length === 1) throw new TypeError('Network unavailable');
    return new Response('{"ok":true}');
  });
  await assert.rejects(request('https://api.example.com', '/customers/1/entries', 'token', { method: 'POST', body }), /same details/);
  assert.deepEqual(await request('https://api.example.com', '/customers/1/entries', 'token', { method: 'POST', body }), { ok: true });
  assert.equal(calls[0], calls[1]);
});
test('non-JSON and expired-session responses never look successful', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => new Response('proxy error', { status: 502 }));
  await assert.rejects(request('https://api.example.com', '/customers', null), /invalid response/);
  mock.mock.mockImplementation(async () => new Response('{"error":"Your session expired."}', { status: 401 }));
  await assert.rejects(request('https://api.example.com', '/customers', 'old'), error => error.status === 401);
});
