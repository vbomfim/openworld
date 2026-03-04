import { getDB, type StoredMemory } from '../db';

export type { StoredMemory };

export async function saveMemory(memory: StoredMemory): Promise<void> {
  const db = await getDB();
  await db.put('memories', memory);
}

export async function getMemoriesForPersona(personaId: string): Promise<StoredMemory[]> {
  const db = await getDB();
  const tx = db.transaction('memories', 'readonly');
  const index = tx.store.index('by-persona');
  return index.getAll(personaId);
}
