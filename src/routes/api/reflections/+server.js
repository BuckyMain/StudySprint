import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';

export async function GET() {

	const db = await getDb();
	const reflections = await db.collection('reflections').find({}).sort({ createdAt: -1 }).toArray();
	return json(reflections);
}

export async function POST({ request }) {

	const payload = await request.json();
	const reflection = {
		sessionId: payload.sessionId || null,
		taskId: payload.taskId || null,
		rating: String(payload.rating || 'Okay'),
		note: String(payload.note || '').trim(),
		focusMinutes: Number(payload.focusMinutes || 0),
		createdAt: new Date()
	};

	const db = await getDb();
	const result = await db.collection('reflections').insertOne(reflection);
	return json({ ...reflection, _id: result.insertedId });
}
