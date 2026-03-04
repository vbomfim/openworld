export interface Scene {
  description: string;
  location: string;
  time: string;
  era: string;
  atmosphere: string;
}

class SceneStore {
  current = $state<Scene | null>(null);
  isGenerating = $state(false);

  setScene(scene: Scene) {
    this.current = scene;
  }

  clear() {
    this.current = null;
  }
}

export const sceneStore = new SceneStore();
