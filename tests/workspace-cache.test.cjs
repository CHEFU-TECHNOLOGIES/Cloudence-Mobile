const { test } = require('node:test');
const assert = require('node:assert/strict');
const createLoader = require('./load-app-module.cjs');
const hookHost = require('./hook-host.cjs');
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const usage = used => ({ used, all: 2 * 1024 ** 3, image: { size: 0, latestDate: null }, document: { size: used, latestDate: null }, video: { size: 0, latestDate: null }, audio: { size: 0, latestDate: null }, other: { size: 0, latestDate: null } });

function fixture(age = 120_000) {
  const host = hookHost();
  let now = 1_000_000, revalidate, offlineListener, requests = 0;
  let account = 'a';
  let response = deferred();
  const writes = [];
  class Clock extends Date { static now() { return now; } }
  const getAccessToken = async () => 'token';
  const load = createLoader({
    react: host.react,
    'expo-network': { addNetworkStateListener: listener => { offlineListener = listener; return { remove() {} }; }, getNetworkStateAsync: async () => ({ isConnected: true }) },
    '../auth/SessionContext': { useSession: () => ({ status: 'authenticated', user: { id: account }, getAccessToken }) },
    '../lib/cache/metadataCache': {
      readMetadataCache: async (_, key) => ({ cachedAt: now - age, payload: key === 'files' ? [] : usage(5) }),
      writeMetadataCache: async (userId, key, value) => { writes.push({ userId, key, value }); },
    },
    '../lib/api/files': { listFiles: async () => [], getUsage: async () => { requests++; return response.promise; } },
    './useCloudenceFileActions': { useCloudenceFileActions: () => ({}) },
    '../lib/cache/clearAccountCaches': { clearAccountCaches: async id => load('src/lib/cache/cachePolicy.ts').invalidateAccountCaches(id) },
    '../hooks/useCacheRevalidation': { useCacheRevalidation: callback => { revalidate = callback; } },
  }, { Date: Clock });
  const hook = load('src/data/useCloudenceWorkspace.ts').useCloudenceWorkspace;
  host.start(hook);
  return { host, writes, get requests() { return requests; }, set account(value) { account = value; },
    advance(ms) { now += ms; }, resolve(value) { response.resolve(value); }, newResponse() { response = deferred(); },
    revalidate: () => revalidate(), offline: () => offlineListener({ isConnected: false }), online: () => offlineListener({ isConnected: true }) };
}

test('workspace renders stale metadata immediately while revalidating in the background', async () => {
  const f = fixture();
  const cached = await f.host.flush();
  assert.equal(cached.usage.used, 5);
  assert.equal(cached.isLoading, false);
  assert.equal(f.requests, 1);
  f.resolve(usage(20));
  const refreshed = await f.host.flush();
  assert.equal(refreshed.usage.used, 20);
  assert.equal(f.writes.find(write => write.key === 'usage').value.used, 20);
  f.host.unmount();
});

test('fresh cache avoids requests until its freshness window expires', async () => {
  const f = fixture(0);
  await f.host.flush();
  assert.equal(f.requests, 0);
  f.advance(60_001);
  const refresh = f.revalidate();
  await f.host.flush();
  assert.equal(f.requests, 1);
  f.resolve(usage(25));
  await refresh;
  assert.equal((await f.host.flush()).usage.used, 25);
  f.host.unmount();
});

test('offline cache is retained and reconnect refreshes stale metadata', async () => {
  const f = fixture(0);
  await f.host.flush();
  f.advance(60_001);
  f.offline();
  await f.revalidate();
  assert.equal(f.requests, 0);
  assert.equal((await f.host.flush()).usage.used, 5);
  f.online();
  await f.host.flush();
  assert.equal(f.requests, 1);
  f.resolve(usage(30));
  assert.equal((await f.host.flush()).usage.used, 30);
  f.host.unmount();
});

test('an account switch discards responses from the previous account', async () => {
  const f = fixture();
  await f.host.flush();
  f.account = 'b';
  f.host.render();
  await f.host.flush();
  f.resolve(usage(99));
  await f.host.flush();
  assert.equal(f.writes.some(write => write.userId === 'a'), false);
  assert.equal(f.writes.some(write => write.userId === 'b'), true);
  f.host.unmount();
});

test('a forced refresh after a mutation waits for an older read, then fetches again', async () => {
  const f = fixture();
  const current = await f.host.flush();
  const forced = current.refresh();
  const sameForced = current.refresh();
  assert.equal(forced, sameForced);
  f.resolve(usage(6));
  f.newResponse();
  await f.host.flush();
  assert.equal(f.requests, 2);
  f.resolve(usage(50));
  await forced;
  assert.equal((await f.host.flush()).usage.used, 50);
  f.host.unmount();
});
