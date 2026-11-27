const { test } = require('node:test');
const assert = require('node:assert/strict');
const createLoader = require('./load-app-module.cjs');

function fixture() {
  const records = new Map();
  let failed = false;
  const store = { getItem: async key => records.get(key) ?? null, setItem: async (key, value) => {
    if (failed) throw Error('Storage unavailable'); records.set(key, value);
  } };
  const load = createLoader({ 'expo-sqlite/kv-store': { __esModule: true, default: store } });
  const state = load('src/lib/subscriptions/promotionState.ts');
  const { createPromotionClock } = load('src/lib/subscriptions/promotionClock.ts');
  let now = 0, ready = 0;
  const writes = [];
  const clock = (initial = { activeMs: 0, shown: false }) => createPromotionClock(initial,
    async value => { if (failed) throw Error('Storage unavailable'); writes.push(value); },
    () => { ready++; }, () => now);
  return { records, state, clock, writes, advance: ms => { now += ms; }, get ready() { return ready; }, set failed(value) { failed = value; } };
}

test('a new free-user promotion becomes ready at exactly three foreground minutes', async () => {
  const f = fixture();
  const clock = f.clock();
  clock.resume();
  f.advance(179999);
  clock.checkpoint();
  assert.equal(f.ready, 0);
  assert.equal(await clock.claim(), false);
  f.advance(1);
  clock.checkpoint();
  assert.equal(f.ready, 1);
  assert.equal(await clock.claim(), true);
  assert.equal(await clock.claim(), false);
  assert.equal(f.writes.at(-1).shown, true);
});

test('background time does not count toward the delay', () => {
  const f = fixture();
  const clock = f.clock();
  clock.resume();
  f.advance(60000);
  clock.pause();
  f.advance(3600000);
  assert.equal(clock.remaining(), 120000);
  clock.resume();
  f.advance(119999);
  clock.checkpoint();
  assert.equal(f.ready, 0);
  f.advance(1);
  clock.checkpoint();
  assert.equal(f.ready, 1);
});

test('progress resumes from a saved foreground duration after restart', async () => {
  const f = fixture();
  const clock = f.clock({ activeMs: 120000, shown: false });
  clock.resume();
  f.advance(60000);
  clock.checkpoint();
  assert.equal(f.ready, 1);
  assert.equal(await clock.claim(), true);
});

test('shown promotions remain hidden before the three-day cooldown', async () => {
  const f = fixture();
  const clock = f.clock({ activeMs: 180000, shown: true });
  clock.resume();
  f.advance(3600000);
  clock.checkpoint();
  assert.equal(f.ready, 0);
  assert.equal(await clock.claim(), false);
});

test('a reminder becomes eligible at exactly three days and resets its cooldown', async () => {
  const f = fixture();
  const clock = f.clock({ activeMs: 180000, shown: true, lastShownAt: 0 });
  clock.resume();
  f.advance(f.state.PROMOTION_COOLDOWN_MS - 1);
  clock.checkpoint();
  assert.equal(f.ready, 0);
  assert.equal(await clock.claim(), false);
  f.advance(1);
  clock.checkpoint();
  assert.equal(f.ready, 1);
  assert.equal(await clock.claim(), true);
  assert.equal(await clock.claim(), false);
  assert.equal(f.writes.at(-1).lastShownAt, f.state.PROMOTION_COOLDOWN_MS);
  f.advance(f.state.PROMOTION_COOLDOWN_MS);
  clock.checkpoint();
  assert.equal(f.ready, 2);
  assert.equal(await clock.claim(), true);
});

test('a reminder uses elapsed calendar time across backgrounding and restarts', async () => {
  const f = fixture();
  const clock = f.clock({ activeMs: 180000, shown: false });
  assert.equal(await clock.claim(), true);
  clock.pause();
  const saved = f.writes.at(-1);
  f.advance(f.state.PROMOTION_COOLDOWN_MS);
  const restarted = f.clock(saved);
  restarted.resume();
  assert.equal(f.ready, 1);
  assert.equal(await restarted.claim(), true);
});

test('legacy shown flags receive a persisted migration date without resetting it on reads', async () => {
  const f = fixture();
  await f.state.savePromotionState('legacy', { activeMs: 180000, shown: true });
  const first = await f.state.readPromotionState('legacy');
  assert.equal(typeof first.lastShownAt, 'number');
  const second = await f.state.readPromotionState('legacy');
  assert.equal(first.lastShownAt, second.lastShownAt);
});

test('a stored dismissal survives session restoration and repeat sign-ins', async () => {
  const f = fixture();
  await f.state.initializePromotion('a', false);
  await f.state.savePromotionState('a', { activeMs: 180000, shown: true });
  await f.state.initializePromotion('a', true);
  await f.state.initializePromotion('a', false);
  assert.equal((await f.state.readPromotionState('a')).shown, true);
});

test('existing installations are skipped and account eligibility stays separate', async () => {
  const f = fixture();
  await f.state.initializePromotion('old', true);
  await f.state.initializePromotion('new', false);
  assert.equal((await f.state.readPromotionState('old')).shown, true);
  assert.equal((await f.state.readPromotionState('new')).shown, false);
  await f.state.initializePromotion('new', true);
  assert.equal((await f.state.readPromotionState('new')).shown, false);
});

test('a pending new-user timer is preserved when a session is restored', async () => {
  const f = fixture();
  await f.state.initializePromotion('a', false);
  await f.state.savePromotionState('a', { activeMs: 45000, shown: false });
  await f.state.initializePromotion('a', true);
  assert.equal((await f.state.readPromotionState('a')).activeMs, 45000);
});

test('storage errors do not prevent login or cause repeated promotions', async () => {
  const f = fixture();
  f.failed = true;
  await f.state.initializePromotion('a', false);
  const clock = f.clock({ activeMs: 180000, shown: false });
  assert.equal(await clock.claim(), false);
  assert.equal(await clock.claim(), false);
});
