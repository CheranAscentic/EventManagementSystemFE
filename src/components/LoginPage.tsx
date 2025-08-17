import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import { apiService } from '../api';
import { ApiResponseHandler, ValidationError, FormValidationHelper } from '../types';
import type { LoginRequest } from '../contracts';
import type { AppUser } from '../models';
import { decodeJwtToAppUser } from '../utils/jwtUtils'

interface LoginPageProps {
  onLoginSuccess?: (user: AppUser, authToken?: string, refreshToken?: string, authTokenExp?: string, refreshTokenExp?: string) => void;
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
      
      const loginData = ApiResponseHandler.handleResponse(response);
      console.log('Login successful:', loginData);
      
      // Decode user and handle null case
      const decodedUser = decodeJwtToAppUser(loginData.authToken)!;
      
      if (!decodedUser) {
        setError('Failed to decode user information. Please try again.');
        return;
      }
      
      const user: AppUser = decodedUser;
      const authToken = loginData.authToken;
      const refreshToken = loginData.refreshToken;
      const authTokenExp = loginData.authTokenExp;
      const refreshTokenExp = loginData.refreshTokenExp;
      
      // REMOVED: Token setting (App.tsx handles this via onLoginSuccess)
      // Handle successful login - App.tsx will manage tokens
      onLoginSuccess?.(user, authToken, refreshToken, authTokenExp, refreshTokenExp);
      
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
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Or{' '}
            <button
              onClick={() => navigate('/register')}
              className="font-medium text-primary hover:text-primary/80 transition-colors"
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
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
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
                  fieldErrors.email ? 'border-destructive' : 'border-border'
                } placeholder-muted-foreground text-foreground bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring focus:z-10 sm:text-sm`}
                placeholder="Enter your email"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
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
                  fieldErrors.password ? 'border-destructive' : 'border-border'
                } placeholder-muted-foreground text-foreground bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring focus:z-10 sm:text-sm`}
                placeholder="Enter your password"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-destructive">{fieldErrors.password}</p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-destructive" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" />
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
                className="font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to home
              </button>
            </div>
            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
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
