import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { requireUser } from '$lib/server/auth';

export async function DELETE(event) {
	const db = await getDb();
	const auth = await requireUser(event, db);
	if (!auth.ok) return auth.response;
	const userId = auth.user.id;

	await Promise.all([
		db.collection('tasks').deleteMany({ userId }),
		db.collection('reflections').deleteMany({ userId }),
		db.collection('sessions').deleteMany({ userId }),
		db.collection('modules').deleteMany({ userId }),
		db.collection('semesters').deleteMany({ userId }),
		db.collection('settings').deleteMany({ userId })
	]);
	return json({ ok: true });
}
