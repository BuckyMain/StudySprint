import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';

export async function GET() {
	const db = await getDb();
	const tasks = await db.collection('tasks').find({}).sort({ createdAt: -1 }).toArray();

	return json(tasks);
}

export async function POST({ request }) {
	const payload = await request.json();
	const task = {
		title: String(payload.title || '').trim(),
		module: String(payload.module || '').trim(),
		dueDate: payload.dueDate ? String(payload.dueDate) : null,
		duration: Number(payload.duration || 25),
		priority: payload.priority || 'Mittel',
		status: payload.status || 'offen',
		createdAt: new Date(),
		updatedAt: new Date()
	};

	if (!task.title || !task.module) {
		return json({ error: 'title und module sind erforderlich' }, { status: 400 });
	}

	const db = await getDb();
	const result = await db.collection('tasks').insertOne(task);
	return json({ ...task, _id: result.insertedId });
}
