import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';

export async function GET() {

	const db = await getDb();
	const sessions = await db.collection('sessions').find({}).sort({ startsAt: 1, createdAt: -1 }).toArray();
	return json(sessions);
}

export async function POST({ request }) {

	const payload = await request.json();
	const session = {
		topic: String(payload.topic || '').trim(),
		module: String(payload.module || '').trim(),
		startsAt: payload.startsAt ? String(payload.startsAt) : null,
		duration: Number(payload.duration || 25),
		status: payload.status || 'geplant',
		createdAt: new Date(),
		updatedAt: new Date()
	};

	if (!session.topic || !session.module || !session.startsAt) {
		return json({ error: 'topic, module und startsAt sind erforderlich' }, { status: 400 });
	}

	const db = await getDb();
	const result = await db.collection('sessions').insertOne(session);
	return json({ ...session, _id: result.insertedId });
}
