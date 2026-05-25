import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { jsonError, readJsonBody } from '$lib/server/http';

export async function GET({ url }) {
	const db = await getDb();
	const semesterId = String(url.searchParams.get('semesterId') || '').trim();
	const query = semesterId ? { semesterId } : {};
	const modules = await db.collection('modules').find(query).sort({ createdAt: -1 }).toArray();
	return json(modules);
}

export async function POST({ request }) {
	const body = await readJsonBody(request);
	if (!body.ok) return body.response;

	const payload = body.data;
	const name = String(payload.name || '').trim();
	const color = String(payload.color || '#2563eb').trim();
	const semesterId = String(payload.semesterId || '').trim();

	if (!name || !semesterId) {
		return jsonError('name und semesterId sind erforderlich', 400);
	}

	const moduleItem = {
		name,
		color,
		semesterId,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const db = await getDb();
	try {
		const result = await db.collection('modules').insertOne(moduleItem);
		return json({ ...moduleItem, _id: result.insertedId });
	} catch (error) {
		if (error?.code === 11000) {
			return jsonError('Modul existiert bereits in diesem Semester', 409);
		}
		throw error;
	}
}
