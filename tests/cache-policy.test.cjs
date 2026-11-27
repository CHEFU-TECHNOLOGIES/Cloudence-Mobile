const { test } = require('node:test');
const assert = require('node:assert/strict');
const createLoader = require('./load-app-module.cjs');
const policyPath = 'src/lib/cache/cachePolicy.ts';
const cachePath = 'src/lib/cache/accountRequestCache.ts';
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

test('freshness expires at the boundary and rejects future timestamps', () => {
  const { isCacheFresh } = createLoader()(policyPath);
  assert.equal(isCacheFresh(1000, 100, 1099), true);
  assert.equal(isCacheFresh(1000, 100, 1100), false);
  assert.equal(isCacheFresh(1001, 100, 1000), false);
  assert.equal(isCacheFresh(0, 100, 50), false);
});

test('account cache coalesces reads, separates accounts and supports forced refresh', async () => {
  const load = createLoader();
  const cache = load(cachePath).createAccountRequestCache(60_000);
  const ready = deferred();
  let calls = 0;
  const fetchValue = () => { calls++; return ready.promise; };
  const first = cache.load('a', fetchValue);
  const second = cache.load('a', fetchValue);
  assert.equal(first, second);
  ready.resolve('old');
  assert.equal(await first, 'old');
  assert.equal(await cache.load('a', fetchValue), 'old');
  assert.equal(calls, 1);
  assert.equal(await cache.load('b', async () => 'other'), 'other');
  assert.equal(await cache.load('a', async () => 'new', true), 'new');
  assert.equal(cache.peek('b'), 'other');
});

test('cache expiration fetches new data instead of extending stale data', async () => {
  let now = 1000;
  class Clock extends Date { static now() { return now; } }
  const cache = createLoader({}, { Date: Clock })(cachePath).createAccountRequestCache(100);
  await cache.load('a', async () => 'old');
  now += 100;
  assert.equal(cache.peek('a'), undefined);
  assert.equal(await cache.load('a', async () => 'new'), 'new');
});

test('logout clears one account and prevents late responses from repopulating it', async () => {
  const load = createLoader();
  const cache = load(cachePath).createAccountRequestCache(60_000);
  await cache.load('b', async () => 'keep');
  const late = deferred();
  const request = cache.load('a', () => late.promise);
  load(policyPath).invalidateAccountCaches('a');
  late.resolve('private');
  await assert.rejects(request, /account changed/);
  assert.equal(cache.peek('a'), undefined);
  assert.equal(cache.peek('b'), 'keep');
  assert.equal(await cache.load('a', async () => 'fresh'), 'fresh');
});

test('failed fetches do not poison the cache or block retries', async () => {
  const cache = createLoader()(cachePath).createAccountRequestCache(60_000);
  await assert.rejects(cache.load('a', async () => { throw Error('offline'); }), /offline/);
  assert.equal(await cache.load('a', async () => 'recovered'), 'recovered');
});

test('folder revalidation preserves loaded pages and removes deleted files', async () => {
  const { fetchSectionSnapshot } = createLoader()('src/lib/cache/sectionSnapshot.ts');
  const offsets = [];
  const result = await fetchSectionSnapshot(async offset => {
    offsets.push(offset);
    return offset === 0 ? { files: [{ id: 'new' }, { id: 'kept' }], folders: [], nextOffset: 2 }
      : { files: [{ id: 'last' }], folders: [] };
  }, 3, true);
  assert.deepEqual(offsets, [0, 2]);
  assert.deepEqual(Array.from(result.files, f => f.id), ['new', 'kept', 'last']);
  assert.equal(result.nextOffset, undefined);
});

test('folder revalidation cannot loop on repeated offsets', async () => {
  const { fetchSectionSnapshot } = createLoader()('src/lib/cache/sectionSnapshot.ts');
  await assert.rejects(fetchSectionSnapshot(async () => ({ files: [], folders: [], nextOffset: 1 }), 5, true), /repeated page/);
});

test('folder memory cache is bounded and purged by account', () => {
  const load = createLoader();
  const cache = load('src/lib/cache/sectionListingCache.ts');
  cache.rememberListing('b:section:images:root', { files: [], folders: [] });
  for (let i = 0; i < 21; i++) cache.rememberListing(`a:section:images:${i}`, { files: [], folders: [] });
  assert.equal(cache.memoryListingCache.size, 20);
  cache.rememberListing('b:section:images:root', { files: [], folders: [] });
  load(policyPath).invalidateAccountCaches('a');
  assert.equal(cache.memoryListingCache.size, 1);
  assert.equal(cache.listingCachedAt.size, 1);
});

test('web metadata is tab-persistent, bounded, expiring and account-scoped', async () => {
  const data = new Map();
  const store = { get length() { return data.size; }, key: i => Array.from(data.keys())[i],
    getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) };
  const load = () => createLoader({}, { window: { sessionStorage: store } })('src/lib/cache/metadataCache.web.ts');
  await load().writeMetadataCache('a', 'usage', { used: 5 });
  await load().writeMetadataCache('b', 'usage', { used: 10 });
  assert.equal((await load().readMetadataCache('a', 'usage')).payload.used, 5);
  await load().clearUserMetadataCache('a');
  assert.equal(await load().readMetadataCache('a', 'usage'), null);
  assert.equal((await load().readMetadataCache('b', 'usage')).payload.used, 10);
  await load().writeMetadataCache('b', 'old', {}, 1);
  assert.equal(await load().readMetadataCache('b', 'old'), null);
  data.set('cloudence.metadata.v1:b:broken', 'not JSON');
  assert.equal(await load().readMetadataCache('b', 'broken'), null);
  const cache = load();
  for (let index = 0; index < 105; index++) await cache.writeMetadataCache('c', String(index), {});
  assert.equal(Array.from(data.keys()).filter(key => key.startsWith('cloudence.metadata.v1:c:')).length, 100);
});
