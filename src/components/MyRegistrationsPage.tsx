// My Registrations Page component for users to view and manage their event registrations

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../api';
import { ApiResponseHandler, ApiError } from '../types';
import type { EventRegistration, Event, AppUser } from '../models';
import { dateUtils } from '../lib/utils';
import { downloadEventCalendar } from '../lib/icsUtils';
import { ClipboardX } from 'lucide-react';
import { WarnPopup } from './PopupModal';

interface MyRegistrationsPageProps {
  currentUser: AppUser | null;
}

interface RegistrationWithEvent extends EventRegistration {
  event?: Event;
}

export function MyRegistrationsPage({ currentUser }: MyRegistrationsPageProps) {
  const navigate = useNavigate();
  
  const [registrations, setRegistrations] = useState<RegistrationWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'canceled' | 'all'>('active');
  const [cancelingRegistration, setCancelingRegistration] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [registrationToCancel, setRegistrationToCancel] = useState<RegistrationWithEvent | null>(null);

  const loadUserRegistrations = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading user registrations for:', currentUser.userId);
      
      const response = await apiService.getUserEventRegistrations(currentUser.userId);
      const userRegistrations = ApiResponseHandler.handleResponse(response);
      
      console.log('User registrations loaded:', userRegistrations);
      
      // Load event details for each registration
      if (userRegistrations && userRegistrations.length > 0) {
        const registrationsWithEvents = await Promise.all(
          userRegistrations.map(async (registration) => {
            try {
              const eventResponse = await apiService.getEvent(registration.eventId);
              const event = ApiResponseHandler.handleResponse(eventResponse);
              return { ...registration, event };
            } catch (error) {
              console.error(`Failed to load event ${registration.eventId}:`, error);
              return registration;
            }
          })
        );
        
        setRegistrations(registrationsWithEvents);
      } else {
        setRegistrations([]);
      }
    } catch (error) {
      console.error('Error loading user registrations:', error);
      
      if (error instanceof ApiError) {
        switch (error.status) {
          case 401:
            setError('Authentication required. Please log in.');
            break;
          case 404:
            setError('User not found.');
            break;
          default:
            setError(error.message);
        }
      } else {
        setError('Failed to load registrations. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadUserRegistrations();
    } else {
      setError('Please log in to view your registrations');
      setLoading(false);
    }
  }, [currentUser, loadUserRegistrations]); // Include all dependencies

  const handleCancelRegistration = async (registration: RegistrationWithEvent) => {
    if (!currentUser) return;
    
    setRegistrationToCancel(registration);
    setShowCancelModal(true);
  };

  const confirmCancelRegistration = async () => {
    if (!currentUser || !registrationToCancel) return;
    
    setCancelingRegistration(registrationToCancel.id);
    setShowCancelModal(false);
    
    try {
      console.log('Canceling registration:', registrationToCancel.id);
      
      const response = await apiService.cancelEventRegistration(registrationToCancel.id, {
        appUserId: currentUser.userId
      });
      
      ApiResponseHandler.handleResponse(response);
      
      console.log('Registration canceled successfully');
      
      // Reload registrations to get updated data
      await loadUserRegistrations();
      
    } catch (error) {
      console.error('Error canceling registration:', error);
      
      if (error instanceof ApiError) {
        alert(`Failed to cancel registration: ${error.message}`);
      } else {
        alert('Failed to cancel registration. Please try again.');
      }
    } finally {
      setCancelingRegistration(null);
      setRegistrationToCancel(null);
    }
  };

  const cancelCancelRegistration = () => {
    setShowCancelModal(false);
    setRegistrationToCancel(null);
  };

  const handleViewEvent = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  const handleDownloadCalendar = (registration: RegistrationWithEvent) => {
    if (!registration.event) {
      alert('Event details are not available for download.');
      return;
    }

    try {
      downloadEventCalendar(registration.event, registration);
    } catch (error) {
      console.error('Error downloading calendar file:', error);
      alert('Failed to download calendar file. Please try again.');
    }
  };

  const filterRegistrations = (registrations: RegistrationWithEvent[]) => {
    switch (activeTab) {
      case 'active':
        return registrations.filter(r => !r.isCanceled);
      case 'canceled':
        return registrations.filter(r => r.isCanceled);
      case 'all':
      default:
        return registrations;
    }
  };

  const getEventStatus = (registration: RegistrationWithEvent) => {
    if (registration.isCanceled) {
      return { text: 'Canceled', color: 'bg-destructive/10 text-destructive', canCancel: false };
    }
    
    if (!registration.event) {
      return { text: 'Unknown', color: 'bg-muted text-muted-foreground', canCancel: false };
    }
    
    const eventDate = new Date(registration.event.eventDate);
    const now = new Date();
    
    if (eventDate < now) {
      return { text: 'Completed', color: 'bg-muted text-muted-foreground', canCancel: false };
    }
    
    const cutoffDate = new Date(registration.event.registrationCutoffDate);
    if (cutoffDate < now) {
      return { text: 'Registration Closed', color: 'bg-accent text-accent-foreground', canCancel: false };
    }
    
    return { text: 'Active', color: 'bg-chart-1/10 text-chart-1', canCancel: true };
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-accent border border-border rounded-md p-6 max-w-md w-full mx-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-accent-foreground" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-accent-foreground">Authentication Required</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Please log in to view your event registrations.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading your registrations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-6 max-w-md w-full mx-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">Unable to load registrations</h3>
              <p className="mt-2 text-sm text-destructive">{error}</p>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={loadUserRegistrations}
                  className="text-sm text-destructive hover:text-destructive/80 font-medium"
                >
                  Try again
                </button>
                <button
                  onClick={() => navigate('/events')}
                  className="text-sm text-destructive hover:text-destructive/80 font-medium"
                >
                  Browse events
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredRegistrations = filterRegistrations(registrations);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Event Registrations</h1>
          <p className="text-muted-foreground">
            Manage your event registrations and view upcoming events.
          </p>
        </div>

        {/* Stats Summary */}
        {registrations.length > 0 && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card overflow-hidden shadow rounded-lg border border-border">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-chart-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        Active Registrations
                      </dt>
                      <dd className="text-lg font-medium text-foreground">
                        {registrations.filter(r => !r.isCanceled).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card overflow-hidden shadow rounded-lg border border-border">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        Canceled Registrations
                      </dt>
                      <dd className="text-lg font-medium text-foreground">
                        {registrations.filter(r => r.isCanceled).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card overflow-hidden shadow rounded-lg border border-border">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        Upcoming Events
                      </dt>
                      <dd className="text-lg font-medium text-foreground">
                        {registrations.filter(r => 
                          !r.isCanceled && 
                          r.event && 
                          new Date(r.event.eventDate) > new Date()
                        ).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-border">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'active' as const, label: 'Active', count: registrations.filter(r => !r.isCanceled).length },
              { key: 'canceled' as const, label: 'Canceled', count: registrations.filter(r => r.isCanceled).length },
              { key: 'all' as const, label: 'All', count: registrations.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {tab.label}
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.key
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Registrations List */}
        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardX className="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" />
            {/* <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg> */}
            <h3 className="mt-2 text-sm font-medium text-foreground">
              {activeTab === 'active' ? 'No active registrations' : 
               activeTab === 'canceled' ? 'No canceled registrations' : 'No registrations found'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeTab === 'active' ? 'You haven\'t registered for any events yet.' : 
               activeTab === 'canceled' ? 'You haven\'t canceled any registrations.' : 'You haven\'t registered for any events yet.'}
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Browse Events
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map((registration) => {
              const status = getEventStatus(registration);
              
              return (
                <div key={registration.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            {registration.event?.title || 'Event details unavailable'}
                          </h3>
                          <span className={`ml-3 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        
                        {registration.event && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {dateUtils.formatEventDate(registration.event.eventDate)}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {registration.event.location}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              {registration.event.type}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-3 text-sm text-gray-500">
                          <span className="font-medium">Registered:</span> {dateUtils.formatRegistrationDate(registration.registeredAt)}
                          <span className="mx-2">•</span>
                          <span className="font-medium">Name:</span> {registration.name}
                          <span className="mx-2">•</span>
                          <span className="font-medium">Email:</span> {registration.email}
                        </div>
                      </div>
                      
                      <div className="ml-6 flex space-x-3">
                        {registration.event && (
                          <>
                            <button
                              onClick={() => handleViewEvent(registration.eventId)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              View Event
                            </button>
                            
                            <button
                              onClick={() => handleDownloadCalendar(registration)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              title="Download event to your calendar"
                            >
                              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download Calendar
                            </button>
                          </>
                        )}
                        
                        {status.canCancel && (
                          <button
                            onClick={() => handleCancelRegistration(registration)}
                            disabled={cancelingRegistration === registration.id}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancelingRegistration === registration.id ? (
                              <>
                                <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full mr-2"></div>
                                Canceling...
                              </>
                            ) : (
                              'Cancel Registration'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Registration Modal */}
      <WarnPopup
        isOpen={showCancelModal}
        title="Cancel Registration"
        message={`Are you sure you want to cancel your registration for "${registrationToCancel?.event?.title || 'this event'}"?`}
        onConfirm={confirmCancelRegistration}
        onCancel={cancelCancelRegistration}
        isLoading={cancelingRegistration === registrationToCancel?.id}
        confirmText="Cancel Registration"
        cancelText="Keep Registration"
      />
    </div>
  );
}
