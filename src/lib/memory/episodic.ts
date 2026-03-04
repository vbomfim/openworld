import { llmEngine } from '../llm/engine.svelte';
import { buildMemorySummaryPrompt } from '../llm/prompts';
import { saveMemory, type StoredMemory } from './store';
import type { ChatMessage } from '../../stores/chat.svelte';

export async function summarizeAndStoreConversation(
  personaId: string,
  messages: ChatMessage[],
): Promise<StoredMemory> {
  const conversationText = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => `${m.role === 'user' ? 'Stranger' : m.personaName ?? 'Character'}: ${m.content}`)
    .join('\n');

  const prompt = buildMemorySummaryPrompt(conversationText);

  const summary = await llmEngine.chat([
    { role: 'user', content: prompt },
  ]);

  const memory: StoredMemory = {
    id: crypto.randomUUID(),
    personaId,
    summary: summary.trim(),
    timestamp: new Date().toISOString(),
    turnCount: messages.filter(m => m.role === 'user').length,
  };

  await saveMemory(memory);
  return memory;
}
