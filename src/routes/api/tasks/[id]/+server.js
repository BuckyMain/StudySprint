import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getDb } from '$lib/server/db';

const ALLOWED_STATUS = new Set(['offen', 'in Bearbeitung', 'erledigt']);
const ALLOWED_PRIORITIES = new Set(['1', '2', '3', '4', '5']);

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
	if (payload.module !== undefined || payload.moduleName !== undefined) {
		update.module = String(payload.moduleName || payload.module || '').trim();
		update.moduleName = update.module;
	}
	if (payload.moduleId !== undefined) update.moduleId = String(payload.moduleId || '').trim();
	if (payload.semesterId !== undefined) update.semesterId = String(payload.semesterId).trim();
	if (payload.semesterName !== undefined) update.semesterName = String(payload.semesterName).trim();
	if (payload.dueDate !== undefined) update.dueDate = payload.dueDate ? String(payload.dueDate) : null;
	if (payload.duration !== undefined) update.duration = Number(payload.duration);
	if (payload.priority !== undefined) {
		const priority = String(payload.priority);
		if (!ALLOWED_PRIORITIES.has(priority)) return json({ error: 'Ungültige Priorität' }, { status: 400 });
		update.priority = priority;
	}
	if (payload.status !== undefined) {
		const status = String(payload.status);
		if (!ALLOWED_STATUS.has(status)) return json({ error: 'Ungültiger Status' }, { status: 400 });
		update.status = status;
	}
	if (payload.notes !== undefined) update.notes = String(payload.notes).trim();

	if (update.title !== undefined && !update.title) {
		return json({ error: 'title darf nicht leer sein' }, { status: 400 });
	}
	if (update.module !== undefined && !update.module) {
		return json({ error: 'module darf nicht leer sein' }, { status: 400 });
	}
	if (update.semesterId !== undefined && !update.semesterId) {
		return json({ error: 'semesterId darf nicht leer sein' }, { status: 400 });
	}

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
