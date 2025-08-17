import { Calendar, CheckCircle, Users, Clock, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-accent/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Welcome to <span className="text-primary">CalVender</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Your comprehensive Calendar Events Management System. Discover amazing events, register with ease, and create unforgettable experiences in your community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/events/calendar" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg text-lg font-medium transition-all transform hover:scale-105 shadow-lg"
            >
              Browse Events Calendar
            </Link>
            <Link 
              to="/register" 
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-3 rounded-lg text-lg font-medium transition-all border border-border"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Everything You Need for Event Management
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            CalVender provides a complete solution for discovering, organizing, and managing events
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Link to="/events/calendar" className="group">
            <div className="bg-card p-8 rounded-xl shadow-md border border-border hover:shadow-lg transition-all hover:border-primary/50 hover:-translate-y-1">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Browse Events</h3>
              <p className="text-muted-foreground mb-4">Explore a comprehensive calendar view of events happening in your area with advanced filtering options</p>
              <span className="text-primary font-medium group-hover:underline">View Calendar →</span>
            </div>
          </Link>
          
          <Link to="/register" className="group">
            <div className="bg-card p-8 rounded-xl shadow-md border border-border hover:shadow-lg transition-all hover:border-chart-1/50 hover:-translate-y-1">
              <div className="flex items-center justify-center w-16 h-16 bg-chart-1/10 rounded-xl mx-auto mb-6 group-hover:bg-chart-1/20 transition-colors">
                <CheckCircle className="w-8 h-8 text-chart-1" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Easy Registration</h3>
              <p className="text-muted-foreground mb-4">Register for events with just a few clicks and manage all your event registrations in one place</p>
              <span className="text-chart-1 font-medium group-hover:underline">Sign Up →</span>
            </div>
          </Link>
          
          <Link to="/login" className="group">
            <div className="bg-card p-8 rounded-xl shadow-md border border-border hover:shadow-lg transition-all hover:border-chart-2/50 hover:-translate-y-1">
              <div className="flex items-center justify-center w-16 h-16 bg-chart-2/10 rounded-xl mx-auto mb-6 group-hover:bg-chart-2/20 transition-colors">
                <Users className="w-8 h-8 text-chart-2" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Manage Events</h3>
              <p className="text-muted-foreground mb-4">Create, edit, and manage your own events with our powerful admin tools and analytics</p>
              <span className="text-chart-2 font-medium group-hover:underline">Get Started →</span>
            </div>
          </Link>
        </div>

        {/* Additional Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-accent/10 to-accent/5 p-6 rounded-lg border border-accent/20">
            <div className="flex items-center mb-3">
              <Clock className="w-5 h-5 text-accent-foreground mr-2" />
              <h4 className="text-lg font-medium text-accent-foreground">Real-time Updates</h4>
            </div>
            <p className="text-muted-foreground text-sm">Get instant notifications about event changes and updates</p>
          </div>
          
          <div className="bg-gradient-to-br from-chart-3/10 to-chart-3/5 p-6 rounded-lg border border-chart-3/20">
            <div className="flex items-center mb-3">
              <MapPin className="w-5 h-5 text-chart-3 mr-2" />
              <h4 className="text-lg font-medium text-foreground">Location-based</h4>
            </div>
            <p className="text-muted-foreground text-sm">Find events near you with integrated location services</p>
          </div>
          
          <div className="bg-gradient-to-br from-chart-4/10 to-chart-4/5 p-6 rounded-lg border border-chart-4/20">
            <div className="flex items-center mb-3">
              <Star className="w-5 h-5 text-chart-4 mr-2" />
              <h4 className="text-lg font-medium text-foreground">Premium Experience</h4>
            </div>
            <p className="text-muted-foreground text-sm">Enjoy a seamless, user-friendly event management experience</p>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of users who trust CalVender for their event management needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/events/calendar" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg text-lg font-medium transition-all transform hover:scale-105 shadow-lg"
            >
              Explore Events
            </Link>
            <Link 
              to="/register" 
              className="bg-card hover:bg-accent text-foreground px-8 py-3 rounded-lg text-lg font-medium transition-all border border-border hover:border-accent"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
