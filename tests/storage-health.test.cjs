const { test } = require('node:test');
const assert = require('node:assert/strict');
const createLoader = require('./load-app-module.cjs');
const hookHost = require('./hook-host.cjs');

const keys = ['duplicates', 'versions', 'largeMedia', 'olderFiles'];
const file = { id: 'copy', name: 'Copy.txt', owner: { id: 'a' }, size: 100, users: [] };
const item = { file, reason: 'Identical content', keepId: 'original' };
function report(items = [item]) {
  return { scannedAt: '2026-11-27T12:00:00Z', scannedFiles: 2, truncated: false, reviewedBytes: 100,
    duplicateBytes: 100, unhashedFiles: 0,
    categories: Object.fromEntries(keys.map(key => [key, { count: key === 'duplicates' ? items.length : 0, bytes: key === 'duplicates' ? 100 : 0, items: key === 'duplicates' ? items : [] }])),
  };
}

test('the API validates scan totals, categories and candidate files', () => {
  const load = createLoader({ './client': { apiRequest() {} }, './files': { parseCloudFile: value => {
    if (!value?.id) throw Error('Invalid file'); return value;
  } } });
  const { parseStorageHealth } = load('src/lib/api/storageHealth.ts');
  assert.equal(parseStorageHealth(report()).categories.duplicates.items[0].file.id, 'copy');
  assert.throws(() => parseStorageHealth({ ...report(), reviewedBytes: -1 }));
  assert.throws(() => parseStorageHealth({ ...report(), categories: {} }));
  assert.throws(() => parseStorageHealth(report([{ reason: 'Bad', file: {} }])));
});

function fixture(read = async () => report()) {
  const host = hookHost();
  let account = 'a';
  let offline = false;
  let reads = 0;
  const removed = [];
  const tokens = async () => `token-${account}`;
  const refresh = async () => true;
  const remove = async (...args) => { removed.push(args); };
  const load = createLoader({
    react: host.react,
    'expo-router': { useFocusEffect: cb => host.react.useEffect(cb, [cb]) },
    '../../../auth/SessionContext': { useSession: () => ({ user: { id: account }, getAccessToken: tokens }) },
    '../../../data/CloudenceDataProvider': { useCloudenceData: () => ({ remove, refresh, isOffline: offline, download() {}, cancelDownload() {} }) },
    '../../../lib/api/client': { ApiError: class ApiError extends Error {} },
    '../../../lib/api/storageHealth': { HEALTH_CATEGORIES: keys, getStorageHealth: async (...args) => { reads++; return read(...args); } },
  });
  const { useStorageHealth } = load('src/components/cloudence/storage-health/useStorageHealth.ts');
  host.start(() => useStorageHealth());
  return { host, removed, get reads() { return reads; },
    switchAccount(value) { account = value; host.render(); },
    setOffline() { offline = true; host.render(); },
  };
}

test('cleanup revalidates a suggestion, uses the owned file fallback, then refreshes the scan', async () => {
  const f = fixture();
  const health = await f.host.flush();
  assert.equal(health.report.scannedFiles, 2);
  await health.deleteReviewedFile(item);
  assert.equal(f.removed.length, 1);
  assert.deepEqual(f.removed[0], ['copy', false, file]);
  assert.equal(f.reads, 3);
  f.host.unmount();
});

test('a missing or changed kept copy prevents deletion and refreshes the report', async () => {
  let reads = 0;
  const f = fixture(async () => ++reads === 1 ? report() : report([]));
  const health = await f.host.flush();
  await assert.rejects(health.deleteReviewedFile(item), /suggestion has changed/);
  assert.equal(f.removed.length, 0);
  f.host.unmount();
});

test('offline and foreign-owner deletion are blocked before any mutation', async () => {
  const f = fixture();
  const health = await f.host.flush();
  await assert.rejects(health.deleteReviewedFile({ ...item, file: { ...file, owner: { id: 'b' } } }), /own files/);
  f.setOffline();
  await assert.rejects((await f.host.flush()).deleteReviewedFile(item), /Connect/);
  assert.equal(f.removed.length, 0);
  f.host.unmount();
});

test('a file shared after the user reviewed it requires another review before deletion', async () => {
  let reads = 0;
  const shared = { ...item, file: { ...file, users: ['teammate@example.com'] } };
  const f = fixture(async () => ++reads === 1 ? report() : report([shared]));
  const health = await f.host.flush();
  await assert.rejects(health.deleteReviewedFile(item), /suggestion has changed/);
  assert.equal(f.removed.length, 0);
  f.host.unmount();
});

test('late scan responses cannot expose the previous account report', async () => {
  let resolveOld;
  const f = fixture(token => token === 'token-a' ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve(report([])));
  await f.host.flush();
  f.switchAccount('b');
  assert.equal((await f.host.flush()).report.categories.duplicates.items.length, 0);
  resolveOld(report());
  assert.equal((await f.host.flush()).report.categories.duplicates.items.length, 0);
  f.host.unmount();
});

test('switching accounts while revalidating a deletion cancels the mutation', async () => {
  let reads = 0, release;
  const f = fixture(async () => ++reads === 2 ? new Promise(resolve => { release = resolve; }) : report());
  const health = await f.host.flush();
  const deleting = health.deleteReviewedFile(item);
  await f.host.flush();
  f.switchAccount('b');
  release(report());
  await deleting;
  assert.equal(f.removed.length, 0);
  f.host.unmount();
});
