import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, ChevronRight, Info } from 'lucide-react';
import type { TroubleshootingStep } from '@/types/support';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TroubleshootingStepsProps {
  steps: TroubleshootingStep[];
  onComplete: (stepId: string) => void;
}

export function TroubleshootingSteps({ steps, onComplete }: TroubleshootingStepsProps) {
  const [expandedStep, setExpandedStep] = React.useState<string | null>(null);

  return (
    <div className="space-y-3 mt-4">
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Collapsible
            open={expandedStep === step.id}
            onOpenChange={(open) => setExpandedStep(open ? step.id : null)}
          >
            <div
              className={cn(
                'rounded-2xl border transition-all duration-300 shadow-lg hover-lift',
                step.completed
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'glass border-white/10'
              )}
            >
              <div className="flex items-center gap-3 p-3">
                {/* Step number / check */}
                <button
                  onClick={() => !step.completed && onComplete(step.id)}
                  disabled={step.completed}
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                    step.completed
                      ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                      : 'glass-light hover:bg-purple-500 hover:text-white cursor-pointer'
                  )}
                >
                  {step.completed ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium text-white">{step.order}</span>
                  )}
                </button>

                {/* Step title */}
                <div className="flex-1 min-w-0">
                  <h4
                    className={cn(
                      'font-medium text-sm',
                      step.completed && 'line-through text-gray-400'
                    )}
                  >
                    {step.title.replace(/^\d+\.\s*/, '')}
                  </h4>
                </div>

                {/* Expand button */}
                <CollapsibleTrigger asChild>
                  <button className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors">
                    <ChevronRight
                      className={cn(
                        'w-4 h-4 text-gray-400 transition-transform duration-200',
                        expandedStep === step.id && 'rotate-90 text-purple-400'
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                <div className="px-3 pb-3 pt-0">
                  <div className="ml-11 p-3 glass rounded-lg border border-white/10">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  {!step.completed && (
                    <button
                      onClick={() => onComplete(step.id)}
                      className="ml-11 mt-3 text-sm text-purple-400 font-medium hover:underline transition-colors"
                    >
                      Mark as complete
                    </button>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </motion.div>
      ))}

      {/* Progress indicator */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>Progress</span>
          <span>{steps.filter(s => s.completed).length} of {steps.length} complete</span>
        </div>
        <div className="h-2 glass rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-primary shadow-lg shadow-purple-500/30"
            initial={{ width: 0 }}
            animate={{
              width: `${(steps.filter(s => s.completed).length / steps.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}