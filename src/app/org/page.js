'use client';
import React, { useState, useEffect } from 'react';

const CalendarEventForm = () => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingEvents, setFetchingEvents] = useState(true);
  const [message, setMessage] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const fetchEvents = async () => {
    setFetchingEvents(true);
    try {
      const response = await fetch('/api/markDate');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
      setMessage('Failed to load events. Please try again.');
    } finally {
      setFetchingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    
    const today = new Date();
    setDate(formatDateForInput(today));
  }, []);

  const formatDateForInput = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !date) {
      setMessage('Please provide both a title and date.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/markDate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, date }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add event');
      }

      setTitle('');
      fetchEvents();
      setMessage('Event added successfully!');
    } catch (error) {
      console.error('Error adding event:', error);
      setMessage(error.message || 'Failed to add event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch('/api/markDate', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event');
      }

      fetchEvents();
      setMessage('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
      setMessage(error.message || 'Failed to delete event. Please try again.');
    }
  };

  const groupEventsByDate = () => {
    const groupedEvents = {};
    
    events.forEach(event => {
      const eventDate = new Date(event.date);
      const dateKey = eventDate.toISOString().split('T')[0];
      
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }
      
      groupedEvents[dateKey].push(event);
    });
    
    return groupedEvents;
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
    setDate(formatDateForInput(new Date()));
  };

  const handleDateClick = (day, month, year) => {
    const newSelectedDate = new Date(year, month, day);
    setSelectedDate(newSelectedDate);
    setDate(formatDateForInput(newSelectedDate));
  };

  const renderCalendar = () => {
    const eventsByDate = groupEventsByDate();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const monthName = currentMonth.toLocaleString('default', { month: 'long' });
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const rows = [];
    let days = [];
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(
        <td key={`empty-${i}`} className="p-0 border-t border-l">
          <div className="h-32 md:h-36 p-2 bg-gray-50"></div>
        </td>
      );
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasEvents = eventsByDate[dateString] && eventsByDate[dateString].length > 0;
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      const isSelected = selectedDate && selectedDate.toDateString() === new Date(year, month, day).toDateString();
      
      days.push(
        <td key={day} className="p-0 border-t border-l">
          <div 
            className={`relative h-32 md:h-36 p-2 ${isToday ? 'bg-blue-50' : ''} ${isSelected ? 'bg-indigo-100' : ''} hover:bg-gray-100 transition-colors cursor-pointer`}
            onClick={() => handleDateClick(day, month, year)}
          >
            <div className={`absolute top-2 right-2 flex items-center justify-center w-7 h-7 ${isToday ? 'bg-blue-500 text-white rounded-full' : ''}`}>
              {day}
            </div>
            {hasEvents && (
              <div className="mt-8">
                {eventsByDate[dateString].slice(0, 3).map(event => (
                  <div 
                    key={event.id} 
                    className="text-xs p-1 mb-1 rounded truncate bg-indigo-500 text-white"
                  >
                    {event.title}
                  </div>
                ))}
                {eventsByDate[dateString].length > 3 && (
                  <div className="text-xs font-semibold text-gray-500">
                    +{eventsByDate[dateString].length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>
        </td>
      );
      
      if ((firstDayOfWeek + day) % 7 === 0 || day === daysInMonth) {
        if (day === daysInMonth && (firstDayOfWeek + day) % 7 !== 0) {
          const remainingCells = 7 - ((firstDayOfWeek + day) % 7);
          for (let i = 0; i < remainingCells; i++) {
            days.push(
              <td key={`empty-end-${i}`} className="p-0 border-t border-l">
                <div className="h-32 md:h-36 p-2 bg-gray-50"></div>
              </td>
            );
          }
        }
        
        rows.push(<tr key={day}>{days}</tr>);
        days = [];
      }
    }
    
    
    const selectedDateString = selectedDate ? formatDateForInput(selectedDate) : '';
    const selectedDateEvents = eventsByDate[selectedDateString] || [];

    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-2xl font-bold">
            {monthName} {year}
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={goToToday}
              className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
            >
              Today
            </button>
            <button 
              onClick={prevMonth}
              className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
            >
              &lt;
            </button>
            <button 
              onClick={nextMonth}
              className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
            >
              &gt;
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr>
                {daysOfWeek.map(day => (
                  <th key={day} className="p-2 border-b bg-gray-50 text-gray-700">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows}
            </tbody>
          </table>
        </div>
        
        {selectedDate && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">
              Events for {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
            {selectedDateEvents.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {selectedDateEvents.map(event => (
                  <li key={event.id} className="flex justify-between items-center p-3 bg-white border rounded shadow-sm">
                    <span>{event.title}</span>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-red-500 hover:text-red-700"
                      aria-label="Delete event"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-gray-500">No events scheduled for this date.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Event Calendar</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {renderCalendar()}
        </div>
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Event</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block mb-1 font-medium text-gray-700">
                  Event Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter event title"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="date" className="block mb-1 font-medium text-gray-700">
                  Event Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-indigo-300 transition-all"
              >
                {loading ? 'Adding...' : 'Add Event'}
              </button>
            </form>
            
            {message && (
              <div className={`mt-4 p-3 rounded text-sm ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}
          </div>
          
          <div className="mt-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Upcoming Events</h2>
            
            {fetchingEvents ? (
              <div className="flex justify-center items-center h-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : events.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {events
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .filter(event => new Date(event.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
                  .slice(0, 5)
                  .map(event => (
                    <div key={event.id} className="p-3 border-l-4 border-indigo-500 bg-gray-50 rounded">
                      <div className="font-medium text-gray-800">{event.title}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  ))}
                
                {events.filter(event => new Date(event.date) >= new Date(new Date().setHours(0, 0, 0, 0))).length > 5 && (
                  <div className="text-center text-sm text-gray-500 pt-2">
                    + {events.filter(event => new Date(event.date) >= new Date(new Date().setHours(0, 0, 0, 0))).length - 5} more upcoming events
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No upcoming events scheduled.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarEventForm;