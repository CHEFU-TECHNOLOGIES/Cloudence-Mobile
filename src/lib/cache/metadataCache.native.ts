import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as SQLite from "expo-sqlite";

const DATABASE_PREFIX = "cloudence-cache-";
const CACHE_SCHEMA_VERSION = 1;
const MAX_CACHE_AGE_MS = 30 * 24 * 60 * 60 * 1000;

type CacheRow = {
  cache_key: string;
  payload: string;
  cached_at: number;
  schema_version: number;
};

type CacheEntry = {
  payload: unknown;
  cachedAt: number;
};

const openDatabases = new Map<string, Promise<SQLite.SQLiteDatabase>>();

async function getAccountCache(userId: string) {
  const accountHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    userId,
  );
  const databaseName = `${DATABASE_PREFIX}${accountHash}.db`;
  const existing = openDatabases.get(databaseName);
  if (existing) return existing;

  const opening = (async () => {
    const keyName = `${DATABASE_PREFIX}key-${accountHash}`;
    let key = await SecureStore.getItemAsync(keyName);
    if (!key) {
      const bytes = await Crypto.getRandomBytesAsync(32);
      key = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
      await SecureStore.setItemAsync(keyName, key);
    }

    const database = await SQLite.openDatabaseAsync(databaseName);
    try {
      await database.execAsync(`PRAGMA key = '${key}';`);
      await database.execAsync(
        `CREATE TABLE IF NOT EXISTS metadata_cache (
          cache_key TEXT PRIMARY KEY NOT NULL,
          payload TEXT NOT NULL,
          cached_at INTEGER NOT NULL,
          schema_version INTEGER NOT NULL
        );`,
      );
      return database;
    } catch (error) {
      await database.closeAsync();
      throw error;
    }
  })();

  openDatabases.set(databaseName, opening);
  try {
    return await opening;
  } catch (error) {
    openDatabases.delete(databaseName);
    throw error;
  }
}

export async function readMetadataCache(
  userId: string,
  cacheKey: string,
): Promise<CacheEntry | null> {
  const database = await getAccountCache(userId);
  const row = await database.getFirstAsync<CacheRow>(
    "SELECT cache_key, payload, cached_at, schema_version FROM metadata_cache WHERE cache_key = ?",
    cacheKey,
  );
  if (!row) return null;

  if (
    row.schema_version !== CACHE_SCHEMA_VERSION ||
    Date.now() - row.cached_at > MAX_CACHE_AGE_MS
  ) {
    await database.runAsync(
      "DELETE FROM metadata_cache WHERE cache_key = ?",
      cacheKey,
    );
    return null;
  }

  try {
    return { payload: JSON.parse(row.payload) as unknown, cachedAt: row.cached_at };
  } catch (error) {
    console.warn("Discarding malformed Cloudence metadata cache entry.", error);
    await database.runAsync(
      "DELETE FROM metadata_cache WHERE cache_key = ?",
      cacheKey,
    );
    return null;
  }
}

export async function writeMetadataCache(
  userId: string,
  cacheKey: string,
  payload: unknown,
  cachedAt = Date.now(),
) {
  const database = await getAccountCache(userId);
  await database.runAsync(
    `INSERT INTO metadata_cache (cache_key, payload, cached_at, schema_version)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(cache_key) DO UPDATE SET
       payload = excluded.payload,
       cached_at = excluded.cached_at,
       schema_version = excluded.schema_version`,
    cacheKey,
    JSON.stringify(payload),
    cachedAt,
    CACHE_SCHEMA_VERSION,
  );
  await database.runAsync(
    `DELETE FROM metadata_cache WHERE cache_key IN (
      SELECT cache_key FROM metadata_cache
      ORDER BY cached_at DESC
      LIMIT -1 OFFSET 100
    )`,
  );
}

export async function clearUserMetadataCache(userId: string) {
  const accountHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    userId,
  );
  const databaseName = `${DATABASE_PREFIX}${accountHash}.db`;
  const keyName = `${DATABASE_PREFIX}key-${accountHash}`;

  await SecureStore.deleteItemAsync(keyName);
  const opened = openDatabases.get(databaseName);
  if (opened) {
    const database = await opened;
    await database.closeAsync();
    openDatabases.delete(databaseName);
  }
  await SQLite.deleteDatabaseAsync(databaseName);
}
