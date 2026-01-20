import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Clock, Cpu, Loader2 } from 'lucide-react';
import type { DiagnosticResult } from '@/types/support';
import { cn } from '@/lib/utils';

interface LiveDiagnosticsProps {
  results: DiagnosticResult[];
  progress: Record<string, number>;
  isRunning: boolean;
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
  running: { icon: Loader2, color: 'text-primary', bg: 'bg-primary/10' },
  passed: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
};

export function LiveDiagnostics({ results, progress, isRunning }: LiveDiagnosticsProps) {
  return (
    <div className="mt-4 p-4 bg-card border border-border rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className={cn(
          'p-2 rounded-lg',
          isRunning ? 'gradient-diagnostic' : 'bg-muted'
        )}>
          <Cpu className={cn('w-5 h-5', isRunning ? 'text-white' : 'text-muted-foreground')} />
        </div>
        <div>
          <h4 className="font-semibold text-foreground">Autonomous Diagnostics</h4>
          <p className="text-xs text-muted-foreground">
            {isRunning ? 'Analyzing your connection...' : 'Scan complete'}
          </p>
        </div>
        {isRunning && (
          <div className="ml-auto">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Diagnostic results timeline */}
      <div className="space-y-2">
        {results.map((result, index) => {
          const config = statusConfig[result.status];
          const Icon = config.icon;

          return (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg transition-colors',
                config.bg
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0 mt-0.5',
                  config.color,
                  result.status === 'running' && 'animate-spin'
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{result.testName}</p>
                  <span className={cn('text-xs font-medium uppercase', config.color)}>
                    {result.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 break-words">
                  {result.details}
                </p>
                {result.autoFixAttempted && (
                  <p className={cn(
                    'text-xs mt-1',
                    result.autoFixSuccessful ? 'text-success' : 'text-warning'
                  )}>
                    {result.autoFixSuccessful
                      ? '✓ Auto-fix applied successfully'
                      : '○ Auto-fix attempted, manual review needed'}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Overall progress bar during scan */}
      {isRunning && Object.keys(progress).length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Overall Progress</span>
            <span>{Math.round(Object.values(progress).reduce((a, b) => a + b, 0) / 6)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full gradient-diagnostic transition-all duration-300"
              style={{
                width: `${Math.round(Object.values(progress).reduce((a, b) => a + b, 0) / 6)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
