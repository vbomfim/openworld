import { llmEngine } from '../llm/engine.svelte';
import { buildSceneGenerationPrompt, type Scene } from '../llm/prompts';

export type { Scene };

export async function generateScene(userReference: string): Promise<Scene> {
  const prompt = buildSceneGenerationPrompt(userReference);

  const response = await llmEngine.chat([
    { role: 'system', content: 'You are a scene generator. Return only valid JSON. No markdown code fences, no explanation.' },
    { role: 'user', content: prompt },
  ]);

  let jsonStr = response.trim();
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  // Sanitize control characters inside JSON string values
  jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, (ch) => {
    if (ch === '\n' || ch === '\r' || ch === '\t') return ' ';
    return '';
  });

  const data = JSON.parse(jsonStr);

  return {
    description: data.description ?? 'An ordinary place.',
    location: data.location ?? userReference,
    time: data.time ?? 'Daytime',
    era: data.era ?? 'Modern day',
    atmosphere: data.atmosphere ?? 'Calm and pleasant',
  };
}
