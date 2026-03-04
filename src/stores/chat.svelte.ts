export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'narrator';
  content: string;
  timestamp: number;
  personaName?: string;
}

class ChatStore {
  messages = $state<ChatMessage[]>([]);
  isGenerating = $state(false);
  streamingContent = $state('');

  addMessage(role: ChatMessage['role'], content: string, personaName?: string) {
    this.messages.push({
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: Date.now(),
      personaName,
    });
  }

  updateStreamingContent(content: string) {
    this.streamingContent = content;
  }

  finalizeStream(personaName?: string) {
    if (this.streamingContent) {
      this.addMessage('assistant', this.streamingContent, personaName);
      this.streamingContent = '';
    }
  }

  clear() {
    this.messages = [];
    this.streamingContent = '';
    this.isGenerating = false;
  }
}

export const chatStore = new ChatStore();
