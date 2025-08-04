import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { Navigation, HomePage, LoginPage } from './components'
import type { AppUser } from './models'

function App() {
  // Authentication state management
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null)

  const handleLoginSuccess = (user: AppUser, token?: string) => {
    setIsLoggedIn(true)
    setCurrentUser(user)
    // Store token in localStorage if needed
    if (token) {
      localStorage.setItem('authToken', token)
    }
    console.log('User logged in:', user)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser(null)
    localStorage.removeItem('authToken')
    console.log('User logged out')
  }

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
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/login" 
            element={<LoginPage onLoginSuccess={handleLoginSuccess} />} 
          />
          {/* Placeholder routes for future pages */}
          <Route path="/events" element={<div className="p-8 text-center">Events page coming soon!</div>} />
          <Route path="/my-registrations" element={<div className="p-8 text-center">My Registrations page coming soon!</div>} />
          <Route path="/manage-events" element={<div className="p-8 text-center">Manage Events page coming soon!</div>} />
          <Route path="/dashboard" element={<div className="p-8 text-center">Dashboard page coming soon!</div>} />
          <Route path="/register" element={<div className="p-8 text-center">Registration page coming soon!</div>} />
          <Route path="*" element={<div className="p-8 text-center">Page not found!</div>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
