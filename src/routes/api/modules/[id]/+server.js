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
	const moduleItem = await db.collection('modules').findOne({ _id: moduleId });
	const moduleIdString = String(moduleId);
	const taskFilter = moduleItem?.semesterId && moduleItem?.name
		? {
			$or: [
				{ moduleId: moduleIdString },
				{ module: moduleItem.name, semesterId: moduleItem.semesterId },
				{ moduleName: moduleItem.name, semesterId: moduleItem.semesterId }
			]
		}
		: { moduleId: moduleIdString };

	const taskIds = await db.collection('tasks').find(taskFilter, { projection: { _id: 1 } }).toArray();
	const taskIdStrings = taskIds.map((task) => String(task._id));
	if (taskIdStrings.length) {
		await db.collection('reflections').deleteMany({
			$or: [{ taskId: { $in: taskIdStrings } }, { taskId: { $in: taskIds.map((task) => task._id) } }]
		});
	}

	await Promise.all([
		db.collection('tasks').deleteMany(taskFilter),
		db.collection('modules').deleteOne({ _id: moduleId })
	]);
	return json({ ok: true });
}
