import type { Persona } from './schema';
import { llmEngine } from '../llm/engine.svelte';
import { buildPersonaGenerationPrompt } from '../llm/prompts';

export async function generatePersona(sceneHint?: string): Promise<Persona> {
  const prompt = buildPersonaGenerationPrompt(sceneHint);

  const response = await llmEngine.chat([
    { role: 'system', content: 'You are a character generator. Return only valid JSON. No markdown code fences, no explanation, no extra text.' },
    { role: 'user', content: prompt },
  ]);

  let jsonStr = response.trim();
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  const data = JSON.parse(jsonStr);

  const persona: Persona = {
    id: crypto.randomUUID(),
    identity: data.identity,
    background: data.background,
    family: {
      maritalStatus: data.family?.maritalStatus ?? 'single',
      children: data.family?.children ?? [],
      grandchildren: data.family?.grandchildren ?? [],
      livesWith: data.family?.livesWith ?? [],
    },
    pets: data.pets ?? [],
    interests: data.interests ?? { areasOfInterest: [], hobbies: [] },
    dailyLife: data.dailyLife ?? { routine: '', skipsBreakfast: false, exerciseHabits: '' },
    preferences: data.preferences ?? { favoriteColor: '', favoriteFood: '', clothingStyle: '', musicTaste: '' },
    health: {
      medicalConditions: data.health?.medicalConditions ?? [],
      allergies: data.health?.allergies ?? [],
      dietRestrictions: data.health?.dietRestrictions ?? [],
    },
    personality: data.personality ?? { traits: [], communicationStyle: '', temperament: '' },
    history: {
      keyLifeEvents: data.history?.keyLifeEvents ?? [],
      memorableExperiences: data.history?.memorableExperiences ?? [],
    },
    context: data.context ?? { era: 'modern', setting: 'urban', culturalBackground: '' },
    createdAt: new Date().toISOString(),
  };

  return persona;
}
