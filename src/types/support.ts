// Core Types for ISP Customer Support System

export type AgentType = 'conversational' | 'diagnostic' | 'analytics';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'escalated' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export type IntentCategory = 
  | 'internet_connectivity'
  | 'slow_speed'
  | 'router_issues'
  | 'device_problems'
  | 'billing'
  | 'general_inquiry'
  | 'unknown';

export interface User {
  id: string;
  email: string;
  name: string;
  accountNumber: string;
  plan: string;
  deviceOS: 'Windows' | 'macOS' | 'Linux' | 'iOS' | 'Android';
}

export interface MCPContext {
  userId: string;
  sessionId: string;
  conversationHistory: Message[];
  userPreferences: Record<string, unknown>;
  agentOrchestration: {
    activeAgent: AgentType;
    availableAgents: AgentType[];
    escalationPath: AgentType[];
  };
  initialized: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  agentType?: AgentType;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  intent?: IntentCategory;
  confidence?: number;
  troubleshootingSteps?: TroubleshootingStep[];
  requiresAction?: boolean;
  actionType?: 'resolution_check' | 'system_access' | 'feedback' | 'escalation';
}

export interface TroubleshootingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  category: IntentCategory;
  content: string;
  steps: TroubleshootingStep[];
  keywords: string[];
}

export interface Ticket {
  id: string;
  userId: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: IntentCategory;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  agentActions: AgentAction[];
  diagnosticResults?: DiagnosticResult[];
}

export interface AgentAction {
  id: string;
  agentType: AgentType;
  action: string;
  timestamp: Date;
  result?: string;
  success?: boolean;
}

export interface DiagnosticResult {
  id: string;
  testName: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  details: string;
  timestamp: Date;
  autoFixAttempted?: boolean;
  autoFixSuccessful?: boolean;
}

export interface DiagnosticTest {
  id: string;
  name: string;
  description: string;
  duration: number; // in ms
  order: number;
}

export interface FeedbackData {
  ticketId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  resolvedBySelfHelp: boolean;
  resolvedByDiagnostics: boolean;
  escalatedToHuman: boolean;
}

export interface SystemAccessRequest {
  granted: boolean;
  scope: string[];
  timestamp: Date;
}
