import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { requireUser } from '$lib/server/auth';
import { jsonError, readJsonBody } from '$lib/server/http';

function normalizeColor(value) {
	const color = String(value || '').trim();
	if (!color) return '#2563eb';
	return color;
}

export async function GET(event) {
	const db = await getDb();
	const auth = await requireUser(event, db);
	if (!auth.ok) return auth.response;
	const userId = auth.user.id;
	const semesters = await db
		.collection('semesters')
		.find({ userId })
		.sort({ isActive: -1, createdAt: -1 })
		.toArray();
	return json(semesters);
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
	const name = String(payload.name || '').trim();
	const color = normalizeColor(payload.color);

	if (!name) {
		return jsonError('Semestername ist erforderlich', 400);
	}

	const hasAnySemester = await db.collection('semesters').findOne({ userId });
	const semester = {
		userId,
		name,
		color,
		isActive: payload.isActive === true || !hasAnySemester,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	if (semester.isActive) {
		await db
			.collection('semesters')
			.updateMany({ userId }, { $set: { isActive: false, updatedAt: new Date() } });
	}

	try {
		const result = await db.collection('semesters').insertOne(semester);
		return json({ ...semester, _id: result.insertedId });
	} catch (error) {
		if (error?.code === 11000) {
			return jsonError('Semester mit diesem Namen existiert bereits', 409);
		}
		throw error;
	}
}
