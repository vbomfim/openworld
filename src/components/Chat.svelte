<script lang="ts">
  import { tick, onMount, onDestroy } from 'svelte';
  import { chatStore } from '../stores/chat.svelte';
  import { personaStore } from '../stores/persona.svelte';
  import { sceneStore } from '../stores/scene.svelte';
  import { llmEngine } from '../lib/llm/engine.svelte';
  import { buildSystemPrompt } from '../lib/llm/prompts';
  import { generateScene } from '../lib/scenario/engine';
  import { generatePersona } from '../lib/persona/generator';
  import { savePersona, deletePersona } from '../lib/persona/store';
  import { getMemoriesForPersona, deleteMemoriesForPersona } from '../lib/memory/store';
  import { summarizeAndStoreConversation } from '../lib/memory/episodic';
  import { saveConversation, getLatestConversationForPersona, deleteConversationsForPersona } from '../lib/conversation/store';
  import type { Persona } from '../lib/persona/schema';

  let inputText = $state('');
  let sceneInput = $state('');
  let chatContainer: HTMLDivElement | undefined = $state();
  let isResuming = $state(false);

  const isInScene = $derived(sceneStore.current !== null && personaStore.active !== null);

  $effect(() => {
    if (chatStore.messages.length || chatStore.streamingContent) {
      tick().then(() => {
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      });
    }
  });

  async function resumePersona(persona: Persona) {
    if (isResuming) return;
    isResuming = true;

    try {
      const conversation = await getLatestConversationForPersona(persona.id);

      if (conversation) {
        chatStore.clear();
        sceneStore.setScene(conversation.scene);
        personaStore.setActive(persona);
        chatStore.loadMessages(conversation.messages, conversation.id);
        chatStore.addMessage('narrator', `You return to ${conversation.scene.location}...`);

        const memories = await getMemoriesForPersona(persona.id);
        const systemPrompt = buildSystemPrompt(persona, conversation.scene, memories);

        chatStore.isGenerating = true;
        let fullResponse = '';
        for await (const chunk of llmEngine.chatStream([
          { role: 'system', content: systemPrompt },
          ...conversation.messages.slice(-10).filter(m => m.role !== 'narrator').map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
          { role: 'user', content: '[You return to continue the conversation. Greet them warmly, referencing something from your previous interaction.]' },
        ])) {
          fullResponse += chunk;
          chatStore.updateStreamingContent(fullResponse);
        }
        chatStore.finalizeStream(persona.identity.name);
      } else {
        chatStore.clear();
        personaStore.setActive(persona);
        const scene = {
          description: `A familiar place where you've met ${persona.identity.name} before.`,
          location: persona.background.currentLocation,
          time: 'Daytime',
          era: persona.context.era,
          atmosphere: 'Comfortable and familiar',
        };
        sceneStore.setScene(scene);
        chatStore.startNewConversation();
        chatStore.addMessage('narrator', `You find ${persona.identity.name} at ${scene.location}.`);

        const memories = await getMemoriesForPersona(persona.id);
        const systemPrompt = buildSystemPrompt(persona, scene, memories);
        chatStore.isGenerating = true;
        let fullResponse = '';
        for await (const chunk of llmEngine.chatStream([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `[A familiar face approaches you at ${scene.location}. Greet them.]` },
        ])) {
          fullResponse += chunk;
          chatStore.updateStreamingContent(fullResponse);
        }
        chatStore.finalizeStream(persona.identity.name);
      }
    } catch (err) {
      chatStore.addMessage('narrator', `Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      chatStore.isGenerating = false;
      isResuming = false;
    }
  }

  async function removePersona(e: Event, persona: Persona) {
    e.stopPropagation();
    if (!confirm(`Forget ${persona.identity.name}? This removes all conversations and memories.`)) return;
    try {
      await deletePersona(persona.id);
      await deleteConversationsForPersona(persona.id);
      await deleteMemoriesForPersona(persona.id);
      personaStore.all = personaStore.all.filter(p => p.id !== persona.id);
    } catch { /* silent */ }
  }

  // Auto-save conversation after each message exchange
  async function autoSave() {
    if (chatStore.conversationId && personaStore.active && sceneStore.current && chatStore.messages.length > 0) {
      try {
        await saveConversation(
          chatStore.conversationId,
          personaStore.active.id,
          sceneStore.current,
          chatStore.messages,
        );
      } catch {
        // Silent fail on auto-save
      }
    }
  }

  // Save on tab close
  function handleBeforeUnload() {
    if (chatStore.conversationId && personaStore.active && sceneStore.current && chatStore.messages.length > 0) {
      // Use sync IndexedDB via navigator.sendBeacon isn't possible, so we do a best-effort save
      autoSave();
    }
  }

  onMount(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
  });

  onDestroy(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
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

      chatStore.startNewConversation();
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
      await autoSave();
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
      await autoSave();
    } catch (err) {
      chatStore.addMessage('narrator', `Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      chatStore.isGenerating = false;
    }
  }

  async function newScene() {
    if (personaStore.active && chatStore.messages.length > 2) {
      try {
        await autoSave();
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
        <p class="text-gray-400 mb-6 max-w-md">
          Describe a place and time. You'll meet someone there and have a conversation.
        </p>
        <div class="text-sm text-gray-500 space-y-2 mb-8">
          <p>💡 "A coffee shop in downtown Seattle on a rainy afternoon"</p>
          <p>💡 "A bookstore in Paris, 1920s"</p>
          <p>💡 "A tavern in a medieval village"</p>
          <p>💡 "A space station orbiting Mars, year 2340"</p>
        </div>

        {#if personaStore.all.length > 0}
          <div class="max-w-lg w-full mb-8">
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Continue a conversation</h3>
            <div class="grid gap-2">
              {#each personaStore.all as persona}
                <div class="flex items-center bg-gray-800 rounded-lg hover:bg-gray-700/80 transition-colors group">
                  <button
                    onclick={() => resumePersona(persona)}
                    disabled={isResuming}
                    class="flex-1 text-left px-4 py-3 disabled:opacity-50 cursor-pointer"
                  >
                    <span class="text-sm font-medium text-gray-200">{persona.identity.name}</span>
                    <span class="text-xs text-gray-500 ml-2">{persona.background.profession} · 📍 {persona.background.currentLocation}</span>
                  </button>
                  <button
                    onclick={(e) => removePersona(e, persona)}
                    class="px-3 py-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs"
                    title="Forget {persona.identity.name}"
                  >
                    ✕
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <div class="max-w-lg mx-auto bg-gray-800/60 border border-gray-700 rounded-xl px-5 py-4 text-xs text-gray-500 leading-relaxed">
          <p class="font-semibold text-gray-400 mb-1">⚠️ Disclaimer</p>
          <p>
            All personas, scenarios, and conversations are <strong class="text-gray-400">entirely fictitious</strong> and randomly generated by AI.
            Nothing is grounded in truth. Conversations are driven by the user and the AI with no boundaries or moderation.
            Everything runs locally in your browser — there is <strong class="text-gray-400">no backend, no server, and no external responsibility</strong>.
            Use at your own discretion.
          </p>
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
