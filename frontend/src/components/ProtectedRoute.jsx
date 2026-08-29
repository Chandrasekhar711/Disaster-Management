import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store.js';
import { getToken } from '../utils/auth.js';

export const ProtectedRoute = ({ children, roles = null }) => {
  const token = getToken();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    if (roles && user && !roles.includes(user.role)) {
      navigate('/unauthorized', { replace: true });
      return;
    }

    setIsLoading(false);
  }, [token, user, roles, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const token = getToken();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, navigate]);

  return children;
};

export default { ProtectedRoute, PublicRoute };
