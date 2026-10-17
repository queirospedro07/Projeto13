import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './components/Toast';
import { ActiveCallProvider } from './context/ActiveCallContext';
import { Layout } from './components/Layout';
import { CookieConsent } from './components/CookieConsent';
import { trackPageView } from './utils/analytics';
import { ProtectedRoute } from './components/ProtectedRoute';
import { IncomingCallModal } from './components/IncomingCallModal';
import { CallRoomModal } from './components/CallRoomModal';
import { useLocation } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const CourseDetailsPage = React.lazy(() => import('./pages/CourseDetailsPage'));
const CoursePlayerPage = React.lazy(() => import('./pages/CoursePlayerPage'));
const DiscoverSpacesPage = React.lazy(() => import('./pages/DiscoverSpacesPage'));
const SpaceChatPage = React.lazy(() => import('./pages/SpaceChatPage'));
const LibraryPage = React.lazy(() => import('./pages/LibraryPage'));
const CreatorDashboardPage = React.lazy(() => import('./pages/CreatorDashboardPage'));
const CourseBuilderPage = React.lazy(() => import('./pages/CourseBuilderPage'));
const CreatorMembersPage = React.lazy(() => import('./pages/CreatorMembersPage'));
const ApplyCreatorPage = React.lazy(() => import('./pages/ApplyCreatorPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage'));
const CertificateViewPage = React.lazy(() => import('./pages/CertificateViewPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const MessagesPage = React.lazy(() => import('./pages/MessagesPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const FaqPage = React.lazy(() => import('./pages/FaqPage'));
const PrivacyPolicyPage = React.lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));
const SearchResultsPage = React.lazy(() => import('./pages/SearchResultsPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
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
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
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
                <React.Suspense
                  fallback={
                    <div className="app-panel" role="status">
                      A carregar...
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<LandingPage />} />
                      <Route path="login" element={<LoginPage />} />
                      <Route path="register" element={<RegisterPage />} />
                      <Route path="forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="reset-password" element={<ResetPasswordPage />} />
                      <Route path="explore" element={<DiscoverSpacesPage />} />
                      <Route path="courses/:id" element={<CourseDetailsPage />} />
                      <Route path="certificates/verify/:id" element={<CertificateViewPage />} />
                      <Route path="help" element={<FaqPage />} />
                      <Route path="support" element={<FaqPage />} />
                      <Route path="privacy" element={<PrivacyPolicyPage />} />
                      <Route path="terms" element={<TermsPage />} />
                      <Route
                        path="search"
                        element={
                          <ProtectedRoute>
                            <SearchResultsPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="dashboard"
                        element={
                          <ProtectedRoute>
                            <DashboardPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="learn/:courseId"
                        element={
                          <ProtectedRoute>
                            <CoursePlayerPage />
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
                            <SpaceChatPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="creator/apply"
                        element={
                          <ProtectedRoute>
                            <ApplyCreatorPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="creator"
                        element={
                          <ProtectedRoute requiredRole="CREATOR">
                            <CreatorDashboardPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="creator/dashboard"
                        element={<Navigate to="/creator" replace />}
                      />
                      <Route
                        path="creator/courses/new"
                        element={
                          <ProtectedRoute requiredRole="CREATOR">
                            <CourseBuilderPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="creator/courses/:courseId/edit"
                        element={
                          <ProtectedRoute requiredRole="CREATOR">
                            <CourseBuilderPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="creator/members"
                        element={
                          <ProtectedRoute requiredRole="CREATOR">
                            <CreatorMembersPage />
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
                            <AdminDashboardPage />
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
