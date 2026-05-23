import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';

export async function DELETE() {
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
