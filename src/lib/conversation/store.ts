import { getDB, type StoredConversation } from '../db';
import type { ChatMessage } from '../../stores/chat.svelte';
import type { Scene } from '../../stores/scene.svelte';

export async function saveConversation(
  id: string,
  personaId: string,
  scene: Scene,
  messages: ChatMessage[],
): Promise<void> {
  const db = await getDB();
  const existing = await db.get('conversations', id);

  const conversation: StoredConversation = {
    id,
    personaId,
    scene,
    messages,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.put('conversations', conversation);
}

export async function getConversation(id: string): Promise<StoredConversation | undefined> {
  const db = await getDB();
  return db.get('conversations', id);
}

export async function getConversationsForPersona(personaId: string): Promise<StoredConversation[]> {
  const db = await getDB();
  const tx = db.transaction('conversations', 'readonly');
  const index = tx.store.index('by-persona');
  return index.getAll(personaId);
}

export async function getLatestConversationForPersona(personaId: string): Promise<StoredConversation | undefined> {
  const conversations = await getConversationsForPersona(personaId);
  if (conversations.length === 0) return undefined;
  return conversations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}

export async function getAllConversations(): Promise<StoredConversation[]> {
  const db = await getDB();
  return db.getAll('conversations');
}
