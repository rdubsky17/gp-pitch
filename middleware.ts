import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'dsu_secret_key';
const encodedKey = new TextEncoder().encode(secretKey);

// Paths that require authentication
const protectedPaths = ['/dashboard'];

// Paths that should redirect to dashboard if already authenticated
const authPaths = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;
  
  const isGuestMode = request.nextUrl.searchParams.get('GuestView') === '1';

  // Check if user is authenticated
  let isAuthenticated = false;
  if (token) {
    try {
      await jwtVerify(token, encodedKey, { algorithms: ['HS256'] });
      isAuthenticated = true;
    } catch (error) {

      isAuthenticated = false;
    }
  }

  // Redirect to login if trying to access protected path without auth (unless guest mode)
  if (protectedPaths.some(path => pathname.startsWith(path)) && !isAuthenticated && !isGuestMode) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if trying to access auth pages while authenticated
  if (authPaths.some(path => pathname.startsWith(path)) && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
  ],
};
