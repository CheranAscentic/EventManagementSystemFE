import { ChevronRight, X, ArrowLeft, Save, Loader2, Plus, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import type { EventInput, EventDropArg, EventClickArg } from '@fullcalendar/core';

// Complex Event Interface
interface SubEvent {
  id: string;
  subEventName: string;
  startTime: string;
  duration: number; // in minutes
  location?: string;
  description?: string;
}

// Complex Event Interface (for reference - not used in this demo)
// interface ComplexEvent {
//   id: string;
//   adminId: string;
//   title: string;
//   description: string;
//   startDate: string; // Overall event start date
//   endDate: string;   // Overall event end date
//   location: string;
//   type: string;
//   capacity: number;
//   isOpenForRegistration: boolean;
//   registrationCutoffDate: string;
//   noOfRegistrations: number;
//   imageUrl?: string | null;
//   registeredIds?: string[];
//   owner?: string;
//   subEvents: SubEvent[];
// }

interface CreateComplexEventRequest {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  type: string;
  capacity: number;
  registrationCutoffDate: string;
  subEvents: SubEvent[];
}

export function CreateComplexEventPage() {
  const navigate = useNavigate();
  const calendarRef = useRef<FullCalendar>(null);
  const draggableRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<CreateComplexEventRequest>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    type: '',
    capacity: 1,
    registrationCutoffDate: '',
    subEvents: []
  });
  
  const [eventTypes] = useState<string[]>(['Conference', 'Workshop', 'Seminar', 'Meeting', 'Training']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Sub event form state
  const [showSubEventForm, setShowSubEventForm] = useState(false);
  const [editingSubEvent, setEditingSubEvent] = useState<SubEvent | null>(null);
  const [subEventForm, setSubEventForm] = useState({
    subEventName: '',
    duration: 60,
    location: '',
    description: ''
  });

  // Calendar events state (scheduled sub-events)
  const [calendarEvents, setCalendarEvents] = useState<EventInput[]>([]);
  // Unscheduled sub-events list
  const [unscheduledSubEvents, setUnscheduledSubEvents] = useState<SubEvent[]>([]);

  useEffect(() => {
    // Initialize draggable for sub-events
    if (draggableRef.current) {
      new Draggable(draggableRef.current, {
        itemSelector: '.sub-event-item',
        eventData: function(eventEl) {
          const subEventId = eventEl.getAttribute('data-id');
          const subEvent = unscheduledSubEvents.find(se => se.id === subEventId);
          if (subEvent) {
            return {
              id: subEvent.id,
              title: subEvent.subEventName,
              duration: `${Math.floor(subEvent.duration / 60).toString().padStart(2, '0')}:${(subEvent.duration % 60).toString().padStart(2, '0')}`,
              backgroundColor: '#3b82f6',
              borderColor: '#1d4ed8',
              textColor: '#ffffff',
              extendedProps: {
                location: subEvent.location,
                description: subEvent.description,
                duration: subEvent.duration
              }
            };
          }
          return null;
        }
      });
    }
  }, [unscheduledSubEvents]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 1 : value
    }));
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubEventFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSubEventForm(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) || 60 : value
    }));
  };

  const handleEventReceive = (eventInfo: { event: { id: string; startStr: string; setEnd: (date: string) => void } }) => {
    // Handle external event being dropped on calendar
    const subEventId = eventInfo.event.id;
    const subEvent = unscheduledSubEvents.find(se => se.id === subEventId);
    
    if (subEvent) {
      // Move from unscheduled to scheduled
      const scheduledSubEvent: SubEvent = {
        ...subEvent,
        startTime: eventInfo.event.startStr
      };

      // Update form data
      setFormData(prev => ({
        ...prev,
        subEvents: [...prev.subEvents, scheduledSubEvent]
      }));

      // Remove from unscheduled list
      setUnscheduledSubEvents(prev => prev.filter(se => se.id !== subEventId));

      // Update calendar event with proper end time
      const endTime = new Date(new Date(eventInfo.event.startStr).getTime() + subEvent.duration * 60000).toISOString();
      eventInfo.event.setEnd(endTime);
    }
  };

  const handleEventDrop = (dropInfo: EventDropArg) => {
    const { event } = dropInfo;
    const subEventId = event.id;
    
    // Update sub event in form data
    setFormData(prev => ({
      ...prev,
      subEvents: prev.subEvents.map(se => 
        se.id === subEventId 
          ? { ...se, startTime: event.startStr }
          : se
      )
    }));

    // Update calendar events
    setCalendarEvents(prev => 
      prev.map(ce => 
        ce.id === subEventId 
          ? { ...ce, start: event.startStr, end: event.endStr }
          : ce
      )
    );
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const subEvent = formData.subEvents.find(se => se.id === clickInfo.event.id);
    if (subEvent) {
      setEditingSubEvent(subEvent);
      setSubEventForm({
        subEventName: subEvent.subEventName,
        duration: subEvent.duration,
        location: subEvent.location || '',
        description: subEvent.description || ''
      });
      setShowSubEventForm(true);
    }
  };

  const removeSubEvent = (subEventId: string) => {
    // Remove from scheduled events (form data)
    const removedSubEvent = formData.subEvents.find(se => se.id === subEventId);
    
    setFormData(prev => ({
      ...prev,
      subEvents: prev.subEvents.filter(se => se.id !== subEventId)
    }));

    // Remove from calendar
    setCalendarEvents(prev => prev.filter(ce => ce.id !== subEventId));

    // Add back to unscheduled list if it was scheduled
    if (removedSubEvent) {
      const unscheduledSubEvent: SubEvent = {
        ...removedSubEvent,
        startTime: '' // Clear the start time
      };
      setUnscheduledSubEvents(prev => [...prev, unscheduledSubEvent]);
    }
  };

  const removeUnscheduledSubEvent = (subEventId: string) => {
    // Remove from unscheduled list completely
    setUnscheduledSubEvents(prev => prev.filter(se => se.id !== subEventId));
  };

  const addSubEventToList = () => {
    if (!subEventForm.subEventName.trim()) return;

    const newSubEvent: SubEvent = {
      id: `sub-${Date.now()}`,
      subEventName: subEventForm.subEventName,
      startTime: '', // No start time yet
      duration: subEventForm.duration,
      location: subEventForm.location,
      description: subEventForm.description
    };

    // Add to unscheduled list
    setUnscheduledSubEvents(prev => [...prev, newSubEvent]);

    resetSubEventForm();
    setShowSubEventForm(false);
  };

  const saveSubEvent = () => {
    if (!subEventForm.subEventName.trim()) return;

    if (editingSubEvent) {
      // Update existing sub event
      const updatedSubEvent: SubEvent = {
        ...editingSubEvent,
        subEventName: subEventForm.subEventName,
        duration: subEventForm.duration,
        location: subEventForm.location,
        description: subEventForm.description
      };

      // Check if it's scheduled or unscheduled
      if (editingSubEvent.startTime) {
        // It's scheduled - update in form data and calendar
        setFormData(prev => ({
          ...prev,
          subEvents: prev.subEvents.map(se => 
            se.id === editingSubEvent.id ? updatedSubEvent : se
          )
        }));

        // Update calendar event
        const endTime = new Date(new Date(editingSubEvent.startTime).getTime() + subEventForm.duration * 60000).toISOString();
        setCalendarEvents(prev => 
          prev.map(ce => 
            ce.id === editingSubEvent.id 
              ? { ...ce, title: subEventForm.subEventName, end: endTime }
              : ce
          )
        );
      } else {
        // It's unscheduled - update in unscheduled list
        setUnscheduledSubEvents(prev => 
          prev.map(se => 
            se.id === editingSubEvent.id ? updatedSubEvent : se
          )
        );
      }
    } else {
      // Create new sub event and add to unscheduled list
      addSubEventToList();
    }

    resetSubEventForm();
    setShowSubEventForm(false);
  };

  const resetSubEventForm = () => {
    setSubEventForm({
      subEventName: '',
      duration: 60,
      location: '',
      description: ''
    });
    setEditingSubEvent(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Event title is required';
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    } else if (formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      errors.endDate = 'End date must be after start date';
    }
    
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }
    
    if (!formData.type.trim()) {
      errors.type = 'Event type is required';
    }
    
    if (formData.capacity < 1) {
      errors.capacity = 'Capacity must be at least 1';
    }
    
    if (!formData.registrationCutoffDate) {
      errors.registrationCutoffDate = 'Registration cutoff date is required';
    }

    if (formData.subEvents.length === 0) {
      errors.subEvents = 'At least one sub-event must be scheduled on the calendar';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      console.log('Creating complex event with data:', formData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Complex event created successfully!');
      
      // Navigate back (or to a success page)
      navigate('/admin/my-events');
      
    } catch (error) {
      console.error('Error creating complex event:', error);
      setError('Failed to create complex event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/my-events');
  };

  // Generate date input min values
  const now = new Date();
  const minDateTime = now.toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <button
                  onClick={() => navigate('/admin/my-events')}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  My Events
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="flex-shrink-0 h-4 w-4 text-muted-foreground mx-2" />
                  <span className="text-sm font-medium text-foreground">Create Complex Event</span>
                </div>
              </li>
            </ol>
          </nav>
          
          <h1 className="mt-4 text-3xl font-bold text-foreground">Create Complex Event</h1>
          <p className="mt-2 text-muted-foreground">
            Create a multi-day event with multiple sub-events across different dates and times.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-card shadow rounded-lg p-6 border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-6">Event Details</h2>
            
            {error && (
              <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <X className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-foreground">
                  Event Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring ${
                    fieldErrors.title ? 'border-destructive' : ''
                  }`}
                  placeholder="Enter event title"
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-sm text-destructive">{fieldErrors.title}</p>
                )}
              </div>

              {/* Event Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring"
                  placeholder="Enter event description"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-foreground">
                    Start Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    min={minDateTime}
                    className={`mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring ${
                      fieldErrors.startDate ? 'border-destructive' : ''
                    }`}
                  />
                  {fieldErrors.startDate && (
                    <p className="mt-1 text-sm text-destructive">{fieldErrors.startDate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-foreground">
                    End Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    min={formData.startDate || minDateTime}
                    className={`mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring ${
                      fieldErrors.endDate ? 'border-destructive' : ''
                    }`}
                  />
                  {fieldErrors.endDate && (
                    <p className="mt-1 text-sm text-destructive">{fieldErrors.endDate}</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-foreground">
                  Location <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring ${
                    fieldErrors.location ? 'border-destructive' : ''
                  }`}
                  placeholder="Enter event location"
                />
                {fieldErrors.location && (
                  <p className="mt-1 text-sm text-destructive">{fieldErrors.location}</p>
                )}
              </div>

              {/* Event Type and Capacity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-foreground">
                    Event Type <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring ${
                      fieldErrors.type ? 'border-destructive' : ''
                    }`}
                  >
                    <option value="">Select event type</option>
                    {eventTypes.map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.type && (
                    <p className="mt-1 text-sm text-destructive">{fieldErrors.type}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-foreground">
                    Capacity <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    min="1"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring ${
                      fieldErrors.capacity ? 'border-destructive' : ''
                    }`}
                    placeholder="Enter maximum attendees"
                  />
                  {fieldErrors.capacity && (
                    <p className="mt-1 text-sm text-destructive">{fieldErrors.capacity}</p>
                  )}
                </div>
              </div>

              {/* Registration Cutoff Date */}
              <div>
                <label htmlFor="registrationCutoffDate" className="block text-sm font-medium text-foreground">
                  Registration Cutoff Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="registrationCutoffDate"
                  name="registrationCutoffDate"
                  value={formData.registrationCutoffDate}
                  onChange={handleInputChange}
                  min={minDateTime}
                  max={formData.startDate}
                  className={`mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring ${
                    fieldErrors.registrationCutoffDate ? 'border-destructive' : ''
                  }`}
                />
                {fieldErrors.registrationCutoffDate && (
                  <p className="mt-1 text-sm text-destructive">{fieldErrors.registrationCutoffDate}</p>
                )}
              </div>

              {/* Sub Events Summary */}
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Sub Events ({formData.subEvents.length}) <span className="text-destructive">*</span>
                </label>
                {fieldErrors.subEvents && (
                  <p className="mt-1 text-sm text-destructive">{fieldErrors.subEvents}</p>
                )}
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {formData.subEvents.map((subEvent) => (
                    <div key={subEvent.id} className="flex items-center justify-between bg-secondary/50 p-2 rounded">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{subEvent.subEventName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(subEvent.startTime).toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({subEvent.duration}min)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSubEvent(subEvent.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring flex items-center"
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Complex Event
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Calendar Section */}
          <div className="space-y-6">
            {/* Sub Event Creator */}
            <div className="bg-card shadow rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-foreground">Sub Event Designer</h3>
                <button
                  type="button"
                  onClick={() => setShowSubEventForm(!showSubEventForm)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Sub Event
                </button>
              </div>

              {/* Sub Event Form */}
              {showSubEventForm && (
                <div className="bg-accent/50 p-4 rounded-lg mb-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Sub Event Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={subEventForm.subEventName}
                      onChange={(e) => handleSubEventFormChange(e)}
                      name="subEventName"
                      className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring"
                      placeholder="Enter sub event name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={subEventForm.duration}
                        onChange={(e) => handleSubEventFormChange(e)}
                        name="duration"
                        min="15"
                        step="15"
                        className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Location
                      </label>
                      <input
                        type="text"
                        value={subEventForm.location}
                        onChange={(e) => handleSubEventFormChange(e)}
                        name="location"
                        className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring"
                        placeholder="Room/Location"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Description
                    </label>
                    <textarea
                      value={subEventForm.description}
                      onChange={(e) => handleSubEventFormChange(e)}
                      name="description"
                      rows={2}
                      className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring"
                      placeholder="Brief description of the sub event"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSubEventForm(false);
                        resetSubEventForm();
                      }}
                      className="px-3 py-1 text-sm border border-border rounded text-foreground hover:bg-accent"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveSubEvent}
                      className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    >
                      {editingSubEvent ? 'Update' : 'Save'}
                    </button>
                  </div>
                </div>
              )}

              {/* Unscheduled Sub Events List */}
              <div ref={draggableRef} className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-foreground">
                    Unscheduled Sub Events ({unscheduledSubEvents.length})
                  </h4>
                </div>
                
                {unscheduledSubEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed border-border rounded-lg">
                    Create sub events above to see them here. Then drag them onto the calendar to schedule.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {unscheduledSubEvents.map((subEvent) => (
                      <div
                        key={subEvent.id}
                        data-id={subEvent.id}
                        className="sub-event-item flex items-center justify-between bg-primary/10 border border-primary/20 p-3 rounded-lg cursor-move hover:bg-primary/20 transition-colors"
                        draggable
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{subEvent.subEventName}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {subEvent.duration} min
                              </span>
                              {subEvent.location && (
                                <span className="flex items-center text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {subEvent.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSubEvent(subEvent);
                              setSubEventForm({
                                subEventName: subEvent.subEventName,
                                duration: subEvent.duration,
                                location: subEvent.location || '',
                                description: subEvent.description || ''
                              });
                              setShowSubEventForm(true);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                            title="Edit sub event"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeUnscheduledSubEvent(subEvent.id)}
                            className="text-destructive hover:text-destructive/80"
                            title="Delete sub event"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-3 flex items-center">
                  <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l4-4m0 0l4-4m-4 4v12" />
                  </svg>
                  Drag sub events onto the calendar to schedule them
                </p>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-card shadow rounded-lg p-6 border border-border">
              <h3 className="text-lg font-medium text-foreground mb-4">Event Calendar</h3>
              <div className="calendar-container">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  initialView="timeGridWeek"
                  nowIndicator={true}
                  editable={true}
                  selectable={false}
                  droppable={true}
                  events={calendarEvents}
                  eventReceive={handleEventReceive}
                  eventDrop={handleEventDrop}
                  eventClick={handleEventClick}
                  height="500px"
                  validRange={{
                    start: formData.startDate || undefined,
                    end: formData.endDate || undefined
                  }}
                  businessHours={{
                    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
                    startTime: '08:00',
                    endTime: '22:00',
                  }}
                  slotMinTime="06:00:00"
                  slotMaxTime="24:00:00"
                  slotDuration="00:30:00"
                  eventMinHeight={30}
                  expandRows={true}
                />
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground space-y-1">
                <p className="flex items-center">
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l4-4m0 0l4-4m-4 4v12" />
                  </svg>
                  Drag sub events from the list above onto the calendar to schedule them
                </p>
                <p className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Drag scheduled events to reschedule them
                </p>
                <p className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Click on scheduled events to edit their details
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
