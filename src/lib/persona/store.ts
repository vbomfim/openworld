import { getDB } from '../db';
import type { Persona } from './schema';

export async function savePersona(persona: Persona): Promise<void> {
  const db = await getDB();
  await db.put('personas', persona);
}

export async function getPersona(id: string): Promise<Persona | undefined> {
  const db = await getDB();
  return db.get('personas', id);
}

export async function getAllPersonas(): Promise<Persona[]> {
  const db = await getDB();
  return db.getAll('personas');
}

export async function deletePersona(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('personas', id);
}
