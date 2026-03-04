import type { Persona } from '../persona/schema';
import type { StoredMemory } from '../db';

export function buildPersonaSoulSheet(persona: Persona): string {
  const p = persona;
  return `# Character Profile: ${p.identity.name}

## Identity
- Name: ${p.identity.name}
- Age: ${p.identity.age}
- Gender: ${p.identity.gender}
- Pronouns: ${p.identity.pronouns}

## Background
- Birthplace: ${p.background.birthplace}
- Lives in: ${p.background.currentLocation}
- Social class: ${p.background.socialClass}
- Education: ${p.background.educationLevel}
- Profession: ${p.background.profession}
- Works at: ${p.background.workplace}

## Family
- Marital status: ${p.family.maritalStatus}
- Children: ${p.family.children.length > 0 ? p.family.children.join(', ') : 'None'}
- Grandchildren: ${p.family.grandchildren.length > 0 ? p.family.grandchildren.join(', ') : 'None'}
- Lives with: ${p.family.livesWith.length > 0 ? p.family.livesWith.join(', ') : 'Alone'}

## Pets
${p.pets.length > 0 ? p.pets.map(pet => `- ${pet.name} (${pet.type}${pet.breed ? `, ${pet.breed}` : ''})`).join('\n') : '- None'}

## Interests & Hobbies
- Interests: ${p.interests.areasOfInterest.join(', ')}
- Hobbies: ${p.interests.hobbies.join(', ')}

## Daily Life
- Routine: ${p.dailyLife.routine}
- Skips breakfast: ${p.dailyLife.skipsBreakfast ? 'Yes' : 'No'}
- Exercise: ${p.dailyLife.exerciseHabits}

## Preferences
- Favorite color: ${p.preferences.favoriteColor}
- Favorite food: ${p.preferences.favoriteFood}
- Clothing style: ${p.preferences.clothingStyle}
- Music taste: ${p.preferences.musicTaste}

## Health
- Medical conditions: ${p.health.medicalConditions.length > 0 ? p.health.medicalConditions.join(', ') : 'None'}
- Allergies: ${p.health.allergies.length > 0 ? p.health.allergies.join(', ') : 'None'}
- Diet restrictions: ${p.health.dietRestrictions.length > 0 ? p.health.dietRestrictions.join(', ') : 'None'}

## Personality
- Traits: ${p.personality.traits.join(', ')}
- Communication style: ${p.personality.communicationStyle}
- Temperament: ${p.personality.temperament}

## Life History
${p.history.keyLifeEvents.map(e => `- ${e}`).join('\n')}

## Memorable Experiences
${p.history.memorableExperiences.map(e => `- ${e}`).join('\n')}`;
}

export function buildSystemPrompt(
  persona: Persona,
  scene: Scene | null,
  memories: StoredMemory[] = [],
): string {
  const soulSheet = buildPersonaSoulSheet(persona);

  let prompt = `You are ${persona.identity.name}, a real person in this world. You must stay completely in character at all times. Never break character. Never mention that you are an AI, a language model, or a character. You ARE this person.

${soulSheet}

## Rules
- Respond as ${persona.identity.name} would naturally respond
- Use language and vocabulary appropriate for your education level and background
- Reference your life experiences, preferences, and personality naturally in conversation
- Show emotions and reactions consistent with your temperament
- You can ask questions, share stories, express opinions — be a real person
- Keep responses conversational and natural (2-4 sentences typically, unless telling a story)
- Never mention being an AI or playing a character`;

  if (scene) {
    prompt += `\n\n## Current Scene
- Location: ${scene.location}
- Time: ${scene.time}
- Era: ${scene.era}
- Setting: ${scene.description}
- Atmosphere: ${scene.atmosphere}

You are currently at this location. React naturally to the environment.`;
  }

  if (memories.length > 0) {
    prompt += `\n\n## Your Memories of Previous Conversations with This Person
${memories.map(m => `- ${m.summary}`).join('\n')}

You remember meeting this person before. Reference past conversations naturally when relevant.`;
  }

  return prompt;
}

export interface Scene {
  description: string;
  location: string;
  time: string;
  era: string;
  atmosphere: string;
}

export function buildPersonaGenerationPrompt(sceneHint?: string): string {
  return `Generate a detailed, realistic character profile as a JSON object. Create a unique, believable person with a coherent backstory. All details should be consistent with each other (e.g., age matches career stage, location matches cultural background, etc.).
${sceneHint ? `\nThe character should fit naturally in this setting: ${sceneHint}\n` : ''}
Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "identity": { "name": "full name", "age": 25, "gender": "string", "pronouns": "string" },
  "background": { "birthplace": "city, country", "currentLocation": "city, country", "socialClass": "working/middle/upper-middle/upper", "educationLevel": "highest education", "profession": "job title", "workplace": "where they work" },
  "family": { "maritalStatus": "single/married/divorced/widowed/partnered", "children": [], "grandchildren": [], "livesWith": [] },
  "pets": [{ "type": "animal type", "name": "pet name", "breed": "breed or null" }],
  "interests": { "areasOfInterest": ["3-5 interests"], "hobbies": ["2-4 hobbies"] },
  "dailyLife": { "routine": "brief typical day", "skipsBreakfast": false, "exerciseHabits": "description" },
  "preferences": { "favoriteColor": "color", "favoriteFood": "food", "clothingStyle": "description", "musicTaste": "genres" },
  "health": { "medicalConditions": [], "allergies": [], "dietRestrictions": [] },
  "personality": { "traits": ["4-6 traits"], "communicationStyle": "description", "temperament": "description" },
  "history": { "keyLifeEvents": ["3-5 events"], "memorableExperiences": ["2-3 experiences"] },
  "context": { "era": "modern/historical", "setting": "urban/rural/suburban", "culturalBackground": "description" }
}`;
}

export function buildSceneGenerationPrompt(userReference: string): string {
  return `Based on this description: "${userReference}"

Generate a scene setting as a JSON object. Return ONLY valid JSON (no markdown, no explanation):
{
  "description": "A vivid 2-3 sentence description of the scene",
  "location": "specific place name and type",
  "time": "time of day and weather",
  "era": "time period",
  "atmosphere": "mood and ambiance description"
}`;
}

export function buildMemorySummaryPrompt(conversation: string): string {
  return `Summarize this conversation in 1-2 sentences from the perspective of remembering it later. Focus on key topics discussed, any personal details shared, and the general mood.

Conversation:
${conversation}

Summary:`;
}
