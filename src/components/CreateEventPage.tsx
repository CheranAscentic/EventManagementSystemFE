import { AlertTriangle } from 'lucide-react';
// Create Event Page component for Admin users to create new events

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react';
import { apiService } from '../api';
import type { CreateEventRequest } from '../contracts/request/EventRequests';
import { ApiResponseHandler, ApiError, ValidationError } from '../types';
import { dateUtils } from '@/lib/utils';

export function CreateEventPage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<CreateEventRequest>({
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
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [typesLoading, setTypesLoading] = useState(true);
  
  // Image upload state
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageUploadError, setImageUploadError] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    loadEventTypes();
  }, []);

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
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      console.log('Creating event with data:', formData);

      const resquest : CreateEventRequest = {
        ...formData,
        eventDate: dateUtils.formatEventDate(formData.eventDate),
        registrationCutoffDate: dateUtils.formatEventDate(formData.registrationCutoffDate)
      }
      
      const response = await apiService.createEvent(resquest);
      const createdEvent = ApiResponseHandler.handleResponse(response);
      
      console.log('Event created successfully:', createdEvent);
      
      // Upload image if provided
      if (selectedImageFile) {
        await handleImageUpload(createdEvent.id);
      }
      
      // Navigate to the event dashboard for the newly created event
      navigate(`/admin/event-dashboard/${createdEvent.id}`);
      
    } catch (error) {
      console.error('Error creating event:', error);
      
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
        setError('Failed to create event. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/my-events');
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

  const handleImageUpload = async (eventId: string) => {
    if (!selectedImageFile) {
      return; // No image file provided, skip upload
    }

    setImageUploading(true);
    setImageUploadError('');

    try {
      console.log('Uploading event image file:', selectedImageFile.name);
      
      const response = await apiService.uploadEventImage(eventId, selectedImageFile);
      const result = ApiResponseHandler.handleResponse(response);
      
      console.log('Image uploaded successfully:', result);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      
      if (error instanceof ApiError) {
        console.error('Failed to upload image:', error.message);
      } else {
        console.error('Failed to upload image. Please try again.');
      }
      // Don't show error to user since they're being redirected anyway
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
    
    setImageUrl('');
    
    // Reset file input
    const fileInput = document.getElementById('imageFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
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
                  <AlertTriangle className="flex-shrink-0 h-5 w-5 text-border" />
                  <span className="ml-4 text-sm font-medium text-foreground">Create Event</span>
                </div>
              </li>
            </ol>
          </nav>
          
          <h1 className="mt-4 text-3xl font-bold text-foreground">Create New Event</h1>
          <p className="mt-2 text-muted-foreground">
            Fill out the form below to create a new event for your organization.
          </p>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <div className="bg-card shadow rounded-lg p-6 border border-border">
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
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring ${
                    fieldErrors.description ? 'border-destructive' : ''
                  }`}
                  placeholder="Enter event description"
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-sm text-destructive">{fieldErrors.description}</p>
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
                  min="1"
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
                
                {/* Image Preview */}
                {imageUrl && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {selectedImageFile ? 'Preview' : 'Image Preview'}
                    </label>
                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      <img
                        src={imageUrl}
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
                          <X className="w-4 h-4" />
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
                      disabled={loading}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Supported formats: JPG, PNG, GIF, WebP. Maximum size: 10MB. Image will be uploaded after event creation.
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
                  
                  {/* Remove Button */}
                  {selectedImageFile && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Image
                    </button>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || imageUploading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      {imageUploading ? 'Uploading Image...' : 'Creating Event...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Event
                    </>
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
