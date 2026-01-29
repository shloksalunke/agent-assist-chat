import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Shield, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function PasswordReset() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'request' | 'reset'>('request');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send reset request');
      }

      const data = await response.json();
      setSuccess(data.message);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid reset link');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          token, 
          new_password: newPassword 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reset password');
      }

      const data = await response.json();
      setSuccess(data.message);
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 neural-network overflow-hidden">
      {/* Animated orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo and branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-primary shadow-2xl shadow-purple-500/30 mb-4 p-2 hover-lift mx-auto">
            <div className="w-full h-full rounded-2xl bg-black/20 backdrop-blur-sm flex items-center justify-center">
              <Wifi className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">ISP Genie</h1>
          <p className="text-gray-300">Password Reset</p>
        </motion.div>

        {/* Password Reset card - Glassmorphic panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="glass rounded-3xl p-6 shadow-2xl"
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-1">
              {step === 'request' ? 'Reset Password' : 'Set New Password'}
            </h2>
            <p className="text-gray-300 text-sm">
              {step === 'request' 
                ? 'Enter your email to receive a password reset link' 
                : 'Enter your new password'}
            </p>
          </div>

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm"
            >
              {success}
            </motion.div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10 h-11 glass-light border-0 focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-400 text-sm"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-xl p-3 border border-red-500/20"
                >
                  <span>{error}</span>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-base font-medium gradient-primary shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover-lift"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Reset Link...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-white text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10 h-11 glass-light border-0 focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-400 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-white text-sm">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 glass-light border-0 focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-400 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-white text-sm">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 glass-light border-0 focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-400 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-xl p-3 border border-red-500/20"
                >
                  <span>{error}</span>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-base font-medium gradient-primary shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover-lift"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Resetting Password...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          )}

          <div className="mt-4 text-center text-sm text-gray-400">
            <button 
              onClick={() => navigate('/')}
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              Back to Sign In
            </button>
          </div>

          {/* MCP Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 pt-4 border-t border-white/10"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Secured with ISP-Grade Security</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}