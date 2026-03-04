<script lang="ts">
  import { llmEngine, AVAILABLE_MODELS } from '../lib/llm/engine.svelte';

  let selectedModel = $state(AVAILABLE_MODELS[0].id);

  async function startDownload() {
    await llmEngine.init(selectedModel);
  }
</script>

{#if llmEngine.status === 'idle' || llmEngine.status === 'error'}
  <div class="flex flex-col items-center justify-center min-h-screen p-8">
    <h1 class="text-5xl font-bold mb-3">🌍 OpenWorld</h1>
    <p class="text-gray-400 mb-8 text-lg">Meet personas. Have conversations. All in your browser.</p>

    {#if llmEngine.error}
      <div class="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 max-w-md">
        <p class="text-red-300 text-sm">{llmEngine.error}</p>
      </div>
    {/if}

    <div class="bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
      <h2 class="text-lg font-semibold mb-2">Select AI Model</h2>
      <p class="text-sm text-gray-400 mb-4">
        The model runs entirely in your browser via WebGPU. No data leaves your device.
      </p>

      <div class="space-y-3 mb-6">
        {#each AVAILABLE_MODELS as model}
          <label
            class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
              {selectedModel === model.id ? 'bg-gray-700 ring-1 ring-blue-500' : 'hover:bg-gray-700/50'}"
          >
            <input type="radio" bind:group={selectedModel} value={model.id} class="accent-blue-500" />
            <div class="flex-1">
              <div class="font-medium">
                {model.name}
                {#if model.recommended}
                  <span class="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full ml-2">
                    Recommended
                  </span>
                {/if}
              </div>
              <div class="text-sm text-gray-400">{model.size}</div>
            </div>
          </label>
        {/each}
      </div>

      <button
        onclick={startDownload}
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors cursor-pointer"
      >
        Download & Start
      </button>
    </div>

    <p class="text-xs text-gray-500 mt-6">Requires Chrome 113+, Edge 113+, or Safari with WebGPU</p>
  </div>

{:else if llmEngine.status === 'loading'}
  <div class="flex flex-col items-center justify-center min-h-screen p-8">
    <h1 class="text-5xl font-bold mb-3">🌍 OpenWorld</h1>
    <p class="text-gray-400 mb-8 text-lg">Preparing your world...</p>

    <div class="w-full max-w-md">
      <div class="bg-gray-800 rounded-xl p-6 shadow-xl">
        <div class="mb-4">
          <div class="flex justify-between text-sm mb-2">
            <span class="text-gray-400">Downloading model...</span>
            <span class="text-blue-400">{Math.round(llmEngine.progress * 100)}%</span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-2.5">
            <div
              class="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
              style="width: {llmEngine.progress * 100}%"
            ></div>
          </div>
        </div>
        <p class="text-xs text-gray-500 break-words">{llmEngine.progressText}</p>
      </div>
    </div>
  </div>
{/if}
