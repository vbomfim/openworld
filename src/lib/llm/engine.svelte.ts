import { CreateMLCEngine, type MLCEngine, type InitProgressReport } from '@mlc-ai/web-llm';

export type EngineStatus = 'idle' | 'loading' | 'ready' | 'error';

export const AVAILABLE_MODELS = [
  { id: 'Llama-3.1-8B-Instruct-q4f32_1-MLC', name: 'Llama 3.1 8B', size: '~4 GB', recommended: true },
  { id: 'Phi-3.5-mini-instruct-q4f16_1-MLC', name: 'Phi 3.5 Mini', size: '~2 GB', recommended: false },
  { id: 'gemma-2-2b-it-q4f16_1-MLC', name: 'Gemma 2 2B', size: '~1.5 GB', recommended: false },
];

class LLMEngine {
  status = $state<EngineStatus>('idle');
  progress = $state(0);
  progressText = $state('');
  error = $state<string | null>(null);
  modelId = $state<string | null>(null);

  private engine: MLCEngine | null = null;

  checkWebGPU(): boolean {
    return 'gpu' in navigator;
  }

  async init(modelId: string) {
    if (!this.checkWebGPU()) {
      this.status = 'error';
      this.error = 'WebGPU is not supported in this browser. Please use Chrome 113+, Edge 113+, or Safari with WebGPU enabled.';
      return;
    }

    this.status = 'loading';
    this.progress = 0;
    this.progressText = 'Initializing...';
    this.error = null;
    this.modelId = modelId;

    try {
      this.engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (report: InitProgressReport) => {
          this.progress = report.progress;
          this.progressText = report.text;
        },
      });
      this.status = 'ready';
    } catch (err) {
      this.status = 'error';
      this.error = err instanceof Error ? err.message : 'Failed to initialize model';
    }
  }

  async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
    if (!this.engine) throw new Error('Engine not initialized');

    const response = await this.engine.chat.completions.create({
      messages: messages as any,
      temperature: 0.8,
      max_tokens: 1024,
    });

    return response.choices[0]?.message?.content ?? '';
  }

  async *chatStream(messages: Array<{ role: string; content: string }>): AsyncGenerator<string> {
    if (!this.engine) throw new Error('Engine not initialized');

    const stream = await this.engine.chat.completions.create({
      messages: messages as any,
      temperature: 0.8,
      max_tokens: 1024,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}

export const llmEngine = new LLMEngine();
