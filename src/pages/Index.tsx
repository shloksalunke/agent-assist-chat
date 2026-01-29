import { useAuth, AuthProvider } from '@/context/AuthContext';
import { Login } from '@/components/Login';
import { ChatInterface } from '@/components/ChatInterface';
import { Signup } from '@/components/Signup';
import { PasswordReset } from '@/components/PasswordReset';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Parse query parameters to determine if we're resetting password
  const queryParams = new URLSearchParams(location.search);
  const isReset = queryParams.has('token');

  if (!isAuthenticated) {
    if (location.pathname === '/signup') {
      return <Signup />;
    }
    if (location.pathname === '/reset-password' || isReset) {
      return <PasswordReset />;
    }
    return <Login />;
  }

  return <ChatInterface />;
}

const Index = () => {
  return <AppContent />;
};

export default Index;