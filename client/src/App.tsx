import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { ExploreCourses } from './pages/ExploreCourses';
import { CourseDetails } from './pages/CourseDetails';
import { CoursePlayer } from './pages/learn/CoursePlayer';
import { DiscoverSpaces } from './pages/community/DiscoverSpaces';
import { SpaceDetails } from './pages/community/SpaceDetails';
import { SpaceChat } from './pages/community/SpaceChat';
import { MessagesPage } from './pages/messages/MessagesPage';
import { LibraryPage } from './pages/LibraryPage';
import { ProgressPage } from './pages/ProgressPage';
import { AchievementsPage } from './pages/gamification/AchievementsPage';
import { LeaderboardPage } from './pages/gamification/LeaderboardPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { CreatorDashboard } from './pages/creator/CreatorDashboard';
import { CourseBuilder } from './pages/creator/CourseBuilder';
import { CreatorMembers } from './pages/creator/CreatorMembers';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CertificateView } from './pages/certificates/CertificateView';
import { SettingsPage } from './pages/SettingsPage';

import { ProtectedRoute } from './components/auth/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Public & App Routes wrapped in AppLayout */}
                <Route path="/" element={<AppLayout />}>
                  {/* Public Pages */}
                  <Route index element={<LandingPage />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                  <Route path="explore" element={<DiscoverSpaces />} />
                  <Route path="courses/:id" element={<CourseDetails />} />
                  <Route path="community" element={<DiscoverSpaces />} />
                  <Route path="community/:id" element={<CourseDetails />} />
                  <Route path="certificates/verify/:id" element={<CertificateView />} />
                  <Route path="profile/:username" element={<ProfilePage />} />
                  
                  {/* Authenticated Student Routes */}
                  <Route path="dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="learn/:courseId" element={
                    <ProtectedRoute>
                      <CoursePlayer />
                    </ProtectedRoute>
                  } />
                  <Route path="library" element={
                    <ProtectedRoute>
                      <LibraryPage />
                    </ProtectedRoute>
                  } />
                  <Route path="community/:id/chat" element={
                    <ProtectedRoute>
                      <SpaceChat />
                    </ProtectedRoute>
                  } />
                  <Route path="messages" element={
                    <ProtectedRoute>
                      <MessagesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="progress" element={
                    <ProtectedRoute>
                      <ProgressPage />
                    </ProtectedRoute>
                  } />
                  <Route path="achievements" element={
                    <ProtectedRoute>
                      <AchievementsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="leaderboard" element={
                    <ProtectedRoute>
                      <LeaderboardPage />
                    </ProtectedRoute>
                  } />

                  {/* Creator Studio Routes */}
                  <Route path="creator" element={
                    <ProtectedRoute requiredRole="CREATOR">
                      <CreatorDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="creator/courses/new" element={
                    <ProtectedRoute requiredRole="CREATOR">
                      <CourseBuilder />
                    </ProtectedRoute>
                  } />
                  <Route path="creator/courses/:courseId/edit" element={
                    <ProtectedRoute requiredRole="CREATOR">
                      <CourseBuilder />
                    </ProtectedRoute>
                  } />
                  <Route path="creator/members" element={
                    <ProtectedRoute requiredRole="CREATOR">
                      <CreatorMembers />
                    </ProtectedRoute>
                  } />

                  {/* Admin & Settings Routes */}
                  <Route path="admin" element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="settings" element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } />

                  {/* Fallback */}
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
