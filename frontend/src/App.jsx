import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './auth/LoginPage';
import DashboardLayout from './dashboard/DashboardLayout';
import TaskList from './tasks/TaskList';
import TaskForm from './tasks/TaskForm';
import TaskLogs from './tasks/TaskLogs';
import SessionsView from './sessions/SessionsView';

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
