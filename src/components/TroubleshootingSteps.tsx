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
    <div className="space-y-2 mt-4">
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
                'rounded-xl border transition-all duration-200',
                step.completed
                  ? 'bg-success/10 border-success/30'
                  : 'bg-card border-border hover:border-primary/30'
              )}
            >
              <div className="flex items-center gap-3 p-3">
                {/* Step number / check */}
                <button
                  onClick={() => !step.completed && onComplete(step.id)}
                  disabled={step.completed}
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all',
                    step.completed
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted hover:bg-primary hover:text-primary-foreground cursor-pointer'
                  )}
                >
                  {step.completed ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{step.order}</span>
                  )}
                </button>

                {/* Step title */}
                <div className="flex-1 min-w-0">
                  <h4
                    className={cn(
                      'font-medium text-sm',
                      step.completed && 'line-through text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </h4>
                </div>

                {/* Expand button */}
                <CollapsibleTrigger asChild>
                  <button className="flex-shrink-0 p-1 rounded-md hover:bg-muted transition-colors">
                    <ChevronRight
                      className={cn(
                        'w-4 h-4 text-muted-foreground transition-transform duration-200',
                        expandedStep === step.id && 'rotate-90'
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                <div className="px-3 pb-3 pt-0">
                  <div className="ml-11 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  {!step.completed && (
                    <button
                      onClick={() => onComplete(step.id)}
                      className="ml-11 mt-3 text-sm text-primary font-medium hover:underline"
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
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Progress</span>
          <span>{steps.filter(s => s.completed).length} of {steps.length} complete</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-accent"
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