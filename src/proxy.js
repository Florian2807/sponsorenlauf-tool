import { assertDatabaseWritesAllowed } from './utils/migrationGate.js';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from './utils/adminAuthService.js';
import { hasSafeRequestOrigin } from './utils/requestSecurity.js';

const ADMIN_PAGES = ['/setup', '/manage', '/teachers', '/mails', '/donations', '/live'];
const PUBLIC_API_READS = new Set([
    '/api/client-config',
    '/api/admin-auth',
    '/api/check-connectivity',
    '/api/donationSettings',
    '/api/moduleConfig',
    '/api/setupStatus',
    '/api/statistics',
    '/api/scan-feed',
    '/api/scan-devices',
]);

const isPublicApiRequest = (pathname, method) => {
    if (pathname === '/api/admin-auth') return true;
    if (pathname === '/api/runden' && ['POST', 'GET'].includes(method)) return true;
    if (pathname === '/api/scan-feed' && method === 'POST') return true;
    if (pathname === '/api/scan-devices' && method === 'PUT') return true;
    if (pathname === '/api/scanner-rules' && ['GET', 'PUT'].includes(method)) return true;
    if (pathname === '/api/stations' && ['GET', 'PUT'].includes(method)) return true;
    if (pathname === '/api/stations/heartbeat' && method === 'POST') return true;
    if (/^\/api\/students\/[^/]+(?:\/timestamps)?$/.test(pathname) && method === 'GET') return true;
    return method === 'GET' && PUBLIC_API_READS.has(pathname);
};

export async function proxy(request) {
    const { pathname } = request.nextUrl;
    const roundDeletion = request.method === 'DELETE' && /^\/api\/rounds\/\d+$/.test(pathname);
    if ((roundDeletion || pathname === '/api/runden' || pathname === '/api/scan-feed' || pathname === '/api/scan-devices' || pathname === '/api/stations/heartbeat' || pathname === '/api/stations' || pathname === '/api/scanner-rules')
        && !hasSafeRequestOrigin({
            method: request.method,
            headers: request.headers,
            urlHost: request.nextUrl.host,
        })) {
        return NextResponse.json({ success: false, message: 'Unsichere Anfrage blockiert' }, { status: 403 });
    }
    if (pathname.startsWith('/api/') && pathname !== '/api/systemMaintenance'
        && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        try { assertDatabaseWritesAllowed(); } catch (error) {
            return NextResponse.json({ success: false, message: error.message }, { status: 503 });
        }
    }
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
        loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
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
    matcher: ['/setup/:path*', '/manage/:path*', '/teachers/:path*', '/mails/:path*', '/donations/:path*', '/live/:path*', '/api/:path*'],
};
