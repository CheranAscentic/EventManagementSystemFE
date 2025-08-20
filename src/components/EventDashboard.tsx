// Event Dashboard component for admin users to view detailed event statistics

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Tag, 
  Edit2, 
  Trash2, 
  Users, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import { apiService } from '../api'
import { ApiResponseHandler, ApiError } from '../types'
import type { Event, EventRegistration } from '../models'
import { dateUtils, eventUtils } from '../lib/utils'
import { WarnPopup } from './PopupModal'

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
      <div className="min-h-screen bg-background">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading event dashboard...</span>
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
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-destructive">{error}</p>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => eventId && loadEventData(eventId)}
                  className="text-sm text-destructive hover:text-destructive/80 font-medium"
                >
                  Try again
                </button>
                <button
                  onClick={handleBackToEvents}
                  className="text-sm text-destructive hover:text-destructive/80 font-medium"
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
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
                    <ArrowLeft className="flex-shrink-0 h-5 w-5" />
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
                    <ChevronRight className="flex-shrink-0 h-5 w-5 text-gray-300" />
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
                <h1 className="text-2xl font-bold text-foreground mb-2">{event.title}</h1>
                <p className="text-muted-foreground mb-4">{event.description}</p>
                
                {/* Event Meta Info */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {dateUtils.formatEventDate(event.eventDate)}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {event.location}
                  </div>
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 mr-2" />
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
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Event
                </button>
                <button 
                  onClick={confirmDelete}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border mt-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('registrations')}
              className={`${
                activeTab === 'registrations'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Users className="mr-2 h-4 w-4" />
              Registrations
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`${
                activeTab === 'analytics'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card overflow-hidden shadow rounded-lg border border-border">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-muted-foreground truncate">Total Registrations</dt>
                        <dd className="text-lg font-medium text-card-foreground">{activeRegistrations.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-muted px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">Capacity: </span>
                    <span className="text-card-foreground">{event.capacity}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BarChart3 className="h-6 w-6 text-gray-400" />
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
                      <AlertCircle className="h-6 w-6 text-gray-400" />
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
                      <Calendar className="h-6 w-6 text-gray-400" />
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
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
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
      <WarnPopup
        isOpen={showDeleteModal}
        title="Delete Event"
        message={`Are you sure you want to delete "${event?.title}"? This action cannot be undone and will cancel all existing registrations.`}
        onConfirm={handleDeleteEvent}
        onCancel={cancelDelete}
        isLoading={deleting}
        confirmText={deleting ? 'Deleting...' : 'Delete Event'}
        cancelText="Cancel"
        warningDetails={
          event && event.noOfRegistrations > 0 ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This event has {event.noOfRegistrations} registered attendees.
                Deleting will cancel all registrations.
              </p>
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
