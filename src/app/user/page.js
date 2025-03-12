"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from 'next-auth/react';

export default function User() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [product, setProduct] = useState("");
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size exceeds 10MB limit");
        return;
      }
      
      setError(null);
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const classifyWaste = async () => {
    if (!product && !image) {
      setError("Please enter a product name or upload an image");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("product", product);
      if (image) {
        formData.append("image", image);
      }

      const res = await fetch("/api/classifyWaste", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to classify waste");
      }

      const data = await res.json();
      setResult(data.result);
    } catch (error) {
      console.error("Classification error:", error);
      setError(error.message || "Failed to classify waste. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const parseResultData = (resultText) => {
    if (!resultText || typeof resultText !== 'string') return null;
    
    const wasteTypes = [];
    let disposalInstructions = "";
    let itemAnalyzed = "";
    
    // Extract item analyzed if present
    const itemMatch = resultText.match(/\*\*Item Analyzed:\*\*\s*(.*?)(?=\n\n|\n\*\*|$)/s);
    if (itemMatch) {
      itemAnalyzed = itemMatch[1].trim();
    }
    
    if (resultText.includes("**Waste Type Classification:**")) {
      // Extract all waste type classifications with a more robust pattern
      const wasteTypeSection = resultText.match(/\*\*Waste Type Classification:\*\*([\s\S]*?)(?=\*\*Storage and Disposal Instructions:|$)/);
      
      if (wasteTypeSection) {
        const sectionText = wasteTypeSection[1];
        
        // Process each waste type line
        const types = [
          { name: "Degradable", pattern: /\*\*Degradable:\*\*\s*(.*?)(?=\*\*|\n\*|\n\n|$)/s },
          { name: "Biodegradable", pattern: /\*\*Biodegradable:\*\*\s*(.*?)(?=\*\*|\n\*|\n\n|$)/s },
          { name: "Non-degradable", pattern: /\*\*Non-degradable:\*\*\s*(.*?)(?=\*\*|\n\*|\n\n|$)/s }
        ];
        
        types.forEach(type => {
          const match = sectionText.match(type.pattern);
          if (match) {
            const description = match[1].trim();
            const status = description.toLowerCase().startsWith("yes");
            wasteTypes.push({
              name: type.name,
              description: description.replace(/^\[?(Yes|No)\]?\s*-?\s*/i, '').trim(),
              status: status
            });
          }
        });
      }
    }
    
    if (resultText.includes("**Storage and Disposal Instructions:**")) {
      const disposalMatch = resultText.match(/\*\*Storage and Disposal Instructions:\*\*([\s\S]*?)$/);
      if (disposalMatch) {
        disposalInstructions = disposalMatch[1].trim();
      }
    }
    
    if (wasteTypes.length === 0 && !disposalInstructions) {
      return { 
        rawText: resultText,
        itemAnalyzed: itemAnalyzed
      };
    }
    
    return {
      itemAnalyzed: itemAnalyzed,
      wasteTypes: wasteTypes,
      disposalInstructions: disposalInstructions,
      rawText: null
    };
  };

  const cleanText = (text) => {
    if (!text) return "";
    return text
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\•\s*\*/g, '• ')
      .replace(/\*\s*\•/g, '• ')
      .replace(/\*/g, '')
      .replace(/\s+\•/g, ' •')
      .replace(/\:\•/g, ': •')
      .replace(/\•\s+/g, '• ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\[|\]/g, '');
  };

  const formatInstructionsText = (text) => {
    if (!text) return [];
    
    const sections = [
      { title: "Storage", pattern: /\*\*Storage:\*\*\s*([\s\S]*?)(?=\*\*Disposal|\*\*Possible|\*\*Resale|$)/is },
      { title: "Disposal", pattern: /\*\*Disposal:\*\*\s*([\s\S]*?)(?=\*\*Possible|\*\*Resale|$)/is },
      { title: "Possible Recycling Methods", pattern: /\*\*Possible Recycling Methods:\*\*\s*([\s\S]*?)(?=\*\*Resale|$)/is },
      { title: "Resale Value", pattern: /\*\*Resale Value:\*\*\s*([\s\S]*?)$/is }
    ];
    
    const formattedSections = sections.map(section => {
      const match = text.match(section.pattern);
      if (match && match[1]) {
        let content = cleanText(match[1]).trim();
        
        // Check if content has bullet points
        if (content.includes('•') || content.includes('-')) {
          // Extract bullet points (handling both • and - formats)
          const bulletRegex = /(?:•|-)\s*([^•-][^•-]*?)(?=(?:\s*[•-])|$)/g;
          const bullets = [];
          let bulletMatch;
          
          while ((bulletMatch = bulletRegex.exec(content + ' •')) !== null) {
            if (bulletMatch[1].trim()) {
              bullets.push(bulletMatch[1].trim());
            }
          }
          
          if (bullets.length > 0) {
            return {
              title: section.title,
              content: bullets
            };
          }
        }
        
        // If no bullet points or extraction failed, return as a single item
        return {
          title: section.title,
          content: [content]
        };
      }
      return null;
    }).filter(section => section !== null);
    
    return formattedSections;
  };

  const parsedResult = result ? parseResultData(result) : null;
  const formattedInstructions = parsedResult?.disposalInstructions 
    ? formatInstructionsText(parsedResult.disposalInstructions) 
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-green-600 font-bold text-xl">EcoClassify</span>
            </div>
            <div className="flex items-center">
              {session && (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Hello, {session.user?.name || "User"}</span>
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-grow flex flex-col items-center py-10 px-4">
        <div className="bg-white shadow rounded-lg w-full max-w-5xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-green-50">
            <h1 className="text-2xl font-semibold text-gray-800">Waste Classification Assistant</h1>
            <p className="mt-1 text-sm text-gray-600">
              Get professional guidance on how to properly classify, store, and dispose of waste items
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <input
                type="text"
                placeholder="Enter product name (e.g., plastic bottle, paper bag, aluminum can)"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Upload Image (Remove Text for Image Classification)
              </label>
              <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {!preview ? (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                        >
                          <span>Upload an image</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </>
                  ) : (
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-w-full mx-auto max-h-64 rounded-md"
                      />
                      <button
                        onClick={() => {
                          setPreview(null);
                          setImage(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div>
              <button
                onClick={classifyWaste}
                disabled={loading || (!product.trim() && !image)}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Waste Composition...
                  </>
                ) : (
                  "Classify Waste"
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Powered by professional environmental analysis models
              </p>
            </div>
          </div>

          {parsedResult && (
            <div className="border-t border-gray-200 px-6 py-5 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Environmental Assessment</h2>
                {parsedResult.itemAnalyzed && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Item: {parsedResult.itemAnalyzed}
                  </span>
                )}
              </div>
              
              {parsedResult.rawText ? (
                <div className="bg-white shadow overflow-hidden rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="text-sm text-gray-700 prose">
                      {parsedResult.rawText.split('**').map((part, index) => {
                        if (index % 2 === 1) {
                          return <strong key={index}>{part}</strong>;
                        } 
                        return <span key={index}>{part.replace(/\* /g, '• ')}</span>;
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {parsedResult.wasteTypes && parsedResult.wasteTypes.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-md font-medium text-gray-700 mb-3">Material Classification</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {parsedResult.wasteTypes.map((type, index) => (
                          <div key={index} className="bg-white overflow-hidden shadow rounded-lg h-full">
                            <div className={`h-full flex flex-col ${type.status ? 'bg-green-50' : 'bg-gray-50'}`}>
                              <div className="px-4 py-5 sm:p-6 flex-1">
                                <div className="flex items-start">
                                  <div className={`flex-shrink-0 rounded-md p-2 ${type.status ? 'bg-green-100' : 'bg-gray-100'}`}>
                                    {type.status ? (
                                      <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="ml-4 flex-1">
                                    <h4 className="text-sm font-medium text-gray-900">{type.name}</h4>
                                    <p className="mt-1 text-sm text-gray-600">
                                      {cleanText(type.description) || "No information available"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {parsedResult.disposalInstructions && (
                    <div>
                      <h3 className="text-md font-medium text-gray-700 mb-3">Handling Guidelines</h3>
                      <div className="bg-white shadow overflow-hidden rounded-lg">
                        <div className="px-6 py-5">
                          {formattedInstructions.length > 0 ? (
                            <div className="space-y-6">
                              {formattedInstructions.map((section, idx) => (
                                <div key={idx} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                                  <h4 className="text-sm font-semibold text-gray-800 mb-2">{section.title}</h4>
                                  <ul className="list-disc pl-5 space-y-2">
                                    {section.content.map((item, i) => (
                                      <li key={i} className="text-sm text-gray-600">{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">
                              {cleanText(parsedResult.disposalInstructions)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <div className="mt-6 text-center">
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  <svg className="mr-1.5 h-2 w-2 text-blue-400" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  Analysis based on environmental guidelines and material science
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} EcoClassify. All rights reserved.
            </p>
            <p className="text-xs text-gray-400">
              Helping reduce environmental impact through proper waste management
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}