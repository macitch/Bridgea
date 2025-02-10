// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for your auth token (example)
  const token = request.cookies.get('token')?.value;
  
  // If no token and trying to access a protected route, redirect to login
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = 's/login';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// Configure the matcher to only run for routes starting with /dashboard
export const config = {
  matcher: ['/dashboard/:path*'],
};