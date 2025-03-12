'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

const Home = () => {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push('/login');
    }
  }, [session, router]);
  if (!session) {
    return null;
  }

  const handleSignOut = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-xl font-bold">EcoClassify</div>
          <button
            onClick={handleSignOut}
            className="bg-white text-green-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-10">Welcome to EcoClassify</h1>
        
        <div className="flex flex-col md:flex-row gap-8 justify-center">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full md:w-2/5 hover:shadow-xl transition-shadow">
            <div className="bg-green-500 text-white p-4">
              <h2 className="text-xl font-semibold">Waste Classification</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Classify your waste to determine the proper disposal method and contribute to a cleaner environment.
              </p>
              <div className="flex justify-center">
                <Link href="/user">
                  <button className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition-colors">
                    Start Classification
                  </button>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full md:w-2/5 hover:shadow-xl transition-shadow">
            <div className="bg-blue-500 text-white p-4">
              <h2 className="text-xl font-semibold">Disposal Schedule</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Set reminders for waste disposal dates and manage your organization's waste collection schedule.
              </p>
              <div className="flex justify-center">
                <Link href="/org">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors">
                    Manage Schedule
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;