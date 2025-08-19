# Create Complex Event Page - Demo

This is a demo implementation of a complex event creation page that allows creating events with multiple sub-events across different days using Full Calendar.

## Features

### 1. **Complex Event Form**
- Event title, description, location, type, and capacity
- Date range selection (start date to end date)
- Registration cutoff date
- Form validation with error handling

### 2. **Sub-Event Management**
- Create multiple sub-events in an unscheduled list
- Each sub-event has:
  - Name
  - Duration (in minutes)
  - Location (optional)
  - Description (optional)
- Edit and delete unscheduled sub-events

### 3. **Full Calendar Integration**
- Interactive calendar with drag & drop functionality
- Multiple view modes: Month, Week, Day
- Visual scheduling of sub-events via drag and drop
- Time grid with business hours display

### 4. **Drag & Drop Workflow**
- Create sub-events in the unscheduled list first
- Drag sub-events from the list onto the calendar to schedule them
- Drag scheduled events to reschedule them
- Click on scheduled events to edit their details
- Remove scheduled events (returns them to unscheduled list)

## How to Use

### Access the Page
Navigate to: `http://localhost:5173/admin/create-complex-event`

### Creating a Complex Event

1. **Fill Event Details**
   - Enter event title, description, location
   - Select event type and capacity
   - Set start and end dates for the overall event
   - Set registration cutoff date

2. **Create Sub-Events**
   - Click "New Sub Event" button
   - Fill in sub-event details (name, duration, location, description)
   - Click "Save" to add the sub-event to the unscheduled list

3. **Schedule Sub-Events**
   - View created sub-events in the "Unscheduled Sub Events" list
   - Drag sub-events from the list onto the calendar to schedule them
   - The sub-event will appear on the calendar at the dropped time/date
   - Drag scheduled events to reschedule them
   - Click on scheduled events to edit their details

4. **Manage Sub-Events**
   - Edit unscheduled sub-events by clicking the edit icon
   - Delete unscheduled sub-events by clicking the X icon
   - Remove scheduled events (they return to the unscheduled list)

5. **Submit**
   - Once at least one sub-event is scheduled, click "Create Complex Event"
   - The demo will simulate saving (no actual API calls)

## Technical Implementation

### Libraries Used
- **@fullcalendar/react** - Main calendar component
- **@fullcalendar/daygrid** - Month view
- **@fullcalendar/timegrid** - Week/day views
- **@fullcalendar/interaction** - Drag & drop functionality
- **lucide-react** - Icons
- **tailwindcss** - Styling

### Key Components

#### SubEvent Interface
```typescript
interface SubEvent {
  id: string;
  subEventName: string;
  startTime: string; // Empty for unscheduled events
  duration: number; // in minutes
  location?: string;
  description?: string;
}
```

#### Workflow States
- **Unscheduled Sub-Events**: Created but not yet placed on calendar
- **Scheduled Sub-Events**: Placed on calendar with specific date/time

#### Calendar Configuration
- **Editable**: Scheduled events can be dragged and resized
- **Droppable**: Support for external drag sources (unscheduled list)
- **External Events**: Sub-events from unscheduled list can be dragged onto calendar
- **Business Hours**: 8 AM to 10 PM, all days
- **Time Slots**: 30-minute intervals

### Styling
- Consistent with existing app theme
- Custom CSS for Full Calendar integration
- Responsive design with grid layout
- Visual distinction between scheduled and unscheduled events
- Dark mode support

## Demo Features

⚠️ **Note**: This is a demo/proof-of-concept page with the following limitations:
- No actual API integration
- No data persistence
- No direct navigation links in the main app
- Simulated save operation

## Navigation

The page is accessible via the route `/admin/create-complex-event` and includes:
- Breadcrumb navigation back to "My Events"
- Cancel functionality
- Form validation and error handling

## Future Enhancements

Potential features that could be added:
- Recurring sub-events
- Resource allocation (rooms, equipment)
- Conflict detection
- Bulk operations
- Export to calendar formats
- Integration with existing Event API
- Sub-event capacity management
- Presenter/speaker assignment
