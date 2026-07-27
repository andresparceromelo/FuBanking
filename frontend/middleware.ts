import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  const { pathname } = request.nextUrl;
  
  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname.startsWith('/reset-password');
  
  // Si intenta acceder a una ruta protegida y no tiene token, redirigir a /login
  if (!isAuthRoute && !token && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Si intenta acceder a login/register y YA tiene token, redirigir a /profile
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }
  
  return NextResponse.next();
}

// Configurar el middleware para que solo se ejecute en las rutas necesarias
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
