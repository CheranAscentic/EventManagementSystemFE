import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { Navigation, HomePage, LoginPage, RegisterPage, EventsPage, EventDetailPage, CreateEventPage, EditEventPage, MyRegistrationsPage } from './components'
import { OwnerEventsPage } from './components/OwnerEventsPage'
import { EventDashboard } from './components/EventDashboard'
import { apiService } from './api'
import type { AppUser } from './models'
import { EventsCalendar } from './components/EventsCalendar'

function App() {
  // Authentication state management
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null)
  // const navigate = useNavigate()

  // Check for existing authentication on app load
  useEffect(() => {
    const storedUserData = localStorage.getItem('AppUser');
    if (storedUserData) {
      try {
        const appUser: AppUser = JSON.parse(storedUserData);
        
        // Check if token exists and is not expired
        if (appUser.token && appUser.tokenExpiration) {
          const expirationDate = new Date(appUser.tokenExpiration);
          const currentDate = new Date();
          
          if (expirationDate > currentDate) {
            // Token is still valid
            console.log('Restoring user session from localStorage');
            setIsLoggedIn(true);
            setCurrentUser(appUser);
            apiService.setAuthToken(appUser.token);
          } else {
            // Token has expired
            console.log('Stored token has expired, clearing user data');
            localStorage.removeItem('AppUser');
            localStorage.removeItem('authToken'); // Clean up old token storage
          }
        } else {
          // No token or expiration data
          console.log('No valid token found in stored user data');
          localStorage.removeItem('AppUser');
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('AppUser');
        localStorage.removeItem('authToken'); // Clean up old token storage
      }
    } else {
      // Check for old token-only storage and clean it up
      const oldToken = localStorage.getItem('authToken');
      if (oldToken) {
        console.log('Found old token-only storage, cleaning up');
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  const handleLoginSuccess = (user: AppUser, token?: string) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    
    // Store complete user object in localStorage
    localStorage.setItem('AppUser', JSON.stringify(user));
    
    // Set token in API service (use token from user object if available, fallback to parameter)
    const authToken = user.token || token;
    if (authToken) {
      apiService.setAuthToken(authToken);
      
      // Clean up old token-only storage if it exists
      localStorage.removeItem('authToken');
    }
    
    console.log('User logged in and stored:', user);
  };

  const handleRegisterSuccess = (user: AppUser) => {
    // For registration, we might want to auto-login the user or just redirect to login
    // Here we'll just log the success and let the RegisterPage handle the redirect
    console.log('User registered successfully:', user)
    // Optionally, you could auto-login the user here:
    // handleLoginSuccess(user, token)
  }

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    
    // Clear all authentication data from localStorage
    localStorage.removeItem('AppUser');
    localStorage.removeItem('authToken'); // Clean up old token storage if it exists
    
    // Clear token from API service
    apiService.clearAuthToken();

    // navigate('/login'); // Redirect to login page after logout
    
    console.log('User logged out and storage cleared');
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation
          isLoggedIn={isLoggedIn}
          userRole={currentUser?.userRole}
          userName={currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.userName : ''}
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
  )
}

export default App
