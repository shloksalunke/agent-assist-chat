import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Wifi, LogOut, Loader2, Phone, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChat, ChatProvider } from '@/context/ChatContext';
import { AgentBadge } from '@/components/AgentBadge';
import { TroubleshootingSteps } from '@/components/TroubleshootingSteps';
import { ResolutionCheck } from '@/components/ResolutionCheck';
import { SystemAccessModal } from '@/components/SystemAccessModal';
import { LiveDiagnostics } from '@/components/LiveDiagnostics';
import { FeedbackForm } from '@/components/FeedbackForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatTime } from '@/lib/utils';
import type { Message } from '@/types/support';

function ChatMessage({ message, showSteps }: { message: Message; showSteps?: boolean }) {
  const { currentSteps, markStepComplete } = useChat();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-2"
      >
        <div className="px-3 py-1.5 bg-chat-system rounded-full text-xs text-muted-foreground">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3 mb-4', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-medium',
          isUser ? 'gradient-primary' : 'gradient-accent'
        )}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Message content */}
      <div className={cn('flex-1 max-w-[80%]', isUser && 'text-right')}>
        {/* Agent badge for agent messages */}
        {!isUser && message.agentType && (
          <div className="mb-1">
            <AgentBadge type={message.agentType} size="sm" />
          </div>
        )}

        <div
          className={cn(
            'inline-block rounded-2xl px-4 py-2.5 text-sm message-bubble',
            isUser
              ? 'bg-chat-user text-primary-foreground rounded-tr-sm'
              : 'bg-chat-agent border border-border text-foreground rounded-tl-sm'
          )}
        >
          <div className="whitespace-pre-wrap leading-relaxed">
            {message.content.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={i} className="font-semibold">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
          </div>
        </div>

        {/* Timestamp */}
        <p className={cn('text-xs text-muted-foreground mt-1 msg-timestamp', isUser && 'text-right')}>
          {formatTime(message.timestamp)}
        </p>

        {/* Troubleshooting steps */}
        {showSteps && currentSteps.length > 0 && !isUser && (
          <TroubleshootingSteps steps={currentSteps} onComplete={markStepComplete} />
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 mb-4"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-full gradient-accent flex items-center justify-center text-white font-medium">
        AI
      </div>
      <div className="bg-chat-agent border border-border rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </motion.div>
  );
}

function ChatInterfaceContent() {
  const { user, mcpContext, logout } = useAuth();
  const {
    messages,
    currentPhase,
    isTyping,
    currentSteps,
    diagnosticResults,
    diagnosticProgress,
    sendMessage,
    confirmResolution,
    grantSystemAccess,
    submitFeedback,
    startNewConversation,
    assignEngineer,
  } = useChat();

  // Theme toggle state (persist across reloads using localStorage)
  const [isCyberpunk, setIsCyberpunk] = useState<boolean>(() => {
    try {
      return localStorage.getItem('theme') === 'cyberpunk';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isCyberpunk) {
        document.documentElement.setAttribute('data-theme', 'cyberpunk');
        localStorage.setItem('theme', 'cyberpunk');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'default');
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [isCyberpunk]);

  const toggleTheme = () => setIsCyberpunk(prev => !prev);

  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    const message = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    await sendMessage(message);
    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Find the last message with troubleshooting steps
  const lastStepsMessageIndex = [...messages]
    .reverse()
    .findIndex((m) => m.metadata?.troubleshootingSteps);
  const stepsMessageIndex =
    lastStepsMessageIndex >= 0 ? messages.length - 1 - lastStepsMessageIndex : -1;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex-shrink-0 h-16 border-b border-border bg-card px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">ISP Connect Support</h1>
            <p className="text-xs text-muted-foreground">AI-Powered Assistance</p>
            <div className="network-status mt-1">
              <span className="dot" aria-hidden />
              <span className="ml-2 text-xs">Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Active Agent Badge */}
          {mcpContext && (
            <AgentBadge
              type={mcpContext.agentOrchestration.activeAgent}
              isActive
              size="sm"
            />
          )}

          {/* User info & logout */}
          <div className="flex items-center gap-3">
            {/* Theme toggle button */}
            <Button
              onClick={toggleTheme}
              className="btn mr-2"
              variant="ghost"
            >
              {isCyberpunk ? 'Disable Cyberpunk Mode' : 'Enable Cyberpunk Mode'}
            </Button>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.plan}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Chat messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                showSteps={index === stepsMessageIndex && currentPhase === 'troubleshooting'}
              />
            ))}

            {isTyping && <TypingIndicator />}
          </AnimatePresence>

          {/* Resolution check */}
          {currentPhase === 'resolution_check' && currentSteps.every((s) => s.completed) && (
            <ResolutionCheck onConfirm={confirmResolution} />
          )}

          {/* Live diagnostics */}
          {(currentPhase === 'diagnostics' || (diagnosticResults.length > 0 && currentPhase !== 'engineer_assigned')) &&
            currentPhase !== 'feedback' &&
            currentPhase !== 'closed' && (
              <LiveDiagnostics
                results={diagnosticResults}
                progress={diagnosticProgress}
                isRunning={currentPhase === 'diagnostics'}
              />
            )}

          {/* Feedback form */}
          {currentPhase === 'feedback' && <FeedbackForm onSubmit={submitFeedback} />}
          
          {/* Engineer assigned message */}
          {currentPhase === 'engineer_assigned' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-5 bg-card border border-border rounded-xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-foreground">Engineer Assigned</h4>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                An engineer has been assigned to resolve your issue. They will contact you shortly at the provided number.
              </p>
              
              <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Contact Information</p>
                  <p className="text-xs text-muted-foreground">Engineer Mobile: +1 (555) 123-4567</p>
                </div>
              </div>
              
              <Button
                onClick={() => sendMessage('ask query')}
                className="w-full gap-2 gradient-accent hover:opacity-90"
              >
                Ask Query
              </Button>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* System Access Modal */}
      <SystemAccessModal
        open={currentPhase === 'system_access'}
        onResponse={grantSystemAccess}
      />

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-border bg-card p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                currentPhase === 'closed'
                  ? 'This conversation has ended. Start a new one to get help.'
                  : currentPhase === 'engineer_assigned'
                  ? 'Type "ask query" to start a new conversation...'
                  : 'Type your message...'
              }
              disabled={currentPhase === 'closed' || isSending}
              className="flex-1 h-12 bg-background chat-input"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending || currentPhase === 'closed'}
              className="h-12 w-12 gradient-primary hover:opacity-90"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Quick hints */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                'My internet is not working',
                'The speed is very slow',
                "My device won't connect to WiFi",
              ].map((hint) => (
                <button
                  key={hint}
                  onClick={() => setInputValue(hint)}
                  className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 text-muted-foreground rounded-full transition-colors"
                >
                  {hint}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatInterface() {
  return (
    <ChatProvider>
      <ChatInterfaceContent />
    </ChatProvider>
  );
}