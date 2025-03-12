"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        const sessionData = await res.json();
        if (sessionData?.user) {
          setSession(sessionData);
          router.push("/home");
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [router]);

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/home" });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-emerald-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col justify-center items-center px-4">
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <div className="bg-emerald-800 p-3 rounded-full">
            <svg className="w-10 h-10 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white text-center mt-4">
          <span className="text-emerald-400">Eco</span>Classify
        </h1>
        <p className="text-gray-400 text-center mt-2">Smart Waste Management Solution</p>
      </div>
      
      <div className="w-full max-w-md">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-emerald-900 opacity-10"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-emerald-900 opacity-10"></div>

          <h2 className="text-2xl font-bold text-white text-center mb-8 relative z-10">
            Welcome Back
          </h2>

          <div className="flex flex-col items-center justify-center space-y-6 relative z-10">
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center cursor-pointer w-full py-3 px-6 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-800/20 transform hover:-translate-y-1"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>

            <div className="flex items-center w-full my-4">
              <div className="flex-grow border-t border-gray-700"></div>
              <div className="px-3 text-xs text-gray-500 uppercase">Or</div>
              <div className="flex-grow border-t border-gray-700"></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center cursor-pointer w-full py-3 px-6 border border-gray-600 text-white font-medium rounded-lg transition-all duration-300 hover:bg-gray-700 shadow-lg"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Enterprise Sign-up
            </button>

            <div className="text-sm text-gray-400 text-center mt-6">
              By signing in, you agree to our
              <span className="text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors">
                {" "}
                Terms of Service
              </span>{" "}
              and
              <span className="text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors">
                {" "}
                Privacy Policy
              </span>
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
}