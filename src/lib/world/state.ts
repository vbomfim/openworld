export interface WorldState {
  currentSceneId: string | null;
  activePersonaIds: string[];
  timeElapsed: number;
}

export function createWorldState(): WorldState {
  return {
    currentSceneId: null,
    activePersonaIds: [],
    timeElapsed: 0,
  };
}
