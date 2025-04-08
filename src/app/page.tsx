"use client"

import React from "react";
import { useState, useEffect } from "react";


export default function Home() {
  const [readyToLogin, setReadyToLogin] = useState(false);
  
  // Force dark mode for best glow effect
  useEffect(() => {
    document.body.classList.add('dark-theme');
    return () => {
      document.body.classList.remove('dark-theme');
    }
  }, []);

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
          <form className="w-full max-w-md mt-0">
            <div className="mt-4">
              <label htmlFor="username" className="block text-sm text-white">
                Robinhood Token
              </label>
              <input
                type="password"
                id="username"
                placeholder="Enter your token"
                required={true}
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
