
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { tokenStorage } from '../../services/api';

const AuthCallbackPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (accessToken && refreshToken) {
      tokenStorage.setTokens(accessToken, refreshToken);
      fetchMe().then(() => navigate('/'));
    } else {
      navigate('/auth/login');
    }
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div className="spinner" />
      <p style={{ marginTop: 16, color: 'var(--color-text-muted)' }}>Signing you in…</p>
    </div>
  );
};

export default AuthCallbackPage;
