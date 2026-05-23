import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';

const ALLOWED_STATUS = new Set(['offen', 'in Bearbeitung', 'erledigt']);
const ALLOWED_PRIORITIES = new Set(['1', '2', '3', '4', '5']);

export async function GET() {
	const db = await getDb();
	const tasks = await db.collection('tasks').find({}).sort({ createdAt: -1 }).toArray();

	return json(tasks);
}

export async function POST({ request }) {
	const payload = await request.json();
	const moduleName = String(payload.moduleName || payload.module || '').trim();
	const moduleId = String(payload.moduleId || '').trim();
	const semesterId = String(payload.semesterId || '').trim();
	const status = String(payload.status || 'offen');
	const priority = String(payload.priority || '3');

	if (!ALLOWED_STATUS.has(status)) {
		return json({ error: 'Ungültiger Status' }, { status: 400 });
	}
	if (!ALLOWED_PRIORITIES.has(priority)) {
		return json({ error: 'Ungültige Priorität' }, { status: 400 });
	}

	const task = {
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
		return json({ error: 'title und module sind erforderlich' }, { status: 400 });
	}

	const db = await getDb();
	const result = await db.collection('tasks').insertOne(task);
	return json({ ...task, _id: result.insertedId });
}
