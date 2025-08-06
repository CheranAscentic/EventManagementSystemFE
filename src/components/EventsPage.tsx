import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../api';
import { ApiResponseHandler, ApiError } from '../types';
import type { Event } from '../models';
import { eventUtils, dateUtils } from '../lib/utils';

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, searchTerm, selectedType, selectedStatus]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load both events and event types in parallel
      const [eventsResponse, eventTypesResponse] = await Promise.all([
        apiService.getAllEvents(),
        apiService.getEventTypes()
      ]);
      
      const eventsData = ApiResponseHandler.handleResponse(eventsResponse);
      const eventTypesData = ApiResponseHandler.handleResponse(eventTypesResponse);
      
      console.log('Events loaded:', eventsData);
      console.log('Event types loaded:', eventTypesData);
      
      setEvents(eventsData || []);
      setEventTypes(eventTypesData || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to load data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Filter by search term (title, description, location)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(term) ||
        event.description.toLowerCase().includes(term) ||
        event.location.toLowerCase().includes(term)
      );
    }

    // Filter by event type
    if (selectedType) {
      filtered = filtered.filter(event => event.type === selectedType);
    }

    // Filter by registration status
    if (selectedStatus === 'open') {
      filtered = filtered.filter(event => event.isOpenForRegistration);
    } else if (selectedStatus === 'closed') {
      filtered = filtered.filter(event => !event.isOpenForRegistration);
    } else if (selectedStatus === 'full') {
      filtered = filtered.filter(event => event.noOfRegistrations >= event.capacity);
    } else if (selectedStatus === 'available') {
      filtered = filtered.filter(event => eventUtils.canRegister(event));
    }

    setFilteredEvents(filtered);
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedStatus('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Events</h1>
          <p className="text-gray-600">
            Discover and join exciting events in your area
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Events
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  placeholder="Search by title, description, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Event Type Filter */}
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <select
                id="type-filter"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Registration Status
              </label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Events</option>
                <option value="available">Available</option>
                <option value="open">Open</option>
                <option value="full">Full</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Filter Summary and Clear */}
          {(searchTerm || selectedType || selectedStatus) && (
            <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Showing {filteredEvents.length} of {events.length} events</span>
                {searchTerm && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Search: "{searchTerm}"
                  </span>
                )}
                {selectedType && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    Type: {selectedType}
                  </span>
                )}
                {selectedStatus && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                    Status: {selectedStatus}
                  </span>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={loadInitialData}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedType || selectedStatus
                ? 'Try adjusting your search criteria.'
                : 'No events are available at the moment.'}
            </p>
            {(searchTerm || selectedType || selectedStatus) && (
              <button
                onClick={clearFilters}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const capacityPercentage = eventUtils.getCapacityPercentage(event);
              const capacityColor = eventUtils.getCapacityColorStyle(event);
              const registrationStatus = eventUtils.getUIEventStatus(event);
              const capacityLeft = eventUtils.getRemainingCapacity(event);

              return (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event.id)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
                >
                  {/* Event Image */}
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                        <svg className="h-16 w-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Event Content */}
                  <div className="p-6">
                    {/* Header with Status */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                        {event.title}
                      </h3>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${registrationStatus.color}`}>
                        {registrationStatus.text}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    {/* Event Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {dateUtils.formatEventDate(event.eventDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {event.type}
                      </div>
                    </div>

                    {/* Capacity Statistics */}
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Capacity</span>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${capacityColor}`}>
                          {capacityPercentage}% full
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            capacityPercentage >= 100 ? 'bg-red-600' :
                            capacityPercentage >= 80 ? 'bg-orange-500' :
                            capacityPercentage >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                        ></div>
                      </div>

                      {/* Capacity Details */}
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{event.noOfRegistrations} registered</span>
                        <span>{capacityLeft > 0 ? `${capacityLeft} spots left` : 'Full'}</span>
                        <span>{event.capacity} capacity</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
