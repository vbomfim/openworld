<script lang="ts">
  import { sceneStore } from '../stores/scene.svelte';
</script>

{#if sceneStore.current}
  <div class="bg-gray-800/60 border-b border-gray-700 px-6 py-3">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center gap-2 text-sm text-gray-400 mb-1">
        <span>📍 {sceneStore.current.location}</span>
        <span class="text-gray-600">•</span>
        <span>🕐 {sceneStore.current.time}</span>
        <span class="text-gray-600">•</span>
        <span>📅 {sceneStore.current.era}</span>
      </div>
      <p class="text-gray-300 italic text-sm">{sceneStore.current.description}</p>
    </div>
  </div>
{/if}
