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
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Or{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-primary hover:text-primary/80 transition-colors"
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
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
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
                  fieldErrors.email ? 'border-destructive' : 'border-border'
                } placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm`}
                placeholder="Enter your email"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            {/* Username Input */}
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-foreground mb-1">
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
                  fieldErrors.username || fieldErrors.userName ? 'border-destructive' : 'border-border'
                } placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm`}
                placeholder="Choose a username"
              />
              {(fieldErrors.username || fieldErrors.userName) && (
                <p className="mt-1 text-sm text-destructive">{fieldErrors.username || fieldErrors.userName}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
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
                  fieldErrors.password ? 'border-destructive' : 'border-border'
                } placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm`}
                placeholder="Create a password (min. 8 characters)"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-destructive">{fieldErrors.password}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>

            {/* First Name Input */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1">
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
                  fieldErrors.firstName ? 'border-destructive' : 'border-border'
                } placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm`}
                placeholder="Enter your first name (optional)"
              />
              {fieldErrors.firstName && (
                <p className="mt-1 text-sm text-destructive">{fieldErrors.firstName}</p>
              )}
            </div>

            {/* Last Name Input */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-1">
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
                  fieldErrors.lastName ? 'border-destructive' : 'border-border'
                } placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm`}
                placeholder="Enter your last name (optional)"
              />
              {fieldErrors.lastName && (
                <p className="mt-1 text-sm text-destructive">{fieldErrors.lastName}</p>
              )}
            </div>

            {/* Phone Number Input */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground mb-1">
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
                  fieldErrors.phoneNumber ? 'border-destructive' : 'border-border'
                } placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm`}
                placeholder="Enter your phone number (optional)"
              />
              {fieldErrors.phoneNumber && (
                <p className="mt-1 text-sm text-destructive">{fieldErrors.phoneNumber}</p>
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

          {/* Required Fields Notice */}
          <div className="bg-primary/10 border border-primary/20 rounded-md p-3">
            <p className="text-sm text-primary">
              * Required fields. Optional fields can be filled in later in your profile.
            </p>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" />
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
                className="font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center"
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
