import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from './utils/adminAuthService.js';
import { hasSafeRequestOrigin } from './utils/requestSecurity.js';

const ADMIN_PAGES = ['/setup', '/manage', '/teachers', '/mails', '/donations'];
const PUBLIC_API_READS = new Set([
    '/api/admin-auth',
    '/api/check-connectivity',
    '/api/donationSettings',
    '/api/moduleConfig',
    '/api/setupStatus',
    '/api/statistics',
]);

const isPublicApiRequest = (pathname, method) => {
    if (pathname === '/api/admin-auth') return true;
    if (pathname === '/api/runden' && method === 'POST') return true;
    if (pathname === '/api/stations/heartbeat' && method === 'POST') return true;
    if (/^\/api\/students\/[^/]+(?:\/timestamps)?$/.test(pathname) && method === 'GET') return true;
    return method === 'GET' && PUBLIC_API_READS.has(pathname);
};

export async function proxy(request) {
    const { pathname } = request.nextUrl;
    const isAdminPage = ADMIN_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));
    const isProtectedApi = pathname.startsWith('/api/') && !isPublicApiRequest(pathname, request.method);
    if (!isAdminPage && !isProtectedApi) return NextResponse.next();

    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const authenticated = await verifyAdminSessionToken(token);
    if (!authenticated) {
        if (isProtectedApi) {
            return NextResponse.json({ success: false, message: 'Administrator-Anmeldung erforderlich' }, { status: 401 });
        }
        const loginUrl = new URL('/admin-login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (!hasSafeRequestOrigin({
        method: request.method,
        headers: request.headers,
        urlHost: request.nextUrl.host,
    })) {
        return NextResponse.json({ success: false, message: 'Unsichere Anfrage blockiert' }, { status: 403 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/setup/:path*', '/manage/:path*', '/teachers/:path*', '/mails/:path*', '/donations/:path*', '/api/:path*'],
};
