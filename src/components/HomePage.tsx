import { Calendar, CheckCircle, Users } from 'lucide-react';

export function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome to CalVender
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Your Calendar Events Management System - Discover and register for amazing events in your area
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-card p-6 rounded-lg shadow-md border border-border">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-md mx-auto mb-4">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-card-foreground mb-2">Browse Events</h3>
              <p className="text-muted-foreground">Explore a wide variety of events happening in your area</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-md border border-border">
              <div className="flex items-center justify-center w-12 h-12 bg-chart-1/10 rounded-md mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-chart-1" />
              </div>
              <h3 className="text-lg font-medium text-card-foreground mb-2">Easy Registration</h3>
              <p className="text-muted-foreground">Register for events with just a few clicks</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-md border border-border">
              <div className="flex items-center justify-center w-12 h-12 bg-chart-2/10 rounded-md mx-auto mb-4">
                <Users className="w-6 h-6 text-chart-2" />
              </div>
              <h3 className="text-lg font-medium text-card-foreground mb-2">Manage Events</h3>
              <p className="text-muted-foreground">Create and manage your own events</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
