import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { createAuthSession, hashPassword, readAuthBody } from '$lib/server/auth';
import { jsonError } from '$lib/server/http';

export async function POST(event) {
	const body = await readAuthBody(event.request);
	if (!body.ok) return body.response;
	const { email, password } = body.data;

	const db = await getDb();
	const passwordHash = await hashPassword(password);
	const now = new Date();

	try {
		const result = await db.collection('users').insertOne({
			email,
			passwordHash,
			createdAt: now,
			updatedAt: now
		});
		await createAuthSession(db, event.cookies, String(result.insertedId));
		return json({
			user: {
				id: String(result.insertedId),
				email
			}
		});
	} catch (error) {
		if (error?.code === 11000) {
			return jsonError('E-Mail ist bereits registriert', 409);
		}
		throw error;
	}
}

