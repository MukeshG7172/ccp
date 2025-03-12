'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleGetStarted = () => {
    if (session) {
      router.push('/home');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
       <nav className="bg-gray-900 border-b border-gray-700 fixed top-0 left-0 right-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div 
                className="flex items-center cursor-pointer" 
                onClick={handleGoHome}
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
                      Welcome,
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
                    className="px-4 py-2 cursor-pointer rounded-md text-sm font-medium text-white bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-opacity-50 transition-all duration-200 ease-in-out shadow-sm"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      
      <section className="relative py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/30 to-blue-900/20 z-0"></div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Smart Waste Classification for a <span className="text-green-400">Sustainable Future</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              EcoClassify helps you identify, manage, and responsibly dispose of waste materials through our intelligent classification system.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleGetStarted}
                className="bg-green-500 cursor-pointer hover:bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                Get Started
              </button>
              <a 
                href="#how-it-works" 
                className="bg-gray-800 cursor-pointer hover:bg-gray-700 text-white border border-gray-600 px-6 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="relative w-full h-96 bg-gray-800 rounded-xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-green-500 opacity-30" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-14a2 2 0 10-4 0v1H5V4a1 1 0 011-1h3a1 1 0 011 1v10.75a1.25 1.25 0 102.5 0V5H11v2.25a1.25 1.25 0 102.5 0V4a2 2 0 00-2-2h-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Smart Waste Management Features</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our comprehensive system helps you manage waste efficiently and sustainably
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-700 hover:border-green-500 transition-colors">
              <div className="p-4 bg-green-900/30 inline-block rounded-lg mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Waste Classification</h3>
              <p className="text-gray-400">
                Accurately identify degradable, non-degradable, and biodegradable components of waste
              </p>
            </div>
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-700 hover:border-green-500 transition-colors">
              <div className="p-4 bg-green-900/30 inline-block rounded-lg mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Disposal Calendar</h3>
              <p className="text-gray-400">
                Track and receive notifications about waste disposal dates through email reminders
              </p>
            </div>
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-700 hover:border-green-500 transition-colors">
              <div className="p-4 bg-green-900/30 inline-block rounded-lg mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Storage Guidelines</h3>
              <p className="text-gray-400">
                Learn best practices for storing different types of waste safely and efficiently
              </p>
            </div>
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-700 hover:border-green-500 transition-colors">
              <div className="p-4 bg-green-900/30 inline-block rounded-lg mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Recycling Value</h3>
              <p className="text-gray-400">
                Discover potential financial benefits by selling recyclable waste materials
              </p>
            </div>
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-700 hover:border-green-500 transition-colors">
              <div className="p-4 bg-green-900/30 inline-block rounded-lg mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Recycling Methods</h3>
              <p className="text-gray-400">
                Access detailed information on various recycling techniques for different waste types
              </p>
            </div>
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-700 hover:border-green-500 transition-colors">
              <div className="p-4 bg-green-900/30 inline-block rounded-lg mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Environmental Impact</h3>
              <p className="text-gray-400">
                Understand how proper waste management contributes to environmental protection
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How EcoClassify Works</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our simple, effective process makes waste management easy
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-400">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Input Waste Details</h3>
              <p className="text-gray-400">
                Enter information about your waste materials through our intuitive interface
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-400">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Get Classification</h3>
              <p className="text-gray-400">
                Our system instantly identifies the waste type and categorizes it accordingly
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-400">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Receive Guidelines</h3>
              <p className="text-gray-400">
                Get detailed information on storage, disposal, and recycling opportunities
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-400">4</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Track Disposal</h3>
              <p className="text-gray-400">
                Our calendar automatically tracks disposal dates and sends timely reminders
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="py-20 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose EcoClassify</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Join thousands of environmentally conscious users making a difference
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-700">
              <h3 className="text-2xl font-bold mb-6 text-green-400">Environmental Impact</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Reduce landfill waste through proper sorting and recycling</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Lower carbon footprint through optimized waste management</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Contribute to circular economy by reusing valuable materials</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Help protect ecosystems from harmful waste contamination</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-700">
              <h3 className="text-2xl font-bold mb-6 text-green-400">Personal Benefits</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Earn money by selling recyclable materials to appropriate buyers</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Never miss disposal dates with automated calendar reminders</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Save space with efficient storage recommendations</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Contribute to your community sustainability goals</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-r from-green-900/40 to-blue-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Start Your Sustainable Waste Journey Today</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of environmentally conscious users making a difference with EcoClassify
          </p>
          <button 
            onClick={handleGetStarted}
            className="bg-green-500 cursor-pointer hover:bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors"
          >
            Get Started for Free
          </button>
        </div>
      </section>

      <footer id="contact" className="bg-gray-800 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-14a2 2 0 10-4 0v1H5V4a1 1 0 011-1h3a1 1 0 011 1v10.75a1.25 1.25 0 102.5 0V5H11v2.25a1.25 1.25 0 102.5 0V4a2 2 0 00-2-2h-1z" clipRule="evenodd" />
                </svg>
                <h1 className="text-2xl font-bold text-green-400">EcoClassify</h1>
              </div>
              <p className="text-gray-400 mb-4">
                Smart waste management for a sustainable future.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-green-400 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-green-400 transition-colors">How It Works</a></li>
                <li><a href="#benefits" className="text-gray-400 hover:text-green-400 transition-colors">Benefits</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-400 transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-green-400 transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-400 transition-colors">Knowledge Base</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-400 transition-colors">FAQ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-400 transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Contact Us</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">hello@ecoclassify.com</li>
                <li className="text-gray-400">+1 (555) 123-4567</li>
                <li className="text-gray-400">123 Green Street, Eco City</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} EcoClassify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}