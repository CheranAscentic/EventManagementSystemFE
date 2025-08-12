import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Calendar, MapPin, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiService } from '../api';
import { ApiResponseHandler, ApiError } from '../types';
import type { Event } from '../models';
import type { PaginatedResult } from '../contracts/response/GetEventsExtendedResponse';
import { eventUtils, dateUtils } from '../lib/utils';

export function EventsPage() {
  const [paginatedResult, setPaginatedResult] = useState<PaginatedResult<Event> | null>(null);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // Fixed items per page
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  const loadEventTypes = async () => {
    try {
      const eventTypesResponse = await apiService.getEventTypes();
      const eventTypesData = ApiResponseHandler.handleResponse(eventTypesResponse);
      setEventTypes(eventTypesData || []);
    } catch (error) {
      console.error('Error loading event types:', error);
      // Don't show error for event types failure, just log it
    }
  };

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const request = {
        itemsPerPage,
        pageNumber: currentPage,
        ...(searchTerm.trim().length >= 2 && { searchTerm: searchTerm.trim() }),
        ...(selectedType && { eventType: selectedType }),
        ...(startDate && { startDate: new Date(startDate).toISOString() }),
        ...(endDate && { endDate: new Date(endDate).toISOString() }),
      };
      
      const response = await apiService.getEventsExtended(request);
      
      if (response.isSuccess && response.value) {
        console.log('Events loaded:', response.value);
        setPaginatedResult(response.value);
      } else {
        setError(response.message || 'Failed to load events');
        setPaginatedResult(null);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to load events. Please try again.');
      }
      setPaginatedResult(null);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, currentPage, searchTerm, selectedType, startDate, endDate]);

  useEffect(() => {
    loadEventTypes();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}?source=events`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Get the events from paginated result
  const events = paginatedResult?.items || [];
  const totalCount = paginatedResult?.totalCount || 0;

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2 lg:col-span-2 xl:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Events
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  placeholder="Search by title, description, or location..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
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
                onChange={(e) => handleTypeChange(e.target.value)}
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
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Events</option>
                <option value="available">Available</option>
                <option value="open">Open</option>
                <option value="full">Full</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter Summary and Clear */}
          {(searchTerm || selectedType || selectedStatus || startDate || endDate) && (
            <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Showing {events.length} of {totalCount} events</span>
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
                {startDate && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    From: {new Date(startDate).toLocaleDateString()}
                  </span>
                )}
                {endDate && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                    Until: {new Date(endDate).toLocaleDateString()}
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
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={loadEvents}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedType || selectedStatus || startDate || endDate
                ? 'Try adjusting your search criteria.'
                : 'No events are available at the moment.'}
            </p>
            {(searchTerm || selectedType || selectedStatus || startDate || endDate) && (
              <button
                onClick={clearFilters}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
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
                        <Calendar className="h-16 w-16 text-blue-400" />
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
                        <Calendar className="h-4 w-4 mr-2" />
                        {dateUtils.formatEventDate(event.eventDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Tag className="h-4 w-4 mr-2" />
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
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
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
            
            {/* Pagination */}
            {paginatedResult && paginatedResult.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!paginatedResult.hasPreviousPage}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!paginatedResult.hasNextPage}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalCount)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{totalCount}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!paginatedResult.hasPreviousPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, paginatedResult.totalPages) }, (_, i) => {
                        let pageNumber;
                        if (paginatedResult.totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= paginatedResult.totalPages - 2) {
                          pageNumber = paginatedResult.totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNumber === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!paginatedResult.hasNextPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
