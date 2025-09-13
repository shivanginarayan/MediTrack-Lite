import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { Dashboard } from '../components/dashboard/Dashboard';
import { LoginForm } from '../components/auth/LoginForm';
import { Layout } from '../components/layout/Layout';

// Placeholder components for missing routes
import InventoryPage from '@/components/inventory/InventoryPage'
import AIAssistant from '@/pages/AIAssistant'

function AlertsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  console.log('AlertsPage navigation handler:', onNavigate);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Alerts</h1>
      <p>Alerts and notifications will be displayed here.</p>
    </div>
  );
}

function MessagesPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  console.log('MessagesPage navigation handler:', onNavigate);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      <p>Message center functionality will be implemented here.</p>
    </div>
  );
}

function SettingsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  console.log('SettingsPage navigation handler:', onNavigate);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p>Application settings will be available here.</p>
    </div>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogin = async (credentials: { email: string; password: string }) => {
    // Simple demo authentication
    console.log('Login attempt:', credentials);
    
    // Demo validation
    const validCredentials = [
      { email: 'admin@meditrack-demo.com', password: 'demo123' },
      { email: 'lead@meditrack-demo.com', password: 'demo123' },
      { email: 'staff@meditrack-demo.com', password: 'demo123' }
    ];
    
    const isValid = validCredentials.some(
      cred => cred.email === credentials.email && cred.password === credentials.password
    );
    
    if (isValid) {
      navigate('/dashboard');
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const handleLogout = () => {
    navigate('/login');
  };

  // If on login page, show login form without layout
  if (location.pathname === '/login') {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Otherwise show layout with content
  return (
    <Layout 
      title="MediTrack Dashboard" 
      currentPath={location.pathname}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      <Routes>
        <Route path="/" element={<Dashboard onNavigate={handleNavigate} />} />
        <Route path="/dashboard" element={<Dashboard onNavigate={handleNavigate} />} />
        <Route path="/inventory" element={<InventoryPage onNavigate={handleNavigate} />} />
        <Route path="/alerts" element={<AlertsPage onNavigate={handleNavigate} />} />
        <Route path="/messages" element={<MessagesPage onNavigate={handleNavigate} />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/settings" element={<SettingsPage onNavigate={handleNavigate} />} />
      </Routes>
    </Layout>
  );
}

export function AppRouter() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default AppRouter;