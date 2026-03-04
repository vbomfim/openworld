import { openDB, type IDBPDatabase } from 'idb';
import type { Persona } from './persona/schema';

export interface StoredMemory {
  id: string;
  personaId: string;
  summary: string;
  timestamp: string;
  turnCount: number;
}

let dbInstance: IDBPDatabase | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB('openworld', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('personas')) {
        db.createObjectStore('personas', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('memories')) {
        const memStore = db.createObjectStore('memories', { keyPath: 'id' });
        memStore.createIndex('by-persona', 'personaId');
      }
    },
  });

  return dbInstance;
}
