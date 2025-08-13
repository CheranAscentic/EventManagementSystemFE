import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';

interface NavigationProps {
  isLoggedIn?: boolean;
  userRole?: string;
  userName?: string;
  onLogout?: () => void;
}

export function Navigation({ 
  isLoggedIn = false, 
  userRole = 'User',
  userName = '',
  onLogout
}: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <nav className="bg-card shadow-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="text-xl font-bold text-card-foreground hover:text-muted-foreground transition-colors">
                CalVender
              </Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Events Calendar Link */}
            <Link
              to="/events/calendar"
              className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Events Calendar
            </Link>
            {/* Navigation Links */}
            {/* <Link
              to="/events"
              className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Events
            </Link> */}
            
            {isLoggedIn && (
              <Link
                to="/my-registrations"
                className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                My Event Registrations
              </Link>
            )}

            {isLoggedIn && userRole === 'Admin' && (
              <>
                <Link
                  to="/admin/my-events"
                  className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  My Events
                </Link>
                {/* <Link
                  to="/dashboard"
                  className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link> */}
              </>
            )}

            {/* User Actions */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  Welcome, {userName}
                </span>
                <button
                  onClick={onLogout}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLoginClick}
                  className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={handleRegisterClick}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="text-muted-foreground hover:text-foreground focus:outline-none focus:text-foreground p-2"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-border">
              <Link
                to="/events"
                className="text-muted-foreground hover:text-foreground block px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                Events
              </Link>
              
              {isLoggedIn && (
                <Link
                  to="/my-registrations"
                  className="text-muted-foreground hover:text-foreground block px-3 py-2 rounded-md text-base font-medium transition-colors"
                >
                  My Registrations
                </Link>
              )}

              {isLoggedIn && userRole === 'Admin' && (
                <>
                  <Link
                    to="/admin/my-events"
                    className="text-muted-foreground hover:text-foreground block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    My Events
                  </Link>
                  <Link
                    to="/dashboard"
                    className="text-muted-foreground hover:text-foreground block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                </>
              )}

              {/* Mobile User Actions */}
              {isLoggedIn ? (
                <div className="border-t border-border pt-4">
                  <div className="px-3 py-2">
                    <span className="text-sm text-muted-foreground">
                      Welcome, {userName}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="w-full text-left bg-destructive hover:bg-destructive/90 text-destructive-foreground block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="border-t border-border pt-4 space-y-2">
                  <button
                    onClick={handleLoginClick}
                    className="w-full text-left text-muted-foreground hover:text-foreground block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={handleRegisterClick}
                    className="w-full text-left bg-primary hover:bg-primary/90 text-primary-foreground block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
