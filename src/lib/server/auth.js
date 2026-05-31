import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { env } from '$env/dynamic/private';
import { jsonError, readJsonBody } from '$lib/server/http';
import { parseObjectId } from '$lib/server/ids';

const scrypt = promisify(scryptCallback);

export const SESSION_COOKIE_NAME = 'studysprint_session';
const SESSION_DURATION_DAYS = 30;
const PASSWORD_MIN_LENGTH = 8;

function useSecureCookies() {
	return process.env.NODE_ENV === 'production';
}

function getSessionSecret() {
	return String(env.AUTH_SESSION_SECRET || 'dev-only-session-secret').trim();
}

export function normalizeEmail(email) {
	return String(email || '').trim().toLowerCase();
}

function hashSessionToken(token) {
	const secret = getSessionSecret();
	return createHash('sha256').update(`${secret}:${token}`).digest('hex');
}

async function deleteSessionToken(db, token) {
	const tokenValue = String(token || '').trim();
	if (!tokenValue) return;
	const tokenHash = hashSessionToken(tokenValue);
	await db.collection('sessions').deleteOne({ tokenHash });
}

function makePasswordError() {
	return jsonError(`Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen lang sein`, 400);
}

export async function hashPassword(password) {
	const passwordValue = String(password || '');
	if (passwordValue.length < PASSWORD_MIN_LENGTH) {
		throw new Error('PASSWORD_TOO_SHORT');
	}
	const salt = randomBytes(16);
	const derived = await scrypt(passwordValue, salt, 64);
	return `scrypt:${salt.toString('hex')}:${Buffer.from(derived).toString('hex')}`;
}

export async function verifyPassword(password, hashedValue) {
	const value = String(hashedValue || '');
	const [algorithm, saltHex, hashHex] = value.split(':');
	if (algorithm !== 'scrypt' || !saltHex || !hashHex) return false;
	const salt = Buffer.from(saltHex, 'hex');
	const expected = Buffer.from(hashHex, 'hex');
	const derived = Buffer.from(await scrypt(String(password || ''), salt, expected.length));
	if (derived.length !== expected.length) return false;
	return timingSafeEqual(derived, expected);
}

export function setSessionCookie(cookies, token, expiresAt) {
	cookies.set(SESSION_COOKIE_NAME, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: useSecureCookies(),
		expires: expiresAt
	});
}

export function clearSessionCookie(cookies) {
	cookies.delete(SESSION_COOKIE_NAME, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: useSecureCookies()
	});
}

async function createSession(db, userId) {
	const now = new Date();
	const expiresAt = new Date(now.getTime() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
	const token = randomBytes(32).toString('hex');
	const tokenHash = hashSessionToken(token);
	await db.collection('sessions').insertOne({
		tokenHash,
		userId,
		createdAt: now,
		expiresAt
	});
	return { token, expiresAt };
}

export async function createAuthSession(db, cookies, userId) {
	const { token, expiresAt } = await createSession(db, userId);
	setSessionCookie(cookies, token, expiresAt);
}

async function readSessionUser(db, sessionToken) {
	const token = String(sessionToken || '').trim();
	if (!token) return null;
	const tokenHash = hashSessionToken(token);
	const now = new Date();
	const session = await db.collection('sessions').findOne({ tokenHash, expiresAt: { $gt: now } });
	if (!session) return null;
	const userObjectId = parseObjectId(session.userId);
	if (!userObjectId) return null;
	const user = await db.collection('users').findOne({ _id: userObjectId });
	if (!user) return null;
	return {
		id: String(user._id),
		email: normalizeEmail(user.email)
	};
}

export async function getCurrentUser(event, db) {
	const token = event.cookies.get(SESSION_COOKIE_NAME);
	const user = await readSessionUser(db, token);
	if (!user && token) {
		await deleteSessionToken(db, token);
		clearSessionCookie(event.cookies);
	}
	return user;
}

export async function requireUser(event, db) {
	const user = await getCurrentUser(event, db);
	if (!user) {
		return { ok: false, response: jsonError('Nicht angemeldet', 401) };
	}
	return { ok: true, user };
}

export async function revokeSession(event, db) {
	const token = event.cookies.get(SESSION_COOKIE_NAME);
	await deleteSessionToken(db, token);
	clearSessionCookie(event.cookies);
}

export async function readAuthBody(request) {
	const body = await readJsonBody(request);
	if (!body.ok) return body;
	const email = normalizeEmail(body.data?.email);
	const password = String(body.data?.password || '');
	if (!email) {
		return { ok: false, response: jsonError('E-Mail ist erforderlich', 400) };
	}
	if (!email.includes('@')) {
		return { ok: false, response: jsonError('Bitte eine gueltige E-Mail angeben', 400) };
	}
	if (password.length < PASSWORD_MIN_LENGTH) {
		return { ok: false, response: makePasswordError() };
	}
	return { ok: true, data: { email, password } };
}

