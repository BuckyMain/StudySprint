import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';

const SETTINGS_ID = 'app-settings';

function normalizeSettings(payload = {}) {
	return {
		userName: String(payload.userName || '').trim(),
		darkMode: Boolean(payload.darkMode),
		focusDuration: Math.max(5, Number(payload.focusDuration || 25)),
		weeklyGoalHours: Math.max(0, Number(payload.weeklyGoalHours || 10)),
		activeSemesterId: String(payload.activeSemesterId || '').trim(),
		migrationVersion: Number(payload.migrationVersion || 0),
		updatedAt: new Date()
	};
}

export async function GET() {
	const db = await getDb();
	const doc = await db.collection('settings').findOne({ _id: SETTINGS_ID });
	if (!doc) {
		return json({
			_id: SETTINGS_ID,
			userName: '',
			darkMode: false,
			focusDuration: 25,
			weeklyGoalHours: 10,
			activeSemesterId: '',
			migrationVersion: 0
		});
	}
	return json(doc);
}

export async function PUT({ request }) {
	const payload = await request.json();
	const settings = normalizeSettings(payload);
	const db = await getDb();
	await db.collection('settings').updateOne(
		{ _id: SETTINGS_ID },
		{ $set: settings, $setOnInsert: { createdAt: new Date() } },
		{ upsert: true }
	);
	const updated = await db.collection('settings').findOne({ _id: SETTINGS_ID });
	return json(updated);
}
