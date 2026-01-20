import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Message, TroubleshootingStep, Ticket, DiagnosticResult, IntentCategory } from '@/types/support';
import { v4 } from '@/lib/utils';
import { classifyIntent, searchKnowledgeBase, getOSSpecificInstructions } from '@/services/knowledgeBase';
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

    // Add user message
    addMessage({ role: 'user', content });

    // Initial greeting or first message
    if (currentPhase === 'initial') {
      // Process intent
      const { intent, confidence } = await classifyIntent(content);
      setCurrentIntent(intent);
      console.log('[NLP] Classified intent:', intent, 'confidence:', confidence);

      if (intent === 'unknown' || confidence < 0.5) {
        await addAgentMessage(
          "I'd like to help you with your issue. Could you please describe the problem you're experiencing in more detail? For example:\n\n• No internet connection\n• Slow internet speed\n• WiFi not working\n• Device can't connect"
        );
        return;
      }

      // Search knowledge base
      const article = await searchKnowledgeBase(intent);
      
      if (article) {
        // Create ticket in background
        const ticket = await createTicket(user.id, intent, content);
        setCurrentTicket(ticket);
        await addAgentAction(ticket.id, {
          agentType: 'conversational',
          action: 'Intent classified and knowledge base article found',
          result: `Intent: ${intent}, Article: ${article.title}`,
          success: true,
        });

        // Prepare OS-specific steps
        const osSteps = article.steps.map(step => ({
          ...step,
          description: getOSSpecificInstructions(user.deviceOS, step),
        }));
        setCurrentSteps(osSteps);
        setCurrentPhase('troubleshooting');

        await addAgentMessage(
          `I understand you're having **${article.title.toLowerCase()}** issues. I'll guide you through some troubleshooting steps that should help resolve this.\n\nI've detected you're using **${user.deviceOS}**, so I'll provide specific instructions for your system.\n\nPlease follow these steps one by one and mark each as complete when you're done:`,
          {
            intent,
            confidence,
            troubleshootingSteps: osSteps,
          }
        );
      } else {
        await addAgentMessage(
          "I'm analyzing your issue. Let me gather some information to help you better. Could you tell me more about when this problem started and what you were doing when it occurred?"
        );
      }
      return;
    }

    // Handle follow-up messages during troubleshooting
    if (currentPhase === 'troubleshooting') {
      const lowerContent = content.toLowerCase();
      
      if (lowerContent.includes('done') || lowerContent.includes('finished') || lowerContent.includes('completed all')) {
        // Check if all steps are marked complete
        const allComplete = currentSteps.every(s => s.completed);
        
        if (allComplete) {
          setCurrentPhase('resolution_check');
          await addAgentMessage(
            "Great job completing all the troubleshooting steps! 🎉\n\n**Is your issue resolved now?**\n\nPlease let me know so I can either close this case or escalate to our advanced diagnostic tools.",
            { requiresAction: true, actionType: 'resolution_check' }
          );
        } else {
          await addAgentMessage(
            "It looks like not all steps are marked as complete yet. Please make sure to check off each step as you complete it, then let me know when you're done."
          );
        }
      } else if (lowerContent.includes('help') || lowerContent.includes('stuck') || lowerContent.includes("don't understand")) {
        await addAgentMessage(
          "I'm here to help! If you're stuck on a particular step, let me know which one and I can provide more detailed guidance. You can also click the step to see the full instructions."
        );
      } else if (lowerContent.includes('yes') || lowerContent.includes('fixed') || lowerContent.includes('working')) {
        // User indicates issue is resolved
        setCurrentPhase('resolution_check');
        await addAgentMessage(
          "**Is your issue resolved now?**\n\nPlease confirm so I can either close this case or escalate to our advanced diagnostic tools.",
          { requiresAction: true, actionType: 'resolution_check' }
        );
      } else {
        // Try to interpret user's issue and provide relevant guidance
        const { intent: followUpIntent } = await classifyIntent(content);
        
        if (followUpIntent !== 'unknown') {
          const article = await searchKnowledgeBase(followUpIntent);
          if (article) {
            await addAgentMessage(
              `I see you're also experiencing **${article.title.toLowerCase()}** issues. Let me adjust the troubleshooting steps accordingly.`
            );
            
            // Update steps with new article
            const osSteps = article.steps.map(step => ({
              ...step,
              description: getOSSpecificInstructions(user.deviceOS, step),
            }));
            setCurrentSteps(osSteps);
            
            await addAgentMessage(
              `Here are updated steps for **${article.title}**:\n\nPlease follow these steps one by one:`,
              { troubleshootingSteps: osSteps }
            );
          } else {
            await addAgentMessage(
              "I'm focusing on helping you with the original issue. Please let me know if you've completed the troubleshooting steps I provided, or if you're still experiencing problems."
            );
          }
        } else {
          await addAgentMessage(
            "I'm here while you work through the steps. Mark each step as complete when you finish it. If you need clarification on any step, just ask!\n\nHave you completed all the troubleshooting steps I provided?"
          );
        }
      }
      return;
    }

    // Handle messages during resolution check
    if (currentPhase === 'resolution_check') {
      const lowerContent = content.toLowerCase();
      
      if (lowerContent.includes('yes') || lowerContent.includes('fixed') || lowerContent.includes('working') || 
          lowerContent.includes('resolve') || lowerContent.includes('done')) {
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
      } else if (lowerContent.includes('no') || lowerContent.includes('still') || lowerContent.includes('not working') ||
                 lowerContent.includes('issue') || lowerContent.includes('problem')) {
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
        await addAgentMessage(
          "I'm checking if your issue is resolved. Please confirm with a simple 'yes' if it's fixed, or 'no' if you're still having problems."
        );
      }
      return;
    }

    // Handle messages during diagnostics
    if (currentPhase === 'diagnostics') {
      await addAgentMessage(
        "The diagnostic scan is currently running. Please wait while I analyze your connection. This usually takes 2-3 minutes."
      );
      return;
    }

    // Handle messages during feedback
    if (currentPhase === 'feedback') {
      await addAgentMessage(
        "Thank you for your patience! Please rate your experience using the form above so we can continue to improve our service."
      );
      return;
    }

    // Handle messages during escalated phase
    if (currentPhase === 'escalated') {
      await addAgentMessage(
        "Your case has been escalated to our human support team. An engineer will respond to you shortly. Is there anything else you'd like to add to your case?"
      );
      return;
    }

    // Default response for any other situation
    await addAgentMessage(
      "I'm here to help! Could you please describe the issue you're experiencing with your internet connection?"
    );
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
        await addAgentMessage(
          `Hello ${user.name}! 👋\n\nI'm your ISP Connect support assistant. I can help you with:\n\n• Internet connectivity issues\n• Slow speed problems\n• Router and WiFi troubleshooting\n• Device connection help\n\n**How can I assist you today?**`
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