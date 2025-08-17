import { AlertTriangle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../api';
import { ApiResponseHandler, ApiError } from '../types';
import type { Event, AppUser } from '../models';
import { eventUtils, dateUtils } from '../lib/utils';

interface EventDetailPageProps {
  currentUser: AppUser | null;
}

export function EventDetailPage({ currentUser }: EventDetailPageProps) {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const navigate = useNavigate();
  const [userIsRegistered, setUserIsRegistered] = useState(false);

  // Get the source parameter to determine where to navigate back to
  const source = searchParams.get('source');

  const handleBackNavigation = () => {
    if (source === 'calendar') {
      navigate('/events/calendar');
    } else {
      navigate('/events'); // Default to events list
    }
  };

  const loadEvent = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading event:', id);
      
      // For now, we'll use getAllEvents and filter by ID
      // TODO: Create a getEventById API method when available
    //   const response = await apiService.getAllEvents();
    //   const eventsData = ApiResponseHandler.handleResponse(response);
    //   const foundEvent = eventsData?.find((e: Event) => e.id === id);

      const response = await apiService.getEvent(id);

      const foundEvent = ApiResponseHandler.handleResponse(response);

        console.log('Found event:', foundEvent);

      if (foundEvent) {
        setEvent(foundEvent);

        if (currentUser) {
            // Check if current user is registered for this event
            const isRegistered = foundEvent.registeredIds?.includes(currentUser.userId) || false;
            console.log('Did not find ', currentUser.userId, ' in ', foundEvent.registeredIds);
            console.log('User registration status:', isRegistered);
            setUserIsRegistered(isRegistered);
        }

      } else {
        setError('Event not found');
      }
    } catch (error) {
      console.error('Error loading event:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to load event. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (eventId) {
      loadEvent(eventId);
    } else {
      setError('Event ID not provided');
      setLoading(false);
    }
  }, [eventId, loadEvent]);

  // Prefill registration form with user data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setRegistrationData({
        name: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.userName,
        email: currentUser.email || '',
        phone: currentUser.phoneNumber || ''
      });
    }
  }, [currentUser]);

  const formatRegistrationCutoff = (dateString: string) => {
    const cutoffDate = dateUtils.safeParseDate(dateString);
    const isExpired = cutoffDate ? dateUtils.isPastDate(dateString) : false;
    
    return {
      formatted: dateUtils.formatEventDate(dateString),
      isExpired
    };
  };

  const handleRegistrationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegistrationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterClick = () => {
    if (!currentUser) {
      alert('Please log in to register for events');
      navigate('/login');
      return;
    }
    setShowRegistrationForm(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !event) return;
    
    // Validate form
    if (!registrationData.name.trim() || !registrationData.email.trim() || !registrationData.phone.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    
    setRegistering(true);
    
    try {
      console.log('Registering for event:', event.id);
      
      const response = await apiService.registerForEvent({
        appUserId: currentUser.userId,
        eventId: event.id,
        name: registrationData.name.trim(),
        email: registrationData.email.trim(),
        phoneNumber: registrationData.phone.trim()
      });
      
      const registration = ApiResponseHandler.handleResponse(response);
      console.log('Registration successful:', registration);
      
      // Reload event to get updated registration count
      await loadEvent(event.id);
      
      // Close form and show success
      setShowRegistrationForm(false);
      alert(`Successfully registered for "${event.title}"! You should receive a confirmation email shortly.`);
      
    } catch (error) {
      console.error('Registration failed:', error);
      
      if (error instanceof ApiError) {
        switch (error.status) {
          case 400:
            alert('Registration failed: ' + error.message);
            break;
          case 401:
            alert('Please log in to register for events');
            break;
          case 409:
            alert('You are already registered for this event');
            break;
          default:
            alert('Registration failed: ' + error.message);
        }
      } else {
        alert('Registration failed. Please try again.');
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = () => {
    setShowRegistrationForm(false);
    // Reset form to user data
    if (currentUser) {
      setRegistrationData({
        name: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.userName,
        email: currentUser.email || '',
        phone: currentUser.phoneNumber || ''
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">Error</h2>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <div className="mt-6 space-x-4">
            <button
              onClick={handleBackNavigation}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {source === 'calendar' ? 'Back to Calendar' : 'Back to Events'}
            </button>
            {eventId && (
              <button
                onClick={() => loadEvent(eventId)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Event not found</p>
          <button
            onClick={handleBackNavigation}
            className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {source === 'calendar' ? 'Back to Calendar' : 'Back to Events'}
          </button>
        </div>
      </div>
    );
  }

  const capacityPercentage = eventUtils.getCapacityPercentage(event);
  const registrationStatus = eventUtils.getUIEventStatus(event);
  const capacityLeft = eventUtils.getRemainingCapacity(event);
  const cutoffInfo = formatRegistrationCutoff(event.registrationCutoffDate);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Image */}
      <div className="relative h-96 bg-muted overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-chart-2">
            <svg className="h-24 w-24 text-primary-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black opacity-40"></div>
        
        {/* Breadcrumb and Back Button */}
        <div className="absolute top-4 left-4">
          <button
            onClick={handleBackNavigation}
            className="flex items-center text-white hover:text-white/80 transition-colors"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {source === 'calendar' ? 'Back to Calendar' : 'Back to Events'}
          </button>
        </div>

        {/* Event Title and Status */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{event.title}</h1>
                <div className="flex items-center space-x-4 text-white/90">
                  <span className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {dateUtils.formatEventDate(event.eventDate)}
                  </span>
                  <span className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location}
                  </span>
                  {event.owner && (
                    <span className="flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {event.owner}
                    </span>
                  )}
                </div>
              </div>
              <span className={`px-4 py-2 text-sm font-medium rounded-full ${registrationStatus.color}`}>
                {registrationStatus.text}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Event</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>

            {/* Event Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Event Type</label>
                    <p className="text-gray-900">{event.type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date & Time</label>
                    <p className="text-gray-900">{dateUtils.formatEventDate(event.eventDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                    <p className="text-gray-900">{event.location}</p>
                  </div>
                  {event.owner && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Organizer</label>
                      <p className="text-gray-900">{event.owner}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Capacity</label>
                    <p className="text-gray-900">{event.capacity} attendees</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Current Registrations</label>
                    <p className="text-gray-900">{event.noOfRegistrations} registered</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Registration Deadline</label>
                    <p className={`${cutoffInfo.isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                      {cutoffInfo.formatted}
                      {cutoffInfo.isExpired && ' (Expired)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration</h3>
              
              {/* Capacity Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>Capacity</span>
                  <span>{capacityPercentage}% full</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      capacityPercentage >= 100 ? 'bg-red-600' :
                      capacityPercentage >= 80 ? 'bg-orange-500' :
                      capacityPercentage >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>{event.noOfRegistrations} registered</span>
                  <span>{capacityLeft > 0 ? `${capacityLeft} spots left` : 'Full'}</span>
                </div>
              </div>

              {/* Registration Status */}
              <div className={`p-4 rounded-lg mb-4 ${registrationStatus.color.replace('text-', 'border-').replace('bg-', 'bg-').replace('-600', '-200').replace('-100', '-50')} border`}>
                <p className="text-sm font-medium">{registrationStatus.text}</p>
                {!cutoffInfo.isExpired && event.isOpenForRegistration && capacityLeft > 0 && (
                  <p className="text-xs mt-1 opacity-75">
                    Registration closes on {cutoffInfo.formatted}
                  </p>
                )}
              </div>

              {/* Registration Button/Form */}
              {!showRegistrationForm ? (
                <button
                  onClick={handleRegisterClick}
                  disabled={!registrationStatus.canRegister || !currentUser || userIsRegistered}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                    registrationStatus.canRegister && currentUser
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                >
                  {!currentUser
                    ? 'Log In to Register'
                    : !registrationStatus.canRegister
                    ? registrationStatus.text
                    : userIsRegistered
                    ? 'User Already Registered'
                    : 'Register for Event'
                }
                </button>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={registrationData.name}
                      onChange={handleRegistrationInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={registrationData.email}
                      onChange={handleRegistrationInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={registrationData.phone}
                      onChange={handleRegistrationInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelRegistration}
                      disabled={registering}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={registering}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {registering ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full mr-2"></div>
                          Registering...
                        </div>
                      ) : (
                        'Confirm Registration'
                      )}
                    </button>
                  </div>
                </form>
              )}
              
              {!currentUser && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Please <button onClick={() => navigate('/login')} className="text-blue-600 hover:text-blue-800 underline">log in</button> to register for this event
                </p>
              )}
            </div>

            {/* Statistics Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Capacity</span>
                  <span className="text-sm font-medium text-gray-900">{event.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Registered</span>
                  <span className="text-sm font-medium text-gray-900">{event.noOfRegistrations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Available Spots</span>
                  <span className="text-sm font-medium text-gray-900">{capacityLeft}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Capacity Used</span>
                  <span className="text-sm font-medium text-gray-900">{capacityPercentage}%</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Registration Status</span>
                  <span className={`text-sm font-medium ${
                    event.isOpenForRegistration ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {event.isOpenForRegistration ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
