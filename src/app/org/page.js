"use client";
import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const CalendarEventForm = () => {
  const { data: session, status } = useSession();
  const [wasteName, setWasteName] = useState("");
  const [date, setDate] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingEvents, setFetchingEvents] = useState(true);
  const [message, setMessage] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [generatingDate, setGeneratingDate] = useState(false);
  const [isDateGenerated, setIsDateGenerated] = useState(false);
  const [wasteImage, setWasteImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const fetchEvents = async () => {
    if (status !== "authenticated" || !session?.user?.email) return;

    setFetchingEvents(true);
    try {
      const response = await fetch(
        `/api/markDate?email=${encodeURIComponent(session.user.email)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await response.json();
      setEvents(data.events);
    } catch (error) {
      console.error("Error fetching events:", error);
      setMessage("Failed to load events. Please try again.");
    } finally {
      setFetchingEvents(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchEvents();

      // Set today as the selected date by default
      const today = new Date();
      setDate(formatDateForInput(today));
      setSelectedDate(today);
    }
  }, [status, session]);

  const formatDateForInput = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setWasteImage(e.target.files[0]);
    }
  };

  const handleGenerateDate = async () => {
    if (!wasteName && !wasteImage) {
      setMessage("Please enter a waste name or upload an image.");
      return;
    }

    if (status !== "authenticated") {
      setMessage("You must be logged in to generate disposal dates.");
      return;
    }

    setGeneratingDate(true);
    setMessage("");

    try {
      const formData = new FormData();
      if (wasteName) formData.append("wasteName", wasteName);
      if (wasteImage) formData.append("wasteImage", wasteImage);

      const response = await fetch("/api/generateDate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate disposal date");
      }

      const data = await response.json();

      if (data.disposalDate) {
        setDate(data.disposalDate);

        const disposalDateObj = new Date(data.disposalDate);
        setSelectedDate(disposalDateObj);
        setCurrentMonth(
          new Date(disposalDateObj.getFullYear(), disposalDateObj.getMonth(), 1)
        );

        setIsDateGenerated(true);
        setMessage(
          `Disposal date for "${wasteName || "uploaded waste"}": ${new Date(
            data.disposalDate
          ).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`
        );
      } else {
        throw new Error("No disposal date was returned");
      }
    } catch (error) {
      console.error("Error generating date:", error);
      setMessage(
        error.message || "Failed to generate disposal date. Please try again."
      );
    } finally {
      setGeneratingDate(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!wasteName || !date) {
      setMessage("Please provide both a waste name and date.");
      return;
    }

    if (status !== "authenticated") {
      setMessage("You must be logged in to add events.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/markDate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${wasteName}`,
          date,
          email: session.user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add event");
      }

      setWasteName("");
      setDate(formatDateForInput(new Date()));
      setIsDateGenerated(false);
      fetchEvents();
      setMessage("Disposal event added successfully!");
    } catch (error) {
      console.error("Error adding event:", error);
      setMessage(error.message || "Failed to add event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    if (status !== "authenticated") {
      setMessage("You must be logged in to delete events.");
      return;
    }

    try {
      const response = await fetch("/api/markDate", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          email: session.user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete event");
      }

      fetchEvents();
      setMessage("Event deleted successfully!");
    } catch (error) {
      console.error("Error deleting event:", error);
      setMessage(error.message || "Failed to delete event. Please try again.");
    }
  };

  const groupEventsByDate = () => {
    const groupedEvents = {};

    events.forEach((event) => {
      const eventDate = new Date(event.date);
      const dateKey = eventDate.toISOString().split("T")[0];

      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }

      groupedEvents[dateKey].push(event);
    });

    return groupedEvents;
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
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

    const monthName = currentMonth.toLocaleString("default", { month: "long" });

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    const firstDayOfWeek = firstDayOfMonth.getDay();

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const rows = [];
    let days = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(
        <td key={`empty-${i}`} className="p-0 border border-gray-700">
          <div className="w-full h-full aspect-square bg-gray-900"></div>
        </td>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const hasEvents =
        eventsByDate[dateString] && eventsByDate[dateString].length > 0;
      const isToday =
        new Date().toDateString() === new Date(year, month, day).toDateString();
      const isSelected =
        selectedDate &&
        selectedDate.toDateString() ===
          new Date(year, month, day).toDateString();

      days.push(
        <td key={day} className="p-0 border border-gray-700">
          <div
            className={`relative w-full aspect-square p-2 
              ${isToday ? "bg-gray-700" : "bg-gray-800"} 
              ${isSelected ? "bg-purple-900" : ""} 
              hover:bg-gray-700 transition-colors cursor-pointer`}
            onClick={() => handleDateClick(day, month, year)}
          >
            <div
              className={`absolute top-1 right-1 flex items-center justify-center w-6 h-6 
              ${
                isToday
                  ? "bg-purple-600 text-white rounded-full"
                  : "text-gray-300"
              }`}
            >
              {day}
            </div>
            {hasEvents && (
              <div className="mt-7 overflow-hidden">
                {eventsByDate[dateString].slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs p-1 mb-1 rounded truncate bg-purple-600 text-white"
                    title={event.title}
                  >
                    {event.title.length > 20
                      ? `${event.title.substring(0, 20)}...`
                      : event.title}
                  </div>
                ))}
                {eventsByDate[dateString].length > 2 && (
                  <div className="text-xs font-semibold text-gray-400">
                    +{eventsByDate[dateString].length - 2} more
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
              <td key={`empty-end-${i}`} className="p-0 border border-gray-700">
                <div className="w-full h-full aspect-square bg-gray-900"></div>
              </td>
            );
          }
        }

        rows.push(
          <tr key={day} className="grid-row">
            {days}
          </tr>
        );
        days = [];
      }
    }

    const selectedDateString = selectedDate
      ? formatDateForInput(selectedDate)
      : "";
    const selectedDateEvents = eventsByDate[selectedDateString] || [];

    return (
      <div className="mt-4">
        {selectedDate && (
          <div className="mt-6 mb-10 p-4 bg-gray-800 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-400">
              Events for{" "}
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h3>
            {selectedDateEvents.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {selectedDateEvents.map((event) => (
                  <li
                    key={event.id}
                    className="flex justify-between items-center p-3 bg-gray-700 border border-gray-600 rounded shadow-sm"
                  >
                    <span className="text-gray-200">{event.title}</span>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-red-400 hover:text-red-300"
                      aria-label="Delete event"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-gray-400">
                No events scheduled for this date.
              </p>
            )}
          </div>
        )}
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl sm:text-2xl font-bold text-white">
            {monthName} {year}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={goToToday}
              className="px-2 sm:px-3 py-1 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700 text-sm sm:text-base text-gray-200"
            >
              Today
            </button>
            <button
              onClick={prevMonth}
              className="px-2 sm:px-3 py-1 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700 text-gray-200"
            >
              &lt;
            </button>
            <button
              onClick={nextMonth}
              className="px-2 sm:px-3 py-1 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700 text-gray-200"
            >
              &gt;
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse border border-gray-700">
            <thead>
              <tr className="bg-gray-900">
                {daysOfWeek.map((day) => (
                  <th
                    key={day}
                    className="p-2 border border-gray-700 text-gray-300 text-xs sm:text-sm font-medium"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
      </div>
    );
  };

  // Get selected date events for displaying in the left column
  const getSelectedDateEvents = () => {
    if (!selectedDate) return [];

    const selectedDateString = formatDateForInput(selectedDate);
    return events.filter((event) => event.date === selectedDateString);
  };

  const selectedDateEvents = getSelectedDateEvents();

  if (status === "loading") {
    return (
      <div className="max-w-6xl mx-auto p-4 bg-gray-900 min-h-screen text-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/");
  }

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  const handleGoHome = () => {
    router.push("/home");
  };

  return (
    <div className="w-full h-screen mx-auto p-4 bg-gray-900 text-gray-200 overflow-auto">
      <nav className="bg-gray-900 border-b border-gray-700 fixed top-0 left-0 right-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div 
                className="flex items-center cursor-pointer" 
                onClick={() => router.push("/")}
              >
                <span className="text-emerald-500 font-bold text-xl mr-2">
                  EcoClassify
                </span>
                <span className="hidden sm:inline-block text-xs bg-emerald-900 text-emerald-300 px-2 py-1 rounded-full">
                  Smart Waste Management
                </span>
              </div>
            </div>
            <div className="flex items-center">
              {session && (
                <div className="flex items-center space-x-4">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-gray-300 text-sm">
                      Welcome back,
                    </span>
                    <span className="text-emerald-400 font-medium">
                      {session.user?.name || "User"}
                    </span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-emerald-800 flex items-center justify-center text-white uppercase text-sm font-bold md:hidden">
                    {session.user?.name ? session.user.name.charAt(0) : "U"}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-opacity-50 transition-all duration-200 ease-in-out shadow-sm"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-purple-400">
          Waste Disposal Calendar
        </h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-100px)]">
        <div className="xl:col-span-4 xl:order-1 order-1 overflow-auto">
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-purple-400">
              Add Waste Disposal Event
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="wasteName"
                  className="block mb-2 font-medium text-gray-300"
                >
                  Waste Name
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="wasteName"
                    value={wasteName}
                    onChange={(e) => {
                      setWasteName(e.target.value);
                      setIsDateGenerated(false);
                    }}
                    className="flex-1 p-2 border border-gray-600 rounded-l bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    placeholder="e.g., Plastic bottle, Cardboard"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateDate}
                    disabled={generatingDate || (!wasteName && !wasteImage)}
                    className="bg-purple-600 text-white py-2 px-3 rounded-r hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-purple-800 disabled:text-gray-400 transition-all"
                  >
                    {generatingDate ? "Finding..." : "Find Date"}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-300">
                  Or Upload Image of Waste
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {wasteImage ? (
                        <div className="text-center">
                          <p className="mb-2 text-sm text-gray-300">
                            {wasteImage.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {Math.round(wasteImage.size / 1024)} KB
                          </p>
                        </div>
                      ) : (
                        <>
                          <svg
                            className="w-8 h-8 mb-2 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            ></path>
                          </svg>
                          <p className="mb-1 text-sm text-gray-400">
                            Click to upload image
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG or WEBP
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                {wasteImage && (
                  <button
                    type="button"
                    onClick={() => setWasteImage(null)}
                    className="mt-2 text-xs text-red-400 hover:text-red-300"
                  >
                    Remove image
                  </button>
                )}
              </div>

              {isDateGenerated && (
                <div className="mb-4">
                  <label
                    htmlFor="date"
                    className="block mb-2 font-medium text-gray-300"
                  >
                    Disposal Date (Editable)
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    required
                  />
                </div>
              )}

              {isDateGenerated && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-green-800 disabled:text-gray-400 transition-all"
                >
                  {loading ? "Adding..." : "Add to Calendar"}
                </button>
              )}
            </form>

            {message && (
              <div
                className={`mt-4 p-3 rounded text-sm ${
                  message.includes("success") || message.includes("generated")
                    ? "bg-green-900 text-green-300 border border-green-700"
                    : "bg-red-900 text-red-300 border border-red-700"
                }`}
              >
                {message}
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-purple-400">
              Upcoming Disposals
            </h2>

            {fetchingEvents ? (
              <div className="flex justify-center items-center h-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : events.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {events
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .filter(
                    (event) =>
                      new Date(event.date) >=
                      new Date(new Date().setHours(0, 0, 0, 0))
                  )
                  .slice(0, 5)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="p-3 border-l-4 border-purple-500 bg-gray-700 rounded flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-white">
                          {event.title}
                        </div>
                        <div className="text-sm text-gray-300 mt-1">
                          {new Date(event.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-400 hover:text-red-300 ml-2"
                        aria-label="Delete event"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}

                {events.filter(
                  (event) =>
                    new Date(event.date) >=
                    new Date(new Date().setHours(0, 0, 0, 0))
                ).length > 5 && (
                  <div className="text-center text-sm text-gray-400 pt-2">
                    +{" "}
                    {events.filter(
                      (event) =>
                        new Date(event.date) >=
                        new Date(new Date().setHours(0, 0, 0, 0))
                    ).length - 5}{" "}
                    more upcoming events
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400">No upcoming disposals scheduled.</p>
            )}
          </div>
        </div>

        <div className="xl:col-span-8 xl:order-2 order-2 overflow-auto">
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700 h-full">
            {renderCalendar()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarEventForm;
