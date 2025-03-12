"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const Home = () => {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push("/login");
    }
  }, [session, router]);
  
  if (!session) {
    return null;
  }

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200">
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

      <div className="container mx-auto py-24 px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to <span className="text-emerald-400">EcoClassify</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            The comprehensive waste management solution designed to help organizations optimize waste disposal and promote environmental sustainability.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 justify-center">
          <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden w-full md:w-1/2 lg:w-2/5 hover:shadow-2xl transition-all duration-300 border border-gray-700 group">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-5 border-b border-gray-700 group-hover:from-emerald-900 group-hover:to-emerald-800 transition-all duration-300">
              <div className="flex items-center">
                <div className="bg-emerald-800 p-2 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">Waste Classification</h2>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-300 mb-6 min-h-[80px]">
                Utilize our AI-powered system to accurately classify waste materials and determine optimal disposal methods, reducing environmental impact and improving recycling efficiency.
              </p>
              <ul className="text-gray-400 mb-8 pl-5 space-y-2">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Image recognition technology
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Material composition analysis
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Disposal recommendations
                </li>
              </ul>
              <div className="flex justify-center">
                <Link href="/user">
                  <button className="cursor-pointer relative bg-gradient-to-r from-emerald-700 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-500 transition-all duration-300 shadow-md group-hover:scale-105 overflow-hidden">
                    <span className="relative z-10">Start Classification</span>
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                  </button>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden w-full md:w-1/2 lg:w-2/5 hover:shadow-2xl transition-all duration-300 border border-gray-700 group">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-5 border-b border-gray-700 group-hover:from-emerald-900 group-hover:to-emerald-800 transition-all duration-300">
              <div className="flex items-center">
                <div className="bg-emerald-800 p-2 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">Disposal Schedule</h2>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-300 mb-6 min-h-[80px]">
                Streamline your organization's waste management with our intelligent scheduling system that optimizes collection routes and ensures timely disposal of all waste categories.
              </p>
              <ul className="text-gray-400 mb-8 pl-5 space-y-2">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Automated reminder system
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Collection route optimization
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Compliance tracking
                </li>
              </ul>
              <div className="flex justify-center">
                <Link href="/org">
                  <button className="relative bg-gradient-to-r cursor-pointer from-emerald-700 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-500 transition-all duration-300 shadow-md group-hover:scale-105 overflow-hidden">
                    <span className="relative z-10">Manage Schedule</span>
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        
        <div className="mt-16 pt-8 border-t border-gray-700 text-center text-gray-500 text-sm">
          <p>© 2025 EcoClassify. All rights reserved.</p>
          <p className="mt-2">Empowering organizations to make environmentally responsible waste management decisions.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;