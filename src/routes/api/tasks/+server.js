import { getDb } from '$lib/server/db';
import { requireUser } from '$lib/server/auth';
import { ALLOWED_TASK_PRIORITIES, ALLOWED_TASK_STATUS } from '$lib/server/task-constants';
import { jsonError, readJsonBody } from '$lib/server/http';
import { json } from '@sveltejs/kit';

export async function GET(event) {
	const db = await getDb();
	const auth = await requireUser(event, db);
	if (!auth.ok) return auth.response;
	const userId = auth.user.id;
	const tasks = await db.collection('tasks').find({ userId }).sort({ createdAt: -1 }).toArray();

	return json(tasks);
}

export async function POST(event) {
	const db = await getDb();
	const auth = await requireUser(event, db);
	if (!auth.ok) return auth.response;
	const userId = auth.user.id;

	const { request } = event;
	const body = await readJsonBody(request);
	if (!body.ok) return body.response;

	const payload = body.data;
	const moduleName = String(payload.moduleName || payload.module || '').trim();
	const moduleId = String(payload.moduleId || '').trim();
	const semesterId = String(payload.semesterId || '').trim();
	const status = String(payload.status || 'offen');
	const priority = String(payload.priority || '3');

	if (!ALLOWED_TASK_STATUS.has(status)) {
		return jsonError('Ungültiger Status', 400);
	}
	if (!ALLOWED_TASK_PRIORITIES.has(priority)) {
		return jsonError('Ungültige Priorität', 400);
	}

	const task = {
		userId,
		title: String(payload.title || '').trim(),
		module: moduleName,
		moduleName,
		moduleId,
		semesterId,
		semesterName: String(payload.semesterName || '').trim(),
		dueDate: payload.dueDate ? String(payload.dueDate) : null,
		duration: Number(payload.duration || 25),
		priority,
		status,
		notes: String(payload.notes || '').trim(),
		createdAt: new Date(),
		updatedAt: new Date()
	};

	if (!task.title || !task.module) {
		return jsonError('title und module sind erforderlich', 400);
	}

	const result = await db.collection('tasks').insertOne(task);
	return json({ ...task, _id: result.insertedId });
}
