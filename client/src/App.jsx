import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { CourseDetails } from './pages/CourseDetails';
import { CoursePlayer } from './pages/learn/CoursePlayer';
import { DiscoverSpaces } from './pages/community/DiscoverSpaces';
import { SpaceChat } from './pages/community/SpaceChat';
import { LibraryPage } from './pages/LibraryPage';
import { CreatorDashboard } from './pages/creator/CreatorDashboard';
import { CourseBuilder } from './pages/creator/CourseBuilder';
import { CreatorMembers } from './pages/creator/CreatorMembers';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CertificateView } from './pages/certificates/CertificateView';
import { SettingsPage } from './pages/SettingsPage';
import { MessagesPage } from './pages/messages/MessagesPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { IncomingCallModal } from './components/call/IncomingCallModal';
import { CallRoomModal } from './components/call/CallRoomModal';

export const App = () => {
  const [activeDirectCall, setActiveDirectCall] = React.useState(null);

  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <BrowserRouter>
              <IncomingCallModal onAcceptCall={(call) => setActiveDirectCall(call)} />
              {activeDirectCall && (
                <CallRoomModal
                  isOpen={!!activeDirectCall}
                  roomName={`Chamada com ${activeDirectCall.caller?.name || 'Utilizador'}`}
                  roomId={activeDirectCall.roomId}
                  onClose={() => setActiveDirectCall(null)}
                />
              )}
              <Routes>
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<LandingPage />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                  <Route path="explore" element={<DiscoverSpaces />} />
                  <Route path="courses/:id" element={<CourseDetails />} />
                  <Route path="certificates/verify/:id" element={<CertificateView />} />

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

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;