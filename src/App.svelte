<script lang="ts">
  import { llmEngine } from './lib/llm/engine.svelte';
  import Setup from './components/Setup.svelte';
  import Chat from './components/Chat.svelte';
  import SceneHeader from './components/SceneHeader.svelte';
  import PersonaCard from './components/PersonaCard.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import { personaStore } from './stores/persona.svelte';
  import { getAllPersonas } from './lib/persona/store';
  import { onMount } from 'svelte';

  onMount(async () => {
    try {
      const personas = await getAllPersonas();
      personaStore.setAll(personas);
    } catch {
      // DB not ready yet
    }
  });
</script>

{#if llmEngine.status !== 'ready'}
  <Setup />
{:else}
  <div class="flex flex-col h-screen bg-gray-900 text-white">
    <header class="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <h1 class="text-xl font-bold">🌍 OpenWorld</h1>
      <div class="text-xs text-gray-500">
        Model: {llmEngine.modelId?.split('-').slice(0, 3).join(' ')}
      </div>
    </header>

    <SceneHeader />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar />

      <div class="flex-1">
        <Chat />
      </div>

      {#if personaStore.active}
        <div class="border-l border-gray-700 p-4 overflow-y-auto hidden lg:block">
          <PersonaCard />
        </div>
      {/if}
    </div>
  </div>
{/if}
