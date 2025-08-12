import { Calendar, CheckCircle, Users } from 'lucide-react';

export function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to CalVender
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your Calendar Events Management System - Discover and register for amazing events in your area
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-md mx-auto mb-4">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Browse Events</h3>
              <p className="text-gray-600">Explore a wide variety of events happening in your area</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-md mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Easy Registration</h3>
              <p className="text-gray-600">Register for events with just a few clicks</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-md mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Events</h3>
              <p className="text-gray-600">Create and manage your own events</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
