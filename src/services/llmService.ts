import type { Message } from '@/types/support';

interface ChatRequest {
  message: string;
}

interface ChatResponse {
  success: boolean;
  reply: string;
}

const BACKEND_URL = 'http://localhost:8000/api/chat';

export async function fetchLLMReply(message: string, conversationHistory: Message[]): Promise<string> {
  try {
    // Prepare the context for the LLM
    const context = conversationHistory
      .filter(msg => msg.role !== 'system')
      .slice(-6) // Last 3 exchanges (user + agent)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const fullPrompt = `You are a helpful ISP customer support agent. Respond professionally and concisely to the user's message.
Previous conversation:
${context}

Current user message: ${message}

Provide a helpful response as a support agent:`

    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: fullPrompt
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ChatResponse = await response.json();
    
    if (data.success && data.reply) {
      return data.reply;
    } else {
      throw new Error('LLM request failed');
    }
  } catch (error) {
    console.error('Error communicating with LLM:', error);
    // Fallback to a default response if LLM fails
    return "I'm here to help with your internet connection issues. Could you please describe the problem you're experiencing in more detail?";
  }
}