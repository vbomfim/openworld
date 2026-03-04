# OpenWorld

> Meet people. Have conversations. All in your browser.

OpenWorld is a browser-based conversational world simulator powered by a local AI model running entirely in your browser via WebGPU. No backend, no cloud — everything stays on your device.

## How It Works

1. **Open the app** — select and download an AI model (cached after first download)
2. **Describe a scene** — "A coffee shop in downtown Seattle on a rainy afternoon"
3. **Meet someone** — the AI generates a unique person with a full backstory
4. **Chat** — have a natural conversation. They remember you next time.

## Features

- 🧠 **100% Local** — AI runs in your browser via WebGPU. No data leaves your device.
- 🎭 **Rich Personas** — AI generates people with coherent backstories, preferences, habits, and personalities.
- 💾 **Persistent Memory** — Personas remember past conversations.
- 🌍 **Any Setting** — Modern coffee shops, 1920s Paris, medieval taverns, space stations.
- 🎬 **Living Scenes** — The AI narrator introduces events to make scenes feel alive.

## Requirements

- **Browser**: Chrome 113+, Edge 113+, or Safari with WebGPU enabled
- **GPU**: Modern GPU (integrated Intel GPUs work but slower)
- **Storage**: ~1-4 GB for the AI model (cached in browser storage)

## Development

```bash
npm install
npm run dev
```

## Tech Stack

- **Svelte 5** + **Vite** + **TypeScript**
- **WebLLM** (@mlc-ai/web-llm) — in-browser LLM inference via WebGPU
- **Tailwind CSS** — styling
- **IndexedDB** (via `idb`) — local persistence for personas and memories
