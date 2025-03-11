'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function SlotsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      checkAdminStatus(session.user.email);
    } else {
      setIsAdmin(false);
    }
  }, [status, session]);

  const checkAdminStatus = async (email) => {
    try {
      const response = await fetch('/api/admin');
      if (!response.ok) {
        throw new Error('Failed to check admin status');
      }
      const data = await response.json();
      setIsAdmin(data.isAdmin);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    }
  };

  const handleAdminLogin = () => {
    router.push('/login');
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  if(isAdmin){
    console.log('isAdmin:', isAdmin);
  }


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Navbar</h1>
          <div className="flex items-center space-x-4">
            {!session ? (
              <button
                onClick={handleAdminLogin}
                className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200"
              >
                Sign In
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className="bg-red-600 cursor-pointer hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-200"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}