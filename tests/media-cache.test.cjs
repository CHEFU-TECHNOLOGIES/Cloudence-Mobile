const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const createLoader = require('./load-app-module.cjs');

function fixture() {
  const nodes = new Map();
  const directories = new Set(['cache']);
  let downloads = 0, clearImages = 0;
  let content = 'hello';
  const sha = value => crypto.createHash('sha256').update(value).digest('hex');
  const uri = parts => parts.map(p => typeof p === 'string' ? p : p.uri).join('/');
  class File {
    constructor(...parts) { this.uri = uri(parts); }
    get exists() { return nodes.has(this.uri); }
    get size() { return Buffer.byteLength(nodes.get(this.uri)?.data ?? ''); }
    get modificationTime() { return nodes.get(this.uri)?.time ?? 0; }
    async digest() { return sha(nodes.get(this.uri)?.data ?? ''); }
    delete() { nodes.delete(this.uri); }
    async move(destination) { const value = nodes.get(this.uri); nodes.delete(this.uri); nodes.set(destination.uri, value); this.uri = destination.uri; }
    async canPreview() { return true; }
    async preview() {}
    static async downloadFileAsync(_url, destination, options) {
      downloads++;
      nodes.set(destination.uri, { data: content, time: Date.now() });
      if (options?.signal?.aborted) throw Error('aborted');
      return destination;
    }
  }
  class Directory {
    constructor(...parts) { this.uri = uri(parts); }
    get exists() { return directories.has(this.uri); }
    create() { directories.add(this.uri); }
    list() { return Array.from(nodes.keys()).filter(k => k.startsWith(this.uri + '/')).map(k => new File(k)); }
    delete() { for (const key of nodes.keys()) if (key.startsWith(this.uri + '/')) nodes.delete(key); directories.delete(this.uri); }
  }
  const filesystem = { File, Directory, Paths: { cache: 'cache' }, UploadType: {} };
  const load = createLoader({
    'expo-file-system': filesystem,
    'expo-crypto': { CryptoDigestAlgorithm: { SHA256: 'SHA256' }, digestStringAsync: async (_, value) => sha(value) },
    'expo-image': { Image: { clearDiskCache: async () => { clearImages++; }, clearMemoryCache: async () => {} } },
    'react-native': { Platform: { OS: 'android' } },
    'expo/fetch': {}, 'expo-document-picker': {}, 'expo-sharing': {},
    './config': { API_BASE_URL: 'https://api.example.test' },
    './client': { apiRequest: async () => { if (denied) throw Error('Access denied'); authorizations++; return metadata; }, getAuthHeaders: () => ({ Authorization: 'Bearer token' }) },
  });
  let authorizations = 0, denied = false;
  const metadata = { downloadUrl: '/content', sha256: sha('hello'), size: 5 };
  const cache = load('src/lib/cache/mediaCache.native.ts');
  const info = { id: 'one', name: 'notes.txt', sha256: sha('hello'), size: 5 };
  return { cache, info, nodes, load, metadata, get downloads() { return downloads; }, get clearImages() { return clearImages; },
    get authorizations() { return authorizations; }, set denied(value) { denied = value; }, set content(value) { content = value; } };
}

test('unchanged downloads reuse verified local bytes within their account', async () => {
  const f = fixture();
  const first = await f.cache.reuseOrDownloadFile('a', f.info, 'https://file');
  const second = await f.cache.reuseOrDownloadFile('a', f.info, 'https://file');
  assert.equal(first.uri, second.uri);
  assert.equal(f.downloads, 1);
  await f.cache.reuseOrDownloadFile('b', f.info, 'https://file');
  assert.equal(f.downloads, 2);
});

test('cached bytes are never reused without a fresh authorization check', async () => {
  const f = fixture();
  const { downloadFile } = f.load('src/lib/api/files.ts');
  const file = { id: 'one', name: 'notes', extension: 'txt' };
  await downloadFile('token', file, undefined, undefined, 'a');
  await downloadFile('token', file, undefined, undefined, 'a');
  assert.equal(f.downloads, 1);
  assert.equal(f.authorizations, 2);
  f.denied = true;
  await assert.rejects(downloadFile('token', file, undefined, undefined, 'a'), /Access denied/);
  assert.equal(f.downloads, 1);
});

test('changed versions and corrupted local bytes are downloaded again', async () => {
  const f = fixture();
  const first = await f.cache.reuseOrDownloadFile('a', f.info, 'https://file');
  f.nodes.get(first.uri).data = 'wrong';
  await f.cache.reuseOrDownloadFile('a', f.info, 'https://file');
  assert.equal(f.downloads, 2);
  f.content = 'world';
  const sha = crypto.createHash('sha256').update('world').digest('hex');
  await f.cache.reuseOrDownloadFile('a', { ...f.info, sha256: sha }, 'https://file');
  assert.equal(f.downloads, 3);
});

test('incomplete and unverified downloads leave no reusable files', async () => {
  const f = fixture();
  f.content = 'bad';
  await assert.rejects(f.cache.reuseOrDownloadFile('a', f.info, 'https://file'), /incomplete/);
  assert.equal(f.nodes.size, 0);
  f.content = 'wrong';
  await assert.rejects(f.cache.reuseOrDownloadFile('a', f.info, 'https://file'), /verified/);
  assert.equal(f.nodes.size, 0);
});

test('files without a server checksum are never reused', async () => {
  const f = fixture();
  const info = { ...f.info, sha256: undefined };
  await f.cache.reuseOrDownloadFile('a', info, 'https://file');
  await f.cache.reuseOrDownloadFile('a', info, 'https://file');
  assert.equal(f.downloads, 2);
});

test('expired files are evicted and logout clears only the account downloads', async () => {
  const f = fixture();
  const first = await f.cache.reuseOrDownloadFile('a', f.info, 'https://file');
  f.nodes.get(first.uri).time = 1;
  await f.cache.reuseOrDownloadFile('a', f.info, 'https://file');
  assert.equal(f.downloads, 2);
  const other = await f.cache.reuseOrDownloadFile('b', f.info, 'https://file');
  await f.cache.clearAccountMediaCache('a');
  assert.equal(f.nodes.size, 1);
  assert.equal(other.exists, true);
  assert.equal(f.clearImages, 1);
});

test('canceled downloads cannot create a cache entry', async () => {
  const f = fixture();
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(f.cache.reuseOrDownloadFile('a', f.info, 'https://file', { signal: abort.signal }), /canceled/);
  assert.equal(f.downloads, 0);
  assert.equal(f.nodes.size, 0);
});
