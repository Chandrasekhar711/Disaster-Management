import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store.js';
import { authService } from '../services/api.js';
import { Button } from '../components/common.jsx';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    emailOrUserId: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.emailOrUserId.trim()) {
      newErrors.emailOrUserId = 'Email or User ID is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await authService.login({
        emailOrUserId: formData.emailOrUserId,
        password: formData.password,
      });
      const { user, token } = response.data.data;
      setUser(user);
      setToken(token);
      toast.success('Login successful!');

      // Redirect based on user role
      switch (user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'authority':
          navigate('/authority');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const isEmail = formData.emailOrUserId.includes('@');
  const placeholder = formData.emailOrUserId === '' 
    ? 'email@example.com or username' 
    : isEmail 
    ? 'Email detected' 
    : 'User ID detected';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-primary-600 mb-8">
            Disaster Management
          </h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Email or User ID</label>
              <input
                type="text"
                name="emailOrUserId"
                className={`input ${errors.emailOrUserId ? 'border-red-500' : ''}`}
                placeholder={placeholder}
                value={formData.emailOrUserId}
                onChange={handleChange}
              />
              {errors.emailOrUserId && (
                <p className="text-red-500 text-sm mt-1">{errors.emailOrUserId}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Enter your email (example@email.com) or user ID (username)
              </p>
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                name="password"
                className={`input ${errors.password ? 'border-red-500' : ''}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full"
            >
              Login
            </Button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-primary-600 font-semibold hover:underline"
            >
              Register here
            </button>
          </p>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <p className="text-center text-gray-600 text-sm mb-4">
            Want to view incidents without logging in?
          </p>
          <button
            onClick={() => navigate('/incidents/map')}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            View Live Incident Map
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
