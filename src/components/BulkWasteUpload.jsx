"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

const BulkWasteUpload = () => {
  const { data: session, status } = useSession();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        // Preview first 5 rows
        setPreview(results.data.slice(0, 5));
        
        // Validate CSV structure
        if (results.data.length === 0) {
          setMessage("The CSV file is empty.");
          return;
        }
        
        if (!results.data[0].hasOwnProperty('waste_name')) {
          setMessage("CSV must contain a 'waste_name' column.");
          return;
        }
        
        setMessage("");
      },
      error: function(error) {
        setMessage(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setMessage("Please select a CSV file to upload.");
      return;
    }
    
    if (status !== "authenticated") {
      setMessage("You must be logged in to process waste items.");
      return;
    }
    
    setProcessing(true);
    setProgress(0);
    setResults([]);
    setShowResults(false);
    setMessage("Processing waste items...");
    
    try {
      const formData = new FormData();
      formData.append("csvFile", file);
      formData.append("email", session.user.email);
      
      const response = await fetch("/api/bulkProcessWaste", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process waste items");
      }
      
      const data = await response.json();
      setResults(data.results);
      setShowResults(true);
      setMessage(`Successfully processed ${data.results.length} waste items!`);
      
      // If there are any errors, highlight them
      const errors = data.results.filter(item => item.error);
      if (errors.length > 0) {
        setMessage(`Processed with ${errors.length} errors. See details below.`);
      }
    } catch (error) {
      console.error("Error processing waste items:", error);
      setMessage(error.message || "Failed to process waste items. Please try again.");
    } finally {
      setProcessing(false);
      setProgress(100);
    }
  };

  const handleBackToCalendar = () => {
    router.push("/calendar");
  };

  const downloadSampleCSV = () => {
    const sampleData = Papa.unparse({
      fields: ["waste_name"],
      data: [
        ["Plastic bottle"],
        ["Cardboard box"],
        ["Apple core"],
        ["Batteries"],
        ["Electronic waste"]
      ]
    });
    
    const blob = new Blob([sampleData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_waste_list.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (status === "loading") {
    return (
      <div className="max-w-6xl mx-auto p-4 bg-gray-900 min-h-screen text-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  return (
    <div className="w-full mx-auto p-4 bg-gray-900 text-gray-200 min-h-screen pt-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-400">
            Bulk Waste Processing
          </h1>
          <button
            onClick={handleBackToCalendar}
            className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Calendar
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-purple-400">
            Upload CSV with Waste Items
          </h2>
          
          <div className="text-sm text-gray-400 mb-4">
            <p>Upload a CSV file containing a list of waste items. The system will generate appropriate disposal dates for all items and add them to your calendar.</p>
            <p className="mt-2">The CSV file must have a column named <code className="bg-gray-700 px-1 rounded">waste_name</code>.</p>
            <button 
              onClick={downloadSampleCSV}
              className="text-purple-400 hover:text-purple-300 mt-2 text-sm underline"
            >
              Download sample CSV template
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {file ? (
                      <div className="text-center">
                        <p className="mb-2 text-sm text-gray-300">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {Math.round(file.size / 1024)} KB
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
                          Click to upload CSV file
                        </p>
                        <p className="text-xs text-gray-500">
                          CSV files only
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              {file && (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreview([]);
                  }}
                  className="mt-2 text-xs text-red-400 hover:text-red-300"
                >
                  Remove file
                </button>
              )}
            </div>

            {preview.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium mb-2 text-gray-300">Preview:</h3>
                <div className="bg-gray-900 rounded p-3 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        {Object.keys(preview[0]).map((header, index) => (
                          <th key={index} className="px-3 py-2 text-left text-gray-400">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t border-gray-700">
                          {Object.values(row).map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2 text-gray-300">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.length < 5 ? (
                    <p className="text-xs text-gray-500 mt-2">Showing all {preview.length} rows</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">Showing first 5 rows of your data</p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={processing || !file}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-purple-800 disabled:text-gray-400 transition-all"
            >
              {processing ? "Processing..." : "Process Waste Items"}
            </button>
          </form>

          {processing && (
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-purple-600 h-2.5 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-2 text-center">Processing your waste items...</p>
            </div>
          )}

          {message && (
            <div
              className={`mt-4 p-3 rounded text-sm ${
                message.includes("Success") || message.includes("processed")
                  ? "bg-green-900 text-green-300 border border-green-700"
                  : "bg-red-900 text-red-300 border border-red-700"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        {showResults && results.length > 0 && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-purple-400">
              Processing Results
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-900">
                    <th className="px-4 py-2 text-left text-gray-300">Waste Name</th>
                    <th className="px-4 py-2 text-left text-gray-300">Disposal Date</th>
                    <th className="px-4 py-2 text-left text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item, index) => (
                    <tr key={index} className={`border-t border-gray-700 ${item.error ? 'bg-red-900 bg-opacity-20' : ''}`}>
                      <td className="px-4 py-3 text-gray-300">{item.wasteName}</td>
                      <td className="px-4 py-3 text-gray-300">
                        {item.disposalDate ? new Date(item.disposalDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }) : "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        {item.error ? (
                          <span className="text-red-400">{item.error}</span>
                        ) : (
                          <span className="text-green-400">Added to calendar</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                onClick={handleBackToCalendar}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Go to Calendar
              </button>
              <button
                onClick={() => {
                  setResults([]);
                  setShowResults(false);
                  setFile(null);
                  setPreview([]);
                  setMessage("");
                }}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
              >
                Process Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkWasteUpload;