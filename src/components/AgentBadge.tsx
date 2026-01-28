import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Cpu, BarChart3 } from 'lucide-react';
import type { AgentType } from '@/types/support';
import { cn } from '@/lib/utils';

interface AgentBadgeProps {
  type: AgentType;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const agentConfig: Record<AgentType, { label: string; icon: typeof Bot; colorClass: string; glowClass: string }> = {
  conversational: {
    label: 'Conversational Agent',
    icon: Bot,
    colorClass: 'bg-agent-conversational',
    glowClass: 'shadow-purple-500/30',
  },
  diagnostic: {
    label: 'Diagnostic Agent',
    icon: Cpu,
    colorClass: 'bg-agent-diagnostic',
    glowClass: 'shadow-cyan-500/30',
  },
  analytics: {
    label: 'Analytics Agent',
    icon: BarChart3,
    colorClass: 'bg-agent-analytics',
    glowClass: 'shadow-pink-500/30',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-1 gap-1 rounded-lg',
  md: 'text-sm px-3 py-1.5 gap-1.5 rounded-xl',
  lg: 'text-base px-4 py-2 gap-2 rounded-2xl',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function AgentBadge({ type, isActive = false, size = 'md' }: AgentBadgeProps) {
  const config = agentConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center font-medium text-white shadow-lg transition-all duration-300 hover-lift',
        sizeClasses[size],
        config.colorClass,
        isActive && config.glowClass,
        isActive && 'animate-pulse-slow'
      )}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
      {isActive && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
      )}
    </motion.div>
  );
}

interface AgentStatusProps {
  activeAgent: AgentType;
  availableAgents: AgentType[];
}

export function AgentStatus({ activeAgent, availableAgents }: AgentStatusProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {availableAgents.map((agent) => (
        <AgentBadge
          key={agent}
          type={agent}
          isActive={agent === activeAgent}
          size="sm"
        />
      ))}
    </div>
  );
}