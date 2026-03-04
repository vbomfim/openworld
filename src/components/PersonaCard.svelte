<script lang="ts">
  import { personaStore } from '../stores/persona.svelte';

  let expanded = $state(false);
</script>

{#if personaStore.active}
  {@const p = personaStore.active}
  <div class="bg-gray-800 rounded-xl p-4 w-64 flex-shrink-0">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-semibold text-lg">{p.identity.name}</h3>
      <button
        onclick={() => expanded = !expanded}
        class="text-gray-400 hover:text-white text-sm cursor-pointer"
      >
        {expanded ? '▼' : '▶'}
      </button>
    </div>

    <div class="space-y-1 text-sm text-gray-400">
      <p>{p.identity.age} years old · {p.identity.gender}</p>
      <p>💼 {p.background.profession}</p>
      <p>📍 {p.background.currentLocation}</p>
    </div>

    {#if expanded}
      <div class="mt-4 pt-4 border-t border-gray-700 space-y-3 text-sm">
        <div>
          <h4 class="font-medium text-gray-300 mb-1">Personality</h4>
          <div class="flex flex-wrap gap-1">
            {#each p.personality.traits as trait}
              <span class="bg-gray-700 px-2 py-0.5 rounded text-xs text-gray-300">{trait}</span>
            {/each}
          </div>
        </div>

        <div>
          <h4 class="font-medium text-gray-300 mb-1">Interests</h4>
          <p class="text-gray-400">{p.interests.hobbies.join(', ')}</p>
        </div>

        <div>
          <h4 class="font-medium text-gray-300 mb-1">Family</h4>
          <p class="text-gray-400">{p.family.maritalStatus}</p>
          {#if p.family.children.length > 0}
            <p class="text-gray-400">Children: {p.family.children.join(', ')}</p>
          {/if}
        </div>

        {#if p.pets.length > 0}
          <div>
            <h4 class="font-medium text-gray-300 mb-1">Pets</h4>
            {#each p.pets as pet}
              <p class="text-gray-400">{pet.name} ({pet.type})</p>
            {/each}
          </div>
        {/if}

        <div>
          <h4 class="font-medium text-gray-300 mb-1">Preferences</h4>
          <p class="text-gray-400">🎨 {p.preferences.favoriteColor} · 🍽️ {p.preferences.favoriteFood}</p>
          <p class="text-gray-400">👕 {p.preferences.clothingStyle}</p>
        </div>
      </div>
    {/if}
  </div>
{/if}
