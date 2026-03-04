<script lang="ts">
  import { tick } from 'svelte';
  import { chatStore } from '../stores/chat.svelte';
  import { personaStore } from '../stores/persona.svelte';
  import { sceneStore } from '../stores/scene.svelte';
  import { llmEngine } from '../lib/llm/engine.svelte';
  import { buildSystemPrompt } from '../lib/llm/prompts';
  import { generateScene } from '../lib/scenario/engine';
  import { generatePersona } from '../lib/persona/generator';
  import { savePersona } from '../lib/persona/store';
  import { getMemoriesForPersona } from '../lib/memory/store';
  import { summarizeAndStoreConversation } from '../lib/memory/episodic';

  let inputText = $state('');
  let sceneInput = $state('');
  let chatContainer: HTMLDivElement | undefined = $state();

  const isInScene = $derived(sceneStore.current !== null && personaStore.active !== null);

  $effect(() => {
    // Auto-scroll when messages change or streaming content updates
    if (chatStore.messages.length || chatStore.streamingContent) {
      tick().then(() => {
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      });
    }
  });

  async function startScene() {
    if (!sceneInput.trim()) return;

    const sceneDescription = sceneInput.trim();
    sceneInput = '';
    sceneStore.isGenerating = true;
    personaStore.isGenerating = true;

    try {
      const scene = await generateScene(sceneDescription);
      sceneStore.setScene(scene);

      const persona = await generatePersona(sceneDescription);
      personaStore.setActive(persona);
      await savePersona(persona);
      personaStore.addToAll(persona);

      chatStore.addMessage('narrator', `You find yourself at ${scene.location}. ${scene.description}`);

      // Generate persona's opening line
      const memories = await getMemoriesForPersona(persona.id);
      const systemPrompt = buildSystemPrompt(persona, scene, memories);

      chatStore.isGenerating = true;
      let fullResponse = '';

      for await (const chunk of llmEngine.chatStream([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `[Scene: A stranger just arrived at ${scene.location}. Greet them naturally, as you would in real life. Introduce yourself briefly.]` },
      ])) {
        fullResponse += chunk;
        chatStore.updateStreamingContent(fullResponse);
      }

      chatStore.finalizeStream(persona.identity.name);
    } catch (err) {
      chatStore.addMessage('narrator', `Something went wrong: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      sceneStore.isGenerating = false;
      personaStore.isGenerating = false;
      chatStore.isGenerating = false;
    }
  }

  async function sendMessage() {
    if (!inputText.trim() || chatStore.isGenerating || !personaStore.active) return;

    const userMessage = inputText.trim();
    inputText = '';

    chatStore.addMessage('user', userMessage);
    chatStore.isGenerating = true;

    try {
      const persona = personaStore.active;
      const memories = await getMemoriesForPersona(persona.id);
      const systemPrompt = buildSystemPrompt(persona, sceneStore.current, memories);

      // Build message history (last 20 messages for context)
      const contextMessages: Array<{ role: string; content: string }> = [
        { role: 'system', content: systemPrompt },
      ];

      const recentMessages = chatStore.messages.slice(-20);
      for (const msg of recentMessages) {
        if (msg.role === 'narrator') continue;
        contextMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }

      let fullResponse = '';
      for await (const chunk of llmEngine.chatStream(contextMessages)) {
        fullResponse += chunk;
        chatStore.updateStreamingContent(fullResponse);
      }

      chatStore.finalizeStream(persona.identity.name);
    } catch (err) {
      chatStore.addMessage('narrator', `Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      chatStore.isGenerating = false;
    }
  }

  async function newScene() {
    // Save memory of current conversation if there was one
    if (personaStore.active && chatStore.messages.length > 2) {
      try {
        await summarizeAndStoreConversation(personaStore.active.id, chatStore.messages);
      } catch {
        // Memory save failed, continue anyway
      }
    }

    chatStore.clear();
    sceneStore.clear();
    personaStore.clear();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isInScene) {
        sendMessage();
      } else {
        startScene();
      }
    }
  }
</script>

<div class="flex flex-col h-full">
  <!-- Messages area -->
  <div bind:this={chatContainer} class="flex-1 overflow-y-auto p-6 space-y-4">
    {#if !isInScene && !sceneStore.isGenerating}
      <div class="flex flex-col items-center justify-center h-full text-center">
        <div class="text-6xl mb-4">🌍</div>
        <h2 class="text-2xl font-bold mb-2">Where would you like to go?</h2>
        <p class="text-gray-400 mb-8 max-w-md">
          Describe a place and time. You'll meet someone there and have a conversation.
        </p>
        <div class="text-sm text-gray-500 space-y-2">
          <p>💡 "A coffee shop in downtown Seattle on a rainy afternoon"</p>
          <p>💡 "A bookstore in Paris, 1920s"</p>
          <p>💡 "A tavern in a medieval village"</p>
          <p>💡 "A space station orbiting Mars, year 2340"</p>
        </div>
      </div>
    {:else}
      {#each chatStore.messages as message}
        <div class="max-w-2xl {message.role === 'user' ? 'ml-auto' : 'mr-auto'}">
          {#if message.role === 'narrator'}
            <div class="text-center text-gray-500 italic text-sm py-2">
              {message.content}
            </div>
          {:else if message.role === 'user'}
            <div class="bg-blue-600 rounded-2xl rounded-br-sm px-4 py-3 text-white">
              {message.content}
            </div>
          {:else}
            <div class="bg-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
              {#if message.personaName}
                <p class="text-xs text-blue-400 font-medium mb-1">{message.personaName}</p>
              {/if}
              <p class="text-gray-200 whitespace-pre-wrap">{message.content}</p>
            </div>
          {/if}
        </div>
      {/each}

      <!-- Streaming message -->
      {#if chatStore.streamingContent}
        <div class="max-w-2xl mr-auto">
          <div class="bg-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
            {#if personaStore.active}
              <p class="text-xs text-blue-400 font-medium mb-1">{personaStore.active.identity.name}</p>
            {/if}
            <p class="text-gray-200 whitespace-pre-wrap">{chatStore.streamingContent}<span class="animate-pulse text-blue-400">▌</span></p>
          </div>
        </div>
      {/if}

      <!-- Loading indicator -->
      {#if (sceneStore.isGenerating || personaStore.isGenerating) && !chatStore.streamingContent}
        <div class="text-center py-4">
          <span class="text-gray-500 italic animate-pulse">Setting the scene...</span>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Input area -->
  <div class="border-t border-gray-700 p-4">
    <div class="max-w-2xl mx-auto flex gap-3">
      {#if isInScene}
        <button
          onclick={newScene}
          class="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-3 rounded-xl transition-colors cursor-pointer text-sm"
          title="Leave scene"
        >
          🚪
        </button>
        <input
          type="text"
          bind:value={inputText}
          onkeydown={handleKeydown}
          placeholder="Say something..."
          disabled={chatStore.isGenerating}
          class="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      {:else}
        <input
          type="text"
          bind:value={sceneInput}
          onkeydown={handleKeydown}
          placeholder="Describe a place and time..."
          disabled={sceneStore.isGenerating}
          class="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      {/if}
      <button
        onclick={() => isInScene ? sendMessage() : startScene()}
        disabled={chatStore.isGenerating || sceneStore.isGenerating}
        class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl transition-colors cursor-pointer"
      >
        {#if chatStore.isGenerating || sceneStore.isGenerating}
          <span class="animate-spin inline-block">⏳</span>
        {:else}
          Send
        {/if}
      </button>
    </div>
  </div>
</div>
