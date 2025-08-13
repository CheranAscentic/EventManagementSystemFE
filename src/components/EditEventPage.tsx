import { AlertTriangle , ChevronRight, CloudUpload, Trash2 } from 'lucide-react';
// Edit Event Page component for Admin users to edit existing events

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../api';
import { ApiResponseHandler, ApiError, ValidationError } from '../types';
import type { UpdateEventRequest } from '../contracts/request/EventRequests';
import type { Event } from '../models';

export function EditEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  
  const [originalEvent, setOriginalEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<UpdateEventRequest>({
    title: '',
    description: '',
    eventDate: '',
    location: '',
    type: '',
    capacity: 1,
    registrationCutoffDate: ''
  });
  
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [typesLoading, setTypesLoading] = useState(true);
  
  // Image upload state
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (eventId) {
      loadEventData(eventId);
      loadEventTypes();
    } else {
      setError('Event ID not provided');
      setInitialLoading(false);
    }
  }, [eventId]);

  const loadEventData = async (id: string) => {
    try {
      setInitialLoading(true);
      setError('');
      
      const response = await apiService.getEvent(id);
      const event = ApiResponseHandler.handleResponse(response);
      
      if (event) {
        setOriginalEvent(event);
        
        // Convert event data to form format
        const eventDate = new Date(event.eventDate).toISOString().slice(0, 16);
        const cutoffDate = new Date(event.registrationCutoffDate).toISOString().slice(0, 16);
        
        setFormData({
          title: event.title,
          description: event.description || '',
          eventDate: eventDate,
          location: event.location,
          type: event.type,
          capacity: event.capacity,
          registrationCutoffDate: cutoffDate
        });
        
        // Set existing image URL
        setImageUrl(event.imageUrl || '');
      } else {
        setError('Event not found');
      }
    } catch (error) {
      console.error('Error loading event:', error);
      if (error instanceof ApiError) {
        switch (error.status) {
          case 401:
            setError('Authentication required. Please log in.');
            break;
          case 403:
            setError('Access denied. You can only edit events you own.');
            break;
          case 404:
            setError('Event not found.');
            break;
          default:
            setError(error.message);
        }
      } else {
        setError('Failed to load event. Please try again.');
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const loadEventTypes = async () => {
    try {
      setTypesLoading(true);
      const response = await apiService.getEventTypes();
      const types = ApiResponseHandler.handleResponse(response);
      setEventTypes(types || []);
    } catch (error) {
      console.error('Error loading event types:', error);
      // Continue without types, allow manual entry
    } finally {
      setTypesLoading(false);
    }
  };

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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Event title is required';
    }
    
    if (!formData.eventDate) {
      errors.eventDate = 'Event date is required';
    } else {
      const eventDate = new Date(formData.eventDate);
      const now = new Date();
      if (eventDate <= now) {
        errors.eventDate = 'Event date must be in the future';
      }
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
    
    // Check if capacity is being reduced below current registrations
    if (originalEvent && formData.capacity < originalEvent.noOfRegistrations) {
      errors.capacity = `Capacity cannot be reduced below current registrations (${originalEvent.noOfRegistrations})`;
    }
    
    if (!formData.registrationCutoffDate) {
      errors.registrationCutoffDate = 'Registration cutoff date is required';
    } else {
      const cutoffDate = new Date(formData.registrationCutoffDate);
      const eventDate = new Date(formData.eventDate);
      const now = new Date();
      
      if (cutoffDate <= now) {
        errors.registrationCutoffDate = 'Registration cutoff must be in the future';
      } else if (cutoffDate >= eventDate) {
        errors.registrationCutoffDate = 'Registration cutoff must be before the event date';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !eventId) {
      return;
    }
    
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      console.log('Updating event with data:', formData);
      
      const request : UpdateEventRequest = {
        ...formData,
        eventDate: new Date(formData.eventDate).toISOString(),
        registrationCutoffDate: new Date(formData.registrationCutoffDate).toISOString()
      }

      const response = await apiService.updateEvent(eventId, request);
      const updatedEvent = ApiResponseHandler.handleResponse(response);
      
      console.log('Event updated successfully:', updatedEvent);
      
      // Navigate to the event dashboard
      navigate(`/admin/event-dashboard/${eventId}`);
      
    } catch (error) {
      console.error('Error updating event:', error);
      
      if (error instanceof ValidationError) {
        // Handle validation errors from the backend
        const backendErrors: Record<string, string> = {};
        Object.entries(error.validationErrors).forEach(([field, messages]) => {
          backendErrors[field.toLowerCase()] = messages[0];
        });
        setFieldErrors(backendErrors);
      } else if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to update event. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (eventId) {
      navigate(`/admin/event-dashboard/${eventId}`);
    } else {
      navigate('/admin/my-events');
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setImageUploadError('Please select a valid image file (JPG, PNG, GIF, or WebP)');
        return;
      }
      
      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        setImageUploadError('Image file size cannot exceed 10MB');
        return;
      }
      
      setSelectedImageFile(file);
      setImageUploadError('');
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImageFile || !eventId) {
      setImageUploadError('Please select an image file');
      return;
    }

    setImageUploading(true);
    setImageUploadError('');

    try {
      console.log('Uploading event image file:', selectedImageFile.name);
      
      const response = await apiService.uploadEventImage(eventId, selectedImageFile);

      const result = ApiResponseHandler.handleResponse(response);
      
      console.log('Image uploaded successfully:', result);
      
      // Update the image URL with the server response
      if (result?.imageUrl) {
        setImageUrl(result.imageUrl);
        
        // Clean up the preview URL
        if (imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(imageUrl);
        }
        
        // Reload event data to get updated imageUrl
        await loadEventData(eventId);
        
        alert('Event image uploaded successfully!');
      }
      
      // Reset file input
      setSelectedImageFile(null);
      const fileInput = document.getElementById('imageFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Error uploading image:', error);
      
      if (error instanceof ApiError) {
        setImageUploadError(error.message);
      } else {
        setImageUploadError('Failed to upload image. Please try again.');
      }
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setImageUploadError('');
    
    // Clean up preview URL if it exists
    if (imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    
    // Reset to original image URL or empty
    setImageUrl(originalEvent?.imageUrl || '');
    
    // Reset file input
    const fileInput = document.getElementById('imageFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Generate date input min values
  const now = new Date();
  const minDateTime = now.toISOString().slice(0, 16);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading event data...</span>
        </div>
      </div>
    );
  }

  if (error && !originalEvent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-6 max-w-md w-full mx-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">Unable to load event</h3>
              <p className="mt-2 text-sm text-destructive">{error}</p>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => eventId && loadEventData(eventId)}
                  className="text-sm text-destructive hover:text-destructive/80 font-medium"
                >
                  Try again
                </button>
                <button
                  onClick={() => navigate('/admin/my-events')}
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <button
                  onClick={() => navigate('/admin/my-events')}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  My Events
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="h-5 w-5 text-accent-foreground" />
                  <span className="ml-4 text-sm font-medium text-gray-500">{originalEvent?.title}</span>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="h-5 w-5 text-accent-foreground" />
                  <span className="ml-4 text-sm font-medium text-gray-900">Edit</span>
                </div>
              </li>
            </ol>
          </nav>
          
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Edit Event</h1>
          <p className="mt-2 text-gray-600">
            Update the event details below. Be careful when changing dates and capacity.
          </p>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <div className="bg-white shadow rounded-lg p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {originalEvent && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      This event currently has <strong>{originalEvent.noOfRegistrations}</strong> registrations.
                      Be careful when changing capacity or dates.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    fieldErrors.title ? 'border-red-300' : ''
                  }`}
                  placeholder="Enter event title"
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
                )}
              </div>

              {/* Event Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    fieldErrors.description ? 'border-red-300' : ''
                  }`}
                  placeholder="Enter event description"
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
                )}
              </div>

              {/* Event Date and Time */}
              <div>
                <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">
                  Event Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="eventDate"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  min={minDateTime}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    fieldErrors.eventDate ? 'border-red-300' : ''
                  }`}
                />
                {fieldErrors.eventDate && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.eventDate}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    fieldErrors.location ? 'border-red-300' : ''
                  }`}
                  placeholder="Enter event location"
                />
                {fieldErrors.location && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.location}</p>
                )}
              </div>

              {/* Event Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Event Type *
                </label>
                {typesLoading ? (
                  <div className="mt-1 flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading event types...</span>
                  </div>
                ) : eventTypes.length > 0 ? (
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      fieldErrors.type ? 'border-red-300' : ''
                    }`}
                  >
                    <option value="">Select event type</option>
                    {eventTypes.map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      fieldErrors.type ? 'border-red-300' : ''
                    }`}
                    placeholder="Enter event type"
                  />
                )}
                {fieldErrors.type && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.type}</p>
                )}
              </div>

              {/* Capacity */}
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                  Capacity *
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  min={originalEvent?.noOfRegistrations || 1}
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    fieldErrors.capacity ? 'border-red-300' : ''
                  }`}
                  placeholder="Enter maximum number of attendees"
                />
                {fieldErrors.capacity && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.capacity}</p>
                )}
                {originalEvent && (
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum capacity: {originalEvent.noOfRegistrations} (current registrations)
                  </p>
                )}
              </div>

              {/* Registration Cutoff Date */}
              <div>
                <label htmlFor="registrationCutoffDate" className="block text-sm font-medium text-gray-700">
                  Registration Cutoff Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="registrationCutoffDate"
                  name="registrationCutoffDate"
                  value={formData.registrationCutoffDate}
                  onChange={handleInputChange}
                  min={minDateTime}
                  max={formData.eventDate}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    fieldErrors.registrationCutoffDate ? 'border-red-300' : ''
                  }`}
                />
                {fieldErrors.registrationCutoffDate && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.registrationCutoffDate}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Registration will close at this date and time
                </p>
              </div>

              {/* Event Image Upload */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Event Image</h3>
                  <span className="text-sm text-gray-500">Optional</span>
                </div>
                
                {/* Current Image Preview */}
                {(originalEvent?.imageUrl || imageUrl) && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {selectedImageFile ? 'Preview' : 'Current Image'}
                    </label>
                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      <img
                        src={imageUrl || originalEvent?.imageUrl || ''}
                        alt="Event preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<span class="text-gray-400">Image not available</span>';
                          }
                        }}
                      />
                      {selectedImageFile && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                          title="Remove selected image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* File Input */}
                  <div>
                    <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700">
                      Select Image File
                    </label>
                    <input
                      type="file"
                      id="imageFile"
                      accept=".jpg,.jpeg,.png,.gif,.webp"
                      onChange={handleImageFileChange}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={imageUploading}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Supported formats: JPG, PNG, GIF, WebP. Maximum size: 10MB
                    </p>
                    {selectedImageFile && (
                      <p className="mt-1 text-xs text-green-600">
                        Selected: {selectedImageFile.name} ({(selectedImageFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                  
                  {imageUploadError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                      {imageUploadError}
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={imageUploading || !selectedImageFile}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {imageUploading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          {/* <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg> */}
                          <CloudUpload className="h-4 w-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </button>
                    
                    {(selectedImageFile || imageUrl) && !imageUploading && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {/* <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg> */}
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Event'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
