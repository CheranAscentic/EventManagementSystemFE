import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { Navigation, HomePage, LoginPage, RegisterPage, EventsPage, EventDetailPage, CreateEventPage, EditEventPage, MyRegistrationsPage } from './components'
import { OwnerEventsPage } from './components/OwnerEventsPage'
import { EventDashboard } from './components/EventDashboard'
import { apiService } from './api'
import type { AppUser } from './models'
import { EventsCalendar } from './components/EventsCalendar'
import { decodeJwtToAppUser } from './utils/jwtUtils'
import { tokenRefreshService } from './services'

function App() {
  // Authentication state management
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  // const navigate = useNavigate()

  // SIMPLIFIED: Use ApiService
  const handleLogout = useCallback(async () => {
    try {
      // Call the logout endpoint to invalidate tokens on the server
      await apiService.logout();
      console.log('Logout request sent to server');
    } catch (error) {
      console.error('Error during logout request:', error);
      // Continue with local logout even if server request fails
    }
    
    setIsLoggedIn(false);
    setCurrentUser(null);
    
    // Stop automatic token refresh service
    tokenRefreshService.stop();
    
    // Clear all tokens
    apiService.clearAllTokens();
    
    console.log('User logged out and all tokens cleared');
  }, [setIsLoggedIn, setCurrentUser]);

  // SIMPLIFIED: Use ApiService for all token operations
  const attemptTokenRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const refreshedCredentials = await apiService.refreshTokens();
      
      if (refreshedCredentials) {
        const user = decodeJwtToAppUser(refreshedCredentials.authToken);
        if (user) {
          setCurrentUser(user);
          setIsLoggedIn(true);
          
          // Start automatic token refresh service for existing sessions
          tokenRefreshService.start(
            // On successful token refresh, update current user
            (refreshedUser: AppUser) => {
              setCurrentUser(refreshedUser);
              console.log('Token refreshed automatically, user updated:', refreshedUser);
            },
            // On token refresh failure, logout user
            () => {
              console.log('Token refresh failed, logging out user');
              handleLogout();
            }
          );
          
          console.log('Token refresh successful, user logged in');
          return true;
        }
      }
      
      console.log('Token refresh failed or invalid user data');
      return false;
    } catch (error) {
      console.error('Error during token refresh:', error);
      return false;
    }
  }, [setCurrentUser, setIsLoggedIn, handleLogout]);

  // Check for existing authentication on app load
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      console.log('Checking for stored authentication...');
      
      // Check if we have a refresh token
      const refreshToken = apiService.getRefreshToken();
      
      if (refreshToken) {
        console.log('Refresh token found, attempting to refresh credentials');
        const success = await attemptTokenRefresh();
        
        if (!success) {
          console.log('Could not refresh tokens, continuing as guest');
        }
      } else {
        console.log('No refresh token found, continuing as guest');
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, [attemptTokenRefresh]);

  // SIMPLIFIED: Just use ApiService
  const handleLoginSuccess = (user: AppUser, authToken?: string, refreshToken?: string, authTokenExp?: string, refreshTokenExp?: string) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    
    // Use ApiService for all token management
    if (authToken && refreshToken) {
      apiService.setTokens(authToken, refreshToken, authTokenExp, refreshTokenExp);
    }
    
    // Start automatic token refresh service
    tokenRefreshService.start(
      // On successful token refresh, update current user
      (refreshedUser: AppUser) => {
        setCurrentUser(refreshedUser);
        console.log('Token refreshed automatically, user updated:', refreshedUser);
      },
      // On token refresh failure, logout user
      () => {
        console.log('Token refresh failed, logging out user');
        handleLogout();
      }
    );
    
    console.log('User logged in:', user);
  };

  const handleRegisterSuccess = (user: AppUser) => {
    // For registration, we might want to auto-login the user or just redirect to login
    // Here we'll just log the success and let the RegisterPage handle the redirect
    console.log('User registered successfully:', user)
    // Optionally, you could auto-login the user here:
    // handleLoginSuccess(user, token)
  }

  return (
    <>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      ) : (
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navigation
              isLoggedIn={isLoggedIn}
              userRole={currentUser?.userRole}
              userName={currentUser ? currentUser.userName || `${currentUser.firstName} ${currentUser.lastName}`.trim() : ''}
              onLogout={handleLogout}
            />
            
            <Routes>
              {/* Route for Events Calendar */}
              <Route path="/events/calendar" element={<EventsCalendar />} />

              <Route path="/" element={<HomePage />} />
              <Route 
                path="/login" 
                element={<LoginPage onLoginSuccess={handleLoginSuccess} />} 
              />
              <Route 
                path="/register" 
                element={<RegisterPage onRegisterSuccess={handleRegisterSuccess} />} 
              />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/event/:eventId" element={<EventDetailPage currentUser={currentUser} />} />
              
              {/* Admin Routes */}
              <Route path="/admin/my-events" element={<OwnerEventsPage />} />
              <Route path="/admin/event-dashboard/:eventId" element={<EventDashboard />} />
              
              {/* Placeholder routes for future pages */}
              <Route 
                path="/my-registrations" 
                element={<MyRegistrationsPage currentUser={currentUser} />} 
              />
              <Route path="/manage-events" element={<div className="p-8 text-center">Manage Events page coming soon!</div>} />
              <Route path="/dashboard" element={<div className="p-8 text-center">Dashboard page coming soon!</div>} />
              <Route path="/admin/create-event" element={<CreateEventPage />} />
              <Route path="/admin/edit-event/:eventId" element={<EditEventPage />} />
              <Route path="*" element={<div className="p-8 text-center">Page not found!</div>} />
            </Routes>
          </div>
        </Router>
      )}
    </>
  )
}

export default App
