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
      className="mt-4 p-5 glass rounded-2xl shadow-lg"
    >
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle className="w-5 h-5 text-cyan-400" />
        <h4 className="font-semibold text-white">Is your issue resolved?</h4>
      </div>
      
      <p className="text-sm text-gray-300 mb-4">
        Let me know if the troubleshooting steps helped fix your problem.
      </p>

      <div className="flex gap-3">
        <Button
          onClick={() => onConfirm(true)}
          className="flex-1 gap-2 gradient-accent shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 hover-lift"
        >
          <CheckCircle2 className="w-4 h-4" />
          Yes, it's fixed!
        </Button>
        <Button
          onClick={() => onConfirm(false)}
          variant="outline"
          className="flex-1 gap-2 glass-light hover:bg-white/10 transition-all duration-300 border-white/20 text-white hover-lift"
        >
          <XCircle className="w-4 h-4" />
          No, still having issues
        </Button>
      </div>
    </motion.div>
  );
}