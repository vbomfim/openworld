import { llmEngine } from '../llm/engine.svelte';
import type { Scene } from '../llm/prompts';

export async function generateNarrativeEvent(scene: Scene): Promise<string> {
  const response = await llmEngine.chat([
    {
      role: 'system',
      content: 'You are a narrator. Generate a brief, one-sentence environmental event that adds atmosphere to the scene. Be subtle and natural. Do not introduce new characters.',
    },
    {
      role: 'user',
      content: `Scene: ${scene.description} at ${scene.location}. Atmosphere: ${scene.atmosphere}. Generate a brief environmental event.`,
    },
  ]);

  return response.trim();
}
