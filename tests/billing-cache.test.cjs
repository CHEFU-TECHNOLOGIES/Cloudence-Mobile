const { test } = require('node:test');
const assert = require('node:assert/strict');
const createLoader = require('./load-app-module.cjs');

function fixture() {
  let queries = 0, statuses = 0, connections = 0, fail = false;
  let price = 'R69.99';
  const load = createLoader({
    'expo-iap': {
      ErrorCode: { NotPrepared: 'not-prepared', ServiceDisconnected: 'service-disconnected', ConnectionClosed: 'connection-closed' },
      fetchProducts: async () => { queries++; if (fail) throw { code: 'not-prepared' }; return [{ id: 'cloudence_pro_monthly', displayPrice: price }]; },
    },
    '../api/cloudenceBilling': {
      CLOUDENCE_PLAY_PRODUCTS: ['cloudence_pro_monthly'],
      getGooglePlayBillingStatus: async () => { statuses++; return { enabled: true, productIds: ['cloudence_pro_monthly'] }; },
    },
  });
  const api = load('src/lib/cache/billingCache.ts');
  return { api, load, reconnect: async () => { connections++; return true; },
    get queries() { return queries; }, get statuses() { return statuses; }, get connections() { return connections; },
    set price(value) { price = value; }, set fail(value) { fail = value; } };
}

test('reopening plans uses cached products and billing availability', async () => {
  const f = fixture();
  await f.api.getCachedPlayProducts('a', f.reconnect);
  await f.api.getCachedPlayProducts('a', f.reconnect);
  await f.api.getCachedBillingStatus('a', async () => 'token');
  await f.api.getCachedBillingStatus('a', async () => 'token');
  assert.equal(f.queries, 1);
  assert.equal(f.connections, 1);
  assert.equal(f.statuses, 1);
});

test('checkout refreshes prices and offers despite a fresh displayed cache', async () => {
  const f = fixture();
  const old = await f.api.getCachedPlayProducts('a', f.reconnect);
  f.price = 'R79.99';
  const latest = await f.api.getCachedPlayProducts('a', f.reconnect, true);
  assert.equal(old[0].displayPrice, 'R69.99');
  assert.equal(latest[0].displayPrice, 'R79.99');
  assert.equal(f.queries, 2);
});

test('store-disconnected retries are bounded and failures remain retryable', async () => {
  const f = fixture();
  f.fail = true;
  await assert.rejects(f.api.getCachedPlayProducts('a', f.reconnect));
  assert.equal(f.queries, 2);
  f.fail = false;
  await f.api.getCachedPlayProducts('a', f.reconnect);
  assert.equal(f.queries, 3);
});

test('logout invalidates product and billing caches', async () => {
  const f = fixture();
  await f.api.getCachedPlayProducts('a', f.reconnect);
  await f.api.getCachedBillingStatus('a', async () => 'token');
  f.load('src/lib/cache/cachePolicy.ts').invalidateAccountCaches('a');
  await f.api.getCachedPlayProducts('a', f.reconnect);
  await f.api.getCachedBillingStatus('a', async () => 'token');
  assert.equal(f.queries, 2);
  assert.equal(f.statuses, 2);
});
