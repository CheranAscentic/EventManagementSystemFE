// Example React component for displaying owner events

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../api';
import { ApiResponseHandler, ApiError } from '../types';
import type { Event } from '../models';
import { eventUtils, dateUtils } from '../lib/utils';

export function OwnerEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadOwnerEvents();
  }, []);

  const loadOwnerEvents = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading owner events...');
      
      // Call the new getOwnerEvents API method
      const response = await apiService.getOwnerEvents();
      const ownerEvents = ApiResponseHandler.handleResponse(response);
      
      console.log('Owner events loaded:', ownerEvents);
      
      setEvents(ownerEvents || []);
    } catch (error) {
      console.error('Error loading owner events:', error);
      
      if (error instanceof ApiError) {
        switch (error.status) {
          case 401:
            setError('Authentication required. Please log in.');
            break;
          case 403:
            setError('Access denied. Only admin users can view owner events.');
            break;
          case 404:
            setError('User not found.');
            break;
          default:
            setError(error.message);
        }
      } else {
        setError('Failed to load owner events. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/admin/event-dashboard/${eventId}`);
  };

  const handleCreateEvent = () => {
    navigate('/admin/create-event');
  };

  const handleEditEvent = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event card click
    navigate(`/admin/edit-event/${eventId}`);
  };

  const handleViewDetails = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event card click
    navigate(`/admin/event-dashboard/${eventId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading your events...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={loadOwnerEvents}
              className="mt-2 text-sm text-destructive hover:text-destructive/80 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Events</h1>
            <p className="text-muted-foreground">
              Manage events that you have created as an admin.
            </p>
          </div>
          <button
            onClick={handleCreateEvent}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Event
          </button>
        </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-foreground">No events created</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            You haven't created any events yet. Create your first event to get started.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleCreateEvent}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Event
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const capacityPercentage = eventUtils.getCapacityPercentage(event);
            const status = eventUtils.getUIEventStatus(event);
            const remainingCapacity = eventUtils.getRemainingCapacity(event);

            return (
              <div
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                className="bg-card rounded-lg shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
              >
                {/* Event Image */}
                <div className="h-48 bg-muted overflow-hidden">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                      <svg className="h-16 w-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Event Content */}
                <div className="p-6">
                  {/* Header with Status */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-card-foreground line-clamp-2 flex-1">
                      {event.title}
                    </h3>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                      {status.text}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {dateUtils.formatEventDate(event.eventDate)}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {event.type}
                    </div>
                  </div>

                  {/* Capacity Information */}
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-card-foreground">Registrations</span>
                      <span className="text-sm text-muted-foreground">
                        {event.noOfRegistrations} / {event.capacity}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-muted rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          capacityPercentage >= 100 ? 'bg-destructive' :
                          capacityPercentage >= 80 ? 'bg-chart-4' :
                          capacityPercentage >= 60 ? 'bg-chart-3' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{capacityPercentage}% full</span>
                      <span>{remainingCapacity > 0 ? `${remainingCapacity} spots left` : 'Full'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex space-x-2">
                    <button 
                      onClick={(e) => handleEditEvent(event.id, e)}
                      className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Edit Event
                    </button>
                    <button 
                      onClick={(e) => handleViewDetails(event.id, e)}
                      className="flex-1 bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors"
                    >
                      View Dashboard
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Statistics */}
      {events.length > 0 && (
        <div className="mt-8 bg-card rounded-lg p-6 border border-border">
          <h3 className="text-lg font-medium text-card-foreground mb-4">Event Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{events.length}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-1">
                {events.filter(e => eventUtils.isRegistrationOpen(e)).length}
              </div>
              <div className="text-sm text-muted-foreground">Open for Registration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-2">
                {events.reduce((sum, e) => sum + e.noOfRegistrations, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Registrations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-3">
                {events.reduce((sum, e) => sum + e.capacity, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Capacity</div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button - shows when there are events */}
      {events.length > 0 && (
        <button
          onClick={handleCreateEvent}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring z-50"
          title="Create New Event"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
      </div>
    </div>
  );
}
