import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { parseObjectId } from '$lib/server/ids';
import { deleteReflectionsForTaskIds } from '$lib/server/cascade';
import { jsonError, readJsonBody } from '$lib/server/http';

export async function PATCH({ params, request }) {
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
	if (update.isActive === true) {
		await db.collection('semesters').updateMany({}, { $set: { isActive: false, updatedAt: new Date() } });
	}

	try {
		const result = await db.collection('semesters').updateOne({ _id: semesterId }, { $set: update });
		if (result.matchedCount === 0) {
			return jsonError('Semester not found', 404);
		}
	} catch (error) {
		if (error?.code === 11000) {
			return jsonError('Semester mit diesem Namen existiert bereits', 409);
		}
		throw error;
	}
	const semester = await db.collection('semesters').findOne({ _id: semesterId });
	return json(semester);
}

export async function DELETE({ params }) {
	const semesterId = parseObjectId(params.id);
	if (!semesterId) return jsonError('Invalid id', 400);

	const db = await getDb();
	const semester = await db.collection('semesters').findOne({ _id: semesterId });
	if (!semester) return jsonError('Semester not found', 404);
	const semesterIdString = String(semesterId);
	const modules = await db.collection('modules').find({ semesterId: semesterIdString }).toArray();
	const moduleIdStrings = modules.map((moduleItem) => String(moduleItem._id));
	const taskFilter = moduleIdStrings.length
		? { $or: [{ semesterId: semesterIdString }, { moduleId: { $in: moduleIdStrings } }] }
		: { semesterId: semesterIdString };

	const taskIds = await db.collection('tasks').find(taskFilter, { projection: { _id: 1 } }).toArray();
	await deleteReflectionsForTaskIds(db, taskIds.map((task) => task._id));

	await Promise.all([
		db.collection('tasks').deleteMany(taskFilter),
		db.collection('modules').deleteMany({ semesterId: semesterIdString }),
		db.collection('semesters').deleteOne({ _id: semesterId })
	]);

	const nextActive = await db.collection('semesters').findOne({ isActive: true });
	if (!nextActive) {
		const fallback = await db.collection('semesters').findOne({}, { sort: { createdAt: -1 } });
		if (fallback) {
			await db.collection('semesters').updateOne(
				{ _id: fallback._id },
				{ $set: { isActive: true, updatedAt: new Date() } }
			);
		}
	}

	return json({ ok: true });
}
