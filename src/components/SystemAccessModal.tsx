import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldCheck, ShieldX, Lock, Activity, Wifi, HardDrive, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface SystemAccessModalProps {
  open: boolean;
  onResponse: (granted: boolean) => void;
}

const accessScopes = [
  { icon: Activity, label: 'Network diagnostics', description: 'Check connection quality and latency' },
  { icon: Wifi, label: 'WiFi configuration', description: 'Analyze wireless settings and channels' },
  { icon: HardDrive, label: 'Device information', description: 'Read system and hardware details' },
  { icon: Settings, label: 'Network settings', description: 'Apply safe optimizations' },
];

export function SystemAccessModal({ open, onResponse }: SystemAccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            System Access Required
          </DialogTitle>
          <DialogDescription>
            Our Autonomous Diagnostic Agent needs temporary access to analyze your connection.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* What we'll access */}
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-foreground">What we'll access:</h4>
            {accessScopes.map((scope, index) => (
              <motion.div
                key={scope.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <scope.icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">{scope.label}</p>
                  <p className="text-xs text-muted-foreground">{scope.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Security notice */}
          <div className="flex items-start gap-3 p-4 bg-success/10 border border-success/30 rounded-lg mb-6">
            <Lock className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Your data is secure</p>
              <p className="text-xs text-muted-foreground">
                All diagnostics run locally. We only collect anonymous performance metrics.
                Access is revoked automatically after the session ends.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => onResponse(true)}
              className="flex-1 gap-2 gradient-accent hover:opacity-90"
            >
              <ShieldCheck className="w-4 h-4" />
              Grant Access
            </Button>
            <Button
              onClick={() => onResponse(false)}
              variant="outline"
              className="flex-1 gap-2"
            >
              <ShieldX className="w-4 h-4" />
              Decline
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
