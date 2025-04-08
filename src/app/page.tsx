"use client"

import Image from "next/image";
import React from "react";
import { useState } from "react";


export default function Home() {
  const [readyToLogin, setReadyToLogin] = useState(false);
  return (
    <>
      {!readyToLogin && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-4xl font-bold">Div Tracker</h1>
          <p className="mt-4 text-lg">
            A simple tool to track your divs and their contents.
          </p>
          <div className="mt-8">
            <Image
              src="/images/div-tracker.png"
              alt="Div Tracker Screenshot"
              width={500}
              height={300}
              className="rounded-lg shadow-lg"
            />
          </div>
          <div className="mt-8">
            <button
              onClick={() => {
                setReadyToLogin(true);
              }}
              className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              Login
            </button>
          </div>
        </div>
      )}

      {readyToLogin && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-4xl font-bold">Login</h1>
          <p className="mt-4 text-lg">Enter robinhood token to continue.</p>
          <form>
            <div className="mt-4">
              <label htmlFor="username" className="block text-lg">
                Robinhood Token
              </label>
              <input
                type="password"
                id="username"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-8">
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
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
