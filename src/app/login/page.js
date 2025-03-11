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
          router.push("/");
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
    signIn("google", { callbackUrl: "/" });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 shadow-2xl transform transition-all hover:shadow-indigo-500/10">
          <h1 className="text-2xl font-bold text-white text-center mb-6">
            Sign In
          </h1>

          <div className="flex flex-col items-center justify-center space-y-6">
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center cursor-pointer w-full py-2 px-4 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-md transition duration-200 shadow-md"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>

            <div className="text-sm text-gray-400 text-center mt-4">
              By signing in, you agree to our
              <span className="text-indigo-400 hover:text-indigo-300 cursor-pointer">
                {" "}
                Terms of Service
              </span>{" "}
              and
              <span className="text-indigo-400 hover:text-indigo-300 cursor-pointer">
                {" "}
                Privacy Policy
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} CIT Testing Portal. All rights
            reserved.
          </p>
        </div>
      </div>
    </div>
  );
}