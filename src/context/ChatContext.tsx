import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Message, TroubleshootingStep, Ticket, DiagnosticResult, IntentCategory, KnowledgeBaseArticle } from '@/types/support';
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
  const [sessionId] = useState<string>(() => v4());

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

  // Fetch response from LLM backend
  const fetchLLMResponse = useCallback(async (content: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          session_id: sessionId,
          user_id: user?.id || 'anonymous'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return {
          reply: data.reply,
          intent_category: data.intent_category,
          steps: data.steps
        };
      } else {
        throw new Error('LLM response not successful');
      }
    } catch (error) {
      console.error('Error fetching LLM response:', error);
      return {
        reply: "I'm having trouble processing your request right now. Could you please try again?",
        intent_category: "unknown",
        steps: []
      };
    }
  }, [sessionId, user]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !mcpContext) return;

    // Add user message locally
    addMessage({ role: 'user', content });

    // Handle different phases
    if (currentPhase === 'initial') {
      // Get response from LLM
      setIsTyping(true);
      const llmResponse = await fetchLLMResponse(content);
      setIsTyping(false);
      
      if (llmResponse.steps && llmResponse.steps.length > 0) {
        // Set steps from LLM response
        const stepsWithIds = llmResponse.steps.map((step: any, index: number) => ({
          id: `step-${Date.now()}-${index}`,
          title: step.title,
          description: step.description,
          completed: false,
          order: index + 1
        }));
        
        setCurrentSteps(stepsWithIds);
        setCurrentPhase('troubleshooting');
        setCurrentIntent(llmResponse.intent_category as IntentCategory);
        
        // Create a ticket for this issue
        const ticket = await createTicket(user.id, llmResponse.intent_category as IntentCategory, content);
        setCurrentTicket(ticket);
        
        await addAgentMessage(
          `I understand you're having an issue. Please follow the troubleshooting steps shown below and mark each step as complete.`
        );
      } else {
        await addAgentMessage(
          "I'm not sure I understand your issue. Could you please describe your internet problem in more detail? For example:\n\n" +
          "• My internet is not working\n" +
          "• The speed is very slow\n" +
          "• My device won't connect to WiFi"
        );
      }
    } 
    else if (currentPhase === 'resolution_check') {
      const lower = content.toLowerCase();
      if (lower.includes('yes') || lower.includes('fixed') || lower.includes('working') || lower.includes('resolve') || lower.includes('done')) {
        // Issue resolved - close ticket and show feedback
        if (currentTicket) {
          await updateTicketStatus(currentTicket.id, 'resolved');
          await addAgentAction(currentTicket.id, {
            agentType: 'conversational',
            action: 'User confirmed issue resolved via self-help',
            success: true,
          });
        }

        addSystemMessage('✅ Issue marked as resolved');
        setCurrentPhase('feedback');
        
        await addAgentMessage(
          "Wonderful! I'm glad we could resolve your issue through the troubleshooting steps. 🎉\n\nBefore we close this case, would you mind sharing your feedback? It helps us improve our support service.",
          { requiresAction: true, actionType: 'feedback' }
        );
      } else if (lower.includes('no') || lower.includes('still') || lower.includes('not working') || lower.includes('problem')) {
        // Issue not resolved - request system access for diagnostics
        if (currentTicket) {
          await addAgentAction(currentTicket.id, {
            agentType: 'conversational',
            action: 'Self-help unsuccessful, initiating diagnostic agent',
            success: true,
          });
        }

        setCurrentPhase('system_access');
        setActiveAgent('diagnostic');
        
        await addAgentMessage(
          "I'm sorry the troubleshooting steps didn't resolve your issue. Let me switch to our **Autonomous Diagnostic Agent** which can perform a deeper analysis of your connection.\n\nTo do this, I'll need temporary access to run diagnostic tests on your network. This is completely safe and secure.",
          { requiresAction: true, actionType: 'system_access' }
        );
      } else {
        // User provided additional information instead of yes/no
        await addAgentMessage(
          "I'm checking if your issue is resolved. Please answer with either:\n\n• Yes (if your issue is fixed)\n• No (if you're still experiencing problems)"
        );
      }
    }
    else if (currentPhase === 'troubleshooting') {
      // During troubleshooting, guide user to complete steps
      await addAgentMessage(
        "Please follow the troubleshooting steps shown below and mark each step as complete. Let me know if you need clarification on any step."
      );
    }
    else {
      // Default response for other phases
      await addAgentMessage("How can I assist you further with your internet connection issue?");
    }
  }, [user, mcpContext, currentPhase, currentSteps, currentTicket, addMessage, addAgentMessage, addSystemMessage, setActiveAgent, fetchLLMResponse, sessionId]);

  const markStepComplete = useCallback((stepId: string) => {
    setCurrentSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, completed: true } : step
      )
    );
    
    // Check if all steps are completed
    const updatedSteps = currentSteps.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    );
    
    const allCompleted = updatedSteps.every(step => step.completed);
    
    if (allCompleted && currentPhase === 'troubleshooting') {
      setCurrentPhase('resolution_check');
      addMessage({
        role: 'agent',
        content: 'Have you completed all the troubleshooting steps? Is your issue resolved?',
        agentType: mcpContext?.agentOrchestration.activeAgent || 'conversational',
        metadata: { requiresAction: true, actionType: 'resolution_check' }
      });
    }
  }, [currentSteps, currentPhase, addMessage, mcpContext]);

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
        await addAgentMessage(
          `Hi ${user.name}! 👋 Welcome to ISP Connect Support.\n\nI'm here to help you troubleshoot your internet connection issues. What seems to be the problem with your connection today?\n\nYou can tell me things like:\n• My internet is not working\n• The speed is very slow\n• My device won't connect to WiFi`
        );
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