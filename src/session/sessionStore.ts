import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { SessionRecord } from './types';

/**
 * IndexedDB persistence for the in-progress session. Phase 1 keeps a single
 * session under a fixed key (no playlist yet); writes are async and off the
 * sampling path, so autosave never stalls the sampling loop.
 */
interface ContinuumDB extends DBSchema {
  sessions: { key: string; value: SessionRecord };
}

const DB_NAME = 'continuum';
const DB_VERSION = 1;
const STORE = 'sessions';
const CURRENT_KEY = 'current';

let dbPromise: Promise<IDBPDatabase<ContinuumDB>> | null = null;

function getDb(): Promise<IDBPDatabase<ContinuumDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ContinuumDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

export async function saveSession(record: SessionRecord): Promise<void> {
  const db = await getDb();
  await db.put(STORE, record, CURRENT_KEY);
}

export async function loadSession(): Promise<SessionRecord | undefined> {
  const db = await getDb();
  return db.get(STORE, CURRENT_KEY);
}

export async function clearSession(): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, CURRENT_KEY);
}
