import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { createAuthSession, normalizeEmail, readAuthBody, verifyPassword } from '$lib/server/auth';
import { jsonError } from '$lib/server/http';

export async function POST(event) {
	const body = await readAuthBody(event.request);
	if (!body.ok) return body.response;
	const { email, password } = body.data;

	const db = await getDb();
	const user = await db.collection('users').findOne({ email: normalizeEmail(email) });
	if (!user) {
		return jsonError('Ungueltige Anmeldedaten', 401);
	}

	const isValidPassword = await verifyPassword(password, user.passwordHash);
	if (!isValidPassword) {
		return jsonError('Ungueltige Anmeldedaten', 401);
	}

	await createAuthSession(db, event.cookies, String(user._id));
	return json({
		user: {
			id: String(user._id),
			email: normalizeEmail(user.email)
		}
	});
}

