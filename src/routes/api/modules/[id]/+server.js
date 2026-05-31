import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { requireUser } from '$lib/server/auth';
import { parseObjectId } from '$lib/server/ids';
import { deleteReflectionsForTaskIds } from '$lib/server/cascade';
import { jsonError, readJsonBody } from '$lib/server/http';

export async function PATCH(event) {
	const { params, request } = event;
	const moduleId = parseObjectId(params.id);
	if (!moduleId) return jsonError('Invalid id', 400);

	const body = await readJsonBody(request);
	if (!body.ok) return body.response;

	const payload = body.data;
	const update = { updatedAt: new Date() };
	if (payload.name !== undefined) update.name = String(payload.name || '').trim();
	if (payload.color !== undefined) update.color = String(payload.color || '').trim();
	if (payload.semesterId !== undefined) update.semesterId = String(payload.semesterId || '').trim();

	if (update.name !== undefined && !update.name) {
		return jsonError('Modulname ist erforderlich', 400);
	}
	if (update.semesterId !== undefined && !update.semesterId) {
		return jsonError('semesterId ist erforderlich', 400);
	}

	const db = await getDb();
	const auth = await requireUser(event, db);
	if (!auth.ok) return auth.response;
	const userId = auth.user.id;
	try {
		const result = await db.collection('modules').updateOne({ _id: moduleId, userId }, { $set: update });
		if (result.matchedCount === 0) {
			return jsonError('Module not found', 404);
		}
	} catch (error) {
		if (error?.code === 11000) {
			return jsonError('Modul existiert bereits in diesem Semester', 409);
		}
		throw error;
	}
	const moduleItem = await db.collection('modules').findOne({ _id: moduleId, userId });
	return json(moduleItem);
}

export async function DELETE(event) {
	const { params } = event;
	const moduleId = parseObjectId(params.id);
	if (!moduleId) return jsonError('Invalid id', 400);

	const db = await getDb();
	const auth = await requireUser(event, db);
	if (!auth.ok) return auth.response;
	const userId = auth.user.id;
	const moduleItem = await db.collection('modules').findOne({ _id: moduleId, userId });
	if (!moduleItem) return jsonError('Module not found', 404);
	const moduleIdString = String(moduleId);
	const taskFilter = moduleItem?.semesterId && moduleItem?.name
		? {
			userId,
			$or: [
				{ moduleId: moduleIdString },
				{ module: moduleItem.name, semesterId: moduleItem.semesterId },
				{ moduleName: moduleItem.name, semesterId: moduleItem.semesterId }
			]
		}
		: { userId, moduleId: moduleIdString };

	const taskIds = await db.collection('tasks').find(taskFilter, { projection: { _id: 1 } }).toArray();
	await deleteReflectionsForTaskIds(db, taskIds.map((task) => task._id));

	await Promise.all([
		db.collection('tasks').deleteMany(taskFilter),
		db.collection('modules').deleteOne({ _id: moduleId, userId })
	]);
	return json({ ok: true });
}
