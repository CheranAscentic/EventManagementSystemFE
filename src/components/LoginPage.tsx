import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import { apiService } from '../api';
import { ApiResponseHandler, ValidationError, FormValidationHelper } from '../types';
import type { LoginRequest } from '../contracts';
import type { AppUser } from '../models';

interface LoginPageProps {
  onLoginSuccess?: (user: AppUser, token?: string) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { email, password } = formData;

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      console.log('Attempting login with:', { email, password: '***' });
      
      const response = await apiService.login({ email, password });
      console.log('Login response:', response);
      
      // Use ApiResponseHandler to process the response
      const loginData = ApiResponseHandler.handleResponse(response);
      console.log('Login successful:', loginData);
      
      // Extract user and token from the response
      // The user data is directly in loginData, not nested under loginData.user
      const user: AppUser = {
        userId: loginData.id,
        email: loginData.email,
        userName: loginData.userName,
        firstName: loginData.firstName,
        lastName: loginData.lastName,
        userRole: loginData.userRole,
        phoneNumber: loginData.phoneNumber,
        token: loginData.token,
        tokenExpiration: loginData.tokenExpiration
      };
      const token = loginData.token;
      
      // Handle successful login
      onLoginSuccess?.(user, token);
      
      // Redirect to home page or dashboard
      navigate('/');
      
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof ValidationError) {
        // Handle validation errors
        const formErrors = FormValidationHelper.extractFieldErrors(error.response);
        setFieldErrors(formErrors);
        setError('Please correct the errors below');
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.email.trim() !== '' && formData.password.trim() !== '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <button
              onClick={() => navigate('/register')}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              create a new account
            </button>
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  fieldErrors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Enter your email"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  fieldErrors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Enter your password"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Additional Options */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="font-medium text-gray-600 hover:text-gray-500 transition-colors"
              >
                ← Back to home
              </button>
            </div>
            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot your password?
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
