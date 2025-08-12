import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft, Loader2 } from 'lucide-react';
import { apiService } from '../api';
import { ApiResponseHandler, ValidationError, FormValidationHelper } from '../types';
import type { RegisterUserRequest } from '../contracts';
import type { AppUser } from '../models';

interface RegisterPageProps {
  onRegisterSuccess?: (user: AppUser) => void;
}

export function RegisterPage({ onRegisterSuccess }: RegisterPageProps) {
  const [formData, setFormData] = useState<RegisterUserRequest>({
    email: '',
    password: '',
    userName: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
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
    
    const { email, password, userName } = formData;

    // Basic validation
    if (!email || !password || !userName) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      console.log('Attempting registration with:', { 
        ...formData, 
        password: '***' 
      });
      
      const response = await apiService.registerUser(formData);
      console.log('Registration response:', response);
      
      // Use ApiResponseHandler to process the response
      const registerData = ApiResponseHandler.handleResponse(response);
      console.log('Registration successful:', registerData);
      
      // Convert backend response to AppUser format
      const user: AppUser = {
        userId: registerData.userId,
        email: registerData.email,
        userName: registerData.userName,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        userRole: registerData.userRole,
        phoneNumber: registerData.phoneNumber,
      };
      
      // Handle successful registration
      onRegisterSuccess?.(user);
      
      // Show success message and redirect to login or home
      alert('Registration successful! Please log in with your new account.');
      navigate('/login');
      
    } catch (error) {
      console.error('Registration error:', error);
      
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

  const isFormValid = formData.email.trim() !== '' && 
                     formData.password.trim() !== '' && 
                     formData.userName.trim() !== '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              sign in to your existing account
            </button>
          </p>
        </div>

        {/* Registration Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
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

            {/* Username Input */}
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                id="userName"
                name="userName"
                type="text"
                autoComplete="username"
                required
                value={formData.userName}
                onChange={handleInputChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  fieldErrors.username || fieldErrors.userName ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Choose a username"
              />
              {(fieldErrors.username || fieldErrors.userName) && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.username || fieldErrors.userName}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  fieldErrors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Create a password (min. 8 characters)"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters long
              </p>
            </div>

            {/* First Name Input */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  fieldErrors.firstName ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Enter your first name (optional)"
              />
              {fieldErrors.firstName && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.firstName}</p>
              )}
            </div>

            {/* Last Name Input */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={handleInputChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  fieldErrors.lastName ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Enter your last name (optional)"
              />
              {fieldErrors.lastName && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.lastName}</p>
              )}
            </div>

            {/* Phone Number Input */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  fieldErrors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Enter your phone number (optional)"
              />
              {fieldErrors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.phoneNumber}</p>
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

          {/* Required Fields Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              * Required fields. Optional fields can be filled in later in your profile.
            </p>
          </div>

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
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          {/* Additional Options */}
          <div className="flex items-center justify-center">
            <div className="text-sm">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="font-medium text-gray-600 hover:text-gray-500 transition-colors flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to home
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
