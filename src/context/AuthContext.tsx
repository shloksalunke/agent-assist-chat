import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, MCPContext, AgentType, Message } from '@/types/support';
import { v4 } from '@/lib/utils';

interface AuthContextType {
  user: User | null;
  mcpContext: MCPContext | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateMCPContext: (updates: Partial<MCPContext>) => void;
  addToConversationHistory: (message: Message) => void;
  setActiveAgent: (agent: AgentType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mcpContext, setMCPContext] = useState<MCPContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initializeMCP = useCallback((authenticatedUser: User): MCPContext => {
    console.log('[MCP] Initializing context for user:', authenticatedUser.id);
    
    const context: MCPContext = {
      userId: authenticatedUser.id,
      sessionId: v4(),
      conversationHistory: [],
      userPreferences: {
        os: authenticatedUser.deviceOS,
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      agentOrchestration: {
        activeAgent: 'conversational',
        availableAgents: ['conversational', 'diagnostic', 'analytics'],
        escalationPath: ['conversational', 'diagnostic', 'analytics'],
      },
      initialized: true,
    };

    console.log('[MCP] Context initialized:', context.sessionId);
    return context;
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Get user details from the mock database
      const mockUsers: Record<string, User> = {
        'demo@ispconnect.com': {
          id: 'user-001',
          email: 'demo@ispconnect.com',
          name: 'Alex Johnson',
          accountNumber: 'ACC-2024-78456',
          plan: 'Premium Fiber 500Mbps',
          deviceOS: 'Windows',
        },
        'john@example.com': {
          id: 'user-002',
          email: 'john@example.com',
          name: 'John Smith',
          accountNumber: 'ACC-2024-12345',
          plan: 'Standard Cable 100Mbps',
          deviceOS: 'macOS',
        },
      };

      const authenticatedUser = mockUsers[email.toLowerCase()];
      if (!authenticatedUser) {
        throw new Error('User not found');
      }

      console.log('[Auth] Login successful for:', email);
      setUser(authenticatedUser);
      
      // Initialize MCP context after successful login
      const context = initializeMCP(authenticatedUser);
      setMCPContext(context);
      
      // Store token in localStorage
      localStorage.setItem('authToken', data.access_token);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.log('[Auth] Login failed for:', email);
      setIsLoading(false);
      return false;
    }
  }, [initializeMCP]);

  const logout = useCallback(() => {
    console.log('[Auth] Logging out user:', user?.id);
    console.log('[MCP] Destroying session:', mcpContext?.sessionId);
    setUser(null);
    setMCPContext(null);
    localStorage.removeItem('authToken');
  }, [user, mcpContext]);

  const updateMCPContext = useCallback((updates: Partial<MCPContext>) => {
    setMCPContext(prev => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);

  const addToConversationHistory = useCallback((message: Message) => {
    setMCPContext(prev => {
      if (!prev) return null;
      return {
        ...prev,
        conversationHistory: [...prev.conversationHistory, message],
      };
    });
  }, []);

  const setActiveAgent = useCallback((agent: AgentType) => {
    console.log('[MCP] Switching active agent to:', agent);
    setMCPContext(prev => {
      if (!prev) return null;
      return {
        ...prev,
        agentOrchestration: {
          ...prev.agentOrchestration,
          activeAgent: agent,
        },
      };
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        mcpContext,
        isAuthenticated: !!user && !!mcpContext?.initialized,
        isLoading,
        login,
        logout,
        updateMCPContext,
        addToConversationHistory,
        setActiveAgent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}