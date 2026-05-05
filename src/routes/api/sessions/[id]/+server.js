import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getDb } from '$lib/server/db';
import { isAuthenticated, unauthorizedResponse } from '$lib/server/auth';

function parseId(id) {
	if (!ObjectId.isValid(id)) return null;
	return new ObjectId(id);
}

export async function PATCH({ params, request, cookies }) {
	if (!isAuthenticated(cookies)) return unauthorizedResponse();

	const sessionId = parseId(params.id);
	if (!sessionId) return json({ error: 'Invalid id' }, { status: 400 });

	const payload = await request.json();
	const update = {
		updatedAt: new Date()
	};

	if (payload.topic !== undefined) update.topic = String(payload.topic).trim();
	if (payload.module !== undefined) update.module = String(payload.module).trim();
	if (payload.startsAt !== undefined) update.startsAt = payload.startsAt ? String(payload.startsAt) : null;
	if (payload.duration !== undefined) update.duration = Number(payload.duration);
	if (payload.status !== undefined) update.status = payload.status;

	const db = await getDb();
	await db.collection('sessions').updateOne({ _id: sessionId }, { $set: update });
	const session = await db.collection('sessions').findOne({ _id: sessionId });
	return json(session);
}

export async function DELETE({ params, cookies }) {
	if (!isAuthenticated(cookies)) return unauthorizedResponse();

	const sessionId = parseId(params.id);
	if (!sessionId) return json({ error: 'Invalid id' }, { status: 400 });

	const db = await getDb();
	await db.collection('sessions').deleteOne({ _id: sessionId });
	return json({ ok: true });
}
