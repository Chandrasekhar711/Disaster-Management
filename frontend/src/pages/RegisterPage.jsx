import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store.js';
import { authService } from '../services/api.js';
import { Button } from '../components/common.jsx';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    userId: '',
    email: '',
    phone: '',
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

  const validateUserId = (userId) => {
    if (!userId) return 'User ID is required';
    if (userId.length < 4) return 'User ID must be at least 4 characters';
    if (userId.length > 20) return 'User ID cannot exceed 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
      return 'User ID can only contain letters, numbers, and underscores';
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    const userIdError = validateUserId(formData.userId);
    if (userIdError) {
      newErrors.userId = userIdError;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
      const response = await authService.register(formData);
      setUser(response.data.data.user);
      setToken(response.data.data.token);
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      const errorMsg = error.message || 'Registration failed';
      toast.error(errorMsg);
      
      // Handle specific field errors
      if (errorMsg.includes('email')) {
        setErrors((prev) => ({ ...prev, email: errorMsg }));
      } else if (errorMsg.includes('User ID')) {
        setErrors((prev) => ({ ...prev, userId: errorMsg }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-primary-600 mb-8">
            Disaster Management
          </h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Create Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                name="name"
                className={`input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="label">User ID</label>
              <input
                type="text"
                name="userId"
                className={`input ${errors.userId ? 'border-red-500' : ''}`}
                placeholder="my_username"
                value={formData.userId}
                onChange={handleChange}
              />
              {errors.userId && (
                <p className="text-red-500 text-sm mt-1">{errors.userId}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                4-20 characters. Letters, numbers, and underscores only.
              </p>
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="label">Phone (10 digits)</label>
              <input
                type="tel"
                name="phone"
                className={`input ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
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
              <p className="text-xs text-gray-500 mt-2">
                Minimum 6 characters
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full"
            >
              Register
            </Button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary-600 font-semibold hover:underline"
            >
              Login here
            </button>
          </p>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <p className="text-center text-gray-600 text-sm mb-4">
            Want to view incidents without registering?
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

export default RegisterPage;
