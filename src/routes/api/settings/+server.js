import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { requireUser } from '$lib/server/auth';

function normalizeSettings(payload = {}) {
	return {
		userName: String(payload.userName || '').trim(),
		darkMode: Boolean(payload.darkMode),
		weeklyGoalHours: Math.max(0, Number(payload.weeklyGoalHours || 10)),
		activeSemesterId: String(payload.activeSemesterId || '').trim(),
		migrationVersion: Number(payload.migrationVersion || 0),
		updatedAt: new Date()
	};
}

export async function GET(event) {
	const db = await getDb();
	const auth = await requireUser(event, db);
	if (!auth.ok) return auth.response;
	const userId = auth.user.id;
	const doc = await db.collection('settings').findOne({ userId });
	if (!doc) {
		return json({
			userId,
			userName: '',
			darkMode: false,
			weeklyGoalHours: 10,
			activeSemesterId: '',
			migrationVersion: 0
		});
	}
	return json(doc);
}

export async function PUT(event) {
	const { request } = event;
	const db = await getDb();
	const auth = await requireUser(event, db);
	if (!auth.ok) return auth.response;
	const userId = auth.user.id;

	const payload = await request.json();
	const settings = normalizeSettings(payload);
	await db.collection('settings').updateOne(
		{ userId },
		{ $set: { ...settings, userId }, $setOnInsert: { createdAt: new Date() } },
		{ upsert: true }
	);
	const updated = await db.collection('settings').findOne({ userId });
	return json(updated);
}
