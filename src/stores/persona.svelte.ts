import type { Persona } from '../lib/persona/schema';

class PersonaStore {
  active = $state<Persona | null>(null);
  all = $state<Persona[]>([]);
  isGenerating = $state(false);

  setActive(persona: Persona) {
    this.active = persona;
  }

  setAll(personas: Persona[]) {
    this.all = personas;
  }

  addToAll(persona: Persona) {
    this.all.push(persona);
  }

  clear() {
    this.active = null;
  }
}

export const personaStore = new PersonaStore();
