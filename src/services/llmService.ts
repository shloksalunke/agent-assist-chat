import type { Message } from '@/types/support';

interface ChatRequest {
  message: string;
  history: Message[];
}

interface ChatResponse {
  success: boolean;
  reply: string;
}

const BACKEND_URL = 'http://localhost:8000/api/chat';

export async function sendToLLM(message: string, history: Message[]): Promise<string> {
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ChatResponse = await response.json();
    
    if (data.success) {
      return data.reply;
    } else {
      throw new Error('LLM request failed');
    }
  } catch (error) {
    console.error('Error communicating with LLM:', error);
    // Fallback to a default response if LLM fails
    return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
  }
}

export async function getLLMResponse(message: string, history: Message[]): Promise<string> {
  // System prompt to guide the LLM behavior
  const systemPrompt = `
    You are an AI customer support agent for ISP Connect, a fictional internet service provider.
    Your role is to help customers troubleshoot internet connectivity issues with a friendly, professional tone.
    
    Current conversation history:
    ${history.map(m => `${m.role}: ${m.content}`).join('\n')}
    
    Guidelines:
    1. Be concise but helpful
    2. Ask clarifying questions when needed
    3. Provide step-by-step troubleshooting when appropriate
    4. Escalate to human agent when necessary
    5. Keep responses under 3 sentences unless explaining complex procedures
    6. Use emojis sparingly to convey friendliness
    
    Customer's latest message: ${message}
    
    Respond as the AI support agent:
  `;
  
  return sendToLLM(systemPrompt, history);
}