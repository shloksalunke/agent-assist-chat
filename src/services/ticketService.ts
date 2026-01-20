import type { Ticket, TicketStatus, TicketPriority, IntentCategory, AgentAction, DiagnosticResult } from '@/types/support';
import { v4 as generateId } from '@/lib/utils';

// In-memory ticket store (simulated backend)
const ticketStore: Map<string, Ticket> = new Map();

export async function createTicket(
  userId: string,
  category: IntentCategory,
  description: string,
  priority: TicketPriority = 'medium'
): Promise<Ticket> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const ticket: Ticket = {
    id: `TKT-${Date.now().toString(36).toUpperCase()}`,
    userId,
    status: 'open',
    priority,
    category,
    description,
    createdAt: new Date(),
    updatedAt: new Date(),
    agentActions: [],
  };

  ticketStore.set(ticket.id, ticket);
  console.log('[TicketService] Created ticket:', ticket.id);

  return ticket;
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
): Promise<Ticket | null> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const ticket = ticketStore.get(ticketId);
  if (!ticket) return null;

  ticket.status = status;
  ticket.updatedAt = new Date();
  
  if (status === 'resolved' || status === 'closed') {
    ticket.resolvedAt = new Date();
  }

  ticketStore.set(ticketId, ticket);
  console.log('[TicketService] Updated ticket status:', ticketId, status);

  return ticket;
}

export async function addAgentAction(
  ticketId: string,
  action: Omit<AgentAction, 'id' | 'timestamp'>
): Promise<Ticket | null> {
  await new Promise(resolve => setTimeout(resolve, 100));

  const ticket = ticketStore.get(ticketId);
  if (!ticket) return null;

  const agentAction: AgentAction = {
    id: generateId(),
    timestamp: new Date(),
    ...action,
  };

  ticket.agentActions.push(agentAction);
  ticket.updatedAt = new Date();
  ticketStore.set(ticketId, ticket);

  console.log('[TicketService] Added agent action:', ticketId, action.action);

  return ticket;
}

export async function addDiagnosticResults(
  ticketId: string,
  results: DiagnosticResult[]
): Promise<Ticket | null> {
  await new Promise(resolve => setTimeout(resolve, 100));

  const ticket = ticketStore.get(ticketId);
  if (!ticket) return null;

  ticket.diagnosticResults = results;
  ticket.updatedAt = new Date();
  ticketStore.set(ticketId, ticket);

  console.log('[TicketService] Added diagnostic results:', ticketId);

  return ticket;
}

export async function escalateTicket(ticketId: string): Promise<Ticket | null> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const ticket = ticketStore.get(ticketId);
  if (!ticket) return null;

  ticket.status = 'escalated';
  ticket.priority = 'high';
  ticket.updatedAt = new Date();
  
  // Add escalation action
  ticket.agentActions.push({
    id: generateId(),
    agentType: 'diagnostic',
    action: 'Escalated to human engineer',
    timestamp: new Date(),
    result: 'Ticket assigned to support queue',
    success: true,
  });

  ticketStore.set(ticketId, ticket);
  console.log('[TicketService] Escalated ticket:', ticketId);

  return ticket;
}

export async function getTicket(ticketId: string): Promise<Ticket | null> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return ticketStore.get(ticketId) || null;
}

export async function getUserTickets(userId: string): Promise<Ticket[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return Array.from(ticketStore.values()).filter(t => t.userId === userId);
}

export async function closeTicket(ticketId: string): Promise<Ticket | null> {
  return updateTicketStatus(ticketId, 'closed');
}
