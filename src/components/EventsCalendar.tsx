import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { apiService } from '../api';
import { ApiResponseHandler, ApiError } from '../types';
import type { Event } from '../models';
import { eventUtils } from '../lib/utils';

export function EventsCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'calendar' | 'dayView'>('calendar');
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
//   const [isCalendarInitialized, setIsCalendarInitialized] = useState(false);
  const navigate = useNavigate();

  // Load event types on component mount
  useEffect(() => {
    let isMounted = true;
    
    const loadEventTypes = async () => {
      try {
        const eventTypesResponse = await apiService.getEventTypes();
        const eventTypesData = ApiResponseHandler.handleResponse(eventTypesResponse);
        if (isMounted) {
          setEventTypes(eventTypesData || []);
        }
      } catch (error) {
        console.error('Error loading event types:', error);
      }
    };

    loadEventTypes();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Load events when filters or current date changes
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get the first and last day of the current month for date filtering
      // Use UTC to avoid timezone issues
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
    //   const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    //   const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

      // Calculate one month before the current month
    const startOfPreviousMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    
    // Calculate the last day of the month after the current month
    const endOfNextMonth = new Date(Date.UTC(year, month + 2, 0, 23, 59, 59, 999));
      
    //   console.log('Loading events for month:', {
    //     year,
    //     month: month + 1,
    //     startOfMonth: startOfMonth.toISOString(),
    //     endOfMonth: endOfMonth.toISOString()
    //   });
    console.log('Loading events for extended range:', {
      currentMonth: `${year}-${month + 1}`,
      startOfPreviousMonth: startOfPreviousMonth.toISOString(),
      endOfNextMonth: endOfNextMonth.toISOString(),
      rangeDescription: `${startOfPreviousMonth.getFullYear()}-${startOfPreviousMonth.getMonth() + 1} to ${endOfNextMonth.getFullYear()}-${endOfNextMonth.getMonth() + 1}`
    });
      
      const request = {
      itemsPerPage: 100, // Increased to accommodate 3 months of events
      pageNumber: 1,
      ...(searchTerm.trim().length >= 2 && { searchTerm: searchTerm.trim() }),
      ...(selectedType && { eventType: selectedType }),
      startDate: startOfPreviousMonth.toISOString(),
      endDate: endOfNextMonth.toISOString(),
    };
      
      console.log('API request:', request);
      
      const response = await apiService.getEventsExtended(request);
      
      if (response.isSuccess && response.value) {
        console.log('Calendar events loaded:', response.value);
        setEvents(response.value.items);
      } else {
        setError('Failed to load events: ' + response.message);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error loading calendar events:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to load events. Please try again.');
      }
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedType, currentDate]);

  // Load events when dependencies change - use a separate effect to avoid loops
  useEffect(() => {
    let isMounted = true;
    
    const executeLoadEvents = async () => {
      if (isMounted) {
        await loadEvents();
      }
    };

    const timeoutId = setTimeout(executeLoadEvents, 300); // Debounce API calls by 300ms

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [loadEvents]);

  // Transform events for FullCalendar format
  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.eventDate, // Use full datetime for proper week view positioning
    backgroundColor: eventUtils.canRegister(event) ? '#10b981' : '#ef4444', // Green if available, red if not
    borderColor: eventUtils.canRegister(event) ? '#059669' : '#dc2626',
    textColor: 'white',
    extendedProps: {
      description: event.description,
      location: event.location,
      type: event.type,
      capacity: event.capacity,
      registrations: event.noOfRegistrations,
      isOpenForRegistration: event.isOpenForRegistration,
    }
  }));

  // Handle event click
  const handleEventClick = (clickInfo: { event: { id: string } }) => {
    const eventId = clickInfo.event.id;
    navigate(`/event/${eventId}?source=calendar`);
  };

  // Handle date click for day view
  const handleDateClick = (dateClickInfo: { date: Date }) => {
    setSelectedDayDate(new Date(dateClickInfo.date));
    setCurrentView('dayView');
  };

  // Handle back to month view
  const handleBackToMonth = () => {
    setCurrentView('calendar');
    setSelectedDayDate(null);
  };

  // Handle date navigation - this is the key fix
  const handleDatesSet = (dateInfo: { start: Date; end: Date }) => {
    // Calculate the middle date of the month view to get the actual month being displayed
    // This is more reliable than using start date which might be from previous month
    const startTime = dateInfo.start.getTime();
    const endTime = dateInfo.end.getTime();
    const middleTime = startTime + (endTime - startTime) / 2;
    const newDate = new Date(middleTime);
    
    console.log('FullCalendar datesSet called:', {
      start: dateInfo.start.toISOString().split('T')[0],
      end: dateInfo.end.toISOString().split('T')[0],
      calculatedMonth: `${newDate.getFullYear()}-${newDate.getMonth() + 1}`,
      currentMonth: `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`
    });

    setCurrentDate(newDate);
    console.log('Calendar initialized for month:', `${newDate.getFullYear()}-${newDate.getMonth() + 1}`);
    return;
    
    // if (!isCalendarInitialized) {
    //   // First time initialization - set the flag and current date
    //   setIsCalendarInitialized(true);
    //   setCurrentDate(newDate);
    //   console.log('Calendar initialized for month:', `${newDate.getFullYear()}-${newDate.getMonth() + 1}`);
    //   return;
    // }
    
    // Only update if the month actually changed
    // if (newDate.getMonth() !== currentDate.getMonth() || newDate.getFullYear() !== currentDate.getFullYear()) {
    //   console.log('Month changed:', { 
    //     from: `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`,
    //     to: `${newDate.getFullYear()}-${newDate.getMonth() + 1}`
    //   });
    //   setCurrentDate(newDate);
    // }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Custom Day View */}
        {currentView === 'dayView' && selectedDayDate && (
          <div>
            {/* Day View Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Day View - {selectedDayDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h1>
                  <p className="text-muted-foreground">
                    Events for the selected day. Click on any event to see details.
                  </p>
                </div>
                <button
                  onClick={handleBackToMonth}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors"
                >
                  ← Back to Calendar
                </button>
              </div>
            </div>

            {/* Day Events */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Events Today</h2>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-destructive text-center py-8">
                  <p>{error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events
                    .filter((event: Event) => {
                      // Filter by search term
                      const matchesSearch = !searchTerm || 
                        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        event.description.toLowerCase().includes(searchTerm.toLowerCase());
                      
                      // Filter by event type
                      const matchesType = !selectedType || event.type === selectedType;
                      
                      // Filter by selected day
                      const eventDate = new Date(event.eventDate);
                      const selectedDate = selectedDayDate;
                      const matchesDate = eventDate.getDate() === selectedDate.getDate() &&
                                         eventDate.getMonth() === selectedDate.getMonth() &&
                                         eventDate.getFullYear() === selectedDate.getFullYear();
                      
                      return matchesSearch && matchesType && matchesDate;
                    })
                    .map((event: Event) => (
                      <div 
                        key={event.id}
                        className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleEventClick({ event: { id: event.id } })}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground mb-1">{event.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                            <div className="text-sm text-muted-foreground">
                              <p>
                                {new Date(event.eventDate).toLocaleString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </p>
                              <p>{event.location}</p>
                              <p>Max Attendees: {event.capacity}</p>
                            </div>
                          </div>
                          <div className="ml-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {event.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {events.filter((event: Event) => {
                    const matchesSearch = !searchTerm || 
                      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      event.description.toLowerCase().includes(searchTerm.toLowerCase());
                    
                    const matchesType = !selectedType || event.type === selectedType;
                    
                    const eventDate = new Date(event.eventDate);
                    const selectedDate = selectedDayDate;
                    const matchesDate = eventDate.getDate() === selectedDate.getDate() &&
                                       eventDate.getMonth() === selectedDate.getMonth() &&
                                       eventDate.getFullYear() === selectedDate.getFullYear();
                    
                    return matchesSearch && matchesType && matchesDate;
                  }).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No events scheduled for this day.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Regular Calendar View */}
        {currentView === 'calendar' && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Events Calendar</h1>
              <p className="text-muted-foreground">
                View events in month, week, or day format. Click on any event to see details or click on dates to navigate.
              </p>
            </div>

            {/* Main Content - Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Calendar Area - Left Side (3/4 width) */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Input */}
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2">
                    Search Events
                  </label>
                  <input
                    type="text"
                    id="search"
                    placeholder="Search by title, description, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-ring focus:border-ring"
                  />
                </div>

                {/* Event Type Filter */}
                <div>
                  <label htmlFor="type-filter" className="block text-sm font-medium text-foreground mb-2">
                    Event Type
                  </label>
                  <select
                    id="type-filter"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-ring focus:border-ring"
                  >
                    <option value="">All Types</option>
                    {eventTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full bg-muted text-muted-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Filter Summary */}
              {(searchTerm || selectedType) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>Active filters:</span>
                    {searchTerm && (
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                        Search: "{searchTerm}"
                      </span>
                    )}
                    {selectedType && (
                      <span className="bg-secondary/10 text-secondary-foreground px-2 py-1 rounded">
                        Type: {selectedType}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-destructive">{error}</p>
                    <button
                      onClick={loadEvents}
                      className="mt-2 text-sm text-destructive hover:text-destructive/80 font-medium"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {/* {loading && (
              <div className="bg-card rounded-lg shadow-sm border border-border p-8 mb-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading calendar events...</p>
                </div>
              </div>
            )} */}

            {/* Calendar */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                // initialDate={new Date(1997, 8, 3)}
                views={{
                  dayGridMonth: { buttonText: 'Month' },
                  timeGridWeek: { buttonText: 'Week' },
                  listDay: { buttonText: 'Day' }
                }}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,listDay'
                }}
                dateClick={handleDateClick}
                events={calendarEvents}
                eventClick={handleEventClick}
                datesSet={handleDatesSet}
                height="auto"
                dayMaxEvents={3} // Show max 3 events per day, then "+more" link
                moreLinkClick="popover"
                eventDisplay="block"
                eventTimeFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  omitZeroMinute: true,
                  meridiem: 'short'
                }}
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
                allDaySlot={true}
                eventDidMount={(info) => {
                  // Add tooltip with event details
                  const event = info.event;
                  info.el.title = `${event.title}\n${event.extendedProps.location}\n${event.extendedProps.type}\n${event.extendedProps.registrations}/${event.extendedProps.capacity} registered`;
                }}
              />
            </div>

            {/* Legend */}
            <div className="mt-6 bg-card rounded-lg shadow-sm border border-border p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Legend</h3>
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-chart-2 rounded mr-2"></div>
                  <span className="text-sm text-muted-foreground">Available for registration</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-destructive rounded mr-2"></div>
                  <span className="text-sm text-muted-foreground">Full or registration closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Right Side (1/4 width) */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden top-8 h-full">
              {/* Sidebar Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-foreground">Events List</h3>
                  <span className="text-sm text-muted-foreground">{events.length} events</span>
                </div>
                <button
                  onClick={() => navigate('/events')}
                  className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/80 transition-colors"
                >
                  View All Events
                </button>
              </div>

              {/* Events List */}
              <div className="max-h-190 overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="p-6 text-center">
                    <svg className="mx-auto h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-muted-foreground">No events found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {events.map((event) => {
                      const capacityPercentage = eventUtils.getCapacityPercentage(event);
                      const registrationStatus = eventUtils.getUIEventStatus(event);
                      
                      return (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick({ event: { id: event.id } })}
                          className="p-4 hover:bg-accent cursor-pointer transition-colors"
                        >
                          {/* Event Image */}
                          <div className="w-full h-24 bg-muted rounded-md mb-3 overflow-hidden">
                            {event.imageUrl ? (
                              <img
                                src={event.imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
                                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Event Details */}
                          <div>
                            <h4 className="font-medium text-foreground text-sm mb-1 line-clamp-2">{event.title}</h4>
                            <p className="text-xs text-muted-foreground mb-2">
                              {new Date(event.eventDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            
                            {/* Status Badge */}
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                eventUtils.canRegister(event)
                                  ? 'bg-chart-2/20 text-chart-2'
                                  : 'bg-destructive/20 text-destructive'
                              }`}>
                                <span className="text-white" style={{ color: registrationStatus.color }}>
                                  {registrationStatus.text}
                                </span>
                              </span>
                              
                              {/* Capacity */}
                              <span className="text-xs text-muted-foreground">
                                {event.noOfRegistrations}/{event.capacity}
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-2">
                              <div className="bg-muted rounded-full h-1">
                                <div
                                  className={`h-1 rounded-full transition-all duration-300 ${
                                    capacityPercentage >= 90 ? 'bg-destructive' :
                                    capacityPercentage >= 70 ? 'bg-chart-3' :
                                    'bg-chart-2'
                                  }`}
                                  style={{ width: `${capacityPercentage}%` }}
                                ></div>
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
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}