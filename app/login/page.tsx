'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingForgotPassword, setIsLoadingForgotPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [errorForgotPassword, setErrorForgotPassword] = useState<string>('');
  const [emailForgotPassword, setEmailForgotPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [resetLink, setResetLink] = useState<string>('');

  // "Sign in" button Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // prevent default actions
    setError(''); // reset error
    setIsLoading(true); // loading animation
    
    try {
      // sending data to database to check
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
        }),
      });
      
      // db response
      const data = await response.json();

      // response has error
      if (!response.ok) {
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      // if success - cookie is set automatically by the API
      // navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occured. Please try again.');
      setIsLoading(false);
    }
  };

  // "Forgot your password" button handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingForgotPassword(true);
    setErrorForgotPassword('');

    try {
      const response = await fetch('/api/resetPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailForgotPassword
        }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        setErrorForgotPassword(data.error || 'Failed to send reset email');
        setIsLoadingForgotPassword(false);
        return;
      }

      // Success - show success message
      setErrorForgotPassword('');
      

      setSuccessMessage('Password reset link has been sent to your email!');
      setResetLink('');
      setEmailForgotPassword('');
      setIsLoadingForgotPassword(false);

    } catch (error) {
      console.error('Forgot password error:', error);
      setErrorForgotPassword('An error occurred. Please try again.');
      setIsLoadingForgotPassword(false);
    }
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
            Web-app designed to teach new players important concepts of playing electric/bass guitar.
            </p>
          </div>
          
          {/* Features */}
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-gray-300">Completely free</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-gray-300">Live feedback</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-300">Upload your own .gp files</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 lg:px-16">
        <div className="max-w-md mx-auto w-full">

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
                  placeholder="Enter your email"
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
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 cursor-pointer"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>
              
              {/* Show Error */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  Create one here
                </Link>
            </p>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Or continue with</span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard?GuestView=1')}
                  className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Try as Guest
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Form */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 relative">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setSuccessMessage('');
                setResetLink('');
                setErrorForgotPassword('');
                setEmailForgotPassword('');
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Close forgot password window"
            >
              ✕
            </button>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Forgot your password?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Enter your email to reset your password. The link will be sent to your email.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                id="emailForgotPassword"
                name="emailForgotPassword"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                placeholder="Enter your email"
                value={emailForgotPassword}
                onChange={(e) => setEmailForgotPassword(e.target.value)}
              />

              {/* Show Error */}
              {errorForgotPassword && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{errorForgotPassword}</p>
                </div>
              )}

              {/* Show Success */}
              {successMessage && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
                  {resetLink && (
                    <a 
                      href={resetLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 underline mt-1 block break-all"
                    >
                      {resetLink}
                    </a>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoadingForgotPassword}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isLoadingForgotPassword ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending reset link...
                  </div>
                ) : (
                  'Send reset link'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
