import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/DashboardLayout';
import TaskList from './pages/TaskList';
import TaskForm from './pages/TaskForm';
import TaskLogs from './pages/TaskLogs';
import SessionsView from './pages/SessionsView';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<TaskList />} />
          <Route path="tasks/new" element={<TaskForm />} />
          <Route path="tasks/:id/edit" element={<TaskForm />} />
          <Route path="tasks/:id/logs" element={<TaskLogs />} />
          <Route path="sessions" element={<SessionsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
