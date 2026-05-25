import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getDb } from '$lib/server/db';
import { jsonError } from '$lib/server/http';

export async function DELETE({ request }) {
	if (!dev) {
		const resetToken = process.env.RESET_API_TOKEN;
		const providedToken = request.headers.get('x-reset-token') || '';
		if (!resetToken || providedToken !== resetToken) {
			return jsonError('Reset endpoint ist in dieser Umgebung deaktiviert', 403);
		}
	}

	const db = await getDb();
	await Promise.all([
		db.collection('tasks').deleteMany({}),
		db.collection('reflections').deleteMany({}),
		db.collection('sessions').deleteMany({}),
		db.collection('modules').deleteMany({}),
		db.collection('semesters').deleteMany({}),
		db.collection('settings').deleteMany({})
	]);
	return json({ ok: true });
}
