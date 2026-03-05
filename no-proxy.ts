// proxy.ts
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

// IMPORTANT:
// Make sure this secret is THE SAME as the one used when signing the token
// Best practice: use the same .env variable name as your backend
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set in environment variables');
  // In production you would probably want to throw an error here
}

/**
 * Verifies the JWT token including signature and expiration
 */
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('auth-session')?.value;

  // Debug log (you can remove this later)
  console.log(
    'Proxy running → cookie auth-session =',
    token ? '[present]' : '[missing]'
  );

  if (!token) {
    return false;
  }

  if (!JWT_SECRET) {
    console.error('JWT verification skipped: JWT_SECRET not set');
    return false;
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);

    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'], // ← change if you use different algorithm (RS256, etc.)
    });

    // Optional: you can add more checks here
    // e.g. check roles, issuer, audience, etc.
    // console.log('Valid token → payload:', payload);

    return true;
  } catch (err: any) {
    // Log specific error types for debugging
    if (err.name === 'JWTExpired') {
      console.log('Token expired');
    } else if (err.name === 'JWSSignatureVerificationFailed') {
      console.log('Invalid token signature');
    } else {
      console.log('Token verification failed:', err.name || err.message);
    }

    return false;
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define which paths need protection
  const protectedPaths = ['/dashboard'];

  const isProtected = protectedPaths.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  );

  if (isProtected) {
    const authenticated = await isAuthenticated(request);

    if (!authenticated) {
      // Redirect to login + preserve original URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow the request to continue
  return NextResponse.next();
}

// Recommended matcher – protects /dashboard and all sub-paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    // If you also want to protect /dashboard exactly:
    '/dashboard',
    // Optional: also protect login/logout flows if needed
    // '/login', '/logout'
  ],
};