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
  pending: { icon: Clock, color: 'text-gray-400', bg: 'glass' },
  running: { icon: Loader2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  passed: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
};

export function LiveDiagnostics({ results, progress, isRunning }: LiveDiagnosticsProps) {
  return (
    <div className="mt-4 p-5 glass rounded-2xl shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          'p-2 rounded-xl',
          isRunning ? 'gradient-primary shadow-lg shadow-purple-500/30' : 'glass'
        )}>
          <Cpu className={cn('w-5 h-5', isRunning ? 'text-white' : 'text-gray-400')} />
        </div>
        <div>
          <h4 className="font-semibold text-white">Autonomous Diagnostics</h4>
          <p className="text-xs text-gray-300">
            {isRunning ? 'Analyzing your connection...' : 'Scan complete'}
          </p>
        </div>
        {isRunning && (
          <div className="ml-auto">
            <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Diagnostic results timeline */}
      <div className="space-y-3">
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
                'flex items-start gap-3 p-3 rounded-xl transition-colors border border-white/10 shadow-lg',
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
                  <p className="text-sm font-medium text-white">{result.testName}</p>
                  <span className={cn('text-xs font-medium uppercase', config.color)}>
                    {result.status}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1 break-words">
                  {result.details}
                </p>
                {result.autoFixAttempted && (
                  <p className={cn(
                    'text-xs mt-1',
                    result.autoFixSuccessful ? 'text-green-400' : 'text-yellow-400'
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
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round(Object.values(progress).reduce((a, b) => a + b, 0) / 6)}%</span>
          </div>
          <div className="h-1.5 glass rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary transition-all duration-300 shadow-lg shadow-purple-500/30"
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