import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { tokenStorage } from './services/api';

import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import AdminLayout from './components/layout/AdminLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';

import EventsPage from './pages/events/EventsPage';
import EventDetailPage from './pages/events/EventDetailPage';
import CreateEventPage from './pages/events/CreateEventPage';
import EditEventPage from './pages/events/EditEventPage';
import PaymentPage from './pages/payments/PaymentPage';
import PaymentSuccessPage from './pages/payments/PaymentSuccessPage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';

import ProfilePage from './pages/profile/ProfilePage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminEventsPage from './pages/admin/AdminEventsPage';

import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

import './styles/global.css';
import './styles/components.scss';

const App: React.FC = () => {
  const { fetchMe, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (tokenStorage.getAccess()) {
      fetchMe();
    }
  }, [fetchMe]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route index element={<EventsPage />} />
          <Route path="/events" element={<EventsPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/events/create" element={<CreateEventPage />} />
          </Route>

          <Route path="/events/:id" element={<EventDetailPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/events/:id/edit" element={<EditEventPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment/mock" element={<PaymentPage />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
            <Route path="/profile/*" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/events" element={<AdminEventsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
