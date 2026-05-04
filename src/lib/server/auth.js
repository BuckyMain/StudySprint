const AUTH_COOKIE_NAME = 'studysprint_auth';
const AUTH_COOKIE_VALUE = 'unlocked';

export function isAuthenticated(cookies) {
	return cookies.get(AUTH_COOKIE_NAME) === AUTH_COOKIE_VALUE;
}

export function setAuthCookie(cookies) {
	cookies.set(AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE, {
		path: '/',
		httpOnly: true,
		secure: false,
		sameSite: 'lax',
		maxAge: 60 * 60 * 12
	});
}

export function clearAuthCookie(cookies) {
	cookies.set(AUTH_COOKIE_NAME, '', {
		path: '/',
		httpOnly: true,
		secure: false,
		sameSite: 'lax',
		maxAge: 0
	});
}

export function unauthorizedResponse() {
	return new Response(JSON.stringify({ error: 'Unauthorized' }), {
		status: 401,
		headers: { 'content-type': 'application/json' }
	});
}
