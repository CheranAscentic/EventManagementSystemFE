// Event Dashboard component for admin users to view detailed event statistics

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../api';
import { ApiResponseHandler, ApiError } from '../types';
import type { Event, EventRegistration } from '../models';
import { eventUtils, dateUtils } from '../lib/utils';

export function EventDashboard() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'analytics'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEventData(eventId);
    } else {
      setError('Event ID not provided');
      setLoading(false);
    }
  }, [eventId]);

  const loadEventData = async (id: string) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading event dashboard data for:', id);
      
      // Load event details and registrations in parallel
      const [eventResponse, registrationsResponse] = await Promise.all([
        apiService.getEvent(id),
        apiService.getEventRegistrations(id)
      ]);
      
      const eventData = ApiResponseHandler.handleResponse(eventResponse);
      const registrationsData = ApiResponseHandler.handleResponse(registrationsResponse);
      
      console.log('Event data loaded:', eventData);
      console.log('Registrations data loaded:', registrationsData);
      
      if (eventData) {
        setEvent(eventData);
        setRegistrations(registrationsData || []);
      } else {
        setError('Event not found');
      }
    } catch (error) {
      console.error('Error loading event dashboard data:', error);
      
      if (error instanceof ApiError) {
        switch (error.status) {
          case 401:
            setError('Authentication required. Please log in.');
            break;
          case 403:
            setError('Access denied. You can only view events you own.');
            break;
          case 404:
            setError('Event not found.');
            break;
          default:
            setError(error.message);
        }
      } else {
        setError('Failed to load event data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEvents = () => {
    navigate('/admin/my-events');
  };

  const handleEditEvent = () => {
    if (event) {
      navigate(`/admin/edit-event/${event.id}`);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    
    setDeleting(true);
    setError('');

    try {
      console.log('Deleting event:', event.id);
      
      const response = await apiService.deleteEvent(event.id);
      ApiResponseHandler.handleResponse(response);
      
      console.log('Event deleted successfully');
      
      // Navigate back to events list
      navigate('/admin/my-events');
      
    } catch (error) {
      console.error('Error deleting event:', error);
      setDeleting(false);
      setShowDeleteModal(false);
      
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to delete event. Please try again.');
      }
    }
  };

  const confirmDelete = () => {
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading event dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-md w-full mx-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => eventId && loadEventData(eventId)}
                  className="text-sm text-red-600 hover:text-red-500 font-medium"
                >
                  Try again
                </button>
                <button
                  onClick={handleBackToEvents}
                  className="text-sm text-red-600 hover:text-red-500 font-medium"
                >
                  Back to events
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  // Calculate statistics
  const activeRegistrations = registrations.filter(r => !r.isCanceled);
  const canceledRegistrations = registrations.filter(r => r.isCanceled);
  const capacityPercentage = eventUtils.getCapacityPercentage(event);
  const remainingCapacity = eventUtils.getRemainingCapacity(event);
  const status = eventUtils.getEventStatus(event);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Breadcrumb */}
            <nav className="flex mb-4" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <button
                    onClick={handleBackToEvents}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="flex-shrink-0 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 000 1.414l7 7a1 1 0 001.414-1.414L4.414 10l6.293-6.293a1 1 0 000-1.414z" />
                    </svg>
                    <span className="sr-only">Back</span>
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <button
                      onClick={handleBackToEvents}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      My Events
                    </button>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="flex-shrink-0 h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-4 text-sm font-medium text-gray-500" aria-current="page">
                      Event Dashboard
                    </span>
                  </div>
                </li>
              </ol>
            </nav>

            {/* Event Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
                <p className="text-gray-600 mb-4">{event.description}</p>
                
                {/* Event Meta Info */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {dateUtils.formatEventDate(event.eventDate)}
                  </div>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {event.location}
                  </div>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {event.type}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.text}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 ml-6">
                <button
                  onClick={handleEditEvent}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Event
                </button>
                <button 
                  onClick={confirmDelete}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 mt-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { id: 'registrations', name: 'Registrations', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
              { id: 'analytics', name: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'registrations' | 'analytics')}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Registrations</dt>
                        <dd className="text-lg font-medium text-gray-900">{activeRegistrations.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-gray-500">Capacity: </span>
                    <span className="text-gray-900">{event.capacity}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Capacity Filled</dt>
                        <dd className="text-lg font-medium text-gray-900">{capacityPercentage}%</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-gray-500">Remaining: </span>
                    <span className="text-gray-900">{remainingCapacity} spots</span>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Canceled</dt>
                        <dd className="text-lg font-medium text-gray-900">{canceledRegistrations.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-gray-500">Rate: </span>
                    <span className="text-gray-900">
                      {registrations.length > 0 ? Math.round((canceledRegistrations.length / registrations.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Days Until Event</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {Math.max(0, Math.ceil((new Date(event.eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-gray-500">Status: </span>
                    <span className="text-gray-900">{dateUtils.isPastDate(event.eventDate) ? 'Past' : 'Upcoming'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Capacity Progress */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Registration Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Capacity Utilization</span>
                    <span>{activeRegistrations.length} / {event.capacity} ({capacityPercentage}%)</span>
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
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Event Details</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Event Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{dateUtils.formatEventDate(event.eventDate)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Registration Cutoff</dt>
                  <dd className="mt-1 text-sm text-gray-900">{dateUtils.formatEventDate(event.registrationCutoffDate)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">{event.location}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Event Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{event.type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Registration Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {event.isOpenForRegistration ? 'Open' : 'Closed'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Maximum Capacity</dt>
                  <dd className="mt-1 text-sm text-gray-900">{event.capacity} attendees</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'registrations' && (
          <div className="space-y-6">
            {/* Registrations Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Event Registrations</h3>
                <div className="flex space-x-4 text-sm">
                  <span className="text-green-600 font-medium">
                    Active: {activeRegistrations.length}
                  </span>
                  <span className="text-red-600 font-medium">
                    Canceled: {canceledRegistrations.length}
                  </span>
                </div>
              </div>

              {/* Registrations List */}
              {registrations.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No one has registered for this event yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registration Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {registrations.map((registration) => (
                        <tr key={registration.id} className={registration.isCanceled ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {registration.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {dateUtils.formatRegistrationDate(registration.registeredAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              registration.isCanceled 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {registration.isCanceled ? 'Canceled' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              <div>{registration.email}</div>
                              <div className="text-gray-400">{registration.phone}</div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics</h3>
              <p className="text-gray-500">Analytics features coming soon...</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Event</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "<strong>{event?.title}</strong>"? 
                  This action cannot be undone and will cancel all existing registrations.
                </p>
                {event && event.noOfRegistrations > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Warning:</strong> This event has {event.noOfRegistrations} registered attendees.
                      Deleting will cancel all registrations.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-center space-x-3 pt-4">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteEvent}
                  disabled={deleting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Event'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
