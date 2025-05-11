import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Check if OPENAI_API_KEY is set
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable.' 
        },
        { status: 500 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
}; 