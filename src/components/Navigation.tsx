import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, ChevronDown } from 'lucide-react';

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
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleLogoutClick = () => {
    onLogout?.();
    navigate('/login');
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
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleUserDropdown}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="hidden sm:block">{userName}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {/* User Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg border border-border z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border">
                        Welcome, {userName}
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        View Profile
                      </Link>
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          handleLogoutClick();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
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
                  Sign Up
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
                  <div className="px-3 py-2 flex items-center space-x-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Welcome, {userName}
                    </span>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors mx-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="w-full text-left bg-destructive hover:bg-destructive/90 text-destructive-foreground block px-3 py-2 rounded-md text-base font-medium transition-colors mx-2 mt-2"
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
                    Sign Up
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
