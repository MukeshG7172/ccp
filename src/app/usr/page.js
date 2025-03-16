"use client";
import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { parse } from "papaparse";

const CalendarEventForm = () => {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingEvents, setFetchingEvents] = useState(true);
  const [message, setMessage] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const router = useRouter();

  // States for CSV functionality
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvResults, setCsvResults] = useState([]);
  const [processingCsv, setProcessingCsv] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvImportSuccess, setCsvImportSuccess] = useState(null);
  const [previewData, setPreviewData] = useState([]);

  if (status === "unauthenticated") {
    useEffect(() => {
      router.push("/login");
    }, [status, router]);
    
    return (
      <div className="max-w-6xl mx-auto p-4 bg-gray-900 min-h-screen text-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

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

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setCsvFile(file);
    
    // Preview CSV data
    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Preview first 5 rows
        setPreviewData(results.data.slice(0, 5));
        setCsvData(results.data);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setMessage("Failed to parse CSV file. Please check the format.");
      }
    });
  };

  const handleProcessCsv = async () => {
    if (!csvFile) {
      setMessage("Please select a CSV file to upload.");
      return;
    }

    if (status !== "authenticated") {
      setMessage("You must be logged in to process CSV files.");
      return;
    }

    setProcessingCsv(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("csvFile", csvFile);
      formData.append("email", session.user.email);

      const response = await fetch("/api/processCSV", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process CSV file");
      }

      const data = await response.json();
      setCsvResults(data.results);
      setCsvImportSuccess({
        success: data.success,
        errors: data.errors,
      });
      setShowCsvModal(true);
    } catch (error) {
      console.error("Error processing CSV:", error);
      setMessage(
        error.message || "Failed to process CSV file. Please try again."
      );
    } finally {
      setProcessingCsv(false);
    }
  };

  const handleUpdateCsvDate = (index, newDate) => {
    const updatedResults = [...csvResults];
    updatedResults[index].disposalDate = newDate;
    setCsvResults(updatedResults);
  };

  const handleAddAllToCalendar = async () => {
    if (csvResults.length === 0) return;

    setLoading(true);
    setMessage("");
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const item of csvResults) {
        if (item.error) {
          errorCount++;
          continue;
        }

        try {
          const response = await fetch("/api/markDate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: item.wasteName,
              date: item.disposalDate,
              email: session.user.email,
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error adding ${item.wasteName} to calendar:`, error);
          errorCount++;
        }
      }

      fetchEvents();
      setMessage(
        `Successfully added ${successCount} events to calendar. ${
          errorCount > 0 ? `${errorCount} items failed.` : ""
        }`
      );
      setShowCsvModal(false);
      setCsvResults([]);
      setCsvFile(null);
      setPreviewData([]);
    } catch (error) {
      console.error("Error adding events to calendar:", error);
      setMessage("Failed to add all events to calendar. Please try again.");
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
  };

  const handleDateClick = (day, month, year) => {
    const newSelectedDate = new Date(year, month, day);
    setSelectedDate(newSelectedDate);
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

  // CSV Modal Component
  const CsvModal = () => {
    if (!showCsvModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-700 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-purple-400">
              Review CSV Import
            </h2>
            <button
              onClick={() => setShowCsvModal(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {csvImportSuccess && (
            <div className="mb-4 p-3 bg-gray-700 rounded text-sm">
              <p className="text-gray-200">
                <span className="font-semibold">Results:</span>{" "}
                {csvImportSuccess.success} items processed successfully,{" "}
                {csvImportSuccess.errors} items with errors
              </p>
            </div>
          )}

          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-900">
                  <th className="p-2 border border-gray-700 text-left">
                    Waste Name
                  </th>
                  <th className="p-2 border border-gray-700 text-left">
                    Disposal Date
                  </th>
                  <th className="p-2 border border-gray-700 text-left">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {csvResults.map((result, index) => (
                  <tr
                    key={index}
                    className={result.error ? "bg-red-900 bg-opacity-20" : ""}
                  >
                    <td className="p-2 border border-gray-700">
                      {result.wasteName}
                    </td>
                    <td className="p-2 border border-gray-700">
                      {result.error ? (
                        <span className="text-red-400">Error</span>
                      ) : (
                        <input
                          type="date"
                          value={result.disposalDate}
                          onChange={(e) =>
                            handleUpdateCsvDate(index, e.target.value)
                          }
                          className="p-1 bg-gray-700 border border-gray-600 rounded text-white w-full"
                        />
                      )}
                    </td>
                    <td className="p-2 border border-gray-700">
                      {result.error ? (
                        <span className="text-red-400">{result.error}</span>
                      ) : (
                        <span className="text-green-400">Ready to import</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowCsvModal(false)}
              className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-700 text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleAddAllToCalendar}
              disabled={loading || csvResults.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-800 disabled:text-gray-400"
            >
              {loading ? "Adding..." : "Add All to Calendar"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (status === "loading") {
    return (
      <div className="max-w-6xl mx-auto p-4 bg-gray-900 min-h-screen text-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
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
                    <span className="text-gray-300 text-sm">Welcome back,</span>
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

      <div className="flex justify-between items-center mb-6 mt-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-purple-400">
          Waste Disposal Calendar
        </h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
        <div className="xl:col-span-4 xl:order-1 order-1 overflow-auto">
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-purple-400">
              Bulk Import Waste Items
            </h2>

            <div className="mb-6">
              <label className="block mb-2 font-medium text-gray-300">
                Upload CSV File
              </label>
              <p className="text-xs text-gray-400 mb-2">
                CSV must have a waste_name column for processing
              </p>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col w-full h-24 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {csvFile ? (
                      <div className="text-center">
                        <p className="mb-2 text-sm text-gray-300">
                          {csvFile.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {Math.round(csvFile.size / 1024)} KB
                        </p>
                      </div>
                    ) : (
                      <>
                        <svg
                          className="w-8 h-8 mb-2 text-gray-400"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path
                            d="M7 9l3-3 3 3m0 0v7m-3-4v-7"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="text-xs text-gray-400">
                          Click or drag CSV file here to upload
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCsvUpload}
                  />
                </label>
              </div>
            </div>

            {previewData.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-purple-400 mb-2">Preview:</h3>
                <div className="overflow-x-auto bg-gray-700 p-2 rounded">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {Object.keys(previewData[0]).map((header, i) => (
                          <th key={i} className="p-1 text-left text-gray-300 border-b border-gray-600">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((cell, j) => (
                            <td key={j} className="p-1 border-b border-gray-600 text-gray-200">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <button
                onClick={handleProcessCsv}
                disabled={processingCsv || !csvFile}
                className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-purple-800 disabled:text-gray-400 transition-all"
              >
                {processingCsv ? "Processing..." : "Process CSV"}
              </button>

              <button
                onClick={handleGoHome}
                className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to Dashboard
              </button>
            </div>

            {message && (
              <div
                className={`mt-4 p-3 rounded ${
                  message.includes("success")
                    ? "bg-green-900 text-green-200"
                    : "bg-red-900 text-red-200"
                }`}
              >
                {message}
              </div>
            )}
          </div>

          {selectedDateEvents.length > 0 && (
            <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-purple-400">
              Scheduled Waste Disposal
            </h2>
            <ul className="space-y-2">
              {selectedDateEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex justify-between items-center p-3 bg-gray-700 border border-gray-600 rounded-lg"
                >
                  <span className="text-gray-200 break-words pr-2">
                    {event.title}
                  </span>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="text-red-400 hover:text-red-300 flex-shrink-0"
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
          </div>
        )}
      </div>

      <div className="xl:col-span-8 xl:order-2 order-2 overflow-auto">
        {fetchingEvents ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          renderCalendar()
        )}
      </div>
    </div>

    <CsvModal />
  </div>
);
};

export default CalendarEventForm;