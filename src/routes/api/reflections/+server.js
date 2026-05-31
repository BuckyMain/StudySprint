import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { requireUser } from '$lib/server/auth';
import { jsonError, readJsonBody } from '$lib/server/http';

const ALLOWED_RATINGS = new Set(['Sehr fokussiert', 'Okay', 'Abgelenkt']);

export async function GET(event) {

	const db = await getDb();
	const auth = await requireUser(event, db);
	if (!auth.ok) return auth.response;
	const userId = auth.user.id;
	const reflections = await db
		.collection('reflections')
		.find({ userId })
		.sort({ createdAt: -1 })
		.toArray();
	return json(reflections);
}

export async function POST(event) {
	const { request } = event;
	const db = await getDb();
	const auth = await requireUser(event, db);
	if (!auth.ok) return auth.response;

	const body = await readJsonBody(request);
	if (!body.ok) return body.response;

	const payload = body.data;
	const rating = String(payload.rating || 'Okay');
	if (!ALLOWED_RATINGS.has(rating)) {
		return jsonError('Ungültige Bewertung', 400);
	}
	const reflection = {
		userId: auth.user.id,
		sessionId: payload.sessionId || null,
		taskId: payload.taskId || null,
		rating,
		note: String(payload.note || '').trim(),
		focusMinutes: Math.max(0, Number(payload.focusMinutes || 0)),
		createdAt: new Date()
	};

	const result = await db.collection('reflections').insertOne(reflection);
	return json({ ...reflection, _id: result.insertedId });
}
