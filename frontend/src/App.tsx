import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SubjectsPage from './pages/SubjectsPage';
import TopicPage from './pages/TopicPage';
import StudySheetPage from './pages/StudySheetPage';
import ProfilePage from './pages/ProfilePage';
import TextbookUploadPage from './pages/TextbookUploadPage';
import GenerateStudySheetPage from './pages/GenerateStudySheetPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route path="dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="subjects" element={
            <ProtectedRoute>
              <SubjectsPage />
            </ProtectedRoute>
          } />
          <Route path="topics/:topicId" element={
            <ProtectedRoute>
              <TopicPage />
            </ProtectedRoute>
          } />
          <Route path="study-sheet/:topicId" element={
            <ProtectedRoute>
              <StudySheetPage />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="textbooks" element={
            <ProtectedRoute>
              <TextbookUploadPage />
            </ProtectedRoute>
          } />
          <Route path="generate-study-sheet" element={
            <ProtectedRoute>
              <GenerateStudySheetPage />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
