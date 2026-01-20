import { useAuth, AuthProvider } from '@/context/AuthContext';
import { Login } from '@/components/Login';
import { ChatInterface } from '@/components/ChatInterface';

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <ChatInterface />;
}

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
