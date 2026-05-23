import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getDb } from '$lib/server/db';

function parseId(id) {
	if (!ObjectId.isValid(id)) return null;
	return new ObjectId(id);
}

export async function PATCH({ params, request }) {
	const moduleId = parseId(params.id);
	if (!moduleId) return json({ error: 'Invalid id' }, { status: 400 });

	const payload = await request.json();
	const update = { updatedAt: new Date() };
	if (payload.name !== undefined) update.name = String(payload.name || '').trim();
	if (payload.color !== undefined) update.color = String(payload.color || '').trim();
	if (payload.semesterId !== undefined) update.semesterId = String(payload.semesterId || '').trim();

	if (update.name !== undefined && !update.name) {
		return json({ error: 'Modulname ist erforderlich' }, { status: 400 });
	}
	if (update.semesterId !== undefined && !update.semesterId) {
		return json({ error: 'semesterId ist erforderlich' }, { status: 400 });
	}

	const db = await getDb();
	await db.collection('modules').updateOne({ _id: moduleId }, { $set: update });
	const moduleItem = await db.collection('modules').findOne({ _id: moduleId });
	return json(moduleItem);
}

export async function DELETE({ params }) {
	const moduleId = parseId(params.id);
	if (!moduleId) return json({ error: 'Invalid id' }, { status: 400 });

	const db = await getDb();
	await db.collection('modules').deleteOne({ _id: moduleId });
	return json({ ok: true });
}
