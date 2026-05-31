import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { getCurrentUser } from '$lib/server/auth';
import { jsonError } from '$lib/server/http';

export async function GET(event) {
	const db = await getDb();
	const user = await getCurrentUser(event, db);
	if (!user) {
		return jsonError('Nicht angemeldet', 401);
	}
	return json({ user });
}

