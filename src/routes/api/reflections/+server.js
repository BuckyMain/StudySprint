import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { jsonError, readJsonBody } from '$lib/server/http';

const ALLOWED_RATINGS = new Set(['Sehr fokussiert', 'Okay', 'Abgelenkt']);

export async function GET() {

	const db = await getDb();
	const reflections = await db.collection('reflections').find({}).sort({ createdAt: -1 }).toArray();
	return json(reflections);
}

export async function POST({ request }) {

	const body = await readJsonBody(request);
	if (!body.ok) return body.response;

	const payload = body.data;
	const rating = String(payload.rating || 'Okay');
	if (!ALLOWED_RATINGS.has(rating)) {
		return jsonError('Ungültige Bewertung', 400);
	}
	const reflection = {
		sessionId: payload.sessionId || null,
		taskId: payload.taskId || null,
		rating,
		note: String(payload.note || '').trim(),
		focusMinutes: Math.max(0, Number(payload.focusMinutes || 0)),
		createdAt: new Date()
	};

	const db = await getDb();
	const result = await db.collection('reflections').insertOne(reflection);
	return json({ ...reflection, _id: result.insertedId });
}
