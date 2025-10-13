'use client';

import { useState } from 'react';
import Link from 'next/link';
import GuestSignInModal from '@/components/GuestSignInModal';

export default function LoginPage() {
  const [email, setEmail] = useState(''); // FIX this later
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  // REMOVE this later. just for testing.
  const [showDevNote, setShowDevNote] = useState(true); 
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      setIsLoading(false);
      alert('Login functionality would be implemented here!');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - App Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 flex-col justify-center items-center text-white p-12 relative overflow-hidden">        
        <div className="text-center space-y-8 relative z-10">          
          {/* App Name */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold tracking-tight">Guitar TABS</h1>
            <p className="text-xl text-gray-300 max-w-md">
            Web-app designed to teach new players important concepts of playing electric/bass guitar, such as rhythm, note length, pitch correctness, and  note quality. 
            </p>
          </div>
          
          {/* Features */}
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-gray-300">Live feedback</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-gray-300">Feature #2</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-300">Feature #3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 lg:px-16">
        <div className="max-w-md mx-auto w-full">
          {/* Mobile App Branding */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guitar TABS</h1>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                  placeholder="for now, use TRY AS GUEST button below" // FIX this later
                  //placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button className="w-full max-w-xs inline-flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="ml-2">Google</span>
                </button>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowGuestModal(true)}
                  className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Try as Guest
                </button>
              </div>
              
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  Create one here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Guest Sign-in Modal */}
      <GuestSignInModal 
        isOpen={showGuestModal} 
        onClose={() => setShowGuestModal(false)} 
      />
      
      {/* REMOVE this later */}
      {/* Developer Note Popup */} 
      {showDevNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg max-w-sm w-full mx-4">
            <div className="px-4 py-3 border-b border-red-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-red-800">
                  NOTE:
                </h3>
                <button
                  onClick={() => setShowDevNote(false)}
                  className="text-red-600 hover:text-red-800 text-lg font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-red-700">
                Login not implemented yet. Please use <strong>"Try as Guest"</strong> button for testing.
              </p>
            </div>
            <div className="px-4 py-2 bg-red-100 rounded-b-lg">
              <button
                onClick={() => setShowDevNote(false)}
                className="text-sm text-red-800 hover:text-red-900 font-medium"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
