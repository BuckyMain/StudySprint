import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { revokeSession } from '$lib/server/auth';

export async function POST(event) {
	const db = await getDb();
	await revokeSession(event, db);
	return json({ ok: true });
}

