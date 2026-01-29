import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Shield, Loader2, Mail, Lock, Eye, EyeOff, User, HardDrive } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

export function Signup() {
  const navigate = useNavigate();
  const { isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    accountNumber: '',
    plan: 'Premium Fiber 500Mbps',
    deviceOS: 'Windows'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:8000/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          account_number: formData.accountNumber,
          plan: formData.plan,
          device_os: formData.deviceOS
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Signup failed');
      }

      const data = await response.json();
      
      // Store token in localStorage
      localStorage.setItem('authToken', data.access_token);
      
      setSuccess('Account created successfully! Redirecting to chat...');
      
      // Redirect to chat after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to create account. Please try again.');
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
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl gradient-primary shadow-2xl shadow-purple-500/30 mb-4 p-2 hover-lift mx-auto">
            <div className="w-full h-full rounded-2xl bg-black/20 backdrop-blur-sm flex items-center justify-center">
              <Wifi className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">ISP Genie</h1>
          <p className="text-gray-300">Create your account</p>
        </motion.div>

        {/* Signup card - Glassmorphic panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="glass rounded-3xl p-6 shadow-2xl"
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-1">Create Account</h2>
            <p className="text-gray-300 text-sm">Join our AI-powered support platform</p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white text-sm">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="pl-10 h-11 glass-light border-0 focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-400 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="pl-10 h-11 glass-light border-0 focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-400 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white text-sm">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
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
              <Label htmlFor="accountNumber" className="text-white text-sm">Account Number</Label>
              <div className="relative">
                <HardDrive className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="accountNumber"
                  name="accountNumber"
                  type="text"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="ACC-2024-XXXXX"
                  className="pl-10 h-11 glass-light border-0 focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-400 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan" className="text-white text-sm">Plan</Label>
              <select
                id="plan"
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                className="w-full h-11 glass-light border-0 focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-400 text-sm rounded-md px-3"
              >
                <option value="Premium Fiber 500Mbps">Premium Fiber 500Mbps</option>
                <option value="Standard Cable 100Mbps">Standard Cable 100Mbps</option>
                <option value="Basic DSL 25Mbps">Basic DSL 25Mbps</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deviceOS" className="text-white text-sm">Device OS</Label>
              <select
                id="deviceOS"
                name="deviceOS"
                value={formData.deviceOS}
                onChange={handleChange}
                className="w-full h-11 glass-light border-0 focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-400 text-sm rounded-md px-3"
              >
                <option value="Windows">Windows</option>
                <option value="macOS">macOS</option>
                <option value="Linux">Linux</option>
                <option value="iOS">iOS</option>
                <option value="Android">Android</option>
              </select>
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
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/')}
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              Sign in
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