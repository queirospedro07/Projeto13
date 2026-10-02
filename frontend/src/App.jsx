import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './components/ui/Toast';
import { ActiveCallProvider } from './context/ActiveCallContext';
import { AppLayout } from './components/layout/AppLayout';
import { CookieConsent } from './components/common/CookieConsent';
import { trackPageView } from './utils/analytics';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { IncomingCallModal } from './components/call/IncomingCallModal';
import { CallRoomModal } from './components/call/CallRoomModal';
import { useLocation } from 'react-router-dom';

const lazyPage = (loadPage, exportName) => React.lazy(() =>
  loadPage().then((module) => ({ default: module[exportName] }))
);

const LandingPage = lazyPage(() => import('./pages/LandingPage'), 'LandingPage');
const Login = lazyPage(() => import('./pages/auth/Login'), 'Login');
const Register = lazyPage(() => import('./pages/auth/Register'), 'Register');
const ForgotPassword = lazyPage(() => import('./pages/auth/ForgotPassword'), 'ForgotPassword');
const ResetPassword = lazyPage(() => import('./pages/auth/ResetPassword'), 'ResetPassword');
const Dashboard = lazyPage(() => import('./pages/Dashboard'), 'Dashboard');
const CourseDetails = lazyPage(() => import('./pages/CourseDetails'), 'CourseDetails');
const CoursePlayer = lazyPage(() => import('./pages/learn/CoursePlayer'), 'CoursePlayer');
const DiscoverSpaces = lazyPage(() => import('./pages/community/DiscoverSpaces'), 'DiscoverSpaces');
const SpaceChat = lazyPage(() => import('./pages/community/SpaceChat'), 'SpaceChat');
const LibraryPage = lazyPage(() => import('./pages/LibraryPage'), 'LibraryPage');
const CreatorDashboard = lazyPage(() => import('./pages/creator/CreatorDashboard'), 'CreatorDashboard');
const CourseBuilder = lazyPage(() => import('./pages/creator/CourseBuilder'), 'CourseBuilder');
const CreatorMembers = lazyPage(() => import('./pages/creator/CreatorMembers'), 'CreatorMembers');
const ApplyCreator = lazyPage(() => import('./pages/creator/ApplyCreator'), 'ApplyCreator');
const AdminDashboard = lazyPage(() => import('./pages/admin/AdminDashboard'), 'AdminDashboard');
const CertificateView = lazyPage(() => import('./pages/certificates/CertificateView'), 'CertificateView');
const SettingsPage = lazyPage(() => import('./pages/SettingsPage'), 'SettingsPage');
const MessagesPage = lazyPage(() => import('./pages/messages/MessagesPage'), 'MessagesPage');
const ProfilePage = lazyPage(() => import('./pages/profile/ProfilePage'), 'ProfilePage');
const HelpSupportPage = lazyPage(() => import('./pages/HelpSupportPage'), 'HelpSupportPage');
const PrivacyPolicyPage = lazyPage(() => import('./pages/PrivacyPolicyPage'), 'PrivacyPolicyPage');
const TermsPage = lazyPage(() => import('./pages/TermsPage'), 'TermsPage');
const SearchResultsPage = lazyPage(() => import('./pages/SearchResults'), 'SearchResultsPage');
const NotFoundPage = lazyPage(() => import('./pages/NotFoundPage'), 'NotFoundPage');

const PageViewTracker = () => {
  const location = useLocation();
  React.useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
};

export const App = () => {
  const [activeDirectCall, setActiveDirectCall] = React.useState(null);

  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ActiveCallProvider>
            <ToastProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <PageViewTracker />
              <CookieConsent />
              <IncomingCallModal onAcceptCall={(call) => setActiveDirectCall(call)} />
              {activeDirectCall && (
                <CallRoomModal
                  isOpen={!!activeDirectCall}
                  roomName={`Chamada com ${activeDirectCall.caller?.name || 'Utilizador'}`}
                  roomId={activeDirectCall.roomId}
                  onClose={() => setActiveDirectCall(null)}
                />
              )}
              <React.Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500" role="status">A carregar...</div>}>
                <Routes>
                  <Route path="/" element={<AppLayout />}>
                  <Route index element={<LandingPage />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                  <Route path="reset-password" element={<ResetPassword />} />
                  <Route path="explore" element={<DiscoverSpaces />} />
                  <Route path="courses/:id" element={<CourseDetails />} />
                  <Route path="certificates/verify/:id" element={<CertificateView />} />
                  <Route path="help" element={<HelpSupportPage />} />
                  <Route path="support" element={<HelpSupportPage />} />
                  <Route path="privacy" element={<PrivacyPolicyPage />} />
                  <Route path="terms" element={<TermsPage />} />
                  <Route path="search" element={<SearchResultsPage />} />

                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="learn/:courseId"
                    element={
                      <ProtectedRoute>
                        <CoursePlayer />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="library"
                    element={
                      <ProtectedRoute>
                        <LibraryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="messages"
                    element={
                      <ProtectedRoute>
                        <MessagesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="profile/:username"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="community/:id"
                    element={
                      <ProtectedRoute>
                        <SpaceChat />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="creator/apply"
                    element={
                      <ProtectedRoute>
                        <ApplyCreator />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="creator"
                    element={
                      <ProtectedRoute requiredRole="CREATOR">
                        <CreatorDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="creator/dashboard" element={<Navigate to="/creator" replace />} />
                  <Route
                    path="creator/courses/new"
                    element={
                      <ProtectedRoute requiredRole="CREATOR">
                        <CourseBuilder />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="creator/courses/:courseId/edit"
                    element={
                      <ProtectedRoute requiredRole="CREATOR">
                        <CourseBuilder />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="creator/members"
                    element={
                      <ProtectedRoute requiredRole="CREATOR">
                        <CreatorMembers />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="community" element={<Navigate to="/explore" replace />} />
                  <Route path="progress" element={<Navigate to="/library" replace />} />
                  <Route path="achievements" element={<Navigate to="/profile" replace />} />
                  <Route path="leaderboard" element={<Navigate to="/explore" replace />} />

                  <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </React.Suspense>
            </BrowserRouter>
          </ToastProvider>
        </ActiveCallProvider>
      </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;