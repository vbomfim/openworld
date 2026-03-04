<script lang="ts">
  import { personaStore } from '../stores/persona.svelte';
  import { sceneStore } from '../stores/scene.svelte';
  import { chatStore } from '../stores/chat.svelte';
  import { getLatestConversationForPersona } from '../lib/conversation/store';
  import { getMemoriesForPersona } from '../lib/memory/store';
  import { llmEngine } from '../lib/llm/engine.svelte';
  import { buildSystemPrompt } from '../lib/llm/prompts';
  import { summarizeAndStoreConversation } from '../lib/memory/episodic';
  import { saveConversation } from '../lib/conversation/store';
  import type { Persona } from '../lib/persona/schema';

  let isResuming = $state(false);

  async function resumePersona(persona: Persona) {
    if (isResuming) return;
    isResuming = true;

    try {
      // Save current conversation if active
      if (personaStore.active && chatStore.messages.length > 2) {
        try {
          if (chatStore.conversationId && sceneStore.current) {
            await saveConversation(chatStore.conversationId, personaStore.active.id, sceneStore.current, chatStore.messages);
          }
          await summarizeAndStoreConversation(personaStore.active.id, chatStore.messages);
        } catch { /* continue */ }
      }

      // Load the persona's latest conversation
      const conversation = await getLatestConversationForPersona(persona.id);

      if (conversation) {
        // Resume with full history
        chatStore.clear();
        sceneStore.setScene(conversation.scene);
        personaStore.setActive(persona);
        chatStore.loadMessages(conversation.messages, conversation.id);

        // Add a narrator message about returning
        chatStore.addMessage('narrator', `You return to ${conversation.scene.location}...`);

        // Generate a greeting referencing past conversation
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
        // No previous conversation — just set the persona active with a generic scene
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

  const inactivePersonas = $derived(
    personaStore.all.filter(p => p.id !== personaStore.active?.id)
  );
</script>

{#if inactivePersonas.length > 0}
  <div class="bg-gray-800/50 border-r border-gray-700 w-56 flex-shrink-0 overflow-y-auto hidden md:flex md:flex-col">
    <div class="p-3 border-b border-gray-700">
      <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">People you've met</h2>
    </div>

    <div class="flex-1 overflow-y-auto">
      {#each inactivePersonas as persona}
        <button
          onclick={() => resumePersona(persona)}
          disabled={isResuming || chatStore.isGenerating}
          class="w-full text-left px-3 py-3 hover:bg-gray-700/50 transition-colors border-b border-gray-800 disabled:opacity-50 cursor-pointer"
        >
          <p class="text-sm font-medium text-gray-200 truncate">{persona.identity.name}</p>
          <p class="text-xs text-gray-500 truncate">{persona.background.profession}</p>
          <p class="text-xs text-gray-600 truncate">📍 {persona.background.currentLocation}</p>
        </button>
      {/each}
    </div>
  </div>
{/if}
