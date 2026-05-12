import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getDb } from '$lib/server/db';

function parseId(id) {
	if (!ObjectId.isValid(id)) return null;
	return new ObjectId(id);
}

export async function GET({ params }) {

	const taskId = parseId(params.id);
	if (!taskId) return json({ error: 'Invalid id' }, { status: 400 });

	const db = await getDb();
	const task = await db.collection('tasks').findOne({ _id: taskId });
	if (!task) return json({ error: 'Task not found' }, { status: 404 });

	return json(task);
}


export async function PATCH({ params, request }) {

	const taskId = parseId(params.id);
	if (!taskId) return json({ error: 'Invalid id' }, { status: 400 });

	const payload = await request.json();
	const update = {
		updatedAt: new Date()
	};

	if (payload.title !== undefined) update.title = String(payload.title).trim();
	if (payload.module !== undefined) update.module = String(payload.module).trim();
	if (payload.dueDate !== undefined) update.dueDate = payload.dueDate ? String(payload.dueDate) : null;
	if (payload.duration !== undefined) update.duration = Number(payload.duration);
	if (payload.priority !== undefined) update.priority = payload.priority;
	if (payload.status !== undefined) update.status = payload.status;

	const db = await getDb();
	await db.collection('tasks').updateOne({ _id: taskId }, { $set: update });
	const task = await db.collection('tasks').findOne({ _id: taskId });
	return json(task);
}

export async function DELETE({ params }) {

	const taskId = parseId(params.id);
	if (!taskId) return json({ error: 'Invalid id' }, { status: 400 });

	const db = await getDb();
	await db.collection('tasks').deleteOne({ _id: taskId });
	return json({ ok: true });
}
