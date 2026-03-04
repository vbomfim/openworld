import { openDB, type IDBPDatabase } from 'idb';
import type { Persona } from './persona/schema';
import type { ChatMessage } from '../stores/chat.svelte';
import type { Scene } from '../stores/scene.svelte';

export interface StoredMemory {
  id: string;
  personaId: string;
  summary: string;
  timestamp: string;
  turnCount: number;
}

export interface StoredConversation {
  id: string;
  personaId: string;
  scene: Scene;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

let dbInstance: IDBPDatabase | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB('openworld', 2, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains('personas')) {
        db.createObjectStore('personas', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('memories')) {
        const memStore = db.createObjectStore('memories', { keyPath: 'id' });
        memStore.createIndex('by-persona', 'personaId');
      }
      if (!db.objectStoreNames.contains('conversations')) {
        const convStore = db.createObjectStore('conversations', { keyPath: 'id' });
        convStore.createIndex('by-persona', 'personaId');
      }
    },
  });

  return dbInstance;
}
