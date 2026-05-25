import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getDb } from '$lib/server/db';

function parseId(id) {
	if (!ObjectId.isValid(id)) return null;
	return new ObjectId(id);
}

export async function PATCH({ params, request }) {
	const semesterId = parseId(params.id);
	if (!semesterId) return json({ error: 'Invalid id' }, { status: 400 });

	const payload = await request.json();
	const update = { updatedAt: new Date() };
	if (payload.name !== undefined) update.name = String(payload.name || '').trim();
	if (payload.color !== undefined) update.color = String(payload.color || '').trim();
	if (payload.isActive !== undefined) update.isActive = Boolean(payload.isActive);

	if (update.name !== undefined && !update.name) {
		return json({ error: 'Semestername ist erforderlich' }, { status: 400 });
	}

	const db = await getDb();
	if (update.isActive === true) {
		await db.collection('semesters').updateMany({}, { $set: { isActive: false, updatedAt: new Date() } });
	}

	await db.collection('semesters').updateOne({ _id: semesterId }, { $set: update });
	const semester = await db.collection('semesters').findOne({ _id: semesterId });
	return json(semester);
}

export async function DELETE({ params }) {
	const semesterId = parseId(params.id);
	if (!semesterId) return json({ error: 'Invalid id' }, { status: 400 });

	const db = await getDb();
	const semesterIdString = String(semesterId);
	const modules = await db.collection('modules').find({ semesterId: semesterIdString }).toArray();
	const moduleIdStrings = modules.map((moduleItem) => String(moduleItem._id));
	const taskFilter = moduleIdStrings.length
		? { $or: [{ semesterId: semesterIdString }, { moduleId: { $in: moduleIdStrings } }] }
		: { semesterId: semesterIdString };

	const taskIds = await db.collection('tasks').find(taskFilter, { projection: { _id: 1 } }).toArray();
	const taskIdStrings = taskIds.map((task) => String(task._id));
	if (taskIdStrings.length) {
		await db.collection('reflections').deleteMany({
			$or: [{ taskId: { $in: taskIdStrings } }, { taskId: { $in: taskIds.map((task) => task._id) } }]
		});
	}

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
