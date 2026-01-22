import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Message, TroubleshootingStep, Ticket, DiagnosticResult, IntentCategory } from '@/types/support';
import { v4 } from '@/lib/utils';
import { runFullDiagnostics, analyzeResults } from '@/services/diagnostics';
import { createTicket, updateTicketStatus, addAgentAction, addDiagnosticResults, escalateTicket, closeTicket } from '@/services/ticketService';
import { useAuth } from './AuthContext';

type ChatPhase = 'initial' | 'troubleshooting' | 'resolution_check' | 'system_access' | 'diagnostics' | 'feedback' | 'escalated' | 'closed';

interface ChatContextType {
  messages: Message[];
  currentPhase: ChatPhase;
  isTyping: boolean;
  currentSteps: TroubleshootingStep[];
  currentTicket: Ticket | null;
  diagnosticResults: DiagnosticResult[];
  diagnosticProgress: Record<string, number>;
  currentIntent: IntentCategory | null;
  sendMessage: (content: string) => Promise<void>;
  markStepComplete: (stepId: string) => void;
  confirmResolution: (resolved: boolean) => Promise<void>;
  grantSystemAccess: (granted: boolean) => Promise<void>;
  submitFeedback: (rating: number, comment?: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, mcpContext, addToConversationHistory, setActiveAgent } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPhase, setCurrentPhase] = useState<ChatPhase>('initial');
  const [isTyping, setIsTyping] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<TroubleshootingStep[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [diagnosticProgress, setDiagnosticProgress] = useState<Record<string, number>>({});
  const [currentIntent, setCurrentIntent] = useState<IntentCategory | null>(null);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const fullMessage: Message = {
      ...message,
      id: v4(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, fullMessage]);
    addToConversationHistory(fullMessage);
    return fullMessage;
  }, [addToConversationHistory]);

  const addAgentMessage = useCallback(async (content: string, metadata?: Message['metadata']) => {
    setIsTyping(true);
    // Simulate typing delay based on content length
    await new Promise(resolve => setTimeout(resolve, Math.min(content.length * 20, 2000)));
    setIsTyping(false);
    
    return addMessage({
      role: 'agent',
      content,
      agentType: mcpContext?.agentOrchestration.activeAgent || 'conversational',
      metadata,
    });
  }, [addMessage, mcpContext]);

  const addSystemMessage = useCallback((content: string) => {
    return addMessage({
      role: 'system',
      content,
    });
  }, [addMessage]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !mcpContext) return;

    // Add user message locally
    addMessage({ role: 'user', content });

    // If we are currently asking for resolution, interpret yes/no locally
    if (currentPhase === 'resolution_check') {
      const lower = content.toLowerCase();
      if (lower.includes('yes') || lower.includes('fixed') || lower.includes('working') || lower.includes('resolve') || lower.includes('done')) {
        // Close conversation
        addSystemMessage('✅ Issue marked as resolved');
        setCurrentPhase('closed');
        return;
      }

      if (lower.includes('no') || lower.includes('still') || lower.includes('not working') || lower.includes('problem')) {
        // Allow user to continue explaining the issue
        setCurrentPhase('initial');
        return;
      }
    }

    // For all other phases: send the user's message to the backend LLM endpoint
    setIsTyping(true);
    try {
      const resp = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        await addAgentMessage(`Error from server: ${text}`);
        return;
      }

      const json = await resp.json();

      // Extract the actual response text from the JSON instead of showing raw JSON
      let responseText = "";
      if (typeof json === 'object' && json !== null) {
        // Try common response fields
        if (typeof json.reply === 'string') {
          responseText = json.reply;
        } else if (typeof json.response === 'string') {
          responseText = json.response;
        } else if (typeof json.answer === 'string') {
          responseText = json.answer;
        } else {
          // If no recognizable field, stringify the whole object but format it nicely
          responseText = JSON.stringify(json, null, 2);
        }
      } else {
        // If response is already a string
        responseText = String(json);
      }

      // Display the formatted response text
      await addAgentMessage(responseText);

      // After LLM response, ask only for resolution feedback if not already in a special phase
      if (currentPhase !== 'system_access' && currentPhase !== 'diagnostics' && currentPhase !== 'feedback' && currentPhase !== 'escalated' && currentPhase !== 'closed') {
        setCurrentPhase('resolution_check');
        await addAgentMessage('Is your issue resolved? (Yes / No)', { requiresAction: true, actionType: 'resolution_check' });
      }
    } catch (err: any) {
      await addAgentMessage(`Failed to contact backend: ${err?.message || String(err)}`);
    } finally {
      setIsTyping(false);
    }
  }, [user, mcpContext, currentPhase, currentSteps, currentTicket, addMessage, addAgentMessage, addSystemMessage, setActiveAgent]);

  const markStepComplete = useCallback((stepId: string) => {
    setCurrentSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, completed: true } : step
      )
    );
  }, []);

  const confirmResolution = useCallback(async (resolved: boolean) => {
    if (!currentTicket) return;

    if (resolved) {
      // Issue resolved - close ticket and show feedback
      await updateTicketStatus(currentTicket.id, 'resolved');
      await addAgentAction(currentTicket.id, {
        agentType: 'conversational',
        action: 'User confirmed issue resolved via self-help',
        success: true,
      });

      addSystemMessage('✅ Issue marked as resolved');
      setCurrentPhase('feedback');
      
      await addAgentMessage(
        "Wonderful! I'm glad we could resolve your issue through the troubleshooting steps. 🎉\n\nBefore we close this case, would you mind sharing your feedback? It helps us improve our support service.",
        { requiresAction: true, actionType: 'feedback' }
      );
    } else {
      // Issue not resolved - request system access for diagnostics
      await addAgentAction(currentTicket.id, {
        agentType: 'conversational',
        action: 'Self-help unsuccessful, initiating diagnostic agent',
        success: true,
      });

      setCurrentPhase('system_access');
      setActiveAgent('diagnostic');
      
      await addAgentMessage(
        "I'm sorry the troubleshooting steps didn't resolve your issue. Let me switch to our **Autonomous Diagnostic Agent** which can perform a deeper analysis of your connection.\n\nTo do this, I'll need temporary access to run diagnostic tests on your network. This is completely safe and secure.",
        { requiresAction: true, actionType: 'system_access' }
      );
    }
  }, [currentTicket, addAgentMessage, addSystemMessage, setActiveAgent]);

  const grantSystemAccess = useCallback(async (granted: boolean) => {
    if (!currentTicket || !user) return;

    if (granted) {
      addSystemMessage('🔐 System access granted - Starting diagnostics...');
      setCurrentPhase('diagnostics');

      await addAgentMessage(
        "Thank you for granting access. I'm now launching the **Autonomous Diagnostic Agent** to analyze your connection. Please wait while I run the following tests:\n\n• Device profiling\n• Network configuration check\n• Connection quality test\n• Service status verification\n• Router health analysis\n• Automated fix attempts\n\nThis will take approximately 2-3 minutes."
      );

      // Run diagnostics
      const results: DiagnosticResult[] = [];
      
      await runFullDiagnostics(
        (test) => {
          addSystemMessage(`🔍 Running: ${test.name}...`);
        },
        (result) => {
          results.push(result);
          setDiagnosticResults([...results]);
          
          const statusEmoji = result.status === 'passed' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
          addSystemMessage(`${statusEmoji} ${result.testName}: ${result.status.toUpperCase()}`);
        },
        (testId, progress) => {
          setDiagnosticProgress(prev => ({ ...prev, [testId]: progress }));
        }
      );

      // Add results to ticket
      await addDiagnosticResults(currentTicket.id, results);

      // Analyze results and determine next steps
      const analysis = analyzeResults(results);
      
      if (analysis.overallStatus === 'resolved') {
        await updateTicketStatus(currentTicket.id, 'resolved');
        setCurrentPhase('feedback');
        
        await addAgentMessage(
          `**Diagnostic Complete** ✅\n\n${analysis.summary}\n\n**Recommendations:**\n${analysis.recommendations.map(r => `• ${r}`).join('\n')}\n\nPlease share your feedback below:`,
          { requiresAction: true, actionType: 'feedback' }
        );
      } else if (analysis.overallStatus === 'escalate') {
        await escalateTicket(currentTicket.id);
        setCurrentPhase('escalated');
        
        await addAgentMessage(
          `**Diagnostic Complete** - Escalation Required\n\n${analysis.summary}\n\nYour case has been assigned to a human engineer who will contact you shortly. Your ticket number is: **${currentTicket.id}**\n\nEstimated response time: 15-30 minutes`,
          { requiresAction: true, actionType: 'escalation' }
        );
      } else {
        setCurrentPhase('resolution_check');
        
        await addAgentMessage(
          `**Diagnostic Complete**\n\n${analysis.summary}\n\n**Findings:**\n${analysis.recommendations.map(r => `• ${r}`).join('\n')}\n\n**Is your connection working now?**`,
          { requiresAction: true, actionType: 'resolution_check' }
        );
      }
    } else {
      addSystemMessage('❌ System access declined');
      
      await addAgentMessage(
        "I understand you prefer not to grant system access. Without running diagnostics, I recommend:\n\n1. Try the troubleshooting steps again\n2. Contact us by phone at 1-800-ISP-HELP\n3. Schedule a technician visit\n\nWould you like me to help with any of these options?"
      );
    }
  }, [currentTicket, user, addAgentMessage, addSystemMessage]);

  const submitFeedback = useCallback(async (rating: number, comment?: string) => {
    if (!currentTicket) return;

    await closeTicket(currentTicket.id);
    await addAgentAction(currentTicket.id, {
      agentType: 'analytics',
      action: `Feedback collected: ${rating}/5 stars`,
      result: comment || 'No comment provided',
      success: true,
    });

    setCurrentPhase('closed');
    setActiveAgent('analytics');

    await addAgentMessage(
      `Thank you for your feedback! 🙏\n\nYour rating: ${'⭐'.repeat(rating)}\n\nYour case **${currentTicket.id}** has been closed. If you experience any further issues, feel free to start a new conversation.\n\nHave a great day! 👋`
    );
  }, [currentTicket, addAgentMessage, setActiveAgent]);

  // Send initial greeting when chat loads
  React.useEffect(() => {
    if (user && mcpContext && messages.length === 0) {
      const greeting = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
          const resp = await fetch('http://localhost:8000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Hello ${user.name}, please reply with a short friendly support assistant greeting.` }),
          });

          if (!resp.ok) {
            const text = await resp.text();
            await addAgentMessage(`Error fetching greeting: ${text}`);
            return;
          }

          const json = await resp.json();
          
          // Extract the actual response text from the JSON
          let greetingText = "";
          if (typeof json === 'object' && json !== null) {
            if (typeof json.reply === 'string') {
              greetingText = json.reply;
            } else if (typeof json.response === 'string') {
              greetingText = json.response;
            } else if (typeof json.answer === 'string') {
              greetingText = json.answer;
            } else {
              greetingText = JSON.stringify(json, null, 2);
            }
          } else {
            greetingText = String(json);
          }
          
          await addAgentMessage(greetingText);
        } catch (err: any) {
          await addAgentMessage(`Unable to reach backend for greeting: ${err?.message || String(err)}`);
        }
      };
      greeting();
    }
  }, [user, mcpContext, messages.length, addAgentMessage]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        currentPhase,
        isTyping,
        currentSteps,
        currentTicket,
        diagnosticResults,
        diagnosticProgress,
        currentIntent,
        sendMessage,
        markStepComplete,
        confirmResolution,
        grantSystemAccess,
        submitFeedback,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}