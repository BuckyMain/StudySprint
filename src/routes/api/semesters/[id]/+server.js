import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { requireUser } from '$lib/server/auth';
import { parseObjectId } from '$lib/server/ids';
import { deleteReflectionsForTaskIds } from '$lib/server/cascade';
import { jsonError, readJsonBody } from '$lib/server/http';

export async function PATCH(event) {
	const { params, request } = event;
	const semesterId = parseObjectId(params.id);
	if (!semesterId) return jsonError('Invalid id', 400);

	const body = await readJsonBody(request);
	if (!body.ok) return body.response;

	const payload = body.data;
	const update = { updatedAt: new Date() };
	if (payload.name !== undefined) update.name = String(payload.name || '').trim();
	if (payload.color !== undefined) update.color = String(payload.color || '').trim();
	if (payload.isActive !== undefined) update.isActive = Boolean(payload.isActive);

	if (update.name !== undefined && !update.name) {
		return jsonError('Semestername ist erforderlich', 400);
	}

	const db = await getDb();
	const auth = await requireUser(event, db);
	if (!auth.ok) return auth.response;
	const userId = auth.user.id;
	if (update.isActive === true) {
		await db
			.collection('semesters')
			.updateMany({ userId }, { $set: { isActive: false, updatedAt: new Date() } });
	}

	try {
		const result = await db
			.collection('semesters')
			.updateOne({ _id: semesterId, userId }, { $set: update });
		if (result.matchedCount === 0) {
			return jsonError('Semester not found', 404);
		}
	} catch (error) {
		if (error?.code === 11000) {
			return jsonError('Semester mit diesem Namen existiert bereits', 409);
		}
		throw error;
	}
	const semester = await db.collection('semesters').findOne({ _id: semesterId, userId });
	return json(semester);
}

export async function DELETE(event) {
	const { params } = event;
	const semesterId = parseObjectId(params.id);
	if (!semesterId) return jsonError('Invalid id', 400);

	const db = await getDb();
	const auth = await requireUser(event, db);
	if (!auth.ok) return auth.response;
	const userId = auth.user.id;
	const semester = await db.collection('semesters').findOne({ _id: semesterId, userId });
	if (!semester) return jsonError('Semester not found', 404);
	const semesterIdString = String(semesterId);
	const modules = await db.collection('modules').find({ userId, semesterId: semesterIdString }).toArray();
	const moduleIdStrings = modules.map((moduleItem) => String(moduleItem._id));
	const taskFilter = moduleIdStrings.length
		? { userId, $or: [{ semesterId: semesterIdString }, { moduleId: { $in: moduleIdStrings } }] }
		: { userId, semesterId: semesterIdString };

	const taskIds = await db.collection('tasks').find(taskFilter, { projection: { _id: 1 } }).toArray();
	await deleteReflectionsForTaskIds(db, taskIds.map((task) => task._id));

	await Promise.all([
		db.collection('tasks').deleteMany(taskFilter),
		db.collection('modules').deleteMany({ userId, semesterId: semesterIdString }),
		db.collection('semesters').deleteOne({ _id: semesterId, userId })
	]);

	const nextActive = await db.collection('semesters').findOne({ userId, isActive: true });
	if (!nextActive) {
		const fallback = await db.collection('semesters').findOne({ userId }, { sort: { createdAt: -1 } });
		if (fallback) {
			await db.collection('semesters').updateOne(
				{ _id: fallback._id, userId },
				{ $set: { isActive: true, updatedAt: new Date() } }
			);
		}
	}

	return json({ ok: true });
}
