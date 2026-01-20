import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResolutionCheckProps {
  onConfirm: (resolved: boolean) => void;
}

export function ResolutionCheck({ onConfirm }: ResolutionCheckProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 bg-card border border-border rounded-xl"
    >
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle className="w-5 h-5 text-primary" />
        <h4 className="font-semibold text-foreground">Is your issue resolved?</h4>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Let me know if the troubleshooting steps helped fix your problem.
      </p>

      <div className="flex gap-3">
        <Button
          onClick={() => onConfirm(true)}
          className="flex-1 gap-2 gradient-accent hover:opacity-90"
        >
          <CheckCircle2 className="w-4 h-4" />
          Yes, it's fixed!
        </Button>
        <Button
          onClick={() => onConfirm(false)}
          variant="outline"
          className="flex-1 gap-2"
        >
          <XCircle className="w-4 h-4" />
          No, still having issues
        </Button>
      </div>
    </motion.div>
  );
}
