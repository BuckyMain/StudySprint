import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { parseObjectId } from '$lib/server/ids';
import { ALLOWED_TASK_PRIORITIES, ALLOWED_TASK_STATUS } from '$lib/server/task-constants';
import { deleteReflectionsForTaskIds } from '$lib/server/cascade';
import { jsonError, readJsonBody } from '$lib/server/http';

export async function GET({ params }) {

	const taskId = parseObjectId(params.id);
	if (!taskId) return jsonError('Invalid id', 400);

	const db = await getDb();
	const task = await db.collection('tasks').findOne({ _id: taskId });
	if (!task) return json({ error: 'Task not found' }, { status: 404 });

	return json(task);
}


export async function PATCH({ params, request }) {

	const taskId = parseObjectId(params.id);
	if (!taskId) return jsonError('Invalid id', 400);

	const body = await readJsonBody(request);
	if (!body.ok) return body.response;

	const payload = body.data;
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
		if (!ALLOWED_TASK_PRIORITIES.has(priority)) return jsonError('Ungültige Priorität', 400);
		update.priority = priority;
	}
	if (payload.status !== undefined) {
		const status = String(payload.status);
		if (!ALLOWED_TASK_STATUS.has(status)) return jsonError('Ungültiger Status', 400);
		update.status = status;
	}
	if (payload.notes !== undefined) update.notes = String(payload.notes).trim();

	if (update.title !== undefined && !update.title) {
		return jsonError('title darf nicht leer sein', 400);
	}
	if (update.module !== undefined && !update.module) {
		return jsonError('module darf nicht leer sein', 400);
	}
	if (update.semesterId !== undefined && !update.semesterId) {
		return jsonError('semesterId darf nicht leer sein', 400);
	}

	const db = await getDb();
	const result = await db.collection('tasks').updateOne({ _id: taskId }, { $set: update });
	if (result.matchedCount === 0) {
		return jsonError('Task not found', 404);
	}
	const task = await db.collection('tasks').findOne({ _id: taskId });
	return json(task);
}

export async function DELETE({ params }) {

	const taskId = parseObjectId(params.id);
	if (!taskId) return jsonError('Invalid id', 400);

	const db = await getDb();
	const result = await db.collection('tasks').deleteOne({ _id: taskId });
	if (result.deletedCount === 0) {
		return jsonError('Task not found', 404);
	}
	await deleteReflectionsForTaskIds(db, [taskId]);
	return json({ ok: true });
}
