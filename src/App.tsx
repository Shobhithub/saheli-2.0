import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SOSProvider } from "@/contexts/SOSContext";
import { useState, useEffect } from "react";

// Components
import SplashScreen from "./components/SplashScreen";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import WelcomeSlides from "./pages/WelcomeSlides";
import Home from "./pages/Home";
import SOSActive from "./pages/SOSActive";
import Community from "./pages/Community";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import PoliceDashboard from "./pages/police/PoliceDashboard";
import PoliceAlerts from "./pages/police/PoliceAlerts";
import PoliceReports from "./pages/police/PoliceReports";
import PoliceOfficers from "./pages/police/PoliceOfficers";
import PoliceSettings from "./pages/police/PoliceSettings";
import NotFound from "./pages/NotFound";
import FakeCall from "./pages/FakeCall";
import SafeRoute from "./pages/SafeRoute";
import TravelCompanion from "./pages/TravelCompanion";
import Recording from "./pages/Recording";
import Transport from "./pages/Transport";
import Settings from "./pages/Settings";
import Helpline from "./pages/Helpline";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'police' ? '/police' : '/home'} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  // Check if user has seen welcome slides
  const hasSeenWelcome = localStorage.getItem('saheli_welcome_seen') === 'true';

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'police' ? '/police' : '/home'} /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/home" /> : <Register />} />
      <Route path="/welcome" element={<WelcomeSlides />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

      {/* Citizen Routes */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<ProtectedRoute allowedRoles={['user']}><Home /></ProtectedRoute>} />
      <Route path="/sos-active" element={<ProtectedRoute allowedRoles={['user']}><SOSActive /></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute allowedRoles={['user']}><Community /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute allowedRoles={['user']}><Reports /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/helpline" element={<ProtectedRoute><Helpline /></ProtectedRoute>} />

      {/* Feature Routes */}
      <Route path="/fake-call" element={<ProtectedRoute><FakeCall /></ProtectedRoute>} />
      <Route path="/safe-route" element={<ProtectedRoute><SafeRoute /></ProtectedRoute>} />
      <Route path="/travel-companion" element={<ProtectedRoute><TravelCompanion /></ProtectedRoute>} />
      <Route path="/recording" element={<ProtectedRoute><Recording /></ProtectedRoute>} />
      <Route path="/transport" element={<ProtectedRoute><Transport /></ProtectedRoute>} />

      {/* Police Routes */}
      <Route path="/police" element={<ProtectedRoute allowedRoles={['police']}><PoliceDashboard /></ProtectedRoute>} />
      <Route path="/police/alerts" element={<ProtectedRoute allowedRoles={['police']}><PoliceAlerts /></ProtectedRoute>} />
      <Route path="/police/reports" element={<ProtectedRoute allowedRoles={['police']}><PoliceReports /></ProtectedRoute>} />
      <Route path="/police/officers" element={<ProtectedRoute allowedRoles={['police']}><PoliceOfficers /></ProtectedRoute>} />
      <Route path="/police/settings" element={<ProtectedRoute allowedRoles={['police']}><PoliceSettings /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppWithSplash() {
  const [showSplash, setShowSplash] = useState(true);
  const hasSeenSplash = sessionStorage.getItem('saheli_splash_seen') === 'true';

  // Skip splash if already seen this session
  useEffect(() => {
    if (hasSeenSplash) {
      setShowSplash(false);
    }
  }, [hasSeenSplash]);

  const handleSplashComplete = () => {
    sessionStorage.setItem('saheli_splash_seen', 'true');
    setShowSplash(false);
  };

  if (showSplash && !hasSeenSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <BrowserRouter>
      <AppRoutesWithWelcome />
    </BrowserRouter>
  );
}

// Wrapper to handle welcome flow
function AppRoutesWithWelcome() {
  const { isAuthenticated } = useAuth();
  const [hasSeenWelcome, setHasSeenWelcome] = useState(() =>
    localStorage.getItem('saheli_welcome_seen') === 'true'
  );

  // Listen for localStorage changes (when welcome slides complete)
  useEffect(() => {
    const checkWelcome = () => {
      const seen = localStorage.getItem('saheli_welcome_seen') === 'true';
      setHasSeenWelcome(seen);
    };

    // Check periodically for changes
    const interval = setInterval(checkWelcome, 100);

    // Also listen for storage events
    window.addEventListener('storage', checkWelcome);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkWelcome);
    };
  }, []);

  // Show welcome slides for non-authenticated users who haven't seen it
  if (!isAuthenticated && !hasSeenWelcome) {
    return (
      <Routes>
        <Route path="*" element={<WelcomeSlides />} />
      </Routes>
    );
  }

  return <AppRoutes />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SOSProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppWithSplash />
        </TooltipProvider>
      </SOSProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

