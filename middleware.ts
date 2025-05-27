import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAIConfig, validateAIConfig } from '@/lib/config/ai-providers';

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    try {
      const config = getAIConfig();
      const validationError = validateAIConfig(config);
      
      if (validationError) {
        return NextResponse.json(
          { 
            error: validationError
          },
          { status: 500 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'AI configuration error. Please check your environment variables.' 
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