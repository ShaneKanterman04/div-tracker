"use client"

import React, { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const [readyToLogin, setReadyToLogin] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  
  // Force dark mode for best glow effect
  useEffect(() => {
    document.body.classList.add('dark-theme');
    return () => {
      document.body.classList.remove('dark-theme');
    }
  }, []);

  // Redirect to portfolio if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/portfolio');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      login(apiKeyInput);
      router.push('/portfolio');
    }
  };

  return (
    <>
      {!readyToLogin && (
        <div className="flex flex-col items-center justify-center min-h-screen/2 p-24 rounded-xl ">
          <h1 className="text-4xl font-bold text-white">Div Tracker</h1>
          <p className="mt-4 text-lg text-white">
            The next generation of investing
          </p>
          <div className="mt-8">
            <button
              onClick={() => {
                setReadyToLogin(true);
              }}
              className="px-6 py-3 w-50% text-black bg-white rounded-lg hover:bg-gray-200 font-medium login-glow animate-pulse-slow"
            >
              Press to enter API key
            </button>
          </div>
        </div>
      )}

      {readyToLogin && (
        <div className="flex flex-col items-center justify-center min-h-screen/2 p-8 rounded-xl ">
          <h1 className="text-4xl font-bold text-white">Login</h1>
          <p className="mt-4 text-md text-white">Enter robinhood token to continue.</p>
          <form className="w-full max-w-md mt-0" onSubmit={handleSubmit}>
            <div className="mt-4">
              <label htmlFor="apiKey" className="block text-sm text-white">
                Robinhood Token
              </label>
              <input
                type="password"
                id="apiKey"
                placeholder="Enter your token"
                required={true}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-white bg-gray-800 text-white border-gray-600"
              />
            </div>
            <div className="mt-8 flex justify-center">
              <button
                type="submit"
                className="px-6 py-3 w-50 text-black bg-white rounded-lg hover:bg-gray-200 font-medium login-glow animate-pulse-slow"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
