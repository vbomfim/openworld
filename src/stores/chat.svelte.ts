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
  conversationId = $state<string | null>(null);

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

  loadMessages(messages: ChatMessage[], conversationId: string) {
    this.messages = messages;
    this.conversationId = conversationId;
  }

  startNewConversation() {
    this.conversationId = crypto.randomUUID();
  }

  clear() {
    this.messages = [];
    this.streamingContent = '';
    this.isGenerating = false;
    this.conversationId = null;
  }
}

export const chatStore = new ChatStore();
